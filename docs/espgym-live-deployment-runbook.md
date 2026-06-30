# ESP GYM Live Deployment Runbook

This document defines the standard process for deploying a new ESP GYM version to the live server.

It is written to prevent three recurring problems:

1. forgetting to create a server-side backup snapshot before deployment
2. deploying only some of the changed files
3. leaving mixed version strings in HTML, JS, CSS, manifest, or runtime entry points and causing cache fighting

The process below is the required deployment sequence unless the user explicitly asks for a different one.

## GitHub Checkpoint Rule

The current ESP GYM app **does** have its own git repository.

Authoritative repo root:

- `C:\xampp\htdocs\telepathyexperiment\cones`

Current branch:

- `main`

Current remote:

- `origin https://github.com/dgraboi-bot/cones.git`

Important lesson:

The parent directory

- `C:\xampp\htdocs\telepathyexperiment`

is **not** the git repo root.

So a command like:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment status
```

can fail or mislead, while the correct command:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones status
```

works normally.

Required rule going forward:

1. always verify the actual repo root first with `git rev-parse --show-toplevel`
2. run all git status/add/commit/push commands from `C:\xampp\htdocs\telepathyexperiment\cones`
3. do not infer anything from the parent folder if the repo root may be nested
4. if a git command fails, check the repo root before concluding anything about GitHub availability

Never conclude "GitHub commit cannot be done" until the actual nested repo root has been checked.

## Local Source Of Truth

The local working copy is the source of truth before deployment.

Primary local app path:

`C:\xampp\htdocs\telepathyexperiment\cones`

Primary live app path:

`/var/www/telepathyexperiment/cones`

Primary SSH transport:

`plink -batch -load "DG Putty Settings"`

Primary file push pattern:

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\somefile.ext') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/somefile.ext"
```

## GitHub Verification Procedure

Before promising a GitHub checkpoint, run these checks in order.

### Step 1: verify the actual repo root

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones rev-parse --show-toplevel
```

Expected result:

`C:/xampp/htdocs/telepathyexperiment/cones`

Then run:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones branch --show-current
git -C C:\xampp\htdocs\telepathyexperiment\cones remote -v
git -C C:\xampp\htdocs\telepathyexperiment\cones status --short
```

Expected remote:

`https://github.com/dgraboi-bot/cones.git`

### Step 2: perform the checkpoint commit from the actual repo root

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones status --short
git -C C:\xampp\htdocs\telepathyexperiment\cones add <relevant-files>
git -C C:\xampp\htdocs\telepathyexperiment\cones commit -m "Your checkpoint message"
git -C C:\xampp\htdocs\telepathyexperiment\cones push origin main
```

### Step 3: record what happened

After any GitHub checkpoint, note:

- the repo path used
- which branch was used
- which remote was used
- the new commit hash

For this app, the default answers should normally be:

- repo path: `C:\xampp\htdocs\telepathyexperiment\cones`
- branch: `main`
- remote: `origin -> https://github.com/dgraboi-bot/cones.git`

## Required Deployment Discipline

Every live deployment must do all of the following:

1. identify the exact new build version string
2. update every relevant local version marker first
3. update the PWA cache/version surfaces whenever the build changes
4. create a server-side backup snapshot of the currently live files before overwriting them
5. mirror the changed local files to the live server
6. verify the live files contain the new version markers and key code changes
7. provide the user a clean cache-busted test URL

## Build Version Rule

Use a monotonically increasing build marker such as:

`20260629j`

Do not deploy with mixed version strings.

When a build version is changed, search for both:

1. the new version string to confirm it appears everywhere needed
2. the immediately previous version string to confirm it is gone from the files being deployed

## Files That Commonly Need Version Updates

This list must be checked on every deployment.

Core launcher/runtime:

- `telepathybeginner.js`
- `telepathy.js`
- `telepathybeginner.html`
- `sender.html`
- `receiver.html`

Frequently versioned asset references inside `telepathybeginner.html`:

- manifest URL
- icon URLs
- apple touch icon URL
- CSS URLs
- JS URLs
- visible version label text
- special admin/help/test links that include `?v=...`

Frequently versioned asset references inside `sender.html` and `receiver.html`:

- `telepathy.css?v=...`
- home link to `telepathybeginner.html?v=...`
- `telepathy.js?v=...`

Potentially relevant additional files depending on the change:

- `telepathy.css`
- `telepathybeginner.css`
- `telepathybeginner.webmanifest`
- `telepathybeginner-sw.js`
- `api.php`
- `globe/globe.js`
- `globe/globe-data.js`
- `globe/globe-ui.js`

Rule:

If a file can influence browser caching, launch routing, service worker behavior, asset loading, or visible build identity, inspect it before deployment.

PWA-specific rule:

If `telepathybeginner.js` or `telepathybeginner.html` gets a new build version, you must also inspect and usually update:

- `telepathybeginner.webmanifest`
- `telepathybeginner-sw.js`

Otherwise the installed PWA may continue to serve stale assets and the user may need `Ctrl+F5` or a delayed service-worker refresh before the new behavior appears.

## Pre-Deployment Checklist

Run these locally before pushing:

1. inspect local git/worktree status
2. identify the exact files intended for deployment
3. confirm the new version string is set in all required files
4. confirm the prior version string is removed from those files
5. confirm the manifest and service-worker version strings match the new build when applicable
6. if possible, locally test the changed behavior before live push

Helpful local checks:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones status --short
```

```powershell
rg -n "20260629j" C:\xampp\htdocs\telepathyexperiment\cones
```

```powershell
rg -n "20260629i" C:\xampp\htdocs\telepathyexperiment\cones\telepathy.js `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.html `
  C:\xampp\htdocs\telepathyexperiment\cones\sender.html `
  C:\xampp\htdocs\telepathyexperiment\cones\receiver.html
```

## Required Server-Side Backup Step

Before overwriting any live file, create a snapshot directory on the server for the previously live state.

Current writable snapshot root:

`/home/ec2-user/espgym_live_snapshots`

Important:

The older private snapshot location under `/var/www/telepathyexperiment_private/...` is no longer writable by the current SSH deployment account (`ec2-user`) because that tree is owned by `apache`. Do not use the private path for routine deployments unless its permissions are intentionally changed later.

Suggested snapshot folder naming:

`YYYYMMDDhhmm_pre_20260629j`

Example:

`/home/ec2-user/espgym_live_snapshots/202606291045_pre_20260629j`

Create the directory:

```powershell
plink -batch -load 'DG Putty Settings' "mkdir -p /home/ec2-user/espgym_live_snapshots/202606291045_pre_20260629j"
```

Copy the currently live files into that snapshot before overwriting them:

```powershell
plink -batch -load 'DG Putty Settings' "cp /var/www/telepathyexperiment/cones/telepathy.js /home/ec2-user/espgym_live_snapshots/202606291045_pre_20260629j/"
```

Repeat for every file being deployed.

Minimum rule:

If a file is about to be overwritten live, its prior live copy must first be copied into the snapshot folder.

## Standard File Push Procedure

After backup, push each changed local file with the standard pipe-to-`cat` pattern.

Examples:

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\telepathy.js') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/telepathy.js"
```

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/telepathybeginner.js"
```

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.html') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/telepathybeginner.html"
```

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\sender.html') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/sender.html"
```

```powershell
(Get-Content -Raw 'C:\xampp\htdocs\telepathyexperiment\cones\receiver.html') |
  plink -batch -load 'DG Putty Settings' "cat > /var/www/telepathyexperiment/cones/receiver.html"
```

Push CSS, manifest, service worker, API, and globe files the same way when they are part of the release.

## Post-Deployment Verification

Immediately verify the live server contains the new version markers.

Example:

```powershell
plink -batch -load 'DG Putty Settings' "grep -n '20260629j' /var/www/telepathyexperiment/cones/telepathy.js /var/www/telepathyexperiment/cones/telepathybeginner.js /var/www/telepathyexperiment/cones/telepathybeginner.html /var/www/telepathyexperiment/cones/sender.html /var/www/telepathyexperiment/cones/receiver.html"
```

Also verify one or more key code markers related to the actual fix.

Example:

```powershell
plink -batch -load 'DG Putty Settings' "grep -n 'visual-response' /var/www/telepathyexperiment/cones/telepathy.css"
```

When relevant, verify:

- the new runtime build constant
- the launcher build constant
- the HTML query-string references
- the manifest build references
- the service worker cache/version constant
- the visible version label text
- any new CSS class or function name introduced by the fix

## Live Test URL Rule

Always provide a cache-busted test URL after deployment.

Example:

`https://espgym.com/telepathybeginner.html?v=20260629j&open=launcher`

PWA note:

If the user is testing through the installed PWA, tell them that the browser/PWA may still need one reopen cycle or, in some cases, a hard refresh in the browser tab before the updated service worker and cached assets fully take effect.

If the change affects sender or receiver runtime specifically, those URLs may also be used for targeted checks, but the user-facing launcher URL should still be given.

## If A Deployment Is Partial Or Suspect

If the deployment may be incomplete:

1. stop and verify all intended files on the server
2. compare local and live version markers
3. re-push any missed files
4. do not tell the user the deployment is complete until live verification passes

## Rollback Rule

If rollback is needed, restore from the snapshot folder created before deployment.

Example:

```powershell
plink -batch -load 'DG Putty Settings' "cp /home/ec2-user/espgym_live_snapshots/202606291045_pre_20260629j/telepathy.js /var/www/telepathyexperiment/cones/telepathy.js"
```

Repeat for the full file set involved in that deployment.

After rollback:

1. verify the restored version markers
2. provide the user a cache-busted URL for the restored version

## Required Closing Report

After a successful deployment, report briefly:

1. the deployed build version
2. whether the backup snapshot was created
3. which major files were mirrored
4. that live verification passed
5. the exact live URL to test

## Non-Negotiable Rule Going Forward

For ESP GYM live pushes:

backup first, then deploy, then verify, then provide the clean URL

Do not skip the backup step just because a patch seems small.
