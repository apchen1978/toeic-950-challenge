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
