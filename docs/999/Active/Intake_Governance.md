# Intake Governance

## Purpose

This document keeps the post-convergence intake direction front-and-center.

It exists so we do not lose the discipline gained in the convergence cleanup when we begin the next intake-focused mission.

This is not just an intake note.

It is a working regulation for how we should think while we clean up, debug, and extend the intake process.

## Current Understanding

We are coming out of a major convergence cleanup.

That cleanup gave us a more disciplined frontend shell language, a stricter contract posture, and a more closed-circuit data system.

The next mission is not to abandon that strictness.

The next mission is to use it to make the intake process honest, visible, and dependable.

We are also intentionally slowing down.

Working rule:

- use short action loops
- prefer small examples over broad speculative changes
- verify one thing at a time
- clean the surface before increasing complexity

## What The Convergence Cleanup Achieved

### 1. Shared Frontend Language And Shell Discipline

We now have a more cohesive language for:

- components
- shells
- shared surface behavior
- where drift is allowed
- where drift is not allowed

This matters because we want the four feeder surfaces to keep behaving through the same shared shell/component discipline:

- `Add/Edit File Shell`
- `File Shell`
- `Record Shell`
- `Add/Edit Record Shell`

Working rule:

- do not make one-off local fixes in these feeder surfaces when the real issue belongs in the shared component or shell layer
- keep those surfaces behaving through the same shared building blocks and shell logic
- do not let frontend variation hide backend, data, or runtime truth

### 2. Fallback Removal And Honest Failure

We have been deliberately removing:

- fallback behavior
- guessed mappings
- compatibility shortcuts
- frontend safeguards that keep the app looking like it works when it does not work cohesively

This is intentional.

We are okay with:

- visible failure
- honest empty states
- error messages
- broken paths surfacing naturally when the contract is missing

We are not okay with:

- UI drift that disguises missing structure
- visual success that hides runtime failure
- fake cohesion produced by frontend interpretation

### 3. Closed-Circuit Data Direction

We have also been moving toward a closed-circuit data system.

That means:

- records should be built where they structurally belong
- files should own the records and views that make sense for them
- linked data should remain federated instead of collapsing into one improvised blob
- records should talk to each other through declared links

This matters because intake will only be trustworthy if extracted information enters the right file and link path instead of drifting sideways through convenience logic.

### 4. Intake As The Next Objective

The next major objective is to process incoming documents through the right file path so LLM-assisted extraction can prepare outputs that help humans:

- inspect
- verify
- guide
- and process information safely

The safe direction is:

- documents are processed locally
- operators can understand and keep the outputs
- the resulting file logic can support human review and later sharing
- the same file/path logic can support multiple collaboration scales:
  - teammate to teammate
  - firm to firm
  - region to region

## Front-And-Center Rules

### Rule 1. No Frontend Drift In The Four Feeder Surfaces

The four feeder surfaces must stay strict:

- `Add/Edit File Shell`
- `File Shell`
- `Record Shell`
- `Add/Edit Record Shell`

If one of them needs behavior that the others should also inherit, fix the shared component or shell layer.

Do not patch one page locally just to make it appear finished.

### Rule 2. Record Shell And Add/Edit Record Shell Have Different Jobs

This distinction must remain explicit.

`Record Shell`:

- snapshot
- reading
- inspection
- verification of current record truth

`Add/Edit Record Shell`:

- intake beginning point
- active record formation
- staged review
- guided creation and editing

Working rule:

- do not make `Record Shell` carry the main intake burden
- do not make `Add/Edit Record Shell` pretend it is only a passive record viewer

### Rule 3. Honest Errors Are Better Than Hidden Drift

If something is not working cohesively:

- let it surface
- label it clearly
- keep the failure local and understandable

Do not hide it with:

- guessed defaults
- visual placeholders that imply success
- ad hoc transforms that make bad data look plausible

### Rule 4. Data Must Flow In The Right Direction

As intake grows, we must keep data movement:

- clear
- sequential
- non-circular
- structurally owned

Working rule:

- do not let data bounce between layers until we lose track of source and ownership
- do not allow loop-like behavior that causes repeated or confused processing
- do not let outputs enter the wrong file path just because the frontend can render them there

### Rule 5. Intake Must Stay Inspectable

We should be able to tell:

- what entered the system
- what was saved to disk
- what was written to the database
- what was linked
- what was only suggested
- what still needs human guidance

If the operator cannot tell those apart, intake is not yet trustworthy.

## Intake-Specific Working Regulation

As we move into the intake mission, keep these questions active:

1. Did the frontend reveal the truth, or did it smooth over the truth?
2. Did data go to the right file path, or only to a convenient visible surface?
3. Did the runtime complete the step, or did local state only make it appear complete?
4. Did the next stage begin because the previous one truly completed, or because the UI assumed it did?
5. Are we keeping the process sequential, or are we creating hidden iteration loops?

## Short-Loop Rule

From this point forward, intake work should prefer:

- short and precise testing
- one visible step at a time
- example-first validation
- small corrective loops instead of broad bundled rewrites

We should not try to solve the whole intake mission in one pass while the surface is still being cleaned.

## What We Want To Preserve

We want to preserve:

- strict shell behavior
- explicit shared components
- fail-closed structure
- honest runtime exposure
- federated file ownership
- declared links instead of guessed relationships

We do not want to reintroduce:

- frontend drift
- hidden fallback logic
- fake success states
- one-off page treatment
- circular or ambiguous data flow

## Mission Reminder

The intake mission should now be understood like this:

- convergence cleanup gave us the discipline
- intake work must now use that discipline
- the goal is not to make the process look smoother than it is
- the goal is to make the real process visible enough that we can trust and improve it

## Companion Working Note

When making intake decisions from this point forward:

- prefer structure over convenience
- prefer exposure over concealment
- prefer shared fixes over page-local fixes
- prefer sequential truth over apparent completeness
