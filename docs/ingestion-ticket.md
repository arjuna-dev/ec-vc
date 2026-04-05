# Ingestion Ticket

## Ticket Writing Reference

Use this section as the reference for how tickets in this repo should be written.

A good ticket should include:

- a clear title
- one concrete objective
- why the work matters
- the source documents or references
- what is in scope
- what is out of scope
- the intended behavior
- the required implementation pieces
- a suggested execution order
- acceptance criteria
- risks or known failure modes

Good ticket-writing rules:

- keep the objective singular and clear
- describe the behavior, not just the component names
- separate requirements from implementation suggestions
- make acceptance criteria observable
- say what should not be included so the ticket does not sprawl
- use the current product language:
  - `File`
  - `Record`
  - `Record View`
  - `Workbook`
- point to the relevant master docs instead of re-explaining the whole architecture every time

Simple ticket template:

1. `Title`
2. `Objective`
3. `Why This Matters`
4. `Source Docs`
5. `Scope`
6. `Target Behavior`
7. `Requirements`
8. `Suggested Implementation Order`
9. `Acceptance Criteria`
10. `Risks`
11. `Notes`

## Title

Build the first dependable draft-first ingestion flow for AI-assisted data entry.

## Objective

Move ingestion from a fragile one-shot extraction flow into a staged, resumable intake workflow that:

- creates a draft first
- surfaces high-value metadata early
- keeps extraction and matching moving in the background
- lets the user resume unfinished work
- avoids duplicate records and bad links

## Why This Matters

Right now ingestion has useful pieces, but it still feels too easy to lose context, stall after verification, or hide what the system is doing.

We want ingestion to feel:

- dependable
- visible
- resumable
- guided

## Source Docs

Use these as the planning references:

- `docs/intake-architecture-master-plan.md`
- `docs/record-architecture-master-plan.md`
- `docs/product-reference-guide.md`
- `docs/ECS_Workstream_Tracker.md`

Active workbook reference:

- `docs/B10_DOS v260400 vrev.xlsx`

## Scope

This ticket is for the first stable ingestion pass.

Include:

- shared draft ownership
- staged markdown release behavior
- high-value early prompts
- visible draft tracking
- resume behavior
- better interaction between extraction and matching

Do not include:

- database schema changes
- new LLM API-call expansion without explicit approval
- fully autonomous agent behavior

## Target Behavior

The intended flow is:

`File Drop -> Draft Intake -> Early Prompts -> Deep Extraction + Matching -> Review -> Create`

The user should be able to:

1. drop files
2. see a draft created immediately
3. confirm high-value fields early
4. keep processing moving while reviewing
5. reopen the same draft later if needed
6. only create canonical records after final confirmation

## Requirements

### 1. Draft-First Ownership

- dropped files create or reopen a draft
- draft state survives dialog boundaries
- unfinished drafts remain resumable

### 2. Early Prompt Flow

Prompt early for:

- `Document Type`
- `Sponsor Company`
- `Related Fund`
- `Related Round`
- `Related Contacts`
- `Website`

Each prompt should support:

- `Confirm`
- `Edit`
- `Skip for now`
- `Open Draft Review`

### 3. Staged Markdown Intake

- markdown should be released in useful chunks
- early chunks should reach `Company`, `Opportunity`, and `Contacts` first
- later chunks should respect already-claimed or verified metadata

### 4. Draft Files Surface

Add or improve a visible draft surface that shows:

- draft id
- current stage
- current message
- files count
- released chunks count
- company / opportunity / contacts status
- verification status
- next action
- resume availability

### 5. Matching + Extraction Interaction

- matching should inform extraction while intake is still active
- confirmed values should narrow later matching
- later extraction should stand down on already-owned fields

### 6. Review Source Clarity

Review surfaces should support:

- `AI Input`
- `Human Input`
- `Existing Record`

The user should be able to compare these before create.

## Suggested Implementation Order

1. Create shared intake draft state
   Suggested path: `src/utils/intakeDraftState.js`
2. Mount draft ownership in `MainLayout`
3. Refactor artifact entry flow to create and resume drafts
4. Move reusable ingest state out of opportunity-private ownership
5. Make `OpportunityCreateDialog` consume shared draft state
6. Add the visible `Draft Files` surface
7. Add early confirmation prompts
8. Improve staged markdown release and ownership tracking
9. Tighten resume continuity and post-verification continuation

## Acceptance Criteria

- dropping files creates a visible draft
- unfinished drafts can be resumed reliably
- early prompts appear before full extraction completes
- verifying one field does not make the process feel stalled
- extraction and matching visibly continue after early confirmation
- review surfaces can distinguish AI, human, and existing-record values
- no schema changes are required for this pass

## Risks

- draft state could stay trapped inside one dialog if ownership is not moved high enough
- prompts could become noisy if confidence rules are too loose
- extraction could still feel stalled if post-verification continuation is not reliable
- relationship matching could create duplicate suggestions if ownership and stand-down rules are weak

## Notes

- keep this first pass frontend-first
- optimize for continuity before optimization or autonomy
- prioritize trust and resumability over cleverness
