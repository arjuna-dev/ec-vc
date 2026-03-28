# Slide Intent Review Spec

## Goal

Artifact review should help users understand:

- which PDF slide or page a markdown block came from
- which metadata fields that slide is a good candidate for
- whether a suggestion is a strong match, a weak hint, or only a fallback
- why the app chose to use or ignore a given section during intake

This should improve the audit trail without pretending all decks follow the same structure.

## Core Rule

Slide intent is heuristic, not absolute.

The app should never assume that all decks use the same sequence of slides.
Instead, it should use slide titles, page text, repeated patterns, and document context as hints.

Examples of hint-like titles:

- `Disclosures`
- `Important Disclosures`
- `Executive Summary`
- `Team`
- `Terms`
- `Contact`

These titles should increase confidence for certain candidate metadata fields, but should not force a mapping by themselves.

## Safety Rule

Do not hard-code a universal deck template such as:

- slide 1 always means company
- slide 2 always means legal entity
- slide 3 always means overview

That may be common, but it is not safe enough to treat as a fixed rule.

Instead, the review system should combine:

- explicit slide/page numbers
- markdown headings
- visible slide titles
- repeated branding text
- known legal/disclosure phrases
- user-confirmed metadata already accepted elsewhere

## Recommended Review Model

For each slide or page, the review pane should be able to show:

- `Slide Number`
- `Slide Title`
- `Markdown Source`
- `Likely Slide Intent`
- `Candidate Metadata Fields`
- `Confidence`
- `Used / Not Used`
- `Target Item Box`

Example:

- `Slide 2`
- title: `Important Disclosures`
- likely intent: `Legal / Disclosure`
- candidate metadata:
  - `Legal Company Name`
  - `Asset Manager Name`
  - `Jurisdiction`
- confidence: `medium`
- target item box:
  - `Company section`

## Confidence Model

The system should treat slide intent as a confidence score, not a binary truth.

Suggested levels:

- `high`
  - explicit slide/page number plus a strong heading or phrase match
- `medium`
  - heading or phrase strongly suggests a slide role, but field ownership is still ambiguous
- `low`
  - only weak contextual hints exist
- `none`
  - no meaningful slide-intent hint is available

## Candidate Metadata Guidance

These are useful defaults, but still only hints:

### Title / Cover Slides

Likely clues:

- large title text
- document name
- company or fund brand name
- opportunity name

Candidate fields:

- `Artifact Title`
- `Company Display Name`
- `Fund Name`
- `Round Name`
- `Opportunity Name`

### Disclosure / Legal Slides

Likely clues:

- `Important Disclosures`
- `Disclosures`
- adviser / manager language
- jurisdiction language
- entity suffixes like `LLC`, `LP`, `Ltd`, `Inc`

Candidate fields:

- `Legal Company Name`
- `Asset Manager Legal Name`
- `Jurisdiction`

Important note:

- these slides may be better sources for legal entity metadata than the title slide

### Executive Summary / Overview Slides

Likely clues:

- `Executive Summary`
- `Overview`
- `At a Glance`

Candidate fields:

- `One Liner`
- `Company Summary`
- supporting confirmation for company or opportunity name

### Terms / Raise / Fund Details Slides

Likely clues:

- `Terms`
- `Offering`
- `Raise`
- `Fund Details`
- `Target`

Candidate fields:

- `Round Stage`
- `Target Raise`
- `Fund Target Size`
- `Close Date`

### Contact Slides

Likely clues:

- email addresses
- websites
- team contacts
- `Contact`

Candidate fields:

- `Website`
- `Related Contacts`
- `Professional Email`

## Mapping Rule For PDFs

For PDF review, the right-side review selector should be bounded by the real page count.

That means:

- one review slot per real page or slide
- no invented extra sections beyond the actual PDF page count
- markdown headings may help label a slide
- markdown headings should not create extra fake slides

If the markdown cannot yet be mapped cleanly to each slide:

- show the real slide list anyway
- mark uncertain mappings as `unmapped` or `provisional`
- let the review pane explain that the markdown link is only approximate

## Audit Trail Rule

When the app uses data from a slide, the user should be able to see:

- the source slide number
- the source heading or title
- the field that consumed it
- the target item box it writes into
- whether the user verified it

Example:

- `Source: Slide 2`
- `Heading: Important Disclosures`
- `Used for: Legal Company Name`
- `Writes into: Company section`
- `State: Verified`

## UI Guidance

The review pane should communicate clearly when a mapping is only a hint.

Good examples:

- `Likely disclosure slide`
- `Possible legal entity source`
- `Used as supporting company evidence`

Avoid wording that sounds more certain than the evidence:

- not `This is the legal entity slide`
- instead `Likely legal/disclosure slide`

## What This Spec Does Not Do

This spec does not define a universal deck format.

It does not say:

- every title slide means the same thing
- every disclosure slide should always populate the same field
- every markdown heading is trustworthy

It only defines how to treat slide titles and document structure as cautious review hints.

## Observed Patterns

Use this section as a running intake notebook.

The goal is to capture what we learned from real artifacts without accidentally promoting one example into a universal rule.

For each observed pattern, include:

- `Document Type`
- `Observed Slide`
- `Observed Title`
- `What It Helped Identify`
- `Confidence`
- `Why It Helped`
- `Counter-Risk`
- `Action`

Suggested confidence labels:

- `strong`
- `medium`
- `weak`
- `needs more examples`

Suggested action labels:

- `ui hint only`
- `candidate mapping`
- `safe prompt priority`
- `do not generalize yet`

### Pattern Template

```md
### Pattern: <short name>

- Document Type: <pitch deck / fund deck / memo / other>
- Observed Slide: <Slide 1 / Slide 2 / etc.>
- Observed Title: <title text or phrase>
- What It Helped Identify: <field or decision>
- Confidence: <strong / medium / weak / needs more examples>
- Why It Helped: <why this was useful>
- Counter-Risk: <how this could be wrong in other artifacts>
- Action: <ui hint only / candidate mapping / safe prompt priority / do not generalize yet>
```

### Example: Disclosure Slide Carries Legal Name

- Document Type: `fund deck`
- Observed Slide: `Slide 2`
- Observed Title: `Important Disclosures`
- What It Helped Identify: `Legal Company Name`
- Confidence: `medium`
- Why It Helped: disclosure text often contains the formal asset manager or adviser legal name
- Counter-Risk: some decks put only generic disclaimer text there and no useful entity metadata
- Action: `candidate mapping`

### Example: Title Slide Gives Display Name, Not Always Legal Name

- Document Type: `pitch deck`
- Observed Slide: `Slide 1`
- Observed Title: `cover / title page`
- What It Helped Identify: `Artifact Title`, `Company Display Name`, sometimes `Opportunity Name`
- Confidence: `medium`
- Why It Helped: title pages often carry the strongest visible brand and document title
- Counter-Risk: branded covers may omit the legal entity name entirely
- Action: `safe prompt priority`

## Suggested Next Steps

1. Show `Likely Slide Intent` and `Confidence` in the Artifact review sidebar
2. Distinguish `Display Name` vs `Legal Name` candidates in the sidebar
3. Mark slide mappings as `exact`, `provisional`, or `unmapped`
4. Show the target `item box` for used metadata claims
5. Let users compare the chosen field source against nearby slides when needed
