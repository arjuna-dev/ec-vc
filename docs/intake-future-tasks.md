# Intake Future Tasks

## Purpose

This file tracks intake issues and follow-up ideas that we want to keep visible while we continue tuning the current workflow.

The goal is to avoid losing important product observations just because they are not the immediate next patch.

## Current Follow-Up Tasks

## 1. Resume Markdown After Document Type Verification

Current issue:

- after verifying `Document Type`, the markdown / intake flow can appear to stop instead of continuing smoothly

Why it matters:

- this breaks trust in the staged intake flow
- users may think the process is frozen
- it weakens the value of early verification prompts

What to investigate later:

- whether the current confirmation gate is blocking too much after the first verified field
- whether extraction should resume immediately after the required currently-pending field is confirmed
- whether the gate should distinguish between `must-confirm-now` and `can-confirm-later`

Desired outcome:

- verifying one currently-requested field should not leave the markdown pipeline feeling stalled

## 2. Full Markdown Replay Audit

Idea:

- generate the full markdown of a file and then compare the actual intake sequence against what would have been the ideal extraction sequence

Why this is valuable:

- it gives us a stronger benchmark than only watching live UI behavior
- we can compare:
  - what metadata appeared first
  - what should have appeared first
  - whether early prompts matched the best available information
  - whether chunk release timing actually helped

What to evaluate:

- whether the first released batch contained the best early-value content
- whether disclaimer removal happened effectively
- whether `Company`, `Opportunity`, and `Contacts` got the best early chunks
- whether later prompts were timely or late
- whether verified metadata actually reduced reprocessing

Desired outcome:

- a repeatable audit method for checking whether the staged intake strategy is working as intended

## 3. Compare Actual vs Ideal Intake Steps

After full markdown replay is available, compare:

- actual prompt order
- actual chunk release order
- actual metadata ownership order
- actual extraction waits / stalls

against:

- ideal prompt order
- ideal chunk order
- ideal lane sequencing
- ideal user interruption points

Desired outcome:

- a practical checklist for tuning the live intake orchestration over time

## 4. Group RAW And MD Versions In One Artifact Box

Idea:

- show the `RAW` and `MD` versions of the same document inside the same artifact box / card instead of making them feel like unrelated separate artifacts

Desired behavior:

- one visual artifact box represents the document
- the box clearly shows which version is `RAW` and which is `MD`
- both versions keep the same base name, with only the `RAW` / `MD` identifier distinguishing them

Why it matters:

- users think of these as the same document at different processing stages
- it reduces clutter in the Artifacts area
- it makes intake progress easier to understand at a glance

What to investigate later:

- whether this should be a pure frontend grouping behavior first
- which existing artifact property should be used to identify `RAW` vs `MD`
- how grouped artifacts should behave in grid view, table view, and properties view

## 5. Clarify Artifact Naming Between RAW And MD

Current observation:

- users expect the `RAW` and `MD` versions to keep the same document name, with only a clear processing-stage label separating them

Desired outcome:

- artifact naming should make the pairing obvious
- users should not need to mentally guess whether two entries are versions of the same document

What to investigate later:

- whether naming should be normalized in display only
- whether the display label should be based on base file name plus a stage badge
- whether the current artifact title / file name split is helping or causing confusion

## 6. Clarify What Artifact Properties "Category" Means

Current issue:

- the `Category` field in `Artifact Properties` is unclear and does not communicate what kind of value the user is expected to see or edit

Why it matters:

- unclear labels create hesitation during manual review
- users cannot tell whether `Category` is a system field, document classification, or business relationship field

What to investigate later:

- what database/source field is currently shown as `Category`
- whether it should be renamed to something clearer like `Classification`, `Artifact Class`, or another explicit label
- whether it should stay visible at all if it is not meaningful to users

Desired outcome:

- Artifact Properties labels should be understandable without internal schema knowledge

## 7. Add Cautious Slide-Intent Review

Current observation:

- artifact review needs a stronger audit trail for where markdown and extracted metadata came from
- however it is dangerous to assume all venture decks use the same slide order or structure

Desired behavior:

- slide titles such as `Disclosures`, `Executive Summary`, or `Contact` should be treated as hints
- those hints should suggest candidate metadata fields with confidence, not force hard mappings
- the review pane should show whether a slide mapping is exact, provisional, or unmapped

Why it matters:

- this is safer than pretending there is one universal deck format
- it makes the audit trail more trustworthy
- it helps users understand why one slide was used for a metadata field and another was not

Reference:

- see `docs/slide-intent-review-spec.md`

## Suggested Later Sequence

1. stabilize current prompt behavior
2. resolve the post-verification markdown continuation issue
3. add full-markdown replay / audit tooling or UI
4. compare actual vs ideal intake flow using real test documents
