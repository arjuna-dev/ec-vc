# Governed Translators Draft

## Purpose

This is a temporary drafting file for governed translators.

It exists to help us:

- track governed-translator candidates
- track runtime wires and feeder paths
- track which BB or shell components are still replicating shared behavior locally
- separate approved assets from drafting assets while convergence is still active

This file is allowed to be deleted later.

That is intentional.

It is a working scratchpad for convergence, not a final preservation file.

## Relationship To Other Docs

Use this file together with:

- `docs/999/Active/Recipe.md`
- `docs/999/Active/Intake_Governance.md`
- `docs/999/Active/Intake_Rulings.md`

Working rule:

- draft here while we are still understanding the translator or feeder
- move only tested and approved patterns into `Recipe.md`

## Why This Matters

We are trying to converge important utility-enhanced components into governed translators.

That means we want shared logic to become:

- named
- inspectable
- governable
- easier to debug
- easier to connect across backend, feeders/translators, and frontend

This file should help us identify where:

- a true governed translator is emerging
- a BB/system-facing asset is needed
- a local component is still replicating behavior that should be approved and shared instead

## Working Rule

When reviewing a shared shell, BB surface, or utility-enhanced component, ask:

1. Is this trying to translate governed input into shared output?
2. Is it doing that through one approved path or through local page/component shaping?
3. Should this stay a hidden helper, or is it becoming a governed system asset?
4. Does it need a BB/system-facing layer as well as a runtime layer?
5. Is a local component replicating behavior that should be removed once the approved asset exists?

## Draft Entry Format

Each drafting entry should try to answer:

1. `Name`
2. `Current Layer`
3. `Current Runtime Utility`
4. `Current BB/System Layer`
5. `Input Received`
6. `Translator / Feeder Responsibility`
7. `Current Output`
8. `Known Drift Or Replication`
9. `What We Think The Approved Shape Should Be`
10. `Status`

## Current Draft Entries

### 1. Shell Toolbar Feeder

`Current Layer`

- governed translator candidate
- shared shell feeder candidate

`Current Runtime Utility`

- `src/utils/shellToolbarFeeder.js`

`Current BB/System Layer`

- not approved yet
- no BB identity yet
- currently only previewed through sample BB/component surfaces

`Input Received`

- canonical section data
- governance items
- label rules such as `LDB` and `System`

`Translator / Feeder Responsibility`

- receive canonical section data
- classify and filter that data
- prepare a normalized feed
- hand that feed to the shared toolbar builder

`Current Output`

- `leftItems`
- `rightItems`
- `governanceItems`
- relationship-label matcher for the shared toolbar builder

`Known Drift Or Replication`

- multiple shells still shape toolbar requests locally
- BB/sample surfaces have been used only as concept previews so far
- no approved BB/system-facing translator asset exists yet

`What We Think The Approved Shape Should Be`

- one governed runtime feeder path
- one BB/system-facing identity
- one inspectable translator surface or dashboard

`Status`

- drafting
- not wired into live shell traffic yet

## BB Shell Cleanup Tracking

Use this section to track components that are still replicating shared behavior inside BB surfaces and should eventually be removed or replaced by approved assets.

### Current Focus

- identify BB/sample components that are rendering shared behavior through local sample logic instead of approved governed assets
- reduce BB-shell replication over time so BB surfaces show approved components, approved translators, or approved inspection assets only

### Current Notes

- `BuildingBlockPreviewTile.vue` still contains sample mini-toolbar behavior for preview purposes
- `ComponentsShellPage.vue` also contains sample toolbar feeding for component preview purposes
- these are acceptable for drafting and preview, but they should not become the long-term place where shared behavior is defined

## Exit Rule

Remove or shrink this file when:

- the governed translator has an approved shape
- the runtime and BB/system layers are clearer
- the approved pattern has been moved into `Recipe.md`
- BB-shell replication has been reduced enough that this draft is no longer needed
