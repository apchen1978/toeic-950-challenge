"""Record listening-lesson audio with Microsoft Edge neural voices (edge-tts; no ffmpeg needed: edge-tts already returns 24 kHz 48 kbps MP3).
Usage: python scripts/generate-lesson-audio.py <repo root> <lessons.json>   (items: id, code US/UK/CA/AU, voice M/W, transcript)
Needs edge-tts under ~/.codex/tools/toeic-edge-tts."""
import asyncio, json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(os.environ['USERPROFILE']) / '.codex' / 'tools' / 'toeic-edge-tts'))
import edge_tts
VOICES = {"US": {"M": "en-US-GuyNeural", "W": "en-US-AriaNeural"}, "UK": {"M": "en-GB-RyanNeural", "W": "en-GB-SoniaNeural"},
          "CA": {"M": "en-CA-LiamNeural", "W": "en-CA-ClaraNeural"}, "AU": {"M": "en-AU-WilliamNeural", "W": "en-AU-NatashaNeural"}}
async def record(item):
    out = b""
    async for chunk in edge_tts.Communicate(item["transcript"], VOICES[item["code"]][item["voice"]], rate="-8%").stream():
        if chunk["type"] == "audio": out += chunk["data"]
    return out
async def one(root, item):
    out = b""
    for attempt in range(5):
        try:
            out = await record(item)
            break
        except Exception as error:
            print("retry", item["id"], attempt + 1, type(error).__name__, flush=True)
            await asyncio.sleep(3 * (attempt + 1))
    if len(out) < 5000: raise RuntimeError("audio too short for " + item["id"])
    (root / "codex/audio" / f"lesson-{item['id']}.mp3").write_bytes(out)
    print("wrote", item["id"], len(out), "bytes", round(len(out) * 8 / 48000, 1), "s", flush=True)
async def main():
    root = Path(sys.argv[1]); items = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    for item in items: await one(root, item)
asyncio.run(main())
