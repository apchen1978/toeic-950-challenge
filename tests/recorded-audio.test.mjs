import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
let serial = 0;
test('every listening group has a local recording in its assigned accent', () => {
  const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url)));
  const manifest = JSON.parse(readFileSync(new URL('../codex/audio/manifest.json', import.meta.url)));
  const locales = { US: 'en-US', UK: 'en-GB', CA: 'en-CA', AU: 'en-AU' };
  const groups = bank.groups.filter((g) => g.section === 'listening');
  assert.equal(Object.keys(manifest.groups).length, groups.length);
  assert.equal(manifest.format.includes('48 kbps'), true);
  for (const group of groups) {
    const entry = manifest.groups[group.id];
    assert.ok(entry, group.id);
    assert.equal(entry.accent, group.accent);
    assert.equal(entry.locale, locales[group.accent], group.id);
    assert.ok(entry.voices.every((voice) => voice.locale === locales[group.accent] && voice.voice.startsWith(locales[group.accent])), group.id);
    assert.equal(entry.scriptSha256.toLowerCase(), createHash('sha256').update(JSON.stringify(group.script)).digest('hex'), group.id);
    assert.deepEqual(entry.roles, group.script.map((line) => line.speaker));
    assert.equal(statSync(new URL(`../codex/${entry.file}`, import.meta.url)).size, entry.bytes);
    assert.ok(entry.durationSec > 1);
    if (group.part === 3 || group.part === 2) assert.ok(new Set(entry.voices.map((voice) => voice.voice)).size >= 2, group.id);
  }
});
async function setup() {
  const players = [];
  globalThis.Audio = class {
    constructor(url) { this.url = url; players.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  globalThis.localStorage = { getItem: () => null };
  const audio = await import(`../codex/js/audio.js?recording=${serial++}`);
  return { players, audio };
}
test('recorded playback completes only on end; errors and cancellation permit retry', async () => {
  const { players, audio } = await setup();
  const first = audio.playFile('audio/first.mp3');
  audio.stop();
  assert.equal(await first, false);
  assert.equal(players[0].paused, true);
  const failed = audio.playFile('audio/missing.mp3');
  players[1].onerror();
  assert.equal(await failed, false);
  assert.match(audio.errorMessage(), /重試/);
  const retry = audio.playFile('audio/first.mp3');
  players[2].onended();
  assert.equal(await retry, true);
});
test('recorded playback watchdog releases a silent engine', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { players, audio } = await setup();
  const playback = audio.playFile('audio/stalled.mp3');
  t.mock.timers.tick(15001);
  assert.equal(await playback, false);
  assert.equal(players[0].paused, true);
});

test('letter cue and synthesized options share one cancellable playback sequence', async () => {
  const { players, audio } = await setup();
  const spoken = [];
  globalThis.speechSynthesis = { getVoices: () => [], cancel() {}, speak(u) { spoken.push(u.text); queueMicrotask(() => u.onend()); } };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.window = { speechSynthesis, SpeechSynthesisUtterance };
  const lines = [{ speaker: 'N', text: 'A.', audio: 'audio/letter-a.mp3', gap: 0 }, { speaker: 'N', text: 'The meeting is tomorrow.', gap: 0 }];
  const first = audio.playScript(lines);
  players[0].onended();
  assert.equal(await first, true);
  assert.deepEqual(spoken, ['The meeting is tomorrow.']);
  const second = audio.playScript(lines);
  audio.stop();
  assert.equal(await second, false);
  assert.equal(spoken.length, 1);
  const options = audio.withSpokenOptions({ script: [], questions: [{ options: ['One', 'Two', 'Three'] }] });
  assert.equal(options[0].text, 'A! One');
  assert.equal(options[0].audio, undefined);
  assert.equal(options[1].audio, undefined);
});
