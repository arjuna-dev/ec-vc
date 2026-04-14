# Planned Migration Pass

## Purpose

This document is the sandbox note-taker for the `Planned Migration Pass` (`PMP`).

It should help us keep a more detailed account of:

- why we may want a future migration pass
- what the current repo is teaching us
- what rules and assets are worth carrying forward
- what a cleaner future build should enforce

This is a starting-point guide, not a strict rulebook.

It should be updated, corrected, and tightened as the work becomes clearer.

## Core Framing

`Planned Migration Pass` does not mean the current work is wasted.

It means that once the governing rules are clear enough, it may be cleaner to rebuild the setup path from the intended end-state instead of endlessly patching toward it.

That means the right framing is:

- not `start over now`
- but `prepare for a future end-state migration pass`

## Why PMP Exists

The current repo is doing two jobs at once:

1. improving the current app
2. collecting the rules, contracts, and approved assets needed for a cleaner future build

That is the important shift:

`we are no longer just patching; we are collecting the recipe for a cleaner birth.`

## What A Future PMP Could Mean

If we eventually run a real migration pass, the goal would be:

- setup and app bootstrap rebuilt from intended architecture
- scaffolding created intentionally
- core flows beginning from governed contracts
- less legacy adaptation carried forward
- fewer remembered exceptions hidden inside runtime behavior

This could be the cleanest way to get to a more coherent system once the architecture is mature enough.

## Current Posture

For now, the right posture is:

- keep this as an explicit future governance direction
- continue current short-loop convergence work
- use current cleanup work to define what a future migration must enforce
- avoid treating the migration idea as permission to stop finishing current convergence

## Convergence-And-Recipe Phase

The current repo should be treated as a convergence-and-recipe phase.

That means the most valuable commits now are not only fixes.

They are also instructions for a cleaner future setup path.

## Recipe Commits

The things most worth preserving now are:

- governance rules
- strict contracts
- shared feeders and translators
- approved BB and system assets
- steward boundaries
- canonical naming
- inspection and debug surfaces
- fail-closed patterns
- setup assumptions we would want to preserve in a future rebuild

These are `recipe commits`, not just cleanup commits.

## Keep Or Rebuild

There are two valid paths:

### 1. Converge In Place

Benefits:

- lower coordination overhead
- current app stays the active lab
- useful while rules are still being discovered

Risks:

- legacy structure can keep pulling work backward
- drift can continue if rules are not enforced tightly

### 2. Parallel Clean Start

Benefits:

- cleaner architecture birth
- less legacy drag
- easier to scaffold from end-state assumptions

Risks:

- higher coordination overhead
- risk of splitting focus too early
- danger of building a clean repo before the rules are actually stable

## Current Recommendation

Right now the better path is:

- keep converging in this repo a bit longer
- explicitly treat the work as building the future recipe
- only start a parallel clean repo once:
  - the guard rails are stable
  - feeder and translator rules are clearer
  - shell contracts are clearer
  - the bootstrap and end-state recipe is concrete enough to follow

## What PMP Should Eventually Enforce

When the migration becomes real, it should enforce at least:

- one governed architecture spine
- strict contract-based shell inputs
- no page-local shaping where shared translator paths should exist
- approved BB and system assets with clear identities
- active docs matching runtime truth
- active file guides matching actual live file structure
- fail-closed shared surfaces
- inspectable translator and feeder paths
- explicit ownership of source, actor, action, and verification state
- cleaner bootstrap and creation order

## Current Tested Patterns Worth Preserving

These already read like migration-worthy patterns:

- `Strict Feeder Chain`
- `Two-Layer Asset Rule`
- `Inspectable Translator Rule`
- `Short-Loop Convergence`

Anything that proves itself should be moved into:

- `docs/000/i. Recipe.md`

Only if it is:

- tested
- understood
- liked
- worth reusing in a cleaner future birth

## PMP And Intake

`PMP` matters especially for intake because intake is one of the clearest places where drift becomes visible.

The migration lens should help us ask:

- where input truly enters
- where files are truly stored
- where outputs are truly generated
- where links are truly persisted
- where the UI only appears to succeed

That means intake work is not separate from PMP.

It is one of the strongest proof cases for it.

## PMP And Translators

`PMP` also matters for translators.

If a shared behavior is important enough to govern, inspect, and name, then it is a strong candidate for cleaner future architecture.

That means translator work done now should help answer:

- what counts as canonical input
- what context must be preserved
- what translator layer owns classification
- what builder layer owns normalization
- what renderer layer stays simple

## Suggested Future Phases

If we later formalize the migration, the phases may look like:

1. guard rails stabilized
2. recipe strong enough
3. bootstrap rules clarified
4. shell contracts clarified
5. translator paths clarified
6. file-guide and architecture docs aligned with runtime truth
7. future clean build begins

This is only a starting outline, not a locked sequence.

## Open Notes

Questions worth revisiting as PMP becomes more concrete:

- when is the current repo converged enough to justify a true migration branch or repo?
- which runtime language should be preserved versus renamed during migration?
- which current docs are architecture authority versus transition memory only?
- which selected `100` file guides are real enough to carry into the future build immediately?
- which translator candidates deserve first-class system identity?
- how much bootstrap should be rebuilt first versus later?

## Working Principle

`PMP exists so the future build can be born from tested guidance, governed contracts, and approved shared structure instead of remembered patchwork.`
