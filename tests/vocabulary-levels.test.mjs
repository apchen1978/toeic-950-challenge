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
    assert.ok(level === 700 || level === 800 || level === 850 || level === 900, word);
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
  assert.equal(entries.length, 1921);
  const levels = { 700: 0, 800: 0, 850: 0, 900: 0 };
  for (const { item } of entries) levels[item[3]] += 1;
  assert.deepEqual(levels, { 700: 434, 800: 918, 850: 296, 900: 273 });
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  assert.equal(byWord.get("contingency")[2], "The team prepared a contingency plan for delivery delays.");
  assert.equal(byWord.get("contingency")[3], 900);
  assert.equal(byWord.get("agenda")[2], "The budget review is the first item on the agenda.");
  assert.equal(byWord.get("agenda")[3], 800);
  assert.equal(byWord.get("invoice")[2], "Please include the purchase order number on the invoice.");
  assert.equal(byWord.get("vacancy")[1], "職缺");
});

test("gold 900 is reserved for words likely to be tested; rarely tested terms sit in 850 advanced reading", () => {
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  for (const word of ["demurrage", "dunnage", "takt time", "garden leave", "secondment", "lookalike audience", "bullwhip effect", "without prejudice"]) {
    assert.equal(byWord.get(word)?.[3], 850, word);
  }
  for (const word of ["contingency", "stipulate", "in lieu of", "pursuant to", "accrue", "reimburse", "renowned", "lucrative"]) {
    assert.equal(byWord.get(word)?.[3], 900, word);
  }
  for (const word of ["CEO", "CFO", "R&D", "ROI"]) assert.equal(byWord.get(word)?.[3], 800, word);
  const gold = entries.filter(({ item }) => item[3] === 900).length;
  assert.ok(gold >= 250 && gold <= 300, `gold count ${gold}`);
});

test("every theme mixes levels without long single-level runs", () => {
  for (const group of VOCABULARY) {
    const counts = { 700: 0, 800: 0, 850: 0, 900: 0 };
    for (const item of group.words) counts[item[3]] += 1;
    assert.ok(counts[800] >= 1, group.category);
    let run = 1;
    let longest = 1;
    for (let index = 1; index < group.words.length; index += 1) {
      run = group.words[index][3] === group.words[index - 1][3] ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    if (group.words.length >= 20) assert.ok(longest < Math.max(counts[700], counts[800], counts[850], counts[900]), `${group.category} run ${longest}`);
    let commonRun = 0;
    for (const item of group.words) {
      commonRun = item[3] === 700 ? commonRun + 1 : 0;
      assert.ok(commonRun <= 3, `${group.category} has more than three common words in a row`);
    }
    const common = group.words.filter((item) => item[3] === 700);
    if (common.length) {
      const half = Math.floor(group.words.length / 2);
      const firstHalf = group.words.slice(0, half).filter((item) => item[3] === 700).length;
      assert.ok(firstHalf >= Math.floor(common.length / 3), `${group.category} common words are bunched at the end`);
    }
  }
});

test("common words have no overlap with each other or with existing words, and short examples are gone", () => {
  const common = entries.filter(({ item }) => item[3] === 700).map(({ item }) => item);
  for (const item of common) assert.ok(item[2].split(/\s+/).length >= 6, `${item[0]} example is too short`);
  const banned = ["copy machine", "helmet", "sign up", "responsible for", "one-way", "follow up", "apologize", "hold on", "repairman", "reserve", "inspect", "power", "delayed", "attach", "recycle", "warn", "chair", "window", "door", "wall", "ceiling", "roof", "fence", "garden", "money", "wallet", "dollar", "morning", "afternoon", "hour", "next week", "easy", "difficult", "important", "useful", "try", "fun", "photo", "trash can"];
  const heads = new Set(entries.map(({ item }) => norm(item[0])));
  for (const word of banned) assert.equal(heads.has(norm(word)), false, word);
  const byWord = new Map(entries.map(({ item }) => [item[0], item]));
  assert.match(byWord.get("welcome")[2], /^Please welcome/);
  assert.match(byWord.get("busy line")[2], /busy line/);
  assert.equal(byWord.get("online")[4], "adv.");
  assert.equal(byWord.get("correct")[4], "v.");
  assert.ok(byWord.has("repair person"));
});

test("common words are new headwords with a meaning, part of speech and an example that uses the word", () => {
  const common = entries.filter(({ item }) => item[3] === 700);
  assert.equal(common.length, 434);
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
