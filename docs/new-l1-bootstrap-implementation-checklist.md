# New `L1` Bootstrap Implementation Checklist

## Purpose

This checklist translates the approved `new normal L1 birth sequence` into the current codebase.

It is meant to answer:

- what already exists
- what is only partial
- what must be implemented before opening a test branch for `L1` birth automation

The target is strict bootstrap behavior, not a heuristic helper.

## Current Codebase Map

### 1. Canonical entity definition

Primary files:

- `docs/canonical-structure.json`
- `docs/workbook-schema-companion.json`

Current status:

- this already exists as the canonical source of truth
- explicit `L2.a-b-c-d` subgrouping is now supported
- shared-base guidance is documented

Implementation need:

- define the exact canonical minimum payload required for a new normal `L1`
- make sure the canonical format can declare:
  - shared base sections
  - entity-specific `L2`s
  - KDB tokens
  - relationship ownership decision when explicitly promoted

### 2. Real table/runtime owner

Primary files:

- `src-electron/services/sqlite-schema.js`
- `src-electron/services/sqlite-db.js`
- `src-electron/electron-main.js`
- `src-electron/electron-preload.js`

Current status:

- the repo already has the pieces needed to define first-class tables and runtime handles
- several recent entities now follow the same `list/create/delete` pattern

Implementation need:

- create one strict owner-bootstrap path that adds:
  - sqlite table
  - databook config
  - runtime IPC handlers
  - preload bridge
- do this from one canonical source instead of scattered manual edits

### 3. Shared base subsections

Primary files:

- `docs/canonical-structure.json`
- `src/utils/structureRegistry.js`

Current status:

- the shared-base rule is now documented clearly:
  - `System`
  - `KDB`
  - `General`

Implementation need:

- ensure new normal `L1`s always start with those three sections unless an approved exception is declared
- remove any birth path that can create an `L1` without the shared base

### 4. Shared base parameters

Shared `System` parameters:

- `ID`
- `Creator`
- `Datetime`
- `EventLog`

Shared `General` parameters:

- `Name`
- `Summary`

Primary files:

- `docs/canonical-structure.json`
- `docs/workbook-schema-companion.json`

Current status:

- the rule is documented
- parts of the canon are already being corrected toward this rule

Implementation need:

- define one reusable base parameter block
- ensure new normal `L1`s inherit this block at birth
- stop entity birth from renaming shared base fields into entity-prefixed duplicates

### 5. Entity-specific `L2` structure

Primary files:

- `docs/canonical-structure.json`
- `docs/workbook-schema-companion.json`

Current status:

- this is already how the canon behaves conceptually

Implementation need:

- make entity extension a distinct post-base step
- ensure `L2.a-b-c-d` subgrouping is loaded only after the shared base is present

### 6. Reciprocal KDB declarations

Primary files:

- `docs/canonical-structure.json`
- `src/shared/kdbRelationshipContracts.js`

Current status:

- canon can declare KDB tokens
- runtime can resolve explicit contracts and generic contracts
- reciprocal coverage is still partly manual

Implementation need:

- define the approved active `L1` set for reciprocal birth
- create one birth rule that generates reciprocal KDB declarations for the new `L1`
- stop relying on post-birth manual back-wiring as the default

### 7. Relationship owner-path choice

Primary files:

- `src/shared/kdbRelationshipContracts.js`
- `src-electron/services/sqlite-schema.js`

Current status:

- both models already exist:
  - dedicated join table
  - shared `KDB_Relationships`
- the choice is currently partly manual

Implementation need:

- define the default owner-path rule at birth:
  - default to shared `KDB_Relationships`
  - promote to dedicated join table only when the relationship becomes a governed object
- make this decision explicit during bootstrap

### 8. Reverse-read path

Primary files:

- `src/shared/kdbRelationshipContracts.js`
- `src/components/FilePageShell.vue`
- `src/utils/dialogShellPayload.js`

Current status:

- reverse-read behavior exists for some relationships
- coverage is still uneven across the declared KDB set

Implementation need:

- require every born relationship to include reverse-read support
- treat missing reverse-read as incomplete bootstrap, not as a later UI fix

### 9. Route / registry / shell ownership

Primary files:

- `src/utils/structureRegistry.js`
- `src/router/routes.js`
- `src/components/FilePageShell.vue`

Current status:

- the shared shell structure is real
- menu-facing naming has been aligned for current entities

Implementation need:

- create one route/registry/shell birth checklist tied to the canonical entity
- ensure visible shell presence is never ahead of runtime ownership

### 10. Working validation

Primary files:

- `src/components/FilePageShell.vue`
- `src/pages/RecordShellPage.vue`
- `src/pages/DialogShellPage.vue`
- `src/shared/kdbRelationshipContracts.js`

Current status:

- validation is still mostly human review and targeted bug-fixing

Implementation need:

- define the minimum proof for a born `L1`:
  - list works
  - create works
  - edit works
  - delete works
  - KDB appears
  - reverse-read appears
  - shell launch works
- do not mark `L1` birth complete before this proof exists

## First Implementation Slice

The smallest clean implementation order should be:

1. define the canonical input contract for new normal `L1` birth
2. define the active `L1` set used for reciprocal KDB generation
3. define the default KDB owner-path rule:
   - default `KDB_Relationships`
   - promote only by explicit approval
4. build one bootstrap helper that produces:
   - shared base sections
   - shared base parameters
   - reciprocal KDB declarations
5. only after that wire table/runtime/registry creation through the same birth path
6. then open a test branch and prove it through one test entity

## Pre-Test-Branch Gate

Before opening the test branch, we should be able to answer `yes` to all of these:

- do we know the exact canonical input for a new normal `L1`?
- do we know which existing `L1`s get reciprocal KDB declarations by default?
- do we know when a relationship stays in `KDB_Relationships`?
- do we know when a relationship is promoted to a dedicated join table?
- do we know the minimum validation proof for a born `L1`?

If any answer is `no`, the bootstrap rule is still under-defined.
