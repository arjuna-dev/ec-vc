# Launch Architecture Master Plan

## Purpose

This document is the launch-side counterpart to `DAMP.md`.

`DAMP.md` holds the broader draft architecture and product-reference layer.

`LAMP.md` should hold the cleaner launch and setup path we want the app to follow as governance stabilizes.

## Working Rule

Use this file for:

- launch architecture
- setup architecture
- clean-birth thinking
- end-state migration thinking once the recipe is strong enough

Do not use this file as a duplicate of `DAMP.md`.

## Current Direction

The core launch-side thought we are preserving is:

We may want a full end-state migration pass once enough governance is stable, so the app can be born closer to the intended architecture instead of continuing to inherit drift.

That means this file should eventually help answer:

- what a cleaner future birth looks like
- which setup steps should be scaffolded from the start
- which recipe entries are important enough to carry into a future clean birth
- which launch/setup paths should be orchestrated instead of manually patched

## Related Docs

- `docs/000/a. DAMP.md`
- `docs/000/i. Recipe.md`
- `docs/000/f. Translator.md`
- `docs/000/e. Token.md`

## Launch Token Rule

The launch/setup path should assume the same ownership chain used by the architecture layer:

- `System Files` / file structure declares the file
- that file owns sections/views
- those sections/views own tokens
- those tokens are the canonical token layer the shell should render from

For clean-birth thinking, this matters because a future setup path should not invent file fields or column names after the fact.

It should be able to scaffold from the governed token layer directly.

Each token should also be able to carry a visible `Definition`, so launch/setup, extraction, and later comparison work can follow one local meaning source instead of relying on vague remembered intent.

## Master Translator Rule

The app should not become the place where truth is trapped.

The intended launch-side posture is:

- user files remain the durable home for meaningful data
- the app acts as the viewing, organizing, translating, and workflow layer
- the app should behave like a `Master Translator`, not like a hidden truth vault

That means launch and setup architecture should keep these concerns separate:

1. `Data Persistence`
   lives with user-owned files and the governed file system

2. `Structure Refresh`
   updates how the app understands, scaffolds, and maps that data

3. `Runtime Reload`
   refreshes the app's active interpretation and rendered view of that data

These should not be collapsed into one vague action.

For launch/birth thinking, this matters because a clean future build should aim for:

- preservable data
- refreshable structure
- reloadable runtime

without forcing the operator to treat all three as the same thing.
