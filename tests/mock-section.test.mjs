import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flatten, estimateProgress, bestAccuracy, bestSectionAccuracy, accuracyTrend, countsForFullMock, normalizeMockSection, opensReadingAfterListening } from "../codex/js/scoring.js";
import { assembleQuickForm, createRng } from "../codex/js/quick-form.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const accents = Object.fromEntries(Object.entries(manifest.groups).map(([id, entry]) => [id, entry.accent]));

function draw(formId, section, seed = 1) {
  return assembleQuickForm(bank, formId, { random: createRng(seed), accents, section });
}

function questions(ids) {
  return flatten(bank, ids);
}

test("reading-only and listening-only quick forms keep the section blueprint", () => {
  const reading40 = draw("quick-40", "reading");
  const reading60 = draw("quick-60", "reading", 2);
  const listening40 = draw("quick-40", "listening", 3);
  const listening60 = draw("quick-60", "listening", 4);
  for (const [form, parts] of [[reading40, { 5: 8, 6: 4, 7: 8 }], [reading60, { 5: 14, 6: 4, 7: 12 }]]) {
    const groups = form.groupIds.map((id) => bank.groups.find((group) => group.id === id));
    assert.ok(groups.every((group) => group.section === "reading"));
    const byPart = {};
    for (const group of groups) byPart[group.part] = (byPart[group.part] ?? 0) + group.questions.length;
    assert.deepEqual(byPart, parts);
    assert.equal(form.timing.reading, form.formId === "quick-40" ? 15 : 22.5);
  }
  for (const form of [listening40, listening60]) {
    const groups = form.groupIds.map((id) => bank.groups.find((group) => group.id === id));
    assert.ok(groups.every((group) => group.section === "listening"));
    assert.equal(questions(form.groupIds).length, form.formId === "quick-40" ? 20 : 30);
    const counts = Object.values(form.accentCounts);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  }
  assert.equal(opensReadingAfterListening({ section: "listening" }), false);
  assert.equal(opensReadingAfterListening({ section: "full" }), true);
  assert.equal(opensReadingAfterListening({}), true);
});

test("200-question forms split into 100 listening and 100 reading questions", () => {
  for (const formId of ["form-a", "form-b", "form-c"]) {
    const set = bank.meta.sets.find((item) => item.id === formId);
    const groups = set.groupIds.map((id) => bank.groups.find((group) => group.id === id));
    assert.equal(groups.filter((group) => group.section === "reading").reduce((sum, group) => sum + group.questions.length, 0), 100);
    assert.equal(groups.filter((group) => group.section === "listening").reduce((sum, group) => sum + group.questions.length, 0), 100);
    assert.ok(groups.filter((group) => group.section === "reading").every((group) => !group.audio));
  }
});

test("a single section updates only that section of the estimate and not the full-mock best", () => {
  const reading = questions(draw("quick-40", "reading", 8).groupIds);
  const answers = Object.fromEntries(reading.map((question) => [question.id, question.answer]));
  const progress = estimateProgress(reading, answers);
  assert.equal(progress.sections.listening.n, 0);
  assert.equal(progress.categories.listening.n, 0);
  assert.equal(progress.sections.reading.n, 20);
  assert.ok(progress.categories.grammar.n > 0);
  assert.ok(progress.categories.vocabulary.n > 0);
  assert.ok(progress.categories.structure.n > 0);
  assert.ok(progress.categories.reading.n > 0);
  const history = [
    { id: "full", correct: 30, total: 40, section: "full" },
    { id: "read", correct: 20, total: 20, section: "reading" },
    { id: "listen", correct: 18, total: 20, section: "listening" },
    { id: "old", correct: 10, total: 40 }
  ];
  assert.equal(bestAccuracy(history).id, "full");
  assert.deepEqual(accuracyTrend(history), [30 / 40, 10 / 40]);
  assert.equal(bestSectionAccuracy(history, "reading").id, "read");
  assert.equal(bestSectionAccuracy(history, "listening").id, "listen");
  assert.equal(countsForFullMock({ correct: 1, total: 1 }), true);
  assert.equal(normalizeMockSection(undefined), "full");
  assert.equal(normalizeMockSection("nope"), "full");
});

test("the mock section choice is stored separately and defaults to a full exam", () => {
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  const choice = readFileSync(new URL("../codex/js/mock-section.js", import.meta.url), "utf8");
  assert.match(app, /mock-section\.v1/);
  assert.match(choice, /完整模考（聽力→閱讀）/);
  assert.match(choice, /只考閱讀/);
  assert.match(choice, /只考聽力/);
  assert.match(app, /可選只考閱讀或聽力/);
  assert.match(app, /單科成績：閱讀/);
  assert.equal(normalizeMockSection(JSON.parse(JSON.stringify({ formId: "quick-40" })).section), "full");
});
