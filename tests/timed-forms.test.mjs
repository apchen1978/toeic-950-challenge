import test from 'node:test';
import assert from 'node:assert/strict';
import { startTimedForm, startReading, remainingMs, elapsedSeconds, pauseTimer, resumeTimer } from '../codex/js/timer.js';
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
