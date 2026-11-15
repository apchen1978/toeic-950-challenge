// 每日備考排程：從考試日往回排，每天幾件小事。只是參考，不是規定；沒做完也不會有任何落後提示。
// 純邏輯，不碰 DOM。任務的 action／attrs 對應首頁既有按鈕（data-action）。

export const TASKS = {
  review: { label: "複習到期錯題", minutes: 10, action: "review-wrong", button: "開始複習" },
  weak: { label: "弱項練習", minutes: 15, action: "practice", button: "開始練習" },
  vocab: { label: "背 10 個精選單字", minutes: 5, action: "flash-quick", button: "開始背" },
  grammar: { label: "練 5 題文法", minutes: 5, action: "grammar-drill", button: "開始練" },
  speed: { label: "快速反應 10 題", minutes: 5, action: "speed-start", button: "開始快練" },
  speedP2: { label: "只練 Part 2 應答", minutes: 5, action: "speed-start", attrs: { mode: "response" }, button: "開始快練" },
  speedPos: { label: "只練 Part 5 詞性", minutes: 5, action: "speed-start", attrs: { mode: "pos" }, button: "開始快練" },
  listen1: { label: "聽力完整模擬 1", minutes: 42, action: "start-form", attrs: { form: "listen-full-1" }, button: "開始" },
  listen2: { label: "聽力完整模擬 2", minutes: 42, action: "start-form", attrs: { form: "listen-full-2" }, button: "開始" },
  listen1again: { label: "再練一次聽力模擬 1", minutes: 42, action: "start-form", attrs: { form: "listen-full-1" }, button: "開始" },
  read1: { label: "閱讀完整模擬 1", minutes: 75, action: "start-form", attrs: { form: "read-full-1" }, button: "開始" },
  read2: { label: "閱讀完整模擬 2", minutes: 75, action: "start-form", attrs: { form: "read-full-2" }, button: "開始" },
  read3: { label: "閱讀完整模擬 3", minutes: 75, action: "start-form", attrs: { form: "read-full-3" }, button: "開始" },
  miniListen: { label: "聽力快練 15 題", minutes: 6, action: "start-form", attrs: { form: "mini-listen-15" }, button: "開始" },
  miniRead: { label: "閱讀快練 12 題", minutes: 9, action: "start-form", attrs: { form: "mini-read-12" }, button: "開始" },
  notPractice: { label: "NOT 題專練 10 題", minutes: 12, action: "start-not", button: "開始" },
  checkMock: { label: "檢討剛做完的模擬：只看錯題和用時，找出最常失分的題型", minutes: 20 },
  preexam: { label: "看一遍「考前黃金流程」", minutes: 10, action: "preexam-open", button: "打開" },
  prepare: { label: "備好證件、交通和早點休息", minutes: 5 },
  rest: { label: "今天輕鬆：不加新東西，只做熟悉的", minutes: 0 }
};

// 依「距考試剩幾天」排。13 天以前用 generic；每天最多 2 件大事，其餘是小練習。
export const BY_DAYS_LEFT = {
  13: ["listen1", "review", "speed"],
  12: ["weak", "notPractice", "speedP2"],
  11: ["read1", "review"],
  10: ["checkMock", "miniRead", "notPractice"],
  9: ["weak", "vocab", "miniListen"],
  8: ["listen2", "review"],
  7: ["checkMock", "miniListen", "vocab", "grammar"],
  6: ["read2", "review"],
  5: ["checkMock", "weak", "miniRead"],
  4: ["weak", "miniListen", "miniRead", "vocab"],
  3: ["listen1again", "review"],
  2: ["read3", "miniListen"],
  1: ["rest", "miniListen", "miniRead", "preexam", "prepare"],
  0: ["preexam", "prepare"]
};
export const GENERIC_DAY = ["review", "speed", "vocab", "grammar", "weak"];

export const DAY_TITLES = {
  13: "先做一套聽力，當作起點",
  12: "補弱項，把前面題型練快",
  11: "第一次完整閱讀模擬",
  10: "檢討閱讀，不要全部重做",
  9: "補弱項，維持手感",
  8: "第二套聽力",
  7: "檢討聽力，補字彙與文法",
  6: "第二次完整閱讀模擬",
  5: "檢討閱讀，補 Part 7 弱點",
  4: "輕量補弱項",
  3: "出發前：聽力手感",
  2: "出發前：閱讀手感",
  1: "輕鬆一天，早點休息",
  0: "考試日"
};

// 本地日期字串（YYYY-MM-DD）相差幾天；用 UTC 計算避免日光節約與午夜誤差。
export function daysBetween(fromISO, toISO) {
  const parse = (iso) => { const [y, m, d] = String(iso).split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((parse(toISO) - parse(fromISO)) / 86400000);
}

export function toISO(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

// weakSkill：最弱題型的 key（可為 null）。沒有資料時，弱項練習改成 40 題快速模考。
export function dayPlan(left, { weakSkill = null } = {}) {
  if (left < 0) return { left, title: "考試已經結束", tasks: [], minutes: 0, over: true };
  const keys = BY_DAYS_LEFT[left] ?? GENERIC_DAY;
  const tasks = keys.map((key) => {
    const base = TASKS[key];
    if (key === "weak" && !weakSkill) {
      return { key, label: "快速模考 40 題（先找出弱項）", minutes: 24, action: "start-form", attrs: { form: "quick-40" }, button: "開始" };
    }
    if (key === "weak") return { key, ...base, attrs: { skill: weakSkill } };
    return { key, ...base };
  });
  return { left, title: DAY_TITLES[left] ?? "日常練習", tasks, minutes: tasks.reduce((sum, t) => sum + (t.minutes || 0), 0), over: false };
}

export function fullPlan(startLeft, options) {
  const out = [];
  for (let left = Math.max(0, startLeft); left >= 0; left -= 1) out.push(dayPlan(left, options));
  return out;
}

// 已完成紀錄：{ "2026-11-16": ["review", ...] }，只保留最近 30 天。
export function toggleDone(done, dateISO, key) {
  const current = new Set(done?.[dateISO] ?? []);
  if (current.has(key)) current.delete(key); else current.add(key);
  const next = { ...(done ?? {}), [dateISO]: [...current] };
  const dates = Object.keys(next).sort().slice(-30);
  return Object.fromEntries(dates.map((d) => [d, next[d]]));
}
