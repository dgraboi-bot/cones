$ErrorActionPreference = 'Stop'

$pairRoots = @(
  @{ Path = 'C:\xampp\telepathyexperiment_private\cones\pairs'; Source = 'real' },
  @{ Path = 'C:\xampp\telepathyexperiment_private\cones\simulation_pairs'; Source = 'simulation' }
)

$headers = @(
  'export schema/version',
  'trial_id',
  'session_id',
  'session_mode',
  'remote_viewing_submode',
  'session_level',
  'session_number',
  'trial_utc_ms',
  'round_id',
  'rx name',
  'tx name',
  'local date',
  'local time',
  'sent layout',
  'difficulty level',
  'trial aborted',
  'trial timed out',
  'rx choice1',
  'rx choice2',
  'confidence',
  'rx done rt',
  'utc time',
  'rx location',
  'tx location',
  'sync est',
  'sync best',
  'sync worst',
  'image pair id',
  'sent image',
  'image choice a',
  'image choice b',
  'rx image choice'
)

function Normalize-Level($value) {
  $text = [string]$value
  if ($text -match '^[1-4]$') {
    return $text
  }
  return ''
}

function Get-TrialUtcMs($row) {
  $explicit = 0
  if ([long]::TryParse([string]$row.'trial_utc_ms', [ref]$explicit) -and $explicit -gt 0) {
    return $explicit
  }
  $utcText = [string]$row.'utc time'
  if ($utcText) {
    try {
      return [DateTimeOffset]::Parse($utcText).ToUnixTimeMilliseconds()
    } catch {
    }
  }
  return 0
}

function Infer-ModeInfo($fileInfo, $row, $source) {
  $hasImagePair = [string]$row.'image pair id' -ne '' -or [string]$row.'sent image' -ne '' -or [string]$row.'rx image choice' -ne ''
  $hasConeLayout = [string]$row.'sent layout' -ne ''
  if ($source -eq 'simulation' -and $hasImagePair) {
    return @{ SessionMode = 'remote_viewing'; RemoteViewingSubmode = 'remote_screen' }
  }
  if ($source -eq 'simulation' -and $hasConeLayout) {
    return @{ SessionMode = 'remote_viewing'; RemoteViewingSubmode = 'covered_screen' }
  }
  return @{ SessionMode = 'telepathy'; RemoteViewingSubmode = '' }
}

function Get-SessionIndexForRow($fileName, $rowIndex, $totalRows) {
  $lowerName = $fileName.ToLowerInvariant()
  $isTwentyFourTrialDemo = $lowerName.StartsWith('rx-demo-') -and $totalRows -eq 24
  if ($isTwentyFourTrialDemo) {
    return ($rowIndex -le 11) ? 1 : 2
  }
  return 1
}

function Build-SessionId($fileStem, $modeInfo, $level, $sessionNumber) {
  $cleanStem = ($fileStem -replace '[^a-zA-Z0-9]+', '-').Trim('-').ToLowerInvariant()
  $mode = $modeInfo.SessionMode
  $submode = if ($modeInfo.RemoteViewingSubmode) { $modeInfo.RemoteViewingSubmode } else { 'standard' }
  $levelToken = if ($level) { "level-$level" } else { 'level-unknown' }
  return "$cleanStem-$mode-$submode-$levelToken-session-$sessionNumber"
}

function Convert-Row($row, $sessionId, $sessionNumber, $modeInfo, $level) {
  $trialUtcMs = Get-TrialUtcMs $row
  $roundId = [string]$row.'round_id'
  if (-not $roundId) {
    $roundId = "row-$sessionNumber-$trialUtcMs"
  }

  $values = [ordered]@{}
  foreach ($header in $headers) {
    $values[$header] = ''
  }

  $values['export schema/version'] = 'cones-trials-v6'
  $values['trial_id'] = "$sessionId-$roundId"
  $values['session_id'] = $sessionId
  $values['session_mode'] = $modeInfo.SessionMode
  $values['remote_viewing_submode'] = $modeInfo.RemoteViewingSubmode
  $values['session_level'] = $level
  $values['session_number'] = [string]$sessionNumber
  $values['trial_utc_ms'] = if ($trialUtcMs -gt 0) { [string]$trialUtcMs } else { '' }

  foreach ($header in $headers) {
    if ($header -in @('export schema/version','trial_id','session_id','session_mode','remote_viewing_submode','session_level','session_number','trial_utc_ms')) {
      continue
    }
    $values[$header] = [string]$row.$header
  }

  return [pscustomobject]$values
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path 'C:\xampp\telepathyexperiment_private\cones\backup\report-schema-migration' $timestamp
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

$summary = @()

foreach ($root in $pairRoots) {
  $dirPath = $root.Path
  $source = $root.Source
  if (-not (Test-Path $dirPath)) {
    continue
  }

  Get-ChildItem -LiteralPath $dirPath -Filter '*.csv' | ForEach-Object {
    $file = $_
    $rows = @(Import-Csv -LiteralPath $file.FullName)
    if (-not $rows.Count) {
      return
    }

    $backupPath = Join-Path $backupRoot $file.Name
    Copy-Item -LiteralPath $file.FullName -Destination $backupPath -Force

    $converted = New-Object System.Collections.Generic.List[object]
    $sessionIds = @{}

    for ($index = 0; $index -lt $rows.Count; $index += 1) {
      $row = $rows[$index]
      $modeInfo = Infer-ModeInfo $file $row $source
      $level = Normalize-Level($row.'session_level')
      if (-not $level) {
        $level = Normalize-Level($row.'difficulty level')
      }
      $sessionNumber = Get-SessionIndexForRow $file.Name $index $rows.Count
      if (-not $sessionIds.ContainsKey($sessionNumber)) {
        $sessionIds[$sessionNumber] = Build-SessionId $file.BaseName $modeInfo $level $sessionNumber
      }
      $converted.Add((Convert-Row $row $sessionIds[$sessionNumber] $sessionNumber $modeInfo $level))
    }

    $converted | Export-Csv -LiteralPath $file.FullName -NoTypeInformation -Encoding UTF8
    $summary += [pscustomobject]@{
      File = $file.Name
      Source = $source
      Rows = $rows.Count
      Backup = $backupPath
    }
  }
}

$summary | Format-Table -AutoSize
