import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assembleQuickForm, createRng, quickCoverageIssues } from '../codex/js/quick-form.js';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const fresh = bank.groups.filter((group) => /^(cov-p|g-cov-)/.test(group.id));
const freshQuestions = fresh.flatMap((group) => group.questions);
const types = (groups, part) => groups.filter((group) => group.part === part).flatMap((group) => group.questions.map((question) => question.questionType));

test('new question counts per type', () => {
  const count = (part, type) => freshQuestions.filter((question) => question.questionType === type && fresh.find((group) => group.questions.includes(question)).part === part).length;
  assert.ok(count(3, 'speaker-intent') + count(4, 'speaker-intent') >= 12);
  assert.equal(count(7, 'synonym'), 10);
  assert.equal(count(7, 'chat-intent'), 6);
  assert.equal(count(5, 'preposition-conjunction'), 10);
  assert.equal(count(6, 'sentence-insertion'), 6);
  assert.equal(fresh.filter((group) => group.part === 1).length, 12);
});

test('new questions: unique ids, answer keys, balanced positions, banned phrases, grounded intent quotes and synonyms', () => {
  const ids = bank.groups.flatMap((group) => group.questions.map((question) => question.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const part of [3, 4, 7, 5, 6, 1]) {
    const questions = fresh.filter((group) => group.part === part).flatMap((group) => group.questions);
    const counts = [0, 0, 0, 0];
    for (const question of questions) counts[question.answer] += 1;
    for (const n of counts) assert.ok(n / questions.length >= 0.2 && n / questions.length <= 0.3, `Part ${part} ${counts}`);
  }
  for (const group of fresh) {
    const source = (group.script?.map((line) => line.text) ?? group.passage?.docs.map((doc) => doc.text) ?? []).join(' ');
    for (const question of group.questions) {
      assert.match(question.explanation, /【考點】/);
      assert.match(question.explanation, /【判斷依據】/);
      assert.doesNotMatch(question.explanation, /秒殺|萬能|80%/);
      const quoted = question.prompt.match(/"([^"]+)"/);
      if (quoted && !['synonym', 'text-insertion'].includes(question.questionType)) assert.ok(source.includes(quoted[1]), `${question.id} quote must appear in the source`);
      if (question.questionType === 'synonym') assert.ok(source.includes(quoted[1]), `${question.id} target word must appear in the passage`);
      assert.equal(question.options[question.answer], question.explanation.match(/正解 [A-D]「([^」]+)」/)[1], question.id);
    }
  }
});

test('50 quick-40 and 50 quick-60 draws cover the main types, hit the blueprint, and never split a group', () => {
  for (const [formId, total] of [['quick-40', 40], ['quick-60', 60]]) {
    for (let seed = 1; seed <= 50; seed += 1) {
      const form = assembleQuickForm(bank, formId, { random: createRng(seed * 7919) });
      assert.deepEqual(form.coverageWarnings, [], `${formId} seed ${seed}`);
      const groups = form.groupIds.map((id) => bank.groups.find((group) => group.id === id));
      assert.equal(groups.reduce((sum, group) => sum + group.questions.length, 0), total);
      assert.equal(new Set(form.groupIds).size, form.groupIds.length);
      assert.deepEqual(quickCoverageIssues(groups, formId), []);
      assert.ok([...types(groups, 3), ...types(groups, 4)].includes('speaker-intent'));
      assert.ok(types(groups, 5).includes('preposition-conjunction') || formId === 'quick-40');
    }
  }
});

test('a bank without enough variety still draws a form and only warns', () => {
  const thin = { ...bank, groups: bank.groups.map((group) => ({ ...group, questions: group.questions.map((question) => ({ ...question, questionType: 'detail' })) })) };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const form = assembleQuickForm(thin, 'quick-40', { random: createRng(5) });
    assert.ok(form.coverageWarnings.length > 0);
    assert.equal(form.groupIds.length > 0, true);
  } finally { console.warn = warn; }
});

test('with the recent-draw memory the app keeps, every new 40 or 60 mock is a fresh mix and keeps full coverage', async () => {
  const { avoidedGroupIds, rememberQuickDraw } = await import('../codex/js/quick-form.js');
  for (const formId of ['quick-40', 'quick-60']) {
    let recent = [];
    let previous = null;
    const random = createRng(2026);
    for (let round = 0; round < 12; round += 1) {
      const form = assembleQuickForm(bank, formId, { avoid: avoidedGroupIds(recent), random });
      assert.deepEqual(form.coverageWarnings, [], `${formId} round ${round}`);
      if (previous) {
        const shared = form.groupIds.filter((id) => previous.includes(id)).length;
        assert.ok(shared / form.groupIds.length <= 0.25, `${formId} round ${round} repeats ${shared} of ${form.groupIds.length} groups`);
      }
      previous = form.groupIds;
      recent = rememberQuickDraw(recent, form.groupIds, formId);
    }
  }
});

test('the reading-the-questions card is marked personal and non-official, with no banned phrases', async () => {
  const { TIP_SECTIONS } = await import('../codex/js/tips.js');
  const card = TIP_SECTIONS.find((section) => section.id === 'reading-the-questions');
  assert.ok(card && card.personal === true);
  assert.equal(card.tips.length, 4);
  for (const tip of card.tips) {
    assert.match(tip.title, /個人整理，非官方/);
    assert.doesNotMatch(`${tip.title}${tip.body}${tip.why}`, /秒殺|萬能|80%/);
  }
});
