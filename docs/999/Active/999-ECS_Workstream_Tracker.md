# ECS Workstream Tracker

## Purpose

This is the owner's working tracker inside the team system.

Use it to keep a short list of:

- front-loaded work
- active work
- parked follow-ups

This is meant to reduce context loss while we move together between product, schema, and UI tasks.

This tracker should stay aligned with:

- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/010/Draft/010-intake-architecture-plan.md`

## Current Focus

- make canonical `L1` bootstrap consolidation the top architecture priority
- run `Building Blocks to Shell Contract Migration` as the active shared-UI architecture project
- keep the underlying structure, ownership, and runtime relationship paths converging cleanly
- use the `Companion` and the first-pass game layer to surface issues without weakening the contract
- keep the shared shell, edit dialog, and KDB relationship behavior aligned to canon
- keep KDB linking, unlinking, and selector labels working through shared shell contracts instead of per-entity fixes
- start applying birth-governance derivation in the shared create flow, beginning with the simplest visible defaults
- document and begin the naming direction from `KDB` toward `LDB` while avoiding piecemeal runtime renames
- keep pushing bootstrap/setup flows to follow the same `System Files` + `LDB` contract path as normal runtime behavior so bugs surface earlier and more honestly
- adopt `Record Shell` as the shared `Record View` direction
- turn the `Contact/User` lesson into a generalized `L1/L2/L3` field-class rule instead of a remembered exception
- keep owner authority locked while still allowing owner-only editing of owner profile data
- finish the setup layer so the first Companion role and first game board can begin on `Intake`
- implement highlighted `default/preselected unverified` context cues so artifact assumptions become verification-ready rather than hidden
- put the shared field verification metadata layer in place before the first full intake board pass
- group shared history by dialog/edit-session action boundaries instead of logging every tiny intermediate step
- keep the shared `File Shell` contract fail-closed and remove heuristic fallback behavior from shared file/page surfaces
- audit legacy runtime language before adding more shared governance/provenance behavior on top of it

## Top 5 To-Do

1. Consolidate new `L1` bootstrap into one canonical contract with strict validation, and prove it through `Companion Roles`.
2. Finish `Building Blocks to Shell Contract Migration`:
   - foundational tokens
   - shared component extraction
   - shell placeholder migration
   - end-to-end rendering validation
3. Convert the declared-but-not-yet-backed KDB set into real runtime-backed relationship paths.
4. Define the first generalized field-class layer for `L3` tokens:
   - `owned_field`
   - `directional_link`
   - `kdb_relationship`
   - then extend that layer with governable field-definition metadata:
     - field type
     - always-required vs conditional-required
     - multiple requirement conditions on the same field
5. Define the missing runtime owner paths for canon-declared `User_*`, `Artifact_*`, and `Note_*` relationships.

## Active Workstreams

- canonical `L1` bootstrap consolidation and strict validation
- `Building Blocks to Shell Contract Migration`
- runtime-backed completion of the declared KDB relationship set
- field-class normalization:
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`
  - future `L3` governance metadata:
    - field type
    - always-required vs conditional-required
    - multi-condition requirement support
- provenance/history naming and contract cleanup:
  - keep canonical/runtime continuity where needed
  - move user-facing meaning toward `History`
  - preserve separate `actor`, `source`, and `action` fields in the audit model
- intake continuity:
  - draft resume
  - staged review
  - visible tracker state
- `LDB` convergence with the normal file-shell contract
- strict file-shell contract hardening:
  - fail closed on unmapped page routes
  - honest non-validator file-health state
  - remove heuristic title/summary and option-label fallback paths
- shared create-flow hardening:
  - discardable local draft birth
  - commit text inputs on blur, flush on save
  - remove ghost draft rows
  - keep branch choice and required birth data honest in the shell
- shared dialog and file-shell convergence:
  - unify dialog section framing for `Resources` and `Record Data`
  - move dialog section titles onto one shared title treatment
  - add shared dialog undo controls
  - align `Add/Edit File Shell` middle-row language to the `Record View` pattern
  - normalize strict row/data surfaces across canonical shells:
    - start rows with blank-header `Select` and `Eye` control columns when applicable
    - keep those two columns hugging content
    - treat the select box as row action control for `Share` / `Delete`, not as edit mode
- steward event-scope filtering:
  - define steward-level history/event filters by `File` / `Record` / join-table scope
  - define steward-level action filters such as `created`, `edited`, `verified`, `suggested`, and `pre-selected`
  - start with `Design Steward` review of `BB` component `created` / `edited` events
- intake extraction orchestration:
  - `Intake Steward` should orchestrate relevant `File Stewards`
  - extraction should ask whether an artifact answers any declared `L1` / `L3` directive
  - parcel first-pass answers into the strongest matching file/token path
  - avoid repeating the same information across multiple sections when one higher-confidence destination already exists
  - use page-title length as a light interpretation hint:
    - `<= 30ch` more likely section/subsection
    - `> 30ch` more likely summary/highlight guidance
- birth-governance derivation:
  - document derivation rules
  - seed first registry-owned birth defaults into shared create
- legacy runtime audit:
  - classify `databooks:*` and other older IPC/runtime names as `keep temporarily`, `rename soon`, or `replace structurally`
  - avoid widening old runtime language while the newer governance and event model is still being defined
- owner spine protection and explicit human-system owner paths
- `Owner Genesis` ordering, including:
  - `System Files`
  - rule books
  - `BB File`
  - owner identity pass
  - companion install pass
- game layer guidance staying above the contract layer instead of replacing it

## Pending Next

- Milestone: `New L1 Bootstrap Automation Prep`
  - Step 1: turn the approved `L1` birth sequence into an implementation checklist against the current codebase
  - Step 2: define the canonical input contract for new normal `L1` birth
  - Step 3: define the active `L1` set used for reciprocal KDB generation
  - Step 4: define the default relationship owner-path rule:
    - `KDB_Relationships` by default
    - dedicated join table only when promoted
  - Step 5: build the first strict bootstrap helper from one source
  - Step 6: open a test branch only after the bootstrap contract is fully defined

- Milestone: `Contained Intake Foundation Pass`
  - Step 1: align Main Menu labels with loader/runtime naming so the app renders and speaks in the same names the user sees
  - Step 1A: define steward contracts that protect file and design structure from drift:
    - `File Steward`
    - `Design Steward`
  - Step 1B: update the structure docs so branch-capable `L1`s, explicit `L2.a-b-c-d` subgrouping, and first-class `Events` are declared in canon before more runtime normalization
  - Step 2: add standalone `Companion Roles` as a real first-class table
  - Step 3: add the initial required `Companion Roles` columns
  - Step 4: create the first-pass `Companion Roles` records:
    - `Master Companion`
    - `Intake Steward`
    - `Point Tracker`
    - `Quest Builder`
  - Step 5: create the first-pass companion markdown documents, beginning with `intake.md`
  - Step 6: rewire intake only after the prerequisite names, table, columns, records, and documents are in place
  - Working rule: keep this pass in small contained cycles and avoid bundling the whole migration into one long implementation loop

- Project: `Building Blocks to Shell Contract Migration`
  - Task 1: finish mapping foundational building blocks:
    - fonts
    - type scale
    - font weights
    - colors
    - surfaces
    - borders
    - radius
    - shadows
    - spacing
    - icon sizing
    - number/date formatting
    - motion rules
  - Task 2: finish missing shell-level and placeholder block coverage:
    - `Record Dashboard`
    - remaining file / record / shell placeholders not yet represented in `BB Shell`
  - Task 3: extract the remaining local samples into real shared components:
    - page title / crumb
    - page back symbol
    - plus icon
    - plus with label
    - main menu row
    - main menu subgroup row
    - `BB Tile Header`
    - `L2 Settings Menu`
    - `Widget Settings Menu`
  - Task 4: separate design-token ownership from component ownership so `General Settings` becomes the source of truth for foundational visual rules
  - Task 5: migrate shell placeholders onto explicit building block and shell payload contracts
  - Task 6: validate that shared component changes render through:
    - `BB Shell`
    - route-owned shell surfaces
    - live app pages
  - Task 7: finish `bb:mini-toolbar` strictly through the BB/component layer:
    - do not let page-local shell logic invent toolbar behavior
    - keep `Views` and `Tokens` payloads explicit
    - remove old directive paths that still treat `L2` grouping language as visible control truth
  - Success condition: changing one shared component or design token updates every consuming surface automatically
  - Structural rule: keep populating `Built From BBs` so the BB catalog can classify:
    - `Leaf / Elementary`
    - `Parent`
    - `Root / Top-Level`
    - `Child`
  - Architectural reason: this turns the BB catalog into the bridge from backend structure to shell assembly to UI/UX

- Implement the runtime `Owner Genesis` bootstrap sequence end to end:
  - assign the base `Companion`
  - create the base `Owner Opportunities` project space
  - create the base `Owner Intake` project space
  - create the base `User Roles` set
  - create the base `Companion Roles` set
  - create `Master Companion Role` as the first base `Companion Role`
  - create the `User Set-up` project and its default tasks
  - allow task completion to be skipped without skipping record/project/task creation
- Define the first runtime-backed `BB File` contract and decide whether it stays documentation-backed first or becomes a true file source next
- turn the first-pass game rulebook into a clearer scoring reference per board and per stage
- define how provisional points, realized points, deductions, and bonuses should map to actual workflows
- define how pipeline boards should express required information and expected outcome per stage
- define the first relevance maps for major boards so points can reflect what matters most at each stage
- decide which directional links should be visible as explicit field-class context in field surfaces
- Fix workbook wrapper-token drift so the JSON companion validates cleanly for `Company`, `Funds`, `Markets`, and `Terms`
- Convert the declared-but-not-yet-backed KDB set into real runtime-backed relationship paths
- Define the missing runtime owner paths for canon-declared `User_*`, `Artifact_*`, and `Note_*` relationships
- Add reverse-read behavior for every newly-backed KDB relationship so both linked `L1`s reflect the same connection
- Rework `Record View` table behavior so tabs switch locally and instantly
- Align company `Record View` tabs with workbook structural nodes
- Decide which workbook labels stay technical and which get friendlier UI labels
- Build a clearer intake tracker surface that shows stage, blockers, and next action per draft
- Add a consistent resume affordance in both card and table views for unfinished artifacts
- Define role ownership for intake stages under the new `Roles` / `Companion` direction
- Decide which `Companion` and `Role` parameters belong in the tracker versus inside dedicated `Companion` / `Roles` views
- Finish removing remaining internal `Databook` bridge and class naming in the shared record layer
- Replace remaining heuristic record section mapping with workbook-backed ownership
- decide the next migration step after the legacy runtime audit:
  - stabilize and rename
  - deepen carefully
  - or replace structurally

## Parked

- Improve page-mapped markdown and Artifact audit trail
- Standardize selected-state actions across all landing pages
- Finish conforming grid cards and table views across all sections

## Recent Decisions

- the planning layer is now centered on:
  - `010-record-architecture-master-plan.md`
  - `010-intake-architecture-plan.md`
- canonical structure now lives in JSON, with workbook as validation/reference
- the shared record direction is now `Record Shell`
- KDB relationships are now treated as strict contract paths:
  - declared in canon
  - runtime-backed underneath
  - bidirectionally visible
- `Knowledge DBs` now behaves as a dedicated file branch and `Intake` remains reconnect-safe inside that same contract family
- owner identity now bootstraps into `Users`, with explicit runtime owner paths through:
  - `Owner_DB`
  - `Users_Roles`
- the shared verification metadata layer is now the approved location for preselected, suggested, verified, and rejected field states
- create forks are now expected to route through registry-driven branch choice instead of page-specific hardcoding
- file visibility, file acceptance, and file creation should keep converging on one registry-driven rule
- shared create flow now starts from `General` again instead of a growing ad hoc required-token layer
- dialog section framing and section-title treatment now converge through the shared section-shell path instead of separate `Resources` and `Record Data` header systems
- dialog shells now support shared undo through both visible undo controls and `Ctrl+Z` / `Cmd+Z` outside active text inputs
- `Add/Edit File Shell` middle-row language now converges toward the `Record View` pattern:
  - `Summary`
  - `Relevant Items`
  - `General`
- strict shared row/data surfaces should converge on the same leading-control rule:
  - blank-header selection box column
  - blank-header eye/action column
  - selection used for row actions such as `Share` and `Delete`, not for entering edit mode
- file birth now derives a default `File_Source_Key` from `File_Name` when no explicit source key is provided at save time, while still rejecting duplicate active file names and duplicate source keys
- first birth-governance derivation step is underway through registry-owned birth defaults in the shared create flow
- legacy runtime wording such as `databooks:*` is now treated as an explicit audit target rather than safe language to keep extending blindly
- approved successor direction for the shared legacy runtime path is now:
  - `databooks:*` -> `records:*`
  - `databook_snapshots` -> `record_history`
- `Access_Assignments` is approved as a future standalone `L1` that should sit immediately after `Projects` in the file creation sequence, because it depends on `Contacts`, `Users`, `Roles`, and `Projects`
- `Intake` is now the approved file/page/runtime name replacing `Ingestion` / `Artifact Processed`, with route redirects kept only as temporary compatibility
- `Markets` / `Securities` event tokens and broader token families now converge on `Market_*` / `Security_*`
- the parent `File Shell` contract now fails closed on unmapped routes instead of silently rendering `Tasks`
- shared file/page surfaces now expose missing canonical title/summary ownership instead of guessing from local row fields
- note for future checklist passes: when a wrapper is hardened, immediately audit the child shared shell for inherited fallback defaults, because wrapper hardening alone can leave a second quiet drift path behind
- stewardship correction:
  - each steward should review only the scoped history/event stream tied to its mandate
  - `Design Steward` should begin with `BB` component and shared shell `created` / `edited` events
  - this is meant to reveal drift earlier, not to create a second vague monitoring layer

## Update Rule

When we make a meaningful change, do one of:

- move an item from `Active` to `Pending`
- move an item from `Pending` to `Front-Loaded`
- add a short note if a workstream is intentionally parked or intentionally reactivated
## Shared Naming Correction

Resolved architecture correction:

- shared shell update paths must normalize to databook table names before IPC actions

The issue surfaced because several naming layers were being conflated:

- route keys such as `companies`
- canonical entity names such as `Markets`
- databook table names such as `Companies` and `Markets`

The approved rule is now:

- route keys are for navigation
- canonical entity names are for structure
- databook table names are for IPC/database actions

Shared shell code must normalize to databook table names before:

- `databooks:view`
- `databooks:update`
- `verification:list`
- `verification:upsert`

Additional shared-shell correction:

- surfaced labels must normalize deprecated wording into current product language through one shared label layer

Current approved examples:

- `BEmail` -> `Business Email`
- `PEmail` -> `Personal Email`
- `Financial Industry` / `Financial Industries` -> `Markets`
- `Round Security` / `Round Securities` -> `Securities`
- `Ingestion` / `Artifact Processed` -> `Intake`

## Shared Audit Correction

Resolved shared-shell correction:

- shared shell write paths must not reuse one shell-session `actionId` across repeated databook or verification writes

Why this matters:

- the `events` log is append-only
- a reused shell-session write id can collide with an existing audit event for the same target field

Approved rule:

- keep shared shell context in `actionLabel`
- let each write create its own audit event id
- apply this as a shell/action-layer rule, not as an `L1` or record-specific fix

## Shared KDB Direction Correction

Resolved shared-shell correction:

- explicit join-table KDB contracts must swap join columns when the shell is linking from the reverse side of the relationship

Why this matters:

- directional SQL join tables do not use the same foreign-key column ownership in both directions
- reusing the same `from_id -> to_id` mapping in both directions can send a valid source record id into the wrong foreign-key column and trigger a foreign-key failure

## Shared Record Feed Correction

Resolved shared-shell correction:

- relationship add/remove audit events must log against the source record table, not the relationship join table

Why this matters:

- the Record View feed queries events by the active record table plus record id
- if a relationship event is written under the join table name, the relationship really changes but the record feed cannot see the add/delete event

## Shared Event Payload Direction

Resolved shared-system improvement:

- audit events now have a dedicated `payload_json` context field for event-time labels and display context

Why this matters:

- feeds and event pages should not have to reconstruct all human-readable meaning at render time
- actor label, source record label, field label, and relationship labels are more stable when captured at the moment of the event

Architectural note:

- the event log is a strong `L0` candidate because the earliest meaningful operational event can be things like `Owner created`, with later state and verification history building on top of that layer
- `L0` should be understood as provenance/history, not as another editable business-content layer
- conceptually this fits best with the second-tier / knowledge-system side of the product, because it explains how a record came into being and changed over time
- `L0 Events` now also has a route-owned `File View` through the shared `L1` shell so the event layer can be browsed like the other shell sources instead of living only as an embedded feed
