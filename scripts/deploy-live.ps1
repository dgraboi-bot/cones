param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [switch]$AllowDirty
)

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
  "receiver.html",
  "sender.html",
  "tada.wav",
  "telepathy.js",
  "telepathybeginner-email-test.html",
  "telepathybeginner-sw.js",
  "telepathybeginner.css",
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.webmanifest"
)

$verifyVersionFiles = @(
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
Invoke-Plink "rm -rf '$stageRoot'" | Out-Null

Write-Host "Deployed build $Version"
Write-Host "Snapshot: $snapshotPath"
Write-Host "Mirror synced: $mirrorRoot"
Write-Host "Live root: https://espgym.com/"
Write-Host ("Cache-busted launcher: https://espgym.com/telepathybeginner.html?v={0}&open=launcher" -f $Version)
