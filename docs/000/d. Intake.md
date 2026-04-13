# Intake

## Purpose

This document is the single active intake guide.

It now carries:

- intake governance
- intake mission and checkpoints
- intake rulings

It exists so the intake process can be made honest, visible, and dependable without losing the strictness gained in the convergence cleanup.

## Status

The intake mission is not about pretending intake is fully solved.

It is about making the current process trustworthy enough that failures, drift, and false-success states become obvious.

Working posture:

- use short action loops
- prefer small examples over broad speculative changes
- verify one thing at a time
- clean the surface before increasing complexity

## Related Docs

- `docs/000/a. DAMP.md`
- `docs/000/g. Recipe.md`
- `docs/000/e. Translators.md`
- `docs/002/Companion.md`
- `docs/020/a. File.md`
- `docs/020/b. Intake.md`
- `docs/000/h. Design.md`
- `docs/999/ECS_Tracker.md`

## Current Understanding

We are coming out of a major convergence cleanup.

That cleanup gave us:

- a stricter shell language
- a stricter contract posture
- a more closed-circuit data direction

The next mission is to use that discipline to make intake:

- visible
- checkpointed
- testable
- honestly debuggable
- easier to inspect visually

## Shell Distinction

This mission depends on keeping two shells clearly separated.

### Record Shell

Use case:

- snapshot of existing record data
- record reading
- record inspection
- record verification

Working rule:

- `Record Shell` is where the user sees what the record currently is
- it is not the main intake working surface

### Add/Edit Record Shell

Use case:

- active record formation
- staged intake input
- guided creation and editing
- in-progress review before record truth is settled

Working rule:

- `Add/Edit Record Shell` is where the intake process begins
- this is the shell that should carry the main intake-process debugging burden

## Front-And-Center Rules

### 1. No Frontend Drift In The Four Feeder Surfaces

The four feeder surfaces must stay strict:

- `Add/Edit File Shell`
- `File Shell`
- `Record Shell`
- `Add/Edit Record Shell`

Working rule:

- do not make one-off local fixes in these feeder surfaces when the real issue belongs in the shared component or shell layer
- keep those surfaces behaving through the same shared building blocks and shell logic
- do not let frontend variation hide backend, data, or runtime truth

### 2. Honest Errors Are Better Than Hidden Drift

We are okay with:

- visible failure
- honest empty states
- error messages
- broken paths surfacing naturally when the contract is missing

We are not okay with:

- UI drift that disguises missing structure
- visual success that hides runtime failure
- fake cohesion produced by frontend interpretation

### 3. Data Must Flow In The Right Direction

As intake grows, data movement must remain:

- clear
- sequential
- non-circular
- structurally owned

Working rule:

- do not let data bounce between layers until source and ownership become unclear
- do not allow loop-like behavior that causes repeated or confused processing
- do not let outputs enter the wrong file path just because the frontend can render them there

### 4. Intake Must Stay Inspectable

We should be able to tell:

- what entered the system
- what was saved to disk
- what was written to the database
- what was linked
- what was only suggested
- what still needs human guidance

If the operator cannot tell those apart, intake is not yet trustworthy.

### 5. Short Action Loops Govern Current Intake Work

Working rule:

- move slowly
- test one thing at a time
- use short examples
- avoid broad bundled changes while the surface is still being cleaned

## Objective Set

### 1. Make Intake Progress Visible

The intake process should expose clear progress stages instead of one vague success feeling.

We should be able to see:

- current stage
- last confirmed checkpoint
- current blocker
- next expected action
- which record ids and artifact ids are involved

### 2. Prove Filesystem Truth

The app should make it obvious when:

- a dropped file was accepted
- a raw artifact was truly saved
- an `llm-ready` markdown output was truly created
- no output was created because a real prerequisite was missing

Important focus:

- `0_raw`
- `1_llm-ready`
- `2_llm-generated`

### 3. Prove Database Truth

The app should make it obvious when:

- raw artifact rows were truly created
- llm-ready artifact rows were truly created
- intake rows were truly created
- links between records were truly created

### 4. Prove Opportunity Linking

Opportunity linking should become an explicit checkpoint, not a hidden assumption.

We need to be able to tell:

- whether the chosen opportunity was recorded
- whether the correct artifact ids were linked
- whether the intake session and opportunity point at the same reality
- whether the UI is only showing a chosen opportunity without a real persisted link

### 5. Separate Layers Cleanly

The intake mission should make the current layers easier to distinguish:

- dropped file
- raw artifact
- llm-ready artifact
- intake session
- draft state
- review state
- linked opportunity
- canonical created records

### 6. Improve Guidance Surfaces

The intake process should help the operator understand what to do next.

We should surface:

- what succeeded
- what failed
- what is incomplete
- what needs review
- what can be resumed safely

### 7. Lighten The Working Surface

The app should become easier on the eyes while we debug and stabilize this process.

The goal is not visual decoration.

The goal is lower-friction inspection and longer comfortable working sessions.

## Checkpoint Ladder

The intake process should be treated as a strict checkpoint ladder:

1. `Input accepted`
2. `Raw artifact saved`
3. `LLM-ready output created`
4. `Intake session created`
5. `Opportunity linked`
6. `Review state created`
7. `Canonical creation completed`

Working rule:

- every checkpoint should be individually observable
- every failure should stop claiming later checkpoints are already complete

## Current Concerns

These are the current known trust gaps we should investigate first:

- database records may appear complete before we prove the true saved rows
- opportunity linking may appear complete before we prove the persisted link
- `2_llm-generated` exists structurally but is not yet part of a visibly trustworthy working output path
- shared draft state, intake sessions, review queue state, and structured autofill still feel like adjacent systems rather than one clean operating pipeline

## Confirmed Runtime / Code Rulings

These are rulings we can already support from the current codebase.

### 1. Record View Resolves Through Record Shell

- route-level record viewing resolves through `Record Shell`
- record truth should be read through the shared record-view surface

### 2. Add/Edit Record Shell Is The Active Record-Formation Surface

- the shared add/edit record flow is where staged artifacts, intake-linked creation, and in-progress record formation currently happen

### 3. Intake-Related Work Is Draft-First

Current confirmed scope:

- dropped files create shared intake draft state
- raw artifacts are created with `Draft` status
- llm-ready artifacts are created with `Draft` status when they are generated
- intake rows are created with `Draft` status by default

Important limit:

- do not broaden this into "every record in the whole app begins in Draft"

### 4. Artifact Ingestion Is Sequential In Its Base Path

Current meaning:

- raw files are saved first
- raw artifact records are created
- llm-ready markdown is generated when possible
- llm-ready artifact records are then created when output exists

Important limit:

- the existence of `2_llm-generated` in the workspace structure does not currently mean the main ingest path is writing there

### 5. Workspace Processing Is Local

- the app creates and uses a local workspace root
- files are saved into the local workspace structure
- the SQLite database is local

### 6. Shared Intake Draft Ownership Exists Above One Dialog

- intake draft state exists in shared state
- `MainLayout` already participates in shared intake lifetime
- unfinished intake state is not meant to live only inside one local dialog instance

### 7. Honest Missing Structure Is Preferred Over Fallback Smoothing

- the active runtime direction prefers visible failure over fake cohesion

## Active Architecture / Governance Rulings

### 1. Shared Shell Surfaces Must Use A Strict Feeder Chain

`Strict Feeder Chain` means:

- shells provide canonical section data
- one shared feeder classifies and filters that data
- one shared builder turns it into normalized items
- one shared renderer displays the result

Debugging ladder:

1. canonical section data
2. feeder logic
3. builder output
4. renderer

### 2. Important Shared System Assets Should Follow The Two-Layer Asset Rule

`Two-Layer Asset Rule` means:

- runtime utility layer when the asset has logic responsibility
- BB or system-facing asset layer when the asset needs naming, inspection, governance, or approved-system visibility

### 3. Important Governed Translators Should Follow The Inspectable Translator Rule

`Inspectable Translator Rule` means:

- show canonical input
- show receiving or source context
- show classification and filtering decisions
- show normalized output
- keep inspection surfaces simple enough that bugs surface naturally

Primary localization ladder:

1. canonical input
2. receiving or contextualization
3. translator or feeder logic
4. builder output
5. renderer

Steward split:

- `Architect Steward` owns the pattern and stop conditions
- `File Steward` owns canonical section meaning and source correctness
- `Intake Steward` owns contextualized ingestion and extraction handoff
- `Design Steward` owns inspection-surface clarity, not translator truth itself

### 4. Links Should Be Real, Not Only Implied

Working rule:

- if a UI shows an opportunity choice or linked-looking state, we still need to prove the persisted link underneath it

## Caution Against Overclaiming

Do not casually promote a direction into a confirmed runtime fact.

Examples:

- do not say "all records begin in draft" unless we prove that across the full app
- do not say "`2_llm-generated` is part of the active ingest path" unless the main path truly writes there
- do not say "linking works" when we have only proven that the UI can display a chosen target

## Success Condition

This mission is successful when the operator can say:

- "I know exactly what step the intake is on."
- "I can tell what really saved and what did not."
- "I can see whether the opportunity link is real."
- "I can resume safely without guessing."
- "The screen helps me inspect the process instead of fighting me."
