param(
  [string]$PrivateContentRoot = "C:\xampp\telepathyexperiment_private\cones\content",
  [string]$RepoContentRoot = "C:\xampp\htdocs\telepathyexperiment\cones\content_repo"
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

Ensure-Directory -Path $RepoContentRoot
Ensure-Directory -Path (Join-Path $RepoContentRoot "learning-center-lessons")

$copied = @()

@(
  "learn-more-main.txt",
  "learn-more-clairvoyance.txt",
  "esp-lessons.txt"
) | ForEach-Object {
  $source = Join-Path $PrivateContentRoot $_
  $destination = Join-Path $RepoContentRoot $_
  if (Copy-IfExists -SourcePath $source -DestinationPath $destination) {
    $copied += $destination
  }
}

$lessonSource = Join-Path $PrivateContentRoot "learning-center-lessons"
if (Test-Path -LiteralPath $lessonSource) {
  Get-ChildItem -LiteralPath $lessonSource -File | Where-Object {
    $_.Name -like "lesson-*.txt"
  } | ForEach-Object {
    $destination = Join-Path $RepoContentRoot ("learning-center-lessons\" + $_.Name)
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $copied += $destination
  }
}

Write-Host ("Editable infrastructure content synced to repo copies: " + $copied.Count) -ForegroundColor Green
$copied | ForEach-Object { Write-Host ("  " + $_) }
