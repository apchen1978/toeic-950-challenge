// Reading pacing guide for the 100-question, 75-minute mock. Personal reference, not an official rule.
// Plan: Part 5 about 10 min, Part 6 about 8 min, Part 7 about 52 min, then about 5 min to check.

export const READING_PACE = [
  { part: 5, minutes: 10, leaveBy: 65 },
  { part: 6, minutes: 8, leaveBy: 57 },
  { part: 7, minutes: 52, leaveBy: 5 }
];
export const REVIEW_MINUTES = 5;

export function paceSummary() {
  return "配速參考：Part 5 約 10 分 → Part 6 約 8 分 → Part 7 約 52 分 → 留約 5 分檢查（個人整理，非官方規定）";
}

function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * One line for the current part: how long it has taken, when to move on, and whether the
 * remaining time is behind the plan.
 */
export function paceHint(part, remainingSeconds, partSeconds = {}) {
  const plan = READING_PACE.find((step) => step.part === part);
  if (!plan) return { text: "", behind: false };
  const used = clock(partSeconds[part] ?? 0);
  const checkpoint = plan.leaveBy * 60;
  const behind = remainingSeconds < checkpoint;
  if (part === 7) {
    if (remainingSeconds <= 60) return { text: `Part 7 已用 ${used}。最後一分鐘：還沒作答的題目每題都先選一個答案（答錯不倒扣）。`, behind: true };
    if (behind) return { text: `Part 7 已用 ${used}。已進入最後 ${REVIEW_MINUTES} 分鐘：先把沒作答的題目都選完，再回頭檢查有標記的題目。`, behind: true };
    return { text: `Part 7 已用 ${used}，建議約 ${plan.minutes} 分。目標：倒數剩 ${clock(checkpoint)} 時做完全部，留時間檢查。`, behind: false };
  }
  const next = part + 1;
  if (behind) return { text: `Part ${part} 已用 ${used}，已落後建議節奏（倒數剩 ${clock(checkpoint)} 前要進入 Part ${next}）。卡住的題目先猜一個答案並標記，馬上往下做。`, behind: true };
  return { text: `Part ${part} 已用 ${used}，建議約 ${plan.minutes} 分。目標：倒數剩 ${clock(checkpoint)} 前進入 Part ${next}。`, behind: false };
}
