param(
  [string]$LocalPrivateRoot = "C:\xampp\telepathyexperiment_private\cones",
  [string]$RemotePrivateRoot = "/var/www/telepathyexperiment_private/cones",
  [string]$PuttySession = "DG Putty Settings",
  [string]$BackupRoot = "C:\xampp\telepathyexperiment_private\private-backups",
  [switch]$AuditOnly,
  [switch]$RequirePairCountMatch,
  [switch]$IncludeLogs
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$exportBackupScript = Join-Path $scriptRoot "export-private-operational-backup.ps1"
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"

function Assert-PathExists([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Label at $Path"
  }
}

function Invoke-PlinkJson([string]$Command) {
  $output = & $plinkPath -batch -load $PuttySession $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Remote command failed."
  }
  return (@($output) -join "`n")
}

function Get-RemoteRuntimeManifest() {
  $command = @"
python3 - <<'PY'
import json, os
root = r'''$RemotePrivateRoot'''
pairs_dir = os.path.join(root, "pairs")
data_path = os.path.join(root, "data", "session-state.json")
pairs = []
if os.path.isdir(pairs_dir):
    for name in sorted(os.listdir(pairs_dir)):
        path = os.path.join(pairs_dir, name)
        if os.path.isfile(path):
            pairs.append({
                "name": name,
                "bytes": os.path.getsize(path)
            })
manifest = {
    "pairs": pairs,
    "pair_count": len(pairs),
    "session_state_exists": os.path.isfile(data_path),
    "session_state_bytes": os.path.getsize(data_path) if os.path.isfile(data_path) else 0
}
print(json.dumps(manifest))
PY
"@
  $json = Invoke-PlinkJson $command
  if (-not $json.Trim()) {
    throw "Empty remote runtime manifest."
  }
  return $json | ConvertFrom-Json
}

function Get-LocalRuntimeManifest([string]$PrivateRoot) {
  $pairsDir = Join-Path $PrivateRoot "pairs"
  $dataPath = Join-Path $PrivateRoot "data\session-state.json"
  $pairs = @()
  if (Test-Path -LiteralPath $pairsDir) {
    $pairs = Get-ChildItem -LiteralPath $pairsDir -File | Sort-Object Name | ForEach-Object {
      [pscustomobject]@{
        name = $_.Name
        bytes = [int64]$_.Length
      }
    }
  }
  return [pscustomobject]@{
    pairs = $pairs
    pair_count = @($pairs).Count
    session_state_exists = Test-Path -LiteralPath $dataPath
    session_state_bytes = if (Test-Path -LiteralPath $dataPath) { [int64](Get-Item -LiteralPath $dataPath).Length } else { 0 }
  }
}

function Compare-NameSets([object[]]$Left, [object[]]$Right) {
  $leftNames = @($Left | ForEach-Object { [string]$_.name } | Sort-Object)
  $rightNames = @($Right | ForEach-Object { [string]$_.name } | Sort-Object)
  $leftOnly = @($leftNames | Where-Object { $_ -notin $rightNames })
  $rightOnly = @($rightNames | Where-Object { $_ -notin $leftNames })
  return [pscustomobject]@{
    leftOnly = $leftOnly
    rightOnly = $rightOnly
  }
}

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

Assert-PathExists $exportBackupScript "private backup export helper"
Assert-PathExists $pscpPath "pscp"
Assert-PathExists $plinkPath "plink"

$localManifest = Get-LocalRuntimeManifest -PrivateRoot $LocalPrivateRoot
$remoteManifest = Get-RemoteRuntimeManifest
$pairDiff = Compare-NameSets -Left $localManifest.pairs -Right $remoteManifest.pairs

Write-Host "Private runtime audit:" -ForegroundColor Cyan
Write-Host ("  Local pair files : {0}" -f $localManifest.pair_count) -ForegroundColor Cyan
Write-Host ("  Server pair files: {0}" -f $remoteManifest.pair_count) -ForegroundColor Cyan
Write-Host ("  Local session-state exists : {0}" -f [bool]$localManifest.session_state_exists) -ForegroundColor Cyan
Write-Host ("  Server session-state exists: {0}" -f [bool]$remoteManifest.session_state_exists) -ForegroundColor Cyan

if ($pairDiff.leftOnly.Count -gt 0) {
  Write-Host "  Local-only pair files:" -ForegroundColor Yellow
  $pairDiff.leftOnly | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
}
if ($pairDiff.rightOnly.Count -gt 0) {
  Write-Host "  Server-only pair files:" -ForegroundColor Yellow
  $pairDiff.rightOnly | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
}

if ($RequirePairCountMatch -and $localManifest.pair_count -ne $remoteManifest.pair_count) {
  throw "Private runtime audit failed: local/server pair counts differ."
}

if ($AuditOnly) {
  if ($localManifest.pair_count -ne $remoteManifest.pair_count -or $pairDiff.leftOnly.Count -gt 0 -or $pairDiff.rightOnly.Count -gt 0) {
    Write-Host "Audit result: local private runtime store is out of sync with the server." -ForegroundColor Yellow
  } else {
    Write-Host "Audit result: local private runtime store matches the server by pair-file count and filenames." -ForegroundColor Green
  }
  return
}

Write-Host ""
Write-Host "Creating local private operational backup before runtime sync..." -ForegroundColor Yellow
if ($IncludeLogs) {
  & $exportBackupScript -PrivateRoot $LocalPrivateRoot -DestinationRoot $BackupRoot -IncludeLogs
} else {
  & $exportBackupScript -PrivateRoot $LocalPrivateRoot -DestinationRoot $BackupRoot
}
if ($LASTEXITCODE -ne 0) {
  throw "Local private operational backup failed."
}

$stageRoot = Join-Path $env:TEMP ("espgym-private-runtime-sync-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
$stagePairs = Join-Path $stageRoot "pairs"
$stageData = Join-Path $stageRoot "data"
Ensure-Directory $stagePairs
Ensure-Directory $stageData

Write-Host ""
Write-Host "Downloading authoritative private runtime data from server..." -ForegroundColor Yellow
& $pscpPath -batch -load $PuttySession ("ec2-user@13.57.83.174:{0}" -f ($RemotePrivateRoot.TrimEnd("/") + "/data/session-state.json")) $stageData
if ($LASTEXITCODE -ne 0) {
  throw "Unable to download server session-state.json"
}
foreach ($pair in @($remoteManifest.pairs)) {
  $remotePairPath = "{0}/pairs/{1}" -f $RemotePrivateRoot.TrimEnd("/"), $pair.name
  & $pscpPath -batch -load $PuttySession ("ec2-user@13.57.83.174:{0}" -f $remotePairPath) $stagePairs
  if ($LASTEXITCODE -ne 0) {
    throw ("Unable to download server pair file: {0}" -f $pair.name)
  }
}

$localPairsDir = Join-Path $LocalPrivateRoot "pairs"
$localDataDir = Join-Path $LocalPrivateRoot "data"
Ensure-Directory $localPairsDir
Ensure-Directory $localDataDir

Write-Host ""
Write-Host "Syncing local private runtime store from the server copy..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $localPairsDir -File -ErrorAction SilentlyContinue | Remove-Item -Force
Copy-Item -LiteralPath (Join-Path $stagePairs "*") -Destination $localPairsDir -Force
Copy-Item -LiteralPath (Join-Path $stageData "session-state.json") -Destination (Join-Path $localDataDir "session-state.json") -Force

$syncedManifest = Get-LocalRuntimeManifest -PrivateRoot $LocalPrivateRoot
$postDiff = Compare-NameSets -Left $syncedManifest.pairs -Right $remoteManifest.pairs

if (
  $syncedManifest.pair_count -ne $remoteManifest.pair_count -or
  $postDiff.leftOnly.Count -gt 0 -or
  $postDiff.rightOnly.Count -gt 0
) {
  throw "Private runtime sync verification failed: local pair files still differ from the server."
}

Write-Host ""
Write-Host "Private runtime sync completed." -ForegroundColor Green
Write-Host ("  Restored local pair files : {0}" -f $syncedManifest.pair_count) -ForegroundColor Green
Write-Host ("  Restored session-state    : {0}" -f (Join-Path $localDataDir "session-state.json")) -ForegroundColor Green
Write-Host ("  Stage folder              : {0}" -f $stageRoot) -ForegroundColor DarkGray
