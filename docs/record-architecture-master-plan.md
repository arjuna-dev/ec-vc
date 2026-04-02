# Record Architecture Master Plan

## Status

This document is now the primary working reference for:

- overall objective
- governing rules
- architecture direction
- execution plan
- progress tracking

This document should be treated as the single planning source of truth for the `File -> Card -> Record View` architecture.

When decisions change:

- update this file
- do not create parallel architecture docs unless there is a strong reason
- use the progress tracker here to reflect what is approved, in progress, and complete

## Objective

Make the app function cohesively from `File` to `Card` to `Record View`.

That means:

- every workbook-backed entity should follow one clear structure
- file views should stay lightweight and fast
- record views should be richer and more correct
- KDB relationships should behave consistently
- addresses, sections, payloads, and UI should all refer to the same underlying structure

The goal is not just visual consistency.

The goal is operational consistency:

- the same entity should mean the same thing in workbook structure
- the same entity should expose the same section logic in payloads
- the same entity should render predictably in file view and record view

## Task / Goal Framing

This initial architecture pass is meant to define the first clean, stable structure for the system.

For this phase:

- the `Workbook` is the structural authority
- the app uses the workbook to establish order, ownership, and consistency
- the UI should align to that structure while we standardize the system

This does **not** mean the workbook must permanently lead every future design decision.

The intended long-term understanding is:

- `workbook-first` for initial standardization
- `UI-informed workbook evolution` later

In other words:

- right now, the workbook helps us create the first approved architecture
- later, once the product model is mature, the UI may become the stronger design reference
- at that point, workbook layouts can be refined to follow the approved UI model

So the current goal is not to freeze the workbook forever.

The current goal is to use the workbook as the best available structural guide for the first cohesive system pass.

## Governing Model

The structural authority is:

`Workbook -> DB Tables -> Payload -> UI`

More clearly:

- the `Workbook` defines intended structure
- the `DB Tables` should stay aligned to that structure
- the `Workbook` mirrors the DB
- the `Payload` is built from the DB
- the `UI` renders the payload

This is not a purely one-way system, because the workbook files are themselves mirrored from the DB.

So the practical meaning is:

- `Workbook` is the canonical structure reference
- `DB` is the runtime source
- `Payloads` must reflect workbook structure
- `UI` should not invent structure on the fly

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

## Core Rules

### Workbook Rule

The workbook is the canonical setup and validation layer.

Use it to verify:

- section order
- section membership
- leaf-token ownership
- relationship coverage

### Record Section Rule

Every workbook-backed record should expose:

- `Metadata` first on the left
- file-specific middle sections next
- `KDB Relationships` last on the right

Section behavior:

- normal sections render their leaf tokens
- `KDB Relationships` renders the relationship browser

### Payload Rule

`RecordPage.vue` should not invent structure heuristically as the long-term solution.

The long-term contract must come from:

- workbook section order
- workbook leaf-token membership
- explicit KDB grouping

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

Some route and shared-layer logic still uses older `Databook` wording.

That needs to finish migrating to `File`, `Record`, and `Record View`.

### 4. Relationship Drift

KDB relationships are now more consistent visually, but not yet fully backed by the same data contract everywhere.

That means:

- cards may show lightweight relationship previews
- record views still need fuller grouped relationship payloads

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
- KDB relationship browser
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
      "label": "Metadata",
      "kind": "fields",
      "items": []
    },
    {
      "id": "kdb-relationships",
      "label": "KDB Relationships",
      "kind": "relationships",
      "items": []
    }
  ],
  "fields": []
}
```

Working guidance:

- `sections` is the long-term primary UI contract
- `fields` can continue during migration for compatibility

## Canonical Section Order By File

- `Users`: `Metadata`, `KDB Relationships`
- `Artifacts`: `Metadata`, `KDB Relationships`
- `Contacts`: `Metadata`, `Employment`, `Studies`, `KDB Relationships`
- `Companies`: `Metadata`, `Incorporation`, `Documents`, `Operations`, `Business`, `Market`, `Results`, `Business Plan`, `Fund Raising`, `KDB Relationships`
- `Funds`: `Metadata`, `Overview`, `Economics`, `Controls`, `KDB Relationships`
- `Rounds`: `Metadata`, `Overview`, `Economics`, `Controls`, `KDB Relationships`
- `Projects`: `Metadata`, `Overview`, `Team`, `KDB Relationships`
- `Tasks`: `Metadata`, `Overview`, `Team`, `KDB Relationships`
- `Notes`: `Metadata`, `KDB Relationships`
- `Roles`: `Metadata`, `KDB Relationships`

## Execution Plan

### Phase 1. Freeze the Structure Maps

For each entity define:

- section order
- section ids
- schema-group ownership
- KDB relationship categories
- item-address ranges

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
- light payload for file/cards
- rich payload for record view
- KDB relationship groups

### Phase 6. Standardize KDB Relationship Contracts

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
- [ ] Route and shared naming fully cleaned of `Databook`
- [ ] Heuristic section mapping fully replaced
- [ ] Light vs rich payload split documented per entity
- [ ] Item addressing adopted per entity
- [ ] Rich record payloads standardized per entity

### Reference Entity: Company

- [ ] section order approved
- [ ] level-2 schema groups approved
- [ ] item-address numbering approved
- [ ] light file/card payload defined
- [ ] rich record payload defined
- [ ] KDB relationship contract defined
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

`Use the workbook as the canonical structure reference, keep file views lightweight, make record views rich, and let stable addresses tie the system together.`
