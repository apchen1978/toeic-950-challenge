import test from 'node:test';
import assert from 'node:assert/strict';
import { READING_PACE, REVIEW_MINUTES, paceHint, paceSummary } from '../codex/js/pace.js';

test('the pacing plan adds up to 75 minutes with time left to check', () => {
  const total = READING_PACE.reduce((sum, step) => sum + step.minutes, 0) + REVIEW_MINUTES;
  assert.equal(total, 75);
  assert.deepEqual(READING_PACE.map((step) => step.leaveBy), [65, 57, 5]);
  assert.match(paceSummary(), /非官方/);
});

test('hints say when to move on and flag a part that runs behind', () => {
  const onTime = paceHint(5, 70 * 60, { 5: 300 });
  assert.equal(onTime.behind, false);
  assert.match(onTime.text, /Part 5 已用 05:00/);
  assert.match(onTime.text, /65:00 前進入 Part 6/);
  const late = paceHint(5, 64 * 60, { 5: 660 });
  assert.equal(late.behind, true);
  assert.match(late.text, /落後/);
  assert.equal(paceHint(6, 60 * 60, {}).behind, false);
  assert.equal(paceHint(6, 56 * 60, {}).behind, true);
  assert.equal(paceHint(7, 20 * 60, {}).behind, false);
  assert.match(paceHint(7, 4 * 60, {}).text, /最後 5 分鐘/);
  assert.match(paceHint(7, 30, {}).text, /答錯不倒扣/);
  assert.equal(paceHint(1, 100, {}).text, '');
});
