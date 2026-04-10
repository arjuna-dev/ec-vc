# Securities

## File Identity

- file name: `Securities`
- file guide: `docs/100/Draft/100-Securities.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Securities`
- app-facing label: `Securities`
- canonical owner identity: `Owner`

## Purpose

`Securities` stores the governed security vocabulary used by rounds and related investment files.

It exists to keep security naming explicit and aligned instead of scattered across round fields.

## Glossary

| Term | Meaning |
| --- | --- |
| `Security` | A governed security concept. |
| `Security Type` | The security classification used by rounds. |
| `Knowledge DB` | The controlled vocabulary file for shared options. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Rounds.md`
- `docs/020/Active/020_Glossary_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Securities` as the governed security vocabulary layer.
- Keep security labels aligned with rounds and canon.
- Do not let legacy round-security names drift into current UI language.

## Ownership

- owner: `Owner`
- steward: `Glossary Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Securities` to understand the controlled security vocabulary used across round-related files.

## File Steward

The `File Steward` should validate naming convergence between rounds and the security knowledge DB.

## UX Steward

The `UX Steward` should make security labels readable while preserving canonical meaning.

## Governance

`Securities` is governed by `Owner`, `Glossary Steward`, `File Steward`, and naming convergence rules.

## Provenance / Events

The system should preserve security vocabulary changes, promoted labels, and deprecations.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Securities.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Glossary Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Securities`
- shell rendering path is declared: `yes`, route `/securities`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks security identity, creator, datetime, and event linkage.

### General

Tracks security name and summary.

### KDB

Tracks relationships to `Rounds`, `Opportunities`, and related investment files.

### File Specific

Tracks security-specific taxonomy and governance fields.

## Open Questions

- Which security labels still drift from current canon?
- Which security meanings should be treated as locked glossary truth?
