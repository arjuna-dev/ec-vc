# Owner

## Purpose

This manual is the Owner-facing guidebook for the system.

It should help the Owner pause, re-orient, and find the right layer quickly, the same way a pause menu in a game helps a player understand:

- where they are
- what systems exist
- what matters now
- where to go next

This manual is meant to stay readable by a human while also functioning as a stable memory extension for the system.

## README

These docs should stop being "extra documentation" and start being part of the operating system.

So for me, and for the user, they become:

- memory extensions
- governance references
- creation inputs
- validation surfaces

That is why they matter.

### Why These Are Needed

Without them, we keep relying on:

- remembered exceptions
- conversational context
- partial architecture spread across many files

With them, the system can say clearly:

- what this file is
- how it should be created
- what it depends on
- how it connects
- who governs it
- what events should prove it was born correctly

That makes file birth much more stable.

### Why `System Files` Matters

These fields:

- is it `L1`, `L2`, or `L2.a`
- does it require `System`
- does it require `KDB`
- who owns it
- which steward governs it
- which rulebooks it depends on

should absolutely live in `System Files`.

That means `System Files` is not just a registry.

It becomes:

- a file-definition layer
- a governance layer
- a rendering input layer

And yes, the `L2` architecture can help catalog those properties cleanly.

### `KDB_Orchestrator`

`KDB_Orchestrator` should be the place that tells us:

- which file relates to which
- whether the relationship is born at file creation
- whether it is generic or promoted
- whether reverse-read exists

That is a real missing system memory layer right now.

### Genesis Companion / Steward Manifest

This should tell us:

- install order
- dependency docs
- authority
- maintenance responsibility

That helps both the bootstrap system and the human operator understand:

- who comes first
- why
- what each companion/steward is allowed to do

### Events / Provenance Rule Sheet

If it can recreate genesis events from system logs, then it becomes much safer.

That means:

- even if we are uncertain about when to surface it
- we know it must exist early enough to preserve provenance
- and later it can reconstruct the system story from real event history

Events should also help collaboration, not only reconstruction.

That means the Owner should be able to use the event system to filter:

- what was created
- what was modified
- what was deleted
- what was pre-selected by context
- what was suggested by a user or companion
- what was verified
- what was rejected

This makes the event layer useful for:

- audit trail
- collaboration review
- owner approval queues
- provenance filtering by record and field

### One `.md` Per File

Each file should have its accompanying `.md`.

That file-level `.md` should be visible in:

- `System Files` `L1` view as a file-guide/reference column
- `Add/Edit File Shell` in the top-left box, next to the box title

That is the right pattern because the guide becomes:

- local to the file
- easy to find
- available from both governance view and editing view

So yes, this is the correct direction:

- one system file record
- one accompanying file guide
- one clear place to govern creation, rendering, KDB, stewardship, and provenance

The next best step is to define the exact first memory-extension set and what each one must contain before we implement more UI around them.

## Index

Use this as the Owner's pause menu.

### 1. Core System

- `System Files`
  - what files exist
  - what kind of files they are
  - which ones are canonical
  - which guides belong to them
- `Events`
  - what happened
  - in what order
  - what can be reconstructed from provenance
- `Files + Registry`
  - the first repository/genesis layer

### 2. Architecture

- `Record Architecture`
  - overall `File -> Card -> Record View` system
- `Intake Architecture`
  - ingestion, draft flow, staged extraction
- `Bootstrap`
  - how new `L1`s should be born
- `Field Classification`
  - what a token means and how it should behave

### 3. Governance

- `File Steward`
  - file creation
  - file upkeep
  - KDB birth discipline
- `Design Steward`
  - BB and shell consistency
- `Companion`
  - how companions should behave
- `Game Rulebook`
  - how the guide/game layer should motivate without weakening truth
  - current guide: `docs/300/Active/300_Game_Rulebook.md`
- `Game Steward`
  - companion steward role that explains and governs the game layer
  - current role guide: `docs/020/Active/020_Game_Steward.md`

### 4. Relationship System

- `KDB`
  - file-to-file and record-to-record relationship meaning
- `KDB_Orchestrator`
  - relationship registry and birth logic
- `Reverse Read`
  - how relationships show from both sides
- `Promoted vs Generic`
  - dedicated join table versus shared `KDB_Relationships`

### 5. Genesis

- `Owner Genesis`
  - what should be created first
- `Genesis Companion / Steward Manifest`
  - which helpers come first
  - what they depend on
- `Events / Provenance Rule Sheet`
  - how genesis can be reconstructed later

### 6. File Guides

- each file should eventually have its own guide
- those guides should explain:
  - what the file is
  - what it stores
  - what rules govern it
  - what it depends on
  - how it relates to other files

### 7. How To Use This Manual

When the Owner is confused, this manual should help answer:

1. what system am I in?
2. what file am I looking at?
3. what governs this file?
4. what is supposed to happen next?
5. which guide or steward should I open?

## First Memory-Extension Set

These are the first missing memory-extension docs the system likely needs:

1. `File Definition Schema`
2. `Bootstrap Sequence Manifest`
3. `File Governance Matrix`
4. `KDB_Orchestrator`
