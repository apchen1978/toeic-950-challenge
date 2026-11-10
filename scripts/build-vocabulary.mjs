import { writeFileSync } from "node:fs";
import { VOCABULARY } from "../codex/js/vocabulary.js";
import { CORE_CATEGORIES } from "./core-vocabulary.mjs";
import { LEVEL_900 } from "./vocab-level-900.mjs";

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
function line(item) {
  return `    [${item.map((part) => JSON.stringify(part)).join(", ")}]`;
}

const seen = new Set();
function claim(word) {
  const forms = [...variants(word)];
  if (forms.some((form) => seen.has(form))) return false;
  for (const form of forms) seen.add(form);
  return true;
}

const existing = VOCABULARY.filter((group) => !CORE_CATEGORIES.some((core) => core.category === group.category));
const tagged = existing.map((group) => ({
  category: group.category,
  words: group.words.map((item) => {
    const [word, meaning, example, level = LEVEL_900.has(word) ? 900 : 800, pos = ""] = item;
    if (![800, 900].includes(level)) throw new Error(`bad level for ${word}`);
    claim(word);
    return pos ? [word, meaning, example, level, pos] : [word, meaning, example, level];
  })
}));

const rejected = [];
const added = [];
for (const group of CORE_CATEGORIES) {
  const words = [];
  for (const item of group.words) {
    if (item.length !== 5 || item[3] !== 800) throw new Error(`core entry must be 800 with a part of speech: ${item[0]}`);
    if (!claim(item[0])) { rejected.push(item[0]); continue; }
    words.push(item);
    added.push(item[0]);
  }
  if (words.length) added.groups = true;
}
const core = CORE_CATEGORIES.map((group) => ({
  category: group.category,
  words: group.words.filter((item) => added.includes(item[0]))
})).filter((group) => group.words.length);

const all = [...core, ...tagged];
const body = all.map((group) => `  {\n    category: ${JSON.stringify(group.category)},\n    words: [\n${group.words.map(line).join(",\n")}\n    ]\n  }`).join(",\n");
const source = `// Workplace vocabulary. Each entry is [word, Traditional Chinese meaning, example, level] or [word, meaning, example, level, part of speech].\n// 800 = core language for roughly the 730-860 band. 900 = advanced / gold-certificate language. See docs/VOCABULARY_LEVELS.md.\nexport const VOCABULARY = [\n${body}\n];\n`;
writeFileSync(new URL("../codex/js/vocabulary.js", import.meta.url), source);
const counts = { 800: 0, 900: 0 };
for (const group of all) for (const item of group.words) counts[item[3]] += 1;
console.log(JSON.stringify({ added: added.length, rejected, counts, total: counts[800] + counts[900] }, null, 2));
