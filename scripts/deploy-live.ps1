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

$powerShell7Command = Get-Command pwsh -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
$powerShell7 = $powerShell7Command.Source
if (-not $powerShell7) {
  throw "PowerShell 7 (pwsh) is required for reliable release preparation. Install PowerShell 7, then rerun this helper."
}

if ($PrepareOnly -and $PushOnly) {
  throw "Use only one of -PrepareOnly or -PushOnly."
}

$prepareScript = Join-Path $PSScriptRoot "prepare-release.ps1"
$pushScript = Join-Path $PSScriptRoot "push-live.ps1"

function Invoke-PrepareRelease {
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $prepareScript,
    "-Version",
    $Version,
    "-BaselineRef",
    $BaselineRef
  )
  if ($AllowDirty) {
    $arguments += "-AllowDirty"
  }
  # Send child output to the host, not the function pipeline. The caller
  # must receive only the numeric process exit code.
  & $powerShell7 @arguments | Out-Host
  $exitCode = $LASTEXITCODE
  return $exitCode
}

if (-not (Test-Path -LiteralPath $prepareScript)) {
  throw "Missing prepare script: $prepareScript"
}
if (-not (Test-Path -LiteralPath $pushScript)) {
  throw "Missing push script: $pushScript"
}

if ($PrepareOnly) {
  exit (Invoke-PrepareRelease)
}

if ($PushOnly) {
  & $powerShell7 -NoProfile -ExecutionPolicy Bypass -File $pushScript -Version $Version
  exit $LASTEXITCODE
}

$prepareExitCode = Invoke-PrepareRelease
if ($prepareExitCode -ne 0) {
  exit $prepareExitCode
}

& $powerShell7 -NoProfile -ExecutionPolicy Bypass -File $pushScript -Version $Version
exit $LASTEXITCODE
