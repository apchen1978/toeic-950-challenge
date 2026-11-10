// Official mock listening: one pass, with the pauses a real TOEIC recording leaves for answers.

export const OFFICIAL_FORMS = ["quick-40", "quick-60", "form-a", "form-b", "form-c"];
export const OFFICIAL_PAUSES = { item: 5, question: 8, graphic: 12 };
export const LISTEN_RATES = [0.9, 1, 1.1];

export function isOfficialForm(formId) {
  return OFFICIAL_FORMS.includes(formId);
}

export function normalizeListenRate(value) {
  const rate = Number(value);
  return LISTEN_RATES.includes(rate) ? rate : 1;
}

export function allowsReplay(session) {
  return !(session?.official && session.phase === "listening");
}

export function playbackRateFor(session, storedRate) {
  return session?.official ? 1 : normalizeListenRate(storedRate);
}

export function isGraphicQuestion(group, clip) {
  return Boolean(clip?.graphic || (group?.part >= 3 && group?.image));
}

export function buildOfficialSequence(groups, manifest) {
  const steps = [];
  for (const group of groups) {
    if (group.section !== "listening") continue;
    const entry = manifest?.groups?.[group.id];
    if (!entry) throw new Error(`missing listening audio for ${group.id}`);
    steps.push({
      type: "audio",
      groupId: group.id,
      part: group.part,
      file: entry.file,
      durationSec: Number(entry.durationSec) || 0
    });
    if (group.part <= 2) {
      steps.push({ type: "pause", groupId: group.id, part: group.part, durationSec: OFFICIAL_PAUSES.item });
      continue;
    }
    const clips = entry.questionClips ?? [];
    for (const question of group.questions) {
      const clip = clips.find((item) => item.id === question.id);
      const graphic = isGraphicQuestion(group, clip);
      steps.push({
        type: "question",
        groupId: group.id,
        questionId: question.id,
        part: group.part,
        file: clip?.file ?? `audio/q-${question.id}.mp3`,
        durationSec: Number(clip?.durationSec) || 0
      });
      steps.push({
        type: "pause",
        groupId: group.id,
        questionId: question.id,
        part: group.part,
        durationSec: graphic ? OFFICIAL_PAUSES.graphic : OFFICIAL_PAUSES.question,
        graphic
      });
    }
  }
  return steps;
}

export function sequenceSeconds(steps) {
  return steps.reduce((sum, step) => sum + step.durationSec, 0);
}

export function remainingSeconds(steps, index, elapsedInStep = 0) {
  const upcoming = steps.slice(index).reduce((sum, step) => sum + step.durationSec, 0);
  return Math.max(0, upcoming - elapsedInStep);
}
