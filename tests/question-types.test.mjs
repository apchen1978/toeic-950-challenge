import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { QUESTION_TYPES, questionTypeInfo, typeHintVisible, normalizeTypeMode, TYPE_MODES } from "../codex/js/question-types.js";
import { TIP_SECTIONS } from "../codex/js/tips.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");

test("every question type used in the bank has a label and a hint, so new types cannot slip through", () => {
  const used = new Set();
  for (const g of bank.groups) for (const q of g.questions) used.add(`${g.part}|${q.questionType}`);
  for (const key of used) {
    const [part, type] = key.split("|");
    const info = questionTypeInfo(type, Number(part));
    assert.ok(info && info.label && info.hint, `missing type info for part ${part} ${type}`);
  }
});

test("detail and main-purpose hints differ between listening and reading", () => {
  assert.notEqual(questionTypeInfo("detail", 3).hint, questionTypeInfo("detail", 7).hint);
  assert.notEqual(questionTypeInfo("main-purpose", 4).hint, questionTypeInfo("main-purpose", 7).hint);
  assert.equal(questionTypeInfo("unknown-type", 7), null);
  assert.equal(questionTypeInfo(undefined, 7), null);
});

test("insertion questions explain the clue-word method", () => {
  assert.match(questionTypeInfo("text-insertion", 7).hint, /However|代名詞/);
  assert.match(questionTypeInfo("sentence-insertion", 6).hint, /連接詞/);
});

test("hints are low-pressure and short", () => {
  for (const [type, entry] of Object.entries(QUESTION_TYPES)) {
    for (const info of entry.listening ? [entry.listening, entry.reading] : [entry]) {
      assert.ok(info.hint.length <= 60, `${type} hint too long (${info.hint.length})`);
      assert.ok(!/必須|一定要|落後|警告/.test(info.hint), type);
    }
  }
});

test("type-hint modes: default shows in practice only, 'all' includes official mocks, 'off' hides everywhere", () => {
  assert.equal(typeHintVisible("practice", false), true);
  assert.equal(typeHintVisible("practice", true), false);
  assert.equal(typeHintVisible("all", true), true);
  assert.equal(typeHintVisible("all", false), true);
  assert.equal(typeHintVisible("off", false), false);
  assert.equal(typeHintVisible("off", true), false);
  assert.equal(typeHintVisible(undefined, false), true, "unknown or missing mode falls back to the default");
  assert.equal(typeHintVisible("garbage", true), false);
  assert.equal(normalizeTypeMode("all"), "all");
  assert.equal(normalizeTypeMode(null), "practice");
  assert.deepEqual(TYPE_MODES.map(([id]) => id), ["practice", "all", "off"]);
});

test("app wires type chips into the question view and the results view; Part 7 has an insertion tip", () => {
  for (const needle of ["typeChipHtml(q, qs.find((x) => x.id === q.id)?.part, true, true)", "typeChipHtml(q, g.part, false)", "function typeChipHtml"]) assert.ok(app.includes(needle), needle);
  assert.match(worker, /"js\/question-types\.js"/);
  const p7 = TIP_SECTIONS.find((s) => s.part === 7);
  const tip = p7.tips.find((t) => /插入句/.test(t.title));
  assert.ok(tip && /個人整理，非官方/.test(tip.title) && /不是規則/.test(tip.why));
});

test("switch is wired: control in the test view and tips card, change handler, CSS rules, no re-render", () => {
  for (const needle of ["typeModeControlHtml()", 'e.target.id === "type-mode"', "function applyTypeMode()", "typeHintVisible(typeMode(), session?.official)", 'class="not-hint test-type-line"']) assert.ok(app.includes(needle), needle);
  assert.ok(app.split("typeModeControlHtml()").length >= 4, "used in the test view and the home tips card");
  const handler = app.slice(app.indexOf('e.target.id === "type-mode"'), app.indexOf('e.target.id === "type-mode"') + 160);
  assert.ok(!/renderTest|renderHome/.test(handler), "changing the switch must not redraw the screen (audio keeps playing)");
  const css = readFileSync(new URL("../codex/styles.css", import.meta.url), "utf8");
  assert.ok(css.includes('#app[data-type-mode="off"] .type-line') && css.includes('#app[data-type-show-test="0"] .test-type-line'));
});
