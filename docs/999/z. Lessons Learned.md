# Lessons Learned

## Shared Row Surface Drift

- We had documented `Views` and `Tokens` as governance surfaces.
- We had not made it strict enough that `Row Surface` is the shared editable mirror of governed JSON structure.
- Because that rule was too soft, the codebase still allowed multiple local metadata contracts to survive.

### Clearer Rule

- `Row Surface` is the shared editable governance surface.
- It mirrors governed JSON structure.
- It does not invent local column contracts per shell.
- If a token/view metadata field exists in structure, it should appear through the same governed surface everywhere that edits that metadata.
