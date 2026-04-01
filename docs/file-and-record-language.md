# File And Record Language

## Core Language

The product should use `File` and `Record` as the main information architecture terms.

- `File` = the collection view
- `Record` = one individual item inside that file

This is the default language we should use when talking about navigation, views, and structure.

## System Model

Pattern:

`File -> record list -> eye icon -> Record view`

When the user clicks the eye icon from a file, they open the detailed view for that specific record.

## File To Record Mapping

- In the `Contacts File`, each record is a `Contact Record`
- In the `Companies File`, each record is a `Company Record`
- In the `Users File`, each record is a `User Record`
- In the `Artifacts File`, each record is an `Artifact Record`

## Product Description

A `Record` is the detailed view for a single row or item inside a file.

It opens the full structured information, relationships, notes, documents, and linked context for that specific record.

## Record View Behavior

The eye icon opens the `Record View` for a specific record inside a file.

The `Record View` is the full information workspace for that one record. It is where the user reads, reviews, and works with the structured information tied to that item.

## Record View Section Bar

The section bar below the hero/dashboard is part of the `Record View` pattern.

It should follow these rules:

- `Metadata` is always the first section on the left.
- `KDB Relationships` is always the last section on the right.
- Any file-specific sections sit between `Metadata` and `KDB Relationships`.

`KDB Relationships` is treated differently from the other sections because opening it changes the interaction model of the page.

When the user opens `KDB Relationships`, the section supports its own relationship-oriented controls such as labels, filters, and grid or row view toggles.

This means `KDB Relationships` is not just another content tab. It is a special record section with a different browsing mode, so it should remain anchored on the far right.

## Naming Guidance

- `Contacts File` = collection view for contacts
- `Contact Record` = detailed view for one contact
- `Companies File` = collection view for companies
- `Company Record` = detailed view for one company
- `Users File` = collection view for users
- `User Record` = detailed view for one user
- `Artifacts File` = collection view for artifacts
- `Artifact Record` = detailed view for one artifact

## Design Intent

Every record landing or home view should share the same overall look and feel.

The shell, layout rhythm, action language, and visual hierarchy should feel consistent across record types, while the content inside the shared frame can be specialized for the specific record.

## Reserved Concept

`Databook` is not the main language for files and records right now.

We are reserving `Databook` as a separate concept to use later, when it has its own clearer product meaning.
