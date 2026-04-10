# Ingestion Reconnect Map

## Purpose

This document exists to keep a clear reconnect trail for `Ingestion` while the file-creation architecture is being cleaned up.

The risk is not only whether ingestion works today.

The risk is:

- cleaning naming
- cleaning file creation
- cleaning visibility/registry logic
- and accidentally disconnecting the ingestion path in the process

So this document answers:

- how ingestion is working today
- where the important reconnect points are
- what must be preserved while architecture changes continue

## Current Runtime Shape

Today, ingestion is split across two related behaviors:

1. artifact ingestion pipeline
2. processed-artifact file surface

These are related, but not yet fully unified.

## Current Entry Path

The current artifact ingest path is:

1. [ArtifactAddDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/ArtifactAddDialog.vue)
   - gathers dropped files
   - checks duplicates
   - either resumes existing artifacts or calls the ingest path
2. [electron-preload.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-preload.js)
   - exposes `artifacts.ingest`
3. [electron-main.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js)
   - handles `artifacts:ingest`
   - calls `ingestArtifactsFromPaths(...)`
4. [artifact-ingestion.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/services/artifact-ingestion.js)
   - performs the actual ingest work

This is the live runtime path for bringing files into the system.

## Current Processed-Artifact Path

The processed-artifact file surface is currently separate:

1. `Artifact Processed` is exposed as the file-facing/canonical name
2. runtime compatibility still maps through older `Artifacts_Processed` backend naming
3. `listProcessedArtifacts()` and `createProcessedArtifact()` currently own that file/table surface
4. the sqlite table still contains:
   - `Processed_Artifact_Name`
   - `Processed_Artifact_Summary`
   - `Original_Artifact_Id`
   - `Created_Files_JSON`

So this surface is already carrying part of the lineage model.

## Important Existing Reconnect Points

These are the key points we must keep track of:

### 1. Original Artifact Link

The current processed-artifact table already stores:

- `Original_Artifact_Id`

That means the system already has a direct path from:

- original artifact
- to processed-artifact / ingestion record

This must be preserved.

### 2. Created Files Lineage

The current processed-artifact table already stores:

- `Created_Files_JSON`

That means the system already has a current placeholder for:

- created downstream file lineage

This is one of the most important reconnect points.

Even if the model changes later, we must keep clear how:

- ingestion record
- created files
- original artifact

stay connected.

### 3. Ingestion Shell

[IngestionShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/IngestionShellPage.vue) and [IngestionShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/IngestionShellDialog.vue) already provide a true shell surface for working with the processed-artifact side.

This must not be lost while file naming and file creation are being cleaned.

### 4. Naming Compatibility Layer

The system is still partly running with a naming split:

- file-facing name:
  - `Artifact Processed`
- runtime/backend compatibility:
  - `Artifacts_Processed`

This is currently acceptable as a compatibility layer, but it must be tracked deliberately until the deeper rename pass is complete.

## What Is Not Yet Clean

The ingestion model is still not fully unified.

Current problems:

- ingest runtime path and processed-artifact file surface are related but not fully collapsed into one architectural story
- `Notes`, `Created Files`, and file-level event relationships are documented more strongly than they are surfaced
- naming still uses a compatibility layer
- the right reconnect rule for `Ingestion -> Files` is not yet fully expressed through the new `Files` architecture

## What Must Be Preserved Going Forward

Any new architecture pass must preserve these truths:

- an original artifact can start ingestion
- one original artifact may have multiple ingestion records
- one ingestion record may have multiple created files
- the original artifact should be able to show related ingestion
- the original artifact should be able to show related created files
- the ingestion record should remain the owner/provenance point for created-file lineage

## Best Next Architectural Direction

The cleanest future direction is:

1. keep the current runtime path working
2. treat `Ingestion` as a real file with a clear contract
3. reconnect `Created Files` through the new `Files` architecture
4. make file creation and ingestion lineage speak the same language

That means:

- `Files` should know what files exist
- `Ingestion` should know which files it created
- the original artifact should know which ingestion runs and files came from it

## Practical Reconnect Checklist

Before changing ingestion naming or file creation again, confirm:

- does artifact ingest still call `artifacts:ingest`?
- does `artifacts:ingest` still call `ingestArtifactsFromPaths(...)`?
- does the processed-artifact file surface still list records?
- does `Original_Artifact_Id` still survive?
- does `Created_Files_JSON` still survive?
- does the ingestion shell still open and load records?
- does the file-facing name still resolve to the runtime compatibility layer?

If any answer becomes `no`, the ingestion path has drifted and must be reconnected before moving on.

## First Stable Ingestion Pass

This reconnect map also owns the current first-pass ingestion target so reconnect work and forward planning stay in one place.

### Objective

Move ingestion from a fragile one-shot extraction flow into a staged, resumable intake workflow that:

- creates a draft first
- surfaces high-value metadata early
- keeps extraction and matching moving in the background
- lets the user resume unfinished work
- avoids duplicate records and bad links

### Why This Matters

We want ingestion to feel:

- dependable
- visible
- resumable
- guided

### Source Docs

Use these as the planning references:

- `docs/001-intake-architecture-plan.md`
- `docs/011-record-architecture-master-plan.md`
- `docs/011-product-reference-guide.md`
- `docs/999-ECS_Workstream_Tracker.md`

Active workbook reference:

- `docs/B10_DOS v260400 vrev.xlsx`

### Scope

This first stable pass should include:

- shared draft ownership
- staged markdown release behavior
- high-value early prompts
- visible draft tracking
- resume behavior
- better interaction between extraction and matching

This first pass should not include:

- database schema changes
- new LLM API-call expansion without explicit approval
- fully autonomous agent behavior

### Target Behavior

The intended flow is:

`File Drop -> Draft Intake -> Early Prompts -> Deep Extraction + Matching -> Review -> Create`

The user should be able to:

1. drop files
2. see a draft created immediately
3. confirm high-value fields early
4. keep processing moving while reviewing
5. reopen the same draft later if needed
6. only create canonical records after final confirmation

### First-Pass Requirements

1. Draft-first ownership
   - dropped files create or reopen a draft
   - draft state survives dialog boundaries
   - unfinished drafts remain resumable
2. Early prompt flow
   - `Document Type`
   - `Sponsor Company`
   - `Related Fund`
   - `Related Round`
   - `Related Contacts`
   - `Website`
3. Staged markdown intake
   - markdown should be released in useful chunks
   - early chunks should reach `Company`, `Opportunity`, and `Contacts` first
   - later chunks should respect already-claimed or verified metadata
4. Draft files surface
   - draft id
   - current stage
   - current message
   - files count
   - released chunks count
   - company / opportunity / contacts status
   - verification status
   - next action
   - resume availability
5. Matching + extraction interaction
   - matching should inform extraction while intake is still active
   - confirmed values should narrow later matching
   - later extraction should stand down on already-owned fields
6. Review source clarity
   - `AI Input`
   - `Human Input`
   - `Existing Record`

### Suggested Implementation Order

1. create shared intake draft state
2. mount draft ownership in `MainLayout`
3. refactor artifact entry flow to create and resume drafts
4. move reusable ingest state out of opportunity-private ownership
5. make `OpportunityCreateDialog` consume shared draft state
6. add the visible `Draft Files` surface
7. add early confirmation prompts
8. improve staged markdown release and ownership tracking
9. tighten resume continuity and post-verification continuation

### Acceptance Criteria

- dropping files creates a visible draft
- unfinished drafts can be resumed reliably
- early prompts appear before full extraction completes
- verifying one field does not make the process feel stalled
- extraction and matching visibly continue after early confirmation
- review surfaces can distinguish AI, human, and existing-record values
- no schema changes are required for this pass

### Risks

- draft state could stay trapped inside one dialog if ownership is not moved high enough
- prompts could become noisy if confidence rules are too loose
- extraction could still feel stalled if post-verification continuation is not reliable
- relationship matching could create duplicate suggestions if ownership and stand-down rules are weak

### Ticket Writing Rule

Future ingestion tickets should stay compact and observable:

- keep the objective singular and clear
- describe the behavior, not just the component names
- separate requirements from implementation suggestions
- make acceptance criteria observable
- say what should not be included so the ticket does not sprawl
- point to the relevant master docs instead of re-explaining the whole architecture every time
