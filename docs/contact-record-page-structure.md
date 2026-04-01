# Contact Record Page Structure

## Purpose

This document defines the base structure for a `Record` page, using the `Contact Record` as the reference model for the rest of the product.

Future record views such as `Company Record`, `User Record`, and `Artifact Record` should inherit the same overall shell, layout rhythm, and interaction logic, then specialize their internal sections as needed.

## Breadcrumb Title Rule

At the top of the record view, the breadcrumb title should read:

`[File Name in Singular] + Record`

Examples:

- `Contact Record`
- `Company Record`
- `User Record`
- `Artifact Record`

## Core Principle

A `Record` page is the detailed operating view for one specific item inside a file.

It should not feel like a generic profile page. It should feel like the home view for that record, where the user can understand the record quickly, review related context, and take action.

## Contact Record As The Base Model

The `Contact Record` should be treated as the foundation pattern for all record pages because it naturally includes:

- core identity
- relationship context
- company context
- notes
- documents
- linked activity
- actionability

That makes it a strong source model for designing the shared record shell.

## Shared Record Shell

Every record page should eventually share the same high-level structure:

1. Breadcrumb and page title
2. Record header or hero
3. Primary record summary
4. Structured record sections
5. Linked records, notes, and artifacts
6. Record actions and operator controls

## Contact Record Structure

### 1. Breadcrumb And Title

Top navigation should clearly show the user that they are inside a single record view.

Recommended pattern:

- parent path back to the file
- current page title as `Contact Record`

### 2. Record Header Or Hero

This is the landing area for the record and should quickly answer:

- who is this person
- what is their main role or title
- what company are they associated with
- what is their current relevance or status

Suggested hero contents:

- contact name
- current title
- primary company
- location
- primary relationship/status tags
- quick actions

### 3. Primary Summary Block

Immediately below the hero, the page should provide a concise operating summary of the record.

This block should help the user understand the contact at a glance before going deeper.

Suggested contents:

- relationship summary
- last meaningful interaction
- priority or importance level
- current owner or internal point person
- key notes or alerts

### 4. Structured Content Sections

The main body of the page should be divided into structured sections.

For the `Contact Record`, likely sections include:

- identity
- role and company context
- relationship context
- notes
- artifacts
- activity or timeline
- linked records

These sections should use a consistent visual system that can later be reused across all record types.

### 5. Notes And Artifacts

Notes and artifacts should be treated as core record content, not side details.

They should appear as first-class sections in the record, because they are part of the operational memory of that record.

### 6. Linked Context

The record should expose the related information connected to that contact.

Examples:

- linked company
- linked opportunities
- linked tasks
- linked projects
- linked notes
- linked artifacts

### 7. Record Actions

The record page should support clear actions relevant to the record.

Examples:

- edit record
- open linked company
- add note
- add artifact
- assign task
- share or export later if needed

## Design Rules To Reuse Across Other Records

When we later design the other record pages, they should inherit:

- the same breadcrumb logic
- the same hero structure pattern
- the same spacing rhythm
- the same panel hierarchy
- the same action language
- the same section ordering logic

The content can change, but the record shell should feel like one family.

## Translation To Other Record Types

This structure should later map like this:

- `Contact Record` = reference model
- `Company Record` = same shell, company-specific sections
- `User Record` = same shell, user-specific sections
- `Artifact Record` = same shell, artifact-specific sections

## Current Decision Logged

We are using `File` and `Record` as the main language for the product.

We are not using `Page` or `Databook` as the primary user-facing structure language at this stage.
