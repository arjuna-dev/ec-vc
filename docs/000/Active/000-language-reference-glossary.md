# Language Reference / Glossary

| Concept | Description | Source |
| --- | --- | --- |
| Companion | A disciplined system helper that may propose content, but must follow approved structure and ownership. | Companion |
| Owner | The system authority and node founder identity. It is the origin of top-level control. | Product Reference |
| Owner LDB | The Owner's protected local database or workspace. Access to it should be governed through explicit user/contact/project/role rules, not guessed globally. | Files |
| User | The access identity layer. A User governs whether a linked Contact can access the Owner LDB. | Product Reference |
| Contact | The person record inside the CRM/LDB layer. It may correspond to a User, but is not the same thing as a User. | Product Reference |
| Access Assignment | The scoped rule that links a user/contact to a project or scope, a role, a status, and access limits. `Access_Assignments` should become its own canonical `L1` because access must be browsed, audited, and governed directly. | Files |
| Project x Role Access | The dynamic access rule where permissions are evaluated through project scope and role together instead of through global user status alone. | Files |
| Approved Direction | A concept or file direction that the Owner and architecture docs have accepted. It is not the same as implemented runtime truth. | File Steward |
| Partially Born | A file or structure where some birth-chain parts exist, but canon, registry, guide, runtime ownership, shell rendering, or provenance are not all complete. | File Steward |
| Fully Born | A file or structure whose canon, registry row, guide, ownership, steward, UX fork questions, runtime/sqlite ownership, shell path, and provenance path are honestly satisfied. | File Steward |
| File Shell | The shared shell renderer for file-level `L1` collection surfaces. It should stay fixed while route-owned `L1` payloads swap underneath it. | Product Reference |
| System Files File Universe | The authoritative list of files used to build shared LDB targets. If a file is not in System Files, it is not in the LDB universe. | File Steward Contract |
| File-Owned Token Contract | The file's token list and view forks are the live payload source for shells. Canonical/workbook docs are reference inputs only. | Record Architecture |
| Shared LDB Contract | The runtime relationship contract that writes to and reads from `LDB_Relationships`. It is the default relationship existence layer for all files. | Record Architecture |
| BB File | `Building Blocks File`. A special `System-Level File` that governs reusable UI building blocks, design primitives, shell parts, and reconstruction guidance. It is not a standard app-data `L1` and is a controlled exception to the normal `System` / `LDB` subsection baseline. | Record Architecture |
| Built From BBs | The explicit BB-to-BB dependency field. It declares which already-built building blocks a BB is composed from so the catalog can function as inventory, usage map, and dependency map. | Record Architecture |
| Convergence Rule | A temporary migration field used while a primitive token family or building block is still converging. It records active collapse and cleanup rules, but it should not become permanent structural weight once convergence is finished. | Record Architecture |
| Leaf / Elementary Block | A building block with no child BB dependencies. These are the lowest-level primitives in the BB system, such as small controls, icons, tokens, or base buttons. | Record Architecture |
| Parent Block | A building block that is composed from other BBs. These are higher-order structures such as title rows, dashboards, toolbars, menus, and shell parts. | Record Architecture |
| Root / Top-Level Block | A building block that is not a child of any other BB. It sits at the top of the BB composition tree and is a candidate top-level shell assembly unit. | Record Architecture |
| Child Block | A building block that is used inside another BB. Child blocks should be declared explicitly through `Built From BBs` instead of being left as unnamed dependencies. | Record Architecture |
| BB Graph | The structural view of the BB catalog once `Built From BBs` exists. The graph matters because it lets backend architecture, runtime ownership, and shell contracts carry cleanly through to final UI/UX instead of drifting into disconnected frontend-only patterns. | Record Architecture |
| Building Blocks to Shell Contract Migration | The architecture project that finishes the foundational building block map, extracts remaining local samples into real shared components, and moves shell placeholders onto explicit shared payload contracts. | Record Architecture |
| Record Shell | The approved shared shell renderer for `Record View`. It should receive the selected record as payload input instead of forking by entity. | Record Architecture |
| Fork Shell | The independent route-owned shared shell for branch-choice create flows. It may consume branch metadata from a source `L1`, but it must not collapse into entity-specific page UI or be treated as an `Opportunities` helper. | Record Architecture |
| Shared Dialog Shell | The rule that the create / edit dialog is itself a shell surface. Any launching shell must pass the same canonical payload contract into it rather than reshaping grouped `L2` structure locally. | Record Architecture |
| Shared Shell Header | The common top shell row that owns the `L1` select menu for shell routes. Shell pages should use this shared header instead of adding a second local select or launch row underneath it. | Product Reference |
| Dialog Shell Route | The dedicated route-owned surface for the shared create / edit shell. It may switch `L1` intentionally, but normal add/edit launches should route into it with explicit source context instead of improvising page-local dialog flows. | Record Architecture |
| Fork Shell Route | The dedicated route-owned branch-choice surface. Closing it should leave the user on the blank fork shell route, and reopening it should come from the shell row or route nav, not from an entity-specific fallback dialog. | Product Reference |
| Branch Selector | A selector that decides which subtype contract should load next. It is a structural control, not a normal saved field, and subtype-owned sections should remain hidden until a branch is chosen. | Record Architecture |
| Opportunity Type | The current branch selector for the `Opportunities` create flow. Choosing `Fund` or `Round` decides which subtype payload should appear and where the record will be created. | Product Reference |
| Legacy Surface | A frontend page or dialog that is no longer route-mounted or no longer part of the approved shared shell set. Once proven unused, it should be removed rather than kept as silent drift. | Legacy Surface Audit |
| Fixed Shell Styling | The rule that shell visuals stay fixed at shell level. `L1` may change payload, labels, section membership, and explicitly approved capabilities, but should not silently restyle the shell. | Product Reference |
| Shared Middle-Field Selection | The rule that the selected middle fields for a given `L1` are remembered once and reused by both `File Shell` cards and `Record Shell` hero rows. | Product Reference |
| Business Overview | The grouped `L2` used in `Companies` to collect overview-style subsections under one toolbar item while preserving the prior overview subsections as subgroup variants inside the panel. | Record Architecture |
| Subgroup | A preserved canonical subsection rendered inside a grouped `L2` panel. Subgroups should keep their own title and should be individually collapsible. | Record Architecture |
| Grouped Dialog Section | A grouped `L2` rendered inside the shared create / edit dialog. It should preserve subgroup identity and collapse / expand behavior instead of flattening grouped fields into one undifferentiated section. | Record Architecture |
| Record View | The eye-opened detailed surface for one selected record. Route-level `record-view` should now resolve into `Record Shell`. | Product Reference |
| Hero Dashboard | The top shell block for card or record presentation. In `Record Shell`, it is based on the current `User Record View` hero/dashboard pattern. | Record Architecture |
| L2 Toolbar | The section bar below the hero/dashboard that renders the selected `L1`'s subsection groups. It places normal sections on the left and `LDB` / `System` on the right. | Product Reference |
| System | The canonical subsection for record identity, provenance, creator, timestamps, and other record-owned system fields. | Product Reference |
| General | The canonical subsection for the main descriptive record fields. `Name` and `Summary` are the shared starter tokens for normal files, but live shells should not rely on positional order alone as runtime truth. | Product Reference |
| LDB | The subsection for declared local record relationships. It is not just another content tab; it changes the interaction model into relationship browsing and linking. | Product Reference |
| L0 | The provenance/history layer that sits beneath normal record content. It is a strong fit for event-log and origin data such as `Owner created`, and conceptually belongs with the system/knowledge side rather than as another editable business-content layer. | ECS Workstream Tracker |
| L0 Events File View | The route-owned `File View` for the `L0` event layer. It uses the same shared `L1` file shell as the other file surfaces, but it is view-oriented and routes rows into the event log surface rather than a normal databook record page. | ECS Workstream Tracker |
| L1 | The entity/file level in canonical structure. Selecting an `L1` chooses the entity payload source for a shell. | Record Architecture |
| Base L1 Structure | The shared starter contract every normal `L1` should begin from before any entity-specific extension is added. It includes shared `System` parameters, the shared `LDB` linkage section, and shared `General` parameters. | File Steward Contract |
| L1 Bootstrap | The required full implementation scope for a new `L1`: canonical entity, route, registry, shell, navigation, runtime ownership, default subsections, reciprocal LDB propagation, and working add/edit/create flows. A new `L1` is not complete if it is only visible in the UI, and this bootstrap work is `Owner`-only authority. | Record Architecture |
| System-Level File | A special file that supports the product system itself rather than normal app-data operations. A system-level file may have an intentionally narrower approved subsection contract when the normal operational `L1` baseline would not be useful. | Product Reference |
| L2 | The subsection grouping level in canonical structure, such as `System`, `General`, `Business Overview`, or `LDB`. | Record Architecture |
| Shared System Parameter | A canonical field in the shared `System` starter set that should keep the same meaning and naming across normal `L1` files. The current shared set is `ID`, `Creator`, `Datetime`, and `EventLog`. | File Steward Contract |
| Shared General Parameter | A canonical field in the shared `General` starter set that should keep the same meaning and naming across normal `L1` files. The current shared set is `Name` and `Summary`. | File Steward Contract |
| Shared LDB Base | The fact that every normal `L1` should own an `LDB` subsection as its linkage container. This does not mean every `L1` must use one identical list of relationship leaf names. | File Steward Contract |
| LDB Bridge Layer | The reciprocal relationship wiring that makes declared LDB links actually function between `L1`s. It includes the approved owner path, reverse-read path, and the bridge choice between a dedicated join table and the shared `LDB_Relationships` owner path. | Record Architecture |
| Relationship Existence Layer | The base storage layer that allows one record to link to another and call the linked record by row. In the default model this is the shared `LDB_Relationships` contract, not a dedicated join table per pair. | Product Reference |
| Promoted Relationship Owner | A dedicated join table used once the relationship itself needs its own governed fields, access-control rules, activation logic, or audit meaning. | Record Architecture |
| Loaded At Birth | The rule that a new normal `L1` should be born with its reciprocal LDB bridge layer already decided and declared as part of bootstrap, rather than relying on manual back-wiring later. | Product Reference |
| Transitional Manual Bridge | A temporary repair where a missing LDB bridge contract is wired after file birth. This may be needed while architecture is converging, but it should not be treated as the intended steady-state rule. | Record Architecture |
| Entity Extension Layer | The independent structure a specific `L1` adds after the shared base, including its own extra `L2`s and any explicit `L2.a-b-c-d` views. | File Steward Contract |
| L3 Token | The leaf token level in canonical structure. It is where field behavior, alias mapping, and write-path expectations should be declared. | Record Architecture |
| Owned Field | A value owned by the current record or its approved owned subtable. It writes through that owner path only. | Companion |
| Directional Link | A root-established or rule-bearing path such as identity, authority, provenance, or parentage. It should not be treated like generic LDB. | Record Architecture |
| LDB Relationship | A link between records that must have a declared relationship path, owner path, reverse-read path, and bidirectional visibility. In the current shared-shell flow, relation editing should open the shared `Add/Edit Record Shell` in `LDB` with the clicked source record context. | Companion |
| Field Class | The behavior class declared at the token level, such as `owned_field`, `directional_link`, or `ldb_relationship`. | Record Architecture |
| Ownership Mode | The declared ownership mode for a token, such as `local`, `root_owned`, or `relationship_owned`. | Product Reference |
| Cardinality | The declared relationship size rule such as `one_to_one`, `one_to_many`, or `many_to_many`. | Product Reference |
| Reverse Visibility | Whether a field or link appears from the opposite side, and whether it remains editable there. | Record Architecture |
| Owner Path | The approved runtime write path for a field or relationship. The shell should never guess this. | Record Architecture |
| Reverse-Read Path | The approved runtime read path that lets a relationship appear correctly from both linked records. | Record Architecture |
| Canon | The approved structure declared in the canonical contract files. Canon decides what is allowed. | Product Reference |
| General Settings -> Building Blocks -> Pages / Shells | The required dependency direction for the design system. Foundational visual rules should come from `General Settings`, components should consume those rules, and pages/shells should compose from those components. | Product Reference |
| L3 Alias Contract | The explicit runtime alias mapping declared on an `L3` token when the live payload field name differs from the canonical token name. This is a shell-level agreement, not a page-level patch. | Record Architecture |
| Runtime-Backed | A declared path that already has real runtime ownership underneath it. | ECS Workstream Tracker |
| Declared-But-Missing | A path declared in canon that does not yet have full runtime ownership or reverse-read support. | ECS Workstream Tracker |
| File Shell Lab | The strict shared file shell route used to test and exercise contract-driven page behavior. | Record Architecture |
| Deprecated Record Surface | `RecordPage.vue`, the earlier shared record implementation. It is now a historical legacy surface and not the active shared record route target. | Record Architecture |
| LDB | A reusable reference or processing file surface that may not be golden-tier in product importance, but still behaves like an `L1` in the shell and contract system. | Companion |
| Field Label Row | The top row of a field block that carries the field label and any adjacent guidance or action control. | Working UI Language |
| Token Label Row Editor | The label row control that edits token metadata directly in the UI (token type, option source, option entity/list, write field, field class). | Record Architecture |
| Field Control Shell | The visible value/input box under a field label. It is the rendered shell around the actual field content, not the field contract itself. | Working UI Language |
| Top-Layer Mechanism | A tuning layer that may improve speed, ranking, comfort, or prioritization without modifying ownership or the underlying contract. | Companion |
| Heuristic Guidance | A top-layer ranking and prioritization aid that may front-load likely options, but must not alter structure or ownership. | Product Reference |
| Clarity Pass | A review after editing that checks whether a document change remains readable, structured, and easy to follow before it is treated as settled. | Companion Surface |
## Canonical Entity Name

The structural entity name used by canon and shell ownership logic. This name is used to define `L1`, `L2`, and `L3` structure, but it is not automatically the same thing as the databook table name or route key.

Example:
- `Markets`

## Route Key

The navigation/shell key used in routes and payload switching. Route keys are for shell navigation, not for databook IPC writes.

Examples:
- `companies`
- `markets`
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
- `Markets`
- `Securities`

Legacy note:

- `databook` is still older runtime language
- the behavior is still active today
- but the preferred direction is to rename the shared runtime contract around `record` / `record view` language

Approved successor naming direction:

- `databooks:view` -> `records:view`
- `databooks:update` -> `records:update`
- `databooks:versions` -> `records:history`
- `databooks:viewSnapshot` -> `records:viewHistoryEntry`
- `databook_snapshots` -> `record_history`

Until that rename is executed, `databook table name` should be understood as a temporary runtime phrase, not preferred product language.

## Table Name Normalization

The required shared-shell step that resolves route keys and canonical entity names into databook table names before IPC actions are executed.

Rule:
- canonical names are for structure
- route keys are for navigation
- databook table names are for IPC/database actions
- these must not be treated as interchangeable

## Shared Label Normalization

The required shared-shell naming step that converts deprecated surfaced labels into current product wording without changing the underlying structural or databook name.

Examples:

- `BEmail` -> `Business Email`
- `PEmail` -> `Personal Email`
- `Financial Industry` / `Financial Industries` -> `Markets`

## Append-Only Audit Rule

The rule that shared shell actions must not reuse one shell-session `actionId` across repeated writes.

Use:
- `actionLabel` for shared shell/session context

Do not use:
- one reused session `actionId` as the write id for multiple field changes

Why:
- the `events` log is append-only
- reusable write ids can make a later shell change look like an update to an earlier event instead of a new audit event
