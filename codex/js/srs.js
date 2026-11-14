const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 14];

export const FLASHCARD_RENAMES = {
  "complimentary offer": "free trial offer",
  "sales funnel leakage": "sales growth",
  "follow-up owner": "liaison",
  "service touchpoint": "service request",
  "expectation setting": "clarification",
  "contingency window": "provisional date",
  "performance calibration": "merit increase",
  "role clarity": "responsibility",
  "action register": "follow-up task",
  "throughput bottleneck": "production backlog",
  "meeting cadence": "closing remarks",
  "decision log": "meeting resolution",
  "customer acknowledgment": "written confirmation",
  "response-time target": "processing time",
  "complaint resolution plan": "corrective action",
  "schedule dependency": "postponement",
  "consent decree": "settlement agreement",
  "minority interest": "beneficial ownership",
  "deferred tax asset": "taxable income",
  "fare basis": "fare adjustment",
  "flight manifest": "flight connection",
  "BEO": "banquet reservation",
  "ASN": "dispatch notice",
  "IVR": "automated attendant",
  "duty of care policy": "itinerary change",
  "succession pipeline": "management trainee",
  "renewal pipeline": "renewal reminder",
  "goodwill adjustment": "goodwill gesture",
  "enclosure notation": "enclosed document",
  "call escalation": "referral to a supervisor",
  "lead qualification": "prospective customer",
  "succession candidate": "internal applicant",
  "first-pass yield": "inspection result",
  "sales pipeline": "sales projection",
  "in compliance with": "under the terms of",
  "vendor lead time": "delivery estimate",
  "task deadline": "submission deadline",
  "beneficial ownership": "contingency plan",
  "copy machine": "copier",
  "helmet": "safety helmet",
  "sign up": "sign up for",
  "responsible for": "be responsible for",
  "one-way": "one-way ticket",
  "follow up": "follow up on",
  "apologize": "apologize for",
  "hold on": "hold",
  "repairman": "repair person",
  "attach": "attached",
  "recycle": "recycling",
  "warn": "warning",
  "reserve": "book",
  "inspect": "check",
  "power": "electricity",
  "delayed": "delay",
  "main point": "point",
  "bulletin board": "notice board",
  "gift wrap": "wrap",
  "supervise": "supervisor"
};

// Follow a rename chain (minority interest -> beneficial ownership -> contingency plan) to the word that exists now.
export function finalFlashcardWord(word) {
  const seen = new Set([word]);
  let current = word;
  while (Object.hasOwn(FLASHCARD_RENAMES, current)) {
    const next = FLASHCARD_RENAMES[current];
    if (seen.has(next)) break;
    seen.add(next);
    current = next;
  }
  return current;
}

export function migrateFlashcardProgress(progress) {
  if (!progress || typeof progress !== 'object') return { progress, changed: false };
  let next = progress;
  for (const oldWord of Object.keys(FLASHCARD_RENAMES)) {
    const newWord = finalFlashcardWord(oldWord);
    if (newWord === oldWord || !Object.hasOwn(next, oldWord) || Object.hasOwn(next, newWord)) continue;
    if (next === progress) next = { ...progress };
    next[newWord] = next[oldWord];
    delete next[oldWord];
  }
  return { progress: next, changed: next !== progress };
}

export function rateCard(previous, rating, now = Date.now()) {
  if (!['again', 'hard', 'good'].includes(rating)) throw new Error('Invalid rating');
  const oldBox = Math.max(0, Math.min(4, previous?.box ?? 0));
  const box = rating === 'again' ? 0 : rating === 'hard' ? Math.max(1, oldBox) : Math.min(4, oldBox + 1);
  return { box, dueAt: now + INTERVALS[box] * DAY, introducedAt: previous?.introducedAt ?? now };
}

export function selectCards(items, progress, options = {}, now = Date.now()) {
  const { level = 'all', category = 'all', limit = 20 } = options;
  // level 'pick' means the hand-picked must-learn set (items flagged pick: true), across all levels.
  const eligible = items.filter(x => (level === 'all' || (level === 'pick' ? x.pick === true : String(x.level) === String(level))) && (category === 'all' || x.category === category));
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const introduced = Object.values(progress).filter(x => x.introducedAt >= dayStart.getTime() && x.introducedAt <= now).length;
  const due = eligible.filter(x => progress[x.word] && progress[x.word].dueAt <= now);
  const fresh = eligible.filter(x => !progress[x.word]).slice(0, Math.max(0, limit - introduced));
  return [...due, ...fresh];
}
