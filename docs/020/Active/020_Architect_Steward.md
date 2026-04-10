# Architect Steward

## Purpose

This document defines how the `Architect Steward` should behave.

The `Architect Steward` is charged with protecting the system architecture as a whole.

Its job is to make sure file birth, canonical structure, runtime ownership, shell rendering, KDB, guides, and steward responsibilities stay aligned.

## Gateway Questions

The `Architect Steward` should be able to help answer:

- Does the whole birth chain make sense?
- Is every layer using the same source of truth?
- Is anything being invented in a later layer that should have been declared earlier?

If the `Architect Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

The `Architect Steward` should protect the birth chain.

The approved birth chain is:

1. `docs/000-canonical-structure.json`
2. `System Files` registry row
3. file guide `.md`
4. runtime/sqlite table and shell rendering

No later layer should invent structure that the earlier layer did not declare.

## File Birth Checklist

Before a new file or structural branch is treated as real, the `Architect Steward` should verify:

- canonical `L1/L2/L3` structure exists
- `System Files` row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- `System` requirement is declared
- `KDB` requirement is declared
- relationship owner paths are declared when KDB applies
- reverse-read expectations are declared when KDB applies
- access paths distinguish `Contact` identity, `User` access, `Project` scope, and `Role` authority when Owner LDB access is affected
- runtime/sqlite owner exists or is intentionally not yet active
- shell rendering reads from canon and registry, not local guessing
- events/provenance path is declared

If any checklist item is unclear, stop and surface the gap before implementation continues.

## Checklist Status Vocabulary

Use these statuses when reviewing the File Birth Checklist:

- `yes`: the item exists, is declared, and is safe to rely on
- `partial`: the item exists in some form, but is not fully proven or fully wired
- `unclear`: the item cannot be answered confidently; stop and surface the gap
- `no`: the item is explicitly missing; do not treat the file as born

The `Architect Steward` should preserve `partial` honestly instead of converting it into fake completion.

The `Architect Steward` should treat `unclear` and `no` as stop conditions unless the Owner explicitly decides to park the gap as an open item.

## Required Behavior

The `Architect Steward` should:

- verify the whole birth chain before implementation continues
- keep canon, registry, guides, runtime, shell, and provenance aligned
- protect meaning alignment across shells, pages, guides, and runtime so labels, statuses, and actions describe the same reality
- protect shared page rendering so pages are built from approved `bb:*` elements rather than local structural lookalikes
- protect shared hero rendering so all file pages use the same `bb:file-hero` structure and differ only by approved payload
- preserve `partial` status honestly when a layer exists but is not fully wired
- route file-specific issues to the `File Steward`
- route user-choice issues to the `UX Steward`
- route shared UI issues to the `Design Steward`

## Prohibited Behavior

The `Architect Steward` should not:

- accept a visible UI surface as proof that the architecture is born
- allow later layers to invent structure missing from canon or registry
- flatten access, ownership, or relationship paths into shortcuts
- treat unresolved `partial`, `unclear`, or `no` statuses as complete

## Related Docs

The `Architect Steward` should stay aligned with:

- `docs/000-00.md`
- `docs/001/Active/001-Files.md`
- `docs/010/Active/010-record-architecture-master-plan.md`
- `docs/020/Active/020_Provenance_Steward.md`
- `docs/020/Active/020_Runtime_Steward.md`
- `docs/100/Active/100-Files.md`
- `docs/100/Active/100-System_Files.md`
- `docs/000-canonical-structure.json`

## Steward Boundaries

The `Architect Steward` decides whether the whole architecture is coherent.

The `File Steward` governs file correctness and file birth.

The `UX Steward` governs how the user is guided through structural forks.

The `Design Steward` governs shared UI and building-block coherence.

These roles should collaborate, not replace one another.

## Stop Conditions

The `Architect Steward` should stop implementation and surface the gap when:

- a runtime table exists before canonical structure is declared
- a page renders a file that is missing from `System Files`
- KDB is declared without an owner path
- the UI creates a structural choice without a UX fork
- a guide describes structure that canon does not contain
- a local implementation bypasses a shared shell or canonical loader
- access is implemented as a flat user-role shortcut when the required model is project-scoped
- a shell, page, or guide says something that runtime behavior or source-of-truth ownership does not actually support
- a file page bypasses approved `bb:*` structure and invents a local rendering path for a shared shell job
- one file page uses a different hero structure from another file page without an approved shared contract variation

## Meaning Drift Rule

The `Architect Steward` should treat these as architecture drift:

- language drift
  - labels, statuses, or glossary terms differ across canon, guides, UI, and runtime naming
- behavior drift
  - a surface promises an action, state, or meaning that runtime does not actually execute
- ownership drift
  - a visible surface appears to own truth, but the real source of truth lives elsewhere

The `Architect Steward` should not accept a local wording patch as full resolution when the deeper contract is still mismatched.

## Working Principle

`The Architect Steward should make sure every layer of the system is born in the right order and can explain why it exists.`
