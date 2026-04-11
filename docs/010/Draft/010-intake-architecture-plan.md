# Intake Architecture Master Plan

## Status

This document is now the primary working reference for intake architecture.

It should be treated as the single planning source of truth for:

- intake objectives
- staged extraction behavior
- draft ownership
- review guidance
- execution plan
- progress tracking

When intake decisions change:

- update this file
- avoid creating parallel intake planning docs unless there is a strong reason
- use the tracker here to show what is approved, in progress, and complete

## Objective

Make data entry into the system work as a dependable AI-guided intake workflow rather than a single opaque extraction pass.

That means:

- files should enter the system through a draft-first flow
- high-value information should appear early
- extraction should continue while the user reviews important items
- the system should compare AI suggestions against existing records before creation
- unfinished work should always be resumable
- the user should be able to understand where information came from and why it was used

The goal is not just automation.

The goal is trustworthy intake:

- fast enough to feel responsive
- staged enough to be understandable
- cautious enough to avoid bad links and duplicates
- visible enough that the operator can recover and continue

## Task / Goal Framing

This first intake architecture pass is meant to define the first stable operating model for AI-assisted data entry into the app.

For this phase:

- intake behavior should be frontend-first
- the flow should remain draft-based until the user confirms creation
- orchestration should be controlled and explainable
- review surfaces should expose why suggestions appeared

This does **not** mean the first intake implementation must be the final one.

The intended long-term understanding is:

- `controlled staged orchestration` first
- `smarter adaptive intake behavior` later

In other words:

- right now, we want dependable continuity and visible staged progress
- later, we can make the AI behavior richer and more adaptive once the system is trustworthy

So the current goal is not maximum autonomy.

The current goal is a clear and resilient intake operating system.

## Shared Shell Surface Rule

When intake-related shell surfaces are exposed for testing or convergence, they should use the shared shell chrome consistently.

That means:

- the shared top shell header owns the `L1` select menu
- shell routes should not add a second local selector or launch row when that shared header already exists
- if a page starts reproducing header-level controls locally, that is a shell-drift warning

This matters because repeated local shell controls make it harder to tell whether behavior differences come from:

- the shared shell contract
- the payload contract
- or a one-off page implementation

## Containment Rule

Intake architecture should also stay contained.

Working rule:

- prefer existing approved shell pieces over creating new leaf controls
- do not multiply small intake-only buttons, modes, or helper variants unless explicitly approved
- if a behavior belongs in an approved underlying component, correct that component instead of adding a parallel intake-only primitive
- complexity should come from staged composition and ordered workflow, not from extra local pieces

## Governing Model

The intake flow should follow this structure:

`File Drop -> Draft Intake -> Early Prompts -> Deep Extraction + Matching -> Review -> Create`

More clearly:

- files enter as draft intake items
- the system extracts high-value metadata quickly
- the user confirms or redirects valuable early items while extraction continues
- deeper extraction and relationship matching inform each other
- nothing becomes canonical until the user reviews and confirms creation

## Core Principles

### 1. Draft-First Rule

Dropped files should become drafts before they become canonical records.

Drafts should remain visible until the user:

- completes creation
- discards the draft
- or explicitly leaves it for later

### 2. Early-Value Rule

The system should not wait for full extraction before becoming useful.

High-value metadata should appear first.

Priority fields:

- `Document Type`
- `Sponsor Company`
- `Related Fund`
- `Related Round`
- `Related Contacts`
- `Website`

These matter early because they improve:

- matching
- duplicate avoidance
- relationship narrowing
- downstream extraction quality

### 3. Staged Markdown Rule

Markdown should not be treated as one monolithic final artifact.

It should be released in stages:

- first useful chunks appear early
- early extraction lanes use those chunks immediately
- later chunks continue in the background
- later lanes should respect what earlier lanes already claimed

### 4. Lane Interaction Rule

Deep extraction and relationship matching should overlap and inform each other.

Examples:

- if `Company` becomes likely, opportunity matching should narrow immediately
- if a `Contact` becomes certain, company and opportunity matches should re-rank
- if `Document Type` becomes certain, extraction should prioritize type-relevant fields

The lanes should not work blindly in isolation.

### 5. Ownership And Stand-Down Rule

If a field is already claimed or verified during intake, later extraction lanes should not keep re-reviewing or overwriting it during extraction.

This stand-down rule applies only during extraction.

The user still keeps final edit control before creation.

### 6. Resume Rule

Every unfinished draft should be easy to resume.

That means:

- draft files need a resume action
- unfinished artifact intake needs a resume action
- rows and cards should reopen the real draft instead of inventing a new fallback flow

### 7. Audit Rule

The user should be able to see:

- where information came from
- why it was suggested
- whether it was used
- whether it was verified

The intake system should never feel like a black box.

## Surface Model

The intake experience should use three main surfaces.

### 1. Draft Files Surface

Purpose:

- show all incomplete or in-progress intake items
- make drafts resumable
- expose current stage and blockers

### 2. High-Value Prompt Surface

Purpose:

- confirm one valuable decision at a time
- keep processing moving while the user gives direction

Prompt actions:

- `Confirm`
- `Edit`
- `Skip for now`
- `Open Draft Review`

### 3. Full Review Surface

Purpose:

- review richer extracted data
- compare AI, human, and existing-record sources
- confirm canonical creation

## Input Source Model

Each major review card should eventually support three sources:

- `AI Input`
- `Human Input`
- `Existing Record`

Behavior:

- `AI Input` shows extracted suggestions
- `Human Input` stores operator edits for the current draft
- `Existing Record` shows the best canonical match when one exists

The operator should be able to compare these before clicking `Create`.

## Chunk And Stage Model

Large documents should be handled as staged markdown chunks.

Suggested chunk statuses:

- `raw`
- `normalized`
- `ready_for_early_extraction`
- `owned`
- `ready_for_secondary_extraction`
- `reviewed`

Suggested chunk metadata:

- `chunk_id`
- `artifact_id`
- `source_page_range`
- `markdown_text`
- `stage_status`
- `released_at`
- `used_by`
- `owned_fields`
- `confidence`

## Recommended Extraction Lanes

Early-value lanes:

1. `Company`
2. `Opportunity`
3. `Contacts`

Later-value lanes:

- deeper `Artifacts`
- `Notes`
- `Tasks`
- `Assistant Proposal`
- lower-priority relationship hints
- long-tail metadata

Working rule:

`Company`, `Opportunity`, and `Contacts` should get first access to the best early chunks.

## Review Hint Model

Artifact review should provide cautious hints, not fake certainty.

This is especially true for PDF slide or page review.

The system should be able to show:

- `Slide Number`
- `Slide Title`
- `Markdown Source`
- `Likely Slide Intent`
- `Candidate Metadata Fields`
- `Confidence`
- `Used / Not Used`
- `Target Item Box`

Important rule:

Slide intent is heuristic, not absolute.

Do **not** hard-code universal deck assumptions such as:

- slide 1 always means company
- slide 2 always means legal entity
- slide 3 always means overview

Instead:

- use page numbers, headings, repeated phrases, visible slide titles, and context as hints
- show confidence
- distinguish `exact`, `provisional`, and `unmapped`

## State Ownership Model

The intake state should be shared above individual dialogs.

Shared shell payload relevance:

- as shared intake and create flows grow, shell payload translation should happen once instead of being repeated in page-local launch paths
- the practical long-term benefit is:
  - consistency
  - speed of change
  - lower break risk
  - cleaner action handling at scale

More concretely:

1. Less drift as the app grows

- if many `L1`s, many `L2`s, and many actions all use one payload builder:
  - new entities behave predictably
  - grouped sections behave the same everywhere
  - the app does not keep re-solving the same rendering problem

2. Better performance discipline

- when translation from canon into shell payload happens in one place:
  - that path can be optimized once
  - cached once
  - normalized once
  - and not repeated across multiple shell surfaces

3. Safer action systems

- for edit
- verify
- copy
- relationship actions
- history logging

- one shared payload builder keeps all shells acting on:
  - the same addresses
  - the same field definitions
  - the same ownership and write targets

4. Easier debugging

- with large data systems, centralized payload building lets the team ask:
  - did canon define it wrong
  - did the builder translate it wrong
  - or did the renderer display it wrong

5. Faster future feature work

- later features such as:
  - permissions
  - bulk editing
  - richer verification
  - action logs
  - companion guidance
  - ingestion overlays
  can be attached to one payload contract instead of being retrofitted into many surfaces

6. More trustworthy database-facing behavior

- if shells locally reinterpret structure over time:
  - writes drift
  - reads drift
  - grouping drift appears
  - ownership assumptions drift

- one shared payload builder helps preserve:
  - one read shape
  - one write shape
  - one interaction shape

- at scale, this is not just cleaner code
- it is a more stable operational system with fewer hidden inconsistencies and lower risk that interaction logic collapses under growth

### Shared Owner

Recommended owner:

- `MainLayout.vue`

Why:

- it persists while the user navigates
- it already owns the widget
- it already mounts the main artifact entry flow

### Shared State Module

Recommended path:

- `src/utils/intakeDraftState.js`

Why:

- this codebase does not need a heavier store framework yet
- a lightweight shared reactive module fits the current structure

### Draft State Should Own

- `activeDraftId`
- `drafts`
- `draftOrder`
- `draftFilesById`
- `highValuePrompts`
- `matchingStatus`
- `deepExtractionStatus`
- `selectedSourceBySection`
- `draftUiState`

Each draft should hold:

- dropped files
- ingest status
- draft artifact ids
- AI extracted values
- human edited values
- matched existing records
- confidence values
- unresolved questions
- current intake stage

## Component Ownership Model

### MainLayout

Should own:

- shared draft state lifetime
- widget entry routing
- future draft tray or draft shell

Should not own:

- field-level editing
- extraction details
- section save logic

### ArtifactAddDialog

Should own:

- file drop interaction
- draft creation
- quick staging UI
- opening prompt and review flows

Should stop being the sole source of truth for dropped file state.

### OpportunityCreateDialog

Should own:

- company/opportunity/contact review UI
- source switching
- final create behavior

Should stop privately owning the only draft intelligence.

It should consume and update shared draft state instead.

### Future Consumers

These should eventually be able to consume the same shared draft packet:

- `CompanyCreateDialog`
- `ContactCreateDialog`
- `NoteCreateDialog`
- `ProjectCreateDialog`
- `TaskCreateDialog`

## Golden Metadata Sets

The first extraction pass should focus on the smallest metadata set that most improves matching.

### Companies

- `Company_Name`
- `Website`
- `LinkedIn`
- `One_Liner`
- `Company_Type`
- `Headquarters_City`

### Contacts

- `Name`
- `Professional_Email`
- `Personal_Email`
- `Phone`
- `LinkedIn`

### Rounds

- `Round_Name`
- `Round_Stage`
- `Sponsor Company`
- `Type_of_Security`
- `Investment_Ask`
- `Final_Close_Date`

### Funds

- `Fund_Name`
- `Sponsor Company` / manager
- `Investment_Ask`
- `Final_Close_Date`
- `Raising_Status`

### Artifacts

- `title`
- `document_type`
- `artifact_format`
- `sponsor company`
- `related opportunity`

### Projects

- `Project_Name`
- `Project Owner`
- related opportunity links
- related company links

### Tasks

- `Task_Name`
- `Task Owner`
- related company links
- related opportunity links
- related project links

### Notes

- `Note_Name`
- `Note_Content`

Important note:

Notes are currently metadata-only and should not pretend to persist first-level relationships until that is real in the product and storage layer.

## Matching Model

Matching should happen in passes.

### Pass 1. Exact / Strong Identifiers

- exact company name
- normalized website domain
- exact email
- exact LinkedIn URL
- exact opportunity name

### Pass 2. Strong Contextual Combinations

- company name + tagline
- company name + round stage
- contact name + email domain
- company name + website + location

### Pass 3. Soft Comparison

- approximate name similarity
- signature block clues
- title plus document type plus known linked entities

## Confidence Model

Use three buckets:

- `High confidence`
- `Medium confidence`
- `Low confidence`

Rules:

- `High confidence` can trigger early prompts or preselection
- `Medium confidence` should remain a suggestion
- `Low confidence` should stay in draft details

High confidence should never silently create canonical records without user review.

## Suggested Intake Stages

Recommended stage values:

- `Dropped`
- `Extracting`
- `Matching`
- `Quick Review Needed`
- `Ready for Review`
- `Waiting on Link`
- `Ready to Create`
- `Completed`
- `Failed`

## Execution Plan

### Phase 1. Stabilize Shared Draft Ownership

1. Create `src/utils/intakeDraftState.js`
2. Mount draft ownership in `MainLayout`
3. Make artifact entry create and resume shared drafts

### Phase 2. Surface The Draft Operating Layer

1. Add `Draft Files` surface
2. Show active draft status and resume state
3. Make the tracker a visible operating surface

### Phase 3. Implement Early Prompt Flow

1. Surface the high-value prompt set
2. Allow confirm, edit, skip, and defer
3. Keep extraction moving in the background

### Phase 4. Implement Staged Markdown Release

1. Model released markdown chunks
2. Track used metadata ownership
3. Route early chunks first to `Company`, `Opportunity`, and `Contacts`

### Phase 5. Connect Deep Extraction And Matching

1. Feed confirmed values back into matching while intake is still active
2. Re-rank downstream suggestions as certainty improves
3. Prevent unnecessary repeated review for claimed fields

### Phase 6. Standardize Review Surfaces

1. Add `AI Input` / `Human Input` / `Existing Record` switching
2. Add slide-intent and source audit hints
3. Show used / not used decisions more clearly

### Phase 7. Harden Continuity

1. Make every unfinished draft resumable
2. Prevent draft loss across dialog boundaries
3. Make post-verification continuation dependable

## Short-Term Build Goal

The short-term goal is not advanced automation.

The short-term goal is dependable continuity.

The operator should be able to say:

- "I dropped the files"
- "I can see what is happening"
- "I can confirm important items early"
- "I can resume exactly where I left off"

without losing confidence or context.

## Progress Tracker

### Overall

- [x] Shared intake draft module exists
- [x] MainLayout owns shared draft lifetime
- [x] Artifact entry flow is draft-aware
- [x] Draft Files surface exists
- [ ] High-value prompt flow exists
- [x] Staged markdown chunk model exists
- [x] Used metadata ownership is visible
- [ ] Deep extraction and matching inform each other
- [ ] Review surfaces support AI / Human / Existing Record comparison
- [ ] Slide-intent hints are visible in artifact review
- [ ] Resume behavior is dependable across unfinished intake

### Current Good Foundations

- [x] `MainLayout` already owns the visible draft tray and resume surface
- [x] `ArtifactAddDialog` already reads and updates shared intake draft state
- [x] intake drafts already persist during the session
- [x] released markdown chunks can already be previewed
- [x] used metadata claims can already be shown in review surfaces
- [x] verification can skip and continue instead of blocking everything
- [x] unfinished artifacts can already be resumed from the artifacts area

### Immediate Build Sequence

- [x] create `intakeDraftState.js`
- [x] move artifact staging to shared draft ownership
- [ ] move reusable ingest state out of opportunity-private ownership
- [ ] make `OpportunityCreateDialog` consume shared draft state
- [x] add visible Draft Files surface
- [ ] add early confirmation prompts

## Working Principle

We are not trying to make the intake system feel magical by hiding everything.

We are trying to make it feel dependable by staging the work clearly.

So the practical principle is:

`Use draft-first intake, surface high-value information early, keep extraction and matching interacting, and make unfinished work always resumable.`

## Extraction Efficiency Rule

This intake architecture also owns the extraction-efficiency tuning rules for `autofill-extraction.js`.

### Goal

Increase extraction quality while reducing:

- model confusion
- unnecessary token usage
- repeated retries/fallbacks
- post-extraction manual cleanup

### Scope

This applies to:

- `src-electron/services/autofill-extraction.js`
- the structured output schema used by autofill
- extraction prompt wording and ordering
- extraction status telemetry

If a future extraction improvement requires bridge/sqlite-layer alignment, that work is allowed when it is the correct canonical layer.

### Efficiency Definition

An extraction pass is more efficient when it:

- produces usable structured output in one pass
- needs fewer fallback runs
- maps more fields correctly on first output
- reduces manual edits in review surfaces

Efficiency should also be understood through the point system:

- extraction should favor the shortest path to higher verified score
- best-case extraction is not just faster output
- best-case extraction is the quickest route to the most relevant correct fields and links

### Current Pipeline Baseline

1. build prompt + source-file content
2. stream structured extraction
3. fallback to `generateText` when stream output is missing
4. normalize structured payload
5. run duplicate matching
6. return diagnostics and structured output

### Optimization Rules

1. keep prompt instructions short, explicit, and non-overlapping
2. prioritize high-value fields first
3. avoid asking the model for behavior we do not persist yet
4. keep schema strict and avoid ambiguous optional blocks
5. add status logs for every important stage so failures are visible
6. tune extraction toward the shortest high-score path, not just the broadest field coverage

Scoring rule for optimization:

- favor fields that unlock identity, authority, provenance, and parent linkage first
- favor outputs that reduce downstream review work
- do not spend extraction effort equally on low-value extras when higher-value anchors are still missing
- use the point system as the guide for the best next extraction target

### Prompt Tuning Strategy

When tuning prompt text:

1. change one logical block at a time
2. run the same file set before and after
3. compare:
   - extracted entity counts
   - key field coverage
   - fallback frequency
   - duplicate match quality
4. keep only changes that improve at least one metric without regressions

### High-Value Field Priority

For each entity, prioritize these first:

- `Company`: `Company_Name`, `Website`, `Company_Type`
- `Contact`: `Name`, `Professional_Email`, `Personal_Email`
- `Round`: `Round_Name`, `Security_Type`, `Round_Target_Size`
- `Fund`: `Fund_Name`, `Fund_Target_Size`, `Fund_Manager`
- `Opportunity`: identity and stage-defining fields first

Secondary fields should not dilute identity extraction quality.

### Test Loop

Use a fixed test set of representative files:

- clean PDF
- noisy PDF
- docx with mixed entities
- image-heavy file
- ambiguous multi-company file

For each iteration:

1. run extraction on the same set
2. save outputs and diagnostics
3. compare to previous run
4. record wins and regressions

### Change Log Template

For each tuning pass:

- `Date`
- `Change summary`
- `Why`
- `Expected effect`
- `Observed effect`
- `Keep or revert`

### Active Backlog

- [ ] Trim prompt lines that duplicate schema constraints.
- [ ] Separate hard constraints from quality hints.
- [ ] Improve source reference consistency (`source_refs`, `field_sources`).
- [ ] Reduce fallback rate by improving stream stability.
- [ ] Add a compact benchmark report for each run.

### Guardrails

- do not modify DB schema files in this phase
- do not add expensive multi-call extraction loops in this phase
- do not ship prompt changes without running the fixed test loop
## Add/Edit Shell Naming Rule

`Add/Edit Record Shell` and intake-linked shell flows must follow the same naming contract as the other shared shells:

- the current shared dialog shell is `Add/Edit Record Shell`
- `Add/Edit File Shell` is a separate reserved shell name for future file-level work
- do not use `Add/Edit Shell` as an ambiguous label when the record shell is intended

- route keys are for shell navigation
- canonical entity names are for structural ownership
- databook table names are for IPC/database actions

If intake or Add/Edit flows perform shared-shell updates, they must normalize to databook table names before calling databook or verification IPC actions.
