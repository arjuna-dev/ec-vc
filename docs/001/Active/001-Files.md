# Files

## Purpose

This document is the reference guide for all file guides in the system.

Terminology update:
- use `LDB` for the relationship layer
- treat `LDB_Relationships` as the shared contract
- treat canonical/workbook structure as reference input, not live shell payload truth

It defines:

- why every file should be born with its own `.md`
- what every file guide must contain
- how file guides help the `Owner`, `File Steward`, `UX Steward`, companions, and future agents understand the file

This is the parent file-guide rule.

## Core Rule

Every file should be born with its own accompanying `.md`.

That file-level guide should:

- explain the file to the `Owner`
- explain the file to the `File Steward`
- stay local to the file
- be visible from `System Files`
- be visible from the `Add/Edit File Shell`

This means:

- one file record
- one file guide
- one stable guide surface for governance, rendering, LDB, stewardship, and provenance

## File Birth Chain

Every file should be born from the System Files registry and the file-owned token/view contract.

The intended birth chain is:

1. `System Files` registry row (file universe + ownership + guide)
2. file guide `.md`
3. file-owned tokens/views (live shell payload contract)
4. runtime/sqlite table and shell rendering

Reference inputs:

- `docs/000-canonical-structure.json`
- `docs/000-workbook-schema-companion.json`

These references must not act as live shell payload truth.

That means:

- `System Files` registers the file, class, guide, owner, steward, and `Defined Structure`
- file-owned tokens/views are the runtime payload source for shells
- the file guide explains the human and steward rules for that file
- runtime/sqlite and shell rendering follow the System Files + token/view contract

If a runtime file/table/shell exists without the matching System Files row, the file is not fully born.

## File Birth Checklist

Before a file is treated as born, the `Architect Steward`, `File Steward`, and `UX Steward` should be able to verify:

- canonical JSON structure exists
- `System Files` registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- shared sections are declared in `Defined Structure`
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If any checklist item is unclear, stop and surface the gap before implementation continues.

## Birth Governance Rule

Birth governance should derive from birth context before it becomes manual data entry.

That means the first file-birth flow should prefer to derive:

- creator
- initial owner
- steward defaults
- first branch or fork context
- initial provenance links

from:

- the active actor
- the file being created
- the declared create branch, if one exists
- approved birth relationships

The system should not ask the user to restate governance fields one by one when the birth path already provides the answer.

Manual editing may still exist later, but birth should begin from derived governance defaults first.

`Creator` should be treated as a birth-derived provenance field under governance.

That means:

- a direct `Add Record` birth should lock `Creator` to the acting `User`
- an intake approval birth should lock `Creator` to the approving `Companion` or `User`
- later governed editing may overwrite `Creator` when the acting role has permission
- the event trail should preserve who changed it, when it changed, and what the previous creator value was

## Checklist Status Vocabulary

Use these statuses when applying the File Birth Checklist:

- `yes`: the item exists, is declared, and is safe to rely on
- `partial`: the item exists in some form, but is not fully proven or fully wired
- `unclear`: the item cannot be answered confidently; stop and surface the gap
- `no`: the item is explicitly missing; do not treat the file as born

The checklist should not use vague completion language.

If the honest status is `partial`, preserve the note explaining what exists and what remains unproven.

If the honest status is `unclear` or `no`, implementation should pause until the gap is resolved or deliberately accepted as an open item.

## Parent / Child Guide Rule

`Files.md` is the parent guide.

Every file-specific guide should be a child guide derived from it.

That means:

- `Files.md` defines the required structure
- each file-specific guide inherits that structure
- each file-specific guide then adds file-specific rules

Examples of child guides:

- `System_Files.md`
- `Access_Assignments.md`
- `Companies.md`
- `Projects.md`
- `Events.md`
- `Intake.md`

## Why This Matters

Without a parent file-guide rule, file guidance easily drifts into:

- remembered exceptions
- conversation-only decisions
- partial guidance spread across many docs

With a parent file-guide rule, the system can say clearly for each file:

- what the file is
- how it should be born
- what sections it should expose through `Defined Structure`
- who governs it
- what rulebooks it depends on
- what events should prove it was born correctly
- whether forks are disabled, view-only, create-only, or both

## Fork Characteristic Rule

Fork behavior should be treated as a file characteristic, not as a page-only convenience.

That means each file should be able to declare at least:

- `fork_mode`
  - `none`
  - `view`
  - `create`
  - `view_and_create`
- `fork_enabled`
  - `yes`
  - `no`

These declarations should live in `System Files` and be reflected in canon/registry guidance before shared shells expose fork controls.

This helps keep three things aligned:

- what the file is allowed to do
- what the shared shell renders
- what the user is being asked to choose

The target direction is for `System Files` to eventually govern not only `fork_mode` and `fork_enabled`, but also the fork instruction payload itself:

- create fork set
- view fork set
- fork labels
- fork purpose
- fork-owned payload scope

That means future file definition should be able to distinguish:

- birth-path forks
- view/rendering forks

without treating them as the same kind of file behavior.

## Meaning Drift Rule

If a surface says something, the system should mean it.

If the system means it, runtime behavior should do it.

If runtime behavior does it, canon and guides should describe it the same way.

This rule applies across:

- `BB Shell`
- `Add/Edit` shells
- file views
- page views
- navigation labels
- file guides
- canonical structure
- runtime handlers and bridge behavior

Three drift classes should be treated as real architecture drift:

- language drift
  - labels, titles, statuses, or glossary terms do not match canon or guide meaning
- behavior drift
  - UI wording promises an action or state that runtime does not actually perform
- ownership drift
  - the visible source appears to own truth, but the real source of truth lives elsewhere

When these drift classes appear, do not patch only the surface wording.

Resolve the mismatch so that what the surface says, what the system means, and what runtime does are aligned again.

## Shared BB Rendering Rule

Rendering pages must be composed only from approved `bb:*` elements.

That means:

- shared structure should come from approved building blocks
- page-level code may provide payload, source bindings, and approved shell contract values
- page-level code should not invent local structural lookalikes when the structure is meant to be shared
- if a needed structure does not yet exist in the `BB` layer, that is a `BB` gap and should be surfaced as such

If two pages solving the same shell job render different structures, first check whether one of them bypassed approved `bb:*` elements.

## Shared File Hero Rule

All file pages must use the same shared `bb:file-hero` structure.

That means:

- `System Files`
- `BB Shell`
- `Events`
- every other file page

should all render from the same shared file-hero layer.

Files may provide different hero payload values, but they must not switch to different hero layouts or page-specific hero contracts.

If two file pages look structurally different at the hero level, that is drift unless the shared contract explicitly defines that variation.

## Required File Guide Sections

Every child file guide should begin with these sections.

### 1. File Identity

This section should declare:

- file name
- file class:
  - `L1`
- short purpose
- canonical owner identity

### 2. Purpose

This section should give the fastest human-readable overview of the file.

It should explain:

- what the file stores
- why the file exists
- what the file helps the system do
- what a human should understand before editing it

### 3. Glossary

This section should appear directly after the purpose.

It should define the key terms a person or companion needs before reading the rest of the file guide.

The glossary should include:

- file-specific terms
- important `View Fork` names
- important `Subgroup` names
- important `Token` names when they are not obvious
- relationship terms
- ownership terms

Every file guide should include a `Glossary` section.

But `Glossary Steward` should apply in two different strengths:

- light glossary mode
  - the file still includes a glossary section
  - glossary upkeep is local to the file unless language drift risk becomes meaningful
- heavy glossary mode
  - `Glossary Steward` becomes an active governing steward for that file
  - naming should be watched closely across canon, guides, UI labels, runtime names, and relationship language

Use heavy glossary mode when the file:

- introduces important system vocabulary
- owns broad domain language
- is likely to create canon/UI/runtime naming drift
- will expand into a large category with many dependent terms

`Markets` and `Securities` should be treated as heavy glossary files from the beginning.

### 4. Referenced Documents

This section should list the guides, manuals, rulebooks, contracts, and architecture docs that govern this file.

It should help both humans and companions know what to read before acting.

### 5. Operating Rules

This section should declare how the file should be used in practice.

It should include:

- rules for reading the file
- rules for editing the file
- rules for creating records inside the file
- rules for companions operating on the file
- rules for when to stop and surface a missing contract

### 6. Ownership

This section should declare:

- who owns the file
- whether ownership is owner-only, steward-governed, or shared
- which steward governs the file
- which user or role can edit the file
- whether ownership is local, root-owned, relationship-owned, or another approved mode

This section is required because file birth without ownership creates drift.

### 7. Owner

This section should explain to the `Owner`:

- what the file is for
- what kind of information it stores
- how the file should be used
- what the file depends on
- what the user should understand before editing or creating records there

This should be human-readable first.

### 8. File Steward

This section should explain to the `File Steward`:

- how the file should be born
- what structural requirements it has
- what shared base rules apply
- whether `System` is required
- whether `LDB` is required
- what relationships must be born with it
- what reverse-read expectations exist
- what validation proves the file is correctly born

This should be governance-readable first.

### 9. UX Steward

This section should explain to the `UX Steward`:

- what user-facing forks exist in this file
- where the user should make those choices
- which plain-language labels should be shown
- which canonical values those choices create
- what the safe default is
- what happens when the user is unsure
- what stop condition should prevent the user from continuing

This should be user-guidance-readable first.

### 10. Governance

This section should declare:

- who owns the file
- which steward governs it
- which rulebooks it depends on
- whether the file is owner-only or shared

### 11. Provenance / Events

This section should declare:

- which events prove the file was born correctly
- what provenance should be preserved
- how genesis or file creation should later be reconstructable

### 12. View Fork System

This section should declare the file's actual view-fork architecture.

It should always describe these base sections when they apply:

- `System`
- `General`
- `LDB`
- `File Specific`

Definition note:

- view forks and subgroups are internal to a file, not separate file rows, unless `System Files` explicitly tracks them as such

`File Specific` means any file-specific view forks, subgroups, and tokens that exist beyond the shared base.

`File Specific` is governance metadata, not a user-facing fork, unless the file explicitly declares it as a visible fork.

### 13. Open Questions

This section should list unresolved items that are not yet settled truth.

This is where the file guide should preserve uncertainty instead of letting it become drift.

## Shared View Fork Rules

These rules explain how the shared view forks work for every file guide.

### System

`System` is the file's provenance and runtime-control layer.

It should describe:

- identity fields
- creator or actor fields
- datetime fields
- event-log linkage
- system-owned values that should not be casually user-editable

### General

`General` is the file's main human-readable description layer.

It should describe:

- `Name`
- `Summary`
- any approved general fields that are shared or file-specific
- how humans and companions should quickly understand the record

### LDB

`LDB` is the file's declared relationship layer.

It should describe:

- set relationships
- file-to-file relationship targets
- record-to-record relationship targets
- whether each relationship is born at file creation
- whether each relationship uses shared `LDB_Relationships` or a promoted dedicated owner
- whether reverse-read exists

### LDB Naming Direction

The intended future name for this relationship layer is `LDB`.

`LDB` means `Local DataBase`.

This name better describes the local relationship layer between:

- files created inside the local owner/user system
- records inside those files
- local system files and their relationship paths

Current implementation should avoid introducing legacy `KDB` names in live contracts, docs, or UI labels.

Do not rename those pieces one by one.

The rename should happen as a staged architecture pass so docs, canonical structure, UI labels, sqlite owner paths, relationship contracts, and steward language stay aligned.

## System Files Rule

The `System Files` file/page should expose these file-definition properties for each file:

- file class (`L1` for files, `View Fork` / `Subgroup` only when explicitly tracked)
- does it require `System`
- does it require `LDB`
- what ownership mode applies
- who owns it
- which steward governs it
- which rulebooks it depends on
- which file guide belongs to it
- what its defined structure is
- what glossary terms it introduces

That means `System Files` is not only a registry.

It becomes:

- a file-definition layer
- a governance layer
- a rendering input layer
- a guide registry

## Owner LDB Access Rule

`Users` should not be understood as people in general.

`Contacts` is the people and address-book layer.

`Users` is the access identity layer.

Clean rule:

- `Contacts` store the person or entity profile
- `Users` govern access to the `Owner` LDB
- a `User` should be treated as an access-enabled `Contact` identity
- a `Contact` may exist without being a `User`
- access should be evaluated through `Project x Role` context instead of global user status alone

That means:

- `Owner` remains the root authority
- `Owner LDB` is the protected local database or workspace
- `Project` is the access scope
- `Role` is the permission or behavior role
- `[Project] x [Role]` is the dynamic access rule that determines what the linked user can see or do

The intended model is:

`Contact + Project + Role -> access rights / capabilities`

This should converge into an explicit access assignment structure rather than relying only on a flat user-role list.

Approved future canonical file:

- `Access_Assignments`

`Access_Assignments` should be its own `L1` because access needs to be browsed, audited, governed, and validated directly.

It is not runtime-born yet.

Before implementation, it still needs the normal file birth chain:

- canonical JSON structure
- `System Files` registry row
- file guide
- runtime/sqlite ownership
- shell rendering path

Minimum fields to consider:

- `user/contact`
- `project/scope`
- `role`
- `status`
- `granted_by`
- `granted_at`
- `revoked_at`
- `access_limits`

Do not implement this as guessed permission behavior.

Document the access model first because it affects auth, LDB boundaries, project visibility, collaboration, and file-level governance.

## Add/Edit File Shell Rule

Each file guide should also be reachable from the `Add/Edit File Shell`.

The intended location is:

- top-left box
- next to the box title

So the guide remains:

- local
- visible
- easy to open while editing the file definition

## LDB Stewardship Rule

The `File Steward` is also the effective LDB orchestrator for file birth and upkeep.

That means the `File Steward` should make sure:

- files are born correctly
- `LDB` is born with them
- the right relationships exist
- relationship direction, owner-path, and reverse-read are correct
- file order and creation sequence support those connections

So child file guides should treat LDB governance as part of `File Steward` responsibility, not as a detached separate guide layer.

## UX Stewardship Rule

Each file guide should include UX parameters that help the `File Steward` guide the user correctly.

The first structural fork should be:

`Is this a new file the user should be able to find, govern, and open?`

If yes, the structure should be created as `L1`.

If no, the user should be guided toward:

- `View Fork` when the concept is a major section inside an existing file
- `Subgroup` when the concept is a subgroup inside an existing section

The default rule is:

- when uncertain, begin as `L1`
- demote to `View Fork` only when the concept is clearly a section inside an existing file
- demote to `Subgroup` only when the concept is clearly a subgroup inside an existing section

The `UX Steward` should define:

- the plain-language question shown to the user
- the canonical value created by each answer
- the safe default
- the parent selection required for `View Fork` and `Subgroup`
- the stop condition when the user does not have enough context

`File Specific` should not replace explicit named view forks.

It should document the file's unique structure metadata while real user-facing sections remain explicit view forks.

## Canonical Loader Rule

`docs/000-canonical-structure.json` is the machine-readable structure reference.
It must not be treated as live shell payload truth.

Code should not import that JSON file casually from many places.

The approved app-side doorway is:

- `src/shared/canonicalStructure.js`

That doorway exists so canonical structure has one visible loading point before it feeds:

- file registry
- LDB relationship contracts
- shell rendering
- bootstrap validation
- future File Steward tooling

If Node scripts, Electron runtime code, ingestion validators, or bootstrap tools need canonical structure, they should use the same loader concept or an approved Node-safe sibling loader.

The rule is:

- one canonical source file
- one approved loading boundary per runtime
- no hidden direct JSON imports scattered through app code

## System Files Base Structure Safeguard

Every file **must** have an explicit `Defined_Structure` stored in System Files.

Minimum required structure (for every file):
- **System**: `ID`, `History`
- **General**: `Name` (required), `Summary` (optional)
- **LDB**: empty view that renders shared LDB links from the System Files universe

If a file’s `Defined_Structure` is missing, shells must treat that as an error state
and refuse to infer or guess fields. The only acceptable recovery is to seed the
base structure inside System Files.

## File Guide Template

Each file-specific guide can begin from this compact template:

1. `File Identity`
2. `Purpose`
3. `Glossary`
4. `Referenced Documents`
5. `Operating Rules`
6. `Ownership`
7. `Owner`
8. `File Steward`
9. `UX Steward`
10. `Governance`
11. `Provenance / Events`
12. `View Fork System`
13. `Open Questions`

System file guides should live in `docs/100`.

Start new file guides in `docs/100/Draft` unless the file is already fully born and approved as active truth.

Use this naming pattern:

- `docs/100/Draft/100-<File_Name>.md`
- `docs/100/Active/100-<File_Name>.md`

Do not place system file guides in `docs/200`.

`docs/200` is reserved for concrete Companion role guides.

## Working Rule

We will refine this together.

The goal is:

- every file is born with a guide
- every guide is governed by one parent file-guide rule
- the `Owner`, `File Steward`, and `UX Steward` can use that guide to keep the file understandable, stable, guided, and connected

The current System Files acceptance-contract direction lives in:

- `docs/010/Draft/010-files-system-birth-audit.md`
