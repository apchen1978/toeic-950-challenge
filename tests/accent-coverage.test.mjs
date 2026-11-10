import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const accents = ["US", "UK", "CA", "AU"];

function share(groups) {
  const counts = Object.fromEntries(accents.map((accent) => [accent, 0]));
  let total = 0;
  for (const group of groups) {
    const questions = group.questions.length;
    counts[group.accent] += questions;
    total += questions;
  }
  return { counts, total };
}

test("listening accents stay within 20 to 30 percent in every part and overall", () => {
  const listening = bank.groups.filter((group) => group.section === "listening");
  for (const part of [1, 2, 3, 4, "all"]) {
    const groups = part === "all" ? listening : listening.filter((group) => group.part === part);
    const { counts, total } = share(groups);
    for (const accent of accents) {
      const ratio = counts[accent] / total;
      assert.ok(ratio >= 0.2 && ratio <= 0.3, `part ${part} ${accent} ${(ratio * 100).toFixed(1)}% (${counts[accent]}/${total})`);
    }
    if (part === "all") continue;
    for (let index = 1; index < groups.length; index += 1) {
      assert.notEqual(groups[index].accent, groups[index - 1].accent, `part ${part} run at ${groups[index].id}`);
    }
  }
});

test("every listening question points at a real file and Canadian audio is en-CA", () => {
  const listening = bank.groups.filter((group) => group.section === "listening");
  const questions = listening.reduce((sum, group) => sum + group.questions.length, 0);
  assert.equal(questions, 306);
  for (const group of listening) {
    const entry = manifest.groups[group.id];
    assert.ok(entry, group.id);
    assert.equal(statSync(new URL(`../codex/${entry.file}`, import.meta.url)).size, entry.bytes);
    if (group.accent === "CA") assert.ok(entry.voices.every((voice) => voice.locale === "en-CA" && voice.voice.startsWith("en-CA-")), group.id);
  }
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  assert.match(app, /accent-tag/);
  assert.match(app, /shouldFallbackFromRecording\(audio\.lastErrorCode\(\)\)/);
  const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
  assert.equal(worker.includes(".mp3\""), false);
});

test("Part 1 and Part 2 recordings speak every letter immediately before its option", () => {
  const letters = ["A.", "B.", "C.", "D."];
  for (const group of bank.groups.filter((item) => item.section === "listening" && [1, 2].includes(item.part))) {
    const expected = group.questions[0].options.flatMap((option, index) => [letters[index], option]);
    assert.deepEqual(manifest.groups[group.id].spokenChoices, expected, group.id);
  }
});
