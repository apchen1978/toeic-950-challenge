import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ULT_PARTS, ULT_DAY_TIPS, ultimateMinutes } from "../codex/js/ultimate.js";
import { ZH } from "../codex/js/eve-zh.js";
import { LESSONS } from "../codex/js/listening-lessons.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const groups = new Map(bank.groups.map((group) => [group.id, group]));
const zh = /[一-鿿]/;

test("the Ultimate Pick covers Part 1 to 7 and fits in 30 minutes", () => {
  assert.deepEqual(ULT_PARTS.map((part) => part.part), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(ultimateMinutes() <= 30, String(ultimateMinutes()));
  assert.equal(ULT_DAY_TIPS.length, 6);
});

test("every Part has English and Chinese tips and a direction in both languages", () => {
  for (const tip of ULT_DAY_TIPS) { assert.ok(/[A-Za-z]/.test(tip.tip) && zh.test(tip.tipZh), tip.en); }
  for (const part of ULT_PARTS) {
    assert.ok(/[A-Za-z]/.test(part.direction.en) && zh.test(part.direction.zh), `P${part.part} direction`);
    assert.ok(part.tips.length >= 2);
    for (const [en, zhText] of part.tips) assert.ok(/[A-Za-z]/.test(en) && zh.test(zhText), `P${part.part} tip`);
  }
});

test("every Ultimate Pick item exists and shows Chinese under its English (passage or script, prompt, options)", () => {
  for (const part of ULT_PARTS) {
    assert.ok(part.items.length >= 1, `P${part.part} has items`);
    for (const item of part.items) {
      let questions;
      let hasEnglishBody = false;
      if (item.kind === "lesson") {
        const lesson = LESSONS.find((x) => x.id === item.id);
        assert.ok(lesson, item.id);
        assert.ok(ZH.lessons?.[item.id]?.transcript && zh.test(ZH.lessons[item.id].transcript), `${item.id} transcript translation`);
        questions = lesson.questions;
        hasEnglishBody = true;
      } else {
        const group = groups.get(item.id);
        assert.ok(group, item.id);
        questions = group.questions;
        const docs = group.passage?.docs ?? [];
        if (docs.length) assert.equal(ZH.groups[item.id]?.docs?.length, docs.length, `${item.id} translated documents`);
        else if (group.part >= 2 && group.part <= 4) assert.ok(zh.test(ZH.groups[item.id]?.script ?? ""), `${item.id} script translation`);
        hasEnglishBody = true;
      }
      assert.ok(hasEnglishBody);
      for (const question of questions) {
        const entry = ZH.questions[question.id];
        assert.ok(entry && zh.test(entry.p), `${question.id} prompt translation`);
        assert.equal(entry.o.length, question.options.length, `${question.id} option translations`);
        assert.ok(entry.o.every((text) => String(text).trim().length > 0), question.id);
      }
    }
  }
});

test("the home page shows one Ultimate Pick card and folds everything longer than 30 minutes", () => {
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  assert.equal(app.split('data-action="ultimate"').length - 1, 1, "exactly one Ultimate Pick start button");
  assert.ok(!app.includes('data-form="mini-eve"') && !app.includes('data-form="mini-last"') && !app.includes('data-action="eve-study"'), "old long sprint buttons are gone from the home page");
  assert.ok(app.includes("case \"ultimate\": renderUltimate()"));
});
