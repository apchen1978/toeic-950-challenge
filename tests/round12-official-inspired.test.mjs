import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { ABILITIES, abilityStats, assignAbility, scoreBand } from '../codex/js/abilities.js';
import { flatten, score } from '../codex/js/scoring.js';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const audio = JSON.parse(readFileSync(new URL('../codex/audio/manifest.json', import.meta.url), 'utf8'));
const appSource = readFileSync(new URL('../codex/js/app.js', import.meta.url), 'utf8');
const byId = new Map(bank.groups.map((group) => [group.id, group]));
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const form = (id) => bank.meta.sets.find((set) => set.id === id);
const formD = form('form-d');
const listeningCount = (groups) => groups.reduce((sum, group) => sum + group.questions.length, 0);

test('every bank question has an ability label matching the ten-category model', () => {
  const questions = bank.groups.flatMap((group) => group.questions);
  assert.equal(questions.length, 989);
  for (const group of bank.groups) {
    for (const question of group.questions) {
      assert.ok(ABILITIES[question.ability], `${question.id} has an unknown ability`);
      assert.equal(question.ability, assignAbility(group, question), `${question.id} ability mapping`);
      assert.equal(ABILITIES[question.ability].section, group.section, `${question.id} section`);
    }
  }
  const stats = abilityStats(questions, Object.fromEntries(questions.map((question) => [question.id, question.answer])));
  assert.deepEqual(Object.keys(stats), Object.keys(ABILITIES));
  assert.ok(Object.values(stats).every((item) => item.answered > 0 && item.correct === item.answered));
  assert.match(appSource, /題數少，僅供參考/);
  assert.match(appSource, /aria-valuenow/);
});
test('score bands give strengths, gaps, and next steps at the requested cut points', () => {
  for (const [section, scores] of [['listening', [400, 300, 200]], ['reading', [450, 350, 250, 150]]]) {
    for (const score of scores) {
      const band = scoreBand(section, score);
      assert.ok(band?.strength && band?.gap && band?.next, `${section} ${score}`);
    }
  }
  assert.match(appSource, /正式 TOEIC 會依試卷難度等化/);
  assert.match(appSource, /沒有通過或不通過/);
});

test('Form D keeps its original 100-item reading group sequence and old answer mapping', () => {
  const readingIds = formD.groupIds.filter((id) => byId.get(id).part >= 5);
  assert.equal(digest(readingIds), '0fed14b8ad9c614d58ac68c29d237547e8233887ba15ee41d49372e3ea5a379d');
  const legacyListeningIds = form('form-a').groupIds.filter((id) => byId.get(id).part <= 4);
  assert.equal(digest(legacyListeningIds), '5bea319f2d9dd95ef65485cd037b9676822a8dcb7f88cde7c1a5f5862e915b39');
  assert.ok(legacyListeningIds.every((id) => byId.has(id)), 'old Form D session groups remain in the bank');
  const oldFormDListeningAnswers = legacyListeningIds
    .flatMap((id) => byId.get(id).questions.map((question) => [question.id, question.options[question.answer]]));
  assert.equal(oldFormDListeningAnswers.length, 100);
  assert.equal(digest(oldFormDListeningAnswers), 'be4a5cb114bfb2ed09bb042c7e9b1c270e717d52371c6dd1ac4b92b58f0a677a');
  const legacyGroups = [...legacyListeningIds, ...readingIds].map((id) => byId.get(id));
  const legacyQuestionIds = legacyGroups.flatMap((group) => group.questions.map((question) => question.id));
  const legacyQuestions = flatten(bank, [...legacyListeningIds, ...readingIds]);
  assert.equal(legacyQuestions.length, 200);
  assert.deepEqual(new Set(legacyQuestions.map((question) => question.id)), new Set(legacyQuestionIds));
  assert.equal(score(legacyQuestions, Object.fromEntries(legacyQuestions.map((question) => [question.id, question.answer]))).correct, 200);
});

test('Form D listening draws from B, C, and outside forms with no more than one-third overlap', () => {
  const dListening = formD.groupIds.filter((id) => byId.get(id).part <= 4);
  assert.equal(listeningCount(dListening.map((id) => byId.get(id))), 100);
  const overlaps = {};
  for (const id of ['form-a', 'form-b', 'form-c']) {
    const other = new Set(form(id).groupIds.filter((groupId) => byId.get(groupId).part <= 4));
    const overlap = dListening.filter((groupId) => other.has(groupId)).reduce((sum, groupId) => sum + byId.get(groupId).questions.length, 0);
    overlaps[id] = overlap;
    assert.ok(overlap <= 33, `${id}: ${overlap}/100`);
  }
  assert.ok(overlaps['form-b'] > 0 && overlaps['form-c'] > 0);
  assert.ok(dListening.some((id) => id.startsWith('g-round12-')));
  assert.ok(dListening.some((id) => id.startsWith('g-gx-')));
});

test('Part 2 statements are 15–20 percent and every item has an echo or sound-alike distractor', () => {
  const part2 = bank.groups.filter((group) => group.section === 'listening' && group.part === 2);
  const questions = part2.flatMap((group) => group.questions);
  const statements = part2.reduce((sum, group) => sum + group.questions.filter(() => group.script.some((line) => !/[?？]\s*$/.test(line.text))).length, 0);
  const ratio = statements / questions.length;
  assert.equal(questions.length, 114);
  assert.ok(ratio >= 0.15 && ratio <= 0.20, `statement share ${ratio}`);

  for (const group of part2) {
    const script = group.script.map((line) => line.text.toLowerCase()).join(' ');
    for (const question of group.questions) {
      const wrong = question.options.filter((_, index) => index !== question.answer);
      const hasEcho = wrong.some((option) => (option.toLowerCase().match(/[a-z]{3,}/g) ?? [])
        .some((word) => new RegExp(`\\b${word}\\b`, 'i').test(script)));
      assert.ok(hasEcho, `${group.id}/${question.id} has no same-word distractor`);
    }
  }
});

test('new listening recordings cover all four accents evenly and are present in the audio manifest', () => {
  const ids = [
    ...Array.from({ length: 12 }, (_, index) => `g-round12-p2-${String(index + 1).padStart(2, '0')}`),
    'g-round12-p3-three', 'g-round12-p3-accent-ca', 'g-round12-p4-schedule', 'g-round12-p4-accent-uk'
  ];
  const counts = { US: 0, UK: 0, CA: 0, AU: 0 };
  for (const id of ids) {
    const group = byId.get(id);
    assert.ok(group, id);
    counts[group.accent] += group.questions.length;
    const entry = audio.groups[id];
    assert.ok(entry, `audio manifest ${id}`);
    assert.equal(statSync(new URL(`../codex/${entry.file}`, import.meta.url)).size, entry.bytes, id);
    if (group.accent === 'CA') assert.ok(entry.voices.every((voice) => voice.locale === 'en-CA'), id);
    if (group.id === 'g-round12-p3-three') assert.ok(entry.voices.some((voice) => voice.pitch === '+10Hz'), 'third role should be audible');
  }
  assert.deepEqual(counts, { US: 6, UK: 6, CA: 6, AU: 6 });
});

test('new listening formats include three speakers, chart filtering, schedule change, and phrase intent', () => {
  for (const group of bank.groups.filter((item) => item.section === 'listening' && [3, 4].includes(item.part))) {
    for (const question of group.questions) assert.equal(question.options.length, 4, question.id);
  }
  const triple = byId.get('g-round12-p3-three');
  assert.equal(new Set(triple.script.map((line) => line.speaker)).size, 3);
  assert.ok(triple.script.some((line) => line.text.includes("I can't believe it!")));
  assert.ok(triple.questions.some((question) => question.graphic));
  const schedule = byId.get('g-round12-p4-schedule');
  assert.ok(schedule.questions.some((question) => question.prompt.includes('Who will speak last')));
  assert.ok(schedule.questions.some((question) => question.prompt.includes('Here’s the thing')));
  assert.ok(byId.get('g-round12-p3-accent-ca').questions.some((question) => question.graphic));
  assert.ok(byId.get('g-round12-p4-accent-uk').questions.some((question) => question.graphic));
});

test('the Form D Part 1 trap uses a visible object with a wrong action as a distractor', () => {
  const photo = byId.get('g-photo-14');
  assert.ok(formD.groupIds.includes(photo.id));
  assert.equal(photo.questions.length, 1);
  assert.equal(statSync(new URL('../codex/images/photo-14.jpg', import.meta.url)).isFile(), true);
  assert.ok(photo.questions[0].options.includes('A worker is washing a park bench.'));
  assert.notEqual(photo.questions[0].options[photo.questions[0].answer], 'A worker is washing a park bench.');
});
