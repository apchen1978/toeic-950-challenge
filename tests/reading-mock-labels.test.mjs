import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { bestSectionAccuracy, formatDuration } from '../codex/js/scoring.js';
import { isReadingFullForm } from '../codex/js/reading-rotation.js';

const source = readFileSync(new URL('../codex/js/app.js', import.meta.url), 'utf8');
const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const functions = source.slice(source.indexOf('function readingVariantBadge('), source.indexOf('function vocabLevelLabel('));
const readingCard = source.match(/<section class="card reading-full-card"[\s\S]*?<\/section>/)?.[0];
const fallbackLine = source.split(/\r?\n/).find((line) => line.includes('session.readingRotationFallback ?'));
const formerLabel = '\u539f\u7248';

function render(expression, data = {}) {
  return runInNewContext(`${functions}\n${expression}`, { bestSectionAccuracy, formatDuration, isReadingFullForm, ...data });
}

test('reading mock card, result badges and fallback render the fixed-version label', () => {
  assert.ok(readingCard && fallbackLine);
  const history = [{ formId: 'read-full-1', readingVariant: 'original', section: 'reading', correct: 75, total: 100, secUsed: 3300 }];
  const html = render('`' + readingCard + '`', { history });
  for (const n of [1, 2, 3]) assert.ok(html.includes(`開始閱讀模擬 ${n}（固定版）`));
  assert.ok(html.includes('再練一次（微調版，約 3 成換題）'));
  assert.match(html, /<\/div>\s*<p class="muted">固定版每次題目相同，方便比較進步；微調版約換 3 成同類型題目。兩者皆為本站原創模擬題，非 ETS 官方試題。<\/p>/);
  const badge = render('readingVariantBadge(entry)', { entry: history[0] });
  const rotationBadge = render('readingVariantBadge(entry)', { entry: { ...history[0], readingVariant: 'rotation' } });
  const fallback = render('`' + fallbackLine + '`', { session: { readingRotationFallback: true } });
  assert.match(badge, />固定版<\/span>/);
  assert.match(rotationBadge, />微調版<\/span>/);
  assert.match(fallback, /本次改用固定版題目。/);
  assert.ok(![html, badge, rotationBadge, fallback].some((fragment) => fragment.includes(formerLabel)));
  assert.ok(bank.meta.sets.every((set) => !set.label.includes(formerLabel)));
});

test('legacy original attempts still count toward the fixed version best score', () => {
  const base = { formId: 'read-full-1', section: 'reading', total: 100, secUsed: 3600 };
  const history = [
    { ...base, readingVariant: 'original', correct: 91 },
    { ...base, readingVariant: 'rotation', correct: 95 },
    { ...base, correct: 84 }
  ];
  const html = render('readingFullLast(history, "read-full-1")', { history });
  assert.match(html, /固定版最近成績 84\/100 題/);
  assert.match(html, /微調版已做 1 次/);
  assert.match(html, /最佳成績 · 固定版 91\/100 題 · 微調版 95\/100 題/);
  assert.ok(!html.includes(formerLabel));
});
