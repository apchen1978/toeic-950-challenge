"""Combine SAPI line WAVs, insert 400 ms pauses, and encode Part 3/4 MP3s."""
import hashlib
import json
import pathlib
import sys
import wave

bank_path, work_dir, output_dir, encoder_dir = map(pathlib.Path, sys.argv[1:5])
sys.path.insert(0, str(encoder_dir))
import lameenc  # noqa: E402 - encoder is deliberately installed outside the repository

bank = json.loads(bank_path.read_text(encoding="utf-8"))
output_dir.mkdir(parents=True, exist_ok=True)
manifest = {
    "version": 1,
    "format": "MP3 mono, 22,050 Hz, 48 kbps",
    "gapMs": 400,
    "voices": {"M": "Microsoft David Desktop", "W": "Microsoft Zira Desktop", "N": "Microsoft David Desktop"},
    "groups": {},
}

for group in bank["groups"]:
    if group["part"] not in (3, 4):
        continue
    pcm = bytearray()
    rate = None
    for index, line in enumerate(group["script"]):
        wav_path = work_dir / f'{group["id"]}-line-{index:03d}.wav'
        with wave.open(str(wav_path), "rb") as sound:
            if sound.getnchannels() != 1 or sound.getsampwidth() != 2 or sound.getcomptype() != "NONE":
                raise ValueError(f"Unexpected PCM format in {wav_path}")
            if rate is None:
                rate = sound.getframerate()
            elif rate != sound.getframerate():
                raise ValueError(f"Mismatched sample rate in {wav_path}")
            if index:
                pcm.extend(b"\x00\x00" * round(rate * 0.4))
            pcm.extend(sound.readframes(sound.getnframes()))

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(48)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    encoded = encoder.encode(bytes(pcm)) + encoder.flush()
    if len(encoded) < 1000:
        raise ValueError(f'Encoded audio too short for {group["id"]}')
    file_name = f'{group["id"]}.mp3'
    (output_dir / file_name).write_bytes(encoded)
    script_bytes = json.dumps(group["script"], ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    manifest["groups"][group["id"]] = {
        "file": f"audio/{file_name}",
        "scriptSha256": hashlib.sha256(script_bytes).hexdigest(),
        "roles": [line["speaker"] for line in group["script"]],
        "durationSec": round(len(pcm) / 2 / rate, 2),
        "bytes": len(encoded),
    }

(output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f'Encoded {len(manifest["groups"])} groups, {sum(x["bytes"] for x in manifest["groups"].values())} MP3 bytes')
