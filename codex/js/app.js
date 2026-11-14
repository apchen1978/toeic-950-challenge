import * as audio from "./audio.js";
import { VOCABULARY } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { PICKS } from "./vocab-picks.js";
import { PREEXAM_PRINCIPLE, PREEXAM_BLOCKS, PREEXAM_WARMUP, PREEXAM_TRAPS, PREEXAM_PACE, PREEXAM_RESCUE, PREEXAM_SOURCES } from "./preexam.js";
import { LESSONS } from "./listening-lessons.js";
import { migrateFlashcardProgress, rateCard, selectCards } from "./srs.js";
import { flatten, score, bestSectionAccuracy, estimateProgress, mergeSkillStats, weakest, groupsForSkill, updateWrongAnswerQueue, queueWrongReview, wrongAnswerDue, answeredWrong, answerLocked, formatDuration, normalizeMockSection, opensReadingAfterListening } from "./scoring.js";
import { sectionChoiceHtml, selectMockSection } from "./mock-section.js";
import { SKILLS, skillLabel } from "./skills.js";
import { remainingMs, pauseTimer, resumeTimer, elapsedSeconds, startTimedForm, startReading } from "./timer.js";
import { assembleQuickForm, avoidedGroupIds, createRng, isActiveGroup, rememberQuickDraw } from "./quick-form.js";
import { allowsReplay, buildOfficialSequence, isOfficialForm, listenProgressLabel, meanListeningMinutes, playbackRateFor, progressForStep, sequenceSeconds } from "./official-listening.js";
import { graphicHtml } from "./graphic.js";
import { paceHint, paceSummary } from "./pace.js";
import { assembleReadingRotation, isReadingFullForm, originalReadingGroups } from "./reading-rotation.js";
import { CHOICE_REVISION, migrateChoiceIndexes } from "./choice-legacy.js";
import { TIP_SECTIONS, TIPS_STORAGE_KEY, tipForPart, tipsEnabled } from "./tips.js";
import { ABILITIES, abilityStats, scoreBand } from "./abilities.js";

const EXAM_DATE = "2026-11-29";
const MAX_PLAYS = 2;
const LETTERS = ["A", "B", "C", "D"];
const STORAGE_PREFIX = location.pathname.includes('/codex/') ? 'toeic950.codex' : 'toeic950';
const KEY_SESSION = `${STORAGE_PREFIX}.session.v1`;
const KEY_HISTORY = `${STORAGE_PREFIX}.history.v1`;
const KEY_WRONG_QUEUE = `${STORAGE_PREFIX}.wrong-answers.v1`;
const KEY_WRONG_REASONS = `${STORAGE_PREFIX}.wrong-reasons.v1`;
const WRONG_REASONS = [
  ["listening", "沒聽清楚", "先看逐字稿，再遮住文字重聽一次。"],
  ["vocabulary", "單字不熟", "把生字連同例句一起複習。"],
  ["grammar", "文法／句型", "找出句子的主詞、動詞與修飾關係。"],
  ["misread", "看錯題目", "先圈出題目要問的對象與條件。"],
  ["time", "時間不夠", "先練短題組，記錄每組耗時。"],
  ["careless", "其實會，粗心", "交答案前再核對否定詞、時間與選項。"]
];

function wrongReasonPicker(qid) {
  const selected = store.get(KEY_WRONG_REASONS, {})[qid];
  return `<div class="wrong-reasons" role="group" aria-label="錯因標記"><p class="muted">看完解析後，記下這次錯因：</p>${WRONG_REASONS.map(([id, label]) => `<button type="button" class="btn small" data-action="wrong-reason" data-q="${esc(qid)}" data-reason="${id}" aria-pressed="${selected === id}">${label}</button>`).join('')}<span class="muted" data-reason-status role="status"></span></div>`;
}

function wrongReasonSummary() {
  const reasons = Object.values(store.get(KEY_WRONG_REASONS, {}));
  const ranked = WRONG_REASONS.map((reason) => ({ reason, count: reasons.filter((id) => id === reason[0]).length })).sort((a, b) => b.count - a.count);
  return ranked[0].count ? `<p>已標記錯題中最常見：<b>${ranked.filter((item) => item.count === ranked[0].count).map((item) => item.reason[1]).join('、')}</b>。${ranked[0].reason[2]}</p><p class="muted">每題保留最近一次錯因標記。</p>` : '';
}
const KEY_ACCENT = `${STORAGE_PREFIX}.accent-filter.v1`;
const KEY_TIPS = `${STORAGE_PREFIX}.${TIPS_STORAGE_KEY}`;
const KEY_PREEXAM = `${STORAGE_PREFIX}.preexam.v1`;
const KEY_VOCAB_LEVEL = `${STORAGE_PREFIX}.vocab-level.v1`;
const KEY_FLASHCARDS = `${STORAGE_PREFIX}.flashcards.v1`;
const KEY_FLASH_OPTIONS = `${STORAGE_PREFIX}.flash-options.v1`;
const KEY_QUICK_RECENT = `${STORAGE_PREFIX}.quick-recent.v1`;
const KEY_READING_ROTATION_RECENT = `${STORAGE_PREFIX}.reading-rotation-recent.v1`;
const KEY_MOCK_SECTION = `${STORAGE_PREFIX}.mock-section.v1`;
const flashItems = VOCABULARY.flatMap(group => group.words.map(item => ({ ...vocabParts(item), category: group.category, pick: PICKS.has(item[0]) })));
const KEY_GRAMMAR = `${STORAGE_PREFIX}.grammar.v1`;
const GRAMMAR_QUIZ = GRAMMAR.flatMap((topic) => topic.quiz.map((item, qi) => ({ topic, item, qi })));
// Saved grammar answers are keyed by question text: true = last answer was right.
function grammarProgress() { const saved = store.get(KEY_GRAMMAR, {}); return saved && typeof saved === "object" ? saved : {}; }
function grammarRight(topic, progress = grammarProgress()) { return topic.quiz.filter((item) => progress[item.q] === true).length; }
function grammarRightTotal(progress = grammarProgress()) { return GRAMMAR_QUIZ.filter(({ item }) => progress[item.q] === true).length; }
function grammarQuizHtml(topic, qi, number, label = "") {
  const item = topic.quiz[qi];
  return `<div class="grammar-quiz" data-grammar-quiz="${qi}">${label ? `<p class="section-kicker">${esc(label)}</p>` : ""}<p class="grammar-q"><b>${number}.</b> ${esc(item.q)}</p><div class="grammar-options" role="group" aria-label="選項">${item.options.map((opt, oi) => `<button type="button" class="btn small" data-action="grammar-answer" data-topic="${esc(topic.id)}" data-q="${qi}" data-i="${oi}">${String.fromCharCode(65 + oi)}. ${esc(opt)}</button>`).join("")}</div><p class="grammar-feedback" role="status" aria-live="polite"></p></div>`;
}
// Five questions across topics: unanswered or last-wrong first, then anything, in random order.
function grammarDrillPick(count = 5, random = Math.random) {
  const progress = grammarProgress();
  const shuffle = (list) => list.map((value) => [random(), value]).sort((a, b) => a[0] - b[0]).map((pair) => pair[1]);
  const open = shuffle(GRAMMAR_QUIZ.filter(({ item }) => progress[item.q] !== true));
  const done = shuffle(GRAMMAR_QUIZ.filter(({ item }) => progress[item.q] === true));
  return [...open, ...done].slice(0, count);
}
function renderGrammarDrill() {
  audio.stop();
  const picked = grammarDrillPick();
  const total = GRAMMAR_QUIZ.length;
  app.innerHTML = `<section class="card grammar-card grammar-drill"><p class="section-kicker">GRAMMAR PRACTICE</p><h1>文法 5 題快練</h1>
    <p class="muted">先出還沒答對的題目。點選項就會顯示對錯與原因，進度保存在這個瀏覽器。</p>
    <p>已答對 <b data-grammar-total>${grammarRightTotal()}</b> / ${total} 題</p>
    ${picked.map(({ topic, qi }, index) => grammarQuizHtml(topic, qi, index + 1, topic.title)).join("")}
    <div class="row"><button class="btn primary" data-action="grammar-drill">再來 5 題</button><button class="btn" data-action="home">回首頁</button></div></section>`;
  window.scrollTo(0, 0);
}
let flashQueue = [];
let flashRevealed = false;
const ACCENT_OPTIONS = [["all", "全部口音"], ["US", "美式 US"], ["UK", "英式 UK"], ["CA", "加拿大 CA"], ["AU", "澳洲 AU"]];
const ACCENT_LOCALE = { US: "en-US", UK: "en-GB", CA: "en-CA", AU: "en-AU" };

const app = document.getElementById("app");
function accentFilter() {
  const value = store.get(KEY_ACCENT, "all");
  return ACCENT_OPTIONS.some(([id]) => id === value) ? value : "all";
}
function matchesAccent(group) {
  const selected = accentFilter();
  return selected === "all" || group?.accent === selected;
}
function accentTag(group) {
  const label = ACCENT_OPTIONS.find(([id]) => id === group?.accent)?.[1];
  return label ? `<span class="tag accent-tag">${esc(label)}</span>` : "";
}
function mockSectionChoice() {
  return normalizeMockSection(store.get(KEY_MOCK_SECTION, "full"));
}
function sectionChoiceControl(groupName) {
  return sectionChoiceHtml(mockSectionChoice(), groupName);
}
function sectionBadge(section) {
  if (section === "reading") return `<span class="tag">單科成績：閱讀</span>`;
  if (section === "listening") return `<span class="tag">單科成績：聽力</span>`;
  return "";
}
function vocabLevel() {
  const value = store.get(KEY_VOCAB_LEVEL, "all");
  return ["all", "pick", "700", "800", "850", "900"].includes(value) ? value : "all";
}
function vocabParts(item) {
  const [word, meaning, example, level, pos = "", full = ""] = item;
  return { word, meaning, example, level, pos, full };
}
function vocabName(item) { return `${esc(item.word)}${item.full ? ` <span class="vocab-full">(${esc(item.full)})</span>` : ""}`; }
function readingVariantBadge(entry) {
  if (!isReadingFullForm(entry.formId)) return "";
  return `<span class="tag reading-variant">${entry.readingVariant === "rotation" ? "微調版" : "固定版"}</span>`;
}
function readingFullLast(history, formId) {
  const attempts = history.filter((entry) => entry.formId === formId);
  const originals = attempts.filter((entry) => entry.readingVariant !== "rotation");
  const rotations = attempts.filter((entry) => entry.readingVariant === "rotation");
  const last = originals.at(-1);
  const best = (entries) => {
    const result = bestSectionAccuracy(entries, "reading");
    return result ? `${result.correct}/${result.total} 題` : "—";
  };
  return `<p class="muted">固定版最近成績 ${last ? `${last.correct}/${last.total} 題 · ${formatDuration(last.secUsed)}` : "—"}</p>
    <p class="muted">微調版已做 ${rotations.length} 次</p>
    ${attempts.length ? `<p class="muted">最佳成績 · 固定版 ${best(originals)} · 微調版 ${best(rotations)}</p>` : ""}`;
}
function vocabLevelLabel(level) {
  return level === 900 ? "900 金色證書" : level === 850 ? "進階選讀" : level === 700 ? "常考單字" : "800 核心";
}
function vocabCounts() {
  const counts = { 700: 0, 800: 0, 850: 0, 900: 0 };
  for (const group of VOCABULARY) for (const item of group.words) counts[item[3]] += 1;
  return counts;
}
function paintVocab() {
  const level = vocabLevel();
  for (const entry of app.querySelectorAll("[data-vocab-level]")) {
    entry.hidden = level === "pick" ? entry.dataset.vocabPick !== "1" : level !== "all" && entry.dataset.vocabLevel !== String(level);
  }
  for (const group of app.querySelectorAll("[data-vocab-group]")) {
    const items = [...group.querySelectorAll("[data-vocab-level]")];
    const shown = items.filter((entry) => !entry.hidden).length;
    group.hidden = shown === 0;
    const count = group.querySelector("[data-vocab-count]");
    if (count) count.textContent = `${shown} 個詞條`;
  }
  for (const button of app.querySelectorAll("[data-vocab-filter]")) {
    const on = button.dataset.vocabFilter === level;
    button.classList.toggle("primary", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

let bank = null;
let session = null;
let wrongQueue = {};
let timerId = null;
let activePlay = null;

function unsupportedNotice() {
  return `<div class="notice" role="status">此瀏覽器未提供語音合成，無法進行聽力。請複製連結，再自行貼到外部 Chrome 開啟；也可選純閱讀練習。<div class="row"><input id="external-link" readonly aria-label="網站連結" value="${esc(location.origin + location.pathname)}"><button class="btn small" data-action="copy-link">複製連結</button><span id="copy-status" aria-live="polite"></span></div></div>`;
}

function needsAudio(ids) { return ids.some(id => groupById(id)?.section === 'listening'); }
function allowSession(ids) {
  if (!needsAudio(ids) || ids.every((id) => { const g = groupById(id); return g.section !== 'listening' || (g.audio ? audio.fileSupported() : audio.supported()); })) return true;
  const box = document.getElementById('unsupported-message');
  if (box) box.innerHTML = unsupportedNotice();
  return false;
}

const groupById = (id) => bank.groups.find((g) => g.id === id);
function questionsFor(entry) {
  const qs = flatten(bank, entry.groupIds).filter((q) => !entry.questionIds || entry.questionIds.includes(q.id));
  if (entry.formId) qs.sort((a, b) => entry.groupIds.indexOf(a.groupId) - entry.groupIds.indexOf(b.groupId));
  return qs;
}
const sessionQuestions = () => questionsFor(session);
const saveSession = () => { if (session) { session.savedAt = Date.now(); store.set(KEY_SESSION, session); } };

function questionsById() {
  const map = {};
  for (const group of bank.groups) for (const question of group.questions) map[question.id] = question;
  return map;
}

function migrateStoredChoices() {
  const lookup = questionsById();
  if (session?.answers) {
    const migrated = migrateChoiceIndexes(session.answers, session.choiceRevision, lookup);
    session.answers = migrated.answers;
    session.choiceRevision = migrated.revision;
    if (migrated.changed) saveSession();
  }
  const history = store.get(KEY_HISTORY, []);
  let historyChanged = false;
  for (const entry of history) {
    if (!entry?.answers) continue;
    const migrated = migrateChoiceIndexes(entry.answers, entry.choiceRevision, lookup);
    if (migrated.changed) {
      entry.answers = migrated.answers;
      entry.choiceRevision = migrated.revision;
      historyChanged = true;
    }
    const questions = questionsFor(entry);
    const result = score(questions, entry.answers);
    const answered = score(questions.filter((question) => entry.answers[question.id] !== undefined && entry.answers[question.id] !== null), entry.answers);
    if (entry.correct !== result.correct || entry.total !== result.total ||
      JSON.stringify(entry.bySkill) !== JSON.stringify(answered.bySkill) ||
      JSON.stringify(entry.bySection) !== JSON.stringify(answered.bySection)) {
      entry.correct = result.correct;
      entry.total = result.total;
      entry.bySkill = answered.bySkill;
      entry.bySection = answered.bySection;
      historyChanged = true;
    }
  }
  if (historyChanged) store.set(KEY_HISTORY, history);
}

async function init() {
  try {
    const res = await fetch("data/questions.json");
    bank = await res.json();
    for (const group of bank.groups) {
      if (group.section === "listening" && group.part >= 1 && group.part <= 4) group.audio = `audio/${group.id}.mp3`;
    }
  } catch {
    app.innerHTML = `<p class="notice">題庫載入失敗。請用 <code>node serve.mjs</code> 或 GitHub Pages 開啟，不要直接雙擊 index.html。</p>`;
    return;
  }
  try { audioManifest = await loadAudioManifest(); } catch { audioManifest = null; }
  session = store.get(KEY_SESSION, null);
  if (session && session.bankVersion !== bank.meta.version) session = null;
  migrateStoredChoices();
  const flashcardMigration = migrateFlashcardProgress(store.get(KEY_FLASHCARDS, {}));
  if (flashcardMigration.changed) store.set(KEY_FLASHCARDS, flashcardMigration.progress);
  wrongQueue = store.get(KEY_WRONG_QUEUE, {});
  document.getElementById("open-tips")?.addEventListener("click", () => renderTips());
  renderHome();
}

/* ---------- Home ---------- */
function minutesLabel(minutes) { return Number.isInteger(minutes) ? `${minutes} 分鐘` : `${Math.floor(minutes)} 分 ${Math.round((minutes % 1) * 60)} 秒`; }
function approxListeningMinutes(formId, samples = 1) {
  if (!audioManifest?.groups) return null;
  const randomFns = Array.from({ length: samples }, (_, index) => createRng(index + 1));
  return Math.max(1, Math.round(meanListeningMinutes(bank, audioManifest, formId, randomFns)));
}
function quickExamTimeCopy() {
  const section = mockSectionChoice();
  if (section === "reading") return "只考閱讀：40 題 15 分鐘、60 題 22 分 30 秒。";
  const quick40 = approxListeningMinutes("quick-40", 5);
  const quick60 = approxListeningMinutes("quick-60", 5);
  if (section === "listening") {
    if (!quick40 || !quick60) return "只考聽力：長度依音檔，沒有閱讀。";
    return `只考聽力：40 題約 ${quick40} 分鐘（依音檔）、60 題約 ${quick60} 分鐘（依音檔）。`;
  }
  if (!quick40 || !quick60) return "閱讀時間仍是 40 題 15 分鐘、60 題 22 分 30 秒。";
  return `40 題：聽力約 ${quick40} 分鐘（依音檔）＋閱讀 15 分鐘。<br>60 題：聽力約 ${quick60} 分鐘（依音檔）＋閱讀 22 分 30 秒。`;
}
function formExamTimeCopy() {
  const lengths = ["form-a", "form-b", "form-c", "form-d"].map((id) => approxListeningMinutes(id));
  if (lengths.some((length) => !length)) return "接著閱讀 100 題／75 分鐘。";
  const low = Math.min(...lengths);
  const high = Math.max(...lengths);
  const listening = low === high ? `約 ${low} 分鐘` : `約 ${low}–${high} 分鐘`;
  return `聽力${listening}（依音檔）＋閱讀 75 分鐘。`;
}
function vocabDueCount() {
  try { return selectCards(flashItems, store.get(KEY_FLASHCARDS, {}), { level: "all", category: "all", limit: 0 }).length; } catch { return 0; }
}

// Compact "today" row: what is waiting for review, one tap to start. Calm wording, no pressure.
function todayStrip(wrongDue, wordDue, history) {
  const lastEntry = history[history.length - 1];
  const lastText = lastEntry ? `上次練習 ${Math.round((lastEntry.correct / lastEntry.total) * 100)}%` : "還沒有練習紀錄";
  const item = (count, label, action, button, extra = "") => `<div class="today-item"><b>${count}</b><span>${label}</span>${count ? `<button type="button" class="btn small" data-action="${action}"${extra}>${button}</button>` : ""}</div>`;
  const empty = !wrongDue && !wordDue;
  const grammarDone = grammarRightTotal();
  return `<section class="today-strip" aria-label="今日待辦"><p class="today-title">今日<span class="muted"> · ${lastText}</span></p><div class="today-items">${item(wordDue, "單字待複習", "vocab-open", "複習單字")}${item(wrongDue, "錯題到期", "review-wrong", "複習錯題")}<div class="today-item"><b>${grammarDone}</b><span>/ ${GRAMMAR_QUIZ.length} 文法題答對</span></div></div>
    <p class="today-start-title">${empty ? "今天沒有到期的複習。花 10 分鐘，從這裡開始：" : "複習完，再花 10 分鐘："}</p>
    <div class="today-start"><button type="button" class="btn primary" data-action="flash-quick">背 10 個精選單字</button><button type="button" class="btn" data-action="grammar-drill">練 5 題文法</button></div></section>`;
}

const HOME_NAV = [["nav-preexam", "考前"], ["nav-mock", "模考"], ["nav-vocab", "單字"], ["nav-grammar", "文法"], ["nav-practice", "練習"], ["nav-review", "複習"]];

function examDaysLeft() {
  const days = Math.ceil((new Date(`${EXAM_DATE}T00:00:00`) - new Date()) / 86400000);
  return Number.isFinite(days) ? days : null;
}
function preExamCard() {
  const days = examDaysLeft();
  const left = days === null || days < 0 ? "" : days === 0 ? "今天就是考試日" : `距離考試還有 ${days} 天`;
  return `<section class="card preexam-card" id="nav-preexam" aria-labelledby="preexam-title">
      <p class="vocabulary-eyebrow">BEFORE THE TEST${left ? ` · ${esc(left)}` : ""}</p>
      <h2 id="preexam-title">考前 30 分鐘：找回題感</h2>
      <p class="muted">進考場前一小時看這個：該做什麼、不該做什麼、最容易錯的 10 件事，以及 10 分鐘暖身。手機在車上就能滑完。</p>
      <div class="vocab-actions"><button type="button" class="btn primary" data-action="preexam-open">打開考前黃金流程</button><button type="button" class="btn" data-action="start-warmup">Part 5 暖身 10 題</button></div>
    </section>`;
}
function preExamTicks() { const saved = store.get(KEY_PREEXAM, {}); return saved && typeof saved === "object" ? saved : {}; }
function renderPreExam() {
  audio.stop();
  const ticks = preExamTicks();
  const total = PREEXAM_BLOCKS.reduce((sum, block) => sum + block.items.length, 0);
  const done = PREEXAM_BLOCKS.reduce((sum, block) => sum + block.items.filter((item) => ticks[item.id]).length, 0);
  const days = examDaysLeft();
  app.innerHTML = `<section class="card preexam-page"><p class="section-kicker">BEFORE THE TEST${days !== null && days >= 0 ? ` · ${days === 0 ? "今天考試" : `還有 ${days} 天`}` : ""}</p><h1>考前黃金 30–60 分鐘</h1>
    <p class="preexam-principle">${esc(PREEXAM_PRINCIPLE)}</p>
    <p class="muted">整理自公開的備考建議與考生經驗，不是 ETS 官方規定，也不保證分數；實際規定以你的考試通知為準。已勾選 <b data-preexam-done>${done}</b> / ${total} 項。</p>
    ${PREEXAM_BLOCKS.map((block) => `<article class="preexam-block"><p class="section-kicker">${esc(block.when)}</p><h2>${esc(block.title)}</h2><p class="muted">${esc(block.intro)}</p>
      <ul class="preexam-list">${block.items.map((item) => `<li><label><input type="checkbox" data-action="preexam-tick" data-id="${esc(item.id)}"${ticks[item.id] ? " checked" : ""}><span>${esc(item.text)}</span></label></li>`).join("")}</ul>
      ${block.id === "gate" ? `<h3>題感暖機（約 10 分鐘）</h3><div class="preexam-warmup">${PREEXAM_WARMUP.map((w) => `<button type="button" class="btn" data-action="${esc(w.action)}"><b>${esc(w.label)}</b><small>${esc(w.hint)}</small></button>`).join("")}</div>` : ""}
    </article>`).join("")}
    <article class="preexam-block"><p class="section-kicker">THE TEN TRAPS</p><h2>最容易錯的 10 件事</h2><p class="muted">只看，不要背。看完就收手。</p>
      <ol class="preexam-traps">${PREEXAM_TRAPS.map((t) => `<li><span class="tag">${esc(t.part)}</span> <b>${esc(t.title)}</b><br><span class="muted">${esc(t.body)}</span></li>`).join("")}</ol></article>
    <article class="preexam-block"><p class="section-kicker">PACE</p><h2>${esc(PREEXAM_PACE.title)}</h2>
      <ul class="preexam-pace">${PREEXAM_PACE.rows.map((r) => `<li><b>${esc(r.label)}</b>　${esc(r.value)}</li>`).join("")}</ul><p class="muted">${esc(PREEXAM_PACE.note)}</p></article>
    <article class="preexam-block"><p class="section-kicker">IN THE ROOM</p><h2>考試中急救</h2>
      ${PREEXAM_RESCUE.map((r) => `<h3>${esc(r.title)}</h3><p>${esc(r.body)}</p>`).join("")}</article>
    <p class="tips-sources">參考：${PREEXAM_SOURCES.map((source) => `<a href="${esc(source.href)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`).join(" · ")}。個人整理，非官方，僅供練習參考。</p>
    <div class="row"><button type="button" class="btn" data-action="tips">各 Part 完整答題技巧</button><button type="button" class="btn" data-action="preexam-reset">清除勾選</button><button type="button" class="btn primary" data-action="home">回首頁</button></div></section>`;
  window.scrollTo(0, 0);
}

function grammarSection() {
  const quizCount = GRAMMAR_QUIZ.length;
  const progress = grammarProgress();
  const right = grammarRightTotal(progress);
  return `<section class="card grammar-card" id="nav-grammar" aria-labelledby="grammar-title">
      <p class="vocabulary-eyebrow">TOEIC GRAMMAR</p>
      <h2 id="grammar-title">多益常考文法</h2>
      <p class="muted">Part 5、Part 6 最常出現的 ${GRAMMAR.length} 個文法考點：祈使句、建議要求後接原形、過去分詞、詞性、代名詞、時態、主被動等。每個主題有規則、陷阱、例句和小練習（共 ${quizCount} 題）。內容由本站整理與自寫，不是 ETS 官方題目。</p>
      <p>已答對 <b data-grammar-total>${right}</b> / ${quizCount} 題</p>
      <progress aria-label="文法練習進度" data-grammar-bar value="${right}" max="${quizCount}"></progress>
      <div class="vocab-actions"><button type="button" class="btn primary" data-action="grammar-drill">練 5 題文法</button></div>
      <details class="grammar-list">
        <summary>展開文法重點與練習</summary>
        ${GRAMMAR.map((topic) => `<details class="grammar-topic" data-grammar-topic="${esc(topic.id)}"><summary>${esc(topic.title)} <span class="muted grammar-count" data-grammar-progress="${esc(topic.id)}">${grammarRight(topic, progress)}/${topic.quiz.length}</span></summary>
          <p>${esc(topic.rule)}</p>
          <ul class="grammar-clues">${topic.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
          <div class="grammar-examples">${topic.examples.map(([en, zh]) => `<p><b>${esc(en)}</b><br><span class="muted">${esc(zh)}</span></p>`).join("")}</div>
          <p class="grammar-trap"><b>常見陷阱：</b>${esc(topic.trap)}</p>
          ${topic.quiz.map((item, qi) => grammarQuizHtml(topic, qi, qi + 1)).join("")}
        </details>`).join("")}
      </details>
    </section>`;
}

// Section shortcuts: sticky bar on wide screens, bottom tab bar on phones. Text only, no icons.
function homeNav(reviewCount) {
  return `<nav class="home-nav" aria-label="首頁快速跳轉">${HOME_NAV.map(([id, label], i) => `<button type="button" class="home-nav-item${i === 0 ? " is-active" : ""}" data-action="home-jump" data-target="${id}">${label}${id === "nav-review" && reviewCount ? `<span class="home-nav-count" aria-label="${reviewCount} 項待複習">${reviewCount > 99 ? "99+" : reviewCount}</span>` : ""}</button>`).join("")}</nav>`;
}

let navFrame = 0;
function syncHomeNav() {
  navFrame = 0;
  const items = document.querySelectorAll(".home-nav-item");
  if (!items.length) return;
  const line = window.innerHeight * 0.35;
  let current = HOME_NAV[0][0];
  for (const [id] of HOME_NAV) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) current = id;
  }
  items.forEach((item) => item.classList.toggle("is-active", item.dataset.target === current));
}
window.addEventListener("scroll", () => { if (!navFrame) navFrame = requestAnimationFrame(syncHomeNav); }, { passive: true });

function renderHome() {
  stopTimer();
  audio.stop();
  pauseOfficialPlayback();
  const vocab = vocabCounts();
  const vocabTotal = vocab[700] + vocab[800] + vocab[850] + vocab[900];
  const history = store.get(KEY_HISTORY, []);
  const days = Math.ceil((new Date(`${EXAM_DATE}T00:00:00`) - new Date()) / 86400000);
  const weak = weakest(mergeSkillStats(history), 3, 2);
  const last = history[history.length - 1];
  const n = flatten(bank).length;
  const photoCount = bank.groups.filter((g) => g.section === "listening" && g.part === 1 && matchesAccent(g)).reduce((sum, g) => sum + g.questions.length, 0);
  const listeningQuestions = flatten(bank, bank.groups.filter((g) => g.section === "listening" && matchesAccent(g)).map((g) => g.id)).length;
  const readingQuestions = flatten(bank).filter((q) => q.section === "reading").length;
  const queuedQuestions = flatten(bank).filter((q) => wrongQueue[q.id]);
  const queueCount = queuedQuestions.length;
  const dueQuestions = queuedQuestions.filter((q) => wrongAnswerDue(wrongQueue[q.id]));

  const wordDue = vocabDueCount();
  app.innerHTML = `
    <header class="home-header">
      <p class="home-eyebrow">LISTENING &amp; READING <span aria-hidden="true">/</span> PRACTICE</p>
      <h1>TOEIC 950+<br><span>Challenge</span></h1>
      <p class="home-intro">上次 955，這次挑戰更高。<br>專注聽力與閱讀的推論、細節與交叉比對。</p>
      <p class="home-collab"><b>Paul × AI</b> 一起備考：Paul 決定方向與取捨，AI 一起腦力激盪、協助出題，並整理單字與文法，再由 Paul 實際練習、回饋、調整。</p>
    </header>
    ${homeNav(dueQuestions.length + wordDue)}
    ${todayStrip(dueQuestions.length, wordDue, history)}
    ${session ? resumeCard() : ''}
    ${preExamCard()}

    <section class="card reading-full-card" id="nav-mock" aria-labelledby="reading-full-title">
      <div class="reading-full-head"><span class="reading-full-badge">75 MIN</span><p class="section-kicker">READING MOCK · 閱讀完整模擬</p></div>
      <h2 id="reading-full-title">閱讀 100 題 · 75 分鐘（共三組）</h2>
      <p>Part 5 30 題 → Part 6 16 題 → Part 7 54 題，依正式順序作答，75 分鐘倒數。</p>
      <div class="reading-full-sets">
        ${[1, 2, 3].map((n) => `<div class="reading-full-set"><h3>閱讀模擬 ${n}</h3><p class="muted">100 題 · 75 分鐘 · 有配速提示</p>${readingFullLast(history, "read-full-" + n)}<button class="btn primary" data-action="start-form" data-form="read-full-${n}">開始閱讀模擬 ${n}（固定版）</button>${history.some((entry) => entry.formId === "read-full-" + n) ? `<button class="btn" data-action="start-reading-rotation" data-form="read-full-${n}">再練一次（微調版，約 3 成換題）</button>` : ""}</div>`).join("")}
      </div>
      <p class="muted">固定版每次題目相同，方便比較進步；微調版約換 3 成同類型題目。兩者皆為本站原創模擬題，非 ETS 官方試題。</p>
      <details class="card-more"><summary>配速提示與題目說明</summary>
        <p class="muted">可跳題與回頭修改。作答時畫面上方有配速提示：Part 5 約 10 分、Part 6 約 8 分、Part 7 約 52 分，留約 5 分檢查。提示只是參考，不是必須達到的標準。</p>
        <p class="muted">題目包含推論、NOT、句子插入位置、同義字、簡訊意圖與跨文件整合題，難度由簡單到進階混合。結果頁會顯示每個 Part 的用時與錯題的題型。題目為原創模擬題，不是 ETS 官方試題。</p>
      </details>
    </section>

    <section class="card quick-card"><p class="section-kicker">PRACTICE TEST</p><h2>快速模考</h2>
      <p>40 題或 60 題，正式模式；可選只考閱讀或聽力。<br>${quickExamTimeCopy()}</p>
      ${sectionChoiceControl("mock-section-quick")}
      <button class="btn primary" data-action="start-form" data-form="quick-40">開始 40 題快速模考</button>
      <button class="btn primary" data-action="start-form" data-form="quick-60">開始 60 題快速模考</button>
      <details class="card-more"><summary>正式模式與音檔說明</summary>
      <p class="muted">聽力依音檔連續播放，每題只播一次，沒有聽力倒數；完整模考播完才進入閱讀。</p>
      <p class="muted">聽力音檔輪流使用美式、英式、加拿大與澳洲口音。作答後才看得到該題口音。</p>
      <p class="muted">正式模式：每題只播一次，依正式考試停頓。Part 1、Part 2 每題後約停 5 秒；Part 3、Part 4 會唸出題目，每題後約停 8 秒，有圖表的題目約停 12 秒。</p>
      <p class="muted">依正式題型與時間近似縮小；對話和文章題組保留完整，因此各 Part 題數不是精確比例。每次從全部題庫隨機組題，依正式題型比例縮小；聽力四種口音平均，最近考過的題目會盡量避開。完成後可查看解析與非官方粗估。</p>
      <p class="muted">音檔是練習用的合成語音，存在這個網站裡，播放時不連到外部語音服務。不是 ETS 官方錄音。</p>
      </details>
    </section>



    <section class="card vocabulary-card" id="nav-vocab" aria-labelledby="vocabulary-title">
      <div class="vocab-hero">
        <div class="vocab-hero-copy">
          <p class="vocabulary-eyebrow">WORKPLACE VOCABULARY</p>
          <h2 id="vocabulary-title">職場字彙 <span>1900+</span></h2>
          <p class="vocab-hero-subtitle">常考單字入門 <span aria-hidden="true">·</span> 800 打底 <span aria-hidden="true">·</span> 900 衝金色證書 <span aria-hidden="true">·</span> 進階選讀</p>
        </div>
        <div class="vocab-seal" aria-hidden="true"><b>900</b><span>GOLD<br>CERTIFICATE</span></div>
      </div>
      <div class="vocab-stats" aria-label="字彙庫統計">
        <div class="vocab-stat"><b>${vocabTotal}</b><span>總詞條</span></div>
        <div class="vocab-stat"><b>${vocab[700]}</b><span>常考單字</span></div>
        <div class="vocab-stat"><b>${vocab[800]}</b><span>800 核心</span></div>
        <div class="vocab-stat vocab-stat-gold"><b>${vocab[900]}</b><span>900 金色證書</span></div>
        <div class="vocab-stat"><b>${vocab[850]}</b><span>進階選讀</span></div>
        <div class="vocab-stat"><b>${PICKS.size}</b><span>必背精選</span></div>
      </div>
      <p class="muted">不知道從哪開始？先背「必背精選」：從全部單字裡挑出最值得先學的 ${PICKS.size} 個。</p>
      <div class="vocab-actions">
        <button type="button" class="btn primary" data-action="flash-quick">背 10 個精選單字</button>
        <button type="button" class="btn" data-action="vocab-open">自訂背單字</button>
        <button type="button" class="btn vocab-gold-action" data-action="vocab-gold">只看 900 金色證書</button>
      </div>
      <details class="vocabulary-list">
        <summary>瀏覽單字與主題</summary>
        <p class="muted">全部會把常考單字、800 與 900 穿插列出。900 金色證書只收多益真的可能考到的字；較冷僻、偏專業的字放在「進階選讀」，想多學再看。例句由本站撰寫，並非官方題目或官方字表。</p>
        <div class="vocab-filters" role="group" aria-label="字彙程度">
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="pick">必背精選</button>
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="700">常考單字</button>
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="800">800 核心</button>
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="900">900 金色證書</button>
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="850">進階選讀</button>
          <button type="button" class="btn small" data-action="vocab-filter" data-vocab-filter="all">全部</button>
        </div>
        ${VOCABULARY.map((group) => `<details class="vocabulary-group" data-vocab-group><summary>${esc(group.category)} · <span data-vocab-count>${group.words.length} 個詞條</span></summary>${group.words.map((item) => { const entry = vocabParts(item); const { meaning, example, level, pos } = entry; return `<p class="${level === 900 ? "vocab-gold" : level === 700 ? "vocab-common" : level === 850 ? "vocab-adv" : "vocab-core"}" data-vocab-level="${level}"${PICKS.has(entry.word) ? ' data-vocab-pick="1"' : ""}><b>${vocabName(entry)}</b>${pos ? ` <span class="muted">${esc(pos)}</span>` : ""} <span class="tag">${vocabLevelLabel(level)}</span>${PICKS.has(entry.word) ? ' <span class="tag vocab-pick-tag">精選</span>' : ""} · ${esc(meaning)}<br><span class="muted">${esc(example)}</span></p>`; }).join("")}</details>`).join("")}
        <p><a href="https://www.toeic.com.tw/toeic/listening-reading/about/content/" target="_blank" rel="noopener noreferrer">參考：台灣多益官方測驗內容</a> · <a href="https://dictionary.cambridge.org/dictionary/english/" target="_blank" rel="noopener noreferrer">Cambridge Dictionary</a></p>
      </details>
    </section>

    ${grammarSection()}

    <section class="card lesson-entry" id="nav-practice"><p class="section-kicker">LISTENING LESSONS</p><h2>聽力小課程</h2><p>用職場情境練習聽力。先聽錄音，再看中文概要、英文逐字稿和實用片語。</p><button class="btn primary" data-action="lessons">開始聽小課程</button></section>
    <section class="practice-grid" aria-label="Listening 聽力與 Reading 閱讀練習">
      <article class="card practice-card listening-card">
        <div class="section-label">LISTENING</div>
        <h2>聽力練習</h2>
        <p class="practice-count">${listeningQuestions} 題</p>
        <p class="muted">集中練習聽力題組，逐組播放與作答。完整模考仍混合四種口音。</p>
        <label for="listen-rate">錄音語速</label>
        <select id="listen-rate" class="btn" data-action="listen-rate" aria-label="錄音語速">${[0.9, 1, 1.1].map((value) => `<option value="${value}" ${audio.getListenRate() === value ? "selected" : ""}>${value.toFixed(1)}×</option>`).join("")}</select>
        <label for="accent-filter">口音練習</label>
        <select id="accent-filter" class="btn" aria-label="聽力口音">${ACCENT_OPTIONS.map(([id, label]) => `<option value="${id}" ${accentFilter() === id ? "selected" : ""}>${label}</option>`).join("")}</select>
        <button class="btn primary" data-action="start-section" data-section="listening" ${listeningQuestions ? "" : "disabled"}>開始聽力練習</button>
        <button class="btn photo-entry" data-action="start-photo" ${session || !photoCount ? "disabled" : ""}>照片題試做（${photoCount} 題）</button>
      </article>
      <article class="card practice-card reading-card">
        <div class="section-label">READING</div>
        <h2>閱讀練習</h2>
        <p class="practice-count">${readingQuestions} 題</p>
        <p class="muted">直接進入純閱讀題，不會混入聽力。</p>
        <button class="btn primary" data-action="start-section" data-section="reading">開始閱讀練習</button>
      </article>
    </section>
    <p class="quiet-link"><button type="button" class="linkish" data-action="tips">考前技巧</button></p>

    <details class="card tips-card">
      <summary><span>答題技巧 · Tips</span><small>聽力、閱讀與考前複習</small></summary>
      <p class="muted">整理自近年考生心得；先用練習測試哪些方法適合自己。</p>
      <h3>聽力 Listening</h3>
      <ul>
        <li><b>照片題：</b>先看人物動作、物品位置，再聽完整句子；留意主詞和動作是否都符合照片。</li>
        <li><b>應答題：</b>抓住開頭是在問時間、地點、人物還是原因；間接回答也可能正確。不要只因選項出現相同單字就選或排除。</li>
        <li><b>對話與短講：</b>有時間時先看題目及圖表，聽時留意時間變更、轉折和最後決定；錯過一題就先跟上下一題。</li>
      </ul>
      <h3>閱讀 Reading</h3>
      <ul>
        <li><b>掌握時間：</b>練習時記下 Part 5、6 完成時間，保留足夠時間處理 Part 7；每次依正確率調整，不必套用固定配速。</li>
        <li><b>多篇閱讀：</b>先確認每份文件的日期、人物與目的，再交叉核對數字、限制條件和後續更新。</li>
        <li><b>卡題時：</b>先選較有把握的答案並記住題號；若還有時間，在同一測驗區內回頭檢查。</li>
      </ul>
      <h3>練完怎麼複習</h3>
      <p>聽力錯題先重聽，再對照逐字稿，分辨是沒聽清、字彙不熟還是誤解；閱讀錯題回原文找證據，再看解析。把重複錯誤留在錯題清單。</p>
      <p class="notice"><b>正式考試規則：</b>聽力和閱讀各有規定作答時間；不能在其中一區作答或修改另一區的答案。</p>
      <p class="tips-sources">參考：<a href="https://www.dcard.tw/f/english_tests/p/261823171" target="_blank" rel="noopener">Dcard 945 備考心得（2025）</a> · <a href="https://www.ptt.cc/bbs/TOEIC/M.1746338764.A.880.html" target="_blank" rel="noopener">PTT 990 考生心得（2025）</a> · <a href="https://www.toeic.com.tw/quick-links/faq/toeic-listening-reading/test-regulations/skip-section-prohibited" target="_blank" rel="noopener">台灣多益官方作答規定</a></p>
    </details>

    <section class="card">
      <h2>四套 200 題計時練習</h2>
      <p>每套可選完整模考、只考閱讀或只考聽力。聽力依音檔連續播放一次，沒有聽力倒數。${formExamTimeCopy()}A、B、C 題目維持原樣；D 保留原有 100 題閱讀，聽力則由 B、C 與非模考題池重組。聽力可暫停，暫停時音檔停在這一題。完整模考進入閱讀後不能返回聽力。</p>
      ${sectionChoiceControl("mock-section-forms")}
      <div class="row">${['a', 'b', 'c', 'd'].map((id) => `<button class="btn primary" data-action="start-form" data-form="form-${id}">開始第 ${id.toUpperCase()} 套</button>`).join('')}</div>
      <p class="muted">正式模式：每題只播一次，依正式考試停頓。</p>
    </section>
    <section class="card">
      <h2>題庫說明與其他練習</h2>
      <p>題庫共 ${n} 題原創模擬練習，依多益題型自行編寫，並非 ETS 官方試題。 All questions are original simulations based on TOEIC question types, not ETS official test questions. 題目附答案與解析；聽力文字稿預設收合，可自行展開，每段最多播放 ${MAX_PLAYS} 次。</p>
      <label for="test-set">今天練哪一套？</label>
      <select id="test-set" class="btn">${bank.meta.sets.map(s=>`<option value="${s.id}">${esc(s.label)} · ${s.durationMin} 分鐘</option>`).join('')}</select>
      <div class="row">
        ${session ? '<p class="muted">上次進度已保存在上方；選擇其他練習時，會先確認是否放棄舊進度。</p><button class="btn" data-action="start-diagnostic">開始所選新練習</button>' : `<button class="btn primary" data-action="start-diagnostic">開始完整／混合測驗</button>`}
      </div>
      <div id="unsupported-message">${audio.supported() ? '' : unsupportedNotice()}</div>
    </section>

    <section class="card" id="nav-review">
      <h2>弱項追蹤與推薦</h2>
      ${weak.length ? weak.map((w) => `
        <div class="skillrow"><div><b>${esc(skillLabel(w.skill))}</b><div class="muted">${esc(SKILLS[w.skill]?.tip ?? "")}</div></div>
        <div>${Math.round(w.acc * 100)}%<br><button class="btn small" data-action="practice" data-skill="${esc(w.skill)}">練習</button></div></div>`).join("")
        : `<p class="muted">完成第一次診斷後，這裡會列出你最弱的題型與練習建議。</p>`}
    </section>

    <section class="card">
      <h2>錯題複習</h2>
      <p>今天到期 <b>${dueQuestions.length}</b> 題／全部 <b>${queueCount}</b> 題</p>
      <p class="muted">第一次答對後隔至少 1 天再複習，第二次答對才畢業。提前重做不增加次數；答錯重新開始。聽力複習可看逐字稿、口音及重播。</p>
      <button class="btn primary" data-action="review-wrong" ${dueQuestions.length ? "" : "disabled"}>${dueQuestions.length ? `複習今天 ${dueQuestions.length} 題` : "目前沒有到期錯題"}</button>
      <div class="row">${[1,2,3,4,5,6,7].map((part) => { const count = dueQuestions.filter((q) => q.part === part).length; return count ? `<button class="btn small" data-action="review-wrong" data-part="${part}">Part ${part} · ${count} 題</button>` : ''; }).join('')}</div>
      ${wrongReasonSummary()}
    </section>

    <details class="card fold" id="voicecard"><summary><h2>聽力音色</h2><span class="fold-hint">試聽與語速設定</span></summary><p class="muted">先試聽，再開始。音色依此裝置與瀏覽器提供，清單優先排列較自然的候選音色。</p><label for="speech-rate">語速</label> <select class="btn" id="speech-rate"><option value="0.85">0.85× · 精聽</option><option value="1">1× · 正常</option><option value="1.1">1.1× · 挑戰</option></select><div id="voices" class="muted">載入語音中…</div></details>
    <details class="card fold"><summary><h2>官方樣題與練習方式</h2><span class="fold-hint">官方公開樣題連結</span></summary><p>先做一套練習，再從錯題解析找失分原因；閱讀可獨立練習。可選四套 200 題分段計時練習，或使用短題組；照片題目前有 ${photoCount} 題試做。</p><p><a href="https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" target="_blank" rel="noopener">ETS 官方公開樣題 PDF（含解答與聽力稿）</a> · <a href="https://toeic.com.tw/toeic/listening-reading/about/content/" target="_blank" rel="noopener">台灣官方題型與時間</a></p><p class="muted">官方內容於來源頁開啟；本機題庫與官方樣題分開。正式閱讀為 100 題、75 分鐘。</p></details>
    <details class="card fold"><summary><h2>正式考試與素材庫</h2><span class="fold-hint">正式題數、時間與官方範例</span></summary><p>正式 Listening 100 題／約 45 分鐘；Reading 100 題／75 分鐘。實際作答約 2 小時，連基本資料及問卷約 2.5 小時。</p><details><summary>查看正式題數分配</summary><p>Part 1 照片 6 題 · Part 2 應答 25 題 · Part 3 對話 39 題 · Part 4 獨白 30 題。</p><p>Part 5 句子填空 30 題 · Part 6 段落填空 16 題 · Part 7 單篇 29 題、多篇 25 題。</p></details><p>台灣官方範例（在來源頁練習與核對答案）：</p><ul><li><a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample03.html" target="_blank" rel="noopener">Part 3 聽力對話</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample04.html" target="_blank" rel="noopener">Part 4 聽力獨白</a></li><li><a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample05.html" target="_blank" rel="noopener">Part 5 句子填空</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample06.html" target="_blank" rel="noopener">Part 6 段落填空</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample07_03.html" target="_blank" rel="noopener">Part 7 多篇閱讀</a></li></ul><p class="muted">新增挑戰 03：聽力 20 題＋閱讀 20 題；也可只選閱讀 03。做完可以依錯題與弱項，決定下一回要練聽力、閱讀或照片題。</p></details>

    ${last ? `<section class="card"><h2>最近成績</h2>
      <div class="grid">
        <div class="stat"><b>${Math.round((last.correct / last.total) * 100)}%</b>正確率${last.peeked ? " · 練習成績" : ""}</div>
        <div class="stat"><b>${last.correct}/${last.total}</b>答對題數</div>
        <div class="stat"><b>${formatDuration(last.secUsed)}</b>耗時</div>
      </div></section>` : ""}

    ${history.length ? `<section class="card"><h2>作答紀錄</h2><table><thead><tr><th>日期</th><th>類型</th><th>正確率</th><th>耗時</th><th></th></tr></thead><tbody>
      ${history.slice().reverse().slice(0, 15).map((h) => `<tr><td>${new Date(h.date).toLocaleString("zh-TW", { hour12: false })}</td><td>${h.mode === "diagnostic" ? "完整／混合" : h.mode === "review" ? "錯題複習" : h.mode === "reading" ? "閱讀專練" : h.mode === "listening" ? "聽力專練" : "弱項練習"}${sectionBadge(h.section)}${readingVariantBadge(h)}${h.peeked ? ' <span class="tag practice">練習成績</span>' : ''}</td><td>${Math.round((h.correct / h.total) * 100)}%</td><td>${formatDuration(h.secUsed)}</td><td><button class="btn small" data-action="view" data-id="${h.id}">檢視</button></td></tr>`).join("")}
      </tbody></table></section>` : ""}
  `;
  document.getElementById('speech-rate').value = String(audio.getRate());
  paintVocab();
  fillVoices();
}

function flashSetup() {
  audio.stop();
  const progress = store.get(KEY_FLASHCARDS, {});
  const options = store.get(KEY_FLASH_OPTIONS, { level: 'pick', category: 'all', limit: 20 });
  const learned = flashItems.filter(item => (progress[item.word]?.box ?? 0) >= 4).length;
  const goldLearned = flashItems.filter(item => item.level === 900 && (progress[item.word]?.box ?? 0) >= 4).length;
  const started = flashItems.filter(item => progress[item.word]).length;
  const due = selectCards(flashItems, progress, { ...options, limit: 0 }).length;
  app.innerHTML = `<section class="card flash-card"><p class="section-kicker">VOCABULARY PRACTICE</p><h1>單字閃卡</h1><p>先回想意思，再翻面核對。進度保存在這個瀏覽器。</p>
    <p>已學會 ${learned} · 學習中 ${started - learned} · 未開始 ${flashItems.length - started}<br>900 金色證書：${goldLearned} / ${flashItems.filter(item => item.level === 900).length} 已學會</p><progress aria-label="900 進階學習進度" value="${goldLearned}" max="${flashItems.filter(item => item.level === 900).length}"></progress><p>目前篩選有 ${due} 個到期複習詞。</p>
    <div class="flash-settings"><label>程度 <select id="flash-level" class="btn"><option value="pick">必背精選</option><option value="all">全部</option><option value="700">常考單字</option><option value="800">800 核心</option><option value="900">900 金色證書</option><option value="850">進階選讀</option></select></label>
    <label>主題 <select id="flash-category" class="btn"><option value="all">全部主題</option>${VOCABULARY.map(group => `<option value="${esc(group.category)}">${esc(group.category)}</option>`).join('')}</select></label>
    <label>每日新字 <input id="flash-limit" type="number" min="0" max="100" value="${Math.max(0, Math.min(100, Number(options.limit) || 0))}"></label></div>
    <div class="row"><button class="btn primary" data-action="flash-start">開始練習</button><button class="btn" data-action="home">回首頁</button></div></section>`;
  document.getElementById('flash-level').value = options.level;
  document.getElementById('flash-category').value = options.category;
  window.scrollTo(0, 0);
}

function renderLessons() {
  stopTimer(); audio.stop();
  app.innerHTML = `<section class="card"><p class="section-kicker">LISTENING LESSONS</p><h1>聽力小課程</h1><p>先聽錄音，再展開概要與逐字稿。錄音可重播；內容為本站原創，使用合成語音。</p><button class="btn" data-action="home">回首頁</button></section>
    ${LESSONS.map((lesson, index) => `<article class="card lesson-card"><p class="section-kicker">LESSON ${index + 1} · ${esc(lesson.accent)}</p><h2>${esc(lesson.title)}</h2><audio controls preload="none" src="${esc(lesson.audio)}" data-lesson-audio="${esc(lesson.id)}">此瀏覽器無法播放音檔。</audio><div class="row"><button class="btn small" data-action="lesson-retry" data-lesson="${esc(lesson.id)}">重新載入並播放</button><span class="muted lesson-status" role="status"></span></div><details><summary>查看中文概要</summary><p>${esc(lesson.summary)}</p></details><details><summary>查看英文逐字稿</summary><p lang="en">${esc(lesson.transcript)}</p></details><details><summary>實用片語</summary><ul>${lesson.phrases.map(([phrase, meaning]) => `<li><b lang="en">${esc(phrase)}</b> · ${esc(meaning)}</li>`).join('')}</ul></details></article>`).join('')}`;
  window.scrollTo(0, 0);
}

function flashRender() {
  audio.stop();
  const item = flashQueue[0];
  if (!item) { app.innerHTML = `<section class="card"><h1>這組練習完成</h1><p>今天選取的單字都練習過了。</p><button class="btn primary" data-action="flash-setup">返回單字閃卡</button><button class="btn" data-action="home">回首頁</button></section>`; return; }
  app.innerHTML = `<section class="card flash-card ${item.level === 900 ? 'flash-gold' : ''}"><p class="section-kicker">${esc(item.category)} · 剩餘 ${flashQueue.length} 個</p><span class="tag">${vocabLevelLabel(item.level)}</span><h1>${vocabName(item)}</h1>${item.pos ? `<p>${esc(item.pos)}</p>` : ''}
    <button class="btn small" data-action="flash-speak" ${audio.supported() ? '' : 'disabled'}>播放發音</button><span class="muted" id="flash-audio-status" role="status">${audio.supported() ? '' : '此瀏覽器沒有語音，仍可繼續練習。'}</span>
    ${flashRevealed ? `<div class="flash-answer"><p><b>${esc(item.meaning)}</b></p><p>${esc(item.example)}</p></div><p>你記得這個字嗎？</p><div class="row"><button class="btn" data-action="flash-rate" data-rating="again">不會</button><button class="btn" data-action="flash-rate" data-rating="hard">有點模糊</button><button class="btn primary" data-action="flash-rate" data-rating="good">會</button></div>` : '<p>先想想意思，再翻面。</p><button class="btn primary" data-action="flash-flip">翻面看答案</button>'}
    <p id="flash-save-status" role="status"></p><p><button class="btn small" data-action="flash-setup">結束練習</button></p></section>`;
  window.scrollTo(0, 0);
}

let voiceLoad = 0;
function resumeCard() {
  const qs = sessionQuestions();
  const answered = qs.filter((q) => session.answers[q.id] !== undefined).length;
  const group = groupById(session.groupIds[session.cur]);
  const title = bank.meta.sets.find((set) => set.id === session.formId)?.label ?? (session.mode === 'reading' ? '閱讀練習' : session.mode === 'listening' ? '聽力練習' : '上次練習');
  const officialListening = session.official && session.phase === "listening";
  const place = officialListening
    ? `${listenProgressLabel(session.officialProgress)} · 正式模式：每題只播一次，依正式考試停頓`
    : `${group?.section === 'listening' ? '聽力' : '閱讀'} · Part ${group?.part ?? ''} · 第 ${session.cur + 1} 組<br>剩餘 ${formatDuration(Math.ceil(remainingMs(session) / 1000))}${Number.isFinite(session.pausedRemainingMs) ? '（已暫停）' : ''}`;
  return `<section class="card" aria-label="上次未完成的測驗"><h2>接續上次測驗</h2><p><b>${esc(title)}</b> ${readingVariantBadge(session)} · 已答 ${answered}/${qs.length} 題</p>
    <p>${place}</p>
    <p class="muted">最後儲存：${new Date(session.savedAt ?? session.startedAt).toLocaleString('zh-TW', { hour12: false })}。同一瀏覽器開啟此網址即可接續；清除網站資料會移除進度。</p>
    <div class="row"><button class="btn primary" data-action="resume">繼續上次測驗</button><button class="btn" data-action="discard">放棄這次進度</button></div></section>`;
}
async function fillVoices() {
  const request = ++voiceLoad;
  const box = document.getElementById("voices");
  if (!box) return;
  const voices = await audio.getVoices();
  if (request !== voiceLoad || document.getElementById("voices") !== box) return;
  const roles = [["M", "男聲"], ["W", "女聲"], ["N", "旁白（Part 2 選項）"]];
  const voiceNote = '<p class="muted">聽力題已使用四種口音的固定音檔。下方音色只在音檔載入失敗時，以及這裡的試聽使用。語速仍適用所有題目。</p>' + (voices.length < 2 ? '<p class="muted">此裝置可選英文音色少於兩種，語音合成備援會嘗試用音高區分角色。</p>' : '');
  box.innerHTML = voiceNote + roles.map(([r, label]) => `<div class="row" style="margin:6px 0"><label style="min-width:9em">${label}</label>
    <select data-voice="${r}" style="flex:1;min-width:0;font:inherit;padding:6px"><option value="">自動（推薦）</option>${voices.map((v) => `<option value="${esc(v.name)}" ${audio.getPref(r) === v.name ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>
    <button class="btn small" data-action="sample" data-role="${r}">試聽</button></div><p class="muted">目前：${esc(audio.roleVoiceInfo(r).name)}${audio.roleVoiceInfo(r).maleFallback ? '。未辨識到男聲，已調低音高；請試聽，或從清單指定更合適的音色。' : ''}</p>`).join("") + '<div class="row"><button class="btn small" data-action="retry-voices">重新載入音色</button><button class="btn small" data-action="reset-role-voices">恢復自動配音</button><span id="voice-status" role="status" aria-live="polite"></span></div>';
}

async function sampleVoice(role, button) {
  const status = document.getElementById('voice-status');
  if (status) status.textContent = '試聽中…';
  button.disabled = true;
  const ok = await audio.sample(role);
  if (button.isConnected) button.disabled = false;
  if (status?.isConnected) status.textContent = ok ? '試聽完成' : audio.errorMessage();
}

if (audio.supported()) speechSynthesis.addEventListener?.('voiceschanged', () => {
  if (document.getElementById('voices')) fillVoices();
});

/* ---------- Session ---------- */
function startSession(mode, groupIds, minutes, questionIds = null, formId = null, timing = {}, extra = null) {
  if (session && !confirm("目前有未完成的測驗。開始新測驗會放棄原進度，確定繼續？")) return false;
  if (!allowSession(groupIds)) return false;
  const now = Date.now();
  session = {
    bankVersion: bank.meta.version, choiceRevision: CHOICE_REVISION, mode, groupIds, questionIds, answers: {}, flags: {}, plays: {},
    cur: 0, startedAt: now, endsAt: now + minutes * 60000, minutes
  };
  if (formId) startTimedForm(session, formId, now, timing);
  if (extra) Object.assign(session, extra);
  if (session.section === "reading") {
    const reading = timing.reading ?? session.readingMinutes ?? 75;
    session.phase = "reading";
    session.phaseMinutes = reading;
    session.readingMinutes = reading;
    session.completedSeconds = 0;
    session.endsAt = now + reading * 60000;
  }
  saveSession();
  renderTest();
  return true;
}

let audioManifest = null;
async function loadAudioManifest() {
  if (audioManifest) return audioManifest;
  const res = await fetch("audio/manifest.json");
  if (!res.ok) throw new Error("manifest");
  audioManifest = await res.json();
  return audioManifest;
}

function officialExtra(listeningMinutes) {
  return {
    official: true,
    officialCursor: { index: 0, offset: 0 },
    officialProgress: null,
    officialStartedAt: Date.now(),
    officialPausedMs: 0,
    phaseMinutes: listeningMinutes
  };
}
function markOfficialHold() {
  if (session?.official && session.phase === "listening" && !session.officialHoldStartedAt) session.officialHoldStartedAt = Date.now();
}
function clearOfficialHold() {
  if (!session?.officialHoldStartedAt) return;
  session.officialPausedMs = (session.officialPausedMs ?? 0) + (Date.now() - session.officialHoldStartedAt);
  delete session.officialHoldStartedAt;
}

async function startQuickForm(formId) {
  const set = bank.meta.sets.find((item) => item.id === formId);
  if (!set) return;
  const recent = store.get(KEY_QUICK_RECENT, []);
  let manifest = { groups: {} };
  try { manifest = await loadAudioManifest(); } catch { manifest = { groups: {} }; }
  const accents = Object.fromEntries(Object.entries(manifest.groups ?? {}).map(([id, entry]) => [id, entry.accent]));
  const section = mockSectionChoice();
  const draw = assembleQuickForm(bank, formId, { avoid: avoidedGroupIds(recent), accents, section });
  const readingMinutes = set.timing?.reading ?? 75;
  const listeningMinutes = section === "reading" ? 0 : officialListeningMinutes(draw.groupIds, manifest);
  const started = section === "reading"
    ? startSession("diagnostic", draw.groupIds, readingMinutes, null, set.id, { reading: readingMinutes }, { official: true, section: "reading" })
    : startSession("diagnostic", draw.groupIds, listeningMinutes + (section === "listening" ? 0 : readingMinutes), null, set.id, { listening: listeningMinutes, reading: section === "listening" ? 0 : readingMinutes }, { ...officialExtra(listeningMinutes), section });
  if (started) store.set(KEY_QUICK_RECENT, rememberQuickDraw(recent, draw.groupIds, formId));
}

function officialListeningMinutes(groupIds, manifest) {
  const groups = groupIds.map((id) => groupById(id)).filter(Boolean);
  return sequenceSeconds(buildOfficialSequence(groups, manifest)) / 60;
}

function startReadingFull(formId, rotate = false) {
  const set = bank.meta.sets.find((item) => item.id === formId);
  if (!set) return;
  const originalIds = originalReadingGroups(bank, formId).map((group) => group.id);
  const minutes = set.timing?.reading ?? 75;
  const extra = { official: true, section: "reading", partSecs: { 5: 0, 6: 0, 7: 0 }, readingVariant: "original" };
  if (!rotate || !store.get(KEY_HISTORY, []).some((entry) => entry.formId === formId)) {
    startSession("diagnostic", originalIds, minutes, null, set.id, { reading: minutes }, extra);
    return;
  }
  const recent = store.get(KEY_READING_ROTATION_RECENT, []);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const draw = assembleReadingRotation(bank, formId, seed, recent);
  if (draw.fallback) extra.readingRotationFallback = true;
  else Object.assign(extra, { readingVariant: "rotation", rotationSeed: seed });
  const started = startSession("diagnostic", draw.groupIds, minutes, null, set.id, { reading: minutes }, extra);
  if (started && !draw.fallback) store.set(KEY_READING_ROTATION_RECENT, rememberQuickDraw(recent, draw.groupIds, formId));
}

async function startOfficialSet(formId) {
  const set = bank.meta.sets.find((item) => item.id === formId);
  if (!set) return;
  let manifest = { groups: {} };
  try { manifest = await loadAudioManifest(); } catch { manifest = { groups: {} }; }
  const section = mockSectionChoice();
  const ids = idsForSection(set.groupIds, section);
  const readingMinutes = set.timing?.reading ?? 75;
  const listeningMinutes = section === "reading" ? 0 : officialListeningMinutes(ids, manifest);
  if (section === "reading") startSession("diagnostic", ids, readingMinutes, null, set.id, { reading: readingMinutes }, { official: true, section: "reading" });
  else startSession("diagnostic", ids, listeningMinutes + (section === "listening" ? 0 : readingMinutes), null, set.id, { listening: listeningMinutes, reading: section === "listening" ? 0 : readingMinutes }, { ...officialExtra(listeningMinutes), section });
}

function idsForSection(ids, section) {
  const ordered = orderedGroupIds(ids).sort((a, b) => groupById(a).part - groupById(b).part);
  if (section === "reading") return ordered.filter((id) => groupById(id).section === "reading");
  if (section === "listening") return ordered.filter((id) => groupById(id).section === "listening");
  return ordered;
}

function orderedGroupIds(ids) {
  return bank.groups.filter((g) => ids.includes(g.id)).map((g) => g.id);
}

function startTimer() {
  stopTimer();
  if (session?.official && session.phase === "listening") return;
  const tick = () => {
    if (session?.partSecs && !Number.isFinite(session.pausedRemainingMs)) {
      const part = groupById(session.groupIds[session.cur])?.part;
      if (part in session.partSecs) session.partSecs[part] += 1;
    }
    const left = Math.ceil(remainingMs(session) / 1000);
    updatePaceHint(left);
    const el = document.getElementById("timer");
    if (el) {
      el.textContent = formatDuration(left);
      el.classList.toggle("low", left <= 300);
    }
    if (left <= 0) {
      if (session?.official && session.phase === "listening") return;
      stopTimer();
      if (session.phase === 'listening') {
        startReading(session, Date.now(), true);
        session.cur = session.groupIds.findIndex((id) => groupById(id).section === 'reading');
        saveSession();
        renderTest();
      } else submit(true);
    }
  };
  tick();
  if (session && !Number.isFinite(session.pausedRemainingMs) && !timerId) timerId = setInterval(tick, 1000);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

function updatePaceHint(leftSeconds) {
  if (!session?.partSecs) return;
  const el = document.getElementById("pace-hint");
  if (!el) return;
  const part = groupById(session.groupIds[session.cur])?.part;
  const hint = paceHint(part, leftSeconds, session.partSecs);
  el.textContent = hint.text;
  el.classList.toggle("behind", hint.behind);
}

function paceHintBlock(g) {
  if (!session?.partSecs || !isReadingFullForm(session.formId)) return "";
  const hint = paceHint(g.part, Math.ceil(remainingMs(session) / 1000), session.partSecs);
  return `<section class="pace-card"><p class="pace-summary">${esc(paceSummary())}</p></section>`;
}

// The live hint sits inside the sticky top bar so it stays visible while scrolling a long passage.
function paceLine(g) {
  if (!session?.partSecs || !isReadingFullForm(session.formId)) return "";
  const hint = paceHint(g.part, Math.ceil(remainingMs(session) / 1000), session.partSecs);
  return `<p id="pace-hint" class="pace-hint pace-inline${hint.behind ? " behind" : ""}" aria-live="polite">${esc(hint.text)}</p>`;
}

/* ---------- Test view ---------- */
function showTips() {
  return tipsEnabled(store.get(KEY_TIPS, true));
}

function isPartIntro(group) {
  if (!session) return false;
  return session.groupIds.find((id) => {
    const other = groupById(id);
    return other && other.part === group.part && other.section === group.section;
  }) === group.id;
}

function partTipBlock(group) {
  if (!isPartIntro(group)) return "";
  const tip = tipForPart(group.part);
  if (!tip) return "";
  if (!showTips()) return `<p class="part-tip"><button type="button" class="linkish" data-action="show-tips">顯示考前技巧</button></p>`;
  return `<p class="part-tip"><b>考前技巧</b> ${esc(tip.short)} <button type="button" class="linkish" data-action="hide-tips">隱藏技巧</button></p>`;
}

function renderTips() {
  app.innerHTML = `<section class="card tips-page"><p class="section-kicker">BEFORE THE TEST</p><h1>考前技巧</h1><p class="muted">以下只整理可以對上公開說明的做法。它不會改測驗時間，也不能保證分數。</p>
    ${TIP_SECTIONS.map((section) => `<article><h2>${esc(section.title)}</h2><p>${esc(section.short)}</p>
      ${section.tips.map((tip) => `<h3>${esc(tip.title)}</h3><p>${esc(tip.body)}</p><p class="muted">為什麼：${esc(tip.why)}</p>`).join("")}
      <p class="tips-sources">${section.personal ? "個人整理，非官方，僅供練習參考。" : `參考：${section.sources.map((source) => `<a href="${esc(source.href)}" target="_blank" rel="noopener">${esc(source.name)}</a>`).join(" · ")}`}</p>
    </article>`).join("")}
    <button type="button" class="btn" data-action="home">回首頁</button></section>`;
}

function passageTextHtml(text) {
  return text.split(/\n{2,}/).map((block) => {
    const rows = block.split("\n").map((line) => line.split("|").map((cell) => cell.trim()));
    const width = rows[0].length;
    if (rows.length < 2 || width < 2 || !rows.every((row) => row.length === width)) return esc(block);
    const body = rows.slice(1).filter((row) => !row.every((cell) => /^:?-+:?$/.test(cell)));
    return `<div class="passage-table" tabindex="0" role="region" aria-label="文件表格"><table><thead><tr>${rows[0].map((cell) => `<th scope="col">${esc(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }).join("\n\n");
}

function readingPassageHtml(group) {
  if (!group.passage) return "";
  const docs = group.passage.docs;
  const docId = (index) => `doc-${esc(group.id)}-${index}`;
  const links = group.id.startsWith("p7f-") && docs.length > 1
    ? `<nav class="passage-links" aria-label="跳至文件">${docs.map((doc, index) => `<a class="btn small" href="#${docId(index)}">${index + 1}. ${esc(doc.label)}</a>`).join("")}</nav>` : "";
  return links + docs.map((doc, index) => `<div class="doclabel" id="${docId(index)}">${esc(doc.label)}</div><div class="passage">${passageTextHtml(doc.text)}</div>`).join("");
}

function renderTest() {
  if (!officialRunning) audio.stop();
  const officialListening = session.official && session.phase === "listening";
  if (officialListening && !session.officialProgress) {
    session.officialProgress = progressForStep(session.groupIds.map(groupById).filter(Boolean), { groupId: session.groupIds[session.cur] });
  }
  if (!officialListening && session.phase && !Number.isFinite(session.pausedRemainingMs) && remainingMs(session) <= 0) {
    if (session.phase === 'listening') { startReading(session, Date.now(), true); saveSession(); }
    if (remainingMs(session) <= 0) { submit(true); return; }
  }
  const allowed = session.groupIds.map((id, i) => ({ id, i })).filter(({ id }) => !session.phase || groupById(id).section === session.phase);
  if (!allowed.some(({ i }) => i === session.cur)) session.cur = allowed[0].i;
  if (Number.isFinite(session.pausedRemainingMs)) {
    stopTimer();
    const pausedNote = officialListening
      ? `${listenProgressLabel(session.officialProgress)}。音檔停在這一題，繼續後從剛才的位置接著播。正式模式：每題只播一次，依正式考試停頓`
      : `剩餘時間 <b>${formatDuration(Math.ceil(remainingMs(session) / 1000))}</b>。作答與倒數已暫停，進度已存在這個瀏覽器。`;
    const mistakes = answeredWrong(sessionQuestions(), session.answers);
    app.innerHTML = `<section class="card"><h1>${officialListening ? "聽力已暫停" : "測驗已暫停"}</h1><p>${pausedNote}</p>
      <div class="row"><button class="btn primary" data-action="resume-timer">繼續測驗</button><button class="btn" data-action="open-peek" ${mistakes.length ? "" : "disabled"}>看目前錯題（${mistakes.length}）</button><button class="btn" data-action="home">暫停並回首頁</button></div>
      <div class="peek-confirm notice" id="peek-confirm" hidden><p>看錯題後，這次會改記為練習成績，不計入五力估分與最佳成績。</p><div class="row"><button class="btn primary" data-action="confirm-peek">確定看錯題</button><button class="btn" data-action="cancel-peek">取消</button></div></div>
      </section>${session.peeked ? `<section class="card"><p><span class="tag practice">練習成績</span> 已看過錯題，這次不計入五力估分與最佳成績。已作答的題目不能再改。</p></section>` : progressCard(sessionQuestions(), session.answers)}`;
    return;
  }
  const qs = sessionQuestions();
  const g = groupById(session.groupIds[session.cur]);
  const answeredCount = qs.filter((q) => session.answers[q.id] !== undefined).length;
  const isLast = session.cur === allowed.at(-1).i;
  const spoken = !!g.spokenOptions;
  const clock = officialListening
    ? `<b id="listen-progress">${listenProgressLabel(session.officialProgress)}</b>`
    : `${session.phase ? `<b>${session.phase === 'listening' ? '聽力' : '閱讀'} ${minutesLabel(session.phaseMinutes)}</b>` : ''}<span class="timer" id="timer">--:--</span>`;

  app.innerHTML = `
    <div class="topbar">
      <div><span class="tag">${session.mode === "review" ? "錯題複習" : g.section === "listening" ? "Listening" : "Reading"}</span><span class="tag">Part ${g.part}</span><span class="muted">${esc(g.title ?? "")}</span>${readingVariantBadge(session)}${session.official ? `<span class="tag">正式模式：每題只播一次，依正式考試停頓</span>` : ""}</div>
      <div class="row">${clock}<span class="muted" id="count">${answeredCount}/${qs.length} 已答</span><button class="btn small" data-action="pause-timer">暫停／看估分</button><button class="btn small primary" data-action="submit">提前交卷</button></div>
      ${paceLine(g)}
    </div>

    ${session.readingRotationFallback ? '<p class="notice" role="status">目前無法抽到符合規格的微調版，本次改用固定版題目。</p>' : ""}
    ${paceHintBlock(g)}
    ${partTipBlock(g)}
    <section class="card">
      ${g.image ? `<img class="question-image" src="${esc(g.image)}" alt="${g.part === 1 ? "照片題圖片" : "聽力題組附圖"}；若圖片載入失敗，請連網重新開啟。">` : ""}
      ${graphicHtml(g.graphicView)}
      ${g.script ? audioBlock(g) : ""}
      ${readingPassageHtml(g)}
      ${g.questions.filter((q) => !session.questionIds || session.questionIds.includes(q.id)).map((q) => questionBlock(q, qs, spoken)).join("")}
      ${g.script ? `${session.mode === 'review' ? accentTag(g) : ''}${transcriptBlock(g, session.mode !== 'review')}` : ''}
    </section>

    <div class="row nav-bar">
      <button class="btn" data-action="prev" ${session.cur === allowed[0].i ? "disabled" : ""}>← 上一組</button>
      <span class="muted">${session.cur + 1} / ${session.groupIds.length}</span>
      <button class="btn ${isLast ? "" : "primary"}" data-action="next" ${isLast ? "disabled" : ""}>下一組 →</button>
      ${isLast && session.phase === 'listening' && !session.official ? `<button class="btn primary" data-action="begin-reading">結束聽力，開始閱讀 ${minutesLabel(session.readingMinutes ?? 75)}</button>` : ''}
    </div>

    <section class="card"><h3>題號${session.phase ? '（只能作答目前區段）' : ''}</h3><div class="palette">${qs.map((q, i) => `<button class="pal ${session.answers[q.id] !== undefined ? "answered" : ""} ${session.flags[q.id] ? "flag" : ""} ${q.groupId === g.id ? "current" : ""}" data-action="jump" data-group="${q.groupId}" ${session.phase && q.section !== session.phase ? 'disabled' : ''} aria-label="第 ${i + 1} 題">${i + 1}</button>`).join("")}</div></section>
  `;
  startTimer();
  if (session.official && session.phase === "listening" && !Number.isFinite(session.pausedRemainingMs) && !officialRunning) {
    officialRunning = true;
    runOfficialSequence();
  }
}

function progressCard(questions, answers) {
  const progress = estimateProgress(questions, answers);
  const wrong = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== q.answer);
  const labels = { listening: '聽力', structure: '句型／結構（Part 6）', grammar: '文法', reading: '閱讀理解（Part 7）', vocabulary: '詞彙' };
  const range = (key) => {
    const section = progress.sections[key];
    const estimate = progress.ranges[key];
    return estimate ? `${estimate.low}–${estimate.high}（中間值約 ${estimate.mid}；已答 ${section.n} 題）` : `已答 ${section.n} 題；至少 5 題後顯示粗估`;
  };
  const listening = progress.ranges.listening;
  const reading = progress.ranges.reading;
  const total = listening && reading ? `${listening.low + reading.low}–${listening.high + reading.high}（中間值約 ${listening.mid + reading.mid}）` : '聽力與閱讀各至少答 5 題後顯示';
  const wrongReview = wrong.length ? `<section class="pause-review" aria-labelledby="pause-review-title"><h2 id="pause-review-title">本次錯題 <span class="muted">${wrong.length} 題</span></h2><p class="muted">先看你的答案與正解；需要時再展開解析。</p>
    ${wrong.map((q) => {
      const chosen = answers[q.id];
      const group = groupById(q.groupId);
      const number = questions.findIndex((item) => item.id === q.id) + 1;
      return `<article class="pause-review-item"><p class="pause-review-meta">第 ${number} 題 · Part ${q.part}${group?.title ? ` · ${esc(group.title)}` : ''} ${accentTag(group)}</p><p class="pause-review-prompt">${esc(q.prompt)}</p>
        <p class="pause-review-answer"><span class="pause-review-wrong">你的答案：${LETTERS[chosen] ?? ''}. ${esc(q.options[chosen] ?? '')}</span><span class="pause-review-correct">正確答案：${LETTERS[q.answer] ?? ''}. ${esc(q.options[q.answer] ?? '')}</span></p>
        <details class="pause-review-explanation"><summary>查看答錯原因</summary><div class="explain">${q.explanation ? esc(q.explanation) : '此題尚未提供解析，可先依正確答案自行檢查。'}</div>${wrongReasonPicker(q.id)}</details></article>`;
    }).join('')}
  </section>` : `<section class="pause-review"><h2>本次錯題</h2><p class="muted">目前沒有已答錯的題目。未作答題目不列為錯題。</p></section>`;
  return `<section class="card"><h2>目前作答表現</h2><p class="notice">僅依已答題推算，空白題不算錯。下列分數區間是練習參考，並非 ETS 分數；選題難度和樣本量會影響結果。ETS 每份試卷另行換算量尺分數，<a href="https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf" target="_blank" rel="noopener">官方說明</a>。</p>
    <p><b>總分粗估：</b>${total}<br><b>聽力粗估：</b>${range('listening')}<br><b>閱讀粗估：</b>${range('reading')}</p>
    ${Object.entries(labels).map(([key, label]) => { const v = progress.categories[key]; return `<div class="skillrow"><div>${label}</div><div>${v.n ? `${v.c}/${v.n}（${Math.round(v.c / v.n * 100)}%）` : '尚無已答題'}</div></div>`; }).join('')}
  </section>${wrongReview}`;
}

function transcriptBlock(g, duringPractice = false) {
  return `<details class="script" ${session?.mode === 'review' && duringPractice === false ? 'open' : ''}><summary>查看聽力文字稿 · Transcript</summary>
    ${duringPractice ? '<p class="muted">練習提示：展開會看到聽力內容，計時仍會繼續。</p>' : ''}
    ${g.script.map((line) => `<p><span class="tag">${line.speaker === 'M' ? 'Man' : line.speaker === 'W' ? 'Woman' : 'Narrator'}</span>${esc(line.text)}</p>`).join('')}
    ${g.spokenOptions ? g.questions.map((q) => q.options.map((option, i) => `<p><b>${LETTERS[i]}.</b> ${esc(option)}</p>`).join('')).join('') : ''}
  </details>`;
}

function listenRateControl() {
  const rate = audio.getListenRate();
  return `<label class="listen-rate">語速 <select class="btn small" data-action="listen-rate" aria-label="錄音語速">${[0.9, 1, 1.1].map((value) => `<option value="${value}" ${rate === value ? "selected" : ""}>${value.toFixed(1)}×</option>`).join("")}</select></label>`;
}

function audioBlock(g) {
  if (!allowsReplay(session)) {
    return `<div class="audio official-audio" data-gid="${g.id}">
      <p class="muted official-label">正式模式：每題只播一次，依正式考試停頓</p>
      <p class="muted"><span class="status" data-official-status role="status">聽力連續播放中</span> <button class="btn small" data-action="official-resume-audio" hidden>點一下繼續播放</button></p>
    </div>`;
  }
  const used = session.plays[g.id] ?? 0;
  const left = MAX_PLAYS - used;
  const recording = g.audio;
  return `<div class="audio" data-gid="${g.id}">
    <button class="btn primary" data-action="play" data-group="${g.id}" ${left <= 0 || !(recording ? audio.fileSupported() : audio.supported()) ? "disabled" : ""}>▶ 播放語音</button>
    ${listenRateControl()}
    ${left <= 0 ? `<button class="btn small" data-action="reset-plays" data-group="${g.id}">恢復本題播放次數</button>` : ''}
    <button class="btn small" data-action="stop-play" disabled>停止播放</button>
    <span class="muted"><span class="plays">剩餘 ${left} 次</span> · <span class="status" role="status" aria-live="polite">完整播放才計次；中斷或失敗不扣次數。</span></span>
  </div>`;
}

function questionBlock(q, qs, spoken) {
  const num = qs.findIndex((x) => x.id === q.id) + 1;
  const picked = session.answers[q.id];
  const locked = answerLocked(session, q.id);
  return `<div class="q" data-qid="${q.id}">
    <div class="row" style="justify-content:space-between"><b>${num}. ${esc(q.prompt)}</b>
    <button class="btn small" data-action="flag" data-q="${q.id}">${session.flags[q.id] ? "取消標記" : "標記"}</button></div>
    ${locked ? `<p class="muted">這題已作答，看過錯題後不能再改。</p>` : ""}
    <div class="opts">${q.options.map((o, i) => `<button class="opt ${spoken ? "letter-only" : ""} ${picked === i ? "selected" : ""}" data-action="pick" data-q="${q.id}" data-i="${i}" aria-label="選項 ${LETTERS[i]}" ${locked ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span>${spoken ? "" : `<span>${esc(o)}</span>`}</button>`).join("")}</div>
  </div>`;
}

function renderPeek() {
  audio.stop();
  const questions = sessionQuestions();
  const mistakes = answeredWrong(questions, session.answers);
  app.innerHTML = `<div class="peek-bar"><button class="btn primary" data-action="resume-timer">回到考試</button><span class="muted">看目前錯題（${mistakes.length}）</span></div>
    <h1>目前錯題</h1>
    ${session.peeked ? `<p><span class="tag practice">練習成績</span> 這次不計入五力估分與最佳成績。回到考試後，已作答的題不能再改。</p>` : ""}
    <div class="peek-list">${mistakes.length ? mistakes.map((q) => peekItem(q, questions)).join("") : `<section class="card"><p>目前沒有已答錯的題目。未作答的題不算錯。</p></section>`}</div>`;
  window.scrollTo(0, 0);
}

function peekItem(q, questions) {
  const chosen = session.answers[q.id];
  const group = groupById(q.groupId);
  const number = questions.findIndex((item) => item.id === q.id) + 1;
  const queued = (session.reviewQueued ?? []).includes(q.id) || (wrongQueue[q.id] && wrongQueue[q.id].stage !== 1);
  return `<article class="peek-item"><h3>第 ${number} 題 · Part ${q.part}${group?.title ? ` · ${esc(group.title)}` : ""}</h3>
    <p class="pause-review-prompt">${esc(q.prompt)}</p>
    <div class="opts">${q.options.map((option, index) => `<div class="opt ${index === q.answer ? "correct" : index === chosen ? "wrong" : ""}"><span class="letter">${LETTERS[index]}</span><span>${esc(option)}${index === q.answer ? " ✓" : ""}${index === chosen && index !== q.answer ? " （你的答案）" : ""}</span></div>`).join("")}</div>
    <div class="explain">${q.explanation ? esc(q.explanation) : "此題尚未提供解析。"}</div>
    ${group?.script ? `${transcriptBlock(group, false)}${group.audio ? `<div class="audio"><button class="btn small" data-action="peek-play" data-group="${group.id}">▶ 播放這一題音檔</button><span class="status muted" role="status"></span></div>` : ""}` : ""}
    <button class="btn small" data-action="queue-wrong" data-q="${q.id}" ${queued ? "disabled" : ""}>${queued ? "已在錯題複習" : "加入錯題複習"}</button>
  </article>`;
}

let officialToken = 0;
let officialRunning = false;
let officialPlayer = null;
let officialSilence = null;
let officialFinish = null;
let officialAudioRetry = null;

function pauseOfficialPlayback() {
  if (!session?.official) return;
  officialToken += 1;
  officialRunning = false;
  if (officialSilence) officialSilence.stop();
  if (officialPlayer && session.officialCursor) {
    session.officialCursor.offset = Number(officialPlayer.currentTime) || 0;
    officialPlayer.pause();
    officialPlayer = null;
  }
  const finish = officialFinish;
  officialFinish = null;
  finish?.(false);
}

function showOfficialProgress(groups, step) {
  session.officialProgress = progressForStep(groups, step);
  const el = document.getElementById("listen-progress");
  if (el) el.textContent = listenProgressLabel(session.officialProgress);
}

function waitOfficialSilence(totalSec, alreadySec, token) {
  const ms = Math.max(0, (totalSec - alreadySec) * 1000);
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setTimeout(() => {
      officialSilence = null;
      resolve(token === officialToken);
    }, ms);
    officialSilence = {
      stop() {
        if (session?.officialCursor) session.officialCursor.offset = alreadySec + (Date.now() - started) / 1000;
        clearTimeout(timer);
        officialSilence = null;
        resolve(false);
      }
    };
  });
}

function playOfficialClip(url, offset, token, onTime) {
  return new Promise((resolve) => {
    const player = new Audio(url);
    officialPlayer = player;
    player.preload = "auto";
    player.playbackRate = playbackRateFor(session, audio.getListenRate());
    player.preservesPitch = true;
    player.webkitPreservesPitch = true;
    player.mozPreservesPitch = true;
    let settled = false;
    let timer = null;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (officialPlayer === player) officialPlayer = null;
      if (officialFinish === finish) officialFinish = null;
      resolve(ok);
    };
    const arm = () => { clearTimeout(timer); timer = setTimeout(() => finish(false), 20000); };
    officialFinish = finish;
    player.onended = () => finish(token === officialToken);
    player.onerror = () => finish(false);
    player.ontimeupdate = () => { if (token === officialToken) { arm(); onTime(player.currentTime || 0); } };
    arm();
    const begin = () => {
      if (token !== officialToken) return finish(false);
      if (offset > 0.25) {
        try { player.currentTime = offset; } catch { /* seek when the browser allows it */ }
      }
      player.play().then(() => {
        const button = document.querySelector('[data-action="official-resume-audio"]');
        if (button) button.hidden = true;
      }).catch(() => {
        clearTimeout(timer);
        const status = document.querySelector("[data-official-status]");
        if (status) status.textContent = "瀏覽器需要再點一次才會播放。";
        const button = document.querySelector('[data-action="official-resume-audio"]');
        if (button) button.hidden = false;
        officialAudioRetry = () => {
          arm();
          player.play().then(() => { if (button) button.hidden = true; }).catch(() => finish(false));
        };
      });
    };
    if (player.readyState >= 1) begin();
    else player.onloadedmetadata = begin;
  });
}

function finishOfficialListening() {
  officialRunning = false;
  officialPlayer = null;
  if (!session || session.phase !== "listening") return;
  clearOfficialHold();
  const listened = Math.max(1, Math.round((Date.now() - (session.officialStartedAt ?? session.startedAt) - (session.officialPausedMs ?? 0)) / 1000));
  session.completedSeconds = 0;
  session.phaseMinutes = listened / 60;
  session.endsAt = Date.now();
  delete session.pausedRemainingMs;
  if (!opensReadingAfterListening(session)) {
    submit(true);
    return;
  }
  startReading(session);
  session.cur = session.groupIds.findIndex((id) => groupById(id).section === "reading");
  delete session.officialCursor;
  saveSession();
  renderTest();
}

async function runOfficialSequence() {
  const token = ++officialToken;
  let manifest;
  try { manifest = await loadAudioManifest(); }
  catch { officialRunning = false; return; }
  if (token !== officialToken || !session?.official || session.phase !== "listening") { officialRunning = false; return; }
  const groups = session.groupIds.map(groupById).filter(Boolean);
  const steps = buildOfficialSequence(groups, manifest);
  let index = session.officialCursor?.index ?? 0;
  while (token === officialToken && session?.official && session.phase === "listening") {
    if (Number.isFinite(session.pausedRemainingMs)) { officialRunning = false; return; }
    if (index >= steps.length) { officialRunning = false; finishOfficialListening(); return; }
    const step = steps[index];
    const cursor = session.officialCursor ?? { index, offset: 0 };
    cursor.index = index;
    session.officialCursor = cursor;
    showOfficialProgress(groups, step);
    const groupIndex = session.groupIds.indexOf(step.groupId);
    if (groupIndex !== -1 && groupIndex !== session.cur) {
      session.cur = groupIndex;
      saveSession();
      renderTest();
    }
    if (token !== officialToken) return;
    const offset = cursor.offset || 0;
    cursor.offset = 0;
    const status = document.querySelector("[data-official-status]");
    if (status) status.textContent = step.type === "pause" ? "作答時間" : "播放中";
    const finished = step.type === "pause"
      ? await waitOfficialSilence(step.durationSec, offset, token)
      : await playOfficialClip(step.file, offset, token, () => {});
    if (token !== officialToken) { officialRunning = false; return; }
    if (!finished && status) status.textContent = "這一段音檔無法播放，已跳到下一段。";
    index += 1;
    session.officialCursor = { index, offset: 0 };
    saveSession();
  }
  officialRunning = false;
}

async function playGroup(gid, btn) {
  if (!allowsReplay(session) || activePlay || (session.plays[gid] ?? 0) >= MAX_PLAYS) return;
  const playingSession = session;
  const g = groupById(gid);
  const box = btn.closest(".audio");
  const play = { box, playingSession };
  activePlay = play;
  const status = box.querySelector(".status");
  btn.disabled = true;
  box.querySelector('[data-action="stop-play"]').disabled = false;
  status.textContent = "播放中…";
  const lines = g.spokenOptions ? audio.withSpokenOptions(g) : g.script;
  let finished = false;
  const recording = g.audio;
  const locale = ACCENT_LOCALE[g.accent] ?? null;
  try {
    if (recording && audio.fileSupported()) {
      finished = await audio.playFile(recording);
      if (!finished && audio.shouldFallbackFromRecording(audio.lastErrorCode())) finished = await audio.playScript(lines, { locale });
    } else finished = await audio.playScript(lines, { locale });
  } catch { finished = false; }
  if (activePlay !== play) return;
  activePlay = null;
  if (finished && session === playingSession) {
    session.plays[gid] = (session.plays[gid] ?? 0) + 1;
    saveSession();
  }
  if (!box.isConnected || session !== playingSession) return;
  box.querySelector('[data-action="stop-play"]').disabled = true;
  box.querySelector('.plays').textContent = '剩餘 ' + (MAX_PLAYS - (session.plays[gid] ?? 0)) + ' 次';
  status.textContent = finished ? '播放完畢' : audio.errorMessage() + ' 本次不扣次數。';
  btn.textContent = finished ? '▶ 播放語音' : '重試播放';
  btn.disabled = (session.plays[gid] ?? 0) >= MAX_PLAYS;
  if (btn.disabled && !box.querySelector('[data-action="reset-plays"]')) {
    const recovery = document.createElement('button');
    recovery.className = 'btn small';
    recovery.dataset.action = 'reset-plays';
    recovery.dataset.group = gid;
    recovery.textContent = '恢復本題播放次數';
    btn.after(recovery);
  }
}

function cancelPlayback(reason = 'canceled') {
  if (!activePlay) return;
  audio.stop(reason);
}

function pauseForExit() {
  if (session?.official && session.phase === "listening") {
    if (!Number.isFinite(session.pausedRemainingMs)) {
      pauseOfficialPlayback();
      markOfficialHold();
      session.pausedRemainingMs = 1;
    }
    stopTimer();
    saveSession();
    return;
  }
  cancelPlayback('background');
  if (session) { pauseTimer(session); stopTimer(); saveSession(); }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseForExit();
  else if (session && Number.isFinite(session.pausedRemainingMs)) {
    if (app.querySelector('[data-action="pause-timer"]')) renderTest();
    else if (app.querySelector('[data-action="resume"]')) renderHome();
  }
});
window.addEventListener('pagehide', pauseForExit);

function resumePausedExam() {
  audio.stop();
  if (!session) return;
  if (session.official && session.phase === "listening") {
    clearOfficialHold();
    delete session.pausedRemainingMs;
    saveSession();
    renderTest();
    return;
  }
  if (resumeTimer(session)) { saveSession(); renderTest(); }
}

async function playPeek(gid, button) {
  if (activePlay) return;
  const group = groupById(gid);
  const box = button.closest(".audio") ?? button.parentElement;
  const status = box.querySelector(".status");
  button.disabled = true;
  if (status) status.textContent = "播放中…";
  const finished = group?.audio && audio.fileSupported() ? await audio.playFile(group.audio) : false;
  if (!button.isConnected) return;
  button.disabled = false;
  if (status) status.textContent = finished ? "播放完畢" : audio.errorMessage();
}

function pick(qid, i) {
  if (answerLocked(session, qid)) return;
  if (session.phase && sessionQuestions().find((q) => q.id === qid)?.section !== session.phase) return;
  session.answers[qid] = i;
  saveSession();
  const row = app.querySelector(`.q[data-qid="${qid}"]`);
  row.querySelectorAll(".opt").forEach((b, idx) => b.classList.toggle("selected", idx === i));
  const qs = sessionQuestions();
  document.getElementById("count").textContent = `${qs.filter((q) => session.answers[q.id] !== undefined).length}/${qs.length} 已答`;
  const idx = qs.findIndex((q) => q.id === qid);
  app.querySelectorAll(".pal")[idx]?.classList.add("answered");
}

function toggleFlag(qid) {
  session.flags[qid] = !session.flags[qid];
  saveSession();
  renderTest();
}

function go(delta) {
  const target = Math.min(session.groupIds.length - 1, Math.max(0, session.cur + delta));
  if (session.phase && groupById(session.groupIds[target]).section !== session.phase) return;
  session.cur = target;
  saveSession();
  renderTest();
  window.scrollTo(0, 0);
}

function submit(auto = false) {
  pauseOfficialPlayback();
  const qs = sessionQuestions();
  const unanswered = qs.filter((q) => session.answers[q.id] === undefined).length;
  if (!auto && !confirm(unanswered ? `還有 ${unanswered} 題未作答，確定交卷？` : "確定交卷？")) return;
  stopTimer();
  audio.stop();
  const result = score(qs, session.answers);
  const answeredResult = score(qs.filter((q) => session.answers[q.id] !== undefined && session.answers[q.id] !== null), session.answers);
  wrongQueue = updateWrongAnswerQueue(wrongQueue, qs, session.answers, Date.now(), session.reviewQueued ?? []);
  store.set(KEY_WRONG_QUEUE, wrongQueue);
  const entry = {
    id: String(Date.now()), date: Date.now(), mode: session.mode, formId: session.formId ?? null,
    peeked: !!session.peeked,
    section: normalizeMockSection(session.section),
    secUsed: elapsedSeconds(session),
    partSecs: session.partSecs ?? null,
    ...(isReadingFullForm(session.formId) ? { readingVariant: session.readingVariant ?? "original", ...(session.readingVariant === "rotation" ? { rotationSeed: session.rotationSeed } : {}) } : {}),
    groupIds: session.groupIds, questionIds: session.questionIds ?? null, answers: session.answers,
    choiceRevision: session.choiceRevision ?? CHOICE_REVISION,
    correct: result.correct, total: result.total, bySkill: answeredResult.bySkill, bySection: answeredResult.bySection
  };
  const history = store.get(KEY_HISTORY, []);
  history.push(entry);
  store.set(KEY_HISTORY, history);
  store.del(KEY_SESSION);
  session = null;
  renderResult(entry);
}

/* ---------- Result / review ---------- */
function renderResult(entry, showAll = false) {
  stopTimer();
  audio.stop();
  const qs = questionsFor(entry);
  const r = score(qs, entry.answers);
  const answeredQs = qs.filter((q) => entry.answers[q.id] !== undefined);
  const answeredStats = score(answeredQs, entry.answers);
  const byAbility = abilityStats(answeredQs, entry.answers);
  const progress = estimateProgress(qs, entry.answers);
  const L = progress.ranges.listening;
  const R = progress.ranges.reading;
  const weak = weakest(answeredStats.bySkill, 3, 1);
  const skills = Object.entries(answeredStats.bySkill).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
  const testedAbilities = new Set(qs.map((question) => question.ability));
  const abilityReport = Object.entries(ABILITIES).map(([id, definition]) => {
    const stats = byAbility[id];
    const percent = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : null;
    const note = !testedAbilities.has(id) ? "本套未測" : stats.answered < 5 ? `題數少，僅供參考 · ${stats.answered} 題` : `${stats.answered} 題`;
    return `<div class="ability-row"><div class="ability-head"><div><b>${id}</b> ${esc(definition.title)}</div><strong>${percent === null ? "—" : `${percent}%`}</strong></div><div class="muted">${note}</div><div class="bar ${percent !== null && percent < 60 ? "weak" : ""}" role="progressbar" aria-label="${id} ${esc(definition.title)} 正答率" aria-valuemin="0" aria-valuemax="100" ${percent === null ? "aria-valuetext=\"未作答\"" : `aria-valuenow="${percent}"`}><i style="width:${percent ?? 0}%"></i></div></div>`;
  }).join("");
  const resultGroups = isReadingFullForm(entry.formId) ? entry.groupIds.map(groupById).filter(Boolean) : bank.groups.filter((g) => entry.groupIds.includes(g.id));
  const groups = resultGroups.filter((g) => showAll || g.questions.some((q) => entry.answers[q.id] !== q.answer));

  const single = normalizeMockSection(entry.section);
  const sectionLine = single === "listening"
    ? (L ? `Listening ≈ ${L.low}–${L.high}（${L.answered} 題）` : "聽力樣本不足")
    : single === "reading"
      ? (R ? `Reading ≈ ${R.low}–${R.high}（${R.answered} 題）` : "閱讀樣本不足")
      : `${L && R ? `總分 ≈ ${L.low + R.low}–${L.high + R.high}（中間值約 ${L.mid + R.mid}）<br>` : ''}${L ? `Listening ≈ ${L.low}–${L.high}（${L.answered} 題）` : "聽力樣本不足"}　${R ? `Reading ≈ ${R.low}–${R.high}（${R.answered} 題）` : "閱讀樣本不足"}`;
  const estimate = entry.peeked
    ? `<p class="notice" style="margin-top:12px"><span class="tag practice">練習成績</span> 這次看過暫停中的錯題，不計入五力估分與最佳成績。錯題仍會留在錯題複習。</p>`
    : `<p class="notice" style="margin-top:12px">已答題粗估（空白題不納入；各區至少答 5 題才顯示；非 ETS 成績）。本站依目前答對比例推估；正式 TOEIC 會依試卷難度等化，將原始答對數換成量尺分數，因此兩者可能不同，也沒有通過或不通過：<br>${sectionLine}</p>`;
  const bandSummary = [
    ["聽力", L && scoreBand("listening", L.mid)],
    ["閱讀", R && scoreBand("reading", R.mid)]
  ].filter(([, band]) => band).map(([label, band]) => `<article class="score-band"><h3>${label} ${band.level}</h3><p><b>目前強項：</b>${band.strength}</p><p><b>可加強：</b>${band.gap}</p><p><b>下一步：</b>${band.next}</p></article>`).join("");
  app.innerHTML = `
    <h1>測驗結果 ${sectionBadge(entry.section)} ${readingVariantBadge(entry)} ${entry.peeked ? '<span class="tag practice">練習成績</span>' : ''}</h1>
    <section class="card"><div class="grid">
      <div class="stat"><b>${r.answered ? `${Math.round((r.correct / r.answered) * 100)}%` : '—'}</b>已答正確率</div>
      <div class="stat"><b>${r.correct}/${r.answered}</b>已答對／已作答</div>
      <div class="stat"><b>${formatDuration(entry.secUsed)}</b>耗時</div>
      <div class="stat"><b>${r.answered}/${r.total}</b>已作答</div>
    </div>
    ${estimate}</section>

    <section class="card"><h2>目標能力正答率</h2><p class="muted">依本次已作答題目呈現的練習統計，非 ETS 官方成績報告。每項少於 5 題時，結果僅供參考。</p><div class="ability-list">${abilityReport}</div></section>

    ${bandSummary ? `<section class="card"><h2>分數區間能力參考</h2><p class="muted">依本站非官方估分提供練習方向。以下為原創改寫的學習建議，不是 ETS 對個人的能力診斷。</p>${bandSummary}<p class="tips-sources">參考：<a href="https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-listening-reading-score-descriptors.pdf" target="_blank" rel="noopener">ETS 聽力與閱讀分數描述</a> · <a href="https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf" target="_blank" rel="noopener">ETS 應試者手冊：量尺分數與等化</a></p></section>` : ""}

    <section class="card"><h2>各題型表現</h2>
      ${skills.map(([k, v]) => `<div class="skillrow"><div>${esc(skillLabel(k))}</div><div>${v.c}/${v.t}</div><div class="bar ${v.c / v.t < 0.6 ? "weak" : ""}" style="grid-column:1 / -1"><i style="width:${(v.c / v.t) * 100}%"></i></div></div>`).join("")}
    </section>

    ${readingFullReport(entry, qs)}

    <section class="card"><h2>下一次練習建議</h2>
      ${weak.length ? weak.map((w) => `<div class="skillrow"><div><b>${esc(skillLabel(w.skill))}</b>（${w.c}/${w.t}）<div class="muted">${esc(SKILLS[w.skill]?.tip ?? "")}</div></div><div><button class="btn small" data-action="practice" data-skill="${esc(w.skill)}">練習</button></div></div>`).join("")
        : `<p>${r.answered ? '已答題目前沒有錯題；可繼續練習其他題型。' : '尚未作答，沒有足夠資料建議下一次練習。'}</p>`}
    </section>

    <section class="card"><div class="row" style="justify-content:space-between"><h2>${showAll ? "全部題目解析" : "錯題解析"}</h2>
      <button class="btn small" data-action="toggle-all" data-id="${entry.id}" data-all="${showAll ? 0 : 1}">${showAll ? "只看錯題" : "顯示全部"}</button></div>
      ${groups.length ? groups.map((g) => reviewGroup(g, entry)).join("") : "<p>沒有錯題。</p>"}
    </section>
    <div class="row"><button class="btn primary" data-action="home">回首頁</button></div>
  `;
  window.scrollTo(0, 0);
}

const TYPE_LABELS = {
  "part-of-speech": "詞性", "verb-tense-voice": "時態／語態", "preposition-conjunction": "介系詞／連接詞", pronoun: "代名詞",
  "relative-pronoun": "關係詞", "vocabulary-collocation": "字彙搭配", vocabulary: "字彙", grammar: "文法", "conjunctive-adverb": "連接副詞",
  "sentence-insertion": "句子插入", "main-purpose": "主旨／目的", detail: "細節", inference: "推論", "not-question": "NOT 題",
  synonym: "同義字", "text-insertion": "插入位置", "chat-intent": "簡訊／聊天意圖", "cross-document": "跨文件整合"
};
const PART_PACE = { 5: 10, 6: 8, 7: 52 };

function readingFullReport(entry, qs) {
  if (!isReadingFullForm(entry.formId)) return "";
  const partOf = (q) => groupById(q.groupId)?.part;
  const rows = [5, 6, 7].map((part) => {
    const list = qs.filter((q) => partOf(q) === part);
    const right = list.filter((q) => entry.answers[q.id] === q.answer).length;
    const secs = entry.partSecs?.[part];
    const used = Number.isFinite(secs) ? formatDuration(secs) : "—";
    const over = Number.isFinite(secs) && secs > PART_PACE[part] * 60;
    return `<tr><td>Part ${part}</td><td>${right}/${list.length}</td><td>${used}${over ? ' <span class="tag practice">比參考時間多一些</span>' : ""}</td><td>${PART_PACE[part]} 分</td></tr>`;
  }).join("");
  const byType = new Map();
  for (const q of qs) {
    const key = `${partOf(q)}|${q.questionType ?? "other"}`;
    const cell = byType.get(key) ?? { part: partOf(q), type: q.questionType ?? "other", wrong: 0, total: 0 };
    cell.total += 1;
    if (entry.answers[q.id] !== q.answer) cell.wrong += 1;
    byType.set(key, cell);
  }
  const ranked = [...byType.values()].sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total);
  const worst = ranked[0] && ranked[0].wrong > 0 ? ranked[0] : null;
  return `<section class="card"><h2>各 Part 與題型統計</h2>
    <p class="muted">用時只計算停在該 Part 題目上的時間。參考配速：Part 5 約 10 分、Part 6 約 8 分、Part 7 約 52 分，最後留約 5 分檢查；這是個人整理的練習起點，可依自己的狀況調整。</p>
    <table><thead><tr><th>Part</th><th>答對</th><th>實際用時</th><th>參考配速</th></tr></thead><tbody>${rows}</tbody></table>
    ${worst ? `<p><b>錯最多的題型：</b>Part ${worst.part}・${esc(TYPE_LABELS[worst.type] ?? worst.type)}（錯或未答 ${worst.wrong}／${worst.total} 題）</p>` : "<p>本次沒有錯題。</p>"}
    <table><thead><tr><th>題型</th><th>錯題（含未作答）</th><th>題數</th></tr></thead><tbody>${ranked.map((c) => `<tr><td>Part ${c.part}・${esc(TYPE_LABELS[c.type] ?? c.type)}</td><td>${c.wrong}</td><td>${c.total}</td></tr>`).join("")}</tbody></table>
  </section>`;
}

function reviewGroup(g, entry) {
  const qs = questionsFor(entry);
  return `<div class="q">
    <div class="doclabel">Part ${g.part} ${esc(g.title ?? "")} ${accentTag(g)}</div>
    ${g.image ? `<img class="question-image" src="${esc(g.image)}" alt="${g.part === 1 ? "本題照片" : "本題附圖"}；若載入失敗，請連網重新開啟。">` : ""}
    ${g.script ? transcriptBlock(g) : ""}
    ${readingPassageHtml(g)}
    ${g.questions.filter((q) => !entry.questionIds || entry.questionIds.includes(q.id)).map((q) => {
      const a = entry.answers[q.id];
      const num = qs.findIndex((x) => x.id === q.id) + 1;
      return `<div class="q"><b>${num}. ${esc(q.prompt)}</b>
        <div class="opts">${q.options.map((o, i) => `<div class="opt ${i === q.answer ? "correct" : i === a ? "wrong" : ""}"><span class="letter">${LETTERS[i]}</span><span>${esc(o)}${i === q.answer ? " ✓" : ""}${i === a && i !== q.answer ? " （你的答案）" : ""}</span></div>`).join("")}</div>
        ${a === undefined ? `<p class="muted">未作答</p>` : ""}
        <div class="explain">${esc(q.explanation)}</div>${a !== undefined && a !== q.answer ? wrongReasonPicker(q.id) : ''}</div>`;
    }).join("")}
  </div>`;
}

/* ---------- Events ---------- */
app.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const d = t.dataset;
  switch (d.action) {
    case "start-reading-rotation": startReadingFull(d.form, true); break;
    case "start-diagnostic": {
      const set = bank.meta.sets.find((s) => s.id === document.getElementById('test-set').value);
      const ids = orderedGroupIds(set.groupIds);
      if (set.id.startsWith('form-') || set.timing) ids.sort((a, b) => groupById(a).part - groupById(b).part);
      startSession("diagnostic", ids, set.durationMin, null, set.id.startsWith('form-') || set.timing ? set.id : null, set.timing);
      break;
    }
    case "start-form": {
      if (d.form === "quick-40" || d.form === "quick-60") { startQuickForm(d.form); break; }
      if (isReadingFullForm(d.form)) { startReadingFull(d.form); break; }
      if (isOfficialForm(d.form)) { startOfficialSet(d.form); break; }
      const set = bank.meta.sets.find((s) => s.id === d.form);
      const ids = orderedGroupIds(set.groupIds).sort((a, b) => groupById(a).part - groupById(b).part);
      startSession('diagnostic', ids, set.durationMin, null, set.id, set.timing);
      break;
    }
    case "begin-reading":
      if (session.phase === 'listening' && confirm('結束聽力並開始閱讀？開始後不能返回聽力。')) {
        startReading(session);
        session.cur = session.groupIds.findIndex((id) => groupById(id).section === 'reading');
        saveSession(); renderTest();
      }
      break;
    case "start-section": {
      const groups = bank.groups.filter((g) => isActiveGroup(g) && g.section === d.section && (d.section !== "listening" || matchesAccent(g)));
      const groupIds = groups.map((g) => g.id);
      const questionCount = groups.reduce((sum, g) => sum + g.questions.length, 0);
      if (!questionCount) break;
      startSession(d.section, groupIds, Math.max(5, Math.ceil(questionCount * 1.2)));
      break;
    }
    case "start-photo": {
      const set = bank.meta.sets.find((item) => item.id === "photo-pilot");
      const ids = set ? orderedGroupIds(set.groupIds).filter((id) => matchesAccent(groupById(id))) : [];
      if (set && ids.length && !session) startSession("practice", ids, set.durationMin);
      break;
    }
    case "resume":
      if (allowSession(session.groupIds)) {
        if (session.official && session.phase === "listening") clearOfficialHold();
        resumeTimer(session);
        saveSession();
        renderTest();
      }
      break;
    case "pause-timer":
      if (session?.official && session.phase === "listening") {
        pauseOfficialPlayback();
        markOfficialHold();
        if (!Number.isFinite(session.pausedRemainingMs)) session.pausedRemainingMs = 1;
        saveSession();
        renderTest();
        break;
      }
      if (pauseTimer(session)) { saveSession(); renderTest(); } else if (remainingMs(session) <= 0) { if (session.phase) renderTest(); else submit(true); }
      break;
    case "official-resume-audio": officialAudioRetry?.(); break;
    case "resume-timer": resumePausedExam(); break;
    case "open-peek":
      if (session.official && !session.peeked) {
        document.getElementById("peek-confirm")?.removeAttribute("hidden");
        break;
      }
      renderPeek();
      break;
    case "cancel-peek": document.getElementById("peek-confirm")?.setAttribute("hidden", ""); break;
    case "confirm-peek":
      session.peeked = true;
      saveSession();
      renderPeek();
      break;
    case "queue-wrong": {
      const question = sessionQuestions().find((item) => item.id === d.q);
      if (!question) break;
      const result = queueWrongReview(wrongQueue, question);
      wrongQueue = result.queue;
      store.set(KEY_WRONG_QUEUE, wrongQueue);
      session.reviewQueued = [...new Set([...(session.reviewQueued ?? []), question.id])];
      saveSession();
      t.disabled = true;
      t.textContent = "已在錯題複習";
      break;
    }
    case "peek-play": playPeek(d.group, t); break;
    case "discard": if (confirm("放棄目前作答進度？")) { pauseOfficialPlayback(); store.del(KEY_SESSION); session = null; renderHome(); } break;
    case "practice": {
      const ids = groupsForSkill(bank, d.skill);
      const n = flatten(bank, ids).length;
      startSession("practice", orderedGroupIds(ids), Math.max(5, Math.ceil(n * 1.2)));
      break;
    }
    case "review-wrong": {
      const qs = flatten(bank).filter((q) => wrongAnswerDue(wrongQueue[q.id]) && (!d.part || q.part === Number(d.part)));
      if (!qs.length) { renderHome(); break; }
      const questionIds = qs.map((q) => q.id);
      const ids = orderedGroupIds([...new Set(qs.map((q) => q.groupId))]);
      startSession("review", ids, Math.max(5, Math.ceil(qs.length * 1.2)), questionIds);
      break;
    }
    case "view": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id)); break;
    case "toggle-all": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id), d.all === "1"); break;
    case "home": renderHome(); break;
    case "preexam-open": renderPreExam(); break;
    case "preexam-reset": store.set(KEY_PREEXAM, {}); renderPreExam(); break;
    case "start-warmup": {
      const pool = bank.groups.filter((g) => isActiveGroup(g) && g.section === "reading" && g.part === 5);
      if (!pool.length) break;
      const picked = pool.map((g) => [Math.random(), g.id]).sort((a, b) => a[0] - b[0]).slice(0, 10).map((pair) => pair[1]);
      const ids = orderedGroupIds(picked);
      const count = ids.reduce((sum, id) => sum + groupById(id).questions.length, 0);
      startSession("practice", ids, Math.max(5, Math.ceil(count * 0.6)));
      break;
    }
    case "tips": renderTips(); break;
    case "hide-tips": store.set(KEY_TIPS, false); if (session) renderTest(); else renderHome(); break;
    case "show-tips": store.set(KEY_TIPS, true); if (session) renderTest(); else renderHome(); break;
    case "lessons": renderLessons(); break;
    case "lesson-retry": {
      const card = t.closest('.lesson-card');
      const player = card.querySelector('audio');
      const status = card.querySelector('.lesson-status');
      player.load(); status.textContent = '';
      player.play().catch(() => { status.textContent = '無法播放，請檢查連線後重試。'; });
      break;
    }
    case "sample": sampleVoice(d.role, t); break;
    case "retry-voices": fillVoices(); break;
    case "reset-role-voices": for (const role of ['M', 'W', 'N']) audio.setPref(role, ''); fillVoices(); break;
    case "play": playGroup(d.group, t); break;
    case "stop-play": cancelPlayback(); break;
    case "reset-plays": if (allowsReplay(session) && !activePlay) { session.plays[d.group] = 0; saveSession(); renderTest(); } break;
    case "copy-link": {
      const input = document.getElementById('external-link');
      const feedback = document.getElementById('copy-status');
      const done = ok => { feedback.textContent = ok ? '已複製，請自行貼到外部 Chrome。' : '複製失敗，請長按上方連結手動複製。'; };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(input.value).then(() => done(true), () => done(false));
      else { input.select(); try { done(document.execCommand('copy')); } catch { done(false); } }
      break;
    }
    case "pick": pick(d.q, Number(d.i)); break;
    case "flag": toggleFlag(d.q); break;
    case "prev": go(-1); break;
    case "next": go(1); break;
    case "jump": if (!session.phase || groupById(d.group)?.section === session.phase) { session.cur = session.groupIds.indexOf(d.group); saveSession(); renderTest(); } break;
    case "submit": submit(false); break;
    case "wrong-reason": {
      if (!WRONG_REASONS.some(([id]) => id === d.reason)) break;
      const reasons = store.get(KEY_WRONG_REASONS, {});
      reasons[d.q] = d.reason;
      store.set(KEY_WRONG_REASONS, reasons);
      const group = t.closest('.wrong-reasons');
      for (const button of group.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === t));
      group.querySelector('[data-reason-status]').textContent = '已儲存';
      break;
    }
    case "vocab-filter": store.set(KEY_VOCAB_LEVEL, d.vocabFilter); paintVocab(); break;
    case "grammar-answer": {
      const topic = GRAMMAR.find((x) => x.id === d.topic);
      const item = topic?.quiz[Number(d.q)];
      const box = t.closest("[data-grammar-quiz]");
      if (!item || !box) break;
      const picked = Number(d.i);
      const right = picked === item.answer;
      box.querySelectorAll("[data-action='grammar-answer']").forEach((button, index) => {
        button.classList.toggle("grammar-correct", index === item.answer);
        button.classList.toggle("grammar-wrong", index === picked && !right);
      });
      const feedback = box.querySelector(".grammar-feedback");
      if (feedback) feedback.textContent = `${right ? "答對了。" : `答錯了，正確答案是 ${String.fromCharCode(65 + item.answer)}。`}${item.why}`;
      const saved = grammarProgress();
      saved[item.q] = right;
      store.set(KEY_GRAMMAR, saved);
      const count = app.querySelector(`[data-grammar-progress="${topic.id}"]`);
      if (count) count.textContent = `${grammarRight(topic, saved)}/${topic.quiz.length}`;
      const totalRight = grammarRightTotal(saved);
      app.querySelectorAll("[data-grammar-total]").forEach((el) => { el.textContent = totalRight; });
      const bar = app.querySelector("[data-grammar-bar]");
      if (bar) bar.value = totalRight;
      break;
    }
    case "grammar-drill": renderGrammarDrill(); break;
    case "flash-quick": {
      // Ten new picks on top of whatever was already introduced today, plus any picks that are due.
      const progress = store.get(KEY_FLASHCARDS, {});
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const introduced = Object.values(progress).filter((x) => x.introducedAt >= dayStart.getTime()).length;
      flashQueue = selectCards(flashItems, progress, { level: "pick", category: "all", limit: introduced + 10 });
      flashRevealed = false; flashRender(); break;
    }
    case "home-jump": {
      const el = document.getElementById(d.target);
      if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      break;
    }
    case "vocab-open": {
      flashSetup();
      break;
    }
    case "flash-setup": flashSetup(); break;
    case "flash-start": {
      const options = { level: document.getElementById('flash-level').value, category: document.getElementById('flash-category').value, limit: Math.max(0, Math.min(100, Number(document.getElementById('flash-limit').value) || 0)) };
      store.set(KEY_FLASH_OPTIONS, options);
      flashQueue = selectCards(flashItems, store.get(KEY_FLASHCARDS, {}), options);
      flashRevealed = false; flashRender(); break;
    }
    case "flash-flip": flashRevealed = true; flashRender(); break;
    case "flash-speak": {
      const item = flashQueue[0];
      if (item) audio.playScript([{ speaker: 'N', text: item.word }], { locale: 'en-US' }).then(ok => { const status = document.getElementById('flash-audio-status'); if (status && !ok) status.textContent = '發音無法播放，請再試一次。'; });
      break;
    }
    case "flash-rate": {
      const item = flashQueue[0];
      if (!item || !flashRevealed || !['again', 'hard', 'good'].includes(d.rating)) break;
      const progress = store.get(KEY_FLASHCARDS, {});
      progress[item.word] = rateCard(progress[item.word], d.rating);
      try { localStorage.setItem(KEY_FLASHCARDS, JSON.stringify(progress)); }
      catch { document.getElementById('flash-save-status').textContent = '無法儲存進度，請檢查瀏覽器儲存空間或隱私設定後重試。'; break; }
      flashQueue.shift(); flashRevealed = false; flashRender(); break;
    }
    case "vocab-gold": {
      store.set(KEY_VOCAB_LEVEL, "900");
      paintVocab();
      const list = app.querySelector(".vocabulary-list");
      if (list) { list.open = true; list.scrollIntoView({ block: "start" }); }
      break;
    }
  }
});

app.addEventListener("change", (e) => {
  if (e.target.dataset?.action === "preexam-tick") {
    const ticks = preExamTicks();
    if (e.target.checked) ticks[e.target.dataset.id] = true; else delete ticks[e.target.dataset.id];
    store.set(KEY_PREEXAM, ticks);
    const done = PREEXAM_BLOCKS.reduce((sum, block) => sum + block.items.filter((item) => ticks[item.id]).length, 0);
    app.querySelectorAll("[data-preexam-done]").forEach((el) => { el.textContent = done; });
    return;
  }
  if (typeof e.target.name === "string" && e.target.name.startsWith("mock-section")) { store.set(KEY_MOCK_SECTION, selectMockSection(e.target.value)); renderHome(); return; }
  if (e.target.id === "accent-filter") { store.set(KEY_ACCENT, e.target.value); renderHome(); return; }
  if (e.target.dataset.action === "listen-rate") { audio.setListenRate(Number(e.target.value)); return; }
  if (e.target.id === 'speech-rate') audio.setRate(Number(e.target.value));
  const s = e.target.closest("select[data-voice]");
  if (s) { audio.setPref(s.dataset.voice, s.value); fillVoices(); }
});

app.addEventListener('error', (e) => {
  if (!e.target.matches?.('audio[data-lesson-audio]')) return;
  e.target.closest('.lesson-card').querySelector('.lesson-status').textContent = '音檔載入失敗，請檢查連線後按「重新載入並播放」。';
}, true);

app.addEventListener('play', (e) => {
  if (!e.target.matches?.('audio[data-lesson-audio]')) return;
  for (const player of app.querySelectorAll('audio[data-lesson-audio]')) if (player !== e.target) player.pause();
  e.target.closest('.lesson-card').querySelector('.lesson-status').textContent = '';
}, true);

init();
