# Canonical Relationship Audit

## Purpose

This audit tracks which dialogs and cards already treat first-level related records as canonical sources of truth, and which ones still behave like disconnected copies.

The rule we want is simple:

- If a card edits a linked first-level record, it should load from that canonical record.
- If a card saves edits to a linked first-level record, it should save back to that same canonical record.
- The UI should make it clear which inputs are first-order fields owned by that card's canonical table.

## First-Level Canonical Tables

These are the main top-level tables that appear to matter for current product workflows:

- `Companies`
- `Rounds`
- `Funds`
- `Contacts`
- `Tasks`
- `Projects`
- `Notes`
- `Artifacts`
- `Intros`
- `PipelineInvestmentProcess`

## Audit Matrix

| Surface | Section / Card | Canonical Owner | Current Behavior | Target Behavior | Status |
| --- | --- | --- | --- | --- | --- |
| `OpportunityCreateDialog.vue` | Company | `Companies` plus company subtables | Now hydrates from linked company and saves back to the same company when linked | Keep as canonical editor | Working |
| `OpportunityCreateDialog.vue` | Opportunity | `Rounds` or `Funds` | Creates canonical opportunity record, but not yet framed as a reusable canonical editor for existing linked records | Make explicit first-order ownership and follow same canonical pattern when editing existing records | Partial |
| `OpportunityCreateDialog.vue` | Primary Contact | `Contacts` | Always behaves more like new input payload than linked canonical contact editor | Add linked-contact canonical load/save behavior where applicable | Missing |
| `OpportunityCreateDialog.vue` | Artifacts | `Artifacts` | Links created artifacts to the resulting opportunity, but artifact metadata editing lives elsewhere | Keep link flow, rely on artifact properties for deeper edits | Partial |
| `ArtifactAddDialog.vue` | Linked Opportunity | `Rounds` or `Funds` | Selects a canonical opportunity and ingests artifacts against it | Good enough for create flow | Working |
| `ArtifactsPage.vue` | Artifact Properties core fields | `Artifacts` | Title, description, format, and linked opportunity can be edited | Continue expanding safely | Working |
| `ArtifactsPage.vue` | Related Companies / Industries / Regions | `Companies_Artifacts_documents`, `Artifacts_Industries`, `Artifacts_Regions` | UI started, but full canonical load/save is not complete yet | Finish load/save and validate joins | Partial |
| `CompanyCreateDialog.vue` | Company | `Companies` plus company subtables | Canonical create form for company fields | Add clearer first-order labeling if needed | Working |
| `ContactCreateDialog.vue` | Contact | `Contacts` | Canonical create form for a contact | Add linked-contact reuse in places that embed contact cards | Working |
| `TaskCreateDialog.vue` | Task | `Tasks` plus task subtables | Canonical create form for task record itself | Good base, but related company/round/fund/project links are not exposed here | Partial |
| `PipelineCreateDialog.vue` | Project / Pipeline | `Projects`, `Project_Overview`, `Project_Stages` | Canonical create form for project pipeline | Good base | Working |
| `DatabookPage.vue` company view | Related Documents | Company-linked artifact relationships | Lookup improved for company-related rounds, but broader canonical artifact relationship display still needs validation | Verify all expected related artifact joins | Partial |
| `DatabookPage.vue` company view | Company sections | `Companies` plus company subtables | Uses canonical company databook data | Keep as source of truth | Working |
| `DatabookPage.vue` contact view | Contact sections | `Contacts` | Uses canonical contact databook data | Keep as source of truth | Working |

## Highest-Impact Gaps

### 1. Opportunity Dialog

The biggest remaining gap is consistency inside the opportunity dialog.

- `Company` is now much closer to correct canonical behavior.
- `Opportunity` should be explicitly treated as first-order `Round` or `Fund` data.
- `Primary Contact` still behaves like loose input more than a canonical linked contact editor.

### 2. Artifact Relationship Editing

The artifact properties dialog should become the canonical place for first-level artifact relationships.

- `Linked Opportunity`
- `Related Companies`
- `Company Document Type`
- `Related Industries`
- `Related Regions`

This is the right place to repair relationship drift manually.

### 3. Embedded Relationship Cards

Any card that shows a first-level related record should be checked for:

- Does it read from the canonical linked record?
- Does it save back to the canonical linked record?
- Does it accidentally create a duplicate instead?

## Recommended Rollout Order

### Phase 1

- Finish artifact relationship load/save behavior in `ArtifactsPage.vue`
- Add canonical contact behavior to the `Primary Contact` section in `OpportunityCreateDialog.vue`
- Mark first-order fields more clearly in the dialog UI

### Phase 2

- Audit company and contact related cards in `DatabookPage.vue`
- Audit task-related cards and dialogs for first-level relationship ownership
- Audit project-related cards and dialogs for first-level relationship ownership

### Phase 3

- Audit secondary relationship surfaces such as intros, notes, and pipeline investment process
- Add a repeatable checklist for any new card/dialog before shipping

## Working Definition of "First-Order"

A field is first-order when that card is the natural owner of the canonical record behind it.

Examples:

- Company name, type, website, one-liner: first-order `Companies`
- Fund target size, fund raising status: first-order `Funds`
- Round stage, security type, round amount: first-order `Rounds`
- Contact name, email, phone, LinkedIn: first-order `Contacts`
- Artifact title, format, linked opportunity: first-order `Artifacts`
- Task name, status, due date: first-order `Tasks`

If a field belongs to a different canonical table, the UI should either:

- show it as a linked relationship editor, or
- make clear that the user is editing a related record, not local-only form state.

## Next Recommended Implementation Pass

1. Complete canonical relationship editing in `ArtifactsPage.vue`
2. Make `Primary Contact` in `OpportunityCreateDialog.vue` behave canonically
3. Audit `TaskCreateDialog.vue` for missing first-level relationship ownership
