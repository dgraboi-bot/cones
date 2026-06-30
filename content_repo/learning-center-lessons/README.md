Tracked lesson-page content files live in this folder.

Naming:
- `lost-found-harp.txt`
- `distance-does-not-matter.txt`
- ...

Operational intent:
- the running app reads and writes the private authoritative copies under:
  - `C:\xampp\telepathyexperiment_private\cones\content\learning-center-lessons\`
- each save also mirrors the lesson into this tracked repo folder
- if a private lesson copy is missing locally, the app seeds it back from this tracked mirror
- displayed lesson numbers live in `learning-center-outline.json`
- lesson content filenames are permanent IDs and do not need to change when lesson numbers are reordered

Git note:
- commit these files whenever lesson content is intentionally updated and approved
