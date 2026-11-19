"""Record the g-gl-* graphic listening groups (edge-tts, no ffmpeg: MP3 pieces are appended, silences come from lameenc).
Usage: python scripts/generate-graphic-audio.py <repo root> <unused dir>. Needs edge-tts and lameenc under ~/.codex/tools."""
import asyncio, json, hashlib, os, sys
from pathlib import Path
T = Path(os.environ['USERPROFILE']) / '.codex' / 'tools'
sys.path[:0] = [str(T / 'toeic-edge-tts'), str(T / 'toeic-audio-encoder')]
import edge_tts, lameenc
ROOT = Path(sys.argv[1]); SP = Path(sys.argv[2])
AUD = ROOT / 'codex/audio'
VOICES = {"US": ("en-US", "en-US-GuyNeural", "en-US-AriaNeural"), "UK": ("en-GB", "en-GB-RyanNeural", "en-GB-SoniaNeural"),
          "CA": ("en-CA", "en-CA-LiamNeural", "en-CA-ClaraNeural"), "AU": ("en-AU", "en-AU-WilliamNeural", "en-AU-NatashaNeural")}
def silence(sec):
    e = lameenc.Encoder(); e.set_bit_rate(48); e.set_in_sample_rate(24000); e.set_channels(1); e.set_quality(2)
    return e.encode(b"\0\0" * int(24000 * sec)) + e.flush()
async def tts(text, voice, rate):
    c = edge_tts.Communicate(text, voice, rate=rate)
    out = b""
    async for ch in c.stream():
        if ch["type"] == "audio": out += ch["data"]
    if len(out) < 300: raise RuntimeError("empty audio " + text[:30])
    return out
def dur(b): return round(len(b) * 8 / 48000, 2)
async def main():
    groups = json.loads((ROOT / 'codex/data/questions.json').read_text(encoding='utf-8'))['groups']; groups = [g for g in groups if g['id'].startswith('g-gl-')]
    manifest = json.loads((AUD / 'manifest.json').read_text(encoding='utf-8'))
    for g in groups:
        loc, male, female = VOICES[g['accent']]
        rate = "+0%" if g['part'] == 3 else "-8%"
        data = b""; used = {}
        for i, line in enumerate(g['script']):
            sp = line['speaker']
            if g['part'] == 4: sp = 'W' if (len(g['id']) + i) % 2 == 0 else 'M'
            voice = female if sp == 'W' else male
            used[voice] = 1
            data += await tts(line['text'], voice, rate) + silence(0.65)
        (AUD / f"{g['id']}.mp3").write_bytes(data)
        qv = female; clips = []
        for q in g['questions']:
            b = await tts(q['prompt'], qv, rate)
            (AUD / f"q-{q['id']}.mp3").write_bytes(b)
            clips.append({"id": q['id'], "file": f"audio/q-{q['id']}.mp3", "durationSec": dur(b), "bytes": len(b), "voice": qv, "locale": loc, "role": "N", "graphic": bool(q['graphic'])})
        used[qv] = 1
        manifest['groups'][g['id']] = {
            "file": f"audio/{g['id']}.mp3", "accent": g['accent'], "locale": loc,
            "scriptSha256": hashlib.sha256(json.dumps(g['script'], ensure_ascii=False, separators=(',', ':')).encode()).hexdigest(),
            "spokenChoices": [], "voices": [{"role": ("W" if v == female else "M"), "voice": v, "locale": loc} for v in used],
            "roles": [l['speaker'] for l in g['script']], "durationSec": dur(data), "bytes": len(data), "questionClips": clips}
        print('wrote', g['id'], dur(data), flush=True)
    (AUD / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
asyncio.run(main())
