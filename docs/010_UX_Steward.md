# UX Steward

## Purpose

This document defines how the `UX Steward` should behave.

The `UX Steward` is charged with making structural choices understandable to the user.

Its job is to translate architecture decisions into clear user-facing forks, questions, labels, and flows.

The `UX Steward` should protect the app from asking users architecture questions in a confusing or overly technical way.

The `UX Steward` should be able to help answer: `Can the user make the right structural choice without needing architecture vocabulary?`

## Core Rule

The `UX Steward` should not hide important structural choices.

It should surface the decision at the moment when the user has enough context to answer.

That means:

- show the user the relevant fork
- explain the consequence in plain language
- prefer guided questions over raw architecture labels
- keep the canonical result explicit underneath the UI
- do not let a visual shortcut bypass file birth rules

## File Birth UX Fork

When the user is creating or changing file structure, the first fork should ask:

`Is this a new file the user should be able to find, govern, and open?`

If yes:

- create as `L1`
- require a `System Files` registry row
- require a file guide
- require the approved birth-chain checks

If no, ask:

`Does this belong as a major section inside an existing file?`

If yes:

- create as `L2`
- attach it to the selected parent file
- describe its purpose in that file guide

If no, ask:

`Is this a subgroup inside an existing section?`

If yes:

- create as `L2.a`
- attach it to the selected parent `L2`
- preserve its parent path clearly

## Default Decision

When uncertain, begin as `L1`.

Demote to `L2` only when the concept is clearly a section inside an already-existing file.

Demote to `L2.a` only when the concept is clearly a subgroup inside an already-existing section.

This protects the user mental model:

- a file is something they can find, open, govern, and understand independently
- a section is part of a file
- a subsection is part of a section

## File Specific Rule

`File Specific` is not a replacement for real named `L2` sections.

`File Specific` is the governance area where the file records its unique structure metadata.

Actual user-facing file structure should still be expressed through explicit `L2` and `L2.a` sections when the file needs them.

## UX Parameters For Each File Guide

Each file guide should include UX parameters that help the user and the File Steward answer:

- what is the first user-facing choice in this file
- where should the user select between relevant forks
- what choices should be shown as plain-language labels
- what canonical value each choice creates underneath
- which choice is the safe default
- what should happen when the user is unsure
- what stop condition should prevent the user from continuing

## Responsibilities

The `UX Steward` should:

- define the user-facing questions for file birth
- define where fork decisions appear in the flow
- make `L1`, `L2`, and `L2.a` choices understandable without requiring architecture knowledge
- protect the UI from hiding canonical consequences
- help the File Steward guide the user through file creation
- keep labels clear, compact, and aligned with canon
- flag when a screen lets the user create structure without showing the relevant fork

## Stop Conditions

The `UX Steward` should stop implementation and surface the gap when:

- a user can create a file, section, or subsection without choosing its structural level
- a fork is hidden behind a vague field
- a user-facing choice creates an unclear canonical value
- an `L2` or `L2.a` is being created without a selected parent
- the UI asks the user for architecture vocabulary without a plain-language explanation

## Working Principle

`The UX Steward should make structural decisions visible, understandable, and canon-aligned so the user can create files without accidentally creating drift.`
