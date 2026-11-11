import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync(new URL('../codex/data/questions.json', import.meta.url), 'utf8'));
const repaired = new Map([
  ['rd-new-062', '題幹截止日改為原文的 Wednesday'],
  ['rd-new-064', '正解改為 D；題型改為細節'],
  ['rd-new-076', '正解改為 B；題幹改為活動'],
  ...['rd-new-077', 'rd-new-078', 'rd-new-082', 'rd-new-084'].map((id) => [id, '重建錯置的四個選項；舊作答視為未作答']),
  ...['rd-new-002', 'rd-new-003', 'rd-new-011', 'rd-new-012', 'rd-new-017'].map((id) => [id, '排除多個可接受答案或牽強對比']),
  ...['L16', 'PA2-01', 'PA2-02', 'XF01', 'XF03', 'XF05', 'XF11', 'XL-P2-04', 'XS-L05'].map((id) => [id, '解析更新為目前的干擾選項']),
  ...['GXP301A', 'GXP302C', 'GXP303C', 'GXP304C', 'GXP305C', 'GXP306C', 'GXP401C', 'GXP402C', 'GXP403C', 'GXP404C', 'GXP405C'].map((id) => [id, '直接細節題能力標籤修正'])
]);

const stopwords = new Set('the a an and or to of in on for at by from with is are was were be been it they he she we you this that what who where when why how which will would should could does do did not as if about after before'.split(' '));
const words = (text) => new Set((text.toLowerCase().match(/[a-z]{3,}|\d+(?::\d+)?/g) ?? []).filter((word) => !stopwords.has(word)));

function bestExcerpt(text, question) {
  const target = words(`${question.prompt} ${question.options[question.answer]}`);
  const candidates = text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
  const ranked = candidates.map((line) => ({ line, score: [...words(line)].filter((word) => target.has(word)).length }));
  ranked.sort((a, b) => b.score - a.score);
  return (ranked[0]?.line ?? text).trim().slice(0, 320);
}

function evidence(group, question) {
  if (group.part === 1) return `Photo: ${group.image}; ${group.questions[0].explanation}`;
  if (group.section === 'listening') return bestExcerpt(group.script.map((line) => line.text).join('\n'), question);
  if (group.part === 5) return question.prompt.replace(/-{3,}/g, question.options[question.answer]);
  const docs = group.passage?.docs ?? [];
  if (question.crossRef && docs.length > 1) return docs.map((doc) => `${doc.label}: ${bestExcerpt(doc.text, question)}`).join(' | ');
  const ranked = docs.map((doc) => ({ label: doc.label, line: bestExcerpt(doc.text, question) }));
  const target = words(`${question.prompt} ${question.options[question.answer]}`);
  ranked.sort((a, b) => [...words(b.line)].filter((word) => target.has(word)).length - [...words(a.line)].filter((word) => target.has(word)).length);
  return `${ranked[0]?.label ?? 'Passage'}: ${ranked[0]?.line ?? question.prompt}`;
}

const csv = (value) => `"${String(value ?? '').replaceAll('"', '""').replaceAll(/\r?\n/g, ' ')}"`;
const rows = ['id,part,status,issue,evidence'];
for (const group of bank.groups) for (const question of group.questions) {
  const status = question.retired ? '退役' : repaired.has(question.id) ? '已修' : 'OK';
  const issue = repaired.get(question.id) ?? (question.retired ? '不再進入新練習' : '');
  rows.push([question.id, group.part, status, issue, evidence(group, question)].map((value, index) => index < 2 ? value : csv(value)).join(','));
}
mkdirSync(new URL('../audit/', import.meta.url), { recursive: true });
writeFileSync(new URL('../audit/answer-audit-2026-11-11.csv', import.meta.url), `${rows.join('\n')}\n`);
console.log(`${rows.length - 1} questions audited`);
