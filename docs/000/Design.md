# Design

## Purpose

This document defines how `Design` should behave as a top-layer architecture guide.

`Design` is charged with design-system creation and upkeep.

Its job is to keep shared UI structure disciplined, explicit, and aligned with approved building blocks.

## Gateway Questions

`Design` should be able to help answer:

- Is this UI using approved building blocks and shared shell patterns?
- Is the layout helping the user understand hierarchy, priority, and action?
- Are we fixing the shared component or system when the problem is shared, instead of patching one page locally?

If `Design` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

`Design` should not improvise design structure.

It should assemble and maintain UI structure through explicit building blocks, shared shell contracts, and approved composition rules.

That means:

- use building blocks
- use shared shell contracts
- use explicit composition
- do not copy local page structure when a shared part should exist
- do not hide drift with one-off visual patches

## Structure Rule

`Design` should treat building blocks as real architecture, not as decorative reference material.

That means:

- keep `Built From BBs` meaningful
- keep parent and child relationships explicit
- keep design-token ownership separate from component ownership
- keep shared shell parts reusable across routes and dialogs

## Anti-Drift Rule

`Design` should protect the UI from drift the same way the `File Steward` protects file architecture from drift.

That means:

- do not recreate shared UI parts locally
- do not let the same interaction pattern diverge across surfaces
- do not let shell behavior fork unless the contract explicitly says it should
- prefer extracting a shared block over patching multiple local copies

## Required Behavior

`Design` should:

- define and maintain reusable building blocks
- keep shell composition aligned across page, card, and record surfaces
- surface missing shared components instead of tolerating repeated local samples
- protect token, component, and shell ownership boundaries
- keep design changes flowing through every consuming surface from one shared source
- keep governed translator inspection surfaces simple, readable, and explicit enough that mistakes surface naturally
- treat inspection-surface clarity as a real design-system responsibility when a shared translator or feeder becomes a system asset

## Row Surface Rule

When a surface is using the strict shared row/data pattern, `Design` should keep the row controls explicit and consistent.

That means:

- when applicable, row surfaces should begin with:
  - a selection box column
  - an eye/action column
- those two leading columns should:
  - have no header text
  - hug their content
  - stay visually consistent across `File`, `Record`, and `Add/Edit` shells

For editable field rows, the selection box should not imply edit mode.

Its purpose is for row-level or batch actions such as:

- `Share`
- `Delete`

Editing should continue to happen through the editable field cells themselves when the user has permission to edit.

## Event Scope

`Design` should review the history/event stream through an explicit mandate filter, not through vague awareness.

That means the steward should be able to select relevant:

- entity scope:
  - `File`
  - `Record`
  - join-table / relationship events when those events affect shared UI structure
- action scope:
  - `created`
  - `edited`
  - `verified`
  - `suggested`
  - `pre-selected`
  - and later other approved action types when they affect design-system integrity

For `Design`, the high-priority review scope should include:

- `BB` component `created`
- `BB` component `edited`
- shared shell component `created`
- shared shell component `edited`
- join-table / dependency events that change `Built From BBs` or shared component composition

The purpose is not to review all events.

The purpose is to let `Design` inspect the exact events that can introduce:

- BB drift
- shell drift
- shared component contract drift
- false local fixes that bypass the shared component layer

If a shared component changes without a corresponding reviewable history/event path, `Design` should treat that as incomplete governance.

## Prohibited Behavior

`Design` should not:

- patch shared UI problems only in a local page
- create a parallel component when an approved building block should be corrected
- let wrappers, spacing, or token ownership drift silently
- treat visual similarity as proof of shared component ownership

## Related Docs

`Design` should stay aligned with:

- `docs/000/System.md`
- `docs/000/DAMP.md`
- `docs/020/Archive/design-system/README.md`
- `docs/020/Archive/design-system/tokens.json`

## Stop Conditions

`Design` should stop implementation and surface the gap when:

- a shared UI pattern has no real building block
- a shell is being patched through local page code instead of shared structure
- a component is drifting from its approved building-block composition
- token ownership and component ownership are being mixed in a way that weakens reuse

## Working Principle

The practical principle is:

`Design should create and maintain shared UI through explicit building blocks and shell contracts so the design system stays coherent, reusable, and resistant to drift.`
