param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [string]$Domain = "https://espgym.com",

  [string[]]$ConcurrencyLevels = @("1", "5", "10", "25"),

  [int]$RepetitionsPerStage = 2
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$puttySession = "DG Putty Settings"
$nodeScriptPath = Join-Path $PSScriptRoot "measure-launcher-http.js"
$resultsRoot = "C:\xampp\telepathyexperiment_private\cones\profiling\launcher-path"
$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runRoot = Join-Path $resultsRoot $runStamp
$configRoot = Join-Path $runRoot "configs"
$rawRoot = Join-Path $runRoot "raw"
$summaryPath = Join-Path $runRoot "summary.md"

function Invoke-Plink([string]$Command) {
  & $plinkPath -batch -load $puttySession $Command
}

function Assert-ToolExists([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Label at $Path"
  }
}

function New-StageSet([int[]]$Levels, [int]$Repetitions) {
  $stages = @()
  foreach ($level in $Levels) {
    $stages += @{
      concurrency = $level
      repetitions = $Repetitions
    }
  }
  return $stages
}

function Resolve-ConcurrencyLevels([string[]]$RawLevels) {
  $values = New-Object System.Collections.Generic.List[int]
  foreach ($entry in @($RawLevels)) {
    foreach ($segment in (([string]$entry) -split '[,\s]+' | Where-Object { $_ -ne '' })) {
      $parsed = 0
      if (-not [int]::TryParse($segment, [ref]$parsed)) {
        throw "Invalid concurrency level: $segment"
      }
      if ($parsed -le 0) {
        throw "Concurrency level must be positive: $segment"
      }
      $values.Add($parsed)
    }
  }
  return @($values.ToArray() | Sort-Object -Unique)
}

function Get-RemoteSnapshot([string]$Label) {
  $remoteCommand = @"
echo "=== $Label ==="
date -Iseconds
echo "-- uptime --"
uptime
echo "-- memory_mb --"
free -m
echo "-- vmstat --"
vmstat 1 2 | tail -n 1
echo "-- top_cpu --"
ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 8
echo "-- http_established --"
ss -tan state established '( sport = :80 or sport = :443 )' | tail -n +2 | wc -l
echo "-- localhost_direct_launcher --"
curl -sS -o /dev/null -L -H 'Host: espgym.com' -w 'code=%{http_code} redirects=%{num_redirects} ttfb=%{time_starttransfer} total=%{time_total}`n' 'http://127.0.0.1/telepathybeginner.html?v=$Version&open=launcher'
echo "-- localhost_root --"
curl -sS -o /dev/null -L -H 'Host: espgym.com' -w 'code=%{http_code} redirects=%{num_redirects} ttfb=%{time_starttransfer} total=%{time_total}`n' 'http://127.0.0.1/'
"@
  return (Invoke-Plink $remoteCommand) -join "`n"
}

function Invoke-LauncherMeasure([string]$Label, [string]$Url) {
  $config = @{
    label = $Label
    url = $Url
    stages = @(New-StageSet -Levels $resolvedConcurrencyLevels -Repetitions $RepetitionsPerStage)
  }
  $configPath = Join-Path $configRoot ($Label + ".json")
  $outputPath = Join-Path $rawRoot ($Label + ".json")
  $config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $configPath -Encoding UTF8
  $output = & node $nodeScriptPath $configPath
  $output | Set-Content -LiteralPath $outputPath -Encoding UTF8
  return Get-Content -LiteralPath $outputPath -Raw -Encoding UTF8 | ConvertFrom-Json
}

Assert-ToolExists $plinkPath "plink"
Assert-ToolExists $nodeScriptPath "HTTP measurement script"

$resolvedConcurrencyLevels = Resolve-ConcurrencyLevels -RawLevels $ConcurrencyLevels

New-Item -ItemType Directory -Force -Path $configRoot | Out-Null
New-Item -ItemType Directory -Force -Path $rawRoot | Out-Null

$rootUrl = "$Domain/"
$directLauncherUrl = "$Domain/telepathybeginner.html?v=$Version&open=launcher"

$preSnapshot = Get-RemoteSnapshot -Label "before"
$rootResult = Invoke-LauncherMeasure -Label "root-launcher" -Url $rootUrl
$midSnapshot = Get-RemoteSnapshot -Label "between-root-and-direct"
$directResult = Invoke-LauncherMeasure -Label "direct-launcher" -Url $directLauncherUrl
$postSnapshot = Get-RemoteSnapshot -Label "after"

$preSnapshot | Set-Content -LiteralPath (Join-Path $rawRoot "remote-before.txt") -Encoding UTF8
$midSnapshot | Set-Content -LiteralPath (Join-Path $rawRoot "remote-between.txt") -Encoding UTF8
$postSnapshot | Set-Content -LiteralPath (Join-Path $rawRoot "remote-after.txt") -Encoding UTF8

$summaryLines = @(
  '# Launcher Path Profiling',
  '',
  "- Run stamp: $runStamp",
  "- Version: $Version",
  "- Domain: $Domain",
  "- Repetitions per stage: $RepetitionsPerStage",
  "- Concurrency levels: $($resolvedConcurrencyLevels -join ', ')",
  '',
  '## Root URL',
  '',
  '```json',
  (($rootResult | ConvertTo-Json -Depth 8)),
  '```',
  '',
  '## Direct Launcher URL',
  '',
  '```json',
  (($directResult | ConvertTo-Json -Depth 8)),
  '```',
  '',
  '## Remote Snapshots',
  '',
  '- Before: `raw\remote-before.txt`',
  '- Between: `raw\remote-between.txt`',
  '- After: `raw\remote-after.txt`',
  '',
  '## Raw Artifacts',
  '',
  '- Root result: `raw\root-launcher.json`',
  '- Direct result: `raw\direct-launcher.json`',
  '- Configs: `configs\`'
)

$summaryLines | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "Launcher profiling complete." -ForegroundColor Green
Write-Host "Summary: $summaryPath" -ForegroundColor Cyan
