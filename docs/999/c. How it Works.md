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

## How File Structure Works

The file-structure chain works like this:

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

## Related Docs

- `docs/000/b. LAMP.md`
- `docs/000/c. System.md`
- `docs/000/d. File.md`
- `docs/000/e. Token.md`
- `docs/999/a. ECS_Tracker.md`
- `docs/999/b. PMP.md`
