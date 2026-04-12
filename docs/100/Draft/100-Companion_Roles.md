# Companion Roles

## File Identity

- file name: `Companion Roles`
- file guide: `docs/100/Draft/100-Companion_Roles.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Companion_Roles`
- app-facing label: `Companion Roles`
- canonical owner identity: `Owner`

## Purpose

`Companion Roles` stores the role layer for companions and stewards.

It exists to keep companion authority, scope, and contract paths explicit.

## Glossary

| Term | Meaning |
| --- | --- |
| `Companion Role` | A defined companion or steward role. |
| `Contract Path` | The governing document path for the role. |
| `Authority` | What the companion role is allowed to do. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/002/Active/002-Companion_Manual.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Companion Roles` as the governed role layer for companions.
- Keep role name, contract path, and authority meaning aligned.
- Do not let role naming drift from companion manuals and steward docs.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Companion Roles` to understand what companion roles exist and what they are allowed to govern.

## File Steward

The `File Steward` should validate role naming, contract linkage, and role status meaning.

## UX Steward

The `UX Steward` should keep companion role labels and expectations legible to the user.

## Governance

`Companion Roles` is governed by `Owner`, `File Steward`, companion manuals, and steward contracts.

## Provenance / Events

The system should preserve role creation, role contract changes, and role status changes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Companion_Roles.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Companion_Roles`
- shell rendering path is declared: `yes`, route `/companion-roles`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks companion role identity, creator, datetime, and event linkage.

### General

Tracks companion role name and summary.

### LDB

Tracks relationships to `Owner`, companion manuals, steward contracts, and governed files.

### File Specific

Tracks role type, role status, contract path, and companion-specific authority fields.

## Open Questions

- Which companion roles should be promoted first into full active guide truth?
- How should companion-role status align with installed versus planned companions?
