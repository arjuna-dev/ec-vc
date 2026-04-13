# Workbook Schema Companion (Redraft)

## Purpose

This document explains how the workbook schema companion should be treated in the current architecture.

## Current Rule

- The workbook schema companion is reference only.
- It is not live shell payload truth.
- It should not override file-owned token/view contracts or shared LDB behavior.

## Approved Runtime Sources

The live runtime contract now flows from:

1. `System Files` registry rows (file universe + ownership metadata)
2. file-owned tokens and view forks (runtime payload source)
3. shared `LDB_Relationships` contract (relationship existence layer)

## What the Companion Still Helps With

- historical structure reference
- validation cues for missing tokens
- migration / parity checks during cleanup

## What It Must Not Do

- drive live shell payloads
- substitute for file-owned token/view contracts
- introduce legacy terms into new work

## Terminology

- use `LDB` for the relationship layer
- avoid introducing legacy terms in active docs or runtime contracts

## Next Step

When the companion is needed for validation or migration, reference it explicitly and keep the changes scoped. Otherwise, treat it as archive-level support material.
