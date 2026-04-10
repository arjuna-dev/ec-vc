# System Files

## File Identity

- file name: `System Files`
- file guide: `docs/001-System_Files.md`
- parent guide: `docs/001-Files.md`
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

- `docs/001-Files.md`
- `docs/000-Owner.md`
- `docs/000-Companion.md`
- `docs/010_File_Steward.md`
- `docs/010_UX_Steward.md`
- `docs/010_Architect_Steward.md`
- `docs/011-record-architecture-master-plan.md`
- `docs/000-canonical-structure.json`
- `docs/000-electron-runtime-architecture-guide.md`

## Operating Rules

- Use `System Files` as the registry for file-definition truth.
- Treat canonical JSON as the first birth source for file structure; `System Files` records should register that structure, not invent it afterward.
- Do not treat a file as fully born if it has no guide.
- Do not treat a file as fully born if its UX fork questions are missing.
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
- referenced rulebooks and manuals
- birth and provenance requirements

## Governance

`System Files` is governed by:

- `Owner`
- `File Steward`
- `Files.md`
- canonical structure
- runtime ownership

This file should not be bypassed when creating or accepting a new file.

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
- event log linkage
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
- ownership mode
- steward
- rulebook dependencies
- file guide path
- defined structure
- glossary terms introduced

## Open Questions

- Should `Files` and `System Files` converge to one visible name?
- Which columns should appear first in the `System Files` table?
- Which file-definition fields are canonical rows versus derived display helpers?
