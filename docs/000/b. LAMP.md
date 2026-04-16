# Launch Architecture Master Plan

## Purpose

This document is the launch-side counterpart to `DAMP.md`.

## TLDR

Governance defines structure.
Data reflects structure.

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

## Construct Birth Minimum

The app should be able to be born first as a true local system of record.

That means launch should not depend on every possible contextual repository already existing.

The first requirement is a minimum construct that is enough for the app to:

- govern its own files
- record events and history
- know who is using the system
- know who and what the users are working with
- hold local project and task work
- accept intake and artifacts
- preserve guidance and notes locally

Working rule:

- define the minimum construct first
- prove that this minimum construct works as a coherent local system
- only then layer contextual or domain-specific repositories on top

Current construct-birth minimum:

- `System Files`
- `History`
- `Users`
- `Contacts`
- `User Roles`
- `Companion Roles`
- `Projects`
- `Tasks`
- `Notes`
- `Artifacts`
- `Intake`

This minimum set should be enough for the app to function as a true local operating system for records, guidance, intake, and work.

Everything beyond this set should be treated as extension, not birth requirement.

## File Classes

Not all files serve the same role in the construct.

The launch architecture should separate files into three classes.

### 1. Core System Files

These are required for construct birth.

They allow the app to function as a local system of record and workflow.

They regulate identity, structure, actors, events, guidance, intake, and ongoing work.

### 2. General Local Record / Guidance Repositories

These are local repositories that may be important to many workflows, but are not necessarily required for the construct to be born.

They extend the local system without redefining the construct itself.

They should still have clear intention and clear structure ownership.

### 3. Domain / Context Repositories

These are contextual repositories for a specific operating model, project, or domain.

Examples may include venture, deal-sharing, or other future vertical packs.

These are not construct-birth requirements.

They should be layered on only after the core local system is already functioning correctly.

Working rule:

- core files make the system viable
- general repositories extend the local operating layer
- domain repositories serve specific contextual intentions

Do not let domain repositories distort the birth requirements of the core construct.

## Layered Local System Rule

The app should be understood as a layered local system.

This means the construct is not just a flat list of files.

It is a local stack of responsibilities.

### Layer 1. Construct Layer

This layer answers:

- what minimum files must exist for the system to be born
- what kind of local system this app is
- which files are core versus optional

This is the launch and birth layer.

### Layer 2. Structure Layer

This layer answers:

- what each file contains
- which views/sections each file owns
- which tokens each view owns
- which structure is protected versus extendable

This is the governed file-structure layer.

### Layer 3. Data Layer

This layer answers:

- what rows and values exist inside the file
- how records are read and written
- how governed structure appears through shared surfaces

This is the live local record layer.

### Layer 4. Context Layer

This layer answers:

- how domain-specific repositories extend the system
- how specific operating models use the core construct
- how contextual files relate to the core without redefining it

This is the extension layer.

Working rule:

- birth comes first
- structure comes second
- data comes third
- context comes after the core is already coherent

## Information Flow Rule

Information should flow through the local system in a declared order.

### 1. Construct defines what must exist

The construct layer declares the minimum viable file set and file classes.

### 2. System Files define what each file is

`System Files` declares the file registry and the owned `Defined_Structure` for each file.

### 3. Structure defines what each file can render

Each file's `Defined_Structure` declares its views and tokens.

### 4. Governance defines structure changes

`Governance` edits structure.

It does not directly tell data what to do.

### 5. Data reflects current structure

`Data` renders through the active file structure.

If views change, labels change.

If tokens change, columns change.

Shared render rules still apply across renderable views.

At minimum:

- `Name` should remain the first visible identifying column across renderable views
- `ID` should remain carried in the row contract as a hidden identity field

This means data rendering should not be reduced to only the locally declared tokens of one selected view.

The local view still contributes its view-specific columns, but the shared identifying layer must remain present.

### 6. Context extends the system

Domain or project-specific repositories add contextual meaning on top of the core local system.

They should not become hidden birth requirements.

Short rule:

- construct defines existence
- system defines files
- structure defines rendering
- governance defines structure changes
- data reflects structure
- context extends the system

## Relationship View Rule

`LDB` should not be treated as an ordinary local token bucket.

It is a governed relationship view.

That means:

- it is hydrated from the governed local file universe
- it expresses the local closed-system relationship threading
- it should not be interpreted as just another static set of local view columns

Working rule:

- ordinary views may render mainly from their local declared tokens
- `LDB` must render through its governed relationship path

Drift signal:

- `LDB` is treated as if it were just another local extension view
- relationship hydration disappears unless local placeholder tokens are added manually

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

### 5. Structure Mirror Rule

- governance row surfaces must mirror governed JSON structure directly
- the same metadata source should render through the same governed surface everywhere it is edited

Drift signal:

- the same metadata field appears in one shell but not another

### 6. Shared Governance Surface Rule

- `Views` and `Tokens` metadata must be rendered through one shared row-surface grammar
- shared metadata should use one shared contract instead of per-shell column definitions

Drift signal:

- local per-shell token or view column definitions reappear

### 7. Data Surface Contract Rule

- shared row/data surfaces must read the same way everywhere
- control columns, cell-state meaning, scroll behavior, and resize behavior should stay governed
- governance defines structure
- data reflects structure
- governance surfaces are upstream for an active file
- data surfaces are downstream for that same active file
- changing a `View` in governance changes the corresponding label in `DataControl`
- changing a `Token` in governance changes the corresponding column in `DataSurface`

Drift signal:

- one page or dialog starts inventing its own row grammar

### 8. Payload Contract Rule

- shell payloads should come from governed structure plus governed translator logic
- do not let local page code invent payload meaning
- the shared renderer may stay the same across paths
- each data-bearing path should still declare its own explicit data contract
- the contract should say what that path is carrying and why

Drift signal:

- a renderer only works because a page shaped the payload ad hoc

### 9. Translator Rule

- shared interpretation should flow through:
  - canonical input
  - translator
  - builder
  - renderer

Drift signal:

- page-local shaping starts doing translator work

### 10. Declared System Path Rule

- important actions should follow declared ownership and relationship paths
- do not rely on hidden bootstrap exceptions or side helpers as the real operating path

Drift signal:

- a path only works through bootstrap magic and not through declared structure ownership

### 11. File Creation Orchestration Rule

- file birth should be an orchestrated bootstrap pass
- not a long manual assembly task across disconnected layers

Drift signal:

- creating one file still requires too many hand-touched places

### 12. Directional LDB Join Rule

- explicit LDB join contracts must preserve direction
- reverse direction must swap join ownership correctly when needed

Drift signal:

- linking only works from one side
- reverse linking writes into the wrong foreign-key path

### 13. Master Translator Rule

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

Working rule:

- `System`, `General`, and `LDB` are protected shared views
- user-added extension views may exist beyond the shared base
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

Important distinction:

- `Data.Status` is the governed status of the data itself
- file-specific business or entity status belongs in a file-owned extension view

## Launch Structure Surface Rule

The structure-governance surfaces should be born as direct JSON-governance paths.

That means:

- `Views` edits section/view metadata
- `Tokens` edits token metadata
- both surfaces should regulate `Defined_Structure`
- they should not become side tables that only look structural
- `Row Surface` is the shared editable governance surface
- it mirrors governed JSON structure
- it must not invent local column contracts per shell
- if a token or view metadata field exists in structure, it should appear through the same governed surface everywhere that edits it

Visual reading rule:

- blue = editable
- grey = locked

Current target behavior:

- bootstrap shared views and tokens stay protected
- editable cells should expose the governed structure directly
- the app should not invent a second parallel structure model in the UI

Context rule:

- local DB stores the governed file structure
- views/sections give contextual grouping
- tokens carry field meaning and metadata
- shared row surfaces expose and edit that same structure truth
- live shells should render from that contextualized local structure instead of guessing

## Launch Data Surface Rule

Shared row/data rendering should begin from one governed contract:

- one reading grammar
- one control pattern
- one cell-state language
- one scroll behavior
- one resize behavior

Current clean-birth direction:

- `Row Surface` and `Card Surface` remain the shared names
- `Row Surface` is the shared renderer for governed row data and governed metadata
- row surfaces begin with `Select` and `View`
- token-backed column titles come from `Token Label`
- editable = blue
- linked = green
- suggested = yellow
- pre-selected = grey
- verified = black

These should be born as governed defaults, not rediscovered through page drift.

Shared-surface rule:

- one shared renderer may be reused across many paths
- that renderer acts as a shell that reduces mistakes and drift
- each path still needs its own explicit data contract underneath

Examples:

- `File Views` should expose a file-view contract
- `Tokens` should expose a token-metadata contract
- `Views` should expose a view-metadata contract
- translator paths should expose a translator data contract
- intake paths should expose an intake data contract
- companion paths should expose a companion data contract

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
