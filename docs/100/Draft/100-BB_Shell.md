# BB Shell

## File Identity

- file name: `BB Shell`
- file guide: `docs/100/Draft/100-BB_Shell.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Building_Blocks`
- app-facing label: `BB Shell`
- canonical owner identity: `Owner`

## Purpose

`BB Shell` is the governed file surface for shared building blocks.

It exists to define reusable UI primitives, where they are used, how they are built, and how they should be reconstructed without local patch drift.

## Glossary

| Term | Meaning |
| --- | --- |
| `Building Block` | A shared UI primitive or pattern. |
| `Usage` | Where the block belongs and when to use it. |
| `Source` | The component or path that owns the real implementation. |
| `Reconstruction` | The rule for rebuilding the block consistently. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/020/Active/020_Design_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `BB Shell` as the governed surface for shared building blocks.
- Do not create page-local variants when the approved shared block should be corrected.
- Keep block naming, usage, and source ownership aligned.
- Preserve reconstruction rules so the block can be rebuilt without guessing.

## Ownership

- owner: `Owner`
- steward: `Design Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `BB Shell` to understand what shared blocks exist, where they belong, and whether the shared UI system is coherent.

## File Steward

The `File Steward` should verify the block registry, guide, source path, and reconstruction rule stay aligned with runtime usage.

## UX Steward

The `UX Steward` should make sure shared block labels and usage guidance stay clear, reusable, and consistent across pages and shells.

## Governance

`BB Shell` is governed by `Owner`, `Design Steward`, `File Steward`, canonical structure, and shared UI contracts.

## Provenance / Events

The system should preserve when a block guide was created, when source ownership changed, and when a block was promoted, revised, or deprecated.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-BB_Shell.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `Design Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `no`, this file uses explicit custom subsections instead
- runtime/sqlite ownership is declared: `yes`, table `Building_Blocks`
- shell rendering path is declared: `yes`, route `/bb-file`
- events/provenance path is declared: `partial`

## View Fork System

### General

Tracks block name, summary, category, and status.

### Usage

Tracks where the block is used, when to use it, and when to avoid it.

### Anatomy

Tracks required parts and composition.

### Source

Tracks source path, owner, and extraction status.

### Reconstruction

Tracks notes, convergence rule, and prompt.

### Variants

Tracks approved variants.

## Open Questions

- Which BB rows are fully governed versus extracted reference only?
- Which provenance events should prove a shared block was accepted or deprecated?
