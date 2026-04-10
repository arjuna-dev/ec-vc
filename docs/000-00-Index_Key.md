# Index Key

## Purpose

This document defines the numbering convention used by the human operator and companion agents when reading the docs folder.

It exists so docs appear in a meaningful order and so both human and AI collaborators understand why a document sits where it sits.

## Guiding Question

This document should help answer:

- Where does this document belong in the operating order?
- Is this document a root reference, architecture layer, rulebook, role, or tracker?
- Should this document be read before or after the file currently being edited?

If those questions are unclear, stop and clarify the document's role before renaming or reorganizing it.

## Numbering Convention

### `000`

Root references and primitives.

Use for documents that sit above normal architecture layers and may be needed by almost everything else.

Examples:

- canonical structure
- language glossary
- runtime reference
- owner manual
- companion manual

### `001`

Top-level architecture and governance.

Use for the first architecture layer: parent guides, system file guides, and core bootstrap structure.

Examples:

- Files
- System Files
- L1 bootstrap
- intake architecture

### `010` to `099`

Second-layer architecture, rulebooks, and operating systems under the top-level architecture layer.

Use for deeper planning documents and rulebooks that guide how the `001` architecture is applied.

Examples:

- game rulebook
- record architecture master plan
- product reference guide

### `100` to `199`

Companion roles, stewards, and operating agents.

Use for documents that define how a role thinks, checks, guides, or governs.

Examples:

- Architect Steward
- File Steward
- UX Steward
- Design Steward
- Game Master
- Intake Assistant

### `999`

Current workstream tracking.

Use for active direction, current priorities, and temporary coordination notes that should appear last.

## Working Rule

The number is not decoration.

It tells us the document's operating layer.

When a document feels hard to place, that is a signal that its purpose may need to be clarified before the file is renamed.
