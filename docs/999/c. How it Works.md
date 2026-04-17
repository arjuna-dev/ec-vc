# How it Works

## Purpose

This document is the sandbox mini-guide file for short operational explanations.

Use it when we want to capture:

- how a system path actually works
- where truth lives
- where misunderstandings usually happen
- how to explain the system clearly to ourselves or others later

This is not the main architecture authority.

It is the quick explanation layer that helps us restate system behavior in plain language without losing the real contract.

## How System Works

The system chain works like this:

1. `src-electron/electron-main.js`
   - this is where the app defines the bootstrap template for file structure
   - `buildBaseFileStructure(entry)` creates the default `Structure` JSON for a file

2. `Files.Structure`
   - that JSON is then stored in the `Files` table as the actual structure contract for each file
   - this is the important truth holder for runtime structure

3. `src/utils/structureRegistry.js`
   - this reads `Files.Structure`
   - it parses the stored JSON
   - it turns that structure into runtime sections and tokens the frontend can use

4. UI surfaces
   - surfaces such as `FilePageShell.vue` and `AddEditFileShellDialog.vue` render from that parsed token structure

### Short Reading

- `electron-main.js` = birth template and repair logic
- `Files.Structure` = stored structure truth
- `structureRegistry.js` = runtime parser
- shell surfaces = renderer

### Why This Matters

Changing bootstrap in `electron-main.js` does not automatically mean every existing file structure has changed everywhere.

It only guarantees:

- new structures can be born differently
- existing structures can change only if the stored `Structure` is explicitly rewritten or repaired

That means a field contract change should always be checked across four layers:

1. bootstrap template
2. stored `Structure`
3. runtime parser
4. renderer

If only bootstrap changes, future births change.

Current stored structures may still keep the older truth.

### Working Lesson

This is the kind of misunderstanding we want to avoid:

- saying a field was `changed`
- when what really changed was only the birth template

More precise wording is:

- `bootstrap was changed`
- `stored structure was changed`
- `runtime parser was changed`
- `renderer was changed`

That helps us stay honest about what actually happened.

## How Files Work

Files work through a declared structure contract.

The current logic is:

1. a file is declared through `System Files`
2. that file stores its structure in `Files.Structure`
3. the structure declares views/sections
4. those views/sections declare tokens

REF REVIEW "good way to think about it.

Files.Structure is the stored JSON structure contract for a file.

Inside that contract, the next layer is:

sections/views
then tokens
So the nesting is basically:

Files

the registry row exists
Files.Structure

the file’s stored structure contract
sections/views

System
General
LDB
file-specific views
tokens

the leaf definitions inside each section/view"

Short reading:

- `System Files` says the file exists
- `Structure` says what the file contains
- runtime parsing makes that structure usable
- shells render what the structure actually says

Current governed base:

- `System`
- `General`
- `LDB`
- `Other`

Working rule:

- file truth should not be guessed from page-local code
- if a file view looks wrong, inspect the stored structure contract before patching the renderer

## How Records Work

Records work as the live value layer that sits under the file structure.

The current logic is:

1. file structure declares what kinds of fields a record may carry
2. runtime tables store actual record values
3. record-facing shells read the current record plus its governed structure
4. field review, verification, and status should stay aligned with that structure instead of drifting into page-local behavior

Short reading:

- file structure declares the record shape
- runtime data stores the record values
- shells render record values through the structure contract

Working rule:

- a record should not invent meaning outside the file/token structure that owns it
- if a record surface looks wrong, check whether the issue is:
  - structure
  - stored data
  - runtime parsing
  - renderer

## How Tokens Work

Tokens work as the canonical leaf-definition layer inside each file.

The current logic is:

1. each view/section owns tokens
2. each token carries its governed definition
3. token label drives the human-facing name
4. token type drives input and interaction behavior
5. token defaults such as verification/status should come from the token/system definition first
6. row and dialog surfaces should render from that token contract

Short reading:

- tokens are not just labels
- tokens are the leaf contract the shell should trust
- if a column title, field meaning, or default state is wrong, fix the token layer first

Working rule:

- token-backed rendering should come from the token contract
- page-local patches should not become the long-term answer when the token contract is missing or wrong

## How Surfaces Work

Shared surfaces and data contracts do different jobs.

The current intended logic is:

1. one shared renderer may be reused across many paths
2. the shared renderer provides the reading grammar and control behavior
3. each path still declares its own explicit data contract
4. that contract tells the renderer what the current path is carrying

Short reading:

- same surface does not mean same payload
- it means same renderer with different explicit contracts underneath

Examples:

- `File Views` -> file-view contract
- `Tokens` -> token-metadata contract
- `Views` -> view-metadata contract
- translator surfaces -> translator contract
- intake surfaces -> intake contract
- companion surfaces -> companion contract

Working rule:

- the shared renderer reduces mistakes
- the contract carries the path-specific provisions for that data set
- the renderer should not guess which fields matter

## Future Sections

Placeholders for future mini-guides:

- `How LDB Works`
- `How Verification Works`
- `How Translators Work`
- `How Intake Works`
- `How Shells Work`

## Related Docs

- `docs/000/b. LAMP.md`
- `docs/000/c. System.md`
- `docs/000/d. File.md`
- `docs/000/e. Token.md`
- `docs/999/a. ECS_Tracker.md`
- `docs/999/b. PMP.md`

