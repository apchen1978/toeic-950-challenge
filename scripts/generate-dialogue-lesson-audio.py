"""Record multi-speaker (2-3 voices) listening-lesson dialogues with edge-tts. MP3 pieces are appended and silences come from lameenc (no ffmpeg).
Usage: python scripts/generate-dialogue-lesson-audio.py <repo root> <lessons.json>   (items: id, lines [[role, text, optional gap seconds], ...]; role W1/M1/W2 or an explicit edge-tts voice name like en-AU-WilliamNeural)
Needs edge-tts and lameenc under ~/.codex/tools."""
import asyncio, json, os, sys
from pathlib import Path
tools = Path(os.environ['USERPROFILE']) / '.codex' / 'tools'
sys.path[:0] = [str(tools / 'toeic-edge-tts'), str(tools / 'toeic-audio-encoder')]
import edge_tts, lameenc
VOICES = {"W1": "en-US-AriaNeural", "M1": "en-US-GuyNeural", "W2": "en-US-JennyNeural"}
def silence(sec):
    enc = lameenc.Encoder(); enc.set_bit_rate(48); enc.set_in_sample_rate(24000); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(b"\0\0" * int(24000 * sec)) + enc.flush()
async def tts(text, voice):
    for attempt in range(5):
        try:
            out = b""
            async for chunk in edge_tts.Communicate(text, voice, rate="-4%").stream():
                if chunk["type"] == "audio": out += chunk["data"]
            if len(out) > 300: return out
        except Exception as error:
            print("retry", attempt + 1, type(error).__name__, flush=True)
        await asyncio.sleep(3 * (attempt + 1))
    raise RuntimeError("no audio for: " + text[:40])
async def main():
    root = Path(sys.argv[1]); items = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    for item in items:
        data = b""
        for line in item["lines"]:
            role, text = line[0], line[1]
            gap = silence(line[2] if len(line) > 2 else 0.55)
            data += await tts(text, VOICES.get(role, role)) + gap
        (root / "codex/audio" / f"lesson-{item['id']}.mp3").write_bytes(data)
        print("wrote", item["id"], len(data), "bytes", round(len(data) * 8 / 48000, 1), "s", flush=True)
asyncio.run(main())
