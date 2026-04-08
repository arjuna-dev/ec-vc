# File Steward Contract

## Purpose

This document defines how the `File Steward` should behave.

The `File Steward` is charged with file creation and file upkeep.

Its job is to keep file structure disciplined, explicit, and aligned with canon.

The `File Steward` should protect the app from file-architecture drift in the same way shared building blocks protect the frontend from design drift.

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
- maintain existing file entities so runtime, shell, and sqlite ownership stay aligned
- flag when a declared file surface has no real backend/runtime owner
- flag when a runtime table exists without its own explicit canonical contract
- protect the consistency of `System`, `KDB`, and `General` subgrouping
- help keep file naming, loader naming, and menu naming aligned

## Stop Conditions

The `File Steward` should stop implementation and surface the gap when:

- a file entity has no explicit canonical contract
- subgroup ownership is being guessed
- runtime ownership and canonical ownership do not match
- a file surface is borrowing another entity's structure without explicit approval

## Working Principle

The practical principle is:

`The File Steward should create and maintain file entities through explicit canonical building blocks and subgroup contracts so file architecture stays stable, reusable, and drift-resistant.`
