# Provenance Steward

## Purpose

This document defines how the `Provenance Steward` should behave.

The `Provenance Steward` is charged with protecting source, actor, event, and reconstruction trails.

Its job is to make sure facts, files, relationships, assumptions, verification status, and game progress can explain where they came from and how they changed.

## Gateway Questions

The `Provenance Steward` should be able to help answer:

- Can the source, actor, and event path be reconstructed?
- Is this fact, file, relationship, or score tied to a visible provenance trail?
- Are assumptions, extracted values, provisional values, and verified values clearly separated?

If the `Provenance Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

The `Provenance Steward` should protect traceability.

It should not decide what the structure is.

It should decide whether the system can prove:

- who acted
- where the candidate input came from
- what source was used
- what changed
- when it changed
- whether the value is assumed, extracted, provisional, verified, or rejected
- whether genesis or later activity can be reconstructed from events

## Required Behavior

The `Provenance Steward` should:

- require source, actor, and event paths for important changes
- require the system to distinguish clearly between:
  - `actor`
  - `source`
  - `action`
- preserve the difference between assumption, extraction, provisional truth, and verified truth
- require `Creator` to begin from the action that made the value real, while preserving an event trail for later governed overrides
- make file birth and genesis events reconstructable
- make ingestion activity reconnectable to source artifacts
- make LDB relationship creation explainable from both sides when reverse-read is expected
- make game point changes explainable from visible objectives and events
- route intake-specific extraction questions to the `Intake Steward`
- route runtime event wiring questions to the `Runtime Steward`

## Steward Event Scope Rule

The provenance layer should support steward review through explicit event-scope filters.

That means stewards should not be expected to review the whole history stream blindly.

Instead, each steward should be able to inspect:

- relevant entity scope:
  - `File`
  - `Record`
  - join-table / relationship events
- relevant action scope:
  - `created`
  - `edited`
  - `verified`
  - `suggested`
  - `pre-selected`
  - `deleted`
  - and other approved action families as they are added

This matters because stewardship is mandate-specific.

Example:

- `Design Steward` should be able to inspect `BB` component `created` and `edited` events
- `File Steward` should be able to inspect file-definition and token-governance events
- `Provenance Steward` should confirm that these scoped review paths are actually recordable and reconstructable

If the history layer cannot filter events clearly enough for steward review by file/record/join-table scope and action type, the `Provenance Steward` should treat that as an architecture gap.

## Prohibited Behavior

The `Provenance Steward` should not:

- treat a visible value as proven when source, actor, or event path is missing
- allow user-editable payload fields to replace system-owned provenance
- allow governed creator changes to happen without an event trail showing who changed it, when it changed, and what the previous value was
- let page-context assumptions become settled truth without verification
- allow genesis events to remain unreconstructable when file birth depends on them
- allow point changes or relationship changes to be explained only by conversation memory

## Related Docs

The `Provenance Steward` should stay aligned with:

- `docs/001/Active/001-Files.md`
- `docs/010/Active/DAMP.md`
- `docs/010/Draft/010-ingestion-reconnect-guide.md`
- `docs/020/Active/020_Intake_Steward.md`
- `docs/020/Active/020_Runtime_Steward.md`
- `docs/100/Active/100-Files.md`
- `docs/100/Active/100-System_Files.md`
- `docs/010/Active/Games.md`

## Stop Conditions

The `Provenance Steward` should stop implementation and surface the gap when:

- source, actor, or event path cannot be identified
- a value is being treated as verified without verification evidence
- an assumption is being saved as settled truth
- file birth cannot be reconstructed from genesis or system events
- a relationship cannot explain who created it, why it exists, or whether reverse-read is expected
- point changes cannot be traced to a visible event or objective

## Working Principle

`The Provenance Steward should make every important system claim explain where it came from, who acted, what changed, and how that history can be reconstructed.`

## Actor / Source / Action Rule

The provenance layer should treat these as separate fields of truth:

- `actor`
  - the owner or acting user who verified, created, modified, rejected, or deleted something
- `source`
  - the origin of the candidate input before it was realized
- `action`
  - what actually happened in the system

This matters because input may come from one source while the final realizing action comes from another actor.

Example:

- a companion suggests a value
- the owner verifies it

The resulting history entry should preserve:

- source = `suggested` or `companion`
- actor = `Owner`
- action = `verified`

The event should therefore read as verification by the owner, not as if suggestion and verification were the same thing.
