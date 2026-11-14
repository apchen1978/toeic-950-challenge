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

test("the home page shows the pre-exam card second, right after the today strip, with its own nav pill", () => {
  assert.match(app, /\["nav-preexam", "考前"\], \["nav-mock", "模考"\]/);
  const today = app.indexOf("${todayStrip(");
  const card = app.indexOf("${preExamCard()}");
  const mock = app.indexOf('id="nav-mock"');
  assert.ok(today > 0 && card > today && mock > card, "order must be today, pre-exam, mock");
  for (const action of ["preexam-open", "preexam-reset", "start-warmup", "preexam-tick"]) assert.ok(app.includes(action), action);
  assert.match(app, /import \{[^}]*PREEXAM_BLOCKS[^}]*\} from "\.\/preexam\.js"/);
});
