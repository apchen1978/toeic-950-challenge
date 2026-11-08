import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flatten, score, estimateScaled, mergeSkillStats, weakest, groupsForSkill } from "../js/scoring.js";
import { SKILLS } from "../js/skills.js";

const bank = JSON.parse(readFileSync(new URL("../data/questions.json", import.meta.url), "utf8"));
const all = flatten(bank);

test("bank: 30 questions, 14 listening and 16 reading", () => {
  assert.equal(all.length, 30);
  assert.equal(all.filter((q) => q.section === "listening").length, 14);
  assert.equal(all.filter((q) => q.section === "reading").length, 16);
});

test("bank: ids unique, answers in range, options present, explanations in English", () => {
  const ids = new Set();
  for (const g of bank.groups) assert.ok(!ids.has(g.id) && ids.add(g.id), `dup group ${g.id}`);
  const qids = new Set();
  for (const q of all) {
    assert.ok(!qids.has(q.id), `dup question ${q.id}`);
    qids.add(q.id);
    assert.ok(q.options.length >= 3 && q.options.length <= 4, `${q.id} option count`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${q.id} answer range`);
    assert.ok(q.explanation.length > 30, `${q.id} explanation`);
    assert.ok(/[A-Za-z]/.test(q.explanation) && !/[一-鿿]/.test(q.explanation), `${q.id} explanation must be English`);
    assert.ok(SKILLS[q.skill], `${q.id} unknown skill ${q.skill}`);
    assert.equal(new Set(q.options).size, q.options.length, `${q.id} duplicate options`);
  }
});

test("bank: listening groups have a script, reading groups have a passage or are Part 5", () => {
  for (const g of bank.groups) {
    if (g.section === "listening") {
      assert.ok(Array.isArray(g.script) && g.script.length, `${g.id} script`);
      assert.ok(!g.passage, `${g.id} must not expose text`);
      for (const l of g.script) assert.ok(["M", "W", "N"].includes(l.speaker));
    } else {
      assert.ok(g.part === 5 || (g.passage && g.passage.docs.length), `${g.id} passage`);
    }
    if (g.spokenOptions) assert.equal(g.questions.length, 1);
  }
});

test("bank: correct answers are not skewed to one letter", () => {
  const counts = [0, 0, 0, 0];
  for (const q of all) counts[q.answer]++;
  for (const c of counts) assert.ok(c / all.length <= 0.4, `answer distribution ${counts}`);
});

test("bank: disclaimer says unofficial", () => {
  assert.match(bank.meta.disclaimer, /unofficial/i);
  assert.match(bank.meta.disclaimer, /not equivalent to ETS/i);
});

test("score: counts correct, wrong, unanswered and per-skill totals", () => {
  const answers = {};
  for (const q of all) answers[q.id] = q.answer;
  let r = score(all, answers);
  assert.equal(r.correct, 30);
  assert.equal(r.wrong.length, 0);
  answers.L01 = (all[0].answer + 1) % 3;
  delete answers.R01;
  r = score(all, answers);
  assert.equal(r.correct, 28);
  assert.equal(r.answered, 29);
  assert.equal(r.wrong.length, 2);
  assert.equal(r.bySection.listening.c, 13);
  assert.equal(r.bySkill["l-response"].t, 5);
  assert.equal(r.bySkill["l-response"].c, 4);
});

test("estimate: monotonic, bounded, labelled as a range", () => {
  const e0 = estimateScaled(0, 15);
  const e1 = estimateScaled(15, 15);
  assert.ok(e0.low >= 5 && e1.high <= 495);
  assert.ok(e1.mid > estimateScaled(8, 15).mid && estimateScaled(8, 15).mid > e0.mid);
  assert.equal(estimateScaled(0, 0), null);
});

test("weak skills: merged across attempts, sorted, minimum item count honoured", () => {
  const stats = mergeSkillStats([
    { bySkill: { a: { c: 1, t: 3 }, b: { c: 2, t: 2 } } },
    { bySkill: { a: { c: 0, t: 1 }, c: { c: 0, t: 1 } } }
  ]);
  assert.deepEqual(stats.a, { c: 1, t: 4 });
  const w = weakest(stats, 3, 2);
  assert.deepEqual(w.map((x) => x.skill), ["a"]);
  assert.equal(weakest(stats, 3, 1).map((x) => x.skill)[0], "c");
});

test("groupsForSkill returns groups in bank order", () => {
  const ids = groupsForSkill(bank, "l-response");
  assert.deepEqual(ids, ["g-l01", "g-l02", "g-l03", "g-l04", "g-l05"]);
});
