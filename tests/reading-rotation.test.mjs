import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assembleReadingRotation, originalReadingGroups, readingRotationPools } from '../codex/js/reading-rotation.js';
import { avoidedGroupIds, rememberQuickDraw } from '../codex/js/quick-form.js';
import { flatten, score } from '../codex/js/scoring.js';

const source = readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8');
const bank = JSON.parse(source);
const forms = ['read-full-1', 'read-full-2', 'read-full-3'];
const byId = new Map(bank.groups.map((group) => [group.id, group]));
const byQuestion = new Map(bank.groups.flatMap((group) => group.questions.map((question) => [question.id, question])));
const fixed = new Set(forms.flatMap((id) => originalReadingGroups(bank, id).map((group) => group.id)));
const docs = (group) => group.passage?.docs.length ?? 0;
const partGroups = (groups, part) => groups.filter((group) => group.part === part);
const shape = (group) => [group.part, docs(group), group.questions.length];
const key = (group) => shape(group).join('/');

test('50 seeds per reading mock preserve structure, answer keys and group exclusions', () => {
  let recent = [];
  const stats = { changed: [], positions: [[], [], [], []] };
  for (let seed = 0; seed < 50; seed++) for (const formId of forms) {
    const base = originalReadingGroups(bank, formId);
    const baseIds = new Set(base.map((group) => group.id));
    const avoid = avoidedGroupIds(recent);
    const draw = assembleReadingRotation(bank, formId, seed, recent);
    assert.equal(draw.fallback, false, `${formId}, seed ${seed}`);
    assert.deepEqual(assembleReadingRotation(bank, formId, seed, recent), draw);
    assert.equal(new Set(draw.groupIds).size, draw.groupIds.length);
    const groups = draw.groupIds.map((id) => byId.get(id));
    assert.deepEqual(groups.map(shape), groups.map(shape).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]));
    const totals = [5, 6, 7].map((part) => partGroups(groups, part).flatMap((group) => group.questions).length);
    assert.deepEqual(totals, [30, 16, 54]);
    const part7 = partGroups(groups, 7);
    assert.deepEqual(part7.filter((group) => docs(group) === 1).map((group) => group.questions.length), [2, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
    for (const [count, expected] of [[2, 2], [3, 3]]) {
      assert.deepEqual(part7.filter((group) => docs(group) === count).map((group) => group.questions.length), Array(expected).fill(5));
    }
    for (const group of partGroups(groups, 6)) assert.equal(group.questions.filter((q) => q.questionType === 'sentence-insertion').length, 1);
    const added = groups.filter((group) => !baseIds.has(group.id));
    const retainedIds = new Set(draw.groupIds);
    const removed = base.filter((group) => !retainedIds.has(group.id));
    assert.deepEqual(added.map(key).sort(), removed.map(key).sort());
    assert.ok(added.every((group) => !fixed.has(group.id) && !group.retired && !group.questions.some((q) => q.retired)));
    assert.ok(partGroups(added, 5).every((group) => !avoid.has(group.id)), 'Part 5 has sufficient fresh groups');
    const changes = added.flatMap((group) => group.questions).length;
    assert.equal(draw.changedQuestions, changes);
    assert.ok(changes === 28 || changes === 33);
    assert.equal(partGroups(added, 5).length, 10);
    assert.equal(partGroups(added, 6).length, 1);
    assert.deepEqual(partGroups(added, 7).filter((group) => docs(group) === 1).map((group) => group.questions.length), [2, 3, 4]);
    assert.equal(partGroups(added, 7).filter((group) => docs(group) === 3).length, 1);
    const positions = [0, 0, 0, 0];
    for (const question of part7.flatMap((group) => group.questions)) positions[question.answer]++;
    assert.ok(positions.every((count) => count / 54 >= 0.18 && count / 54 <= 0.32), positions.join('/'));
    stats.changed.push(changes);
    positions.forEach((count, index) => stats.positions[index].push(count));
    const saved = JSON.parse(JSON.stringify({ formId, rotationSeed: seed, groupIds: draw.groupIds }));
    const restored = flatten(bank, saved.groupIds).sort((a, b) => saved.groupIds.indexOf(a.groupId) - saved.groupIds.indexOf(b.groupId));
    assert.deepEqual(restored.map((question) => question.id), groups.flatMap((group) => group.questions.map((q) => q.id)));
    for (const { groupId, section, part, ...question } of restored) {
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
      assert.deepEqual(question, byQuestion.get(question.id));
    }
    assert.equal(score(restored, Object.fromEntries(restored.map((q) => [q.id, q.answer]))).correct, 100);
    recent = rememberQuickDraw(recent, draw.groupIds, formId);
  }
  assert.deepEqual(bank, JSON.parse(source), 'assembly never edits the bank');
  const range = (values) => [Math.min(...values), Math.max(...values)];
  console.log('Reading rotation ranges across 150 draws:', { changed: range(stats.changed), positions: stats.positions.map(range) });
});

test('original reading mocks follow the existing bank and set ordering', () => {
  for (const id of forms) {
    const { groupIds } = bank.meta.sets.find((set) => set.id === id);
    const original = originalReadingGroups(bank, id).map((group) => group.id);
    const expected = [5, 6, 7].flatMap((part) => partGroups(bank.groups, part).filter((group) => groupIds.includes(group.id)).map((group) => group.id));
    assert.deepEqual(original, expected);
    assert.deepEqual([...original].sort(), [...groupIds].sort());
  }
});

test('rotation falls back to the original when the last eligible two-question single is retired', () => {
  const clone = structuredClone(bank);
  const eligible = readingRotationPools(clone).get('7/2/1');
  assert.ok(eligible.length);
  for (const group of eligible) group.questions[0].retired = true;
  assert.deepEqual(assembleReadingRotation(clone, forms[0], 42), {
    groupIds: originalReadingGroups(bank, forms[0]).map((group) => group.id), changedQuestions: 0, fallback: true
  });
});
