# PageView Schema Group Tabs

## Purpose

Keep the top-level landing page switch as:

- `Card`
- `Table`

Inside `Table`, use a second layer of tabs:

- `Cards`
- `All`
- schema-group tabs based on real related level-2 schema groups

`Cards` inside `Table` should mirror the same information shown in the grid/card view.

## Working Rule

- `Cards` is a mirrored card-summary tab inside `Table`
- `All` is the broadest row/column table for the entity
- later tabs are not arbitrary column presets
- later tabs should reflect real schema group ownership and related canonical relationships
- `OpenDataBook` should feel aligned with this grouped table/detail model

## Companies

- `Cards`
  Mirrors the current company cards
- `All`
  Core company table with broad metadata
- `Metadata`
  First-order company metadata fields
- `Contacts`
  Company-related contact fields and relationships
- `Opportunities`
  Related rounds and funds
- `Artifacts`
  Related documents and files

## Opportunities

- `Cards`
  Mirrors the current opportunity cards
- `All`
  Core opportunity table with broad metadata
- `Company`
  Sponsor company / linked company fields
- `Terms`
  Round/fund terms and status fields
- `Contacts`
  Primary and related contacts
- `Artifacts`
  Related documents and files

## Contacts

- `Cards`
  Mirrors the current contact cards
- `All`
  Core contact table with broad metadata
- `Metadata`
  First-order contact metadata fields
- `Companies`
  Current and related companies
- `Projects`
  Related pipelines / projects
- `Artifacts`
  Related files and documents

## Pipelines

- `Cards`
  Mirrors the current pipeline cards
- `All`
  Broad pipeline table
- `Metadata`
  First-order pipeline metadata
- `Stages`
  Pipeline stage structure
- `Tasks`
  Related task workflow
- `Companies`
  Related companies where applicable

## Tasks

- `Cards`
  Mirrors the current task cards
- `All`
  Broad task table
- `Metadata`
  First-order task metadata
- `Ownership`
  Owner / assigned / support relationships
- `Projects`
  Related pipelines / projects
- `Companies`
  Related companies and opportunities

## Notes

- `Cards`
  Mirrors the current note cards
- `All`
  Broad note table
- `Metadata`
  First-order note fields
- `Creator`
  Created-by fields
- `Linked Items`
  Future-facing relationship grouping once note links are available

## Artifacts

- `Cards`
  Mirrors the current artifact cards
- `All`
  Broad artifact table
- `Metadata`
  First-order artifact fields
- `Relationships`
  Company / opportunity / project / type links
- `Versions`
  RAW / MD pairing and sibling artifact grouping
- `Review`
  Intake / processing / review state

## Suggested First Build

Start with `Companies` as the reference implementation.

Why:

- it has enough schema richness to prove the model
- it is easier to reason about than `Artifacts`
- it connects well to contacts, opportunities, and artifacts

## Implementation Order

1. `Companies`
2. `Opportunities`
3. `Contacts`
4. `Pipelines`
5. `Artifacts`
6. `Tasks`
7. `Notes`

## Open Questions

- whether `Metadata` should always be a visible tab when `All` already includes it
- whether some pages should collapse low-value schema groups into one `Related` tab
- how tightly `OpenDataBook` should mirror the exact same tab names and ordering
