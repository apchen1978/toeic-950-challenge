// A paused session stores remaining time, so reloads do not consume the break.
export function remainingMs(session, now = Date.now()) {
  const remaining = Number.isFinite(session.pausedRemainingMs)
    ? session.pausedRemainingMs : session.endsAt - now;
  return Math.max(0, remaining);
}

export function pauseTimer(session, now = Date.now()) {
  if (Number.isFinite(session.pausedRemainingMs)) return false;
  const remaining = remainingMs(session, now);
  if (remaining <= 0) return false;
  session.pausedRemainingMs = remaining;
  return true;
}

export function resumeTimer(session, now = Date.now()) {
  if (!Number.isFinite(session.pausedRemainingMs)) return false;
  session.endsAt = now + session.pausedRemainingMs;
  delete session.pausedRemainingMs;
  return true;
}

export function elapsedSeconds(session, now = Date.now()) {
  if (session.phase) return (session.completedSeconds ?? 0) + Math.max(0, Math.min(session.phaseMinutes * 60, Math.round((session.phaseMinutes * 60000 - remainingMs(session, now)) / 1000)));
  return Math.max(0, Math.min(session.minutes * 60, Math.round((session.minutes * 60000 - remainingMs(session, now)) / 1000)));
}

export function startTimedForm(session, formId, now = Date.now(), timing = {}) {
  const listening = timing.listening ?? 45;
  const reading = timing.reading ?? 75;
  Object.assign(session, { formId, phase: 'listening', phaseMinutes: listening, readingMinutes: reading, completedSeconds: 0, endsAt: now + listening * 60000 });
}

export function startReading(session, now = Date.now(), expired = false) {
  if (session.phase !== 'listening') return false;
  const deadline = session.endsAt;
  session.completedSeconds = elapsedSeconds(session, now);
  session.phase = 'reading';
  session.phaseMinutes = session.readingMinutes ?? 75;
  session.endsAt = (expired ? deadline : now) + session.phaseMinutes * 60000;
  delete session.pausedRemainingMs;
  return true;
}
