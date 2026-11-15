// 速度快練：把 Part 1–6 會用到的反應練快，省時間留給 Part 7。
// 純邏輯，不碰 DOM。題型：搭配詞（中文→英文片語）、同義改寫、Part 2 應答句型（文字版）。
import { COLLOCATIONS, PARAPHRASES, RESPONSES } from "./phrases.js";

export const LIMITS = { collocation: 8, paraphrase: 8, response: 10 };
export const KIND_LABEL = { collocation: "搭配詞", paraphrase: "同義改寫", response: "Part 2 應答" };

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

function responseItem(row, random) {
  return withOptions("response", row[0], row[1], [row[2], row[3]], row[4], random);
}

// 預設 10 題：搭配詞 4、同義改寫 3、應答 3，混合後出題。
export function buildDrill({ count = 10, random = Math.random } = {}) {
  const plan = { collocation: Math.round(count * 0.4), paraphrase: Math.round(count * 0.3) };
  plan.response = count - plan.collocation - plan.paraphrase;
  const items = [
    ...shuffle(COLLOCATIONS, random).slice(0, plan.collocation).map((c) => collocationItem(c, random)),
    ...shuffle(PARAPHRASES, random).slice(0, plan.paraphrase).map((p) => paraphraseItem(p, random)),
    ...shuffle(RESPONSES, random).slice(0, plan.response).map((r) => responseItem(r, random))
  ];
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
