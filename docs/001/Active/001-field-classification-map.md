# Field Class Map

## Purpose

This document is the live working map for the first explicit field-class layer.

Use it to review and edit the behavior of tokens without hand-scanning the full canonical JSON every time.

This map is meant to answer:

- what kind of field is this
- who owns it
- how many links should it support
- whether it should be visible from the other side
- where it should be edited

## Working Rule

The token behavior should live in the structure, not in remembered exceptions.

That means this map should help us move toward explicit token behavior such as:

- `field_class`
- `ownership_mode`
- `cardinality`
- `reverse_visibility`
- `write_path`

## Field Classes

| Field Class | Meaning | Typical Directionality | Typical Edit Rule |
| --- | --- | --- | --- |
| `owned_field` | Ordinary field value on the current record or owned subtable | Local | Edit on the current record |
| `directional_link` | Root-established or rule-bearing path such as identity, authority, provenance, or parentage | One-directional | Edit from the owner side only |
| `ldb_relationship` | Mutual relationship between records | Usually bidirectional | Edit through the approved relationship owner path |

## Root Cases

These are the first cases we should normalize before the broader pass.

| File | View Fork | Token | Human Meaning | Field Class | Ownership Mode | Cardinality | Reverse Visibility | Write Path | Editable Where | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Owner_DB` | `System` | `Owner_User` | The node can have only one owner user | `directional_link` | `root_owned` | `one_to_one` | `visible` | `Owner_DB.owner_user_id` | owner/root only | This is authority and bootstrap, not casual LDB |
| `Users` | `System` | `User_Role` | A user receives a role and permissions | `directional_link` | `root_owned` | `one_to_one` to start | `visible` | `Users_Roles.role_id` | owner / admin side | Treat as permissions path, not loose LDB. |
| `Contacts` | `LDB` | `Contact_User` | A contact may be the same human as a user | `directional_link` | `root_owned` | `one_to_one` | `visible` | `Contacts.linked_user_id` | owner side only | Already backed directly in the DB |
| `Users` | `LDB` | `User_Contact` | Reverse-visible identity link from user to contact | `directional_link` | `root_owned` | `one_to_one` | `visible` | reverse of `Contacts.linked_user_id` | follow back to owner side | Should not behave like generic multi-link LDB |
| `Any L1` | `System` | `*_Creator` | The actor who created the record | `directional_link` | `root_owned` | `one_to_one` | `visible` | creator provenance path | source record only | Loaded but locked in linked views |
| `Artifacts` | `LDB` or `System` | `Artifact_Ingestion` | Original artifact points to ingestion/provenance flow | `directional_link` | `relationship_owned` | `one_to_many` | `visible` | ingestion provenance owner path | owner/provenance side | Treat as provenance, not casual LDB |
| `Ingestion` | `LDB` or `System` | `Ingestion_Created_Files` | Ingestion creates downstream files | `directional_link` | `relationship_owned` | `one_to_many` | `visible` | created-files provenance path | ingestion side | Output lineage should remain explicit |

## Current Runtime Check

What is already true in the app now:

- saving owner profile creates or updates the first real `User`
- the same flow creates or updates the linked `Contact`
- that identity link is already backed directly through `Contacts.linked_user_id`
- the app ensures default role records for `Owner`, `Admin`, and `Guest`
- the app now persists a real `User -> Role` owner path through `Users_Roles`
- the app now persists a real root owner path through `Owner_DB.owner_user_id`

Supporting DB paths:

- `Roles`
  - defines the role records

- `Users_Roles`
  - defines the assignment path from `User` to `Role`
  - should be treated as a real underlying assignment DB
  - does not need to be its own user-facing file page yet

What is not yet fully true:

- product surfaces still need to make those new spine paths more visible and easier to inspect

Working rule:

- owner bootstrap is now runtime-backed through explicit owner and role paths
- owner authority is locked in normal editing
- owner data remains editable, but only by the owner
- owner-rooted files should follow the owner spine for provenance and ownership
- the owner `User` and owner `Contact` should not be deletable through normal editing
- the last remaining `User` and `Contact` should not be deletable
- owner settings should use one linked email path, not parallel owner email fields
- the next step is to make those paths clearer in the UI and token metadata layer

## Review Prompts

When reviewing a token, ask:

1. Is this a local value, a directional link, or a true LDB relationship?
2. Would editing it from both sides create ambiguity?
3. Does it define identity, authority, provenance, or parentage?
4. Is the current runtime path direct, joined, or generic?
5. Should the reverse side be visible, editable, or only followable?

## Current Decision Standard

For now:

- prefer explicit owner paths over generic LDB when the field is really identity, authority, or provenance
- use generic LDB only when the relationship is genuinely mutual and not already owned directly
- keep the wording repeated across:
  - architecture
  - product reference
  - companion contract
  - game rulebook

## Next Expansion Candidates

After the root cases above, the next likely pass should include:

- `Project` parentage / governing company links
- `Ingestion` provenance links
- `Creator` paths across more `L1`s
- `User` and `Role` permission structure
- `Artifact_*` and `Note_*` links that may really be directional rather than generic LDB
