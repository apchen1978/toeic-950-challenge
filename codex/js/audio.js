// Listening audio via the browser's built-in speech synthesis (free, no audio files).
// Voice quality depends on the device: Edge "Natural" voices and iOS/macOS enhanced voices sound best.
// Transcript visibility is controlled by the UI's collapsed transcript panels.

const MALE = /\b(guy|davis|andrew|brian|christopher|eric|roger|steffan|ryan|david|mark|george|james|daniel|alex|fred|thomas|aaron|tom|male)\b/i;
const FEMALE = /(aria|jenny|michelle|emma|ava|sonia|libby|zira|samantha|susan|hazel|karen|victoria|allison|joanna|jessica|nancy|female)/i;
const PREF_KEY = (globalThis.location?.pathname ?? '').includes('/codex/') ? 'toeic950.codex.voice.v1' : 'toeic950.voice.v1';

let token = 0;
let lastError = '';
export function errorMessage() {
  const messages = {
    unsupported: '此瀏覽器未提供語音合成，請換用支援的瀏覽器。',
    'not-allowed': '瀏覽器拒絕啟動語音。請再次點擊播放；若仍失敗，請在一般瀏覽器開啟後重試。',
    'language-unavailable': '裝置的語音引擎無法提供英文，請檢查系統英文語音後重試。',
    'voice-unavailable': '所選音色暫時無法使用，請切回自動或重新載入音色後重試。',
    network: '語音服務連線失敗，請確認網路後重試。',
    timeout: '語音引擎未回應或播放逾時，請再次點擊播放。',
    background: '頁面切到背景，播放已中斷；回來後請重新播放。',
    canceled: '播放已中止，可重新點擊播放。',
    'audio-file': '固定配音載入或播放失敗，請連網後再點播放重試。'
  };
  return messages[lastError] ?? ('語音播放失敗（' + (lastError || 'unknown') + '），請重新點擊播放或試用其他音色。');
}
let releaseSpeech = null;
let releasePause = null;
export function getRate() { const r=Number(prefs().rate); return [0.85,1,1.1].includes(r)?r:1; }
export function setRate(rate) { if(![0.85,1,1.1].includes(rate)) return; const p=prefs(); p.rate=rate; try {localStorage.setItem(PREF_KEY,JSON.stringify(p));} catch {} }

export function supported() {
  return typeof window !== 'undefined' && typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
}

/** Higher = more natural sounding. */
function rank(v) {
  let s = 0;
  if (/natural|neural|online/i.test(v.name)) s += 100;
  if (/google/i.test(v.name)) s += 50;
  if (/enhanced|premium/i.test(v.name)) s += 60;
  if (/en[-_]US/i.test(v.lang)) s += 10;
  if (/microsoft (david|zira|mark) /i.test(v.name)) s -= 20; // old robotic desktop voices
  return s;
}

export function availableVoices() {
  if (!supported()) return [];
  try { return speechSynthesis.getVoices().filter(v => /^en(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>rank(b)-rank(a)); }
  catch { return []; }
}

// Discovery is UI-only. Never await it before speaking in a click handler.
export function getVoices({ timeoutMs = 4000, pollMs = 100 } = {}) {
  if (!supported()) return Promise.resolve([]);
  return new Promise(resolve => {
    let timer, poll, finished = false;
    const finish = (voices) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer); clearInterval(poll);
      speechSynthesis.removeEventListener?.('voiceschanged', check);
      resolve(voices);
    };
    const check = () => { const voices = availableVoices(); if (voices.length) finish(voices); };
    speechSynthesis.addEventListener?.('voiceschanged', check);
    timer = setTimeout(() => finish(availableVoices()), timeoutMs);
    poll = setInterval(check, pollMs);
    check();
  });
}

function prefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}"); } catch { return {}; }
}
export function getPref(role) { return prefs()[role] ?? ""; }
export function setPref(role, voiceName) {
  const p = prefs();
  if (voiceName) p[role] = voiceName; else delete p[role];
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/** Prefer different installed voices; use pitch as a fallback when roles share a voice. */
function pickVoice(voices, speaker) {
  const byRank = [...voices].sort((a, b) => rank(b) - rank(a));
  const saved = voices.find((v) => v.name === prefs()[speaker]);
  if (saved) return { voice: saved, pitch: 1 };
  const savedMan = voices.find((v) => v.name === prefs().M);
  const man = savedMan ?? byRank.find((v) => MALE.test(v.name)) ?? byRank.find((v) => !FEMALE.test(v.name)) ?? byRank[0];
  if (speaker === "M") {
    return { voice: man ?? null, pitch: man && MALE.test(man.name) ? 1 : 0.8 };
  }
  if (speaker === "W") {
    const woman = byRank.find((v) => v !== man && FEMALE.test(v.name)) ?? byRank.find((v) => v !== man) ?? man;
    return { voice: woman ?? null, pitch: !woman || woman === man ? 1.1 : 1 };
  }
  const savedWoman = voices.find((v) => v.name === prefs().W);
  const woman = savedWoman ?? byRank.find((v) => v !== man && FEMALE.test(v.name)) ?? byRank.find((v) => v !== man);
  return { voice: byRank.find((v) => v !== man && v !== woman) ?? woman ?? man ?? null, pitch: 1 };
}

export function roleVoiceInfo(role) {
  const chosen = pickVoice(availableVoices(), role);
  const manual = !!availableVoices().find((v) => v.name === getPref(role));
  return {
    name: chosen.voice?.name ?? '裝置預設英文音色',
    pitch: chosen.pitch,
    maleFallback: role === 'M' && !manual && (!chosen.voice || !MALE.test(chosen.voice.name)),
    manual
  };
}

export function stop(reason = 'canceled') {
  token++;
  lastError = reason;
  releaseSpeech?.(false, reason);
  releasePause?.();
  if (supported()) speechSynthesis.cancel();
}

export function fileSupported() { return typeof globalThis.Audio === 'function'; }

/** Fixed role recordings: only onended counts a complete play; stop/failed/stalled playback does not. */
export function playFile(url) {
  stop();
  return playRecording(url, token, getRate());
}

function playRecording(url, myToken, rate) {
  if (!fileSupported()) { lastError = 'audio-file'; return Promise.resolve(false); }
  lastError = '';
  return new Promise((resolve) => {
    const player = new Audio(url);
    player.playbackRate = rate;
    let timer, settled = false;
    const done = (ok, reason = '') => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      player.onended = player.onerror = player.onplaying = player.ontimeupdate = null;
      player.pause();
      if (releaseSpeech === done) releaseSpeech = null;
      if (myToken === token) lastError = reason;
      resolve(ok);
    };
    const watchdog = () => { clearTimeout(timer); timer = setTimeout(() => done(false, 'timeout'), 15000); };
    releaseSpeech = done;
    player.onended = () => done(true);
    player.onerror = () => done(false, 'audio-file');
    player.onplaying = player.ontimeupdate = watchdog;
    watchdog();
    try { Promise.resolve(player.play()).catch(() => done(false, 'audio-file')); }
    catch { done(false, 'audio-file'); }
  });
}

function speak(text, { voice, pitch }, rate, myToken) {
  return new Promise(resolve => {
    if (myToken !== token) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? 'en-US';
    if (voice) u.voice = voice; // Empty enumeration: let the engine select by language.
    u.pitch = pitch;
    u.rate = rate;
    let timer, settled = false;
    const done = (ok, reason = '') => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (releaseSpeech === done) releaseSpeech = null;
      if (myToken === token) lastError = reason;
      resolve(ok);
    };
    const timeout = () => { if (settled || myToken !== token) return; done(false, 'timeout'); speechSynthesis.cancel(); };
    releaseSpeech = done;
    timer = setTimeout(timeout, 12000);
    u.onstart = () => { if (settled || myToken !== token) return; clearTimeout(timer); timer = setTimeout(timeout, Math.max(30000, text.length * 180 / rate)); };
    u.onend = () => done(true);
    u.onerror = e => done(false, e.error || 'synthesis-failed');
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(u);
    } catch { done(false, 'synthesis-failed'); }
  });
}

const pause = (ms) => new Promise(resolve => {
  let timer;
  const done = () => { clearTimeout(timer); if (releasePause === done) releasePause = null; resolve(); };
  releasePause = done;
  timer = setTimeout(done, ms);
});

/** Split into sentences so intonation resets naturally and long texts are not cut off by the engine. */
function sentences(text) {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/** lines: [{speaker:'M'|'W'|'N', text, gap?}]. Resolves true if it played to the end, false if stopped. */
export async function playScript(lines, { rate = getRate() } = {}) {
  if (!supported()) { lastError = 'unsupported'; return false; }
  stop();
  const myToken = token;
  lastError = '';
  for (const line of lines) {
    const v = pickVoice(availableVoices(), line.speaker);
    const lineRate = rate * (line.rateScale ?? 1);
    for (const s of [line.text]) {
      if (myToken !== token) return false;
      if (!await (line.audio ? playRecording(line.audio, myToken, lineRate) : speak(s, v, lineRate, myToken))) return false;
    }
    await pause(line.gap ?? 500);
  }
  return myToken === token;
}

/** Part 1/2 style: stimulus, then each option introduced by its letter. */
export function withSpokenOptions(group) {
  const q = group.questions[0];
  const spokenLetters = ["A", "B", "C", "D"];
  const out = [...group.script.map((l) => ({ ...l, gap: 900 }))];
  q.options.forEach((o, i) => {
    out.push({ speaker: "N", text: i === 0 ? "A" : `${spokenLetters[i]}.`, ...(i === 0 ? { rateScale: 0.75 } : {}), single: true, gap: 250 });
    out.push({ speaker: "N", text: o, gap: 700 });
  });
  return out;
}

export async function sample(role) {
  const text = role === "N" ? "The meeting has been moved to Thursday." : role === "M"
    ? "Did you see the email from the supplier? The delivery has been pushed back to the twentieth."
    : "I know. I'll call them this afternoon, and let the marketing team know about the new date.";
  return playScript([...(role === 'N' ? [{ speaker: 'N', text: 'A', rateScale: 0.75, gap: 250 }] : []), { speaker: role, text }]);
}
