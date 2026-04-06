# Extraction Efficiency Playbook

This document is the working guide for making `autofill-extraction.js` more efficient over time.

## Goal

Increase extraction quality while reducing:

- model confusion
- unnecessary token usage
- repeated retries/fallbacks
- post-extraction manual cleanup

## Scope

This playbook applies to:

- `src-electron/services/autofill-extraction.js`
- the structured output schema used by autofill
- extraction prompt wording and ordering
- extraction status telemetry

This does **not** change DB structure.

## Efficiency Definition

An extraction pass is more efficient when it:

- produces usable structured output in one pass
- needs fewer fallback runs
- maps more fields correctly on first output
- reduces manual edits in review surfaces

Efficiency should also be understood through the point system.

That means:

- extraction should favor the shortest path to higher verified score
- best-case extraction is not just "faster output"
- best-case extraction is the quickest route to the most relevant correct fields and links

This is similar to a maze-optimization rule:

- do not reward wandering
- do not reward low-value detours
- reward the path that reaches the highest-value structurally relevant result sooner

So when tuning for speed and accuracy, the target is:

- shortest path
- to highest relevant score
- with correctness preserved

## Current Pipeline (Baseline)

1. Build prompt + source-file content.
2. Stream structured extraction.
3. Fallback to `generateText` when stream output is missing.
4. Normalize structured payload.
5. Run duplicate matching.
6. Return diagnostics and structured output.

## Optimization Rules

1. Keep prompt instructions short, explicit, and non-overlapping.
2. Prioritize high-value fields first (identity + relationship anchors).
3. Avoid asking the model for behavior we do not persist yet.
4. Keep schema strict; avoid ambiguous optional blocks.
5. Add status logs for every important stage so failures are visible.
6. Tune extraction toward the shortest high-score path, not just the broadest field coverage.

Scoring rule for optimization:

- favor fields that unlock identity, authority, provenance, and parent linkage first
- favor outputs that reduce downstream review work
- do not spend extraction effort equally on low-value extras when higher-value anchors are still missing
- use the point system as the guide for "best next extraction target"

## Prompt Tuning Strategy

When tuning prompt text:

1. Change one logical block at a time.
2. Run the same file set before/after.
3. Compare:
   - extracted entity counts
   - key field coverage
   - fallback frequency
   - duplicate match quality
4. Keep only changes that improve at least one metric without regressions.

## High-Value Field Priority

For each entity, prioritize these first:

- `Company`: `Company_Name`, `Website`, `Company_Type`
- `Contact`: `Name`, `Professional_Email`, `Personal_Email`
- `Round`: `Round_Name`, `Round_Security_Type`, `Round_Target_Size`
- `Fund`: `Fund_Name`, `Fund_Target_Size`, `Fund_Manager`
- `Opportunity`: identity and stage-defining fields first

Secondary fields should not dilute identity extraction quality.

Working interpretation:

- if two possible next extraction targets compete, prefer the one with the higher likely realized score
- if two targets score similarly, prefer the one with the shorter path to verification
- the best extraction path is the path that reaches the highest-value verified structure fastest

## Test Loop

Use a fixed test set of representative files:

- clean PDF
- noisy PDF
- docx with mixed entities
- image-heavy file
- ambiguous multi-company file

For each iteration:

1. Run extraction on the same set.
2. Save outputs + diagnostics.
3. Compare to previous run.
4. Record wins/regressions.

## Change Log Template

For each tuning pass:

- **Date**
- **Change summary**
- **Why**
- **Expected effect**
- **Observed effect**
- **Keep or revert**

## Active Backlog

- [ ] Trim prompt lines that duplicate schema constraints.
- [ ] Separate hard constraints from quality hints.
- [ ] Improve source reference consistency (`source_refs`, `field_sources`).
- [ ] Reduce fallback rate by improving stream stability.
- [ ] Add a compact benchmark report for each run.

## Guardrails

- Do not modify DB schema files.
- Do not add expensive multi-call extraction loops in this phase.
- Do not ship prompt changes without running the fixed test loop.

