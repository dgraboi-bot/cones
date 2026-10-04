param(
  [string]$SessionCode = "",
  [ValidateRange(50, 5000)]
  [int]$Tail = 800
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$remoteUploadTarget = "ec2-user@13.57.83.174"
$sshPrivateKeyPath = "C:\pem\Putty saved key\puttykey.ppk"
$sshHostKey = "SHA256:3KLXNH5dlbRXvcz9p70RAzK8MAE9WaYSb/O+ZC9WhNM"
$remoteSafetyLog = "/var/www/telepathyexperiment_private/cones/logs/safety-log.txt"
$remoteDebugLog = "/var/www/telepathyexperiment_private/cones/data/debug-log.txt"

foreach ($toolPath in @($plinkPath, $sshPrivateKeyPath)) {
  if (-not (Test-Path -LiteralPath $toolPath)) {
    throw "Required live-debug dependency was not found: $toolPath"
  }
}

$remoteCommand = "tail -n $Tail '$remoteSafetyLog'; tail -n $Tail '$remoteDebugLog'"
$lines = @(& $plinkPath -batch -hostkey $sshHostKey -i $sshPrivateKeyPath $remoteUploadTarget $remoteCommand)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read the production safety trace. Plink exit code: $LASTEXITCODE"
}

$interestingLabels = 'partner_confirmation|pair_difficulty|exercise_control|sender_exercise_preview|boot_client|global_debug:context_ready|covered_screen_|remote_display_'
$filtered = $lines | Where-Object {
  $_ -match $interestingLabels -and (
    [string]::IsNullOrWhiteSpace($SessionCode) -or $_ -like "*`"session_code`":`"$SessionCode`"*"
  )
}

Write-Output "Production traces: $remoteSafetyLog and $remoteDebugLog"
if ($SessionCode) {
  Write-Output "Session filter: $SessionCode"
}
if (-not $filtered) {
  Write-Output "No matching trace entries were found in the most recent $Tail safety-log lines."
  exit 0
}

$filtered
