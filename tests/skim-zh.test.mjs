import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickReadingSkim } from "../codex/js/eve-study.js";
import { ZH } from "../codex/js/eve-zh.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const zh = /[一-鿿]/;

test("every Part 5-7 skim question and passage has a Chinese translation shown under the English", () => {
  const sections = pickReadingSkim(bank);
  assert.ok(sections.length >= 3);
  for (const section of sections) {
    for (const item of section.items) {
      const docs = item.group.passage?.docs ?? [];
      if (docs.length) {
        const translated = ZH.groups[item.group.id]?.docs;
        assert.ok(translated && translated.length === docs.length, `${item.group.id} needs ${docs.length} translated documents`);
        for (const text of translated) assert.match(text, zh, item.group.id);
      }
      for (const question of item.group.questions.filter((q) => item.questionIds.includes(q.id))) {
        const entry = ZH.questions[question.id];
        assert.ok(entry && zh.test(entry.p), `${question.id} prompt translation`);
        assert.equal(entry.o.length, question.options.length, `${question.id} option translations`);
        for (const option of entry.o) assert.ok(String(option).trim().length > 0, question.id);
        assert.ok(entry.o.some((option) => zh.test(option)) || question.options.every((text) => /^[$0-9,. ]+$/.test(text)), question.id + " needs some Chinese in its options");
      }
    }
  }
});

test("the shown groups list the Chinese translations inside the app and the offline shell", () => {
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
  assert.ok(app.includes("zhPassageHtml(group)") && app.includes("zh-opt"));
  assert.ok(worker.includes("js/eve-zh.js"));
});
