# Record View Consistency Audit

## Purpose

Audit the current `File -> Card -> Record View` flow against the workbook-first contract and identify the most important consistency gaps.

This audit is meant to guide cleanup work before deeper payload refactors.

## Highest Priority

The highest-priority issue is:

`The generic record rule set is still heuristic, not workbook-backed.`

In [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue), the current `GENERIC_SECTION_RULES` block still classifies fields using regexes and guessed field names instead of an explicit workbook token contract.

That means these record types are not yet truly driven by workbook structure:

- `Users`
- `Notes`
- `Projects`
- `Tasks`
- `Funds`
- `Rounds`

Why this matters:

- it allows section drift between workbook and UI
- it makes `KDB Relationships` incomplete or inconsistent
- it makes leaf-token ownership harder to reason about
- it increases the chance that future schema changes will silently render the wrong section structure

Working conclusion:

The current heuristic layer is acceptable only as a temporary first pass. It should not be treated as the long-term contract.

## Current State Summary

The current record system is partially consistent, but still mixed.

What is already good:

- there is now one shared record renderer in [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue)
- the file pages generally route eye-icon actions into the shared record route
- the workbook-first payload contract is now documented in [workbook-record-payload-contract.md](/c:/Users/erikc/Coding_Repository/ec-vc/docs/workbook-record-payload-contract.md)

What is still inconsistent:

- route and header naming still contain `Databook`
- `Contact` and `Company` section bars do not fully match their actual section definitions
- generic record types still rely on heuristic section mapping

## Findings

### 1. Route and shared-header naming still use `Databook`

Examples:

- [routes.js](/c:/Users/erikc/Coding_Repository/ec-vc/src/router/routes.js#L39)
- [MainLayout.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/layouts/MainLayout.vue#L443)
- [MainLayout.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/layouts/MainLayout.vue#L497)

Current issue:

- the shared record route is still named `databook-view`
- the path is still `/databooks/:tableName/:recordId`
- the shared layout still includes `Databook` fallback labels

Impact:

- old vocabulary can still appear in the UI
- code language is still mixed even though the product language has moved to `File` and `Record`

### 2. `RecordPage.vue` still contains internal `Databook` wording

Examples:

- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L5)
- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L634)
- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L1280)
- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2135)
- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2584)

Impact:

- the component name has been corrected, but internal semantics are still mixed
- future cleanup work will stay noisier until these names are normalized

### 3. `Company Record` section bar does not match its own section definitions

Examples:

- company sections in [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2794)
- company nav items in [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2914)

Current issue:

- the section objects describe one model
- the section bar labels describe another model

Impact:

- the company record is not currently consistent with either the workbook contract or its own declared section objects

### 4. `Contact Record` section bar also has mismatched tab logic

Examples:

- contact sections in [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2859)
- contact nav items in [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2926)

Current issue:

- the nav includes a `System` tab
- the contact sections do not define a matching `System` section

Impact:

- the contact record is structurally inconsistent inside its own section model

### 5. Generic records are still only partially workbook-aligned

Example:

- [RecordPage.vue](/c:/Users/erikc/Coding_Repository/ec-vc/src/pages/RecordPage.vue#L2939)

Current issue:

- the generic mapping layer helps force high-level section order
- but it is still deciding section membership through guessed field-name patterns

Impact:

- `Metadata` and `KDB Relationships` can be approximated
- true workbook leaf-token ownership is not yet guaranteed

## Entity Snapshot

### More aligned today

- `Contacts`
- `Companies`

These have more intentional record-specific rendering paths, though both still contain tab consistency issues.

### Partially aligned today

- `Users`
- `Artifacts`
- `Projects`
- `Tasks`
- `Funds`
- `Rounds`
- `Opportunities`
- `Notes`

These mostly depend on shared generic logic plus the heuristic section layer.

### Not yet audited into the record pattern

- `Roles`

`Roles` currently lives as a file page, but not yet as a workbook-backed record-view contract in the same way as the other entities.

## Recommended Cleanup Order

1. Remove remaining `Databook` naming from route, layout, and shared record component language.
2. Make `Contact` and `Company` section bars exactly match their actual section definitions.
3. Replace the heuristic `GENERIC_SECTION_RULES` approach with explicit workbook-backed token ownership by file type.
4. Upgrade Electron record payload builders so section membership comes from the workbook contract instead of UI-side guesses.

## Working Rule

Until the workbook-backed token contract is implemented per file type, any generic record section mapping should be treated as temporary.

The long-term source of truth must be:

- workbook section order
- workbook leaf-token ownership
- explicit `KDB Relationships` grouping
