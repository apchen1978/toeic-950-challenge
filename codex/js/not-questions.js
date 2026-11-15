// NOT 題（「哪一項不是……」）：標出 NOT／EXCEPT、顯示解題提醒，並從題庫抽出 Part 7 的 NOT 題做專練。
// 純邏輯，不碰 DOM。

const NEGATIVE_PROMPT = /\bNOT\b|\bEXCEPT\b|\bleast likely\b|\bnot (?:mentioned|stated|indicated|included|listed|true)\b/;

// 只在聽力 Part 3、4 和閱讀 Part 7 的題幹判斷；Part 5、6 的 Not until 之類是文法句型，不是 NOT 題。
export function isNegativePrompt(prompt, part) {
  return [3, 4, 7].includes(Number(part)) && NEGATIVE_PROMPT.test(String(prompt ?? ""));
}

// 傳入已經 escape 過的題幹，把大寫的 NOT／EXCEPT 包上標示，其他文字不動。
export function markNot(escapedHtml) {
  return String(escapedHtml).replace(/\b(NOT|EXCEPT)\b/g, '<mark class="not-flag">$1</mark>');
}

export function notQuestionPool(bank, isActive = () => true) {
  const pool = [];
  for (const group of bank.groups) {
    if (group.part !== 7 || !isActive(group)) continue;
    for (const question of group.questions) {
      if (isNegativePrompt(question.prompt, group.part)) pool.push({ groupId: group.id, questionId: question.id });
    }
  }
  return pool;
}

// 抽 count 題（不足就全部）。prefer 是最近練過的題目代號，排在後面，盡量先出沒練過的。
export function pickNotQuestions(bank, { count = 10, random = Math.random, isActive = () => true, recent = [] } = {}) {
  const pool = notQuestionPool(bank, isActive);
  const seen = new Set(recent);
  const shuffled = pool.map((item) => [random(), item]).sort((a, b) => a[0] - b[0]).map((pair) => pair[1]);
  const ordered = [...shuffled.filter((item) => !seen.has(item.questionId)), ...shuffled.filter((item) => seen.has(item.questionId))];
  const picked = ordered.slice(0, count);
  return { questionIds: picked.map((item) => item.questionId), groupIds: [...new Set(picked.map((item) => item.groupId))] };
}
