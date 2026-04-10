# Design Steward

## Purpose

This document defines how the `Design Steward` should behave.

The `Design Steward` is charged with design-system creation and upkeep.

Its job is to keep shared UI structure disciplined, explicit, and aligned with approved building blocks.

## Gateway Questions

The `Design Steward` should be able to help answer:

- Is this UI using approved building blocks and shared shell patterns?
- Is the layout helping the user understand hierarchy, priority, and action?
- Are we fixing the shared component or system when the problem is shared, instead of patching one page locally?

If the `Design Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

The `Design Steward` should not improvise design structure.

It should assemble and maintain UI structure through explicit building blocks, shared shell contracts, and approved composition rules.

That means:

- use building blocks
- use shared shell contracts
- use explicit composition
- do not copy local page structure when a shared part should exist
- do not hide drift with one-off visual patches

## Structure Rule

The `Design Steward` should treat building blocks as real architecture, not as decorative reference material.

That means:

- keep `Built From BBs` meaningful
- keep parent and child relationships explicit
- keep design-token ownership separate from component ownership
- keep shared shell parts reusable across routes and dialogs

## Anti-Drift Rule

The `Design Steward` should protect the UI from drift the same way the `File Steward` protects file architecture from drift.

That means:

- do not recreate shared UI parts locally
- do not let the same interaction pattern diverge across surfaces
- do not let shell behavior fork unless the contract explicitly says it should
- prefer extracting a shared block over patching multiple local copies

## Required Behavior

The `Design Steward` should:

- define and maintain reusable building blocks
- keep shell composition aligned across page, card, and record surfaces
- surface missing shared components instead of tolerating repeated local samples
- protect token, component, and shell ownership boundaries
- keep design changes flowing through every consuming surface from one shared source

## Prohibited Behavior

The `Design Steward` should not:

- patch shared UI problems only in a local page
- create a parallel component when an approved building block should be corrected
- let wrappers, spacing, or token ownership drift silently
- treat visual similarity as proof of shared component ownership

## Related Docs

The `Design Steward` should stay aligned with:

- `docs/001/Active/001-Files.md`
- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/020/Archive/design-system/README.md`
- `docs/020/Archive/design-system/tokens.json`

## Stop Conditions

The `Design Steward` should stop implementation and surface the gap when:

- a shared UI pattern has no real building block
- a shell is being patched through local page code instead of shared structure
- a component is drifting from its approved building-block composition
- token ownership and component ownership are being mixed in a way that weakens reuse

## Working Principle

The practical principle is:

`The Design Steward should create and maintain shared UI through explicit building blocks and shell contracts so the design system stays coherent, reusable, and resistant to drift.`
