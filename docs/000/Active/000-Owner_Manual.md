# Owner Manual

## Purpose

This manual is the Owner-facing guidebook for the system. It should help the Owner pause, re-orient, and find the correct layer quickly, the way a clear pause menu helps a player understand what is real right now.

This document is meant to stay human-readable while also acting as a memory extension for the system.

## Operating Model (Current Direction)

The system now follows a strict contract model:

- `System Files` defines the file universe.
- Each file owns its own tokens and views via `Defined_Structure`.
- Shared LDB relationships are derived from the `System Files` file universe.
- Shells render from the explicit file-owned structure contract, not from legacy scaffolding.

This manual exists to keep that contract understandable for the Owner and easy to enforce.

## Why These Docs Are Required

Without them, the system drifts into remembered exceptions and partial architecture.

With them, the system can state clearly:

- what a file is
- how it is born
- who governs it
- what contracts it must satisfy
- what events prove it was created correctly

That makes file birth and governance stable.

## Why System Files Matters

`System Files` is not just a registry. It is the live file-definition surface and the source of truth for file structure:

- file identity and guide
- ownership and stewardship
- fork mode and view fork instructions
- file-owned `Defined_Structure` (views + tokens)

`System Files` is the gatekeeper for whether a file is accepted as real or remains draft/hidden.

## Shared LDB (Relationships)

The shared LDB layer is derived from the file universe declared in `System Files`.

This means:

- every file can relate to every other file by default
- file-specific relationship fields live inside that file's token list
- there is no separate LDB registry path or fallback

## Events / Provenance Rule

Events must remain useful for audit and reconstruction. The Owner should be able to filter:

- what was created
- what was modified
- what was deleted
- what was pre-selected by context
- what was suggested or verified

This keeps provenance usable for audit, review, and governance.

## File Guides (One per File)

Each file should have a guide `.md` and it should be visible from:

- `System Files` as the file-guide column
- `Add/Edit File Shell` next to the file box title

This keeps guidance local, easy to reach, and directly tied to the file’s declared contract.

## Owner Index (Pause Menu)

### 1. Core System

- `System Files` (file universe + structure contract)
- `Events` (provenance and audit)
- `Files` (registry entity behind System Files)

### 2. Architecture

- Record Architecture (File -> Card -> Record View)
- Intake Architecture
- Bootstrap / Genesis
- Field Classification

### 3. Governance

- `File Steward` (file creation + structure integrity)
- `Architect Steward` (contract enforcement)
- `Design Steward` (UI system integrity)
- `Companion` (behavior and manual)

### 4. Relationship System

- Shared LDB contract
- Relationship governance and audit
- `Reverse Read`
  - how relationships show from both sides
- `Promoted vs Generic`
  - dedicated join table versus shared `LDB_Relationships`

### 5. Genesis

- `Owner Genesis`
  - what should be created first
- `Genesis Companion / Steward Manifest`
  - which helpers come first
  - what they depend on
- `Events / Provenance Rule Sheet`
  - how genesis can be reconstructed later

### 6. File Guides

- each file should eventually have its own guide
- those guides should explain:
  - what the file is
  - what it stores
  - what rules govern it
  - what it depends on
  - how it relates to other files

### 7. How To Use This Manual

When the Owner is confused, this manual should help answer:

1. what system am I in?
2. what file am I looking at?
3. what governs this file?
4. what is supposed to happen next?
5. which guide or steward should I open?

## First Memory-Extension Set

These are the first missing memory-extension docs the system likely needs:

1. `File Definition Schema`
2. `Bootstrap Sequence Manifest`
3. `File Governance Matrix`
4. `LDB_Orchestrator`
