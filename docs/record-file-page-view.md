# Record File Page View

## Core Idea

A `Databook Page View` is the detailed record view for a single row or record inside a file.

When the user clicks the eye icon from a file page, they open the full information workspace related to that specific record.

## System Model

- `File view`: the list page for a file
- `Record view`: the databook page for one individual record from that file

Pattern:

`File -> record list -> eye icon -> record-level Databook view`

## File To Record Mapping

- In the `Contacts` file, each record is a `Contact`
- In the `Companies` file, each record is a `Company`
- In the `Users` file, each record is a `User`
- In the `Artifacts` file, each record is an `Artifact`

## Product Description

The `Databook` is the record home view for an individual file record.

It opens the full structured information, relationships, notes, documents, and linked context for that specific record.

## Naming Guidance

- `Contacts Page` = file view
- `Contact Databook` = record view for one contact
- `Companies Page` = file view
- `Company Databook` = record view for one company
- `Users Page` = file view
- `User Databook` = record view for one user
- `Artifacts Page` = file view
- `Artifact Databook` = record view for one artifact

## Design Intent

Every databook landing or home page should share the same overall look and feel.

The shell, layout rhythm, action language, and visual hierarchy should feel consistent across record types, while the content inside the shared frame can be specialized for the specific record.
