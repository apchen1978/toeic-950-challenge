import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assembleQuickForm, createRng, QUICK_BLUEPRINTS } from "../codex/js/quick-form.js";
import { BY_DAYS_LEFT, TASKS } from "../codex/js/plan.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const groups = new Map(bank.groups.map((g) => [g.id, g]));
const SETS = { "part5-15": [5, 15, 5], "part5-30": [5, 30, 10], "part6-8": [6, 8, 4], "part6-16": [6, 16, 8], "part7-12": [7, 12, 12], "part7-25": [7, 25, 24] };
const count = (ids) => ids.reduce((sum, id) => sum + groups.get(id).questions.length, 0);
const types = (ids) => ids.flatMap((id) => groups.get(id).questions.map((q) => q.questionType));

test("every part set is a registered blueprint and bank set with the expected size and minutes", () => {
  for (const [id, [part, questions, minutes]] of Object.entries(SETS)) {
    assert.ok(QUICK_BLUEPRINTS[id], id);
    const set = bank.meta.sets.find((s) => s.id === id);
    assert.ok(set, `${id} missing in bank sets`);
    assert.equal(set.timing.reading, minutes);
    assert.equal(count(set.groupIds), questions);
    assert.ok(set.groupIds.every((g) => groups.get(g).part === part));
  }
});

test("each draw stays inside its Part, has the right question count and covers the key types", () => {
  const warnings = [];
  const original = console.warn; console.warn = (m) => warnings.push(m);
  try {
    for (const [id, [part, questions, minutes]] of Object.entries(SETS)) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const draw = assembleQuickForm(bank, id, { random: createRng(seed), section: "reading" });
        assert.equal(count(draw.groupIds), questions, `${id} seed ${seed}`);
        assert.ok(draw.groupIds.every((g) => groups.get(g).part === part && groups.get(g).section === "reading"));
        assert.equal(new Set(draw.groupIds).size, draw.groupIds.length);
        assert.equal(draw.timing.reading, minutes);
        const t = types(draw.groupIds).join(" ");
        if (part === 5 && questions === 30) for (const re of [/part-of-speech/, /verb-tense|tense/, /preposition|conjunction/, /vocabulary/]) assert.match(t, re, `${id} seed ${seed}`);
        if (part === 6) assert.match(t, /sentence-insertion/, `${id} seed ${seed}`);
      }
    }
  } finally { console.warn = original; }
  assert.deepEqual(warnings, [], "no coverage warnings");
});

test("recent groups are avoided when the pool allows it", () => {
  for (const id of ["part5-15", "part6-8", "part7-12"]) {
    const a = assembleQuickForm(bank, id, { random: createRng(5), section: "reading" });
    const b = assembleQuickForm(bank, id, { random: createRng(5), section: "reading", avoid: a.groupIds });
    assert.equal(b.groupIds.filter((g) => a.groupIds.includes(g)).length, 0, id);
  }
});

test("home page offers all six sets, and the plan uses them without stacking big tasks", () => {
  assert.ok(app.includes('id="nav-parts"') && app.includes("PART_SETS") && app.includes("startPartSet(d.form)"));
  assert.ok(app.indexOf('id="nav-parts"') < app.indexOf('id="nav-mini"'), "part practice sits before the quick sets");
  for (const id of Object.keys(SETS)) assert.ok(app.includes(`id: "${id}"`), id);
  for (const key of ["part5Short", "part5Block", "part6Short", "part6Block", "part7Short", "part7Block"]) assert.ok(TASKS[key] && /^part[567]-\d+$/.test(TASKS[key].attrs.form), key);
  const used = new Set(Object.values(BY_DAYS_LEFT).flat());
  for (const key of ["part5Block", "part6Block", "part7Short", "part7Block"]) assert.ok(used.has(key), `${key} scheduled`);
  for (const [day, keys] of Object.entries(BY_DAYS_LEFT)) assert.ok(keys.filter((k) => TASKS[k].minutes >= 40).length <= 1, `day ${day}`);
});
