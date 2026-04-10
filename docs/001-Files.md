# Files

## Purpose

This document is the reference guide for all file guides in the system.

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
- one stable guide surface for governance, rendering, KDB, stewardship, and provenance

## File Birth Chain

Every file should be born from the canonical JSON structure.

The intended birth chain is:

1. `docs/000-canonical-structure.json`
2. `System Files` registry row
3. file guide `.md`
4. runtime/sqlite table and shell rendering

That means:

- canonical JSON defines the `L1/L2/L3` structure
- `System Files` registers the file, class, guide, owner, steward, and required `System` or `KDB` status
- the file guide explains the human and steward rules for that file
- the file guide includes UX parameters for structural forks and user guidance
- runtime/sqlite and shell rendering should follow the canonical definition and registry row

If a runtime file/table/shell exists without the matching canonical JSON structure and `System Files` row, the file is not fully born.

## File Birth Checklist

Before a file is treated as born, the `Architect Steward`, `File Steward`, and `UX Steward` should be able to verify:

- canonical JSON structure exists
- `System Files` registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- `System` requirement is declared
- `KDB` requirement is declared
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If any checklist item is unclear, stop and surface the gap before implementation continues.

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
- `Companies.md`
- `Projects.md`
- `Events.md`
- `Artifact_Processed.md`

## Why This Matters

Without a parent file-guide rule, file guidance easily drifts into:

- remembered exceptions
- conversation-only decisions
- partial guidance spread across many docs

With a parent file-guide rule, the system can say clearly for each file:

- what the file is
- how it should be born
- what sections it should expose
- whether `System` applies
- whether `KDB` applies
- who governs it
- what rulebooks it depends on
- what events should prove it was born correctly

## Required File Guide Sections

Every child file guide should begin with these sections.

### 1. File Identity

This section should declare:

- file name
- file class:
  - `L1`
  - `L2`
  - `L2.a`
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
- important `L2` names
- important `L2.a` subgroup names
- important `L3` names when they are not obvious
- relationship terms
- ownership terms

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
- whether `KDB` is required
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

### 12. L2 File System

This section should declare the file's actual L2 architecture.

It should always describe these base sections when they apply:

- `System`
- `General`
- `KDB`
- `File Specific`

`File Specific` means any file-specific L2s, L2 subsections, and L3 leaf groups that exist beyond the shared base.

### 13. Open Questions

This section should list unresolved items that are not yet settled truth.

This is where the file guide should preserve uncertainty instead of letting it become drift.

## Shared L2 Section Rules

These rules explain how the shared L2 sections work for every file guide.

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

### KDB

`KDB` is the file's declared relationship layer.

It should describe:

- set relationships
- file-to-file relationship targets
- record-to-record relationship targets
- whether each relationship is born at file creation
- whether each relationship uses shared `KDB_Relationships` or a promoted dedicated owner
- whether reverse-read exists

### LDB Naming Direction

The intended future name for this relationship layer is `LDB`.

`LDB` means `Local DataBase`.

This name better describes the local relationship layer between:

- files created inside the local owner/user system
- records inside those files
- local system files and their relationship paths

Current implementation may still use `KDB` names in canon, docs, sqlite tables, functions, and UI labels.

Do not rename those pieces one by one.

The rename should happen as a staged architecture pass so docs, canonical structure, UI labels, sqlite owner paths, relationship contracts, and steward language stay aligned.

## System Files Rule

The `System Files` file/page should expose these file-definition properties for each file:

- is it `L1`, `L2`, or `L2.a`
- does it require `System`
- does it require `KDB`
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

This should eventually converge into an explicit access assignment structure rather than relying only on a flat user-role list.

Possible future file or assignment owner:

- `Access_Assignments`

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

## KDB Stewardship Rule

The `File Steward` is also the effective KDB orchestrator for file birth and upkeep.

That means the `File Steward` should make sure:

- files are born correctly
- `KDB` is born with them
- the right relationships exist
- relationship direction, owner-path, and reverse-read are correct
- file order and creation sequence support those connections

So child file guides should treat KDB governance as part of `File Steward` responsibility, not as a detached separate guide layer.

## UX Stewardship Rule

Each file guide should include UX parameters that help the `File Steward` guide the user correctly.

The first structural fork should be:

`Is this a new file the user should be able to find, govern, and open?`

If yes, the structure should be created as `L1`.

If no, the user should be guided toward:

- `L2` when the concept is a major section inside an existing file
- `L2.a` when the concept is a subgroup inside an existing section

The default rule is:

- when uncertain, begin as `L1`
- demote to `L2` only when the concept is clearly a section inside an existing file
- demote to `L2.a` only when the concept is clearly a subgroup inside an existing section

The `UX Steward` should define:

- the plain-language question shown to the user
- the canonical value created by each answer
- the safe default
- the parent selection required for `L2` and `L2.a`
- the stop condition when the user does not have enough context

`File Specific` should not replace explicit named `L2` sections.

It should document the file's unique structure metadata while real user-facing sections remain explicit `L2`s.

## Canonical Loader Rule

`docs/000-canonical-structure.json` is the machine-readable structure source of truth.

Code should not import that JSON file casually from many places.

The approved app-side doorway is:

- `src/shared/canonicalStructure.js`

That doorway exists so canonical structure has one visible loading point before it feeds:

- file registry
- KDB relationship contracts
- shell rendering
- bootstrap validation
- future File Steward tooling

If Node scripts, Electron runtime code, ingestion validators, or bootstrap tools need canonical structure, they should use the same loader concept or an approved Node-safe sibling loader.

The rule is:

- one canonical source file
- one approved loading boundary per runtime
- no hidden direct JSON imports scattered through app code

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
12. `L2 File System`
13. `Open Questions`

## Working Rule

We will refine this together.

The goal is:

- every file is born with a guide
- every guide is governed by one parent file-guide rule
- the `Owner`, `File Steward`, and `UX Steward` can use that guide to keep the file understandable, stable, guided, and connected
