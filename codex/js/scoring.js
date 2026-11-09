// Pure scoring / statistics helpers (no DOM) so they can be tested with `node --test`.

/** Flatten bank groups into a question list, optionally restricted to group ids (bank order kept). */
export function flatten(bank, groupIds) {
  const out = [];
  for (const g of bank.groups) {
    if (groupIds && !groupIds.includes(g.id)) continue;
    for (const q of g.questions) out.push({ ...q, groupId: g.id, section: g.section, part: g.part });
  }
  return out;
}

/** answers: { [questionId]: chosenIndex } */
export function score(questions, answers) {
  const bySkill = {};
  const bySection = { listening: { c: 0, t: 0 }, reading: { c: 0, t: 0 } };
  const wrong = [];
  let correct = 0;
  let answered = 0;
  for (const q of questions) {
    const a = answers[q.id];
    const ok = a === q.answer;
    if (a !== undefined && a !== null) answered++;
    if (ok) correct++;
    else wrong.push(q);
    bySkill[q.skill] ??= { c: 0, t: 0 };
    bySkill[q.skill].t++;
    bySection[q.section].t++;
    if (ok) {
      bySkill[q.skill].c++;
      bySection[q.section].c++;
    }
  }
  return { correct, total: questions.length, answered, bySkill, bySection, wrong };
}

/**
 * Rough, UNOFFICIAL scaled estimate for one section (5–495). It is a linear mapping from accuracy
 * with a +/-40 band. It is NOT ETS scoring and must always be labelled as an unofficial estimate.
 */
export function estimateScaled(correct, total) {
  if (!total) return null;
  const mid = Math.round((5 + (correct / total) * 490) / 5) * 5;
  return { mid, low: Math.max(5, mid - 40), high: Math.min(495, mid + 40) };
}

/** In-progress diagnostic: unanswered items are excluded. No score is shown below five answers. */
export function estimateProgress(questions, answers) {
  const categories = {
    listening: { c: 0, n: 0 },
    structure: { c: 0, n: 0 },
    grammar: { c: 0, n: 0 },
    reading: { c: 0, n: 0 },
    vocabulary: { c: 0, n: 0 }
  };
  const sections = { listening: { c: 0, n: 0 }, reading: { c: 0, n: 0 } };
  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) continue;
    const correct = Number(answer === q.answer);
    sections[q.section].n++;
    sections[q.section].c += correct;
    const labels = q.section === 'listening' ? ['listening'] : [
      ...(q.part === 6 ? ['structure'] : []),
      ...(q.skill === 'r-grammar' ? ['grammar'] : []),
      ...(q.skill === 'r-vocabulary' ? ['vocabulary'] : []),
      ...(q.part === 7 ? ['reading'] : [])
    ];
    for (const label of labels) {
      categories[label].n++;
      categories[label].c += correct;
    }
  }
  const ranges = {};
  for (const [key, { c, n }] of Object.entries(sections)) {
    if (n < 5) { ranges[key] = null; continue; }
    const p = c / n;
    const z = 1.645; // Approximate 90% Wilson interval for this practice sample.
    const denominator = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denominator;
    const margin = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;
    const scaled = (value) => Math.round((5 + Math.min(1, Math.max(0, value)) * 490) / 5) * 5;
    ranges[key] = { mid: scaled(p), low: scaled(center - margin), high: scaled(center + margin), answered: n };
  }
  return { categories, sections, ranges };
}

/** Merge per-skill stats across attempts: history entries carry `bySkill`. */
export function mergeSkillStats(history) {
  const merged = {};
  for (const h of history) {
    for (const [k, v] of Object.entries(h.bySkill ?? {})) {
      merged[k] ??= { c: 0, t: 0 };
      merged[k].c += v.c;
      merged[k].t += v.t;
    }
  }
  return merged;
}

/** Weakest skills (lowest accuracy first), ignoring skills with fewer than `minItems` attempts. */
export function weakest(stats, n = 3, minItems = 2) {
  return Object.entries(stats)
    .filter(([, v]) => v.t >= minItems)
    .map(([skill, v]) => ({ skill, c: v.c, t: v.t, acc: v.c / v.t }))
    .filter((s) => s.acc < 1)
    .sort((a, b) => a.acc - b.acc || b.t - a.t)
    .slice(0, n);
}

/** Group ids (bank order) that contain at least one question with the given skill. */
export function groupsForSkill(bank, skill) {
  return bank.groups.filter((g) => g.questions.some((q) => q.skill === skill)).map((g) => g.id);
}

/** Keep a local review queue: wrong answers are retained; a correct answer clears that question. */
export function updateWrongAnswerQueue(queue, questions, answers, now = Date.now()) {
  const next = { ...(queue ?? {}) };
  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) continue;
    if (answer === q.answer) {
      delete next[q.id];
    } else {
      const previous = next[q.id];
      next[q.id] = { wrongCount: (previous?.wrongCount ?? 0) + 1, lastWrongAt: now };
    }
  }
  return next;
}

export function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
