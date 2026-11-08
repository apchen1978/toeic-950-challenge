# Mobile playback follow-up

Target: `/codex/`. Paul reports Chrome initially played, later became silent and remained on “0 remaining / playing”. A second, unidentified browser reports no speech synthesis. Actual phone, OS, exact browser builds, engine state and timing are not yet known.

## Findings and fix

The existing application immediately persisted a play count before any engine start/end event. If a page was suspended or terminated before asynchronous failure/cancellation could refund it, an incomplete attempt could remain counted. This is a confirmed code risk and plausible contributor to the reported state, not a confirmed diagnosis of the phone. Existing watchdogs already handle missing engine events in a running foreground page; background timer throttling and engine-specific behavior still require device evidence. The unsupported message is a feature-detection result; browser identity and cause are not established.

Counting rule: only a complete script ending successfully consumes one attempt. Failure, timeout, stop, switching questions, leaving the page or background interruption consume zero, even if some audio was heard. A user-facing stop control cancels the active run; switching, pagehide or background visibility also cancel. Cancellable inter-line pauses prevent a stranded sequence. Active playback is guarded against overlapping retries, and callbacks from a cancelled utterance cannot complete a newer one. The app offers explicit per-question recovery when an earlier version left zero attempts; it does not silently rewrite prior records.

When required Web Speech functions are absent, the app blocks starting or resuming listening-containing sets, offers the visible URL and copy button with manual-copy fallback, and explains how to paste it into external Chrome. Reading-only practice remains available. Browsers cannot be forced open by the page, and Chrome support is not guaranteed.

Question banks, answers and storage keys unchanged; existing session records retained. `/codex/` worker increments to v8 to update the changed app assets after any future merge.

## Verification

`npm test`: 28 passing, including failure and retry, silent-engine timeout, cancellation, background cancellation, late callbacks, inter-line cancellation/switching, and unsupported implementation. `tests/browser-lifecycle.js` exercises simulated mobile-size Edge with a mocked engine and accelerated watchdog: timeout, engine error, stop, switching, background cancellation, refresh, completed-attempt counting, two-attempt reset, unsupported flow, mocked copy and reading-only access. Run against local `node serve.mjs 4193`, then `playwright-cli -s=<fresh-session> run-code --filename tests/browser-lifecycle.js`. These are simulations, not Paul phone tests, and fake timers do not establish real-world timing behavior.

Still required: physical phone Chrome first start, consecutive playback, switching, background/foreground, timeout/retry and refresh. Identify the other browser and check its copy-link path. Verify audible sound and quotas. Keep this PR unmerged until Paul explicitly requests merge; live site is not fixed by this PR alone.

## Optional pre-generated audio proposal (not implemented)

Generate the 28 current listening group scripts, including the spoken Part 2 choices, as static MP3 files ahead of time; store only authorized original material with a manifest mapping group IDs to relative URLs. Use click-triggered HTML audio with play/end/error/abort and watchdog states, validate public subpaths and caching, and retain a text-to-speech fallback where appropriate. Preview multiple accents and check licensing, file size, load time and real-device behavior before committing to production. Do not place API credentials in the website; generation, if approved, must run in a controlled environment.

Illustrative cost: local text inventory is 8,668 characters in 154 segments (49 listening questions; includes spoken option labels). At Google Cloud's published Neural2 rate of US$16 per million characters after the free allowance, one generation is approximately US$0.139 before any free allowance, taxes, markup or retries. The listed Neural2 allowance is 1 million characters/month, subject to provider terms and enabled billing. Standard voices are US$4 per million after their allowance, roughly US$0.035 for the same text. This is a rough text-only estimate, not a quote: alternate voices, multiple revisions, SSML, network/storage, taxes and provider policy can change costs. [Google Cloud pricing](https://cloud.google.com/text-to-speech/pricing). Nothing was generated, purchased, configured or uploaded.
