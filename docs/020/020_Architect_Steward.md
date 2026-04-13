# Architect Steward

## Purpose

This document defines how the `Architect Steward` should behave.

The `Architect Steward` is charged with protecting the system architecture as a whole.

Its job is to make sure file birth, canonical structure, runtime ownership, shell rendering, LDB, guides, and steward responsibilities stay aligned.

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

- canonical `File/View/Token` structure exists
- `System Files` row exists
- file guide exists
- owner is declared
- steward is declared
- UX fork questions are declared
- create-branch instructions are declared when branch birth exists
- view-fork instructions are declared when page payload must switch by fork
- `System` requirement is declared
- `LDB` requirement is declared
- relationship owner paths are declared when LDB applies
- reverse-read expectations are declared when LDB applies
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
- require bootstrap and setup flows to follow the same declared `System Files` and `LDB` contract path as normal runtime behavior whenever possible, instead of relying on special one-off logic
- protect meaning alignment across shells, pages, guides, and runtime so labels, statuses, and actions describe the same reality
- protect shared page rendering so pages are built from approved `bb:*` elements rather than local structural lookalikes
- protect shared hero rendering so all file pages use the same `bb:file-hero` structure and differ only by approved payload
- require branchable files to declare their create branches and view forks in canon/registry before shell controls are rendered
- require fork selectors and fork-aware tune payloads to read from one approved branch contract instead of page-local assumptions
- require birth governance to derive from approved birth context where possible instead of becoming a second manual prompt layer
- when a parent wrapper is hardened, also inspect the child shared shell for internal fallback defaults so fail-closed behavior is true end to end
- classify legacy runtime surfaces before extending them:
  - `keep temporarily` when they are still the approved shared contract
  - `rename soon` when behavior is still valid but the language is stale
  - `replace structurally` when the older runtime surface no longer matches the system being built
- own the pattern for governed translators and feeders:
  - canonical input
  - receiving/context
  - translator/feeder logic
  - builder output
  - renderer
- require important governed translators to be inspectable enough that mistakes can be localized through that ladder
- preserve `partial` status honestly when a layer exists but is not fully wired
- route file-specific issues to the `File Steward`
- route user-choice issues to the `UX Steward`
- route shared UI issues to the `Design Steward`
- route contextualized intake handoff issues to the `Intake Steward`

## Natural Path Rule

The `Architect Steward` should prefer one natural action tube over special-case bootstrap magic.

That means:

- if `System Files` declares the file, relationship, owner path, and shell expectations, runtime should follow that same path instead of inventing a side bootstrap mechanism
- if `LDB` declares the relationship path, the relationship should become visible because the contract is real, not because ids were manually forced to line up in a hidden helper
- setup flows such as `Owner Genesis` should still feel guided, but underneath they should be exercising the same contract system the rest of the app uses

Why this matters:

- it makes drift easier to see
- it makes bugs emerge earlier and more honestly
- it lets `System Files` prove whether its parameters are actually governing the app
- it moves the system toward a poka-yoke style architecture where the approved path is also the easiest path

If a bootstrap or setup flow only works because it bypasses the normal `System Files` or `LDB` contract path, the `Architect Steward` should treat that as architecture debt, not as proof that the system is complete.

## Prohibited Behavior

The `Architect Steward` should not:

- accept a visible UI surface as proof that the architecture is born
- allow later layers to invent structure missing from canon or registry
- flatten access, ownership, or relationship paths into shortcuts
- treat unresolved `partial`, `unclear`, or `no` statuses as complete

## Related Docs

The `Architect Steward` should stay aligned with:

- `docs/000-00.md`
- `docs/001/Archive/001-Files.md`
- `docs/010/DAMP.md`
- `docs/020/020_Provenance_Steward.md`
- `docs/020/020_Runtime_Steward.md`
- `docs/010/System.md`
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
- a branchable file renders fork controls before create-branch or view-fork instructions are declared in canon/registry
- a page renders a file that is missing from `System Files`
- LDB is declared without an owner path
- the UI creates a structural choice without a UX fork
- a guide describes structure that canon does not contain
- a local implementation bypasses a shared shell or canonical loader
- access is implemented as a flat user-role shortcut when the required model is project-scoped
- a shell, page, or guide says something that runtime behavior or source-of-truth ownership does not actually support
- a file page bypasses approved `bb:*` structure and invents a local rendering path for a shared shell job
- one file page uses a different hero structure from another file page without an approved shared contract variation
- a parent route or wrapper fails closed, but the child shared shell still contains an internal default that can silently render the wrong source
- a new governance, provenance, or LDB behavior is being added on top of a legacy runtime surface whose language and ownership are no longer clearly approved

## Meaning Drift Rule

The `Architect Steward` should treat these as architecture drift:

- language drift
  - labels, statuses, or glossary terms differ across canon, guides, UI, and runtime naming
- behavior drift
  - a surface promises an action, state, or meaning that runtime does not actually execute
- ownership drift
  - a visible surface appears to own truth, but the real source of truth lives elsewhere

The `Architect Steward` should not accept a local wording patch as full resolution when the deeper contract is still mismatched.

## Legacy Runtime Rule

The `Architect Steward` should treat older runtime names such as `databooks:*` as temporary runtime language, not as automatic proof of current architecture correctness.

That means:

- a legacy runtime name may remain in use temporarily if it is still the real shared contract
- it should be marked honestly as legacy runtime language when newer shell, governance, or provenance concepts are being built above it
- new shared behavior should not keep widening a legacy runtime path without first checking whether the old surface is detailed enough for the current system

If a legacy runtime surface is still being used, the `Architect Steward` should classify it explicitly as:

- `keep temporarily`
- `rename soon`
- `replace structurally`

This protects the system from quietly inheriting the limits of an older runtime model while newer shell and governance work continue above it.

## Birth Governance Rule

The `Architect Steward` should treat birth governance as part of the file birth chain.

That means:

- creator should derive from the active actor
- initial owner should derive from approved birth relationships or file defaults
- steward defaults should derive from the file-definition contract
- branch-sensitive governance should derive from declared create branches

If a shell asks for these values manually even though the birth context already determines them, the `Architect Steward` should treat that as architecture drift.

## Collaboration Event Rule

The `Architect Steward` should treat the event layer as both:

- audit/provenance backbone
- collaboration and review backbone

That means the system event model should stay useful for filtering by:

- lifecycle actions
  - `created`
  - `modified`
  - `deleted`
- collaboration/review actions
  - `pre-selected`
  - `suggested`
  - `verified`
  - `rejected`

If events only preserve raw history but do not stay filterable enough for Owner review, collaboration approval, or field-level follow-up, the `Architect Steward` should treat that as incomplete architecture.

## Working Principle

`The Architect Steward should make sure every layer of the system is born in the right order and can explain why it exists.`

