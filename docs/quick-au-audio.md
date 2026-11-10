# Australian quick-test audio

`codex/audio/quick-au-g-airport-talk-d.mp3` was synthesized from the unchanged `g-airport-talk-d`
script in `codex/data/questions.json`. Its canonical script SHA-256 is
`ec1021f2e695bbd6f4ce2bdc2ff28de120b941ee68c75087f0ea2bf9dd43cdc2`.
The female speaker is Kirsty Leishman, speaker 8. The user confirmed a separate sample of this voice is clear; the full question recording still needs a listening check.

Audio generated using **en_AU-librivox-medium** by DataCraftsmanAustralia,
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium/tree/7f35faf19fe1789ece4b14233448f7c04e35a84f
The model is fine-tuned from `en_GB-jenny_dioco-medium`, derived from the Jenny
TTS dataset by **Jenny (Dioco)**. Training audio was recorded by LibriVox
volunteers. See the model author's full [attribution and provenance](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium/blob/7f35faf19fe1789ece4b14233448f7c04e35a84f/ATTRIBUTION.md).

The model author reports that speech may sound formal, that the training
recordings vary in quality, and that numerals and abbreviations can be weak.
Generated speech should be listened to before release; script matching does
not guarantee every word is pronounced correctly.

To reproduce on Windows, place the `en_AU-librivox-medium.onnx` and its
`.onnx.json` from the pinned revision above under
`%USERPROFILE%\.codex\tools\toeic-piper-au`. Install `piper-tts==1.8.0`
in a Python virtual environment there, and install `lameenc` under
`%USERPROFILE%\.codex\tools\toeic-audio-encoder`. From the repository root:

```powershell
& "$env:USERPROFILE\.codex\tools\toeic-piper-au\venv\Scripts\python.exe" scripts\generate-quick-au.py
```

The script reads the exact current bank text, synthesizes it locally, and
encodes mono 22,050 Hz, 48 kbps MP3. It prints the script checksum and duration.
