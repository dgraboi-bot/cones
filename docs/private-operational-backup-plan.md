# ESP GYM Private Operational Backup Plan

This document defines the private backup layout needed to restore the live operational state of the ESP GYM app.

## Purpose

The Git repository is intended to recover:
- app code
- public assets
- tracked infrastructure content such as the Learn More files

The private operational backup is intended to recover:
- secrets and private configuration
- live user/session state
- trial history and pair analysis
- optional logs for forensic review

## Private Source Root

Windows local source:
- `C:\xampp\telepathyexperiment_private\cones\`

Linux live source:
- `/var/www/telepathyexperiment_private/cones/`

## Backup Snapshot Layout

Each manual snapshot should create a timestamped folder using this structure:

```text
private-backups/
  YYYYMMDD-HHMMSS/
    manifest.json
    config/
      stripe.json
      webpush.json
      zoho-mail.json
    content/
      learn-more-main.txt
      learn-more-clairvoyance.txt
    data/
      session-state.json
    pairs/
      *.csv
      *.analysis.json
    logs/
      debug-log.txt                  optional
      safety-log.txt                 optional
      subscription-email-log.txt     optional
```

## Minimum Recovery Set

These files are the minimum private set needed to restore the app's live operational state:

- `config/stripe.json`
- `config/webpush.json`
- `config/zoho-mail.json`
- `content/learn-more-main.txt`
- `content/learn-more-clairvoyance.txt`
- `data/session-state.json`
- `pairs/*.csv`
- `pairs/*.analysis.json`

## What Each Area Contains

`config/`
- payment keys and product/price identifiers
- VAPID keys for notifications
- mail configuration

`content/`
- live editable infrastructure text used by the app

`data/session-state.json`
- user types
- claimed handles
- invitees
- partner message state
- push subscriptions
- lesson progress
- launcher state stored on the server side
- miscellaneous live operational state

`pairs/`
- raw pair trial histories
- saved analysis JSON files

`logs/`
- useful only for troubleshooting, not usually required for functional recovery

## Recovery Order

1. Restore the GitHub repo contents to the public app directory.
2. Restore composer/vendor dependencies if not already present.
3. Restore private config files into the private config folder.
4. Restore private content files into the private content folder.
5. Restore `session-state.json`.
6. Restore the `pairs/` directory.
7. Restore optional logs only if needed.
8. Verify file permissions so the web process can read and write the needed files.

## GitHub Versus Private Backup

Stored in GitHub:
- code
- public assets
- tracked repo copies of Learn More content under `content_repo/`
- operational documentation such as this plan

Stored only in the private operational backup:
- live secrets
- live user state
- live trial histories
- logs

## Operational Rule

Whenever a private operational snapshot is created, it should be kept outside the public repo and named with a timestamp. The snapshot manifest should record:
- source root
- creation time
- whether logs were included
- file list
- file sizes

## Automation

Use the script:
- `scripts/export-private-operational-backup.ps1`

to produce the private snapshot layout defined in this document.

Use the script:
- `scripts/restore-private-operational-backup.ps1`

to restore one snapshot back into the private operational storage tree.

## Restore Examples

Create a snapshot without logs:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-private-operational-backup.ps1
```

Create a snapshot including logs:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-private-operational-backup.ps1 -IncludeLogs
```

Restore a snapshot without logs:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-private-operational-backup.ps1 -SnapshotRoot "C:\xampp\telepathyexperiment_private\private-backups\YYYYMMDD-HHMMSS"
```

Restore a snapshot including logs:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-private-operational-backup.ps1 -SnapshotRoot "C:\xampp\telepathyexperiment_private\private-backups\YYYYMMDD-HHMMSS" -IncludeLogs
```

Skip the interactive confirmation prompt:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-private-operational-backup.ps1 -SnapshotRoot "C:\xampp\telepathyexperiment_private\private-backups\YYYYMMDD-HHMMSS" -Force
```
