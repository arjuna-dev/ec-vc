# System

## Purpose

This document is the single active system-file authority.

## TLDR

Governance defines structure.
Data reflects structure.

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

## Construct Alignment

`System` should be read inside the larger launch-side construct model defined in `LAMP`.

That means:

- `LAMP` defines the construct-birth minimum for the app as a whole
- `System` defines file identity, file governance, and file structure inside that construct
- `System Files` is the file-definition governor inside the construct
- `System` does not mean that all files are equally birth-critical

Working rule:

- some files are required so the app can be born as a true local system of record
- some files are general local repositories that extend the local operating layer
- some files are domain or context repositories that should only layer on after the core construct is already coherent

`System` should remain honest about runtime reality, but it should not let contextual repositories silently become construct-birth requirements.

Short reading:

- `LAMP` defines what must exist
- `System` defines what each file is
- `Defined_Structure` defines what each file contains

## Construct Classes

For `System` reading, files should be understood through the same construct classes declared in `LAMP`.

### 1. Core System Files

These are the files required for construct birth.

Current working minimum:

- `System Files`
- `History`
- `Users`
- `Contacts`
- `User Roles`
- `Companion Roles`
- `Projects`
- `Tasks`
- `Notes`
- `Artifacts`
- `Intake`

These are the minimum files that should be enough for the app to function as a true local system of record, guidance, intake, and work.

### 2. General Local Record / Guidance Repositories

These are local repositories that extend the system without redefining the construct itself.

They may be important to many workflows, but they are not automatically construct-birth requirements.

### 3. Domain / Context Repositories

These are contextual repositories for a specific operating model, project, or domain.

Examples may include venture or deal-sharing repositories.

They should be treated as extension files, not hidden launch requirements.

## Related Docs

- `docs/000/a. DAMP.md`
- `docs/002/a. Companion.md`
- `docs/000/d. File.md`
- `docs/000/j. UXDesign.md`
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
- whether they are active in runtime or archived out of runtime

This is not just a menu list.

It is the file-definition governance surface.

`System` should also remain the governed home for shared record-state and provenance fields.

That includes fields such as:

- `ID`
- `History`
- `Data.Status`

Working rule:

- `Data.Status` should be treated as a `System View` field, not as a drifting general-purpose display column
- row and table surfaces should render `Data.Status` through the governed system path when that field is part of the shared record-state layer
- token/field status should also begin from governed `System` definition rather than from page-local defaults

Important distinction:

- `Data.Status` = the status of the inputed/governed data itself
- file-specific status fields such as company, fund, or process status belong in a file-owned extension view

Approved default status vocabulary:

- `Pre-Selected`
  - grey
  - `CI = 75%`
  - system-origin data with known governed provenance

- `Suggested`
  - yellow
  - `CI = 50%`
  - system-origin proposed data, not yet confirmed

- `Verified`
  - black
  - `CI = 100%`
  - user-confirmed correct data

- `Input`
  - blue
  - `CI = n.a.`
  - user-editable entry state

## View Lock Rules

Shared bootstrap views should begin from one governed base:

- `System`
- `General`
- `LDB`

Working rule:

- these views should be born as canonical structure
- `System`, `General`, and `LDB` are protected shared views
- user-added extension views may be created beyond the shared base

Current runtime note:

- the current `Views` governance surface is still read-only
- it does not yet support adding a new view row from that panel

## File Lifecycle Rule

For current system behavior, file lifecycle should be treated as a two-state runtime rule:

- `Active`
- `Archived`

Working rule:

- `Active` files participate in runtime hydration
- `Archived` files remain governable in `System Files`
- `Archived` files should not load into active runtime and should not add runtime weight

Older intermediate file states such as `Partial`, `Draft`, or `Hidden` should not remain active runtime vocabulary for file lifecycle.

## Structure Governance Surface Rule

The structure governance surfaces should edit the JSON structure directly.

That means:

- `Views` edits section/view metadata
- `Tokens` edits token metadata
- both surfaces should be treated as governed structure surfaces, not as local convenience tables
- governance is upstream for the active file
- data is downstream for that same active file
- changing a governed `View` changes the corresponding label in `DataControl`
- changing a governed `Token` changes the corresponding column in `DataSurface`

Visual rule:

- blue = editable
- grey = locked

## Shared Render Rule

Shared identifying render rules should remain present across renderable views.

At minimum:

- `Name` should remain the first visible identifying column
- `ID` should remain carried in the row contract as a hidden identity field

Working rule:

- view-specific tokens add view-specific columns
- but shared identifying structure must not disappear just because the selected view has few or no local tokens

Drift signal:

- a renderable view shows rows but loses its identifying `Name` column
- surfaces behave as if only local view tokens exist and shared identifying structure does not

## LDB Relationship View Rule

`LDB` should not be treated as an ordinary local view section.

It is a governed relationship view inside the local file system.

That means:

- it is hydrated from the local `System Files` universe
- it expresses relationship threading across the local closed system
- it should not depend on ad hoc placeholder token lists to appear meaningful

Working rule:

- `LDB` is a special governed relationship path
- do not interpret it as just another local token bucket

Drift signal:

- `LDB` only renders when treated like an ordinary local token section
- relationship rendering disappears because the system is expecting static local token definitions instead of governed relationship hydration

## Token Ownership And Value Editability

Keep these three distinctions explicit:

- `view ownership`
- `token ownership`
- `value editability`

Current governed reading:

- `System`
  - view ownership: locked
  - token ownership: `ID`, `History`, and `Data.Status` stay owned by `System`
  - value editability: `ID` and `History` stay locked; `Data.Status` value may be edited

- `LDB`
  - view ownership: locked
  - token ownership: relationship tokens stay nested in `LDB`
  - value editability: link values remain editable

- `General`
  - view ownership: locked
  - token ownership: `Name` and `Summary` must always exist and must not be deleted
  - value editability: editable
  - nesting rule: `Name` and `Summary` are not true id and may be nested into user-facing views other than `System` and `LDB`

## File Structure Ownership Chain

`System` should be read as the first layer in the active file-structure chain:

- `System Files` / file structure declares the file
- that file owns sections/views
- those sections/views own tokens
- those tokens are the canonical token layer the shell should render from

That means `System` should not stop at file identity only.

It should also make it clear that token-backed rendering ultimately depends on the file-owned section/view/token contract.

## How It Works

The active file-structure path works like this:

1. `src-electron/electron-main.js`
   - defines the bootstrap template for file structure
   - `buildBaseFileStructure(entry)` creates the default `Defined_Structure` JSON for a file

2. `Files.Defined_Structure`
   - stores the actual structure contract for each file
   - this is the main runtime truth holder for structure

3. `src/utils/structureRegistry.js`
   - reads `Files.Defined_Structure`
   - parses the stored JSON
   - turns it into runtime sections and tokens

4. shell surfaces
   - surfaces such as `FilePageShell.vue` and `AddEditFileShellDialog.vue` render from that parsed token structure

Short reading:

- `electron-main.js` = birth template and repair logic
- `Files.Defined_Structure` = stored structure truth
- `structureRegistry.js` = runtime parser
- shell surfaces = renderer

Working rule:

- changing bootstrap alone does not mean every existing file structure changed everywhere
- if an old field contract is still stored in `Defined_Structure`, the UI should honestly keep reading that older contract until the stored structure is rewritten or repaired

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
- Token-backed labels and meanings should come from the declared token layer inside that structure, not from local table or page hardcodes.
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

- `System`: `ID`, `History`, `Data.Status`
- `General`: `Name` required, `Summary` optional
- `LDB`: empty relationship view derived from the declared system-file universe
- file-owned extension views are optional and do not belong to the shared base

The only recovery path for a missing shell structure is to seed the base structure in system registry truth.

Table/rendering implication:

- shared base fields such as `Name` and `Summary` should come from the declared file structure
- they should not be reintroduced later as local hardcoded table headers
- approved system columns such as `History` and `Data.Status` should be declared and governed as system-level columns, not improvised per surface
- token definitions should remain visible enough that extraction and local meaning can be compared against outside sources when needed
- empty token arrays should normally appear only where a section is intentionally waiting for file-specific extension or governed future definition

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
