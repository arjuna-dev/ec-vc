# Access Assignments

## File Identity

- file name: `Access Assignments`
- file guide: `docs/100/Archive/100-Access_Assignments.md`
- parent guide: `docs/010/DAMP.md`
- file class: `File`
- canonical entity: `Access_Assignments`
- app-facing label: `Access Assignments`
- canonical owner identity: `Owner`

## Purpose

`Access Assignments` is the future canonical file for scoped access to the `Owner` LDB.

It exists to define who can access which project or workspace scope, under which role, with which limits, and with what provenance.

This file should prevent access from being hidden inside a flat user-role helper table.

The clean model is:

`Contact + Project + Role -> access rights / capabilities`

That means:

- `Contacts` store the person or entity profile
- `Users` govern whether a linked contact can access the `Owner` LDB
- `Projects` provide access scope
- `Roles` provide permission or behavior authority
- `Access Assignments` govern the actual scoped access rule

## Glossary

| Term | Meaning |
| --- | --- |
| `Access Assignment` | A scoped access rule connecting a user/contact, a project or scope, a role, status, and limits. |
| `Owner LDB` | The Owner's protected local database or workspace. |
| `Contact` | The person or entity profile. A contact may exist without being access-enabled. |
| `User` | The access identity linked to a contact. |
| `Project` | The scope where access applies. |
| `Role` | The permission, authority, or behavior role being granted inside the scope. |
| `Project x Role` | The dynamic permission rule that evaluates project scope and role together. |
| `Access Status` | Whether access is active, pending, suspended, revoked, expired, or another approved state. |
| `Access Limits` | Explicit restrictions on what the user may see, edit, create, export, or administer. |

## Referenced Documents

- `docs/010/DAMP.md`
- `docs/002/002-Companion_Manual.md`
- `docs/020/020_Architect_Steward.md`
- `docs/020/020_File_Steward.md`
- `docs/020/020_UX_Steward.md`
- `docs/020/020_Provenance_Steward.md`
- `docs/020/020_Runtime_Steward.md`
- `docs/010/Game_of.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Access Assignments` as the approved future standalone file for governed access.
- Do not treat a flat `Users_Roles` assignment as the final access model when project scope matters.
- Do not infer access from user status alone.
- Do not infer access from contact existence alone.
- Do not grant, revoke, or display project-scoped access without an explicit assignment path.
- Do not implement runtime permission behavior until the file birth chain is complete.
- Use this guide to define the file before adding canonical JSON, registry rows, sqlite ownership, or shell rendering.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`
- edit rule: owner-governed and steward-validated

The `Owner` has final authority over who can access the local database or workspace.

The `File Steward` validates that access assignments are born through explicit canon, owner paths, and provenance.

The `Architect Steward` validates that access does not drift across `Contacts`, `Users`, `Projects`, and `Roles`.

## Owner

The `Owner` should use `Access Assignments` to understand:

- who can access the Owner LDB
- which contact/user identity receives the access
- which project or scope the access applies to
- which role defines the access authority
- whether access is active, pending, revoked, expired, or limited
- who granted or changed the access
- what events prove the access history

## File Steward

The `File Steward` should validate:

- whether `Access Assignments` has canonical file/view/token structure before runtime use
- whether every access record has a linked `User` or access-enabled `Contact`
- whether every scoped access record declares the relevant `Project` or scope
- whether every scoped access record declares the relevant `Role`
- whether access lifecycle fields are present
- whether grant, change, revoke, and expiration events can be reconstructed
- whether `Users_Roles` is acting only as an approved backing/helper path or has become legacy drift

The `File Steward` should stop if access is being inferred from loose user-role state rather than a declared assignment.

## UX Steward

The `UX Steward` should make access assignment choices understandable without asking the user to think in architecture terms.

The first user-facing fork should ask:

`Who should receive access, and where should that access apply?`

The UX should guide the user through:

- selecting the contact or user
- selecting the project or scope
- selecting the role
- selecting status
- declaring limits when needed
- confirming whether the assignment is ready to activate

Safe default:

- new access assignments should begin as inactive, pending, or unverified until the Owner confirms activation

Stop condition:

- if the user cannot identify the person/contact, the project/scope, or the role, do not create active access

## Governance

`Access Assignments` is governed by:

- `Owner`
- `Files.md`
- `File Steward`
- `Architect Steward`
- `UX Steward`
- canonical structure
- events/provenance rules

This file should exist immediately after `Projects` in the creation sequence because it depends on:

- `Contacts`
- `Users`
- `Roles`
- `Projects`

## Provenance / Events

The system should be able to reconstruct:

- when access was requested
- who granted access
- who received access
- which contact/user identity was linked
- which project or scope was affected
- which role was assigned
- when access changed
- when access was revoked
- when access expired
- which event proves the current access state

Access should not be treated as settled truth without an event/provenance path.

## File Birth Checklist

For `Access Assignments`, the current checklist is:

- canonical JSON structure exists: `no`, approved future entity `Access_Assignments`
- `System Files` registry row exists: `no`
- file guide exists: `yes`, `docs/100/Archive/100-Access_Assignments.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `yes`, this guide defines the first access fork
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `no`
- shell rendering path is declared: `no`
- events/provenance path is declared: `partial`, required by this guide but not runtime-proven

This means `Access Assignments` is architecturally approved but not fully born.

Do not implement access behavior from this file until the missing birth-chain items are completed.

## View Structure

### System

The `System` section should track:

- access assignment id
- creator
- datetime
- event log linkage
- granted by
- granted at
- revoked by
- revoked at
- expiration date
- current status source

### General

The `General` section should track:

- access assignment name
- summary
- status
- short explanation of why the access exists

### LDB

The `LDB` section should track relationships to:

- `Owner`
- `Users`
- `Contacts`
- `Projects`
- `Roles`
- `Events`

These relationships should be declared deliberately.

They should not be discovered by guessing from nearby user, contact, project, or role fields.

### Access Scope

The `Access Scope` section should track:

- user/contact receiving access
- project or scope
- role
- owner LDB scope
- access status

### Access Lifecycle

The `Access Lifecycle` section should track:

- requested status
- approved status
- active status
- revoked status
- expired status
- granted by
- granted at
- revoked by
- revoked at
- access review date

### Access Limits

The `Access Limits` section should track:

- view limits
- edit limits
- create limits
- export limits
- admin limits
- project-specific exceptions
- notes explaining non-standard limits

## Open Questions

- Should `Users_Roles` remain as a runtime helper, be absorbed by `Access_Assignments`, or become legacy?
- Should an `Access Steward` become active when `Access_Assignments` moves from approved direction to runtime-backed implementation?
- What exact access statuses should be canonical?
- Which access limits should be first-class fields versus freeform notes?
- Should access assignment activation require explicit Owner confirmation every time?
- What shell view should make access auditing easiest for the Owner?
