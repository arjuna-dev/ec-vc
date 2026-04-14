# Recipe

## Purpose

This document is the architecture-side reference for the tested recipe we are building through convergence work.

It exists so `010` can point to the preserved patterns we would want to carry into a cleaner future birth.

This is not the drafting file.

This is not the place for speculative ideas.

Use it for tested patterns only.

## Working Rule

Only keep something here when:

- we tested it
- we understood it
- we liked it
- we would want to reuse it in a future clean birth or end-state migration pass

## Current Direction

This recipe should preserve the parts of current convergence work that are worth carrying forward into a possible future rebuild.

Typical examples:

- strict contracts
- shared translators
- approved shared assets
- inspection surfaces
- naming rules
- steward splits
- setup assumptions worth preserving

## Active Companion Docs

Stay aligned with:

- `docs/000/g. Intake.md`
- `docs/000/f. Translator.md`

## Current Accepted Entries

Use this file as the single current recipe source.

This is now the maintained recipe list for tested patterns we want to preserve.

### 1. Shared Base Views

Tested rule:

- files begin from:
  - `System`
  - `General`
  - `LDB`
  - `Other`

Preserve because:

- it keeps shared structure explicit
- it makes extension areas clear
- it reduces drift from improvised section naming

### 2. Shared Base Tokens

Tested rule:

- `System`
  - `ID`
  - `History`
  - `Data.Status`
- `General`
  - `Name`
  - `Summary`

Preserve because:

- the shared base stays readable across files
- `Data.Status` is separated from file-specific business status
- shells can rely on a cleaner common structure

### 3. Data Surface Contract

Tested rule:

- `Row Surface` and `Card Surface` are the shared names
- row surfaces begin with:
  - `Select`
  - `View`
- token-backed headers come from `Token Label`
- row surfaces should not stretch artificially to fill the whole window

Preserve because:

- shared row surfaces now read more consistently
- control columns are clearer
- header drift is reduced

### 4. Cell-State Reading

Tested rule:

- editable = blue
- linked = green
- suggested = yellow
- pre-selected = grey
- verified = black

Preserve because:

- the surface can show meaning without hiding provenance
- state reading is clearer across file work

### 5. Structure Governance Surface Rule

Tested rule:

- `Views` edits view metadata
- `Tokens` edits token metadata
- both should regulate `Defined_Structure` directly
- blue = editable
- grey = locked

Preserve because:

- it avoids parallel structure models
- it keeps the governance surfaces honest

### 6. How System Works Chain

Tested rule:

1. `electron-main.js` defines birth template
2. `Files.Defined_Structure` stores structure truth
3. `structureRegistry.js` parses runtime structure
4. shell surfaces render from that parsed structure

Preserve because:

- it helps localize where a change really happened
- it prevents "changed everywhere" misunderstandings

### 7. Translator Rule

Tested rule:

- canonical input
- translator classification
- builder normalization
- renderer

Preserve because:

- it localizes shared interpretation cleanly
- it reduces page-local drift
