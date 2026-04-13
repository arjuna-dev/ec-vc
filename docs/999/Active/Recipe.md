# Recipe

## Purpose

This document is the living recipe for a possible future clean birth or end-state migration pass.

It exists so current convergence work can preserve only the patterns we have actually tested and want to carry forward.

This is not a brainstorming file.

This is not a wish list.

This is a strict preservation file.

Only add something here when:

- we tested it
- we understood what it did
- we liked the result
- we would want to use it again in a cleaner future setup path

## Working Rule

This recipe should only collect:

- tested patterns
- approved shared assets
- governed translator or feeder patterns
- useful inspection surfaces
- naming or stewardship rules that proved helpful
- setup assumptions we would want in a cleaner future birth

Drafting note:

- use `docs/010/Active/Translators.md` for active translator architecture direction
- move only tested and approved patterns back into this recipe

Do not add:

- speculative ideas we have not tried
- “maybe later” architecture
- broad aspiration without a validated pattern
- local hacks we do not want to repeat

## Why This Exists

We may want a full end-state migration pass once enough governance is stable, so the app can be born closer to the intended architecture instead of continuing to inherit drift.

Until then, this recipe should help us preserve the parts of the current work that are worth carrying into that possible future pass.

## Recipe Entry Format

Each entry should try to answer:

1. `Name`
2. `Layer`
3. `What we tested`
4. `Why we liked it`
5. `What it should replace or prevent`
6. `What must stay true if we reuse it`
7. `Where it currently lives`

## Current Accepted Recipe Entries

### 1. Strict Feeder Chain

`Layer`

- architecture
- debugging
- shared shell traffic

`What we tested`

- we identified that shared renderers were not enough by themselves
- we traced toolbar drift back to differences in feeder logic before the renderer
- we agreed on one governed traffic path:
  - shells provide canonical section data
  - one shared feeder classifies and filters that data
  - one shared builder normalizes it
  - one shared renderer displays it

`Why we liked it`

- it localizes drift better
- it gives us a bug-filter ladder
- it reduces page-local shaping logic

`What it should replace or prevent`

- shell-local toolbar shaping
- multiple feeder paths for the same shared surface
- shared renderers pretending architecture is converged when feeder logic still drifts

`What must stay true if we reuse it`

- shells only provide canonical section data
- classification and lane assignment happen in the shared feeder path
- shared surfaces do not invent local interpretation layers

`Where it currently lives`

- `docs/010/Active/Intake.md`
- `docs/002/Active/002-Companion_Manual.md`
 

### 2. Two-Layer Asset Rule

`Layer`

- architecture
- design system governance
- system asset naming

`What we tested`

- we clarified that some important shared system tools should not remain only as hidden utilities
- we agreed that important shared assets may need:
  - runtime utility layer
  - BB or system-facing asset layer

`Why we liked it`

- it keeps naming, governance, and implementation aligned
- it makes important assets inspectable in system language
- it helps backend, feeders/translators, and frontend point to the same approved unit

`What it should replace or prevent`

- invisible critical shared logic
- separate naming between runtime and BB/system language
- design-system convergence that only happens visually but not structurally

`What must stay true if we reuse it`

- not every tiny helper gets BB identity
- important shared shell, feeder, translator, interaction, and data-surface assets should get stronger system identity

`Where it currently lives`

- `docs/010/Active/Intake.md`
- `docs/002/Active/002-Companion_Manual.md`
- `docs/010/Active/DAMP.md`

### 3. Inspectable Translator Rule

`Layer`

- governed translators
- feeders
- debugging surfaces

`What we tested`

- we agreed that governed translators should expose enough structure to tell whether mistakes came from input, context, translator logic, builder output, or renderer behavior
- we defined the minimum localization ladder:
  1. canonical input
  2. receiving or contextualization
  3. translator or feeder logic
  4. builder output
  5. renderer

`Why we liked it`

- it makes debugging more honest
- it gives a clear target for translator dashboards
- it stops translators from feeling like black boxes

`What it should replace or prevent`

- uninspectable translator logic
- bug hunts that mix upstream, logic, and rendering issues together
- decorative inspection surfaces that hide the real problem

`What must stay true if we reuse it`

- important translators must expose intermediate structure
- renderer inspection should stay simple while the system is converging

`Where it currently lives`

- `docs/010/Active/Intake.md`
- `docs/002/Active/002-Companion_Manual.md`
- steward docs in `docs/020/Active`

### 4. Short-Loop Convergence

`Layer`

- process
- debugging posture

`What we tested`

- we agreed to move through short action loops
- we used small checkpoints and small docs commits rather than broad bundled rewrites

`Why we liked it`

- it reduces confusion
- it makes trust gaps easier to isolate
- it keeps the surface cleaner while we are still learning

`What it should replace or prevent`

- broad speculative rewrites
- fixing too many layers at once
- calling a process “working” before we can inspect it clearly

`What must stay true if we reuse it`

- one visible step at a time
- verify before broadening
- prefer examples and checkpoints over complexity

`Where it currently lives`

- `docs/010/Active/Intake.md`

## Entry Gate

Before adding a new recipe entry, ask:

1. Did we actually test this?
2. Did we understand why it worked or helped?
3. Would we want to rebuild with it from the start?
4. Does it reduce drift, ambiguity, or hidden logic?
5. Can we explain it clearly enough to preserve it?

If the answer is not clearly yes, do not add it yet.
