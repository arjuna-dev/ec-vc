# File Creation Orchestration Architecture

## Purpose

This document exists to plan the pass that turns new file creation into a semi-automatic architecture flow.

The recent `Files` exercise proved two things:

- the current system can support a new first-class file cleanly
- but creating one still requires too many manual touch-points

So the problem is no longer whether file birth is possible.

The problem is how to orchestrate it fast, cleanly, and from one source.

## Core Direction

New file creation should become an orchestrated bootstrap pass.

That means:

- one approved file-birth contract
- one approved creation sequence
- one validation pass

And not:

- repeated manual edits across scattered files every time a new file is added

## What The `Files` Exercise Exposed

To create one real first-class `Files` surface, we had to touch:

- `docs/canonical-structure.json`
- `src/utils/structureRegistry.js`
- `src/router/routes.js`
- `src/pages/FilesPage.vue`
- `src/components/FilePageShell.vue`
- `src-electron/services/sqlite-schema.js`
- `src-electron/electron-preload.js`
- `src-electron/electron-main.js`

That is useful because it gives us the real current birth path.

It is also a problem because it is still too distributed.

## Required Birth Sequence

The target sequence for a new normal file should become:

1. accept one canonical file-birth definition
2. create the file folder/container ownership
3. create the file registry row
4. create the canonical structure ownership
5. create the route and page-shell ownership
6. create the shell loader ownership
7. create the sqlite table/runtime owner
8. create the preload bridge
9. create the ipc/runtime handlers
10. seed the default file row if needed
11. validate the file through the shared shell

## First Pair Rule

The first paired bootstrap items should be:

- `File Folder`
- `File Registry`

These should be created before:

- `Owner`
- `Users`
- `Contacts`
- and the rest of the base operational files

Reason:

- the system should know what files exist before it starts filling them with bootstrap records
- folder/container ownership and file registry ownership are the first coherent file-system layer
- later first-boot records should be created inside an already-declared file system, not before it

The deeper reason is:

- `File Folder` and `File Registry` should become inputs for the new architecture itself
- they should not just store the result of file creation after the fact
- they should help define and guide how the next file is created

In practical terms, once this pair exists, a new file should begin as a new record inside `Files`.

That record should tell the system:

- what kind of file this is
- whether it is a true `L1`
- whether it is really an `L2`
- whether it is an `L2.a`
- whether shared `System` applies
- whether shared `KDB` applies
- who the file owner should be
- whether the file is owner-only
- which rules belong in its file guide
- which settings should influence rendering

So `Files` is not just a list.

It is meant to become:

- the file-definition registry
- the file-governance registry
- the structure input layer for later file creation
- the guide layer that helps both humans and LLMs understand what should happen next

## Working Interpretation

For the current architecture, that means:

- `BB File` remains the visible system-level exception
- after that, the first operational pair is:
  - `File Folder`
  - `L1 Files`
- then `Events`
- then the rest of the approved genesis order

The next crucial proof file after this pair should be:

- `Owner`

Reason:

- `Owner` is the first high-authority file that can prove whether the file-definition layer is actually useful
- it should remain one-person / one-email grounded
- after `Owner`, the next file should help govern access and identity:
  - `Users`
- then relationships should become clearer through:
  - `Contacts`
  - `User Roles`

This also keeps the early bootstrap logic readable:

- `Owner` is one authority person
- `Users` governs who enters and leaves
- first role is `Owner`
- `User Roles` mostly attach through `Contacts`
- those relations should become easier to create once the `Files` layer is already describing file type, ownership, and shared structural requirements

## Semi-Automatic Goal

The semi-automatic target is:

- define one new file once
- let the app derive most of its birth path
- only stop where explicit human approval or explicit runtime validation is still required

In plain terms:

- file creation should feel assisted and orchestrated
- not hand-wired from scratch each time

## What Should Be Derived

The orchestrator should derive as much as possible from one file definition:

- source key
- label
- singular label
- route name
- route path
- icon
- shell group
- canonical entity name
- runtime entity name
- required subsections
- runtime capabilities
- file-order placement

The file definition should also be able to declare or guide:

- file classification
  - `L1`
  - `L2`
  - `L2.a`
- whether shared `System` is required
- whether shared `KDB` is required
- owner class
- steward guidance path
- file-guide path
- settings that make rendering more straightforward

## What Should Still Be Explicit

Some things should still be explicit and approved:

- branch behavior
- promoted dedicated join-table decisions
- non-standard subsections
- runtime exceptions
- legacy compatibility aliases

## Validation Rule

A new file should not be treated as born until all of these are true:

- route opens
- shared file shell loads
- list works
- create works
- delete works
- canonical structure is visible
- registry row exists
- sqlite owner exists
- bridge/runtime path exists

## Planning Goal For The Next Pass

The next pass should answer:

- what is the one canonical input object for new file birth?
- what can be derived immediately from that object?
- what still needs explicit approval?
- what validator should fail the birth if anything is missing?

## Design Intention

The point of this architecture pass is not speed alone.

It is:

- smoother file creation
- less drift
- less repeated manual work
- stronger convergence between canon, frontend, bridge, and sqlite

And also:

- a clearer file guide for humans
- a cleaner input layer for LLM guidance
- more straightforward rendering because rules are already declared in the file definition and settings layer
