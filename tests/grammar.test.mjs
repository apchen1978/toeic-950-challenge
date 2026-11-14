import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GRAMMAR } from "../codex/js/grammar.js";

const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");

test("every grammar topic has a rule, clues, examples, a trap and valid practice items", () => {
  assert.ok(GRAMMAR.length >= 18);
  const questions = GRAMMAR.flatMap((topic) => topic.quiz.map((item) => item.q));
  assert.equal(new Set(questions).size, questions.length, "question text must be unique because saved progress is keyed by it");
  assert.ok(questions.length >= 70);
  const ids = new Set();
  for (const topic of GRAMMAR) {
    assert.ok(!ids.has(topic.id), `duplicate id ${topic.id}`);
    ids.add(topic.id);
    assert.match(topic.title, /[一-鿿]/, topic.id);
    assert.ok(topic.rule.length > 10 && topic.trap.length > 10, topic.id);
    assert.ok(topic.clues.length >= 3, topic.id);
    assert.ok(topic.examples.length >= 3, topic.id);
    for (const [en, zh] of topic.examples) {
      assert.match(en, /[A-Za-z]/, topic.id);
      assert.match(zh, /[一-鿿]/, topic.id);
    }
    assert.ok(topic.quiz.length >= 4, topic.id);
    for (const item of topic.quiz) {
      assert.match(item.q, /____/, `${topic.id} question needs a blank`);
      assert.equal(item.options.length, 4, topic.id);
      assert.equal(new Set(item.options).size, 4, `${topic.id} options repeat`);
      assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4, topic.id);
      assert.match(item.why, /[一-鿿]/, topic.id);
    }
  }
});

test("the answer position is not always the same, so the practice cannot be guessed by pattern", () => {
  const positions = new Set(GRAMMAR.flatMap((topic) => topic.quiz.map((item) => item.answer)));
  assert.ok(positions.size >= 3);
});

test("the subjunctive topic covers the base-form rule the learner asked for", () => {
  const topic = GRAMMAR.find((item) => item.id === "subjunctive");
  assert.ok(topic);
  const text = JSON.stringify(topic);
  for (const word of ["insist", "demand", "recommend", "suggest", "require"]) assert.ok(text.includes(word), word);
  assert.ok(text.includes("be submitted"));
});

test("grammar section is on the home page with a nav pill and a working answer handler", () => {
  assert.match(app, /import \{ GRAMMAR \} from "\.\/grammar\.js"/);
  assert.match(app, /\["nav-grammar", "文法"\]/);
  assert.match(app, /\$\{grammarSection\(\)\}/);
  assert.match(app, /case "grammar-answer":/);
  assert.match(app, /id="nav-grammar"/);
  assert.match(app, /case "grammar-drill": renderGrammarDrill\(\)/);
  assert.match(app, /store\.set\(KEY_GRAMMAR, saved\)/);
  assert.match(app, /data-action="grammar-drill">練 5 題文法/);
});
