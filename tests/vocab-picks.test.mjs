import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VOCABULARY } from "../codex/js/vocabulary.js";
import { PICKS } from "../codex/js/vocab-picks.js";
import { selectCards } from "../codex/js/srs.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const level = new Map(VOCABULARY.flatMap((group) => group.words.map((item) => [item[0], item[3]])));

test("every pick is a real headword and none is an advanced-reading (850) word", () => {
  assert.ok(PICKS.size >= 500 && PICKS.size <= 800, `picks ${PICKS.size}`);
  for (const word of PICKS) {
    assert.ok(level.has(word), `${word} is not in the vocabulary`);
    assert.notEqual(level.get(word), 850, `${word} is advanced reading`);
  }
});

test("picks lean on 800 core words and include gold words and the confusable pairs", () => {
  const counts = { 700: 0, 800: 0, 900: 0 };
  for (const word of PICKS) counts[level.get(word)] += 1;
  assert.ok(counts[800] > counts[900] && counts[900] >= 100 && counts[700] <= 80, JSON.stringify(counts));
  for (const word of ["affect", "effect", "invoice", "deadline", "stipulate", "in lieu of", "considerable", "reimburse"]) assert.ok(PICKS.has(word), word);
});

test("flashcards can be limited to picks, and due cards still come first", () => {
  const items = [{ word: "a", level: 800, category: "x", pick: true }, { word: "b", level: 800, category: "x", pick: false }, { word: "c", level: 900, category: "y", pick: true }];
  const now = Date.UTC(2026, 10, 14, 4);
  assert.deepEqual(selectCards(items, {}, { level: "pick", category: "all", limit: 10 }, now).map((x) => x.word), ["a", "c"]);
  const progress = { c: { box: 1, dueAt: now - 1, introducedAt: now - 5 * 86400000 } };
  assert.deepEqual(selectCards(items, progress, { level: "pick", category: "all", limit: 10 }, now).map((x) => x.word), ["c", "a"]);
  assert.deepEqual(selectCards(items, {}, { level: "all", category: "all", limit: 10 }, now).length, 3);
});

test("home page offers the picks filter and a one-tap start", () => {
  assert.match(app, /import \{ PICKS \} from "\.\/vocab-picks\.js"/);
  assert.match(app, /data-vocab-filter="pick">必背精選/);
  assert.match(app, /<option value="pick">必背精選<\/option>/);
  assert.match(app, /data-action="flash-quick">背 10 個精選單字/);
  assert.match(app, /case "flash-quick":/);
});
