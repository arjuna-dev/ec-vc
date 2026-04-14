# File

## Purpose

This document defines how `File` should behave as the active companion guide for file structure and file birth.

`File` is charged with file creation and file upkeep.

Its job is to keep file structure disciplined, explicit, and aligned with canon.

`File` should protect the app from file-architecture drift in the same way shared building blocks protect the frontend from design drift.

## Gateway Questions

The `File Steward` should be able to help answer:

- Is this file born correctly?
- Does this file have the required canonical structure, registry row, guide, runtime owner, and shell path?
- Are its `System`, `General`, `LDB`, and `File Specific` responsibilities clearly separated?

If the `File Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Shared Base Rule

The `File Steward` should treat every normal `File` as starting from one shared canonical base before any entity-specific extension is added.

That shared base should include:

- shared `System`
- shared `LDB`
- shared `General`

And only two parts of that base carry a fixed shared parameter set:

- `System`
  - `ID`
  - `Creator`
  - `Datetime`
  - `EventLog`
- `General`
  - `Name`
  - `Summary`

`LDB` is also part of the shared base, but as the shared linkage section.

It should not be treated as one fixed universal list of relationship leaf names.

Examples:

- `Name`
- `Summary`

The `File Steward` should not allow a new `File` to rename shared base fields into entity-prefixed duplicates when the meaning is the same.

Examples of drift to avoid:

- `Companion_Role_Name` when the field is really shared `Name`
- `Companion_Role_Summary` when the field is really shared `Summary`

After that shared base is declared, the `File` may add:

- its own independent `View`s

This keeps every file compatible with the same shell activation paths while still allowing entity-specific structure.

## File Ownership Chain

The `File Steward` should use this mental model:

- `System Files` / file structure declares the file
- that file owns sections/views
- those sections/views own tokens
- those tokens are the canonical token layer the shell should render from

This is the safe chain to use when a table, card, dialog, translator, or extraction flow appears to be inventing structure locally.

If the surface and the token layer disagree, repair the file structure contract first.

## How It Works

For active file structure, the backend and runtime chain is:

1. `src-electron/electron-main.js`
   - defines the file birth template
   - creates default `Defined_Structure` JSON for new file rows

2. `Files.Defined_Structure`
   - stores the file's real structure contract after birth
   - this is what current runtime should trust

3. `src/utils/structureRegistry.js`
   - parses the stored structure
   - exposes file-owned sections and tokens to shared shells

4. shared shell surfaces
   - render from the parsed file-owned token structure

This means:

- bootstrap changes affect future birth first
- existing stored structure only changes when it is explicitly rewritten or repaired
- renderer surfaces should expose stored structure honestly instead of silently pretending the newer bootstrap is already everywhere

Working lesson:

- when we say a field was `changed`, we should be precise about which layer changed:
  - bootstrap template
  - stored `Defined_Structure`
  - runtime parser
  - renderer

## Authority

The `File Steward` should not improvise file structure.

It should assemble and maintain file structure through explicit canonical building blocks and approved view contracts.

That means:

- use canon
- use explicit file view contracts
- use approved runtime ownership
- do not borrow structure loosely from a nearby entity
- do not create a table first and hope the structure is clarified later
- do not multiply leaf components, small convenience variants, or special-case primitives when an approved underlying component should be corrected instead

## Required Structure Rule

Unless an approved exception is declared, a file entity should own:

- `System`
- `LDB`
- `General`

Each view should contain its own explicit leaf items.

The `File Steward` should treat this as a strict contract requirement, not as a rendering preference.

Do not introduce view subdivision layers. Views remain flat and map directly to their tokens.

## Honest Birth Status Rule

System file guides live in `docs/100`.

The `File Steward` owns whether a file guide belongs in:

- `docs/100`
- `docs/100/Archive`

The `File Steward` should preserve the difference between:

- approved direction
- partially born file
- fully born file

Approved direction means the Owner and architecture docs have accepted the concept.

It does not mean the file is implemented.

Only file guides in `docs/100` should be treated as current active authority.

Archived file guides in `docs/100/Archive` may preserve useful memory, but they must not be treated as current truth unless an active guide explicitly points back to them.

A file is only fully born when the file birth checklist is honestly satisfied:

- canonical JSON structure exists
- `System Files` registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- create-branch instructions are declared when the file can birth into child branches
- view-fork instructions are declared when the file page must switch payload by fork
- `System` requirement is declared
- `LDB` requirement is declared
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If a file guide exists but canon, registry, runtime, or shell ownership is missing, the `File Steward` should mark those items as `no`, `partial`, or `unclear`.

The `File Steward` should never convert an approved future `File` into fake implementation truth.

If an active file guide later loses canon, registry, runtime, shell, or provenance support, the `File Steward` should surface the regression and decide whether the guide must return to `Draft`.

## Building Block Rule

The same anti-drift discipline used for shared UI building blocks should apply to file architecture.

That means:

- reuse explicit structure patterns
- keep view ownership explicit
- keep leaf ownership explicit
- do not patch missing structure with local guesses
- do not let one file entity silently inherit another file entity's contract unless canon explicitly declares that inheritance
- require file pages to render through approved `bb:*` elements when the page structure is meant to be shared
- require all file pages to use the same shared `bb:file-hero` structure, with file-specific differences carried by payload rather than local hero layouts

## Required Behavior

The `File Steward` should:

- create new file entities only after their canonical view contract is explicit
- create new normal `File`s from the shared base structure before adding entity-specific extensions
- maintain existing file entities so runtime, shell, and sqlite ownership stay aligned
- flag when a declared file surface has no real backend/runtime owner
- flag when a runtime table exists without its own explicit canonical contract
- protect the consistency of `System`, `LDB`, and `General` views
- protect shared base field names from drifting into unnecessary entity-specific aliases
- protect `LDB` as the required shared linkage section without pretending every `File` must own a bespoke relationship leaf list
- treat future `Token` field-definition governance as explicit contract work:
  - field type
  - required-at-birth
  - conditional-required rules
  - multi-condition requirement support
  - system-governed vs user-input vs LDB-linked vs derived status
  - editable token definition
- use each file guide's `UX Steward` section to guide the user through structural forks
- declare whether a file uses create branches, view forks, or no forks before exposing fork controls in shared shells
- make sure `System Files` records declare `fork_mode` and `fork_enabled` before fork behavior is treated as real
- ask whether a new structure is a `File` or a `View` before accepting it as born
- require parent file selection before creating a `View`
- treat `File` as the safe default when the user is unsure whether something is a standalone file
- act as the LDB orchestrator for file birth and file upkeep
- make sure files are born correctly
- make sure `LDB` is born with them
- make sure the right relationships exist
- make sure relationship direction, owner-path, and reverse-read are correct
- make sure file order and creation sequence support those connections
- keep `Users`, `Contacts`, `Roles`, and `Projects` from drifting apart when they define access to the `Owner` LDB
- require project-scoped access assignments when global user-role status is not enough to explain permissions
- protect declared branch-capable `File`s from being normalized into the wrong table model
- make sure branchable files declare fork labels, fork purpose, and fork-owned payload scope in canon/registry before tune payload or create flows depend on them
- make sure `fork_mode` stays honest to actual file behavior:
  - `none`
  - `view`
  - `create`
  - `view_and_create`
- derive birth governance defaults from the birth path when the file, branch, actor, or approved relationship already determines them
- treat the target direction as two explicit fork families:
  - create forks for birth-path choice
  - view forks for page/tune/rendering choice
- help keep file naming, loader naming, and menu naming aligned
- make sure every file guide includes a glossary section
- treat `Glossary Steward` as heavy governance only where language risk is meaningfully high, not automatically for every file
- treat `Markets` and `Securities` as heavy glossary-governed files from the start
- ensure new normal `File`s are born with shared LDB relationship behavior as part of file birth, not as a later repair step
- ensure each canon-declared LDB relationship has an approved owner path and reverse-read path from the start
- ensure `File` bootstrap makes the bridge choice between dedicated join table and shared relationship ownership explicitly
- prefer composition from approved existing parts over introducing new file-side primitives or convenience modes
- help keep what file surfaces say, mean, and do aligned so file labels, statuses, and actions do not drift from canon or runtime
- enforce the full `File` birth sequence:
  - canonical entity
  - real table/runtime owner
  - shared base subsections
  - shared base parameters
  - entity-specific `View` structure
  - reciprocal LDB declarations
  - bridge owner-path choice
  - reverse-read path
  - route/registry/shell ownership
  - working create/edit/browse validation
- preserve event usefulness for collaboration and filtering:
  - normal lifecycle actions such as `created`, `modified`, and `deleted`
  - collaboration/review actions such as `pre-selected`, `suggested`, `verified`, and `rejected`
- make sure governed translators and feeders receive canonical section data with enough file context, structure, and declared intent to do their job honestly
- treat wrong or underspecified translator input as a file/context problem first when the canonical file contract is incomplete, ambiguous, or delivered incorrectly

For strict shared row/data surfaces used in file governance and file editing, the `File Steward` should also keep row controls honest and consistent.

That means:

- when applicable, row surfaces should begin with:
  - a selection box column
  - an eye/action column
- those two leading columns should:
  - have no header text
  - hug their content
  - stay aligned with the same shared row pattern used in other canonical shells
- a separate `Edit` control column is not required when editable cells are clearly marked and the row surface already supports the approved double-click edit path

For file-backed data columns, the `File Steward` should keep table headers and lead columns governed by file structure.

That means:

- token-backed column titles come from `Token Label`
- shared base fields such as `Name` and `Summary` must render from the file structure/token contract, not from local hardcodes
- duplicated or drifting base-field columns should be treated as file-structure drift
- `History` and `Status` may remain approved special system columns when they are explicitly governed as record-state/provenance columns
- local control columns such as `Select` and `View` are not file tokens and should remain fixed control columns on the left

Current runtime note:

- `History` is still implemented as an approved special system column in `File Shell`
- `Status` should live in `System View` with `ID` and `History`
- `Status` should not be treated as a normal free-floating display column
- these two columns should stay explicit and governed until the file/token contract gives them a cleaner canonical home

If a file table shows a better label than the token contract provides, the `File Steward` should fix the token label or file structure instead of patching the table header locally.

Token meaning rule:

- each governed token should also be able to carry a `Definition`
- `Definition` should remain visible and editable
- extraction and translator work should prefer that local token definition when comparing outside source language to file-owned meaning
- each governed token should also carry a default verification state through its system definition

Approved default status vocabulary:

- `Pre-Selected`
  - grey
  - `CI = 75%`
  - system knows where the value came from through governed file/LDB context

- `Suggested`
  - yellow
  - `CI = 50%`
  - system is suggesting the value through extraction or contextual interpretation

- `Verified`
  - black
  - `CI = 100%`
  - user has confirmed the value

- `Input`
  - blue
  - `CI = n.a.`
  - field is open for direct user input

Working rule:

- these states should come from token/system definition first
- row surfaces should render them honestly
- do not invent local status colors outside the governed file/token path

Legacy ordering caution:

- legacy `tokenOrder` should not be treated as structure authority
- column sequence should not be governed by accidental array order either
- if ordering becomes important again, it should return through an explicitly approved token/file contract rather than through leftover scaffolding

Row surface working rule:

- row surfaces should stay visually clean and read the same way across file and edit paths
- row surfaces should not expand artificially to fill unused window width
- overflow should be handled through the approved scroll behavior rather than by distorting the row grammar

For editable field rows, the selection box should not be treated as the way to enter editing.

Its purpose is to support explicit field actions such as:

- `Share`
- `Delete`

Field editing should continue through the editable row cells when that surface and permission model allow it.

These event families should stay useful not only for audit, but also for owner review and data filtering by record and field.

## Prohibited Behavior

The `File Steward` should not:

- treat a route, menu item, or shell surface as proof that a file is fully born
- let a file guide move to `Active` when canon, registry, runtime, shell, or provenance is missing
- create a `File` without the shared `System`, `LDB`, and `General` base unless an approved exception exists
- invent LDB bridge ownership after file birth instead of declaring it during bootstrap
- bypass UX fork guidance when the user is choosing between `File` and `View`
- accept global role shortcuts when the required access rule depends on `Project x Role`

## Related Docs

The `File Steward` should stay aligned with:

- `docs/000/c. System.md`
- `docs/000/a. DAMP.md`
- `docs/000/g. Intake.md`
- `docs/000/c. System.md`
- `docs/000/c. System.md`
- `docs/000-canonical-structure.json`

## Stop Conditions

The `File Steward` should stop implementation and surface the gap when:

- a file entity has no explicit canonical contract
- a new normal `File` is being created without the shared base structure first
- view ownership is being guessed
- runtime ownership and canonical ownership do not match
- a file surface is borrowing another entity's structure without explicit approval
- branch behavior is being implemented without explicit canonical branch metadata
- fork instructions are missing even though the toolbar, tune menu, or create flow depends on branch selection
- a new normal `File` is being introduced without its shared LDB layer
- LDB bridge ownership is being invented ad hoc after file birth instead of being declared during bootstrap
- a new convenience component, mode, or leaf variant is being added where the approved underlying component should be corrected instead
- a user is being asked to create file structure without UX fork guidance from the file guide
- a user is being asked to manually restate creator, owner, steward, or other birth-governance fields that the active birth context should already determine
- access permissions are being inferred from a flat role list when the required access rule depends on `Project x Role`
- a file view, Add/Edit surface, or file page uses language that does not match the file guide, canonical field meaning, or runtime behavior
- a file page is rendered through local structural code when an approved shared `bb:*` element should own that structure
- one file page renders a different hero layout from another file page even though both should be using `bb:file-hero`

## Meaning Drift Rule

The `File Steward` should treat these as real file drift:

- language drift
  - file labels, field names, statuses, or page wording do not match the approved file meaning
- behavior drift
  - the file surface implies a write path, visibility rule, or relationship behavior that runtime does not actually support
- ownership drift
  - the file surface appears to own file truth, but canon, registry, or runtime owns it elsewhere

The `File Steward` should repair the contract, not only the wording.

## Working Principle

The practical principle is:

`The File Steward should create and maintain file entities through explicit canonical building blocks and view contracts so file architecture stays stable, reusable, and drift-resistant.`

## Current JSON Structure

Current working `File` JSON shape:

```json
{
  "id": "file-row-id",
  "File_Source_Key": "companies",
  "File_Name": "Companies",
  "File_Guide_Path": "docs/100/c1. Companies.md",
  "Defined_Structure": {
    "version": 1,
    "sections": [
      {
        "key": "companies-system",
        "label": "System",
        "tokens": []
      },
      {
        "key": "companies-general",
        "label": "General",
        "tokens": []
      },
      {
        "key": "companies-ldb",
        "label": "LDB",
        "tokens": []
      }
    ]
  }
}
```

Reading note:

- `File` owns the stored `Defined_Structure`
- `Defined_Structure` owns sections/views
- sections/views own tokens

