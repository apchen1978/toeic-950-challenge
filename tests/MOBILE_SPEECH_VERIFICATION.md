# Mobile speech fix verification

Scope: root application and `/codex/`. Both use browser Web Speech synthesis, not prerecorded audio or a third-party speech endpoint. No bank, answer, scoring, or storage-key changes.

## Confirmed code defects

- The voice selector treated an empty filtered voice list as a terminal unavailable state. Initial enumeration can be empty; a first `voiceschanged` can also still be empty. The original one-shot listener stopped waiting too early, and the UI did not refresh after a later event.
- Playback awaited voice discovery before calling `speak`, potentially losing a mobile browser's transient user activation. `/codex/` also refused playback when enumeration remained empty, despite the engine being able to select a default voice by language.
- The root version resolved synthesis errors as though speech had completed. Cancellation could leave an unresolved utterance, and failed playback consumed an attempt.

Paul's exact phone/browser/engine configuration is unknown. These code defects are established; which one caused his specific failure remains unverified. Do not attribute it to permissions without device evidence.

## Changes

- Separate bounded discovery (polling plus repeated events, cleanup after completion) from synchronous click-triggered playback. Refresh selectors on late events and provide manual discovery retry.
- If English enumeration is empty or an old saved desktop voice is absent, leave `utterance.voice` unset and request `en-US`. This is an attempt to use the engine's language default, not a claim that the phone has an English engine.
- Only `onend` counts as success. Engine errors, cancellation, and a no-start/playback watchdog return failure. Show an error-specific message with retry, and restore the playback quota after an incomplete attempt.
- `/codex/` service-worker cache version increments to v6 for the changed modules. No live deployment is performed by this branch.

## Executed checks

- `npm test`: 23 passing tests, including 14 new speech regression cases across both module copies. Cases include empty enumeration with immediate synchronous `speak`, stale saved desktop voice, empty and delayed events, polling without events, empty timeout then later discovery, real error reporting and retry, cancellation/next playback, and silent-engine timeout.
- `node --check` for both app/audio copies; `git diff --check`.
- Edge at 390×844 with an injected empty-list speech engine: both `/` and `/codex/` passed first click, engine-error/refund/retry, next-question playback, refresh/resume/playback, and no horizontal overflow. The first utterance was observed during active user activation with no explicit voice and `lang=en-US`. This validates application behavior with a mocked engine; it does not validate physical mobile audio.
- Windows Edge native engine: three English voices enumerated; root sample reached the real engine's `onend` and displayed completion. This is engine-event verification, not an independent human judgment of sound quality.
- Diff review confirms question banks, answers, scoring modules, and localStorage keys are unchanged. The separate CC working directory's existing uncommitted files were not edited.

Browser scenario reproduction with Playwright CLI (available tooling; no new project dependency): start `node serve.mjs 4192`, open a fresh isolated browser session, then run `playwright-cli -s=<session> run-code --filename tests/browser-mobile-speech.js`. Use a fresh profile: the scenario intentionally saves test session progress.

## Still required on physical phones

Neither iPhone Safari nor Android Chrome has been physically tested. Check each of first visit, refresh/resume, and switching questions: a user click must produce audible English; missing voices must permit a default attempt, actual engine failure must show a useful retry message, and failures must not spend attempts. Check speaker output, installed English voice support, silent mode and any browser restrictions based on actual symptoms, without presuming a permission cause.

Official API references: [voice default by language](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/voice), [voice list change event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event), [speech engine error codes](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error).

Release: PR only. Await Paul's explicit merge instruction before merging or deploying. After merge, validate both public URLs and allow the `/codex/` worker to update; physical-phone acceptance remains necessary.
