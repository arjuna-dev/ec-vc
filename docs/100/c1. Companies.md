# Companies

## File Identity

- file name: `Companies`
- file guide: `docs/100/Archive/100-Companies.md`
- parent guide: `docs/001/Archive/001-Files.md`
- file class: `L1`
- canonical entity: `Companies`
- app-facing label: `Companies`
- canonical owner identity: `Owner`

## Purpose

`Companies` stores company records and operating/company-reference context.

It exists to anchor opportunity, project, artifact, and contact relationships around a coherent company entity.

## Glossary

| Term | Meaning |
| --- | --- |
| `Company` | A tracked company record. |
| `Overview` | The main human-readable company layer. |
| `Incorporation` | Legal and formation details. |
| `Manager / Founder Links` | Relationship surfaces connecting the company to contacts. |

## Referenced Documents

- `docs/001/Archive/001-Files.md`
- `docs/020/020_File_Steward.md`
- `docs/020/020_UX_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Companies` as the company anchor file.
- Keep company identity and relationship surfaces explicit.
- Do not hide legal or relationship meaning behind flat summary fields only.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Companies` to understand which companies exist, how they are summarized, and how they relate to contacts, opportunities, and projects.

## File Steward

The `File Steward` should validate company identity, summary, legal structure, and relationship ownership paths.

## UX Steward

The `UX Steward` should keep company creation and later relationship linking easy to understand.

## Governance

`Companies` is governed by `Owner`, `File Steward`, and company relationship/provenance rules.

## Provenance / Events

The system should preserve company creation, summary changes, incorporation changes, and major relationship changes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Archive/100-Companies.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Companies`
- shell rendering path is declared: `yes`, route `/companies`
- events/provenance path is declared: `partial`

## View Structure

### System

Tracks company identity, creator, datetime, and event linkage.

### General

Tracks company name and summary.

### LDB

Tracks relationships to `Contacts`, `Opportunities`, `Projects`, `Artifacts`, and `Events`.

### File Specific

Tracks incorporation, management, news, updates, and other company-specific sections declared in canon.

## Open Questions

- Which company subsections should be promoted first for the page shell?
- Which company relationships require reciprocal runtime proof first?
