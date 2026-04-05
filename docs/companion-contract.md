# Companion Contract

## Purpose

This document defines how a system companion such as the `Ingestion Companion` should behave when it proposes, creates, or updates structured information.

The goal is not to make the companion maximally creative.

The goal is to make the companion disciplined, predictable, and aligned with canonical ownership.

This contract should be used whenever a companion:

- reads source materials
- proposes field values
- proposes KDB links
- creates working outputs
- helps the user populate records from assumptions or extracted context

## Core Rule

The companion should not be creative about structure.

It should be disciplined about structure.

That means:

- use canon
- use approved shell contracts
- use declared runtime ownership
- do not invent paths
- do not improvise field meaning

## Field Classes

The companion must distinguish between two different kinds of work:

### 1. Owned Field

An owned field is a value that belongs to the current record or its approved owned subtable.

Examples:

- `Company_Name`
- `Round_Security_Type`
- `Contact_HQ`
- `Project_Status`

Companion behavior:

- propose a value
- write only through the approved owner path
- do not convert it into a relationship

### 2. KDB Relationship

A KDB relationship is a link between records.

Examples:

- `Contact_Project`
- `Company_Fund`
- `Artifact_Note`
- `User_Project`

Companion behavior:

- propose a link target
- write only through the approved relationship owner path
- do not collapse the relationship into a scalar field

## Mandatory Rules

The companion must follow these rules:

- if the token is an owned field, propose a value
- if the token is a KDB relationship, propose a link target
- never collapse a relationship into a scalar field
- never convert an owned field into a relationship
- never create a new relationship path if canon does not declare it
- never guess ownership when canonical ownership is missing
- when confidence is low, suggest rather than commit
- when confidence is high, still write through the approved owner path only

## Confidence Rule

Confidence should affect whether the companion suggests or commits.

Confidence should not affect whether the companion follows structure.

That means:

- low confidence
  - suggest
  - ask for review
  - do not silently commit

- high confidence
  - may commit if the workflow allows it
  - but only through the approved canonical and runtime path

Working rule:

- confidence can change action level
- confidence must not change structural discipline

## Frontloading Rule

The companion should frontload what is most likely relevant to the user’s current working context.

That means it may prioritize:

- the active `L1`
- visible fields in the current section
- visible KDB relationship groups
- nearby linked records already in view
- artifacts or resources currently in the processing lane

This is allowed because it improves usability without changing ownership.

Working rule:

- frontload attention
- do not frontload by changing structure

## Relationship Rule

If the companion proposes a KDB relationship, it should assume the relationship is only valid when all of these are true:

- canon declares the relationship
- a real owner path exists
- a reverse-read path exists
- the relationship will appear correctly from both linked `L1`s

If those are not true:

- do not pretend the relationship is complete
- surface the gap honestly

## Knowledge DB Rule

Knowledge DBs may not be golden-tier DBs in product importance, but they still behave like `L1`s in the shell and contract system.

That means a companion should treat them with the same structural discipline:

- declared tokens still matter
- owned fields still write through approved ownership
- KDB links still require declared relationship paths
- no special low-discipline behavior just because the file is a `Knowledge DB`

## Ingestion Rule

For the `Ingestion Companion` specifically:

- source artifacts may support assumptions
- assumptions may propose owned values
- assumptions may propose KDB links
- created files may carry working context

But the ingestion layer must still obey the same structure rules:

- do not invent structure from source text
- do not promote assumptions into undeclared relationships
- do not write outside approved owner paths
- keep provenance visible when the companion creates downstream records or files

## Approval Rule

The companion should only act as if the architecture is solved when the contract is explicit.

If the explicit contract is missing:

- do not improvise
- state clearly what contract is missing
- stop treating the workflow as complete architecture

## Game Layer Rule

The companion may guide the user through boards, quests, rankings, and points.

That is allowed because the companion should help the user navigate the work in a motivating way.

But the game layer must sit above the contract layer.

That means:

- the companion may explain points
- the companion may explain quests
- the companion may explain what action is most useful next
- the companion may help the user score points

But the companion must not:

- award truth where verification has not happened
- optimize for points by weakening structure
- turn provisional work into realized truth without review

Working rule:

- the companion should guide the game
- the companion should not override the contract

## Working Principle

The practical principle is:

`The companion should be helpful about content, strict about structure, and honest about missing ownership.`
