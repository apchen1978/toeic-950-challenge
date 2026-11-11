import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrateChoiceIndexes, CHOICE_REVISION } from '../codex/js/choice-legacy.js';
import { PREVIOUS_OPTIONS } from '../codex/js/choice-order-v3.js';
import { PREVIOUS_P2_OPTIONS } from '../codex/js/choice-order-v4.js';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(bank.groups.flatMap((group) => group.questions.map((question) => [question.id, question])));
const frozenGroups = new Set(bank.meta.sets.filter((set) => /^form-[abc]$/.test(set.id)).flatMap((set) => set.groupIds));
const scenarioDates = new Set(['R09', 'R47', 'XF45', 'XR227', 'XR29', 'XRS02', 'X7S-02', 'X7S-03', 'X7S-28']);
const dateTerm = /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)?)\b/g;

test('answer keys, marked letters, and quoted correct options agree', () => {
  for (const group of bank.groups) for (const question of group.questions) {
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, question.id);
    assert.equal(new Set(question.options).size, question.options.length, `${question.id} duplicate choices`);
    const stated = question.explanation.match(/正解\s*([A-D])(?:\s*[「『]([^」』]+)[」』])?/);
    if (!stated) continue;
    assert.equal(stated[1], 'ABCD'[question.answer], `${question.id} stated letter`);
    if (stated[2]) assert.equal(stated[2].trim(), question.options[question.answer].trim(), `${question.id} quoted correct choice`);
  }
});

test('prompt dates, weekdays, and times are grounded in the source or reviewed scenario rules', () => {
  for (const group of bank.groups) {
    const source = (group.passage?.docs?.map((doc) => doc.text).join(' ') ?? group.script?.map((line) => line.text).join(' ') ?? group.questions.map((question) => question.prompt).join(' ')).toLowerCase();
    for (const question of group.questions) {
      const missing = [...question.prompt.matchAll(dateTerm)].map((match) => match[0].toLowerCase()).filter((term) => !source.includes(term));
      if (missing.length) assert.ok(scenarioDates.has(question.id), `${question.id} prompt date/time not in source: ${missing.join(', ')}`);
    }
  }
});

test('old answers to the four unrelated-choice items become unanswered, while corrected answer keys regrade', () => {
  assert.equal(byId['rd-new-064'].options[byId['rd-new-064'].answer], 'Three supply crates.');
  assert.equal(byId['rd-new-076'].options[byId['rd-new-076'].answer], 'Registration desk.');
  assert.match(byId['rd-new-062'].prompt, /Wednesday/);
  const ids = ['rd-new-077', 'rd-new-078', 'rd-new-082', 'rd-new-084'];
  const answers = { 'rd-new-064': 2, 'rd-new-076': 0, ...Object.fromEntries(ids.map((id) => [id, byId[id].answer])) };
  const migrated = migrateChoiceIndexes(answers, 2, byId);
  assert.equal(migrated.revision, CHOICE_REVISION);
  assert.equal(migrated.answers['rd-new-064'], 2);
  assert.notEqual(migrated.answers['rd-new-064'], byId['rd-new-064'].answer);
  assert.notEqual(migrated.answers['rd-new-076'], byId['rd-new-076'].answer);
  for (const id of ids) assert.equal(migrated.answers[id], null, id);
});

test('new listening practice adds 39 original items, including 26 main-idea questions', () => {
  const groups = bank.groups.filter((group) => /^audit-p[34]-/.test(group.id));
  const questions = groups.flatMap((group) => group.questions);
  assert.equal(groups.length, 13);
  assert.equal(questions.length, 39);
  assert.equal(questions.filter((question) => ['L1', 'L2'].includes(question.ability)).length, 26);
  const counts = Object.fromEntries(['L1', 'L2'].map((ability) => [ability, bank.groups.flatMap((group) => group.questions).filter((question) => question.ability === ability).length]));
  assert.ok(counts.L1 >= 15 && counts.L2 >= 15, JSON.stringify(counts));
  const accents = groups.reduce((result, group) => ({ ...result, [group.accent]: (result[group.accent] ?? 0) + 1 }), {});
  assert.deepEqual(Object.values(accents).sort((a, b) => a - b), [3, 3, 3, 4]);
});

test('the audit table includes every question ID exactly once', () => {
  const rows = readFileSync(new URL('../audit/answer-audit-2026-11-11.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
  assert.equal(rows[0], 'id,part,status,issue,evidence');
  const ids = rows.slice(1).map((row) => row.slice(0, row.indexOf(',')));
  assert.equal(ids.length, Object.keys(byId).length);
  assert.deepEqual(new Set(ids), new Set(Object.keys(byId)));
});

test('new 39 questions and non-Form Parts 3, 4, and 7 balance A/B/C/D', () => {
  const fresh = bank.groups.filter((group) => /^audit-p[34]-/.test(group.id)).flatMap((group) => group.questions);
  const counts = (questions) => questions.reduce((result, question) => { result[question.answer]++; return result; }, [0, 0, 0, 0]);
  assert.deepEqual(counts(fresh).sort((a, b) => a - b), [9, 10, 10, 10]);
  for (const part of [3, 4, 7]) {
    const questions = bank.groups.filter((group) => group.part === part && !frozenGroups.has(group.id)).flatMap((group) => group.questions);
    for (const count of counts(questions)) assert.ok(count / questions.length >= 0.2 && count / questions.length <= 0.3, `Part ${part}: ${counts(questions)}`);
  }
});

test('saved answer indexes follow the same option text after revision 4', () => {
  assert.ok(Object.keys(PREVIOUS_OPTIONS).length > 0);
  for (const [id, previous] of Object.entries(PREVIOUS_OPTIONS)) {
    if (['rd-new-077', 'rd-new-078', 'rd-new-082', 'rd-new-084'].includes(id)) continue;
    for (let index = 0; index < previous.length; index++) {
      const result = migrateChoiceIndexes({ [id]: index }, 3, byId);
      assert.equal(byId[id].options[result.answers[id]], previous[index], `${id} old option ${index}`);
    }
  }
});

test('non-Form Part 2 answer positions are balanced and old choices survive revision 5', () => {
  const questions = bank.groups.filter((group) => group.part === 2 && !frozenGroups.has(group.id)).flatMap((group) => group.questions);
  assert.equal(questions.length, 39);
  const counts = questions.reduce((result, question) => { result[question.answer]++; return result; }, [0, 0, 0]);
  for (const count of counts) assert.ok(count / questions.length >= 0.25 && count / questions.length <= 0.40, counts.join('/'));
  for (const [id, previous] of Object.entries(PREVIOUS_P2_OPTIONS)) {
    for (let index = 0; index < previous.length; index++) {
      const result = migrateChoiceIndexes({ [id]: index }, 4, byId);
      assert.equal(byId[id].options[result.answers[id]], previous[index], `${id} option ${index}`);
    }
  }
});
