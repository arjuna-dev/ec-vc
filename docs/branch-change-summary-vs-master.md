# Branch Change Summary vs `master`

This document summarizes the main changes currently present on `ECS_KDB_Relationship_Pass` compared to `master`.

Purpose:

- give a high-level review surface
- show where the biggest code additions landed
- explain the intention behind those changes
- help reviewers avoid reading low-signal files first

## High-Level Diff

Compared to `master...HEAD`:

- `192 files changed`
- `46,950 insertions`
- `39,230 deletions`
- net change: about `+7,720` lines

This means the branch was a large architecture pass, not a small feature branch.

## Main Intent

The branch mainly pushes the app toward a canon-driven shell system.

The main intentions were:

- move from many one-off pages toward shared shell surfaces
- make file, record, dialog, and fork flows behave like one coherent system
- expand the canonical structure and workbook companion guidance
- build a stronger Building Blocks layer for shared UI composition
- bring ingestion into the same shell and contract architecture
- add backend/runtime ownership so the shared shell direction is actually supported by the data layer

## Largest Added Files

Top files by added lines compared to `master`:

1. `+5096` [001-workbook-schema-companion.json](/c:/Users/erikc/Coding_Repository/ec-vc/docs/001-workbook-schema-companion.json)
2. `+4905` [FilePageShell.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/FilePageShell.vue)
3. `+4418` [canonical-structure.json](/c:/Users/erikc/Coding_Repository/ec-vc/docs/canonical-structure.json)
4. `+2933` [IngestionShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/IngestionShellDialog.vue)
5. `+2833` [AddEditRecordShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditRecordShellDialog.vue)
6. `+2635` [electron-main.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js)
7. `+1942` [RecordShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordShellPage.vue)
8. `+1698` [BuildingBlockPreviewTile.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/BuildingBlockPreviewTile.vue)
9. `+1487` [buildingsBlocks.js](/c:/Users/erikc/Coding_Repository/ec-vc/src/utils/buildingBlocks.js)
10. `+1400` [011-record-architecture-master-plan.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/011-record-architecture-master-plan.md)

## Changes By Area

### 1. Shell Architecture

Main files:

- [FilePageShell.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/FilePageShell.vue)
- [RecordShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordShellPage.vue)
- [AddEditRecordShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditRecordShellDialog.vue)
- [AddEditFileShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditFileShellDialog.vue)
- [DialogShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/DialogShellPage.vue)
- [ForkShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/ForkShellPage.vue)

Intent:

- unify the app around shared shell surfaces
- reduce page-by-page UI drift
- centralize section rendering, KDB behavior, and add/edit flows

### 2. Ingestion

Main files:

- [IngestionShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/IngestionShellDialog.vue)
- [AddEditRecordShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditRecordShellDialog.vue)
- [IngestionShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/IngestionShellPage.vue)
- [ArtifactAddDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/ArtifactAddDialog.vue)

Intent:

- turn ingestion into a real workflow surface
- support staged files, artifact creation, and processing
- tie ingestion more closely to records and opportunities

### 3. Building Blocks

Main files:

- [BuildingBlockPreviewTile.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/BuildingBlockPreviewTile.vue)
- [buildingsBlocks.js](/c:/Users/erikc/Coding_Repository/ec-vc/src/utils/buildingBlocks.js)
- [ComponentsShellPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/ComponentsShellPage.vue)
- [AddEditBbShellWindow.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditBbShellWindow.vue)
- [AddEditBbShell.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditBbShell.vue)
- [BuildingBlockTileHeader.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/BuildingBlockTileHeader.vue)

Intent:

- make Building Blocks a real reusable design-system layer
- improve BB previewing and shared composition
- move shell composition closer to BB-backed structure

### 4. Canon And Docs

Main files:

- [001-workbook-schema-companion.json](/c:/Users/erikc/Coding_Repository/ec-vc/docs/001-workbook-schema-companion.json)
- [canonical-structure.json](/c:/Users/erikc/Coding_Repository/ec-vc/docs/canonical-structure.json)
- [011-record-architecture-master-plan.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/011-record-architecture-master-plan.md)
- [011-product-reference-guide.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/011-product-reference-guide.md)
- [999-ECS_Workstream_Tracker.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/999-ECS_Workstream_Tracker.md)

Intent:

- define the architecture more explicitly
- reduce ambiguity around canon, branches, KDB, subgrouping, and shells
- provide written rules so structure is not inferred ad hoc

### 5. Backend And Runtime

Main files:

- [electron-main.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js)
- [sqlite-schema.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/services/sqlite-schema.js)
- [structureRegistry.js](/c:/Users/erikc/Coding_Repository/ec-vc/src/utils/structureRegistry.js)
- [kdbRelationshipContracts.js](/c:/Users/erikc/Coding_Repository/ec-vc/src/shared/kdbRelationshipContracts.js)

Intent:

- make shared shells runtime-backed instead of partially mocked
- add tables, handlers, bridges, and contracts needed by the shell direction
- keep frontend architecture aligned with real storage/IPC ownership

## Folder-Level Ranking

Approximate share of changed lines by folder:

- `src/pages/` about `40.7%`
- `src/components/` about `29.1%`
- `docs/` about `20.9%`
- `src-electron/` about `3.2%`
- `src/utils/` about `2.9%`
- everything else smaller

## Practical Reading Order For Review

If someone wants to understand the branch without reading everything, the suggested order is:

1. [branch-change-summary-vs-master.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/branch-change-summary-vs-master.md)
2. [011-record-architecture-master-plan.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/011-record-architecture-master-plan.md)
3. [canonical-structure.json](/c:/Users/erikc/Coding_Repository/ec-vc/docs/canonical-structure.json)
4. [FilePageShell.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/FilePageShell.vue)
5. [IngestionShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/IngestionShellDialog.vue)
6. [AddEditRecordShellDialog.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/AddEditRecordShellDialog.vue)
7. [BuildingBlockPreviewTile.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/components/BuildingBlockPreviewTile.vue)
8. [electron-main.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js)

## One-Sentence Summary

This branch is mainly a large architecture pass to move the app toward a canon-driven shell system for files, records, ingestion, and building blocks, with runtime support underneath it.
