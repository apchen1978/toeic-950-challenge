"""Build the four-accent listening bank with Microsoft Edge neural voices.

One accent per group, alternating US / UK / CA / AU inside each part.
Part 3 uses two voices (male and female) of that accent. Part 2 uses a
different voice for the question and the responses. Output is mono
24 kHz, 48 kbps MP3. Re-running skips a group whose finished file matches
the saved plan in /tmp/toeic-accent-ok.
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
BANK_PATH = ROOT / "codex/data/questions.json"
AUDIO_DIR = ROOT / "codex/audio"
MANIFEST_PATH = AUDIO_DIR / "manifest.json"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
CACHE_DIR = Path(tempfile.gettempdir()) / "toeic-accent-lines"
DONE_DIR = Path(tempfile.gettempdir()) / "toeic-accent-ok"
ACCENTS = ["US", "UK", "CA", "AU"]
VOICES = {
    "US": {"locale": "en-US", "M": "en-US-GuyNeural", "W": "en-US-AriaNeural"},
    "UK": {"locale": "en-GB", "M": "en-GB-RyanNeural", "W": "en-GB-SoniaNeural"},
    "CA": {"locale": "en-CA", "M": "en-CA-LiamNeural", "W": "en-CA-ClaraNeural"},
    "AU": {"locale": "en-AU", "M": "en-AU-WilliamNeural", "W": "en-AU-NatashaNeural"},
}
LETTERS = ["A", "B", "C", "D"]
# Part 4 talks had no internal gaps, so an -8% rate brings them from about 163 wpm to about 150.
# Part 3 was already near 150, so it keeps the original speaking rate and only gains 650 ms turn gaps.
RATE = "-8%"
TURN_GAP = 0.65


def speech_rate(part):
    return "+0%" if part == 3 else RATE
LETTER_GAP = 0.2


def quotas(total):
    base, extra = divmod(total, 4)
    return {accent: base + (1 if index < extra else 0) for index, accent in enumerate(ACCENTS)}


def assign(groups):
    total = sum(len(group["questions"]) for group in groups)
    quota = quotas(total)
    used = {accent: 0 for accent in ACCENTS}
    previous = None
    plan = []
    for group in groups:
        count = len(group["questions"])

        def fits(accent):
            return used[accent] + count <= quota[accent]

        options = [accent for accent in ACCENTS if accent != previous and fits(accent)]
        if not options:
            options = [accent for accent in ACCENTS if fits(accent)]
        if not options:
            options = [accent for accent in ACCENTS if accent != previous] or ACCENTS[:]
        choice = min(options, key=lambda accent: (used[accent], ACCENTS.index(accent)))
        used[choice] += count
        previous = choice
        plan.append(choice)
    return plan, used, quota


def longest_run(plan):
    best = run = 1
    for index in range(1, len(plan)):
        run = run + 1 if plan[index] == plan[index - 1] else 1
        best = max(best, run)
    return best


def voice_for(accent, gender):
    return VOICES[accent][gender], VOICES[accent]["locale"]


def clips_for(group, accent, index):
    """Return spoken pieces: text, role, voice, locale, gap before the next piece."""
    part = group["part"]
    if part == 1:
        gender = "W" if index % 2 == 0 else "M"
        voice, locale = voice_for(accent, gender)
        pieces = [{"text": line["text"], "role": "N", "voice": voice, "locale": locale, "gap": TURN_GAP, "rate": speech_rate(part)} for line in group["script"]]
        for option_index, option in enumerate(group["questions"][0]["options"]):
            pieces.append({"text": f"{LETTERS[option_index]}.", "role": "N", "voice": voice, "locale": locale, "gap": LETTER_GAP, "rate": speech_rate(part)})
            pieces.append({"text": option, "role": "N", "voice": voice, "locale": locale, "gap": TURN_GAP, "rate": speech_rate(part)})
        return pieces
    if part == 2:
        speaker = group["script"][0]["speaker"]
        question_gender = speaker if speaker in ("M", "W") else "W"
        response_gender = "M" if question_gender == "W" else "W"
        question_voice, locale = voice_for(accent, question_gender)
        response_voice, _ = voice_for(accent, response_gender)
        pieces = [{"text": line["text"], "role": line["speaker"], "voice": question_voice, "locale": locale, "gap": TURN_GAP, "rate": speech_rate(part)} for line in group["script"]]
        for option_index, option in enumerate(group["questions"][0]["options"]):
            pieces.append({"text": f"{LETTERS[option_index]}.", "role": response_gender, "voice": response_voice, "locale": locale, "gap": LETTER_GAP, "rate": speech_rate(part)})
            pieces.append({"text": option, "role": response_gender, "voice": response_voice, "locale": locale, "gap": TURN_GAP, "rate": speech_rate(part)})
        return pieces
    pieces = []
    for line in group["script"]:
        speaker = line["speaker"]
        if speaker == "N":
            speaker = "W" if index % 2 == 0 else "M"
            role = "N"
        else:
            role = speaker
        voice, locale = voice_for(accent, speaker if speaker in ("M", "W") else "W")
        pieces.append({"text": line["text"], "role": role, "voice": voice, "locale": locale, "gap": TURN_GAP, "rate": speech_rate(part)})
    return pieces


def question_clip(group, question, accent):
    voice, locale = voice_for(accent, "W")
    return {
        "id": question["id"],
        "text": question["prompt"],
        "role": "N",
        "voice": voice,
        "locale": locale,
        "rate": speech_rate(group["part"]),
        "graphic": bool(group.get("image")),
        "file": f"audio/q-{question['id']}.mp3",
    }


def script_sha256(script):
    raw = json.dumps(script, ensure_ascii=False, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def plan_signature(pieces):
    raw = json.dumps(
        [{"t": piece["text"], "v": piece["voice"], "g": piece.get("gap"), "r": piece.get("rate", RATE)} for piece in pieces],
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode()
    return hashlib.sha256(raw).hexdigest()


async def synthesize(text, voice, dest, rate=RATE):
    dest.parent.mkdir(parents=True, exist_ok=True)
    last = "no attempt"
    partial = dest.with_suffix(f".{voice}.part.mp3")
    for attempt in range(5):
        try:
            if partial.exists():
                partial.unlink()
            await asyncio.wait_for(edge_tts.Communicate(text, voice, rate=rate).save(str(partial)), 90)
            if partial.stat().st_size > 300:
                partial.replace(dest)
                return
            last = f"short file {partial.stat().st_size}"
        except Exception as error:
            last = str(error)
        await asyncio.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"{voice}: {last}: {text[:80]}")


def pcm_bytes(mp3_path):
    wav_path = mp3_path.with_name(f"{mp3_path.stem}-{os.getpid()}-{id(mp3_path)}.wav")
    subprocess.run(
        [FFMPEG, "-y", "-v", "error", "-i", str(mp3_path), "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(wav_path)],
        check=True,
    )
    try:
        with wave.open(str(wav_path), "rb") as source:
            if source.getframerate() != 24000 or source.getnchannels() != 1 or source.getsampwidth() != 2:
                raise RuntimeError(f"unexpected wav format for {mp3_path}")
            return source.readframes(source.getnframes())
    finally:
        wav_path.unlink(missing_ok=True)


def write_mp3(pieces_pcm, gaps, dest):
    silence = {gap: b"\x00\x00" * int(24000 * gap) for gap in set(gaps)}
    pcm = bytearray()
    for index, chunk in enumerate(pieces_pcm):
        pcm.extend(chunk)
        if index < len(pieces_pcm) - 1:
            pcm.extend(silence[gaps[index]])
    wav_path = dest.with_suffix(".wav")
    with wave.open(str(wav_path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(24000)
        target.writeframes(pcm)
    subprocess.run(
        [FFMPEG, "-y", "-v", "error", "-i", str(wav_path), "-c:a", "libmp3lame", "-b:a", "48k", "-ar", "24000", "-ac", "1", str(dest)],
        check=True,
    )
    wav_path.unlink(missing_ok=True)
    return round(len(pcm) / 2 / 24000, 2)


def insert_accent(group, accent):
    ordered = {}
    for key, value in group.items():
        if key == "accent":
            continue
        ordered[key] = value
        if key == "part":
            ordered["accent"] = accent
    group.clear()
    group.update(ordered)


def unique_voices(pieces):
    seen = []
    for piece in pieces:
        item = {"role": piece["role"], "voice": piece["voice"], "locale": piece["locale"]}
        if item not in seen:
            seen.append(item)
    return seen


LINE_LOCKS = {}


def line_lock(key):
    if key not in LINE_LOCKS:
        LINE_LOCKS[key] = asyncio.Lock()
    return LINE_LOCKS[key]


async def build_question_clip(clip, semaphore):
    dest = AUDIO_DIR / Path(clip["file"]).name
    key = hashlib.sha256(f"{clip['rate']}\n{clip['voice']}\n{clip['text']}".encode()).hexdigest()
    line_mp3 = CACHE_DIR / f"{key}.mp3"
    async with line_lock(key):
        if not line_mp3.exists() or line_mp3.stat().st_size < 300:
            async with semaphore:
                await synthesize(clip["text"], clip["voice"], line_mp3, clip["rate"])
    pcm = await asyncio.to_thread(pcm_bytes, line_mp3)
    duration = await asyncio.to_thread(write_mp3, [pcm], [], dest)
    return {
        "id": clip["id"],
        "file": clip["file"],
        "durationSec": duration,
        "bytes": dest.stat().st_size,
        "voice": clip["voice"],
        "locale": clip["locale"],
        "role": "N",
        "graphic": clip["graphic"],
    }


async def build_group(group, accent, index, semaphore):
    pieces = clips_for(group, accent, index)
    question_pieces = [{"text": question["prompt"], "voice": "question", "gap": 0} for question in group["questions"]] if group["part"] in (3, 4) else []
    signature = plan_signature(pieces + question_pieces)
    dest = AUDIO_DIR / f"{group['id']}.mp3"
    stamp_path = DONE_DIR / f"{group['id']}.json"
    if stamp_path.exists() and dest.exists():
        stamp = json.loads(stamp_path.read_text(encoding="utf-8"))
        if stamp.get("signature") == signature and dest.stat().st_size == stamp.get("bytes"):
            print(f"keep {group['id']} {accent}", flush=True)
            return stamp["entry"]
    pcm_parts = []
    for piece in pieces:
        key = hashlib.sha256(f"{piece.get('rate', RATE)}\n{piece['voice']}\n{piece['text']}".encode()).hexdigest()
        line_mp3 = CACHE_DIR / f"{key}.mp3"
        async with line_lock(key):
            if not line_mp3.exists() or line_mp3.stat().st_size < 300:
                async with semaphore:
                    await synthesize(piece["text"], piece["voice"], line_mp3, piece.get("rate", RATE))
        pcm_parts.append(await asyncio.to_thread(pcm_bytes, line_mp3))
    duration = await asyncio.to_thread(write_mp3, pcm_parts, [piece["gap"] for piece in pieces], dest)
    question_clips = []
    if group["part"] in (3, 4):
        for question in group["questions"]:
            clip = question_clip(group, question, accent)
            question_clips.append(await build_question_clip(clip, semaphore))
    entry = {
        "file": f"audio/{group['id']}.mp3",
        "accent": accent,
        "locale": VOICES[accent]["locale"],
        "scriptSha256": script_sha256(group["script"]),
        "spokenChoices": [piece["text"] for piece in pieces[len(group["script"]):]] if group["part"] in (1, 2) else [],
        "voices": unique_voices(pieces),
        "roles": [line["speaker"] for line in group["script"]],
        "durationSec": duration,
        "bytes": dest.stat().st_size,
        "questionClips": question_clips,
    }
    stamp_path.write_text(json.dumps({"signature": signature, "bytes": entry["bytes"], "entry": entry}, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {group['id']} {accent} {entry['bytes']} bytes {duration}s", flush=True)
    return entry


def check_plan(bank):
    overall = {accent: 0 for accent in ACCENTS}
    for part in (1, 2, 3, 4):
        groups = [group for group in bank["groups"] if group["section"] == "listening" and group["part"] == part]
        plan, used, quota = assign(groups)
        print(f"part {part} quota {quota} used {used} longest run {longest_run(plan)}")
        for accent, count in used.items():
            share = count / sum(used.values())
            if not 0.20 <= share <= 0.30:
                raise SystemExit(f"part {part} {accent} share {share:.3f} is outside 20-30%")
            overall[accent] += count
        if longest_run(plan) > 1:
            raise SystemExit(f"part {part} has a repeated accent run")
    total = sum(overall.values())
    print("overall", overall, {accent: round(count / total, 3) for accent, count in overall.items()})
    for accent, count in overall.items():
        share = count / total
        if not 0.20 <= share <= 0.30:
            raise SystemExit(f"overall {accent} share {share:.3f} is outside 20-30%")


async def main():
    bank = json.loads(BANK_PATH.read_text(encoding="utf-8"))
    check_plan(bank)
    if "--plan-only" in sys.argv:
        return
    parts_arg = next((arg.split("=", 1)[1] for arg in sys.argv[1:] if arg.startswith("--parts=")), None)
    ids_arg = next((arg.split("=", 1)[1] for arg in sys.argv[1:] if arg.startswith("--ids=")), None)
    only_ids = set(ids_arg.split(",")) if ids_arg else None
    selected_parts = {int(part) for part in parts_arg.split(",")} if parts_arg else {1, 2, 3, 4}
    if not selected_parts or not selected_parts.issubset({1, 2, 3, 4}):
        raise SystemExit("--parts must contain one or more of 1,2,3,4")
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DONE_DIR.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(6)
    jobs = []
    existing = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries_by_id = existing["groups"]
    for part in sorted(selected_parts):
        groups = [group for group in bank["groups"] if group["section"] == "listening" and group["part"] == part]
        plan, _, _ = assign(groups)
        for index, (group, accent) in enumerate(zip(groups, plan)):
            if only_ids is not None and group["id"] not in only_ids:
                continue
            if group.get("accent") not in (None, accent):
                raise SystemExit(f"refusing to change saved accent for {group['id']}: {group['accent']} != {accent}")
            jobs.append(build_group(group, accent, index, semaphore))
    entries = await asyncio.gather(*jobs)
    entries_by_id.update({entry["file"].split("/")[-1][:-4]: entry for entry in entries})
    for part in (1, 2):
        groups = [group for group in bank["groups"] if group["section"] == "listening" and group["part"] == part]
        plan, _, _ = assign(groups)
        for index, (group, accent) in enumerate(zip(groups, plan)):
            entry = entries_by_id[group["id"]]
            pieces = clips_for(group, accent, index)
            entry["spokenChoices"] = [piece["text"] for piece in pieces[len(group["script"]):]]
    manifest = {
        "version": 4,
        "format": "MP3 mono, 24,000 Hz, 48 kbps",
        "gapMs": int(TURN_GAP * 1000),
        "rate": "Part 4 and Parts 1–2 at -8%; Part 3 speaking rate unchanged, with 650 ms turn gaps",
        "engine": "edge-tts",
        "note": "Microsoft Edge neural voices at a slower official pace. Canadian clips use en-CA voices, not a relabelled US voice. Part 3 and Part 4 question prompts are separate narrator clips.",
        "voices": VOICES,
        "groups": entries_by_id,
    }
    # Preserve bank order in the manifest.
    ordered = {}
    for group in bank["groups"]:
        if group["id"] in manifest["groups"]:
            ordered[group["id"]] = manifest["groups"][group["id"]]
    manifest["groups"] = ordered
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for retired in ("quick-au-g-airport-talk-d.mp3", "quick-gb-s03-talk2.mp3"):
        path = AUDIO_DIR / retired
        if path.exists():
            path.unlink()
            print("removed", retired)
    total = sum(entry["bytes"] for entry in ordered.values())
    print(f"groups {len(ordered)} mp3 bytes {total}")


if __name__ == "__main__":
    asyncio.run(main())
