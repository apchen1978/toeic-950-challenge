# Force alphabet spelling rather than the article A or the ambiguous text "Ay".
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$workDir = Join-Path $env:USERPROFILE '.codex\tools\toeic-audio-temp'
New-Item -ItemType Directory -Force -Path $workDir | Out-Null
$wav = Join-Path $workDir 'letter-a.wav'
$mp3 = Join-Path $repoRoot 'codex\audio\letter-a.mp3'
$voice = New-Object -ComObject SAPI.SpVoice
$voice.Voice = @($voice.GetVoices()) | Where-Object { $_.GetDescription() -like '*Microsoft Zira Desktop*' } | Select-Object -First 1
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Open($wav, 3)
try { $voice.AudioOutputStream = $stream; $null = $voice.Speak('<spell>A</spell>', 8) } finally { $stream.Close() }
$encoderDir = Join-Path $env:USERPROFILE '.codex\tools\toeic-audio-encoder'
@'
import sys, wave, pathlib
sys.path.insert(0, sys.argv[3])
import lameenc
with wave.open(sys.argv[1], 'rb') as source:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(source.getframerate())
    encoder.set_channels(source.getnchannels())
    encoder.set_quality(2)
    result = encoder.encode(source.readframes(source.getnframes())) + encoder.flush()
pathlib.Path(sys.argv[2]).write_bytes(result)
print(f'Wrote {len(result)} bytes')
'@ | python - $wav $mp3 $encoderDir
if ($LASTEXITCODE -ne 0) { throw 'Letter A encoding failed' }
