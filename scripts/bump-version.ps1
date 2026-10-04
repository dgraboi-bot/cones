param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [string]$MirrorRoot = "C:\xampp\htdocs\cones",

  [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$versionPattern = '20\d{6}[A-Za-z][A-Za-z0-9._-]*'

function Assert-FileWritable([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing ${Label}: $Path"
  }
  $stream = $null
  try {
    $stream = [System.IO.File]::Open(
      $Path,
      [System.IO.FileMode]::Open,
      [System.IO.FileAccess]::ReadWrite,
      [System.IO.FileShare]::ReadWrite
    )
  } catch {
    throw "Preflight cannot open $Label for writing: $Path`n$($_.Exception.Message)"
  } finally {
    if ($null -ne $stream) {
      $stream.Dispose()
    }
  }
}

$files = @(
  (Join-Path $root ".htaccess"),
  (Join-Path $root "index.html"),
  (Join-Path $root "telepathybeginner.css"),
  (Join-Path $root "target-selection.js"),
  (Join-Path $root "telepathybeginner.html"),
  (Join-Path $root "telepathybeginner.js"),
  (Join-Path $root "telepathybeginner-sw.js"),
  (Join-Path $root "telepathybeginner.webmanifest"),
  (Join-Path $root "telepathybeginner-email-test.html"),
  (Join-Path $root "sender.html"),
  (Join-Path $root "receiver.html"),
  (Join-Path $root "telepathy.js"),
  (Join-Path $root "globe\index.html"),
  (Join-Path $root "globe\globe.js")
)

$versionRequiredFiles = @(
  (Join-Path $root "telepathybeginner.css"),
  (Join-Path $root "target-selection.js"),
  (Join-Path $root "telepathybeginner.html"),
  (Join-Path $root "telepathybeginner.js"),
  (Join-Path $root "telepathybeginner-sw.js"),
  (Join-Path $root "telepathybeginner.webmanifest"),
  (Join-Path $root "telepathybeginner-email-test.html"),
  (Join-Path $root "sender.html"),
  (Join-Path $root "receiver.html"),
  (Join-Path $root "telepathy.js"),
  (Join-Path $root "globe\index.html"),
  (Join-Path $root "globe\globe.js")
)

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

# Verify every source and matching mirror file before changing any version marker.
foreach ($file in $files) {
  $relativePath = $file.Substring($root.Length).TrimStart('\', '/')
  $mirrorFile = Join-Path $MirrorRoot $relativePath
  Assert-FileWritable $file "source file"
  Assert-FileWritable $mirrorFile "mirror file"
}

if ($PreflightOnly) {
  Write-Host "Release write preflight passed for all version-bearing source and mirror files."
  exit 0
}

$previousVersions = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($file in $files) {
  $content = Get-Content -Raw -LiteralPath $file
  foreach ($match in [regex]::Matches($content, $versionPattern)) {
    $candidate = [string]$match.Value
    if ($candidate -and $candidate -ne $Version) {
      [void]$previousVersions.Add($candidate)
    }
  }
}

$replacements = @{
  (Join-Path $root ".htaccess") = @(
    @{ Pattern = 'https://espgym\.com/telepathybeginner\.html\?(?:v=[^&\s]+&)?open=landing'; Replacement = "https://espgym.com/telepathybeginner.html?v=$Version&open=landing" },
    @{ Pattern = 'https://espgym\.com/telepathybeginner\.html\?v=[^&\s]+&open=landing'; Replacement = "https://espgym.com/telepathybeginner.html?v=$Version&open=landing" },
    @{ Pattern = 'https://espgym\.com/telepathybeginner\.html\?v=[^&\s]+&open=remote-device'; Replacement = "https://espgym.com/telepathybeginner.html?v=$Version&open=remote-device" }
  )
  (Join-Path $root "index.html") = @(
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"''\s]+(?:&amp;|&)open=landing'; Replacement = "telepathybeginner.html?v=$Version&open=landing" },
    @{ Pattern = 'telepathybeginner\.html\?open=landing'; Replacement = "telepathybeginner.html?v=$Version&open=landing" }
  )
  (Join-Path $root "telepathybeginner.css") = @(
    @{ Pattern = 'learning-center-hero\.(png|jpg)\?v=[^)"''\s]+'; Replacement = "learning-center-hero.jpg?v=$Version" }
  )
  (Join-Path $root "telepathybeginner.html") = @(
    @{ Pattern = '<meta name="espgym-build-version" content="[^"]+">'; Replacement = "<meta name=`"espgym-build-version`" content=`"$Version`">" },
    @{ Pattern = 'telepathybeginner\.webmanifest\?v=[^"]+'; Replacement = "telepathybeginner.webmanifest?v=$Version" },
    @{ Pattern = 'tb-icon-192\.png\?v=[^"]+'; Replacement = "tb-icon-192.png?v=$Version" },
    @{ Pattern = 'telepathybeginner\.css\?v=[^"]+'; Replacement = "telepathybeginner.css?v=$Version" },
    @{ Pattern = 'vendor/leaflet/leaflet\.css\?v=[^"]+'; Replacement = "vendor/leaflet/leaflet.css?v=$Version" },
    @{ Pattern = '(<span class="beginner-top-version" data-app-version-label>)ver\. [A-Za-z0-9._-]+(</span>)'; Replacement = "`$1ver. $Version`$2" },
    @{ Pattern = 'var buildVersion = "[A-Za-z0-9._-]+";'; Replacement = "var buildVersion = `"$Version`";" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=baseline-questions'; Replacement = "telepathybeginner.html?v=$Version`$1open=baseline-questions" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=after-first-session-questions'; Replacement = "telepathybeginner.html?v=$Version`$1open=after-first-session-questions" },
    @{ Pattern = '(BeginnerUserManual_preserved_[^?''" ]+\.html)\?v=[^''"]+'; Replacement = "`$1?v=$Version" },
    @{ Pattern = 'telepathybeginner-email-test\.html\?v=[^'']+'; Replacement = "telepathybeginner-email-test.html?v=$Version" },
    @{ Pattern = 'telepathy-difficulty-guide-panel-build\.png\?v=[^"]+'; Replacement = "telepathy-difficulty-guide-panel-build.png?v=$Version" },
    @{ Pattern = 'vendor/leaflet/leaflet\.js\?v=[^"]+'; Replacement = "vendor/leaflet/leaflet.js?v=$Version" },
    @{ Pattern = 'target-selection\.js\?v=[^"]+'; Replacement = "target-selection.js?v=$Version" },
    @{ Pattern = 'telepathybeginner\.js\?v=[^"]+'; Replacement = "telepathybeginner.js?v=$Version" }
  )
  (Join-Path $root "target-selection.js") = @(
    @{ Pattern = 'buildVersion: "[^"]+"'; Replacement = "buildVersion: `"$Version`"" }
  )
  (Join-Path $root "telepathybeginner.js") = @(
    @{ Pattern = 'const launcherBuildVersion = "[^"]+";'; Replacement = "const launcherBuildVersion = `"$Version`";" }
  )
  (Join-Path $root "telepathybeginner-sw.js") = @(
    @{ Pattern = 'const CACHE_NAME = "telepathybeginner-v[^"]+";'; Replacement = "const CACHE_NAME = `"telepathybeginner-v$Version`";" },
    @{ Pattern = 'const APP_VERSION = "[^"]+";'; Replacement = "const APP_VERSION = `"$Version`";" },
    @{ Pattern = 'BeginnerUserManual\.html\?v=[^"''`\s]+'; Replacement = "BeginnerUserManual.html?v=$Version" }
  )
  (Join-Path $root "telepathybeginner.webmanifest") = @(
    @{ Pattern = '"tb-icon-192\.png\?v=[^"]+"'; Replacement = "`"tb-icon-192.png?v=$Version`"" },
    @{ Pattern = '"tb-icon-512\.png\?v=[^"]+"'; Replacement = "`"tb-icon-512.png?v=$Version`"" }
  )
  (Join-Path $root "telepathybeginner-email-test.html") = @(
    @{ Pattern = 'telepathybeginner\.css\?v=[^"]+'; Replacement = "telepathybeginner.css?v=$Version" },
    @{ Pattern = 'telepathybeginner-email-test\.js\?v=[^"]+'; Replacement = "telepathybeginner-email-test.js?v=$Version" }
  )
  (Join-Path $root "sender.html") = @(
    @{ Pattern = 'telepathy\.css\?v=[^"]+'; Replacement = "telepathy.css?v=$Version" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=launcher'; Replacement = "telepathybeginner.html?v=$Version`$1open=launcher" },
    @{ Pattern = 'target-selection\.js\?v=[^"]+'; Replacement = "target-selection.js?v=$Version" },
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "receiver.html") = @(
    @{ Pattern = 'telepathy\.css\?v=[^"]+'; Replacement = "telepathy.css?v=$Version" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=launcher'; Replacement = "telepathybeginner.html?v=$Version`$1open=launcher" },
    @{ Pattern = 'target-selection\.js\?v=[^"]+'; Replacement = "target-selection.js?v=$Version" },
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "telepathy.js") = @(
    @{ Pattern = 'const runtimeBuildVersion = "[^"]+";'; Replacement = "const runtimeBuildVersion = `"$Version`";" },
    @{ Pattern = 'const launcherBuildVersion = "[^"]+";'; Replacement = "const launcherBuildVersion = `"$Version`";" },
    @{ Pattern = 'params\.set\("v", "[A-Za-z0-9._-]+"\);'; Replacement = "params.set(`"v`", `"$Version`");" }
  )
  (Join-Path $root "globe\index.html") = @(
    @{ Pattern = 'globe\.css\?v=[^"]+'; Replacement = "globe.css?v=$Version" },
    @{ Pattern = '(<span class="globe-version">)ver\. [A-Za-z0-9._-]+(</span>)'; Replacement = "`$1ver. $Version`$2" },
    @{ Pattern = 'globe-config\.js\?v=[^"]+'; Replacement = "globe-config.js?v=$Version" },
    @{ Pattern = 'globe-data\.js\?v=[^"]+'; Replacement = "globe-data.js?v=$Version" },
    @{ Pattern = 'globe-ui\.js\?v=[^"]+'; Replacement = "globe-ui.js?v=$Version" },
    @{ Pattern = 'globe\.js\?v=[^"]+'; Replacement = "globe.js?v=$Version" }
  )
  (Join-Path $root "globe\globe.js") = @(
    @{ Pattern = 'query\.version \|\| "[^"]+"'; Replacement = "query.version || `"$Version`"" }
  )
}

foreach ($file in $files) {
  $originalContent = Get-Content -Raw -LiteralPath $file
  $content = $originalContent
  foreach ($rule in $replacements[$file]) {
    $content = [regex]::Replace($content, $rule.Pattern, $rule.Replacement)
  }
  if ($content -ne $originalContent) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
  }
}

$missingVersion = @()
foreach ($file in $versionRequiredFiles) {
  $content = Get-Content -Raw -LiteralPath $file
  if ($content -notmatch [regex]::Escape($Version)) {
    $missingVersion += $file
  }
}

if ($missingVersion.Count -gt 0) {
  $missingDetails = $missingVersion -join "`n"
  throw "Bump validation failed. New version $Version was not found in:`n$missingDetails"
}

$staleHits = @()
foreach ($file in $files) {
  $content = Get-Content -Raw -LiteralPath $file
  foreach ($oldVersion in $previousVersions) {
    $stalePattern = "(?<![A-Za-z0-9._-])" + [regex]::Escape($oldVersion) + "(?![A-Za-z0-9._-])"
    foreach ($match in [regex]::Matches($content, $stalePattern)) {
      if ($match.Success) {
        $staleHits += [pscustomobject]@{
          File = $file
          Version = $oldVersion
        }
      }
    }
  }
}

if ($staleHits.Count -gt 0) {
  $details = $staleHits | ForEach-Object { "$($_.Version) :: $($_.File)" }
  $staleDetails = $details -join "`n"
  throw "Bump validation failed. Stale version markers remain:`n$staleDetails"
}

Write-Host "Updated app version to $Version"
