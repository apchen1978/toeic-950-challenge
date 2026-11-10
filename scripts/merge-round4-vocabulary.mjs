import { writeFileSync } from "node:fs";
import { VOCABULARY } from "../codex/js/vocabulary.js";
import { ROUND4_ADDITIONS } from "./round4-additions.mjs";

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
function interleave(words) {
  const core = words.filter((item) => item[3] === 800);
  const gold = words.filter((item) => item[3] === 900);
  if (!core.length || !gold.length) return words.slice();
  const scarce = core.length <= gold.length ? core : gold;
  const plenty = core.length <= gold.length ? gold : core;
  const total = scarce.length + plenty.length;
  const out = new Array(total);
  const used = new Set();
  scarce.forEach((item, index) => {
    let slot = Math.round((index + 0.5) * total / scarce.length - 0.5);
    slot = Math.min(total - 1, Math.max(0, slot));
    while (used.has(slot)) slot = (slot + 1) % total;
    used.add(slot);
    out[slot] = item;
  });
  let cursor = 0;
  for (let index = 0; index < total; index += 1) {
    if (!out[index]) out[index] = plenty[cursor++];
  }
  return out;
}
function longestRun(words) {
  let best = 1;
  let run = 1;
  for (let i = 1; i < words.length; i += 1) {
    run = words[i][3] === words[i - 1][3] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

const seen = new Set();
for (const group of VOCABULARY) {
  for (const item of group.words) {
    for (const form of variants(item[0])) {
      if (seen.has(form)) throw new Error(`existing overlap: ${item[0]}`);
      seen.add(form);
    }
  }
}

const byCategory = new Map(VOCABULARY.map((group) => [group.category, group]));
let added = 0;
for (const [category, items] of Object.entries(ROUND4_ADDITIONS)) {
  const group = byCategory.get(category);
  if (!group) throw new Error(`missing theme ${category}`);
  for (const item of items) {
    if (group.words.some((current) => norm(current[0]) === norm(item[0]))) continue;
    const forms = [...variants(item[0])];
    const hit = forms.find((form) => seen.has(form));
    if (hit) throw new Error(`${item[0]} overlaps an existing entry`);
    for (const form of forms) seen.add(form);
    group.words.push(item);
    added += 1;
  }
}
for (const group of VOCABULARY) group.words = interleave(group.words);

const line = (item) => `    [${item.map((part) => JSON.stringify(part)).join(", ")}]`;
const body = VOCABULARY.map((group) => `  {\n    category: ${JSON.stringify(group.category)},\n    words: [\n${group.words.map(line).join(",\n")}\n    ]\n  }`).join(",\n");
const source = `// Workplace vocabulary. Each entry is [word, Traditional Chinese meaning, example, level] or [word, meaning, example, level, part of speech].\n// 800 = core language for roughly the 730-860 band. 900 = advanced / gold-certificate language. See docs/VOCABULARY_LEVELS.md.\n// Within each theme, 800 and 900 entries are interleaved so the full list is not a long block of one level.\nexport const VOCABULARY = [\n${body}\n];\n`;
writeFileSync(new URL("../codex/js/vocabulary.js", import.meta.url), source);

const counts = { 800: 0, 900: 0 };
for (const group of VOCABULARY) {
  const c = { 800: 0, 900: 0 };
  for (const item of group.words) c[item[3]] += 1;
  counts[800] += c[800];
  counts[900] += c[900];
  const share = c[900] / group.words.length;
  const run = longestRun(group.words);
  console.log(`${group.category} 800=${c[800]} 900=${c[900]} ${(share * 100).toFixed(1)}% run=${run}`);
  if (c[900] === 0 || c[800] === 0 || share < 0.2) throw new Error(`theme out of range: ${group.category}`);
}
console.log("added", added, "total", counts[800] + counts[900], counts);
