"""Generate the Australian Part 4 clip using local Piper and the bank text.

Run with the Piper virtualenv Python; install lameenc in .codex/tools separately.
Model provenance and the pinned version are in docs/quick-au-audio.md.
"""
import hashlib
import json
import pathlib
import sys
import wave

from piper import PiperVoice, SynthesisConfig

root = pathlib.Path(__file__).resolve().parent.parent
tools = pathlib.Path.home() / '.codex' / 'tools'
sys.path.insert(0, str(tools / 'toeic-audio-encoder'))
import lameenc

model = tools / 'toeic-piper-au' / 'en_AU-librivox-medium.onnx'
bank = json.loads((root / 'codex/data/questions.json').read_text(encoding='utf-8'))
group = next(g for g in bank['groups'] if g['id'] == 'g-airport-talk-d')
assert group['part'] == 4 and len(group['script']) == 1 and group['script'][0]['speaker'] == 'N'
script = group['script'][0]['text']
wav_path = tools / 'toeic-piper-au' / 'quick-au-g-airport-talk-d.wav'
voice = PiperVoice.load(str(model))
with wave.open(str(wav_path), 'wb') as wav:
    voice.synthesize_wav(script, wav, SynthesisConfig(speaker_id=8))
with wave.open(str(wav_path), 'rb') as wav:
    assert wav.getnchannels() == 1 and wav.getsampwidth() == 2
    rate = wav.getframerate()
    pcm = wav.readframes(wav.getnframes())
    duration = len(pcm) / (2 * rate)
assert 15 < duration < 120 and any(pcm)
encoder = lameenc.Encoder()
encoder.set_bit_rate(48)
encoder.set_in_sample_rate(rate)
encoder.set_channels(1)
encoder.set_quality(2)
encoded = encoder.encode(pcm) + encoder.flush()
output = root / 'codex/audio/quick-au-g-airport-talk-d.mp3'
output.write_bytes(encoded)
canonical = json.dumps(group['script'], ensure_ascii=False, separators=(',', ':')).encode('utf-8')
print(f'script SHA-256: {hashlib.sha256(canonical).hexdigest()}')
print(f'duration: {duration:.2f}s; sample rate: {rate}; MP3: {len(encoded)} bytes')
