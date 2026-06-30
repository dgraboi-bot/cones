# ESP GYM Editable Infrastructure Content Model

This document defines how editable long-form app content should behave going forward.

## Scope

These content types are not ordinary user data. They are editable app infrastructure:

- `learn-more-main.txt`
- `learn-more-clairvoyance.txt`
- `esp-lessons.txt`
- `learning-center-lessons/lesson-*.txt`

## Authority Rule

The canonical authority for editable infrastructure content is the live private server content tree:

- `/var/www/telepathyexperiment_private/cones/content/`

When an admin edits infrastructure text from either the local XAMPP app or the live app:

1. the save should go to the live canonical server copy
2. local private copies are treated as mirrors/cache, not as an independent authority

## Mirror Rule

A tracked mirror of the same content lives under:

- `content_repo/`

Purpose:
- keep approved editable infrastructure text under Git version control
- allow GitHub recovery of important app text
- provide a seed source if a local private mirror copy is missing
- keep local development copies aligned with the live canonical content

## Save Behavior

When one of these files is saved through the app:

1. the live canonical private copy is updated first
2. if running from a local environment, the local private mirror may be refreshed next
3. the matching tracked repo mirror copy should also be refreshed

## Seed / Recovery Behavior

If a local private editable infrastructure file is missing:

- the app should seed it back from the tracked mirror under `content_repo/`

If both are missing and a default exists:

- the app may recreate both copies from the default

## GitHub Rule

GitHub still cannot be updated directly by a running browser session.

Therefore:
- the tracked mirror is what should be committed
- any approved content changes should be committed from the working repo so GitHub contains the latest accepted version

Helpful local helper:
- `scripts/sync-editable-content-to-repo.ps1`

## Practical Consequence

Live-server edits are canonical.

Local XAMPP editing is allowed, but the save path should still target the live server copy first so infrastructure text does not quietly diverge.

The important rule is now:
- live private server copy = canonical authority
- local private copy = mirror/cache
- tracked repo copy = Git-tracked backup and recovery copy
