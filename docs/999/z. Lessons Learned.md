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

## Shared Renderer Needs Explicit Path Contracts

- We clarified that making the renderer shared is not enough on its own.
- A shared renderer reduces mistakes, but it does not remove the need for each path to declare what data it is carrying.
- Without a path contract, different surfaces can still look consistent while quietly carrying unclear or implied meaning.

### Clearer Rule

- One shared renderer may be reused across many paths.
- Each data-bearing path still needs its own explicit data contract.
- The contract should carry the path-specific provisions for that data set.
- The renderer should not guess which fields matter.
