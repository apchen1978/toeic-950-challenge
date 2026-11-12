import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VOCABULARY } from "../codex/js/vocabulary.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../codex/styles.css", import.meta.url), "utf8");

test("home vocabulary feature derives its totals from the data and keeps direct study actions", () => {
  const counts = { 700: 0, 800: 0, 900: 0 };
  for (const group of VOCABULARY) for (const word of group.words) counts[word[3]] += 1;
  assert.deepEqual(counts, { 700: 434, 800: 698, 900: 502 });
  assert.match(app, /const vocab = vocabCounts\(\)/);
  assert.match(app, /const vocabTotal = vocab\[700\] \+ vocab\[800\] \+ vocab\[900\]/);
  assert.match(app, /職場字彙 <span>1000\+<\/span>/);
  assert.match(app, /data-vocab-filter="700">常考單字/);
  assert.match(app, /class="card vocabulary-card"/);
  assert.match(app, /data-action="vocab-open"/);
  assert.match(app, /data-action="vocab-gold"/);
  assert.match(app, /case "vocab-gold":\s*\{\s*store\.set\(KEY_VOCAB_LEVEL, "900"\)/);
  assert.match(app, /list\.open = true/);
});

test("abbreviation full forms appear next to headwords in the list and flashcards", () => {
  const entries = VOCABULARY.flatMap((group) => group.words);
  for (const word of ["cc", "RFP", "Q&A session", "employee ID", "net 30"]) {
    assert.ok(entries.find((entry) => entry[0] === word)?.[5], word);
  }
  assert.match(app, /function vocabName\(item\)/);
  assert.match(app, /esc\(item\.full\)/);
  assert.match(app, /<b>\$\{vocabName\(entry\)\}<\/b>/);
  assert.match(app, /<h1>\$\{vocabName\(item\)\}<\/h1>/);
});

test("vocabulary cover adapts its actions and gold seal for mobile and dark mode", () => {
  assert.match(styles, /\.vocab-stats\s*\{\s*display:\s*grid/);
  assert.match(styles, /\.vocab-actions\s*\.btn\s*\{\s*flex:\s*1\s+1/);
  assert.match(styles, /@media \(prefers-color-scheme: dark\)[\s\S]*?\.vocab-seal/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*?\.vocab-actions \.btn/);
});

test("the common-word filter is accepted as a saved level", () => {
  assert.match(app, /\["all", "700", "800", "900"\]\.includes\(value\)/);
});
