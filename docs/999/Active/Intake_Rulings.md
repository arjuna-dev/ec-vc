# Intake Rulings

## Purpose

This is the reference document for the current intake rulings.

Use it to answer:

- what we have already ruled
- what is confirmed in runtime/code today
- what is an active architectural rule we should keep front-and-center
- what we should not accidentally broaden into a stronger claim than the code currently supports

Working naming decision:

- this reference should be called `Intake Rulings`

That name is useful because it is short, strict, and easy to scan during debugging.

## How To Read This File

This file separates two kinds of rulings:

1. `Confirmed Runtime / Code Rulings`
2. `Active Architecture / Governance Rulings`

That distinction matters because some rules are already enforced in code, while others are the governing direction we are using to evaluate work.

## Confirmed Runtime / Code Rulings

These are rulings we can already support from the current codebase.

### 1. Record View resolves through Record Shell

Current meaning:

- route-level record viewing now resolves through `Record Shell`
- record truth should be read through the shared record-view surface instead of drifting by entity page

### 2. Add/Edit Record Shell is the active record-formation surface

Current meaning:

- the shared add/edit record flow is where staged artifacts, intake-linked creation, and in-progress record formation currently happen

### 3. Intake-related work is draft-first

Current confirmed scope:

- dropped files create shared intake draft state
- raw artifacts are created with `Draft` status
- llm-ready artifacts are created with `Draft` status when they are generated
- intake rows are created with `Draft` status by default

Important limit:

- this should not be overstated as "every record in the whole app begins in Draft"
- the confirmed current rule is intake-related draft-first behavior

### 4. Artifact ingestion is sequential in its base path

Current meaning:

- raw files are saved first
- raw artifact records are created
- llm-ready markdown is generated when possible
- llm-ready artifact records are then created when output exists

Important limit:

- the existence of `2_llm-generated` in the workspace structure does not currently mean the main ingest path is writing there

### 5. Workspace processing is local

Current meaning:

- the app creates and uses a local workspace root
- files are saved into the local workspace structure
- the SQLite database is local

This supports the safety direction that operators process data locally and retain direct control over the file path.

### 6. Shared intake draft ownership exists above one dialog

Current meaning:

- intake draft state exists in shared state
- `MainLayout` already participates in shared intake lifetime
- unfinished intake state is not meant to live only inside one local dialog instance

### 7. Honest missing structure is preferred over fallback smoothing

Current meaning:

- the convergence direction has already removed many fallback and heuristic behaviors
- the active runtime direction prefers visible failure over fake cohesion

## Active Architecture / Governance Rulings

These are the rulings we are using to govern the next intake mission.

### 1. No frontend drift in the four feeder surfaces

The four feeder surfaces should stay strict:

- `Add/Edit File Shell`
- `File Shell`
- `Record Shell`
- `Add/Edit Record Shell`

Working rule:

- do not solve shared problems with one-off page-local fixes in these surfaces

### 2. Record Shell and Add/Edit Record Shell have different objectives

`Record Shell`:

- snapshot
- inspection
- verification of current record truth

`Add/Edit Record Shell`:

- intake starting point
- active record formation
- staged process guidance

### 3. Honest errors are acceptable; hidden false-success states are not

Working rule:

- error messages are acceptable
- fail-closed behavior is acceptable
- fake success states are not acceptable

### 4. Intake must remain sequential and inspectable

Working rule:

- data should move in a clear sequence
- later stages should not quietly assume earlier stages succeeded
- the operator should be able to inspect what happened at each checkpoint

### 5. Short action loops govern current intake work

Working rule:

- move slowly
- test one thing at a time
- use short examples
- avoid broad bundled changes while the surface is still being cleaned

### 6. Intake debugging should focus on real checkpoints

Current checkpoint ladder:

1. `Input accepted`
2. `Raw artifact saved`
3. `LLM-ready output created`
4. `Intake session created`
5. `Opportunity linked`
6. `Review state created`
7. `Canonical creation completed`

### 7. File bootstrap remains a strong governing rule

Current meaning:

- a new `File` should be treated as a full bootstrap task, not a partial visibility task
- shell, runtime ownership, and relationship paths should not be treated as optional extras

### 8. Links should be real, not only implied

This especially applies to intake.

Working rule:

- if a UI shows an opportunity choice or linked-looking state, we still need to prove the persisted link underneath it

### 9. Shared shell surfaces must use a Strict Feeder Chain

Current governing meaning:

- shared renderers are not enough by themselves
- the feeder path that prepares shared toolbar or surface items must also be shared and strict

`Strict Feeder Chain` means:

- shells provide canonical section data
- one shared feeder classifies and filters that data
- one shared builder turns it into normalized items
- one shared renderer displays the result

Working rule:

- shells must not locally decide how shared toolbar or shared surface items are shaped
- grouping, side assignment, structural classification, and related filtering should happen in the shared feeder path

Debugging rule:

If two shells render the same shared surface differently, the difference should be traceable to one of these layers only:

1. canonical section data
2. feeder logic
3. builder output
4. renderer

If the difference cannot be localized through that ladder, the contract is not yet strict enough.

### 10. Important shared system assets should follow the Two-Layer Asset Rule

Current governing meaning:

- an important shared system asset may need both a runtime implementation and a BB or system-facing identity
- shared system logic should not remain invisible when it is central to how the product names, governs, and inspects behavior

`Two-Layer Asset Rule` means:

- runtime utility layer when the asset has logic responsibility
- BB or system-facing asset layer when the asset needs naming, inspection, governance, or approved-system visibility

Working rule:

- do not treat hidden runtime helpers alone as the full answer when the asset is becoming a first-class shared system tool
- do not require BB identity for every tiny helper
- do require stronger system identity for important shared shell, feeder, translator, interaction, and data-surface assets

Convergence meaning:

- user-preference assets may converge through settings and design-system foundations
- governed system assets may converge through BB identity, runtime ownership, feeder logic, and shell usage

This helps backend, feeders/translators, and frontend point to the same approved unit instead of drifting into separate languages.

### 11. Important governed translators should follow the Inspectable Translator Rule

Current governing meaning:

- an important translator or feeder should expose enough intermediate structure to localize where a mistake entered the chain
- this is especially important where canonical input is being contextualized, classified, normalized, and then rendered through shared shells

`Inspectable Translator Rule` means:

- show canonical input
- show receiving or source context
- show classification and filtering decisions
- show normalized output
- keep rendered inspection surfaces simple enough that bugs surface naturally

Primary localization ladder:

1. canonical input
2. receiving or contextualization
3. translator or feeder logic
4. builder output
5. renderer

Steward split:

- `Architect Steward` owns the pattern and stop conditions
- `File Steward` owns canonical section meaning and source correctness
- `Intake Steward` owns contextualized ingestion and extraction handoff when source material is entering the system
- `Design Steward` owns inspection-surface clarity, not translator truth itself

## Caution Against Overclaiming

When updating this document, do not casually promote a direction into a confirmed runtime fact.

Examples:

- do not say "all records begin in draft" unless we prove that across the full app
- do not say "`2_llm-generated` is part of the active ingest path" unless the main path truly writes there
- do not say "linking works" when we have only proven that the UI can display a chosen target

## Working Use

Use this file when we need to decide:

- whether a statement is already true in code
- whether a statement is a governing rule for the mission
- whether a new claim is too broad and needs to be narrowed
