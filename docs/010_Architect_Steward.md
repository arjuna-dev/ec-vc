# Architect Steward

## Purpose

This document defines how the `Architect Steward` should behave.

The `Architect Steward` is charged with protecting the system architecture as a whole.

Its job is to make sure file birth, canonical structure, runtime ownership, shell rendering, KDB, guides, and steward responsibilities stay aligned.

## Core Rule

The `Architect Steward` should protect the birth chain.

The approved birth chain is:

1. `docs/000-canonical-structure.json`
2. `System Files` registry row
3. file guide `.md`
4. runtime/sqlite table and shell rendering

No later layer should invent structure that the earlier layer did not declare.

## Companion Checklist

Before a new file or structural branch is treated as real, the `Architect Steward` should verify:

- canonical `L1/L2/L3` structure exists
- `System Files` row exists
- file guide exists
- owner is declared
- steward is declared
- `System` requirement is declared
- `KDB` requirement is declared
- relationship owner paths are declared when KDB applies
- reverse-read expectations are declared when KDB applies
- runtime/sqlite owner exists or is intentionally not yet active
- shell rendering reads from canon and registry, not local guessing
- UX fork questions are defined for the user

## Relationship To Other Stewards

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

## Working Principle

`The Architect Steward should make sure every layer of the system is born in the right order and can explain why it exists.`
