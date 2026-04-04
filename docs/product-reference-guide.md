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

## Precision Language

To stay precise while the codebase is still finishing its naming cleanup, use the following language:

- `Workbook` when talking about the Excel file or schema reference
- `DB` or `DB Tables` when talking about the database
- `File page` when talking about landing pages such as `Users`, `Contacts`, `Companies`, `Artifacts`, `Projects`, `Notes`, `Tasks`, and `Opportunities`
- `Record page` or `Record View` when talking about the eye-opened detail page
- `record-view` when talking about the literal current route name
- `Databook` only when talking about older internal bridge or class naming that has not been fully cleaned yet

This distinction matters because product language is now cleaner than the remaining older internal implementation language still present in the app.

## System Model

Pattern:

`File -> record list -> eye icon -> Record View`

When the user clicks the eye icon from a file, they open the detailed view for that specific record.

Implementation note:

- route path: `/records/:tableName/:recordId`
- route name: `record-view`
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
- `Financial Industries File` -> `Financial Industry Record`
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

Only the literal `Test Shell` should switch `L1` through the shell selector.

Normal file pages should not inherit the last chosen shell source from `Test Shell`.

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

This is the default contract for new `Knowledge DB` files such as:

- `Markets`
- `Securities`
- `Ingestion`
- `Roles`

## Owner Bootstrapping

The local owner profile should become the first real `User`.

Current product meaning:

- owner settings should not live only in a separate profile surface
- if owner identity exists, it should also appear in the `Users` file
- the system should also ensure an `Owner` role record exists

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

## Record View Section Bar

The section bar below the hero/dashboard is part of the `Record View` pattern.

It should follow these rules:

- `System` is always first on the left
- file-specific sections go in the middle
- `KDB` is always last on the right

`KDB` is different from the other sections because it changes the interaction model of the page.

When the user opens `KDB`, that section can support:

- labels
- filters
- grid/row toggles
- relationship browsing

So `KDB` is not just another content tab.

It is a special section with its own browsing mode and should stay anchored on the far right.

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

For person records and profile inputs:

- use `Given Names`
- use `Last Names`

Current implementation rule:

- the UI captures split name inputs where they apply
- the current DB still stores the existing combined name field underneath

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


