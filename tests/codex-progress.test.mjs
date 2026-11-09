import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateProgress } from '../codex/js/scoring.js';

test('in-progress estimate ignores blanks and separates section totals from diagnostic categories', () => {
  const questions = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `L${i}`, section: 'listening', part: 2, skill: 'l-response', answer: 0 })),
    { id: 'G', section: 'reading', part: 5, skill: 'r-grammar', answer: 0 },
    { id: 'V', section: 'reading', part: 5, skill: 'r-vocabulary', answer: 0 },
    { id: 'S', section: 'reading', part: 6, skill: 'r-grammar', answer: 0 },
    { id: 'R1', section: 'reading', part: 7, skill: 'r-detail', answer: 0 },
    { id: 'R2', section: 'reading', part: 7, skill: 'r-inference', answer: 0 },
    { id: 'BLANK', section: 'reading', part: 7, skill: 'r-detail', answer: 0 }
  ];
  const answers = Object.fromEntries(questions.slice(0, -1).map((q) => [q.id, 0]));
  answers.L0 = 1;
  const result = estimateProgress(questions, answers);
  assert.deepEqual(result.sections, { listening: { c: 5, n: 6 }, reading: { c: 5, n: 5 } });
  assert.deepEqual(result.categories.structure, { c: 1, n: 1 });
  assert.deepEqual(result.categories.grammar, { c: 2, n: 2 });
  assert.deepEqual(result.categories.vocabulary, { c: 1, n: 1 });
  assert.deepEqual(result.categories.reading, { c: 2, n: 2 });
  assert.ok(result.ranges.listening.low <= result.ranges.listening.mid);
  assert.ok(result.ranges.listening.mid <= result.ranges.listening.high);
  assert.equal(result.ranges.reading.answered, 5);
});
