import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  accuracyTrend,
  answerLocked,
  answeredWrong,
  bestAccuracy,
  mergeSkillStats,
  queueWrongReview,
  updateWrongAnswerQueue
} from "../codex/js/scoring.js";

const questions = [
  { id: "Q1", answer: 1, prompt: "One" },
  { id: "Q2", answer: 0, prompt: "Two" },
  { id: "Q3", answer: 2, prompt: "Three" }
];

test("wrong-count excludes unanswered questions", () => {
  const wrong = answeredWrong(questions, { Q1: 0 });
  assert.deepEqual(wrong.map((question) => question.id), ["Q1"]);
  assert.equal(answeredWrong(questions, { Q2: 0 }).length, 0);
});

test("peek flag survives a reload and legacy sessions are not peeked", () => {
  const saved = JSON.parse(JSON.stringify({ answers: { Q1: 0 }, peeked: true, pausedRemainingMs: 1, officialCursor: { index: 2, offset: 1.5 } }));
  const restored = JSON.parse(JSON.stringify(saved));
  assert.equal(restored.peeked, true);
  assert.equal(answerLocked(restored, "Q1"), true);
  assert.equal(answerLocked(restored, "Q2"), false);
  assert.deepEqual(restored.officialCursor, { index: 2, offset: 1.5 });
  assert.equal(answerLocked({ answers: { Q1: 0 } }, "Q1"), false);
  assert.equal(answerLocked(JSON.parse(JSON.stringify({ answers: { Q1: 0 }, official: true })), "Q1"), false);
});

test("peeked attempts are left out of the estimate, best score, and trend", () => {
  const history = [
    { id: "a", correct: 8, total: 10, bySkill: { "l-main": { c: 8, t: 10 } } },
    { id: "b", correct: 1, total: 10, peeked: true, bySkill: { "l-main": { c: 0, t: 10 } } },
    { id: "c", correct: 6, total: 10, bySkill: { "l-main": { c: 6, t: 10 } } }
  ];
  assert.equal(bestAccuracy(history).id, "a");
  assert.deepEqual(accuracyTrend(history), [0.8, 0.6]);
  assert.deepEqual(mergeSkillStats(history)["l-main"], { c: 14, t: 20 });
  assert.equal(bestAccuracy([{ id: "only", correct: 1, total: 10, peeked: true }]), null);
});

test("adding a mistake to review does not create a second queue entry", () => {
  const first = queueWrongReview({}, questions[0], 50);
  assert.equal(first.added, true);
  const second = queueWrongReview(first.queue, questions[0], 80);
  assert.equal(second.added, false);
  assert.equal(second.queue.Q1.wrongCount, 1);
  const finished = updateWrongAnswerQueue(second.queue, questions, { Q1: 0, Q2: 1 }, 90, ["Q1"]);
  assert.equal(finished.Q1.wrongCount, 1);
  assert.equal(finished.Q2.wrongCount, 1);
});

test("the pause screen offers the review and official peek confirm", () => {
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  assert.match(app, /看目前錯題/);
  assert.match(app, /看錯題後，這次會改記為練習成績，不計入五力估分與最佳成績。/);
  assert.match(app, /確定看錯題/);
  assert.match(app, /回到考試/);
  assert.match(app, /加入錯題複習/);
  assert.match(app, /answerLocked\(session, q\.id\)/);
});
