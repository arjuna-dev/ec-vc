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

- keep the underlying structure, ownership, and runtime relationship paths converging cleanly
- use the `Companion` and the first-pass game layer to surface issues without weakening the contract
- keep the shared shell, edit dialog, and KDB relationship behavior aligned to canon
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
- normalize `Record Shell` to the current `User Record View` shell and carry it forward as the shared record-view base
- refine the game layer as a guide on top of the structure pass, not as a replacement for it
- document and normalize:
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`

### Top 5 To-Do

1. Convert the declared-but-not-yet-backed KDB set into real runtime-backed relationship paths.
2. Define the first generalized field-class layer for `L3` tokens:
   - `owned_field`
   - `directional_link`
   - `kdb_relationship`
3. Define the missing runtime owner paths for canon-declared `User_*`, `Artifact_*`, and `Note_*` relationships.
4. Add reverse-read behavior for every newly-backed KDB relationship so both linked `L1`s reflect the same connection.
5. Define the first relevance maps for major boards so points can reflect what matters most at each stage.

## Front-Loaded

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
- canonical tokens can now carry explicit `db_field_aliases`, so shell rendering can resolve through canonical structure without guessing when live row payload fields still use older DB names
- `Opportunities` is now being formalized as a parent canonical `L1` contract with `Funds` and `Rounds` as subtype branches
- parent `L1`s with subtype branches now use an explicit route-choice step before create/add-record opens the shared dialog
- `Knowledge DBs` is now being treated as a real subset inside `Files` for reusable reference entities such as `Stages`, `Financial Industries`, and `Round Securities`
- `Ingestion` is now an approved secondary `Knowledge DB` direction for tracking original artifact links, processing events, and created-file lineage
- the file pages now render through one shared shell source with thin page wrappers, instead of drifting as copied page implementations
- only the literal `Live Shell` route should switch `L1` through the shell selector; normal file pages should resolve from their own route-owned `L1`
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
