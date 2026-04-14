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
   - `buildBaseFileStructure(entry)` creates the default `Defined_Structure` JSON for a file

2. `Files.Defined_Structure`
   - that JSON is then stored in the `Files` table as the actual structure contract for each file
   - this is the important truth holder for runtime structure

3. `src/utils/structureRegistry.js`
   - this reads `Files.Defined_Structure`
   - it parses the stored JSON
   - it turns that structure into runtime sections and tokens the frontend can use

4. UI surfaces
   - surfaces such as `FilePageShell.vue` and `AddEditFileShellDialog.vue` render from that parsed token structure

### Short Reading

- `electron-main.js` = birth template and repair logic
- `Files.Defined_Structure` = stored structure truth
- `structureRegistry.js` = runtime parser
- shell surfaces = renderer

Quick nesting summary:

1. `Files`
   - says the file exists

2. `Files.Defined_Structure`
   - stores how the file is built

3. `sections/views`
   - group the file into governed reading/editing areas

4. `tokens`
   - define the leaf fields inside each section/view

Working interpretation:

- `Files.Defined_Structure` = container contract
- `section/view structure` = grouping layer
- `token structure` = leaf-definition layer

### Why This Matters

Changing bootstrap in `electron-main.js` does not automatically mean every existing file structure has changed everywhere.

It only guarantees:

- new structures can be born differently
- existing structures can change only if the stored `Defined_Structure` is explicitly rewritten or repaired

That means a field contract change should always be checked across four layers:

1. bootstrap template
2. stored `Defined_Structure`
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
2. that file stores its structure in `Files.Defined_Structure`
3. the structure declares views/sections
4. those views/sections declare tokens
5. shared shells render from that stored structure

Short reading:

- `System Files` says the file exists
- `Defined_Structure` says what the file contains
- runtime parsing makes that structure usable
- shells render what the structure actually says

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
