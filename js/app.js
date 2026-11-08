import * as audio from "./audio.js";
import { flatten, score, estimateScaled, mergeSkillStats, weakest, groupsForSkill, formatDuration } from "./scoring.js";
import { SKILLS, skillLabel } from "./skills.js";

const EXAM_DATE = "2026-11-29";
const MAX_PLAYS = 2;
const LETTERS = ["A", "B", "C", "D"];
const KEY_SESSION = "toeic950.session.v1";
const KEY_HISTORY = "toeic950.history.v1";

const app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

let bank = null;
let session = null;
let timerId = null;

const groupById = (id) => bank.groups.find((g) => g.id === id);
const sessionQuestions = () => flatten(bank, session.groupIds);
const saveSession = () => store.set(KEY_SESSION, session);

async function init() {
  try {
    const res = await fetch("data/questions.json");
    bank = await res.json();
  } catch {
    app.innerHTML = `<p class="notice">題庫載入失敗。請用 <code>node serve.mjs</code> 或 GitHub Pages 開啟，不要直接雙擊 index.html。</p>`;
    return;
  }
  session = store.get(KEY_SESSION, null);
  if (session && session.bankVersion !== bank.meta.version) session = null;
  renderHome();
}

/* ---------- Home ---------- */
function renderHome() {
  stopTimer();
  audio.stop();
  const history = store.get(KEY_HISTORY, []);
  const days = Math.ceil((new Date(`${EXAM_DATE}T00:00:00`) - new Date()) / 86400000);
  const weak = weakest(mergeSkillStats(history), 3, 2);
  const last = history[history.length - 1];
  const n = flatten(bank).length;

  app.innerHTML = `
    <h1>TOEIC 950+ Challenge</h1>
    <p class="muted">目標：恢復 950+，挑戰 970–990。${days > 0 ? `距離 ${EXAM_DATE} 考試還有 <b>${days}</b> 天。` : ""}</p>

    <section class="card">
      <h2>診斷測驗</h2>
      <p>${n} 題高難度原創題（聽力＋閱讀），限時 ${bank.meta.durationMin} 分鐘。聽力不會在播放前顯示文字，每段最多播放 ${MAX_PLAYS} 次。</p>
      <div class="row">
        ${session ? `<button class="btn primary" data-action="resume">繼續上次作答</button><button class="btn" data-action="discard">放棄並重新開始</button>` : `<button class="btn primary" data-action="start-diagnostic">開始診斷測驗</button>`}
      </div>
      ${audio.supported() ? "" : `<p class="notice">此瀏覽器不支援語音合成，聽力題無法播放。請改用 Chrome、Edge 或 Safari。</p>`}
    </section>

    <section class="card">
      <h2>弱項追蹤與推薦</h2>
      ${weak.length ? weak.map((w) => `
        <div class="skillrow"><div><b>${esc(skillLabel(w.skill))}</b><div class="muted">${esc(SKILLS[w.skill]?.tip ?? "")}</div></div>
        <div>${Math.round(w.acc * 100)}%<br><button class="btn small" data-action="practice" data-skill="${esc(w.skill)}">練習</button></div></div>`).join("")
        : `<p class="muted">完成第一次診斷後，這裡會列出你最弱的題型與練習建議。</p>`}
    </section>

    <section class="card" id="voicecard"><h2>聽力音色</h2><p class="muted">語音由瀏覽器提供。若聽起來機械，請選含 Natural / Online 的語音（Edge 最好），可用「試聽」比較。</p><div id="voices" class="muted">載入語音中…</div></section>

    ${last ? `<section class="card"><h2>最近成績</h2>
      <div class="grid">
        <div class="stat"><b>${Math.round((last.correct / last.total) * 100)}%</b>正確率</div>
        <div class="stat"><b>${last.correct}/${last.total}</b>答對題數</div>
        <div class="stat"><b>${formatDuration(last.secUsed)}</b>耗時</div>
      </div></section>` : ""}

    ${history.length ? `<section class="card"><h2>作答紀錄</h2><table><thead><tr><th>日期</th><th>類型</th><th>正確率</th><th>耗時</th><th></th></tr></thead><tbody>
      ${history.slice().reverse().slice(0, 15).map((h) => `<tr><td>${new Date(h.date).toLocaleString("zh-TW", { hour12: false })}</td><td>${h.mode === "diagnostic" ? "診斷" : "弱項練習"}</td><td>${Math.round((h.correct / h.total) * 100)}%</td><td>${formatDuration(h.secUsed)}</td><td><button class="btn small" data-action="view" data-id="${h.id}">檢視</button></td></tr>`).join("")}
      </tbody></table></section>` : ""}
  `;
  fillVoices();
}

async function fillVoices() {
  const box = document.getElementById("voices");
  if (!box) return;
  const voices = await audio.getVoices();
  if (!document.getElementById("voices")) return;
  if (!voices.length) { box.innerHTML = `<span class="notice">找不到英文語音。</span>`; return; }
  const roles = [["M", "男聲"], ["W", "女聲"], ["N", "旁白（Part 2 選項）"]];
  box.innerHTML = roles.map(([r, label]) => `<div class="row" style="margin:6px 0"><label style="min-width:9em">${label}</label>
    <select data-voice="${r}" style="flex:1;min-width:0;font:inherit;padding:6px"><option value="">自動（推薦）</option>${voices.map((v) => `<option value="${esc(v.name)}" ${audio.getPref(r) === v.name ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>
    <button class="btn small" data-action="sample" data-role="${r}">試聽</button></div>`).join("");
}

/* ---------- Session ---------- */
function startSession(mode, groupIds, minutes) {
  const now = Date.now();
  session = {
    bankVersion: bank.meta.version, mode, groupIds, answers: {}, flags: {}, plays: {},
    cur: 0, startedAt: now, endsAt: now + minutes * 60000, minutes
  };
  saveSession();
  renderTest();
}

function orderedGroupIds(ids) {
  return bank.groups.filter((g) => ids.includes(g.id)).map((g) => g.id);
}

function startTimer() {
  stopTimer();
  const tick = () => {
    const left = Math.max(0, Math.round((session.endsAt - Date.now()) / 1000));
    const el = document.getElementById("timer");
    if (el) {
      el.textContent = formatDuration(left);
      el.classList.toggle("low", left <= 300);
    }
    if (left <= 0) submit(true);
  };
  tick();
  timerId = setInterval(tick, 1000);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

/* ---------- Test view ---------- */
function renderTest() {
  audio.stop();
  const qs = sessionQuestions();
  const g = groupById(session.groupIds[session.cur]);
  const answeredCount = qs.filter((q) => session.answers[q.id] !== undefined).length;
  const isLast = session.cur === session.groupIds.length - 1;
  const spoken = !!g.spokenOptions;

  app.innerHTML = `
    <div class="topbar">
      <div><span class="tag">${g.section === "listening" ? "Listening" : "Reading"}</span><span class="tag">Part ${g.part}</span><span class="muted">${esc(g.title ?? "")}</span></div>
      <div class="row"><span class="muted" id="count">${answeredCount}/${qs.length} 已答</span><span class="timer" id="timer">--:--</span><button class="btn small primary" data-action="submit">交卷</button></div>
    </div>

    <section class="card">
      ${g.script ? audioBlock(g) : ""}
      ${g.passage ? g.passage.docs.map((d) => `<div class="doclabel">${esc(d.label)}</div><div class="passage">${esc(d.text)}</div>`).join("") : ""}
      ${g.questions.map((q) => questionBlock(q, qs, spoken)).join("")}
    </section>

    <div class="row" style="justify-content:space-between">
      <button class="btn" data-action="prev" ${session.cur === 0 ? "disabled" : ""}>← 上一組</button>
      <span class="muted">${session.cur + 1} / ${session.groupIds.length}</span>
      <button class="btn ${isLast ? "" : "primary"}" data-action="next" ${isLast ? "disabled" : ""}>下一組 →</button>
    </div>

    <section class="card"><h3>題號</h3><div class="palette">${qs.map((q, i) => `<button class="pal ${session.answers[q.id] !== undefined ? "answered" : ""} ${session.flags[q.id] ? "flag" : ""} ${q.groupId === g.id ? "current" : ""}" data-action="jump" data-group="${q.groupId}" aria-label="第 ${i + 1} 題">${i + 1}</button>`).join("")}</div></section>
  `;
  startTimer();
}

function audioBlock(g) {
  const used = session.plays[g.id] ?? 0;
  const left = MAX_PLAYS - used;
  return `<div class="audio" data-gid="${g.id}">
    <button class="btn primary" data-action="play" data-group="${g.id}" ${left <= 0 || !audio.supported() ? "disabled" : ""}>▶ 播放音檔</button>
    <span class="muted"><span class="plays">剩餘 ${left} 次</span> · <span class="status">聽完才開始作答也可以，文字稿交卷後才會顯示</span></span>
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
  if ((session.plays[gid] ?? 0) >= MAX_PLAYS) return;
  session.plays[gid] = (session.plays[gid] ?? 0) + 1;
  saveSession();
  const g = groupById(gid);
  const box = btn.closest(".audio");
  const status = box.querySelector(".status");
  box.querySelector(".plays").textContent = `剩餘 ${MAX_PLAYS - session.plays[gid]} 次`;
  btn.disabled = true;
  status.textContent = "播放中…";
  const lines = g.spokenOptions ? audio.withSpokenOptions(g) : g.script;
  const finished = await audio.playScript(lines);
  if (!box.isConnected) return;
  status.textContent = finished ? "播放完畢" : "已停止";
  btn.disabled = (session.plays[gid] ?? 0) >= MAX_PLAYS;
}

function pick(qid, i) {
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
  session.cur = Math.min(session.groupIds.length - 1, Math.max(0, session.cur + delta));
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
  const entry = {
    id: String(Date.now()), date: Date.now(), mode: session.mode,
    secUsed: Math.min(Math.round((Date.now() - session.startedAt) / 1000), session.minutes * 60),
    groupIds: session.groupIds, answers: session.answers,
    correct: result.correct, total: result.total, bySkill: result.bySkill, bySection: result.bySection
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
  const qs = flatten(bank, entry.groupIds);
  const r = score(qs, entry.answers);
  const L = estimateScaled(r.bySection.listening.c, r.bySection.listening.t);
  const R = estimateScaled(r.bySection.reading.c, r.bySection.reading.t);
  const weak = weakest(r.bySkill, 3, 1);
  const skills = Object.entries(r.bySkill).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
  const groups = bank.groups.filter((g) => entry.groupIds.includes(g.id)).filter((g) => showAll || g.questions.some((q) => entry.answers[q.id] !== q.answer));

  app.innerHTML = `
    <h1>測驗結果</h1>
    <section class="card"><div class="grid">
      <div class="stat"><b>${Math.round((r.correct / r.total) * 100)}%</b>正確率</div>
      <div class="stat"><b>${r.correct}/${r.total}</b>答對題數</div>
      <div class="stat"><b>${formatDuration(entry.secUsed)}</b>耗時</div>
      <div class="stat"><b>${r.answered}/${r.total}</b>已作答</div>
    </div>
    <p class="notice" style="margin-top:12px">非官方估計（僅供練習參考，不等同 ETS 成績，題量也遠少於正式考試）：
      ${L ? `Listening ≈ ${L.low}–${L.high}` : ""}${L && R ? "　" : ""}${R ? `Reading ≈ ${R.low}–${R.high}` : ""}</p></section>

    <section class="card"><h2>各題型表現</h2>
      ${skills.map(([k, v]) => `<div class="skillrow"><div>${esc(skillLabel(k))}</div><div>${v.c}/${v.t}</div><div class="bar ${v.c / v.t < 0.6 ? "weak" : ""}" style="grid-column:1 / -1"><i style="width:${(v.c / v.t) * 100}%"></i></div></div>`).join("")}
    </section>

    <section class="card"><h2>下一次練習建議</h2>
      ${weak.length ? weak.map((w) => `<div class="skillrow"><div><b>${esc(skillLabel(w.skill))}</b>（${w.c}/${w.t}）<div class="muted">${esc(SKILLS[w.skill]?.tip ?? "")}</div></div><div><button class="btn small" data-action="practice" data-skill="${esc(w.skill)}">練習</button></div></div>`).join("")
        : `<p>全部答對。下一步：加入更高難度題組，並提高限時壓力。</p>`}
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
  const qs = flatten(bank, entry.groupIds);
  return `<div class="q">
    <div class="doclabel">Part ${g.part} ${esc(g.title ?? "")}</div>
    ${g.script ? `<div class="script"><b>Transcript</b>${g.script.map((l) => `<p><span class="tag">${l.speaker === "M" ? "Man" : l.speaker === "W" ? "Woman" : "Narrator"}</span>${esc(l.text)}</p>`).join("")}</div>` : ""}
    ${g.passage ? g.passage.docs.map((d) => `<div class="doclabel">${esc(d.label)}</div><div class="passage">${esc(d.text)}</div>`).join("") : ""}
    ${g.questions.map((q) => {
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
    case "start-diagnostic": startSession("diagnostic", orderedGroupIds(bank.groups.map((g) => g.id)), bank.meta.durationMin); break;
    case "resume": renderTest(); break;
    case "discard": if (confirm("放棄目前作答進度？")) { store.del(KEY_SESSION); session = null; renderHome(); } break;
    case "practice": {
      const ids = groupsForSkill(bank, d.skill);
      const n = flatten(bank, ids).length;
      startSession("practice", orderedGroupIds(ids), Math.max(5, Math.ceil(n * 1.2)));
      break;
    }
    case "view": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id)); break;
    case "toggle-all": renderResult(store.get(KEY_HISTORY, []).find((h) => h.id === d.id), d.all === "1"); break;
    case "home": renderHome(); break;
    case "sample": audio.sample(d.role); break;
    case "play": playGroup(d.group, t); break;
    case "pick": pick(d.q, Number(d.i)); break;
    case "flag": toggleFlag(d.q); break;
    case "prev": go(-1); break;
    case "next": go(1); break;
    case "jump": session.cur = session.groupIds.indexOf(d.group); saveSession(); renderTest(); break;
    case "submit": submit(false); break;
  }
});

app.addEventListener("change", (e) => {
  const s = e.target.closest("select[data-voice]");
  if (s) audio.setPref(s.dataset.voice, s.value);
});

init();
