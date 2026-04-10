# Projects

## File Identity

- file name: `Projects`
- file guide: `docs/100/Draft/100-Projects.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Projects`
- app-facing label: `Projects`
- canonical owner identity: `Owner`

## Purpose

`Projects` stores operational project records and project-scoped work context.

It exists to give tasks, notes, access governance, and future workflow execution a clear project anchor.

## Glossary

| Term | Meaning |
| --- | --- |
| `Project` | A project-scoped operating record. |
| `Scope` | The working context tied to the project. |
| `Stage` | A declared project phase or state. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Access_Assignments.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Projects` as the project anchor file.
- Keep project scope explicit for downstream files and access governance.
- Do not hide project meaning inside task or note records alone.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Projects` to understand active scopes of work and what other files are attached to them.

## File Steward

The `File Steward` should validate project identity, stage ownership, and downstream relationship alignment.

## UX Steward

The `UX Steward` should help the user understand when a new item is a project versus only a task or note.

## Governance

`Projects` is governed by `Owner`, `File Steward`, workflow architecture, and future access-assignment usage.

## Provenance / Events

The system should preserve project creation, stage changes, ownership changes, and major linked-record changes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Projects.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Projects`
- shell rendering path is declared: `yes`, route `/projects`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks project identity, creator, datetime, and event linkage.

### General

Tracks project name and summary.

### KDB

Tracks relationships to `Tasks`, `Notes`, `Contacts`, `Artifacts`, `Users`, and future `Access Assignments`.

### File Specific

Tracks project overview, stages, and project-specific workflow sections.

## Open Questions

- Which project fields should drive access scope first?
- Which project lifecycle events should be standardized across the runtime?
