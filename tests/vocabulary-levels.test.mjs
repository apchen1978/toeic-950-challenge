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
    assert.ok(item.length >= 4 && item.length <= 6, item[0]);
    const [word, meaning, example, level, pos = "", full = ""] = item;
    assert.match(word, /[A-Za-z]/, word);
    assert.match(meaning, /[\u4e00-\u9fff]/, word);
    assert.ok(example.length > 20 && /[A-Za-z]/.test(example) && /[.?!]/.test(example), word);
    assert.ok(level === 700 || level === 800 || level === 900, word);
    if (pos) assert.match(pos, /^(n|v|adj|adv|phr|prep|conj|abbr)\.$/, `${word} ${pos}`);
    if (full) assert.match(full, /[A-Za-z]{3,}/, `${word} ${full}`);
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

test("new acronym headwords have an abbreviation label and full form", () => {
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  for (const word of ["FYI", "EOD", "SOP", "RSVP", "ETA", "HR", "FTE", "P.O.", "SKU", "CRM", "PPE", "QC", "NDA", "RFQ", "FAQ", "LOI", "VAT", "WMS", "KPI", "TBC", "CFO", "ROI", "CEO", "R&D", "ASAP"]) {
    const entry = byWord.get(word);
    assert.equal(entry?.[4], "abbr.", word);
    assert.ok(entry?.[5], word);
  }
});

test("the new 800-level entries include a part of speech and the original sentences stay", () => {
  const withPos = entries.filter(({ item }) => item.length === 5);
  const original = entries.filter(({ item }) => item.length === 4);
  assert.equal(original.length, 449);
  assert.ok(withPos.filter(({ item }) => item[3] === 800).length >= 250);
  assert.ok(withPos.every(({ item }) => item[4]));
  assert.equal(entries.length, 1653);
  const levels = { 700: 0, 800: 0, 900: 0 };
  for (const { item } of entries) levels[item[3]] += 1;
  assert.deepEqual(levels, { 700: 453, 800: 698, 900: 502 });
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  assert.equal(byWord.get("contingency")[2], "The team prepared a contingency plan for delivery delays.");
  assert.equal(byWord.get("contingency")[3], 900);
  assert.equal(byWord.get("agenda")[2], "The budget review is the first item on the agenda.");
  assert.equal(byWord.get("agenda")[3], 800);
  assert.equal(byWord.get("invoice")[2], "Please include the purchase order number on the invoice.");
  assert.equal(byWord.get("vacancy")[1], "職缺");
});

test("every theme mixes 800 and 900, with at least 20 percent advanced among scored entries", () => {
  for (const group of VOCABULARY) {
    const counts = { 700: 0, 800: 0, 900: 0 };
    for (const item of group.words) counts[item[3]] += 1;
    assert.ok(counts[800] >= 1 && counts[900] >= 1, group.category);
    const share = counts[900] / (counts[800] + counts[900]);
    assert.ok(share >= 0.2, `${group.category} ${(share * 100).toFixed(1)}%`);
    let run = 1;
    let longest = 1;
    for (let index = 1; index < group.words.length; index += 1) {
      run = group.words[index][3] === group.words[index - 1][3] ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    assert.ok(longest < Math.max(counts[700], counts[800], counts[900]), `${group.category} run ${longest}`);
  }
});

test("common words are new headwords with a meaning, part of speech and an example that uses the word", () => {
  const common = entries.filter(({ item }) => item[3] === 700);
  assert.equal(common.length, 453);
  const heads = entries.map(({ item }) => norm(item[0]));
  assert.equal(new Set(heads).size, heads.length, "no duplicate headwords");
  for (const { item } of common) {
    const [word, meaning, example, , pos] = item;
    assert.ok(word && meaning && example && pos, word);
    assert.match(meaning, /[一-鿿]/, word);
    assert.ok(/[.?!]["”]?$/.test(example), word);
    const stems = [...variants(word.split(" ")[0])];
    assert.ok(stems.some((stem) => norm(example).includes(stem.slice(0, Math.max(3, stem.length - 2)))), `${word} example should use the word`);
  }
});
