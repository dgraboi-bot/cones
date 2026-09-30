param(
  [string]$ConfigPath = "",
  [string]$Version = "",
  [string]$Domain = "https://espgym.com"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeScriptPath = Join-Path $PSScriptRoot "mixed-load-runner.js"
$defaultConfigPath = Join-Path $PSScriptRoot "mixed-load-config.json"
$resultsRoot = "C:\xampp\telepathyexperiment_private\cones\profiling\mixed-load"
$profilingRetentionCount = 20
$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runRoot = Join-Path $resultsRoot $runStamp

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = $defaultConfigPath
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Missing config file at $ConfigPath"
}

if (-not (Test-Path -LiteralPath $nodeScriptPath)) {
  throw "Missing Node runner at $nodeScriptPath"
}

function Prune-ProfilingRuns {
  $recognizedRuns = @(
    Get-ChildItem -LiteralPath $resultsRoot -Directory -Force |
      Where-Object { $_.Name -match '^(?:[A-Za-z][A-Za-z0-9._-]*-)?\d{8}-\d{6}$' } |
      Sort-Object LastWriteTime -Descending
  )
  $staleRuns = @($recognizedRuns | Select-Object -Skip $profilingRetentionCount)
  foreach ($run in $staleRuns) {
    Remove-Item -LiteralPath $run.FullName -Recurse -Force
  }
  return $staleRuns.Count
}

New-Item -ItemType Directory -Force -Path $runRoot | Out-Null
$prunedRunCount = Prune-ProfilingRuns
if ($prunedRunCount -gt 0) {
  Write-Host ("Mixed-load retention kept the newest {0} recognized runs and pruned {1}." -f $profilingRetentionCount, $prunedRunCount) -ForegroundColor DarkGreen
}

$arguments = @(
  $nodeScriptPath,
  "--config", $ConfigPath,
  "--run-root", $runRoot,
  "--domain", $Domain
)

if (-not [string]::IsNullOrWhiteSpace($Version)) {
  $arguments += @("--version", $Version)
}

Write-Host "Starting mixed load test..." -ForegroundColor Cyan
Write-Host "Config: $ConfigPath" -ForegroundColor DarkCyan
Write-Host "Run root: $runRoot" -ForegroundColor DarkCyan

& node @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Mixed load test runner failed with exit code $LASTEXITCODE"
}

Write-Host "Mixed load test complete." -ForegroundColor Green
Write-Host "Summary: $(Join-Path $runRoot 'summary.md')" -ForegroundColor Cyan
