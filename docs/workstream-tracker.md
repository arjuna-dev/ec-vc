# Workstream Tracker

## Purpose

Keep a short list of:

- front-loaded work
- active work
- parked follow-ups

This is meant to reduce context loss while we move between product, schema, and UI tasks.

## Front-Loaded

- Resume `Artifact Intake` as an active guided workflow
- Keep the intake tracker visible so drafts can always be resumed
- Stabilize the review loop so verified inputs stay verified and review can be skipped when needed
- Keep document preview, artifact preview, and artifact share paths aligned with the numbered workspace files
- Preserve workbook/schema alignment work without letting intake lose momentum

## Active

- Artifact processing recovery and continuity
- Intake draft resume flow from `Artifacts` cards and `Draft Files`
- Verification dialog behavior and staged review UX
- Visible document preview during staged markdown intake
- Tracker-driven restart point for `Company`, `Opportunity`, and `Contacts` first-pass extraction

## Pending

- Rework `DataBook` table behavior so tabs switch locally and instantly
- Change `Cards` inside `Table` so it shows card-visible fields in workbook/table form, not literal cards
- Align company `DataBook` tabs with workbook structural nodes
- Decide which workbook labels stay technical and which get friendlier UI labels
- Extend the same model to `Contacts`
- Build a clearer intake tracker surface that shows stage, blockers, and next action per draft
- Add a consistent resume affordance in both card and table views for unfinished artifacts
- Define role ownership for intake stages under the new `Roles` / `Avatar` direction

## Parked For Later

- Improve page-mapped markdown and Artifact audit trail
- Standardize selected-state actions across all landing pages
- Finish conforming grid cards and table views across all sections

## Notes

- As of March 30, 2026, `Artifact processing` is active again
- recent intake recovery work already completed:
  - legacy workspace path normalization for preview/share/autofill
  - document preview cards restored in the intake flow
  - verification dialog can skip and expand verified info
  - unfinished artifacts now expose direct resume affordances
- current shared goal:
  - get the intake tracker and processing window reliable enough that a user never loses their place
- schema alignment work is still important, but intake continuity is the active operational thread

## Update Rule

When we make a meaningful change, do one of:

- move an item from `Active` to `Pending`
- move an item from `Pending` to `Front-Loaded`
- add a short note if a workstream is intentionally parked or intentionally reactivated
