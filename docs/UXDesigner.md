# UX Designer

## Data Surface Cursor Contract

In `PMP Window` `Data Section`, cursor behavior should reflect the interaction contract of each cell.

Rules:

- on the primary `Name` cell:
  - single click selects/focuses the record for `Record View`
  - double click can still enter inline edit mode
  - cursor should show the normal select/pointer cursor, not the text-input cursor

- on other editable data cells:
  - cursor should show the text-input cursor because their primary affordance is inline editing

- on non-editable cells:
  - cursor should stay default unless there is another explicit interaction

The key distinction is:

- `Name` cell primary action = select/focus record
- other editable cells primary action = edit value

That is why the cursor should be different even if both technically support double click.
