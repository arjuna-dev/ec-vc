# Workstream Tracker

## Purpose

Keep a short list of:

- front-loaded work
- active work
- parked follow-ups

This is meant to reduce context loss while we move between product, schema, and UI tasks.

This tracker should stay aligned with:

- `docs/record-architecture-master-plan.md`
- `docs/intake-architecture-master-plan.md`

## Front-Loaded

- Keep the shared `FilePageShell` as the one shell source while each file route continues to own its own `L1`
- Finish the remaining `Knowledge DB` runtime pass so `Markets`, `Securities`, and `Ingestion` all behave like normal file surfaces
- Keep the canonical structure aligned with the active workbook and approved UI behavior
- Normalize token names toward their final approved form during the same structure pass
- Keep the canonical JSON structure shape stable enough for direct app ownership
- Split `File/Card` light payloads from `Record View` rich payloads in a deliberate way
- Keep the shared create/edit record dialog moving toward fully canonical field and option ownership
- Define and wire `Ingestion` as a secondary `Knowledge DB` for artifact-processing provenance and created-file lineage
- Resume `Artifact Intake` as an active guided workflow
- Keep the intake tracker visible so drafts can always be resumed
- Stabilize the review loop so verified inputs stay verified and review can be skipped when needed
- Keep document preview, artifact preview, and artifact share paths aligned with the numbered workspace files

## Active

- `RAMP` is now the single architecture source of truth for `File -> Card -> Record View`
- `Intake Architecture Master Plan` is now the single intake planning source of truth
- Excel workbook + canonical JSON workflow is now in place for schema indexing
- `JSON + app editing` is now the chosen canonical structure direction
- `docs/canonical-structure.json` is now the app-readable canonical structure registry across the current L1/L2/L3 entity set
- canonical tokens can now carry explicit `db_field_aliases`, so shell rendering can resolve through canonical structure without guessing when live row payload fields still use older DB names
- `Opportunities` is now being formalized as a parent canonical `L1` contract with `Funds` and `Rounds` as subtype branches
- parent `L1`s with subtype branches now use an explicit route-choice step before create/add-record opens the shared dialog
- `Knowledge DBs` is now being treated as a real subset inside `Files` for reusable reference entities such as `Stages`, `Financial Industries`, and `Round Securities`
- `Ingestion` is now an approved secondary `Knowledge DB` direction for tracking original artifact links, processing events, and created-file lineage
- the file pages now render through one shared shell source with thin page wrappers, instead of drifting as copied page implementations
- only the literal `Test Shell` route should switch `L1` through the shell selector; normal file pages should resolve from their own route-owned `L1`
- owner identity now bootstraps into the `Users` table so the local owner can appear as the first real `User`
- split-name inputs are now being used where person/profile records are entered, while the current DB still stores the combined full-name field underneath
- the shared create/edit record dialog shell is now in place and re-used for create, edit, and add-relation entry points
- card shell slots are now explicit for `title`, `subtitle`, and `chips`, with `subtitle` = first selected extra field and `chips` = remaining selected extra fields
- `Knowledge DBs` now behaves as a real left-nav sibling branch under `My Workspace`, and its parent/child rows have been pulled back onto the same styling path as the `Files` navigation family
- Exporters are now being treated as migration / ingestion utilities, not the permanent architecture backbone
- Artifact processing recovery and continuity
- artifact-processing provenance so original artifacts, ingestion rows, and created files remain explicitly linked
- Intake draft resume flow from `Artifacts` cards and `Draft Files`
- Verification dialog behavior and staged review UX
- Visible document preview during staged markdown intake
- Tracker-driven restart point for `Company`, `Opportunity`, and `Contacts` first-pass extraction
- Include `Avatar` and `Roles` parameters in the intake control surface so operator behavior can be tuned with the workstream
- Unify KDB relationship behavior so cards stay lightweight and record views can get richer grouped relationship payloads
- Rename section labels and token names together so `System` does not coexist indefinitely with stale `*_Metadata` naming

## Pending

- Fix workbook wrapper-token drift so the JSON companion validates cleanly for `Company`, `Funds`, `Markets`, and `Terms`
- Rework `Record View` table behavior so tabs switch locally and instantly
- Align company `Record View` tabs with workbook structural nodes
- Decide which workbook labels stay technical and which get friendlier UI labels
- Build a clearer intake tracker surface that shows stage, blockers, and next action per draft
- Add a consistent resume affordance in both card and table views for unfinished artifacts
- Define role ownership for intake stages under the new `Roles` / `Avatar` direction
- Decide which `Avatar` and `Role` parameters belong in the tracker versus inside dedicated `Avatar` / `Roles` views
- Finish removing remaining internal `Databook` bridge and class naming in the shared record layer
- Replace remaining heuristic record section mapping with workbook-backed ownership

## Parked For Later

- Improve page-mapped markdown and Artifact audit trail
- Standardize selected-state actions across all landing pages
- Finish conforming grid cards and table views across all sections

## Notes

- As of April 2, 2026, the planning layer has been consolidated into two master docs:
  - `record-architecture-master-plan.md`
  - `intake-architecture-master-plan.md`
- the active workbook schema reference for first-pass record architecture is:
  - `docs/B10_DOS v260400 vrev.xlsx`
- recent intake recovery work already completed:
  - legacy workspace path normalization for preview/share/autofill
  - document preview cards restored in the intake flow
  - verification dialog can skip and expand verified info
  - unfinished artifacts now expose direct resume affordances
- recent file-card normalization work already completed:
  - summary panel structure normalized
  - `Add Relation` moved into the lower dynamic box
  - card loop alias drift reduced by standardizing toward `row`
  - card shell now uses explicit `title`, `subtitle`, and `chips` slots instead of the older shared-shell `metadata` wording
- as of April 3, 2026:
  - route-level `Databook` navigation has been renamed to `Record View`
  - page-level record navigation now runs through one shared helper instead of per-page route objects
  - `docs/canonical-structure.json` now carries the active app-readable L1/L2/L3 structure registry
  - canonical `General` now standardizes `Name` at `*.3.1` and `Summary` at `*.3.2`
  - canonical structure now carries explicit DB-field aliases where live row payloads still use older field names such as `Name`, `Company_Name`, or `title`
  - `Opportunities` now exists as a canonical parent structure with shared `System`, `KDB`, `General`, and `Overview`
  - `Funds` and `Rounds` remain subtype-owned where `Economics` and `Controls` diverge structurally
  - `File View` shell work exposed a remaining divergence: runtime create/manage support for new `Knowledge DB` files still needs real source wiring behind the now-prepared shared shell
- as of April 4, 2026:
- `Knowledge DBs` is now a dedicated left-nav branch below `Files`
- `Markets`, `Securities`, and `Ingestion` now sit on their own page routes while still rendering through the one shared file shell source
- `Roles` now has its own dedicated DB direction instead of relying on the old assistant prompt table as the conceptual source of truth
- the standard DB baseline is now explicit for new DB-backed file surfaces:
  - sqlite table
  - preload/main bridge
  - `System`, `KDB`, `General`
  - `Name`, `Summary`
  - owner identity now bootstraps into `Users`, and an `Owner` role record is ensured during that flow
  - person/profile inputs now use `Given Names` and `Last Names` on the UI side while saving back to the current combined-name field
  - the shared create/edit dialog now renders canonical date fields as date inputs
  - stale resolved bug notes were cleaned out of `bugs/`, leaving only the current `Knowledge DBs` nav follow-up notes
- current shared goal:
  - get the intake tracker and processing window reliable enough that a user never loses their place
  - keep the structure contract coherent while `Company` remains the main reference entity
  - normalize token names to their final approved form while the structure pass is still active
  - keep `JSON as source of truth with app editing` aligned to workbook validation and approved UI behavior
- current architecture rule:
  - canonical structure now lives in JSON
  - workbook helps validate and refine that structure
  - keep `File/Card` views lightweight
  - make `Record View` richer and workbook-aligned
- schema alignment work is still important, but intake continuity, JSON structure ownership, and structure-contract cleanup are the active operational threads

## Update Rule

When we make a meaningful change, do one of:

- move an item from `Active` to `Pending`
- move an item from `Pending` to `Front-Loaded`
- add a short note if a workstream is intentionally parked or intentionally reactivated
