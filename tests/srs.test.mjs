import test from 'node:test';
import assert from 'node:assert/strict';
import { FLASHCARD_RENAMES, migrateFlashcardProgress, rateCard, selectCards } from '../codex/js/srs.js';

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

test('all retired vocabulary headwords transfer their flashcard schedules', () => {
  const old = Object.fromEntries(Object.keys(FLASHCARD_RENAMES).map((word, index) => [word, { box: 2, dueAt: index + 10, introducedAt: index }]));
  const migrated = migrateFlashcardProgress(old);
  assert.equal(migrated.changed, true);
  for (const [word, replacement] of Object.entries(FLASHCARD_RENAMES)) {
    assert.deepEqual(migrated.progress[replacement], old[word], word);
    assert.equal(migrated.progress[word], undefined, word);
  }
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
