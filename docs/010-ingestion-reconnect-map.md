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
