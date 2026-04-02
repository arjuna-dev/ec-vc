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

## Precision Language

To stay precise while the codebase is still finishing its naming cleanup, use the following language:

- `Workbook` when talking about the Excel file or schema reference
- `DB` or `DB Tables` when talking about the database
- `File page` when talking about landing pages such as `Users`, `Contacts`, `Companies`, `Artifacts`, `Projects`, `Notes`, `Tasks`, and `Opportunities`
- `Record page` or `Record View` when talking about the eye-opened detail page
- `databook-view` only when talking about the literal current route or code name

This distinction matters because the product language is cleaner than some of the older route and implementation language still present in the app.

## System Model

Pattern:

`File -> record list -> eye icon -> Record View`

When the user clicks the eye icon from a file, they open the detailed view for that specific record.

## File To Record Mapping

- `Contacts File` -> `Contact Record`
- `Companies File` -> `Company Record`
- `Users File` -> `User Record`
- `Artifacts File` -> `Artifact Record`
- `Projects File` -> `Project Record`
- `Tasks File` -> `Task Record`
- `Notes File` -> `Note Record`
- `Roles File` -> `Role Record`

## Product Description

A `Record` is the detailed view for a single row or item inside a file.

It opens the full structured workspace for that specific item, including:

- metadata
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

- `System Data` is always first on the left
- file-specific sections go in the middle
- `KDB Relationships` is always last on the right

`KDB Relationships` is different from the other sections because it changes the interaction model of the page.

When the user opens `KDB Relationships`, that section can support:

- labels
- filters
- grid/row toggles
- relationship browsing

So `KDB Relationships` is not just another content tab.

It is a special section with its own browsing mode and should stay anchored on the far right.

## Design Intent

Every record landing view should share the same overall look and feel.

The shell, spacing rhythm, action language, and visual hierarchy should feel consistent across record types.

The content inside that frame can then specialize by entity.

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
- `Rounds`
- `Funds`
- `Contacts`
- `Tasks`
- `Projects`
- `Notes`
- `Artifacts`
- `Intros`
- `PipelineInvestmentProcess`

## Canonical Contract

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
