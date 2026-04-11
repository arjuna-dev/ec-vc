# Intake

## File Identity

- file name: `Intake`
- file guide: `docs/100/Draft/100-Intake.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Intake`
- app-facing label: `Intake`
- canonical owner identity: `Owner`

## Purpose

`Intake` stores processed artifact outputs and intake-stage derivatives.

It exists to keep post-processing structure, extraction products, and reconnectable lineage explicit.

## Glossary

| Term | Meaning |
| --- | --- |
| `Intake` | The governed intake record that holds processed or downstream artifact outputs. |
| `Intake Workflow` | The processing path that produces downstream structured outputs. |
| `Lineage` | The connection back to the original artifact and created files. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Artifacts.md`
- `docs/010/Draft/010-ingestion-reconnect-guide.md`
- `docs/020/Active/020_Provenance_Steward.md`

## Operating Rules

- Treat `Intake` as the governed downstream artifact layer.
- Keep lineage to the original artifact explicit.
- Do not treat processing outputs as disconnected from provenance.

## Ownership

- owner: `Owner`
- steward: `Provenance Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Intake` to understand downstream extraction outputs and how they connect back to original artifacts.

## File Steward

The `File Steward` should validate intake structure, lineage, and reconnectability.

## UX Steward

The `UX Steward` should make intake status and lineage legible without hiding provenance.

## Governance

`Intake` is governed by `Owner`, `Provenance Steward`, `File Steward`, and intake/reconnect rules.

## Provenance / Events

The system should preserve processing creation, stage changes, source artifact linkage, and downstream created-file linkage.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Intake.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Provenance Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Intake`
- shell rendering path is declared: `yes`, route `/intake`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks intake identity, creator, datetime, and event linkage.

### General

Tracks intake name and summary.

### KDB

Tracks relationships to original artifacts, created files, opportunities, and events.

### File Specific

Tracks intake-stage outputs, processed content fields, and reconnectability metadata.

## Open Questions

- Which intake fields should be treated as canon-first output surfaces?
- Which lineage paths should be runtime-proven first for reconnectability?
