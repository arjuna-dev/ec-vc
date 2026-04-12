# Markets

## File Identity

- file name: `Markets`
- file guide: `docs/100/Draft/100-Markets.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Markets`
- app-facing label: `Markets`
- canonical owner identity: `Owner`

## Purpose

`Markets` stores the market/industry knowledge layer used by operating and investment files.

It exists to provide a governed knowledge database instead of relying on drifting legacy industry names.

## Glossary

| Term | Meaning |
| --- | --- |
| `Market` | A governed market or industry concept. |
| `Knowledge DB` | A file used as a shared relationship vocabulary layer. |
| `Legacy Naming` | Older names that should not continue to drift into current canon. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/020/Active/020_Glossary_Steward.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Markets` as the current governed market vocabulary layer.
- Prefer current naming over legacy industry wording.
- Keep relationship options and display labels aligned.

## Ownership

- owner: `Owner`
- steward: `Glossary Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Markets` to understand the controlled market vocabulary used across files.

## File Steward

The `File Steward` should validate that current market naming does not drift back into older legacy terms.

## UX Steward

The `UX Steward` should keep market labels human-readable while preserving canon.

## Governance

`Markets` is governed by `Owner`, `Glossary Steward`, `File Steward`, and naming convergence rules.

## Provenance / Events

The system should preserve vocabulary changes, promoted labels, and deprecations of legacy naming.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Markets.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Glossary Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Markets`
- shell rendering path is declared: `yes`, route `/markets`
- events/provenance path is declared: `partial`

## View Fork System

Definition note:

- view forks and subgroups are internal to a file, not separate file rows, unless `System Files` explicitly tracks them as such

### System

Tracks market identity, creator, datetime, and event linkage.

### General

Tracks market name and summary.

### LDB

Tracks relationships to companies, opportunities, funds, and rounds.

### File Specific

Tracks market-specific taxonomy and governance fields.

## Open Questions

- Which legacy industry names still survive in runtime or UI?
- Which market terms should be frozen as glossary truth first?
