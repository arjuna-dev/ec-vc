# Language Reference / Glossary

| Concept | Description | Source |
| --- | --- | --- |
| Companion | A disciplined system helper that may propose content, but must follow approved structure and ownership. | Companion Contract |
| Owner | The system authority and node founder identity. It is the origin of top-level control. | Product Reference |
| User | The application actor layer that carries permissions, role assignment, work rights, and system participation. | Product Reference |
| Contact | The person record inside the CRM/KDB layer. It may correspond to a User, but is not the same thing as a User. | Product Reference |
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
| Top-Layer Mechanism | A tuning layer that may improve speed, ranking, comfort, or prioritization without modifying ownership or the underlying contract. | Companion Contract |
| Heuristic Guidance | A top-layer ranking and prioritization aid that may front-load likely options, but must not alter structure or ownership. | Product Reference |
| Clarity Pass | A review after editing that checks whether a document change remains readable, structured, and easy to follow before it is treated as settled. | Companion Surface |
