param(
  [string]$LocalImagePairsRoot = "C:\xampp\htdocs\telepathyexperiment\cones\imagepairs",
  [string]$MirrorImagePairsRoot = "C:\xampp\htdocs\cones\imagepairs",
  [string]$RemoteImagePairsRoot = "/var/www/telepathyexperiment/cones/imagepairs",
  [string]$PuttySession = "DG Putty Settings",
  [string]$BackupRoot = "C:\xampp\telepathyexperiment_private\cones\backup\imagepairs-live-sync",
  [switch]$AuditOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"

function Assert-PathExists([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Label at $Path"
  }
}

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Invoke-PlinkJson([string]$Command) {
  $output = & $plinkPath -batch -load $PuttySession $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Remote command failed."
  }
  return (@($output) -join "`n")
}

function Get-RemoteImagePairsState() {
  $command = @"
python3 - <<'PY'
import hashlib, json, os
root = r'''$RemoteImagePairsRoot'''
files = []
if os.path.isdir(root):
    for name in sorted(os.listdir(root)):
        path = os.path.join(root, name)
        if not os.path.isfile(path):
            continue
        with open(path, 'rb') as fh:
            files.append(dict(
                name=name,
                bytes=os.path.getsize(path),
                sha256=hashlib.sha256(fh.read()).hexdigest().upper()
            ))
print(json.dumps(dict(files=files, count=len(files))))
PY
"@
  $json = Invoke-PlinkJson $command
  if (-not $json.Trim()) {
    throw "Empty remote imagepairs manifest."
  }
  return $json | ConvertFrom-Json
}

function Get-LocalImagePairsState([string]$Root) {
  $files = @()
  if (Test-Path -LiteralPath $Root) {
    $files = Get-ChildItem -LiteralPath $Root -File | Sort-Object Name | ForEach-Object {
      [pscustomobject]@{
        name = $_.Name
        bytes = [int64]$_.Length
        sha256 = (Get-FileHash -Algorithm SHA256 $_.FullName).Hash.ToUpperInvariant()
      }
    }
  }
  return [pscustomobject]@{
    files = $files
    count = @($files).Count
  }
}

function Get-ImagePairsDriftSummary([object[]]$LocalFiles, [object[]]$RemoteFiles) {
  $drift = New-Object System.Collections.Generic.List[string]
  $localByName = @{}
  foreach ($row in @($LocalFiles)) {
    $localByName[[string]$row.name] = $row
  }
  $remoteByName = @{}
  foreach ($row in @($RemoteFiles)) {
    $remoteByName[[string]$row.name] = $row
  }

  foreach ($name in @($RemoteByName.Keys | Sort-Object)) {
    if (-not $localByName.ContainsKey($name)) {
      $drift.Add("$name (exists live but not locally)")
      continue
    }
    if ([string]$localByName[$name].sha256 -ne [string]$remoteByName[$name].sha256) {
      $drift.Add("$name (local hash differs from live hash)")
    }
  }
  foreach ($name in @($localByName.Keys | Sort-Object)) {
    if (-not $remoteByName.ContainsKey($name)) {
      $drift.Add("$name (exists locally but not live)")
    }
  }
  return @($drift)
}

Assert-PathExists $pscpPath "pscp"
Assert-PathExists $plinkPath "plink"
Ensure-Directory $LocalImagePairsRoot
Ensure-Directory $MirrorImagePairsRoot
Ensure-Directory $BackupRoot

$localState = Get-LocalImagePairsState -Root $LocalImagePairsRoot
$remoteState = Get-RemoteImagePairsState
$drift = @(Get-ImagePairsDriftSummary -LocalFiles $localState.files -RemoteFiles $remoteState.files)

Write-Host "Imagepairs audit:" -ForegroundColor Cyan
Write-Host ("  Local files : {0}" -f $localState.count) -ForegroundColor Cyan
Write-Host ("  Live files  : {0}" -f $remoteState.count) -ForegroundColor Cyan
if ($drift.Count -gt 0) {
  Write-Host "  Drift:" -ForegroundColor Yellow
  $drift | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
} else {
  Write-Host "  Drift: none" -ForegroundColor Green
}

if ($AuditOnly) {
  return
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backupPath = Join-Path $BackupRoot $timestamp
Ensure-Directory $backupPath

if (Test-Path -LiteralPath $LocalImagePairsRoot) {
  Copy-Item -LiteralPath $LocalImagePairsRoot -Destination (Join-Path $backupPath "authoritative") -Recurse -Force
}
if (Test-Path -LiteralPath $MirrorImagePairsRoot) {
  Copy-Item -LiteralPath $MirrorImagePairsRoot -Destination (Join-Path $backupPath "mirror") -Recurse -Force
}

$stageRoot = Join-Path $env:TEMP ("espgym-imagepairs-sync-" + $timestamp)
Ensure-Directory $stageRoot

Write-Host ""
Write-Host "Downloading live imagepairs state..." -ForegroundColor Yellow
foreach ($file in @($remoteState.files)) {
  $remotePath = "{0}/{1}" -f $RemoteImagePairsRoot.TrimEnd("/"), [string]$file.name
  & $pscpPath -batch -load $PuttySession ("ec2-user@13.57.83.174:{0}" -f $remotePath) $stageRoot
  if ($LASTEXITCODE -ne 0) {
    throw ("Unable to download live imagepairs file: {0}" -f [string]$file.name)
  }
}

Write-Host ""
Write-Host "Syncing authoritative and mirror imagepairs folders from live..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $LocalImagePairsRoot -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -LiteralPath $MirrorImagePairsRoot -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -LiteralPath $stageRoot -File | Copy-Item -Destination $LocalImagePairsRoot -Force
Get-ChildItem -LiteralPath $stageRoot -File | Copy-Item -Destination $MirrorImagePairsRoot -Force

$finalLocalState = Get-LocalImagePairsState -Root $LocalImagePairsRoot
$finalMirrorState = Get-LocalImagePairsState -Root $MirrorImagePairsRoot
$finalLocalDrift = @(Get-ImagePairsDriftSummary -LocalFiles $finalLocalState.files -RemoteFiles $remoteState.files)
$finalMirrorDrift = @(Get-ImagePairsDriftSummary -LocalFiles $finalMirrorState.files -RemoteFiles $remoteState.files)

if ($finalLocalDrift.Count -gt 0) {
  throw ("Post-sync verification failed for authoritative imagepairs:`n" + ($finalLocalDrift -join "`n"))
}
if ($finalMirrorDrift.Count -gt 0) {
  throw ("Post-sync verification failed for mirror imagepairs:`n" + ($finalMirrorDrift -join "`n"))
}

Write-Host ""
Write-Host "Imagepairs sync completed." -ForegroundColor Green
Write-Host ("  Authoritative folder: {0}" -f $LocalImagePairsRoot) -ForegroundColor Green
Write-Host ("  Mirror folder       : {0}" -f $MirrorImagePairsRoot) -ForegroundColor Green
Write-Host ("  Backup              : {0}" -f $backupPath) -ForegroundColor DarkGray
