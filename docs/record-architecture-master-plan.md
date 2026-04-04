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
  - `Overview`
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

If a new DB needs more than that, add it on top of this baseline instead of inventing a one-off structure.

Working rule:

- when a controlled field should evolve as a reusable reference set, prefer a `Knowledge DB` file over a page-local hardcoded list
- shells may still render those sources as selects or pickers, but the meaning should come from the `Knowledge DB` file contract

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

- new `Knowledge DB` files should reuse the same shared file shell path as `Test Shell`
- frontend work may prepare canonical registry entries, routes, and navigation before runtime source wiring is complete
- do not create a separate placeholder UI path once the intended final surface is the shared shell

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

`RecordPage.vue` should not invent structure heuristically as the long-term solution.

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

Move away from long-term heuristic section ownership in `RecordPage.vue`.

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

- [x] Shared `RecordPage.vue` exists
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


