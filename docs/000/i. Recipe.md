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
- `docs/999/b. PMP.md`

## Current Accepted Entries

Use this file as the single current recipe source.

This is now the maintained recipe list for tested patterns we want to preserve.

### 1. Shared Base Views

Tested rule:

- files begin from:
  - `System`
  - `General`
  - `LDB`

Preserve because:

- it keeps shared structure explicit
- it reduces drift from improvised section naming

### 2. Shared Base Tokens

Tested rule:

- `System`
  - `ID`
  - `System.Status`
  - `History`
- `General`
  - `Name`
  - `Definition`

Preserve because:

- the shared base stays readable across files
- `History` stays explicit as a shared dependency
- file lifecycle stays separate from token/property status
- shells can rely on a cleaner common structure

Working note:

- `History` should resolve through the `History` file by record `ID`
- token metadata may enrich provenance, but does not yet replace `History`

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
2. `Files.Structure` stores structure truth
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

### 8. Runtime Structure Birth Rule

Tested rule:

1. construct birth defines which files must exist
2. `System Files` declares the runtime file registry
3. each file row carries owned `Defined_Structure`
4. `setRuntimeFileStructures(...)` forms runtime structure from that owned file structure
5. runtime structure must preserve explicit:
   - sections
   - tokens
   - token roles
   - parent linkage
   - structure tokens
   - display grouping
6. shared controls and shared surfaces render only from that runtime structure truth
7. governance mutates that structure truth
8. data reflects that mutated structure truth

Working preservation rule:

- if runtime formation changes structure meaning, the change must be treated as architecture work
- `setRuntimeFileStructures(...)` is not neutral plumbing; it is one of the places where runtime truth is born
- do not let runtime formation quietly invent fallback structure or drift from owned file structure

Preserve because:

- it identifies where render truth begins
- it prevents hidden structure drift from parser-stage assumptions
- it keeps shared surfaces downstream of one declared runtime path instead of many local interpretations

### 9. Runtime Structure Required Elements

Tested rule:

When owned file structure is formed into runtime structure, the minimum preserved elements should be:

- file source identity
- section key
- section label
- section address
- section structure token
- section display group
- token key
- token name
- token role
- token order
- token label
- token type
- parent section key
- parent section label
- option source
- option entity
- option list
- definition
- write field / alias contract

Preserve because:

- shared rendering cannot stay truthful if these are dropped, guessed, or renamed implicitly
- governance and data both depend on these same structure elements
- future clean birth work needs a stable minimum structure checklist

### 10. Render Path Order

Tested rule:

The shared render path should be understood in this order:

1. construct declares minimum birth set
2. `System Files` declares each file
3. file row owns `Defined_Structure`
4. runtime parser forms runtime structure
5. shared control reads runtime structure
6. shared surface reads runtime structure and row data
7. governance edits structure
8. data re-renders from that structure

Short rule:

- birth first
- structure second
- runtime formation third
- rendering fourth
- mutation through governance after that

Preserve because:

- it gives future rebuild work a strict order to follow
- it reduces confusion about where a bug starts
- it keeps rendering downstream of structure instead of letting renderers invent structure locally
