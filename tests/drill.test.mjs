import test from "node:test";
import assert from "node:assert/strict";
import { buildDrill, summarize, LIMITS } from "../codex/js/drill.js";
import { COLLOCATIONS, PARAPHRASES, RESPONSES, POS_ITEMS } from "../codex/js/phrases.js";

function seeded(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

test("drill builds 10 mixed items, each with one correct, distinct options", () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const items = buildDrill({ random: seeded(seed) });
    assert.equal(items.length, 10);
    assert.deepEqual(new Set(items.map((i) => i.kind)), new Set(["collocation", "paraphrase", "response", "pos"]));
    for (const item of items) {
      assert.equal(new Set(item.options).size, item.options.length, item.prompt);
      assert.ok(item.options[item.answer], item.prompt);
      assert.equal(item.limit, LIMITS[item.kind]);
      assert.ok(item.options.length === (item.kind === "response" ? 3 : 4));
      if (item.kind === "pos") assert.ok(item.prompt.includes("____"));
    }
  }
});

test("data is consistent: unique Part 2 questions and every response row complete", () => {
  assert.ok(RESPONSES.length >= 50);
  assert.ok(PARAPHRASES.length >= 36);
  assert.ok(POS_ITEMS.length >= 30);
  assert.equal(new Set(PARAPHRASES.map((p) => p[1])).size, PARAPHRASES.length, "duplicate paraphrase answer");
  for (const row of POS_ITEMS) assert.ok(row.length === 6 && new Set(row.slice(1, 5)).size === 4 && row[0].split("____").length === 2, row[0]);
  assert.equal(new Set(POS_ITEMS.map((r) => r[0])).size, POS_ITEMS.length);
  assert.equal(new Set(RESPONSES.map((r) => r[0])).size, RESPONSES.length);
  for (const row of RESPONSES) assert.ok(row.length === 5 && row.every((x) => x.trim()) && new Set(row.slice(1, 4)).size === 3, row[0]);
  assert.equal(new Set(PARAPHRASES.map((p) => p[0])).size, PARAPHRASES.length);
  assert.ok(COLLOCATIONS.length >= 60);
});

test("summary computes accuracy, average seconds, timeouts and slowest items", () => {
  const sum = summarize([
    { sec: 2, correct: true, timedOut: false },
    { sec: 8, correct: false, timedOut: true },
    { sec: 5, correct: false, timedOut: false }
  ]);
  assert.equal(sum.right, 1); assert.equal(sum.total, 3); assert.equal(sum.timeouts, 1);
  assert.equal(sum.avgSec, 5); assert.equal(sum.slowest[0].sec, 8); assert.equal(sum.missed.length, 2);
  assert.equal(summarize([]).avgSec, 0);
});

test("single-kind drill uses only that kind", () => {
  for (const only of ["response", "pos"]) {
    const items = buildDrill({ only, random: seeded(7) });
    assert.equal(items.length, 10);
    assert.ok(items.every((i) => i.kind === only));
  }
});
