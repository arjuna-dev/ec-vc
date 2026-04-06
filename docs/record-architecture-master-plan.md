# Record Architecture Master Plan

## Status

This document is now the primary working reference for:

- overall objective
- governing rules
- architecture direction
- execution plan
- progress tracking
- the current normalized `File -> Card -> Record View` system framing

This document should be treated as the single planning source of truth for the `File -> Card -> Record View` architecture.

Companion behavior and ingestion-side structural discipline should also stay aligned with:

- `docs/companion-contract.md`
- `docs/game-rulebook.md`
- `docs/game-master-contract.md`
- `docs/ECS_Workstream_Tracker.md`

When decisions change:

- update this file
- do not create parallel architecture docs unless there is a strong reason
- use the progress tracker here to reflect what is approved, in progress, and complete

For the current first-pass architecture work, the active workbook schema reference is:

- `docs/B10_DOS v260400 vrev.xlsx`
- `docs/workbook-schema-companion.json`
- `docs/canonical-structure.json`

That workbook should be treated as the active structural reference used to validate and refine the first approved architecture pass.

The JSON companion should be treated as a workbook-derived reference layer, not the app-owned canonical registry.

During this phase, the intended direction is:

- `Workbook` helps define and validate the structure
- `docs/canonical-structure.json` is the canonical machine-readable structure layer used by the app
- the app should edit that canonical JSON structure directly
- exporters and importers should remain available as adapters for migration and outside data sources

## Objective

Make the app function cohesively from `File` to `Card` to `Record View`.

That means:

- every workbook-backed entity should follow one clear structure
- file views should stay lightweight and fast
- record views should be richer and more correct
- KDB should behave consistently
- addresses, sections, payloads, and UI should all refer to the same underlying structure

The goal is not just visual consistency.

The goal is operational consistency:

- the same entity should mean the same thing in workbook structure
- the same entity should expose the same section logic in payloads
- the same entity should render predictably in file view and record view

## Record Shell Direction

`Record Shell` is now the approved shared direction for `Record View`.

Working rule:

- do not keep separate record-detail page implementations drifting by entity
- converge on one shared `Record Shell`
- route-level record navigation should ultimately resolve into that shell for the selected record
- the shell should use the selected record as payload input, not as a reason to fork the view layer

Current runtime status:

- shared `record-view` route resolution now points at `RecordShellPage.vue`
- opening a record from an `L1` now lands in the shell route for that selected record
- the shell now loads the selected record through `databooks.view(tableName, recordId)`
- the standalone `record-shell` route remains available as the shell payload-testing surface
- the old `RecordPage.vue` surface has now been removed

The currently approved shell pattern is:

- use the current `User Record View` hero/dashboard as the base shell
- do not approximate that pattern once the real shell already exists
- only change explicitly approved shell controls and payload-fed content

The currently approved middle hero contract is:

- `Name` is the top anchor row
- icon-only `settings` and `add record` controls sit beside `Name`
- below `Name`, selected `L3` rows begin in the left column
- `Summary` is the first row in the right column
- each selected `L3` row renders as:
  - top row: label + `L2` description
  - bottom row: current value + status icon

Shared selection rule:

- the selected middle-field set belongs to the shared shell contract
- `File Shell` card settings and `Record Shell` hero settings should read the same per-`L1` field-selection state
- changing the selected middle fields in one shell should be reflected in the other
- do not maintain separate card-only and record-only field-selection memories

Working interaction rule:

- `Record View` should move toward live editing inside the shell itself
- the old dedicated edit button is not the long-term interaction model
- the plus action is for creating another record

## Game Layer Constraint

The game layer is now an approved top-layer direction.

It should help:

- users
- companions
- future bots

focus on the right objectives through:

- points
- quests
- rankings
- stage boards
- Game Master guidance

But it must remain constrained by the underlying architecture.

That means:

- game logic must not replace ownership logic
- ranking must not replace verification
- quests must not pretend an incomplete runtime path is structurally complete
- stage progress must not hide missing owner paths or reverse-read gaps

Working rule:

- the game layer may surface issues
- the architecture layer must still fix them

## Task / Goal Framing

This initial architecture pass is meant to define the first clean, stable structure for the system.

For this phase:

- the `Workbook` is the first-pass validation and design reference
- the app uses canonical JSON to establish order, ownership, and consistency
- the UI should align to that structure while we standardize the system

But the intended product architecture after this first pass is:

- `JSON` as the app-readable structure source of truth
- app editing against that `JSON` structure
- exporter/importer tools for migration, intake, and outside sources such as Excel

This does **not** mean the workbook must permanently lead every future design decision.

The intended long-term understanding is:

- `workbook-first` for initial standardization
- `UI-informed workbook evolution` later

In other words:

- right now, the workbook helps us create the first approved architecture
- later, once the product model is mature, the UI may become the stronger design reference
- at that point, workbook layouts can be refined to follow the approved UI model

So the current goal is not to freeze the workbook forever.

The current goal is to keep canonical JSON, workbook validation, and UI behavior aligned during the first cohesive system pass.

## Governing Model

The current structural authority is:

`Canonical JSON -> DB Tables -> Payload -> UI`

More clearly:

- the `Canonical JSON` defines app-owned intended structure
- the `DB Tables` should stay aligned to that structure
- the `Workbook` and companion remain validation and reference surfaces
- the `Payload` is built from the DB
- the `UI` renders the payload

This is not a purely one-way system, because the workbook files are themselves mirrored from the DB.

So the practical meaning is:

- `Canonical JSON` is the canonical structure reference
- `DB` is the runtime source
- `Payloads` must reflect canonical structure
- `UI` should not invent structure on the fly

When live row payload fields still use older DB column names, canonical tokens should carry explicit DB aliases rather than forcing the UI to guess.

Working rule:

- the shell should resolve a field through canonical address and canonical token first
- if the live payload field name differs, that token should declare `db_field_aliases`
- the UI may read those aliases, but it should not infer them heuristically
- companion systems should follow the same ownership rule and should not invent field meaning outside canon

Universal shell rule:

- this is not an `id`-only exception
- alias declaration belongs to the `L3` token contract for any token whose runtime payload name differs from its canonical token name
- the same rule must hold across `File Shell` and `Record Shell`
- do not solve these gaps with page-level or record-level one-offs
- if a token needs runtime mapping, declare it in canon and workbook companion so every shell reads the same contract

Shared dialog shell rule:

- the shared create / edit dialog is only a true shell if every launching surface passes the same canonical payload contract
- `File Shell`, `Record Shell`, and any future shared shell surface must not pre-interpret grouped `L2` structure differently before opening the dialog
- if one surface sends grouped subsection payloads and another sends flat section payloads, that is shell drift, not an acceptable variation
- page-level payload shaping for the shared dialog should be treated as architectural debt unless it is identical across shell surfaces
- do not solve drift page by page
- if the same behavior appears in more than one address, stop and move upward to the shared shell layer
- entity-specific `*CreateDialog.vue` components are no longer an approved architecture path
- shared add/edit behavior should now converge only through the approved `Add/Edit Shell`

Branch selector rule:

- if a create flow contains a selector whose job is to choose a subtype path, treat it as structural shell control
- do not treat that selector as a normal saved field
- do not render subtype-owned sections until the branch selector has a settled value
- once selected, the branch selector should determine:
  - which subtype payload is shown
  - which create bridge is used
  - which write contract applies

Current approved example:

- `Opportunity_Kind` is the branch selector for the `Opportunities` create flow
- it exists to choose `Fund` or `Round`
- that choice should happen before overview and subtype-owned sections appear
- if the shell later tries to write `Opportunity_Kind` into `Funds` or `Rounds` as if it were a normal field, that is a contract bug

Correct evidence statement:

- the observed evidence was that the shared edit dialog behaved differently depending on which `L1` source launched it
- that observation should be kept separate from any later hypothesis about which shell path caused the drift
- architectural conclusions should only be stated as fact after the payload path is actually traced

Payload builder relevance:

- a shared payload builder matters because canonical `L1-L2-L3` structure alone does not automatically guarantee one shell-ready render shape
- the builder is the last-mile translation from canon into the exact shell payload
- long-term, that improves:
  - consistency
  - speed of change
  - lower break risk
  - cleaner action handling at scale
- it also gives the app:
  - less drift as more `L1`s and actions are added
  - better performance discipline by centralizing transformation
  - safer action systems through shared addresses and write targets
  - easier debugging
  - faster future feature work
  - more trustworthy database-facing behavior

Shell styling rule:

- shell styling must stay fixed at shell level
- do not map `L1` to shell theme changes
- do not map `L1` to avatar color changes
- `L1` may change:
  - payload
  - labels
  - section/token membership
  - declared capabilities, when explicitly approved
- `L1` should not silently restyle the shell

## KDB Relationship Contract

KDB relationships must now be treated as real system paths, not as optional UI affordances.

If a KDB relationship token is declared in canonical structure, the system should assume that relationship is intended to be real and operational.

That means every declared KDB relationship must eventually have:

- one real owner path
- one reverse-read path
- bidirectional appearance from both linked `L1`s
- one shared relationship contract across `Page View`, `Card View`, and `Record View`

Working rule:

- the shell must not guess or simulate relationship behavior
- relationship tokens should not be written like normal columns
- if a relationship owner path is missing, that is a contract gap, not a shell-rendering problem
- reverse appearance is part of the contract, not a later enhancement
- context-aware artifact assumptions may be surfaced as `default/preselected unverified`
- those assumptions should be clearly marked as verification-ready, not silently treated as true links
- when the artifact is added from the `Artifacts` file itself, no extra parent-page context should be inferred
- ingestion should begin from the linked source artifact and should not create a second artifact record until a downstream output document is created

## Field Verification Metadata

The app now has one shared field-level verification metadata layer.

Its purpose is to track field state without duplicating the field itself.

The value stays in the real record field.

The status of that value lives in shared metadata such as:

- `table_name`
- `record_id`
- `field_name`
- `state`
- `source`
- `confidence`
- `verified_by`
- `verified_at`

Working rule:

- do not create shadow tables per field
- do not duplicate the record value just to track review state
- store the value once
- store the verification/preselection state separately in the shared metadata layer
- store shared history in `events`
- group meaningful edit boundaries with one shared `action_id`

### Mandatory Relationship Standard

For the current architecture pass, KDB relationships should be understood in three states:

1. `Declared`
- the relationship exists in canonical structure

2. `Runtime-backed`
- the relationship has a real owner path underneath it, such as a join table or owned subset path

3. `Bidirectionally rendered`
- both linked `L1`s can read that same relationship back through their KDB surfaces

The intended steady state is:

`Declared -> Runtime-backed -> Bidirectionally rendered`

No relationship should be treated as complete until all three are true.

### New L1 Rule

When a new `L1` is created, its KDB relationship contract should be created with it.

That means:

- the new `L1` should not declare relationship tokens casually
- each declared relationship should have an approved owner path
- each declared relationship should have an approved reverse-read path
- new connections should follow the same relationship contract as existing ones
- do not create one-off relationship behavior for a single page, dialog, or record surface

### Current Mandatory KDB Set

The currently approved KDB direction is:

- every first-level working `L1` should be able to relate through KDB to the other first-level working `L1`s where that connection is canonically declared
- those relationships should be visible from either side once they are truly backed

Current parent-shell exception:

- `Opportunities` is still the parent shell concept over `Funds` and `Rounds`
- until it has a true runtime-backed record table/view contract, it should not be treated as a direct live KDB target
- use `Funds` and `Rounds` as the concrete opportunity-side KDB targets for now

KDB display grouping rule:

- KDB should now support two display families inside the shared shell:
  - `First-Order`
  - `Knowledge DB`
- these are grouping contracts for browsing clarity
- they do not replace the underlying token declarations

Basic `L1` structure rule:

- every `L1` should at minimum expose:
  - `System`
  - `KDB`

## Owner Spine Rule

The `Owner` spine should now be treated as a protected root path.

That means:

- owner authority is not a normal editable field
- the node owner should change only through an explicit ownership-transfer flow
- owner profile data may be edited, but only by the owner
- owner-rooted files should inherit owner provenance and ownership from the same spine
- the owner `User` and owner `Contact` should be protected from normal deletion
- the last remaining `User` and `Contact` should also be protected from deletion

Working rule:

- do not treat owner authority like casual `User_Role` editing
- do not allow non-owner actors to edit the owner's `User` or linked `Contact` data
- make the UI reflect the same lock/edit split that the runtime enforces

For the current concrete audit, the runtime-backed set is:

- `Company <-> Project`
- `Company <-> Task`
- `Company <-> Fund`
- `Company <-> Round`
- `Contact <-> Company`
- `Contact <-> Fund`
- `Contact <-> Round`
- `Contact <-> Project`
- `Task <-> Project`
- `Project <-> Fund`
- `Project <-> Round`
- `Project <-> Company`

The currently declared-but-not-yet-backed set includes:

- most `User_*` relationships such as `User <-> Project`
- most `Artifact_*` relationships
- several `Note_*` relationships

Working rule:

- do not pretend the declared-but-not-yet-backed set is already complete
- document and expose that gap clearly
- close the runtime gap underneath the canonical relationship rather than adding shell-side interpretation

### Generic KDB Owner Path

For canon-declared KDB relationships that do not already have an approved domain-specific join table, the standard owner path is now:

- `KDB_Relationships`

This table exists to keep the missing relationship set on one shared contract instead of multiplying one-off pair tables.

Working rule:

- existing domain-specific relationship tables may continue where they are already meaningful and approved
- canon-declared KDB links without that special owner path should use the shared `KDB_Relationships` contract
- reverse appearance should be maintained through the same shared contract

## Human System Spine

The human system should not be thought of as one flat set of interchangeable cards.

It has three distinct layers:

- `Owner`
  - system authority
  - node founder identity
  - origin of top-level control
  - should exist at node creation

- `User`
  - application actor
  - carries permissions, role assignment, work rights, and system participation
  - node creation should immediately produce a first `User` with role `Owner`

- `Contact`
  - person record inside the CRM/KDB layer
  - may correspond to a `User`
  - but not every `Contact` is a `User`

Working rule:

- `Owner -> User` is a root-established authority path
- `User <-> Contact` should be treated as an identity-link path when it represents the same human
- this identity-link path should not be treated like a loose generic KDB relationship

### Human Spine Runtime Paths

The current runtime-backed human spine should be understood as:

- `Owner_DB`
  - singleton owner authority path
  - currently backed by `Owner_DB.owner_user_id`

- `Users`
  - actor layer

- `Contacts`
  - person layer
  - identity-linked to users through `Contacts.linked_user_id`

- `Roles`
  - role definitions such as:
    - `Owner`
    - `Admin`
    - `Guest`

- `Users_Roles`
  - role assignment DB
  - stores which user has which role
  - should be treated as a real underlying owner path, not as an incidental helper table

Working rule:

- `Roles` defines the role records
- `Users_Roles` defines the user-to-role assignments
- `Users_Roles` is a real assignment DB even if it is not yet a standalone file page

## Field Class Model

The lasting architecture should not depend on remembered exceptions.

It should depend on explicit token behavior declared at the `L1/L2/L3` structure layer.

That means:

- `L1`
  - defines entity identity and root contract

- `L2`
  - defines section purpose such as:
    - `System`
    - `General`
    - `KDB`

- `L3`
  - defines token behavior

The intended token behavior layer should explicitly declare concepts like:

- `field_class`
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`

- `ownership_mode`
  - `local`
  - `root_owned`
  - `relationship_owned`

- `cardinality`
  - `one_to_one`
  - `one_to_many`
  - `many_to_many`

- `reverse_visibility`
  - `none`
  - `visible`
  - `editable_from_owner_only`

- `write_path`
  - direct owner field
  - join-owner contract
  - generic KDB owner path

Working rule:

- field behavior should be declared by structure
- the shell should not remember exceptions
- the shell should render and save from explicit token behavior

### Field Classification Table

| Field Class | Meaning | Directionality | Who Owns It | Reverse Visible? | Editable Where? |
| --- | --- | --- | --- | --- | --- |
| `owned_field` | ordinary field value on the current record | local | current record | usually no | current record |
| `directional_link` | root-established or rule-bearing path such as identity, authority, provenance, or parentage | one-directional | explicit owner path | sometimes, depending on rule | owner side only |
| `kdb_relationship` | mutual relationship between records | usually bidirectional | relationship owner path | yes | through approved relationship owner path |

### Root-Established Directional Links

Some fields should be treated as a distinct class from generic KDB.

These are:

- identity links
- authority links
- provenance links
- parent/root organization links
- stage or board anchors when they govern behavior

These links should:

- be established at root or owner level
- guide navigation and rule enforcement
- not be editable casually from both sides
- often render loaded-but-locked in linked views

Examples:

- `Owner -> User`
- `User -> Role`
- `Contact -> linked_user_id`
- `Creator`
- `Artifact -> Ingestion`
- `Ingestion -> Created Files`

## Heuristic Guidance Layer

Heuristics are approved as a top-layer guidance tool, not as a structure tool.

Working rule:

- strict structure underneath
- heuristic help on top

That means heuristics may:

- front-load likely options
- rank likely targets
- highlight likely next actions
- prioritize what is in the user’s line of sight
- use board relevance and point weighting to rank options

But heuristics must not:

- invent ownership
- invent undeclared relationships
- decide write paths
- override the declared field class

This is especially relevant for:

- linked human-system fields such as `Contact_User`
- high-context KDB selectors
- stage-sensitive board work where the point system can rank what matters most now

## Field Visibility Rule

The field behavior model should eventually be visible to the user in field-level context.

That does not mean exposing raw implementation jargon everywhere.

It means the system should be able to show, when needed:

- whether a field is local, directional, or relational
- whether it is editable here or only through the owner path
- whether it is reverse-visible only
- where to follow it back if it is locked here

Working rule:

- the architecture meaning should be inspectable
- users and companions should not have to guess why a field is editable, locked, or mirrored
- new `L1`s and `Knowledge DB` `L1`s should inherit this rule instead of inventing their own relationship storage pattern

## Shared Shell Rule

The `File` shell should have one shared source implementation.

Current rule:

- the shared file shell lives in `src/components/FilePageShell.vue`
- file pages are thin route wrappers around that one shell source
- if the shell changes, all file pages should change automatically

This is different from route ownership.

Route ownership should still stay explicit:

- each file page owns its own route
- each file page should load its own route-owned `L1`
- only the literal `File Shell` lab route should switch source from the shell selector

Working rule:

- shared shell behavior changes once
- page wrappers stay thin
- route-owned `L1` loading should not be overridden by the last selected `File Shell` lab source

## Canonical Input Rules

The shared create/edit record dialog should read field meaning from canonical structure, not from page-local UI logic.

That means each `L3` token should declare:

- its `token_type`
- whether it is a fixed list, a live entity pick, a live entity set, a system stamp, or a direct input
- any reusable canonical list it depends on

Approved option-source families:

- `canonical_list`
  - fixed reusable dropdown libraries
  - example: `Task_Status -> Task_Status_List`
- `live_entity`
  - one live entity source
  - example: `Fund_Manager -> Companies`, filtered to `Asset Manager`
- `live_entity_set`
  - more than one live entity source
  - example: `Round_Sponsor -> Contacts + Companies`
- `record_subset`

## Edit Payload Rule

The shared edit dialog should preload from the true databook payload for the active `L1`, not from summary rows or card chips.

That means:

- edit should call `databooks.view(activeL1Entity, recordId)`
- token values should read from the returned databook `fields` first
- token values may then fall back to the returned flat `record` only when the exact field is present there
- cards, table rows, and chips are display surfaces only; they are not the edit preload contract

Expected token return shape:

- scalar token
  - one scalar value
- `select_single`
  - one explicit selected value
  - options still come from the token's declared option source
- `select_multi`
  - one array of selected values
- KDB relationship token
  - one explicit relationship list in the token's expected shape
  - structured record-owned subsets
  - example: `Contact_Employment`
- `derived_subset`
  - single values derived from an owned subset table
  - example: `Project_Current_Stage` derives from `Project_Stages`
- `direct_input`
  - user-entered value, not a dropdown
  - example: `Company_Round_Raised`
- system-owned values
  - `Creator`
  - `Datetime`

Working rule:

- fixed dropdown values should live in top-level reusable `option_lists` inside `docs/canonical-structure.json`
- tokens should reference those lists explicitly
- live pickers should point to their source entity explicitly
- the shared dialog may render from canonical and live row sources
- the page should not hardcode field meaning

Current approved examples:

- `Company_Pax_Known`
  - direct user input
- `Round_Security_Type`
  - dedicated evolving security-type list
  - current values: `Common`, `Preferred`
- `Fund_Target_Industries`
  - evolving subset table, not a hardcoded page list
- `Fund_Target_Stages`
  - sourced from `Stages`
- `Project_Stages`
  - project-owned subset table with stage details such as milestone and objective
- `Project_Current_Stage`
  - derived from the `Project_Stages` subset

## Canonical Structure Direction

The long-term canonical structure direction is:

`JSON/App Structure -> Payload -> UI`

With supporting adapters:

- `Workbook exporter/importer`
- future migration exporters/importers
- external intake or migration formats

This means:

- the workbook is helping us validate and refine the structure
- the app should not depend on Excel as the primary runtime bridge
- canonical structure lives in a machine-readable form that the app can edit directly
- exporters remain valuable, but they should act as adapters rather than the permanent backbone

Working interpretation:

- `Workbook` is the current design and validation surface
- `JSON` is the current canonical structure surface
- `app editing` should operate against that canonical JSON structure

Current canonical file:

- `docs/canonical-structure.json`

## Opportunity Structure Rule

`Opportunities` is now the shared parent `L1` contract for the opportunity lane.

That means:

- `Opportunities` owns the shared shell-facing contract
- `Funds` and `Rounds` are subtype branches under that parent
- shared sections should stay at the `Opportunity` level when they are truly shared
- subtype-specific sections should remain subtype-owned when their internal structures diverge

Current approved interpretation:

- shared `Opportunity` sections:
  - `System`
  - `KDB`
  - `General`
  - `Business Overview`
- subtype-owned deeper sections:
  - `Fund` `Economics`
  - `Fund` `Controls`
  - `Round` `Economics`
  - `Round` `Controls`

Create rule:

- if an `L1` owns subtype branches, create/add-record should first ask which route to take
- that route-choice step is canonical behavior, not a widget-only special case
- example: `Opportunities` should ask whether the new record should follow the `Fund` route or the `Round` route

Working rule:

- do not pretend `Economics` and `Controls` are one shared structure just because their labels match
- keep the shell unified where the contract is shared
- fork the deeper sections where the structure is actually different

## Surface Split

The app should use two payload lanes.

### 1. File / Card View

This lane should stay lightweight.

Use:

- row payload fields
- relationship values already present on the row
- lightweight counts, previews, and related labels where available

Goal:

- fast loading
- responsive scrolling
- low runtime cost

### 2. Record View

This lane can be richer.

Use:

- workbook-aligned `sections`
- richer grouped relationship payloads
- join-table-backed relationship data where needed

Goal:

- correctness
- completeness
- explicit section ownership

Working rule:

`File/Card View stays light. Record View gets rich.`

## Knowledge DB Files

Inside `Files`, there is also a `Knowledge DBs` subset.

These are reusable reference files that support other records and evolving controlled vocabularies.

Current approved `Knowledge DB` file direction includes:

- `Markets`
- `Locations`
- `Terms`
- `Academia`
- `Employments`
- `Stages`
- `Roles`
- `Financial Industries`
- `Round Securities`
- `Ingestion`

### Standard DB Baseline

When a new file becomes a real DB-backed surface, it should start from one standard baseline.

That baseline is:

- a real sqlite table
- a preload/main bridge with at least `list`, `create`, and `delete`
- canonical `L2` sections:
  - `System`
  - `KDB`
  - `General`
- canonical `General` tokens:
  - `Name`
  - `Summary`

Working order rule:

- `Name` is canonical field `*.3.1`
- `Summary` is canonical field `*.3.2`
- `Name` should anchor the left-side first field position in shared edit surfaces
- `Summary` should anchor the right-side first field position in shared edit surfaces
- this is a shared contract rule, not a page-by-page layout choice

If a new DB needs more than that, add it on top of this baseline instead of inventing a one-off structure.

Working rule:

- when a controlled field should evolve as a reusable reference set, prefer a `Knowledge DB` file over a page-local hardcoded list
- shells may still render those sources as selects or pickers, but the meaning should come from the `Knowledge DB` file contract

Relationship inheritance rule:

- when a new `Knowledge DB` or first-level `L1` is introduced, its KDB relationship expectations should be documented immediately
- if the relationship is declared in canon, the owner path and reverse-read path should be planned at the same time
- do not allow canon to drift far ahead of runtime relationship ownership without documenting that gap

Examples:

- `Fund_Target_Industries` should read from `Financial_Industries`
- `Round_Security_Type` should read from `Round_Securities`
- `Fund_Target_Stages` should read from `Stages`

### Ingestion Contract

`Ingestion` should be treated as a secondary `Knowledge DB` that tracks artifact-processing provenance.

It exists to show:

- which original artifact was processed
- why that artifact was processed
- what files were created from that processing

Minimum contract:

- `Original Artifact`
  - relation back to the source artifact
- `Created Files`
  - related files created from that processing event
- `Working`
  - marker that the created file is an AI working file

Working rule:

- when an artifact is selected and sent into the `Ingestion Companion` processing lane, that is the point where the `Ingestion` record should be created/tracked
- one original artifact may have many `Ingestion` records
- one `Ingestion` record may have many `Created Files`

Relationship rule:

- the original artifact should show related `Ingestion`
- the original artifact should also show related `Created Files`
- the processed row should link back to the original artifact and forward to the created files

This means provenance should be visible from either direction:

- original artifact -> ingestion -> created files
- created file -> ingestion -> original artifact

Current frontend preparation rule:

- new `Knowledge DB` files should reuse the same shared file shell path as the `File Shell` lab
- frontend work may prepare canonical registry entries, routes, and navigation before runtime source wiring is complete
- do not create a separate placeholder UI path once the intended final surface is the shared shell

Current implementation rule:

- `Markets`
- `Securities`
- `Ingestion`

should each have their own page wrapper and route, but all three should still render through the one shared file shell source.

## Owner Identity Rule

The local owner profile should become the first real `User`.

Current working rule:

- owner settings are not just local decoration
- owner identity should bootstrap into the `Users` table
- the owner bootstrap should also ensure an `Owner` role exists in `Roles`

Important current limit:

- `Owner` can exist as a real role record
- but there is not yet a dedicated user-to-role relationship contract in the current schema
- do not fake that relationship in the shell until the structure exists

- the shell and direct forms should compose the stored full name from those two inputs instead of exposing one unsplit name box

## Current File Card Shell

The current normalized shared `File` card shell applies to:

- `Users`
- `Contacts`
- `Companies`
- `Artifacts`
- `Opportunities`
- `Projects`
- `Notes`
- `Tasks`

Each file card should follow the same top-level section order:

1. `control row`
2. `hero`
3. `summary`

In template terms, the normalized structure is:

```vue
<q-card>
  <q-card-section class="*-card__control-row" />
  <q-card-section class="*-card__hero" />
  <q-card-section class="*-card__summary">
    <div class="*-card__summary-head" />
    <div class="*-card__summary-panel">
      <div class="*-card__summary-panel-head" />
      <div class="*-card__summary-body">
        <div class="*-card__summary-body-content" />
      </div>
    </div>
  </q-card-section>
</q-card>
```

### Control Row

The control row is the thin top strip of the card.

It should contain:

- the select checkbox on the left
- the eye icon on the right

Rules:

- spacing should feel visually balanced from both borders
- the row should hug the top edge of the card cleanly
- corners should clip with the card shell so hover states do not poke out

### Hero

The hero section is the top content block below the control row.

It contains:

- the visual identity area on the left
- the detail lane on the right

Rules:

- the right lane should formalize `title`, `subtitle`, and `chips` instead of relying on older metadata wording
- title typography should stay consistent across file families unless intentionally specialized
- `Notes` and `Tasks` should not drift into smaller typography unless that is explicitly approved

### Summary

The summary section is the lower relationship area of the card.

It is split into two parts:

#### 1. Summary Head

This row should contain:

- the KDBhip icon strip on the left
- the mini grid/row toggle on the right

Rules:

- the icon strip stays lightweight
- all icons are clickable
- empty relationship states are allowed and should show empty text in the panel body

#### 2. Summary Panel

This is the off-white dynamic box below the summary head.

It should contain:

- `summary-panel-head`
- `summary-body`

The `summary-panel-head` currently contains:

- `Add Relation`

Rules:

- `Add Relation` lives inside the box, not beside the icon strip
- it sits at the top-left of the panel
- it uses the title font treatment
- the panel body below it renders the active relationship content or the empty state

### File Card Naming Convention

For long-term maintainability, file card grid templates should use the same loop alias:

- preferred loop alias: `row`

This matters because shared patching becomes fragile when templates mix:

- `row`
- `user`
- `group`
- other entity-specific aliases

Current normalization target:

- use `row` in the main card loop wherever practical

### File Card Maintenance Rule

When editing one file card page:

- check whether the same change belongs in all 8 file pages
- prefer keeping section order identical
- prefer keeping wrapper names identical
- prefer keeping loop alias naming identical
- avoid one-off template shape changes unless they are truly entity-specific
- prefer shared page-mechanics helpers for repeated record navigation, return-path building, and selection actions

Before making a bulk card change:

- confirm the same wrapper structure exists on all 8 pages
- confirm the same loop alias is being used
- confirm the same CSS block names exist
- confirm the change belongs to the shared shell, not entity-specific content

After making a bulk card change:

- lint
- compare at least `Users`, `Contacts`, `Artifacts`, and `Projects`
- if one page drifts, update this section

## Core Rules

### Workbook Rule

The workbook is the first-pass setup and validation layer.

Use it to verify:

- section order
- section membership
- leaf-token ownership
- relationship coverage

The workbook is not intended to remain the permanent runtime bridge once the canonical JSON structure is in place.

### Canonical Structure Rule

The structure source of truth should remain a machine-readable app-native layer.

For this project, that means:

- `JSON` is the canonical structure source of truth
- the app should be able to edit that structure directly
- workbook export/import should support migration and outside editing, not define the runtime forever

### Record Section Rule

Every workbook-backed record should expose:

- `System` first on the left
- file-specific middle sections next
- `KDB` last on the right

Section behavior:

- normal sections render their leaf tokens
- `KDB` renders the relationship browser

### Payload Rule

`RecordPage.vue` was the earlier shared record surface and is now removed.

It should not be treated as the long-term shared record solution.

The long-term contract must come from:

- workbook section order
- workbook leaf-token membership
- explicit KDB grouping

### Token Naming Rule

During this first architecture pass, token names should also be normalized toward their final form.

That means:

- section-label changes should not stop at the section label layer
- token names should be reviewed and renamed where appropriate so the workbook, JSON companion, and app vocabulary move together
- the goal is to reduce mixed states such as `System` sections still containing `*_Metadata` token names unless that mismatch is intentionally preserved

Working principle:

- user-facing labels may evolve
- structural addresses should remain stable
- token names should move toward their final approved naming during this pass, not be deferred indefinitely

### Canonical Token Resolution Rule

Canonical token identity and live payload field names are not always the same thing.

The intended contract is:

- canonical token = structural token used by the app architecture
- DB field alias = explicit runtime field name when the current DB or row payload still uses older naming

Examples:

- canonical `Contact_Name` may resolve through DB field alias `Name`
- canonical `Company_Summary` may resolve through DB field aliases such as `One_Liner` or `Description`
- canonical `Artifact_Name` may resolve through explicit list payload aliases such as `title`

This means:

- the shell should render through canonical structure
- payload mismatches should be handled by explicit alias declaration in canonical JSON
- do not restore per-page field guessing to bridge naming drift

### Addressing Rule

Every approved entity structure should eventually support stable structural addressing.

Use:

- `Level1.Level2.Level3`

Example:

- `4.3.2`

Meaning:

- entity `4`
- subsection `3`
- item `2`

Addresses are:

- structural
- stable
- human-readable

They are not replacements for:

- DB ids
- record ids
- join-table ids

### Table Group Rule

Page-level grouped table tabs should reflect real schema groups, not arbitrary UI presets.

Top-level landing switch remains:

- `Card`
- `Table`

Inside `Table`, use:

- `Cards`
- `All`
- real schema-group tabs

## Current Problems

These are the main issues we are solving.

### 1. Mixed Payload Quality

Some record types already have intentional custom payloads.

Others still use generic field guesses.

Result:

- some records feel aligned
- others still feel improvised

### 2. Heuristic Section Mapping

The current generic record section logic is still partially heuristic.

That is acceptable only as a temporary migration layer.

It should not be treated as the final contract.

### 3. Naming Drift

Most route-level record navigation now uses `Record View` naming and shared helper utilities, but some shared-layer and styling logic still uses older `Databook` wording.

That remaining internal naming still needs to finish migrating to `File`, `Record`, and `Record View`.

### 4. Relationship Drift

KDB are now more consistent visually, but not yet fully backed by the same data contract everywhere.

That means:

- cards may show lightweight relationship previews
- record views still need fuller grouped relationship payloads

### 5. Shared Card Maintenance Drift

The 8 main file pages now have a much more normalized card shell, but that normalization must be maintained deliberately.

The main maintenance risks are:

- wrapper drift in card summary templates
- loop alias drift in file card grids
- one-off shell edits that belong in the shared card pattern

## Target Architecture

Each entity should eventually have three explicit contracts.

### 1. Structure Contract

Defines:

- approved workbook sections
- section order
- level-2 group ownership
- item-address numbering

### 2. Light Payload Contract

Used by:

- file views
- cards
- row previews

Defines:

- what row fields are available
- what lightweight relationship values are available
- what card/table previews can render without expensive joins

### 3. Rich Payload Contract

Used by:

- record view
- KDBhip browser
- future review and audit experiences

Defines:

- section payloads
- leaf-token membership
- grouped relationship items
- section kinds such as `fields` and `relationships`

## Canonical Record Payload Shape

```json
{
  "table_name": "Users",
  "record_id": "user:123",
  "entity_label": "User",
  "entity_name": "Jane Doe",
  "record": {},
  "sections": [
    {
      "id": "metadata",
      "label": "System",
      "kind": "fields",
      "items": []
    },
    {
      "id": "kdb-relationships",
      "label": "KDB",
      "kind": "relationships",
      "items": []
    }
  ],
  "fields": []
}
```

Canonical tokens may also carry explicit runtime alias metadata when needed, for example:

```json
{
  "address": "3.3.1",
  "token_name": "Contact_Name",
  "token_type": "text",
  "db_field_aliases": ["Name"]
}
```

Working guidance:

- `sections` is the long-term primary UI contract
- `fields` can continue during migration for compatibility

## Canonical Section Order By File

- `Users`: `System`, `KDB`
- `Artifacts`: `System`, `KDB`
- `Contacts`: `System`, `Employment`, `Studies`, `KDB`
- `Companies`: `System`, `Incorporation`, `Documents`, `Operations`, `Business`, `Market`, `Results`, `Business Plan`, `Fund Raising`, `KDB`
- `Funds`: `System`, `Overview`, `Economics`, `Controls`, `KDB`
- `Rounds`: `System`, `Overview`, `Economics`, `Controls`, `KDB`
- `Projects`: `System`, `Overview`, `Team`, `KDB`
- `Tasks`: `System`, `Overview`, `Team`, `KDB`
  - `Notes`: `System`, `KDB`
  - `Roles`: `System`, `KDB`

Grouped subsection rendering rule:

- a grouped `L2` may collapse multiple canonical subsections into one toolbar item
- that grouped toolbar item must not flatten those canonical subsection identities in the panel
- when grouped subsection blocks render in the panel, each subgroup must have its own collapse / expand control
- the same grouped subsection rule should hold in the shared create / edit dialog, not only in `Record View`
- `Companies` should therefore render one `Business Overview` toolbar label while preserving:
  - `Ops Overview`
  - `Business Overview`
  - `Market Overview`
  - `Results Overview`
  as subgroup variants inside the panel

## Execution Plan

### Phase 1. Freeze the Structure Maps

For each entity define:

- section order
- section ids
- schema-group ownership
- KDBhip categories
- item-address ranges
- final token naming

At the same time:

- confirm the JSON structure shape that the app will eventually own directly
- use the workbook to validate that JSON shape rather than making Excel the permanent dependency

Start with:

- `Company`

Why:

- best reference richness
- easiest to reason about across related records

### Phase 2. Freeze the Addressing Maps

For the reference entity, define:

- `Level1` entity number
- `Level2` subsection numbering
- `Level3` leaf numbering

Then expand entity by entity.

### Phase 3. Separate Light and Rich Payloads

For each entity define:

- light file/card payload
- rich record payload

The split should be explicit, not accidental.

### Phase 4. Replace Heuristic Record Mapping

Move away from long-term heuristic section ownership in the deprecated `RecordPage.vue` path.

Each entity should have workbook-backed token ownership.

### Phase 5. Build One Full Reference Entity End to End

Start with:

- `Company`

Deliver:

- approved section structure
- approved addressing
- canonical JSON subsection structure
- light payload for file/cards
- rich payload for record view
- KDBhip groups

### Phase 6. Standardize KDBhip Contracts

For each entity define:

- possible relationship types
- lightweight card preview behavior
- rich record-view relationship behavior
- empty-state behavior
- real owner path
- reverse-read path
- bidirectional appearance rule

### Phase 7. Align Table Group Tabs

Grouped table tabs should mirror real schema groups.

Use:

- `Cards`
- `All`
- real schema-group tabs

### Phase 8. Migrate Remaining Entities

Recommended order:

1. `Companies`
2. `Opportunities`
3. `Contacts`
4. `Projects`
5. `Artifacts`
6. `Tasks`
7. `Notes`
8. `Users`
9. `Funds`
10. `Rounds`
11. `Roles`

## Progress Tracker

### Overall

- [x] Shared `RecordPage.vue` existed as the earlier shared record surface
- [x] Shared `record-view` route now resolves into `RecordShellPage.vue`
- [x] Remove legacy `RecordPage.vue` after route ownership moved to `RecordShellPage.vue`
- [x] File/card shell consistency improved across core pages
- [x] KDB icon strip unified across file cards
- [x] Card relationship icon affordance added
- [x] Excel + JSON companion workflow introduced
- [x] Canonical direction decided: `JSON + app editing`
- [x] Route-level `Record View` navigation is centralized through shared helpers
- [x] Repeated route-query sync for normalized file-page view state is moving into shared helpers
- [ ] Route and shared naming fully cleaned of `Databook`
- [ ] Heuristic section mapping fully replaced
- [ ] Light vs rich payload split documented per entity
- [ ] Item addressing adopted per entity

## Deprecated / Cleanup Queue

The following are now explicitly legacy and should be cleaned deliberately instead of staying half-active:

- `RecordPage.vue`
  - historical legacy record surface
  - removed from the active route set

- internal `Databook` naming
  - still present in bridge and styling language
  - should continue migrating to `File`, `Record`, and `Record View`

- `Live Shell` wording
  - product-facing shell naming has moved to `File Shell`
  - remaining `Live Shell` references in docs should be cleaned to `File Shell` or `File Shell` lab unless they are intentionally historical

- `Test Shell` wording
  - where it refers to the contract route, it should be normalized to `File Shell` lab language
- [ ] Rich record payloads standardized per entity
- [ ] Token names normalized to final approved form
- [ ] Canonical JSON structure contract defined per entity
- [ ] App editing model for canonical JSON structure defined
- [ ] Exporters repositioned as migration/intake adapters

### Reference Entity: Company

- [ ] section order approved
- [ ] level-2 schema groups approved
- [ ] item-address numbering approved
- [ ] final token naming approved
- [ ] light file/card payload defined
- [ ] rich record payload defined
- [ ] KDBhip contract defined
- [ ] grouped table tabs aligned
- [ ] record view aligned to final payload

### Entity Rollout

- [ ] Companies
- [ ] Opportunities
- [ ] Contacts
- [ ] Projects
- [ ] Artifacts
- [ ] Tasks
- [ ] Notes
- [ ] Users
- [ ] Funds
- [ ] Rounds
- [ ] Roles

## Working Principle

We are not trying to force every surface into the same runtime cost.

We are trying to make every surface structurally coherent.

So the practical principle is:

`Use the workbook to define and validate the first structure, move canonical ownership into JSON with app editing, keep file views lightweight, make record views rich, and let stable addresses tie the system together.`


## Table Naming Contract

When shared shell surfaces perform IPC write actions such as `databooks:update`, they must use the approved databook table name, not the route key and not the canonical entity name when those differ.

The distinction is:

- canonical entity name:
  used for structure, ownership, and shell contract reasoning
- route key:
  used for navigation and shell payload switching
- databook table name:
  used for IPC/database-facing actions

These are not interchangeable.

Examples:

- route key `companies` -> databook table name `Companies`
- canonical entity `Financial_Industries` -> databook table name `Industries`
- route key `securities` -> databook table name `Round_Securities`

If a shell action is performing a databook write, verification write, or databook snapshot/update flow, it must normalize through the approved databook table-name mapping first.

## Append-Only Audit Rule

Shared shell writes must respect the append-only `events` contract.

That means:

- shared shell save flows may use `actionLabel` to describe the write session
- but they must not reuse one shell-session `actionId` across repeated field writes

Why:

- the `events` log is append-only
- reusing the same `actionId` for the same target field causes the backend audit layer to treat the later write like an update to an existing event
- that conflicts with the append-only rule

So the approved shell rule is:

- keep the shared action label for shell/session context
- let each write create its own audit event id
- do not treat shell session ids as reusable write ids

## Directional KDB Join Rule

Explicit join-table KDB contracts must preserve join direction.

That means:

- the forward direction may use `from_id -> to_id`
- but the reverse direction must swap the join columns when the shell is linking from the opposite side

Why:

- many join tables are directional at the SQL layer
- reusing the same join-column mapping in both directions can put the source record id into the wrong foreign-key column
- that causes foreign-key failures even when the chosen linked record is valid
