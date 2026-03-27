# Intake Orchestration Spec

## Goal

When an artifact is dropped, the app should move from "one long extraction that dumps values into a dialog" to a staged intake workflow that:

- identifies the most valuable metadata early,
- asks the user to confirm high-value items while extraction continues,
- compares extracted values against existing canonical records,
- keeps work in a draft state until the user confirms creation,
- reduces duplicate records and bad links.

This is a frontend-first product design and orchestration spec. It does not require database schema changes.

## Core Principle

The system should not wait for full document extraction before involving the user.

Instead:

- fast, high-confidence metadata should appear first,
- the user should be able to confirm or redirect those values quickly,
- deeper extraction and relationship matching should continue in the background,
- both processes should inform each other as soon as confidence becomes high enough.

## Intake Stages

Recommended intake flow:

1. `File registered`
2. `Fast metadata extraction`
3. `High-value early prompts`
4. `Deep extraction`
5. `Relationship matching`
6. `Draft review`
7. `Create canonical records`

Important behavior:

- `Deep extraction` and `Relationship matching` should run as interacting stages, not fully isolated stages.
- As soon as one stage has strong certainty, it should inform the other stage.
- Example:
  - if sponsor company becomes certain, relationship matching should immediately narrow likely rounds, funds, and contacts.
  - if a related round becomes certain, deep extraction should prioritize fields relevant to that round and linked company.

Operationally, this means stages 4 and 5 should overlap:

- `Deep extraction` enriches likely entities and candidate values.
- `Relationship matching` uses those values to narrow or confirm likely existing records.
- Confirmed matches should be fed back into extraction context while work is still in progress.

## High-Value Early Prompts

These prompts should appear as soon as the system has enough confidence to be useful, even if the rest of the document is still processing.

Priority prompt set:

- `Document Type`
- `Sponsor Company`
- `Related Fund`
- `Related Rounds`
- `Related Contacts`
- `Website`

Why these first:

- they have high downstream value for matching,
- they reduce duplicate record creation,
- they give the user a clear focus while longer extraction continues,
- they allow relationship inference to improve before full extraction finishes.

## Early Prompt UX

Recommended prompt pattern:

- small dialog card or side-sheet prompt,
- one high-value decision at a time,
- can be confirmed, edited, skipped, or deferred,
- processing of the rest of the file continues in the background.

Examples:

- "We think this document type is `Pitch Deck`. Confirm?"
- "We found a likely sponsor company: `Tanatuco`. Confirm or change?"
- "Possible related round found: `Series A`. Link it?"
- "Possible related contact found from signature block. Confirm?"

Prompt actions:

- `Confirm`
- `Edit`
- `Skip for now`
- `Open Draft Review`

## Parallel Intake Lanes

Conceptually, intake should be split into small parallel lanes:

- `Document lane`
  - classify document type, title, format, artifact hints
- `Company lane`
  - extract sponsor company and company metadata
- `Opportunity lane`
  - extract related round/fund clues and investment context
- `Contact lane`
  - extract names, signatures, emails, phones, LinkedIn clues
- `Relationship lane`
  - infer likely links between extracted entities and existing records

These are "parallel agents" in product behavior, but implementation should start with controlled orchestration, not expensive free-form autonomous behavior.

## Interaction Between Deep Extraction and Relationship Matching

This is a required behavior, not a nice-to-have.

Rules:

- if `Company lane` confirms a sponsor company, `Opportunity lane` should prefer rounds/funds already linked to that company.
- if `Contact lane` confirms a contact with a strong email or LinkedIn match, `Relationship lane` should prioritize opportunities and companies already connected to that contact.
- if `Document lane` confirms a document type, downstream extraction should prioritize type-relevant metadata.
- if `Relationship lane` confirms a likely existing round or fund, deep extraction should re-rank nearby fields and names against that record.

In plain language:

- the lanes should not wait silently for each other,
- certainty in one lane should change how the others behave immediately.

## Draft-First Workflow

Dropped files should become drafts before they become canonical records.

Suggested draft states:

- `Dropped`
- `Quick Review Needed`
- `Extracting`
- `Matching`
- `Ready for Review`
- `Confirmed`
- `Created`

Draft items should remain visible until the user either:

- completes creation,
- discards the draft,
- or explicitly marks it for later review.

## Draft Files UI

Add a `Draft Files` area for incomplete or in-progress intake items.

Each draft row/card should show:

- file name,
- current intake status,
- likely document type,
- likely sponsor company,
- likely related opportunity,
- confidence level,
- unresolved questions,
- last user action.

Recommended draft actions:

- `Resume Review`
- `Confirm High-Value Fields`
- `Open Full Dialog`
- `Discard Draft`

## AI Input, Human Input, Existing Record

Each major dialog card triggered by widget intake should eventually support three distinct input sources:

- `AI Input`
- `Human Input`
- `Existing Record`

Behavior:

- `AI Input` shows extracted values from the intake pipeline.
- `Human Input` stores the user-edited version for that draft.
- `Existing Record` shows the best matched canonical record when one exists.

The user should be able to:

- switch between sources,
- compare values,
- keep human changes without losing AI suggestions,
- and decide which source wins before clicking `Create`.

## Golden Metadata Sets

The first extraction pass should focus on the smallest set of fields that most improves matching and canonical linking.

### Companies

High-priority metadata:

- `Company_Name`
- `Website`
- `LinkedIn`
- `One_Liner`
- `Company_Type`
- `Headquarters_City`

Secondary comparison metadata:

- founders / team names
- status
- date of incorporation
- annotations / updates

### Contacts

High-priority metadata:

- `Name`
- `Professional_Email`
- `Personal_Email`
- `Phone`
- `LinkedIn`

Secondary comparison metadata:

- country / location
- role inferred from document context
- signature block variations

### Rounds

High-priority metadata:

- `Round_Name`
- `Round_Stage`
- `Sponsor Company`
- `Type_of_Security`
- `Investment_Ask`
- `Final_Close_Date`

Secondary comparison metadata:

- committed amounts
- valuation fields
- raising status

### Funds

High-priority metadata:

- `Fund_Name`
- `Sponsor Company` / manager
- `Investment_Ask`
- `Final_Close_Date`
- `Raising_Status`

Secondary comparison metadata:

- committed amounts
- fund type clues
- investment strategy clues

### Artifacts

High-priority metadata:

- `title`
- `document_type`
- `artifact_format`
- `sponsor company`
- `related opportunity`

Secondary comparison metadata:

- file category
- extraction source
- tags / regions / industries

### Projects

High-priority metadata:

- `Project_Name`
- `Project Owner`
- related opportunity links
- related company links

### Tasks

High-priority metadata:

- `Task_Name`
- `Task Owner`
- related company links
- related opportunity links
- related project links

### Notes

High-priority metadata:

- `Note_Name`
- `Note_Content`

Important current limitation:

- notes are metadata-only in the current schema and should not pretend to persist first-level relationship links until that capability actually exists in the product and storage layer.

## Matching Strategy

Matching should happen in passes.

### Pass 1: Exact / strong identifiers

- exact company name
- normalized website domain
- exact email
- exact LinkedIn URL
- exact opportunity name

### Pass 2: Strong contextual combinations

- company name + tagline
- company name + round stage
- contact name + email domain
- company name + website + location

### Pass 3: Soft comparison

- approximate name similarity
- signature block clues
- title plus document type plus known linked entities

## Confidence Rules

Use three buckets:

- `High confidence`
  - can trigger early prompt or preselect a likely match
- `Medium confidence`
  - should appear as suggestion, not assumed truth
- `Low confidence`
  - should stay in draft details only

High confidence should never silently create canonical records without user review.

## Recommended Execution Order

Implementation order:

1. Define intake orchestration state and draft model in frontend
2. Implement high-value early prompt flow
3. Implement golden metadata extraction and first-pass matching
4. Implement interactive deep extraction + relationship matching behavior
5. Add `AI Input` / `Human Input` / `Existing Record` switching to widget-driven dialogs
6. Continue dialog-by-dialog review on top of the improved intake layer

## Immediate Product Recommendation

Before continuing broad dialog review, the next best product work is:

1. create the draft intake experience,
2. surface early confirmation dialogs for the high-value fields listed above,
3. make deep extraction and relationship matching actively inform each other,
4. then resume reviewing widget-triggered dialogs with better draft data feeding them.
