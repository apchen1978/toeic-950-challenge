import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const groups = new Map(bank.groups.map((g) => [g.id, g]));
const words = (g) => g.passage.docs.reduce((sum, d) => sum + d.text.split(/\s+/).filter(Boolean).length, 0);
const set = (id) => bank.meta.sets.find((s) => s.id === id).groupIds.map((i) => groups.get(i));
const count = (gs, re) => gs.reduce((sum, g) => sum + g.questions.filter((q) => re.test(q.questionType)).length, 0);
const [m1, m2, m3] = ["read-full-1", "read-full-2", "read-full-3"].map(set);
const p7 = (gs) => gs.filter((g) => g.part === 7);
const p6 = (gs) => gs.filter((g) => g.part === 6);

test("mocks 2 and 3 read longer than mock 1 in both Part 6 and Part 7", () => {
  const w7 = (gs) => p7(gs).reduce((sum, g) => sum + words(g), 0);
  const w6 = (gs) => p6(gs).reduce((sum, g) => sum + words(g), 0);
  for (const m of [m2, m3]) {
    assert.ok(w7(m) >= w7(m1) + 150, `Part 7 words ${w7(m)} vs ${w7(m1)}`);
    assert.ok(w6(m) >= w6(m1) + 80, `Part 6 words ${w6(m)} vs ${w6(m1)}`);
  }
});

test("mocks 2 and 3 carry more inference than mock 1 and keep cross-document items", () => {
  const inf = (m) => count(p7(m), /^inference$/);
  assert.ok(inf(m2) >= inf(m1) + 4 && inf(m3) >= inf(m1) + 4, `${inf(m1)} / ${inf(m2)} / ${inf(m3)}`);
  for (const m of [m2, m3]) assert.ok(count(p7(m), /cross-document/) >= 9);
});

test("official-style type mix stays intact: synonym, intent, insertion, main-purpose, and a share of plain detail items", () => {
  for (const m of [m2, m3]) {
    assert.ok(count(p7(m), /synonym/) >= 3, "synonym");
    assert.ok(count(p7(m), /chat-intent/) >= 2, "intent");
    assert.ok(count(p7(m), /text-insertion/) >= 2, "insertion");
    assert.ok(count(p7(m), /main-purpose/) >= 4, "main purpose");
    assert.ok(count(p7(m), /^detail$/) >= 12, "plain detail items stay as the easy part of the mix");
  }
});

test("both mocks keep the official shape and balanced answer positions after the rework", () => {
  for (const m of [m2, m3]) {
    assert.equal(p7(m).reduce((n, g) => n + g.questions.length, 0), 54);
    const shapes = p7(m).map((g) => `${g.questions.length}/${g.passage.docs.length}`).sort();
    assert.equal(shapes.filter((s) => s.endsWith("/3")).length, 3);
    assert.equal(shapes.filter((s) => s === "5/2").length, 2);
    const all = [0, 0, 0, 0], seven = [0, 0, 0, 0];
    for (const g of m) for (const q of g.questions) { all[q.answer] += 1; if (g.part === 7) seven[q.answer] += 1; }
    assert.ok(all.every((x) => x >= 20 && x <= 31), all.join("/"));
    assert.ok(seven.every((x) => x >= 11 && x <= 16), seven.join("/"));
  }
});

test("the four new long groups are original, in the mocks, and fully formed", () => {
  const ids = ["g-ets-p7-01", "g-ets-p7-02", "g-ets-p7-03", "g-ets-p7-04"];
  const inMocks = new Set([...m2, ...m3].map((g) => g.id));
  for (const id of ids) {
    const g = groups.get(id);
    assert.ok(g && inMocks.has(id), id);
    assert.equal(g.questions.length, 5);
    assert.ok(g.questions.some((q) => q.questionType === "cross-document" && q.crossRef === true));
    assert.ok(g.questions.some((q) => q.questionType === "inference" || q.questionType === "not-question"));
    for (const q of g.questions) { assert.equal(new Set(q.options).size, 4); assert.ok(q.explanation.includes("【判斷依據】")); }
  }
  assert.ok([m1].every((m) => !m.some((g) => ids.includes(g.id))), "mock 1 is untouched");
});
