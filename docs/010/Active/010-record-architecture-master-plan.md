# Record Architecture Master Plan

## Status

This document is now the primary working reference for:

- overall objective
- governing rules
- architecture direction
- execution plan
- progress tracking
- the current normalized `File -> Card -> Record View` system framing

This document should be treated as the single planning source of truth for the `File -> Card -> Record View` architecture.

Companion behavior and ingestion-side structural discipline should also stay aligned with:

- `docs/002/Active/002-Companion_Manual.md`
- `docs/300/Active/300_Game_Rulebook.md`
- `docs/020/Active/020_Game_Steward.md`
- `docs/999/Active/999-ECS_Workstream_Tracker.md`

When decisions change:

- update this file
- do not create parallel architecture docs unless there is a strong reason
- use the progress tracker here to reflect what is approved, in progress, and complete

For the current first-pass architecture work, the active workbook schema reference is:

- `docs/B10_DOS v260400 vrev.xlsx`
- `docs/000-workbook-schema-companion.json`
- `docs/000-canonical-structure.json`

That workbook should be treated as the active structural reference used to validate and refine the first approved architecture pass.

The JSON companion should be treated as a workbook-derived reference layer, not the app-owned canonical registry.

During this phase, the intended direction is:

- `Workbook` helps define and validate the structure
- `docs/000-canonical-structure.json` is the canonical machine-readable structure layer used by the app
- the app should edit that canonical JSON structure directly
- exporters and importers should remain available as adapters for migration and outside data sources

## Objective

Make the app function cohesively from `File` to `Card` to `Record View`.

That means:

- every workbook-backed entity should follow one clear structure
- file views should stay lightweight and fast
- record views should be richer and more correct
- KDB should behave consistently
- addresses, sections, payloads, and UI should all refer to the same underlying structure

The goal is not just visual consistency.

The goal is operational consistency:

- the same entity should mean the same thing in workbook structure
- the same entity should expose the same section logic in payloads
- the same entity should render predictably in file view and record view

## Highest Priority

The highest-priority architecture workflow is now:

- consolidate new `L1` bootstrap into one canonical contract
- derive as much UI/runtime registration as possible from that contract
- validate anything not yet derived so incomplete `L1`s fail loudly instead of rendering half-wired

Reason:

- shared shells are already converging
- runtime `L1` bootstrap is still too distributed
- if a new `L1` requires too many manual touch-points, canon is not yet doing enough work
- if canon is not driving efficient implementation, the UI will continue to look cleaner than the underlying system really is

The intended steady state is:

- define a new `L1` once
- derive shell/navigation/runtime expectations from that definition
- validate the remaining runtime hooks against that definition
- reject visible-but-nonfunctional `L1`s as architecture failures

This is the best route because it:

- reduces drift
- lowers implementation cost for future `L1`s
- keeps shell behavior predictable
- scales better as record count, relationship count, and payload count increase
- turns broken UI states into validation failures instead of late discoveries

### File Creation Orchestration Rule

The `Files` exercise confirmed that new file birth is still too manual.

Current truth:

- a new first-class file can be created
- but doing so still requires too many hand-touched layers
- that means file birth is understandable, but not yet semi-automatic

Architectural rule:

- file creation should become an orchestrated bootstrap pass, not a long manual assembly task
- if a new normal file still requires repeated manual edits across canon, registry, route, shell loader, sqlite schema, preload bridge, and runtime handlers, the orchestration layer is incomplete
- the system should derive as much of this path as possible from one approved file-birth contract

Practical implication:

- the app should eventually be able to create a new normal file from one canonical definition plus one approved creation step
- all remaining non-derived steps should be explicit validations, not hidden manual chores

This matters because:

- it lowers implementation cost for future files
- it reduces structural drift at birth
- it makes file creation fast enough to match the way the product is actually being shaped
- it keeps canon, shell, runtime, and sqlite ownership speaking the same language

The reasoning matters more than the order alone:

- `File Folder` and `File Registry` are not first only for sequencing convenience
- they are first because they become the architectural input layer for the rest of the file system
- once they exist, a new file should be creatable by first creating a new `Files` record and declaring what that file is
- that record should tell the system whether the new thing is:
  - a true `L1`
  - an `L2`
  - an `L2.a`
  - or another approved structure layer
- that classification should help determine:
  - whether shared `System` applies
  - whether shared `KDB` applies
  - who owns the file
  - whether the file is owner-only
  - which shell and runtime rules should apply
  - which steward/file-guide rules should apply

So the `Files` layer is meant to become:

- the first file-definition registry
- the first file-governance registry
- the first guide/input layer for both humans and LLMs

This is why it must exist before `Owner`, `Users`, `Contacts`, and the rest of the operational file set.

### File Visibility Acceptance Rule

The current app still has visibility drift between:

- registry-driven file acceptance
- layout-driven manual menu injection

Current technical truth:

- `src/utils/structureRegistry.js` already defines a canonical file registry
- `WORKSPACE_FILE_NAV_ITEMS` is derived from that registry through `showInWorkspaceNav`
- but `src/layouts/MainLayout.vue` still manually injects additional file items into the visible drawer navigation

That means some files can appear visible because the layout says so, even when the registry does not yet treat them as visible accepted files.

This is important because it creates a false signal:

- the UI can make a file look accepted
- while canon, registry, and runtime acceptance are still not fully aligned

Working rule:

- file visibility should come from the accepted file-definition layer
- layout should not manually reintroduce file items except for explicitly declared system-level exceptions
- if a file is visible, that visibility should mean it has been accepted through the canonical file-definition path

Why this matters:

- otherwise we can think a file has been accepted as an `L1` when only the layout has surfaced it
- this weakens the file-creation contract
- it makes RAMP order, file acceptance, and runtime ownership drift apart

So the intended direction is:

- one registry-driven acceptance rule
- layout as renderer, not second source of truth
- explicit exceptions only

### Containment Rule

As the architecture grows, complexity should come from composition and approved order, not from multiplying leaf components or adding convenience variants.

Working rule:

- do not keep creating new leaf components when an approved existing component can be used
- do not keep adding new buttons, modes, or special-case functionality without explicit approval
- prefer changing the approved underlying component over adding a parallel convenience version
- prefer composition over new primitives
- keep the system contained so complexity emerges from the ordered structure rather than from extra small parts

### Canonical L1 Bootstrap Map

The consolidation map should be:

1. one canonical `L1` contract definition
2. derived route/registry/navigation/shell labeling
3. shared runtime owner registration for `list/create/update/delete`
4. KDB declarations that are runtime-checked against canon
5. a validator that rejects incomplete `L1` bootstrap
6. proof-case implementation through one real `L1`

The canonical `L1` contract should carry:

- canonical entity name
- runtime table name
- source key
- route/path
- nav label/icon/group
- shell eligibility
- required subsections
- runtime capabilities
- KDB declarations
- bootstrap defaults
- shared base `System` parameter set
- shared `KDB` linkage-section requirement
- shared base `General` parameter set
- optional branch metadata when the `L1` supports subtype routing
- optional explicit `L2.a-b-c-d` subgroup metadata when one subsection needs structured internal grouping

### Shared L1 Base Rule

Every normal `L1` should begin from one shared canonical base before any entity-specific structure is added.

That shared base should include:

- shared `System`
- shared `KDB`
- shared `General`

And the fixed shared parameter sets inside that base should be:

- `System`
  - `ID`
  - `Creator`
  - `Datetime`
  - `EventLog`
- `General`
  - `Name`
  - `Summary`

`KDB` should also always exist in the shared base, but as the linkage section.

It should not be treated as one universal fixed list of relationship leaf tokens.

Working rule:

- do not create a new normal `L1` by inventing entity-prefixed copies of shared base fields
- after the shared base is in place, the entity may add its own `L2`s and explicit `L2.a-b-c-d` subgrouping
- this keeps activation, linking, and shell behavior aligned across the file system

The validator should fail if an `L1` is missing:

- canonical entity
- runtime table
- route/path
- registry/nav presence
- preload bridge ownership
- ipc/runtime handlers
- create/edit shell support
- required subsections
- KDB relationship contract
- reciprocal read behavior

### Genesis Schema Baseline Rule

`Owner Genesis` should initialize the current approved schema baseline exactly as it currently exists in `src-electron/services/sqlite-schema.js`.

That means the app should create and own the current baseline table set as part of node initialization, including:

- system/runtime tables such as `app_settings`, `Owner_DB`, `events`, `databook_snapshots`, and `Field_Verification_Metadata`
- current first-order `L1` tables such as `Companies`, `Funds`, `Rounds`, `Users`, `Contacts`, `Projects`, `Tasks`, `Notes`, `Roles`, `Artifacts`, and related current working record tables
- current knowledge/reference tables such as `Industries`, `Round_Securities`, `Regions`, `BusinessModels`, `SectorGroups`, `VerticalIndustries`, `VC_Terms_Glossary`, and related current supporting tables
- current owned subtables and current relationship/join tables exactly as they are presently declared
- current linkage/runtime tables such as `Users_Roles`, `Artifacts_Processed`, and `KDB_Relationships`

Working rule:

- `Genesis` should not invent a smaller temporary schema
- `Genesis` should install the current approved schema baseline as-is
- later marketplace-delivered `L1`s may extend that baseline, but should not weaken or fork it casually

Branch capability rule:

- branch capability is a normal architecture feature, not a one-off exception
- any `L1` may declare branch metadata when create flow must choose a subtype route first
- branch metadata should be explicit in canon and registry, not implied by page-specific UI

### Owner Genesis File Order Rule

`Owner Genesis` should not only initialize schema. It should also create the first file system in sequence.

Working rule:

- `Master Companion` is the acting bootstrap operator for sequential genesis creation
- the first paired bootstrap items should be:
  - `File Folder`
  - `File Registry`
- `System Files` should be treated as the genesis repository layer and should render first because the rest of the file system depends on it
- after `System Files`, the next thing loaded should be the governing `Rule Books`
- after the `Rule Books`, `BB File` should load because the visible building language should exist before the rest of the file surfaces are interpreted
- those two should exist before `Owner`, `Users`, `Contacts`, and the rest of the base bootstrap records
- the first operational file created after `BB File` should therefore be the root `Files` registry surface
- the second file created should be `Events`
- the rest of the current base file system should then be created in approved order
- file creation should happen before file-owned bootstrap records are created

Reason:

- after `File Folder` and `File Registry` exist, they should be used to create the next files through the same declared structure
- the next crucial proof file set is the owner identity pass:
  - `Owner`
  - `User Roles`
  - `Contact`
  - linked `User` identity as needed
- this should happen before the companion install pass so authority and identity are grounded first
- after that:
  - `Companion`
  - `Companion Roles`
  - the first installed companion workers such as `File Steward`, `Project Guide`, and `Points Tracker`
- those companions should only be installed after the files and documents they depend on already exist
- so the early bootstrap chain should remain easy to reason about from the file-definition layer outward

System-level exception rule:

- `BB File` (`Building Blocks File`) should be treated as a special `System-Level File`
- it is not a standard operational `L1`
- it should not be confused with the normal app-data bootstrap contract
- it renders conceptually before the operational files because it defines the visible building language and component canon of the app
- this is a controlled exception and must not be used to weaken the normal `L1` bootstrap rule for the rest of the file system

Current approved first-pass genesis file order:

1. `System Files`
2. `Rule Books`
3. `BB File`
4. `Owner`
5. `User Roles`
6. `Contact`
7. linked `User` identity
8. `Companion`
9. `Companion Roles`
10. install first companion workers:
   - `File Steward`
   - `Project Guide`
   - `Points Tracker`
11. `Events`
12. `Projects`
13. `Access Assignments`
14. `Tasks`
15. `Notes`
16. `Artifacts`
17. `Ingestion`
18. `Companies`
19. `Opportunities`
20. `Funds`
21. `Rounds`
22. `Markets`
23. `Securities`
24. remaining current supporting `KDB` / reference files

First-pass L1 micro-summary:

- `System Files`: the file-definition repository and genesis layer for the rest of the file system
- `Rule Books`: the governing rule layer that tells stewards how creation, upkeep, and validation should work
- `BB File`: the visible building-language layer for reusable shell, page, and component canon
- `Owner`: the root authority primitive and local workspace founder identity
- `User Roles`: the first role definition layer for authority and participation
- `Contact`: the people and address-book layer
- `User`: the access identity linked to a contact when that contact can enter the `Owner` LDB
- `Companion`: the companion operating surface and manual layer
- `Companion Roles`: the role catalog for companion workers
- `Events`: the provenance layer that proves creation, activity, and later reconstruction
- `Projects`: the operational work container and access scope
- `Access Assignments`: the governed access layer connecting contacts/users to project-scoped roles inside the Owner LDB
- `Tasks`: the action/work tracking layer
- `Notes`: the lightweight knowledge and observation layer
- `Artifacts`: the raw source-material layer
- `Ingestion`: the processing and extraction layer that turns source material into structured candidates
- `Companies`: the company/profile operating layer
- `Opportunities`: the deal or opportunity branch layer
- `Funds`: the fund-specific investment layer
- `Rounds`: the financing-round-specific investment layer
- `Markets`: the market/reference layer
- `Securities`: the security/instrument reference layer

Execution rule:

- create the file
- create the base genesis records inside that file
- create the required relations
- log the creation into `Events`

This matters because:

- `BB File` establishes the visible building language and reconstruction canon before the rest of the product file system is interpreted
- `File Folder` gives the system its first real file container surface
- `L1 Files` is the root file registry and must exist before the rest of the file system can be treated as coherent
- `Rule Books` should load before deeper operational creation because they tell the system and the stewards how file creation and upkeep should work
- `Events` should exist before later genesis work is logged
- the file-definition layer should also supply the guidance needed to make rendering more straightforward through:
  - file guide rules
  - settings
  - explicit ownership classification
  - explicit structure classification
- later marketplace-delivered `L1`s should plug into this same file-first bootstrap model instead of bypassing it
- `Events` should be treated as a first-class file/entity in the same contract system as the rest of the file surfaces

### BB File Contract

`BB File` means `Building Blocks File`.

It should be treated as a special `System-Level File`.

Role:

- canonical registry for reusable UI building blocks
- design primitives
- shell parts
- reconstruction guidance

Working rule:

- `BB File` is not a standard app-data `L1`
- it should not inherit the normal `System` / `KDB` subsection baseline used by standard files
- this exception is intentional because `BB File` governs UI-building canon rather than operational record relationships
- do not use this exception to weaken the standard contract for operational `L1`s

Approved first-pass `L2` structure for `BB File`:

- `General`
- `Usage`
- `Anatomy`
- `Source`
- `Reconstruction`
- `Variants`

### Building Blocks to Shell Contract Migration

The next shared-UI architecture project should be `Building Blocks to Shell Contract Migration`.

Purpose:

- finish the missing foundational building block map
- extract remaining local UI samples into real shared components
- move shell placeholders onto explicit shared building block and shell payload contracts
- keep `BB Shell` as the single working surface for component review and migration

### BB Graph Rule

`BB File` should not be treated as a flat list only.

Once `Built From BBs` exists, the catalog should also be treated as a structural graph.

This matters because `Building Blocks` are not only a UI catalog. They are the compositional layer that should carry backend architecture, runtime ownership, shell contracts, and final UI/UX through one continuous system.

Graph field rule:

- `Built From BBs` is a permanent architecture field
- it should stay in the BB contract because it defines real composition and dependency structure
- `Convergence Rule` is not the same kind of field
- `Convergence Rule` is temporary migration scaffolding used only while a primitive or shared element is still converging
- once a token family or building block is fully stabilized and migrated, `Convergence Rule` should be cleared, hidden, or removed rather than treated as permanent structural weight
- the BB system should stay lean over time, so migration governance must not be allowed to harden into unnecessary permanent metadata

That means `BB File` should support these structural classifications:

- `Elementary` / `Leaf Blocks`
  - blocks that have no child BB dependencies
  - they are built from nothing lower in the BB system
  - these are typically base buttons, icons, tokens, and other small controls

- `Parent Blocks`
  - blocks that are built from other BBs
  - these are typically title rows, dialog rows, dashboards, toolbars, and other composite shell structures

- `Root` / `Top-Level Blocks`
  - blocks that are not children of any other BB
  - they sit at the top of the composition tree

- `Child Blocks`
  - blocks that are used inside other BBs

Architectural value unlocked by one explicit dependency field:

- leaf detection
- parent detection
- root detection
- child detection
- full composition trees

This matters because the product should be able to ask:

- what are the true elementary primitives?
- what can be reused safely everywhere?
- which blocks are composite?
- which top-level blocks are ready to assemble shells?

Working rule:

- no BB element should visually depend on unnamed or untracked reusable sub-elements
- if a BB element uses another reusable element, that dependency should be explicitly tagged in `Built From BBs`
- the BB catalog should therefore function as:
  - inventory
  - usage map
  - dependency map
- this dependency map is what lets backend structure drive cleanly through shell composition into visible UI/UX

Required migration sequence:

1. Finish foundational mapping:
   - fonts
   - type scale
   - font weights
   - colors
   - surfaces
   - borders
   - radius
   - shadows
   - spacing
   - icon sizing
   - number/date formatting
   - motion rules
2. Finish missing building block coverage for file, record, and shell placeholders.
3. Extract the remaining local samples into real shared components.
4. Move shell placeholders onto explicit shared payload contracts.
5. Validate that real app surfaces consume the same shared components and design-token rules as `BB Shell`.

Working rule:

- `BB Shell` is the migration surface
- `General Settings` should become the source of truth for foundational visual tokens
- shells should consume shared components and explicit payload contracts instead of re-rendering local page-specific markup

Section meanings:

- `General`: name, category, status, purpose
- `Usage`: where used, when to use, when not to use
- `Anatomy`: required visual structure and component parts
- `Source`: canonical shared source path, ownership, extraction status
- `Reconstruction`: reconstruction notes and reusable prompt
- `Variants`: approved payload or style variants

### Marketplace Extension Rule

When a marketplace exists, it should be able to distribute new `L1` infrastructure between users/nodes.

That means:

- a user should be able to download an approved external `L1`
- we should also be able to send/install new `L1` tables that complement existing infrastructure
- marketplace `L1`s must still pass the same canonical bootstrap contract as local owner-created `L1`s
- marketplace delivery is an extension path, not an exemption path
- imported `L1`s must declare canon, runtime ownership, shell behavior, KDB behavior, and validation scope before they are treated as live

Proof rule:

- `Companion Roles` should be treated as the first proof-case for this consolidated bootstrap direction
- do not just patch `Companion Roles`
- use it to prove the bootstrap contract, runtime owner path, and KDB validation path

## Record Shell Direction

`Record Shell` is now the approved shared direction for `Record View`.

Working rule:

- do not keep separate record-detail page implementations drifting by entity
- converge on one shared `Record Shell`
- route-level record navigation should ultimately resolve into that shell for the selected record
- the shell should use the selected record as payload input, not as a reason to fork the view layer

Current runtime status:

- shared `record-view` route resolution now points at `RecordShellPage.vue`
- opening a record from an `L1` now lands in the shell route for that selected record
- the shell now loads the selected record through `databooks.view(tableName, recordId)`
- the standalone `record-shell` route remains available as the shell payload-testing surface
- the old `RecordPage.vue` surface has now been removed

The currently approved shell pattern is:

- use the current `User Record View` hero/dashboard as the base shell
- do not approximate that pattern once the real shell already exists
- only change explicitly approved shell controls and payload-fed content

The currently approved middle hero contract is:

- `Name` is the top anchor row
- icon-only `settings` and `add record` controls sit beside `Name`
- below `Name`, selected `L3` rows begin in the left column
- `Summary` is the first row in the right column
- each selected `L3` row renders as:
  - top row: label + `L2` description
  - bottom row: current value + status icon

Shared selection rule:

- the selected middle-field set belongs to the shared shell contract
- `File Shell` card settings and `Record Shell` hero settings should read the same per-`L1` field-selection state
- changing the selected middle fields in one shell should be reflected in the other
- do not maintain separate card-only and record-only field-selection memories

Working interaction rule:

- `Record View` should move toward live editing inside the shell itself
- the old dedicated edit button is not the long-term interaction model
- the plus action is for creating another record

## Game Layer Constraint

The game layer is now an approved top-layer direction.

It should help:

- users
- companions
- future bots

focus on the right objectives through:

- points
- quests
- rankings
- stage boards
- Game Steward guidance

But it must remain constrained by the underlying architecture.

That means:

- game logic must not replace ownership logic
- ranking must not replace verification
- quests must not pretend an incomplete runtime path is structurally complete
- stage progress must not hide missing owner paths or reverse-read gaps

Working rule:

- the game layer may surface issues
- the architecture layer must still fix them

## Task / Goal Framing

This initial architecture pass is meant to define the first clean, stable structure for the system.

For this phase:

- the `Workbook` is the first-pass validation and design reference
- the app uses canonical JSON to establish order, ownership, and consistency
- the UI should align to that structure while we standardize the system

But the intended product architecture after this first pass is:

- `JSON` as the app-readable structure source of truth
- app editing against that `JSON` structure
- exporter/importer tools for migration, intake, and outside sources such as Excel

This does **not** mean the workbook must permanently lead every future design decision.

The intended long-term understanding is:

- `workbook-first` for initial standardization
- `UI-informed workbook evolution` later

In other words:

- right now, the workbook helps us create the first approved architecture
- later, once the product model is mature, the UI may become the stronger design reference
- at that point, workbook layouts can be refined to follow the approved UI model

So the current goal is not to freeze the workbook forever.

The current goal is to keep canonical JSON, workbook validation, and UI behavior aligned during the first cohesive system pass.

## Governing Model

The current structural authority is:

`Canonical JSON -> DB Tables -> Payload -> UI`

More clearly:

- the `Canonical JSON` defines app-owned intended structure
- the `DB Tables` should stay aligned to that structure
- the `Workbook` and companion remain validation and reference surfaces
- the `Payload` is built from the DB
- the `UI` renders the payload

This is not a purely one-way system, because the workbook files are themselves mirrored from the DB.

So the practical meaning is:

- `Canonical JSON` is the canonical structure reference
- `DB` is the runtime source
- `Payloads` must reflect canonical structure
- `UI` should not invent structure on the fly

When live row payload fields still use older DB column names, canonical tokens should carry explicit DB aliases rather than forcing the UI to guess.

Working rule:

- the shell should resolve a field through canonical address and canonical token first
- if the live payload field name differs, that token should declare `db_field_aliases`
- the UI may read those aliases, but it should not infer them heuristically
- companion systems should follow the same ownership rule and should not invent field meaning outside canon

Universal shell rule:

- this is not an `id`-only exception
- alias declaration belongs to the `L3` token contract for any token whose runtime payload name differs from its canonical token name
- the same rule must hold across `File Shell` and `Record Shell`
- do not solve these gaps with page-level or record-level one-offs
- if a token needs runtime mapping, declare it in canon and workbook companion so every shell reads the same contract

Shared dialog shell rule:

- the shared create / edit dialog is only a true shell if every launching surface passes the same canonical payload contract
- `File Shell`, `Record Shell`, and any future shared shell surface must not pre-interpret grouped `L2` structure differently before opening the dialog
- if one surface sends grouped subsection payloads and another sends flat section payloads, that is shell drift, not an acceptable variation
- page-level payload shaping for the shared dialog should be treated as architectural debt unless it is identical across shell surfaces
- do not solve drift page by page
- if the same behavior appears in more than one address, stop and move upward to the shared shell layer
- entity-specific `*CreateDialog.vue` components are no longer an approved architecture path
- shared add/edit behavior should now converge only through the approved `Add/Edit Record Shell`

Branch selector rule:

- if a create flow contains a selector whose job is to choose a subtype path, treat it as structural shell control
- do not treat that selector as a normal saved field
- do not render subtype-owned sections until the branch selector has a settled value
- once selected, the branch selector should determine:
  - which subtype payload is shown
  - which create bridge is used
  - which write contract applies
- if the branch choice is exposed as its own route-owned surface, that surface is a shared shell in its own right, not an entity-local helper
- `Fork Shell` must stay independent from `Opportunities` page behavior
- `Opportunities` may declare branch metadata, but it must not own the `Fork Shell` renderer, chrome, or route behavior
- `Fork Shell` should remain mounted as a shell route after close, the same way `Add/Edit Record Shell` remains mounted after close

Current approved example:

- `Opportunity_Kind` is the branch selector for the `Opportunities` create flow
- it exists to choose `Fund` or `Round`
- that choice should happen before overview and subtype-owned sections appear
- if the shell later tries to write `Opportunity_Kind` into `Funds` or `Rounds` as if it were a normal field, that is a contract bug
- `Funds` and `Rounds` remain two distinct concrete tables under that branch choice

Correct evidence statement:

- the observed evidence was that the shared edit dialog behaved differently depending on which `L1` source launched it
- that observation should be kept separate from any later hypothesis about which shell path caused the drift
- architectural conclusions should only be stated as fact after the payload path is actually traced

Payload builder relevance:

- a shared payload builder matters because canonical `L1-L2-L3` structure alone does not automatically guarantee one shell-ready render shape
- the builder is the last-mile translation from canon into the exact shell payload
- long-term, that improves:
  - consistency
  - speed of change
  - lower break risk
  - cleaner action handling at scale
- it also gives the app:
  - less drift as more `L1`s and actions are added
  - better performance discipline by centralizing transformation
  - safer action systems through shared addresses and write targets
  - easier debugging
  - faster future feature work
  - more trustworthy database-facing behavior

Shell styling rule:

- shell styling must stay fixed at shell level
- do not map `L1` to shell theme changes
- do not map `L1` to avatar color changes
- `L1` may change:
  - payload
  - labels
  - section/token membership
  - declared capabilities, when explicitly approved
- `L1` should not silently restyle the shell

## KDB Relationship Contract

KDB relationships must now be treated as real system paths, not as optional UI affordances.

Naming direction:

- the intended future label for `KDB` is `LDB`
- `LDB` means `Local DataBase`
- the meaning is the local file-to-file and record-to-record relationship layer inside the owner's local system
- current runtime names may still say `KDB` until a deliberate staged rename is performed
- do not rename docs, UI labels, sqlite tables, relationship contracts, and canonical sections independently
- the rename should be treated as one architecture pass, not a piecemeal cleanup

Current shared-shell launch rule:

- card-view `Add Relation` should route into `dialog-shell`
- that launch should carry the source `L1`, clicked record id, and canonical entity name
- the shared `Add/Edit Record Shell` should open directly in `KDB`

If a KDB relationship token is declared in canonical structure, the system should assume that relationship is intended to be real and operational.

That means every declared KDB relationship must eventually have:

- one real owner path
- one reverse-read path
- bidirectional appearance from both linked `L1`s
- one shared relationship contract across `Page View`, `Card View`, and `Record View`

Working rule:

- the shell must not guess or simulate relationship behavior
- relationship tokens should not be written like normal columns
- if a relationship owner path is missing, that is a contract gap, not a shell-rendering problem
- reverse appearance is part of the contract, not a later enhancement
- context-aware artifact assumptions may be surfaced as `default/preselected unverified`
- those assumptions should be clearly marked as verification-ready, not silently treated as true links
- when the artifact is added from the `Artifacts` file itself, no extra parent-page context should be inferred
- ingestion should begin from the linked source artifact and should not create a second artifact record until a downstream output document is created

## Field Verification Metadata

The app now has one shared field-level verification metadata layer.

Its purpose is to track field state without duplicating the field itself.

The value stays in the real record field.

The status of that value lives in shared metadata such as:

- `table_name`
- `record_id`
- `field_name`
- `state`
- `source`
- `confidence`
- `verified_by`
- `verified_at`

Working rule:

- do not create shadow tables per field
- do not duplicate the record value just to track review state
- store the value once
- store the verification/preselection state separately in the shared metadata layer
- store shared history in `events`
- group meaningful edit boundaries with one shared `action_id`

### Mandatory Relationship Standard

For the current architecture pass, KDB relationships should be understood in three states:

1. `Declared`
- the relationship exists in canonical structure

2. `Runtime-backed`
- the relationship has a real owner path underneath it, such as a join table or owned subset path

3. `Bidirectionally rendered`
- both linked `L1`s can read that same relationship back through their KDB surfaces

The intended steady state is:

`Declared -> Runtime-backed -> Bidirectionally rendered`

No relationship should be treated as complete until all three are true.

### New L1 Rule

When a new `L1` is created, it must be treated as a full architectural bootstrap by default.

Authority rule:

- new `L1` bootstrap is `Owner`-only authority work
- it is not a normal shared-shell create action
- it is not a normal file-page add-record action
- non-owner users/roles should not be able to trigger new `L1` creation from the product UI

That means:

- the new `L1` must be implemented as a real new canonical source/table, not just a route or visible shell option
- the canonical entity must be added to `docs/000-canonical-structure.json`
- route, registry, shell, and navigation must be added together
- runtime ownership must be added for:
  - `list`
  - `create`
  - `update`
  - `delete`
- add/edit/create flows should work immediately once the `L1` is introduced
- the new `L1` should not be left in a visible-but-nonfunctional state
- validation should confirm the new `L1` is actually createable/editable before the task is treated as complete

Relationship bootstrap is part of the same rule:

- new normal `L1` creation should also create the reciprocal KDB bridge layer with the rest of the bootstrap
- relationship bridge work should not be treated as an optional later pass after the file/table/runtime owner already exists
- if a new `L1` is born without its reciprocal KDB bridge layer, that bootstrap is incomplete

Default subsection baseline:

- every new `L1` should at minimum expose:
  - `System`
  - `KDB`
- `General` should also be created when that is part of the current standard

KDB propagation rule:

- the new `L1`'s KDB relationship contract should be created with it
- the new `L1` should not declare relationship tokens casually
- each declared relationship should have an approved owner path
- each declared relationship should have an approved reverse-read path
- new connections should follow the same relationship contract as existing ones
- do not create one-off relationship behavior for a single page, dialog, or record surface
- reciprocal KDB updates across the other relevant `L1`s are part of the initial implementation, not a later polish pass
- if the intended product rule is that records should be linkable across the DB set, that propagation must happen during the `L1` bootstrap itself
- reciprocal KDB declarations should be born with the `L1`, not manually discovered later
- the bridge contract should also be born with the `L1`, not hand-added only after drift is noticed
- bootstrap should decide whether each approved relationship uses a dedicated join table or the shared `KDB_Relationships` owner path
- manual back-wiring after file birth should be treated as a temporary repair, not as the intended architecture rule

### New L1 Bootstrap Algorithm

The intended birth sequence for a new normal `L1` is:

1. create the canonical `L1` entity definition
2. create the real table/runtime owner for that `L1`
3. create the shared base subsections:
   - `System`
   - `KDB`
   - `General`
4. create the shared base parameters:
   - `System`
     - `ID`
     - `Creator`
     - `Datetime`
     - `EventLog`
   - `General`
     - `Name`
     - `Summary`
5. create the entity-specific `L2` extensions and any approved `L2.a-b-c-d` subgrouping
6. create the reciprocal KDB declarations against the approved active `L1` set
7. decide the owner path for each approved relationship:
   - dedicated join table
   - shared `KDB_Relationships`
8. create the bridge contract and reverse-read path for each approved relationship
9. add route, registry, shell, and navigation ownership
10. confirm list/create/edit/delete and shell launch behavior are working

Validation rule:

- a new `L1` should not be treated as born correctly until all ten steps are complete
- if the table exists but reciprocal KDB bridge work does not, the `L1` birth is still incomplete
- if the shell exists but the runtime owner path does not, the `L1` birth is still incomplete

### Bootstrap Priority Set

Before the broader normal `L1` set is born, the system should support a small priority stack for early render/load order.

Current intended priority order:

1. `User Basics`
2. `Master Companion`
3. `File Steward`
4. `Game Packs`

Working interpretation:

- `User Basics` should establish the first network/team foundation
- `Master Companion` should establish orchestration authority
- `File Steward` should load before the first game pack so file/game structure can be created and kept disciplined
- `Game Packs` should load after that steward layer is present

Current game-pack direction:

- `File Steward` should preload before any game pack
- the first game pack inside the game-pack set should be `Investor Game Pack`
- additional planned game packs include:
  - `Advisor Game Pack`
  - `Company Game Pack`

### Current Mandatory KDB Set

The currently approved KDB direction is:

- every first-level working `L1` should be able to relate through KDB to the other first-level working `L1`s where that connection is canonically declared
- those relationships should be visible from either side once they are truly backed

Current parent-shell exception:

- `Opportunities` is still the parent shell concept over `Funds` and `Rounds`
- until it has a true runtime-backed record table/view contract, it should not be treated as a direct live KDB target
- use `Funds` and `Rounds` as the concrete opportunity-side KDB targets for now

KDB display grouping rule:

- KDB should now support two display families inside the shared shell:
  - `First-Order`
  - `Knowledge DB`
- these are grouping contracts for browsing clarity
- they do not replace the underlying token declarations

Basic `L1` structure rule:

- every `L1` should at minimum expose:
  - `System`
  - `KDB`

### Current Canon KDB Baseline

The current canon-level KDB baseline for shared shells should be treated as follows.

Approved rule:

- all first-order `L1`s should be inter-related through declared KDB tokens
- visible knowledge-db `L1`s should also participate in the same shared KDB contract
- every `L1` should at minimum expose:
  - `System`
  - `KDB`

Current visible shared interlinked set:

- `Users`
- `Artifacts`
- `Contacts`
- `Companies`
- `Funds`
- `Rounds`
- `Projects`
- `Tasks`
- `Notes`
- `Roles`
- `Financial_Industries`
- `Round_Securities`
- `Artifacts_Processed`

Current canon status:

- all of the above now have `System`
- all of the above now have `KDB`
- all of the above now declare KDB links to the full visible shared interlinked set

Current exception:

- `Opportunities` remains a parent shell concept over `Funds` and `Rounds`
- it should not currently be treated as a direct live KDB target until it has a true runtime-backed table/view contract in record snapshots

Additional baseline correction:

- the following canonical `L1`s previously lacked `KDB` and now have the basic `System + KDB` structure baseline:
  - `Markets`
  - `Locations`
  - `Terms`
  - `Academia`
  - `Employments`
  - `Stages`

Current company overview grouping family:

- `Ops_Overview`
- `Business_Overview`
- `Market_Overview`
- `Results_Overview`

Working rule:

- these remain separate addressed subsections
- they may render under one higher `Overview` family without losing their canonical addresses

### Company Record Alignment Note

The current `Company` surface still appears too relationship-first compared with the workbook and canon structure.

Current app emphasis:

- small metadata
- linked records

Workbook/canonical direction:

- `Metadata`
- `KDB`
- `Incorporation`
- `Documents`
- `Operations`
- `Business`
- `Market`
- `Results`
- `Business Plan`
- `Fund Raising`

Working implication:

- relationship-specific lists such as contacts, rounds, funds, artifacts, and notes should not act as the full company model by themselves
- those lists should eventually live inside `KDB` or inside clearly related structural sections
- future `Company Record View` work should move toward workbook-aligned top-level groups instead of staying mostly relationship-first

## Owner Spine Rule

The `Owner` spine should now be treated as a protected root path.

That means:

- owner authority is not a normal editable field
- the node owner should change only through an explicit ownership-transfer flow
- owner profile data may be edited, but only by the owner
- owner-rooted files should inherit owner provenance and ownership from the same spine
- the owner `User` and owner `Contact` should be protected from normal deletion
- the last remaining `User` and `Contact` should also be protected from deletion

Working rule:

- do not treat owner authority like casual `User_Role` editing
- do not allow non-owner actors to edit the owner's `User` or linked `Contact` data
- make the UI reflect the same lock/edit split that the runtime enforces

For the current concrete audit, the runtime-backed set is:

- `Company <-> Project`
- `Company <-> Task`
- `Company <-> Fund`
- `Company <-> Round`
- `Contact <-> Company`
- `Contact <-> Fund`
- `Contact <-> Round`
- `Contact <-> Project`
- `Task <-> Project`
- `Project <-> Fund`
- `Project <-> Round`
- `Project <-> Company`

The currently declared-but-not-yet-backed set includes:

- most `User_*` relationships such as `User <-> Project`
- most `Artifact_*` relationships
- several `Note_*` relationships

Working rule:

- do not pretend the declared-but-not-yet-backed set is already complete
- document and expose that gap clearly
- close the runtime gap underneath the canonical relationship rather than adding shell-side interpretation

### Generic KDB Owner Path

For canon-declared KDB relationships that do not already have an approved domain-specific join table, the standard owner path is now:

- `KDB_Relationships`

This table exists to keep the missing relationship set on one shared contract instead of multiplying one-off pair tables.

Working rule:

- existing domain-specific relationship tables may continue where they are already meaningful and approved
- canon-declared KDB links without that special owner path should use the shared `KDB_Relationships` contract
- reverse appearance should be maintained through the same shared contract
- the choice between domain-specific join table and shared `KDB_Relationships` should be made during `L1` bootstrap, not improvised later per page or per file

Promotion rule:

- shared `KDB_Relationships` should be treated as the default relationship-existence layer
- a dedicated join table should be used when the relationship itself becomes a governed object
- that promotion is appropriate when the relationship needs:
  - its own relationship metadata
  - access-control or system-file policy
  - relationship-specific activation or status
  - a domain-specific audit surface
- dedicated join tables should therefore be treated as promoted relationship owners, not as the default requirement for every link

## Human System Spine

The human system should not be thought of as one flat set of interchangeable cards.

It has three distinct layers:

- `Owner`
  - system authority
  - node founder identity
  - origin of top-level control
  - should exist at node creation

- `User`
  - application actor
  - carries permissions, role assignment, work rights, and system participation
  - node creation should immediately produce a first `User` with role `Owner`

- `Contact`
  - person record inside the CRM/KDB layer
  - may correspond to a `User`
  - but not every `Contact` is a `User`

Working rule:

- `Owner -> User` is a root-established authority path
- `User <-> Contact` should be treated as an identity-link path when it represents the same human
- this identity-link path should not be treated like a loose generic KDB relationship

### Human Spine Runtime Paths

The current runtime-backed human spine should be understood as:

- `Owner_DB`
  - singleton owner authority path
  - currently backed by `Owner_DB.owner_user_id`

- `Users`
  - actor layer

- `Contacts`
  - person layer
  - identity-linked to users through `Contacts.linked_user_id`

- `Roles`
  - role definitions such as:
    - `Owner`
    - `Admin`
    - `Guest`

- `Users_Roles`
  - role assignment DB
  - stores which user has which role
  - should be treated as a real underlying owner path, not as an incidental helper table

Working rule:

- `Roles` defines the role records
- `Users_Roles` defines the user-to-role assignments
- `Users_Roles` is a real assignment DB even if it is not yet a standalone file page

### Owner LDB Access Model

`Users` should not be understood as people in general.

`Contacts` is closer to the people and address-book layer.

The cleaner model is:

- `Contact`: the person or entity profile
- `User`: the login or access identity linked to a `Contact`
- `Role`: the permission or behavior role
- `Project`: the scope where access applies
- `Owner LDB`: the protected local database or workspace
- `[Project] x [Role]`: the dynamic access rule that determines what a user can see or do inside that project context

Clean rule:

`Users` govern access to the `Owner` LDB by linking `Contacts` to project-scoped roles.

A `Contact` may exist without being a `User`.

A `User` should be treated as an access-enabled `Contact` identity.

Permissions should be evaluated through `Project x Role` context rather than global user status alone.

Current runtime note:

- `Users_Roles` exists today as the role assignment DB
- that path is useful, but it should not be mistaken for the final access model if project scope is required

Approved future canonical file:

- `Access_Assignments`

`Access_Assignments` should become the explicit standalone `L1` owner for scoped access.

Reason:

- access needs to be browsed directly
- access needs to be audited directly
- access needs to be governed directly
- access decisions affect the `Owner` LDB boundary
- project-scoped permissions should not hide inside a flat role helper table

Fields to consider:

- `user/contact`
- `project/scope`
- `role`
- `status`
- `granted_by`
- `granted_at`
- `revoked_at`
- `access_limits`

Open architecture decision:

- define the canonical `L1/L2/L3` structure for `Access_Assignments`
- decide its exact `System`, `General`, `KDB`, and file-specific fields
- decide whether `Users_Roles` remains a lower-level runtime helper, is absorbed, or becomes legacy
- decide how `Access_Assignments` reads from and writes to `Users`, `Contacts`, `Projects`, and `Roles`
- decide what events prove an access assignment was granted, changed, revoked, or expired

Do not implement this through guessed permission behavior.

This should be documented before runtime work because it affects auth, LDB boundaries, project visibility, and collaboration.

## Field Class Model

The lasting architecture should not depend on remembered exceptions.

It should depend on explicit token behavior declared at the `L1/L2/L3` structure layer.

That means:

- `L1`
  - defines entity identity and root contract

- `L2`
  - defines section purpose such as:
    - `System`
    - `General`
    - `KDB`

- `L3`
  - defines token behavior

The intended token behavior layer should explicitly declare concepts like:

- `field_class`
  - `owned_field`
  - `directional_link`
  - `kdb_relationship`

- `ownership_mode`
  - `local`
  - `root_owned`
  - `relationship_owned`

- `cardinality`
  - `one_to_one`
  - `one_to_many`
  - `many_to_many`

- `reverse_visibility`
  - `none`
  - `visible`
  - `editable_from_owner_only`

- `write_path`
  - direct owner field
  - join-owner contract
  - generic KDB owner path

Working rule:

- field behavior should be declared by structure
- the shell should not remember exceptions
- the shell should render and save from explicit token behavior

### Field Classification Table

| Field Class | Meaning | Directionality | Who Owns It | Reverse Visible? | Editable Where? |
| --- | --- | --- | --- | --- | --- |
| `owned_field` | ordinary field value on the current record | local | current record | usually no | current record |
| `directional_link` | root-established or rule-bearing path such as identity, authority, provenance, or parentage | one-directional | explicit owner path | sometimes, depending on rule | owner side only |
| `kdb_relationship` | mutual relationship between records | usually bidirectional | relationship owner path | yes | through approved relationship owner path |

### Root-Established Directional Links

Some fields should be treated as a distinct class from generic KDB.

These are:

- identity links
- authority links
- provenance links
- parent/root organization links
- stage or board anchors when they govern behavior

These links should:

- be established at root or owner level
- guide navigation and rule enforcement
- not be editable casually from both sides
- often render loaded-but-locked in linked views

Examples:

- `Owner -> User`
- `User -> Role`
- `Contact -> linked_user_id`
- `Creator`
- `Artifact -> Ingestion`
- `Ingestion -> Created Files`

## Heuristic Guidance Layer

Heuristics are approved as a top-layer guidance tool, not as a structure tool.

Working rule:

- strict structure underneath
- heuristic help on top

That means heuristics may:

- front-load likely options
- rank likely targets
- highlight likely next actions
- prioritize what is in the user’s line of sight
- use board relevance and point weighting to rank options

But heuristics must not:

- invent ownership
- invent undeclared relationships
- decide write paths
- override the declared field class

This is especially relevant for:

- linked human-system fields such as `Contact_User`
- high-context KDB selectors
- stage-sensitive board work where the point system can rank what matters most now

## Field Visibility Rule

The field behavior model should eventually be visible to the user in field-level context.

That does not mean exposing raw implementation jargon everywhere.

It means the system should be able to show, when needed:

- whether a field is local, directional, or relational
- whether it is editable here or only through the owner path
- whether it is reverse-visible only
- where to follow it back if it is locked here

Working rule:

- the architecture meaning should be inspectable
- users and companions should not have to guess why a field is editable, locked, or mirrored
- new `L1`s and `Knowledge DB` `L1`s should inherit this rule instead of inventing their own relationship storage pattern

## Shared Shell Rule

The `File` shell should have one shared source implementation.

Current rule:

- the shared file shell lives in `src/components/FilePageShell.vue`
- file pages are thin route wrappers around that one shell source
- if the shell changes, all file pages should change automatically

This is different from route ownership.

Route ownership should still stay explicit:

- each file page owns its own route
- each file page should load its own route-owned `L1`
- only the literal `File Shell` lab route should switch source from the shell selector

Working rule:

- shared shell behavior changes once
- page wrappers stay thin
- route-owned `L1` loading should not be overridden by the last selected `File Shell` lab source

## Canonical Input Rules

The shared create/edit record dialog should read field meaning from canonical structure, not from page-local UI logic.

That means each `L3` token should declare:

- its `token_type`
- whether it is a fixed list, a live entity pick, a live entity set, a system stamp, or a direct input
- any reusable canonical list it depends on

Approved option-source families:

- `canonical_list`
  - fixed reusable dropdown libraries
  - example: `Task_Status -> Task_Status_List`
- `live_entity`
  - one live entity source
  - example: `Fund_Manager -> Companies`, filtered to `Asset Manager`
- `live_entity_set`
  - more than one live entity source
  - example: `Round_Sponsor -> Contacts + Companies`
- `record_subset`

## Edit Payload Rule

The shared edit dialog should preload from the true databook payload for the active `L1`, not from summary rows or card chips.

That means:

- edit should call `databooks.view(activeL1Entity, recordId)`
- token values should read from the returned databook `fields` first
- token values may then fall back to the returned flat `record` only when the exact field is present there
- cards, table rows, and chips are display surfaces only; they are not the edit preload contract

Expected token return shape:

- scalar token
  - one scalar value
- `select_single`
  - one explicit selected value
  - options still come from the token's declared option source
- `select_multi`
  - one array of selected values
- KDB relationship token
  - one explicit relationship list in the token's expected shape
  - structured record-owned subsets
  - example: `Contact_Employment`
- `derived_subset`
  - single values derived from an owned subset table
  - example: `Project_Current_Stage` derives from `Project_Stages`
- `direct_input`
  - user-entered value, not a dropdown
  - example: `Company_Round_Raised`
- system-owned values
  - `Creator`
  - `Datetime`

Working rule:

- fixed dropdown values should live in top-level reusable `option_lists` inside `docs/000-canonical-structure.json`
- tokens should reference those lists explicitly
- live pickers should point to their source entity explicitly
- the shared dialog may render from canonical and live row sources
- the page should not hardcode field meaning

Current approved examples:

- `Company_Pax_Known`
  - direct user input
- `Round_Security_Type`
  - dedicated evolving security-type list
  - current values: `Common`, `Preferred`
- `Fund_Target_Industries`
  - evolving subset table, not a hardcoded page list
- `Fund_Target_Stages`
  - sourced from `Stages`
- `Project_Stages`
  - project-owned subset table with stage details such as milestone and objective
- `Project_Current_Stage`
  - derived from the `Project_Stages` subset

## Canonical Structure Direction

The long-term canonical structure direction is:

`JSON/App Structure -> Payload -> UI`

With supporting adapters:

- `Workbook exporter/importer`
- future migration exporters/importers
- external intake or migration formats

This means:

- the workbook is helping us validate and refine the structure
- the app should not depend on Excel as the primary runtime bridge
- canonical structure lives in a machine-readable form that the app can edit directly
- exporters remain valuable, but they should act as adapters rather than the permanent backbone

Working interpretation:

- `Workbook` is the current design and validation surface
- `JSON` is the current canonical structure surface
- `app editing` should operate against that canonical JSON structure

Current canonical file:

- `docs/000-canonical-structure.json`

Canonical loading rule:

- app/shared code should load canonical structure through `src/shared/canonicalStructure.js`
- runtime scripts and validators should use the same loader concept or an approved Node-safe sibling loader
- direct imports of `docs/000-canonical-structure.json` should not be scattered across unrelated modules
- KDB contract building, file registry building, shell rendering, and bootstrap validation should all receive canon through an explicit loading boundary

## Opportunity Structure Rule

`Opportunities` is now the shared parent `L1` contract for the opportunity lane.

That means:

- `Opportunities` owns the opportunity-lane data contract
- `Funds` and `Rounds` are subtype branches under that parent
- shared sections should stay at the `Opportunity` level when they are truly shared
- subtype-specific sections should remain subtype-owned when their internal structures diverge

It does not mean:

- `Opportunities` does not own `Fork Shell`
- `Opportunities` does not own branch-choice shell chrome
- `Opportunities` does not get to replace the independent shared-shell contract with opportunity-specific UI treatment
- branchable create metadata may come from `Opportunities`, but the route-owned branch-choice surface must still be `Fork Shell`

Current approved interpretation:

- shared `Opportunity` sections:
  - `System`
  - `KDB`
  - `General`
  - `Business Overview`
- subtype-owned deeper sections:
  - `Fund` `Economics`
  - `Fund` `Controls`
  - `Round` `Economics`
  - `Round` `Controls`

Create rule:

- if an `L1` owns subtype branches, create/add-record should first ask which route to take
- that route-choice step is canonical behavior, not a widget-only special case
- that route-choice step should resolve through the independent `Fork Shell`
- example: `Opportunities` should ask whether the new record should follow the `Fund` route or the `Round` route

Working rule:

- do not pretend `Economics` and `Controls` are one shared structure just because their labels match
- keep the shell unified where the contract is shared
- fork the deeper sections where the structure is actually different

## Surface Split

The app should use two payload lanes.

### 1. File / Card View

This lane should stay lightweight.

Use:

- row payload fields
- relationship values already present on the row
- lightweight counts, previews, and related labels where available

Goal:

- fast loading
- responsive scrolling
- low runtime cost

### 2. Record View

This lane can be richer.

Use:

- workbook-aligned `sections`
- richer grouped relationship payloads
- join-table-backed relationship data where needed

Goal:

- correctness
- completeness
- explicit section ownership

Working rule:

`File/Card View stays light. Record View gets rich.`

## Knowledge DB Files

Inside `Files`, there is also a `Knowledge DBs` subset.

These are reusable reference files that support other records and evolving controlled vocabularies.

Current approved `Knowledge DB` file direction includes:

- `Markets`
- `Locations`
- `Terms`
- `Academia`
- `Employments`
- `Stages`
- `Roles`
- `Financial Industries`
- `Round Securities`
- `Ingestion`

### Standard DB Baseline

When a new file becomes a real DB-backed surface, it should start from one standard baseline.

That baseline is:

- a real sqlite table
- a preload/main bridge with at least `list`, `create`, and `delete`
- canonical `L2` sections:
  - `System`
  - `KDB`
  - `General`
- canonical `General` tokens:
  - `Name`
  - `Summary`

Working order rule:

- `Name` is canonical field `*.3.1`
- `Summary` is canonical field `*.3.2`
- `Name` should anchor the left-side first field position in shared edit surfaces
- `Summary` should anchor the right-side first field position in shared edit surfaces
- this is a shared contract rule, not a page-by-page layout choice

If a new DB needs more than that, add it on top of this baseline instead of inventing a one-off structure.

Working rule:

- when a controlled field should evolve as a reusable reference set, prefer a `Knowledge DB` file over a page-local hardcoded list
- shells may still render those sources as selects or pickers, but the meaning should come from the `Knowledge DB` file contract

Relationship inheritance rule:

- when a new `Knowledge DB` or first-level `L1` is introduced, its KDB relationship expectations should be documented immediately
- if the relationship is declared in canon, the owner path and reverse-read path should be planned at the same time
- do not allow canon to drift far ahead of runtime relationship ownership without documenting that gap

Examples:

- `Fund_Target_Industries` should read from `Financial_Industries`
- `Round_Security_Type` should read from `Round_Securities`
- `Fund_Target_Stages` should read from `Stages`

### Ingestion Contract

`Ingestion` should be treated as a secondary `Knowledge DB` that tracks artifact-processing provenance.

It exists to show:

- which original artifact was processed
- why that artifact was processed
- what files were created from that processing

Minimum contract:

- `Original Artifact`
  - relation back to the source artifact
- `Created Files`
  - related files created from that processing event
- `Working`
  - marker that the created file is an AI working file

Working rule:

- when an artifact is selected and sent into the `Ingestion Companion` processing lane, that is the point where the `Ingestion` record should be created/tracked
- one original artifact may have many `Ingestion` records
- one `Ingestion` record may have many `Created Files`

Relationship rule:

- the original artifact should show related `Ingestion`
- the original artifact should also show related `Created Files`
- the processed row should link back to the original artifact and forward to the created files

This means provenance should be visible from either direction:

- original artifact -> ingestion -> created files
- created file -> ingestion -> original artifact

Current frontend preparation rule:

- new `Knowledge DB` files should reuse the same shared file shell path as the `File Shell` lab
- frontend work may prepare canonical registry entries, routes, and navigation before runtime source wiring is complete
- do not create a separate placeholder UI path once the intended final surface is the shared shell

Current implementation rule:

- `Markets`
- `Securities`
- `Ingestion`

should each have their own page wrapper and route, but all three should still render through the one shared file shell source.

## Owner Identity Rule

The local owner profile should become the first real `User`.

Current working rule:

- owner settings are not just local decoration
- owner identity should bootstrap into the `Users` table
- the owner bootstrap should also ensure an `Owner` role exists in `Roles`
- owner bootstrap should also create the linked `Contact`
- owner bootstrap should assign a base `Companion`
- owner bootstrap should create the base owner project spaces for:
  - `Owner Opportunities`
  - `Owner Ingestion`
- owner bootstrap should assign the base `User Roles` set
- owner bootstrap should assign the base `Companion Roles` set
- owner bootstrap should create the `Master Companion Role` record
- owner bootstrap should create the `User Set-up` project and its base tasks
- those setup records should still be created even if the user later skips guided task completion

Important current limit:

- `Owner` can exist as a real role record
- but there is not yet a dedicated user-to-role relationship contract in the current schema
- do not fake that relationship in the shell until the structure exists

- the shell and direct forms should compose the stored full name from those two inputs instead of exposing one unsplit name box

## Current File Card Shell

The current normalized shared `File` card shell applies to:

- `Users`
- `Contacts`
- `Companies`
- `Artifacts`
- `Opportunities`
- `Projects`
- `Notes`
- `Tasks`

Each file card should follow the same top-level section order:

1. `control row`
2. `hero`
3. `summary`

In template terms, the normalized structure is:

```vue
<q-card>
  <q-card-section class="*-card__control-row" />
  <q-card-section class="*-card__hero" />
  <q-card-section class="*-card__summary">
    <div class="*-card__summary-head" />
    <div class="*-card__summary-panel">
      <div class="*-card__summary-panel-head" />
      <div class="*-card__summary-body">
        <div class="*-card__summary-body-content" />
      </div>
    </div>
  </q-card-section>
</q-card>
```

### Control Row

The control row is the thin top strip of the card.

It should contain:

- the select checkbox on the left
- the eye icon on the right

Rules:

- spacing should feel visually balanced from both borders
- the row should hug the top edge of the card cleanly
- corners should clip with the card shell so hover states do not poke out

### Hero

The hero section is the top content block below the control row.

It contains:

- the visual identity area on the left
- the detail lane on the right

Rules:

- the right lane should formalize `title`, `subtitle`, and `chips` instead of relying on older metadata wording
- title typography should stay consistent across file families unless intentionally specialized
- `Notes` and `Tasks` should not drift into smaller typography unless that is explicitly approved

### Summary

The summary section is the lower relationship area of the card.

It is split into two parts:

#### 1. Summary Head

This row should contain:

- the KDBhip icon strip on the left
- the mini grid/row toggle on the right

Rules:

- the icon strip stays lightweight
- all icons are clickable
- empty relationship states are allowed and should show empty text in the panel body

#### 2. Summary Panel

This is the off-white dynamic box below the summary head.

It should contain:

- `summary-panel-head`
- `summary-body`

The `summary-panel-head` currently contains:

- `Add Relation`

Rules:

- `Add Relation` lives inside the box, not beside the icon strip
- it sits at the top-left of the panel
- it uses the title font treatment
- clicking it should route to the shared `Add/Edit Record Shell` for that source record and open in `KDB`
- the panel body below it renders the active relationship content or the empty state

### File Card Naming Convention

For long-term maintainability, file card grid templates should use the same loop alias:

- preferred loop alias: `row`

This matters because shared patching becomes fragile when templates mix:

- `row`
- `user`
- `group`
- other entity-specific aliases

Current normalization target:

- use `row` in the main card loop wherever practical

### File Card Maintenance Rule

When editing one file card page:

- check whether the same change belongs in all 8 file pages
- prefer keeping section order identical
- prefer keeping wrapper names identical
- prefer keeping loop alias naming identical
- avoid one-off template shape changes unless they are truly entity-specific
- prefer shared page-mechanics helpers for repeated record navigation, return-path building, and selection actions

Before making a bulk card change:

- confirm the same wrapper structure exists on all 8 pages
- confirm the same loop alias is being used
- confirm the same CSS block names exist
- confirm the change belongs to the shared shell, not entity-specific content

After making a bulk card change:

- lint
- compare at least `Users`, `Contacts`, `Artifacts`, and `Projects`
- if one page drifts, update this section

## Core Rules

### Workbook Rule

The workbook is the first-pass setup and validation layer.

Use it to verify:

- section order
- section membership
- leaf-token ownership
- relationship coverage

The workbook is not intended to remain the permanent runtime bridge once the canonical JSON structure is in place.

### Canonical Structure Rule

The structure source of truth should remain a machine-readable app-native layer.

For this project, that means:

- `JSON` is the canonical structure source of truth
- the app should be able to edit that structure directly
- workbook export/import should support migration and outside editing, not define the runtime forever

### Record Section Rule

Every workbook-backed record should expose:

- `System` first on the left
- file-specific middle sections next
- `KDB` last on the right

Section behavior:

- normal sections render their leaf tokens
- `KDB` renders the relationship browser

### Payload Rule

`RecordPage.vue` was the earlier shared record surface and is now removed.

It should not be treated as the long-term shared record solution.

The long-term contract must come from:

- workbook section order
- workbook leaf-token membership
- explicit KDB grouping

### Token Naming Rule

During this first architecture pass, token names should also be normalized toward their final form.

That means:

- section-label changes should not stop at the section label layer
- token names should be reviewed and renamed where appropriate so the workbook, JSON companion, and app vocabulary move together
- the goal is to reduce mixed states such as `System` sections still containing `*_Metadata` token names unless that mismatch is intentionally preserved

Working principle:

- user-facing labels may evolve
- structural addresses should remain stable
- token names should move toward their final approved naming during this pass, not be deferred indefinitely

### Canonical Token Resolution Rule

Canonical token identity and live payload field names are not always the same thing.

The intended contract is:

- canonical token = structural token used by the app architecture
- DB field alias = explicit runtime field name when the current DB or row payload still uses older naming

Examples:

- canonical `Contact_Name` may resolve through DB field alias `Name`
- canonical `Company_Summary` may resolve through DB field aliases such as `One_Liner` or `Description`
- canonical `Artifact_Name` may resolve through explicit list payload aliases such as `title`

This means:

- the shell should render through canonical structure
- payload mismatches should be handled by explicit alias declaration in canonical JSON
- do not restore per-page field guessing to bridge naming drift

### Addressing Rule

Every approved entity structure should eventually support stable structural addressing.

Use:

- `Level1.Level2.Level3`

Example:

- `4.3.2`

Meaning:

- entity `4`
- subsection `3`
- item `2`

Addresses are:

- structural
- stable
- human-readable

They are not replacements for:

- DB ids
- record ids
- join-table ids

### Table Group Rule

Page-level grouped table tabs should reflect real schema groups, not arbitrary UI presets.

Top-level landing switch remains:

- `Card`
- `Table`

Inside `Table`, use:

- `Cards`
- `All`
- real schema-group tabs

## Current Problems

These are the main issues we are solving.

### 1. Mixed Payload Quality

Some record types already have intentional custom payloads.

Others still use generic field guesses.

Result:

- some records feel aligned
- others still feel improvised

### 2. Heuristic Section Mapping

The current generic record section logic is still partially heuristic.

That is acceptable only as a temporary migration layer.

It should not be treated as the final contract.

### 3. Naming Drift

Most route-level record navigation now uses `Record View` naming and shared helper utilities, but some shared-layer and styling logic still uses older `Databook` wording.

That remaining internal naming still needs to finish migrating to `File`, `Record`, and `Record View`.

### 4. Relationship Drift

KDB are now more consistent visually, but not yet fully backed by the same data contract everywhere.

That means:

- cards may show lightweight relationship previews
- record views still need fuller grouped relationship payloads

### 5. Shared Card Maintenance Drift

The 8 main file pages now have a much more normalized card shell, but that normalization must be maintained deliberately.

The main maintenance risks are:

- wrapper drift in card summary templates
- loop alias drift in file card grids
- one-off shell edits that belong in the shared card pattern

## Target Architecture

Each entity should eventually have three explicit contracts.

### 1. Structure Contract

Defines:

- approved workbook sections
- section order
- level-2 group ownership
- item-address numbering

### 2. Light Payload Contract

Used by:

- file views
- cards
- row previews

Defines:

- what row fields are available
- what lightweight relationship values are available
- what card/table previews can render without expensive joins

### 3. Rich Payload Contract

Used by:

- record view
- KDBhip browser
- future review and audit experiences

Defines:

- section payloads
- leaf-token membership
- grouped relationship items
- section kinds such as `fields` and `relationships`

## Canonical Record Payload Shape

```json
{
  "table_name": "Users",
  "record_id": "user:123",
  "entity_label": "User",
  "entity_name": "Jane Doe",
  "record": {},
  "sections": [
    {
      "id": "metadata",
      "label": "System",
      "kind": "fields",
      "items": []
    },
    {
      "id": "kdb-relationships",
      "label": "KDB",
      "kind": "relationships",
      "items": []
    }
  ],
  "fields": []
}
```

Canonical tokens may also carry explicit runtime alias metadata when needed, for example:

```json
{
  "address": "3.3.1",
  "token_name": "Contact_Name",
  "token_type": "text",
  "db_field_aliases": ["Name"]
}
```

Working guidance:

- `sections` is the long-term primary UI contract
- `fields` can continue during migration for compatibility

## Canonical Section Order By File

- `Users`: `System`, `KDB`
- `Artifacts`: `System`, `KDB`
- `Contacts`: `System`, `Employment`, `Studies`, `KDB`
- `Companies`: `System`, `Incorporation`, `Documents`, `Operations`, `Business`, `Market`, `Results`, `Business Plan`, `Fund Raising`, `KDB`
- `Funds`: `System`, `Overview`, `Economics`, `Controls`, `KDB`
- `Rounds`: `System`, `Overview`, `Economics`, `Controls`, `KDB`
- `Projects`: `System`, `Overview`, `Team`, `KDB`
- `Tasks`: `System`, `Overview`, `Team`, `KDB`
  - `Notes`: `System`, `KDB`
  - `Roles`: `System`, `KDB`

Grouped subsection rendering rule:

- a grouped `L2` may collapse multiple canonical subsections into one toolbar item
- that grouped toolbar item must not flatten those canonical subsection identities in the panel
- when grouped subsection blocks render in the panel, each subgroup must have its own collapse / expand control
- the same grouped subsection rule should hold in the shared create / edit dialog, not only in `Record View`
- `Companies` should therefore render one `Business Overview` toolbar label while preserving:
  - `Ops Overview`
  - `Business Overview`
  - `Market Overview`
  - `Results Overview`
  as subgroup variants inside the panel

Canonical subgroup rule:

- when subgrouping is structurally necessary, it should be declared explicitly as `L2.a`, `L2.b`, `L2.c`, and so on
- this is not a hidden `L4`
- `L3` remains the leaf layer
- shells should not invent subgrouping that canon does not declare

## Execution Plan

### Phase 1. Freeze the Structure Maps

For each entity define:

- section order
- section ids
- schema-group ownership
- KDBhip categories
- item-address ranges
- final token naming

At the same time:

- confirm the JSON structure shape that the app will eventually own directly
- use the workbook to validate that JSON shape rather than making Excel the permanent dependency

Start with:

- `Company`

Why:

- best reference richness
- easiest to reason about across related records

### Phase 2. Freeze the Addressing Maps

For the reference entity, define:

- `Level1` entity number
- `Level2` subsection numbering
- `Level3` leaf numbering

Then expand entity by entity.

### Phase 3. Separate Light and Rich Payloads

For each entity define:

- light file/card payload
- rich record payload

The split should be explicit, not accidental.

### Phase 4. Replace Heuristic Record Mapping

Move away from long-term heuristic section ownership in the deprecated `RecordPage.vue` path.

Each entity should have workbook-backed token ownership.

### Phase 5. Build One Full Reference Entity End to End

Start with:

- `Company`

Deliver:

- approved section structure
- approved addressing
- canonical JSON subsection structure
- light payload for file/cards
- rich payload for record view
- KDBhip groups

### Phase 6. Standardize KDBhip Contracts

For each entity define:

- possible relationship types
- lightweight card preview behavior
- rich record-view relationship behavior
- empty-state behavior
- real owner path
- reverse-read path
- bidirectional appearance rule

### Phase 7. Align Table Group Tabs

Grouped table tabs should mirror real schema groups.

Use:

- `Cards`
- `All`
- real schema-group tabs

### Phase 8. Migrate Remaining Entities

Recommended order:

1. `Companies`
2. `Opportunities`
3. `Contacts`
4. `Projects`
5. `Artifacts`
6. `Tasks`
7. `Notes`
8. `Users`
9. `Funds`
10. `Rounds`
11. `Roles`

## Progress Tracker

### Overall

- [x] Shared `RecordPage.vue` existed as the earlier shared record surface
- [x] Shared `record-view` route now resolves into `RecordShellPage.vue`
- [x] Remove legacy `RecordPage.vue` after route ownership moved to `RecordShellPage.vue`
- [x] File/card shell consistency improved across core pages
- [x] KDB icon strip unified across file cards
- [x] Card relationship icon affordance added
- [x] Excel + JSON companion workflow introduced
- [x] Canonical direction decided: `JSON + app editing`
- [x] Route-level `Record View` navigation is centralized through shared helpers
- [x] Repeated route-query sync for normalized file-page view state is moving into shared helpers
- [ ] Route and shared naming fully cleaned of `Databook`
- [ ] Heuristic section mapping fully replaced
- [ ] Light vs rich payload split documented per entity
- [ ] Item addressing adopted per entity

## Deprecated / Cleanup Queue

The following are now explicitly legacy and should be cleaned deliberately instead of staying half-active:

- `RecordPage.vue`
  - historical legacy record surface
  - removed from the active route set

- internal `Databook` naming
  - still present in bridge and styling language
  - should continue migrating to `File`, `Record`, and `Record View`

- `Live Shell` wording
  - product-facing shell naming has moved to `File Shell`
  - remaining `Live Shell` references in docs should be cleaned to `File Shell` or `File Shell` lab unless they are intentionally historical

- `Test Shell` wording
  - where it refers to the contract route, it should be normalized to `File Shell` lab language
- [ ] Rich record payloads standardized per entity
- [ ] Token names normalized to final approved form
- [ ] Canonical JSON structure contract defined per entity
- [ ] App editing model for canonical JSON structure defined
- [ ] Exporters repositioned as migration/intake adapters

### Reference Entity: Company

- [ ] section order approved
- [ ] level-2 schema groups approved
- [ ] item-address numbering approved
- [ ] final token naming approved
- [ ] light file/card payload defined
- [ ] rich record payload defined
- [ ] KDBhip contract defined
- [ ] grouped table tabs aligned
- [ ] record view aligned to final payload

### Entity Rollout

- [ ] Companies
- [ ] Opportunities
- [ ] Contacts
- [ ] Projects
- [ ] Artifacts
- [ ] Tasks
- [ ] Notes
- [ ] Users
- [ ] Funds
- [ ] Rounds
- [ ] Roles

## Working Principle

We are not trying to force every surface into the same runtime cost.

We are trying to make every surface structurally coherent.

So the practical principle is:

`Use the workbook to define and validate the first structure, move canonical ownership into JSON with app editing, keep file views lightweight, make record views rich, and let stable addresses tie the system together.`


## Table Naming Contract

When shared shell surfaces perform IPC write actions such as `databooks:update`, they must use the approved databook table name, not the route key and not the canonical entity name when those differ.

The distinction is:

- canonical entity name:
  used for structure, ownership, and shell contract reasoning
- route key:
  used for navigation and shell payload switching
- databook table name:
  used for IPC/database-facing actions

These are not interchangeable.

Examples:

- route key `companies` -> databook table name `Companies`
- canonical entity `Financial_Industries` -> databook table name `Industries`
- route key `securities` -> databook table name `Round_Securities`

If a shell action is performing a databook write, verification write, or databook snapshot/update flow, it must normalize through the approved databook table-name mapping first.

## Append-Only Audit Rule

Shared shell writes must respect the append-only `events` contract.

That means:

- shared shell save flows may use `actionLabel` to describe the write session
- but they must not reuse one shell-session `actionId` across repeated field writes

Why:

- the `events` log is append-only
- reusing the same `actionId` for the same target field causes the backend audit layer to treat the later write like an update to an existing event
- that conflicts with the append-only rule

So the approved shell rule is:

- keep the shared action label for shell/session context
- let each write create its own audit event id
- do not treat shell session ids as reusable write ids

## Directional KDB Join Rule

Explicit join-table KDB contracts must preserve join direction.

That means:

- the forward direction may use `from_id -> to_id`
- but the reverse direction must swap the join columns when the shell is linking from the opposite side

Why:

- many join tables are directional at the SQL layer
- reusing the same join-column mapping in both directions can put the source record id into the wrong foreign-key column
- that causes foreign-key failures even when the chosen linked record is valid
