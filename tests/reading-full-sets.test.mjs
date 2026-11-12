import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const by = Object.fromEntries(bank.groups.map((group) => [group.id, group]));
const sets = ['read-full-1', 'read-full-2', 'read-full-3'].map((id) => bank.meta.sets.find((set) => set.id === id));

test('three full reading sets have 100 questions, 75 minutes and the specified passage lengths', () => {
  for (const set of sets) {
    assert.ok(set);
    assert.equal(set.durationMin, 75);
    assert.equal(set.timing.reading, 75);
    const groups = set.groupIds.map((id) => by[id]);
    assert.ok(groups.every(Boolean));
    assert.equal(new Set(set.groupIds).size, set.groupIds.length);
    const count = (part) => groups.filter((group) => group.part === part).reduce((sum, group) => sum + group.questions.length, 0);
    assert.deepEqual([count(5), count(6), count(7)], [30, 16, 54]);
    const p6 = groups.filter((group) => group.part === 6);
    assert.equal(p6.length, 4);
    for (const group of p6) {
      assert.equal(group.questions.length, 4);
      assert.equal(group.questions.filter((question) => question.questionType === 'sentence-insertion').length, 1, group.id);
    }
    const p7 = groups.filter((group) => group.part === 7);
    const singles = p7.filter((group) => group.passage.docs.length === 1);
    const doubles = p7.filter((group) => group.passage.docs.length === 2);
    const triples = p7.filter((group) => group.passage.docs.length === 3);
    assert.equal(singles.length, 10);
    assert.equal(singles.reduce((sum, group) => sum + group.questions.length, 0), 29);
    assert.deepEqual(singles.map((group) => group.questions.length).sort(), [2, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
    assert.deepEqual([doubles.length, triples.length], [2, 3]);
    for (const group of [...doubles, ...triples]) assert.equal(group.questions.length, 5, group.id);
    for (const group of [...doubles, ...triples]) assert.ok(group.questions.some((question) => question.crossRef === true), `${group.id} needs a cross-document question`);
  }
});

test('the two sets share no group and cover the high-score question types', () => {
  assert.equal(sets[0].groupIds.filter((id) => sets[1].groupIds.includes(id)).length, 0);
  for (const set of sets.slice(0, 2)) {
    const questions = set.groupIds.flatMap((id) => by[id].questions);
    const types = (type) => questions.filter((question) => question.questionType === type).length;
    assert.ok(types('text-insertion') >= 2, 'insertion position');
    assert.ok(types('chat-intent') >= 2, 'chat intent');
    assert.ok(types('synonym') >= 2, 'synonym');
    assert.ok(types('not-question') >= 2, 'NOT');
    assert.ok(types('inference') >= 5, 'inference');
    assert.ok(questions.filter((question) => question.crossRef === true).length >= 8, 'cross-document');
    const p5 = set.groupIds.map((id) => by[id]).filter((group) => group.part === 5).map((group) => group.questions[0].questionType);
    const n = (type) => p5.filter((value) => value === type).length;
    assert.equal(n('part-of-speech'), 8);
    assert.equal(n('verb-tense-voice'), 4);
    assert.equal(n('pronoun'), 2);
    assert.equal(n('vocabulary-collocation'), 11);
    assert.equal(n('preposition-conjunction') + n('relative-pronoun'), 5);
  }
});

test('answer positions in each set are spread across A to D', () => {
  for (const set of sets) {
    const counts = [0, 0, 0, 0];
    for (const id of set.groupIds) for (const question of by[id].questions) counts[question.answer] += 1;
    for (const c of counts) assert.ok(c >= 20 && c <= 31, counts.join('/'));
    const part7 = [0, 0, 0, 0];
    for (const id of set.groupIds) if (by[id].part === 7) for (const question of by[id].questions) part7[question.answer]++;
    assert.ok(part7.every((count) => count / 54 >= 0.2 && count / 54 <= 0.3), `${set.id}: ${part7}`);
  }
});

test('insertion questions offer positions [1] to [4] and the sentence is not copied from the passage', () => {
  for (const set of sets) for (const id of set.groupIds) for (const question of by[id].questions) {
    if (question.questionType !== 'text-insertion' || by[id].part !== 7) continue;
    assert.deepEqual(question.options, ['[1]', '[2]', '[3]', '[4]']);
    const sentence = question.prompt.match(/"([^"]+)"/)[1];
    assert.ok(!by[id].passage.docs.some((doc) => doc.text.includes(sentence)));
    for (const marker of ['[1]', '[2]', '[3]', '[4]']) assert.ok(by[id].passage.docs.some((doc) => doc.text.includes(marker)), `${id} ${marker}`);
  }
});

test('the app wires the reading-full start button, per-part timing and the per-type report', () => {
  const app = readFileSync(new URL('../codex/js/app.js', import.meta.url), 'utf8');
  assert.match(app, /data-form="read-full-\$\{n\}"/);
  assert.match(app, /\[1, 2, 3\]\.map\(\(n\)/);
  assert.match(app, /閱讀 100 題 · 75 分鐘（共三組）/);
  assert.ok(app.indexOf('reading-full-card') < app.indexOf('class="card quick-card"'), 'the reading card sits above the quick mock card');
  assert.match(app, /readingFullLast/);
  assert.match(app, /partSecs/);
  assert.match(app, /readingFullReport/);
});

test('Part 7 format additions have complete, balanced and original question records', () => {
  const groups = bank.groups.filter((group) => group.id.startsWith('p7f-'));
  assert.equal(groups.length, 19);
  const counts = [0, 0, 0, 0];
  const banned = /Sam Bach|Salinas|Pablo['’]s|Sparky Paints|Business Audio Pro|Springfield|Two Swan Press|Bartowsky|Nostilde|San Jose Starlings|Loftgren|秒殺|萬能|80%/i;
  for (const group of groups) {
    assert.doesNotMatch(JSON.stringify(group), banned, group.id);
    if (group.passage.docs.length > 1) assert.ok(group.questions.filter((question) => question.crossRef === true).length >= 2, group.id);
    for (const question of group.questions) {
      assert.match(question.id, /^p7f-/);
      assert.equal(new Set(question.options).size, 4, question.id);
      assert.equal(question.options.length, 4, question.id);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3, question.id);
      for (const field of ['questionType', 'skill', 'ability', 'explanation']) assert.ok(question[field]?.trim(), `${question.id} ${field}`);
      if (question.questionType === 'cross-document') assert.equal(question.crossRef, true, question.id);
      counts[question.answer]++;
    }
  }
  assert.equal(counts.reduce((sum, count) => sum + count, 0), 66);
  assert.ok(counts.every((count) => count / 66 >= 0.2 && count / 66 <= 0.3), counts.join('/'));
});
