// 速度快練：把 Part 1–6 會用到的反應練快，省時間留給 Part 7。
// 純邏輯，不碰 DOM。題型：搭配詞（中文→英文片語）、同義改寫、Part 2 應答句型（文字版）。
import { COLLOCATIONS, PARAPHRASES, RESPONSES, POS_ITEMS } from "./phrases.js";

export const LIMITS = { collocation: 8, paraphrase: 8, response: 10, pos: 8 };
export const KIND_LABEL = { collocation: "搭配詞", paraphrase: "同義改寫", response: "Part 2 應答", pos: "Part 5 詞性" };

function shuffle(list, random) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function withOptions(kind, prompt, correct, wrongs, note, random) {
  const options = shuffle([correct, ...wrongs], random);
  return { kind, prompt, options, answer: options.indexOf(correct), note, limit: LIMITS[kind] };
}

function collocationItem(item, random) {
  const others = COLLOCATIONS.filter((c) => c[0] !== item[0] && c[1] !== item[1]);
  const wrongs = shuffle(others, random).slice(0, 3).map((c) => c[0]);
  return withOptions("collocation", item[1], item[0], wrongs, `${item[0]}：${item[2]}（${item[3]}）`, random);
}

function paraphraseItem(row, random) {
  const others = PARAPHRASES.filter((p) => p[0] !== row[0] && p[1] !== row[1]);
  const wrongs = shuffle(others, random).slice(0, 3).map((p) => p[1]);
  return withOptions("paraphrase", row[0], row[1], wrongs, `${row[0]} ≈ ${row[1]}（${row[2]}）`, random);
}

function posItem(row, random) {
  return withOptions("pos", row[0], row[1], [row[2], row[3], row[4]], `${row[1]}：${row[5]}`, random);
}

function responseItem(row, random) {
  return withOptions("response", row[0], row[1], [row[2], row[3]], row[4], random);
}

// 每題的穩定代號（題型＋題幹），用來記住答錯的題目，下一輪優先再出。
export function itemKey(kind, row) {
  return `${kind}|${kind === "collocation" ? row[1] : row[0]}`;
}

// 預設 10 題：搭配詞 3、同義改寫 2、Part 2 應答 3、Part 5 詞性 2，混合後出題。
// only 指定單一題型時，全部題目都出該題型。prefer 是之前答錯題目的代號，會排在同題型的最前面。
export function buildDrill({ count = 10, random = Math.random, only = null, prefer = [] } = {}) {
  const preferred = new Set(prefer);
  const pools = {
    collocation: [COLLOCATIONS, collocationItem],
    paraphrase: [PARAPHRASES, paraphraseItem],
    response: [RESPONSES, responseItem],
    pos: [POS_ITEMS, posItem]
  };
  const plan = only && pools[only]
    ? { [only]: count }
    : { collocation: Math.round(count * 0.3), paraphrase: Math.round(count * 0.2), pos: Math.round(count * 0.2) };
  if (!only || !pools[only]) plan.response = count - plan.collocation - plan.paraphrase - plan.pos;
  const items = Object.entries(plan).flatMap(([kind, n]) => {
    const [pool, make] = pools[kind];
    const mixed = shuffle(pool, random);
    const ordered = [...mixed.filter((row) => preferred.has(itemKey(kind, row))), ...mixed.filter((row) => !preferred.has(itemKey(kind, row)))];
    return ordered.slice(0, n).map((row) => ({ ...make(row, random), key: itemKey(kind, row) }));
  });
  return shuffle(items, random);
}

// results: [{ prompt, kind, correct: boolean, timedOut: boolean, sec: number, answerText }]
export function summarize(results) {
  const total = results.length;
  const right = results.filter((r) => r.correct).length;
  const timeouts = results.filter((r) => r.timedOut).length;
  const avgSec = total ? results.reduce((sum, r) => sum + r.sec, 0) / total : 0;
  const slowest = results.slice().sort((a, b) => b.sec - a.sec).slice(0, 3);
  return { total, right, timeouts, avgSec, slowest, missed: results.filter((r) => !r.correct) };
}
