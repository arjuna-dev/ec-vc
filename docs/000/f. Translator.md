# Translator

## Purpose

This document explains the role of `Translator` in the system.

`Translator` is the important shared system layer that helps move canonical input into approved shared output without letting local interpretation drift take over.

They are not just utilities.

They are part of the governed architecture.

## Core Definition

A `Translator` receives contextualized canonical input, classifies it under approved rules, produces a normalized feed, and exposes its reasoning clearly enough for bugs to be localized.

In simple form:

- input comes in through canon and approved context
- the translator classifies and filters it
- the translator produces normalized output
- shared builders and renderers use that output

## Why Translator Matters

Without a translator layer, each page, shell, or component starts shaping shared behavior locally.

That leads to:

- drift
- duplicated logic
- hidden interpretation layers
- harder debugging
- surfaces that only look shared while behaving differently underneath

Translator logic helps prevent that by giving the system one governed place for shared interpretation.

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

## Data Surface Contract

`Data Surface Contract` should be treated as a translator-governed shared behavior.

It is not just table styling.

It is the governed interpretation layer that helps shared row/data surfaces read the same way across active paths.

This contract should govern:

- `File Shell` row/table surfaces
- row/data views inside edit shells
- future reusable row surfaces in other active paths

That means the user should feel:

- same reading grammar
- same controls
- same cell-state meaning
- same scrolling behavior
- same resize behavior

Working interpretation:

- canonical file structure and token contracts provide the input
- the shared data-surface contract governs how that input is rendered into a reusable row surface
- local shells should not invent their own row grammar when they are meant to share this surface logic

## Translator Data Contract

The shared renderer may stay the same, but translator paths still need their own explicit data contract.

That contract should carry the translator-specific provisions needed for that data set, such as:

- companion
- source id
- source type
- tokens
- token definitions
- provenance
- verification state
- pending action or handoff state

Working rule:

- the shared `Row Surface` reduces renderer mistakes
- the translator contract declares what the translator path is actually carrying
- translator surfaces should not rely on remembered page context or local guesses

## Shared Structure Rules

These translator rules work across shared structure work too:

- bootstrap shared views such as `System`, `General`, `LDB`, and `Other` should stay explicit
- translator logic should not silently rename or relocate protected shared tokens
- `Data.Status` should be read as the governed data-status token in `System`
- file-specific business or entity status should remain in `Other` or another file-owned view
- if the runtime surface and the stored file structure disagree, repair the stored file structure contract first instead of teaching the translator to compensate locally
- `Views` and `Tokens` structure surfaces should be treated as direct JSON-governance paths, not local interpretation layers

## Working Rule

When a shared behavior starts appearing in many places, ask:

1. Is this just a local helper?
2. Or is it really a translator?
3. If it is a translator, should it move into one governed shared path?
4. Does it need a BB/system-facing layer too?

## Related Docs

Stay aligned with:

- `docs/000/i. Recipe.md`
- `docs/000/a. DAMP.md`
- `docs/000/b. LAMP.md`
- `docs/000/g. Intake.md`
- `docs/002/a. Companion.md`
