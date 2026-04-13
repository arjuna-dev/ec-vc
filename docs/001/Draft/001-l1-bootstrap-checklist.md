# New File Bootstrap Implementation Checklist

**Terminology update:** File = former `L1`, View = former `L2`, Token = former `L3`, and `LDB` replaces legacy `KDB` naming in runtime contracts.

## Purpose

This checklist translates the approved new file birth sequence into the current codebase.

It is meant to answer:

- what already exists
- what is only partial
- what must be implemented before opening a test branch for file birth automation

The target is strict bootstrap behavior, not a heuristic helper.

## Current Codebase Map

### 1. Canonical entity definition

Primary files:

- `docs/000-canonical-structure.json`
- `docs/000-workbook-schema-companion.json`

Current status:

- this already exists as the canonical source of truth
- explicit view structure is now supported
- shared-base guidance is documented

Implementation need:

- define the exact canonical minimum payload required for a new file
- make sure the canonical format can declare:
  - shared base sections
  - entity-specific views
  - LDB tokens
  - relationship ownership decision when explicitly promoted

### Canonical birth input contract

A new file should not begin birth unless this input contract is complete.

If any required part is missing, the correct action is:

- stop
- surface the gap
- complete the canonical input first

Minimum required input:

1. canonical entity identity
   - canonical entity name
   - singular label
   - plural label
   - route key
2. entity class
   - normal file
   - branch-capable file
   - approved exception
3. shared base confirmation
   - `System`
   - `LDB`
   - `General`
4. shared base parameter confirmation
   - `System`
     - `ID`
     - `Creator`
     - `Datetime`
     - `EventLog`
   - `General`
     - `Name`
     - `Summary`
5. entity-specific extension structure
   - entity-specific view list
   - approved view structure
6. LDB declaration set
   - target file
   - source token
   - expected reverse target
7. relationship owner-path decision set
   - shared `LDB_Relationships`
   - promoted dedicated join table
8. shell ownership identity
   - file-shell route ownership
   - registry/menu identity
   - runtime entity/table identity
9. validation target
   - list works
   - create works
   - edit works
   - delete works
   - LDB appears
   - reverse-read appears
   - shell launch works

Compact check:

1. what is the entity called?
2. is it normal, branch-capable, or an approved exception?
3. does it own the shared base?
4. does it use the shared base parameters correctly?
5. what are its entity-specific views?
6. what LDB links does it declare?
7. which links stay in `LDB_Relationships`?
8. which links are explicitly promoted to dedicated join tables?
9. what route/registry/runtime identity should be created?
10. how do we prove the birth is complete?

This contract does not allow:

- guessing labels from table names
- creating a visible shell before runtime ownership exists
- adding LDB tokens without reverse-read planning
- assuming every relationship deserves a dedicated join table
- inventing view structure later in shell code

File Steward rule:

- missing birth input is a stop condition
- the steward should not allow partial birth input
- the steward should not allow silent defaults beyond the approved shared base
- the steward should not allow post-birth structural invention to fill in missing canon

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

### 3. Shared base sections

Primary files:

- `docs/000-canonical-structure.json`
- `src/utils/structureRegistry.js`

Current status:

- the shared-base rule is now documented clearly:
  - `System`
  - `LDB`
  - `General`

Implementation need:

- ensure new files always start with those three sections unless an approved exception is declared
- remove any birth path that can create a file without the shared base

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

- `docs/000-canonical-structure.json`
- `docs/000-workbook-schema-companion.json`

Current status:

- the rule is documented
- parts of the canon are already being corrected toward this rule

Implementation need:

- define one reusable base parameter block
- ensure new files inherit this block at birth
- stop entity birth from renaming shared base fields into entity-prefixed duplicates

### 5. Entity-specific view structure

Primary files:

- `docs/000-canonical-structure.json`
- `docs/000-workbook-schema-companion.json`

Current status:

- this is already how the canon behaves conceptually

Implementation need:

- make entity extension a distinct post-base step
- ensure view structure is loaded only after the shared base is present

### 6. Reciprocal LDB declarations

Primary files:

- `docs/000-canonical-structure.json`
- `src/shared/ldbRelationshipContracts.js`

Current status:

- canon can declare LDB tokens
- runtime can resolve explicit contracts and generic contracts
- reciprocal coverage is still partly manual

Implementation need:

- define the approved active file set for reciprocal birth
- create one birth rule that generates reciprocal LDB declarations for the new file
- stop relying on post-birth manual back-wiring as the default

### 7. Relationship owner-path choice

Primary files:

- `src/shared/ldbRelationshipContracts.js`
- `src-electron/services/sqlite-schema.js`

Current status:

- both models already exist:
  - dedicated join table
  - shared `LDB_Relationships`
- the choice is currently partly manual

Implementation need:

- define the default owner-path rule at birth:
  - default to shared `LDB_Relationships`
  - promote to dedicated join table only when the relationship becomes a governed object
- make this decision explicit during bootstrap

### 8. Reverse-read path

Primary files:

- `src/shared/ldbRelationshipContracts.js`
- `src/components/FilePageShell.vue`
- `src/utils/dialogShellPayload.js`

Current status:

- reverse-read behavior exists for some relationships
- coverage is still uneven across the declared LDB set

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
- `src/shared/ldbRelationshipContracts.js`

Current status:

- validation is still mostly human review and targeted bug-fixing

Implementation need:

- define the minimum proof for a born file:
  - list works
  - create works
  - edit works
  - delete works
  - LDB appears
  - reverse-read appears
  - shell launch works
- do not mark file birth complete before this proof exists

## First Implementation Slice

The smallest clean implementation order should be:

1. define the canonical input contract for new file birth
2. define the active file set used for reciprocal LDB generation
3. define the default LDB owner-path rule:
   - default `LDB_Relationships`
   - promote only by explicit approval
4. build one bootstrap helper that produces:
   - shared base sections
   - shared base parameters
   - reciprocal LDB declarations
5. only after that wire table/runtime/registry creation through the same birth path
6. then open a test branch and prove it through one test entity

## Pre-Test-Branch Gate

Before opening the test branch, we should be able to answer `yes` to all of these:

- do we know the exact canonical input for a new file?
- do we know which existing files get reciprocal LDB declarations by default?
- do we know when a relationship stays in `LDB_Relationships`?
- do we know when a relationship is promoted to a dedicated join table?
- do we know the minimum validation proof for a born file?

If any answer is `no`, the bootstrap rule is still under-defined.
