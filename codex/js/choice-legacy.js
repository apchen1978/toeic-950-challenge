// Option order before the Round 12 shuffle. Saved sessions store the chosen index,
// so an old index is turned back into the same option text and then into the new index.
export const CHOICE_REVISION = 2;

export const LEGACY_OPTIONS = {
  GXP201: ["Ask Sarah, she's handling it.", "The logo is printed in blue.", "The client arrived by train."],
  GXP202: ["I just got here myself.", "The storage shelves are blue.", "There are six boxes in the catalog."],
  GXP203: ["Hasn't the memo gone out?", "Friday comes after Thursday.", "The printer needs more paper."],
  GXP204: ["Isn't Dana covering that?", "The invoices are numbered in blue.", "Dana works on the second floor."],
  GXP205: ["Check with the front desk.", "The session lasts two hours.", "The training room has new chairs."],
  GXP206: ["You'd have to ask the warehouse.", "The warehouse has two loading doors.", "A storm is forecast for next week."],
  GXP207: ["Didn't the printer call you?", "The printer is next to the window.", "The fair opens at noon tomorrow."],
  GXP208: ["I just got here myself.", "The cafeteria serves fresh fruit.", "The dining tables are round."],
  GXP209: ["Hasn't that already been reserved?", "The conference room has ten chairs.", "The conference begins next week."],
  GXP210: ["Try asking the legal team.", "The legal team meets on Tuesday.", "The copier needs more paper."],
  GXP211: ["I'm new here too.", "The loading dock is painted green.", "The delivery arrived yesterday."],
  GXP212: ["Ask her assistant.", "The briefing room has a projector.", "Her assistant sits on the third floor."],
  GXP213: ["Isn't Owen the editor on this?", "The draft has twelve pages.", "Owen joined the company last year."],
  GXP214: ["Check the board by the door.", "The airport has two terminals.", "The shuttle seats twelve passengers."],
  GXP215: ["I haven't seen their reply yet.", "The supplier sells office chairs.", "The invoice has three pages."]
};

export function migrateChoiceIndexes(answers, revision, questionsById) {
  const source = answers && typeof answers === "object" ? { ...answers } : {};
  if (revision >= CHOICE_REVISION) return { answers: source, revision: CHOICE_REVISION, changed: false };
  for (const [id, legacy] of Object.entries(LEGACY_OPTIONS)) {
    const chosen = source[id];
    if (!Number.isInteger(chosen) || chosen < 0 || chosen >= legacy.length) continue;
    const options = questionsById?.[id]?.options;
    if (!options) continue;
    const index = options.indexOf(legacy[chosen]);
    if (index >= 0) source[id] = index;
  }
  return { answers: source, revision: CHOICE_REVISION, changed: true };
}
