import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flatten } from "../codex/js/scoring.js";
import { SKILLS } from "../codex/js/skills.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const groups = new Map(bank.groups.map((group) => [group.id, group]));
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

test("Codex bank: group and question ids are unique and every skill exists", () => {
  assert.equal(groups.size, bank.groups.length);
  const questions = flatten(bank);
  const ids = new Set(questions.map((question) => question.id));
  assert.equal(ids.size, questions.length);
  for (const question of questions) assert.ok(SKILLS[question.skill], `${question.id}: unknown skill ${question.skill}`);
});

test("Codex bank: existing groups follow section, part, choice-count, and content rules", () => {
  for (const group of bank.groups) {
    assert.ok(["listening", "reading"].includes(group.section), `${group.id}: section`);
    assert.ok(Number.isInteger(group.part) && group.part >= 1 && group.part <= 7, `${group.id}: part`);
    if (group.section === "listening") assert.ok(Array.isArray(group.script) && group.script.length, `${group.id}: script`);
    if (group.section === "reading" && [6, 7].includes(group.part)) assert.ok(group.passage, `${group.id}: passage`);
    if (group.part === 2) assert.equal(group.spokenOptions, true, `${group.id}: spoken options`);
    for (const question of group.questions) {
      assert.equal(question.options.length, group.part === 2 ? 3 : 4, `${question.id}: choice count`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${question.id}: answer`);
      assert.ok(question.explanation.length > 30 && /[A-Za-z]/.test(question.explanation), `${question.id}: explanation`);
    }
  }
});

test("Batch A pilot: 5 Part 2 and 5 Part 5 questions in the sample set", () => {
  const pilot = bank.meta.sets.find((set) => set.id === "batch-a-pilot");
  assert.ok(pilot);
  const selected = pilot.groupIds.map((id) => groups.get(id));
  assert.ok(selected.every(Boolean));
  assert.equal(flatten(bank, pilot.groupIds).length, 10);
  assert.equal(selected.filter((group) => group.part === 2).length, 5);
  assert.equal(selected.filter((group) => group.part === 5).length, 5);
});

test("Batch A pilot: official Part 2 three-option format and complete English rationales", () => {
  const pilot = bank.meta.sets.find((set) => set.id === "batch-a-pilot");
  for (const group of pilot.groupIds.map((id) => groups.get(id))) {
    for (const question of group.questions) {
      assert.equal(question.options.length, group.part === 2 ? 3 : 4, question.id);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, question.id);
      assert.ok(question.explanation.length > 30 && /[A-Za-z]/.test(question.explanation), question.id);
    }
  }
});

test("Batch A pilot: stems do not duplicate existing question or listening prompts", () => {
  const existingStems = new Set();
  for (const group of bank.groups.filter((item) => !item.id.startsWith("g-a-"))) {
    for (const question of group.questions) {
      existingStems.add(normalize(group.part === 2 ? group.script.map((line) => line.text).join(" ") : question.prompt));
    }
  }
  const pilot = bank.meta.sets.find((set) => set.id === "batch-a-pilot");
  for (const group of pilot.groupIds.map((id) => groups.get(id))) {
    const stem = normalize(group.part === 2 ? group.script.map((line) => line.text).join(" ") : group.questions[0].prompt);
    assert.ok(!existingStems.has(stem), `${group.id}: duplicate stem`);
  }
});

test("reading-all set includes every current reading question", () => {
  const set = bank.meta.sets.find((item) => item.id === "reading");
  assert.equal(flatten(bank, set.groupIds).filter((question) => question.section === "reading").length, 66);
});
