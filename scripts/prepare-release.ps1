param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [string]$BaselineRef = "origin/main",

  [switch]$AllowDirty,

  [switch]$SyncManagedContentFromLive,

  [switch]$SyncImagePairsFromLive
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$bumpScript = Join-Path $PSScriptRoot "bump-version.ps1"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$puttySession = "DG Putty Settings"
$mirrorRoot = "C:\xampp\htdocs\cones"
$privateContentRoot = "/var/www/telepathyexperiment_private/cones/content"
$localPrivateContentRoot = "C:\xampp\telepathyexperiment_private\cones\content"
$localDeploySyncBackupRoot = "C:\xampp\telepathyexperiment_private\cones\backup\deploy-live-managed-content-sync"
$preparedReleaseRoot = "C:\xampp\telepathyexperiment_private\cones\release-prep"
$preparedReleasePath = Join-Path $preparedReleaseRoot "prepared-release.json"
$imagePairsRoot = Join-Path $repoRoot "imagepairs"
$mirrorImagePairsRoot = Join-Path $mirrorRoot "imagepairs"
$imagePairsSyncScript = Join-Path $PSScriptRoot "sync-imagepairs-from-live.ps1"
$versionPattern = '20\d{6}[A-Za-z][A-Za-z0-9]*'

$deployFiles = @(
  ".htaccess",
  "api.php",
  "clairvoyance_rv_page.jpg",
  "content_repo\esp-lessons.txt",
  "content_repo\learn-more-clairvoyance.txt",
  "content_repo\learn-more-main.txt",
  "content_repo\learning-center-outline.json",
  "content_repo\new-learning-center-outline.json",
  "globe\globe.css",
  "globe\globe.js",
  "globe\index.html",
  "index.html",
  "learning-center-hero.jpg",
  "learning-center-hero.png",
  "performance-visualization.jpg",
  "receiver.html",
  "sender.html",
  "target-selection.js",
  "tada.wav",
  "telepathy.css",
  "telepathy.js",
  "telepathybeginner-email-test.html",
  "telepathybeginner-email-test.js",
  "telepathybeginner-sw.js",
  "telepathybeginner.css",
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathy-difficulty-guide-panel-build.png",
  "telepathybeginner.webmanifest"
)

$newLearningCenterLessonFiles = @()
$newLearningCenterLessonsRoot = Join-Path $repoRoot "content_repo\new-learning-center-lessons"
if (Test-Path -LiteralPath $newLearningCenterLessonsRoot) {
  $newLearningCenterLessonFiles = Get-ChildItem -LiteralPath $newLearningCenterLessonsRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($repoRoot.Length + 1)
    }
}
$deployFiles += $newLearningCenterLessonFiles

$lessonImageAssetFiles = @()
$lessonImageAssetsRoot = Join-Path $repoRoot "assets\lesson-images"
if (Test-Path -LiteralPath $lessonImageAssetsRoot) {
  $lessonImageAssetFiles = Get-ChildItem -LiteralPath $lessonImageAssetsRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($repoRoot.Length + 1)
    }
}
$deployFiles += $lessonImageAssetFiles

$imagePairFiles = @()
$imagePairsRoot = Join-Path $repoRoot "imagepairs"
if (Test-Path -LiteralPath $imagePairsRoot) {
  $imagePairFiles = Get-ChildItem -LiteralPath $imagePairsRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($repoRoot.Length + 1)
    }
}
$deployFiles += $imagePairFiles

$verifyVersionFiles = @(
  "telepathybeginner.css",
  "target-selection.js",
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner-sw.js",
  "telepathybeginner.webmanifest",
  "telepathybeginner-email-test.html",
  "sender.html",
  "receiver.html",
  "telepathy.js",
  "globe\index.html",
  "globe\globe.js"
)

$mirrorVerifyFiles = @(
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.css",
  "target-selection.js",
  "api.php",
  "docs\espgym-live-deployment-runbook.md",
  "scripts\deploy-live.ps1",
  "scripts\prepare-release.ps1",
  "scripts\push-live.ps1"
)

$liveHashAuditFiles = @(
  "telepathybeginner.html",
  "telepathybeginner.js",
  "telepathybeginner.css",
  "telepathybeginner-sw.js",
  "telepathybeginner.webmanifest",
  "telepathy-difficulty-guide-panel-build.png",
  "receiver.html",
  "sender.html",
  "target-selection.js",
  "telepathy.js",
  "telepathy.css",
  "api.php",
  "content_repo\esp-lessons.txt",
  "content_repo\learn-more-clairvoyance.txt",
  "content_repo\learn-more-main.txt",
  "content_repo\learning-center-outline.json",
  "content_repo\new-learning-center-outline.json",
  "index.html",
  "learning-center-hero.jpg",
  "learning-center-hero.png",
  "performance-visualization.jpg",
  ".htaccess",
  "globe\index.html",
  "globe\globe.js",
  "globe\globe.css",
  "clairvoyance_rv_page.jpg",
  "tada.wav"
)
$liveHashAuditFiles += $newLearningCenterLessonFiles
$liveHashAuditFiles += $lessonImageAssetFiles
$liveHashAuditFiles += $imagePairFiles

$privateContentSyncFiles = @(
  "content_repo\new-learning-center-outline.json"
)
$privateContentSyncFiles += $newLearningCenterLessonFiles

$nonDeployPrefixAllowList = @(
  ".git\",
  "docs\",
  "scripts\"
)

$nonDeployExactAllowList = @(
  ".gitignore"
)

$nonDeployExtensionAllowList = @(
  ".md",
  ".ps1"
)

$mojibakeGuardPatterns = @(
  ([string][char]0x00C3),
  ([string][char]0x00E2 + [char]0x20AC + [char]0x2122),
  ([string][char]0x00E2 + [char]0x20AC + [char]0x201C),
  ([string][char]0x00E2 + [char]0x20AC + [char]0x0153),
  ([string][char]0x00E2 + [char]0x20AC),
  ([string][char]0x00C2),
  ([string][char]0x00E2 + [char]0x20AC + [char]0x00A6)
)

$cacheCriticalVersionChecks = @(
  @{
    Path = "telepathybeginner.html"
    RequireExactVersionTokens = $true
    Contains = @(
      "<meta name=`"espgym-build-version`" content=`"{0}`">",
      "telepathybeginner.webmanifest?v={0}",
      "telepathybeginner.css?v={0}",
      "vendor/leaflet/leaflet.css?v={0}",
      "telepathybeginner.js?v={0}"
    )
  },
  @{
    Path = "telepathybeginner.js"
    RequireExactVersionTokens = $true
    Contains = @(
      "const launcherBuildVersion = `"{0}`";",
      "const htmlDeclaredBuildVersion = ",
      "meta[name=`"espgym-build-version`"]"
    )
  },
  @{
    Path = "telepathybeginner-sw.js"
    RequireExactVersionTokens = $true
    Contains = @(
      "const CACHE_NAME = `"telepathybeginner-v{0}`";",
      "const APP_VERSION = `"{0}`";",
      "self.addEventListener(`"message`""
    )
  },
  @{
    Path = "telepathybeginner.webmanifest"
    RequireExactVersionTokens = $true
    Contains = @(
      "`"start_url`": `"./telepathybeginner.html?v={0}`"",
      "`"src`": `"tb-icon-192.png?v={0}`"",
      "`"src`": `"tb-icon-512.png?v={0}`""
    )
  }
)

function Invoke-Plink([string]$Command) {
  & $plinkPath -batch -load $puttySession $Command
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

function Get-NormalizedRelativePath([string]$Path) {
  return (($Path -replace "/", "\").TrimStart("\")).Trim()
}

function Test-IsAllowedNonDeployPath([string]$RelativePath) {
  $normalized = Get-NormalizedRelativePath $RelativePath
  if (-not $normalized) {
    return $true
  }
  if ($nonDeployExactAllowList -contains $normalized) {
    return $true
  }
  foreach ($prefix in $nonDeployPrefixAllowList) {
    if ($normalized.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }
  $extension = [System.IO.Path]::GetExtension($normalized).ToLowerInvariant()
  return $nonDeployExtensionAllowList -contains $extension
}

function Test-IsCoveredDeployPath([string]$RelativePath) {
  $normalized = Get-NormalizedRelativePath $RelativePath
  if (-not $normalized) {
    return $false
  }
  if ($deployFiles -contains $normalized) {
    return $true
  }
  if ($normalized.StartsWith("content_repo\new-learning-center-lessons\", [System.StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  if ($normalized.StartsWith("assets\lesson-images\", [System.StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  if ($normalized.StartsWith("imagepairs\", [System.StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  return $false
}

function Get-VersionTokensFromText([string]$Text) {
  return @([regex]::Matches($Text, $versionPattern) | ForEach-Object { [string]$_.Value } | Sort-Object -Unique)
}

function Assert-CacheVersionCompleteness([string]$RepoRootForCheck, [string]$ExpectedVersion) {
  $issues = New-Object System.Collections.Generic.List[string]

  foreach ($check in $cacheCriticalVersionChecks) {
    $relativePath = [string]$check.Path
    $fullPath = Join-Path $RepoRootForCheck $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
      $issues.Add("Missing cache-critical file: $relativePath")
      continue
    }
    $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8

    foreach ($template in @($check.Contains)) {
      $expectedSnippet = [string]::Format($template, $ExpectedVersion)
      if (-not $content.Contains($expectedSnippet)) {
        $issues.Add("Cache version check missing expected snippet in ${relativePath}: $expectedSnippet")
      }
    }

    if ($check.RequireExactVersionTokens) {
      $tokens = @(Get-VersionTokensFromText $content)
      if ($tokens.Count -eq 0) {
        $issues.Add("Cache version check found no version token in $relativePath")
      } else {
        $unexpected = @($tokens | Where-Object { $_ -ne $ExpectedVersion })
        if ($unexpected.Count -gt 0) {
          $issues.Add("Cache version check found stale version token(s) in ${relativePath}: $($unexpected -join ', ')")
        }
      }
    }
  }

  if ($issues.Count -gt 0) {
    throw ("Cache-busting completeness guard failed:`n" + ($issues -join "`n"))
  }

  Write-Host "Cache-busting completeness guard passed." -ForegroundColor Green
}

function Get-GitChangedFiles([string]$RepoRoot, [string]$BaseRef) {
  $results = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
  $commands = @(
    @("diff", "--name-only"),
    @("diff", "--cached", "--name-only"),
    @("ls-files", "--others", "--exclude-standard")
  )

  if ($BaseRef) {
    $null = git -C $RepoRoot rev-parse --verify $BaseRef 2>$null
    if ($LASTEXITCODE -eq 0) {
      $commands = ,@("diff", "--name-only", "$BaseRef..HEAD") + $commands
    } else {
      Write-Host "WARNING: Baseline ref '$BaseRef' was not found. Proceeding without baseline diff coverage." -ForegroundColor Yellow
    }
  }

  foreach ($commandParts in $commands) {
    $output = & git -C $RepoRoot @commandParts
    foreach ($line in @($output)) {
      $normalized = Get-NormalizedRelativePath ([string]$line)
      if ($normalized) {
        [void]$results.Add($normalized)
      }
    }
  }

  return @($results | Sort-Object)
}

function Assert-DeployCoverage([string[]]$ChangedFiles) {
  $deployRelevantChanged = New-Object System.Collections.Generic.List[string]
  $blocked = New-Object System.Collections.Generic.List[string]
  $ignored = New-Object System.Collections.Generic.List[string]

  foreach ($relativePath in $ChangedFiles) {
    if (Test-IsAllowedNonDeployPath $relativePath) {
      $ignored.Add($relativePath)
      continue
    }
    $deployRelevantChanged.Add($relativePath)
    if (-not (Test-IsCoveredDeployPath $relativePath)) {
      $blocked.Add($relativePath)
    }
  }

  if ($deployRelevantChanged.Count -gt 0) {
    Write-Host "Deploy-relevant changed files detected:" -ForegroundColor Cyan
    $deployRelevantChanged | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
  }
  if ($ignored.Count -gt 0) {
    Write-Host "Ignored non-deploy changed files:" -ForegroundColor DarkGray
    $ignored | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
  }
  if ($blocked.Count -gt 0) {
    throw ("Deploy completeness guard failed. These changed deploy-relevant files are not covered by the authoritative deploy set:`n" + ($blocked -join "`n"))
  }
}

function Convert-ToPrivateContentPath([string]$RelativePath) {
  $normalized = ($RelativePath -replace "\\", "/")
  if ($normalized -eq "content_repo/new-learning-center-outline.json") {
    return "$privateContentRoot/new-learning-center-outline.json"
  }
  if ($normalized -like "content_repo/new-learning-center-lessons/*") {
    $suffix = $normalized.Substring("content_repo/new-learning-center-lessons/".Length)
    return "$privateContentRoot/new-learning-center-lessons/$suffix"
  }
  return ""
}

function Convert-ToLocalPrivateContentPath([string]$RelativePath) {
  $normalized = ($RelativePath -replace "/", "\")
  if ($normalized -eq "content_repo\new-learning-center-outline.json") {
    return Join-Path $localPrivateContentRoot "new-learning-center-outline.json"
  }
  if ($normalized -like "content_repo\new-learning-center-lessons\*") {
    $suffix = $normalized.Substring("content_repo\new-learning-center-lessons\".Length)
    return Join-Path (Join-Path $localPrivateContentRoot "new-learning-center-lessons") $suffix
  }
  return ""
}

function Assert-LocalPrivateContentInSync([string[]]$RelativePaths) {
  $mismatches = New-Object System.Collections.Generic.List[string]
  foreach ($relativePath in $RelativePaths) {
    $localPrivatePath = Convert-ToLocalPrivateContentPath $relativePath
    if (-not $localPrivatePath) {
      continue
    }
    $repoPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $repoPath)) {
      $mismatches.Add("Missing repo content file: $repoPath")
      continue
    }
    if (-not (Test-Path -LiteralPath $localPrivatePath)) {
      $mismatches.Add("Missing local private content file: $localPrivatePath")
      continue
    }
    $repoHash = (Get-FileHash -Algorithm SHA256 $repoPath).Hash
    $privateHash = (Get-FileHash -Algorithm SHA256 $localPrivatePath).Hash
    if ($repoHash -ne $privateHash) {
      $mismatches.Add("Content drift detected for $relativePath`n  repo:    $repoPath`n  private: $localPrivatePath")
    }
  }
  if ($mismatches.Count -gt 0) {
    throw ("Local new-course content drift detected before prepare. Resolve repo/private mismatch first:`n" + ($mismatches -join "`n"))
  }
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

function Get-OutlineLessonPageIdsFromFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing outline file: $Path"
  }
  $jsonText = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  return Get-OutlineLessonPageIdsFromJsonText $jsonText
}

function Get-RemoteTextFile([string]$RemotePath) {
  $output = Invoke-Plink "cat '$RemotePath'"
  return (@($output) -join "`n")
}

function Write-Utf8NoBomFile([string]$Path, [string]$Content) {
  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
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

function Assert-LocalManagedLessonSetConsistent() {
  $repoOutlinePath = Join-Path $repoRoot "content_repo\new-learning-center-outline.json"
  $privateOutlinePath = Join-Path $localPrivateContentRoot "new-learning-center-outline.json"
  $expectedIds = Get-OutlineLessonPageIdsFromFile $repoOutlinePath
  $privateIds = Get-OutlineLessonPageIdsFromFile $privateOutlinePath
  $issues = New-Object System.Collections.Generic.List[string]

  if ((@($expectedIds) -join "|") -ne (@($privateIds) -join "|")) {
    $issues.Add("Repo outline and local private outline differ in lesson ids.")
  }

  foreach ($lessonId in $expectedIds) {
    $repoLessonPath = Join-Path $repoRoot ("content_repo\new-learning-center-lessons\{0}.txt" -f $lessonId)
    $privateLessonPath = Join-Path $localPrivateContentRoot ("new-learning-center-lessons\{0}.txt" -f $lessonId)
    if (-not (Test-Path -LiteralPath $repoLessonPath)) {
      $issues.Add("Repo outline references missing lesson file: $repoLessonPath")
    }
    if (-not (Test-Path -LiteralPath $privateLessonPath)) {
      $issues.Add("Local private outline references missing lesson file: $privateLessonPath")
    }
  }

  if ($issues.Count -gt 0) {
    throw ("Local managed lesson-set verification failed:`n" + ($issues -join "`n"))
  }

  Write-Host ("Local lesson-set verification passed for {0} outline lessons" -f $expectedIds.Count) -ForegroundColor Green
}

function Get-LocalManagedContentState() {
  $state = @{}
  $outlinePath = Join-Path $localPrivateContentRoot "new-learning-center-outline.json"
  if (Test-Path -LiteralPath $outlinePath) {
    $state["new-learning-center-outline.json"] = (Get-FileHash -Algorithm SHA256 $outlinePath).Hash.ToUpperInvariant()
  }
  $lessonsRoot = Join-Path $localPrivateContentRoot "new-learning-center-lessons"
  if (Test-Path -LiteralPath $lessonsRoot) {
    Get-ChildItem -LiteralPath $lessonsRoot -File -Filter *.txt | ForEach-Object {
      $relativeKey = "new-learning-center-lessons/{0}" -f $_.Name
      $state[$relativeKey] = (Get-FileHash -Algorithm SHA256 $_.FullName).Hash.ToUpperInvariant()
    }
  }
  return $state
}

function Get-RemoteManagedContentState() {
  $state = @{}
  $remoteCommand = @"
python3 - <<'PY'
import hashlib
import os
paths = [r'''$privateContentRoot/new-learning-center-outline.json''']
lessons_root = r'''$privateContentRoot/new-learning-center-lessons'''
for path in paths:
    if os.path.isfile(path):
        with open(path, 'rb') as fh:
            print(hashlib.sha256(fh.read()).hexdigest(), path)
if os.path.isdir(lessons_root):
    for name in sorted(os.listdir(lessons_root)):
        if not name.endswith('.txt'):
            continue
        lesson_path = os.path.join(lessons_root, name)
        if not os.path.isfile(lesson_path):
            continue
        with open(lesson_path, 'rb') as fh:
            print(hashlib.sha256(fh.read()).hexdigest(), lesson_path)
PY
"@
  $output = Invoke-Plink $remoteCommand
  foreach ($line in @($output)) {
    $trimmed = ([string]$line).Trim()
    if (-not $trimmed) {
      continue
    }
    $parts = $trimmed -split '\s+', 2
    if ($parts.Count -ne 2) {
      continue
    }
    $hash = $parts[0].ToUpperInvariant()
    $path = $parts[1].Trim()
    if ($path -eq "$privateContentRoot/new-learning-center-outline.json") {
      $state["new-learning-center-outline.json"] = $hash
      continue
    }
    $lessonPrefix = "$privateContentRoot/new-learning-center-lessons/"
    if ($path.StartsWith($lessonPrefix, [System.StringComparison]::Ordinal)) {
      $suffix = $path.Substring($lessonPrefix.Length)
      $state["new-learning-center-lessons/$suffix"] = $hash
    }
  }
  return $state
}

function Get-ManagedContentDriftSummary([hashtable]$LocalState, [hashtable]$RemoteState) {
  $drift = New-Object System.Collections.Generic.List[string]

  foreach ($key in @($RemoteState.Keys | Sort-Object)) {
    if (-not $LocalState.ContainsKey($key)) {
      $drift.Add("$key (exists on live authoritative content but not locally)")
      continue
    }
    if ($LocalState[$key] -ne $RemoteState[$key]) {
      $drift.Add("$key (local authoritative content differs from live authoritative content)")
    }
  }

  foreach ($key in @($LocalState.Keys | Sort-Object)) {
    if (-not $RemoteState.ContainsKey($key)) {
      $drift.Add("$key (exists locally but not on live authoritative content)")
    }
  }

  return @($drift | Sort-Object -Unique)
}

function Report-RemoteManagedContentDrift() {
  $localState = Get-LocalManagedContentState
  $remoteState = Get-RemoteManagedContentState
  $drift = @(Get-ManagedContentDriftSummary -LocalState $localState -RemoteState $remoteState)
  if (@($drift).Count -eq 0) {
    Write-Host "Managed lesson content matches live authoritative content." -ForegroundColor Green
    return
  }

  Write-Host "Managed lesson content drift detected between local authoritative content and live authoritative content." -ForegroundColor Yellow
  Write-Host "Normal deploy will promote local authoritative content upward; it will not pull live content down automatically." -ForegroundColor Yellow
  $drift | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor Yellow }
  Write-Host "If you intend to recover live content back into local authoritative files, re-run prepare-release with -SyncManagedContentFromLive." -ForegroundColor Yellow
}

function Get-LocalImagePairsState([string]$Root) {
  $state = @{}
  if (Test-Path -LiteralPath $Root) {
    Get-ChildItem -LiteralPath $Root -File | ForEach-Object {
      $state[$_.Name] = (Get-FileHash -Algorithm SHA256 $_.FullName).Hash.ToUpperInvariant()
    }
  }
  return $state
}

function Get-RemoteImagePairsState() {
  $remoteCommand = @"
python3 - <<'PY'
import hashlib, os
root = r'''/var/www/telepathyexperiment/cones/imagepairs'''
if os.path.isdir(root):
    for name in sorted(os.listdir(root)):
        path = os.path.join(root, name)
        if not os.path.isfile(path):
            continue
        with open(path, 'rb') as fh:
            print(hashlib.sha256(fh.read()).hexdigest().upper(), name)
PY
"@
  $output = Invoke-Plink $remoteCommand
  $state = @{}
  foreach ($line in @($output)) {
    $trimmed = ([string]$line).Trim()
    if (-not $trimmed) {
      continue
    }
    $parts = $trimmed -split '\s+', 2
    if ($parts.Count -ne 2) {
      continue
    }
    $state[$parts[1].Trim()] = $parts[0].Trim().ToUpperInvariant()
  }
  return $state
}

function Get-ImagePairsDriftSummary([hashtable]$LocalState, [hashtable]$RemoteState) {
  $drift = New-Object System.Collections.Generic.List[string]
  foreach ($name in @($RemoteState.Keys | Sort-Object)) {
    if (-not $LocalState.ContainsKey($name)) {
      $drift.Add("$name (exists on live imagepairs but not locally)")
      continue
    }
    if ($LocalState[$name] -ne $RemoteState[$name]) {
      $drift.Add("$name (local imagepairs file differs from live)")
    }
  }
  foreach ($name in @($LocalState.Keys | Sort-Object)) {
    if (-not $RemoteState.ContainsKey($name)) {
      $drift.Add("$name (exists locally in imagepairs but not live)")
    }
  }
  return @($drift | Sort-Object -Unique)
}

function Report-RemoteImagePairsDrift() {
  $localState = Get-LocalImagePairsState $imagePairsRoot
  $remoteState = Get-RemoteImagePairsState
  $drift = @(Get-ImagePairsDriftSummary -LocalState $localState -RemoteState $remoteState)
  return $drift
}

function Sync-RemoteManagedContentToLocalAuthoritative() {
  $localState = Get-LocalManagedContentState
  $remoteState = Get-RemoteManagedContentState
  $drift = @(Get-ManagedContentDriftSummary -LocalState $localState -RemoteState $remoteState)

  if (@($drift).Count -eq 0) {
    Write-Host "Managed lesson content already matches live server state." -ForegroundColor Green
    return
  }

  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  $backupRoot = Join-Path $localDeploySyncBackupRoot $timestamp
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

  $remoteOutlineText = Get-RemoteTextFile "$privateContentRoot/new-learning-center-outline.json"
  $remoteLessonIds = Get-OutlineLessonPageIdsFromJsonText $remoteOutlineText
  $repoOutlinePath = Join-Path $repoRoot "content_repo\new-learning-center-outline.json"
  $privateOutlinePath = Join-Path $localPrivateContentRoot "new-learning-center-outline.json"

  foreach ($path in @($repoOutlinePath, $privateOutlinePath)) {
    if (Test-Path -LiteralPath $path) {
      $backupPath = Join-Path $backupRoot ($path.Substring(3) -replace "[:]", "")
      $backupDirectory = Split-Path -Parent $backupPath
      if ($backupDirectory -and -not (Test-Path -LiteralPath $backupDirectory)) {
        New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
      }
      Copy-Item -LiteralPath $path -Destination $backupPath -Force
    }
  }

  Write-Utf8NoBomFile $repoOutlinePath $remoteOutlineText
  Write-Utf8NoBomFile $privateOutlinePath $remoteOutlineText

  $repoLessonsRoot = Join-Path $repoRoot "content_repo\new-learning-center-lessons"
  $privateLessonsRoot = Join-Path $localPrivateContentRoot "new-learning-center-lessons"
  foreach ($root in @($repoLessonsRoot, $privateLessonsRoot)) {
    if (-not (Test-Path -LiteralPath $root)) {
      New-Item -ItemType Directory -Path $root -Force | Out-Null
    }
  }

  foreach ($lessonId in $remoteLessonIds) {
    $remoteLessonText = Get-RemoteTextFile "$privateContentRoot/new-learning-center-lessons/$lessonId.txt"
    $repoLessonPath = Join-Path $repoLessonsRoot "$lessonId.txt"
    $privateLessonPath = Join-Path $privateLessonsRoot "$lessonId.txt"
    foreach ($path in @($repoLessonPath, $privateLessonPath)) {
      if (Test-Path -LiteralPath $path) {
        $backupPath = Join-Path $backupRoot ($path.Substring(3) -replace "[:]", "")
        $backupDirectory = Split-Path -Parent $backupPath
        if ($backupDirectory -and -not (Test-Path -LiteralPath $backupDirectory)) {
          New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
        }
        Copy-Item -LiteralPath $path -Destination $backupPath -Force
      }
    }
    Write-Utf8NoBomFile $repoLessonPath $remoteLessonText
    Write-Utf8NoBomFile $privateLessonPath $remoteLessonText
  }

  $expectedFileNames = @($remoteLessonIds | ForEach-Object { "$_.txt" })
  foreach ($root in @($repoLessonsRoot, $privateLessonsRoot)) {
    Get-ChildItem -LiteralPath $root -File -Filter *.txt | ForEach-Object {
      if ($expectedFileNames -notcontains $_.Name) {
        $backupPath = Join-Path $backupRoot ($_.FullName.Substring(3) -replace "[:]", "")
        $backupDirectory = Split-Path -Parent $backupPath
        if ($backupDirectory -and -not (Test-Path -LiteralPath $backupDirectory)) {
          New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
        }
        Copy-Item -LiteralPath $_.FullName -Destination $backupPath -Force
        Remove-Item -LiteralPath $_.FullName -Force
      }
    }
  }

  Write-Host ("Managed lesson content pulled from live server into local authoritative files. Backup: {0}" -f $backupRoot) -ForegroundColor Yellow
}

function Test-IsTextDeployFile([string]$RelativePath) {
  $extension = [System.IO.Path]::GetExtension($RelativePath)
  return @(".html", ".js", ".css", ".json", ".php", ".txt", ".md", ".webmanifest", ".htaccess") -contains $extension.ToLowerInvariant()
}

function Assert-NoMojibakeInDeployFiles([string[]]$RelativePaths) {
  $hits = New-Object System.Collections.Generic.List[string]
  foreach ($relativePath in $RelativePaths) {
    if (-not (Test-IsTextDeployFile $relativePath)) {
      continue
    }
    $fullPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
      continue
    }
    $content = Get-Content -LiteralPath $fullPath -Raw -Encoding UTF8
    foreach ($pattern in $mojibakeGuardPatterns) {
      if ($content.Contains($pattern)) {
        $hits.Add(("{0} contains suspicious text pattern [{1}]" -f $relativePath, $pattern))
      }
    }
  }
  if ($hits.Count -gt 0) {
    throw ("Mojibake guard failed:`n" + ($hits -join "`n"))
  }
}

function Get-PreparedFileHashes([string[]]$RelativePaths) {
  $hashRows = @()
  foreach ($relativePath in ($RelativePaths | Sort-Object -Unique)) {
    $fullPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
      throw "Missing prepared file: $fullPath"
    }
    $hashRows += [pscustomobject]@{
      path = $relativePath
      sha256 = (Get-FileHash -Algorithm SHA256 $fullPath).Hash.ToUpperInvariant()
    }
  }
  return $hashRows
}

if (-not (Test-Path -LiteralPath $bumpScript)) {
  throw "Missing bump script: $bumpScript"
}
if (-not (Test-Path -LiteralPath $imagePairsSyncScript)) {
  throw "Missing imagepairs sync script: $imagePairsSyncScript"
}

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
Write-Host "Before trusting this release prep, confirm the outgoing diff against the last live baseline." -ForegroundColor Yellow
Write-Host "Suggested commands:" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot status --short" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot diff --stat <last-live-baseline>..HEAD" -ForegroundColor Yellow
Write-Host "  git -C $repoRoot diff --name-only <last-live-baseline>..HEAD" -ForegroundColor Yellow
if ($AllowDirty) {
  Write-Host "WARNING: -AllowDirty is in use. Also review uncommitted working-tree diffs before accepting this release boundary." -ForegroundColor Yellow
  Write-Host "  git -C $repoRoot diff --stat" -ForegroundColor Yellow
  Write-Host "  git -C $repoRoot diff --name-only" -ForegroundColor Yellow
}

$changedFiles = Get-GitChangedFiles -RepoRoot $repoRoot -BaseRef $BaselineRef
Assert-DeployCoverage $changedFiles

foreach ($relativePath in $deployFiles) {
  $fullPath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing deploy file: $fullPath"
  }
}

Assert-NoMojibakeInDeployFiles $deployFiles
Assert-LocalPrivateContentInSync $privateContentSyncFiles
Assert-LocalManagedLessonSetConsistent
if ($SyncManagedContentFromLive) {
  Sync-RemoteManagedContentToLocalAuthoritative
  Assert-LocalPrivateContentInSync $privateContentSyncFiles
  Assert-LocalManagedLessonSetConsistent
} else {
  Report-RemoteManagedContentDrift
}
if ($SyncImagePairsFromLive) {
  & powershell -ExecutionPolicy Bypass -File $imagePairsSyncScript
  if ($LASTEXITCODE -ne 0) {
    throw "Live imagepairs sync failed."
  }
} else {
  $imagePairsDrift = @(Report-RemoteImagePairsDrift)
  if ($imagePairsDrift.Count -eq 0) {
    Write-Host "Imagepairs folder matches live authoritative state." -ForegroundColor Green
  } else {
    Write-Host "Imagepairs drift detected between local folders and the live authoritative imagepairs state." -ForegroundColor Yellow
    $imagePairsDrift | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor Yellow }
    Write-Host "Normal release prep will now sync live imagepairs down automatically before continuing." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File $imagePairsSyncScript
    if ($LASTEXITCODE -ne 0) {
      throw "Automatic live imagepairs sync failed."
    }
  }
}

& powershell -ExecutionPolicy Bypass -File $bumpScript -Version $Version
Assert-CacheVersionCompleteness -RepoRootForCheck $repoRoot -ExpectedVersion $Version

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

New-Item -ItemType Directory -Path $preparedReleaseRoot -Force | Out-Null

$manifest = [ordered]@{
  schema = 1
  prepared_at = (Get-Date).ToString("o")
  version = $Version
  baseline_ref = $BaselineRef
  allow_dirty = [bool]$AllowDirty
  sync_managed_content_from_live = [bool]$SyncManagedContentFromLive
  sync_imagepairs_from_live = [bool]$SyncImagePairsFromLive
  repo_root = $repoRoot
  mirror_root = $mirrorRoot
  local_test_url = "http://localhost/telepathyexperiment/cones/telepathybeginner.html?v=$Version&open=launcher"
  live_root_url = "https://espgym.com/"
  live_launcher_url = "https://espgym.com/telepathybeginner.html?v=$Version&open=launcher"
  changed_files = @($changedFiles)
  deploy_files = @($deployFiles | Sort-Object -Unique)
  verify_version_files = @($verifyVersionFiles | Sort-Object -Unique)
  live_hash_audit_files = @($liveHashAuditFiles | Sort-Object -Unique)
  private_content_sync_files = @($privateContentSyncFiles | Sort-Object -Unique)
  local_hashes = @(Get-PreparedFileHashes $deployFiles)
}

$manifestJson = $manifest | ConvertTo-Json -Depth 6
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($preparedReleasePath, $manifestJson, $utf8NoBom)

Write-Host ""
Write-Host "Prepared release $Version" -ForegroundColor Green
Write-Host "Prepared manifest: $preparedReleasePath" -ForegroundColor Green
Write-Host "Mirror synced: $mirrorRoot" -ForegroundColor Green
Write-Host ("Deploy file count: {0}" -f $manifest.deploy_files.Count) -ForegroundColor Green
Write-Host ("Cache-busted local launcher: {0}" -f $manifest.local_test_url) -ForegroundColor Green
Write-Host ""
Write-Host "Next step:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\push-live.ps1 -Version $Version" -ForegroundColor Cyan
