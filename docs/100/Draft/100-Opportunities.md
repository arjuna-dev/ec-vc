# Opportunities

## File Identity

- file name: `Opportunities`
- file guide: `docs/100/Draft/100-Opportunities.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Opportunities`
- app-facing label: `Opportunities`
- canonical owner identity: `Owner`

## Purpose

`Opportunities` stores opportunity records and branching investment context.

It exists to anchor opportunity-level analysis while allowing specialized branches such as `Funds` and `Rounds`.

## Glossary

| Term | Meaning |
| --- | --- |
| `Opportunity` | A tracked investment or business opportunity record. |
| `Branch` | A specialized downstream path, such as `Fund` or `Round`. |
| `Opportunity Type` | The branch selector used at creation. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Funds.md`
- `docs/100/Draft/100-Rounds.md`
- `docs/020/Active/020_File_Steward.md`

## Operating Rules

- Treat `Opportunities` as the shared branch-capable parent file.
- Keep branch type explicit.
- Do not normalize fund or round meaning into the wrong table or shell path.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Opportunities` to understand top-level opportunity records and which branch they belong to.

## File Steward

The `File Steward` should validate branch metadata, opportunity identity, and downstream fund/round separation.

## UX Steward

The `UX Steward` should make the opportunity branch fork clear at creation time.

## Governance

`Opportunities` is governed by `Owner`, `File Steward`, branch metadata rules, and relationship contracts.

## Provenance / Events

The system should preserve opportunity creation, branch choice, status changes, and downstream branch transitions.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Opportunities.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `yes`, branch choice at creation
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Opportunities`
- shell rendering path is declared: `yes`, route `/opportunities`
- events/provenance path is declared: `partial`

## View Structure

### System

Tracks opportunity identity, creator, datetime, and event linkage.

### General

Tracks opportunity name and summary.

### LDB

Tracks relationships to companies, contacts, artifacts, funds, rounds, and events.

### File Specific

Tracks branch metadata, opportunity-kind fields, and opportunity-specific subsections.

## Open Questions

- Which opportunity fields remain shared once branching deepens?
- Which branch transitions should be runtime-proven from creation?
