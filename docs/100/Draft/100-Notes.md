# Notes

## File Identity

- file name: `Notes`
- file guide: `docs/100/Draft/100-Notes.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Notes`
- app-facing label: `Notes`
- canonical owner identity: `Owner`

## Purpose

`Notes` stores lightweight written observations, summaries, and working memory tied to files, projects, and records.

It exists to keep note-taking explicit and governable instead of hidden inside summary fields elsewhere.

## Glossary

| Term | Meaning |
| --- | --- |
| `Note` | A written record attached to broader context. |
| `Mini Summary` | The short note preview used in page surfaces. |
| `Context Link` | The relationship connecting the note back to its source file or record. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Projects.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Notes` as a real file, not as an unstructured helper field.
- Keep note context explicit through file or record relationships.
- Do not treat latest-note lists as proof of true KDB linkage.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Notes` to track human-readable context, observations, and lightweight summaries.

## File Steward

The `File Steward` should validate that notes have explicit context meaning and do not drift into fake relationship feeds.

## UX Steward

The `UX Steward` should make it clear when a note is contextual memory versus a structured record in another file.

## Governance

`Notes` is governed by `Owner`, `File Steward`, and relationship/provenance rules.

## Provenance / Events

The system should preserve note creation, note edits, context reassignment, and provenance of attached summaries.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Notes.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `KDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Notes`
- shell rendering path is declared: `yes`, route `/notes`
- events/provenance path is declared: `partial`

## L2 File System

### System

Tracks note identity, creator, datetime, and event linkage.

### General

Tracks note name and summary.

### KDB

Tracks note relationships to source file, source record, projects, tasks, contacts, and events.

### File Specific

Tracks note-specific content and context fields.

## Open Questions

- Which note relationships should be promoted instead of left generic?
- How should notes and page-level note feeds stay honest about true linkage?
