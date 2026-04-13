# User Roles

## File Identity

- file name: `User Roles`
- file guide: `docs/100/Archive/100-User_Roles.md`
- parent guide: `docs/001/Archive/001-Files.md`
- file class: `File`
- canonical entity: `Roles`
- app-facing label: `User Roles`
- canonical owner identity: `Owner`

## Purpose

`User Roles` stores the role layer used for governed user access and behavior.

It exists to keep permission/authority roles explicit instead of implied through flat labels in other files.

## Glossary

| Term | Meaning |
| --- | --- |
| `Role` | A permission or authority role. |
| `Access Role` | A role used to determine access behavior. |
| `Project x Role` | The scoped access rule combining project context and role authority. |

## Referenced Documents

- `docs/001/Archive/001-Files.md`
- `docs/100/Archive/100-Users.md`
- `docs/100/Archive/100-Access_Assignments.md`
- `docs/020/020_File_Steward.md`

## Operating Rules

- Treat `User Roles` as a real governed file.
- Do not flatten access behavior into ad hoc text labels elsewhere.
- Keep role meaning aligned with access and project scope rules.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `User Roles` to understand which authority patterns exist in the local system.

## File Steward

The `File Steward` should validate role naming, role meaning, and the relationship between roles and scoped access.

## UX Steward

The `UX Steward` should keep role selection understandable without leaking architecture jargon.

## Governance

`User Roles` is governed by `Owner`, `File Steward`, access architecture, and naming/glossary rules.

## Provenance / Events

The system should preserve role creation, role changes, and when a role becomes active in scoped access.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Archive/100-User_Roles.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Roles`
- shell rendering path is declared: `yes`, route `/user-roles`
- events/provenance path is declared: `partial`

## View Structure

### System

Tracks role identity, creator, datetime, and event linkage.

### General

Tracks role name and summary.

### LDB

Tracks relationships to `Users`, `Contacts`, `Projects`, and future `Access Assignments`.

### File Specific

Tracks role-specific behavior, access meaning, and governance notes.

## Open Questions

- Which roles are truly canonical versus transitional?
- When should role changes create explicit access revalidation events?
