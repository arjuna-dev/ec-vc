# Workbook Record Payload Contract

## Purpose

Define the canonical payload contract for `Record View` so the app follows the same structure as the workbook and the UI file system.

The governing direction is:

`DB tables -> workbook structure -> record payload -> Record View UI`

This means:

- database tables should support the workbook model
- workbook sections are the source of truth for section order
- record payloads should be emitted in workbook section order
- `RecordPage.vue` should render from that payload instead of inventing section structure on the fly

## Working Approach

For the first pass, the workbook should be used as the canonical setup and validation layer.

That means we use the workbook to verify:

- section order
- section membership
- leaf-token ownership
- relationship coverage

After that alignment is in place, the app does not have to force every record type into a perfectly workbook-shaped runtime implementation.

The practical rule is:

`Use the workbook as the canonical setup and validation layer, but allow the current RecordPage execution model to remain if it can render the correct structure cleanly.`

This keeps the workbook as the structural source of truth, while still letting the current `RecordPage.vue` rendering model and placeholders do their job where they are already working well.

## Core Rule

Every workbook-backed record should expose:

- `Metadata` first on the left
- any file-specific middle sections next
- `KDB Relationships` last on the right

For section behavior:

- normal sections render the leaf tokens that belong to that section
- `KDB Relationships` renders the special relationship mode with labels, filters, and grid or row toggles

## Canonical Payload Shape

Each `Record View` payload should eventually follow this shape:

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
      "label": "Metadata",
      "kind": "fields",
      "items": []
    },
    {
      "id": "kdb-relationships",
      "label": "KDB Relationships",
      "kind": "relationships",
      "items": []
    }
  ],
  "fields": []
}
```

Notes:

- `sections` should become the primary UI contract
- `fields` can continue to exist during migration for compatibility
- each section item should already be in workbook leaf-token order
- each section should have a stable `kind`
- `kind: "fields"` means render leaf tokens
- `kind: "relationships"` means render the KDB relationship browser

## Section Item Shape

For normal field sections, each leaf token item should carry:

```json
{
  "key": "Users|user:123|User_Name",
  "token": "User_Name",
  "label": "User Name",
  "value": "Jane Doe",
  "editable": true,
  "table_name": "Users",
  "record_id": "user:123",
  "field_name": "User_Name",
  "id_column": "id"
}
```

For `KDB Relationships`, the section should carry first-level relationship groups such as:

- `artifacts`
- `users`
- `contacts`
- `companies`
- `funds`
- `rounds`
- `projects`
- `tasks`
- `notes`

Each relationship item should carry enough metadata for grid and row rendering.

## Current Execution

Right now the app is mixed:

- `RecordPage.vue` is the shared record-view renderer
- the route still calls the Electron handler `databooks:view`
- [electron-main.js](/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js) builds the record payload
- `Companies` uses a custom builder
- legacy opportunity-style records also use a custom builder
- simpler record types still use a generic row-to-fields builder

That means the UI is currently receiving two different kinds of payloads:

- workbook-aware custom payloads
- raw table-column payloads

This is the main reason some records feel aligned and others still feel improvised.

## Current Generic Behavior

For generic record types, Electron currently does this:

1. finds the table config
2. loads the row from that table by primary key
3. turns each column into one `field`
4. labels each field with the entity name as its section
5. sends the payload to `RecordPage.vue`

This is simple, but it is weaker than the workbook model because it does not explicitly emit:

- workbook sections
- workbook leaf-token order by section
- a real `KDB Relationships` section
- file-specific middle sections such as `Overview`, `Team`, `Economics`, or `Controls`

## Migration Rule

As we upgrade each record type, we should use the workbook to align and validate the structure first.

Then we decide case by case whether the backend needs a richer custom payload or whether the current `RecordPage.vue` execution model can already render that structure cleanly.

The target is not to force every record type into one rigid backend shape too early.

The target is to make sure every record view correctly reflects:

- workbook section order
- workbook leaf-token membership
- a dedicated `KDB Relationships` section
- relationship items grouped correctly for the KDB browser

## Canonical Section Order By File

- `Users`: `Metadata`, `KDB Relationships`
- `Artifacts`: `Metadata`, `KDB Relationships`
- `Contacts`: `Metadata`, `Employment`, `Studies`, `KDB Relationships`
- `Companies`: `Metadata`, `Incorporation`, `Documents`, `Operations`, `Business`, `Market`, `Results`, `Business Plan`, `Fund Raising`, `KDB Relationships`
- `Funds`: `Metadata`, `Overview`, `Economics`, `Controls`, `KDB Relationships`
- `Rounds`: `Metadata`, `Overview`, `Economics`, `Controls`, `KDB Relationships`
- `Projects`: `Metadata`, `Overview`, `Team`, `KDB Relationships`
- `Tasks`: `Metadata`, `Overview`, `Team`, `KDB Relationships`
- `Notes`: `Metadata`, `KDB Relationships`
- `Roles`: `Metadata`, `KDB Relationships`

## Canonical Ownership Rule

Each section should be backed by the tables that actually own those tokens.

Examples:

- `Users`
  - `Metadata` from `Users`
  - `KDB Relationships` from first-level related joins and references
- `Projects`
  - `Metadata` from `Projects`
  - `Overview` from `Project_Overview`
  - `Team` from `Project_Team` and related team join tables
  - `KDB Relationships` from first-level related join tables
- `Tasks`
  - `Metadata` from `Tasks`
  - `Overview` from `Task_Overview`
  - `Team` from `Task_Team` and related team join tables
  - `KDB Relationships` from first-level related join tables
- `Funds`
  - `Metadata` from `Funds`
  - `Overview` from `Fund_Overview`
  - `Economics` from `Fund_Economics`
  - `Controls` from `Fund_Controls`
  - `KDB Relationships` from related join tables and referenced records
- `Rounds`
  - `Metadata` from `Rounds`
  - `Overview` from `Round_Overview`
  - `Economics` from `Round_Economics`
  - `Controls` from `Round_Controls`
  - `KDB Relationships` from related join tables and referenced records

## Immediate Implementation Target

The next implementation pass should focus on changing Electron record builders so they emit workbook-aligned `sections`.

Suggested order:

1. `Users`
2. `Artifacts`
3. `Tasks`
4. `Projects`
5. `Notes`
6. `Funds`
7. `Rounds`

After that, `RecordPage.vue` can be simplified to trust `payload.sections` directly.
