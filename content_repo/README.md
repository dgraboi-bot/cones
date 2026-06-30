Tracked infrastructure content for ESP GYM lives in this folder.

Purpose:
- keep editable long-form app content under Git version control
- allow GitHub recovery of important non-code app text
- provide a stable reference copy separate from the writable private server storage

Current tracked infrastructure content:
- `learn-more-main.txt`
- `learn-more-clairvoyance.txt`
- `esp-lessons.txt`
- `learning-center-outline.json`
- `learning-center-lessons/*.txt`

Live app behavior:
- the live private server copies are the canonical runtime authority for editable infrastructure content
- local XAMPP editing should save to that live canonical copy first
- local private copies act as mirrors/cache
- each save should also refresh the matching tracked repo mirror copy
- these repo copies are the Git-tracked backup/reference copies

Private live copies:
- `C:\xampp\telepathyexperiment_private\cones\content\learn-more-main.txt`
- `C:\xampp\telepathyexperiment_private\cones\content\learn-more-clairvoyance.txt`
- `C:\xampp\telepathyexperiment_private\cones\content\esp-lessons.txt`
- `C:\xampp\telepathyexperiment_private\cones\content\learning-center-outline.json`
- `C:\xampp\telepathyexperiment_private\cones\content\learning-center-lessons\*.txt`

Operational note:
- the live private content tree is the canonical authority
- the tracked repo mirror exists so approved content can be committed to GitHub and recovered later
- if a local private mirror copy is missing, the app can seed it back from the tracked repo mirror
- when content is intentionally updated and accepted, commit the tracked mirror so GitHub contains the latest approved content
