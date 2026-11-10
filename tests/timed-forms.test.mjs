import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startTimedForm, startReading, remainingMs, elapsedSeconds, pauseTimer, resumeTimer } from '../codex/js/timer.js';
test('quick mock covers all seven parts in complete groups with 20 questions per section', () => {
  const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url)));
  const quick = bank.meta.sets.find((set) => set.id === 'quick-40');
  const groups = quick.groupIds.map((id) => bank.groups.find((group) => group.id === id));
  assert.ok(groups.every(Boolean));
  assert.deepEqual(new Set(groups.map((g) => g.part)), new Set([1, 2, 3, 4, 5, 6, 7]));
  assert.equal(groups.filter((g) => g.section === 'listening').reduce((n, g) => n + g.questions.length, 0), 20);
  assert.equal(groups.filter((g) => g.section === 'reading').reduce((n, g) => n + g.questions.length, 0), 20);
  assert.ok(groups.filter((g) => [3, 4].includes(g.part)).every((g) => g.questions.length === 3));
  assert.deepEqual(quick.timing, { listening: 9, reading: 15 });
});
test('quick mock transitions after 9 minutes to a 15 minute reading phase', () => {
  const session = { minutes: 24 };
  startTimedForm(session, 'quick-40', 0, { listening: 9, reading: 15 });
  assert.equal(remainingMs(session, 0), 9 * 60000);
  startReading(session, 9 * 60000, true);
  assert.equal(remainingMs(session, 9 * 60000), 15 * 60000);
  assert.equal(elapsedSeconds(session, 24 * 60000), 24 * 60);
});
test('form timing uses separate 45/75 minute sections and accounts for background time', () => {
  const session = { minutes: 120 };
  startTimedForm(session, 'form-a', 0);
  assert.equal(remainingMs(session, 0), 45 * 60000);
  assert.equal(elapsedSeconds(session, 0), 0);
  startReading(session, 50 * 60000, true);
  assert.equal(session.phase, 'reading');
  assert.equal(remainingMs(session, 50 * 60000), 70 * 60000);
  assert.equal(elapsedSeconds(session, 50 * 60000), 50 * 60);
  assert.equal(remainingMs(session, 121 * 60000), 0);
  assert.equal(elapsedSeconds(session, 121 * 60000), 120 * 60);
});
test('paused form survives reload and a manual section transition starts a fresh 75 minutes', () => {
  const session = { minutes: 120 };
  startTimedForm(session, 'form-b', 0);
  pauseTimer(session, 10 * 60000);
  const saved = JSON.parse(JSON.stringify(session));
  resumeTimer(saved, 60 * 60000);
  assert.equal(remainingMs(saved, 60 * 60000), 35 * 60000);
  startReading(saved, 65 * 60000);
  assert.equal(remainingMs(saved, 65 * 60000), 75 * 60000);
  assert.equal(elapsedSeconds(saved, 65 * 60000), 15 * 60);
  assert.equal(startReading(saved, 66 * 60000), false);
});
