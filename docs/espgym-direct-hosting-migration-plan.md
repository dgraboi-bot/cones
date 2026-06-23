# ESP GYM Direct-Hosting Migration Plan

This document captures the exact migration plan for moving the Telepathy Beginner / ESP GYM app from its current public home under `telepathyexperiment.com/cones/` to live directly under `espgym.com`.

Use the Git commit containing this file as the migration baseline. The intent is to preserve the current working app on the server and build the `espgym.com` deployment as a parallel copy first.

## Baseline

- Runtime version at planning time: `20260623au`
- Local working app root: `C:\xampp\htdocs\telepathyexperiment\cones\`
- Local mirror root: `C:\xampp\htdocs\cones\`
- Live public app root: `/var/www/telepathyexperiment/cones/`
- Live private app root: `/var/www/telepathyexperiment_private/cones/`
- Current `espgym.com` entrypoint: `/var/www/espgym/index.php`
- Current `espgym.com` behavior: temporary redirect to `remoteview.php`

## Current Runtime Footprint

- Public app size on server: about `23 MB`
- Private app size on server: about `468 KB`
- Public file count: about `797`
- Private file count: about `19`
- Composer/vendor runtime dependencies now exist locally and are part of the app runtime because `api.php` loads `vendor/autoload.php` for Web Push support

## Guiding Strategy

1. Preserve the current live app exactly where it is.
2. Create a second deployment for `espgym.com`.
3. Give the new deployment its own public root and its own private companion root.
4. Test the new origin thoroughly.
5. Only then decide whether to:
   - keep both apps live
   - redirect the old app to the new app
   - or retire the old public entry

## Existing Server Layout

### Preserve unchanged during migration

- `/var/www/telepathyexperiment/cones/`
- `/var/www/telepathyexperiment_private/cones/`

### Candidate new public layout

Preferred options, in order:

1. Dedicated app root under the `espgym` site:
   - `/var/www/espgym/app/`
   - with `/var/www/espgym/index.php` routing into it

2. Full direct replacement of the `espgym` site root:
   - `/var/www/espgym/`
   - only after the parallel app has already been proven

The safer option is `app/` first, because it lowers collision risk with older `espgym` files and simplifies rollback.

### Candidate new private layout

Preferred options, in order:

1. `/var/www/espgym_private/cones/`
2. `/var/www/telepathyexperiment_private/espgym_cones/`

The important requirement is that the new `espgym.com` app must not share operational state accidentally with the current `telepathyexperiment.com` app unless that is a deliberate choice.

## Exact File and Directory Plan

### Public files to copy into the new `espgym.com` app

Copy the full current public app tree from:

- `/var/www/telepathyexperiment/cones/`

into the new public app root, including:

- `api.php`
- `telepathybeginner.html`
- `telepathybeginner.js`
- `telepathybeginner.css`
- `telepathybeginner-sw.js`
- `telepathybeginner.webmanifest`
- `telepathybeginner-email-test.html`
- `telepathybeginner-email-test.js`
- `globe/`
- `imagepairs/`
- all image/icon assets
- `vendor/`

Do not copy `data_old/` unless explicitly desired.

### Private files to create or copy for the new app

Create a new private root with:

- `config/`
- `data/`
- `backup/`
- `logs/`

Copy in only the configuration or seed files that the new app actually needs, such as:

- mail config
- Stripe config
- VAPID config
- any template/config JSON files

Do not migrate legacy operational state unless explicitly desired.

## Code Areas Already Mostly Domain-Neutral

These are encouraging and reduce migration risk:

- most app asset loading is relative
- manifest file uses relative `start_url`
- service worker asset caching is versioned
- globe module uses relative file references
- image-pair loading is relative
- most frontend navigation URLs are constructed relative to current location

## Known Domain- / Host-Sensitive Assumptions

### 1. Private path assumption in `api.php`

Current logic assumes:

- Windows private root: `C:\xampp\telepathyexperiment_private\cones`
- Linux private root: `/var/www/telepathyexperiment_private/cones`

For `espgym.com`, this must be re-pointed to the new private root or made configurable.

### 2. Explicit Linux host assumption in `api.php`

There is logic that uses `telepathyexperiment.com` as the Linux host value. That must be reviewed and updated for direct hosting under `espgym.com`.

### 3. Stripe Checkout return URLs

Stripe itself is not hardcoded to the domain in the main PHP logic, but the configured:

- `success_url`
- `cancel_url`

must be updated for the new origin when the migration happens.

### 4. Web Push / notifications

Push subscriptions are origin-specific. Even with perfect code, moving from `telepathyexperiment.com` to `espgym.com` means:

- old push subscriptions do not carry over
- users must allow notifications again on the new origin
- the new origin must register its own service worker and push subscription cleanly

### 5. PWA identity

PWA install identity is also origin-sensitive. The new `espgym.com` app should be treated as a fresh app origin with its own:

- manifest
- service worker scope
- install identity
- notification permissions

## Exact Migration Checklist

### Phase A. Preserve current live app

1. Create a dated backup of:
   - `/var/www/telepathyexperiment/cones/`
   - `/var/www/telepathyexperiment_private/cones/`
2. Record the current runtime version.
3. Do not alter the old public app in place during initial migration.

### Phase B. Build the new public app in parallel

1. Create new public destination.
2. Copy current public app tree into it.
3. Keep the current `espgym.com` redirect unchanged until the parallel app is tested.

### Phase C. Build the new private companion in parallel

1. Create the new private root.
2. Copy only required config assets.
3. Set correct Apache/PHP ownership and permissions.
4. Start with fresh operational state.

### Phase D. Update code/config for the new origin

1. Update private root path assumptions.
2. Update host assumptions from `telepathyexperiment.com` to `espgym.com`.
3. Update Stripe return URLs in private config.
4. Update PWA manifest/start URL/service worker scope if the path changes.
5. Bump version fully for the new deployment.

### Phase E. Test the new `espgym.com` app thoroughly

1. App loads directly.
2. PWA installs correctly.
3. Service worker updates correctly.
4. Sender/receiver testing works.
5. Remote viewer flow works.
6. Reports work.
7. Visualization works.
8. Globe works.
9. Location picker works.
10. Messaging works.
11. Notifications work.
12. Stripe checkout works.
13. Stripe return flow works.
14. Admin tools work.
15. Email sending still works.

### Phase F. Switch public traffic only after success

1. Change `/var/www/espgym/index.php` to point to the new app.
2. Keep rollback simple by leaving the old app intact.

## Fresh-Start Policy for Migration

The user has explicitly said there are no legacy users to preserve and a fresh start is acceptable.

That means the migration can safely:

- start with fresh app identity state
- start with fresh messaging/push subscription state
- start with fresh session state
- optionally start with fresh user summary / pair summary state

Items that still require deliberate choice at migration time:

- whether to preserve Stripe subscriber records
- whether to preserve demo data
- whether to preserve image-pair data or rebuild it cleanly in the new deployment

## Suggested Local Parallel Structure

When ready to migrate, mirror the new live structure locally too.

Suggested local public root:

- `C:\xampp\htdocs\espgym\app\`

Suggested local private root:

- `C:\xampp\espgym_private\cones\`

This keeps local testing aligned with the new live domain intent while leaving the current local `telepathyexperiment\cones` app untouched.

## Rollback Plan

If anything goes wrong:

1. Leave `/var/www/telepathyexperiment/cones/` untouched and usable.
2. Revert only the `espgym.com` routing.
3. Because the old app remains intact, rollback should be fast and low-risk.

## Notes for the Actual Migration Session

- Re-check all hardcoded `telepathyexperiment.com` and path assumptions before cutover.
- Re-test push notifications because origin change always matters.
- Re-test Stripe success/cancel return behavior on the new origin.
- Expect installed PWAs to behave as a fresh app on the new origin.
- Treat the Git commit containing this file as the migration planning baseline.
