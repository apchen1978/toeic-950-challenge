# Listening accent recordings

The practice audio in `codex/audio/` is synthesized for this site. It is not an ETS recording and it is not an official TOEIC exam.

Playback uses the MP3 files in this repository. The page does not call a speech service, Google, or any other CDN when a clip is played. Browser speech synthesis remains only as a fallback if a file fails to load.

## Voices

Clips were generated with `scripts/generate-accent-audio.py` and the `edge-tts` library using Microsoft Edge neural voices, then encoded as mono MP3 at 24,000 Hz and 48 kbps.

| Accent | Locale | Female | Male |
|---|---|---|---|
| US | en-US | en-US-AriaNeural | en-US-GuyNeural |
| UK | en-GB | en-GB-SoniaNeural | en-GB-RyanNeural |
| CA | en-CA | en-CA-ClaraNeural | en-CA-LiamNeural |
| AU | en-AU | en-AU-NatashaNeural | en-AU-WilliamNeural |

Canadian items use the en-CA voices above. They are not American voices with a Canadian label. Each question group has one accent. Inside a Part, accents alternate so the same accent does not play twice in a row. Part 3 uses the female and male voice of that accent. Part 2 uses one voice for the question and the other for the three responses; each response is introduced by its letter in that response voice. Part 1 speaks the photograph cue and the four statements, including the letters A–D, in one narrator voice.

The `edge-tts` program is MIT licensed. The neural voices are Microsoft Edge voices. No learner name, account, or other personal data is stored in the audio or the manifest.

## Earlier clips

The previous Part 3 and Part 4 files used Microsoft David and Zira desktop voices. Two quick-practice alternates used Piper voices (Cori Samuel for British English and Kirsty Leishman for Australian English). Those files were replaced by the four-accent set. The older credit notes in `TOEIC_AUDIO_UK_CREDITS.md` and `quick-au-audio.md` describe the retired Piper clips.
