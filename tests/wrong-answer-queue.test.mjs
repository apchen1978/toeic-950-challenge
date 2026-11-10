import test from "node:test";
import assert from "node:assert/strict";
import { updateWrongAnswerQueue, wrongAnswerDue } from "../codex/js/scoring.js";

const questions = [
  { id: "Q1", answer: 1 },
  { id: "Q2", answer: 0 },
  { id: "Q3", answer: 2 }
];

test("wrong-answer queue adds wrong responses and leaves unanswered questions alone", () => {
  const result = updateWrongAnswerQueue({}, questions, { Q1: 0 }, 100);
  assert.deepEqual(result, { Q1: { wrongCount: 1, lastWrongAt: 100, stage: 0, dueAt: 100 } });
});

test("legacy mistakes start immediately due and first success schedules tomorrow", () => {
  const initial = {
    Q1: { wrongCount: 1, lastWrongAt: 100 },
    Q2: { wrongCount: 2, lastWrongAt: 200 }
  };
  const result = updateWrongAnswerQueue(initial, questions, { Q1: 1, Q2: 3, Q3: 2 }, 300);
  assert.deepEqual(result, {
    Q1: { wrongCount: 1, lastWrongAt: 100, stage: 1, lastCorrectAt: 300, dueAt: 86400300 },
    Q2: { wrongCount: 3, lastWrongAt: 300, stage: 0, dueAt: 300 }
  });
  assert.deepEqual(initial.Q1, { wrongCount: 1, lastWrongAt: 100 });
});

test("early correct attempts cannot graduate; due success can", () => {
  const first = updateWrongAnswerQueue({ Q1: { wrongCount: 1, lastWrongAt: 0 } }, questions, { Q1: 1 }, 1000);
  assert.equal(wrongAnswerDue(first.Q1, 86400999), false);
  const early = updateWrongAnswerQueue(first, questions, { Q1: 1 }, 86400999);
  assert.deepEqual(early, first);
  assert.equal(wrongAnswerDue(first.Q1, 86401000), true);
  assert.deepEqual(updateWrongAnswerQueue(first, questions, { Q1: 1 }, 86401000), {});
});

test("wrong attempts reset a waiting entry; blanks preserve it and new correct answers do not enter", () => {
  const waiting = { Q1: { stage: 1, wrongCount: 2, dueAt: 999999 } };
  assert.deepEqual(updateWrongAnswerQueue(waiting, questions, {}, 20), waiting);
  const reset = updateWrongAnswerQueue(waiting, questions, { Q1: 0, Q2: 0 }, 20);
  assert.deepEqual(reset, { Q1: { stage: 0, wrongCount: 3, dueAt: 20, lastWrongAt: 20 } });
  assert.equal(wrongAnswerDue(undefined, 20), false);
  assert.equal(wrongAnswerDue({ wrongCount: 1 }, 20), true);
});
