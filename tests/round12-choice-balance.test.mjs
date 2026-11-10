import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHOICE_REVISION, LEGACY_OPTIONS, migrateChoiceIndexes } from "../codex/js/choice-legacy.js";
import { flatten, score } from "../codex/js/scoring.js";
import { VERIFIED_CROSSREF_GROUP_IDS, assembleQuickForm, createRng, drawQuestionGroups } from "../codex/js/quick-form.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const byId = Object.fromEntries(bank.groups.flatMap((group) => group.questions.map((question) => [question.id, question])));
const protectedIds = new Set(bank.meta.sets.filter((set) => ["form-a", "form-b", "form-c", "original"].includes(set.id)).flatMap((set) => set.groupIds));

test("the 15 indirect replies are balanced across A, B, and C without a long run", () => {
  const answers = [];
  for (let index = 1; index <= 15; index += 1) {
    const group = bank.groups.find((item) => item.id === `g-gx-p2-${String(index).padStart(2, "0")}`);
    assert.equal(protectedIds.has(group.id), false, group.id);
    answers.push(group.questions[0].answer);
  }
  const counts = [0, 1, 2].map((choice) => answers.filter((answer) => answer === choice).length);
  assert.deepEqual(counts, [5, 5, 5]);
  let run = 1;
  for (let index = 1; index < answers.length; index += 1) {
    run = answers[index] === answers[index - 1] ? run + 1 : 1;
    assert.ok(run <= 2, `run of ${run}`);
  }
});

test("a legacy index still grades the same option text after the shuffle", () => {
  const legacyAnswers = {};
  for (const [id, options] of Object.entries(LEGACY_OPTIONS)) legacyAnswers[id] = 0;
  legacyAnswers.GXP202 = 1;
  const migrated = migrateChoiceIndexes(legacyAnswers, undefined, byId);
  assert.equal(migrated.revision, CHOICE_REVISION);
  assert.equal(migrated.changed, true);
  for (const [id, options] of Object.entries(LEGACY_OPTIONS)) {
    assert.equal(byId[id].options[migrated.answers[id]], options[legacyAnswers[id]], id);
  }
  const questions = flatten(bank).filter((question) => LEGACY_OPTIONS[question.id]);
  const correctLegacy = Object.fromEntries(Object.keys(LEGACY_OPTIONS).map((id) => [id, 0]));
  const graded = score(questions, migrateChoiceIndexes(correctLegacy, undefined, byId).answers);
  assert.equal(graded.correct, questions.length);
  const wrong = score(questions, migrateChoiceIndexes({ ...correctLegacy, GXP201: 1 }, undefined, byId).answers);
  assert.equal(wrong.correct, questions.length - 1);
  const again = migrateChoiceIndexes(migrated.answers, migrated.revision, byId);
  assert.equal(again.changed, false);
  assert.deepEqual(again.answers, migrated.answers);
});

test("quick draws and a direct Part 7 draw prefer a verified two-document group", () => {
  const excluded = new Set(["g-r15", "g-reading04-training", "g-new-read-a", "g-new-read-b", "g-notice-parking-01", "g-email-order-02", "g-event-ad-03", "g-chat-policy-04", "g-airport-reading-d", "g-campus-reading-d", "g-deep-reading-hotel-01", "g-deep-reading-supplier-02", "xr-p7-transit", "xr-p7-lab"]);
  for (const id of excluded) assert.equal(VERIFIED_CROSSREF_GROUP_IDS.has(id), false, id);
  for (const formId of ["quick-40", "quick-60"]) {
    for (const seed of [1, 2, 3, 7, 11, 19]) {
      const form = assembleQuickForm(bank, formId, { random: createRng(seed), section: "reading" });
      const multis = form.groupIds.map((id) => bank.groups.find((group) => group.id === id)).filter((group) => (group.passage?.docs?.length ?? 0) > 1);
      assert.ok(multis.some((group) => VERIFIED_CROSSREF_GROUP_IDS.has(group.id)), `${formId} ${seed}`);
    }
  }
  const verified = bank.groups.find((group) => group.id === "g-rd-ship-01");
  const singleDoc = bank.groups.find((group) => group.id === "g-airport-reading-d");
  const fillers = bank.groups.filter((group) => group.part === 5).slice(0, 4);
  const picked = drawQuestionGroups([...fillers, singleDoc, verified], 9, () => 0.999, new Set(), true);
  assert.ok(picked.some((group) => group.id === "g-rd-ship-01"));
  assert.equal(picked.some((group) => group.id === "g-airport-reading-d"), false);
});
