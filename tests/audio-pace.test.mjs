import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { buildOfficialSequence, sequenceSeconds } from "../codex/js/official-listening.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));

function words(text) {
  return (text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) ?? []).length;
}

function pace(part) {
  let spoken = 0;
  let seconds = 0;
  for (const group of bank.groups) {
    if (group.section !== "listening" || group.part !== part) continue;
    const entry = manifest.groups[group.id];
    let count = group.script.reduce((sum, line) => sum + words(line.text), 0);
    if (part <= 2) count += group.questions[0].options.reduce((sum, option) => sum + 1 + words(option), 0);
    spoken += count;
    seconds += entry.durationSec;
  }
  return spoken / seconds * 60;
}

test("listening files are slower official-pace mono recordings", () => {
  assert.equal(manifest.gapMs, 650);
  assert.match(manifest.rate, /-8%/);
  assert.match(manifest.format, /mono/);
  assert.match(manifest.format, /48 kbps/);
  const wpm = Object.fromEntries([1, 2, 3, 4].map((part) => [part, pace(part)]));
  assert.ok(wpm[3] >= 130 && wpm[3] <= 155, `part 3 ${wpm[3].toFixed(1)} wpm`);
  assert.ok(wpm[4] >= 140 && wpm[4] <= 158, `part 4 ${wpm[4].toFixed(1)} wpm`);
  assert.ok(wpm[1] > 40 && wpm[1] < 120, `part 1 ${wpm[1].toFixed(1)} wpm`);
  assert.ok(wpm[2] > 40 && wpm[2] < 120, `part 2 ${wpm[2].toFixed(1)} wpm`);
  for (const group of bank.groups.filter((item) => item.section === "listening")) {
    const entry = manifest.groups[group.id];
    const file = statSync(new URL(`../codex/${entry.file}`, import.meta.url));
    assert.equal(file.size, entry.bytes, group.id);
    assert.ok(entry.durationSec > 1, group.id);
    const expectedBytes = entry.durationSec * 6000;
    assert.ok(file.size > expectedBytes * 0.6 && file.size < expectedBytes * 1.4, group.id);
  }
});

test("every Part 3 and Part 4 question has its own narrator clip", () => {
  for (const group of bank.groups.filter((item) => item.section === "listening" && item.part >= 3)) {
    const clips = manifest.groups[group.id].questionClips;
    assert.equal(clips.length, group.questions.length, group.id);
    for (const question of group.questions) {
      const clip = clips.find((item) => item.id === question.id);
      assert.ok(clip, question.id);
      assert.equal(clip.role, "N");
      assert.equal(clip.locale, manifest.groups[group.id].locale);
      assert.equal(statSync(new URL(`../codex/${clip.file}`, import.meta.url)).size, clip.bytes);
      assert.ok(clip.durationSec > 0.25, `${question.id} ${clip.durationSec}`);
      if (group.image) assert.equal(clip.graphic, true);
    }
  }
  for (const lesson of [
    "lesson-flight-delay.mp3", "lesson-meeting-change.mp3", "lesson-delivery-update.mp3",
    "lesson-hotel-reservation.mp3", "lesson-invoice-discrepancy.mp3", "lesson-training-session.mp3",
    "lesson-office-maintenance.mp3", "lesson-conference-registration.mp3"
  ]) assert.ok(statSync(new URL(`../codex/audio/${lesson}`, import.meta.url)).size > 1000, lesson);
});

test("official listening length follows the rendered audio for quick forms and a 200-question form", () => {
  const forms = {
    "quick-40": bank.meta.sets.find((set) => set.id === "quick-40").groupIds,
    "quick-60": bank.meta.sets.find((set) => set.id === "quick-60").groupIds,
    "form-a": bank.meta.sets.find((set) => set.id === "form-a").groupIds
  };
  for (const [formId, ids] of Object.entries(forms)) {
    const groups = ids.map((id) => bank.groups.find((group) => group.id === id));
    const steps = buildOfficialSequence(groups, manifest);
    const listening = groups.filter((group) => group.section === "listening");
    const audioSteps = steps.filter((step) => step.type === "audio");
    assert.equal(audioSteps.length, listening.length, formId);
    assert.ok(steps.some((step) => step.type === "question"), formId);
    assert.ok(steps.some((step) => step.durationSec === 5), formId);
    assert.ok(steps.some((step) => step.durationSec === 8 || step.durationSec === 12), formId);
    const seconds = sequenceSeconds(steps);
    assert.ok(seconds > 60, `${formId} ${seconds}`);
    if (formId === "form-a") assert.ok(seconds > 20 * 60 && seconds < 70 * 60, seconds);
  }
});
