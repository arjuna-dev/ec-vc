# Workstream Tracker

## Purpose

Keep a short list of:

- front-loaded work
- active work
- parked follow-ups

This is meant to reduce context loss while we move between product, schema, and UI tasks.

## Front-Loaded

- Align `Company` structure with the workbook-driven level-2 model
- Redesign `DataBook` so it feels like an orderly workbook, not a reloading page
- Align `EyeView` section groups with the same schema-level-2 structure as `DataBook`
- Define hierarchical item addressing similar to workbook `Id_#`

## Active

- Review how current app structure deviates from workbook structure
- Use `Company` as the reference implementation before propagating the pattern
- Separate structural sections from relationship sections in `Company`

## Pending

- Rework `DataBook` table behavior so tabs switch locally and instantly
- Change `Cards` inside `Table` so it shows card-visible fields in workbook/table form, not literal cards
- Align company `DataBook` tabs with workbook structural nodes
- Decide which workbook labels stay technical and which get friendlier UI labels
- Extend the same model to `Contacts`

## Parked For Later

- Return to Artifact processing and Artifact review flow
- Improve page-mapped markdown and Artifact audit trail
- Standardize selected-state actions across all landing pages
- Finish conforming grid cards and table views across all sections

## Notes

- `Artifact processing` is intentionally parked, not dropped
- current momentum is strongest around:
  - schema alignment
  - `EyeView`
  - `DataBook`
  - section structure

## Update Rule

When we make a meaningful change, do one of:

- move an item from `Active` to `Pending`
- move an item from `Pending` to `Front-Loaded`
- add a short note if a workstream is intentionally parked
