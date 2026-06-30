param(
  [string]$PrivateRoot = "C:\xampp\telepathyexperiment_private\cones",
  [string]$DestinationRoot = "C:\xampp\telepathyexperiment_private\private-backups",
  [switch]$IncludeLogs
)

$ErrorActionPreference = "Stop"

function Copy-IfExists {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  if (-not (Test-Path -LiteralPath $SourcePath)) {
    return $false
  }

  $parent = Split-Path -Parent $DestinationPath
  if ($parent -and -not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
  return $true
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$snapshotRoot = Join-Path $DestinationRoot $timestamp
$configSource = Join-Path $PrivateRoot "config"
$contentSource = Join-Path $PrivateRoot "content"
$dataSource = Join-Path $PrivateRoot "data"
$pairsSource = Join-Path $PrivateRoot "pairs"
$logsSource = Join-Path $PrivateRoot "logs"

New-Item -ItemType Directory -Path $snapshotRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotRoot "config") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotRoot "content") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotRoot "data") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $snapshotRoot "pairs") -Force | Out-Null

$manifest = [ordered]@{
  created_at_local = (Get-Date).ToString("s")
  private_root = $PrivateRoot
  snapshot_root = $snapshotRoot
  included_logs = [bool]$IncludeLogs
  files = @()
}

$singleFiles = @(
  @{ Source = (Join-Path $configSource "stripe.json"); Destination = (Join-Path $snapshotRoot "config\stripe.json") },
  @{ Source = (Join-Path $configSource "webpush.json"); Destination = (Join-Path $snapshotRoot "config\webpush.json") },
  @{ Source = (Join-Path $configSource "zoho-mail.json"); Destination = (Join-Path $snapshotRoot "config\zoho-mail.json") },
  @{ Source = (Join-Path $contentSource "learn-more-main.txt"); Destination = (Join-Path $snapshotRoot "content\learn-more-main.txt") },
  @{ Source = (Join-Path $contentSource "learn-more-clairvoyance.txt"); Destination = (Join-Path $snapshotRoot "content\learn-more-clairvoyance.txt") },
  @{ Source = (Join-Path $contentSource "esp-lessons.txt"); Destination = (Join-Path $snapshotRoot "content\esp-lessons.txt") },
  @{ Source = (Join-Path $dataSource "session-state.json"); Destination = (Join-Path $snapshotRoot "data\session-state.json") }
)

foreach ($entry in $singleFiles) {
  if (Copy-IfExists -SourcePath $entry.Source -DestinationPath $entry.Destination) {
    $item = Get-Item -LiteralPath $entry.Destination
    $manifest.files += [ordered]@{
      relative_path = $item.FullName.Substring($snapshotRoot.Length).TrimStart('\')
      bytes = [int64]$item.Length
    }
  }
}

$lessonSource = Join-Path $contentSource "learning-center-lessons"
if (Test-Path -LiteralPath $lessonSource) {
  Get-ChildItem -LiteralPath $lessonSource -File | Where-Object {
    $_.Name -like "lesson-*.txt"
  } | ForEach-Object {
    $destination = Join-Path $snapshotRoot ("content\learning-center-lessons\" + $_.Name)
    $parent = Split-Path -Parent $destination
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
      New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $manifest.files += [ordered]@{
      relative_path = ("content\learning-center-lessons\" + $_.Name)
      bytes = [int64]$_.Length
    }
  }
}

if (Test-Path -LiteralPath $pairsSource) {
  Get-ChildItem -LiteralPath $pairsSource -File | Where-Object {
    $_.Extension -eq ".csv" -or $_.Name -like "*.analysis.json"
  } | ForEach-Object {
    $destination = Join-Path $snapshotRoot ("pairs\" + $_.Name)
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $manifest.files += [ordered]@{
      relative_path = ("pairs\" + $_.Name)
      bytes = [int64]$_.Length
    }
  }
}

if ($IncludeLogs) {
  New-Item -ItemType Directory -Path (Join-Path $snapshotRoot "logs") -Force | Out-Null
  @("debug-log.txt", "safety-log.txt", "subscription-email-log.txt") | ForEach-Object {
    $source = Join-Path $logsSource $_
    $destination = Join-Path $snapshotRoot ("logs\" + $_)
    if (Copy-IfExists -SourcePath $source -DestinationPath $destination) {
      $item = Get-Item -LiteralPath $destination
      $manifest.files += [ordered]@{
        relative_path = $item.FullName.Substring($snapshotRoot.Length).TrimStart('\')
        bytes = [int64]$item.Length
      }
    }
  }
}

$manifestPath = Join-Path $snapshotRoot "manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Output ("Private operational backup created at: " + $snapshotRoot)
