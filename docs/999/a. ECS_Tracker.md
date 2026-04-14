# ECS Tracker

## Purpose

This is the owner's short working tracker for the `Planned Migration Pass` (`PMP`).

Use it to keep the current migration logic visible while we:

- clean the active doc tree
- stabilize shared contracts
- reduce drift
- collect only the patterns we want to carry into a cleaner future build

This tracker should stay aligned with:

- `docs/000/a. DAMP.md`
- `docs/000/b. LAMP.md`
- `docs/000/c. System.md`
- `docs/000/f. Intake.md`
- `docs/000/h. Recipe.md`
- `docs/999/PMP.md`

## PMP Definition

`Planned Migration Pass` means:

- we are not trying to endlessly patch old structure
- we are using the current repo to converge naming, contracts, guides, and shared behavior
- we are collecting the tested recipe for a cleaner future build
- we only keep what is clear enough to deserve carrying forward

Working rule:

- short loops
- visible checkpoints
- small contained edits
- honest failure over fake smoothness

## PMP Objectives

1. Keep the active architecture layer coherent.
2. Keep file, intake, translator, and shell logic moving toward one governed path.
3. Reduce parallel docs, duplicate guidance, and naming drift.
4. Make current truth easier to inspect than remembered truth.
5. Preserve only tested patterns in the recipe.

## Current Migration Shape

### 1. Top Architecture

Active authority should live in `docs/000` and read in this order:

- `a. DAMP.md`
- `b. LAMP.md`
- `c. System.md`
- `d. File.md`
- `e. Translator.md`
- `f. Intake.md`
- `g. Game.md`
- `h. Recipe.md`
- `i. UXDesign.md`

### 2. User / Companion / Context

Single-file layers should stay simple:

- `docs/001/a. Owner.md`
- `docs/002/a. Companion.md`
- `docs/003/a. Games.md`

### 3. File Guides

Selected live file guides should stay active in `docs/100`.

Archive-only file guides should remain in `docs/100/Archive`.

### 4. Archive Discipline

If a doc is:

- future direction only
- redundant with a stronger active authority
- historically useful but not current truth

then archive it instead of keeping it half-live.

## Active PMP Work

### 1. Doc Tree Convergence

Status: active

Focus:

- keep the new doc order clean
- remove stale active references
- keep archive from pretending to be active
- keep naming cohesive across folders

### 2. Translator Convergence

Status: active

Focus:

- move shared interpretation into governed translator paths
- reduce page-local shaping
- keep renderer simple
- make translator logic inspectable

### 3. Intake Stabilization

Status: active

Focus:

- visible checkpoint ladder
- filesystem truth
- database truth
- explicit linking truth
- calmer debugging surfaces

### 4. Surface Convergence

Status: active

Focus:

- normalize shared data surfaces
- reduce dialog/shell drift
- keep feeder surfaces strict
- avoid frontend variation hiding backend problems

## PMP Checkpoints

### 1. Architecture Checkpoint

We should be able to answer:

- which doc is active authority
- which doc is archive only
- which layer owns the rule

### 2. Contract Checkpoint

We should be able to answer:

- what the canonical input is
- what translator/feeder owns shared interpretation
- what renderer owns display

### 3. Intake Checkpoint

We should be able to answer:

- what entered
- what saved to disk
- what saved to database
- what linked
- what is still only suggested

### 4. Recipe Checkpoint

We should be able to answer:

- was it tested
- do we like it
- would we reuse it in a cleaner future build

If not, it should not be promoted into `Recipe`.

## Near-Term To-Do

1. Finish linting live references so active docs never point at retired active paths.
2. Continue cleaning the shared data/table surfaces before deeper intake work.
3. Define the first real translator inspection surface from an already trusted shared behavior.
4. Rebuild the edit/intake dialog family around the stricter shared contract.
5. Keep separating current truth from archived direction.

## Stop Conditions

Stop and realign when:

- a live doc points to retired active structure
- the UI implies success but persistence is unproven
- a shared surface is only sharing renderer, not feeder path
- archive content starts acting like current instruction
- a rename improves appearance but weakens system meaning

## Working Principle

`PMP exists to make the current system clear enough, strict enough, and well-ordered enough that a cleaner future build can be executed from tested guidance instead of remembered patchwork.`
