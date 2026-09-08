param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$vendorRoot = Join-Path $repoRoot 'vendor'
if (-not (Test-Path -LiteralPath $vendorRoot)) {
  throw "Missing Composer vendor directory: $vendorRoot"
}

$tarPath = (Get-Command tar.exe -ErrorAction Stop).Source
$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
Remove-Item -LiteralPath $OutputPath -Force -ErrorAction SilentlyContinue

# The archive stores a single vendor/ root and is SHA-256 checked before use.
Push-Location $repoRoot
try {
  & $tarPath -czf $OutputPath vendor
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $OutputPath)) {
    throw 'Unable to create the Composer vendor release archive.'
  }
} finally {
  Pop-Location
}

[pscustomobject]@{
  archive_path = $OutputPath
  archive_sha256 = (Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256).Hash.ToUpperInvariant()
  archive_bytes = (Get-Item -LiteralPath $OutputPath).Length
} | ConvertTo-Json -Compress
