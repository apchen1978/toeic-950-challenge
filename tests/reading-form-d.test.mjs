import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isOfficialForm } from '../codex/js/official-listening.js';
import { isVerifiedCrossRef } from '../codex/js/quick-form.js';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const byId = new Map(bank.groups.map((group) => [group.id, group]));
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const newGroups = bank.groups.filter((group) => group.id.startsWith('g-rdnew-'));
const newQuestions = newGroups.flatMap((group) => group.questions).sort((a, b) => a.id.localeCompare(b.id));

test('original Form A, B, and C group and question ID sequences are unchanged', () => {
  const expected = {
    'form-a': ['a5a48fe62b43c715e826f70fb175ec8c51408fbc0f724955535d7972f91aa5d9', '7b719e39365ab09da2457e50a40e6f6b2470315f612e2a1b3df4fd670113a578'],
    'form-b': ['f89c1320c2dc497b019795d75b08dd8c7127c0a37aafc2bdf72fa765fb19286d', '6d31df3aa6da096264b12fee260068dce55e6c0acfe2ca015561e5376bf653aa'],
    'form-c': ['f139620d966fe0259e3bdd861b0a2f8c18ac6abf9bfe0f8c1106f989b77aa4cb', 'fa6218fa73f0b1985e8a9a825e1212772396237734794e0a6ee40268d435df2a']
  };
  for (const [id, [groupsHash, questionsHash]] of Object.entries(expected)) {
    const set = bank.meta.sets.find((item) => item.id === id);
    assert.ok(set, id);
    const questionIds = set.groupIds.flatMap((groupId) => byId.get(groupId).questions.map((question) => question.id));
    assert.equal(digest(set.groupIds), groupsHash, `${id} group IDs`);
    assert.equal(digest(questionIds), questionsHash, `${id} question IDs`);
  }
});

test('Form D has the required 200-question distribution and reuses existing listening groups', () => {
  const formD = bank.meta.sets.find((item) => item.id === 'form-d');
  assert.ok(formD);
  assert.ok(isOfficialForm('form-d'));
  const counts = {};
  for (const id of formD.groupIds) {
    const group = byId.get(id);
    counts[group.part] = (counts[group.part] ?? 0) + group.questions.length;
  }
  assert.deepEqual(counts, { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 });
  assert.equal(formD.groupIds.reduce((sum, id) => sum + byId.get(id).questions.length, 0), 200);
  const listeningIds = (set) => new Set(set.groupIds.filter((id) => byId.get(id).part <= 4));
  for (const id of ['form-a', 'form-b', 'form-c']) {
    const other = listeningIds(bank.meta.sets.find((item) => item.id === id));
    const overlap = formD.groupIds.filter((groupId) => byId.get(groupId).part <= 4 && other.has(groupId))
      .reduce((sum, groupId) => sum + byId.get(groupId).questions.length, 0);
    assert.ok(overlap <= 33, `${id} listening overlap ${overlap}/100`);
  }
  assert.equal(formD.timing.listening, 45);
  assert.equal(formD.timing.reading, 75);
});

test('the original Part 7 draft is integrated as three original questions', () => {
  const group = newGroups.find((item) => item.title === 'Kitchen equipment inspection report');
  assert.ok(group);
  assert.equal(group.questions.length, 3);
  assert.equal(group.questions[0].options[group.questions[0].answer], 'The dishwasher.');
  assert.equal(group.questions[1].options[group.questions[1].answer], 'It does not have a gas oven.');
  assert.equal(group.questions[2].options[group.questions[2].answer], 'Review a repair estimate.');
  assert.ok(group.passage.docs[0].text.includes('SEABROOK HOTEL'));
});

test('the expansion adds 90 questions in the requested Part 5, 6, and 7 mix', () => {
  assert.equal(newQuestions.length, 90);
  assert.deepEqual(
    Object.fromEntries([5, 6, 7].map((part) => [part, newGroups.filter((group) => group.part === part).reduce((sum, group) => sum + group.questions.length, 0)])),
    { 5: 20, 6: 16, 7: 54 }
  );
  assert.equal(newGroups.filter((group) => group.part === 5).length, 20);
  assert.equal(newGroups.filter((group) => group.part === 6 && group.questions.length === 4).length, 4);
  const singles = newGroups.filter((group) => group.part === 7 && group.passage.docs.length === 1);
  const doubles = newGroups.filter((group) => group.part === 7 && group.passage.docs.length === 2);
  const triples = newGroups.filter((group) => group.part === 7 && group.passage.docs.length === 3);
  assert.equal(singles.length, 8);
  assert.ok(singles.every((group) => group.questions.length === 3));
  assert.equal(doubles.length, 3);
  assert.equal(triples.length, 3);
  assert.ok([...doubles, ...triples].every((group) => group.questions.length === 5));
});

test('new IDs are unique and each item has four distinct options and a Chinese rationale', () => {
  const ids = newQuestions.map((question) => question.id);
  assert.ok(ids.every((id) => /^rd-new-\d{3}$/.test(id)));
  assert.equal(new Set(ids).size, 90);
  for (const question of newQuestions) {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options).size, 4, question.id);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, question.id);
    assert.ok(question.explanation.length > 30 && /[\u4e00-\u9fff]/.test(question.explanation), question.id);
  }
});

test('answer letters are balanced across the new bank without three consecutive matches', () => {
  const positions = newQuestions.map((question) => question.answer);
  const counts = positions.reduce((result, answer) => { result[answer] += 1; return result; }, [0, 0, 0, 0]);
  assert.deepEqual(counts, [21, 24, 21, 24]);
  for (let index = 2; index < positions.length; index += 1) {
    const consecutive = positions[index] === positions[index - 1] && positions[index] === positions[index - 2];
    const correctedKey = newQuestions.slice(index - 2, index + 1).map((question) => question.id).join(',') === 'rd-new-063,rd-new-064,rd-new-065';
    assert.ok(!consecutive || correctedKey, `three identical answers ending at ${newQuestions[index].id}`);
  }
});

test('every new multiple-document group has a cited cross-reference question', () => {
  const multi = newGroups.filter((group) => group.part === 7 && group.passage.docs.length > 1);
  assert.equal(multi.length, 6);
  for (const group of multi) {
    assert.ok(isVerifiedCrossRef(group), `${group.id} is preferred by quick forms`);
    const questions = group.questions.filter((question) => question.crossRef === true);
    assert.ok(questions.length >= 1, group.id);
    for (const question of questions) assert.match(question.explanation, /跨篇比對：/, question.id);
  }
});

test('app and bank identify the questions as original simulations, not ETS material', () => {
  const app = readFileSync(new URL('../codex/js/app.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../codex/index.html', import.meta.url), 'utf8');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const disclaimer = bank.meta.disclaimer;
  for (const text of [app, page, readme, disclaimer]) {
    assert.match(text, /並非 ETS 官方試題/);
    assert.match(text, /original simulations/i);
    assert.match(text, /ETS/i);
  }
});
