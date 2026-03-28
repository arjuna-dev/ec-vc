# Item Addressing Convention

## Purpose

Define a stable hierarchical item address system that mirrors the workbook `Id_#` pattern.

This is meant to make it easier to:

- track fields across views
- compare app structure against workbook structure
- reference items during review
- support future audit trails

This is a structural addressing system.
It is not a replacement for database primary keys.

## Address Shape

Use:

- `Level1.Level2.Level3`

Where:

- `Level1`
  top-level entity structure number
- `Level2`
  level-2 subsection number inside that entity
- `Level3`
  leaf item number inside that subsection

Example:

- `4.3.2`

Meaning:

- entity `4`
- subsection `3`
- item `2`

## Rule

The address should be:

- human-readable
- stable over time
- tied to structure, not screen order
- shared between `EyeView` and `DataBook`

## Why This Helps

This allows us to:

- compare app sections against workbook sections directly
- show a field address in review workflows
- track where extracted or edited information belongs
- keep future schema growth orderly

## Scope

This should be used for:

- landing page `DataBook` tabs
- `EyeView` section groups
- leaf fields inside those groups
- future extraction review / audit references

It should not replace:

- database ids
- join table keys
- artifact ids
- record ids

## Current Implementation Direction

The backend currently uses concrete domain tables, not generic structure tables.

So the addressing system should be layered on top of the current backend shape.

That means:

- `Level1`
  maps to the top-level entity
- `Level2`
  maps to the existing concrete subsection table or relationship group
- `Level3`
  maps to a concrete field or relationship item

## Proposed Entity Numbering

Initial top-level numbering proposal:

- `1`
  Artifact
- `2`
  User
- `3`
  Contact
- `4`
  Company
- `5`
  Fund
- `6`
  Round
- `7`
  Project / Pipeline
- `8`
  Task
- `9`
  Note
- `10`
  Intro
- `11`
  Pipeline Investment Process

These should remain stable once adopted.

## Company Example

Illustrative `Company` addressing based on the workbook and current backend direction:

- `4.1`
  Metadata
- `4.2`
  KDB Relations
- `4.3`
  Incorporation
- `4.4`
  Documents
- `4.5`
  Operations
- `4.6`
  Business
- `4.7`
  Market
- `4.8`
  Results
- `4.9`
  Business Plan
- `4.10`
  Fund Raising

Example leafs:

- `4.1.1`
  Company ID
- `4.1.2`
  Company Creator
- `4.1.3`
  Company Timestamp
- `4.3.1`
  Legal Name
- `4.3.2`
  Incorporation Date
- `4.5.3`
  HQ Locations

## UI Usage

The address can be shown:

- subtly in `DataBook`
- subtly in `EyeView`
- in audit/review tooling more explicitly

Example display:

- `4.3.1 Legal Name`
- `4.5.3 HQ Locations`

## Guardrails

- do not renumber existing addresses casually
- avoid assigning addresses based on temporary UI experiments
- derive them from approved structure maps
- if a new item is inserted later, preserve stability as much as possible

## Recommended Next Step

Before wiring addresses into the UI, define:

1. approved top-level entity numbering
2. approved level-2 subsection numbering per entity
3. leaf numbering for the first reference entity, starting with `Company`
