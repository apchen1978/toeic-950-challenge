import test from "node:test";
import assert from "node:assert/strict";
import { VOCABULARY } from "../codex/js/vocabulary.js";

const entries = VOCABULARY.flatMap((group) => group.words.map((item) => ({ category: group.category, item })));

function norm(value) {
  return value.toLowerCase().replace(/['’]/g, "").replace(/[-/&]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function variants(value) {
  const base = norm(value);
  const forms = new Set([base]);
  if (base.endsWith("ies") && base.length > 4) forms.add(`${base.slice(0, -3)}y`);
  if (base.endsWith("es") && base.length > 4) forms.add(base.slice(0, -2));
  if (base.endsWith("s") && base.length > 3) forms.add(base.slice(0, -1));
  return forms;
}

test("every vocabulary entry has a headword, Chinese meaning, example, and level", () => {
  assert.ok(entries.length > 449);
  for (const { item } of entries) {
    assert.ok(item.length === 4 || item.length === 5, item[0]);
    const [word, meaning, example, level, pos = ""] = item;
    assert.match(word, /[A-Za-z]/, word);
    assert.match(meaning, /[\u4e00-\u9fff]/, word);
    assert.ok(example.length > 20 && /[A-Za-z]/.test(example) && /[.?!]/.test(example), word);
    assert.ok(level === 800 || level === 900, word);
    if (pos) assert.match(pos, /^(n|v|adj|adv|phr|prep)\.$/, `${word} ${pos}`);
  }
});

test("headwords are unique, including hyphen, spacing, and simple plural variants", () => {
  const seen = new Map();
  for (const { item } of entries) {
    for (const form of variants(item[0])) {
      assert.equal(seen.has(form), false, `${item[0]} overlaps ${seen.get(form)}`);
      seen.set(form, item[0]);
    }
  }
});

test("the new 800-level entries include a part of speech and the original sentences stay", () => {
  const added = entries.filter(({ item }) => item.length === 5);
  const original = entries.filter(({ item }) => item.length === 4);
  assert.equal(original.length, 449);
  assert.ok(added.length >= 250 && added.length <= 350, `new entries ${added.length}`);
  assert.ok(added.every(({ item }) => item[3] === 800 && item[4]));
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  assert.equal(byWord.get("contingency")[2], "The team prepared a contingency plan for delivery delays.");
  assert.equal(byWord.get("contingency")[3], 900);
  assert.equal(byWord.get("agenda")[2], "The budget review is the first item on the agenda.");
  assert.equal(byWord.get("agenda")[3], 800);
  assert.equal(byWord.get("invoice")[2], "Please include the purchase order number on the invoice.");
  assert.equal(byWord.get("vacancy")[1], "職缺");
});
