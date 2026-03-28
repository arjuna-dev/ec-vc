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

## Suggested Later Sequence

1. stabilize current prompt behavior
2. resolve the post-verification markdown continuation issue
3. add full-markdown replay / audit tooling or UI
4. compare actual vs ideal intake flow using real test documents
