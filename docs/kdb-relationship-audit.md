# KDB Relationship Audit

## Purpose

This document records the current canon-level KDB relationship baseline for shared shells.

It exists to make drift visible instead of leaving KDB expectations implicit.

## Approved Rule

- all first-order `L1`s should be inter-related through declared KDB tokens
- visible knowledge-db `L1`s should also participate in the same shared KDB contract
- every `L1` should at minimum expose:
  - `System`
  - `KDB`

## KDB Grouping Contract

KDB should now be understood in two display groups:

- `First-Order`
  - main operational files such as `Users`, `Companies`, `Projects`, `Tasks`, `Notes`, `Opportunities`, `Funds`, `Rounds`, `Artifacts`, `Contacts`, and `Roles`

- `Knowledge DB`
  - reusable reference or processing files such as `Markets`, `Securities`, and `Ingestion`

Working rule:

- groupings are display organization only
- they do not remove the underlying `L3` relationship declarations

## Audit Result

### Shared Interlinked Set

The current visible shared interlinked set is:

- `Users`
- `Artifacts`
- `Contacts`
- `Companies`
- `Opportunities`
- `Funds`
- `Rounds`
- `Projects`
- `Tasks`
- `Notes`
- `Roles`
- `Financial_Industries`
- `Round_Securities`
- `Artifacts_Processed`

Current canon status:

- all of the above now have `System`
- all of the above now have `KDB`
- all of the above now declare KDB links to the full visible shared interlinked set

### Basic Structure Baseline

The following canonical `L1`s previously lacked `KDB` and now have the basic `System + KDB` structure baseline:

- `Markets`
- `Locations`
- `Terms`
- `Academia`
- `Employments`
- `Stages`
- `Agents`

## Company Overview Grouping

The current company overview family is now explicitly marked as one display-group family:

- `Ops_Overview`
- `Business_Overview`
- `Market_Overview`
- `Results_Overview`

Working rule:

- these remain separate addressed subsections
- they may render under one higher `Overview` family without losing their canonical addresses
