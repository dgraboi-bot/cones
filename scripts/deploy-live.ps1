param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [string]$BaselineRef = "origin/main",

  [switch]$AllowDirty,

  [switch]$PrepareOnly,

  [switch]$PushOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($PrepareOnly -and $PushOnly) {
  throw "Use only one of -PrepareOnly or -PushOnly."
}

$prepareScript = Join-Path $PSScriptRoot "prepare-release.ps1"
$pushScript = Join-Path $PSScriptRoot "push-live.ps1"

if (-not (Test-Path -LiteralPath $prepareScript)) {
  throw "Missing prepare script: $prepareScript"
}
if (-not (Test-Path -LiteralPath $pushScript)) {
  throw "Missing push script: $pushScript"
}

if ($PrepareOnly) {
  & powershell -ExecutionPolicy Bypass -File $prepareScript -Version $Version -BaselineRef $BaselineRef -AllowDirty:$AllowDirty
  exit $LASTEXITCODE
}

if ($PushOnly) {
  & powershell -ExecutionPolicy Bypass -File $pushScript -Version $Version
  exit $LASTEXITCODE
}

& powershell -ExecutionPolicy Bypass -File $prepareScript -Version $Version -BaselineRef $BaselineRef -AllowDirty:$AllowDirty
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& powershell -ExecutionPolicy Bypass -File $pushScript -Version $Version
exit $LASTEXITCODE
