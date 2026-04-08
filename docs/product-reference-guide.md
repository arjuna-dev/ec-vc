# Product Reference Guide

## Status

This document is the primary reference guide for understanding the product language and canonical ownership model.

It should be treated as the single reference source for:

- core product vocabulary
- file and record naming
- record-view behavior
- canonical relationship ownership
- first-order field logic
- relationship editing rules
- companion-side ownership discipline

Companion behavior rules now also live in:

- `docs/companion-contract.md`
- `docs/game-rulebook.md`
- `docs/game-master-contract.md`
- `docs/ECS_Workstream_Tracker.md`

When these rules change:

- update this file
- avoid creating parallel reference docs unless there is a strong reason

## Core Language

The product should use `File` and `Record` as the main information architecture terms.

- `File` = the collection view
- `Record` = one individual item inside that file

This is the default language for navigation, structure, and page meaning.

There is also a `Knowledge DBs` subset inside `Files`.

`Knowledge DB` files are reusable reference files that support other records with shared taxonomies, terms, stages, securities, industries, and similar evolving reference sets.

## Human-System Language

Use the following language repeatedly and consistently:

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

- these are related layers of the human system
- they are not interchangeable cards
- identity links between them should follow explicit owner paths
- owner authority is locked in normal editing
- owner profile data is editable only by the owner
- owner-rooted files should inherit owner provenance through that same spine
- the owner `User` and owner `Contact` are protected from normal deletion
- the last remaining `User` and `Contact` are protected from deletion
- owner identity should now use one email path in settings, not two competing owner email inputs

The current first-pass human spine should also be understood as including two supporting DB layers:

- `Owner_DB`
  - singleton owner authority path

- `Users_Roles`
  - user-to-role assignment DB

Working rule:

- `Roles` is the role-definition file
- `Users_Roles` is the underlying assignment path
- `Users_Roles` is real runtime ownership even if it is not yet its own file page

## Precision Language

To stay precise while the codebase is still finishing its naming cleanup, use the following language:

- `Workbook` when talking about the Excel file or schema reference
- `DB` or `DB Tables` when talking about the database
- `File page` when talking about landing pages such as `Users`, `Contacts`, `Companies`, `Artifacts`, `Projects`, `Notes`, `Tasks`, and `Opportunities`
- `Record page` or `Record View` when talking about the eye-opened detail page
- `record-view` when talking about the literal current route name
- `Databook` only when talking about older internal bridge or class naming that has not been fully cleaned yet

Current deprecation note:

- `RecordPage.vue` was the earlier shared record surface and has been removed
- the active shared route target for `Record View` is `RecordShellPage.vue`
- entity-specific `*CreateDialog.vue` surfaces have been removed in favor of the shared `Add/Edit Record Shell`

This distinction matters because product language is now cleaner than the remaining older internal implementation language still present in the app.

## System Model

Pattern:

`File -> record list -> eye icon -> Record View`

When the user clicks the eye icon from a file, they open the detailed view for that specific record.

Implementation note:

- route path: `/records/:tableName/:recordId`
- route name: `record-view`
- current route target: `RecordShellPage.vue`
- legacy `databooks/...` links should be treated as compatibility redirects, not canonical product language

## Structure Ownership

For the current architecture pass:

- `docs/canonical-structure.json` is the app-readable canonical structure layer
- the workbook is being used to validate and refine that structure
- the workbook companion remains a useful workbook-derived reference surface
- canonical tokens may declare explicit `db_field_aliases` when live payload field names still reflect older DB naming

The intended product direction is:

- canonical structure should live in a machine-readable app-native layer
- the app should edit that canonical structure directly
- exporters and importers should support migration and outside data sources such as Excel

So the working mental model is:

- `Workbook` = design and validation surface
- `JSON` = current canonical structure surface
- `Exporters/Importers` = adapters

## Artifact Context Rule

When an artifact is added from within another file or record flow, the current page context may become the first assumed link context.

That assumption must be shown clearly as:

- `default/preselected unverified`

Working rule:

- treat it as verification-ready context
- do not silently treat it as settled truth
- if the artifact is being created directly inside `Artifacts`, do not add a second page-context assumption
- when `Ingestion` starts from that artifact, the processed record should point to the linked source artifact instead of creating a second artifact record

## Field Verification Metadata Rule

Field state should be tracked through one shared metadata layer, not through a shadow copy of each field.

The real value remains on the real record field.

The review state belongs in metadata such as:

- `table_name`
- `record_id`
- `field_name`
- `state`
- `source`
- `confidence`
- `verified_by`
- `verified_at`

The history of that state should stay in the shared audit stream.

That means:

- normal field edits are written into shared `events`
- verification-state changes are also written into shared `events`
- related changes should share one `action_id` when they belong to the same dialog or record-edit session

## Canonical Token Contract

Canonical tokens are the app-facing structural descriptors.

They should be understood as:

- canonical address
- canonical token name
- optional explicit DB aliases when runtime field names have not yet caught up

This matters because the shell should not guess whether:

- `Contact_Name` really means `Name`
- `Company_Summary` really means `One_Liner`
- `Artifact_Name` really means `title`

Instead, canonical should declare that relationship explicitly.

Working rule:

- read shell fields through canonical structure first
- if runtime payload names differ, use explicit canonical alias metadata
- do not rebuild old per-page field maps in the UI

This should be treated as a universal shell rule:

- not a `User` rule
- not an `id` rule
- not a `Record View`-only rule

If an `L3` token needs runtime mapping, that mapping should be declared once in canon and then shared by:

- `File Shell`
- `Record Shell`
- any other shared shell surface

Working rule:

- all agreements should be made at shell level
- no page-level one-offs
- no record-level one-offs

Shared dialog rule:

- opening `Add Record` or `Edit Record` from any `L1` should resolve into the same shared dialog shell behavior
- the launching surface may choose the source `L1` or selected record
- it should not reinterpret grouped `L2` structure before handing payload into the dialog
- if the dialog behaves differently between `L1`s because of different shell-side payload shaping, that is a contract bug
- when the shared dialog is exposed through its own shell route, that route should use the same shared top shell header and `L1` select as the other shell routes
- the dialog shell route should not add a second page-level selector, launchpad, or top-row control if the shared shell header already provides that contract

New `L1` bootstrap rule:

- a new `L1` must be treated as a full product/runtime/bootstrap task, not as a label or route-only task
- new `L1` bootstrap is `Owner`-only authority work, not a normal user create action
- the highest-priority architecture workflow is to consolidate this bootstrap into one canonical contract with strict validation
- adding a new `L1` should include:
  - canonical entity
  - route
  - registry
  - shell
  - navigation
  - runtime ownership for `list/create/update/delete`
  - default `System` / `KDB` / standard `General` subsection setup
  - reciprocal KDB propagation to the other relevant `L1`s
- `Add Record` and shared dialog flows should work immediately for the new `L1`
- if a source is visible in menus but not createable/editable, treat that as incomplete bootstrap work, not as an acceptable intermediate product state
- future marketplace-delivered `L1`s must pass the same bootstrap contract as local owner-created `L1`s

`BB File` rule:

- `BB File` means `Building Blocks File`
- it is a special `System-Level File`
- it is not a standard app-data `L1`
- it is the canonical registry for reusable UI building blocks, design primitives, shell parts, and reconstruction guidance
- it conceptually renders before the operational files in `Owner Genesis` because it defines the visible building language of the app
- it does not inherit the normal `System` / `KDB` subsection treatment used by standard files unless explicitly needed later
- this is a controlled exception and must not be used to weaken the normal file bootstrap contract

`BB File` dependency rule:

- `Built From BBs` is the explicit field used to declare BB-to-BB composition
- no BB element should depend on unnamed or untracked reusable child elements
- if a BB element is composed from other reusable BBs, those children should be listed explicitly
- this matters because building blocks are the layer that should carry backend architecture, runtime ownership, and shell structure all the way through to visible UI/UX
- this allows the product to classify BBs as:
  - `Leaf` / `Elementary`
  - `Parent`
  - `Root`
  - `Child`
- this turns the BB catalog from a list into a graph and makes shell assembly more reliable
- `Convergence Rule` is not the same kind of field
- `Convergence Rule` is temporary migration scaffolding used while a token family or BB is still converging
- once that convergence is complete, the field should be cleared, hidden, or removed instead of becoming permanent catalog weight

Building Blocks migration rule:

- `BB Shell` should be treated as the single working surface for building block migration
- do not maintain a second parallel working page for the same elements
- finish the foundational visual system map:
  - fonts
  - typography
  - colors
  - surfaces
  - borders
  - radius
  - shadows
  - spacing
  - icon sizing
  - formatting
  - motion
- then use that map to drive shared components
- then compose live pages and shells from those shared components

Dependency direction:

- `General Settings` -> `Building Blocks` -> `Pages / Shells`

Fork shell rule:

- `Fork Shell` is an independent shared shell route, not an `Opportunities` page extension
- a branchable `L1` may supply branch metadata, but it must not replace the `Fork Shell` renderer or shell behavior with entity-specific UI
- closing `Fork Shell` should leave the user on the blank shell route, the same way closing `Add/Edit Record Shell` leaves the user on the blank dialog shell route
- `Fork Shell` should use the same shared top-row shell contract as the other shell routes and should only swap explicit branchable `L1` payload underneath it

Branch selector rule:

- some create flows need a structural selector before the rest of the form should appear
- that selector is not a normal saved field
- it decides which subtype payload should load next
- subtype-owned sections should stay hidden until that selector is chosen
- if that selector is surfaced before the add/edit form opens, it should live in `Fork Shell`, not as a copied widget inside one entity page

Current approved example:

- `Opportunity Type` is a branch selector
- choosing `Fund` or `Round` decides whether the create flow should continue as `Funds` or `Rounds`
- the selector should steer structure first and should not later be written back as if it were a normal field on the subtype record
- `Opportunities` may declare the available branch routes, but the route-owned branch-choice surface is still `Fork Shell`
- branch capability should be treated as a normal architecture feature any `L1` may support when canon declares it
- `Funds` and `Rounds` are intentionally separate concrete tables, not one blended subset table

Observed evidence rule:

- when documenting shell drift, keep the observed behavior separate from the hypothesized cause
- in this case, the direct observation was:
  - the shared edit dialog rendered different subgroup behavior depending on the `L1` source it was launched from
- that observation should be treated as evidence
- the explanation of why it happened should only be promoted to fact after the payload path is verified

Why a shared payload builder matters:

- the app already has canonical `L1-L2-L3` structure, but shells still need one shared translation layer that turns that structure into the exact payload consumed by the shell
- when a subsection needs internal grouping for readability, canon may explicitly declare subgrouping as `L2.a`, `L2.b`, `L2.c`, and so on without replacing `L3` as the leaf layer
- centralizing that translation improves:
  - consistency
  - speed of change
  - lower break risk
  - cleaner action handling at scale
- it also reduces:
  - repeated local transforms
  - hidden grouping drift
  - ownership drift
  - write/read drift between surfaces

## Token Behavior Language

Canonical structure should keep moving toward explicit token behavior at the `L3` level.

The intended language is:

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
- do not rely on remembered one-offs
- shell behavior should follow declared token behavior

## File To Record Mapping

- `Contacts File` -> `Contact Record`
- `Companies File` -> `Company Record`
- `Users File` -> `User Record`
- `Artifacts File` -> `Artifact Record`
- `Projects File` -> `Project Record`
- `Tasks File` -> `Task Record`
- `Notes File` -> `Note Record`
- `Roles File` -> `Role Record`

Examples of current `Knowledge DB` files:

- `Stages File` -> `Stage Record`
- `Locations File` -> `Location Record`
- `Markets File` -> `Market Record`
- `Round Securities File` -> `Round Security Record`
- `Ingestion File` -> `Ingestion Record`

Current frontend direction:

- `Knowledge DB` files should reuse the same shared file shell path used for the shell standardization work
- once promoted into real file surfaces, they should not live on a separate placeholder page design

## Shared File Shell

The product should use one shared file shell source.

Current implementation:

- shared shell source: `src/components/FilePageShell.vue`
- page files are thin wrappers
- file routes still own their own `L1`

That means:

- `Users` should load `Users`
- `Companies` should load `Companies`
- `Markets` should load `Markets`
- `Securities` should load `Securities`
- `Ingestion` should load `Ingestion`

Only the literal `File Shell` lab route should switch `L1` through the shell selector.

Normal file pages should not inherit the last chosen shell source from the `File Shell` lab.

## Shared Shell Styling Rule

Shared shell visuals should be fixed at shell level.

That means:

- `L1` should not control shell theme changes
- `L1` should not control avatar color changes
- shell styling should come from one shell contract

`L1` is allowed to change only:

- payload
- labels
- section/token membership
- declared capabilities, when explicitly approved

Working rule:

- if switching `L1` changes shell visuals, treat that as contract drift unless it was explicitly approved as a shell capability

## Game Layer

The product is also moving toward a game-styled guidance layer.

This game layer should:

- make progress visible
- turn structured work into quests
- rank objectives by relevance
- help the user understand what matters next

Current rule:

- this layer is guidance, not truth
- it should sit above the contract system
- it should not weaken canonical ownership or runtime verification

Current player-facing role:

- the `Companion` should help the user navigate the game and score points in a useful way

Current guide-facing role:

- the `Game Master` should explain rankings, quests, stage objectives, and point changes

Current scope:

- this is a first draft
- the active main objective is still getting the underlying structure, ownership, and runtime paths correct
- the game layer should help surface issues in that structure, not distract from fixing them

## Edit Dialog Contract

The shared edit dialog should read the true current record through:

- `active L1 entity`
- selected `recordId`
- `databooks.view(activeL1Entity, recordId)`

The dialog should then preload token values from:

- returned databook `fields` first
- returned flat `record` second

It should not preload from:

- card chips
- table summaries
- reduced list-row payloads

If a field is sourced from a linked owner path:

- it should load visibly
- it should render locked when the current record does not own it
- the user should be able to follow the field back to the owner record clearly

## Heuristic Guidance Rule

Heuristics should be used to help users move faster without weakening ownership.

That means heuristics may:

- front-load likely options
- rank likely selections
- prioritize what matters most at the current stage
- use board relevance and the point system as ranking inputs

That means heuristics may not:

- invent ownership
- invent undeclared relationships
- collapse a relationship into a scalar value
- override the approved write path

Working rule:

- heuristics guide choice
- contracts govern truth

## Standard DB Settings

New file-backed DBs should start with one standard baseline unless there is an explicit approved reason to diverge.

That baseline is:

- one real sqlite table behind the file
- one preload/main bridge path with at least `list`, `create`, and `delete`
- one canonical structure with:
  - `System`
  - `KDB`
  - `General`
- `General` should at minimum include:
  - `Name`
  - `Summary`

Working order rule:

- `Name` is the first canonical general field
- `Summary` is the second canonical general field
- shared edit surfaces should treat `Name` as the first field in the left grid
- shared edit surfaces should treat `Summary` as the first field in the right grid

This is the default contract for new `Knowledge DB` files such as:

- `Markets`
- `Securities`
- `Ingestion`
- `Roles`

Controlled exception:

- `BB File` is not part of this standard baseline
- `BB File` is a `System-Level File`, not a normal app-data `L1`
- instead of `System` / `KDB`, its approved first-pass `L2` structure is:
  - `General`
  - `Usage`
  - `Anatomy`
  - `Source`
  - `Reconstruction`
  - `Variants`

## Owner Bootstrapping

The local owner profile should become the first real `User`.

Current product meaning:

- owner settings should not live only in a separate profile surface
- if owner identity exists, it should also appear in the `Users` file
- the system should also ensure an `Owner` role record exists
- the linked `Contact` should also exist immediately
- the owner bootstrap should assign a base `Companion`
- the owner bootstrap should assign a base `Owner Opportunities Project Space`
- the owner bootstrap should assign a base `Owner Ingestion Project Space`
- the owner bootstrap should assign a base set of `User Roles`
- the owner bootstrap should assign a base set of `Companion Roles`
- the owner bootstrap should create `Master Companion Role`
- the owner bootstrap should create a `User Set-up` project and its default setup tasks
- the user may skip setup task completion, but those bootstrap project/task records should still be created
- `Owner Genesis` should also initialize the current approved schema baseline from `src-electron/services/sqlite-schema.js`, using the current table set as-is rather than a reduced temporary subset
- `Master Companion` should perform sequential genesis file creation, beginning with `L1 Files`, then `Events`, then the current base file set in approved order
- `BB File` should be treated as the first conceptual file in that sequence because it defines the visible building language before the operational file system is interpreted
- file creation should happen before the bootstrap records that belong inside those files are created
- `Events` should be treated as a first-class file/entity in that same file creation order, not as a lightweight side feed

Current limit:

- the product now has a real `Roles` DB
- but there is not yet a true user-to-role relationship contract
- so the system should not pretend that `User -> Owner Role` linkage is already modeled if it is not

## Product Description

A `Record` is the detailed view for a single row or item inside a file.

It opens the full structured workspace for that specific item, including:

- first-order fields
- linked context
- relationships
- notes
- artifacts
- supporting information

## Record View Behavior

The eye icon opens the `Record View` for a specific record.

The `Record View` is where the user:

- reads the structured information
- reviews record-linked context
- browses relationships
- works on that record as a canonical item in the system

Approved direction:

- `Record View` should converge into the shared `Record Shell`
- route-level `Record View` now resolves into the shared `Record Shell`
- record-specific detail pages should not keep diverging once the shared shell is ready
- the selected record should feed the shell payload underneath

Current approved shell pattern:

- base it on the current `User Record View` hero/dashboard
- keep icon-only `settings` and `add record` controls beside `Name`
- render selected `L3` rows in the left middle column
- render `Summary` as the first row in the right middle column
- render each selected `L3` row as:
  - top row: label + `L2` description
  - bottom row: value + status icon

Interaction direction:

- `Record View` should become live inside the shell
- fields should move toward direct in-place editing
- the plus action should be used to add a new record, not to enter an edit dialog for the current record

Shared middle-field rule:

- the selected middle fields should be remembered per `L1`
- that remembered selection should be shared between `File Shell` card settings and `Record Shell` hero settings
- both shells should show the same chosen middle-field set for the same `L1`

## Record View Section Bar

The section bar below the hero/dashboard is part of the `Record View` pattern.

It should follow these rules:

- `System` is always first on the left
- file-specific sections go in the middle
- `KDB` is always last on the right

`KDB` is different from the other sections because it changes the interaction model of the page.

When the user opens `KDB`, that section can support:

- labels
- grouped relationship families
- filters
- grid/row toggles
- relationship browsing

So `KDB` is not just another content tab.

It is a special section with its own browsing mode and should stay anchored on the far right.

Current grouping rule:

- `KDB` should group relationship tokens into:
  - `First-Order`
  - `Knowledge DB`

This is a browsing/display rule, not a reduction of the underlying relationship declarations.

## Design Intent

Every record landing view should share the same overall look and feel.

The shell, spacing rhythm, action language, and visual hierarchy should feel consistent across record types.

The content inside that frame can then specialize by entity.

The same consistency rule also applies to page mechanics:

- record-opening navigation should come from shared helper utilities, not page-local route objects
- return-path construction should be centralized when multiple file pages use the same pattern
- route-query normalization and sync should be shared when multiple file pages expose the same view-state model
- one-off helper drift should be treated as cleanup debt, not as an acceptable steady state

## Reserved Concept

`Databook` is not the main product language right now.

We are reserving `Databook` as a separate concept for later, when it has its own clearer meaning.

## Canonical Ownership Model

The system should treat first-level records as canonical sources of truth.

That means:

- if a card edits a linked first-level record, it should load that canonical record
- if it saves changes to a linked first-level record, it should save back to that same canonical record
- the UI should make it clear which fields are first-order and owned by the current record versus linked from elsewhere

## First-Level Canonical Tables

These are the main first-level canonical tables that currently matter most to product workflows:

- `Companies`
- `Opportunities`
- `Funds` as an opportunity subtype
- `Rounds` as an opportunity subtype
- `Contacts`
- `Tasks`
- `Projects`
- `Notes`
- `Artifacts`
- `Intros`
- `PipelineInvestmentProcess`

## Canonical Contract

For the opportunity lane:

- `Opportunities` is the shared parent canonical shell contract
- `Funds` and `Rounds` are subtype branches under that parent
- shared fields should be owned by `Opportunities`
- diverging `Economics` and `Controls` structures should remain subtype-owned instead of being forced into one fake shared section
- create/add-record should ask the user which subtype route to take before opening the shared record dialog
- while this parent contract remains abstract in runtime record snapshots, direct live KDB links should target `Funds` and `Rounds`, not `Opportunities`

For every first-level canonical table:

- metadata fields are direct inputs into that table or its owned subtable(s)
- those metadata fields should be edited through their canonical owner surface
- relationships to other first-level tables should be searchable through the target table’s real metadata
- relationship editors should save to the real join table, not local-only draft state pretending to be canonical

## First-Order Field Rule

A field is first-order when the current card, dialog, or record is the natural canonical owner of that data.

Examples:

- company name, company type, website, one-liner -> first-order `Companies`
- fund name, fund target size, fund raising status -> first-order `Funds`
- round name, round stage, security type -> first-order `Rounds`
- contact name, email, phone, LinkedIn -> first-order `Contacts`
- artifact title, format, linked opportunity -> first-order `Artifacts`
- task name, status, due date -> first-order `Tasks`


If a field belongs to a different canonical table, the UI should either:

- show it as a linked relationship editor
- or clearly communicate that the user is editing a related record, not local-only fake state

## Relationship Search Rule

When the user links one first-level record to another:

- search should query the target table’s real metadata
- saved links should use the target record id
- loaded relationship state should come from the real join table

Examples:

- linking a company should search company metadata such as `Company_Name`, `Company_Type`, `Website`
- linking a contact should search contact metadata such as `Name`, `Professional_Email`, `Personal_Email`
- linking a round should search round metadata such as `Round_Name`
- linking a fund should search fund metadata such as `Fund_Name`
- linking an artifact should search artifact metadata such as `title`, `artifact_format`, and linked owner labels

## Artifact Processing Provenance Rule

When an artifact is selected and moved into the `Ingestion Companion` processing lane, the system should treat that as the start of a tracked processing record.

That tracked record belongs in:

- `Ingestion`

The intended relationship model is:

- `Original Artifact`
  - related `Ingestion`
  - related `Created Files`
- `Ingestion`
  - linked back to the `Original Artifact`
  - linked to its `Created Files`

Working meaning:

- the original artifact should show what processing happened to it
- the original artifact should also show the files that were created from that processing
- each created file should still preserve the link back to the original artifact through the ingestion chain

Created-file rule:

- created files should be stored under the ingestion record in a `Created Files` column or equivalent relation surface
- each created file should render as its own line item
- each created file should carry a `Working` marker so it is clear that it is an AI working file derived from the source artifact

## Canonical Relationship Editing Rule

Relationship editors should not behave like disconnected local copies.

The target behavior is:

- read from the canonical linked record or join table
- edit against the canonical linked record or join table
- avoid creating duplicates by accident

## KDB Relationship Rule

KDB relationships are not optional UI conveniences.

They are intended to be real information pipelines between linked `L1`s.

Current shared-shell launch rule:

- card-view `Add Relation` should route into `dialog-shell`
- that launch should carry the source `L1`, clicked record id, and canonical entity name
- the shared `Add/Edit Record Shell` should open directly in `KDB`

That means if a KDB relationship is declared in canonical structure:

- it should have a real owner path
- it should have a real reverse-read path
- it should appear from both linked records once backed
- it should behave the same way across `Page View`, `Card View`, and `Record View`

Product rule:

- the shell should never guess relationship ownership
- the shell should never treat a relationship token like a normal writable column
- if a relationship is declared but not yet backed, that is a product contract gap that should be surfaced honestly

## Mandatory KDB Standard For New Connections

When a new connection is approved between two `L1`s, it should follow the same contract every time.

Required pieces:

- canonical relationship token on the declaring side
- canonical reverse relationship presence on the linked side
- one real runtime owner path underneath the relationship
- one reverse-read path so the relationship is visible from both sides
- one shared editing rule, not page-specific behavior

This is the minimum standard for new KDB connections.

Do not:

- add a relationship token without planning the owner path
- fake reverse appearance in only one surface
- patch a single page to behave as if the relationship were complete

Current shared owner-path standard:

- if a canon-declared KDB relationship already has an approved domain-specific join table, use that
- otherwise use the shared `KDB_Relationships` runtime contract

This keeps even non-golden `L1`s and `Knowledge DB` files on the same relationship system instead of drifting into custom pair logic.

## Current Relationship Status

Currently runtime-backed strongly enough to be treated as real relationship paths:

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

Currently declared in canon but still incomplete underneath:

- many `User_*` relationships
- many `Artifact_*` relationships
- several `Note_*` relationships

Important example:

- `User <-> Project` is declared in canon
- but it should not be treated as finished until the runtime owner path and reverse-read path really exist

## Current Working Interpretation

### Generally Working

- company canonical editing is much closer to correct
- contact canonical editing is much closer to correct
- artifact relationship editing has a clearer canonical repair surface

### Still Partial

- opportunity metadata should be more explicitly first-order
- task relationship editing still needs fuller coverage
- project relationship editing still needs fuller coverage
- some record and dialog surfaces still need a clearer canonical relationship contract

## Highest-Impact Gaps

### 1. Opportunity Surface

The biggest remaining consistency gap is the opportunity surface.

- company is closer to canonical behavior
- contact is closer to canonical behavior
- the opportunity record itself still needs stronger first-order framing

### 2. Task Relationship Editing

Tasks have a canonical record owner, but related first-level links are still incomplete in the editing experience.

### 3. Project Relationship Editing

Projects need the same canonical relationship audit and editor coverage as tasks.

### 4. Embedded Related Cards

Any embedded relationship card should always be checked for:

- does it load from the canonical linked record?
- does it save back to that canonical linked record?
- does it accidentally create a duplicate?

## Rollout Priorities

Recommended canonical-reference rollout order:

1. `Opportunity` first-order ownership
2. `Task` relationship editing
3. `Project` relationship editing
4. broader `Record View` relationship card audits
5. secondary surfaces such as `Intros` and `PipelineInvestmentProcess`

## Working Principle

We want the system to be understandable as one coherent product.

So the practical principle is:

`Use File and Record as the product language, treat first-level records as canonical owners, and make linked editing read and write through the real canonical sources of truth.`


## Naming Layers

The product currently uses several naming layers that must stay distinct:

- `L1` label:
  the user-facing section name, such as `Markets`
- route key:
  the navigation/shell key, such as `industries`
- canonical entity name:
  the structural ownership name, such as `Financial_Industries`
- databook table name:
  the IPC/database action name, such as `Industries`

Shared shells may render from canonical structure and route keys, but IPC actions must use databook table names.

Do not assume these names are interchangeable.

## Shared Label Normalization

Surfaced shell labels should use current product language even when older canonical or DB names still exist underneath.

Approved examples:

- `BEmail` -> `Business Email`
- `PEmail` -> `Personal Email`
- `Financial Industry` / `Financial Industries` -> `Markets`

Working rule:

- canonical names may remain structural
- databook names may remain operational
- surfaced labels should normalize to approved product wording in the shared label layer
