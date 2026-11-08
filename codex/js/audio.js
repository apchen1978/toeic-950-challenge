// Listening audio via the browser's built-in speech synthesis (free, no audio files).
// Voice quality depends on the device: Edge "Natural" voices and iOS/macOS enhanced voices sound best.
// Transcripts are never shown by this module; the UI only reveals them after submission.

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
    canceled: '播放已中止，可重新點擊播放。'
  };
  return messages[lastError] ?? ('語音播放失敗（' + (lastError || 'unknown') + '），請重新點擊播放或試用其他音色。');
}
let releaseSpeech = null;
export function getRate() { const r=Number(prefs().rate); return [0.85,1,1.1].includes(r)?r:1; }
export function setRate(rate) { if(![0.85,1,1.1].includes(rate)) return; const p=prefs(); p.rate=rate; try {localStorage.setItem(PREF_KEY,JSON.stringify(p));} catch {} }

export function supported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
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

/** Returns { voice, pitch } for a speaker. Pitch is only altered when no distinct voice of that gender exists. */
function pickVoice(voices, speaker) {
  if (!voices.length) return { voice: null, pitch: 1 };
  const byRank = [...voices].sort((a, b) => rank(b) - rank(a));
  const saved = voices.find((v) => v.name === prefs()[speaker]);
  if (saved) return { voice: saved, pitch: 1 };
  if (speaker === "M") {
    const v = byRank.find((x) => MALE.test(x.name));
    return { voice: v ?? byRank[0], pitch: 1 };
  }
  if (speaker === "W") {
    const v = byRank.find((x) => FEMALE.test(x.name));
    return { voice: v ?? byRank[0], pitch: 1 };
  }
  // Narrator: a different voice from the man if possible, else the best one.
  const man = pickVoice(voices, "M").voice;
  return { voice: byRank.find((x) => x !== man && FEMALE.test(x.name)) ?? byRank[0], pitch: 1 };
}

export function stop() {
  token++;
  releaseSpeech?.(false);
  if (supported()) speechSynthesis.cancel();
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
    const timeout = () => { done(false, 'timeout'); speechSynthesis.cancel(); };
    releaseSpeech = done;
    timer = setTimeout(timeout, 12000);
    u.onstart = () => { clearTimeout(timer); timer = setTimeout(timeout, Math.max(30000, text.length * 180 / rate)); };
    u.onend = () => done(true);
    u.onerror = e => done(false, e.error || 'synthesis-failed');
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(u);
    } catch { done(false, 'synthesis-failed'); }
  });
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const voices = availableVoices();
  for (const line of lines) {
    const v = pickVoice(voices, line.speaker);
    for (const s of [line.text]) {
      if (myToken !== token) return false;
      if (!await speak(s, v, rate, myToken)) return false;
    }
    await pause(line.gap ?? 500);
  }
  return myToken === token;
}

/** Part 2 style: stimulus, then each option read separately as "Option A." (a bare "A." is read as an article). */
export function withSpokenOptions(group) {
  const q = group.questions[0];
  const letters = ["A", "B", "C", "D"];
  const out = [...group.script.map((l) => ({ ...l, gap: 900 }))];
  q.options.forEach((o, i) => {
    out.push({ speaker: "N", text: `Option ${letters[i]}.`, single: true, gap: 250 });
    out.push({ speaker: "N", text: o, gap: 700 });
  });
  return out;
}

export async function sample(role) {
  const text = role === "N" ? "Option A. The meeting has been moved to Thursday." : role === "M"
    ? "Did you see the email from the supplier? The delivery has been pushed back to the twentieth."
    : "I know. I'll call them this afternoon, and let the marketing team know about the new date.";
  return playScript([{ speaker: role, text }]);
}
