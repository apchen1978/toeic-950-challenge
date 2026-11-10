import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { LESSONS } from '../codex/js/listening-lessons.js';

test('lessons include original audio, transcript, summary and useful phrases', () => {
  assert.equal(LESSONS.length, 8);
  assert.equal(new Set(LESSONS.map(x => x.id)).size, LESSONS.length);
  for (const lesson of LESSONS) {
    assert.ok(lesson.title && lesson.accent && lesson.summary && lesson.transcript);
    assert.ok(lesson.phrases.length >= 3);
    assert.ok(statSync(new URL(`../codex/${lesson.audio}`, import.meta.url)).size > 1000);
  }
});
