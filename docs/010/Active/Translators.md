# Translators

## Purpose

This document explains the role of `Translators` in the system.

`Translators` are important shared system assets that help move canonical input into approved shared output without letting local interpretation drift take over.

They are not just utilities.

They are part of the governed architecture.

## Core Definition

A `Translator` receives contextualized canonical input, classifies it under approved rules, produces a normalized feed, and exposes its reasoning clearly enough for bugs to be localized.

In simple form:

- input comes in through canon and approved context
- the translator classifies and filters it
- the translator produces normalized output
- shared builders and renderers use that output

## Why Translators Matter

Without a translator layer, each page, shell, or component starts shaping shared behavior locally.

That leads to:

- drift
- duplicated logic
- hidden interpretation layers
- harder debugging
- surfaces that only look shared while behaving differently underneath

Translators help prevent that by giving the system one governed place for shared interpretation.

## Core Chain

The intended chain is:

1. shells or source layers provide canonical input
2. translators classify and filter that input
3. builders normalize translator output into shared renderable items
4. shared renderers display the result

This means:

- shells should not locally shape shared output
- translators should own the shared interpretation step
- renderers should stay simple

## Translator Responsibilities

A translator should help:

- receive canonical input
- receive enough context to understand what the input is for
- classify and filter under approved rules
- produce normalized output for shared builders
- reduce local drift in shared surfaces

Examples of translator responsibilities:

- deciding which sections are structural
- deciding which items belong on the left or right
- deciding how canonical sections become shared toolbar traffic
- preparing shared normalized feed structures for builders

## Strict Feeder Relationship

Translators are closely related to the `Strict Feeder Chain`.

The `Strict Feeder Chain` says:

- shells provide canonical section data
- one shared feeder classifies and filters that data
- one shared builder turns it into normalized items
- one shared renderer displays the result

In practice, an important feeder is a translator.

That means:

- feeder logic should not stay scattered across page-local code
- translator logic should become a governed shared path

## Two-Layer Asset Relationship

Important translators should follow the `Two-Layer Asset Rule`.

That means they may need:

- a runtime utility layer
- a BB or system-facing layer

This matters because an important translator should not remain invisible if it becomes central to shared behavior, debugging, and governance.

The runtime layer does the logic.

The BB or system-facing layer helps us:

- call it by name
- inspect it
- govern it
- understand where it sits in the system

## Inspectable Translator Rule

Important translators should follow the `Inspectable Translator Rule`.

That means they should expose enough structure to localize mistakes through this ladder:

1. canonical input
2. receiving or contextualization
3. translator logic
4. builder output
5. renderer

If a translator cannot support that ladder, it is not inspectable enough yet.

## Translator Surface Rule

While a translator is still being tested and converged:

- its inspection surface should stay simple
- its rendered output should not become overly decorative
- the goal is to let mistakes surface naturally

This is especially important for dashboards or BB inspection surfaces built around translators.

## Steward Split

`Architect Steward`

- owns the pattern
- owns stop conditions
- owns whether the translator chain is coherent

`File Steward`

- owns canonical section meaning
- owns whether the translator received correct file/context input

`Intake Steward`

- owns contextualized handoff when source material or extraction enters the system

`Design Steward`

- owns clarity of the translator inspection surface
- does not own translator truth itself

## Current Working Example

`Shell Toolbar Feeder` is an active translator candidate.

Its current role is:

- receive canonical section data
- classify and filter that data
- prepare a normalized toolbar feed
- hand that feed to the shared toolbar builder

This makes it a useful first example of translator architecture.

## Working Rule

When a shared behavior starts appearing in many places, ask:

1. Is this just a local helper?
2. Or is it really a translator?
3. If it is a translator, should it move into one governed shared path?
4. Does it need a BB/system-facing layer too?

## Related Docs

Stay aligned with:

- `docs/010/Active/Recipe.md`
- `docs/010/Active/DAMP.md`
- `docs/010/Active/LAMP.md`
- `docs/999/Active/Intake_Governance.md`
- `docs/999/Active/Intake_Rulings.md`
- `docs/999/Active/Translators_Draft.md`
- `docs/999/Active/Recipe.md`
- `docs/002/Active/002-Companion_Manual.md`
