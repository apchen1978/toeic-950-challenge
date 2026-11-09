# TOEIC `/codex/` Coverage — 2026-11-09

This is an audit of the current branch, not a claim that an official mock exam exists. The live baseline before this branch has 261 questions; this branch has 276, with the original groups preserved. Counts are based on `codex/data/questions.json` and are not an estimate of difficulty or official score.

| Part | Status | Branch evidence | Official form |
|---|---|---|---|
| 1 Photos | PARTIAL | 8 questions, each with an image and four spoken options | 6 questions |
| 2 Responses | PARTIAL | 31 questions with three spoken responses; practice audio uses browser speech | 25 questions |
| 3 Conversations | PARTIAL | 48 questions in 17 groups; 14 groups contain exactly 3 questions, including one route-map item | 13 groups of 3 |
| 4 Talks | PARTIAL | 30 questions in 10 groups of 3 | 10 groups of 3 |
| 5 Sentences | PARTIAL | 47 questions; broad grammar/vocabulary tags, not comprehensive subtype or difficulty labels | 30 questions |
| 6 Text completion | PARTIAL | 16 questions in 4 groups of 4; full-sentence completion exists | 4 groups of 4 |
| 7 Reading | PARTIAL | 96 questions: 29 single-passage and 67 multiple-passage; two- and three-document groups exist | 29 single, 25 multiple |

Counts reflect the question bank, not an assembled official-form test. Official blueprint: [TOEIC Taiwan test content](https://www.toeic.com.tw/toeic/listening-reading/about/content/).
The new route-map and three-document items follow the task types shown in the [ETS sample test and listening script](https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/sample-test-listening-reading.pdf) and [Taiwan TOEIC's format explanation](https://toeic.com.tw/toeic/listening-reading/about/update-info/). All scenarios, wording and images are original; these are not official or recalled exam questions.

## App capability and limits

- **PARTIAL — Listening:** `codex/js/audio.js` uses browser speech synthesis. `codex/js/app.js` provides playback, cancellation and failure handling; it does not use prerecorded official audio. Physical-phone reliability and accent coverage are device-dependent and remain unverified for new items.
- **PARTIAL — Images and shared passages:** `codex/js/app.js` renders a group image and passage documents, and presents multiple questions per group. Photo practice and one campus route-map listening group exist. More chart/map variants and real-device legibility checks are needed.
- **PARTIAL — Practice modes:** predefined sets, section practice, weak-skill practice and a local wrong-answer queue exist. A manual pause freezes the remaining time and cancels unfinished audio; the paused state survives reload. There is no complete official 200-question mock mode, fixed 45/75-minute section transition, or exam-only single-play rule. Practice currently permits two complete plays.
- **PARTIAL — Results:** session duration, section results, skill counts, history and a clearly labelled unofficial estimate exist (`codex/js/app.js`, `codex/js/scoring.js`). Per-question response time, difficulty/subtype analytics and spaced-review scheduling are absent. The current wrong-answer queue removes an item after a correct response.
- **PARTIAL — PWA and persistence:** `codex/sw.js` caches the app and image assets; browser localStorage stores progress and history. Paul previously confirmed offline use on his phone, but the current branch and new assets need a fresh device check. Records do not sync across browsers/devices.
- **PARTIAL — Explanations:** current explanations are English. Chinese explanations, detailed distractor fields and difficulty tags are not yet present.

## Route to one correctly composed form

The bank now contains enough correctly grouped items to assemble one 200-question form without altering old question groups or their history. The exact selection, question quality and media still need review. An exam mode also needs separate 45/75-minute section timing and single-play enforcement; a 200-question count alone is insufficient.

Next, add more chart/map listening variants and reviewed photo scenes, then build the missing group types above in reviewed batches. Preserve existing IDs, group composition, stored sessions and history. Add Traditional Chinese explanations incrementally rather than replacing existing English rationales.

## Acceptance checks for a future mock mode

1. Assert the exact official Part counts, 13 Part 3 groups and 10 Part 4 groups of three, four Part 6 groups of four, and 29 single / 25 multiple Part 7 questions.
2. Verify the transition from a 45-minute listening section to a 75-minute reading section, no cross-section editing, and single complete playback per listening group; clearly report playback failures.
3. Verify that answers and history survive reload without modifying old results; distinguish unofficial estimates from official scores.
4. Verify images, shared passages, audio and review on a physical phone; distinguish online and offline results.
5. Review answer uniqueness, distractor plausibility, language and source rights independently of structural tests.
