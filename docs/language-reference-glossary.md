# Language Reference / Glossary

| Concept | Description | Source |
| --- | --- | --- |
| Companion | A disciplined system helper that may propose content, but must follow approved structure and ownership. | Companion Contract |
| Owned Field | A value owned by the current record or its approved owned subtable. It writes through that owner path only. | Companion Contract |
| KDB Relationship | A link between records that must have a declared relationship path, owner path, reverse-read path, and bidirectional visibility. | Companion Contract |
| Owner Path | The approved runtime write path for a field or relationship. The shell should never guess this. | Record Architecture |
| Reverse-Read Path | The approved runtime read path that lets a relationship appear correctly from both linked records. | Record Architecture |
| Canon | The approved structure declared in the canonical contract files. Canon decides what is allowed. | Product Reference |
| Runtime-Backed | A declared path that already has real runtime ownership underneath it. | Workstream Tracker |
| Declared-But-Missing | A path declared in canon that does not yet have full runtime ownership or reverse-read support. | Workstream Tracker |
| Live Shell | The strict shared shell surface used to test and exercise contract-driven page behavior. | Record Architecture |
| Knowledge DB | A file surface that may not be golden-tier in product importance, but still behaves like an `L1` in the shell and contract system. | Companion Contract |
| Top-Layer Mechanism | A tuning layer that may improve speed, ranking, comfort, or prioritization without modifying ownership or the underlying contract. | Companion Contract |
| Clarity Pass | A review after editing that checks whether a document change remains readable, structured, and easy to follow before it is treated as settled. | Companion Surface |
