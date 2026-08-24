# ESP GYM Live Deployment Runbook

This document defines the standard process for deploying a new ESP GYM version to the live server.

It is written to prevent three recurring problems:

1. forgetting to create a server-side backup snapshot before deployment
2. deploying only some of the changed files
3. leaving mixed version strings in HTML, JS, CSS, manifest, or runtime entry points and causing cache fighting

There is a fifth release-integrity problem to prevent:

5. updating only some live assets while another stale HTML/CSS/JS file remains on the server and silently breaks the build

6. accidentally releasing mojibake or bad text-encoding corruption such as `Ã`, `â€™`, or similar broken character sequences

There is a seventh content-promotion problem to prevent:

7. deploying updated new-course lessons only into `content_repo` while leaving the authoritative private lesson store stale

There is an eighth release-boundary problem to prevent:

8. allowing changed deploy-relevant files to sit outside the authoritative deploy set and therefore silently miss a live release

There is a ninth local-debug problem to prevent:

9. re-testing stale local HTML/CSS/JS entry points and wasting time fighting mixed cached assets

There is a tenth lesson-integrity problem to prevent:

10. allowing the lesson outline and the actual lesson files to drift apart so a deploy silently removes lessons from the Learning Center

There is a fourth practical cache trap to watch for:

4. letting the root `https://espgym.com/` redirect hardcode a versioned launcher URL that a browser may keep reusing after deployment

There is an eleventh runtime-cache problem to prevent:

11. allowing a user to load a mixed old/new app shell after release, even when the deploy itself was complete

The process below is the required deployment sequence unless the user explicitly asks for a different one.

## Anti-Mixed-Cache Guarantee

Users who simply visit `https://espgym.com/` after a release must not be left running a mixed build.

Required rule going forward:

1. release preparation must fail if the cache-busting shell markers are incomplete
2. the runtime must compare the HTML build marker, JS build marker, and active service-worker build marker before normal startup proceeds
3. if those markers disagree, the app must pause normal startup, clear stale app caches, and reload into the exact current version
4. recovery must be bounded so a bad cache state does not create an infinite reload loop
5. if recovery still fails, the app must stop and show a clear close-and-reopen instruction instead of continuing in a mixed state

Practical meaning:

- deploy-time validation prevents shipping a bad version map
- runtime validation protects the user from one-load cache races and stale service-worker transitions
- a release is not "clean" until both protections are in place and the live shell verifies correctly

Authoritative runbook path:

- `C:\xampp\htdocs\telepathyexperiment\cones\docs\espgym-live-deployment-runbook.md`

There should not be a second competing runbook copy elsewhere in the repo. If a backup copy is ever needed, it should be clearly marked as archival only and not treated as authoritative.

## Absence-Check Discipline

Before concluding that a safeguard, feature, backup path, or code path "is not there," check all plausible implementation layers first.

Required rule going forward:

1. do not conclude a protection is absent after checking only one file or one layer
2. if the behavior involves saved content, verify the JS caller, the API/server write path, and the actual filesystem location before concluding anything
3. if the behavior involves deployment or runtime rendering, verify the authoritative local file, the mirror file, and the live/server copy as appropriate
4. if a previous discussion suggested that a safeguard exists, search Git history and the current codebase before stating that it was never implemented
5. when reporting that something appears missing, phrase it as provisional until all likely locations have been checked

Practical meaning:

- lesson-save backup logic may live in `api.php` even if it is not visible in `telepathybeginner.js`
- render behavior may come from HTML structure, JS view switching, cached browser assets, or mirrored copies
- content may still exist in the private content tree or autobackup tree even when the current rendered page looks wrong

Never state that a capability or safeguard does not exist until the relevant caller path, server path, and storage path have all been checked.

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

## Post-Deploy GitHub Rule

When a deployment script changes local version markers, a pre-deploy GitHub checkpoint is not enough.

Required rule going forward:

1. if the user asks to commit the current version to GitHub, GitHub must end up matching the actual deployed build
2. if deployment bumps versioned files locally, those post-bump files must be committed after the live push
3. do not stop after a pre-deploy checkpoint when the live build label has changed
4. after the live push completes, run `git status --short`
5. if the only remaining changes are the expected version-marker updates from deployment, commit them immediately as the live-build checkpoint

Practical meaning:

- pre-deploy checkpoint = optional safety checkpoint before overwriting the live server
- post-deploy checkpoint = required checkpoint if the deployment changed local build/version strings

For example:

- if the deploy script bumps `20260706w` to `20260706x`
- and the live server is now on `20260706x`
- then GitHub must also receive a follow-up commit containing `20260706x`

Otherwise GitHub is one version behind the actual recoverable live build, which is not acceptable.

## Temporary Local Version Labels

During debugging or cleanup, temporary local version labels may be introduced only to help test cache behavior or isolate a local working state.

Required rule going forward:

1. temporary local debug/version labels must not be treated as meaningful release sequence numbers unless they were actually deployed
2. if a cleanup pass intentionally normalizes files back to an earlier stable baseline before the next real release bump, that is acceptable and should be stated explicitly in status updates
3. when describing release history, distinguish clearly between:
   - temporary local labels used during debugging
   - actual live deployed labels
4. if a temporary label is abandoned before deployment, do not describe later deployed builds as if they descended sequentially from that temporary label

Practical meaning:

- a local label such as `20260711e` may exist briefly during debugging
- if cleanup then restores the app to stable baseline `20260711b`
- and the next real deployment becomes `20260711c`
- then `20260711c` is the meaningful release version, while `20260711e` was only a temporary local working label

## Required Encoding Guard

Large pasted content blocks are especially vulnerable to silent text-encoding corruption. A page can look fine in one source location while a duplicated static copy becomes mojibake such as:

- `Ã`
- `â€™`
- `â€“`
- `â€œ`
- `Â`

Required rule going forward:

1. keep large content blocks in one authoritative source whenever possible instead of duplicating them across HTML and JS
2. before deployment, run a mojibake scan across all text deploy files
3. if the scan finds suspicious encoding fragments, stop the release and inspect the exact file before continuing
4. do not assume a page is safe just because one runtime source looks clean; duplicated static copies can still be corrupted

The deploy helper is expected to enforce this guard automatically for normal live pushes.

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

## Launcher Path Profiling

When launcher-load performance is in doubt, profile the live launcher path before making more scaling changes.

Required rule going forward:

1. compare the root URL and the direct versioned launcher URL separately
2. collect server resource snapshots during the same test window
3. treat launcher HTML delivery and launcher-summary API timing as separate measurements
4. keep profiling artifacts separate from the ordinary debug log

Operational command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\profile-launcher-path.ps1 -Version <liveVersion>
```

What this produces:

- a root-URL timing summary
- a direct-launcher timing summary
- lightweight remote server snapshots taken before, during, and after the measurements
- a local markdown summary under:
  - `C:\xampp\telepathyexperiment_private\cones\profiling\launcher-path\`

Use this profiling pass before deciding whether the next optimization should target:

- redirect behavior
- launcher shell delivery
- launcher-summary API behavior
- or broader server/worker contention

## Capacity Certification Safeguard

The live build `20260822j` is the current certified baseline for `200` simultaneous mixed users under the tested ESP GYM usage pattern.

Required rule going forward:

1. do not describe a later build as still certified for `200` mixed simultaneous users unless performance-affecting changes have been checked against that baseline
2. treat any change to polling, launcher startup, service worker behavior, session timing, API request volume, report loading, runtime storage coordination, or other server I/O paths as potentially capacity-affecting
3. purely textual edits, lesson-content edits, static image swaps, and strictly visual CSS refinements may be treated as non-capacity-affecting unless they alter runtime loading behavior
4. capacity-affecting changes require at least a targeted regression check before a release is called clean
5. broad changes to request patterns, launcher shell behavior, session coordination, or server-side execution paths require rerunning the mixed-load certification flow before claiming the `200`-user certification still stands

Practical meaning:

- safe without re-certification:
  - wording changes
  - lesson text changes
  - replacing static image assets
  - visual-only CSS adjustments that do not change loading or polling behavior
- requires targeted performance regression check:
  - launcher shell changes
  - service worker changes
  - API call pattern changes
  - telepathy or remote-viewing session flow changes
  - report loading or report-generation path changes
  - admin features that touch live runtime paths
- requires full mixed-load recheck:
  - storage-model changes
  - session-coordination changes
  - caching-layer changes that alter request behavior materially
  - anything expected to increase concurrent request volume or server work per user

Minimum preservation rule:

- if a change is judged capacity-affecting, do not call the resulting release "clean" until the relevant regression check has passed
- if there is uncertainty whether a change is capacity-affecting, treat it as capacity-affecting

Current certified evidence:

- live mixed-load certification run completed successfully on August 22, 2026
- certified live build at time of test: `20260822j`
- mixed simulated users: `200`
- tested workload included idle navigation, telepathy sessions, remote-viewing sessions, report use, and course use

Operational command family:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-mixed-load-test.ps1 -Version <liveVersion> -ConfigPath <configPath>
```

Artifacts are written under:

- `C:\xampp\telepathyexperiment_private\cones\profiling\mixed-load\`

```powershell
robocopy C:\xampp\htdocs\telepathyexperiment\cones C:\xampp\htdocs\cones /MIR /XD .git /R:1 /W:1
```

If the mirror tree contains intentional local-only folders that should survive, exclude them explicitly from the command instead of silently allowing drift.

## Private Runtime Data Safety

Human trial/session runtime data is not the same as lesson infrastructure content.

For human pair CSVs and session metadata, the authoritative operational store is:

- server private runtime data under `/var/www/telepathyexperiment_private/cones/`

This specifically includes:

- `/var/www/telepathyexperiment_private/cones/pairs/`
- `/var/www/telepathyexperiment_private/cones/data/session-state.json`

The local private runtime store:

- `C:\xampp\telepathyexperiment_private\cones\pairs\`
- `C:\xampp\telepathyexperiment_private\cones\data\session-state.json`

must be treated as a synchronized working copy, **not** as a cleanup authority.

Required rule going forward:

1. treat server private operational data as authoritative for human pair/session data
2. do not perform local cleanup against `C:\xampp\telepathyexperiment_private\cones\pairs\` until local/server runtime data has been audited
3. before any pair/session cleanup, compare local private pair count and filenames against the server private pair store
4. if local/server pair counts or filenames differ, stop cleanup immediately
5. when drift is detected, back up the current local private runtime store first, then resync local private runtime data from the server copy
6. never assume a small local cleanup is safe just because the target filename pattern looks narrow; verify the full private runtime store first

Practical meaning:

- if local private pair files have collapsed to only demos, do **not** clean anything else locally
- if the server still has the expected human pair files, restore local runtime data from the server before continuing
- do not rely on repo files, mirror files, or browser rendering to judge whether private runtime pair data is complete

Required audit/sync helper:

- `scripts\sync-private-runtime-from-server.ps1`

Use it like this before any pair/session cleanup or when pair/session data looks suspicious:

```powershell
pwsh -File C:\xampp\htdocs\telepathyexperiment\cones\scripts\sync-private-runtime-from-server.ps1 -AuditOnly
```

If the audit reports drift, resync local private runtime data from the server authoritative copy:

```powershell
pwsh -File C:\xampp\htdocs\telepathyexperiment\cones\scripts\sync-private-runtime-from-server.ps1
```

Important behavior of this helper:

1. audits local vs server pair-file count and filenames
2. creates a local private operational backup before overwrite
3. restores local `pairs\` and `data\session-state.json` from the server private store
4. verifies the local pair-file set matches the server after sync

Cleanup rule:

- do not manually delete files from `C:\xampp\telepathyexperiment_private\cones\pairs\` unless the audit has first shown that the local pair-file set matches the server pair-file set

## New-Course Lesson Promotion Rule

The new Learning Center lesson editor writes two copies when a lesson is saved:

1. a private operational copy under the private content tree
2. a repo-side mirror copy under `content_repo`

On the live server, the app reads the authoritative lesson and outline files from:

- `/var/www/telepathyexperiment_private/cones/content/new-learning-center-lessons/`
- `/var/www/telepathyexperiment_private/cones/content/new-learning-center-outline.json`

The deploy tree under:

- `/var/www/telepathyexperiment/cones/content_repo/`

is still important because it is the Git-tracked and deployable copy, but by itself it is not enough for the running app.

Required rule going forward:

1. every normal live deployment that includes new-course outline or lesson changes must also promote those files into the private content tree
2. do not rely on a separate manual `cp` follow-up after release
3. after deployment, verify hashes for both:
   - repo/live files under `/var/www/telepathyexperiment/cones/content_repo/...`
   - authoritative private files under `/var/www/telepathyexperiment_private/cones/content/...`
4. if the repo-side file updated but the private content copy did not, treat the release as incomplete

Practical meaning:

- a lesson saved locally into `content_repo\new-learning-center-lessons\lesson-2.txt` must deploy not only to:
  - `/var/www/telepathyexperiment/cones/content_repo/new-learning-center-lessons/lesson-2.txt`
- but also to:
  - `/var/www/telepathyexperiment_private/cones/content/new-learning-center-lessons/lesson-2.txt`

Additional authoring rule:

- if lesson editing was done from `https://espgym.com`, the live private content store may become newer first
- editable content that can be saved from inside the live app is treated specially during a normal release
- managed editable content currently includes:
  - `content_repo\esp-lessons.txt`
  - `content_repo\learn-more-main.txt`
  - `content_repo\learn-more-clairvoyance.txt`
  - `content_repo\new-learning-center-outline.json`
  - `content_repo\new-learning-center-lessons\...`
  - and the matching local private authoritative files under `C:\xampp\telepathyexperiment_private\cones\content\...`
- if the local repo and local private managed content copies disagree, stop the release and resolve that local conflict first
- if the live repo/private managed editable content copies disagree, stop the release and resolve that live inconsistency first
- if live managed editable content differs from local authoritative content during a normal deployment, the normal prepare flow should:
  - back up the local authoritative editable-content files that will be overwritten
  - pull the live authoritative editable content down into both the local repo mirror and the local private authoritative tree
  - re-verify local repo/private consistency and lesson-set consistency before continuing
- after reconciliation, the refreshed local authoritative editable-content files become the source used for version bump, GitHub commit, and deployment
- do not assume a successful in-browser save on `espgym.com` has already updated the local authoring tree

The deploy helper is expected to enforce this automatically for normal releases so that live lesson and Learn More edits are preserved into the next GitHub checkpoint and deployment.

Additional authoring rule for Level 4 image pairs:

- if image pairs are added, deleted, or resized from `https://espgym.com`, the live public `imagepairs/` folder may become newer first
- the live server copy of `imagepairs/` is the operational authority for image-pair admin work performed through `espgym.com`
- local deployment copies for imagepairs are:
  - `C:\xampp\htdocs\telepathyexperiment\cones\imagepairs\...`
  - mirrored copy: `C:\xampp\htdocs\cones\imagepairs\...`
- if live `imagepairs/` differs from the local copies during a normal deployment, prepare-release should first sync the live imagepairs state down into those local copies before continuing
- live-to-local `imagepairs/` recovery still exists as a standalone action, but normal release prep should absorb this drift automatically
- use:
  - `powershell -ExecutionPolicy Bypass -File scripts\sync-imagepairs-from-live.ps1 -AuditOnly`
  - or `powershell -ExecutionPolicy Bypass -File scripts\sync-imagepairs-from-live.ps1`
- `prepare-release.ps1` may still be run with `-SyncImagePairsFromLive` for an explicit recovery-first pass, but normal release prep should already sync live imagepairs down automatically when drift is detected

Practical meaning:

- successful image-pair add/delete actions on `espgym.com` update the live authoritative `imagepairs/` state first
- normal release prep must refresh the local imagepairs copies from that live state before deployment continues
- do not assume the local `imagepairs/` folder has already been updated until the release sync step has run
- ordinary code releases should not re-upload or re-audit the full `imagepairs/` payload once the local copies have been refreshed from live
- the normal `prepare-release.ps1` manifest should therefore exclude `imagepairs/` files from `deploy_files` and `live_hash_audit_files` unless a dedicated image-pair maintenance workflow is being used

## Deploy Completeness Guard

The deployment process must fail closed if a changed deploy-relevant file is not covered by the authoritative deploy set.

Required rule going forward:

1. `scripts\deploy-live.ps1` owns one authoritative deploy file list
2. before deployment, the script must inspect changed files from:
   - baseline diff when available
   - staged diff
   - unstaged diff
   - untracked files
3. if a changed file is deploy-relevant and not covered by the deploy list, deployment must stop
4. documentation and script-only files may be explicitly allowlisted as non-deploy files
5. lesson content under `content_repo\new-learning-center-lessons\...` and `content_repo\new-learning-center-outline.json` is deploy-relevant content

Practical meaning:

- a changed app/runtime/content file may not be released unless it is explicitly in the deploy set
- temporary notes or scripts may be ignored only by explicit non-deploy rule
- if the script names a blocked file, fix the deploy list or remove the unintended file before continuing

## Local Debug Cache-Busting Rule

## Lesson-Set Integrity Rule

Lesson deployment must verify the lesson set as a lesson set, not just as a collection of files.

Required rule going forward:

1. before deployment, verify that every `lesson-page` id listed in `content_repo\new-learning-center-outline.json` has:
   - a matching repo lesson file under `content_repo\new-learning-center-lessons\`
   - a matching local private lesson file under `C:\xampp\telepathyexperiment_private\cones\content\new-learning-center-lessons\`
2. before deployment, verify that the repo outline and the local private outline name the same lesson ids
3. after deployment, verify that the live repo outline and the live private outline still name the same lesson ids as the local authoritative outline
4. after deployment, verify that every lesson id named in the live outline has a corresponding lesson file in both:
   - `/var/www/telepathyexperiment/cones/content_repo/new-learning-center-lessons/`
   - `/var/www/telepathyexperiment_private/cones/content/new-learning-center-lessons/`
5. if any expected lesson id is missing from either live location, treat the deploy as failed verification

Practical meaning:

- it is not enough for `lesson-4.txt` to exist somewhere
- the outline must still point to `lesson-4`
- and both the repo-side and private live lesson stores must contain `lesson-4.txt`

This prevents the exact failure mode where a deploy leaves files present but causes lessons to disappear from the Learning Center because the outline or lesson-set mapping drifted.

For local browser debugging, a fresh local version label is the primary defense against stale cache, not manual browser clearing.

Required rule going forward:

1. if browser-loaded HTML/CSS/JS has changed, do not trust an old local test URL
2. prepare local debug with:
   - `scripts\prepare-local-debug.ps1 -Version <new-local-version>`
3. this helper must:
   - bump all version-bearing local files
   - mirror-sync to `C:\xampp\htdocs\cones`
   - verify critical mirror hashes
   - verify sender/receiver/launcher/runtime version references are consistent
   - print the exact local test URLs to use
4. if the helper reports a mixed-version reference, stop local testing until it is fixed

Practical meaning:

- local debugging should not begin after asset changes until the local debug helper succeeds
- any edit to local browser-loaded HTML, CSS, JS, manifest, or service-worker files automatically requires a fresh local debug version before localhost testing
- if a tiny localhost UI change appears not to take effect, do not immediately add workaround code or assume the source edit failed
- first ask whether the changed files are still being served under the same local build version and service-worker cache name
- Chrome DevTools `Disable cache` is not a reliable cure for a same-version service-worker shell on `localhost`
- for local micro-changes that affect browser-loaded files, the right fix is usually a fresh local-only build/version label so the HTML, JS, manifest, and service worker move together to a new local version
- if the code now looks correct on disk but the browser still shows the old UI, prefer a local version bump before any more debugging patches
- the preferred test URL should come from the helper output, not from memory
- after any JavaScript edit, run a syntax check before handing over a local test URL:
  - `node --check C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js`
  - and also run `node --check` on any other changed JS file involved in the edit
- do not send the user to a local test URL until those syntax checks pass cleanly
- after syntax checks pass, mirror-sync `C:\xampp\htdocs\telepathyexperiment\cones` to `C:\xampp\htdocs\cones` before claiming the local build is ready
- if `http://localhost/...` behaves strangely on this machine because of stale cache or service-worker state, prefer the equivalent `http://127.0.0.1/...` URL for local browser testing because it uses a separate origin and bypasses that stale local browser state

Important warning:

- `127.0.0.1` is not just a cache workaround; it is a different browser origin from `localhost`
- that means `127.0.0.1` has a separate local-storage, service-worker, and identity/pro-status state
- do not send the user to `127.0.0.1` for ordinary app testing unless you explicitly warn that their recognized identity, PRO state, easy-admin state, and other local browser state will not carry over there
- use `127.0.0.1` only as a cache-isolation debugging origin

## Lesson Autobackup Retention

Lesson autobackups are intended as overwrite protection, not as an unbounded archive.

Required rule going forward:

1. lesson and outline autobackups are created before overwrite in the private backup tree
2. retention is capped at 8 backups per logical stream during current development
3. pruning must be surgical and may affect only these autobackup kinds:
   - `new-course-lesson`
   - `new-course-lesson-mirror`
   - `new-course-outline`
   - `new-course-outline-mirror`
4. pruning must never touch:
   - live authoritative lesson files
   - repo-side lesson files
   - questionnaires
   - pair/session data
   - logs
   - unrelated backup folders

Practical meaning:

- repeated saves of the same lesson should keep only the newest 8 backups for that specific lesson stream
- authoritative and mirror backup streams are retained separately
- if a path does not match the expected autobackup pattern, it must not be pruned

Primary live app path:

`/var/www/telepathyexperiment/cones`

Important:

- this is the actual live app tree for `espgym.com`
- `/var/www/espgym` may exist on the server, but it is not the authoritative live deployment target for the current app unless explicitly reconfigured later
- before any deployment, verify the active tree by checking for `telepathybeginner.html` under `/var/www/telepathyexperiment/cones`

Primary SSH transport:

`plink -batch -load "DG Putty Settings"`

Primary file push pattern:

```powershell
cmd /c type "C:\xampp\htdocs\telepathyexperiment\cones\somefile.ext" |
  plink -batch -load "DG Putty Settings" "cat > /var/www/telepathyexperiment/cones/somefile.ext"
```

Important:

Do not rely on the older PowerShell `Get-Content -Raw | plink ...` pattern for routine live pushes. In practice it can appear to succeed while leaving the live file unchanged. The `cmd /c type ... | plink "cat > ..."` pattern is the reliable default and should be treated as authoritative unless a better-tested transfer method replaces it later.

Large-file fallback:

If a direct `type ... | plink "cat > ..."` push appears to succeed but the live file content does not actually change, switch immediately to the staged `pscp` method below instead of retrying blindly.

1. upload the changed file(s) into a staging folder under `/home/ec2-user/`
2. verify the staged file sizes on the server
3. copy the staged files into `/var/www/telepathyexperiment/cones`
4. verify the live file contents afterward

Recommended staged upload pattern for large or flaky transfers:

```powershell
& "C:\Program Files\PuTTY\pscp.exe" -batch -load "DG Putty Settings" `
  "C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.js" `
  "ec2-user@13.57.83.174:/home/ec2-user/espgym_stage_<build>/telepathybeginner.js"

plink -batch -load "DG Putty Settings" `
  "cp /home/ec2-user/espgym_stage_<build>/telepathybeginner.js /var/www/telepathyexperiment/cones/telepathybeginner.js"
```

Do not assume a zero exit code alone proves the live file changed. Always verify the resulting live file content.

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

## Required Pre-Deployment Change Audit

Before any live deployment, do not rely on memory of what is "probably" included.

Always identify exactly what is about to go live.

Required audit sequence:

1. identify the last live baseline
   - ideally the last live GitHub checkpoint commit
   - if the exact commit is not known, stop and determine it first
2. diff the current local state against that live baseline
3. list all files that would be included in the deployment
4. classify the outgoing changes into:
   - current requested release work
   - older unreleased local work
   - version/cache-bump-only changes
5. if older unreleased local work is present, explicitly say so before deploying
6. do not describe a release as "small", "targeted", or "just this change" unless the diff confirms that is true

Minimum required commands before deployment:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones status --short
git -C C:\xampp\htdocs\telepathyexperiment\cones diff --stat <last-live-baseline>..HEAD
git -C C:\xampp\htdocs\telepathyexperiment\cones diff --name-only <last-live-baseline>..HEAD
```

If there are also uncommitted working-tree edits, inspect those too:

```powershell
git -C C:\xampp\htdocs\telepathyexperiment\cones diff --stat
git -C C:\xampp\htdocs\telepathyexperiment\cones diff --name-only
```

Release-boundary rule:

- never push a new live build until the outgoing change set is explicitly known
- if the user expects only one narrow feature to go live, either:
  - deploy from a clean tree containing only that feature, or
  - clearly warn that the deployment also includes other pending local changes

Behavior-summary rule:

- before deployment, summarize the outgoing changes in plain English at the feature level when there is any doubt
- do not force the user to infer release scope from file names or code diffs

This rule exists specifically to prevent old local changes from silently riding along with a later unrelated deployment.

## Required Deployment Discipline

Every live deployment must do all of the following:

1. identify the exact new build version string
2. complete the pre-deployment change audit against the last live baseline
3. update every relevant local version marker first
4. update the PWA cache/version surfaces whenever the build changes
5. create a server-side backup snapshot of the currently live files before overwriting them
6. mirror the changed local files to the live server
7. verify the live files contain the new version markers and key code changes
8. provide the user a clean cache-busted test URL
9. verify that the actual live files match the authoritative local files by SHA-256 hash for the audited deployment set

## Authoritative Deployment Helper

The authoritative deployment helper is:

- `C:\xampp\htdocs\telepathyexperiment\cones\scripts\prepare-release.ps1`
- `C:\xampp\htdocs\telepathyexperiment\cones\scripts\push-live.ps1`
- `C:\xampp\htdocs\telepathyexperiment\cones\scripts\deploy-live.ps1`

The deployment flow is now intentionally split into two concrete stages:

1. `prepare-release.ps1`
2. `push-live.ps1`

`deploy-live.ps1` is now only a thin wrapper that can:

1. run both stages in order
2. run only `-PrepareOnly`
3. run only `-PushOnly`

`prepare-release.ps1` owns the fast local/preflight work:

1. perform the release-boundary audit
2. verify deploy coverage
3. detect whether live editable content differs from the local authoritative tree and, when needed, reconcile it down into the local repo/private authoring copies before the version bump
4. run `scripts\bump-version.ps1`
5. sync the local mirror into `C:\xampp\htdocs\cones`
6. verify key mirror hashes
7. write a prepared-release manifest for the matching push step

`push-live.ps1` owns only the slower remote/live work:

1. verify the prepared manifest exists and matches the requested build
2. verify the local files still match the prepared hashes
3. create a server snapshot under `/home/ec2-user/espgym_live_snapshots`
4. upload files by staged `pscp`
5. copy the staged files into `/var/www/telepathyexperiment/cones`
6. verify the deployed version markers live
7. verify a post-deploy live SHA-256 file audit
8. verify the mirrored private managed-content set live

Preferred usage:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prepare-release.ps1 -Version 20260705g
powershell -ExecutionPolicy Bypass -File scripts\push-live.ps1 -Version 20260705g
```

Default rule:

- use the two-step helpers as the normal deployment path
- tell the user they may start live testing as soon as `push-live.ps1` finishes successfully
- do not improvise a manual live push unless the helper is failing and the user needs an urgent exception
- if a manual exception is ever used, fold the reason and the fix back into the helper and this runbook immediately afterward

If a one-command flow is still desired, the wrapper remains valid:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-live.ps1 -Version 20260705g
```

Expected behavior from the two-step flow:

1. `prepare-release.ps1` must finish before `push-live.ps1` is allowed to run
2. `push-live.ps1` must refuse to continue if the current local file hashes drift from the prepared manifest
3. `prepare-release.ps1` should finish quickly enough that local release readiness is obvious before the slower remote step begins
4. `push-live.ps1` should be treated as the only stage that may hit long network/server timing

Intentional override:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\prepare-release.ps1 -Version 20260705g -AllowDirty
powershell -ExecutionPolicy Bypass -File scripts\push-live.ps1 -Version 20260705g
```

`-AllowDirty` should be rare and used only on the prepare step when the operator deliberately wants to deploy an uncommitted working tree.

If the helper ever fails, fix the helper or the environment rather than reverting to an undocumented ad hoc deployment path.

## Required Post-Deploy Hash Audit

Version-marker verification alone is not sufficient.

A deployment can partially succeed and still leave one stale file on the server. For example:

- updated `receiver.html`
- updated `telepathy.js`
- stale `telepathy.css`

In that state, the live build may report the new version string while still rendering incorrectly.

Required rule going forward:

1. after copying files into the live tree, compare authoritative local SHA-256 hashes against the actual live files on the server
2. if any audited file hash differs, treat the deployment as failed verification
3. do not rely on zero exit codes from the transport alone
4. do not rely on `grep` for the build string alone
5. if the hash audit fails, stop and repair the live file set before telling the user the deployment is complete

The authoritative helper now performs this audit directly.

Minimum audited file set:

- `telepathybeginner.html`
- `telepathybeginner.js`
- `telepathybeginner.css`
- `telepathybeginner-sw.js`
- `telepathybeginner.webmanifest`
- `receiver.html`
- `sender.html`
- `telepathy.js`
- `telepathy.css`
- `api.php`
- `index.html`
- `.htaccess`
- `globe/index.html`
- `globe/globe.js`
- `globe/globe.css`
- `clairvoyance_rv_page.jpg`
- `tada.wav`

If the release materially affects another live asset not in that set, add it to the audit before deploying.

## Required Local Mirror Confirmation

After any meaningful code change set and again after any build bump, re-sync:

- `C:\xampp\htdocs\telepathyexperiment\cones`
- into `C:\xampp\htdocs\cones`

using:

```powershell
robocopy C:\xampp\htdocs\telepathyexperiment\cones C:\xampp\htdocs\cones /MIR /XD .git /R:1 /W:1
```

Do not merely run the mirror. Also explicitly note in the work log or user update that the mirror step was completed.

When using the authoritative helper, the mirror step and a key-file hash verification are part of the deployment itself and should not be treated as optional memory steps.

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

The authoritative helper already calls `bump-version.ps1`, so normal deployments should not run the bump separately first unless you are intentionally doing a dry preparatory pass.

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

Runtime cache-busting rule:

- If you changed runtime behavior or styling in `telepathy.js` or `telepathy.css`, do not assume the fresh launcher alone is enough.
- You must verify that both `sender.html` and `receiver.html` now reference the same new build string in:
  - `telepathy.css?v=...`
  - `telepathy.js?v=...`
  - the launcher home link `telepathybeginner.html?v=...&open=launcher`
- If those runtime shell files still point at an older build, the launcher can look fresh while the live runtime still serves stale JS/CSS.
- Before handing off a local test URL after runtime changes, confirm the visible URL version, `telepathy.js` `runtimeBuildVersion`, and the versioned asset references inside `sender.html` and `receiver.html` all match.

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

## Local Browser Verification Fallback

If local browser verification is needed and the Codex in-app browser cannot attach to a usable tab or webview:

- do not stop at the failed in-app browser attach
- use the installed local Playwright browser runtime for verification instead
- treat that Playwright runtime as the default fallback path for localhost checks on this machine

Known Playwright locations on this machine:

- preferred reusable helper package:
  - `C:\Users\dgrab\Documents\Codex\2026-05-01\to-start-with-i-want-to\playwright-ui-check\node_modules\playwright`
- previously installed package copies also exist at:
  - `C:\Users\dgrab\Documents\Codex\2026-04-28\this-chat-should-be-called-continuation\node_modules\playwright`
  - `C:\Users\dgrab\Documents\Codex\2026-04-28\this-chat-should-be-called-recovery\node_modules\playwright`
- installed browser runtime directory:
  - `C:\Users\dgrab\AppData\Local\ms-playwright`

Practical rule:

- if in-app browser attach fails, immediately switch to the installed Playwright runtime rather than leaving verification unfinished
- when reporting verification status, state plainly which browser path was actually used
- before attempting any reinstall, first check whether the preferred helper package above still exists and is callable
- for ordinary localhost UI verification on this machine, do not claim Playwright is unavailable until you have checked the preferred helper package above directly
- use `scripts\run-playwright-check.ps1` as the stable first-choice wrapper instead of re-discovering module paths manually
- if the bug involves a launcher card, modal, expanded panel, button flow, or navigation path, verify the real user path in `telepathybeginner.html` before handing a test URL to the user
- do not assume a fix in `telepathy.js`, `receiver.html`, or `sender.html` is sufficient until the launcher path has also been exercised when the issue begins from the launcher

Stable wrapper command:

- `powershell -ExecutionPolicy Bypass -File scripts\run-playwright-check.ps1 -CheckOnly`
- `powershell -ExecutionPolicy Bypass -File scripts\run-playwright-check.ps1 -ScriptPath <node-script.js>`

### Preferred Local UI Micro-Change Workflow

When the user wants to inspect a small browser UI revision locally without a full live release:

1. make the source edit
2. run `scripts\prepare-local-debug.ps1 -Version <new-local-version>`
3. use the helper's `http://localhost/telepathyexperiment/cones/...` URL as the primary test URL when identity, PRO status, admin state, or existing local browser state matters
4. verify the real rendered result with `scripts\run-playwright-check.ps1` before handing the URL to the user
5. only use `127.0.0.1` if the goal is explicit cache-isolation and the user has been warned that it is a separate origin

Practical meaning:

- a local cache-busted `localhost` URL is the normal first choice for app-path inspection on this machine
- do not switch the user to a separate-origin workaround if the issue is really just that the local build version was not advanced
- for UI work, prefer verifying the actual app path with Playwright rather than relying only on isolated mock pages

### Forced Isolated View Screenshot Fallback

If the goal is to visually verify one specific app view or card and normal navigation is wasting time:

- do not keep guessing from HTML/CSS alone
- create a temporary local inspection HTML file beside `telepathybeginner.html`
- in that temp file, inject a very small `<style>` block that hides every `.beginner-view` except the exact target view
- if needed, inject a tiny `<script>` block that removes `beginner-view-hidden` from the target and scrolls to the top
- then render that temp page with the local Chrome executable in headless screenshot mode

Recommended pattern on this machine:

- source file: `C:\xampp\htdocs\telepathyexperiment\cones\telepathybeginner.html`
- temporary inspection file:
  - `C:\xampp\htdocs\telepathyexperiment\cones\_telepathybeginner_<purpose>.html`
- screenshot output:
  - `C:\xampp\htdocs\telepathyexperiment\cones\<purpose>.png`
- Chrome executable:
  - `C:\Program Files\Google\Chrome\Application\chrome.exe`

Recommended command shape:

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' `
  --headless=new `
  --disable-gpu `
  --window-size=1280,2600 `
  --virtual-time-budget=3000 `
  --screenshot='C:\xampp\htdocs\telepathyexperiment\cones\<purpose>.png' `
  'http://localhost/telepathyexperiment/cones/_telepathybeginner_<purpose>.html?v=<cachebust>'
```

Important notes learned from actual use:

- on this machine, the headless Chrome command may print `... bytes written to file ...` after PowerShell has already attempted a follow-up `Get-Item`
- therefore, if immediate file inspection matters, add a short delay before checking the PNG or simply inspect the file path directly afterward
- if Playwright is not actually callable from the current local session, do not spend time fighting that first; use headless Chrome directly
- after generating the PNG, inspect the image itself before handing the page back to the user
- this fallback is especially useful for isolated layout work such as one guide page, one modal, one report, or one card row

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

## Live-Ready Reporting Rule

Do not wait for every post-release housekeeping step before telling the user the live build is testable.

Two milestones must be treated separately:

1. Live ready for testing
   This is reached as soon as:
   - the live deploy has completed
   - live verification has passed
   - the cache-busted test URL is known

   At that moment, immediately tell the user they may begin testing the live site in a new tab.

2. Release fully closed out
   This is reached after the remaining follow-up work is done, such as:
   - GitHub checkpoint commit/push
   - runbook updates
   - any final local housekeeping

Practical rule:

- once milestone 1 is reached, explicitly say:
  - the live build is ready to test now
  - the exact cache-busted URL
  - that any remaining closeout work is continuing afterward

This preserves safety while letting the user start testing as early as possible.

## Non-Negotiable Rule Going Forward

For ESP GYM live pushes:

backup first, then deploy, then verify, then provide the clean URL

Do not skip the backup step just because a patch seems small.

## To Resolve:

- Guided tour return has been visually stabilized, but there is still a potential remaining duplicate or double-load path in the launcher/runtime return handoff. If guided return blinking or a second post-return redraw reappears, inspect the guided return trace entries first before changing behavior again.

## Release Friction Log

This section records release-process friction that did not fully break a deployment but still wasted time, added noise, or encouraged risky manual judgment. Repeated items here should either be automated away in the helper or tightened in the documented workflow.

### 2026-08-09 observed friction

1. The normal "deploy first, then checkpoint the exact deployed state to GitHub" path still required `-AllowDirty`.
   That is workable, but it means the common release flow still depends on an override flag plus careful post-deploy follow-up.
   Hardening target:
   add an optional post-deploy Git checkpoint mode to `scripts\deploy-live.ps1` so one run can deploy the intended working tree, create the post-bump commit, and optionally push GitHub.

2. The helper prints a large raw version-marker dump from the live files during successful verification.
   That detail is helpful when something is wrong, but it is noisy during normal releases and makes the success path harder to scan.
   Hardening target:
   keep the full detail in a release log artifact, but collapse normal console output to a shorter success summary unless verification fails.

3. Git line-ending warnings still appear during manual post-deploy status and diff review.
   They do not currently block the release, but they add noise and make it easier to miss a real warning.
   Hardening target:
   standardize the line-ending policy for this repo and/or make the helper print one explicit note about expected line-ending warnings so they are not repeatedly rediscovered.

4. The helper reminds the operator to do the pre-deployment audit, but it does not yet emit one compact built-in audit artifact summarizing the release boundary.
   Hardening target:
   write a release-audit text file for each run containing:
   - current dirty files
   - deploy-relevant changed files
   - version label
   - snapshot path
   - final audited file count

### 2026-08-22 observed friction

1. `push-live.ps1` could complete the important remote copy/deploy work while appearing to hang silently during its later verification tail.
   That made it unclear whether the release was still progressing, already live, or truly stuck.
   Hardening applied:
   `push-live.ps1` now emits explicit phase-by-phase progress, writes a persistent release log artifact under `C:\xampp\telepathyexperiment_private\cones\release-logs\`, and labels the long-running upload/promote/hash-audit steps.

2. External `plink`/`pscp` calls previously had no explicit timeout handling.
   If one remote command stalled, the helper could sit indefinitely with no precise failing step.
   Hardening applied:
   `push-live.ps1` now runs those external commands through a checked wrapper with bounded timeouts, captured stdout/stderr, and step-specific failure messages.

3. Successful version verification printed raw `grep` output in some cases and silent `Out-Null` behavior in others, which made the normal path noisy in one place and opaque in another.
   Hardening applied:
   the helper now logs concise success messages for normal release phases and keeps detailed command output in the release log artifact for later inspection.
