# Users

## File Identity

- file name: `Users`
- file guide: `docs/100/Archive/100-Users.md`
- parent guide: `docs/001/Archive/001-Files.md`
- file class: `File`
- canonical entity: `Users`
- app-facing label: `Users`
- canonical owner identity: `Owner`

## Purpose

`Users` governs access identities linked to contacts.

It exists to control who can access the `Owner` LDB and should stay distinct from `Contacts`, which store the underlying person or entity profile.

## Glossary

| Term | Meaning |
| --- | --- |
| `User` | An access identity. |
| `Contact` | The linked person or entity profile. |
| `Owner LDB` | The Owner's protected local database or workspace. |
| `Access Identity` | The runtime identity used for access and governance. |

## Referenced Documents

- `docs/001/Archive/001-Files.md`
- `docs/100/Archive/100-Access_Assignments.md`
- `docs/020/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Users` as access identities, not as the whole people layer.
- Keep `Users` linked to `Contacts` explicitly.
- Do not flatten access meaning into user existence alone.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Users` to understand who has an access-enabled identity and how that identity links into the local system.

## File Steward

The `File Steward` should keep `Users`, `Contacts`, `Roles`, and future `Access Assignments` from drifting apart.

## UX Steward

The `UX Steward` should make clear that creating a contact is not the same thing as granting user access.

## Governance

`Users` is governed by `Owner`, `File Steward`, access architecture, and future access-assignment rules.

## Provenance / Events

The system should preserve user creation, user-contact linking, status changes, and access-related governance changes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Archive/100-Users.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Users`
- shell rendering path is declared: `yes`, route `/users`
- events/provenance path is declared: `partial`

## View Structure

### System

Tracks user identity, creator, datetime, and event linkage.

### General

Tracks user name and primary email.

### LDB

Tracks relationships to `Owner`, `Contacts`, `Roles`, `Projects`, and future `Access Assignments`.

### File Specific

Tracks access-identity-specific user fields and linked ownership rules.

## Open Questions

- Which user states should be canonical in the long-term access model?
- When should `Users` hand off authority to `Access Assignments` for scoped permissions?
