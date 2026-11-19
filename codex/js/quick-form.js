// Fresh quick-mock forms. Whole groups only; Part 2 and Part 5 singles make the totals exact.
// No difficulty/level field exists on the bank, so mixByLevel is a no-op until one appears.

const ACCENTS = ["US", "UK", "CA", "AU"];

export const QUICK_BLUEPRINTS = {
  "quick-40": {
    minutes: 24,
    listening: 20,
    reading: 20,
    timing: { listening: 9, reading: 15 },
    parts: [
      { part: 1, groups: 2 },
      { part: 2, groups: 6 },
      { part: 3, groups: 3, questionsEach: 3, preferGraphic: 1 },
      { part: 4, groups: 1, questionsEach: 3, preferGraphic: 1 },
      { part: 5, groups: 8 },
      { part: 6, groups: 1, questionsEach: 4 },
      { part: 7, questions: 8, requireMulti: true }
    ]
  },
  // 題型快練：單看聽力（15 題）或閱讀（12 題），題型混合。
  "mini-listen-15": {
    minutes: 8,
    listening: 15,
    reading: 0,
    timing: { listening: 8, reading: 0 },
    parts: [
      { part: 1, groups: 1 },
      { part: 2, groups: 5 },
      { part: 3, groups: 2, questionsEach: 3 },
      { part: 4, groups: 1, questionsEach: 3, preferGraphic: 1 }
    ]
  },
  // 圖表聽力專練：Part 3 四組＋Part 4 四組，全部是「看圖（地圖、平面圖、表格、圖表）＋聽」的題組。
  "mini-graphic-24": {
    minutes: 10,
    listening: 24,
    reading: 0,
    timing: { listening: 10, reading: 0 },
    parts: [
      { part: 3, groups: 4, questionsEach: 3, preferGraphic: 4 },
      { part: 4, groups: 4, questionsEach: 3, preferGraphic: 4 }
    ]
  },
  "mini-read-12": {
    minutes: 9,
    listening: 0,
    reading: 12,
    timing: { listening: 0, reading: 9 },
    parts: [
      { part: 5, groups: 5 },
      { part: 6, groups: 1, questionsEach: 4 },
      { part: 7, questions: 3 }
    ]
  },
  // 閱讀分 Part 專練：Part 5 一題一組、Part 6 一組四題、Part 7 依題數抽。時間約照正式配速（Part 5 約 20 秒、Part 6 約 30 秒、Part 7 約 1 分鐘一題）。
  // Part 5＋6 限時衝刺：官方配速 Part 5 約 10 分、Part 6 約 8 分，合計 18 分。練把前面壓快，留時間給 Part 7。
  "part56-46": {
    minutes: 18,
    listening: 0,
    reading: 46,
    timing: { listening: 0, reading: 18 },
    parts: [{ part: 5, groups: 30 }, { part: 6, groups: 4, questionsEach: 4 }]
  },
  "part5-15": {
    minutes: 5,
    listening: 0,
    reading: 15,
    timing: { listening: 0, reading: 5 },
    parts: [{ part: 5, groups: 15 }]
  },
  "part5-30": {
    minutes: 10,
    listening: 0,
    reading: 30,
    timing: { listening: 0, reading: 10 },
    parts: [{ part: 5, groups: 30 }]
  },
  "part6-8": {
    minutes: 4,
    listening: 0,
    reading: 8,
    timing: { listening: 0, reading: 4 },
    parts: [{ part: 6, groups: 2, questionsEach: 4 }]
  },
  "part6-16": {
    minutes: 8,
    listening: 0,
    reading: 16,
    timing: { listening: 0, reading: 8 },
    parts: [{ part: 6, groups: 4, questionsEach: 4 }]
  },
  "part7-12": {
    minutes: 12,
    listening: 0,
    reading: 12,
    timing: { listening: 0, reading: 12 },
    parts: [{ part: 7, questions: 12 }]
  },
  "part7-25": {
    minutes: 24,
    listening: 0,
    reading: 25,
    timing: { listening: 0, reading: 24 },
    parts: [{ part: 7, questions: 25, requireMulti: true }]
  },
  "quick-60": {
    minutes: 36,
    listening: 30,
    reading: 30,
    timing: { listening: 13.5, reading: 22.5 },
    parts: [
      { part: 1, groups: 2 },
      { part: 2, groups: 10 },
      { part: 3, groups: 4, questionsEach: 3, preferGraphic: 1 },
      { part: 4, groups: 2, questionsEach: 3, preferGraphic: 1 },
      { part: 5, groups: 14 },
      { part: 6, groups: 1, questionsEach: 4 },
      { part: 7, questions: 12, requireMulti: true }
    ]
  }
};

export function createRng(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rememberQuickDraw(history, groupIds, formId, limit = 3) {
  const draws = Array.isArray(history) ? history : [];
  return [...draws, { formId, groupIds: [...groupIds] }].slice(-limit);
}

export function avoidedGroupIds(history) {
  const draws = Array.isArray(history) ? history : [];
  return new Set(draws.flatMap((draw) => draw?.groupIds ?? []));
}

export function mixByLevel(groups) {
  const buckets = new Map();
  for (const group of groups) {
    const level = levelOf(group);
    if (!buckets.has(level)) buckets.set(level, []);
    buckets.get(level).push(group);
  }
  if (buckets.size < 2) return groups.slice();
  const mixed = [];
  const levels = [...buckets.keys()];
  while (mixed.length < groups.length) {
    for (const level of levels) {
      const bucket = buckets.get(level);
      if (bucket.length) mixed.push(bucket.shift());
    }
  }
  return mixed;
}

export function partsForSection(parts, section) {
  if (section === "listening") return parts.filter((spec) => spec.part <= 4);
  if (section === "reading") return parts.filter((spec) => spec.part >= 5);
  return parts;
}

export function isActiveGroup(group) {
  return !group.retired && !group.questions?.some((question) => question.retired);
}

export function assembleQuickForm(bank, formId, options = {}) {
  const blueprint = QUICK_BLUEPRINTS[formId];
  if (!blueprint) throw new Error(`unknown quick form ${formId}`);
  const random = options.random ?? Math.random;
  const section = options.section === "listening" || options.section === "reading" ? options.section : "full";
  const avoid = options.avoid instanceof Set ? options.avoid : new Set(options.avoid ?? []);
  const accents = options.accents ?? {};
  let chosen = [];
  let accentCounts = { US: 0, UK: 0, CA: 0, AU: 0 };
  let issues = [];
  let best = null;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    chosen = [];
    accentCounts = { US: 0, UK: 0, CA: 0, AU: 0 };
    const specs = partsForSection(blueprint.parts, section);
    for (let at = 0; at < specs.length; at += 1) {
      // Parts 3 and 4 share the intent/graphic rules, so they are redrawn together; every other part is redrawn alone.
      const unit = specs[at].part === 3 && specs[at + 1]?.part === 4 ? [specs[at], specs[at + 1]] : [specs[at]];
      const scope = unit.map((spec) => spec.part);
      const baseCounts = { ...accentCounts };
      let keep = null;
      // Prefer groups not seen in recent draws; if that cannot satisfy the type rules, allow repeats for this part only.
      for (let retry = 0; retry < 300 && !(keep && keep.issues === 0); retry += 1) {
        const skip = retry < 150 ? avoid : new Set();
        accentCounts = { ...baseCounts };
        const drawn = [];
        for (const spec of unit) {
          const pool = bank.groups.filter((group) => isActiveGroup(group) && group.part === spec.part && (!spec.questionsEach || group.questions.length === spec.questionsEach));
          const accentOf = (group) => accents[group.id] || group.accent || "";
          const counts = spec.part <= 4 ? accentCounts : null;
          const picked = spec.questions
            ? pickByQuestionTotal(pool, spec.questions, random, skip, spec.requireMulti === true)
            : pickWithGraphicPreference(pool, spec, random, skip, accentOf, counts);
          drawn.push(...mixByLevel(picked));
        }
        const unitIssues = quickCoverageIssues(chosen.concat(drawn), formId, section).filter((issue) => scope.some((part) => issueScope(issue).includes(part)));
        if (!keep || unitIssues.length < keep.issues) keep = { drawn, counts: { ...accentCounts }, issues: unitIssues.length };
      }
      chosen.push(...keep.drawn);
      accentCounts = keep.counts;
      at += unit.length - 1;
    }
    issues = quickCoverageIssues(chosen, formId, section);
    if (!best || issues.length < best.issues.length) best = { chosen: chosen.slice(), accentCounts: { ...accentCounts }, issues };
    if (!issues.length) break;
  }
  // Coverage is best effort: if the bank cannot satisfy every rule, keep the closest draw and warn. Never throw for coverage.
  if (issues.length && best) {
    chosen = best.chosen;
    accentCounts = best.accentCounts;
    issues = best.issues;
    if (typeof console !== "undefined") console.warn(formId + " could not meet every type coverage rule: " + issues.join(", "));
  }
  const groupIds = chosen.map((group) => group.id);
  if (new Set(groupIds).size !== groupIds.length) throw new Error(`duplicate group in ${formId}`);
  const listening = chosen.filter((group) => group.section === "listening").reduce((sum, group) => sum + group.questions.length, 0);
  const reading = chosen.filter((group) => group.section === "reading").reduce((sum, group) => sum + group.questions.length, 0);
  const expectListening = section === "reading" ? 0 : blueprint.listening;
  const expectReading = section === "listening" ? 0 : blueprint.reading;
  if (listening !== expectListening || reading !== expectReading) {
    throw new Error(`${formId} assembled ${listening}+${reading}, expected ${expectListening}+${expectReading}`);
  }
  const timing = section === "reading"
    ? { reading: blueprint.timing.reading }
    : section === "listening"
      ? { listening: blueprint.timing.listening }
      : blueprint.timing;
  const minutes = section === "reading" ? blueprint.timing.reading : section === "listening" ? blueprint.listening : blueprint.minutes;
  return { formId, section, groupIds, timing, minutes, accentCounts: { ...accentCounts }, coverageWarnings: issues.slice() };
}

function issueScope(issue) {
  if (issue.startsWith("P3/P4")) return [3, 4];
  const match = /^P(\d)/.exec(issue);
  return match ? [Number(match[1])] : [];
}

function questionTypes(group) {
  return (group.questions ?? []).map((question) => String(question.questionType ?? "").toLowerCase());
}

function hasType(groups, part, pattern) {
  return groups.some((group) => group.part === part && questionTypes(group).some((type) => pattern.test(type)));
}

export function quickCoverageIssues(groups, formId, section = "full") {
  const mini = String(formId).startsWith("mini-");
  const partSet = /^part(?:[567]|56)-\d+$/.test(String(formId));
  const full = formId === "quick-40" || formId === "quick-60" || mini || partSet;
  const has = (part) => groups.some((group) => group.part === part);
  const long = formId === "quick-60";
  if (!full) return [];
  const issues = [];
  const listening = section !== "reading";
  const reading = section !== "listening";
  if (listening) {
    const p2Types = new Set(groups.filter((group) => group.part === 2).flatMap(questionTypes));
    const needsP2 = !(QUICK_BLUEPRINTS[formId] && !QUICK_BLUEPRINTS[formId].parts.some((spec) => spec.part === 2));
    if (needsP2 && p2Types.size < (mini ? 3 : 4)) issues.push(mini ? "P2 three response types" : "P2 four response types");
    if (!mini && !groups.some((group) => [3, 4].includes(group.part) && questionTypes(group).some((type) => /intent|meaning|implied/i.test(type)))) issues.push("P3/P4 speaker intent");
    if (!groups.some((group) => [3, 4].includes(group.part) && isGraphicGroup(group))) issues.push("P3/P4 graphic");
    if (long && new Set(groups.filter((group) => group.part === 1).flatMap(questionTypes)).size < 2) issues.push("P1 two types");
    const photos = groups.filter((group) => group.part === 1).map((group) => group.image).filter(Boolean);
    if (new Set(photos).size < photos.length) issues.push("P1 distinct photos");
  }
  if (reading) {
    const p5 = groups.filter((group) => group.part === 5).flatMap((group) => group.questions ?? []);
    const types = new Set(p5.map((question) => String(question.questionType ?? "").toLowerCase()));
    const p5Coverage = [
      /part.of.speech|word.form|vocab.*form/i,
      /tense|verb.form|passive/i,
      /preposition|conjunction|connector/i,
      /vocab|collocation|word.choice/i
    ].every((pattern) => [...types].some((type) => pattern.test(type)));
    if (!p5Coverage && (!partSet || has(5))) issues.push("P5 grammar and vocabulary types");
    if (!hasType(groups, 6, /sentence.insertion|insert.sentence/i) && (!partSet || has(6))) issues.push("P6 sentence insertion");
    if (!mini && !(partSet && formId !== "part7-25") && (!partSet || has(7)) && !groups.some((group) => group.part === 7 && isVerifiedCrossRef(group))) issues.push("P7 cross-reference");
    const p7Synonym = hasType(groups, 7, /synonym|closest.in.meaning|vocab.in.context/i);
    const p7Intent = hasType(groups, 7, /intent|purpose.of.message|text.message.intent/i);
    if (long && (!p7Synonym || !p7Intent)) issues.push("P7 synonym and intent");
    if (!long && !mini && !partSet && !p7Synonym && !p7Intent) issues.push("P7 synonym or intent");
  }
  return issues;
}

function levelOf(group) {
  const direct = group.difficulty ?? group.level;
  if (direct != null && direct !== "") return String(direct);
  const item = group.questions?.find((question) => question.difficulty != null || question.level != null);
  return item ? String(item.difficulty ?? item.level) : "";
}

export function isGraphicGroup(group) {
  return group?.graphic === true || Boolean(group?.graphicView) || (group?.part >= 3 && Boolean(group?.image));
}

function pickWithGraphicPreference(pool, spec, random, avoid, accentOf, accentCounts) {
  if (!spec.preferGraphic) return sampleGroups(pool, spec.groups, random, avoid, accentOf, accentCounts);
  const graphicPool = pool.filter(isGraphicGroup);
  const want = Math.min(spec.preferGraphic, spec.groups, graphicPool.length);
  const graphicPicked = want ? sampleGroups(graphicPool, want, random, avoid, accentOf, accentCounts) : [];
  const used = new Set(graphicPicked.map((group) => group.id));
  const rest = sampleGroups(pool.filter((group) => !used.has(group.id)), spec.groups - graphicPicked.length, random, avoid, accentOf, accentCounts);
  return graphicPicked.concat(rest);
}

function sampleGroups(pool, count, random, avoid, accentOf, accentCounts) {
  const fresh = pool.filter((group) => !avoid.has(group.id));
  const source = fresh.length >= count ? fresh : pool.slice();
  const remaining = source.slice();
  const picked = [];
  while (picked.length < count) {
    if (!remaining.length) break;
    let candidates = remaining;
    if (accentCounts) {
      const known = remaining.filter((group) => ACCENTS.includes(accentOf(group)));
      const basis = known.length ? known : remaining;
      const min = Math.min(...ACCENTS.map((accent) => accentCounts[accent] ?? 0));
      const preferred = new Set(ACCENTS.filter((accent) => (accentCounts[accent] ?? 0) === min));
      const balanced = basis.filter((group) => preferred.has(accentOf(group)));
      if (balanced.length) candidates = balanced;
    }
    const choice = candidates[Math.floor(random() * candidates.length)];
    remaining.splice(remaining.indexOf(choice), 1);
    picked.push(choice);
    const accent = accentOf(choice);
    if (accentCounts && ACCENTS.includes(accent)) accentCounts[accent] += 1;
  }
  if (picked.length !== count) throw new Error(`needed ${count} groups from part ${pool[0]?.part}, found ${picked.length}`);
  return picked;
}

export function drawQuestionGroups(groups, target, random, avoid = new Set(), requireMulti = false) {
  const skipped = avoid instanceof Set ? avoid : new Set(avoid);
  return pickByQuestionTotal(groups, target, random, skipped, requireMulti);
}

function pickByQuestionTotal(groups, target, random, avoid, requireMulti) {
  const fresh = groups.filter((group) => !avoid.has(group.id));
  const attempts = [
    [fresh, requireMulti],
    [groups, requireMulti]
  ];
  if (requireMulti) attempts.push([fresh, false], [groups, false]);
  for (const [pool, multi] of attempts) {
    const picked = solve(pool, target, random, multi);
    if (picked && questionCount(picked) === target) return picked;
  }
  throw new Error(`could not assemble ${target} questions from part ${groups[0]?.part}`);
}

// Audit-verified sets: every marked cross-reference needs two documents (OK or Fixed).
// Protected groups the audit found answerable from one document stay in the pool but are not preferred.
export const VERIFIED_CROSSREF_GROUP_IDS = new Set([
  "g-new-multi",
  "s03-double",
  "g-reading04-delivery",
  "g-rd-pay-01",
  "g-rd-job-01",
  "g-rt-train-01",
  "g-rd-ship-01",
  "g-rdnew-033",
  "g-rdnew-034",
  "g-rdnew-035",
  "g-rdnew-036",
  "g-rdnew-037",
  "g-rdnew-038"
]);

export function isVerifiedCrossRef(group) {
  return VERIFIED_CROSSREF_GROUP_IDS.has(group?.id);
}

function solve(groups, target, random, requireMulti) {
  if (!groups.length && target > 0) return null;
  if (!requireMulti) return fillExact(groups, target, random);
  const multis = groups.filter(isMulti).filter((group) => group.questions.length <= target);
  const preferred = shuffle(multis.filter(isVerifiedCrossRef), random);
  const rest = shuffle(multis.filter((group) => !isVerifiedCrossRef(group)), random);
  for (const multi of preferred.concat(rest)) {
    const fill = fillExact(groups.filter((group) => group.id !== multi.id), target - multi.questions.length, random);
    if (fill) return [multi, ...fill];
  }
  return null;
}

function fillExact(groups, target, random) {
  if (target === 0) return [];
  const shuffled = shuffle(groups, random);
  const ways = Array(target + 1).fill(null);
  ways[0] = [];
  for (const group of shuffled) {
    const size = group.questions.length;
    if (size <= 0 || size > target) continue;
    for (let sum = target - size; sum >= 0; sum -= 1) {
      if (!ways[sum] || ways[sum + size]) continue;
      ways[sum + size] = ways[sum].concat(group);
    }
  }
  return ways[target];
}

function shuffle(list, random) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isMulti(group) {
  return (group.passage?.docs?.length ?? 0) > 1;
}

function questionCount(groups) {
  return groups.reduce((sum, group) => sum + group.questions.length, 0);
}
