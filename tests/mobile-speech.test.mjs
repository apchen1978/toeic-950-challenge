import test from 'node:test';
import assert from 'node:assert/strict';

let serial=0;
function engine() {
  const synth=new EventTarget();
  let voices=[];
  synth.getVoices=()=>voices;
  synth.setVoices=v=>{voices=v;};
  synth.cancel=()=>{};
  synth.spoken=[];
  synth.speak=u=>{synth.spoken.push(u);queueMicrotask(()=>u.onend());};
  globalThis.speechSynthesis=synth;
  globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance};
  const data=new Map();
  globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  return synth;
}
const english={name:'Mobile English',lang:'en-GB'};
test('choice A and its text use the same narrator, while B and C keep their normal rate', async () => {
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  const narrator={name:'Samantha',lang:'en-US'};
  s.setVoices([narrator]); audio.setPref('N', narrator.name);
  const lines=audio.withSpokenOptions({script:[],questions:[{options:['One','Two','Three']}]}).map((line)=>({...line,gap:0}));
  assert.equal(await audio.playScript(lines),true);
  assert.ok(s.spoken.every((utterance)=>utterance.voice===narrator));
  assert.equal(s.spoken[0].text,'A. One');
  assert.equal(s.spoken[0].rate,0.65);
  assert.equal(s.spoken[1].text,'B.');
  assert.equal(s.spoken[1].rate,1);
  assert.equal(s.spoken[3].text,'C.');
  assert.equal(s.spoken[3].rate,1);
});
test('codex: multiple female voices do not suppress the male-role pitch fallback',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  s.setVoices([{name:'Samantha',lang:'en-US'},{name:'Karen',lang:'en-AU'}]);
  assert.equal(await audio.playScript([{speaker:'M',text:'Hello',gap:0}]),true);
  assert.equal(s.spoken[0].pitch,0.8);
  assert.equal(audio.roleVoiceInfo('M').maleFallback,true);
});
test('codex: a recognized male voice wins over a higher-ranked female voice',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  s.setVoices([{name:'Google Samantha',lang:'en-US'},{name:'Daniel',lang:'en-GB'}]);
  assert.equal(await audio.playScript([{speaker:'M',text:'Hello',gap:0}]),true);
  assert.equal(s.spoken[0].voice.name,'Daniel');
  assert.equal(s.spoken[0].pitch,1);
  assert.equal(audio.roleVoiceInfo('M').maleFallback,false);
});
test('codex: automatic roles use distinct unlabelled English voices when available',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  const first={name:'English voice one',lang:'en-US'}, second={name:'English voice two',lang:'en-GB'};
  s.setVoices([first,second]);
  assert.equal(await audio.playScript([{speaker:'M',text:'First',gap:0},{speaker:'W',text:'Second',gap:0}]),true);
  assert.notEqual(s.spoken[0].voice,s.spoken[1].voice);
});
test('codex: one available voice uses different fallback pitches for roles',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  s.setVoices([english]);
  assert.equal(await audio.playScript([{speaker:'M',text:'First',gap:0},{speaker:'W',text:'Second',gap:0}]),true);
  assert.equal(s.spoken[0].voice,s.spoken[1].voice);
  assert.notEqual(s.spoken[0].pitch,s.spoken[1].pitch);
});
test('codex: explicit role voice selections are respected',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  const first={name:'English one',lang:'en-US'}, second={name:'English two',lang:'en-GB'};
  s.setVoices([first,second]); audio.setPref('M',second.name); audio.setPref('W',first.name);
  assert.equal(await audio.playScript([{speaker:'M',text:'First',gap:0},{speaker:'W',text:'Second',gap:0}]),true);
  assert.equal(s.spoken[0].voice,second); assert.equal(s.spoken[1].voice,first);
});
test('codex: voices arriving after the first line can be used on the next line',async()=>{
  const s=engine(), audio=await import(`../codex/js/audio.js?role=${serial++}`);
  s.speak=u=>{s.spoken.push(u);if(s.spoken.length===1)s.setVoices([{name:'English voice one',lang:'en-US'},{name:'English voice two',lang:'en-GB'}]);queueMicrotask(()=>u.onend());};
  const playing=audio.playScript([{speaker:'M',text:'First',gap:0},{speaker:'W',text:'Second',gap:0}]);
  assert.equal(s.spoken.length,1);
  assert.equal(await playing,true);
  assert.equal(s.spoken[0].voice,undefined);
  assert.equal(s.spoken[1].voice.name,'English voice two');
});
for(const dir of ['js','codex/js']){
  const load=()=>import(`../${dir}/audio.js?test=${serial++}`);
  test(`${dir}: first speak is synchronous even when enumeration is empty`,async()=>{
    const s=engine(),audio=await load();
    audio.setPref('M','Microsoft David - desktop only');
    const played=audio.playScript([{speaker:'M',text:'Hello.',single:true,gap:0}]);
    assert.equal(s.spoken.length,1,'speak must run before click handler returns');
    assert.equal(s.spoken[0].voice,undefined);
    assert.equal(s.spoken[0].lang,'en-US');
    assert.equal(await played,true);
  });
  test(`${dir}: empty voiceschanged does not end discovery; late English is picked up`,async()=>{
    const s=engine(),audio=await load();
    const result=audio.getVoices({timeoutMs:200,pollMs:10});
    s.dispatchEvent(new Event('voiceschanged'));
    s.setVoices([{name:'Chinese',lang:'zh-TW'}]);
    s.dispatchEvent(new Event('voiceschanged'));
    setTimeout(()=>{s.setVoices([english]);s.dispatchEvent(new Event('voiceschanged'));},25);
    assert.deepEqual(await result,[english]);
  });
  test(`${dir}: polling handles browsers without voiceschanged`,async()=>{
    const s=engine(),audio=await load();
    const result=audio.getVoices({timeoutMs:200,pollMs:10});
    setTimeout(()=>s.setVoices([english]),20);
    assert.deepEqual(await result,[english]);
  });
  test(`${dir}: timeout is not a permanent no-voice verdict`,async()=>{
    const s=engine(),audio=await load();
    assert.deepEqual(await audio.getVoices({timeoutMs:10,pollMs:5}),[]);
    s.setVoices([english]);
    assert.deepEqual(await audio.getVoices(),[english]);
    const done=audio.playScript([{speaker:'W',text:'Welcome.',single:true,gap:0}]);
    assert.equal(s.spoken[0].voice,english);
    assert.equal(await done,true);
  });
  test(`${dir}: actual engine failure is false with actionable error and retry`,async()=>{
    const s=engine(),audio=await load();
    s.speak=u=>queueMicrotask(()=>u.onerror({error:'language-unavailable'}));
    assert.equal(await audio.playScript([{speaker:'N',text:'Hello.',gap:0}]),false);
    assert.match(audio.errorMessage(),/英文/);
    s.setVoices([english]);
    s.speak=u=>queueMicrotask(()=>u.onend());
    assert.equal(await audio.playScript([{speaker:'N',text:'Retry.',single:true,gap:0}]),true);
  });
  test(`${dir}: cancel settles old playback and next question can play`,async()=>{
    const s=engine(),audio=await load();
    s.speak=()=>{};
    const pending=audio.playScript([{speaker:'M',text:'Cancel.',gap:0}]);
    audio.stop();
    assert.equal(await pending,false);
    s.speak=u=>queueMicrotask(()=>u.onend());
    assert.equal(await audio.playScript([{speaker:'W',text:'Next.',single:true,gap:0}]),true);
  });
  test(`${dir}: silent engine watchdog fails instead of pretending playback`,async t=>{
    const s=engine(),audio=await load();
    t.mock.timers.enable({apis:['setTimeout']});
    s.speak=()=>{};
    const pending=audio.playScript([{speaker:'N',text:'Silent.',gap:0}]);
    t.mock.timers.tick(12001);
    assert.equal(await pending,false);
    assert.match(audio.errorMessage(),/逾時/);
  });
}
