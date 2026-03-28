# Staged Markdown Intake Spec

## Goal

Large documents should not force the whole intake pipeline to wait for one final markdown artifact.
Instead, markdown should be released in stages so the highest-value extraction work can begin earlier.

This should improve:

- time to first useful prompt
- matching accuracy for company / opportunity / contacts
- reduced duplicate review across extraction lanes
- better user guidance while long documents are still processing

## Core Rule

Markdown is not treated as one monolithic finished output.
It is treated as a sequence of releasable chunks or sections.

As soon as a chunk is considered good enough for first-pass review, it can be released to the early extraction lanes.

## Priority Order

These extraction lanes should run first on released markdown chunks:

1. `Company`
2. `Opportunity`
3. `Contacts`

These are the early-value lanes because they help:

- identify the canonical records
- reduce duplicate creation
- improve relationship matching
- guide the rest of the intake flow

These later lanes should wait until enough first-pass ownership is established:

- `Artifacts` deeper classification
- `Notes`
- `Tasks`
- `Assistant Proposal`
- lower-priority relationship hints
- long-tail metadata extraction

## Chunk Model

Each large document should be representable as staged markdown units.

Suggested chunk statuses:

- `raw`
- `normalized`
- `ready_for_early_extraction`
- `owned`
- `ready_for_secondary_extraction`
- `reviewed`

Suggested chunk metadata:

- `chunk_id`
- `artifact_id`
- `source_page_range` or source section hint
- `markdown_text`
- `stage_status`
- `released_at`
- `used_by`
- `owned_fields`
- `confidence`

## Ownership Model

Once a chunk or a field from a chunk has already been used by an early extraction lane, that usage should be visible and respected.

Each extracted fact should track:

- `field_key`
- `field_value`
- `owner_table`
- `consumer_lane`
- `source_chunk_id`
- `source_type`
- `confidence`
- `verification_state`

Example:

- `Company_Name`
- owner table: `Companies`
- consumer lane: `Company`
- source chunk: `chunk_002`
- source type: `markdown_heading`
- verification state: `verified`

## Stand-Down Rule

If a high-value metadata field has already been claimed by an earlier lane or verified by the user, later lanes should not keep re-reviewing or overwriting it during extraction.

This stand-down rule applies only during extraction.

It does not remove the user's ability to change the final chosen value in the dialog before `Create`.

## Release Strategy

For large documents, markdown release should work like this:

1. generate the first clean chunk or section
2. release it immediately to early extraction lanes
3. allow early user confirmation prompts to appear from those early chunks
4. continue generating additional markdown chunks in the background
5. route later chunks only to lanes that still need unresolved information

This means the app should favor:

- partial early usefulness
- fewer idle extractors
- less repeated review of already-owned facts

## Early Prompt Strategy

Early prompts should come from the first released chunks whenever possible.

Priority fields:

- `Document Type`
- `Sponsor Company`
- `Related Fund`
- `Related Round`
- `Related Contact`
- `Website`

These prompts should appear before the rest of extraction moves too far downstream.

## Intake UI Behavior

The UI should show that intake is staged and not all agents are working on the same thing blindly.

Recommended visible concepts:

- `Released Chunks`
- `Early Extraction`
- `Used Metadata`
- `Waiting on Confirmation`
- `Secondary Extraction`

For each used metadata item, the UI should be able to show:

- what value was used
- which table owns it
- which lane consumed it
- which chunk it came from
- whether it was AI-proposed or user-verified

## Practical Frontend Rule

At the frontend level, the system should behave as if:

- early extracted metadata can become temporarily protected during extraction
- verified metadata should be marked as already considered
- secondary suggestions should avoid overwriting already-owned fields
- final dialog editing still remains under user control

## Suggested Execution Order

1. define a frontend chunk-state model for released markdown sections
2. add chunk ownership / used-metadata tracking to intake draft state
3. route first-pass extraction to `Company`, `Opportunity`, and `Contacts`
4. defer `Notes`, `Tasks`, and `Assistant Proposal` until after early confirmation
5. expose chunk and ownership status in the intake UI

## Out of Scope For This Pass

This spec does not require changing the database schema.

This pass should stay focused on:

- frontend orchestration
- intake state modeling
- staged review behavior
- reduced redundant extraction
