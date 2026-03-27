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

## Canonical Contract

For every first-level canonical table, we want the same rule:

- metadata fields are direct inputs into that table or its owned subtable(s)
- those metadata fields should be edited only through a canonical owner card/dialog
- relationships to other first-level tables should be searchable by that target table's metadata items
- relationship editors should save to the real join table, not local-only form state

## Implementation Matrix

| Canonical Table | Metadata Owner | Example Metadata Items | Expected First-Level Relationships | Main UI Owner(s) | Current Status | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| `Companies` | `Companies`, `Company_Incorporation_Info`, `Company_Operations_Overview`, other company subtables | `Company_Name`, `Company_Type`, `Website`, `One_Liner`, `Status`, `Date_of_Incorporation`, `Pax`, `Updates` | `Rounds`, `Funds`, `Contacts`, `Projects`, `Tasks`, `Artifacts` | `CompanyCreateDialog.vue`, `DatabookPage.vue`, `OpportunityCreateDialog.vue` company section | Partial | keep canonical owner logic in company editors, then add/verify multiselect relationships |
| `Rounds` | `Rounds`, `Round_Overview`, `Round_Economics`, `Round_Controls` | `Round_Name`, `Round_Target_Size`, `Round_Raising_Status`, `Round_Security_Type`, `Round_Pre_Valuation`, `Round_Post_Valuation` | `Companies`, `Contacts`, `Projects`, `Tasks`, `Funds`, `Intros`, `Artifacts` | `OpportunityCreateDialog.vue` round mode, `DatabookPage.vue` | Partial | make round metadata explicitly first-order in opportunity editor, then add relationship editor coverage |
| `Funds` | `Funds`, `Fund_Overview`, `Fund_Strategy`, `Fund_Economics`, `Fund_Controls` | `Fund_Name`, `Fund_Target_Size`, `Fund_Raising_Status`, `Fund_Type`, `Investment_Stages`, `Company_Stages` | `Companies`, `Contacts`, `Projects`, `Tasks`, `Rounds`, `Intros`, `Artifacts` | `OpportunityCreateDialog.vue` fund mode, `DatabookPage.vue` | Partial | make fund metadata explicitly first-order in opportunity editor, then add relationship editor coverage |
| `Contacts` | `Contacts` | `Name`, `Personal_Email`, `Professional_Email`, `Phone`, `LinkedIn`, `Country_based` | `Companies`, `Rounds`, `Funds`, `Projects`, `Intros`, possibly `Tasks` via assignment | `ContactCreateDialog.vue`, `DatabookPage.vue`, `OpportunityCreateDialog.vue` contact section | Partial | canonical contact path now exists in opportunity dialog; next add broader linked-contact editors where needed |
| `Tasks` | `Tasks`, `Task_Overview`, `Task_Team` and assignment/support subtables | `Task_Name`, `Task_Summary`, `Task_Status`, `Task_Priority_Rank`, `Task_Start_Date`, `Task_Due_Date`, `Task_End_Date` | `Companies`, `Rounds`, `Funds`, `Projects`, `Contacts`, parent `Tasks` | `TaskCreateDialog.vue`, `TasksPage.vue` | Missing / Partial | add relationship multiselects and canonical ownership rules to task editor |
| `Projects` | `Projects`, `Project_Overview`, `Project_Stages`, `Project_Team*` | `Project_Name`, stage metadata, install state, team metadata | `Companies`, `Rounds`, `Funds`, `Tasks`, `Contacts`, related `Projects` | `PipelineCreateDialog.vue`, `PipelinesPage.vue` | Partial | audit project relationship editing and add canonical relationship editor coverage |
| `Notes` | `Notes` | `Note_Name`, `Note_Content`, `created_by` | no persisted first-level note relationship joins in current schema | `NoteCreateDialog.vue`, `NotesPage.vue` | Metadata-only by schema | keep note editor canonical for note-owned fields and do not fake unsaved relationship selectors |
| `Artifacts` | `Artifacts`, `Artifact_Raw`, `Artifact_Llm_Ready`, `Artifact_Llm_Generated`, `Company_Artifacts` | `title`, `artifact_format`, `type`, `description`, file metadata | `Rounds`, `Funds`, `Companies`, `Industries`, `Regions`, related `Artifacts` | `ArtifactsPage.vue`, `ArtifactAddDialog.vue`, `OpportunityCreateDialog.vue` artifact flow | Partial | validate broader artifact relationship coverage and add remaining first-level joins if needed |
| `Intros` | `Intros` | `Intro`, `Date` | `Contacts`, `Rounds`, `Funds` | no strong dedicated canonical editor yet | Missing | define canonical intro editor and relationship multiselect pattern |
| `PipelineInvestmentProcess` | `PipelineInvestmentProcess` | process metadata fields in table | `Companies`, `Rounds`, `Funds`, `Contacts`, parent/child process links, blocked-by links | no strong dedicated canonical editor yet | Missing | define editor surface and relationship contract |

## Relationship Search Rule

When a user links one first-level canonical record to another:

- the search should query the target table's metadata items
- the saved link should use the target record id
- the loaded relationship state should come from the real join table

Examples:

- linking a company should search company metadata like `Company_Name`, `Company_Type`, `Website`
- linking a contact should search contact metadata like `Name`, `Professional_Email`, `Personal_Email`
- linking a round should search round metadata like `Round_Name`
- linking a fund should search fund metadata like `Fund_Name`
- linking an artifact should search artifact metadata like `title`, `artifact_format`, and current linked owner labels

## Audit Matrix

| Surface | Section / Card | Canonical Owner | Current Behavior | Target Behavior | Status |
| --- | --- | --- | --- | --- | --- |
| `OpportunityCreateDialog.vue` | Company | `Companies` plus company subtables | Now hydrates from linked company and saves back to the same company when linked | Keep as canonical editor | Working |
| `OpportunityCreateDialog.vue` | Opportunity | `Rounds` or `Funds` | Creates canonical opportunity record, but not yet framed as a reusable canonical editor for existing linked records | Make explicit first-order ownership and follow same canonical pattern when editing existing records | Partial |
| `OpportunityCreateDialog.vue` | Primary Contact | `Contacts` | Now supports create-new vs link-existing contact flow and hydrates canonical contact data when linked | Keep as canonical linked-contact editor | Working |
| `OpportunityCreateDialog.vue` | Artifacts | `Artifacts` | Links created artifacts to the resulting opportunity, but artifact metadata editing lives elsewhere | Keep link flow, rely on artifact properties for deeper edits | Partial |
| `ArtifactAddDialog.vue` | Linked Opportunity | `Rounds` or `Funds` | Selects a canonical opportunity and ingests artifacts against it | Good enough for create flow | Working |
| `ArtifactsPage.vue` | Artifact Properties core fields | `Artifacts` | Title, description, format, and linked opportunity can be edited | Continue expanding safely | Working |
| `ArtifactsPage.vue` | Related Companies / Industries / Regions | `Companies_Artifacts_documents`, `Artifacts_Industries`, `Artifacts_Regions` | Loads and saves canonical join-table relationships | Validate joins and expand to remaining applicable first-level links | Working |
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
- `Primary Contact` now behaves canonically, so the next focus is the opportunity record itself.

### 2. Artifact Relationship Editing

The artifact properties dialog is now the canonical place for current first-level artifact relationships.

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

- Validate artifact relationship editing in `ArtifactsPage.vue`
- Validate canonical contact behavior in `OpportunityCreateDialog.vue`
- Mark first-order fields more clearly in the remaining dialog sections

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

1. Audit `TaskCreateDialog.vue` for missing first-level relationship ownership
2. Make `Opportunity` metadata itself more explicitly first-order in `OpportunityCreateDialog.vue`
3. Audit `DatabookPage.vue` company/contact relationship cards against the canonical contract
