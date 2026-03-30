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

## Recommended Batch Size

Do not treat every batch as the same size.

The first markdown batch should optimize for speed and early-value metadata, not completeness.

Recommended rule:

- `Batch 1`
  target about `750 words`
- `Batch 1 hard cap`
  no more than `1,000 words`
- `Batch 2+`
  target about `1,000 words`
- `Batch 2+ flexible range`
  roughly `800-1,200 words` depending on lane readiness

Whenever possible, release at the nearest logical section boundary instead of splitting in the middle of a useful block.

That means batch release should be based on:

- section boundary, or
- word target / hard cap

whichever gives the faster and cleaner result.

## Disclaimer Removal

Before the first batch is released, boilerplate and disclaimer-style text should be stripped when it is confidently identifiable.

Examples include:

- legal boilerplate
- generic confidentiality notices
- repeated footer text
- duplicated disclaimer pages

The goal is for early extraction lanes to receive the first useful business content as quickly as possible.

## Batch Pacing

Do not release later markdown batches only because more text exists.

Release pacing should also consider whether the early extraction lanes are ready for more content.

The intended rule is:

- release the first batch quickly
- let `Company`, `Opportunity`, and `Contacts` begin work
- release the next batch when those early lanes have capacity or still need unresolved information

This avoids flooding the downstream intake flow with too much content too early.

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

## Current Restart Point

The workstream is no longer at the "invent the whole system" stage.
It now has a partial frontend intake tracker and should restart from the current moving pieces.

Already working in the frontend:

- intake drafts persist in memory during the session
- released markdown chunks can be previewed during intake
- used metadata claims can be shown in review surfaces
- verification can skip and continue instead of blocking the whole flow
- unfinished artifacts can be resumed from the artifacts landing page

The next restart point should be:

1. keep the processing window reliably resumable
2. keep `Company`, `Opportunity`, and `Contacts` extraction visible as the first-value lanes
3. show clearer stage ownership and blocker state in the intake tracker
4. avoid re-asking for values that are already verified unless the suggested value actually changed
5. make the tracker itself a visible operating surface, not just hidden draft state

## Intake Tracker Surface

The intake tracker should become a simple visible control surface for each active draft.

Recommended visible fields:

- `draft_id`
- `stage`
- `current_message`
- `files_count`
- `released_chunks_count`
- `company_status`
- `opportunity_status`
- `contacts_status`
- `verification_status`
- `next_action`
- `resume_available`

Recommended stage values:

- `Dropped`
- `Extracting`
- `Matching`
- `Quick Review Needed`
- `Ready for Review`
- `Waiting on Link`
- `Ready to Create`
- `Completed`
- `Failed`

## Resume Rule

Every artifact or draft that is not `Completed` should have an easy visible way back into the processing window.

That means:

- `Draft Files` should keep a resume action
- artifact cards should keep a resume action when intake is unfinished
- table rows should get the same resume affordance
- the system should reopen the real matching draft before it creates any new fallback draft

## Short-Term Goal

The short-term goal is not advanced automation.
It is dependable continuity.

The user should be able to say:

- "I dropped the files"
- "the process paused"
- "I can see what was extracted"
- "I can resume exactly where I left off"

without losing confidence or context

## Out of Scope For This Pass

This spec does not require changing the database schema.

This pass should stay focused on:

- frontend orchestration
- intake state modeling
- staged review behavior
- reduced redundant extraction
