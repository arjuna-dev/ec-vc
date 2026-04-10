# Artifact Processed

## File Identity

- file name: `Artifact Processed`
- file guide: `docs/100/Draft/100-Artifact_Processed.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Artifact_Processed`
- app-facing label: `Artifact Processed`
- canonical owner identity: `Owner`

## Purpose

`Artifact Processed` stores processed artifact outputs and ingestion-stage derivatives.

It exists to keep post-processing structure, extraction products, and reconnectable lineage explicit.

## Glossary

| Term | Meaning |
| --- | --- |
| `Processed Artifact` | A processed or downstream artifact record. |
| `Ingestion` | The processing path that produces downstream structured outputs. |
| `Lineage` | The connection back to the original artifact and created files. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Artifacts.md`
- `docs/010/Draft/010-ingestion-reconnect-guide.md`
- `docs/020/Active/020_Provenance_Steward.md`

## Operating Rules

- Treat `Artifact Processed` as the governed downstream artifact layer.
- Keep lineage to the original artifact explicit.
- Do not treat processing outputs as disconnected from provenance.

## Ownership

- owner: `Owner`
- steward: `Provenance Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Artifact Processed` to understand downstream extraction outputs and how they connect back to original artifacts.

## File Steward

The `File Steward` should validate processed-artifact structure, lineage, and reconnectability.

## UX Steward

The `UX Steward` should make processed-artifact status and lineage legible without hiding provenance.

## Governance

`Artifact Processed` is governed by `Owner`, `Provenance Steward`, `File Steward`, and ingestion/reconnect rules.

## Provenance / Events

The system should preserve processing creation, stage changes, source artifact linkage, and downstream created-file linkage.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Artifact_Processed.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Provenance Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Artifacts_Processed`
- shell rendering path is declared: `yes`, route `/ingestion`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks processed-artifact identity, creator, datetime, and event linkage.

### General

Tracks processed-artifact name and summary.

### KDB

Tracks relationships to original artifacts, created files, opportunities, and events.

### File Specific

Tracks ingestion-stage outputs, processed content fields, and reconnectability metadata.

## Open Questions

- Which processed-artifact fields should be treated as canon-first output surfaces?
- Which lineage paths should be runtime-proven first for reconnectability?
