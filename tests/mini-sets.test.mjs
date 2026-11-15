import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assembleQuickForm, createRng, QUICK_BLUEPRINTS } from "../codex/js/quick-form.js";
import { buildOfficialSequence, sequenceSeconds, isOfficialForm } from "../codex/js/official-listening.js";
import { BY_DAYS_LEFT, TASKS } from "../codex/js/plan.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const groups = new Map(bank.groups.map((g) => [g.id, g]));
const accents = Object.fromEntries(Object.entries(manifest.groups).map(([id, entry]) => [id, entry.accent]));
const count = (ids) => ids.reduce((sum, id) => sum + groups.get(id).questions.length, 0);
const types = (ids, part) => new Set(ids.map((id) => groups.get(id)).filter((g) => g.part === part).flatMap((g) => g.questions.map((q) => q.questionType)));

test("mini sets are registered in the bank and the listening one is an official form", () => {
  assert.ok(QUICK_BLUEPRINTS["mini-listen-15"] && QUICK_BLUEPRINTS["mini-read-12"]);
  for (const id of ["mini-listen-15", "mini-read-12"]) assert.ok(bank.meta.sets.some((s) => s.id === id), id);
  assert.ok(isOfficialForm("mini-listen-15") && !isOfficialForm("mini-read-12"));
});

test("listening mini draws 15 questions in Part 1-4 order with varied types and no coverage warnings", () => {
  const warnings = [];
  const original = console.warn; console.warn = (m) => warnings.push(m);
  try {
    for (let seed = 1; seed <= 60; seed += 1) {
      const draw = assembleQuickForm(bank, "mini-listen-15", { random: createRng(seed), accents, section: "listening" });
      assert.equal(count(draw.groupIds), 15);
      const parts = draw.groupIds.map((id) => groups.get(id).part);
      assert.deepEqual(parts, parts.slice().sort((a, b) => a - b));
      assert.deepEqual([1, 2, 3, 4].map((p) => draw.groupIds.filter((id) => groups.get(id).part === p).reduce((s, id) => s + groups.get(id).questions.length, 0)), [1, 5, 6, 3]);
      assert.ok(types(draw.groupIds, 2).size >= 3, `P2 types seed ${seed}`);
      const minutes = sequenceSeconds(buildOfficialSequence(draw.groupIds.map((id) => groups.get(id)), manifest)) / 60;
      assert.ok(minutes >= 4 && minutes <= 8, `minutes ${minutes}`);
    }
  } finally { console.warn = original; }
  assert.deepEqual(warnings, []);
});

test("reading mini draws 12 questions: 5 Part 5, 4 Part 6 with sentence insertion, 3 Part 7", () => {
  const warnings = [];
  const original = console.warn; console.warn = (m) => warnings.push(m);
  try {
    for (let seed = 1; seed <= 60; seed += 1) {
      const draw = assembleQuickForm(bank, "mini-read-12", { random: createRng(seed), accents, section: "reading" });
      assert.equal(count(draw.groupIds), 12);
      assert.deepEqual([5, 6, 7].map((p) => draw.groupIds.filter((id) => groups.get(id).part === p).reduce((s, id) => s + groups.get(id).questions.length, 0)), [5, 4, 3]);
      assert.ok([...types(draw.groupIds, 6)].some((t) => /insert/i.test(t)), `P6 insertion seed ${seed}`);
      assert.ok(draw.groupIds.every((id) => groups.get(id).section === "reading"));
      assert.equal(draw.timing.reading, 9);
    }
  } finally { console.warn = original; }
  assert.deepEqual(warnings, []);
});

test("quick sets stay recent-avoiding and the home page offers both, near the top", () => {
  const a = assembleQuickForm(bank, "mini-read-12", { random: createRng(3), accents, section: "reading" });
  const b = assembleQuickForm(bank, "mini-read-12", { random: createRng(3), accents, section: "reading", avoid: a.groupIds });
  assert.ok(b.groupIds.filter((id) => a.groupIds.includes(id)).length < a.groupIds.length);
  for (const needle of ['id="nav-mini"', 'data-form="mini-listen-15"', 'data-form="mini-read-12"', "startMiniForm(d.form)"]) assert.ok(app.includes(needle), needle);
  assert.ok(app.indexOf('id="nav-mini"') > app.indexOf('id="plan-card"') && app.indexOf('id="nav-mini"') < app.indexOf('id="nav-review"'), "mini card sits between the plan and the review cards");
});

test("study plan uses the quick sets in the last days", () => {
  assert.ok(TASKS.miniListen.attrs.form === "mini-listen-15" && TASKS.miniRead.attrs.form === "mini-read-12");
  assert.ok(BY_DAYS_LEFT[1].includes("miniListen") && BY_DAYS_LEFT[1].includes("miniRead"));
  assert.ok(BY_DAYS_LEFT[2].includes("miniListen"));
});
