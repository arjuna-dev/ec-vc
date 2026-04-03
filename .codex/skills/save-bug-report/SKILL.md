---
name: save-bug-report
description: Write concise, professional bug reports in Markdown and save them as repo-local `.md` files. Use when the user reports a bug, regression, broken flow, UI issue, confusing behavior, or unexpected app behavior and wants it documented for later fixing or tracking.
---

# Save Bug Report

Create a bug report from the user's description, fill the required Markdown structure, and save it in the repo as a new `.md` file.

Prefer saving reports under `bugs/`. If `bugs/` does not exist, create it.

Name files with a date prefix and short slug, for example `bugs/2026-04-02-artifact-upload-freezes.md`.

## Workflow

1. Read the user's report and extract:
- what is happening
- where it happens
- what should happen
- what actually happens
- any environment details already provided
- any screenshot references already provided

2. Check minimum completeness before writing the file.
- You must have enough information to meaningfully fill `Description`, `Environment`, `Expected Behavior`, and `Actual Behavior`.
- If `Description`, `Expected Behavior`, or `Actual Behavior` is missing or too vague, ask one brief clarifying question instead of generating the report.
- If little or no environment information is provided, ask for the git branch being tested.
- If the bug pertains to the file ingestion system, ask which PDF pitch deck was used when the bug appeared unless the user already provided it.

3. Write the report in valid Markdown.
- Use exactly these section headers, in exactly this order:
  `## 1) Description`
  `## 2) Environment`
  `## 3) Expected Behavior`
  `## 4) Actual Behavior`
  `## 5) Screenshots`
- Do not add extra sections.
- Do not add commentary outside those sections.
- Keep the report concise but specific.
- Do not invent details.
- If something is unknown, write `Unknown`.
- Do not propose solutions unless the user explicitly asks.
- Do not blame the user.

4. Save the report to a new Markdown file in `bugs/`.
- Derive a short slug from the bug title or summary.
- Use the current local date in the filename when possible.
- If a file with the same name already exists, append `-2`, `-3`, and so on.

5. Return the saved path and a short summary of what was captured.

## Report Template Rules

Use this content model when writing the file:

```md
## 1) Description
...

## 2) Environment
...

## 3) Expected Behavior
...

## 4) Actual Behavior
...

## 5) Screenshots
```

Leave the `Screenshots` section present even if empty. The user may fill it later.

## Environment Guidance

Be flexible in the `Environment` section. Include whatever is known, such as:
- git branch
- operating system
- app or product name
- app version
- browser
- device
- runtime
- PDF pitch deck used, when the bug involves file ingestion

If the user gives only partial environment info, include it and write `Unknown` for the rest rather than inventing details.
