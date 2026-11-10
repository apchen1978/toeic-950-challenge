const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 14];

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
