# New `L1` Birth Input Contract

## Purpose

This document defines the minimum canonical input contract required to create a new normal `L1`.

This is the input contract for birth.

It is not the same thing as:

- full runtime implementation
- final shell rendering
- later relationship promotion work

Its job is simpler:

- define exactly what information must be present before `L1` bootstrap can begin
- prevent bootstrap from guessing missing structure

## Working Rule

A new normal `L1` should not begin birth unless this input contract is complete.

If any required part is missing, the correct action is:

- stop
- surface the gap
- complete the canonical input first

## Minimum Required Input

### 1. Canonical entity identity

Required:

- canonical entity name
- singular label
- plural label
- route key

Purpose:

- this gives the `L1` one clear structural identity across canon, shell, and runtime

### 2. Entity class

Required:

- one declared class:
  - normal `L1`
  - branch-capable `L1`
  - approved exception

Purpose:

- this prevents bootstrap from assuming all entities follow the same birth path

Working rule:

- this contract is for new normal `L1`s by default
- branch-capable and exception entities must declare that difference explicitly

### 3. Shared base confirmation

Required:

- explicit confirmation that the entity owns:
  - `System`
  - `KDB`
  - `General`

Purpose:

- this prevents birth from silently skipping the shared base

### 4. Shared base parameter confirmation

Required:

- explicit confirmation that shared `System` includes:
  - `ID`
  - `Creator`
  - `Datetime`
  - `EventLog`
- explicit confirmation that shared `General` includes:
  - `Name`
  - `Summary`

Purpose:

- this prevents entity birth from renaming shared base fields into entity-specific duplicates

### 5. Entity-specific extension structure

Required:

- entity-specific `L2` list
- any approved `L2.a-b-c-d` subgrouping

Purpose:

- this defines the entity's extension layer after the shared base is loaded

Working rule:

- subgrouping must be declared explicitly
- subgrouping must not be invented later in shell code

### 6. KDB declaration set

Required:

- list of canon-approved KDB relationship declarations for the new `L1`

Each declared relationship should identify:

- target `L1`
- source token
- expected reverse target

Purpose:

- this gives bootstrap the minimum information needed to create reciprocal KDB declarations

### 7. Relationship owner-path decision set

Required:

- for each approved relationship, one declared owner-path mode:
  - shared `KDB_Relationships`
  - promoted dedicated join table

Purpose:

- this prevents bootstrap from improvising storage ownership later

Working rule:

- default to shared `KDB_Relationships`
- only choose dedicated join table when promotion is explicitly approved

### 8. Shell ownership identity

Required:

- file-shell route ownership
- registry/menu identity
- runtime entity/table identity

Purpose:

- this prevents visible shell presence from drifting away from runtime ownership

### 9. Validation target

Required:

- explicit statement of what counts as a successful birth proof:
  - list works
  - create works
  - edit works
  - delete works
  - KDB appears
  - reverse-read appears
  - shell launch works

Purpose:

- this prevents birth from being treated as complete just because the table or route exists

## Compact Input Shape

In practical terms, a new normal `L1` birth input should be able to answer all of these:

1. what is the entity called?
2. is it normal, branch-capable, or an approved exception?
3. does it own the shared base?
4. does it use the shared base parameters correctly?
5. what are its entity-specific `L2`s?
6. what KDB links does it declare?
7. which links stay in `KDB_Relationships`?
8. which links are explicitly promoted to dedicated join tables?
9. what route/registry/runtime identity should be created?
10. how do we prove the birth is complete?

If any of those answers is missing, birth input is incomplete.

## What This Contract Does Not Allow

This contract does not allow:

- guessing labels from table names
- creating a visible shell before runtime ownership exists
- adding KDB tokens without reverse-read planning
- assuming every relationship deserves a dedicated join table
- inventing subgroup structure later in shell code

## File Steward Rule

The `File Steward` should treat missing birth input as a stop condition.

The steward should not allow:

- partial birth input
- silent defaults beyond the approved shared base
- post-birth structural invention to fill in missing canon
