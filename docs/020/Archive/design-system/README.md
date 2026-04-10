# EC VC Design System Guide

This document is the designer-friendly version of the design system work.

It is not a redesign.

It is a guide to the visual system that already exists in the product today.

This guide is archived reference material.

The old audit artifact lives at:

- `docs/020/Archive/design-system/tokens.json`

The active runtime token alias layer lives at:

- `src/css/tokens.scss`

This file explains what those mean in normal design language.

## What This Is

The current design system is an extracted system, not an invented one.

That means:

- We looked at the real product UI
- We identified the values and patterns that repeat
- We gave those repeated decisions names
- We did not intentionally change the look and feel

So when you read "token", think:

"A named version of something we already use a lot."

Examples:

- `16px` spacing becomes a named spacing value
- the recurring white card with soft border becomes a named surface pattern
- the repeated button styles become named button variants

## What You Should Care About As A Designer

You do not need to memorize CSS variables.

What matters is understanding the visual language:

- which fonts are used for display vs body
- which spacing sizes repeat
- which card styles repeat
- which button variants exist
- which colors are core vs one-off

If you know that, you already understand the design system at a practical level.

## Core Visual Language

### Typography

The app uses two main families:

- Display: `Neue Machina`
- Body: `Sequel Sans`

General pattern:

- Big page titles and high-impact numbers use `Neue Machina`
- Almost everything else uses `Sequel Sans`

Most common text sizes in actual usage:

- `12px` / `0.75rem`: labels, micro text, metadata
- `14px` / `0.88rem`: secondary UI text, table text, helper text
- `16px` / `1rem`: main body text
- `36px` / `2.25rem`: large page titles

Most common line heights:

- `16px`: micro text
- `20px`: compact readable text
- `24px`: main body copy
- `40px`: large page titles

### Spacing

The system is already centered around a small set of spacing values:

- `4`
- `6`
- `8`
- `10`
- `12`
- `14`
- `16`
- `18`
- `20`
- `24`
- `32`

Practical reading:

- `8` and `12` are common for tight UI groupings
- `16` and `20` are common for card interiors
- `24` and `32` are common for bigger page sections

### Radius

Most common corner shapes:

- `8px`: controls and smaller UI
- `12px`: page shells
- `16px`: panels and inner cards
- `18px`: dashboard/stat cards
- `20px`: larger content cards
- `24px`: hero surfaces
- `999px`: pills

### Color

The product is mostly a neutral system with bold accent moments.

Core brand accents already in use:

- Orange: `#ff5521`
- Blue: `#2647ff`
- Yellow: `#ebff5a`
- Black / dark brand base: `#1d1d1b`

Common text colors:

- Primary text: near-black
- Muted labels: medium gray
- Secondary descriptive text: warm gray

Common surface colors:

- White cards
- Soft gray headers / table rows
- Translucent white overlays
- Dark drawer / dark summary areas

## Shared Component Patterns

### Buttons

There are already real button variants in the product:

- Primary
- Neutral
- Subtle
- Danger primary
- Danger subtle
- Icon button versions of the same idea

Shared behavior already exists for:

- default
- hover
- disabled

Meaning for design:

If you are designing something new, prefer using one of those button families instead of inventing a new one.

### Entity Page Shell

The pages for:

- Companies
- Contacts
- Opportunities
- Pipelines

all share the same general structure:

1. Page title
2. Large shell container
3. Hero area
4. Dashboard stats
5. Toolbar controls
6. Table or card list

This is one of the strongest existing system patterns in the product.

### Record View

The `Record View` has more personality and more custom detail than the file pages, but it still has reusable structure:

- record heading
- white content cards
- inner field cards
- summary panels
- metadata labels
- body copy blocks

The more expressive parts of the `Record View` hero were intentionally left more custom.

That is good.

Not everything should be flattened into generic system components.

## What We Already Normalized In Code

The codebase now has a runtime alias layer in:

- `src/css/tokens.scss`

That file gives names to repeated decisions without changing the look.

At the time this guide was written, the design system existed in two forms:

1. Audit form
   - `docs/020/Archive/design-system/tokens.json`
2. Runtime form
   - `src/css/tokens.scss`

You can think of this as:

- `tokens.json` explains what exists
- `tokens.scss` makes the app use shared names internally

## How To Work With This As A Designer

You do not need to stop working and build a perfect design system first.

The safest workflow is:

1. Keep designing product features normally
2. Reuse existing patterns when they already solve the problem
3. Only introduce a new pattern when the current system truly does not cover the need
4. When a new pattern repeats enough, we formalize it

So the design system grows out of the product.

It does not need to be finished before you keep moving.

## Simple Rules For New UI

When designing something new, try to stay inside these boundaries first:

- Use `Neue Machina` for display moments, not for everything
- Use `Sequel Sans` for normal UI and readable content
- Prefer the existing spacing set instead of arbitrary values
- Prefer the existing card radii before inventing new ones
- Prefer existing button families
- Prefer white/neutral surfaces unless the screen truly needs a custom mood

If you break one of those rules, that is not automatically wrong.

It just means it might be a new system decision and should be treated more deliberately.

## What To Export To Figma Later

Later, when you want to organize this in Figma, the best order is:

1. Type styles
2. Color styles or variables
3. Spacing scale reference
4. Radius scale reference
5. Button components
6. Card/surface components
7. Page shell templates

Do not start by trying to mirror every screen 1:1.

Start with the repeatable pieces.

## Recommended Figma Structure Later

When you are ready, a sensible Figma organization would be:

- Foundations / Type
- Foundations / Color
- Foundations / Spacing
- Foundations / Radius
- Components / Buttons
- Components / Inputs
- Components / Cards
- Patterns / Entity Page Shell
- Patterns / Record View

That structure would map well to the work we have already done in code.

## What You Do Not Need To Worry About Right Now

You do not need to:

- export assets yet
- rebuild the whole UI in Figma
- translate every CSS variable manually
- redesign the system before continuing product work

Right now the important thing is that the product has a clearer shared language.

That makes later export and documentation possible.

## If You Want To Ask Good Design-System Questions Later

These are useful questions to ask next:

- Is this a one-off visual idea or a reusable pattern?
- Does this belong in foundations, components, or patterns?
- Are we naming something that already repeats?
- If I move this to Figma, is it a token, a component, or a page pattern?

## Short Version

Your design system now exists.

Not as a polished Figma library yet, but as:

- a documented audit
- a runtime token layer
- shared component patterns already being normalized safely

That is the correct foundation.
