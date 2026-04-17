# Planned Migration Pass

## TLDR

`PMP` is the how-to for getting from the current uneven system to the intended `LAMP` system.

It exists because the app is teaching us that if files are not born, hydrated, translated, and rendered through the same lower shared chain, then they will drift and become impossible to trust.

The current goal is not to rebuild from scratch immediately.

The current goal is to:

- understand the lower chain clearly
- simplify it
- remove false translation layers
- define the migration order
- collect the rules needed for a cleaner future birth

## Purpose

This document should explain:

- where the app is now
- what the target `LAMP` system is
- why the current system drifts
- what layers must be standardized
- what order the migration should happen in

This is not a loose note.

It should become the working migration guide for moving the system from inherited uneven behavior toward one coherent lower architecture.

Companion audit:

- [File Carry-Forward Audit](/abs/path/c:/Users/erikc/Coding_Repository/ec-vc/docs/999/d.%20File%20Carry-Forward%20Audit.md)

## Audit Vocabulary

This migration pass should use three fixed audit labels:

- `Direct Path`
- `Fallback / Safety Path`
- `Override Path`

These labels help us describe how the app is actually working while migration is in progress.

### Direct Path

`Direct Path` means:

- true canonical source
- true runtime path
- true renderer input

This is the target state.

### Fallback / Safety Path

`Fallback / Safety Path` means:

- static registries acting as second authority
- default helpers silently repairing live state
- normalization passes
- guessed resolution when structure is missing

These paths should be named explicitly and reduced over time.

### Override Path

`Override Path` means:

- local storage overrides
- page-local remapping
- local shadow state that competes with canonical owned truth

These paths should be treated as high-risk drift carriers.

## Current State

The current repo already contains important truths, but they are not yet applying equally everywhere.

What is already clearer:

- `Governance defines structure.`
- `Data reflects structure.`
- runtime truth begins at `setRuntimeFileStructures(...)`
- shared surfaces should stay dumb
- token meaning should flow through explicit contract, not local restatement
- archived files should remain governable but not load into runtime
- `History` is still a real shared-base dependency
- `History` should resolve through the `History` file by record `ID`

What is still uneven:

1. file birth / bootstrap
- different files do not appear to be born with equally complete structure

2. runtime structure formation
- runtime has not always preserved the same token truth for every file

3. payload formation
- `buildFileShellPayload(...)` is thin, but that does not help if its inputs already differ by file

4. token-to-surface translation
- `Data` and `Governance` have not yet fully derived from one shared lower contract
- page-owned logic has still survived in places like `FilePageShell`

5. record loader / write ownership
- some files still appear to have stronger or clearer load/write ownership than others

The current bugs are therefore not random UI bugs.

They are evidence that files are not yet entering and passing through the same shared lower chain.

## Target State

The `LAMP` target is:

1. files are born consistently
2. every file class passes through the same minimum shared chain
3. runtime preserves full structure truth
4. one shared token-to-surface contract drives both `Data` and `Governance`
5. shared surfaces stay dumb
6. special cases are explicit exceptions, not default architecture
7. file classes are clear and useful

The system should become predictable enough that:

- if one file behaves differently from another
- the break can be located in a known layer
- not guessed at from the UI

## Core Migration Rule

For any file to participate truthfully in the shared system, it must pass through the same minimum chain:

1. file is born in `System Files`
2. file has canonical `Structure`
3. runtime hydrates that structure without dropping meaning
4. payload is built from that runtime structure
5. shared token-to-surface contract derives:
- input kind
- options
- write path
- visibility/editability
6. `Governance` edits that same structure truth
7. `Data` renders from that same structure truth

If a file does not behave like another file, the break is in one of those layers.

Shared base correction:

- `History` remains part of the shared base
- it should not be treated as already replaced by token metadata alone

## Why Files Drift

Files drift when:

1. they are not born the same way
2. runtime keeps different token truth for different files
3. payloads start from unequal lower structure
4. page-owned logic reinterprets token behavior locally
5. surfaces are forced to restate missing meaning
6. write ownership is explained through intermediate layers instead of true source context

The most important lesson is:

- if the lower chain is uneven, no surface can be fully trusted

## File Classes

The file system itself may need to become more explicit in order to support consistent file birth.

The current likely classes are:

### 1. System Runtime Files

These are the files that let the system boot and regulate itself.

They define:

- initial folder and file organization
- construct rules
- file birth rules
- runtime participation rules
- shared structure expectations

These files make the rest of the system predictable.

### 2. Owner Files

These are the owner's real working files.

They are:

- local
- owner-scoped
- truth-bearing for that person's work and memory

Examples may include:

- Contacts
- Companies
- Tasks
- Notes
- Artifacts
- other owner-level work files

### 3. Auxiliary Files

These are supporting libraries or domain engines.

They are not the core owner operating layer.
They extend it.

Examples may include:

- Markets
- Funds
- Rounds
- project-specific or domain-specific repositories

These should not distort the core lower chain.

They should extend it.

## Runtime Contract Lessons Already Learned

The repo has already exposed several important lessons:

1. runtime token truth must be explicit
- partial or accidental token survival creates drift

2. token meaning should not be restated locally
- if a token says `select_single`, the surface should learn that from contract

3. `Data` and `Governance` should not invent separate lower meanings
- they may differ in purpose
- but they should still consume the same lower contract

4. shared surfaces should stay dumb
- the surface should render what the contract says
- not infer what the file probably means

5. intermediate helper layers should be treated with suspicion
- especially when they are trying to explain or translate write ownership instead of deriving it directly from source context

## Current Migration Direction

The current convergence work has already moved in the right direction in a few places:

- runtime now preserves more token truth
- archived files are skipped from runtime hydration
- `File_Status` is now reduced to `Active / Archived`
- `DraftWindow` and `FilePageShell` have begun sharing token-to-surface translation logic

But the system is still not yet fully migrated.

The most important remaining lower issue is:

- `Data` and `Governance` still do not fully consume the same lower shared contract

## Active Base vs Target Base

One important migration rule is now explicit:

- the current active base contract is not yet the same as the intended target base contract

### Current Active Base

The repo is still actively teaching these as the born shared base:

- views:
  - `System`
  - `General`
  - `LDB`
  - `Other`

- shared tokens:
  - `ID`
  - `History`
  - `Data.Status`
  - `Name`
  - `Summary`

This is still the active truth in the current birth template and in several active docs and surfaces.

### Target Base

The intended migration target is:

- views:
  - `System`
  - `General`
  - `LDB`

- base tokens:
  - `ID` in `System`
  - `System.Status` in `System`
  - `History` in `System`
  - `Name` in `General`
  - `Definition` in `General`

And importantly:

- `System.Status` is not the same thing as `Data.Status`
- `System.Status` is file/runtime lifecycle
- `Data.Status` is governed data-state and UI meaning
- `Other` was only a proof placeholder and should not remain part of the true shared base contract

### Migration Safety Rule

Do not flip the birth template directly from current active base to target base without inventorying the active consumers first.

The dangerous part is not `Other`.

The dangerous part is that:

- `Summary` is still actively consumed across multiple live surfaces
- `Data.Status` is still a real governed concept and should not be collapsed into `System.Status`

That means the migration must distinguish:

- removable placeholder base
- real system lifecycle token
- real governed data-state token

before the birth template is changed.

## Migration Stages

### Stage 1. Define Construct and File Classes

Goal:

- define the file-system model before more implementation spreads

Needs:

- explicit `System Runtime Files`
- explicit `Owner Files`
- explicit `Auxiliary Files`
- clear statement of which files are birth-critical
- clear statement of which files are optional extensions

### Stage 2. Standardize File Birth

Goal:

- every file should be born through the same minimum structure chain

Every file should have:

- `System Files` row
- canonical `Structure`
- canonical file class
- canonical active/archive status
- canonical source/entity identity

Needs:

- identify which files are still born with incomplete or weaker structure
- identify which files still rely on special-case birth logic

Specific current checklist:

1. remove `Other` from the shared base contract
2. introduce true `System.Status` as the file/runtime lifecycle token
3. keep `Data.Status` separate as governed data-state
4. inventory active `Summary` consumers before replacing shared `Summary` with shared `Definition`
5. update birth template only after active consumers are migrated

### Stage 2A. Shared Base Migration Inventory

This checklist exists because the base contract itself is still mid-migration.

#### A. `Other`

Treat `Other` as removable from the shared base.

Check:

- birth template
- structure completeness assumptions
- docs that still describe `Other` as a real shared base lane

#### B. `System.Status`

Treat `System.Status` as the file/runtime lifecycle token.

Check:

- where `File_Status` is currently regulated
- where lifecycle is still explained through older or mixed language
- where system lifecycle should become visible through the shared base

#### C. `Data.Status`

Treat `Data.Status` as a separate governed data-state token.

Check:

- where it is still being used correctly as data-state meaning
- where it is being confused with lifecycle or file visibility

#### D. `Summary -> Definition`

Treat this as a real migration, not a label cleanup.

Check:

- all active `summary` token consumers
- all runtime helpers that still assume `summary` is the shared secondary field
- all surfaces that still use `getRegistrySummaryTokenForSource(...)`

Only after that inventory is complete should the birth template be changed from:

- shared `Summary`

to:

- shared `Definition`

### Stage 3. Standardize Runtime Formation

Goal:

- runtime should hydrate all files through the same explicit contract

Needs:

- preserve section truth
- preserve token truth
- preserve input truth
- preserve write truth
- preserve relationship truth

Avoid:

- accidental truth surviving only because of object spread
- file-specific hidden assumptions

### Stage 4. Standardize Token-To-Surface Translation

Goal:

- `Data` and `Governance` derive from the same shared translation layer

Needs:

- `tokenType` decides input kind
- `inputOptions` / `optionSource` / `optionEntity` decide options
- write metadata decides write path
- editability and visibility are declared, not guessed

Avoid:

- page-owned helpers
- governance-specific reshaping that invents second schemas
- local restatement of token meaning

### Stage 5. Replace Legacy Surfaces With The Shared Chain

Goal:

- the `Draft Window` stops being a special proof surface and becomes proof of the real shared path

Order:

1. prove in `Draft Window`
2. move the real logic into shared lower layers
3. make `FilePageShell` consume that path
4. make other shell surfaces consume that same path
5. remove redundant page-owned logic

## Inspection Checklist

If one file behaves differently from another, inspect in this order:

1. was the file born correctly in `System Files`?
2. does it have canonical `Structure`?
3. did runtime hydrate the structure without dropping meaning?
4. did payload formation preserve the same truth?
5. did token-to-surface translation preserve:
- input kind
- options
- write path
- visibility/editability
6. is `Governance` editing that same structure truth?
7. is `Data` rendering from that same structure truth?

## What Not To Do

Do not:

- patch each file separately
- fix one page locally and call the system solved
- keep inventing per-surface translation layers
- preserve intermediate layers just because they already exist
- add special-case exceptions before the lower shared contract is understood

## Current Working Recommendation

Continue using `Draft Window` as the steering wheel and proof surface.

But do not let it become a special architecture branch.

The right pattern is:

1. expose the lower issue in `Draft Window`
2. fix it in the lower shared layer
3. let other surfaces inherit the fix through the same path

That is how current convergence becomes future migration recipe.

## Next PMP Targets

The next migration targets are:

1. continue reducing Governance row reshaping
2. continue moving `Data` and `Governance` to one shared token-to-surface contract
3. define the minimum born file contract
4. decide the final file-system class model
5. decide what belongs in `GAP` temporarily versus what belongs in long-term `LAMP`

## Summary

The app does not become reliable by fixing each file one at a time.

It becomes reliable when:

- files are born consistently
- runtime truth is complete
- translation is shared
- surfaces stay dumb
- write ownership is explicit

`PMP` exists to make that migration visible, ordered, and repeatable.


