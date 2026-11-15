import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOfficialSequence, sequenceSeconds, isOfficialForm, isListeningFullForm } from "../codex/js/official-listening.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
const groups = new Map(bank.groups.map((g) => [g.id, g]));
const sets = [1, 2].map((n) => bank.meta.sets.find((s) => s.id === `listen-full-${n}`));
const ACCENTS = ["US", "UK", "CA", "AU"];

test("both curated listening sets exist, are listening-only and follow the official part counts", () => {
  for (const set of sets) {
    assert.ok(set, "set missing");
    const list = set.groupIds.map((id) => groups.get(id));
    assert.ok(list.every((g) => g && g.section === "listening"));
    assert.equal(new Set(set.groupIds).size, set.groupIds.length);
    const byPart = [1, 2, 3, 4].map((p) => list.filter((g) => g.part === p).reduce((sum, g) => sum + g.questions.length, 0));
    assert.deepEqual(byPart, [6, 25, 39, 30]);
    const parts = list.map((g) => g.part);
    assert.deepEqual(parts, parts.slice().sort((a, b) => a - b), "groups run Part 1 to Part 4 in order");
    assert.ok(set.groupIds.every((id) => manifest.groups[id]), "every group has recorded audio");
  }
});

test("the two sets share no group and balance the four accents in every part", () => {
  const [a, b] = sets.map((s) => new Set(s.groupIds));
  assert.deepEqual([...a].filter((id) => b.has(id)), []);
  for (const set of sets) {
    for (const part of [1, 2, 3, 4]) {
      const counts = ACCENTS.map((acc) => set.groupIds.map((id) => groups.get(id)).filter((g) => g.part === part && g.accent === acc).length);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `part ${part} accents ${counts}`);
    }
    const list = set.groupIds.map((id) => groups.get(id));
    for (const part of [3, 4]) assert.ok(list.filter((g) => g.part === part && (g.image || g.graphic || g.questions.some((q) => q.graphic))).length >= 2, `graphic items in part ${part}`);
  }
});

test("official sequence length is close to a real listening section", () => {
  for (const set of sets) {
    const minutes = sequenceSeconds(buildOfficialSequence(set.groupIds.map((id) => groups.get(id)), manifest)) / 60;
    assert.ok(minutes >= 38 && minutes <= 46, `${set.id}: ${minutes.toFixed(1)} min`);
    assert.ok(Math.abs(set.durationMin - minutes) <= 1, "label minutes match the computed length");
  }
});

test("listening-full forms run as official listening sets from the home page", () => {
  assert.ok(isListeningFullForm("listen-full-1") && isListeningFullForm("listen-full-2") && !isListeningFullForm("listen-full-3"));
  assert.ok(isOfficialForm("listen-full-1") && isOfficialForm("listen-full-2"));
  assert.ok(app.includes("isListeningFullForm(d.form)"));
  assert.ok(app.includes('id="nav-listening-mock"'));
  assert.ok(app.includes('section: "listening"'));
});
