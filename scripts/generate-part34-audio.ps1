# Rebuild fixed-voice Part 3/4 audio from the current original question bank.
# Requires Windows SAPI voices Microsoft David Desktop and Microsoft Zira Desktop,
# Python 3.12, and lameenc installed under .codex/tools/toeic-audio-encoder.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$bankPath = Join-Path $repoRoot 'codex\data\questions.json'
$audioDir = Join-Path $repoRoot 'codex\audio'
$workDir = Join-Path $env:USERPROFILE '.codex\tools\toeic-audio-temp\part34'
$encoderDir = Join-Path $env:USERPROFILE '.codex\tools\toeic-audio-encoder'

if (-not (Get-ChildItem -LiteralPath $encoderDir -Filter 'lameenc*.pyd' -ErrorAction SilentlyContinue)) {
  throw "Install lameenc outside the repository: python -m pip install --target $encoderDir lameenc"
}
New-Item -ItemType Directory -Force -Path $workDir, $audioDir | Out-Null
$snapshot = Join-Path $workDir 'questions-snapshot.json'
Copy-Item -LiteralPath $bankPath -Destination $snapshot -Force
$bank = Get-Content -LiteralPath $snapshot -Raw -Encoding UTF8 | ConvertFrom-Json
$voice = New-Object -ComObject SAPI.SpVoice
$available = @($voice.GetVoices())
$david = $available | Where-Object { $_.GetDescription() -like '*Microsoft David Desktop*' } | Select-Object -First 1
$zira = $available | Where-Object { $_.GetDescription() -like '*Microsoft Zira Desktop*' } | Select-Object -First 1
if (-not $david -or -not $zira) { throw 'Required SAPI voices David and Zira are unavailable.' }

$groups = @($bank.groups | Where-Object { $_.part -in @(3, 4) })
foreach ($group in $groups) {
  if ($group.id -notmatch '^[a-zA-Z0-9-]+$') { throw "Unsafe group ID: $($group.id)" }
  for ($i = 0; $i -lt $group.script.Count; $i++) {
    $line = $group.script[$i]
    if ($line.speaker -notin @('M', 'W', 'N')) { throw "Unsupported speaker role: $($group.id) $($line.speaker)" }
    $voice.Voice = if ($line.speaker -eq 'W') { $zira } else { $david }
    $stream = New-Object -ComObject SAPI.SpFileStream
    $wavPath = Join-Path $workDir ('{0}-line-{1:D3}.wav' -f $group.id, $i)
    $stream.Open($wavPath, 3)
    try {
      $voice.AudioOutputStream = $stream
      $null = $voice.Speak([string]$line.text)
    } finally {
      $stream.Close()
    }
  }
}

python (Join-Path $PSScriptRoot 'encode-part34-audio.py') $snapshot $workDir $audioDir $encoderDir
if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed with code $LASTEXITCODE" }
