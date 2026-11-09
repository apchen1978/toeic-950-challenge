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
  return Math.max(0, Math.min(session.minutes * 60, Math.round((session.minutes * 60000 - remainingMs(session, now)) / 1000)));
}
