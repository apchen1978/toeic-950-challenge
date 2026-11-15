import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isNegativePrompt, markNot, notQuestionPool, pickNotQuestions } from "../codex/js/not-questions.js";
import { TIP_SECTIONS } from "../codex/js/tips.js";
import { BY_DAYS_LEFT, TASKS } from "../codex/js/plan.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
function seeded(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

test("negative prompts are detected in Part 3, 4 and 7 only", () => {
  assert.equal(isNegativePrompt("What is NOT a requirement for a complete refund?", 7), true);
  assert.equal(isNegativePrompt("Which of the following is NOT mentioned?", 4), true);
  assert.equal(isNegativePrompt("What is least likely to be included?", 7), true);
  assert.equal(isNegativePrompt("The details are not mentioned in the email.", 7), true);
  assert.equal(isNegativePrompt("Not until the inspection is complete _____ the machine be used.", 5), false);
  assert.equal(isNegativePrompt("Why is the replacement not being sent immediately?", 7), false);
  assert.equal(isNegativePrompt("What does the company NOT offer?", 2), false);
  assert.equal(isNegativePrompt(null, 7), false);
});

test("markNot highlights only the capitalised words and keeps escaped text intact", () => {
  assert.equal(markNot("What is NOT included?"), 'What is <mark class="not-flag">NOT</mark> included?');
  assert.equal(markNot("All EXCEPT one &amp; two"), 'All <mark class="not-flag">EXCEPT</mark> one &amp; two');
  assert.equal(markNot("It is not NOTable"), "It is not NOTable");
});

test("bank has enough Part 7 NOT questions and the picker returns distinct, recent-avoiding picks", () => {
  const pool = notQuestionPool(bank);
  assert.ok(pool.length >= 15, `pool ${pool.length}`);
  assert.equal(new Set(pool.map((p) => p.questionId)).size, pool.length);
  const groups = new Map(bank.groups.map((g) => [g.id, g]));
  for (const item of pool) assert.equal(groups.get(item.groupId).part, 7);
  const first = pickNotQuestions(bank, { count: 10, random: seeded(1) });
  assert.equal(first.questionIds.length, 10);
  assert.equal(new Set(first.questionIds).size, 10);
  for (const id of first.questionIds) assert.ok(pool.some((p) => p.questionId === id));
  const second = pickNotQuestions(bank, { count: 5, random: seeded(2), recent: first.questionIds });
  assert.ok(second.questionIds.filter((id) => first.questionIds.includes(id)).length <= Math.max(0, 5 - (pool.length - 10)), "unseen questions come first");
  assert.equal(pickNotQuestions(bank, { count: 999, random: seeded(3) }).questionIds.length, pool.length);
});

test("Part 7 tips include the NOT strategy, labelled as a personal summary", () => {
  const p7 = TIP_SECTIONS.find((s) => s.part === 7);
  const tip = p7.tips.find((t) => /NOT/.test(t.title));
  assert.ok(tip && /個人整理，非官方/.test(tip.title));
  assert.ok(/逐項|每個選項/.test(tip.title + tip.body) && /不是規則/.test(tip.why));
});

test("app highlights NOT in questions, shows the hint, offers practice and the plan schedules it", () => {
  for (const needle of ["markNot(esc(q.prompt))", "isNegativePrompt(q.prompt", 'class="not-hint"', 'data-action="start-not"', 'case "start-not"', "startNotPractice()"]) assert.ok(app.includes(needle), needle);
  assert.ok(TASKS.notPractice.action === "start-not");
  assert.ok(BY_DAYS_LEFT[12].includes("notPractice") && BY_DAYS_LEFT[10].includes("notPractice"));
  assert.match(worker, /"js\/not-questions\.js"/);
});
