param(
  [Parameter(Mandatory = $true)]
  [string]$SnapshotRoot,
  [string]$PrivateRoot = "C:\xampp\telepathyexperiment_private\cones",
  [switch]$IncludeLogs,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Ensure-Directory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Copy-IfExists {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  if (-not (Test-Path -LiteralPath $SourcePath)) {
    return $false
  }

  $parent = Split-Path -Parent $DestinationPath
  if ($parent) {
    Ensure-Directory -Path $parent
  }

  Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
  return $true
}

if (-not (Test-Path -LiteralPath $SnapshotRoot)) {
  throw "Snapshot root does not exist: $SnapshotRoot"
}

$manifestPath = Join-Path $SnapshotRoot "manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Snapshot manifest not found: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if (-not $Force) {
  Write-Host "Private backup restore target:" -ForegroundColor Yellow
  Write-Host "  Snapshot: $SnapshotRoot"
  Write-Host "  Private root: $PrivateRoot"
  Write-Host "  Include logs: $([bool]$IncludeLogs)"
  Write-Host ""
  $confirmation = Read-Host "Type RESTORE to continue"
  if ($confirmation -cne "RESTORE") {
    throw "Restore cancelled."
  }
}

$configTarget = Join-Path $PrivateRoot "config"
$contentTarget = Join-Path $PrivateRoot "content"
$dataTarget = Join-Path $PrivateRoot "data"
$pairsTarget = Join-Path $PrivateRoot "pairs"
$logsTarget = Join-Path $PrivateRoot "logs"

Ensure-Directory -Path $PrivateRoot
Ensure-Directory -Path $configTarget
Ensure-Directory -Path $contentTarget
Ensure-Directory -Path $dataTarget
Ensure-Directory -Path $pairsTarget
if ($IncludeLogs) {
  Ensure-Directory -Path $logsTarget
}

$restored = @()

$singleFiles = @(
  @{ Source = (Join-Path $SnapshotRoot "config\stripe.json"); Destination = (Join-Path $configTarget "stripe.json") },
  @{ Source = (Join-Path $SnapshotRoot "config\webpush.json"); Destination = (Join-Path $configTarget "webpush.json") },
  @{ Source = (Join-Path $SnapshotRoot "config\zoho-mail.json"); Destination = (Join-Path $configTarget "zoho-mail.json") },
  @{ Source = (Join-Path $SnapshotRoot "content\learn-more-main.txt"); Destination = (Join-Path $contentTarget "learn-more-main.txt") },
  @{ Source = (Join-Path $SnapshotRoot "content\learn-more-clairvoyance.txt"); Destination = (Join-Path $contentTarget "learn-more-clairvoyance.txt") },
  @{ Source = (Join-Path $SnapshotRoot "data\session-state.json"); Destination = (Join-Path $dataTarget "session-state.json") }
)

foreach ($entry in $singleFiles) {
  if (Copy-IfExists -SourcePath $entry.Source -DestinationPath $entry.Destination) {
    $restored += $entry.Destination
  }
}

$pairsSource = Join-Path $SnapshotRoot "pairs"
if (Test-Path -LiteralPath $pairsSource) {
  Get-ChildItem -LiteralPath $pairsSource -File | ForEach-Object {
    $destination = Join-Path $pairsTarget $_.Name
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $restored += $destination
  }
}

if ($IncludeLogs) {
  $logsSource = Join-Path $SnapshotRoot "logs"
  if (Test-Path -LiteralPath $logsSource) {
    Get-ChildItem -LiteralPath $logsSource -File | ForEach-Object {
      $destination = Join-Path $logsTarget $_.Name
      Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
      $restored += $destination
    }
  }
}

Write-Host ""
Write-Host "Private operational restore completed." -ForegroundColor Green
Write-Host ("Restored files: " + $restored.Count)
Write-Host ("Snapshot created at: " + [string]$manifest.created_at_local)
Write-Host ("Snapshot source root: " + [string]$manifest.private_root)
