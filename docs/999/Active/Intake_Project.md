# Intake Project

## Status

This document is the active mission sheet for the next intake process pass.

It should be used to keep the current intake work:

- visible
- checkpointed
- testable
- easier to debug honestly
- easier to work through visually

This mission is not about pretending intake is fully solved.

This mission is about making the current intake process trustworthy enough that failures, drift, and false-success states become obvious.

This mission should stay aligned with:

- `docs/999/Active/Intake_Governance.md`

## Mission

Stabilize the real intake process so we can see:

- what truly happened
- what only appeared to happen in the UI
- what completed in the filesystem
- what completed in the database
- what still needs user guidance

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

## Objective Set

### Objective 1. Make Intake Progress Visible

The intake process should expose clear progress stages instead of one vague success feeling.

We should be able to see:

- current stage
- last confirmed checkpoint
- current blocker
- next expected action
- which record ids and artifact ids are involved

### Objective 2. Prove Filesystem Truth

The app should make it obvious when:

- a dropped file was accepted
- a raw artifact was truly saved
- an `llm-ready` markdown output was truly created
- no output was created because a real prerequisite was missing

Important focus:

- `0_raw`
- `1_llm-ready`
- `2_llm-generated`

Working rule:

- do not visually imply output generation when no real file exists
- do not treat the presence of a staged draft as proof that disk output exists

### Objective 3. Prove Database Truth

The app should make it obvious when:

- raw artifact rows were truly created
- llm-ready artifact rows were truly created
- intake rows were truly created
- links between records were truly created

Working rule:

- do not treat optimistic local state as proof that the database completed the step

### Objective 4. Prove Opportunity Linking

Opportunity linking should become an explicit checkpoint, not a hidden assumption.

We need to be able to tell:

- whether the chosen opportunity was recorded
- whether the correct artifact ids were linked
- whether the intake session and opportunity point at the same reality
- whether the UI is only showing a chosen opportunity without a real persisted link

### Objective 5. Separate Layers Cleanly

The intake mission should make the current layers easier to distinguish:

- dropped file
- raw artifact
- llm-ready artifact
- intake session
- draft state
- review state
- linked opportunity
- canonical created records

Working rule:

- if two layers are being conflated, treat that as architecture drift

### Objective 6. Improve Guidance Surfaces

The intake process should help the operator understand what to do next.

We should surface:

- what succeeded
- what failed
- what is incomplete
- what needs review
- what can be resumed safely

### Objective 7. Lighten The Working Surface

The app should become easier on the eyes while we debug and stabilize this process.

This includes:

- calmer status presentation
- clearer hierarchy
- more readable spacing
- less visually noisy debugging and progress surfaces

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

## Investigation Rule

For this mission, we should move slowly and verify one checkpoint at a time.

That means:

- do not broaden a bug into a full rewrite too early
- do not call a step solved because the UI looks plausible
- do not merge separate failures into one vague intake complaint
- prefer proving one layer before touching the next

## Immediate Work Sequence

1. Define the visible checkpoint model in the product language.
2. Compare the current runtime against each checkpoint.
3. Identify where visible success diverges from true filesystem or database success.
4. Tighten the first broken checkpoint before moving deeper.
5. Improve the visual comfort of the process surface while keeping the status logic honest.

## Success Condition

This mission is successful when the operator can say:

- "I know exactly what step the intake is on."
- "I can tell what really saved and what did not."
- "I can see whether the opportunity link is real."
- "I can resume safely without guessing."
- "The screen helps me inspect the process instead of fighting me."
