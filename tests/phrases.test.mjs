import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COLLOCATIONS, PARAPHRASES, EMAIL_PHRASES, clozeOf } from "../codex/js/phrases.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");

test("every collocation has a blankable keyword that appears once in its example", () => {
  const seen = new Set();
  for (const item of COLLOCATIONS) {
    assert.equal(item.length, 5, item[0]);
    assert.ok(item.every((x) => typeof x === "string" && x.trim()), item[0]);
    assert.ok(item[2].includes(item[4]), `${item[0]}: keyword missing in example`);
    assert.ok(clozeOf(item).includes("_____") && !clozeOf(item).includes(item[4] + " ") || clozeOf(item).includes("_____"), item[0]);
    assert.equal(seen.has(item[0]), false, `duplicate ${item[0]}`);
    seen.add(item[0]);
  }
  assert.ok(COLLOCATIONS.length >= 60);
  assert.equal(new Set(COLLOCATIONS.map((c) => c[1])).size, COLLOCATIONS.length, "duplicate Chinese meaning would make the drill ambiguous");
});

test("paraphrase and email lists are complete pairs", () => {
  for (const row of PARAPHRASES) assert.ok(row.length === 3 && row.every((x) => x.trim()), row[0]);
  for (const row of EMAIL_PHRASES) assert.ok(row.length === 2 && row.every((x) => x.trim()), row[0]);
});

test("phrases card stays visible in focus mode and is cached by the service worker", () => {
  assert.match(app, /class="card phrases-card" id="nav-phrases"/);
  assert.match(app, /\$\{phrasesSection\(\)\}/);
  assert.match(worker, /"js\/phrases\.js"/);
});
