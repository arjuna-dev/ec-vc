# Rounds

## File Identity

- file name: `Rounds`
- file guide: `docs/100/Draft/100-Rounds.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Rounds`
- app-facing label: `Rounds`
- canonical owner identity: `Owner`

## Purpose

`Rounds` stores round-specific opportunity branches.

It exists to hold round records as a specialized branch under the broader opportunity model.

## Glossary

| Term | Meaning |
| --- | --- |
| `Round` | A round-specific opportunity record. |
| `Security Type` | The round security classification. |
| `Economics` | The round economic terms layer. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Opportunities.md`
- `docs/100/Draft/100-Securities.md`
- `docs/020/Active/020_File_Steward.md`

## Operating Rules

- Treat `Rounds` as a specialized branch file.
- Preserve separation from `Funds`.
- Keep round economics and control structure explicit.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Rounds` to understand round-specific records and their economics, controls, and security context.

## File Steward

The `File Steward` should validate round structure, branch metadata, and security relationship alignment.

## UX Steward

The `UX Steward` should keep the round path distinct from fund creation and easy to understand.

## Governance

`Rounds` is governed by `Owner`, `File Steward`, branch rules, and round-specific structure contracts.

## Provenance / Events

The system should preserve round creation, security-type changes, valuation changes, and major relationship changes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Rounds.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Rounds`
- shell rendering path is declared: `partial`, route exists in registry but is not workspace-visible
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks round identity, creator, datetime, and event linkage.

### General

Tracks round name and summary.

### KDB

Tracks relationships to opportunities, companies, securities, artifacts, and events.

### File Specific

Tracks round overview, economics, controls, and related round sections.

## Open Questions

- Should `Rounds` become directly visible in workspace navigation later?
- Which round fields should be treated as promoted security relationships first?
