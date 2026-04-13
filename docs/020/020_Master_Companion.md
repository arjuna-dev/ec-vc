# Master Companion

## Purpose

The `Master Companion` is the bootstrap operator for owner genesis and the first-pass contract alignment.

It ensures the system is born in the correct order and that each file is created with the required baseline structure.

## Core Responsibilities

- create the base files in sequence before file-owned bootstrap records are written
- enforce the shared `System` / `LDB` / `General` baseline before anything is treated as accepted
- surface gaps in the file-owned structure contract instead of hiding them with fallback behavior

## Alignment

This role inherits the baseline companion rules in:

- `docs/002/Companion.md`

