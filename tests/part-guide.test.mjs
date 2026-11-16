import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PART_GUIDE, PART_GUIDE_NOTE } from "../codex/js/part-guide.js";
import { BY_DAYS_LEFT, TASKS } from "../codex/js/plan.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");

test("guide covers Parts 1-7 in order, with the official question counts that add up to 200", () => {
  assert.deepEqual(PART_GUIDE.map((p) => p.part), [1, 2, 3, 4, 5, 6, 7]);
  const counts = PART_GUIDE.map((p) => Number(/^(\d+)/.exec(p.count)[1]));
  assert.deepEqual(counts, [6, 25, 39, 30, 30, 16, 54]);
  assert.equal(counts.reduce((a, b) => a + b, 0), 200);
  assert.deepEqual(PART_GUIDE.map((p) => p.section), ["聽力", "聽力", "聽力", "聽力", "閱讀", "閱讀", "閱讀"]);
});

test("every Part has exactly 3 classic types, each with how-to-spot, how-to-solve and trap, plus closing reminders", () => {
  for (const p of PART_GUIDE) {
    assert.ok(p.name && p.glance && p.count, `part ${p.part}`);
    assert.equal(p.types.length, 3, `part ${p.part} types`);
    assert.equal(new Set(p.types.map((t) => t.name)).size, 3);
    for (const t of p.types) for (const key of ["name", "spot", "how", "trap"]) assert.ok(String(t[key]).trim().length >= (key === "name" ? 2 : 5), `part ${p.part} ${t.name} ${key}`);
    assert.ok(p.remember.length >= 2 && p.remember.every((r) => r.trim().length > 4));
  }
});

test("text stays scannable and low-pressure", () => {
  for (const p of PART_GUIDE) {
    assert.ok(p.glance.length <= 60, `glance too long: part ${p.part} (${p.glance.length})`);
    for (const t of p.types) for (const key of ["spot", "how", "trap"]) assert.ok(t[key].length <= 90, `part ${p.part} ${t.name} ${key} too long (${t[key].length})`);
    for (const text of [p.glance, ...p.remember, ...p.types.flatMap((t) => [t.spot, t.how, t.trap])]) assert.ok(!/落後|警告|保證|一定會|百分之百/.test(text), text);
  }
  assert.match(PART_GUIDE_NOTE, /個人整理，非官方/);
});

test("key reminders match the rest of the site (NOT, insertion clue words, no-penalty guessing, Part 5 pace)", () => {
  const all = JSON.stringify(PART_GUIDE);
  for (const needle of ["NOT", "However", "不倒扣", "20 秒", "being", "原形", "Look at the graphic"]) assert.ok(all.includes(needle), needle);
});

test("guide view is wired: entry buttons, handlers, tick state, plan tasks and service worker cache", () => {
  for (const needle of ['data-action="part-guide"', 'case "part-guide"', 'case "guide-tick"', 'case "guide-jump"', "function renderPartGuide", "data-guide-done"]) assert.ok(app.includes(needle), needle);
  assert.ok(app.split('data-action="part-guide"').length >= 3, "buttons on both the pre-exam card and the pre-exam page");
  assert.match(worker, /"js\/part-guide\.js"/);
  assert.equal(TASKS.partGuide.action, "part-guide");
  assert.ok(BY_DAYS_LEFT[1].includes("partGuide") && BY_DAYS_LEFT[0].includes("partGuide"));
});
