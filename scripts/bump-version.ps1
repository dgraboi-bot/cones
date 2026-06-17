param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

$files = @(
  (Join-Path $root "telepathybeginner.html"),
  (Join-Path $root "telepathybeginner.js"),
  (Join-Path $root "telepathybeginner-sw.js"),
  (Join-Path $root "telepathybeginner.webmanifest"),
  (Join-Path $root "telepathybeginner-email-test.html"),
  (Join-Path $root "sender.html"),
  (Join-Path $root "receiver.html"),
  (Join-Path $root "telepathy.js")
)

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

$replacements = @{
  (Join-Path $root "telepathybeginner.html") = @(
    @{ Pattern = 'telepathybeginner\.webmanifest\?v=[^"]+'; Replacement = "telepathybeginner.webmanifest?v=$Version" },
    @{ Pattern = 'tb-icon-192\.png\?v=[^"]+'; Replacement = "tb-icon-192.png?v=$Version" },
    @{ Pattern = 'telepathybeginner\.css\?v=[^"]+'; Replacement = "telepathybeginner.css?v=$Version" },
    @{ Pattern = 'ver\. [A-Za-z0-9]+'; Replacement = "ver. $Version" },
    @{ Pattern = 'telepathybeginner-email-test\.html\?v=[^'']+'; Replacement = "telepathybeginner-email-test.html?v=$Version" },
    @{ Pattern = 'telepathybeginner\.js\?v=[^"]+'; Replacement = "telepathybeginner.js?v=$Version" }
  )
  (Join-Path $root "telepathybeginner.js") = @(
    @{ Pattern = 'const launcherBuildVersion = "[^"]+";'; Replacement = "const launcherBuildVersion = `"$Version`";" }
  )
  (Join-Path $root "telepathybeginner-sw.js") = @(
    @{ Pattern = 'const CACHE_NAME = "telepathybeginner-v[^"]+";'; Replacement = "const CACHE_NAME = `"telepathybeginner-v$Version`";" },
    @{ Pattern = 'const APP_VERSION = "[^"]+";'; Replacement = "const APP_VERSION = `"$Version`";" }
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
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "receiver.html") = @(
    @{ Pattern = 'telepathy\.css\?v=[^"]+'; Replacement = "telepathy.css?v=$Version" },
    @{ Pattern = 'telepathy\.js\?v=[^"]+'; Replacement = "telepathy.js?v=$Version" }
  )
  (Join-Path $root "telepathy.js") = @(
    @{ Pattern = 'const runtimeBuildVersion = "[^"]+";'; Replacement = "const runtimeBuildVersion = `"$Version`";" }
  )
}

foreach ($file in $files) {
  $content = Get-Content -Raw -LiteralPath $file
  foreach ($rule in $replacements[$file]) {
    $content = [regex]::Replace($content, $rule.Pattern, $rule.Replacement)
  }
  Set-Content -LiteralPath $file -Value $content -Encoding UTF8
}

Write-Host "Updated app version to $Version"
