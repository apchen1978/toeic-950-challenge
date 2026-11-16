import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const groups = bank.groups.filter((group) => /^g-long-p[67]-\d{2}$/.test(group.id));
const words = (group) => group.passage.docs.reduce((total, doc) => total + doc.text.split(/\s+/).filter(Boolean).length, 0);

test("new long reading groups keep the intended article lengths and question shapes", () => {
  assert.equal(groups.length, 14);
  const reserved = new Set(bank.meta.sets.flatMap((set) => set.groupIds));
  for (const group of groups) {
    assert.equal(reserved.has(group.id), false, `${group.id} must remain outside fixed sets`);
    const number = Number(group.id.slice(-2));
    if (group.part === 6) {
      assert.ok(number >= 1 && number <= 4);
      assert.equal(group.questions.length, 4);
      assert.equal(group.passage.docs.length, 1);
      assert.ok(words(group) >= 140 && words(group) <= 200, group.id);
      assert.equal(group.questions.filter((question) => question.questionType === "sentence-insertion").length, 1);
    } else {
      const docs = number <= 4 ? 1 : number <= 7 ? 2 : 3;
      const [minimum, maximum] = docs === 1 ? [170, 240] : docs === 2 ? [300, 400] : [400, 520];
      assert.equal(group.passage.docs.length, docs);
      assert.equal(group.questions.length, docs === 1 ? 4 : 5);
      assert.ok(words(group) >= minimum && words(group) <= maximum, group.id);
      if (docs > 1) assert.ok(group.questions.filter((question) => question.crossRef === true).length >= 2, group.id);
    }
  }
});

test("new long reading questions have balanced keys and grounded explanations", () => {
  const questions = groups.flatMap((group) => group.questions);
  assert.equal(questions.length, 62);
  const answerCounts = [0, 0, 0, 0];
  for (const question of questions) {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options).size, 4, question.id);
    assert.match(question.explanation, /【考點】.*【判斷依據】/s, question.id);
    answerCounts[question.answer]++;
    if (question.crossRef) {
      assert.equal(question.questionType, "cross-document", question.id);
      assert.match(question.explanation, /Cross-reference:/, question.id);
    }
  }
  assert.deepEqual(answerCounts, [16, 16, 15, 15]);
  const answers = questions.map((question) => question.answer);
  for (let i = 2; i < answers.length; i++) assert.ok(answers[i] !== answers[i - 1] || answers[i] !== answers[i - 2], `three identical answers ending at ${i}`);
});
