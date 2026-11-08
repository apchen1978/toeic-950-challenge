import test from "node:test";
import assert from "node:assert/strict";
import { updateWrongAnswerQueue } from "../codex/js/scoring.js";

const questions = [
  { id: "Q1", answer: 1 },
  { id: "Q2", answer: 0 },
  { id: "Q3", answer: 2 }
];

test("wrong-answer queue adds wrong responses and leaves unanswered questions alone", () => {
  const result = updateWrongAnswerQueue({}, questions, { Q1: 0 }, 100);
  assert.deepEqual(result, { Q1: { wrongCount: 1, lastWrongAt: 100 } });
});

test("wrong-answer queue clears correct responses and keeps repeated mistakes", () => {
  const initial = {
    Q1: { wrongCount: 1, lastWrongAt: 100 },
    Q2: { wrongCount: 2, lastWrongAt: 200 }
  };
  const result = updateWrongAnswerQueue(initial, questions, { Q1: 1, Q2: 3, Q3: 2 }, 300);
  assert.deepEqual(result, {
    Q2: { wrongCount: 3, lastWrongAt: 300 }
  });
  assert.deepEqual(initial.Q1, { wrongCount: 1, lastWrongAt: 100 });
});
