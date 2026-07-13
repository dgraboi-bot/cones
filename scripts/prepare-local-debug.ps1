param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$bumpScript = Join-Path $PSScriptRoot "bump-version.ps1"
$mirrorRoot = "C:\xampp\htdocs\cones"

$mirrorVerifyFiles = @(
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.css",
  "telepathy.js",
  "receiver.html",
  "sender.html"
)

$versionConsistencyChecks = @(
  @{
    Path = "telepathybeginner.html"
    Pattern = 'telepathybeginner\.js\?v=([A-Za-z0-9]+)'
    Label = 'launcher -> telepathybeginner.js'
  },
  @{
    Path = "telepathybeginner.html"
    Pattern = 'telepathybeginner\.css\?v=([A-Za-z0-9]+)'
    Label = 'launcher -> telepathybeginner.css'
  },
  @{
    Path = "receiver.html"
    Pattern = 'telepathy\.js\?v=([A-Za-z0-9]+)'
    Label = 'receiver -> telepathy.js'
  },
  @{
    Path = "sender.html"
    Pattern = 'telepathy\.js\?v=([A-Za-z0-9]+)'
    Label = 'sender -> telepathy.js'
  },
  @{
    Path = "receiver.html"
    Pattern = 'telepathy\.css\?v=([A-Za-z0-9]+)'
    Label = 'receiver -> telepathy.css'
  },
  @{
    Path = "sender.html"
    Pattern = 'telepathy\.css\?v=([A-Za-z0-9]+)'
    Label = 'sender -> telepathy.css'
  },
  @{
    Path = "telepathybeginner.js"
    Pattern = 'const launcherBuildVersion = "([A-Za-z0-9]+)"'
    Label = 'telepathybeginner.js launcherBuildVersion'
  },
  @{
    Path = "telepathy.js"
    Pattern = 'const runtimeBuildVersion = "([A-Za-z0-9]+)"'
    Label = 'telepathy.js runtimeBuildVersion'
  },
  @{
    Path = "telepathy.js"
    Pattern = 'const launcherBuildVersion = "([A-Za-z0-9]+)"'
    Label = 'telepathy.js launcherBuildVersion'
  }
)

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

$versionErrors = New-Object System.Collections.Generic.List[string]
foreach ($check in $versionConsistencyChecks) {
  $path = Join-Path $repoRoot $check.Path
  $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  $match = [regex]::Match($content, $check.Pattern)
  if (-not $match.Success) {
    $versionErrors.Add(("Missing version reference for {0} in {1}" -f $check.Label, $check.Path))
    continue
  }
  $foundVersion = [string]$match.Groups[1].Value
  if ($foundVersion -ne $Version) {
    $versionErrors.Add(("Mixed-version reference for {0}: expected {1} but found {2} in {3}" -f $check.Label, $Version, $foundVersion, $check.Path))
  }
}

if ($versionErrors.Count -gt 0) {
  throw ("Local debug version consistency check failed:`n" + ($versionErrors -join "`n"))
}

$localUrl = "http://localhost/telepathyexperiment/cones/telepathybeginner.html?v=$Version"
$mirrorUrl = "http://localhost/cones/telepathybeginner.html?v=$Version"

Write-Host "Prepared local debug build $Version"
Write-Host "Authoritative local URL: $localUrl"
Write-Host "Mirror local URL:        $mirrorUrl"
