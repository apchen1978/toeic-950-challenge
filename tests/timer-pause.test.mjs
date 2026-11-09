import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { remainingMs, pauseTimer, resumeTimer, elapsedSeconds } from '../codex/js/timer.js';

test('pause survives serialization and excludes break time from elapsed time', () => {
  const session = { minutes: 10, startedAt: 0, endsAt: 600000 };
  assert.equal(pauseTimer(session, 100000), true);
  const restored = JSON.parse(JSON.stringify(session));
  assert.equal(remainingMs(restored, 900000), 500000);
  assert.equal(elapsedSeconds(restored, 900000), 100);
  assert.equal(resumeTimer(restored, 900000), true);
  assert.equal(remainingMs(restored, 910000), 490000);
  assert.equal(elapsedSeconds(restored, 910000), 110);
});

test('repeated pause and resume retain the exact remaining time', () => {
  const session = { minutes: 1, endsAt: 60000 };
  assert.equal(pauseTimer(session, 10000), true);
  assert.equal(pauseTimer(session, 11000), false);
  assert.equal(resumeTimer(session, 100000), true);
  assert.equal(resumeTimer(session, 100001), false);
  assert.equal(pauseTimer(session, 105000), true);
  assert.equal(remainingMs(session, 900000), 45000);
});

test('an expired legacy session cannot be paused to avoid submission', () => {
  const session = { minutes: 1, startedAt: 0, endsAt: 60000 };
  assert.equal(pauseTimer(session, 60001), false);
  assert.equal(remainingMs(session, 60001), 0);
  assert.equal(elapsedSeconds(session, 60001), 60);
});

test('timer module is included in the offline app shell', () => {
  const worker = readFileSync(new URL('../codex/sw.js', import.meta.url), 'utf8');
  assert.ok(worker.includes('js/timer.js'));
});
