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

test("the home page shows review, then the pre-exam card, then the mock, each with its own nav pill", () => {
  assert.match(app, /\["nav-preexam", "考前"\]/);
  assert.match(app, /\["nav-mock", "模考"\]/);
  const today = app.indexOf("${todayStrip(");
  const card = app.indexOf("${preExamCard()}");
  const mock = app.indexOf('id="nav-mock"');
  assert.ok(today > 0 && card > today && mock > card, "order must be today, pre-exam, mock");
  for (const action of ["preexam-open", "preexam-reset", "start-warmup", "preexam-tick"]) assert.ok(app.includes(action), action);
  assert.match(app, /import \{[^}]*PREEXAM_BLOCKS[^}]*\} from "\.\/preexam\.js"/);
});

test("compact home: review sits above the pre-exam card, nav follows page order and includes 快練", () => {
  const review = app.indexOf('<section class="card" id="nav-review">');
  const card = app.indexOf("${preExamCard()}");
  assert.ok(review > 0 && review < card, "review must come before the pre-exam card");
  assert.match(app, /\["nav-review", "複習"\], \["nav-preexam", "考前"\], \["nav-mini", "快練"\], \["nav-phrases", "片語"\]/);
  assert.match(app, /\["nav-practice", "練習"\], \["nav-mock", "模考"\]\];/);
  assert.ok(app.indexOf('id="offline-card"') > app.indexOf("${phrasesSection()}"), "offline card moves below the study sections");
});

test("home page runs from light to heavy: last result, wrong-answer analysis, tips, quick practice, mocks, then the 200-question forms", () => {
  const markers = [
    "${todayStrip(", 'id="plan-card"', "<h2>最近成績</h2>", 'id="nav-review"', "<h2>錯題複習</h2>", "${preExamCard()}", 'class="card tips-card"',
    'id="nav-mini"', "${phrasesSection()}", 'id="nav-vocab"', "${grammarSection()}", 'class="card quick-card"',
    'class="card reading-full-card"', 'id="nav-listening-mock"', 'id="offline-card"', "<h2>四套 200 題計時練習</h2>", "<h2>題庫說明與其他練習</h2>", "<h2>作答紀錄</h2>"
  ];
  const at = markers.map((m) => [m, app.indexOf(m)]);
  for (const [m, i] of at) assert.ok(i > 0, "missing " + m);
  for (let i = 1; i < at.length; i += 1) assert.ok(at[i][1] > at[i - 1][1], at[i][0] + " must come after " + at[i - 1][0]);
  assert.ok(app.indexOf("${session ? resumeCard()") < app.indexOf('id="plan-card"'), "resume card comes right after the today strip");
});
