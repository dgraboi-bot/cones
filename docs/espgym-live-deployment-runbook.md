# ESP GYM Live Deployment Runbook

This document defines the standard process for deploying a new ESP GYM version to the live server.

It is written to prevent three recurring problems:

1. forgetting to create a server-side backup snapshot before deployment
2. deploying only some of the changed files
3. leaving mixed version strings in HTML, JS, CSS, manifest, or runtime entry points and causing cache fighting

There is a fourth practical cache trap to watch for:

4. letting the root `https://espgym.com/` redirect hardcode a versioned launcher URL that a browser may keep reusing after deployment

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

Required local mirror path:

`C:\xampp\htdocs\cones`

Local mirror rule:

1. `C:\xampp\htdocs\telepathyexperiment\cones` is the authoritative working tree for edits, git, and live deployment
2. `C:\xampp\htdocs\cones` must be kept synchronized as the local mirror copy
3. after any meaningful code change set, re-sync the authoritative tree into the mirror tree before claiming the local app is up to date
4. when checking local browser behavior, be explicit about which local URL is being tested:
   - `http://localhost/telepathyexperiment/cones/...`
   - `http://localhost/cones/...`
5. if those two local trees drift apart, stop and re-sync them before continuing normal testing or deployment claims

Recommended local re-sync command:

```powershell
robocopy C:\xampp\htdocs\telepathyexperiment\cones C:\xampp\htdocs\cones /MIR /XD .git /R:1 /W:1
```

If the mirror tree contains intentional local-only folders that should survive, exclude them explicitly from the command instead of silently allowing drift.

Primary live app path:

`/var/www/telepathyexperiment/cones`

Primary SSH transport:

`plink -batch -load "DG Putty Settings"`

Primary file push pattern:

```powershell
cmd /c type "C:\xampp\htdocs\telepathyexperiment\cones\somefile.ext" |
  plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/somefile.ext"
```

Important:

Do not rely on the older PowerShell `Get-Content -Raw | plink ...` pattern for routine live pushes. In practice it can appear to succeed while leaving the live file unchanged. The `cmd /c type ... | plink "cat > ..."` pattern is the reliable default and should be treated as authoritative unless a better-tested transfer method replaces it later.

PowerShell quoting rule:

- do not inline many `cmd /c type ... | plink ...` commands directly in one PowerShell command string unless the quoting has just been proven in the current shell
- the safest operational pattern is:
  1. create a short temporary `.cmd` deploy script
  2. put one `type ... | plink ... "cat > ..."` line per file in that `.cmd`
  3. run the `.cmd`
  4. delete the `.cmd`

Reason:

- PowerShell can misinterpret Unix-style remote command fragments, `%` format tokens, or nested quotes, which can make a deployment appear to run while actually mangling the command
- the temporary `.cmd` wrapper preserves the exact known-good Windows command syntax

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

## Required Local Mirror Confirmation

After any meaningful code change set and again after any build bump, re-sync:

- `C:\xampp\htdocs\telepathyexperiment\cones`
- into `C:\xampp\htdocs\cones`

using:

```powershell
robocopy C:\xampp\htdocs\telepathyexperiment\cones C:\xampp\htdocs\cones /MIR /XD .git /R:1 /W:1
```

Do not merely run the mirror. Also explicitly note in the work log or user update that the mirror step was completed.

## Build Version Rule

Use a monotonically increasing build marker such as:

`20260629j`

Do not deploy with mixed version strings.

When a build version is changed, search for both:

1. the new version string to confirm it appears everywhere needed
2. the immediately previous version string to confirm it is gone from the files being deployed

Required tool rule:

- always run `scripts\bump-version.ps1 -Version <build>` from the repo root workflow before deployment
- if the script reports stale version markers remain, stop and fix them before deploying
- do not hand-wave partial version updates

## Authoritative Version Surface Inventory

This is the authoritative list of files and patterns that can carry stale build references.

This list must be checked on every deployment. Do not rely on memory.

Core launcher/runtime:

- `.htaccess`
- `index.html`
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
- questionnaire jump links that include `?v=...`
- vendor asset references such as Leaflet CSS/JS
- any inline `window.location.href=...v=...` links
- any visible prose that accidentally embeds a build number

Frequently versioned asset references inside `sender.html` and `receiver.html`:

- `telepathy.css?v=...`
- home link to `telepathybeginner.html?v=...`
- `telepathy.js?v=...`

Potentially relevant additional files depending on the change:

- `telepathy.css`
- `telepathybeginner.css`
- `telepathybeginner.webmanifest`
- `telepathybeginner-sw.js`
- `telepathybeginner-email-test.js`

## Cache-Hardening Rules

To avoid requiring `Ctrl-F5` after a normal deployment, do all of the following whenever launcher/runtime navigation behavior is touched:

1. ensure launcher-facing assets are versioned with `?v=<build>`
2. ensure return/navigation paths back into `telepathybeginner.html` include the current `v=<build>` parameter
3. ensure the launcher HTML normalizes itself to the current build version if loaded without `v=<build>`
4. ensure the service worker is registered with the current `?v=<build>` URL
5. ensure the launcher runtime forces a one-time reload on `serviceWorker.controllerchange` so a newly activated worker takes control visibly
6. ensure the runtime calls `registration.update()` after registration so the browser checks for a newer worker promptly
7. ensure root entry redirects do not embed the build version in the redirect target

Important root-entry rule:

- `https://espgym.com/` and `https://espgym.com/index.html` should redirect to:
  - `https://espgym.com/telepathybeginner.html?open=landing`
- not to:
  - `https://espgym.com/telepathybeginner.html?v=<build>&open=landing`

Reason:

- browsers can keep reusing an old cached `302` redirect target
- if that target contains `v=<oldbuild>`, typing `https://espgym.com/` can still land on the old build until the user forces a fresh network fetch with `Ctrl+F5`
- the launcher page already knows how to normalize itself to the current build, so the root redirect should stay unversioned

Required header rule for that redirect:

- the root/index redirect response should also send:
  - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
  - `Pragma: no-cache`
  - `Expires: 0`

Without those headers, some browsers may still reuse the old `302` target even when the target is now unversioned.

Current concrete cache-transition surfaces that must be checked:

- `.htaccess`
- `index.html`
- `telepathybeginner.html`
- `telepathybeginner.js`
- `telepathybeginner-sw.js`
- `telepathybeginner.webmanifest`
- `telepathy.js`
- `sender.html`
- `receiver.html`

If a stale-behavior report appears after a deploy, inspect unversioned launcher-entry or launcher-return URLs before assuming the problem is only browser cache.
- `api.php`
- `globe/index.html`
- `globe/globe.js`
- `globe/globe-config.js`
- `globe/globe-data.js`
- `globe/globe-ui.js`

Rule:

If a file can influence browser caching, launch routing, service worker behavior, asset loading, or visible build identity, inspect it before deployment.

### Exact version-bearing surfaces currently known

The following exact surfaces are known to require inspection and, when applicable, version updates:

#### `.htaccess`

- root redirect to `telepathybeginner.html?open=landing` when present
- any `index.html` redirect to the canonical launcher URL
- any old-origin canonical redirects involving `telepathybeginner.html`

#### `index.html`

- any fallback/meta-refresh target for launcher entry
- any launcher link that should stay unversioned for root entry and use `telepathybeginner.html?open=landing`

#### `telepathybeginner.html`

- `<link rel="manifest" href="telepathybeginner.webmanifest?v=...">`
- icon URLs with `?v=...`
- `telepathybeginner.css?v=...`
- `vendor/leaflet/leaflet.css?v=...`
- visible top-line version label `ver. ...`
- questionnaire links such as:
  - `telepathybeginner.html?v=...&open=baseline-questions`
  - `telepathybeginner.html?v=...&open=after-first-session-questions`
- admin/help/test links such as:
  - `BeginnerUserManual_preserved_*.html?v=...`
  - `telepathybeginner-email-test.html?v=...`
- script tags such as:
  - `vendor/leaflet/leaflet.js?v=...`
  - `telepathybeginner.js?v=...`

#### `telepathybeginner.js`

- `const launcherBuildVersion = "...";`
- any generated URLs that append `?v=${launcherBuildVersion}`
- service worker registration URL
- image-pair manifest fetch URL
- any diagnostics/report text that prints app version

#### `telepathy.js`

- `const runtimeBuildVersion = "...";`
- any generated URLs that append `?v=${runtimeBuildVersion}`

#### `sender.html` and `receiver.html`

- `telepathy.css?v=...`
- home link to `telepathybeginner.html?v=...&open=launcher`
- `telepathy.js?v=...`

#### `telepathybeginner.webmanifest`

- `start_url`
- icon `src` values with `?v=...`

#### `telepathybeginner-sw.js`

- `const CACHE_NAME = "...";`
- `const APP_VERSION = "...";`
- `APP_LAUNCH_URL`
- every `APP_ASSETS` entry that includes a versioned URL
- any legacy cached assets whose build tags may now be stale

#### `telepathybeginner-email-test.html`

- `telepathybeginner.css?v=...`
- `telepathybeginner-email-test.js?v=...`

#### Globe sub-app

- `globe/index.html`
  - `globe.css?v=...`
  - visible `ver. ...`
  - `globe-config.js?v=...`
  - `globe-data.js?v=...`
  - `globe-ui.js?v=...`
  - `globe.js?v=...`
- `globe/globe.js`
  - fallback home URL version, if hardcoded

#### Other version-sensitive routing/content surfaces

- `api.php` host/routing fallbacks when they encode launcher/home URLs
- any docs, preserved HTML pages, or helper pages that are intentionally linked from the app and carry `?v=...`

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
rg -n "\?v=20|ver\. 20|BuildVersion|APP_VERSION|CACHE_NAME|start_url" C:\xampp\htdocs\telepathyexperiment\cones
```

```powershell
rg -n "20260629i" C:\xampp\htdocs\telepathyexperiment\cones\telepathy.js `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.html `
  C:\xampp\htdocs\telepathyexperiment\cones\sender.html `
  C:\xampp\htdocs\telepathyexperiment\cones\receiver.html `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner-sw.js `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.webmanifest `
  C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner-email-test.html `
  C:\xampp\htdocs\telepathyexperiment\cones\globe\index.html `
  C:\xampp\htdocs\telepathyexperiment\cones\globe\globe.js
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

After backup, push each changed local file with the standard direct single-file pipe-to-`cat` pattern.

Important:

1. Use one explicit command per file.
2. Do not rely on a PowerShell loop or higher-level wrapper that pipelines multiple files through `plink` in one script block unless that exact pattern has been verified again in the current environment.
3. The proven safe pattern is:
   - run one `Get-Content -Raw ... | plink ... "cat > ..."` command
   - immediately verify that file on the server
   - then continue to the next file
4. If a batched transfer method appears to succeed but the live file contents do not change, stop using that method immediately and fall back to the explicit one-file-at-a-time pattern.

Examples:

```cmd
type "C:\xampp\htdocs\telepathyexperiment\cones\telepathy.js" | plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/telepathy.js"
```

```cmd
type "C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js" | plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/telepathybeginner.js"
```

```cmd
type "C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.html" | plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/telepathybeginner.html"
```

```cmd
type "C:\xampp\htdocs\telepathyexperiment\cones\sender.html" | plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/sender.html"
```

```cmd
type "C:\xampp\htdocs\telepathyexperiment\cones\receiver.html" | plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/receiver.html"
```

Push CSS, manifest, service worker, API, and globe files the same way when they are part of the release.

If the live target directory does not already exist, create it first. In particular, support folders such as:

- `/var/www/telepathyexperiment/cones/docs`
- `/var/www/telepathyexperiment/cones/scripts`

may not exist yet on the live server because they are operational/repo-support folders rather than runtime app folders.

Create missing directories explicitly before pushing files into them:

```powershell
plink -batch -load 'DG Putty Settings' "mkdir -p /var/www/telepathyexperiment/cones/docs /var/www/telepathyexperiment/cones/scripts"
```

Recommended deployment wrapper pattern:

```powershell
$cmdPath = "C:\path\to\temporary-deploy.cmd"
# write one `type ... | plink ... "cat > ..."` line per file
cmd /c $cmdPath
Remove-Item -LiteralPath $cmdPath
```

This is currently the safest known deployment wrapper for this project.

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

Practical verification rule:

- Do not assume a multi-file deploy succeeded just because `plink` returned exit code `0`.
- Open or grep the actual live files that matter most for the release and confirm the expected new text is present.

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
