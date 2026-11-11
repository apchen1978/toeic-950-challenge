import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
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
      const hasExpectedLanguage = question.id.startsWith("rd-new-")
        ? /[\u4e00-\u9fff]/.test(question.explanation)
        : /[A-Za-z]/.test(question.explanation);
      assert.ok(question.explanation.length > 30 && hasExpectedLanguage, `${question.id}: explanation`);
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
  assert.equal(flatten(bank, set.groupIds).filter((question) => question.section === "reading").length, 302);
});

test("focused E includes three conversations, text completion and two single passages", () => {
  const set = bank.meta.sets.find((item) => item.id === "focused-e-21");
  assert.ok(set);
  const selected = set.groupIds.map((id) => groups.get(id));
  assert.ok(selected.every(Boolean));
  assert.equal(flatten(bank, set.groupIds).length, 21);
  assert.equal(selected.filter((g) => g.part === 3 && g.questions.length === 3).length, 3);
  assert.equal(selected.filter((g) => g.part === 6 && g.questions.length === 4).length, 1);
  assert.equal(selected.filter((g) => g.part === 7 && g.passage.docs.length === 1 && g.questions.length === 4).length, 2);
});

test("reading C and vocabulary C contain distinct, complete practice sets", () => {
  const reading = bank.meta.sets.find((set) => set.id === "reading-notices-20");
  const vocabulary = bank.meta.sets.find((set) => set.id === "vocabulary-c-10");
  assert.ok(reading && vocabulary);
  assert.equal(flatten(bank, reading.groupIds).length, 20);
  assert.equal(flatten(bank, vocabulary.groupIds).length, 10);
  assert.equal(reading.groupIds.map((id) => groups.get(id)).filter((g) => g.passage.docs.length === 3).length, 3);
  assert.deepEqual(new Set(flatten(bank, vocabulary.groupIds).map((q) => q.answer)), new Set([0, 1, 2, 3]));
});

test("airport and campus set includes six listening and eight reading questions", () => {
  const set = bank.meta.sets.find((item) => item.id === "campus-airport-14");
  assert.ok(set);
  const qs = flatten(bank, set.groupIds);
  assert.equal(qs.filter((q) => q.section === "listening").length, 6);
  assert.equal(qs.filter((q) => q.section === "reading").length, 8);
});

test("advanced practice includes dialogue, talks, text completion and paired documents", () => {
  const set = bank.meta.sets.find((item) => item.id === "practice-crossref-26");
  assert.ok(set);
  const selected = set.groupIds.map((id) => groups.get(id));
  assert.ok(selected.every(Boolean));
  const questions = flatten(bank, set.groupIds);
  assert.equal(questions.filter((q) => q.section === "listening").length, 12);
  assert.equal(questions.filter((q) => q.section === "reading").length, 14);
  assert.equal(selected.filter((g) => [3, 4].includes(g.part) && g.questions.length === 3).length, 4);
  assert.equal(selected.filter((g) => g.part === 7 && g.passage.docs.length === 2).length, 2);
  assert.equal(selected.filter((g) => g.part === 6 && g.questions.length === 4).length, 1);
});

test("extra practice set contains ten listening and ten reading questions", () => {
  const set = bank.meta.sets.find((item) => item.id === "extra-a-20");
  assert.ok(set);
  const questions = flatten(bank, set.groupIds);
  assert.equal(questions.filter((question) => question.section === "listening").length, 10);
  assert.equal(questions.filter((question) => question.section === "reading").length, 10);
});

test("photo practice has local images, four spoken choices and offline cache entries", () => {
  const set = bank.meta.sets.find((item) => item.id === "photo-pilot");
  assert.ok(set);
  const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
  assert.equal(set.groupIds.length, 18);
  for (const id of set.groupIds) {
    const group = groups.get(id);
    assert.equal(group.part, 1);
    assert.equal(group.spokenOptions, true);
    assert.equal(group.questions[0].options.length, 4);
    const image = new URL(`../codex/${group.image}`, import.meta.url);
    assert.ok(existsSync(image));
    assert.ok(statSync(image).size <= 350 * 1024, group.image);
    assert.match(group.image, /^images\/.+\.(?:jpe?g|webp)$/);
    assert.equal(worker.includes(`"${group.image}"`), false);
    assert.match(worker, /function cacheFirstMedia/);
  }
});

test("three distinct 200-question practice forms match TOEIC part and reading passage counts", () => {
  const forms = ['form-a', 'form-b', 'form-c'].map((id) => bank.meta.sets.find((set) => set.id === id));
  assert.ok(forms.every(Boolean));
  const allIds = forms.flatMap((form) => form.groupIds);
  assert.equal(new Set(allIds).size, allIds.length);
  for (const form of forms) {
    const chosen = form.groupIds.map((id) => groups.get(id));
    assert.ok(chosen.every(Boolean));
    const counts = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((part) => [part, chosen.filter((g) => g.part === part).reduce((sum, g) => sum + g.questions.length, 0)]));
    assert.deepEqual(counts, { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 });
    assert.equal(chosen.filter((g) => g.part === 7 && g.passage.docs.length === 1).reduce((sum, g) => sum + g.questions.length, 0), 29);
    assert.equal(chosen.filter((g) => g.part === 7 && g.passage.docs.length > 1).reduce((sum, g) => sum + g.questions.length, 0), 25);
  }
});

test("visual and deep reading set includes a mapped conversation and two complete three-document groups", () => {
  const set = bank.meta.sets.find((item) => item.id === "visual-deep-g");
  const selected = set.groupIds.map((id) => groups.get(id));
  assert.equal(flatten(bank, set.groupIds).length, 13);
  assert.ok(selected[0].image && existsSync(new URL(`../codex/${selected[0].image}`, import.meta.url)));
  assert.equal(selected[0].questions.length, 3);
  assert.ok(selected.slice(1).every((g) => g.part === 7 && g.passage.docs.length === 3 && g.questions.length === 5));
  const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
  assert.equal(worker.includes(`"${selected[0].image}"`), false);
  assert.match(worker, /svg\|mp3/);
});

test("practice F supplies three conversations, two talks, and three single passages", () => {
  const set = bank.meta.sets.find((item) => item.id === "coverage-f-24");
  assert.ok(set);
  const selected = set.groupIds.map((id) => groups.get(id));
  assert.ok(selected.every(Boolean));
  assert.equal(flatten(bank, set.groupIds).length, 24);
  assert.equal(selected.filter((g) => g.part === 3 && g.questions.length === 3).length, 3);
  assert.equal(selected.filter((g) => g.part === 4 && g.questions.length === 3).length, 2);
  assert.equal(selected.filter((g) => g.part === 7 && g.passage.docs.length === 1 && g.questions.length === 3).length, 3);
});

test("question bank contains enough appropriately grouped items to assemble one official blueprint", () => {
  const p=(part)=>bank.groups.filter((group)=>group.part===part);
  assert.ok(p(1).length >= 6);
  assert.ok(flatten(bank,p(2).map((g)=>g.id)).length >= 25);
  assert.ok(p(3).filter((g)=>g.questions.length===3).length >= 13);
  assert.ok(p(4).filter((g)=>g.questions.length===3).length >= 10);
  assert.ok(flatten(bank,p(5).map((g)=>g.id)).length >= 30);
  assert.ok(p(6).filter((g)=>g.questions.length===4).length >= 4);
  assert.ok(p(7).filter((g)=>g.passage.docs.length===1).reduce((n,g)=>n+g.questions.length,0) >= 29);
  assert.ok(p(7).filter((g)=>g.passage.docs.length>=2 && g.questions.length===5).length >= 5);
});
