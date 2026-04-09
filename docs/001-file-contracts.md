# File Contracts

This document holds steward-facing file guidance outside the Add/Edit File surface.

## General Clause

- Each file should inherit its naming from the actual file/entity name.
- Canonical structure should remain the source of truth for sections, subgrouping, and leaf identity.
- `L3 Key` and `Write Target` should normally align at bootstrap unless there is an explicit exception.
- Runtime naming may temporarily remain on legacy entities only when required to avoid breaking current backend paths.
- File-level guidance should live here, not inside constrained shell boxes.

## File-Specific Rules

### Artifact Processed

- Use this file for processed-artifact ownership and downstream artifact-processing activity.
- Keep file-facing naming on `Artifact_Processed`.
- Any remaining `Artifacts_Processed` runtime naming should be treated as temporary compatibility only.

### Companies

- Use KDB ordering based on bootstrap/use order rather than legacy historical order.
- Keep visible token naming aligned to the actual linked file/entity names.

### Notes

- Add file-specific rules here as they are clarified.
