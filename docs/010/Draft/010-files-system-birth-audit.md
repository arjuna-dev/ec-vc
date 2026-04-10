# Files / System Files Birth Audit

## Status

Status: `Draft`

This is a discovery audit, not an implementation pass.

It reviews whether `Files` and `System Files` are truly born across canon, registry, runtime, shell, navigation, provenance, and guides.

## Purpose

This audit applies the current steward model to the first file-definition layer.

The goal is to decide what should be fixed next without guessing.

Steward lenses used:

- `Architect Steward`: does the whole birth chain make sense?
- `File Steward`: is the file born correctly?
- `Runtime Steward`: is it actually executable?
- `Provenance Steward`: can birth and later changes be reconstructed?
- `UX Steward`: can the user make the right structural choice?

## Scope

Reviewed surfaces:

- `docs/000-canonical-structure.json`
- `docs/100/Active/100-Files.md`
- `docs/100/Active/100-System_Files.md`
- `src/utils/structureRegistry.js`
- `src-electron/services/sqlite-schema.js`
- `src-electron/electron-main.js`
- `src-electron/electron-preload.js`
- `src/router/routes.js`
- `src/layouts/MainLayout.vue`
- `src/pages/FilesPage.vue`
- `src/components/FilePageShell.vue`
- `src/components/AddEditFileShellDialog.vue`

## Audit Table

| Layer | Expected Truth | Current Truth | Status | Steward Concern |
| --- | --- | --- | --- | --- |
| Canonical JSON | `Files` exists as the canonical entity with `System`, `KDB`, `General`, and `File Specific` structure. | `Files` exists as entity `23` with those sections and file-definition tokens. | `yes` | Architect/File Steward: canonical structure exists and is explicit. |
| Canonical field aliases | Canon aliases should match runtime fields for the file registry. | `File_Name`, `File_Summary`, `File_Status`, `File_Guide_Path`, `File_Source_Key`, `File_Canonical_Entity`, `File_Runtime_Entity`, `File_Route_Name`, `File_Path`, `File_Order`, `File_Class`, `Requires_System`, `Requires_KDB`, `Ownership_Mode`, `File_Steward`, `Rulebook_Dependencies`, `Defined_Structure`, and `Glossary_Terms` map to runtime columns. | `yes` | Runtime Steward: aliases are mostly aligned. |
| Canonical provenance tokens | `System` should expose ID, creator, datetime, and event linkage. | Canon exposes `id`, `created_by`, `created_at`, and `File_EventLog`. | `partial` | Provenance Steward: fields exist, but no proven genesis reconstruction path yet. |
| System Files guide | The app-facing System Files surface should have its own guide. | `docs/100/Active/100-System_Files.md` exists and describes the app-facing surface backed by `Files`. | `yes` | File Steward: guide exists and matches current naming split. |
| Files guide | The canonical registry entity should have its own guide. | `docs/100/Active/100-Files.md` exists and distinguishes `Files` from `System Files`. | `yes` | File Steward: guide exists and is useful. |
| File guide index | The file-guide map should track active/draft guide status. | `docs/100/Active/100-File_Guides_Index.md` exists and lists `Files`, `System Files`, and draft `Access Assignments`. | `yes` | File Steward: index exists but is manually maintained. |
| Registry entry | `Files` should be accepted as the visible System Files L1. | `structureRegistry` defines `Files` with key `file-system`, label `System Files`, route `/file-system`, and `showInWorkspaceNav: true`. | `yes` | Architect Steward: accepted through registry. |
| Registry order | System Files should come first because file registry birth should precede normal files. | `FILE_PAGE_ENTITY_ORDER` starts with `Files`, then `Building_Blocks`, then `Events`. | `yes` | Architect Steward: order matches current creation logic. |
| Runtime table | Runtime should own a real `Files` table. | SQLite schema creates `Files` with registry metadata columns, `File_EventLog`, `created_by`, `created_at`, and `updated_at`. | `yes` | Runtime Steward: executable owner exists. |
| Runtime bridge | The renderer should have file-system list/create/delete bridge calls. | Preload exposes `file-system.list`, `file-system.create`, and `file-system.delete`. | `yes` | Runtime Steward: bridge exists for basic file registry operations. |
| Runtime handlers | Electron should implement list/create/delete for file-system. | `file-system:list`, `file-system:create`, and `file-system:delete` handlers exist. | `yes` | Runtime Steward: basic handlers exist. |
| Runtime update | Runtime should support editing file registry rows if System Files is an owner surface. | Dedicated `file-system:update` was not found, but `FilePageShell` edit/autosave uses `databooks:update`; `applyAuditedChanges()` permits `Files` field updates through `DATABOOK_TABLE_CONFIGS.Files`, writes `updated_at`, and creates audit events. | `yes` | Runtime Steward: explicit `file-system:update` is probably unnecessary while the shared databook update contract remains the approved edit path. |
| Default registry seed | System should seed registry rows from the approved source of truth. | `ensureDefaultFiles()` seeds rows from `FILE_PAGE_REGISTRY`, which is built from canonical structure plus route meta. | `partial` | Architect/File Steward: useful, but System Files is not yet the source of file acceptance; route meta still has authority. |
| File guide defaulting | Each born file should know its guide path or honestly show that it is missing. | Default guide path is only assigned for `file-system`; other rows default to `null`. | `partial` | File Steward: good honesty, but next pass should decide which active files require guide paths before nav acceptance. |
| Requires System / KDB | Requirements should derive from canonical sections. | `ensureDefaultFiles()` derives `Requires_System` and `Requires_KDB` from registry subsections. | `yes` | File Steward: derivation is useful and explicit. |
| Shell rendering | `/file-system` should render through the shared file shell. | Route `/file-system` loads `FilesPage.vue`, which renders `FilePageShell`. `FilePageShell` has a `file-system` loader. | `yes` | Runtime Steward: page shell path exists. |
| Add/Edit File Shell | Add/Edit File Shell should guide file structure and link the correct guide. | `AddEditFileShellDialog` uses registry L2/L3 data and local structure-selection state. It is not the proven row-edit persistence path. The guide icon currently points to parent guide `docs/001/Active/001-Files.md`, not the selected file's `File_Guide_Path`. | `partial` | UX/File Steward: parent guide is useful, but selected file guide linking is not yet dynamic and this shell should not be assumed to persist registry row edits. |
| Navigation acceptance | Visible file nav should mean accepted file truth. | `WORKSPACE_FILE_NAV_ITEMS` now carries the visible drawer file list and explicit `workspace` / `knowledge-dbs` grouping from `structureRegistry`; `MainLayout` consumes that export instead of manually injecting file nav rows. | `partial` | Architect Steward: layout injection is consolidated, but route meta still owns acceptance before `System Files` records become the source. |
| Events/provenance | File birth should be reconstructable from events. | `events` table and `writeAuditEvent()` exist. `Files` has `File_EventLog`, `created_by`, and timestamps. `createFile()` sets `created_by`, but does not visibly write a file-birth audit event in this path. | `partial` | Provenance Steward: event infrastructure exists, but genesis/file-birth reconstruction is not proven. |
| KDB/LDB relationships | File relationships should be declared and reverse-readable where required. | Canon declares KDB relationship tokens for Owner, Users, Contacts, Companion Roles, Events, and Rulebooks. Runtime has generic `KDB_Relationships`, but this audit did not prove Files-specific bridge writing or reverse-read behavior. | `partial` | File/Provenance Steward: relationship intent exists; runtime bridge proof is still needed. |
| UX fork | User should be guided between `L1`, `L2`, and `L2.a`. | File guides and Add/Edit File Shell describe/show structure-level data, but this audit did not prove a full guided create flow that writes new canonical structure. | `partial` | UX Steward: guidance exists, but file-birth UX is not yet a full creation wizard. |

## Main Findings

### 1. `Files` / `System Files` are real, but still partially born

The current guides are honest.

`Files` is active and runtime-backed, but not fully born because provenance reconstruction and some relationship/write paths are not proven.

### 2. Runtime truth still starts from route registry, not System Files records

`ensureDefaultFiles()` seeds `Files` rows from `FILE_PAGE_REGISTRY`.

That is better than manual rows, but it means file acceptance is still upstream in code route meta.

The intended future direction is that `System Files` becomes the accepted file-definition registry, and route/nav/runtime validation aligns against it.

### 3. Navigation layout injection has been consolidated

`WORKSPACE_FILE_NAV_ITEMS` is registry-derived.

The drawer now consumes the registry export for both main workspace files and `Knowledge DBs`.

This removes the layout-level second source of truth.

Remaining limitation:

- visible acceptance still comes from `structureRegistry` route meta before it comes from `System Files` records

### 4. File guide linkage is honest but incomplete

Only the `System Files` row receives a default guide path automatically.

That prevents fake guide truth, but it also means guide acceptance is not yet strong enough to gate visibility.

The Add/Edit File Shell currently links the parent `001-Files.md` guide, not the selected file's own guide path.

### 5. Provenance infrastructure exists, but file-birth events are not proven

The app has:

- `events`
- `writeAuditEvent()`
- `created_by`
- `created_at`
- `File_EventLog`

But the audited `createFile()` path does not visibly write a file-birth audit event.

That means genesis reconstruction remains correctly marked `partial`.

## Runtime Steward Proof Addendum

Status: `complete for first pass`

The first Runtime Steward proof pass confirmed:

- `Files` has runtime/sqlite ownership through the `Files` table
- `file-system:list`, `file-system:create`, and `file-system:delete` exist
- file row edits can use the shared `databooks:update` path
- `databooks:update` resolves `Files` through `DATABOOK_TABLE_CONFIGS.Files`
- `applyAuditedChanges()` checks the target column exists, updates the row, updates `updated_at`, and writes an audit event
- an explicit `file-system:update` bridge is not required unless we decide file registry updates need stricter governance than the shared databook update path

Remaining runtime concerns:

- `delete` exists for `Files`, but this audit did not prove root/system file deletion governance
- `createFile()` creates a file row and actor, but does not visibly write a file-birth audit event
- Add/Edit File Shell should not be treated as the proven row-edit path; FilePageShell shared create/edit dialog is the proven persistence path

## System Files Acceptance Contract Direction

Status: `approved direction`

This is the key architecture objective for the next phase.

The deeper test is:

`Can the app trust System Files records as the accepted file-definition truth without breaking runtime startup, routing, shells, or navigation?`

The intended end-state is:

1. canonical JSON
2. `structureRegistry` / runtime registry
3. `System Files` seed rows
4. `System Files` acceptance state
5. visible nav, shell eligibility, and guide links

The important direction-of-authority rule is:

`Code/canon births System Files. System Files governs acceptance after it exists.`

This avoids the startup chicken-and-egg problem.

At startup, the app still needs code and canon to know enough to create, seed, read, and render `System Files`.

After bootstrap, `System Files` should become the accepted file-definition layer.

### Acceptance Chain

The clean chain should be:

1. Bootstrap source
2. Seed registry
3. Acceptance layer
4. Runtime validation
5. Visible navigation

### 1. Bootstrap Source

Canon plus route meta defines the minimum needed to create and open `System Files`.

This is allowed because `System Files` cannot govern itself before it exists.

### 2. Seed Registry

`ensureDefaultFiles()` creates or updates file rows from approved canon/registry definitions.

This gives `System Files` a starting set of records.

### 3. Acceptance Layer

`System Files` rows should say whether each file is:

- active
- draft
- hidden
- partial
- accepted

This layer should decide what is allowed to become visible or shell-eligible after bootstrap.

### 4. Runtime Validation

The app should compare accepted rows against route, runtime, bridge, sqlite, and shell support.

If `System Files` says a file is active but runtime support is missing, the app should surface drift instead of pretending the file is fully born.

If route/runtime exists but `System Files` says the file is draft or hidden, visibility should follow the accepted policy.

### 5. Visible Navigation

Visible navigation should render only rows that pass acceptance and runtime validation, plus explicitly declared system-level exceptions.

## Acceptance Contract Questions

Before implementation, answer these:

- Which `File_Status` values exist?
- Does `Active` mean visible?
- Does `Draft` mean hidden, or visible only inside `System Files`?
- Does missing `File_Guide_Path` block visibility?
- What happens if `System Files` says active but route/runtime is missing?
- What happens if route/runtime exists but `System Files` says hidden or draft?
- Which files are protected genesis rows?
- Which fields are locked after birth?

## Acceptance Contract First Pass

Status: `approved direction for implementation planning`

This first pass turns the open questions into a strict working policy for later runtime work.

It is still a DOC/NCT contract.

It does not yet make `System Files` the executable source of truth by itself.

### File Status Vocabulary

Use these `File_Status` values:

- `Active`
- `Partial`
- `Draft`
- `Hidden`
- `Archived`

Definitions:

- `Active`
  - The file is accepted for real use.
  - It may appear in main navigation if runtime validation passes.
  - It should have a real guide path unless it is a protected bootstrap exception.
- `Partial`
  - The file is partially born.
  - Some required layer exists, but acceptance is blocked by a known gap.
  - It should stay visible in `System Files`, but not in normal workspace navigation unless it is a protected bootstrap exception.
- `Draft`
  - The file is approved direction or work-in-progress.
  - It should be visible inside `System Files` for governance, but not in normal workspace navigation.
- `Hidden`
  - The file exists, but is intentionally kept out of normal navigation.
  - It remains visible in `System Files`.
- `Archived`
  - The file is retained for history or traceability.
  - It should not appear in normal workspace navigation.

### Visibility Rule

Main workspace navigation should follow this rule:

- `Active` + runtime validation pass = visible
- `Partial` = not visible, except protected bootstrap exceptions
- `Draft` = not visible
- `Hidden` = not visible
- `Archived` = not visible

`System Files` should remain the governance surface where all of these rows are still reviewable.

### Runtime Validation Gate

Before a file becomes visible from `System Files`, these checks should pass:

- canonical entity exists
- registry row exists
- route/runtime registry entry exists
- shell rendering path exists
- runtime ownership exists where required
- `File_Guide_Path` exists, unless the file is a protected bootstrap exception

If any of these fail:

- the app should surface drift
- the file should not be treated as fully born
- `Active` should not be trusted as enough by itself

### Guide Path Rule

For normal visible `L1` files:

- `File_Guide_Path` should be required

If a file has no guide path:

- it may remain in `System Files`
- it should not be treated as fully born
- its safe status should be `Partial` or `Draft`, not `Active`

### Protected Bootstrap Exceptions

The first protected bootstrap exceptions should be:

- `Files` / `System Files`
- `Events`
- `Building_Blocks`

These are special because startup, governance, provenance, or shared UI architecture depends on them early.

Rules for protected bootstrap exceptions:

- they may remain visible before the full acceptance chain is complete
- they should still surface drift honestly
- they should not be used as proof that normal files can skip the acceptance contract

`Owner` and `Companion` are not listed here yet because they are currently being treated as root/manual surfaces, not proven born-file rows.

### Reconciliation Rule

When `structureRegistry` and `System Files` disagree:

- bootstrap/runtime safety wins first
- `System Files` acceptance intent should still be surfaced
- the disagreement should be treated as drift, not silently merged away

That means:

- if `System Files` says `Active` but runtime support is missing, keep the file out of normal navigation and mark drift
- if runtime support exists but `System Files` says `Draft`, `Hidden`, or `Archived`, keep the file out of normal navigation
- if the file is a protected bootstrap exception, allow visibility but surface the acceptance gap

### Fields Locked After Birth

These fields should be treated as birth-locked unless an explicit migration/governance pass changes them:

- `File_Source_Key`
- `File_Canonical_Entity`
- `File_Runtime_Entity`
- `File_Route_Name`
- `File_Path`
- protected genesis/bootstrap status

These fields may remain editable under owner/steward governance:

- `File_Name`
- `File_Summary`
- `File_Status`
- `File_Guide_Path`
- `File_Order`
- `Ownership_Mode`
- `File_Steward`
- `Rulebook_Dependencies`
- `Defined_Structure`
- `Glossary_Terms`

### Working Acceptance Rule

The strict first-pass rule is:

`Code/canon births the file. System Files records govern acceptance. Runtime validation decides visibility.`

This keeps authority ordered:

1. bootstrap safety
2. accepted file-definition intent
3. visible navigation

## Recommended Next Implementation Order

### 1. System Files acceptance policy

Goal:

- define what lets a `Files` row become visible
- decide whether visible `L1`s require `File_Guide_Path`
- decide which registry route-meta exceptions are allowed before `System Files` becomes the source
- keep `structureRegistry` as the executable registry until `System Files` can safely govern acceptance

Why first:

- layout injection is fixed, but acceptance is still route-meta owned

### 2. File guide path policy

Goal:

- decide whether an active visible `L1` must have `File_Guide_Path`
- decide whether missing guide path means `Draft`, `partial`, or hidden from nav
- make Add/Edit File Shell open the selected file guide when available, and parent `001-Files.md` only as fallback

Why third:

- this turns docs into actual UI/runtime guidance without forcing every file guide to be complete immediately

### 3. Provenance birth event pass

Goal:

- write a reconstructable file-birth event when a file registry row is created or accepted
- decide whether `ensureDefaultFiles()` should create genesis events or whether a later genesis reconstruction pass should backfill them
- connect `File_EventLog` to actual event records or define why it remains a text placeholder

Why fourth:

- this is the line between "has fields" and "can explain history"

### 4. Files delete governance pass

Goal:

- decide whether root/system file rows can be deleted
- block delete for protected genesis rows if needed
- make delete behavior visible in the File Steward and Runtime Steward rules

Why fourth:

- the delete bridge exists, but governance for deleting accepted files is not proven

### 5. KDB/LDB bridge proof pass

Goal:

- prove whether Files KDB tokens write through generic `KDB_Relationships`, promoted fields, or both
- define reverse-read expectations for file-to-owner, file-to-steward, file-to-event, and file-to-rulebook relationships

Why fifth:

- relationship truth should follow after file identity, nav acceptance, guide path, and birth provenance are clearer

## Suggested Immediate Next Step

Start with System Files acceptance policy.

Do not make `System Files` the only runtime source yet.

First:

- decide what `File_Status = Active` must mean
- decide whether `File_Guide_Path` is required for visible `L1`s
- decide whether missing guide path keeps a file visible, marks it partial, or hides it
- decide how `structureRegistry` and `System Files` should reconcile when they disagree

If this pass is clean, then move to the file-guide path policy.
