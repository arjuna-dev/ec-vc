# Intake State Ownership Map

## Goal

Define where draft intake state should live in the current frontend so we can implement the intake orchestration spec without scattering state across unrelated dialogs.

This document is based on the current code structure.

## Current Frontend Reality

The widget flow currently splits intake behavior across three levels:

### 1. Shell-level widget owner

Current owner:

- [MainLayout.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/layouts/MainLayout.vue)

Current role:

- owns the quick widget,
- routes widget actions,
- directly mounts [ArtifactAddDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/ArtifactAddDialog.vue),
- dispatches global open events for other create dialogs.

Important observation:

- `MainLayout` is the only persistent cross-app owner in the current widget flow.
- That makes it the best place to host shared intake state for in-progress drafts.

### 2. Artifact staging dialog

Current owner:

- [ArtifactAddDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/ArtifactAddDialog.vue)

Current role:

- stages dropped files,
- asks for opportunity selection,
- launches [OpportunityCreateDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/OpportunityCreateDialog.vue),
- currently treats intake mostly as "drop files, then attach to opportunity."

Important observation:

- this is the natural UI entry point for draft intake,
- but it is too narrow to own the full intake lifecycle by itself.

### 3. Opportunity ingest dialog

Current owner:

- [OpportunityCreateDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/OpportunityCreateDialog.vue)

Current role:

- already contains the richest intake logic,
- performs artifact ingest,
- tracks ingest status per file,
- calls autofill preview,
- stores extracted company/contact/opportunity draft values,
- tracks draft artifact ids,
- applies suggested values and company match hints.

Important observation:

- this component already behaves like a draft intake engine,
- but its state is private to the opportunity dialog,
- so other dialogs cannot reuse the same draft intelligence.

## Main Problem

Draft intake state is currently trapped inside the opportunity creation experience, while widget-driven intake begins one level higher in artifact staging.

That creates three product issues:

- draft state is not reusable across dialogs,
- the user has no shared `Draft Files` experience,
- high-value prompts cannot outlive a single open dialog flow.

## Recommended Ownership Model

Use a shared shell-level intake owner with dialog-level consumers.

### Shared owner

Recommended owner:

- `MainLayout`

Reason:

- it persists while the user navigates,
- it already owns the widget,
- it already owns the global artifact entry dialog,
- it can keep draft state alive while dialogs open, close, and switch.

### Shared state container

Recommended implementation:

- add a dedicated frontend module for shared intake draft state

Suggested path:

- `src/utils/intakeDraftState.js`

Alternative:

- `src/models/intakeDraftState.js`

Why:

- the repo does not currently use Pinia or a formal store,
- there is no existing `composables` or `stores` layer,
- a lightweight shared reactive module fits the current codebase better than introducing a whole state library right now.

## Recommended State Shape

The shared intake module should own:

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
- file ingest status
- draft artifact ids
- AI extracted values
- human edited values
- matched existing records
- confidence values
- unresolved questions
- current intake stage

## Ownership By Component

### MainLayout

Should own:

- opening and closing the draft intake shell,
- persistent shared draft state lifetime,
- widget action routing into draft-aware dialogs,
- future `Draft Files` tray or floating panel.

Should not own:

- extraction details,
- field-level editing logic,
- section-specific save logic.

### ArtifactAddDialog

Should own:

- file drop interaction,
- draft creation from dropped files,
- quick file staging UI,
- opening high-value prompt flow,
- opening full review dialogs from a draft.

Should stop owning:

- isolated local-only dropped file state as the source of truth.

Instead:

- it should read and write the active draft from shared intake state.

### OpportunityCreateDialog

Should own:

- opportunity/company/contact card editing UI,
- section-level `AI Input` / `Human Input` / `Existing Record` switching,
- save-to-canonical behavior when the user clicks create.

Should stop owning exclusively:

- private ingest lifecycle state,
- private dropped-file state,
- private draft artifact tracking as the only source of truth.

Instead:

- it should consume a selected draft from shared state,
- render draft-derived values,
- push user edits back into shared draft state until create is confirmed.

### Future dialog consumers

These dialogs should eventually be able to consume the same shared draft packet:

- `CompanyCreateDialog`
- `ContactCreateDialog`
- `NoteCreateDialog`
- `PipelineCreateDialog`
- `TaskCreateDialog`

That is the main reason to move draft state above the opportunity dialog.

## Recommended UI Structure

### Layer 1: Draft Files shell

Best location:

- mounted near the widget flow in `MainLayout`

Purpose:

- always-visible or easily reopenable draft queue,
- list all incomplete draft intake items,
- allow resuming or discarding a draft.

### Layer 2: High-value prompt surface

Best initial location:

- opened from `ArtifactAddDialog`

Purpose:

- confirm `Document Type`,
- confirm `Sponsor Company`,
- confirm `Related Fund`,
- confirm `Related Rounds`,
- confirm `Related Contacts`,
- confirm `Website`

Behavior:

- should read/write shared draft state,
- should remain valid even if the user closes and reopens the main dialog.

### Layer 3: Full review dialogs

Best initial consumer:

- `OpportunityCreateDialog`

Purpose:

- review the richer extracted payload,
- switch between AI, human, and existing record sources,
- finalize canonical creation.

## Recommended Refactor Sequence

### Step 1

Create the shared intake draft module.

Do not change product behavior yet.

Goal:

- move state shape into one place first.

### Step 2

Refactor `ArtifactAddDialog` to create and update shared drafts instead of only local dropped file state.

Goal:

- make file staging draft-aware.

### Step 3

Move reusable ingest fields from `OpportunityCreateDialog` into shared draft state:

- dropped files
- ingest status rows
- draft artifact ids
- AI extracted payload
- matched record hints
- unresolved questions

Goal:

- let the draft survive dialog boundaries.

### Step 4

Make `OpportunityCreateDialog` read from and write to the active shared draft.

Goal:

- preserve the existing UI while changing the source of truth.

### Step 5

Add `Draft Files` UI in `MainLayout` or a mounted shell component.

Goal:

- let users resume in-progress intake.

### Step 6

Add high-value prompt dialogs tied to the active draft.

Goal:

- let the user confirm valuable information while extraction continues.

## Practical Recommendation

For this codebase, the best next implementation step is:

1. create `src/utils/intakeDraftState.js`,
2. mount draft ownership in `MainLayout`,
3. make `ArtifactAddDialog` create and resume drafts,
4. then refactor `OpportunityCreateDialog` to consume that shared draft.

This keeps the architecture aligned with the current app shell and avoids introducing a bigger store framework before we need it.
