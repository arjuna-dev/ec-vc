# Language Reference / Glossary

| Concept | Description | Source |
| --- | --- | --- |
| Companion | A disciplined system helper that may propose content, but must follow approved structure and ownership. | Companion Contract |
| Owner | The system authority and node founder identity. It is the origin of top-level control. | Product Reference |
| User | The application actor layer that carries permissions, role assignment, work rights, and system participation. | Product Reference |
| Contact | The person record inside the CRM/KDB layer. It may correspond to a User, but is not the same thing as a User. | Product Reference |
| File Shell | The shared shell renderer for file-level `L1` collection surfaces. It should stay fixed while route-owned `L1` payloads swap underneath it. | Product Reference |
| Record Shell | The approved shared shell renderer for `Record View`. It should receive the selected record as payload input instead of forking by entity. | Record Architecture |
| Shared Dialog Shell | The rule that the create / edit dialog is itself a shell surface. Any launching shell must pass the same canonical payload contract into it rather than reshaping grouped `L2` structure locally. | Record Architecture |
| Shared Shell Header | The common top shell row that owns the `L1` select menu for shell routes. Shell pages should use this shared header instead of adding a second local select or launch row underneath it. | Product Reference |
| Dialog Shell Route | The dedicated shell test route for the shared create / edit dialog. It should rely on the shared shell header for `L1` switching and should not improvise a separate launchpad card when the shell header already exists. | Record Architecture |
| Branch Selector | A selector that decides which subtype contract should load next. It is a structural control, not a normal saved field, and subtype-owned sections should remain hidden until a branch is chosen. | Record Architecture |
| Opportunity Type | The current branch selector for the `Opportunities` create flow. Choosing `Fund` or `Round` decides which subtype payload should appear and where the record will be created. | Product Reference |
| Legacy Surface | A frontend page or dialog that is no longer route-mounted or no longer part of the approved shared shell set. Once proven unused, it should be removed rather than kept as silent drift. | Legacy Surface Audit |
| Fixed Shell Styling | The rule that shell visuals stay fixed at shell level. `L1` may change payload, labels, section membership, and explicitly approved capabilities, but should not silently restyle the shell. | Product Reference |
| Shared Middle-Field Selection | The rule that the selected middle fields for a given `L1` are remembered once and reused by both `File Shell` cards and `Record Shell` hero rows. | Product Reference |
| First-Order KDB | The KDB display family for main operational `L1`s such as `Users`, `Companies`, `Projects`, `Tasks`, `Notes`, `Opportunities`, `Funds`, `Rounds`, `Artifacts`, `Contacts`, and `Roles`. | KDB Audit |
| Knowledge DB KDB | The KDB display family for reusable reference or processing `L1`s such as `Markets`, `Securities`, and `Ingestion`. | KDB Audit |
| Business Overview | The grouped `L2` used in `Companies` to collect overview-style subsections under one toolbar item while preserving the prior overview subsections as subgroup variants inside the panel. | Record Architecture |
| Grouped Subsection | A preserved canonical subsection rendered inside a grouped `L2` panel. Grouped subsections should keep their own title and should be individually collapsible. | Record Architecture |
| Grouped Dialog Section | A grouped `L2` rendered inside the shared create / edit dialog. It should preserve subgroup identity and collapse / expand behavior instead of flattening subgrouped fields into one undifferentiated section. | Record Architecture |
| Overview Display Group | A higher display family that can collect multiple overview-style subsections under one grouped heading without changing their canonical addresses. Grouping the toolbar does not flatten the subgroup structure in the panel. | KDB Audit |
| Record View | The eye-opened detailed surface for one selected record. Route-level `record-view` should now resolve into `Record Shell`. | Product Reference |
| Hero Dashboard | The top shell block for card or record presentation. In `Record Shell`, it is based on the current `User Record View` hero/dashboard pattern. | Record Architecture |
| L2 Toolbar | The section bar below the hero/dashboard that renders the selected `L1`'s subsection groups. It places normal sections on the left and `KDB` / `System` on the right. | Product Reference |
| System | The canonical subsection for record identity, provenance, creator, timestamps, and other record-owned system fields. | Product Reference |
| General | The canonical subsection for the main descriptive record fields. `Name` is standardized as the first general field and `Summary` as the second. | Product Reference |
| KDB | The subsection for declared record relationships. It is not just another content tab; it changes the interaction model into relationship browsing and linking. | Product Reference |
| L1 | The entity/file level in canonical structure. Selecting an `L1` chooses the entity payload source for a shell. | Record Architecture |
| L2 | The subsection grouping level in canonical structure, such as `System`, `General`, `Business Overview`, or `KDB`. | Record Architecture |
| L3 Token | The leaf token level in canonical structure. It is where field behavior, alias mapping, and write-path expectations should be declared. | Record Architecture |
| Owned Field | A value owned by the current record or its approved owned subtable. It writes through that owner path only. | Companion Contract |
| Directional Link | A root-established or rule-bearing path such as identity, authority, provenance, or parentage. It should not be treated like generic KDB. | Record Architecture |
| KDB Relationship | A link between records that must have a declared relationship path, owner path, reverse-read path, and bidirectional visibility. | Companion Contract |
| Field Class | The behavior class declared at the token level, such as `owned_field`, `directional_link`, or `kdb_relationship`. | Record Architecture |
| Ownership Mode | The declared ownership mode for a token, such as `local`, `root_owned`, or `relationship_owned`. | Product Reference |
| Cardinality | The declared relationship size rule such as `one_to_one`, `one_to_many`, or `many_to_many`. | Product Reference |
| Reverse Visibility | Whether a field or link appears from the opposite side, and whether it remains editable there. | Record Architecture |
| Owner Path | The approved runtime write path for a field or relationship. The shell should never guess this. | Record Architecture |
| Reverse-Read Path | The approved runtime read path that lets a relationship appear correctly from both linked records. | Record Architecture |
| Canon | The approved structure declared in the canonical contract files. Canon decides what is allowed. | Product Reference |
| L3 Alias Contract | The explicit runtime alias mapping declared on an `L3` token when the live payload field name differs from the canonical token name. This is a shell-level agreement, not a page-level patch. | Record Architecture |
| Runtime-Backed | A declared path that already has real runtime ownership underneath it. | ECS Workstream Tracker |
| Declared-But-Missing | A path declared in canon that does not yet have full runtime ownership or reverse-read support. | ECS Workstream Tracker |
| Live Shell | The strict shared shell surface used to test and exercise contract-driven page behavior. | Record Architecture |
| Deprecated Record Surface | `RecordPage.vue`, the earlier shared record implementation. It is now legacy and should not be treated as the active shared record route target. | Record Architecture |
| Knowledge DB | A file surface that may not be golden-tier in product importance, but still behaves like an `L1` in the shell and contract system. | Companion Contract |
| Field Label Row | The top row of a field block that carries the field label and any adjacent guidance or action control. | Working UI Language |
| Field Control Shell | The visible value/input box under a field label. It is the rendered shell around the actual field content, not the field contract itself. | Working UI Language |
| Top-Layer Mechanism | A tuning layer that may improve speed, ranking, comfort, or prioritization without modifying ownership or the underlying contract. | Companion Contract |
| Heuristic Guidance | A top-layer ranking and prioritization aid that may front-load likely options, but must not alter structure or ownership. | Product Reference |
| Clarity Pass | A review after editing that checks whether a document change remains readable, structured, and easy to follow before it is treated as settled. | Companion Surface |
## Canonical Entity Name

The structural entity name used by canon and shell ownership logic. This name is used to define `L1`, `L2`, and `L3` structure, but it is not automatically the same thing as the databook table name or route key.

Example:
- `Financial_Industries`

## Route Key

The navigation/shell key used in routes and payload switching. Route keys are for shell navigation, not for databook IPC writes.

Examples:
- `companies`
- `industries`
- `securities`

## Databook Table Name

The approved table name used by IPC/database-facing actions such as:
- `databooks:view`
- `databooks:update`
- `verification:list`
- `verification:upsert`

Databook table names must be used for write and read actions even when they differ from the route key or canonical entity name.

Examples:
- `Companies`
- `Industries`
- `Round_Securities`

## Table Name Normalization

The required shared-shell step that resolves route keys and canonical entity names into databook table names before IPC actions are executed.

Rule:
- canonical names are for structure
- route keys are for navigation
- databook table names are for IPC/database actions
- these must not be treated as interchangeable
