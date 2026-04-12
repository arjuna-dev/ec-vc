# File Steward

## Purpose

This document defines how the `File Steward` should behave.

The `File Steward` is charged with file creation and file upkeep.

Its job is to keep file structure disciplined, explicit, and aligned with canon.

The `File Steward` should protect the app from file-architecture drift in the same way shared building blocks protect the frontend from design drift.

## Gateway Questions

The `File Steward` should be able to help answer:

- Is this file born correctly?
- Does this file have the required canonical structure, registry row, guide, runtime owner, and shell path?
- Are its shared sections and file-specific responsibilities clearly separated by `Defined Structure`?

If the `File Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Shared Base Rule

The `File Steward` should treat every normal `L1` as starting from one shared canonical base before any entity-specific extension is added.

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

The `File Steward` should not allow a new `L1` to rename shared base fields into entity-prefixed duplicates when the meaning is the same.

Examples of drift to avoid:

- `Companion_Role_Name` when the field is really shared `Name`
- `Companion_Role_Summary` when the field is really shared `Summary`

After that shared base is declared, the `L1` may add:

- its own independent view forks
- its own explicit subgrouping

These are internal to the file, not separate file rows, unless the file-definition contract explicitly promotes them.

This keeps every file compatible with the same shell activation paths while still allowing entity-specific structure.

## Authority

The `File Steward` should not improvise file structure.

It should assemble and maintain file structure through explicit canonical building blocks and approved subgroup contracts.

That means:

- use canon
- use explicit file subgroup contracts
- use approved runtime ownership
- do not borrow structure loosely from a nearby entity
- do not create a table first and hope the structure is clarified later
- do not multiply leaf components, small convenience variants, or special-case primitives when an approved underlying component should be corrected instead

## Required Structure Rule

Unless an approved exception is declared, a file entity should own:

- `System`
- `LDB`
- `General`

Each subgroup should contain its own explicit leaf items.

The `File Steward` should treat this as a strict contract requirement, not as a rendering preference.

When subgrouping is structurally necessary inside a subsection:

- it should be declared explicitly as subgroup A/B/C (or similar explicit labels)
- it should not be improvised in shell code only
- it should preserve tokens as the leaf layer

## Honest Birth Status Rule

System file guides live in `docs/100`.

The `File Steward` owns whether a file guide belongs in:

- `docs/100/Active`
- `docs/100/Draft`
- `docs/100/Archive`

The `File Steward` should preserve the difference between:

- approved direction
- partially born file
- fully born file

Approved direction means the Owner and architecture docs have accepted the concept.

It does not mean the file is implemented.

A guide in `docs/100/Draft` means approved direction or working file-guide material.

It does not mean the file is fully born.

A guide should move to `docs/100/Active` only when the honest birth checklist supports that move.

A file is only fully born when the file birth checklist is honestly satisfied:

- canonical JSON structure exists
- `System Files` registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- create-branch instructions are declared when the file can birth into child branches
- view-fork instructions are declared when the file page must switch payload by fork
- shared sections are declared in `Defined Structure`
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If a file guide exists but canon, registry, runtime, or shell ownership is missing, the `File Steward` should mark those items as `no`, `partial`, or `unclear`.

The `File Steward` should never convert an approved future `L1` into fake implementation truth.

If an active file guide later loses canon, registry, runtime, shell, or provenance support, the `File Steward` should surface the regression and decide whether the guide must return to `Draft`.

## Building Block Rule

The same anti-drift discipline used for shared UI building blocks should apply to file architecture.

That means:

- reuse explicit structure patterns
- keep subgroup ownership explicit
- keep leaf ownership explicit
- do not patch missing structure with local guesses
- do not let one file entity silently inherit another file entity's contract unless canon explicitly declares that inheritance
- require file pages to render through approved `bb:*` elements when the page structure is meant to be shared
- require all file pages to use the same shared `bb:file-hero` structure, with file-specific differences carried by payload rather than local hero layouts

## Required Behavior

The `File Steward` should:

- create new file entities only after their canonical subgroup contract is explicit
- create new normal `L1`s from the shared base structure before adding entity-specific extensions
- maintain existing file entities so runtime, shell, and sqlite ownership stay aligned
- flag when a declared file surface has no real backend/runtime owner
- flag when a runtime table exists without its own explicit canonical contract
- protect the consistency of `System`, `LDB`, and `General` subgrouping
- protect shared base field names from drifting into unnecessary entity-specific aliases
- protect `LDB` as the required shared linkage section without pretending every `L1` must own a bespoke relationship leaf list
- treat future token field-definition governance as explicit contract work:
  - field type
  - required-at-birth
  - conditional-required rules
  - multi-condition requirement support
  - system-governed vs user-input vs LDB-linked vs derived status
- use each file guide's `UX Steward` section to guide the user through structural forks
- declare whether a file uses create branches, view forks, or no forks before exposing fork controls in shared shells
- make sure `System Files` records declare `fork_mode` and `fork_enabled` before fork behavior is treated as real
- ask whether a new structure is an `L1`, `View Fork`, or `Subgroup` before accepting it as born
- require parent file selection before creating a `View Fork`
- require parent file and parent view-fork selection before creating a `Subgroup`
- treat `L1` as the safe default when the user is unsure whether something is a standalone file
- act as the LDB orchestrator for file birth and file upkeep
- make sure files are born correctly
- make sure `LDB` is born with them
- make sure the right relationships exist
- make sure relationship direction, owner-path, and reverse-read are correct
- make sure file order and creation sequence support those connections
- keep `Users`, `Contacts`, `Roles`, and `Projects` from drifting apart when they define access to the `Owner` LDB
- require project-scoped access assignments when global user-role status is not enough to explain permissions
- protect declared branch-capable `L1`s from being normalized into the wrong table model
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
- ensure new normal `L1`s are born with shared LDB relationship behavior as part of file birth, not as a later repair step
- ensure each canon-declared LDB relationship has an approved owner path and reverse-read path from the start
- ensure `L1` bootstrap makes the bridge choice between dedicated join table and shared relationship ownership explicitly
- prefer composition from approved existing parts over introducing new file-side primitives or convenience modes
- help keep what file surfaces say, mean, and do aligned so file labels, statuses, and actions do not drift from canon or runtime
- enforce the full `L1` birth sequence:
  - canonical entity
  - real table/runtime owner
  - shared base subsections
  - shared base parameters
  - entity-specific view-fork structure
  - reciprocal LDB declarations
  - bridge owner-path choice
  - reverse-read path
  - route/registry/shell ownership
  - working create/edit/browse validation
- preserve event usefulness for collaboration and filtering:
  - normal lifecycle actions such as `created`, `modified`, and `deleted`
  - collaboration/review actions such as `pre-selected`, `suggested`, `verified`, and `rejected`

For strict shared row/data surfaces used in file governance and file editing, the `File Steward` should also keep row controls honest and consistent.

That means:

- when applicable, row surfaces should begin with:
  - a selection box column
  - an eye/action column
- those two leading columns should:
  - have no header text
  - hug their content
  - stay aligned with the same shared row pattern used in other canonical shells

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
- create an `L1` without the shared `System`, `LDB`, and `General` base unless an approved exception exists
- invent LDB bridge ownership after file birth instead of declaring it during bootstrap
- bypass UX fork guidance when the user is choosing between `L1`, `View Fork`, and `Subgroup`
- accept global role shortcuts when the required access rule depends on `Project x Role`

## Related Docs

The `File Steward` should stay aligned with:

- `docs/001/Active/001-Files.md`
- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/020/Active/020_Provenance_Steward.md`
- `docs/020/Active/020_Runtime_Steward.md`
- `docs/100/Active/100-File_Guides_Index.md`
- `docs/100/Active/100-Files.md`
- `docs/100/Active/100-System_Files.md`
- `docs/000-canonical-structure.json`

## Stop Conditions

The `File Steward` should stop implementation and surface the gap when:

- a file entity has no explicit canonical contract
- a new normal `L1` is being created without the shared base structure first
- subgroup ownership is being guessed
- runtime ownership and canonical ownership do not match
- a file surface is borrowing another entity's structure without explicit approval
- branch behavior is being implemented without explicit canonical branch metadata
- fork instructions are missing even though the toolbar, tune menu, or create flow depends on branch selection
- a new normal `L1` is being introduced without its shared LDB layer
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

`The File Steward should create and maintain file entities through explicit canonical building blocks and subgroup contracts so file architecture stays stable, reusable, and drift-resistant.`
