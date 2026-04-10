# System Files Open Issues

## Purpose

This document is the active issue board for `System Files`.

It should track current acceptance, guide, naming, runtime, and navigation issues that still need review or cleanup.

## Current Open Issues

- Acceptance and navigation are still split.
  `System Files` status is becoming more honest, but executable navigation still follows runtime/bootstrap policy first.

- Protected bootstrap exceptions need a clearer long-term rule.
  `Files/System Files`, `Events`, and `BB Shell` are currently treated as early exceptions, but that policy should eventually be made more explicit in runtime behavior.

- Guide promotion review is still pending for most mapped files.
  Many mapped files now have draft guides, but they should not move to `Active` until file birth and runtime truth are reviewed honestly.

- Provenance reconstruction is still partial.
  File birth, promotion, and acceptance history should become more reconstructable through events.

- Add/Edit file guide linkage should become more direct.
  The Add/Edit File shell should prefer the selected file guide when available, not only the parent files guide.

## Working Rule

When an issue is resolved:

- update the runtime/source layer first when that is the real owner
- update the guide or steward doc if wording or policy changed
- remove the issue from this board only when the surface, meaning, and behavior are aligned again
