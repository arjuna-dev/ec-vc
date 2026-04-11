# System Files

## File Identity

- file name: `System Files`
- file guide: `docs/100/Active/100-System_Files.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Files`
- app-facing label: `System Files`
- canonical owner identity: `Owner`

## Purpose

`System Files` is the first file-definition surface.

It exists to define, register, and govern the files that the system is allowed to create, render, and maintain.

This file is not just a menu list.

It is the file-definition layer that helps the system know:

- what files exist
- what kind of files they are
- which file guide belongs to each file
- whether each file requires `System`
- whether each file requires `KDB`
- who owns each file
- which steward governs each file
- which rulebooks and manuals each file depends on
- whether the file uses create branches, view forks, or no forks
- which fork instructions govern how payload and creation should change

## Glossary

| Term | Meaning |
| --- | --- |
| `System Files` | The app-facing file-definition surface. |
| `Files` | The canonical entity behind the `System Files` surface. |
| `File Guide` | The `.md` guide that explains and governs a specific file. |
| `File Class` | Whether a file is an `L1`, `L2`, or `L2.a`. |
| `Ownership Mode` | The declared ownership rule for a file or field. |
| `Steward` | The companion or role responsible for keeping a file correct. |
| `System` | The shared provenance and runtime-control L2 section. |
| `General` | The shared human-readable description L2 section. |
| `KDB` | The declared relationship L2 section. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/000/Active/000-Owner_Manual.md`
- `docs/002/Active/002-Companion_Manual.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/020/Active/020_UX_Steward.md`
- `docs/020/Active/020_Architect_Steward.md`
- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/000-canonical-structure.json`
- `docs/000/Active/000-electron-runtime-architecture-guide.md`

## Operating Rules

- Use `System Files` as the registry for file-definition truth.
- Treat canonical JSON as the first birth source for file structure; `System Files` records should register that structure, not invent it afterward.
- Do not treat a file as fully born if it has no guide.
- Do not treat a file as fully born if its UX fork questions are missing.
- Do not treat a branchable file as fully born if its create-branch or view-fork instructions are missing.
- Do not treat a file as fully born if its `System`, `General`, or required `KDB` sections are missing.
- Do not add file visibility in layout code as a substitute for registry/canon acceptance.
- Do not load canonical structure through scattered direct JSON imports; use the approved canonical loader boundary.
- Do not use this file as a loose notes page; every row should help define file birth, ownership, rendering, governance, or guide linkage.
- If a file is visible in the app but missing here, surface that as drift.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`
- edit rule: owner and file steward governed

The `Owner` has final authority over file-definition direction.

The `File Steward` governs whether each file is born correctly, has its required guide, and is connected to the right KDB relationships.

`File_Owner` should mean the actual owning authority for the file.

In the current system direction, that is the real `Owner`, not a loose placeholder field.

## Owner

The `Owner` should use `System Files` to understand:

- which files exist
- why they exist
- which ones are ready
- which ones still need guide, KDB, or runtime work
- which companions or stewards govern the file

## File Steward

The `File Steward` should use `System Files` to validate:

- file name
- file class
- file guide path
- required `System` section
- required `General` section
- required `KDB` section
- ownership mode
- steward assignment
- create-branch instructions
- view-fork instructions
- referenced rulebooks and manuals
- birth and provenance requirements

## UX Steward

The `UX Steward` should use `System Files` to make file-definition choices understandable to the user.

The first user-facing fork should ask:

`Is this a new file the user should be able to find, govern, and open?`

For `System Files`, the answer is yes.

That means:

- `System Files` is an `L1`
- it should be visible as a governed file-definition surface
- it should have its own file guide
- it should expose the file-definition fields needed to guide future file birth

The safe default for new user-created concepts is also `L1` until the user or steward confirms the concept is only a section or subsection inside an existing file.

## File Birth Checklist

For `System Files`, the initial checklist is:

- canonical JSON structure exists: `yes`, entity `Files`
- `System Files` registry row exists: `yes`, source key `file-system`
- file guide exists: `yes`, `docs/100/Active/100-System_Files.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `yes`, this guide defines the initial `L1/L2/L2.a` fork
- create-branch instructions are declared: `yes`, branchable files must declare them in canon/registry before create flows depend on them
- view-fork instructions are declared: `yes`, branchable files must declare them in canon/registry before toolbar/tune payload depends on them
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Files`
- shell rendering path is declared: `yes`, route `/file-system`
- events/provenance path is declared: `partial`, event log linkage exists but full genesis event reconstruction is still an open runtime task

If any item regresses from `yes` to `partial`, `unclear`, or `no`, the file should be treated as not fully born until the gap is surfaced.

## Governance

`System Files` is governed by:

- `Owner`
- `File Steward`
- `Files.md`
- canonical structure
- runtime ownership

This file should not be bypassed when creating or accepting a new file.

## Birth Governance

`System Files` should help govern birth context, not duplicate it.

That means the file-definition flow should prefer to derive:

- creator
- initial owner
- steward defaults
- branch-aware governance
- first provenance/event links

from:

- the active actor
- the selected file birth path
- declared create branches
- approved birth relationships

The user should not be asked to restate those values manually when the birth path already determines them.

`System Files` should eventually make those birth-governance rules visible and reviewable as part of file-definition truth.

`Creator` should be treated as birth-derived provenance under governed edit, not as a loose editable field.

That means the first accepted birth action should determine it:

- direct create by user -> `User`
- intake approval by companion -> `Companion`
- intake approval by user -> `User`

Later edits may add history, and governed edits may overwrite the visible creator when permissions allow.

If a later edit is allowed by the user's role or clearance, `Creator` may be updated.

When that happens, the event trail should preserve:

- who changed it
- when it changed
- what the previous creator value was

## Provenance / Events

The system should be able to reconstruct:

- when a file definition was created
- who created it
- when its guide was created
- when its guide changed
- when its KDB requirements changed
- when it became visible or accepted as a real file

## L2 File System

### System

The `System` section should track:

- file id
- creator
- datetime
- event log linkage to rows in the `Events` file
- guide path
- runtime status

### General

The `General` section should track:

- file name
- file summary
- file class
- file status

### KDB

The `KDB` section should track set relationships to:

- `Owner`
- `Users`
- `Contacts`
- `File Steward`
- `Companion Roles`
- `Events`
- rulebooks and manuals

These relationships should be born deliberately, not discovered by later guessing.

### File Specific

The file-specific section should track:

- whether the file requires `System`
- whether the file requires `KDB`
- fork mode
- fork enabled
- ownership mode
- file owner
- steward
- rulebook dependencies
- file event log
- file guide path
- create-branch instructions
- view-fork instructions
- defined structure
- glossary terms introduced

Fork characteristics should be tracked explicitly here.

The working fork fields are:

- `fork_mode`
  - `none`
  - `view`
  - `create`
  - `view_and_create`
- `fork_enabled`
  - `yes`
  - `no`

These fields should help the system know whether a file:

- has no fork behavior
- uses forks only to change page payload
- uses forks only to change create birth path
- uses forks for both rendering and creation

Example direction:

- `Companies`
  - `fork_mode: view`
- `Opportunities`
  - `fork_mode: create`

## Target Fork Model

The target direction is for `System Files` to govern both fork characteristics and fork instruction payload.

That means the file-definition layer should eventually be able to say:

- whether forks are enabled
- whether the file uses:
  - no forks
  - view forks
  - create forks
  - both
- which create forks exist
- which view forks exist
- what each fork is for
- which payload scope each fork owns

The intended split is:

- create forks
  - govern file birth and create-target choice
  - help the user decide whether creation stays `L1` or branches into another declared path
- view forks
  - govern reading, rendering, tune payload, and file perspective
  - do not automatically imply a different birth path

Working examples:

- `Opportunities`
  - create-fork file
- `Companies`
  - view-fork-only file

This target model should be treated as the direction for future `System Files` rows even when the full fork instruction payload still lives in registry truth during the current phase.

## Open Questions

- Should `Files` and `System Files` converge to one visible name?
- Which columns should appear first in the `System Files` table?
- Which file-definition fields are canonical rows versus derived display helpers?

Acceptance contract direction lives in:

- `docs/010/Draft/010-files-system-birth-audit.md`

## Acceptance Contract Working Rule

`System Files` should govern acceptance after bootstrap, not replace bootstrap.

The working status vocabulary is:

- `Active`
- `Partial`
- `Draft`
- `Hidden`
- `Archived`

The working visibility rule is:

- only `Active` files that pass runtime validation should appear in normal workspace navigation
- `Partial`, `Draft`, `Hidden`, and `Archived` files should stay governable in `System Files`, but not appear in normal workspace navigation

Runtime validation should check:

- canonical entity exists
- route/runtime registry exists
- shell rendering path exists
- runtime ownership exists where required
- `File_Guide_Path` exists, unless the file is a protected bootstrap exception

Protected bootstrap exceptions currently include:

- `Files` / `System Files`
- `Events`
- `Building_Blocks`

If `System Files` and runtime disagree:

- do not guess
- do not silently merge
- surface drift explicitly

Current working reconciliation rule:

- runtime safety decides executable visibility
- `System Files` decides accepted intent
- disagreement means drift
