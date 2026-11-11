import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flatten, score, updateWrongAnswerQueue } from "../codex/js/scoring.js";
import { assembleQuickForm, avoidedGroupIds, createRng, isActiveGroup, mixByLevel, QUICK_BLUEPRINTS, rememberQuickDraw } from "../codex/js/quick-form.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const accents = Object.fromEntries(Object.entries(manifest.groups).map(([id, entry]) => [id, entry.accent]));

function draw(formId, seed, avoid = []) {
  return assembleQuickForm(bank, formId, { random: createRng(seed), avoid, accents });
}

function groupsOf(ids) {
  return ids.map((id) => {
    const group = bank.groups.find((item) => item.id === id);
    assert.ok(group, id);
    return group;
  });
}

function questionsInOrder(entry) {
  const questions = flatten(bank, entry.groupIds);
  if (entry.formId) questions.sort((a, b) => entry.groupIds.indexOf(a.groupId) - entry.groupIds.indexOf(b.groupId));
  return questions;
}

test("retired groups stay available for old forms but leave new quick draws", () => {
  const oldGroup = bank.groups.find((group) => group.part === 2);
  const retired = { ...oldGroup, retired: true };
  const synthetic = { ...bank, groups: bank.groups.map((group) => group.id === oldGroup.id ? retired : group) };
  assert.equal(isActiveGroup(retired), false);
  assert.ok(synthetic.groups.find((group) => group.id === oldGroup.id));
  for (const seed of [1, 7, 19]) {
    const form = assembleQuickForm(synthetic, "quick-60", { random: createRng(seed), accents });
    assert.ok(!form.groupIds.includes(oldGroup.id));
  }
});

test("40 and 60 hit the blueprint exactly and never split a group", () => {
  assert.deepEqual(QUICK_BLUEPRINTS["quick-40"].timing, { listening: 9, reading: 15 });
  assert.deepEqual(QUICK_BLUEPRINTS["quick-60"].timing, { listening: 13.5, reading: 22.5 });
  for (const formId of ["quick-40", "quick-60"]) {
    const blueprint = QUICK_BLUEPRINTS[formId];
    for (const seed of [1, 2, 7, 40]) {
      const form = draw(formId, seed);
      const groups = groupsOf(form.groupIds);
      assert.equal(new Set(form.groupIds).size, form.groupIds.length);
      assert.equal(groups.filter((group) => group.section === "listening").reduce((sum, group) => sum + group.questions.length, 0), blueprint.listening);
      assert.equal(groups.filter((group) => group.section === "reading").reduce((sum, group) => sum + group.questions.length, 0), blueprint.reading);
      const byPart = {};
      for (const group of groups) byPart[group.part] = (byPart[group.part] ?? 0) + group.questions.length;
      const expected = {};
      for (const spec of blueprint.parts) {
        const partGroups = groups.filter((group) => group.part === spec.part);
        if (spec.groups) assert.equal(partGroups.length, spec.groups, `${formId} part ${spec.part}`);
        if (spec.questionsEach) assert.ok(partGroups.every((group) => group.questions.length === spec.questionsEach));
        expected[spec.part] = spec.questions ?? spec.groups * (spec.questionsEach ?? 1);
        if (spec.requireMulti) assert.ok(partGroups.some((group) => (group.passage?.docs?.length ?? 0) > 1));
      }
      assert.deepEqual(byPart, expected);
      const questions = flatten(bank, form.groupIds);
      assert.equal(questions.length, blueprint.listening + blueprint.reading);
      for (const group of groups) {
        const fromForm = questions.filter((question) => question.groupId === group.id).map((question) => question.id);
        assert.deepEqual(fromForm, group.questions.map((question) => question.id));
      }
    }
  }
});

test("listening accents stay as even as the blueprint allows", () => {
  for (const formId of ["quick-40", "quick-60"]) {
    for (const seed of [3, 11, 19]) {
      const form = draw(formId, seed);
      const counts = Object.values(form.accentCounts);
      assert.equal(counts.reduce((sum, count) => sum + count, 0), form.groupIds.filter((id) => bank.groups.find((group) => group.id === id).section === "listening").length);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${formId} seed ${seed} ${JSON.stringify(form.accentCounts)}`);
    }
  }
});

test("three consecutive seeded draws differ, and the same seed repeats", () => {
  for (const formId of ["quick-40", "quick-60"]) {
    const draws = [1, 2, 3].map((seed) => draw(formId, seed).groupIds);
    assert.notDeepEqual(draws[0], draws[1]);
    assert.notDeepEqual(draws[1], draws[2]);
    assert.notDeepEqual(draws[0], draws[2]);
    assert.deepEqual(draw(formId, 1).groupIds, draws[0]);
    const fixed = bank.meta.sets.find((set) => set.id === formId).groupIds;
    assert.notDeepEqual([...draws[0]].sort(), [...fixed].sort());
  }
});

test("recent draws are avoided until the pool runs short", () => {
  const part1 = bank.groups.filter((group) => group.part === 1).map((group) => group.id);
  const keep = part1.slice(0, 2);
  const almostAll = part1.filter((id) => !keep.includes(id));
  const preferred = draw("quick-40", 5, almostAll);
  assert.deepEqual(new Set(preferred.groupIds.filter((id) => part1.includes(id))), new Set(keep));

  const forced = draw("quick-40", 6, part1);
  assert.equal(forced.groupIds.filter((id) => part1.includes(id)).length, 2);

  let recent = [];
  const used = [];
  for (let i = 0; i < 3; i += 1) {
    const form = draw("quick-40", 20 + i, avoidedGroupIds(recent));
    recent = rememberQuickDraw(recent, form.groupIds, "quick-40");
    used.push(...form.groupIds);
  }
  assert.equal(recent.length, 3);
  const fourth = draw("quick-40", 99, avoidedGroupIds(recent));
  assert.equal(fourth.groupIds.filter((id) => used.includes(id)).length, 0);
  const fifthHistory = rememberQuickDraw(recent, fourth.groupIds, "quick-40");
  assert.equal(fifthHistory.length, 3);
  assert.deepEqual(fifthHistory[2].groupIds, fourth.groupIds);
});

test("items with a level are mixed within the part, and the live bank has none", () => {
  assert.equal(bank.groups.some((group) => group.difficulty != null || group.level != null || group.questions.some((question) => question.difficulty != null || question.level != null)), false);
  const mixed = mixByLevel([
    { id: "a", difficulty: "hard" },
    { id: "b", difficulty: "hard" },
    { id: "c", level: "easy" },
    { id: "d", level: "easy" }
  ]);
  assert.deepEqual(mixed.map((group) => group.id), ["a", "c", "b", "d"]);
});

test("legacy quick-40 and quick-60 sessions and history still load the saved form", () => {
  for (const formId of ["quick-40", "quick-60"]) {
    const set = bank.meta.sets.find((item) => item.id === formId);
    const entry = { formId, groupIds: set.groupIds, answers: {} };
    const questions = questionsInOrder(entry);
    const expected = formId === "quick-40" ? 40 : 60;
    assert.equal(questions.length, expected);
    assert.equal(questions.filter((question) => question.section === "listening").length, expected / 2);
    assert.equal(questions.filter((question) => question.section === "reading").length, expected / 2);
    assert.equal(questions[0].groupId, set.groupIds[0]);
    assert.deepEqual(score(questions, {}).total, expected);
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer === 0 ? 1 : 0]));
    const queue = updateWrongAnswerQueue({}, questions, answers);
    assert.equal(Object.keys(queue).length, questions.length);
    const session = { formId, groupIds: [...set.groupIds], bankVersion: bank.meta.version };
    assert.deepEqual(questionsInOrder(session).map((question) => question.id), questions.map((question) => question.id));
  }
});
