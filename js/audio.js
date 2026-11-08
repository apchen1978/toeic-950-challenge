// Listening audio via the browser's built-in speech synthesis (free, no audio files).
// Voice quality depends on the device: Edge "Natural" voices and iOS/macOS enhanced voices sound best.
// Transcripts are never shown by this module; the UI only reveals them after submission.

const MALE = /(guy|davis|andrew|brian|christopher|eric|roger|steffan|ryan|david|mark|george|james|daniel|alex|fred|thomas|aaron|tom|male)/i;
const FEMALE = /(aria|jenny|michelle|emma|ava|sonia|libby|zira|samantha|susan|hazel|karen|victoria|allison|joanna|jessica|nancy|female)/i;
const PREF_KEY = "toeic950.voice.v1";

let token = 0;

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

export function getVoices() {
  return new Promise((resolve) => {
    if (!supported()) return resolve([]);
    const have = () => speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
    const now = have();
    if (now.length) return resolve(now);
    const done = () => resolve(have());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
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
    return v ? { voice: v, pitch: 1 } : { voice: byRank[0], pitch: 0.88 };
  }
  if (speaker === "W") {
    const v = byRank.find((x) => FEMALE.test(x.name));
    return v ? { voice: v, pitch: 1 } : { voice: byRank[0], pitch: 1.08 };
  }
  // Narrator: a different voice from the man if possible, else the best one.
  const man = pickVoice(voices, "M").voice;
  return { voice: byRank.find((x) => x !== man && FEMALE.test(x.name)) ?? byRank[0], pitch: 1 };
}

export function stop() {
  token++;
  if (supported()) speechSynthesis.cancel();
}

function speak(text, { voice, pitch }, rate, myToken) {
  return new Promise((resolve) => {
    if (myToken !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "en-US";
    if (voice) u.voice = voice;
    u.pitch = pitch;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Split into sentences so intonation resets naturally and long texts are not cut off by the engine. */
function sentences(text) {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

/** lines: [{speaker:'M'|'W'|'N', text, gap?}]. Resolves true if it played to the end, false if stopped. */
export async function playScript(lines, { rate = 0.95 } = {}) {
  if (!supported()) return false;
  stop();
  const myToken = token;
  const voices = await getVoices();
  for (const line of lines) {
    const v = pickVoice(voices, line.speaker);
    for (const s of line.single ? [line.text] : sentences(line.text)) {
      if (myToken !== token) return false;
      await speak(s, v, rate, myToken);
      await pause(line.single ? 0 : 220);
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
