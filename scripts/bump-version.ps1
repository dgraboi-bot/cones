param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$versionPattern = '20\d{6}[A-Za-z0-9]+'

$files = @(
  (Join-Path $root ".htaccess"),
  (Join-Path $root "index.html"),
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
    @{ Pattern = 'https://espgym\.com/telepathybeginner\.html\?(?:v=[^&\s]+&)?open=landing'; Replacement = "https://espgym.com/telepathybeginner.html?open=landing" },
    @{ Pattern = 'https://espgym\.com/telepathybeginner\.html\?v=[^&\s]+&open=landing'; Replacement = "https://espgym.com/telepathybeginner.html?open=landing" }
  )
  (Join-Path $root "index.html") = @(
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"''\s]+(?:&amp;|&)open=landing'; Replacement = "telepathybeginner.html?open=landing" },
    @{ Pattern = 'telepathybeginner\.html\?open=landing'; Replacement = "telepathybeginner.html?open=landing" }
  )
  (Join-Path $root "telepathybeginner.html") = @(
    @{ Pattern = 'telepathybeginner\.webmanifest\?v=[^"]+'; Replacement = "telepathybeginner.webmanifest?v=$Version" },
    @{ Pattern = 'tb-icon-192\.png\?v=[^"]+'; Replacement = "tb-icon-192.png?v=$Version" },
    @{ Pattern = 'telepathybeginner\.css\?v=[^"]+'; Replacement = "telepathybeginner.css?v=$Version" },
    @{ Pattern = 'vendor/leaflet/leaflet\.css\?v=[^"]+'; Replacement = "vendor/leaflet/leaflet.css?v=$Version" },
    @{ Pattern = '(<span class="beginner-top-version" data-app-version-label>)ver\. [A-Za-z0-9]+(</span>)'; Replacement = "`$1ver. $Version`$2" },
    @{ Pattern = 'var buildVersion = "[A-Za-z0-9]+";'; Replacement = "var buildVersion = `"$Version`";" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=baseline-questions'; Replacement = "telepathybeginner.html?v=$Version`$1open=baseline-questions" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=after-first-session-questions'; Replacement = "telepathybeginner.html?v=$Version`$1open=after-first-session-questions" },
    @{ Pattern = '(BeginnerUserManual_preserved_[^?''" ]+\.html)\?v=[^''"]+'; Replacement = "`$1?v=$Version" },
    @{ Pattern = 'telepathybeginner-email-test\.html\?v=[^'']+'; Replacement = "telepathybeginner-email-test.html?v=$Version" },
    @{ Pattern = 'vendor/leaflet/leaflet\.js\?v=[^"]+'; Replacement = "vendor/leaflet/leaflet.js?v=$Version" },
    @{ Pattern = 'telepathybeginner\.js\?v=[^"]+'; Replacement = "telepathybeginner.js?v=$Version" }
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
    @{ Pattern = '"start_url": "\./telepathybeginner\.html\?v=[^"]+"'; Replacement = "`"start_url`": `"./telepathybeginner.html?v=$Version`"" },
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
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "receiver.html") = @(
    @{ Pattern = 'telepathy\.css\?v=[^"]+'; Replacement = "telepathy.css?v=$Version" },
    @{ Pattern = 'telepathybeginner\.html\?v=[^&"'';]+(&amp;|&)open=launcher'; Replacement = "telepathybeginner.html?v=$Version`$1open=launcher" },
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "telepathy.js") = @(
    @{ Pattern = 'const runtimeBuildVersion = "[^"]+";'; Replacement = "const runtimeBuildVersion = `"$Version`";" },
    @{ Pattern = 'params\.set\("v", "[A-Za-z0-9]+"\);'; Replacement = "params.set(`"v`", `"$Version`");" }
  )
  (Join-Path $root "globe\index.html") = @(
    @{ Pattern = 'globe\.css\?v=[^"]+'; Replacement = "globe.css?v=$Version" },
    @{ Pattern = '(<span class="globe-version">)ver\. [A-Za-z0-9]+(</span>)'; Replacement = "`$1ver. $Version`$2" },
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
  $content = Get-Content -Raw -LiteralPath $file
  foreach ($rule in $replacements[$file]) {
    $content = [regex]::Replace($content, $rule.Pattern, $rule.Replacement)
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
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
    if ($content -match [regex]::Escape($oldVersion)) {
      $staleHits += [pscustomobject]@{
        File = $file
        Version = $oldVersion
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
