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
  "emergency procedure": "contingency plan",
  "beneficial ownership": "contingency plan"
};

export function migrateFlashcardProgress(progress) {
  if (!progress || typeof progress !== 'object') return { progress, changed: false };
  let next = progress;
  for (const [oldWord, newWord] of Object.entries(FLASHCARD_RENAMES)) {
    if (!Object.hasOwn(next, oldWord) || Object.hasOwn(next, newWord)) continue;
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
  const eligible = items.filter(x => (level === 'all' || String(x.level) === String(level)) && (category === 'all' || x.category === category));
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const introduced = Object.values(progress).filter(x => x.introducedAt >= dayStart.getTime() && x.introducedAt <= now).length;
  const due = eligible.filter(x => progress[x.word] && progress[x.word].dueAt <= now);
  const fresh = eligible.filter(x => !progress[x.word]).slice(0, Math.max(0, limit - introduced));
  return [...due, ...fresh];
}
