import * as audio from "./audio.js";
import { VOCABULARY } from "./vocabulary.js";
import { flatten, score, estimateProgress, mergeSkillStats, weakest, groupsForSkill, updateWrongAnswerQueue, formatDuration } from "./scoring.js";
import { SKILLS, skillLabel } from "./skills.js";
import { remainingMs, pauseTimer, resumeTimer, elapsedSeconds, startTimedForm, startReading } from "./timer.js";

const EXAM_DATE = "2026-11-29";
const MAX_PLAYS = 2;
const LETTERS = ["A", "B", "C", "D"];
const STORAGE_PREFIX = location.pathname.includes('/codex/') ? 'toeic950.codex' : 'toeic950';
const KEY_SESSION = `${STORAGE_PREFIX}.session.v1`;
const KEY_HISTORY = `${STORAGE_PREFIX}.history.v1`;
const KEY_WRONG_QUEUE = `${STORAGE_PREFIX}.wrong-answers.v1`;

const app = document.getElementById("app");
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

async function init() {
  try {
    const res = await fetch("data/questions.json");
    bank = await res.json();
    for (const group of bank.groups) {
      if ([3, 4].includes(group.part)) group.audio = `audio/${group.id}.mp3`;
    }
  } catch {
    app.innerHTML = `<p class="notice">題庫載入失敗。請用 <code>node serve.mjs</code> 或 GitHub Pages 開啟，不要直接雙擊 index.html。</p>`;
    return;
  }
  session = store.get(KEY_SESSION, null);
  if (session && session.bankVersion !== bank.meta.version) session = null;
  wrongQueue = store.get(KEY_WRONG_QUEUE, {});
  renderHome();
}

/* ---------- Home ---------- */
function minutesLabel(minutes) { return Number.isInteger(minutes) ? `${minutes} 分鐘` : `${Math.floor(minutes)} 分 ${Math.round((minutes % 1) * 60)} 秒`; }
function renderHome() {
  stopTimer();
  audio.stop();
  const history = store.get(KEY_HISTORY, []);
  const days = Math.ceil((new Date(`${EXAM_DATE}T00:00:00`) - new Date()) / 86400000);
  const weak = weakest(mergeSkillStats(history), 3, 2);
  const last = history[history.length - 1];
  const n = flatten(bank).length;
  const photoCount = bank.groups.filter((g) => g.section === "listening" && g.part === 1).reduce((sum, g) => sum + g.questions.length, 0);
  const listeningQuestions = flatten(bank).filter((q) => q.section === "listening").length;
  const readingQuestions = flatten(bank).filter((q) => q.section === "reading").length;
  const queuedQuestions = flatten(bank).filter((q) => wrongQueue[q.id]);
  const queueCount = queuedQuestions.length;

  app.innerHTML = `
    <h1>TOEIC 950+ Challenge</h1>
    <p class="muted">上次 955，這次挑戰更高。專注 Listening & Reading 的推論、細節與交叉比對。</p>
    ${session ? resumeCard() : ''}

    <section class="card"><h2>快速模考</h2>
      <p>40 題：約 24 分鐘（聽力 9 分鐘、閱讀 15 分鐘）。<br>60 題：約 36 分鐘（聽力 13 分 30 秒、閱讀 22 分 30 秒）。</p>
      <p class="muted">聽力以美式為主，並加入英式與澳洲口音；語音合成音色依裝置而異。</p>
      <button class="btn primary" data-action="start-form" data-form="quick-40">開始 40 題快速模考</button>
      <button class="btn primary" data-action="start-form" data-form="quick-60">開始 60 題快速模考</button>
      <p class="muted">依正式題型與時間近似縮小；對話和文章題組保留完整，因此各 Part 題數不是精確比例。題目取自第 A 套，兩種快速模考有重複題目。完成後可查看解析與非官方粗估。</p>
      <details><summary>口音音檔來源</summary><p>英式：使用 Cori Samuel 聲音模型，資料由 NVIDIA 提供，經修改產生此音檔；<a href="https://www.openslr.org/109/">資料來源</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>。澳洲：使用 DataCraftsmanAustralia 的 en_AU-librivox-medium 模型（Kirsty Leishman），經修改產生音檔；<a href="https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium">模型與作者資料</a> · CC BY 4.0。</p></details>
    </section>

    <details class="card"><summary>金色證書目標字彙 · ${VOCABULARY.reduce((n, group) => n + group.words.length, 0)} 個詞條</summary>
      <p class="muted">分主題輕鬆閱讀，包含中文與原創例句。連網載入更新後可離線查看。依多益官方情境選詞，非官方字頻排行或保證出題。</p>
      ${VOCABULARY.map(group => `<details><summary>${esc(group.category)} · ${group.words.length} 個詞條</summary>${group.words.map(([word, meaning, example]) => `<p><b>${esc(word)}</b> · ${esc(meaning)}<br><span class="muted">${esc(example)}</span></p>`).join('')}</details>`).join('')}
      <p><a href="https://www.toeic.com.tw/toeic/listening-reading/about/content/" target="_blank" rel="noopener noreferrer">參考：台灣多益官方測驗內容</a> · <a href="https://dictionary.cambridge.org/dictionary/english/" target="_blank" rel="noopener noreferrer">Cambridge Dictionary</a></p>
    </details>

    <section class="practice-grid" aria-label="Listening 聽力與 Reading 閱讀練習">
      <article class="card practice-card listening-card">
        <div class="section-label">LISTENING</div>
        <h2>聽力練習</h2>
        <p class="practice-count">${listeningQuestions} 題</p>
        <p class="muted">集中練習聽力題組，逐組播放與作答。</p>
        <button class="btn primary" data-action="start-section" data-section="listening">開始聽力練習</button>
        <button class="btn photo-entry" data-action="start-photo" ${session ? "disabled" : ""}>照片題試做（${photoCount} 題）</button>
      </article>
      <article class="card practice-card reading-card">
        <div class="section-label">READING</div>
        <h2>閱讀練習</h2>
        <p class="practice-count">${readingQuestions} 題</p>
        <p class="muted">直接進入純閱讀題，不會混入聽力。</p>
        <button class="btn primary" data-action="start-section" data-section="reading">開始閱讀練習</button>
      </article>
    </section>

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
      <h2>三套 200 題計時練習</h2>
      <p>每套聽力 100 題／45 分鐘，接著閱讀 100 題／75 分鐘。三套題目不重複；可暫停看目前估分。進入閱讀後不能返回聽力。</p>
      <div class="row">${['a', 'b', 'c'].map((id) => `<button class="btn primary" data-action="start-form" data-form="form-${id}">開始第 ${id.toUpperCase()} 套</button>`).join('')}</div>
      <p class="muted">採官方分段時間；練習仍可暫停與重播，並非正式考試的連續播放流程。</p>
    </section>
    <section class="card">
      <h2>其他／短題組練習</h2>
      <p>題庫共 ${n} 題原創練習，分套作答；每題附答案與英文解析。聽力文字稿預設收合，可自行展開，每段最多播放 ${MAX_PLAYS} 次。</p>
      <label for="test-set">今天練哪一套？</label>
      <select id="test-set" class="btn">${bank.meta.sets.map(s=>`<option value="${s.id}">${esc(s.label)} · ${s.durationMin} 分鐘</option>`).join('')}</select>
      <div class="row">
        ${session ? '<p class="muted">上次進度已保存在上方；選擇其他練習時，會先確認是否放棄舊進度。</p><button class="btn" data-action="start-diagnostic">開始所選新練習</button>' : `<button class="btn primary" data-action="start-diagnostic">開始完整／混合測驗</button>`}
      </div>
      <div id="unsupported-message">${audio.supported() ? '' : unsupportedNotice()}</div>
    </section>

    <section class="card">
      <h2>弱項追蹤與推薦</h2>
      ${weak.length ? weak.map((w) => `
        <div class="skillrow"><div><b>${esc(skillLabel(w.skill))}</b><div class="muted">${esc(SKILLS[w.skill]?.tip ?? "")}</div></div>
        <div>${Math.round(w.acc * 100)}%<br><button class="btn small" data-action="practice" data-skill="${esc(w.skill)}">練習</button></div></div>`).join("")
        : `<p class="muted">完成第一次診斷後，這裡會列出你最弱的題型與練習建議。</p>`}
    </section>

    <section class="card">
      <h2>錯題複習</h2>
      <p>${queueCount ? `有 ${queueCount} 題待複習。答對後會自動從錯題清單移除；再答錯就繼續保留。` : "目前沒有待複習錯題。測驗中答錯的題目會自動加入。"}</p>
      <button class="btn primary" data-action="review-wrong" ${queueCount ? "" : "disabled"}>${queueCount ? `開始複習 ${queueCount} 題` : "錯題清單是空的"}</button>
    </section>

    <section class="card" id="voicecard"><h2>聽力音色</h2><p class="muted">先試聽，再開始。音色依此裝置與瀏覽器提供，清單優先排列較自然的候選音色。</p><label for="speech-rate">語速</label> <select class="btn" id="speech-rate"><option value="0.85">0.85× · 精聽</option><option value="1">1× · 正常</option><option value="1.1">1.1× · 挑戰</option></select><div id="voices" class="muted">載入語音中…</div></section>
    <section class="card"><h2>官方樣題與練習方式</h2><p>先做一套練習，再從錯題解析找失分原因；閱讀可獨立練習。可選三套 200 題分段計時練習，或使用短題組；照片題目前有 ${photoCount} 題試做。</p><p><a href="https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" target="_blank" rel="noopener">ETS 官方公開樣題 PDF（含解答與聽力稿）</a> · <a href="https://toeic.com.tw/toeic/listening-reading/about/content/" target="_blank" rel="noopener">台灣官方題型與時間</a></p><p class="muted">官方內容於來源頁開啟；本機題庫與官方樣題分開。正式閱讀為 100 題、75 分鐘。</p></section>
    <section class="card"><h2>正式考試與素材庫</h2><p>正式 Listening 100 題／約 45 分鐘；Reading 100 題／75 分鐘。實際作答約 2 小時，連基本資料及問卷約 2.5 小時。</p><details><summary>查看正式題數分配</summary><p>Part 1 照片 6 題 · Part 2 應答 25 題 · Part 3 對話 39 題 · Part 4 獨白 30 題。</p><p>Part 5 句子填空 30 題 · Part 6 段落填空 16 題 · Part 7 單篇 29 題、多篇 25 題。</p></details><p>台灣官方範例（在來源頁練習與核對答案）：</p><ul><li><a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample03.html" target="_blank" rel="noopener">Part 3 聽力對話</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample04.html" target="_blank" rel="noopener">Part 4 聽力獨白</a></li><li><a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample05.html" target="_blank" rel="noopener">Part 5 句子填空</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample06.html" target="_blank" rel="noopener">Part 6 段落填空</a> · <a href="https://www.toeic.com.tw/sample-test/toeic-listening-reading/sample07_03.html" target="_blank" rel="noopener">Part 7 多篇閱讀</a></li></ul><p class="muted">新增挑戰 03：聽力 20 題＋閱讀 20 題；也可只選閱讀 03。官方題庫到貨後，再按你挑選的範例調整練習方向。素材核對：2026-11-08。</p></section>

    ${last ? `<section class="card"><h2>最近成績</h2>
      <div class="grid">
        <div class="stat"><b>${Math.round((last.correct / last.total) * 100)}%</b>正確率</div>
        <div class="stat"><b>${last.correct}/${last.total}</b>答對題數</div>
        <div class="stat"><b>${formatDuration(last.secUsed)}</b>耗時</div>
      </div></section>` : ""}

    ${history.length ? `<section class="card"><h2>作答紀錄</h2><table><thead><tr><th>日期</th><th>類型</th><th>正確率</th><th>耗時</th><th></th></tr></thead><tbody>
      ${history.slice().reverse().slice(0, 15).map((h) => `<tr><td>${new Date(h.date).toLocaleString("zh-TW", { hour12: false })}</td><td>${h.mode === "diagnostic" ? "完整／混合" : h.mode === "review" ? "錯題複習" : h.mode === "reading" ? "閱讀專練" : h.mode === "listening" ? "聽力專練" : "弱項練習"}</td><td>${Math.round((h.correct / h.total) * 100)}%</td><td>${formatDuration(h.secUsed)}</td><td><button class="btn small" data-action="view" data-id="${h.id}">檢視</button></td></tr>`).join("")}
      </tbody></table></section>` : ""}
  `;
  document.getElementById('speech-rate').value = String(audio.getRate());
  fillVoices();
}

let voiceLoad = 0;
function resumeCard() {
  const qs = sessionQuestions();
  const answered = qs.filter((q) => session.answers[q.id] !== undefined).length;
  const group = groupById(session.groupIds[session.cur]);
  const title = bank.meta.sets.find((set) => set.id === session.formId)?.label ?? (session.mode === 'reading' ? '閱讀練習' : session.mode === 'listening' ? '聽力練習' : '上次練習');
  return `<section class="card" aria-label="上次未完成的測驗"><h2>接續上次測驗</h2><p><b>${esc(title)}</b> · 已答 ${answered}/${qs.length} 題</p>
    <p>${group?.section === 'listening' ? '聽力' : '閱讀'} · Part ${group?.part ?? ''} · 第 ${session.cur + 1} 組<br>剩餘 ${formatDuration(Math.ceil(remainingMs(session) / 1000))}${Number.isFinite(session.pausedRemainingMs) ? '（已暫停）' : ''}</p>
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
  const voiceNote = '<p class="muted">對話與獨白使用固定配音：M 為 David 男聲，W 為 Zira 女聲。下方音色設定只影響照片／應答題與試聽；語速設定仍適用所有題目。</p>' + (voices.length < 2 ? '<p class="muted">此裝置可選英文音色少於兩種，語音合成題會嘗試用音高區分角色。</p>' : '');
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
function startSession(mode, groupIds, minutes, questionIds = null, formId = null, timing = {}) {
  if (session && !confirm("目前有未完成的測驗。開始新測驗會放棄原進度，確定繼續？")) return;
  if (!allowSession(groupIds)) return;
  const now = Date.now();
  session = {
    bankVersion: bank.meta.version, mode, groupIds, questionIds, answers: {}, flags: {}, plays: {},
    cur: 0, startedAt: now, endsAt: now + minutes * 60000, minutes
  };
  if (formId) startTimedForm(session, formId, now, timing);
  saveSession();
  renderTest();
}

function orderedGroupIds(ids) {
  return bank.groups.filter((g) => ids.includes(g.id)).map((g) => g.id);
}

function startTimer() {
  stopTimer();
  const tick = () => {
    const left = Math.ceil(remainingMs(session) / 1000);
    const el = document.getElementById("timer");
    if (el) {
      el.textContent = formatDuration(left);
      el.classList.toggle("low", left <= 300);
    }
    if (left <= 0) {
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

/* ---------- Test view ---------- */
function renderTest() {
  audio.stop();
  if (session.phase && !Number.isFinite(session.pausedRemainingMs) && remainingMs(session) <= 0) {
    if (session.phase === 'listening') { startReading(session, Date.now(), true); saveSession(); }
    if (remainingMs(session) <= 0) { submit(true); return; }
  }
  const allowed = session.groupIds.map((id, i) => ({ id, i })).filter(({ id }) => !session.phase || groupById(id).section === session.phase);
  if (!allowed.some(({ i }) => i === session.cur)) session.cur = allowed[0].i;
  if (Number.isFinite(session.pausedRemainingMs)) {
    stopTimer();
    app.innerHTML = `<section class="card"><h1>測驗已暫停</h1><p>剩餘時間 <b>${formatDuration(Math.ceil(remainingMs(session) / 1000))}</b>。作答與倒數已暫停，進度已存在這個瀏覽器。</p><div class="row"><button class="btn primary" data-action="resume-timer">繼續測驗</button><button class="btn" data-action="home">暫停並回首頁</button></div></section>${progressCard(sessionQuestions(), session.answers)}`;
    return;
  }
  const qs = sessionQuestions();
  const g = groupById(session.groupIds[session.cur]);
  const answeredCount = qs.filter((q) => session.answers[q.id] !== undefined).length;
  const isLast = session.cur === allowed.at(-1).i;
  const spoken = !!g.spokenOptions;

  app.innerHTML = `
    <div class="topbar">
      <div><span class="tag">${session.mode === "review" ? "錯題複習" : g.section === "listening" ? "Listening" : "Reading"}</span><span class="tag">Part ${g.part}</span><span class="muted">${esc(g.title ?? "")}</span></div>
      <div class="row">${session.phase ? `<b>${session.phase === 'listening' ? '聽力' : '閱讀'} ${minutesLabel(session.phaseMinutes)}</b>` : ''}<span class="muted" id="count">${answeredCount}/${qs.length} 已答</span><span class="timer" id="timer">--:--</span><button class="btn small" data-action="pause-timer">暫停／看估分</button><button class="btn small primary" data-action="submit">提前交卷</button></div>
    </div>

    <section class="card">
      ${g.image ? `<img class="question-image" src="${esc(g.image)}" alt="${g.part === 1 ? "照片題圖片" : "聽力題組附圖"}；若圖片載入失敗，請連網重新開啟。">` : ""}
      ${g.script ? audioBlock(g) : ""}
      ${g.passage ? g.passage.docs.map((d) => `<div class="doclabel">${esc(d.label)}</div><div class="passage">${esc(d.text)}</div>`).join("") : ""}
      ${g.questions.filter((q) => !session.questionIds || session.questionIds.includes(q.id)).map((q) => questionBlock(q, qs, spoken)).join("")}
      ${g.script ? transcriptBlock(g, true) : ''}
    </section>

    <div class="row" style="justify-content:space-between">
      <button class="btn" data-action="prev" ${session.cur === allowed[0].i ? "disabled" : ""}>← 上一組</button>
      <span class="muted">${session.cur + 1} / ${session.groupIds.length}</span>
      <button class="btn ${isLast ? "" : "primary"}" data-action="next" ${isLast ? "disabled" : ""}>下一組 →</button>
      ${isLast && session.phase === 'listening' ? `<button class="btn primary" data-action="begin-reading">結束聽力，開始閱讀 ${minutesLabel(session.readingMinutes ?? 75)}</button>` : ''}
    </div>

    <section class="card"><h3>題號${session.phase ? '（只能作答目前區段）' : ''}</h3><div class="palette">${qs.map((q, i) => `<button class="pal ${session.answers[q.id] !== undefined ? "answered" : ""} ${session.flags[q.id] ? "flag" : ""} ${q.groupId === g.id ? "current" : ""}" data-action="jump" data-group="${q.groupId}" ${session.phase && q.section !== session.phase ? 'disabled' : ''} aria-label="第 ${i + 1} 題">${i + 1}</button>`).join("")}</div></section>
  `;
  startTimer();
}

function progressCard(questions, answers) {
  const progress = estimateProgress(questions, answers);
  const labels = { listening: '聽力', structure: '句型／結構（Part 6）', grammar: '文法', reading: '閱讀理解（Part 7）', vocabulary: '詞彙' };
  const range = (key) => {
    const section = progress.sections[key];
    const estimate = progress.ranges[key];
    return estimate ? `${estimate.low}–${estimate.high}（中間值約 ${estimate.mid}；已答 ${section.n} 題）` : `已答 ${section.n} 題；至少 5 題後顯示粗估`;
  };
  const listening = progress.ranges.listening;
  const reading = progress.ranges.reading;
  const total = listening && reading ? `${listening.low + reading.low}–${listening.high + reading.high}（中間值約 ${listening.mid + reading.mid}）` : '聽力與閱讀各至少答 5 題後顯示';
  return `<section class="card"><h2>目前作答表現</h2><p class="notice">僅依已答題推算，空白題不算錯。下列分數區間是練習參考，並非 ETS 分數；選題難度和樣本量會影響結果。ETS 每份試卷另行換算量尺分數，<a href="https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf" target="_blank" rel="noopener">官方說明</a>。</p>
    <p><b>總分粗估：</b>${total}<br><b>聽力粗估：</b>${range('listening')}<br><b>閱讀粗估：</b>${range('reading')}</p>
    ${Object.entries(labels).map(([key, label]) => { const v = progress.categories[key]; return `<div class="skillrow"><div>${label}</div><div>${v.n ? `${v.c}/${v.n}（${Math.round(v.c / v.n * 100)}%）` : '尚無已答題'}</div></div>`; }).join('')}
  </section>`;
}

function transcriptBlock(g, duringPractice = false) {
  return `<details class="script"><summary>查看聽力文字稿 · Transcript</summary>
    ${duringPractice ? '<p class="muted">練習提示：展開會看到聽力內容，計時仍會繼續。</p>' : ''}
    ${g.script.map((line) => `<p><span class="tag">${line.speaker === 'M' ? 'Man' : line.speaker === 'W' ? 'Woman' : 'Narrator'}</span>${esc(line.text)}</p>`).join('')}
    ${g.spokenOptions ? g.questions.map((q) => q.options.map((option, i) => `<p><b>${LETTERS[i]}.</b> ${esc(option)}</p>`).join('')).join('') : ''}
  </details>`;
}

const QUICK_ACCENTS = {
  'g-airport-talk-d': { file: 'audio/quick-au-g-airport-talk-d.mp3', label: '澳洲口音' },
  's03-talk2': { file: 'audio/quick-gb-s03-talk2.mp3', label: '英式口音' }
};
function quickAccent(g) { return ['quick-40', 'quick-60'].includes(session?.formId) ? QUICK_ACCENTS[g.id] : null; }
function audioBlock(g) {
  const used = session.plays[g.id] ?? 0;
  const left = MAX_PLAYS - used;
  const accent = quickAccent(g);
  const recording = accent?.file ?? g.audio;
  return `<div class="audio" data-gid="${g.id}">
    <button class="btn primary" data-action="play" data-group="${g.id}" ${left <= 0 || !(recording ? audio.fileSupported() : audio.supported()) ? "disabled" : ""}>▶ 播放語音</button>${accent ? `<span class="tag">${accent.label}</span>` : g.audio ? '<span class="tag">固定男女配音</span>' : ''}
    ${left <= 0 ? `<button class="btn small" data-action="reset-plays" data-group="${g.id}">恢復本題播放次數</button>` : ''}
    <button class="btn small" data-action="stop-play" disabled>停止播放</button>
    <span class="muted"><span class="plays">剩餘 ${left} 次</span> · <span class="status" role="status" aria-live="polite">完整播放才計次；中斷或失敗不扣次數。</span></span>
  </div>`;
}

function questionBlock(q, qs, spoken) {
  const num = qs.findIndex((x) => x.id === q.id) + 1;
  const picked = session.answers[q.id];
  return `<div class="q" data-qid="${q.id}">
    <div class="row" style="justify-content:space-between"><b>${num}. ${esc(q.prompt)}</b>
    <button class="btn small" data-action="flag" data-q="${q.id}">${session.flags[q.id] ? "取消標記" : "標記"}</button></div>
    <div class="opts">${q.options.map((o, i) => `<button class="opt ${spoken ? "letter-only" : ""} ${picked === i ? "selected" : ""}" data-action="pick" data-q="${q.id}" data-i="${i}" aria-label="選項 ${LETTERS[i]}"><span class="letter">${LETTERS[i]}</span>${spoken ? "" : `<span>${esc(o)}</span>`}</button>`).join("")}</div>
  </div>`;
}

async function playGroup(gid, btn) {
  if (activePlay || (session.plays[gid] ?? 0) >= MAX_PLAYS) return;
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
  const recording = quickAccent(g)?.file ?? g.audio;
  try { finished = recording ? await audio.playFile(recording) : await audio.playScript(lines, { locale: ['quick-40', 'quick-60'].includes(session.formId) ? 'en-US' : null }); } catch { finished = false; }
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

function pick(qid, i) {
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
  const qs = sessionQuestions();
  const unanswered = qs.filter((q) => session.answers[q.id] === undefined).length;
  if (!auto && !confirm(unanswered ? `還有 ${unanswered} 題未作答，確定交卷？` : "確定交卷？")) return;
  stopTimer();
  audio.stop();
  const result = score(qs, session.answers);
  const answeredResult = score(qs.filter((q) => session.answers[q.id] !== undefined), session.answers);
  wrongQueue = updateWrongAnswerQueue(wrongQueue, qs, session.answers);
  store.set(KEY_WRONG_QUEUE, wrongQueue);
  const entry = {
    id: String(Date.now()), date: Date.now(), mode: session.mode, formId: session.formId ?? null,
    secUsed: elapsedSeconds(session),
    groupIds: session.groupIds, questionIds: session.questionIds ?? null, answers: session.answers,
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
  const progress = estimateProgress(qs, entry.answers);
  const L = progress.ranges.listening;
  const R = progress.ranges.reading;
  const weak = weakest(answeredStats.bySkill, 3, 1);
  const skills = Object.entries(answeredStats.bySkill).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
  const groups = bank.groups.filter((g) => entry.groupIds.includes(g.id)).filter((g) => showAll || g.questions.some((q) => entry.answers[q.id] !== q.answer));

  app.innerHTML = `
    <h1>測驗結果</h1>
    <section class="card"><div class="grid">
      <div class="stat"><b>${r.answered ? `${Math.round((r.correct / r.answered) * 100)}%` : '—'}</b>已答正確率</div>
      <div class="stat"><b>${r.correct}/${r.answered}</b>已答對／已作答</div>
      <div class="stat"><b>${formatDuration(entry.secUsed)}</b>耗時</div>
      <div class="stat"><b>${r.answered}/${r.total}</b>已作答</div>
    </div>
    <p class="notice" style="margin-top:12px">已答題粗估（空白題不納入；各區至少答 5 題才顯示；非 ETS 成績）：<br>
      ${L && R ? `總分 ≈ ${L.low + R.low}–${L.high + R.high}（中間值約 ${L.mid + R.mid}）<br>` : ''}
      ${L ? `Listening ≈ ${L.low}–${L.high}（${L.answered} 題）` : "聽力樣本不足"}　${R ? `Reading ≈ ${R.low}–${R.high}（${R.answered} 題）` : "閱讀樣本不足"}</p></section>

    <section class="card"><h2>各題型表現</h2>
      ${skills.map(([k, v]) => `<div class="skillrow"><div>${esc(skillLabel(k))}</div><div>${v.c}/${v.t}</div><div class="bar ${v.c / v.t < 0.6 ? "weak" : ""}" style="grid-column:1 / -1"><i style="width:${(v.c / v.t) * 100}%"></i></div></div>`).join("")}
    </section>

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

function reviewGroup(g, entry) {
  const qs = questionsFor(entry);
  return `<div class="q">
    <div class="doclabel">Part ${g.part} ${esc(g.title ?? "")}</div>
    ${g.image ? `<img class="question-image" src="${esc(g.image)}" alt="${g.part === 1 ? "本題照片" : "本題附圖"}；若載入失敗，請連網重新開啟。">` : ""}
    ${g.script ? transcriptBlock(g) : ""}
    ${g.passage ? g.passage.docs.map((d) => `<div class="doclabel">${esc(d.label)}</div><div class="passage">${esc(d.text)}</div>`).join("") : ""}
    ${g.questions.filter((q) => !entry.questionIds || entry.questionIds.includes(q.id)).map((q) => {
      const a = entry.answers[q.id];
      const num = qs.findIndex((x) => x.id === q.id) + 1;
      return `<div class="q"><b>${num}. ${esc(q.prompt)}</b>
        <div class="opts">${q.options.map((o, i) => `<div class="opt ${i === q.answer ? "correct" : i === a ? "wrong" : ""}"><span class="letter">${LETTERS[i]}</span><span>${esc(o)}${i === q.answer ? " ✓" : ""}${i === a && i !== q.answer ? " （你的答案）" : ""}</span></div>`).join("")}</div>
        ${a === undefined ? `<p class="muted">未作答</p>` : ""}
        <div class="explain">${esc(q.explanation)}</div></div>`;
    }).join("")}
  </div>`;
}

/* ---------- Events ---------- */
app.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const d = t.dataset;
  switch (d.action) {
    case "start-diagnostic": {
      const set = bank.meta.sets.find((s) => s.id === document.getElementById('test-set').value);
      const ids = orderedGroupIds(set.groupIds);
      if (set.id.startsWith('form-') || set.timing) ids.sort((a, b) => groupById(a).part - groupById(b).part);
      startSession("diagnostic", ids, set.durationMin, null, set.id.startsWith('form-') || set.timing ? set.id : null, set.timing);
      break;
    }
    case "start-form": {
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
      const groups = bank.groups.filter((g) => g.section === d.section);
      const groupIds = groups.map((g) => g.id);
      const questionCount = groups.reduce((sum, g) => sum + g.questions.length, 0);
      startSession(d.section, groupIds, Math.max(5, Math.ceil(questionCount * 1.2)));
      break;
    }
    case "start-photo": {
      const set = bank.meta.sets.find((item) => item.id === "photo-pilot");
      if (set && !session) startSession("practice", orderedGroupIds(set.groupIds), set.durationMin);
      break;
    }
    case "resume": if (allowSession(session.groupIds)) { resumeTimer(session); saveSession(); renderTest(); } break;
    case "pause-timer": if (pauseTimer(session)) { saveSession(); renderTest(); } else if (remainingMs(session) <= 0) { if (session.phase) renderTest(); else submit(true); } break;
    case "resume-timer": if (resumeTimer(session)) { saveSession(); renderTest(); } break;
    case "discard": if (confirm("放棄目前作答進度？")) { store.del(KEY_SESSION); session = null; renderHome(); } break;
    case "practice": {
      const ids = groupsForSkill(bank, d.skill);
      const n = flatten(bank, ids).length;
      startSession("practice", orderedGroupIds(ids), Math.max(5, Math.ceil(n * 1.2)));
      break;
    }
    case "review-wrong": {
      const qs = flatten(bank).filter((q) => wrongQueue[q.id]);
      if (!qs.length) { wrongQueue = {}; store.set(KEY_WRONG_QUEUE, wrongQueue); renderHome(); break; }
      const questionIds = qs.map((q) => q.id);
      const ids = orderedGroupIds([...new Set(qs.map((q) => q.groupId))]);
      startSession("review", ids, Math.max(5, Math.ceil(qs.length * 1.2)), questionIds);
      break;
    }
    case "view": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id)); break;
    case "toggle-all": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id), d.all === "1"); break;
    case "home": renderHome(); break;
    case "sample": sampleVoice(d.role, t); break;
    case "retry-voices": fillVoices(); break;
    case "reset-role-voices": for (const role of ['M', 'W', 'N']) audio.setPref(role, ''); fillVoices(); break;
    case "play": playGroup(d.group, t); break;
    case "stop-play": cancelPlayback(); break;
    case "reset-plays": if (!activePlay) { session.plays[d.group] = 0; saveSession(); renderTest(); } break;
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
  }
});

app.addEventListener("change", (e) => {
  if (e.target.id === 'speech-rate') audio.setRate(Number(e.target.value));
  const s = e.target.closest("select[data-voice]");
  if (s) { audio.setPref(s.dataset.voice, s.value); fillVoices(); }
});

init();
