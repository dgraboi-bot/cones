param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$puttySession = "DG Putty Settings"
$remoteUploadTarget = "ec2-user@13.57.83.174"
$liveRoot = "/var/www/telepathyexperiment/cones"
$privateContentRoot = "/var/www/telepathyexperiment_private/cones/content"
$snapshotRoot = "/home/ec2-user/espgym_live_snapshots"
$snapshotName = "{0}_pre_{1}" -f (Get-Date -Format "yyyyMMddHHmm"), $Version
$snapshotPath = "$snapshotRoot/$snapshotName"
$stageRoot = "/home/ec2-user/espgym_stage_{0}" -f $Version
$preparedReleaseRoot = "C:\xampp\telepathyexperiment_private\cones\release-prep"
$preparedReleasePath = Join-Path $preparedReleaseRoot "prepared-release.json"
$releaseLogRoot = "C:\xampp\telepathyexperiment_private\cones\release-logs"
$releaseLogStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$releaseLogPath = Join-Path $releaseLogRoot ("push-live-{0}-{1}.log" -f $Version, $releaseLogStamp)

New-Item -ItemType Directory -Force -Path $releaseLogRoot | Out-Null

function Write-ReleaseLog([string]$Message, [string]$Color = "Gray") {
  $timestamped = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $Message
  Write-Host $timestamped -ForegroundColor $Color
  Add-Content -LiteralPath $releaseLogPath -Value $timestamped -Encoding UTF8
}

function Format-ExternalFailureMessage([string]$ToolName, [string]$StepLabel, [int]$ExitCode, [string]$StdErr, [string]$StdOut) {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add("$ToolName failed during $StepLabel with exit code $ExitCode.")
  if ($StdErr.Trim()) {
    $parts.Add("stderr: $($StdErr.Trim())")
  }
  if ($StdOut.Trim()) {
    $parts.Add("stdout: $($StdOut.Trim())")
  }
  return ($parts -join " ")
}

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList,

    [Parameter(Mandatory = $true)]
    [string]$StepLabel,

    [int]$TimeoutSeconds = 120,

    [switch]$AllowEmptyOutput
  )

  $quotedArguments = foreach ($argument in $ArgumentList) {
    if ($null -eq $argument) {
      '""'
      continue
    }
    $text = [string]$argument
    if ($text -match '[\s"]') {
      '"' + ($text -replace '"', '\"') + '"'
    } else {
      $text
    }
  }

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $FilePath
  $startInfo.Arguments = ($quotedArguments -join " ")
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  Write-ReleaseLog ("Starting {0}" -f $StepLabel) "DarkCyan"
  [void]$process.Start()

  if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
    try {
      $process.Kill($true)
    } catch {
    }
    throw "{0} timed out after {1}s." -f $StepLabel, $TimeoutSeconds
  }

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $exitCode = $process.ExitCode

  Add-Content -LiteralPath $releaseLogPath -Value ("[{0}] {1} stdout:`n{2}" -f (Get-Date -Format "HH:mm:ss"), $StepLabel, $stdout) -Encoding UTF8
  if ($stderr.Trim()) {
    Add-Content -LiteralPath $releaseLogPath -Value ("[{0}] {1} stderr:`n{2}" -f (Get-Date -Format "HH:mm:ss"), $StepLabel, $stderr) -Encoding UTF8
  }

  if ($exitCode -ne 0) {
    throw (Format-ExternalFailureMessage -ToolName ([IO.Path]::GetFileName($FilePath)) -StepLabel $StepLabel -ExitCode $exitCode -StdErr $stderr -StdOut $stdout)
  }

  if (-not $AllowEmptyOutput -and -not $stdout.Trim() -and -not $stderr.Trim()) {
    Write-ReleaseLog ("Completed {0} (no console output)" -f $StepLabel) "DarkGray"
  } else {
    Write-ReleaseLog ("Completed {0}" -f $StepLabel) "DarkGreen"
  }

  return @{
    StdOut = $stdout
    StdErr = $stderr
    ExitCode = $exitCode
  }
}

function Invoke-Plink([string]$Command) {
  $result = Invoke-ExternalCommand -FilePath $plinkPath -ArgumentList @("-batch", "-load", $puttySession, $Command) -StepLabel "plink command" -TimeoutSeconds 180 -AllowEmptyOutput
  if (-not $result.StdOut) {
    return @()
  }
  return ($result.StdOut -split "`r?`n")
}

function Invoke-PlinkStep([string]$Command, [string]$StepLabel, [int]$TimeoutSeconds = 180, [switch]$AllowEmptyOutput) {
  $result = Invoke-ExternalCommand -FilePath $plinkPath -ArgumentList @("-batch", "-load", $puttySession, $Command) -StepLabel $StepLabel -TimeoutSeconds $TimeoutSeconds -AllowEmptyOutput:$AllowEmptyOutput
  if (-not $result.StdOut) {
    return @()
  }
  return ($result.StdOut -split "`r?`n")
}

function Invoke-PscpUpload([string]$LocalPath, [string]$RemotePath, [string]$StepLabel) {
  [void](Invoke-ExternalCommand -FilePath $pscpPath -ArgumentList @("-q", "-batch", "-load", $puttySession, $LocalPath, "$remoteUploadTarget`:$RemotePath") -StepLabel $StepLabel -TimeoutSeconds 180 -AllowEmptyOutput)
}

function Convert-ToPosixPath([string]$Path) {
  return ($Path -replace "\\", "/")
}

function Assert-LiveShellVersion([string]$ExpectedVersion) {
  Write-ReleaseLog ("Verifying live shell HTTP surfaces for build {0}" -f $ExpectedVersion) "DarkCyan"
  $targets = @(
    @{
      Url = "https://espgym.com/telepathybeginner.html?v=$ExpectedVersion&open=launcher"
      Contains = @(
        "<meta name=`"espgym-build-version`" content=`"$ExpectedVersion`">",
        "telepathybeginner.js?v=$ExpectedVersion",
        "telepathybeginner.css?v=$ExpectedVersion",
        "telepathybeginner.webmanifest?v=$ExpectedVersion"
      )
    },
    @{
      Url = "https://espgym.com/telepathybeginner-sw.js?v=$ExpectedVersion"
      Contains = @(
        "const CACHE_NAME = `"telepathybeginner-v$ExpectedVersion`";",
        "const APP_VERSION = `"$ExpectedVersion`";"
      )
    }
  )

  foreach ($target in $targets) {
    $content = $null
    $lastError = ""
    for ($attempt = 1; $attempt -le 4; $attempt++) {
      try {
        $response = Invoke-WebRequest -Uri ([string]$target.Url) -UseBasicParsing -TimeoutSec 20
        $content = [string]$response.Content
        break
      } catch {
        $lastError = $_.Exception.Message
        if ($attempt -lt 4) {
          Start-Sleep -Seconds 2
        }
      }
    }
    if ($null -eq $content) {
      throw "Live shell verification could not fetch $($target.Url): $lastError"
    }
    foreach ($snippet in @($target.Contains)) {
      if ($content -notlike "*$snippet*") {
        throw "Live shell verification failed for $($target.Url). Missing expected snippet: $snippet"
      }
    }
  }
}

function Assert-ToolExists([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Label at $Path"
  }
}

function Get-RemoteSha256([string]$RemotePath) {
  $lastErrorMessage = ""
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      $hashOutput = Invoke-PlinkStep "sha256sum '$RemotePath'" ("read remote sha256 attempt {0}: {1}" -f $attempt, $RemotePath) -TimeoutSeconds 90
      if (-not $hashOutput) {
        throw "Unable to read remote hash for $RemotePath"
      }
      $firstLine = @($hashOutput)[0].ToString().Trim()
      if (-not $firstLine) {
        throw "Empty remote hash output for $RemotePath"
      }
      return ($firstLine -split '\s+')[0].ToUpperInvariant()
    } catch {
      $lastErrorMessage = $_.Exception.Message
      if ($attempt -lt 3) {
        Start-Sleep -Seconds 2
      }
    }
  }
  if ($lastErrorMessage) {
    throw $lastErrorMessage
  }
  throw "Unable to read remote hash for $RemotePath"
}

function Convert-ToPrivateContentPath([string]$RelativePath) {
  $normalized = Convert-ToPosixPath $RelativePath
  if ($normalized -eq "content_repo/esp-lessons.txt") {
    return "$privateContentRoot/esp-lessons.txt"
  }
  if ($normalized -eq "content_repo/learn-more-clairvoyance.txt") {
    return "$privateContentRoot/learn-more-clairvoyance.txt"
  }
  if ($normalized -eq "content_repo/learn-more-main.txt") {
    return "$privateContentRoot/learn-more-main.txt"
  }
  if ($normalized -eq "content_repo/new-learning-center-outline.json") {
    return "$privateContentRoot/new-learning-center-outline.json"
  }
  if ($normalized -like "content_repo/new-learning-center-lessons/*") {
    $suffix = $normalized.Substring("content_repo/new-learning-center-lessons/".Length)
    return "$privateContentRoot/new-learning-center-lessons/$suffix"
  }
  return ""
}

function Get-OutlineLessonPageIdsFromJsonText([string]$JsonText) {
  if (-not $JsonText.Trim()) {
    return @()
  }
  $parsed = $JsonText | ConvertFrom-Json
  $rows = @($parsed.rows)
  $ids = foreach ($row in $rows) {
    $type = [string]($row.type)
    $id = [string]($row.id)
    if ($type -eq "lesson-page" -and $id.Trim()) {
      $id.Trim()
    }
  }
  return @($ids | Sort-Object -Unique)
}

function Get-RemoteTextFile([string]$RemotePath) {
  $output = Invoke-PlinkStep "cat '$RemotePath'" ("read remote text file: {0}" -f $RemotePath) -TimeoutSeconds 90
  return (@($output) -join "`n")
}

function Get-RemoteLessonFileNames([string]$RemoteDirectory) {
  $remoteCommand = @"
python3 - <<'PY'
import os
root = r'''$RemoteDirectory'''
if os.path.isdir(root):
    for name in sorted(os.listdir(root)):
        if name.endswith('.txt') and os.path.isfile(os.path.join(root, name)):
            print(name)
PY
"@
  $output = Invoke-PlinkStep $remoteCommand ("list remote lesson files: {0}" -f $RemoteDirectory) -TimeoutSeconds 90
  $names = foreach ($line in @($output)) {
    $trimmed = ([string]$line).Trim()
    if ($trimmed) {
      $trimmed
    }
  }
  return @($names)
}

function Assert-RemoteManagedLessonSetConsistent([string]$RepoRootForCheck) {
  $localOutlinePath = Join-Path $RepoRootForCheck "content_repo\new-learning-center-outline.json"
  $localOutlineText = Get-Content -LiteralPath $localOutlinePath -Raw -Encoding UTF8
  $expectedIds = Get-OutlineLessonPageIdsFromJsonText $localOutlineText
  $remotePrivateOutlineText = Get-RemoteTextFile "$privateContentRoot/new-learning-center-outline.json"
  $remoteRepoOutlineText = Get-RemoteTextFile "$liveRoot/content_repo/new-learning-center-outline.json"
  $remotePrivateIds = Get-OutlineLessonPageIdsFromJsonText $remotePrivateOutlineText
  $remoteRepoIds = Get-OutlineLessonPageIdsFromJsonText $remoteRepoOutlineText
  $remotePrivateFiles = Get-RemoteLessonFileNames "$privateContentRoot/new-learning-center-lessons"
  $remoteRepoFiles = Get-RemoteLessonFileNames "$liveRoot/content_repo/new-learning-center-lessons"
  $issues = New-Object System.Collections.Generic.List[string]

  if ((@($expectedIds) -join "|") -ne (@($remotePrivateIds) -join "|")) {
    $issues.Add("Live private outline lesson ids differ from local authoritative outline.")
  }
  if ((@($expectedIds) -join "|") -ne (@($remoteRepoIds) -join "|")) {
    $issues.Add("Live repo outline lesson ids differ from local authoritative outline.")
  }

  foreach ($lessonId in $expectedIds) {
    $fileName = "{0}.txt" -f $lessonId
    if ($remotePrivateFiles -notcontains $fileName) {
      $issues.Add("Live private outline references missing lesson file: $fileName")
    }
    if ($remoteRepoFiles -notcontains $fileName) {
      $issues.Add("Live repo outline references missing lesson file: $fileName")
    }
  }

  if ($issues.Count -gt 0) {
    throw ("Live managed lesson-set verification failed:`n" + ($issues -join "`n"))
  }

  Write-Host ("Live lesson-set verification passed for {0} outline lessons" -f $expectedIds.Count) -ForegroundColor Green
}

Assert-ToolExists $pscpPath "pscp"
Assert-ToolExists $plinkPath "plink"
Write-ReleaseLog ("Starting live push for build {0}" -f $Version) "Cyan"
Write-ReleaseLog ("Release log: {0}" -f $releaseLogPath) "DarkGray"

if (-not (Test-Path -LiteralPath $preparedReleasePath)) {
  throw "Missing prepared release manifest: $preparedReleasePath"
}

$manifest = Get-Content -LiteralPath $preparedReleasePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.version -ne $Version) {
  throw "Prepared release manifest version mismatch. Expected $Version but found $($manifest.version). Run prepare-release again."
}

$manifestRepoRoot = [string]$manifest.repo_root
if (-not $manifestRepoRoot) {
  throw "Prepared release manifest is missing repo_root."
}

$localHashes = @{}
foreach ($row in @($manifest.local_hashes)) {
  $localHashes[[string]$row.path] = [string]$row.sha256
}

foreach ($relativePath in @($manifest.deploy_files)) {
  $fullPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Prepared deploy file is missing before push: $fullPath"
  }
  $currentHash = (Get-FileHash -Algorithm SHA256 $fullPath).Hash.ToUpperInvariant()
  $expectedHash = [string]$localHashes[[string]$relativePath]
  if (-not $expectedHash) {
    throw "Prepared manifest is missing hash info for $relativePath"
  }
  if ($currentHash -ne $expectedHash) {
    throw "Prepared file drift detected for $relativePath. Re-run prepare-release before pushing live."
  }
}

$remoteDirs = @($snapshotRoot, $snapshotPath, $stageRoot)
$relativeDirs = @($manifest.deploy_files) |
  ForEach-Object { Split-Path -Parent ([string]$_) } |
  Where-Object { $_ -and $_ -ne "." } |
  Sort-Object -Unique

foreach ($dir in $relativeDirs) {
  $posixDir = Convert-ToPosixPath $dir
  $remoteDirs += "$snapshotPath/$posixDir"
  $remoteDirs += "$stageRoot/$posixDir"
}

$mkdirTargets = ($remoteDirs | Sort-Object -Unique) -join " "
Write-ReleaseLog "Phase 1/6: preparing remote staging directories" "Yellow"
Invoke-PlinkStep "rm -rf '$stageRoot'" "clear remote stage root" -AllowEmptyOutput
Invoke-PlinkStep "mkdir -p $mkdirTargets" "create remote stage/snapshot directories" -AllowEmptyOutput

$deployFilesList = @($manifest.deploy_files)
$deployFileCount = $deployFilesList.Count
Write-ReleaseLog ("Phase 2/6: uploading {0} deploy files to remote stage" -f $deployFileCount) "Yellow"
for ($index = 0; $index -lt $deployFileCount; $index++) {
  $relativePath = [string]$deployFilesList[$index]
  $localPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $stagePath = "$stageRoot/$remoteRelative"
  Invoke-PscpUpload -LocalPath $localPath -RemotePath $stagePath -StepLabel ("upload staged file {0}/{1}: {2}" -f ($index + 1), $deployFileCount, $relativePath)
}

Write-ReleaseLog ("Phase 3/6: promoting {0} staged files into live root" -f $deployFileCount) "Yellow"
for ($index = 0; $index -lt $deployFileCount; $index++) {
  $relativePath = [string]$deployFilesList[$index]
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $stagePath = "$stageRoot/$remoteRelative"
  $livePath = "$liveRoot/$remoteRelative"
  $snapshotFilePath = "$snapshotPath/$remoteRelative"
  $liveDir = ($livePath -replace '/[^/]+$','')
  $tempLivePath = "$liveDir/.codex_stage_$Version-" + [IO.Path]::GetFileName($livePath)
  Invoke-PlinkStep "if [ -f '$livePath' ]; then cp '$livePath' '$snapshotFilePath'; fi" ("snapshot existing live file {0}/{1}: {2}" -f ($index + 1), $deployFileCount, $relativePath) -AllowEmptyOutput
  Invoke-PlinkStep "cp '$stagePath' '$tempLivePath' && mv -f '$tempLivePath' '$livePath'" ("promote staged file {0}/{1}: {2}" -f ($index + 1), $deployFileCount, $relativePath) -AllowEmptyOutput
}

$privateDirs = @($privateContentRoot, "$privateContentRoot/new-learning-center-lessons")
Write-ReleaseLog "Phase 4/6: syncing managed lesson content into private content root" "Yellow"
Invoke-PlinkStep ("mkdir -p " + (($privateDirs | Sort-Object -Unique) -join " ")) "ensure private content directories" -AllowEmptyOutput
$privateSyncFiles = @($manifest.private_content_sync_files)
$privateSyncCount = $privateSyncFiles.Count
for ($index = 0; $index -lt $privateSyncCount; $index++) {
  $relativePath = [string]$privateSyncFiles[$index]
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $livePath = "$liveRoot/$remoteRelative"
  $privatePath = Convert-ToPrivateContentPath ([string]$relativePath)
  if (-not $privatePath) {
    continue
  }
  Invoke-PlinkStep "cp '$livePath' '$privatePath'" ("sync private managed content {0}/{1}: {2}" -f ($index + 1), $privateSyncCount, $relativePath) -AllowEmptyOutput
}

Write-ReleaseLog "Phase 5/6: verifying version markers and live/private hashes" "Yellow"
$verifyTargets = (@($manifest.verify_version_files) | ForEach-Object { "$liveRoot/" + (Convert-ToPosixPath ([string]$_)) }) -join " "
Invoke-PlinkStep "grep -q '$Version' $verifyTargets" "verify deployed version markers exist in live files" -AllowEmptyOutput
Invoke-PlinkStep "test -f '$liveRoot/telepathybeginner.html' -a -f '$liveRoot/telepathybeginner.js' -a -f '$liveRoot/api.php'" "verify critical live files exist" -AllowEmptyOutput

$liveHashAuditFiles = @($manifest.live_hash_audit_files)
$liveHashAuditCount = $liveHashAuditFiles.Count
for ($index = 0; $index -lt $liveHashAuditCount; $index++) {
  $relativePath = [string]$liveHashAuditFiles[$index]
  $localPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  $remotePath = "$liveRoot/" + (Convert-ToPosixPath ([string]$relativePath))
  $localHash = (Get-FileHash -Algorithm SHA256 $localPath).Hash.ToUpperInvariant()
  $remoteHash = Get-RemoteSha256 $remotePath
  if ($localHash -ne $remoteHash) {
    throw "Live hash audit failed for $relativePath"
  }
  Write-ReleaseLog ("Verified live hash {0}/{1}: {2}" -f ($index + 1), $liveHashAuditCount, $relativePath) "DarkGreen"
}

$privateContentAuditCount = $privateSyncFiles.Count
for ($index = 0; $index -lt $privateContentAuditCount; $index++) {
  $relativePath = [string]$privateSyncFiles[$index]
  $localPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  $privatePath = Convert-ToPrivateContentPath ([string]$relativePath)
  if (-not $privatePath) {
    continue
  }
  $localHash = (Get-FileHash -Algorithm SHA256 $localPath).Hash.ToUpperInvariant()
  $remoteHash = Get-RemoteSha256 $privatePath
  if ($localHash -ne $remoteHash) {
    throw "Private content hash audit failed for $relativePath"
  }
  Write-ReleaseLog ("Verified private content hash {0}/{1}: {2}" -f ($index + 1), $privateContentAuditCount, $relativePath) "DarkGreen"
}

Assert-RemoteManagedLessonSetConsistent -RepoRootForCheck $manifestRepoRoot
Assert-LiveShellVersion -ExpectedVersion $Version
Write-ReleaseLog "Phase 6/6: final live shell verification and cleanup" "Yellow"
Invoke-PlinkStep "rm -rf '$stageRoot'" "remove remote stage root after successful deploy" -AllowEmptyOutput

Write-ReleaseLog ("Pushed prepared build {0}" -f $Version) "Green"
Write-ReleaseLog ("Snapshot: {0}" -f $snapshotPath) "Green"
Write-ReleaseLog ("Live SHA-256 audit passed for {0} files" -f $liveHashAuditCount) "Green"
Write-ReleaseLog ("Private content SHA-256 audit passed for {0} files" -f $privateContentAuditCount) "Green"
Write-ReleaseLog ("Live root: {0}" -f [string]$manifest.live_root_url) "Green"
Write-ReleaseLog ("Cache-busted launcher: {0}" -f [string]$manifest.live_launcher_url) "Green"
Write-ReleaseLog ("Release log saved at: {0}" -f $releaseLogPath) "Green"
