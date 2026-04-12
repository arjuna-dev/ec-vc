# Electron Runtime File Guide

## Purpose

This document explains the role of these files:

- `src-electron/services/sqlite-schema.js`
- `src-electron/services/sqlite-db.js`
- `src-electron/electron-main.js`
- `src-electron/electron-preload.js`
- `src/shared/ldbRelationshipContracts.js`
- `src/components/FilePageShell.vue`
- `src/utils/dialogShellPayload.js`

The goal is to make it easier to understand:

- what each file is for
- how they connect to each other
- what guiding principles to follow
- what to be careful about before changing them

This is the core runtime and shared-shell chain behind the app's local data behavior.

## The Simple Mental Model

The first four files form the deepest runtime path:

1. `sqlite-schema.js`
   - defines what the database should look like
2. `sqlite-db.js`
   - opens the database and makes sure the schema is there
3. `electron-main.js`
   - runs the backend logic and owns the real IPC handlers
4. `electron-preload.js`
   - safely exposes approved backend actions to the frontend

So in simple words:

- `schema` says what can exist
- `db` makes it real locally
- `main` does the work
- `preload` exposes only the safe front-door

The other three files sit on top of that runtime path:

- `ldbRelationshipContracts.js`
  - decides how canon-declared LDB links are interpreted underneath
- `FilePageShell.vue`
  - is the main shared file-shell renderer that consumes the runtime path
- `dialogShellPayload.js`
  - organizes transitional section payloads for the shared create/edit dialog while the file-owned token/view contract finishes converging

Important direction:

- workbook and canonical structure are still useful reference inputs
- but they should not keep acting as live shell payload truth
- the target runtime owner is the newer file-owned token/view structure, with shared `LDB` behavior derived from `System Files`

## 1. `src-electron/services/sqlite-schema.js`

## Use

This file is the database blueprint.

It defines:

- base tables
- join tables
- indexes
- foreign keys
- supporting system tables like:
  - `events`
  - `Field_Verification_Metadata`
  - `databook_snapshots`
  - `KDB_Relationships`

If you want to know:

- what tables exist
- what columns exist
- what relationships are physically possible

this is the first file to inspect.

## Guiding principles

- treat this file as structural truth for local sqlite storage
- keep table names explicit
- keep foreign keys explicit
- prefer strictness over convenience
- if a relationship is important enough to deserve a dedicated join table, define it here clearly

## What to be aware of

- this repo currently assumes developers can recreate the DB locally, so we are not building a heavy migration/versioning system for old DBs
- because of that, schema mistakes here can have broad impact, even if they seem small
- adding a table here alone does not make the feature work in the app
- this file only defines physical storage, not frontend access

Important rule:

- a table existing in `sqlite-schema.js` does not mean the app can already use it
- the bridge and runtime layers must also exist

## 2. `src-electron/services/sqlite-db.js`

## Use

This file is the DB bootstrapper and low-level DB utility layer.

It is responsible for:

- opening the sqlite database file
- applying the schema SQL
- turning on important sqlite settings like:
  - WAL mode
  - foreign keys
  - busy timeout
- exposing small helpers like:
  - `dbAll`
  - `dbRun`
  - `getDbInfo`

It also contains the current local DB reset logic through `maybeRecreateDb(...)`.

## Guiding principles

- this file should keep DB startup predictable
- it should not become a random business-logic file
- its job is to initialize and provide safe low-level DB access
- if structure drift is detected, this is one of the first places to verify whether the DB is actually being created the way we think it is

## What to be aware of

- `maybeRecreateDb(...)` is intentionally strict in this repo
- if the DB looks like an older/incompatible shape, it deletes and recreates it
- that matches the repo rule that local developers are expected to fully recreate the DB rather than support many legacy versions

This is powerful, but it means:

- changing schema expectations here can wipe a local DB
- you should only change these checks when you understand the full baseline being protected

Also important:

- `ensureColumn(...)` is currently being used as a lightweight safety step for a few columns
- that is useful short-term, but it is not the same thing as a full birth/contract system

## 3. `src-electron/electron-main.js`

## Use

This is the main backend runtime owner.

It is the biggest and most important of the four runtime files.

It handles:

- Electron app setup
- IPC handlers
- create/list/delete actions for many entities
- databook read/write behavior
- LDB relationship behavior
- artifact ingestion and file operations
- workspace and workbook sync behavior
- event logging and audit paths

If the frontend says:

- `api.companies.list()`
- `api.artifacts.ingest()`
- `api.databooks.update(...)`

this file is where that request is actually handled.

## Guiding principles

- this file is the runtime authority layer
- it should own real behavior, not guessed behavior
- frontend shells should not invent around missing backend contracts
- if a feature needs real ownership, this file is usually where that ownership must be wired

In plain words:

- this is where "the app actually does the thing"

## What to be aware of

- because this file is large, it is easy for drift to hide here
- a route or table may look real, but if `electron-main.js` does not expose the proper handler, the feature is not truly complete
- this file often determines whether a relationship is truly runtime-backed or only declared in docs/canon

Important caution:

- do not confuse a visible UI with a real runtime path
- if `electron-main.js` does not own the handler, the feature is not fully born

Also:

- this file is where LDB relationship behavior becomes real
- if `sqlite-schema.js` defines the possible relationship tables, `electron-main.js` is where the app actually uses them

## 4. `src-electron/electron-preload.js`

## Use

This file is the safe bridge between frontend and backend.

It exposes approved backend actions into `window.api`.

Examples:

- `api.companies.list`
- `api.funds.create`
- `api.events.list`
- `api.databooks.update`
- `api.artifacts.ingest`

The frontend should talk to backend through this file, not by direct access.

## Guiding principles

- preload should stay explicit
- only expose what the frontend is allowed to call
- keep naming clear
- keep the frontend-facing API stable and understandable

This is the app's front door to backend behavior.

Legacy runtime naming note:

- `api.databooks.*` is still a live shared runtime surface
- it should currently be treated as `keep temporarily`
- the approved successor direction is `api.records.*`

Approved migration map:

- `api.databooks.view` -> `api.records.view`
- `api.databooks.update` -> `api.records.update`
- `api.databooks.versions` -> `api.records.history`
- `api.databooks.viewSnapshot` -> `api.records.viewHistoryEntry`

Do not widen `api.databooks.*` casually while governance, provenance, and event behavior are becoming more detailed. If new shared behavior needs this surface, first decide whether it belongs on the temporary legacy contract or the successor `records` contract.

## What to be aware of

- if a runtime handler exists in `electron-main.js` but is not exposed here, the frontend still cannot use it
- if a method exists here but no matching handler exists in `electron-main.js`, the call will fail
- this file is where naming mismatches become very visible

Examples of common drift:

- table exists but no preload method
- preload method exists but wrong channel name
- menu/shell expects a surface that preload does not expose

## 5. `src/shared/kdbRelationshipContracts.js`

## Use

This file is the KDB bridge contract map.

It decides how canon-declared KDB relationships are treated at runtime.

Right now it supports three patterns:

- explicit dedicated join-table contracts
- direct foreign-key contracts
- generic fallback through `KDB_Relationships`

This is one of the most important files for understanding why a declared KDB link does or does not fully work.

## Guiding principles

- treat this file as the relationship-behavior contract layer
- keep relationship ownership explicit
- do not guess reverse direction in the shell
- if a KDB link is declared, this file should make clear whether it is:
  - dedicated join-table owned
  - direct-foreign-key owned
  - generic KDB owned

## What to be aware of

- this file is where the current mixed relationship model becomes visible
- some relationships are manually explicit here
- many other relationships fall back to generic `KDB_Relationships`
- this is one of the key places where future `new L1 birth automation` will need to become stricter

Important rule:

- a KDB token being present in canon does not automatically mean the full reciprocal bridge contract is already rich here

## 6. `src/components/FilePageShell.vue`

## Use

This is the main shared file-shell renderer for file-level surfaces.

It is where many `L1`s are presented through one common shell.

It handles things like:

- shell layout
- card/list rendering
- file toolbar behavior
- shell-level create actions
- event-shell special behavior
- KDB-related display behavior

This file is important because it proves whether the backend/runtime contract is actually usable through the shared shell.

## Guiding principles

- this should stay a shared shell, not drift into many page-specific mini-systems
- it should consume explicit payload and bridge contracts
- it should not guess ownership to compensate for missing backend structure

## What to be aware of

- because this file is large and highly visible, it is easy to patch symptoms here
- that is dangerous if the real problem is deeper in runtime ownership
- this file should reveal structural gaps, not hide them

Important caution:

- if `FilePageShell.vue` looks wrong, the bug may still actually live in:
  - preload
  - main
  - schema
  - KDB relationship contracts

## 7. `src/utils/dialogShellPayload.js`

## Use

This file helps organize canonical structure into payload groups for the shared create/edit dialog shell.

It does things like:

- group `L2` sections
- preserve subgroup structure
- build KDB subgroups like:
  - `First-Order`
  - `Knowledge DB`
- split sections into left/right shell placement

It is part of the contract-preparation layer for the dialog shell.

## Guiding principles

- preserve canonical grouping explicitly
- prefer canon-driven grouping over ad hoc shell-only grouping
- keep subgroup identity visible
- do not flatten structure just because the UI is simpler that way

## What to be aware of

- this file sits close to the shell, so it can become a quiet drift point if it starts inventing structure
- it should group and prepare explicit structure, not guess missing canon
- if grouping gets too magical here, the shell may look correct while the architecture is actually drifting

Important rule:

- this file should help render canon cleanly, not reinterpret canon loosely

## How They Work Together

Here is the deeper runtime chain:

1. `sqlite-schema.js`
   - defines the table or join table
2. `sqlite-db.js`
   - initializes the DB and applies the schema
3. `electron-main.js`
   - adds the real handler logic
4. `electron-preload.js`
   - exposes the handler safely to the frontend
5. `kdbRelationshipContracts.js`
   - tells the app how KDB links are actually owned/read
6. frontend shell/page
   - calls the preload API

For the shared shell path, there is then an additional layer:

7. `FilePageShell.vue`
   - renders the file surface
8. `dialogShellPayload.js`
   - prepares canonical grouped dialog payloads

If one step is missing, the feature is incomplete.

## What This Means For New `L1` Work

When creating a new normal `L1`, these files usually map to different parts of the birth sequence:

- `sqlite-schema.js`
  - real table owner
  - dedicated join tables if promoted
- `sqlite-db.js`
  - DB bootstrap and local baseline validation
- `electron-main.js`
  - runtime list/create/delete/edit behavior
  - databook and relationship ownership
- `electron-preload.js`
  - frontend bridge exposure
- `kdbRelationshipContracts.js`
  - KDB owner-path and reverse-read contract
- `FilePageShell.vue`
  - proof that the shared file shell can actually use the new source
- `dialogShellPayload.js`
  - proof that grouped dialog payloads still follow canon for that source

So if a new `L1` feels "half-real," it is usually because one or more of these files was skipped.

## Practical Review Order

If something is not working, check in this order:

1. `electron-preload.js`
   - is the frontend even allowed to call it?
2. `electron-main.js`
   - is there a real handler?
3. `kdbRelationshipContracts.js`
   - is the relationship ownership/read contract correct?
4. `sqlite-schema.js`
   - does the needed table/path actually exist?
5. `sqlite-db.js`
   - is the local DB actually being created/reset with the current baseline?
6. `FilePageShell.vue`
   - is the shared shell consuming the data correctly?
7. `dialogShellPayload.js`
   - is the dialog grouping preserving canon correctly?

If you are doing architecture work, review in this order instead:

1. `sqlite-schema.js`
2. `sqlite-db.js`
3. `electron-main.js`
4. `electron-preload.js`
5. `kdbRelationshipContracts.js`
6. `FilePageShell.vue`
7. `dialogShellPayload.js`

That order follows ownership from deepest structure to shell usage.

## Biggest Things To Watch Out For

- a table existing does not mean runtime ownership exists
- a runtime handler existing does not mean preload exposure exists
- a preload method existing does not mean the shell is using it correctly
- a KDB token existing does not mean the bridge contract is complete
- a visible shell does not mean the backend contract is real

And one especially important rule for this repo:

- do not patch missing ownership in the frontend if the real missing layer is one of these runtime or contract files

## Short Summary

If you want one sentence for each file:

- `sqlite-schema.js` = what the DB is allowed to be
- `sqlite-db.js` = how the DB is opened and enforced locally
- `electron-main.js` = where the app's backend behavior actually happens
- `electron-preload.js` = the safe API bridge the frontend is allowed to use
- `kdbRelationshipContracts.js` = how declared KDB links are actually owned and read
- `FilePageShell.vue` = the main shared file-shell surface that proves whether the runtime path is usable
- `dialogShellPayload.js` = the dialog grouping helper that should preserve canon instead of inventing it
