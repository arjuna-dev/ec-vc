# File Card Structure Reference

## Purpose

This document defines the current normalized `File` card structure used across the main file pages.

It should be used for:

- card template maintenance
- bulk UI patching
- consistency checks
- onboarding future cleanup work

If the card shell changes in a meaningful way:

- update this file
- keep the 8 file pages aligned to it

## Scope

This reference currently applies to:

- `Users`
- `Contacts`
- `Companies`
- `Artifacts`
- `Opportunities`
- `Projects`
- `Notes`
- `Tasks`

## Current Normalized Card Shell

Each file card should follow the same top-level section order:

1. `control row`
2. `hero`
3. `summary`

In template terms, the current normalized structure is:

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

## Control Row

The control row is the thin top strip of the card.

It should contain:

- the select checkbox on the left
- the eye icon on the right

Rules:

- spacing should feel visually balanced from both borders
- the row should hug the top edge of the card cleanly
- corners should clip with the card shell so hover states do not poke out

## Hero

The hero section is the top content block below the control row.

It contains:

- the visual identity area on the left
- the metadata box on the right

Rules:

- the right box is the main metadata box for the card
- title typography should stay consistent across file families unless intentionally specialized
- Notes and Tasks should not drift into smaller typography unless that is explicitly approved

## Summary

The summary section is the lower relationship area of the card.

It is split into two parts:

### 1. Summary Head

This row should contain:

- the KDB relationship icon strip on the left
- the mini grid/row toggle on the right

Rules:

- the icon strip stays lightweight
- all icons are clickable
- empty relationship states are allowed and should show empty text in the panel body

### 2. Summary Panel

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
- the panel body below it renders the active relationship content or the empty state

## Naming Convention

For long-term maintainability, file card grid templates should use the same loop alias:

- preferred loop alias: `row`

This is important because shared patching becomes fragile when templates mix:

- `row`
- `user`
- `group`
- other entity-specific aliases

Current normalization target:

- use `row` in the main card loop wherever practical

## Current Drift We Already Fixed

### Contacts

`ContactsPage.vue` had structural drift inside the summary panel:

- wrapper nesting around `summary-body` and `summary-body-content` was not aligned with the other pages

That has now been normalized.

### Users and Artifacts

`UsersPage.vue` and `ArtifactsPage.vue` had loop-alias drift:

- `user`
- `group`

Those have now been normalized toward the shared `row` pattern.

## Maintenance Rules

When editing one file card page:

- check whether the same change belongs in all 8 file pages
- prefer keeping section order identical
- prefer keeping wrapper names identical
- prefer keeping loop alias naming identical
- avoid one-off template shape changes unless they are truly entity-specific

## Bulk Patch Checklist

Before making a bulk card change:

- confirm the same wrapper structure exists on all 8 pages
- confirm the same loop alias is being used
- confirm the same CSS block names exist
- confirm the change belongs to the shared shell, not entity-specific content

After making a bulk card change:

- lint
- compare at least `Users`, `Contacts`, `Artifacts`, and `Projects`
- if one page drifts, update this reference

## Relationship Between This Doc And The Master Docs

This file is a maintenance reference.

It does not replace:

- `record-architecture-master-plan.md`
- `product-reference-guide.md`

Those documents explain the architecture and product language.

This document explains the current normalized card shell that the file pages should share.
