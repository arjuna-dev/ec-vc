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

## Foundational Rules

`LAMP` should carry the clean foundational rules we would want from birth.

That means:

- keep wording precise from the start
- keep ownership explicit from the start
- keep bootstrap structure honest from the start
- prefer one governed rule over many near-duplicates

Working use:

- use `DAMP` to see full current architecture truth
- use `LAMP` to capture the clean birth version of that truth
- use `Recipe` to keep only the parts we have already tested and want to reuse

## Strict Rules

Use this section as the compact rule list we expect the cleaner build to follow from birth.

Each rule here should help us review drift signals in the current app too.

### 1. Durable Local Source Rule

- meaningful data should remain preservable in user-owned local files
- the app may mirror, refresh, and reload that data
- runtime surfaces should not depend on unstable reference files as live truth

Drift signal:

- the app becomes the only practical place where truth lives
- a local source cannot be refreshed or reloaded cleanly

### 2. Shared Base Structure Rule

- files begin from:
  - `System`
  - `General`
  - `LDB`
  - `Other`
- bootstrap shared views must stay explicit and protected

Drift signal:

- new section names appear casually
- shared base fields move without governed structure change

### 3. Token Contract Rule

- token-backed rendering must come from token contract
- token-backed column titles come from `Token Label`
- token meaning comes from `Definition`

Drift signal:

- hardcoded replacement labels or local field guessing reappear

### 4. Structure Surface Rule

- `Views` edits section/view metadata
- `Tokens` edits token metadata
- both regulate `Defined_Structure` directly

Drift signal:

- structure governance surfaces become side tables instead of direct structure editing

### 5. Data Surface Contract Rule

- shared row/data surfaces must read the same way everywhere
- control columns, cell-state meaning, scroll behavior, and resize behavior should stay governed

Drift signal:

- one page or dialog starts inventing its own row grammar

### 6. Payload Contract Rule

- shell payloads should come from governed structure plus governed translator logic
- do not let local page code invent payload meaning

Drift signal:

- a renderer only works because a page shaped the payload ad hoc

### 7. Translator Rule

- shared interpretation should flow through:
  - canonical input
  - translator
  - builder
  - renderer

Drift signal:

- page-local shaping starts doing translator work

### 8. Declared System Path Rule

- important actions should follow declared ownership and relationship paths
- do not rely on hidden bootstrap exceptions or side helpers as the real operating path

Drift signal:

- a path only works through bootstrap magic and not through declared structure ownership

### 9. File Creation Orchestration Rule

- file birth should be an orchestrated bootstrap pass
- not a long manual assembly task across disconnected layers

Drift signal:

- creating one file still requires too many hand-touched places

### 10. Directional LDB Join Rule

- explicit LDB join contracts must preserve direction
- reverse direction must swap join ownership correctly when needed

Drift signal:

- linking only works from one side
- reverse linking writes into the wrong foreign-key path

### 11. Master Translator Rule

- user files remain the durable home of meaningful data
- the app is the viewing, organizing, translating, and workflow layer

Drift signal:

- the app becomes the only place where truth effectively lives

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

Each token should also be able to carry a visible `Definition`.

Working rule:

- `Definition` is token metadata
- it is not the same thing as record `Summary`
- launch/setup, extraction, and later comparison work should follow that local token meaning source instead of relying on vague remembered intent

## Launch Base Structure Rule

The clean birth structure should begin from one governed shared base:

- `System`
- `General`
- `LDB`
- `Other`

Working rule:

- `System`, `General`, and `LDB` are protected shared views
- `Other` is the first governed extension lane
- user-added views may exist beyond `Other`
- bootstrap should not begin from vague or drifting section names

Shared base expectation:

- `System`
  - `ID`
  - `History`
  - `Data.Status`
- `General`
  - `Name`
  - `Summary`
- `LDB`
  - always present
  - hydrates from active linkable files in the governed `System Files` universe
  - should follow approved LDB relationship rules rather than local manual guessing
- `Other`
  - empty by default

Important distinction:

- `Data.Status` is the governed status of the data itself
- file-specific business or entity status belongs in `Other` or another file-owned view

## Launch Structure Surface Rule

The structure-governance surfaces should be born as direct JSON-governance paths.

That means:

- `Views` edits section/view metadata
- `Tokens` edits token metadata
- both surfaces should regulate `Defined_Structure`
- they should not become side tables that only look structural

Visual reading rule:

- blue = editable
- grey = locked

Current target behavior:

- bootstrap shared views and tokens stay protected
- editable cells should expose the governed structure directly
- the app should not invent a second parallel structure model in the UI

## Launch Data Surface Rule

Shared row/data rendering should begin from one governed contract:

- one reading grammar
- one control pattern
- one cell-state language
- one scroll behavior
- one resize behavior

Current clean-birth direction:

- `Row Surface` and `Card Surface` remain the shared names
- row surfaces begin with `Select` and `View`
- token-backed column titles come from `Token Label`
- editable = blue
- linked = green
- suggested = yellow
- pre-selected = grey
- verified = black

These should be born as governed defaults, not rediscovered through page drift.

## Launch Translator Rule

Important shared interpretation work should be born as governed translator paths.

That means:

- canonical input first
- translator classification second
- builder normalization third
- renderer last

Working rule:

- do not let shared interpretation begin as page-local helper code if it is obviously cross-surface behavior
- if a shared behavior needs inspection, give it a named translator path early

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
