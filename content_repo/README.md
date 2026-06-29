Tracked infrastructure content for ESP GYM lives in this folder.

Purpose:
- keep editable long-form app content under Git version control
- allow GitHub recovery of important non-code app text
- provide a stable reference copy separate from the writable private server storage

Current tracked infrastructure content:
- `learn-more-main.txt`
- `learn-more-clairvoyance.txt`

Live app behavior:
- the running app currently reads and writes the private copies under the private storage tree
- these repo copies are the Git-tracked backup/reference copies

Private live copies:
- `C:\xampp\telepathyexperiment_private\cones\content\learn-more-main.txt`
- `C:\xampp\telepathyexperiment_private\cones\content\learn-more-clairvoyance.txt`

Operational note:
- when Learn More content is intentionally updated and accepted as the authoritative version, these tracked copies should be refreshed and committed so GitHub contains the latest approved content
