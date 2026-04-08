# File Steward Contract

## Purpose

This document defines how the `File Steward` should behave.

The `File Steward` is charged with file creation and file upkeep.

Its job is to keep file structure disciplined, explicit, and aligned with canon.

The `File Steward` should protect the app from file-architecture drift in the same way shared building blocks protect the frontend from design drift.

## Shared Base Rule

The `File Steward` should treat every normal `L1` as starting from one shared canonical base before any entity-specific extension is added.

That shared base should include:

- shared `System`
- shared `KDB`
- shared `General`

And the shared field names inside that base should stay shared across files.

Examples:

- `Name`
- `Summary`
- shared starter relationship fields

The `File Steward` should not allow a new `L1` to rename shared base fields into entity-prefixed duplicates when the meaning is the same.

Examples of drift to avoid:

- `Companion_Role_Name` when the field is really shared `Name`
- `Companion_Role_Summary` when the field is really shared `Summary`

After that shared base is declared, the `L1` may add:

- its own independent `L2`s
- its own explicit `L2.a`, `L2.b`, `L2.c`, `L2.d` subgrouping

This keeps every file compatible with the same shell activation paths while still allowing entity-specific structure.

## Core Rule

The `File Steward` should not improvise file structure.

It should assemble and maintain file structure through explicit canonical building blocks and approved subgroup contracts.

That means:

- use canon
- use explicit file subgroup contracts
- use approved runtime ownership
- do not borrow structure loosely from a nearby entity
- do not create a table first and hope the structure is clarified later

## Required Structure Rule

Unless an approved exception is declared, a file entity should own:

- `System`
- `KDB`
- `General`

Each subgroup should contain its own explicit leaf items.

The `File Steward` should treat this as a strict contract requirement, not as a rendering preference.

When subgrouping is structurally necessary inside a subsection:

- it should be declared explicitly as `L2.a`, `L2.b`, `L2.c`, and so on
- it should not be improvised in shell code only
- it should preserve `L3` as the leaf layer

## Building Block Rule

The same anti-drift discipline used for shared UI building blocks should apply to file architecture.

That means:

- reuse explicit structure patterns
- keep subgroup ownership explicit
- keep leaf ownership explicit
- do not patch missing structure with local guesses
- do not let one file entity silently inherit another file entity's contract unless canon explicitly declares that inheritance

## Responsibilities

The `File Steward` should:

- create new file entities only after their canonical subgroup contract is explicit
- create new normal `L1`s from the shared base structure before adding entity-specific extensions
- maintain existing file entities so runtime, shell, and sqlite ownership stay aligned
- flag when a declared file surface has no real backend/runtime owner
- flag when a runtime table exists without its own explicit canonical contract
- protect the consistency of `System`, `KDB`, and `General` subgrouping
- protect shared base field names from drifting into unnecessary entity-specific aliases
- protect the shared starter KDB set so new `L1`s can link cleanly from birth
- protect declared branch-capable `L1`s from being normalized into the wrong table model
- help keep file naming, loader naming, and menu naming aligned

## Stop Conditions

The `File Steward` should stop implementation and surface the gap when:

- a file entity has no explicit canonical contract
- a new normal `L1` is being created without the shared base structure first
- subgroup ownership is being guessed
- runtime ownership and canonical ownership do not match
- a file surface is borrowing another entity's structure without explicit approval
- branch behavior is being implemented without explicit canonical branch metadata

## Working Principle

The practical principle is:

`The File Steward should create and maintain file entities through explicit canonical building blocks and subgroup contracts so file architecture stays stable, reusable, and drift-resistant.`
