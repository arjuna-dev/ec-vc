# ECS Workstream Tracker

## Purpose

This is the owner's working tracker inside the team system.

Use it to keep a short list of:

- front-loaded work
- active work
- parked follow-ups

This is meant to reduce context loss while we move together between product, schema, and UI tasks.

This tracker should stay aligned with:

- `docs/record-architecture-master-plan.md`
- `docs/intake-architecture-master-plan.md`

## Summary

### Current Focus

- make canonical `L1` bootstrap consolidation the top architecture priority
- run `Building Blocks to Shell Contract Migration` as the active shared-UI architecture project
- keep the underlying structure, ownership, and runtime relationship paths converging cleanly
- use the `Companion` and the first-pass game layer to surface issues without weakening the contract
- keep the shared shell, edit dialog, and KDB relationship behavior aligned to canon
- keep KDB linking, unlinking, and selector labels working through shared shell contracts instead of per-entity fixes
- adopt `Record Shell` as the shared `Record View` direction
- turn the `Contact/User` lesson into a generalized `L1/L2/L3` field-class rule instead of a remembered exception
- keep owner authority locked while still allowing owner-only editing of owner profile data
- finish the setup layer so the first Companion role and first game board can begin on `Ingestion`
- implement highlighted `default/preselected unverified` context cues so artifact assumptions become verification-ready rather than hidden
- put the shared field verification metadata layer in place before the first full ingestion board pass
- group shared history by dialog/edit-session action boundaries instead of logging every tiny intermediate step

### Open Activity

- convert the declared-but-not-yet-backed KDB relationship set into real runtime-backed paths
- keep `Knowledge DB` behavior converging with the normal file-shell contract
- keep record-view and dialog-shell KDB selectors on the same shared option-label and option-loading rules
- normalize `Record Shell` to the current `User Record View` shell and carry it forward as the shared record-view base
- refine the game layer as a guide on top of the structure pass, not as a replacement for it
- document and normalize:
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`

### Top 5 To-Do

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
5. Define the missing runtime owner paths for canon-declared `User_*`, `Artifact_*`, and `Note_*` relationships.

## Front-Loaded

- treat canonical `L1` bootstrap consolidation as the top structural risk and first architecture workflow
- Keep the shared `FilePageShell` as the one shell source while each file route continues to own its own `L1`
- Define the first-pass game layer clearly enough that it guides users and companions without pulling focus away from the current structure pass
- Make the KDB relationship contract explicit in the architecture docs before adding more runtime relationship paths
- Treat declared KDB relationships as real system paths that require owner-path and reverse-read planning
- Finish the remaining `Knowledge DB` runtime pass so `Markets`, `Securities`, and `Ingestion` all behave like normal file surfaces
- Keep the canonical structure aligned with the active workbook and approved UI behavior
- Normalize token names toward their final approved form during the same structure pass
- Keep the canonical JSON structure shape stable enough for direct app ownership
- Split `File/Card` light payloads from `Record View` rich payloads in a deliberate way
- Keep the shared create/edit record dialog moving toward fully canonical field and option ownership
- Define and wire `Ingestion` as a secondary `Knowledge DB` for artifact-processing provenance and created-file lineage
- Resume `Artifact Intake` as an active guided workflow
- Keep the intake tracker visible so drafts can always be resumed
- Stabilize the review loop so verified inputs stay verified and review can be skipped when needed
- Keep document preview, artifact preview, and artifact share paths aligned with the numbered workspace files

## Active

- `RAMP` is now the single architecture source of truth for `File -> Card -> Record View`
- `Intake Architecture Master Plan` is now the single intake planning source of truth
- `Companion Contract` is now the working reference for ingestion-side ownership and relationship discipline
- `Game Rulebook` is now the first-pass reference for points, quests, boards, and the Game Master layer
- Excel workbook + canonical JSON workflow is now in place for schema indexing
- `JSON + app editing` is now the chosen canonical structure direction
- `docs/canonical-structure.json` is now the app-readable canonical structure registry across the current L1/L2/L3 entity set
- canonical structure now also needs to support explicit `L2.a-b-c-d` subgrouping when a subsection requires structured internal grouping without weakening `L3`
- canonical tokens can now carry explicit `db_field_aliases`, so shell rendering can resolve through canonical structure without guessing when live row payload fields still use older DB names
- `Opportunities` is now being formalized as a parent canonical `L1` contract with `Funds` and `Rounds` as subtype branches
- parent `L1`s with subtype branches now use an explicit route-choice step before create/add-record opens the shared dialog
- branch capability should be treated as a normal architecture feature any `L1` may declare through canon
- `Knowledge DBs` is now being treated as a real subset inside `Files` for reusable reference entities such as `Stages`, `Financial Industries`, and `Round Securities`
- `Ingestion` is now an approved secondary `Knowledge DB` direction for tracking original artifact links, processing events, and created-file lineage
- the file pages now render through one shared shell source with thin page wrappers, instead of drifting as copied page implementations
- only the literal `File Shell` lab route should switch `L1` through the shell selector; normal file pages should resolve from their own route-owned `L1`
- shared edit-dialog preload should come from `databooks.view(activeL1Entity, recordId)`, with token values resolved from databook `fields` first and not from summary rows
- owner identity now bootstraps into the `Users` table so the local owner can appear as the first real `User`
- the human spine now includes explicit runtime owner paths:
  - `Owner_DB`
  - `Users_Roles`
- owner authority is now being treated as locked runtime behavior rather than a normal editable role field
- owner profile data should stay editable only by owner
- owner and last-human spine records should now be treated as deletion-protected runtime paths
- the shared create/edit record dialog shell is now in place and re-used for create, edit, and add-relation entry points
- `Record Shell` is now the approved shared direction for `Record View`
- shared `record-view` route now resolves into `RecordShellPage.vue`
- the current shell direction is:
  - use the `User Record View` hero/dashboard as the base shell
  - keep icon-only `settings` and `edit` beside `Name`
  - render selected `L3` rows in the left middle column
  - render `Summary` as the first row in the right middle column
- card shell slots are now explicit for `title`, `subtitle`, and `chips`, with `subtitle` = first selected extra field and `chips` = remaining selected extra fields
- `Knowledge DBs` now behaves as a real left-nav sibling branch under `My Workspace`, and its parent/child rows have been pulled back onto the same styling path as the `Files` navigation family
- Exporters are now being treated as migration / ingestion utilities, not the permanent architecture backbone
- Artifact processing recovery and continuity
- artifact-processing provenance so original artifacts, ingestion rows, and created files remain explicitly linked
- Intake draft resume flow from `Artifacts` cards and `Draft Files`
- Verification dialog behavior and staged review UX
- Visible document preview during staged markdown intake
- Tracker-driven restart point for `Company`, `Opportunity`, and `Contacts` first-pass extraction
- Include `Companion` and `Roles` parameters in the intake control surface so operator behavior can be tuned with the workstream
- the `Companion` should now be understood as a guide helping the user navigate the game and score points in a useful way
- the first `Companion` role and first game/file focus should be `Ingestion`
- `Owner Genesis` should initialize the current approved schema baseline as declared in `src-electron/services/sqlite-schema.js`
- future marketplace-delivered `L1`s should be required to pass the same canonical bootstrap contract as local owner-created `L1`s
- `BB File` is now an approved controlled system-level exception:
  - it should render conceptually before the operational files in `Owner Genesis`
  - it should not be treated as a normal app-data `L1`
  - it should use the approved `General / Usage / Anatomy / Source / Reconstruction / Variants` structure instead of the normal `System / KDB` baseline
- the BB dependency map now matters architecturally because `Building Blocks` are the layer intended to carry backend architecture, runtime ownership, and shell composition through to final UI/UX
- keep the BB system lean while it converges:
  - `Built From BBs` is permanent architecture
  - `Convergence Rule` is temporary migration scaffolding only
  - once a primitive family is fully stabilized, `Convergence Rule` should be cleared, hidden, or removed instead of becoming permanent metadata
- `Owner Genesis` should create the base file system sequentially through `Master Companion`, beginning with `BB File`, then `L1 Files`, then `Events`
- the early bootstrap priority stack should now be treated separately from the broader file set:
  - `User Basics`
  - `Master Companion`
  - `File Steward`
  - `Game Packs`
- `File Steward` should preload before any game pack
- the first game pack inside the game-pack set should be `Investor Game Pack`
- later planned game packs include:
  - `Advisor Game Pack`
  - `Company Game Pack`
- `Events` should continue to be normalized as a first-class file/entity in that same contract system rather than treated as a lightweight side surface
- the game layer should use provisional points, realized points, deductions, bonuses, quests, and board-level stage objectives
- artifact context assumptions should now be treated as `default/preselected unverified`
- ingestion should start from the linked source artifact and should not create a duplicate artifact record at processing start
- the shared `Field_Verification_Metadata` layer is now the approved place to track preselected, suggested, verified, and rejected field states
- the `Game Master` should explain ranking and point changes without overriding verification or ownership
- the field-class direction is now becoming explicit:
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`
- root-established directional links are now recognized as a distinct architecture class for:
  - identity
  - authority
  - provenance
  - parent/root navigation
- the game layer should now be understood as dynamically relevance-based:
  - score what matters most at the current stage
  - do not score all actions as if they were equal
  - use the base-10 scoring family:
    - `1, 2, 3, 4`
    - `10`
    - `100`
    - `1000`
- Unify KDB relationship behavior so cards stay lightweight and record views can get richer grouped relationship payloads
- Rename section labels and token names together so `System` does not coexist indefinitely with stale `*_Metadata` naming
- KDB relationships are now being treated as strict contract paths:
  - declared in canon
  - runtime-backed underneath
  - bidirectionally visible from both linked `L1`s
- the shared fallback owner path for canon-declared KDB links without a special join table is now `KDB_Relationships`
- relationship tokens should no longer be thought of as ordinary writable columns
- shared shell relationship clearing now writes explicit empty relationship payloads instead of silently dropping the delete
- shared explicit KDB join-table contracts now preserve reverse direction correctly instead of reusing the same join-column mapping both ways
- shared shell option labels are now being normalized toward the canonical `General -> *.3.1` title token instead of drifting to `id`
- new `L1` relationships should follow the same owner-path and reverse-read contract instead of being introduced ad hoc
- the currently runtime-backed relationship set is centered on:
  - `Company`
  - `Contact`
  - `Project`
  - `Task`
  - `Fund`
  - `Round`
- the currently declared-but-not-yet-backed set still includes many:
  - `User_*`
  - `Artifact_*`
  - `Note_*`
  relationships
- the `Owner / User / Contact` language should now be repeated consistently across contracts, game docs, and future UI help so users and companions understand that these are related but not interchangeable human-system layers
- `Users_Roles` should now be treated as a real underlying assignment DB, even though it is not yet a standalone file page

## Pending

- Milestone: `New L1 Bootstrap Automation Prep`
  - Step 1: turn the approved `L1` birth sequence into an implementation checklist against the current codebase
  - Step 2: define the canonical input contract for new normal `L1` birth
  - Step 3: define the active `L1` set used for reciprocal KDB generation
  - Step 4: define the default relationship owner-path rule:
    - `KDB_Relationships` by default
    - dedicated join table only when promoted
  - Step 5: build the first strict bootstrap helper from one source
  - Step 6: open a test branch only after the bootstrap contract is fully defined

- Milestone: `Contained Ingestion Foundation Pass`
  - Step 1: align Main Menu labels with loader/runtime naming so the app renders and speaks in the same names the user sees
  - Step 1A: define steward contracts that protect file and design structure from drift:
    - `File Steward`
    - `Design Steward`
  - Step 1B: update the structure docs so branch-capable `L1`s, explicit `L2.a-b-c-d` subgrouping, and first-class `Events` are declared in canon before more runtime normalization
  - Step 2: add standalone `Companion Roles` as a real first-class table
  - Step 3: add the initial required `Companion Roles` columns
  - Step 4: create the first-pass `Companion Roles` records:
    - `Master Companion`
    - `Ingestion Assistant`
    - `Point Tracker`
    - `Quest Builder`
  - Step 5: create the first-pass companion markdown documents, beginning with `ingestion.md`
  - Step 6: rewire ingestion only after the prerequisite names, table, columns, records, and documents are in place
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
  - create the base `Owner Ingestion` project space
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

## Parked For Later

- Improve page-mapped markdown and Artifact audit trail
- Standardize selected-state actions across all landing pages
- Finish conforming grid cards and table views across all sections

## Notes

- As of April 2, 2026, the planning layer has been consolidated into two master docs:
  - `record-architecture-master-plan.md`
  - `intake-architecture-master-plan.md`
- the active workbook schema reference for first-pass record architecture is:
  - `docs/B10_DOS v260400 vrev.xlsx`
- recent intake recovery work already completed:
  - legacy workspace path normalization for preview/share/autofill
  - document preview cards restored in the intake flow
  - verification dialog can skip and expand verified info
  - unfinished artifacts now expose direct resume affordances
- recent file-card normalization work already completed:
  - summary panel structure normalized
  - `Add Relation` moved into the lower dynamic box
  - card loop alias drift reduced by standardizing toward `row`
  - card shell now uses explicit `title`, `subtitle`, and `chips` slots instead of the older shared-shell `metadata` wording
- as of April 3, 2026:
  - route-level `Databook` navigation has been renamed to `Record View`
  - page-level record navigation now runs through one shared helper instead of per-page route objects
  - `docs/canonical-structure.json` now carries the active app-readable L1/L2/L3 structure registry
  - canonical `General` now standardizes `Name` at `*.3.1` and `Summary` at `*.3.2`
  - shared edit dialog ordering now treats `Name` as the first field in the left grid and `Summary` as the first field in the right grid
  - canonical structure now carries explicit DB-field aliases where live row payloads still use older field names such as `Name`, `Company_Name`, or `title`
  - `Opportunities` now exists as a canonical parent structure with shared `System`, `KDB`, `General`, and `Overview`
  - `Funds` and `Rounds` remain subtype-owned where `Economics` and `Controls` diverge structurally
  - `File View` shell work exposed a remaining divergence: runtime create/manage support for new `Knowledge DB` files still needs real source wiring behind the now-prepared shared shell
- as of April 4, 2026:
- `Knowledge DBs` is now a dedicated left-nav branch below `Files`
- `Markets`, `Securities`, and `Ingestion` now sit on their own page routes while still rendering through the one shared file shell source
- `Roles` now has its own dedicated DB direction instead of relying on the old assistant prompt table as the conceptual source of truth
- the standard DB baseline is now explicit for new DB-backed file surfaces:
  - sqlite table
  - preload/main bridge
  - `System`, `KDB`, `General`
  - `Name`, `Summary`
  - owner identity now bootstraps into `Users`, and an `Owner` role record is ensured during that flow
  - the shared create/edit dialog now renders canonical date fields as date inputs
  - stale resolved bug notes were cleaned out of `bugs/`, leaving only the current `Knowledge DBs` nav follow-up notes
- as of April 5, 2026:
  - the architecture docs now make the KDB relationship rule explicit
  - declared KDB relationships are now formally understood as requiring:
    - owner path
    - reverse-read path
    - bidirectional appearance
- shared shell update paths now normalize to approved databook table names before IPC writes
- shared shell writes now keep session context in `actionLabel` without reusing one shell-session `actionId` across repeated writes
- reverse explicit KDB join-table contracts now swap join columns correctly when the shell links from the opposite side
- shared relationship write builders now treat clearing the last linked value as a real delete instead of "no change"
- record-shell panel selects now normalize tokens the same way the shared dialog does, so live option lists load in the panel too
- record-shell live entity selectors now resolve labels from the canonical title token in the `General` section instead of drifting to system ids
- the current runtime-backed set has been separated from the canon-declared-but-still-missing set so future relationship work can stay strict instead of drifting into one-offs
- the companion-side rule is now explicit:
  - helpful about content
  - strict about structure
  - honest about missing ownership
- the game layer is now documented as a first draft:
  - Companion guides
  - Game Master explains
  - points and quests motivate
  - structure and verification still govern
- current shared goal:
  - get the intake tracker and processing window reliable enough that a user never loses their place
  - keep the structure contract coherent while `Company` remains the main reference entity
  - normalize token names to their final approved form while the structure pass is still active
  - keep `JSON as source of truth with app editing` aligned to workbook validation and approved UI behavior
- current architecture rule:
  - canonical structure now lives in JSON
  - workbook helps validate and refine that structure
  - keep `File/Card` views lightweight
  - make `Record View` richer and workbook-aligned
- schema alignment work is still important, but intake continuity, JSON structure ownership, and structure-contract cleanup are the active operational threads
- as of April 6, 2026:
  - shared record-shell presentation naming is being normalized away from leftover `contact-databook` class language so the shell reads as a generic `Record Shell` surface instead of a contact-specific carryover
  - shared add/edit entry actions are being normalized so route-owned `L1` pages launch the shared add/edit shell instead of sending widget shortcuts through the old `test-shell` path, while true create forks still stop for user choice first
  - `test-shell` section swapping is being pulled up into `TestShellPage` so the shared `FilePageShell` stops treating route/query swapping as normal ownership behavior
  - the kept `Add Relation` path is now the simple route-owned version:
    - card-view `Add Relation` goes to `dialog-shell`
    - `section` carries the source `L1`
    - `edit` carries the clicked record id
    - `entity` carries the canonical entity name
    - `editSection=kdb` opens the shared add/edit shell directly in `KDB`
  - create forks are now being normalized to the structure registry instead of being hardcoded per surface:
    - if an `L1` declares create branches, the create entry path should stop for that branch first
    - `Fork Shell` should own the branch-choice step as a route-owned shared surface
    - `Fork Shell` should remain independent from `Opportunities` page UI even when `Opportunities` supplies the branch metadata
    - `Record Shell` and `File Shell` create actions should hand branchable creates off to `Fork Shell`
    - `Fork Shell` should continue into `Add/Edit Record Shell` with the selected branch already loaded
    - closing `Fork Shell` should keep the blank fork shell route mounted, matching the blank route behavior of `Add/Edit Record Shell`
    - file-shell and dialog-shell create submit paths should resolve branch targets from the registry instead of special-casing `Opportunities`
  - a separate `Ingestion Shell` is now being scaffolded from the current `Add/Edit Record Shell` contract so artifact-processing review can become its own shared shell instead of staying trapped inside the add/edit dialog lane
  - intermediate pending-state launch experiments were intentionally discarded so the current contract stays route-driven and easier to reason about

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
- canonical entity names such as `Financial_Industries`
- databook table names such as `Companies` and `Industries`

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
