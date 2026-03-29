# Agent Operating System Spec

## Purpose

Define a clear agent hierarchy for the app so agents can act as named operating roles instead of a loose collection of prompts.

This gives us:

- a canonical language for `Owner`, `Avatar`, and `Agents`
- a clean hierarchy for future workflow orchestration
- a card model the UI can show consistently
- a bridge between workspace structure, artifact intake, and agent responsibilities

## Core Idea

The app should treat agents as a structured operating system with different levels of scope.

- `Level 0`
  The top coordination layer for the node.
- `Level 1`
  Domain stewards responsible for major workspace sections.
- `Level 2`
  Process stewards responsible for subsection workflows and quality control.
- `Level 3`
  Leaf stewards responsible for narrow records, files, tasks, or single operational actions.

## Canonical Naming

- `Owner`
  The app user or `Node_OWNER`
- `Golden Agent`
  The Level 0 agent counterpart to the Owner
- `Agents`
  The family of role-based operating agents inside the node

## Hierarchy

### Level 0

- `Golden Agent`
  Scope: whole node
  Mission: coordinate priorities, delegate work, maintain coherence across the workspace

### Level 1

Domain stewards for top-level workspace sections.

- `Users Steward`
- `Contacts Steward`
- `Companies Steward`
- `Opportunities Steward`
- `Pipelines Steward`
- `Notes Steward`
- `Tasks Steward`
- `Artifacts Steward`
- `Agents Steward`

### Level 2

Process stewards nested within domains.

Examples:

- `Intake Steward`
- `Workbook Steward`
- `Databook Steward`
- `Quality Control Steward`
- `Permissions Steward`
- `Mirror Steward`

### Level 3

Leaf stewards for specific records or actions.

Examples:

- `Company Record Steward`
- `Pipeline Stage Steward`
- `Artifact Filing Steward`
- `Task Follow-Up Steward`
- `Note Structuring Steward`

## Card Model

Every agent should have a card, even if it starts as a blueprint before full automation exists.

Recommended card fields:

- `Agent Name`
- `Level`
- `Domain`
- `Parent Agent`
- `Mission`
- `Primary Responsibilities`
- `Managed Scope`
- `Status`
- `Linked Records / Files`
- `Child Agents`
- `Last Activity`
- `Next Action`

## Product Rules

- The `Golden Agent` is singular per node.
- Level 1 agents map to workspace sections.
- Level 2 agents map to repeatable processes inside a section.
- Level 3 agents map to leaf execution and upkeep.
- The UI should show agent hierarchy clearly before it shows complex automation.
- We should treat early agent cards as operating blueprints, not pretend they are already autonomous systems.

## Recommended Build Order

1. Show hierarchy cards in the `Agents` page.
2. Attach real assistant prompt records to matching cards where available.
3. Define which Level 1 agents exist for every workspace section.
4. Add Level 2 process agents for intake, workbook sync, databook quality, and permissions.
5. Add Level 3 leaf agents only after the higher layers feel stable.

## Immediate Next UX Step

The `Agents` page should show:

- one `Golden Agent` card
- grouped `Level 1`, `Level 2`, and `Level 3` cards
- clear visual distinction between:
  - `Live Config`
  - `Blueprint`

That gives the user a clear mental model now, while leaving room for deeper orchestration later.
