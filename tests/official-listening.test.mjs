import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flatten } from "../codex/js/scoring.js";
import { getListenRate, setListenRate } from "../codex/js/audio.js";
import {
  OFFICIAL_PAUSES,
  allowsReplay,
  buildOfficialSequence,
  isOfficialForm,
  normalizeListenRate,
  playbackRateFor,
  remainingSeconds,
  sequenceSeconds
} from "../codex/js/official-listening.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));

function group(part, id, questions, extra = {}) {
  return {
    id,
    section: "listening",
    part,
    questions: questions.map((qid) => ({ id: qid, prompt: qid })),
    ...extra
  };
}

const manifest = {
  groups: {
    p1: { file: "audio/p1.mp3", durationSec: 12, questionClips: [] },
    p2: { file: "audio/p2.mp3", durationSec: 8 },
    talk: {
      file: "audio/talk.mp3",
      durationSec: 30,
      questionClips: [
        { id: "q1", file: "audio/q-q1.mp3", durationSec: 3, graphic: false },
        { id: "q2", file: "audio/q-q2.mp3", durationSec: 4, graphic: false }
      ]
    },
    map: {
      file: "audio/map.mp3",
      durationSec: 20,
      questionClips: [
        { id: "m1", file: "audio/q-m1.mp3", durationSec: 3, graphic: true }
      ]
    }
  }
};

test("official sequence uses 5s, 8s, and 12s pauses and does not split groups", () => {
  const groups = [
    group(1, "p1", ["photo"]),
    group(2, "p2", ["response"]),
    group(3, "talk", ["q1", "q2"]),
    group(4, "map", ["m1"], { image: "images/campus-route.svg" })
  ];
  const steps = buildOfficialSequence(groups, manifest);
  assert.deepEqual(steps.map((step) => [step.type, step.durationSec, step.groupId]), [
    ["audio", 12, "p1"],
    ["pause", OFFICIAL_PAUSES.item, "p1"],
    ["audio", 8, "p2"],
    ["pause", OFFICIAL_PAUSES.item, "p2"],
    ["audio", 30, "talk"],
    ["question", 3, "talk"],
    ["pause", OFFICIAL_PAUSES.question, "talk"],
    ["question", 4, "talk"],
    ["pause", OFFICIAL_PAUSES.question, "talk"],
    ["audio", 20, "map"],
    ["question", 3, "map"],
    ["pause", OFFICIAL_PAUSES.graphic, "map"]
  ]);
  assert.equal(OFFICIAL_PAUSES.item, 5);
  assert.equal(OFFICIAL_PAUSES.question, 8);
  assert.equal(OFFICIAL_PAUSES.graphic, 12);
  assert.equal(sequenceSeconds(steps), 12 + 5 + 8 + 5 + 30 + 3 + 8 + 4 + 8 + 20 + 3 + 12);
  assert.equal(remainingSeconds(steps, 4, 10), sequenceSeconds(steps) - (12 + 5 + 8 + 5) - 10);
  assert.equal(steps.filter((step) => step.groupId === "talk" && step.type === "question").length, 2);
});

test("official listening plays once at 1.0x and practice keeps the stored rate", () => {
  assert.equal(allowsReplay({ official: true, phase: "listening" }), false);
  assert.equal(allowsReplay({ official: true, phase: "reading" }), true);
  assert.equal(allowsReplay({ phase: "listening" }), true);
  assert.equal(playbackRateFor({ official: true }, 0.9), 1);
  assert.equal(playbackRateFor({ official: false }, 0.9), 0.9);
  assert.equal(normalizeListenRate(undefined), 1);
  assert.equal(normalizeListenRate(0.85), 1);
  assert.equal(normalizeListenRate(1.1), 1.1);
  for (const formId of ["quick-40", "quick-60", "form-a", "form-b", "form-c"]) assert.equal(isOfficialForm(formId), true);
  assert.equal(isOfficialForm("photo-pilot"), false);
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  assert.match(app, /正式模式：每題只播一次，依正式考試停頓/);
  assert.match(app, /allowsReplay\(session\)/);
  assert.match(app, /preservesPitch|player\.preservesPitch/);
  const player = readFileSync(new URL("../codex/js/audio.js", import.meta.url), "utf8");
  assert.match(player, /preservesPitch = true/);
  assert.match(player, /listen-rate\.v1/);
});

test("listen-rate key defaults to 1.0 and ignores the older speech-rate key", () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value))
  };
  assert.equal(getListenRate(), 1);
  setListenRate(0.9);
  assert.equal(getListenRate(), 0.9);
  setListenRate(0.85);
  assert.equal(getListenRate(), 0.9);
  saved.set("toeic950.voice.v1", JSON.stringify({ rate: 0.85 }));
  assert.equal(getListenRate(), 0.9);
});

test("legacy quick sessions and history still open from their saved group ids", () => {
  for (const formId of ["quick-40", "quick-60"]) {
    const set = bank.meta.sets.find((item) => item.id === formId);
    const entry = { formId, groupIds: set.groupIds, answers: {}, phase: "listening" };
    const questions = flatten(bank, entry.groupIds);
    assert.equal(questions.length, formId === "quick-40" ? 40 : 60);
    assert.equal(allowsReplay(entry), true);
    assert.equal(entry.official, undefined);
  }
});
