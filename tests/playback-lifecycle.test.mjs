import test from 'node:test';
import assert from 'node:assert/strict';
let id=0;
function setup(){
 const synth=new EventTarget(); synth.getVoices=()=>[]; synth.cancel=()=>{synth.cancels++}; synth.cancels=0; synth.spoken=[]; synth.speak=u=>synth.spoken.push(u);
 globalThis.speechSynthesis=synth; globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
 globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance}; globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 return synth;
}
const load=()=>import(`../codex/js/audio.js?lifecycle=${id++}`);
test('background interruption cancels started speech and stale end cannot complete the next playback',async()=>{
 const synth=setup(),audio=await load();
 const first=audio.playScript([{speaker:'N',text:'First',gap:0}]);
 const old=synth.spoken[0]; old.onstart(); audio.stop('background');
 assert.equal(await first,false); assert.match(audio.errorMessage(),/背景/);
 const second=audio.playScript([{speaker:'N',text:'Second',gap:0}]);
 old.onend(); assert.equal(synth.spoken.length,2); synth.spoken[1].onend();
 assert.equal(await second,true);
});
test('switching during the gap cancels promptly and prevents subsequent lines',async()=>{
 const synth=setup(),audio=await load();
 const first=audio.playScript([{speaker:'N',text:'First',gap:10000},{speaker:'N',text:'Never',gap:0}]);
 synth.spoken[0].onend(); await Promise.resolve(); audio.stop();
 assert.equal(await first,false); assert.equal(synth.spoken.length,1);
 const next=audio.playScript([{speaker:'N',text:'Next',gap:0}]);
 synth.spoken[1].onend(); assert.equal(await next,true);
});
test('late start event from a cancelled utterance cannot cancel newer playback',async t=>{
 const synth=setup(),audio=await load(); t.mock.timers.enable({apis:['setTimeout']});
 const first=audio.playScript([{speaker:'N',text:'Old',gap:0}]); const old=synth.spoken[0];
 audio.stop(); assert.equal(await first,false);
 const next=audio.playScript([{speaker:'N',text:'New',gap:0}]); const cancels=synth.cancels;
 old.onstart(); t.mock.timers.tick(30000); assert.equal(synth.cancels,cancels+1,'only current playback watchdog may cancel');
 assert.equal(await next,false);
});
test('engine error after starting fails, and retry can complete',async()=>{
 const synth=setup(),audio=await load();
 const first=audio.playScript([{speaker:'N',text:'Hello',gap:0}]);
 synth.spoken[0].onstart(); synth.spoken[0].onerror({error:'network'});
 assert.equal(await first,false); assert.match(audio.errorMessage(),/網路/);
 const retry=audio.playScript([{speaker:'N',text:'Retry',gap:0}]); synth.spoken[1].onend(); assert.equal(await retry,true);
});
test('incomplete browser speech implementation is unsupported',async()=>{
 setup(); const audio=await load(); window.speechSynthesis={}; assert.equal(audio.supported(),false);
});
