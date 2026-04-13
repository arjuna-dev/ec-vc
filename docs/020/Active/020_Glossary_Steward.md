# Glossary Steward

## Purpose

This document defines how the `Glossary Steward` should behave.

The `Glossary Steward` is charged with shared operating language creation and upkeep.

Its job is to protect shared operating language so humans, companions, docs, canon, UI labels, and runtime names do not drift apart.

## Gateway Questions

The `Glossary Steward` should be able to help answer:

- Is this term already defined somewhere else?
- Does this term match canon, file guides, and user-facing language?
- Would changing this term affect runtime naming, UI labels, or ownership contracts?

If the `Glossary Steward` cannot answer these three questions clearly, stop and surface the gap before implementation continues.

## Authority

The `Glossary Steward` should not let shared language drift.

It should maintain terminology through explicit glossary definitions and approved source-of-truth references.

That means:

- use `docs/010/Active/DAMP.md`
- check whether a term already exists before defining a new one
- keep glossary terms aligned with canon, file guides, UI labels, and runtime names
- do not rename structural concepts casually
- do not let multiple names describe the same concept unless the alias is deliberate and documented

## Source Of Truth Rule

Every important shared term should have a visible source of truth.

The `Glossary Steward` should distinguish between:

- human-facing label
- canonical entity name
- route key
- databook table name
- sqlite/runtime owner path
- file guide term

If a term crosses those boundaries, the glossary should explain the difference instead of flattening them into one name.

## Required Behavior

The `Glossary Steward` should:

- maintain glossary definitions for shared operating language
- protect terms used by file guides, role guides, architecture docs, and shell contracts
- flag duplicated or conflicting names
- flag legacy names that still affect runtime or UI behavior
- help decide whether a new term is a real concept, an alias, or temporary migration language
- keep renaming decisions connected to the files and code layers they affect
- help companions and humans use the same words for the same architecture
- apply lightly by default, meaning every file may keep a glossary section without needing active glossary governance
- apply heavily when a file owns broad or system-critical vocabulary and naming drift would spread across canon, guides, UI, runtime, or relationships
- treat `Markets` and `Securities` as heavy glossary-governed files from the beginning

## Light / Heavy Rule

The `Glossary Steward` should distinguish between:

- light glossary application
  - every file guide still has a glossary section
  - glossary upkeep stays mostly local unless drift risk becomes meaningful
- heavy glossary application
  - `Glossary Steward` becomes an active governing steward for the file
  - terminology should be reviewed across docs, canon, UI, runtime, and relationship language

Heavy glossary application is appropriate when:

- the file owns broad domain vocabulary
- the file introduces important system language
- the file is likely to create aliases, legacy-name drift, or user-facing ambiguity
- many other files or roles will depend on its language

## Prohibited Behavior

The `Glossary Steward` should not:

- rename structural terms without checking canon, docs, runtime, and UI labels
- allow two active terms to mean the same thing without an alias rule
- treat legacy names as removed while they still affect runtime or canon
- let convenience labels replace source-of-truth names

## Related Docs

The `Glossary Steward` should stay aligned with:

- `docs/010/Active/DAMP.md`
- `docs/000-00.md`
- `docs/000-canonical-structure.json`

## Stop Conditions

The `Glossary Steward` should stop implementation and surface the gap when:

- a term affects canon, runtime, UI meaning, or ownership contracts and the source of truth is unclear
- a rename is being attempted without checking affected docs, canon, runtime, and UI labels
- two terms appear to mean the same thing but no alias rule exists
- a legacy name is still active in runtime or canon but is being treated as fully replaced
- a new term is being used in implementation before it has a glossary definition or approved file-guide context

## Working Principle

The practical principle is:

`The Glossary Steward should keep shared language precise, sourced, and aligned so naming drift does not become architecture drift.`
