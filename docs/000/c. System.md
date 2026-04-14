# System

## Purpose

This document is the single active system-file authority.

It now carries:

- the canonical `Files` registry meaning
- the app-facing `System Files` surface meaning
- the current file-guide index role
- the current open issues for file-definition governance

It exists so file-definition logic is no longer split across several overlapping documents.

## Identity

The clean rule is:

- `Files` is the canonical registry entity and sqlite table
- `System Files` is the app-facing file-definition surface backed by `Files`
- `System` is the single current document that explains both layers together

## Related Docs

- `docs/000/a. DAMP.md`
- `docs/002/a. Companion.md`
- `docs/000/d. File.md`
- `docs/000/i. UXDesign.md`
- `docs/000-canonical-structure.json`

## Glossary

| Term | Meaning |
| --- | --- |
| `Files` | The canonical entity and sqlite table that stores file-definition records. |
| `System Files` | The app-facing file-definition surface backed by `Files`. |
| `System` | The single current guide for file-definition registry logic, system-file governance, guide indexing, and open system-file issues. |
| `File Guide` | The `.md` guide attached to a file record. |
| `File Source Key` | The stable registry key used to connect a file row to the route/page registry. |
| `File Class` | Whether a file is a file or view. |
| `Ownership Mode` | The declared ownership rule for a file or field. |
| `Defined Structure` | The declared view structure that the shells are allowed to render. |

## What System Owns

`System` should help the app know:

- what files exist
- what kind of files they are
- which guide belongs to them
- which steward governs them
- which ownership mode applies
- which structure they require
- whether they are honestly born, partial, hidden, draft, or archived

This is not just a menu list.

It is the file-definition governance surface.

## Parent File Guide Rule

`System.md` now carries the parent file-guide rule for the system-file layer.

Every file should be born with its own accompanying `.md`.

That file-level guide should:

- explain the file to the `Owner`
- explain the file to the `File Steward`
- stay local to the file
- be visible from `System`
- be visible from the `Add/Edit File Shell`

This means:

- one file record
- one file guide
- one stable guide surface for governance, rendering, `LDB`, stewardship, and provenance

## Core Operating Rules

- Treat `Files` as the canonical registry entity for file-definition records.
- Treat `System Files` as the app-facing surface backed by `Files`.
- Treat canonical JSON as the first birth source for file structure; registry rows should register that structure, not invent it afterward.
- Every file row must include a `Defined_Structure` payload that the shells can render.
- Shells must refuse to infer fields when `Defined_Structure` is missing.
- Do not create a file row without a clear file source key, class, owner, steward, guide path, and structure declaration.
- Do not treat file visibility as equivalent to file birth.
- Do not add file visibility in layout code as a substitute for registry/canon acceptance.
- Do not use this system as a loose notes page; every row should help define file birth, ownership, rendering, governance, or guide linkage.
- If a file is visible in the app but missing here, surface that as drift.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`
- edit rule: owner and file steward governed

The `Owner` has final authority over file-definition direction.

The `File Steward` governs whether each file is born correctly, has the required guide path, and stays aligned with canon, runtime ownership, shell rendering, and provenance.

## Base Structure Rule

Minimum base structure required for every file:

- `System`: `ID`, `History`
- `General`: `Name` required, `Summary` optional
- `LDB`: empty relationship view derived from the declared system-file universe

The only recovery path for a missing shell structure is to seed the base structure in system registry truth.

Table/rendering implication:

- shared base fields such as `Name` and `Summary` should come from the declared file structure
- they should not be reintroduced later as local hardcoded table headers
- approved system columns such as `History` and `Status` should be declared and governed as system-level columns, not improvised per surface

## Birth Checklist

For system-file acceptance, the honest checklist is:

- canonical JSON structure exists
- registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- `System` requirement is declared
- `LDB` requirement is declared
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If any item is `no`, `partial`, or `unclear`, the file should not be treated as fully born.

## Bootstrap Rule

`System.md` also carries the system-side bootstrap rule.

The intended birth chain is:

1. `System` registry row
2. file guide
3. file-owned tokens and views
4. runtime/sqlite table and shell rendering

System-side working rule:

- bootstrap should derive creator, owner, steward defaults, and first governance context from the birth path whenever that path already determines them
- bootstrap should not rely on remembered exceptions when the system path can declare the answer
- if a runtime file, table, or shell exists without the matching system-row path, the file is not fully born

Reference inputs:

- `docs/000-canonical-structure.json`
- `docs/000-workbook-schema-companion.json`

These remain reference inputs, not live shell payload truth.

## Acceptance Contract

Use this first-pass file acceptance vocabulary:

- `Active`
- `Partial`
- `Draft`
- `Hidden`
- `Archived`

Working rule:

- `Active` means accepted for real use, but still requires runtime validation before normal visibility
- `Partial` means partially born and not ready for normal workspace navigation
- `Draft` means approved direction or work-in-progress inside the registry
- `Hidden` means intentionally not shown in normal workspace navigation
- `Archived` means historical retention only

Runtime reconciliation rule:

- runtime safety decides executable visibility
- system-file governance decides accepted intent
- disagreement means drift

## Fork Model Direction

The target direction is for the system-file layer to govern both fork characteristics and fork instruction payload.

That means it should eventually declare:

- whether forks are enabled
- whether a file uses no forks, view forks, create forks, or both
- which create forks exist
- which view forks exist
- what each fork is for
- which payload scope each fork owns

## File Guide Map

This document now replaces the old split file-guide index for the system-file layer.

Current map:

| File | Birth Status | Guide Path | Steward | Notes |
| --- | --- | --- | --- | --- |
| `System / Files` | `partially born` | `docs/000/c. System.md` | `File` | Canonical registry entity and app-facing system-file surface are both described here. |
| `BB Shell` | `partially born` | `docs/100/Archive/100-BB_Shell.md` | `UXDesign` | Runtime table and shell exist; promotion review still pending. |
| `Events` | `partially born` | `docs/100/a2. History.md` | `Intake` | Runtime event surface exists; promotion review still pending. |
| `Users` | `partially born` | `docs/100/a5. Users.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Contacts` | `partially born` | `docs/100/a4. Contacts.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Companies` | `partially born` | `docs/100/c1. Companies.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Opportunities` | `partially born` | `docs/100/c2. Opportunities.md` | `File` | Branch-capable runtime surface exists; promotion review still pending. |
| `Funds` | `partially born` | `docs/100/c7. Funds.md` | `File` | Runtime surface exists but is not workspace-visible yet. |
| `Rounds` | `partially born` | `docs/100/c8. Rounds.md` | `File` | Runtime surface exists but is not workspace-visible yet. |
| `Projects` | `partially born` | `docs/100/c3. Projects.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Tasks` | `partially born` | `docs/100/c4. Tasks.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Notes` | `partially born` | `docs/100/c5. Notes.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Artifacts` | `partially born` | `docs/100/c6. Artifacts.md` | `Intake` | Runtime surface exists; promotion review still pending. |
| `Intake` | `partially born` | `docs/100/b2. Intake.md` | `Intake` | Runtime surface exists; promotion review still pending. |
| `User Roles` | `partially born` | `docs/100/a3. User_Roles.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Companion Roles` | `partially born` | `docs/100/Archive/100-Companion_Roles.md` | `File` | Runtime surface exists; promotion review still pending. |
| `Markets` | `partially born` | `docs/100/d1. Markets.md` | `LAMP` | Runtime surface exists; promotion review still pending. |
| `Securities` | `partially born` | `docs/100/d2. Securities.md` | `LAMP` | Runtime surface exists; promotion review still pending. |
| `Access Assignments` | `parked direction` | `docs/100/Archive/100-Access_Assignments.md` | `File` | Archived future concept only; do not treat as active file-guide authority. |

## Current Open Issues

- Acceptance and navigation are still split.
  `System` status is becoming more honest, but executable navigation still follows runtime/bootstrap policy first.

- Protected bootstrap exceptions need a clearer long-term rule.
  `Files/System Files`, `Events`, and `BB Shell` are still treated as early exceptions.

- Guide promotion review is still pending for most mapped files.
  Many file guides now exist in archive as retained working material, but they should not be treated as current truth until reviewed honestly.

- Provenance reconstruction is still partial.
  File birth, promotion, and acceptance history should become more reconstructable through events.

- Add/Edit file guide linkage should become more direct.
  The Add/Edit File shell should prefer the selected file guide when available, not only the parent system guide.

## Open Questions

- Should file-guide indexing eventually be generated from registry rows instead of maintained manually?
- Should `Files` and `System Files` converge to one visible product name beyond this guide merge?
- Which file-definition fields are canonical rows versus derived display helpers?
- Which columns should appear first in the system-file table?
