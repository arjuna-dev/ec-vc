# File Guides Index

## Purpose

This document is the local map for system file guides in `docs/100`.

It lists which file guides exist, where they live, who governs them, and whether they are active operating truth, draft direction, or archived memory.

This index does not replace `docs/001/Active/001-Files.md`.

`docs/001/Active/001-Files.md` defines the parent rule for what every file guide must contain.

This document tracks the actual file guides that currently exist.

## Navigation Rule

Use this index to answer:

- which file guides exist
- which guides are `Active`, `Draft`, or `Archive`
- whether a guide describes a fully born file, partially born file, or approved direction
- which parent rule governs the guide
- which steward owns the guide

Lifecycle meaning:

- `Active`: current file-guide truth
- `Draft`: approved or working file-guide direction, not fully binding yet
- `Archive`: historical file-guide memory

Birth-status meaning:

- `fully born`: canon, registry, guide, ownership, runtime, shell, and provenance are honestly satisfied
- `partially born`: some birth-chain parts exist, but not all are complete
- `approved direction`: the concept is accepted, but implementation truth is not complete

## Current File Guides

| File | Lifecycle | Birth Status | Guide Path | Parent Rule | Steward | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Files` | `Active` | `partially born` | `docs/100/Active/100-Files.md` | `docs/001/Active/001-Files.md` | `File Steward` | Canonical registry entity and runtime table exist. Full genesis/provenance reconstruction remains `partial`. |
| `System Files` | `Active` | `partially born` | `docs/100/Active/100-System_Files.md` | `docs/001/Active/001-Files.md` | `File Steward` | Canon, registry, sqlite ownership, and shell path exist. Genesis event reconstruction remains `partial`. |
| `BB Shell` | `Draft` | `partially born` | `docs/100/Draft/100-BB_Shell.md` | `docs/001/Active/001-Files.md` | `Design Steward` | Mapped file guide created in prep pass. Runtime table and shell exist; promotion review still pending. |
| `Events` | `Draft` | `partially born` | `docs/100/Draft/100-Events.md` | `docs/001/Active/001-Files.md` | `Provenance Steward` | Mapped file guide created in prep pass. Runtime event surface exists; promotion review still pending. |
| `Users` | `Draft` | `partially born` | `docs/100/Draft/100-Users.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Contacts` | `Draft` | `partially born` | `docs/100/Draft/100-Contacts.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Companies` | `Draft` | `partially born` | `docs/100/Draft/100-Companies.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Opportunities` | `Draft` | `partially born` | `docs/100/Draft/100-Opportunities.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Branch-capable runtime surface exists; promotion review still pending. |
| `Funds` | `Draft` | `partially born` | `docs/100/Draft/100-Funds.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists but is not workspace-visible yet. |
| `Rounds` | `Draft` | `partially born` | `docs/100/Draft/100-Rounds.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists but is not workspace-visible yet. |
| `Projects` | `Draft` | `partially born` | `docs/100/Draft/100-Projects.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Tasks` | `Draft` | `partially born` | `docs/100/Draft/100-Tasks.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Notes` | `Draft` | `partially born` | `docs/100/Draft/100-Notes.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Artifacts` | `Draft` | `partially born` | `docs/100/Draft/100-Artifacts.md` | `docs/001/Active/001-Files.md` | `Provenance Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Intake` | `Draft` | `partially born` | `docs/100/Draft/100-Intake.md` | `docs/001/Active/001-Files.md` | `Provenance Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `User Roles` | `Draft` | `partially born` | `docs/100/Draft/100-User_Roles.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Companion Roles` | `Draft` | `partially born` | `docs/100/Draft/100-Companion_Roles.md` | `docs/001/Active/001-Files.md` | `File Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Markets` | `Draft` | `partially born` | `docs/100/Draft/100-Markets.md` | `docs/001/Active/001-Files.md` | `Glossary Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Securities` | `Draft` | `partially born` | `docs/100/Draft/100-Securities.md` | `docs/001/Active/001-Files.md` | `Glossary Steward` | Mapped file guide created in prep pass. Runtime surface exists; promotion review still pending. |
| `Access Assignments` | `Draft` | `approved direction` | `docs/100/Draft/100-Access_Assignments.md` | `docs/001/Active/001-Files.md` | `File Steward` | Approved future file. Canon, registry, runtime ownership, and shell rendering are not born yet. |

## Promotion Rule

A file guide should move from `Draft` to `Active` only when the honest birth checklist supports the move.

The `File Steward` should confirm:

- canonical JSON structure exists
- `System Files` registry row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- `System` requirement is declared
- `LDB` requirement is declared
- runtime/sqlite ownership is declared
- shell rendering path is declared
- events/provenance path is declared

If any item is `no`, `partial`, or `unclear`, keep the guide in `Draft` unless the `Owner` explicitly accepts the gap as active operating truth.

## New File Guide Pattern

When a new file guide is created:

1. Start it in `docs/100/Draft`.
2. Use the required guide structure from `docs/001/Active/001-Files.md`.
3. Fill the honest file birth checklist.
4. Mark missing birth-chain items as `no`, `partial`, or `unclear`.
5. Add the guide to this index.
6. Promote to `docs/100/Active` only after the `File Steward` confirms the guide is active truth.

## Open Questions

- Should this index eventually be generated from `System Files` records?
- Should `File_Status` in runtime align directly with `Active`, `Draft`, and `Archive`?
- Should each active file require a `100` guide before it appears in main navigation?
