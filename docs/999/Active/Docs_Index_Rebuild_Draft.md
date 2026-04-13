# Docs Index Rebuild Draft

## Purpose

This draft proposes the next docs indexing system before any physical move happens.

It exists so the repo can shift to a cleaner top-level layer model without losing authority, context, or archive memory.

## Proposed Layer Logic

- `000` = architecture layer
- `001` = user layer
- `002` = companion layer
- `003` = context layer

The supporting branch pattern under each layer should stay consistent:

- `000` = top architecture authority
- `100` = user-file and user-surface guides
- `200` = companion role guides when needed
- `300` = context guides when needed

Simple reading rule:

- `000` explains how the system is built
- `001` explains the user-facing operating layer
- `002` explains the companion layer
- `003` explains the context layer

## Folder Rule

Current truth should live directly in each top folder.

Only `Archive` should remain as a subfolder when needed.

That means the future shape should prefer:

- `docs/000/*.md`
- `docs/001/*.md`
- `docs/002/*.md`
- `docs/003/*.md`
- `docs/000/Archive/*.md`
- `docs/001/Archive/*.md`
- `docs/002/Archive/*.md`
- `docs/003/Archive/*.md`

`Draft` folders should not remain as a default pattern unless a later pass proves they are still needed.

## Proposed Current Tree

### `docs/000`

This becomes the top architecture layer.

Proposed current files:

- `docs/000/DAMP.md`
- `docs/000/LAMP.md`
- `docs/000/Recipe.md`
- `docs/000/Translators.md`
- `docs/000/Games.md`
- `docs/000/Game_Operation.md`
- `docs/000/Game_Rulebook.md`
- `docs/000/Archive/*`

Role of this layer:

- architecture authority
- launch architecture
- tested recipe patterns
- translator/scaffolding logic
- top-layer game/context operation while file org and intake are still converging

### `docs/001`

This becomes the user layer.

Proposed current files:

- `docs/001/Files.md`
- `docs/001/System_Files.md`
- `docs/001/File_Guides_Index.md`
- `docs/001/Archive/*`

Proposed rule:

- only user-facing system-layer docs should live here
- parent file-guide authority should no longer live here once it is fully absorbed by `DAMP`

### `docs/100`

This remains the detailed user-file guide branch.

Proposed current files:

- `docs/100/Access_Assignments.md`
- `docs/100/Artifacts.md`
- `docs/100/BB_Shell.md`
- `docs/100/Companies.md`
- `docs/100/Companion_Roles.md`
- `docs/100/Contacts.md`
- `docs/100/Events.md`
- `docs/100/Funds.md`
- `docs/100/Intake.md`
- `docs/100/Markets.md`
- `docs/100/Notes.md`
- `docs/100/Opportunities.md`
- `docs/100/Projects.md`
- `docs/100/Rounds.md`
- `docs/100/Securities.md`
- `docs/100/Tasks.md`
- `docs/100/User_Roles.md`
- `docs/100/Users.md`
- `docs/100/Archive/*`

### `docs/002`

This becomes the companion layer.

Proposed current files:

- `docs/002/Companion_Manual.md`
- `docs/002/Archive/*`

### `docs/020`

This remains the steward branch under the companion layer.

Proposed current files:

- `docs/020/Architect_Steward.md`
- `docs/020/Design_Steward.md`
- `docs/020/File_Steward.md`
- `docs/020/Game_Steward.md`
- `docs/020/Glossary_Steward.md`
- `docs/020/Intake_Steward.md`
- `docs/020/Provenance_Steward.md`
- `docs/020/Runtime_Steward.md`
- `docs/020/UX_Steward.md`
- `docs/020/Archive/*`

### `docs/003`

This becomes the context layer.

Current thought:

- keep this light for now
- let it grow only when context documents become distinct from architecture and game operation

Possible future files:

- context index
- points logic overview
- region/firm/workflow context guides

### `docs/300`

This remains the deep context guide branch when needed.

Current thought:

- use only if the context layer becomes large enough to justify detailed sub-guides

## Migration Rule

Do not move this structure all at once blindly.

Use the migration in short loops:

1. confirm target filenames
2. move one layer family
3. repair references
4. confirm authority still reads clearly
5. only then move the next family

## What This Proposal Tries To Preserve

- one clear architecture top layer
- one clear user layer
- one clear companion layer
- one clear context layer
- archive memory without folder sprawl
- fewer active truth locations
- easier reading order for humans and companions

## Open Questions

- should `Games`, `Game_Operation`, and `Game_Rulebook` stay in `000` permanently, or only while top-layer context is still converging?
- should `001` contain only user-layer overview docs, with all detailed file guides living in `100`?
- should `003` remain mostly empty until context grows, or should we seed it early with a single root context guide?
- should we rename `100-*` style files to drop numeric prefixes once the folder structure itself is doing the indexing work?
