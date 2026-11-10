import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { graphicHtml } from "../codex/js/graphic.js";
import { buildOfficialSequence, OFFICIAL_PAUSES } from "../codex/js/official-listening.js";
import { assembleQuickForm, createRng, isGraphicGroup } from "../codex/js/quick-form.js";
import { flatten, score } from "../codex/js/scoring.js";
import { TIPS_STORAGE_KEY, tipForPart, tipsEnabled } from "../codex/js/tips.js";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const graphicGroups = bank.groups.filter((group) => group.id.startsWith("g-gx-p3-") || group.id.startsWith("g-gx-p4-"));

test("new Part 3 and Part 4 groups render a native graphic and one Look at the graphic question", () => {
  assert.equal(graphicGroups.filter((group) => group.part === 3).length, 6);
  assert.equal(graphicGroups.filter((group) => group.part === 4).length, 5);
  for (const group of graphicGroups) {
    assert.equal(group.questions.length, 3, group.id);
    const marked = group.questions.filter((question) => question.graphic === true);
    assert.equal(marked.length, 1, group.id);
    assert.match(marked[0].prompt, /^Look at the graphic\./);
    const html = graphicHtml(group.graphicView);
    assert.match(html, /<table|<svg/);
    assert.doesNotMatch(html, /gstatic|google|https?:\/\/(?!www\.w3\.org)/i);
    const spoken = group.script.map((line) => line.text).join(" ").toLowerCase();
    const answer = marked[0].options[marked[0].answer].toLowerCase();
    for (const word of answer.split(/\s+/)) assert.equal(spoken.includes(word), false, `${group.id} speaks ${word}`);
    const manifest = {
      groups: {
        [group.id]: {
          file: `audio/${group.id}.mp3`,
          durationSec: 20,
          questionClips: group.questions.map((question) => ({ id: question.id, file: `audio/q-${question.id}.mp3`, durationSec: 1, graphic: false }))
        }
      }
    };
    const pauses = buildOfficialSequence([group], manifest).filter((step) => step.type === "pause");
    assert.equal(pauses.find((step) => step.questionId === marked[0].id).durationSec, OFFICIAL_PAUSES.graphic);
    for (const question of group.questions.filter((item) => item.graphic !== true)) {
      assert.equal(pauses.find((step) => step.questionId === question.id).durationSec, OFFICIAL_PAUSES.question);
    }
  }
});

test("quick draws prefer a graphic group when the blueprint asks for one", () => {
  for (const formId of ["quick-40", "quick-60"]) {
    for (const seed of [1, 4, 9]) {
      const form = assembleQuickForm(bank, formId, { random: createRng(seed), section: "listening" });
      const chosen = form.groupIds.map((id) => bank.groups.find((group) => group.id === id));
      const part3 = chosen.filter((group) => group.part === 3);
      const part4 = chosen.filter((group) => group.part === 4);
      assert.ok(part3.some(isGraphicGroup), `${formId} seed ${seed} part 3`);
      assert.ok(part4.some(isGraphicGroup), `${formId} seed ${seed} part 4`);
    }
  }
});

test("multi-document groups carry a cross-reference, and new ones have five questions", () => {
  const published = new Set(bank.meta.sets.flatMap((set) => set.groupIds));
  let doubles = 0;
  let triples = 0;
  for (const group of bank.groups) {
    const docs = group.passage?.docs ?? [];
    if (docs.length < 2) continue;
    if (docs.length === 2) doubles += 1;
    if (docs.length === 3) triples += 1;
    const cross = group.questions.filter((question) => question.crossRef === true);
    assert.ok(cross.length >= 1, group.id);
    for (const question of cross) assert.match(question.explanation, /Cross-reference:/, question.id);
    if (!published.has(group.id)) assert.equal(group.questions.length, 5, group.id);
  }
  assert.ok(doubles >= 6, doubles);
  assert.ok(triples >= 10, triples);
  assert.equal(bank.groups.find((group) => group.id === "g-r15").questions.map((question) => question.id).join(","), "R15,R16");
});

test("Part 2 gained fifteen indirect responses", () => {
  const added = bank.groups.filter((group) => group.id.startsWith("g-gx-p2-"));
  assert.equal(added.length, 15);
  const accents = { US: 0, UK: 0, CA: 0, AU: 0 };
  for (const group of added) {
    accents[group.accent] += 1;
    assert.equal(group.spokenOptions, true);
    assert.equal(group.questions.length, 1);
    assert.equal(group.questions[0].options.length, 3);
  }
  assert.deepEqual(accents, { US: 4, UK: 4, CA: 3, AU: 4 });
});

test("tips stay on unless the saved key is false, and a legacy session still scores", () => {
  assert.equal(TIPS_STORAGE_KEY, "tips-on.v1");
  assert.equal(tipsEnabled(undefined), true);
  assert.equal(tipsEnabled(true), true);
  assert.equal(tipsEnabled(false), false);
  for (const part of [1, 2, 3, 4, 5, 6, 7]) assert.ok(tipForPart(part)?.short);
  const legacy = { answers: { R15: 1, R16: 0 }, peeked: undefined };
  const questions = flatten(bank, ["g-r15"]);
  const result = score(questions, legacy.answers);
  assert.equal(result.correct, 1);
  assert.equal(questions.length, 2);
});
