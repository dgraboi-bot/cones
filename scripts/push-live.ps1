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

function Invoke-Plink([string]$Command) {
  & $plinkPath -batch -load $puttySession $Command
}

function Convert-ToPosixPath([string]$Path) {
  return ($Path -replace "\\", "/")
}

function Assert-LiveShellVersion([string]$ExpectedVersion) {
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
      $hashOutput = Invoke-Plink "sha256sum '$RemotePath'"
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
  $output = Invoke-Plink "cat '$RemotePath'"
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
  $output = Invoke-Plink $remoteCommand
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
Invoke-Plink "rm -rf '$stageRoot'"
Invoke-Plink "mkdir -p $mkdirTargets"

foreach ($relativePath in @($manifest.deploy_files)) {
  $localPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $stagePath = "$stageRoot/$remoteRelative"
  & $pscpPath -q -batch -load $puttySession $localPath "$remoteUploadTarget`:$stagePath"
}

foreach ($relativePath in @($manifest.deploy_files)) {
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $stagePath = "$stageRoot/$remoteRelative"
  $livePath = "$liveRoot/$remoteRelative"
  $snapshotFilePath = "$snapshotPath/$remoteRelative"
  $liveDir = ($livePath -replace '/[^/]+$','')
  $tempLivePath = "$liveDir/.codex_stage_$Version-" + [IO.Path]::GetFileName($livePath)
  Invoke-Plink "if [ -f '$livePath' ]; then cp '$livePath' '$snapshotFilePath'; fi" | Out-Null
  Invoke-Plink "cp '$stagePath' '$tempLivePath' && mv -f '$tempLivePath' '$livePath'" | Out-Null
}

$privateDirs = @($privateContentRoot, "$privateContentRoot/new-learning-center-lessons")
Invoke-Plink ("mkdir -p " + (($privateDirs | Sort-Object -Unique) -join " ")) | Out-Null
foreach ($relativePath in @($manifest.private_content_sync_files)) {
  $remoteRelative = Convert-ToPosixPath ([string]$relativePath)
  $livePath = "$liveRoot/$remoteRelative"
  $privatePath = Convert-ToPrivateContentPath ([string]$relativePath)
  if (-not $privatePath) {
    continue
  }
  Invoke-Plink "cp '$livePath' '$privatePath'" | Out-Null
}

$verifyTargets = (@($manifest.verify_version_files) | ForEach-Object { "$liveRoot/" + (Convert-ToPosixPath ([string]$_)) }) -join " "
Invoke-Plink "grep -n '$Version' $verifyTargets"
Invoke-Plink "test -f '$liveRoot/telepathybeginner.html' -a -f '$liveRoot/telepathybeginner.js' -a -f '$liveRoot/api.php'"

foreach ($relativePath in @($manifest.live_hash_audit_files)) {
  $localPath = Join-Path $manifestRepoRoot ([string]$relativePath)
  $remotePath = "$liveRoot/" + (Convert-ToPosixPath ([string]$relativePath))
  $localHash = (Get-FileHash -Algorithm SHA256 $localPath).Hash.ToUpperInvariant()
  $remoteHash = Get-RemoteSha256 $remotePath
  if ($localHash -ne $remoteHash) {
    throw "Live hash audit failed for $relativePath"
  }
}

foreach ($relativePath in @($manifest.private_content_sync_files)) {
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
}

Assert-RemoteManagedLessonSetConsistent -RepoRootForCheck $manifestRepoRoot
Assert-LiveShellVersion -ExpectedVersion $Version
Invoke-Plink "rm -rf '$stageRoot'" | Out-Null

Write-Host "Pushed prepared build $Version" -ForegroundColor Green
Write-Host "Snapshot: $snapshotPath" -ForegroundColor Green
Write-Host ("Live SHA-256 audit passed for {0} files" -f @($manifest.live_hash_audit_files).Count) -ForegroundColor Green
Write-Host ("Private content SHA-256 audit passed for {0} files" -f @($manifest.private_content_sync_files).Count) -ForegroundColor Green
Write-Host ("Live root: {0}" -f [string]$manifest.live_root_url) -ForegroundColor Green
Write-Host ("Cache-busted launcher: {0}" -f [string]$manifest.live_launcher_url) -ForegroundColor Green
