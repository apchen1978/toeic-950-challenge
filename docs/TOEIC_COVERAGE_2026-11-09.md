# TOEIC `/codex/` Coverage — 2026-11-09

This is an audit of the current branch, not a claim that an official mock exam exists. The live baseline before this branch has 168 questions; this branch has 213, with the original groups preserved. Counts are based on `codex/data/questions.json` and are not an estimate of difficulty or official score.

| Part | Status | Branch evidence | Official form |
|---|---|---|---|
| 1 Photos | PARTIAL | 3 questions, each with an image and four spoken options | 6 questions |
| 2 Responses | PARTIAL | 31 questions with three spoken responses; practice audio uses browser speech | 25 questions |
| 3 Conversations | PARTIAL | 27 questions in 10 groups; 7 groups contain exactly 3 questions | 13 groups of 3 |
| 4 Talks | PARTIAL | 24 questions in 8 groups of 3 | 10 groups of 3 |
| 5 Sentences | PARTIAL | 47 questions; broad grammar/vocabulary tags, not comprehensive subtype or difficulty labels | 30 questions |
| 6 Text completion | PARTIAL | 12 questions in 3 groups of 4; full-sentence completion exists | 4 groups of 4 |
| 7 Reading | PARTIAL | 69 questions: 12 single-passage and 57 multiple-passage; two- and three-document groups exist | 29 single, 25 multiple |

Counts reflect the question bank, not an assembled official-form test. Official blueprint: [TOEIC Taiwan test content](https://www.toeic.com.tw/toeic/listening-reading/about/content/).

## App capability and limits

- **PARTIAL — Listening:** `codex/js/audio.js` uses browser speech synthesis. `codex/js/app.js` provides playback, cancellation and failure handling; it does not use prerecorded official audio. Physical-phone reliability and accent coverage are device-dependent and remain unverified for new items.
- **PARTIAL — Images and shared passages:** `codex/js/app.js` renders a group image and passage documents, and presents multiple questions per group. Photo practice exists. There are no map or graphic-based listening questions in this bank yet.
- **PARTIAL — Practice modes:** predefined sets, section practice, weak-skill practice and a local wrong-answer queue exist. There is no complete official 200-question mock mode, fixed 45/75-minute section transition, or exam-only single-play rule. Practice currently permits two complete plays.
- **PARTIAL — Results:** session duration, section results, skill counts, history and a clearly labelled unofficial estimate exist (`codex/js/app.js`, `codex/js/scoring.js`). Per-question response time, difficulty/subtype analytics and spaced-review scheduling are absent. The current wrong-answer queue removes an item after a correct response.
- **PARTIAL — PWA and persistence:** `codex/sw.js` caches the app and image assets; browser localStorage stores progress and history. Paul previously confirmed offline use on his phone, but the current branch and new assets need a fresh device check. Records do not sync across browsers/devices.
- **PARTIAL — Explanations:** current explanations are English. Chinese explanations, detailed distractor fields and difficulty tags are not yet present.

## Smallest route to one correctly composed form

Without altering old question groups or their history, add at least: 3 photos; 6 new three-question Part 3 groups (18 questions); 2 new three-question Part 4 groups (6); one four-question Part 6 passage (4); and 17 single-passage Part 7 questions. That is **48 new questions**. Existing items can supply 25 Part 2, 30 Part 5, and five five-question multiple-passage groups. An exam mode still needs separate 45/75-minute section timing and single-play enforcement; a 200-question count alone is insufficient.

Next, add a small set of map/graphic listening exercises, then build the missing group types above in reviewed batches. Preserve existing IDs, group composition, stored sessions and history. Add Traditional Chinese explanations incrementally rather than replacing existing English rationales.

## Acceptance checks for a future mock mode

1. Assert the exact official Part counts, 13 Part 3 groups and 10 Part 4 groups of three, four Part 6 groups of four, and 29 single / 25 multiple Part 7 questions.
2. Verify the transition from a 45-minute listening section to a 75-minute reading section, no cross-section editing, and single complete playback per listening group; clearly report playback failures.
3. Verify that answers and history survive reload without modifying old results; distinguish unofficial estimates from official scores.
4. Verify images, shared passages, audio and review on a physical phone; distinguish online and offline results.
5. Review answer uniqueness, distractor plausibility, language and source rights independently of structural tests.
