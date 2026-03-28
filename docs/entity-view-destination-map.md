# Entity View Destination Map

## Purpose

Define the two destination actions that will live on landing-page cards:

- `EyeView`
- `DataBook`

This document also defines the level-2 subsection sets that should be used in both destinations.

## Core Rules

- `EyeView`
  Opens the curated profile-style page.
- `DataBook`
  Opens the landing page in `Table` view with the `Cards` tab selected first.
- For now, include all level-2 subsections that apply to the entity.
- `Company` and `Contact` are the visual reference for curated `EyeView`.
- `DataBook` should use:
  - `Cards`
  - `All`
  - level-2 schema-group tabs

## Shared Landing Model

### Top-Level

- `Card`
- `Table`

### Inside `Table`

- `Cards`
- `All`
- level-2 schema-group tabs

## Companies

### EyeView

- style reference:
  current company curated page
- destination:
  curated company profile view

### DataBook

- destination:
  `Companies` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Contacts`
- `Rounds`
- `Funds`
- `Artifacts`
- `Notes`

## Contacts

### EyeView

- style reference:
  current contact curated page
- destination:
  curated contact profile view

### DataBook

- destination:
  `Contacts` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Companies`
- `Opportunities`
- `Artifacts`
- `Notes`

## Opportunities

### EyeView

- style reference:
  adapt the same curated language used by company/contact
- destination:
  curated round/fund opportunity view

### DataBook

- destination:
  `Opportunities` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Company`
- `Contacts`
- `Artifacts`
- `Status`
- `Terms`

## Pipelines

### EyeView

- style reference:
  curated workspace/process view
- destination:
  curated pipeline profile view

### DataBook

- destination:
  `Pipelines` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Stages`
- `Tasks`
- `Companies`
- `Opportunities`
- `Artifacts`

## Tasks

### EyeView

- style reference:
  curated task profile view using the same visual family
- destination:
  curated task view

### DataBook

- destination:
  `Tasks` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Ownership`
- `Projects`
- `Companies`
- `Opportunities`
- `Artifacts`

## Notes

### EyeView

- style reference:
  curated note profile / reading view
- destination:
  curated note view

### DataBook

- destination:
  `Notes` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Creator`
- `Companies`
- `Contacts`
- `Projects`

## Artifacts

### EyeView

- style reference:
  curated review workspace
- destination:
  artifact review / preview-centered view

### DataBook

- destination:
  `Artifacts` landing page in `Table`
- default sub-tab:
  `Cards`

### Level-2 subsections

- `Metadata`
- `Relationships`
- `Versions`
- `Review`
- `Companies`
- `Opportunities`
- `Projects`

## Selected-State Actions

These should be standardized and then specialized per entity.

### Shared baseline

- `Export`
- `Delete`

### Entity-specific examples

- `Share`
  especially for artifacts
- `Link To`
  for entity records that can be linked to other canonical records
- `Open in EyeView`
  optional future bulk action
- `Open in DataBook`
  optional future bulk action

## Recommended Build Order

1. `Companies`
2. `Contacts`
3. `Opportunities`
4. `Pipelines`
5. `Artifacts`
6. `Tasks`
7. `Notes`

## Reference Implementation Scope

### First build on `Companies`

Implement:

- card action icon split:
  - `EyeView`
  - `DataBook`
- `DataBook` destination behavior:
  landing page `Table` view with `Cards` selected
- table sub-tabs:
  - `Cards`
  - `All`
  - all company level-2 subsections

Once `Companies` feels right, reuse the pattern for the other entities.
