import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PREEXAM_PRINCIPLE, PREEXAM_BLOCKS, PREEXAM_WARMUP, PREEXAM_TRAPS, PREEXAM_PACE, PREEXAM_RESCUE, PREEXAM_SOURCES } from "../codex/js/preexam.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const zh = /[一-鿿]/;

test("the pre-exam routine runs in time order and every item can be ticked off", () => {
  assert.deepEqual(PREEXAM_BLOCKS.map((block) => block.id), ["leave", "road", "gate", "seat"]);
  const ids = [];
  for (const block of PREEXAM_BLOCKS) {
    assert.match(block.when, zh);
    assert.ok(block.items.length >= 3, block.id);
    for (const item of block.items) { assert.match(item.text, zh, item.id); ids.push(item.id); }
  }
  assert.equal(new Set(ids).size, ids.length, "item ids must be unique because ticks are saved by id");
  assert.match(PREEXAM_PRINCIPLE, zh);
});

test("it never states test-centre rules as fact and tells people to check their exam notice", () => {
  const text = JSON.stringify(PREEXAM_BLOCKS);
  assert.ok(text.includes("考試通知"));
  assert.ok(!/一定要帶|必須攜帶/.test(text));
});

test("the warm-up buttons point at real actions in the app", () => {
  assert.equal(PREEXAM_WARMUP.length, 4);
  for (const { action } of PREEXAM_WARMUP) assert.ok(app.includes(`case "${action}"`), `${action} has no handler`);
});

test("there are ten traps covering listening, grammar and Part 7, plus pacing, rescue tips and sources", () => {
  assert.equal(PREEXAM_TRAPS.length, 10);
  assert.equal(new Set(PREEXAM_TRAPS.map((trap) => trap.id)).size, 10);
  const parts = PREEXAM_TRAPS.map((trap) => trap.part).join(" ");
  for (const part of ["Part 1", "Part 2", "Part 3/4", "Part 5", "Part 7"]) assert.ok(parts.includes(part), part);
  assert.ok(PREEXAM_TRAPS.some((trap) => /insist/.test(trap.body) && /原形/.test(trap.body)));
  assert.ok(PREEXAM_PACE.rows.length >= 4 && PREEXAM_PACE.note.includes("調整"));
  assert.ok(PREEXAM_RESCUE.length >= 3);
  assert.ok(PREEXAM_SOURCES.length >= 4);
  for (const source of PREEXAM_SOURCES) assert.match(source.href, /^https:\/\//);
});

test("the home page opens with the 30-minute Ultimate Pick, then the exam-day card, today, review and the folded mocks, each with its own nav pill (Paul, 2026-11-29)", () => {
  assert.ok(app.includes('["nav-ult", "精選"], ["nav-preexam", "考前"]'));
  assert.ok(app.includes('["nav-mock", "模考"]'));
  const ult = app.indexOf('id="nav-ult"');
  const card = app.indexOf("${preExamCard()}");
  const today = app.indexOf("${todayStrip(");
  const mock = app.indexOf('id="nav-mock"');
  assert.ok(ult > 0 && card > ult && today > card && mock > today, "order must be Ultimate Pick, exam-day card, today, then the mock fold");
  for (const action of ["preexam-open", "preexam-reset", "start-warmup", "preexam-tick"]) assert.ok(app.includes(action), action);
  assert.ok(app.includes('from "./preexam.js"') && app.includes("PREEXAM_BLOCKS"));
  assert.ok(app.includes('data-action="ultimate"') && app.includes("function renderUltimate"));
});

test("compact home: nav follows page order; practice longer than 30 minutes is folded away", () => {
  assert.ok(app.includes('["nav-ult", "精選"], ["nav-preexam", "考前"], ["nav-review", "複習"], ["nav-more", "更多練習"], ["nav-phrases", "片語"]'));
  assert.ok(app.includes('["nav-practice", "練習"], ["nav-mock", "模考"]];'));
  assert.ok(app.indexOf('<section class="card" id="nav-review">') > app.indexOf("${preExamCard()}"), "review comes after the first blocks");
  assert.ok(app.includes('<details class="card fold more-details" id="nav-more">'), "more practice is folded");
  assert.ok(app.includes('<details class="card fold more-details" id="nav-mock">'), "full mocks are folded");
  assert.ok(app.indexOf('id="offline-card"') > app.indexOf("${phrasesSection()}"), "offline card moves below the study sections");
});

test("home page order: Ultimate Pick, exam-day card, today strip, last result, wrong-answer analysis, tips, folded practice, study sections, folded mocks", () => {
  const markers = [
    'id="nav-ult"', "${preExamCard()}", "${todayStrip(", 'id="plan-card"', "<h2>最近成績</h2>", 'id="nav-review"', "<h2>錯題複習</h2>", 'class="card tips-card"',
    'id="nav-more"', "${phrasesSection()}", "${grammarSection()}",
    'id="nav-mock"', 'class="card reading-full-card"', 'id="nav-listening-mock"', "<h2>四套 200 題計時練習</h2>", 'id="offline-card"', "<h2>題庫說明與其他練習</h2>", "<h2>作答紀錄</h2>"
  ];
  const at = markers.map((m) => [m, app.indexOf(m)]);
  for (const [m, i] of at) assert.ok(i > 0, "missing " + m);
  for (let k = 1; k < at.length; k += 1) assert.ok(at[k][1] > at[k - 1][1], at[k][0] + " must come after " + at[k - 1][0]);
  assert.ok(app.indexOf("${session ? resumeCard()") < app.indexOf('id="nav-ult"'), "an unfinished session shows its resume card above everything else");
});
