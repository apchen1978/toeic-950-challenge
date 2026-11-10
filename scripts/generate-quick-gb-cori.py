"""Recreate one British English quick-practice recording without network or API keys.

Prerequisites: Piper TTS 1.8.0 and lameenc installed outside the repo in the
directories below, plus the en_GB-cori-medium ONNX model and config. See
docs/TOEIC_AUDIO_UK_CREDITS.md for voice and dataset attribution.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import wave

root = Path(__file__).resolve().parent.parent
tools = Path(os.environ['USERPROFILE']) / '.codex' / 'tools'
runtime = tools / 'toeic-piper-gb'
encoder = tools / 'toeic-audio-encoder'
model = tools / 'toeic-piper-gb-model' / 'en_GB-cori-medium.onnx'
work = tools / 'toeic-piper-gb-work'
work.mkdir(parents=True, exist_ok=True)
bank = json.loads((root / 'codex/data/questions.json').read_text(encoding='utf-8'))
group = next(group for group in bank['groups'] if group['id'] == 's03-talk2')
assert len(group['script']) == 1 and group['script'][0]['speaker'] == 'N'
text = group['script'][0]['text']
script_hash = hashlib.sha256(json.dumps(group['script'], ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
input_path = work / 's03-talk2.txt'
wav_path = work / 's03-talk2.wav'
input_path.write_text(text, encoding='utf-8')
env = os.environ.copy()
env['PYTHONPATH'] = str(runtime)
subprocess.run([sys.executable, '-m', 'piper', '-m', str(model), '-i', str(input_path), '-f', str(wav_path)], env=env, check=True)
sys.path.insert(0, str(encoder))
import lameenc
with wave.open(str(wav_path), 'rb') as source:
    assert source.getnchannels() == 1 and source.getsampwidth() == 2
    pcm = source.readframes(source.getnframes())
    sample_rate = source.getframerate()
    duration = len(pcm) / (2 * sample_rate)
    converter = lameenc.Encoder()
    converter.set_bit_rate(48)
    converter.set_in_sample_rate(sample_rate)
    converter.set_channels(1)
    converter.set_quality(2)
    output = converter.encode(pcm) + converter.flush()
destination = root / 'codex/audio/quick-gb-s03-talk2.mp3'
destination.write_bytes(output)
print(json.dumps({'group': group['id'], 'scriptSha256': script_hash, 'durationSec': round(duration, 2), 'bytes': len(output), 'file': str(destination)}))
