import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../codex/audio/manifest.json', import.meta.url), 'utf8'));
const find = (id) => bank.groups.flatMap(group => group.questions).find(question => question.id === id);

test('Part 2 removes competing direct answers and keeps the spoken option order', () => {
  const competing = ['Yes, the client approved it yesterday.', 'Put them in the storage room.', 'I sent the memo this morning.', 'Yes, I can stay late.', 'Ms. Cole is leading it.', 'Because of the storm.', "Yes, they're ready.", 'It closes at three.', 'Yes, book the large room.', "Yes, here's a copy.", 'Go down the hall and turn left.', 'Yes, she will be there.', 'I can review it this morning.', 'It leaves at four thirty.', 'Yes, they lowered it.'];
  for (let index = 0; index < 15; index++) {
    const group = bank.groups.find(item => item.id === `g-gx-p2-${String(index + 1).padStart(2, '0')}`);
    const question = group.questions[0];
    assert.ok(question.answer >= 0 && question.answer < 3, group.id);
    assert.ok(!question.options.includes(competing[index]), group.id);
    assert.equal(new Set(question.options).size, 3, group.id);
    assert.deepEqual(manifest.groups[group.id].spokenChoices, question.options.flatMap((option, i) => [`${String.fromCharCode(65 + i)}.`, option]), group.id);
    assert.equal(statSync(new URL(`../codex/${manifest.groups[group.id].file}`, import.meta.url)).size, manifest.groups[group.id].bytes, group.id);
  }
});

test('revised cross-document calculations and schedule use their documented facts', () => {
  assert.equal(find('RD01B').options[find('RD01B').answer], '$567');
  assert.equal((200 * 2.5 + 40) * 1.05, 567);
  assert.equal(find('RD02D').options[find('RD02D').answer], 'May 3');
  assert.equal(find('RT01B').options[find('RT01B').answer], 'June 4 afternoon, Room A');
  assert.equal(find('RT01D').options[find('RT01D').answer], 'June 11 morning in Room B');
});
