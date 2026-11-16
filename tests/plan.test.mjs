import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TASKS, BY_DAYS_LEFT, DAY_TITLES, GENERIC_DAY, daysBetween, addDays, dayPlan, fullPlan, toggleDone, toISO } from "../codex/js/plan.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");

test("every day from 13 days out to exam day has a plan with known tasks and a title", () => {
  for (let left = 0; left <= 13; left += 1) {
    assert.ok(BY_DAYS_LEFT[left]?.length, `day ${left}`);
    assert.ok(DAY_TITLES[left], `title ${left}`);
    for (const key of BY_DAYS_LEFT[left]) assert.ok(TASKS[key], `${left}: ${key}`);
  }
  for (const key of GENERIC_DAY) assert.ok(TASKS[key], key);
});

test("plan is reading-first: reading mocks start today, listening only maintained, both practised in the last 3 days", () => {
  const keysFor = (from, to) => { const out = []; for (let l = from; l >= to; l -= 1) out.push(...BY_DAYS_LEFT[l]); return out; };
  const all = keysFor(13, 0);
  const listening = all.filter((k) => /^listen/.test(k));
  const reading = all.filter((k) => /^read/.test(k));
  assert.ok(listening.length >= 2 && listening.length <= 3, `listening ${listening}`);
  assert.ok(reading.length >= 3 && reading.length <= 4, `reading ${reading}`);
  assert.ok(reading.length > listening.length, "more full reading mocks than listening mocks");
  assert.deepEqual(BY_DAYS_LEFT[13].filter((k) => /^read/.test(k)), ["read1"], "the first full reading mock is today (13 days out)");
  const last3 = keysFor(3, 1);
  assert.ok(last3.some((k) => /^listen/.test(k)) && last3.some((k) => /^read/.test(k)));
  assert.deepEqual(BY_DAYS_LEFT[1].filter((k) => /^(listen|read)/.test(k)), [], "the day before the exam has no full mock");
  assert.ok(BY_DAYS_LEFT[0].includes("preexam"));
});

test("no day stacks more than one full mock and heavy days stay light otherwise", () => {
  for (let left = 0; left <= 13; left += 1) {
    const plan = dayPlan(left);
    const big = plan.tasks.filter((t) => t.minutes >= 40);
    assert.ok(big.length <= 1, `day ${left}`);
    if (big.length) assert.ok(plan.minutes <= 42 + 75 + 5 && plan.tasks.length <= 3, `day ${left} total ${plan.minutes}`);
  }
});

test("weak-skill task uses the weakest skill, or falls back to a 40-question quick mock", () => {
  const withWeak = dayPlan(12, { weakSkill: "r-detail" }).tasks.find((t) => t.key === "weak");
  assert.equal(withWeak.action, "practice");
  assert.equal(withWeak.attrs.skill, "r-detail");
  const without = dayPlan(12).tasks.find((t) => t.key === "weak");
  assert.equal(without.action, "start-form");
  assert.equal(without.attrs.form, "quick-40");
});

test("dates: days between, adding days, exam day and after", () => {
  assert.equal(daysBetween("2026-11-16", "2026-11-29"), 13);
  assert.equal(daysBetween("2026-11-29", "2026-11-29"), 0);
  assert.equal(daysBetween("2026-11-30", "2026-11-29"), -1);
  assert.equal(addDays("2026-11-16", 13), "2026-11-29");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(toISO(new Date(2026, 10, 5)), "2026-11-05");
  assert.equal(dayPlan(-1).over, true);
  assert.equal(fullPlan(13).length, 14);
  assert.equal(dayPlan(20).tasks.length, GENERIC_DAY.length);
});

test("done state toggles per date and keeps only the latest 30 days", () => {
  let done = toggleDone({}, "2026-11-16", "review");
  assert.deepEqual(done["2026-11-16"], ["review"]);
  done = toggleDone(done, "2026-11-16", "speed");
  done = toggleDone(done, "2026-11-16", "review");
  assert.deepEqual(done["2026-11-16"], ["speed"]);
  let many = {};
  for (let i = 1; i <= 40; i += 1) many = toggleDone(many, addDays("2026-10-01", i), "x");
  assert.equal(Object.keys(many).length, 30);
});

test("every task action has a click handler on the home page and the card is wired in", () => {
  const actions = new Set(Object.values(TASKS).map((t) => t.action).filter(Boolean));
  for (const action of actions) assert.ok(app.includes(`case "${action}"`), action);
  assert.ok(app.includes('case "plan-toggle"'));
  assert.ok(app.includes('id="plan-card"'));
  assert.ok(app.indexOf('id="plan-card"') > app.indexOf("${todayStrip("));
  assert.match(worker, /"js\/plan\.js"/);
});

test("plan wording stays low-pressure", () => {
  for (const text of [app.slice(app.indexOf("function planCardInner"), app.indexOf("function paintPlan"))]) {
    assert.ok(text.includes("這只是參考"));
    assert.ok(!/落後|必須|一定要|警告/.test(text));
  }
});
