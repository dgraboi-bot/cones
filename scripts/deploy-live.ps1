param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [switch]$AllowDirty
)

# IMPORTANT RELEASE-BOUNDARY SAFEGUARD
#
# This script handles version bumping, mirroring, snapshot backup, staged upload,
# and live copy. It does NOT know by itself which local changes are intentionally
# part of the release versus older unreleased work still sitting in the tree.
#
# Before using this script for a live push, always perform a pre-deployment
# change audit against the last live baseline. At minimum, review:
#
#   git -C C:\xampp\htdocs\telepathyexperiment\cones status --short
#   git -C C:\xampp\htdocs\telepathyexperiment\cones diff --stat <last-live-baseline>..HEAD
#   git -C C:\xampp\htdocs\telepathyexperiment\cones diff --name-only <last-live-baseline>..HEAD
#
# If there are uncommitted edits, also review:
#
#   git -C C:\xampp\htdocs\telepathyexperiment\cones diff --stat
#   git -C C:\xampp\htdocs\telepathyexperiment\cones diff --name-only
#
# Do not treat a deployment as "small" or "targeted" unless that audit confirms it.
#
# POST-DEPLOY FILE INTEGRITY RULE
#
# A version-marker grep is not enough by itself. A partial live push can still leave
# one stale CSS/JS/HTML file behind while other files update successfully.
#
# This helper therefore must also perform a post-deploy SHA-256 audit comparing the
# authoritative local files with the actual live files on the server. If any audited
# file hash differs, the deployment must be treated as failed verification.

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$bumpScript = Join-Path $PSScriptRoot "bump-version.ps1"
$puttySession = "DG Putty Settings"
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$remoteUploadTarget = "ec2-user@13.57.83.174"
$liveRoot = "/var/www/telepathyexperiment/cones"
$snapshotRoot = "/home/ec2-user/espgym_live_snapshots"
$snapshotName = "{0}_pre_{1}" -f (Get-Date -Format "yyyyMMddHHmm"), $Version
$snapshotPath = "$snapshotRoot/$snapshotName"
$stageRoot = "/home/ec2-user/espgym_stage_{0}" -f $Version
$mirrorRoot = "C:\xampp\htdocs\cones"

$deployFiles = @(
  ".htaccess",
  "api.php",
  "clairvoyance_rv_page.jpg",
  "globe\globe.css",
  "globe\globe.js",
  "globe\index.html",
  "index.html",
  "learning-center-hero.png",
  "receiver.html",
  "sender.html",
  "tada.wav",
  "telepathy.css",
  "telepathy.js",
  "telepathybeginner-email-test.html",
  "telepathybeginner-email-test.js",
  "telepathybeginner-sw.js",
  "telepathybeginner.css",
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.webmanifest"
)

$verifyVersionFiles = @(
  "telepathybeginner.css",
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner-sw.js",
  "telepathybeginner.webmanifest",
  "telepathy.js",
  "sender.html",
  "receiver.html",
  "globe\index.html",
  "globe\globe.js",
  "telepathybeginner-email-test.html"
)

$mirrorVerifyFiles = @(
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.css",
  "api.php",
  "docs\espgym-live-deployment-runbook.md",
  "scripts\deploy-live.ps1"
)

$liveHashAuditFiles = @(
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.css",
  "telepathybeginner-sw.js",
  "telepathybeginner.webmanifest",
  "receiver.html",
  "sender.html",
  "telepathy.js",
  "telepathy.css",
  "api.php",
  "index.html",
  "learning-center-hero.png",
  ".htaccess",
  "globe\index.html",
  "globe\globe.js",
  "globe\globe.css",
  "clairvoyance_rv_page.jpg",
  "tada.wav"
)

function Invoke-Plink([string]$Command) {
  & $plinkPath -batch -load $puttySession $Command
}

function Convert-ToPosixPath([string]$Path) {
  return ($Path -replace "\\", "/")
}

function Assert-ToolExists([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Label at $Path"
  }
}

function Assert-FileHashMatch([string]$LeftPath, [string]$RightPath, [string]$Label) {
  if (-not (Test-Path -LiteralPath $LeftPath)) {
    throw ("Missing source file for {0}: {1}" -f $Label, $LeftPath)
  }
  if (-not (Test-Path -LiteralPath $RightPath)) {
    throw ("Missing mirror file for {0}: {1}" -f $Label, $RightPath)
  }
  $leftHash = (Get-FileHash -Algorithm SHA256 $LeftPath).Hash
  $rightHash = (Get-FileHash -Algorithm SHA256 $RightPath).Hash
  if ($leftHash -ne $rightHash) {
    throw "Mirror verification failed for $Label"
  }
}

function Get-RemoteSha256([string]$RemotePath) {
  $hashOutput = Invoke-Plink "sha256sum '$RemotePath'"
  if (-not $hashOutput) {
    throw "Unable to read remote hash for $RemotePath"
  }
  $firstLine = @($hashOutput)[0].ToString().Trim()
  if (-not $firstLine) {
    throw "Empty remote hash output for $RemotePath"
  }
  return ($firstLine -split '\s+')[0].ToUpperInvariant()
}

if (-not (Test-Path -LiteralPath $bumpScript)) {
  throw "Missing bump script: $bumpScript"
}

Assert-ToolExists $pscpPath "pscp"
Assert-ToolExists $plinkPath "plink"

$gitTopLevel = (git -C $repoRoot rev-parse --show-toplevel).Trim()
if (-not $gitTopLevel) {
  throw "Unable to determine git repo root for $repoRoot"
}
$normalizedRepoRoot = [System.IO.Path]::GetFullPath($repoRoot)
$normalizedGitTopLevel = [System.IO.Path]::GetFullPath(($gitTopLevel -replace "/", "\"))
if ($normalizedGitTopLevel -ne $normalizedRepoRoot) {
  throw "Repo root mismatch. Expected $repoRoot but git reported $gitTopLevel"
}

if (-not $AllowDirty) {
  $gitStatus = git -C $repoRoot status --short
  if ($gitStatus) {
    throw "Working tree is not clean. Commit or stash changes first, or rerun with -AllowDirty if that is intentional."
  }
}

Write-Host "PRE-DEPLOYMENT CHANGE AUDIT REQUIRED" -ForegroundColor Yellow
Write-Host "Before trusting this live push, confirm the outgoing diff against the last live baseline." -ForegroundColor Yellow
Write-Host "Suggested commands:" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot status --short" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot diff --stat <last-live-baseline>..HEAD" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot diff --name-only <last-live-baseline>..HEAD" -ForegroundColor Yellow
if ($AllowDirty) {
  Write-Host "WARNING: -AllowDirty is in use. Also review uncommitted working-tree diffs before accepting this release boundary." -ForegroundColor Yellow
  Write-Host "  git -C $repoRoot diff --stat" -ForegroundColor Yellow
  Write-Host "  git -C $repoRoot diff --name-only" -ForegroundColor Yellow
}

foreach ($relativePath in $deployFiles) {
  $fullPath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing deploy file: $fullPath"
  }
}

& powershell -ExecutionPolicy Bypass -File $bumpScript -Version $Version

$robocopyArgs = @(
  $repoRoot,
  $mirrorRoot,
  "/MIR",
  "/XD",
  ".git",
  "/R:1",
  "/W:1"
)
$null = & robocopy @robocopyArgs
$robocopyExit = $LASTEXITCODE
if ($robocopyExit -gt 7) {
  throw "robocopy mirror failed with exit code $robocopyExit"
}

foreach ($relativePath in $mirrorVerifyFiles) {
  $sourcePath = Join-Path $repoRoot $relativePath
  $mirrorPath = Join-Path $mirrorRoot $relativePath
  Assert-FileHashMatch $sourcePath $mirrorPath $relativePath
}

$remoteDirs = @($snapshotRoot, $snapshotPath, $stageRoot)
$relativeDirs = $deployFiles |
  ForEach-Object { Split-Path -Parent $_ } |
  Where-Object { $_ -and $_ -ne "." } |
  Sort-Object -Unique

foreach ($dir in $relativeDirs) {
  $posixDir = Convert-ToPosixPath $dir
  $remoteDirs += "$snapshotPath/$posixDir"
  $remoteDirs += "$stageRoot/$posixDir"
}

$mkdirTargets = ($remoteDirs | Sort-Object -Unique) -join " "
Invoke-Plink "rm -rf '$stageRoot'"
Invoke-Plink "mkdir -p $mkdirTargets"

foreach ($relativePath in $deployFiles) {
  $localPath = Join-Path $repoRoot $relativePath
  $remoteRelative = Convert-ToPosixPath $relativePath
  $stagePath = "$stageRoot/$remoteRelative"
  & $pscpPath -q -batch -load $puttySession $localPath "$remoteUploadTarget`:$stagePath"
}

foreach ($relativePath in $deployFiles) {
  $remoteRelative = Convert-ToPosixPath $relativePath
  $stagePath = "$stageRoot/$remoteRelative"
  $livePath = "$liveRoot/$remoteRelative"
  $snapshotFilePath = "$snapshotPath/$remoteRelative"
  Invoke-Plink "if [ -f '$livePath' ]; then cp '$livePath' '$snapshotFilePath'; fi" | Out-Null
  Invoke-Plink "cp '$stagePath' '$livePath'" | Out-Null
}

$verifyTargets = ($verifyVersionFiles | ForEach-Object { "$liveRoot/" + (Convert-ToPosixPath $_) }) -join " "
Invoke-Plink "grep -n '$Version' $verifyTargets"
Invoke-Plink "test -f '$liveRoot/telepathybeginner.html' -a -f '$liveRoot/telepathybeginner.js' -a -f '$liveRoot/api.php'"

foreach ($relativePath in $liveHashAuditFiles) {
  $localPath = Join-Path $repoRoot $relativePath
  $remotePath = "$liveRoot/" + (Convert-ToPosixPath $relativePath)
  $localHash = (Get-FileHash -Algorithm SHA256 $localPath).Hash.ToUpperInvariant()
  $remoteHash = Get-RemoteSha256 $remotePath
  if ($localHash -ne $remoteHash) {
    throw "Live hash audit failed for $relativePath"
  }
}

Invoke-Plink "rm -rf '$stageRoot'" | Out-Null

Write-Host "Deployed build $Version"
Write-Host "Snapshot: $snapshotPath"
Write-Host "Mirror synced: $mirrorRoot"
Write-Host ("Live SHA-256 audit passed for {0} files" -f $liveHashAuditFiles.Count)
Write-Host "Live root: https://espgym.com/"
Write-Host ("Cache-busted launcher: https://espgym.com/telepathybeginner.html?v={0}&open=launcher" -f $Version)
