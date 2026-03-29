# Agent Runtime Framework Spec

## Goal

Design the agent system so it is:

- repeatable
- file-driven
- model-independent
- easy to run through commands or scripts
- not locked to one LLM vendor or API shape

## Core Principle

The app UI can present agents as cards and hierarchy, but the operating definition of an agent should live in portable files rather than in model-specific code.

That means:

- agent definitions should be stored as markdown and/or structured companion files
- runtime execution should be handled by scripts and adapters
- model choice should be swappable

## Recommended Structure

For each agent:

- `agent.md`
  Human-readable operating document
- `agent.config.json`
  Structured runtime metadata
- optional `prompts/`
  Prompt fragments or templates
- optional `tasks/`
  Repeated operational playbooks

## Suggested Agent Markdown Shape

Each markdown file should define:

- identity
- level
- parent
- mission
- scope
- responsibilities
- triggers
- inputs
- outputs
- handoffs
- escalation rules

## Runtime Layer

The runtime should be separate from the app UI.

Recommended model:

1. Markdown files define the agent.
2. A local script loads agent files.
3. A model adapter translates the agent request to whichever provider is active.
4. Outputs are written back to files and/or mirrored into the app.

## Provider Independence

We should use an adapter pattern:

- `openai adapter`
- `anthropic adapter`
- `gemini adapter`
- future local model adapter

The agent definition should not need to change when the model changes.

## Recommended Immediate Next Step

Create one pilot file-driven agent:

- `Avatar`
- or `Intake Steward`

Then define:

- its markdown file
- its config file
- one local script that can execute it against a chosen provider adapter

That will give us a repeatable framework we can scale.
