# Tasks

## File Identity

- file name: `Tasks`
- file guide: `docs/100/Archive/100-Tasks.md`
- parent guide: `docs/001/Archive/001-Files.md`
- file class: `L1`
- canonical entity: `Tasks`
- app-facing label: `Tasks`
- canonical owner identity: `Owner`

## Purpose

`Tasks` stores actionable work items tied to project and operating context.

It exists to turn broader file context into trackable execution items with explicit status and ownership.

## Glossary

| Term | Meaning |
| --- | --- |
| `Task` | An actionable work item. |
| `Status` | The current task lifecycle state. |
| `Scope` | The project or workflow context for the task. |

## Referenced Documents

- `docs/001/Archive/001-Files.md`
- `docs/100/Archive/100-Projects.md`
- `docs/020/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Tasks` as the explicit work-item layer.
- Keep task status and project context aligned.
- Do not let tasks stand in for missing project structure.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Tasks` to understand what needs action, where it belongs, and what is blocked or complete.

## File Steward

The `File Steward` should validate task identity, status, scope, and relationship links to projects and notes.

## UX Steward

The `UX Steward` should make task creation fast without hiding project or status meaning.

## Governance

`Tasks` is governed by `Owner`, `File Steward`, project-scope rules, and runtime task-status behavior.

## Provenance / Events

The system should preserve task creation, status changes, assignment changes, and completion history.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Archive/100-Tasks.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Tasks`
- shell rendering path is declared: `yes`, route `/tasks`
- events/provenance path is declared: `partial`

## View Structure

### System

Tracks task identity, creator, datetime, and event linkage.

### General

Tracks task name, summary, and status.

### LDB

Tracks relationships to `Projects`, `Notes`, `Users`, `Contacts`, and `Events`.

### File Specific

Tracks task-specific workflow and execution fields.

## Open Questions

- Which task statuses are truly canonical across the app?
- Which task relationships should be reverse-readable by default?
