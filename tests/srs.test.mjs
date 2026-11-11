import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCABULARY } from '../codex/js/vocabulary.js';
import { FLASHCARD_RENAMES, finalFlashcardWord, migrateFlashcardProgress, rateCard, selectCards } from '../codex/js/srs.js';

test('renamed flashcard keeps its saved schedule and does not overwrite newer progress', () => {
  const saved = { box: 3, dueAt: 123, introducedAt: 45 };
  const old = { 'complimentary offer': saved, other: { box: 1 } };
  const migrated = migrateFlashcardProgress(old);
  assert.equal(migrated.changed, true);
  assert.deepEqual(migrated.progress['free trial offer'], saved);
  assert.equal(migrated.progress['complimentary offer'], undefined);
  assert.deepEqual(old['complimentary offer'], saved);
  const newer = { ...old, 'free trial offer': { box: 4 } };
  assert.equal(migrateFlashcardProgress(newer).changed, false);
  assert.deepEqual(migrateFlashcardProgress(newer).progress['free trial offer'], { box: 4 });
});

test('all retired vocabulary headwords transfer their flashcard schedules to a word that still exists', () => {
  const live = new Set(VOCABULARY.flatMap((group) => group.words.map((entry) => Array.isArray(entry) ? entry[0] : entry.word)));
  for (const word of Object.keys(FLASHCARD_RENAMES)) {
    assert.ok(live.has(finalFlashcardWord(word)), `${word} -> ${finalFlashcardWord(word)} must be a live word`);
    assert.equal(live.has(word), false, `${word} is renamed away, so it must not be a live word`);
  }
  for (const [index, word] of Object.keys(FLASHCARD_RENAMES).entries()) {
    const saved = { box: 2, dueAt: index + 10, introducedAt: index };
    const migrated = migrateFlashcardProgress({ [word]: saved });
    assert.equal(migrated.changed, true, word);
    assert.deepEqual(migrated.progress[finalFlashcardWord(word)], saved, word);
    assert.equal(migrated.progress[word], undefined, word);
  }
});

test('minority interest progress lands on contingency plan, whether or not it was already moved once', () => {
  const saved = { box: 3, dueAt: 777, introducedAt: 5 };
  assert.equal(finalFlashcardWord('minority interest'), 'contingency plan');
  const fromOldest = migrateFlashcardProgress({ 'minority interest': saved });
  assert.deepEqual(fromOldest.progress['contingency plan'], saved);
  assert.equal(fromOldest.progress['minority interest'], undefined);
  assert.equal(fromOldest.progress['beneficial ownership'], undefined);
  const fromPr57 = migrateFlashcardProgress({ 'beneficial ownership': saved });
  assert.deepEqual(fromPr57.progress['contingency plan'], saved);
  const live = migrateFlashcardProgress({ 'emergency procedure': { box: 1 } });
  assert.equal(live.changed, false);
});

test('ratings schedule repeat, progression, and preserve introduction date', () => {
  const first = rateCard(null, 'good', 1000);
  assert.deepEqual(first, { box: 1, dueAt: 86401000, introducedAt: 1000 });
  const second = rateCard(first, 'good', 86401000);
  assert.equal(second.box, 2);
  assert.equal(second.dueAt, 86401000 + 3 * 86400000);
  assert.equal(rateCard(second, 'again', 200000000).box, 0);
  assert.equal(rateCard(second, 'hard', 200000000).box, 2);
  assert.equal(second.introducedAt, 1000);
  assert.throws(() => rateCard(null, 'other'));
});

test('due cards do not count against the new-word cap and filters are applied', () => {
  const now = new Date(2026, 10, 11, 12).getTime();
  const items = [{word:'a',level:900,category:'x'}, {word:'b',level:900,category:'x'}, {word:'c',level:800,category:'y'}];
  const progress = {a:{box:1,dueAt:now-1,introducedAt:now-86400000}};
  assert.deepEqual(selectCards(items, progress, {level:'900',limit:1}, now).map(x=>x.word), ['a','b']);
  progress.c = {box:1,dueAt:now+1,introducedAt:now};
  assert.deepEqual(selectCards(items, progress, {level:'900',limit:1}, now).map(x=>x.word), ['a']);
  assert.deepEqual(selectCards(items, progress, {category:'y',limit:0}, now), []);
});
