import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VOCABULARY } from "../codex/js/vocabulary.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../codex/styles.css", import.meta.url), "utf8");

test("vocabulary data is intact even though the home page no longer shows a vocabulary card", () => {
  const counts = { 700: 0, 800: 0, 850: 0, 900: 0 };
  for (const group of VOCABULARY) for (const word of group.words) counts[word[3]] += 1;
  assert.deepEqual(counts, { 700: 434, 800: 918, 850: 296, 900: 273 });
  assert.ok(!app.includes('class="card vocabulary-card'), "no vocabulary card on the home page");
  assert.ok(!app.includes('data-action="vocab-open"'), "no vocabulary entry button on the home page");
});

test("abbreviation full forms exist in the vocabulary data", () => {
  const entries = VOCABULARY.flatMap((group) => group.words);
  for (const word of ["cc", "RFP", "Q&A session", "employee ID", "net 30"]) {
    assert.ok(entries.find((entry) => entry[0] === word)?.[5], word);
  }
});

test("vocabulary cover adapts its actions and gold seal for mobile and dark mode", () => {
  assert.match(styles, /\.vocab-stats\s*\{\s*display:\s*grid/);
  assert.match(styles, /\.vocab-actions\s*\.btn\s*\{\s*flex:\s*1\s+1/);
  assert.match(styles, /@media \(prefers-color-scheme: dark\)[\s\S]*?\.vocab-seal/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*?\.vocab-actions \.btn/);
});

test("the common-word filter is accepted as a saved level", () => {
  assert.match(app, /\["all", "pick", "700", "800", "850", "900"\]\.includes\(value\)/);
});
