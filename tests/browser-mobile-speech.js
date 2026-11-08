async (page) => {
  await page.context().addInitScript(() => {
    const synth = new EventTarget();
    window.__speech = { calls: [], fail: false };
    synth.getVoices = () => [];
    synth.cancel = () => {};
    synth.speak = u => {
      window.__speech.calls.push({text:u.text,lang:u.lang,voice:u.voice?.name ?? null,activation:navigator.userActivation.isActive});
      setTimeout(() => window.__speech.fail ? u.onerror?.({error:'language-unavailable'}) : u.onend?.(), 5);
    };
    Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  });
  await page.setViewportSize({width:390,height:844});
  const results=[];
  for (const path of ['/', '/codex/']) {
    await page.goto('http://127.0.0.1:4192'+path);
    await page.getByRole('button',{name:'重新載入音色'}).waitFor();
    await page.getByRole('button',{name:'開始診斷測驗'}).click();
    await page.evaluate(()=>window.__speech.fail=true);
    await page.getByRole('button',{name:'▶ 播放語音',exact:true}).click();
    await page.getByRole('button',{name:'重試播放',exact:true}).waitFor();
    const error=await page.locator('.audio').innerText();
    if(!error.includes('英文') || !error.includes('剩餘 2 次')) throw Error('Failure UI/quota incorrect');
    const activation=await page.evaluate(()=>window.__speech.calls[0]);
    if(!activation.activation || activation.voice || activation.lang!=='en-US') throw Error('Initial click fallback incorrect');
    await page.evaluate(()=>window.__speech.fail=false);
    await page.getByRole('button',{name:'重試播放',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.audio .status').textContent==='播放完畢');
    await page.getByRole('button',{name:'下一組 →'}).click();
    await page.getByRole('button',{name:'▶ 播放語音',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.audio .status').textContent==='播放完畢');
    await page.reload();
    await page.getByRole('button',{name:'繼續上次作答'}).click();
    await page.getByRole('button',{name:'▶ 播放語音',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.audio .status').textContent==='播放完畢');
    results.push({path,firstClick:activation,refreshAndNext:true,errorRefund:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  }
  return results;
}
