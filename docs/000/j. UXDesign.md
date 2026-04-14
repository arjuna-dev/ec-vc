# UXDesign

## Purpose

This document defines how `UXDesign` should behave as the combined top-layer architecture guide for user experience and design-system clarity.

`UXDesign` is charged with making structural choices understandable to the user and keeping shared UI structure disciplined.

Its job is to translate architecture decisions into clear user-facing forks, questions, labels, and flows.

`UXDesign` should protect the app from asking users architecture questions in a confusing or overly technical way.

## Gateway Questions

`UXDesign` should be able to help answer:

- Can the user make the right structural choice without needing architecture vocabulary?
- Are the relevant forks shown at the moment the user needs to decide?
- Does each user-facing choice create a clear canonical result underneath?

If `UXDesign` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

`UXDesign` should not hide important structural choices.

It should surface the decision at the moment when the user has enough context to answer.

That means:

- show the user the relevant fork
- explain the consequence in plain language
- prefer guided questions over raw architecture labels

## Surface Names

The current shared surface names should be:

- `Row Surface`
- `Card Surface`

Working interpretation:

- `Row Surface` is the default row/data reading mode under an active file path or dialog path
- `Card Surface` is the card-based reading mode for the same governed data

These should be treated as shared surface names, not one-off labels inside individual pages.

## Data Surface Contract

`UXDesign` should treat `Data Surface Contract` as the top-level UX rule for shared row/data reading surfaces.

That contract should help make shared row/data surfaces feel:

- clean
- readable the same way everywhere
- multi-functional without looking crowded
- strict enough that bugs are visible instead of hidden by surface variation

### Row Surface Rules

Current working `Row Surface` rules:

- row surfaces should begin with two fixed control columns on the left:
  - `Select`
  - `View`
- a separate `Edit` control column is not required when editable cells are already clearly marked and support the approved double-click edit path
- token-backed data columns should follow file structure and token contracts
- row surfaces should not stretch artificially to fill the full window width
- if content exceeds height or width, the approved sleek dark scrollbars should appear
- column width should be resizable by dragging the divider
- double-clicking the divider should contract the column to hug
- width initialization should begin from the input-box minimum or visible content width
- long-text columns should be the special case that may initialize wider and keep a max-width rule

### Row Surface Reading Rules

Cell reading grammar should stay stable:

- all ordinary cell text should use the shared body/xs/light reading style
- editable input cells should read blue
- linked or other-page data should read green
- suggested data should read yellow
- pre-selected data should read light grey
- verified data should read black

These color rules should remain governed and legible.

They should not be treated as ad hoc decoration.
- keep the canonical result explicit underneath the UI
- do not let a visual shortcut bypass file birth rules

## File Birth UX Fork

When the user is creating or changing file structure, the first fork should ask:

`Is this a new file the user should be able to find, govern, and open?`

If yes:

- create as `File`
- require a `System Files` registry row
- require a file guide
- require the approved birth-chain checks

If no, ask:

`Does this belong as a major section inside an existing file?`

If yes:

- create as `View`
- attach it to the selected parent file
- describe its purpose in that file guide

If no, ask:

`Is this a view inside an existing section?`

If yes:

- create it as a view tied to the selected parent view
- preserve its parent path clearly

## Default Decision

When uncertain, begin as a `File`.

Demote to `View` only when the concept is clearly a section inside an already-existing file.

This protects the user mental model:

- a file is something they can find, open, govern, and understand independently
- a section is part of a file
- a subsection is part of a section

## File Specific Rule

`File Specific` is not a replacement for real named views.

`File Specific` is the governance area where the file records its unique structure metadata.

Actual user-facing file structure should still be expressed through explicit views when the file needs them.

## UX Parameters For Each File Guide

Each file guide should include UX parameters that help the user and the File Steward answer:

- what is the first user-facing choice in this file
- where should the user select between relevant forks
- what choices should be shown as plain-language labels
- what canonical value each choice creates underneath
- which choice is the safe default
- what should happen when the user is unsure
- what stop condition should prevent the user from continuing

## Required Behavior

`UXDesign` should:

- define the user-facing questions for file birth
- define where fork decisions appear in the flow
- make `File` and `View` choices understandable without requiring architecture knowledge
- protect the UI from hiding canonical consequences
- help the File Steward guide the user through file creation
- keep labels clear, compact, and aligned with canon
- make sure user-facing wording matches the real behavior and source-of-truth ownership underneath
- flag when a screen lets the user create structure without showing the relevant fork

## Prohibited Behavior

`UXDesign` should not:

- ask users to choose architecture vocabulary without plain-language support
- hide structural consequences behind vague labels
- allow `View` creation without parent selection
- make the user guess whether something is a file, section, or subsection
- let a visual shortcut bypass the file birth chain

## Related Docs

`UXDesign` should stay aligned with:

- `docs/000/a. DAMP.md`
- `docs/000/d. File.md`
- `docs/000/c. System.md`

## Stop Conditions

`UXDesign` should stop implementation and surface the gap when:

- a user can create a file, section, or subsection without choosing its structural level
- a fork is hidden behind a vague field
- a user-facing choice creates an unclear canonical value
- a `View` is being created without a selected parent
- the UI asks the user for architecture vocabulary without a plain-language explanation
- a page, shell, or dialog uses wording that implies a meaning or action the system does not actually support

## Meaning Drift Rule

`UXDesign` should watch for:

- language drift
  - the user sees labels or statuses that do not match canon or file-guide meaning
- behavior drift
  - the UI suggests a result, action, or state that runtime does not actually produce
- ownership drift
  - the UI makes it look like the current surface owns the truth when the real source lives elsewhere

`UXDesign` should help rewrite and restructure the flow so the user's reading of the interface matches the real system contract.

## Working Principle

`UXDesign should make structural decisions visible, understandable, and canon-aligned so the user can create files without accidentally creating drift.`

