# Files

## File Identity

- file name: `Files`
- file guide: `docs/100/Active/100-Files.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `File`
- canonical entity: `Files`
- app-facing label: `System Files`
- canonical owner identity: `Owner`

## Purpose

`Files` is the canonical file registry entity.

It stores the file-definition records that tell the system which files exist, how they are classified, which guide belongs to them, which structure they require, and how they should be governed.

This guide is different from `docs/001/Active/001-Files.md`.

- `docs/001/Active/001-Files.md` is the parent rule for all file guides.
- `docs/100/Active/100-Files.md` is the guide for the actual `Files` canonical entity and registry table.
- `docs/100/Active/100-System_Files.md` is the guide for the app-facing `System Files` surface backed by `Files`.

The clean rule is:

`Files` is the canonical registry entity.

`System Files` is the app-facing file-definition surface.

## Glossary

| Term | Meaning |
| --- | --- |
| `Files` | The canonical entity and sqlite table that stores file-definition records. |
| `System Files` | The app-facing surface that exposes and governs the `Files` registry. |
| `File Guide` | The `.md` guide attached to a file record. System file guides live in `docs/100`. |
| `File Source Key` | The stable registry key used to connect a file row to the file/page registry. |
| `File Class` | Whether a file is a file, view, or subgroup. |
| `File Order` | The display or creation order used by the registry and file shell. |
| `Ownership Mode` | The ownership model for the file, such as `root_owned`. |
| `Defined Structure` | The declared view structure for the file. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Active/100-File_Guides_Index.md`
- `docs/100/Active/100-System_Files.md`
- `docs/000/Active/000-Owner_Manual.md`
- `docs/002/Active/002-Companion_Manual.md`
- `docs/000/Active/000-language-reference-glossary.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/020/Active/020_Architect_Steward.md`
- `docs/020/Active/020_UX_Steward.md`
- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Files` as the canonical registry entity for file-definition records.
- Treat `System Files` as the app-facing surface backed by `Files`.
- Do not confuse the parent guide `001-Files.md` with the `Files` registry entity.
- Do not create a file row without a clear file source key, class, owner, steward, guide path, and structure declaration.
- Do not treat file visibility as equivalent to file birth.
- Do not treat a guide path as proof that the file is fully born.
- Use the file birth checklist to decide whether a file is active truth, draft direction, partial, or not born.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`
- edit rule: owner and file steward governed

The `Owner` has final authority over which files are accepted into the local system.

The `File Steward` governs whether file rows and guide paths honestly match canon, runtime ownership, shell rendering, and provenance.

## Owner

The `Owner` should use `Files` to understand:

- which file records exist
- which app-facing file surfaces are accepted
- which files are active, draft, archived, or incomplete
- where each file guide lives
- who owns and governs each file
- which shared sections are declared in `Defined Structure`
- whether the file is fully born or only approved direction

## File Steward

The `File Steward` should use `Files` to validate:

- file name
- file status
- file guide path
- file source key
- canonical entity
- runtime entity
- route name
- file path
- file order
- file class
- ownership mode
- steward
- rulebook dependencies
- defined structure
- glossary terms

The `File Steward` should stop if the registry row says a file is ready but the honest birth checklist says otherwise.

## UX Steward

The `UX Steward` should make file-definition choices understandable when a user or steward creates or edits a file record.

The first user-facing question should be:

`Is this a file the user should be able to find, govern, and open?`

If yes, the safe default is a file.

If no, the user should be guided toward:

- a view when the concept is a major section inside an existing file
- a subgroup when the concept is a subgroup inside an existing section

The UI should make the guide lifecycle understandable:

- `Active` means current file-guide truth
- `Draft` means approved or working direction, not fully born
- `Archive` means retained history

## Governance

`Files` is governed by:

- `Owner`
- `File Steward`
- `Files.md`
- `System Files`
- canonical structure
- runtime ownership
- events/provenance rules

The registry should not be bypassed by menu-only visibility, page-only routes, or local shell patches.

## Provenance / Events

The system should be able to reconstruct:

- when a file row was created
- who created or accepted the file row
- when the file guide was added
- when the file guide moved between `Draft`, `Active`, or `Archive`
- when file structure requirements changed
- when runtime ownership changed
- when shell rendering became available

Current status:

- file row creation and file visibility exist in runtime
- full genesis event reconstruction remains `partial`

## File Birth Checklist

For `Files`, the current checklist is:

- canonical JSON structure exists: `yes`, entity `Files`
- `System Files` registry row exists: `yes`, source key `file-system`
- file guide exists: `yes`, `docs/100/Active/100-Files.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `yes`, this guide describes the first file/view/subgroup fork
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Files`
- shell rendering path is declared: `yes`, app-facing route `/file-system`
- events/provenance path is declared: `partial`, event log linkage exists but full genesis event reconstruction is still an open runtime task

This means `Files` is active and runtime-backed, but still `partially born` until provenance reconstruction is complete.

## View Structure

### System

The `System` section tracks:

- `ID`
- `Creator`
- `Datetime`
- `EventLog`

Runtime aliases include:

- `id`
- `created_by`
- `created_at`
- `File_EventLog`

### LDB

The `LDB` section tracks relationships to:

- `Owner`
- `Users`
- `Contacts`
- `Companion Roles`
- `Events`
- rulebooks and manuals

The `File_Rulebook` token writes through `Rulebook_Dependencies`.

### General

The `General` section tracks:

- `Name`
- `Summary`

Runtime aliases include:

- `File_Name`
- `File_Summary`

### File Specific

The `File Specific` section tracks the registry-specific fields:

- `File_Status`
- `File_Guide_Path`
- `File_Source_Key`
- `File_Canonical_Entity`
- `File_Runtime_Entity`
- `File_Route_Name`
- `File_Path`
- `File_Order`
- `File_Class`
- `Ownership_Mode`
- `File_Steward`
- `Rulebook_Dependencies`
- `Defined_Structure`
- `Glossary_Terms`

These fields are not record-content fields for another file.

They are file-definition metadata used to keep file creation, rendering, ownership, and guidance aligned.

## Open Questions

- Should `Files` eventually generate `docs/100/Active/100-File_Guides_Index.md` automatically?
- Should guide lifecycle moves create explicit file-level events?

Acceptance contract direction lives in:

- `docs/010/Draft/010-files-system-birth-audit.md`

## Acceptance Contract Working Rule

Use this first-pass file acceptance vocabulary:

- `Active`
- `Partial`
- `Draft`
- `Hidden`
- `Archived`

Working rule:

- `Active` means accepted for real use, but still requires runtime validation before nav visibility
- `Partial` means partially born and not ready for normal workspace navigation
- `Draft` means approved direction or work-in-progress inside `System Files`
- `Hidden` means intentionally not shown in normal workspace navigation
- `Archived` means historical retention only

For normal visible files:

- `File_Guide_Path` should exist

If a file has no guide path:

- it should remain governable in `System Files`
- it should not be treated as fully born
- its safe status should be `Partial` or `Draft`

Protected bootstrap exceptions currently include:

- `Files` / `System Files`
- `Events`
- `Building_Blocks`

These exceptions are allowed because startup, provenance, or shared UI architecture depends on them early.

They do not weaken the acceptance rule for normal files.
