# Token

## Purpose

This document defines `Token` as the canonical leaf-structure layer inside each file.

`Token` exists so shared shells, translators, extraction flows, and file editing surfaces all read from one governed token contract instead of inventing local interpretations.

## Working Identity

The safe mental model is:

- `System Files` / file structure declares the file
- that file owns sections/views
- those sections/views own tokens
- those tokens are the canonical token layer the shell should render from

`Token` is therefore not just a visible label in the UI.

It is the approved token definition in the file structure contract.

## Token Contract

At minimum, each token should carry:

- `token key`
- `token label`
- `token type`
- `write target / aliases`
- `editability / visibility`
- `section ownership`
- `definition`
- `default verification state`

## Default Status Vocabulary

The approved default token/field status vocabulary is:

- `Pre-Selected`
  - color: grey
  - `CI = 75%`
  - system knows where the data came from
  - usually flows through governed `LDB` links or pre-existing local data paths

- `Suggested`
  - color: yellow
  - `CI = 50%`
  - system is proposing the value
  - usually comes from extraction or context-guided interpretation

- `Verified`
  - color: black
  - `CI = 100%`
  - user has confirmed that the value is correct

- `Input`
  - color: blue
  - `CI = n.a.`
  - user may type directly into the field

## Meaning Of Each Part

- `token key`
  - structural identity
  - should stay stable enough for shared shell and translator logic

- `token label`
  - human-facing name
  - should drive column titles and visible token naming

- `token type`
  - governs input and interaction behavior

- `write target / aliases`
  - governs where the value persists and how runtime field-name drift is handled explicitly

- `editability / visibility`
  - governs whether the token may be shown or edited in a given surface

- `section ownership`
  - states which file-owned section/view owns the token

- `definition`
  - states what the token means
  - should stay visible and editable
  - helps extraction guidance stay explicit
  - helps compare the token meaning against outside definitions or source-material definitions
  - allows the owner to adapt wording for special cases without losing the governed token layer

- `default verification state`
  - states the governed starting verification posture for that token
  - should come from the token/system definition rather than from page-local guesses
  - may later be changed by draft/edit activity
  - may later be confirmed or replaced by saved/runtime verification
  - should use the approved default status vocabulary unless an explicit exception is declared

## Working Rules

- token-backed rendering must come from the token contract
- if a visible label is wrong, fix `Token Label`
- if a visible meaning is wrong or incomplete, fix `Definition`
- if a field-state default is wrong, fix the token/system verification default
- do not patch token meaning locally in tables, cards, or dialogs
- do not let extraction logic invent token meaning outside the token contract when the file already owns that token

Verification-state rule:

1. token/system definition provides the default verification state
2. draft/edit activity may change it
3. saved/runtime verification may confirm or replace it
4. row surfaces should render from that governed state

Working interpretation:

- `Pre-Selected` and `Suggested` are system-origin states
- `Verified` is a human-confirmed state
- `Input` is the governed open-entry state

## Extraction Rule

`Definition` is especially important for extraction and translation work.

It helps the system know:

- what the token is for
- how a source field should be interpreted
- how to compare source language against governed file language
- when a source definition conflicts with the current local definition

Working interpretation:

- source documents may suggest meaning
- external sources may carry competing definitions
- user edits may refine the local working definition
- the governed token definition should remain the local point of reference

## Table Rule

For shared table surfaces:

- token-backed column titles come from `Token Label`
- token-backed behavior comes from `Token Type`
- token-backed persistence comes from `Write Target / Aliases`
- token meaning should be explainable through `Definition`

If a shared table needs a better column name, update the token contract instead of hardcoding the table.

## Related Docs

- `docs/000/a. DAMP.md`
- `docs/000/b. LAMP.md`
- `docs/000/c. System.md`
- `docs/000/d. File.md`
- `docs/000/f. Translator.md`
