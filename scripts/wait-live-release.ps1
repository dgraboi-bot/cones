param(
  [Parameter(Mandatory = $true)]
  [string]$Version,

  [ValidateRange(30, 3600)]
  [int]$TimeoutSeconds = 1200,

  [ValidateRange(1, 30)]
  [int]$PollSeconds = 3
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$releaseLogRoot = "C:\xampp\telepathyexperiment_private\cones\release-logs"
$successMarker = "Pushed prepared build $Version"
$auditMarker = "Live SHA-256 audit passed for"
$startedAt = Get-Date
$lastProgressAt = [datetime]::MinValue

function Get-ReleaseLog {
  if (-not (Test-Path -LiteralPath $releaseLogRoot)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $releaseLogRoot -Filter "push-live-$Version-*.log" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Test-ReleaseWorkerRunning {
  try {
    $workers = Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object {
        $_.Name -in @("pwsh.exe", "powershell.exe") -and
        $_.CommandLine -and
        $_.CommandLine -match [regex]::Escape($Version) -and
        $_.CommandLine -match "(deploy-live|push-live)\\.ps1"
      }
    return @($workers).Count -gt 0
  } catch {
    # If process inspection is unavailable, wait for the authoritative log.
    return $true
  }
}

while ($true) {
  $elapsedSeconds = ((Get-Date) - $startedAt).TotalSeconds
  if ($elapsedSeconds -gt $TimeoutSeconds) {
    throw "Timed out after $TimeoutSeconds seconds while waiting for release $Version. Inspect the latest release log under $releaseLogRoot before retrying."
  }

  $releaseLog = Get-ReleaseLog
  if ($releaseLog) {
    $content = Get-Content -LiteralPath $releaseLog.FullName -Raw -Encoding UTF8
    if ($content.Contains($successMarker)) {
      if (-not $content.Contains($auditMarker)) {
        throw "Release $Version recorded its success marker without the required live SHA-256 audit. Inspect $($releaseLog.FullName)."
      }
      Write-Output "SUCCESS: Release $Version completed and passed its live SHA-256 audit."
      Write-Output "Release log: $($releaseLog.FullName)"
      return
    }

    $latestLine = @($content -split "`r?`n" | Where-Object { $_.Trim() }) | Select-Object -Last 1
    if (((Get-Date) - $lastProgressAt).TotalSeconds -ge 30) {
      Write-Output "Waiting for release $Version. Latest log entry: $latestLine"
      $lastProgressAt = Get-Date
    }

    if (-not (Test-ReleaseWorkerRunning) -and ((Get-Date) - $releaseLog.LastWriteTime).TotalSeconds -gt 10) {
      throw "Release $Version stopped without a recorded success marker. Inspect $($releaseLog.FullName) before retrying."
    }
  } elseif (((Get-Date) - $lastProgressAt).TotalSeconds -ge 30) {
    Write-Output "Waiting for release $Version to create its release log."
    $lastProgressAt = Get-Date
  }

  Start-Sleep -Seconds $PollSeconds
}
