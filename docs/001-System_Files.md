# System File Guide

## Purpose

This document is the source-of-birth guide for all file guides in the system.

It defines:

- why every file should be born with its own `.md`
- what those file guides must contain
- how those guides should help both the `Owner` and the `File Steward`

So this is not only a file-governance note.

It is the parent guide that governs how child file guides are created.

## Core Rule

Every file should be born with its own accompanying `.md`.

That file-level guide should:

- explain the file to the `Owner`
- explain the file to the `File Steward`
- stay local to the file
- be visible from `System Files`
- be visible from the `Add/Edit File Shell`

This means:

- one file record
- one file guide
- one stable guide surface for governance, rendering, KDB, stewardship, and provenance

## Parent / Child Guide Rule

`System File Guide` is the parent guide.

Every file-specific guide should be a child guide derived from it.

That means:

- `System File Guide` defines the required structure
- each file-specific guide inherits that structure
- each file-specific guide then adds file-specific rules

So the relationship should be:

- parent guide:
  - `System File Guide`
- child guides:
  - `Companies.md`
  - `Projects.md`
  - `Events.md`
  - `Artifact_Processed.md`
  - and so on

## Why This Matters

Without a parent file-guide rule, file guidance easily drifts into:

- remembered exceptions
- conversation-only decisions
- partial guidance spread across many docs

With a parent file-guide rule, the system can say clearly for each file:

- what the file is
- how it should be born
- what sections it should expose
- whether `System` applies
- whether `KDB` applies
- who governs it
- what rulebooks it depends on
- what events should prove it was born correctly

## Required Child Guide Sections

Every child file guide should begin with these sections.

### 1. File Identity

This section should declare:

- file name
- file class:
  - `L1`
  - `L2`
  - `L2.a`
- short purpose
- canonical owner identity

### 2. Owner Section

This section should explain to the `Owner`:

- what the file is for
- what kind of information it stores
- how the file should be used
- what the file depends on
- what the user should understand before editing or creating records there

This should be human-readable first.

### 3. File Steward Section

This section should explain to the `File Steward`:

- how the file should be born
- what structural requirements it has
- what shared base rules apply
- whether `System` is required
- whether `KDB` is required
- what relationships must be born with it
- what reverse-read expectations exist
- what validation proves the file is correctly born

This should be governance-readable first.

### 4. Structure Section

This section should declare:

- main `L2`s
- approved `L2.a-b-c-d` subgrouping
- whether the file is standard or exceptional

### 5. KDB Section

This section should declare:

- whether the file participates in `KDB`
- which files it relates to
- whether those relationships are born at file creation
- whether the relationship path is:
  - shared `KDB_Relationships`
  - promoted dedicated join owner
- whether reverse-read exists

### 6. Governance Section

This section should declare:

- who owns the file
- which steward governs it
- which rulebooks it depends on
- whether the file is owner-only or shared

### 7. Provenance / Events Section

This section should declare:

- which events prove the file was born correctly
- what provenance should be preserved
- how genesis or file creation should later be reconstructable

## System Files Rule

The `System Files` file/page should expose these file-definition properties for each file:

- is it `L1`, `L2`, or `L2.a`
- does it require `System`
- does it require `KDB`
- who owns it
- which steward governs it
- which rulebooks it depends on
- which file guide belongs to it

That means `System Files` is not only a registry.

It becomes:

- a file-definition layer
- a governance layer
- a rendering input layer
- a guide registry

## Add/Edit File Shell Rule

Each file guide should also be reachable from the `Add/Edit File Shell`.

The intended location is:

- top-left box
- next to the box title

So the guide remains:

- local
- visible
- easy to open while editing the file definition

## KDB Stewardship Rule

The `File Steward` is also the effective KDB orchestrator for file birth and upkeep.

That means the `File Steward` should make sure:

- files are born correctly
- `KDB` is born with them
- the right relationships exist
- relationship direction, owner-path, and reverse-read are correct
- file order and creation sequence support those connections

So child file guides should treat KDB governance as part of `File Steward` responsibility, not as a detached separate guide layer.

## First Child Guide Template

Each file-specific guide can begin from this compact template:

1. `File Identity`
2. `Owner`
3. `File Steward`
4. `Structure`
5. `KDB`
6. `Governance`
7. `Provenance / Events`

## Working Rule

We will refine this together.

The goal is:

- every file is born with a guide
- every guide is governed by one parent file-guide rule
- both the `Owner` and the `File Steward` can use that guide to keep the file understandable, stable, and connected
