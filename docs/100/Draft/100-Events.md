# Events

## File Identity

- file name: `Events`
- file guide: `docs/100/Draft/100-Events.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Events`
- app-facing label: `Events`
- canonical owner identity: `Owner`

## Purpose

`Events` is the file that records change history and operational provenance across the system.

It exists to help reconstruct what happened, when it happened, and who or what caused it.

## Glossary

| Term | Meaning |
| --- | --- |
| `Event` | A logged system change or action. |
| `Action` | The operation or intent tied to the event. |
| `Edited By` | The actor who caused the event. |
| `Payload` | Extra context preserved with the event. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/020/Active/020_Provenance_Steward.md`
- `docs/020/Active/020_Runtime_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Use `Events` as the system provenance surface.
- Do not treat silent runtime changes as acceptable when they should produce reconstructable events.
- Keep event fields aligned with runtime audit behavior.

## Ownership

- owner: `Owner`
- steward: `Provenance Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Events` to understand system activity, recent changes, and whether history is reconstructable.

## File Steward

The `File Steward` should verify event rows reflect real change paths and stay aligned with runtime audit writing.

## UX Steward

The `UX Steward` should keep event meaning legible so users can tell what changed without needing runtime vocabulary.

## Governance

`Events` is governed by `Owner`, `Provenance Steward`, `Runtime Steward`, and canonical/runtime audit contracts.

## Provenance / Events

`Events` is itself part of the provenance layer. It should preserve actor, datetime, table, record, field, action, and payload context.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Events.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Provenance Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `events`
- shell rendering path is declared: `yes`, route `/events`
- events/provenance path is declared: `yes`, this file is the provenance surface

## L2 File System

### System

Tracks event identity, actor, timestamp, and event linkage.

### General

Tracks the human-readable event summary and status.

### KDB

Tracks event relationships back to source file, source record, actor, and related workflow context.

### File Specific

Tracks table name, record id, field name, action id, action label, old value, new value, and payload.

## Open Questions

- Which file-birth events should be required for every new accepted file?
- Which event labels should be standardized across shared runtime update paths?
