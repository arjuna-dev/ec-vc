# Company Reference Gap Map

## Purpose

Compare the current app `Company` layout against the `Company` structure defined in:

- [B10_DOS v260400 vrev.xlsx](/c:/Users/erikc/Coding_Repository/ec-vc/docs/B10_DOS%20v260400%20vrev.xlsx)

This is meant to show:

- what the workbook expects
- what the app currently shows
- what is only partially covered
- what is missing or grouped differently

This document should be read as the `Company`-specific companion to:

- `record-architecture-master-plan.md`
- `product-reference-guide.md`

## Current App Company Sections

Current `Company` layout in the app:

- `Metadata`
- `Contacts`
- `Rounds`
- `Funds`
- `Artifacts`
- `Notes`

This is primarily:

- one small metadata section
- several relationship-first sections

## Workbook Company Level-2 Structure

From the workbook `Tokens` sheet, `Company` currently includes these level-2 groups:

- `Meta_Data`
- `KDB`
- `Inc_Info`
- `Co_Docs`
- `Ops_Overview`
- `Business_Overview`
- `Market_Overview`
- `Results_Overview`
- `Business_Plan`
- `Fund_Raising`

## Side-By-Side

### `Meta_Data`

Workbook intent:

- company id
- creator
- timestamps
- status
- short name
- website
- tagline

Current app equivalent:

- mostly covered by `Metadata`

Status:

- `Partially aligned`

Gap:

- app `Metadata` is narrower and does not clearly reflect all workbook metadata tokens

### `KDB`

Workbook intent:

- artifact links
- user links
- contact links
- company links
- fund links
- round links
- project links
- task links
- note links

Current app equivalent:

- split across:
  - `Contacts`
  - `Rounds`
  - `Funds`
  - `Artifacts`
  - `Notes`

Status:

- `Partially aligned but structurally different`

Gap:

- the app treats some relationships as top-level sections
- the workbook treats them as one grouped relationship layer
- app is currently missing the broader grouped `KDB` concept
- app also does not currently surface all relationship types listed in the workbook, especially:
  - users
  - companies
  - projects
  - tasks

### `Inc_Info`

Workbook intent:

- legal name
- incorporation date
- incorporation country
- entity type
- founders

Current app equivalent:

- scattered pieces in `Metadata`
- some founder-related data may appear through contacts

Status:

- `Mostly missing as a section`

Gap:

- no dedicated incorporation/legal section in the app
- legal identity and founder structure are not presented as their own coherent group

### `Co_Docs`

Workbook intent:

- incorporation certificate
- incorporation articles
- agreements
- bylaws
- IP
- yearly / quarterly / monthly statements
- descriptive materials

Current app equivalent:

- loosely represented by `Artifacts`

Status:

- `Partially aligned but too broad`

Gap:

- app `Artifacts` is generic
- workbook expects a dedicated company-documents section with document-purpose structure
- current app does not distinguish these document classes at the section level

### `Ops_Overview`

Workbook intent:

- status
- stage
- HQ locations
- operations locations
- pax count
- known pax
- business / corporate / organizational structure
- leadership team
- advisors

Current app equivalent:

- small pieces in `Metadata`
- some people links in `Contacts`

Status:

- `Mostly missing`

Gap:

- no operational overview section
- app does not currently present internal operating structure as its own company layer

### `Business_Overview`

Workbook intent:

- description
- news
- updates
- objectives
- products
- key features
- backlog features
- ICP
- business model
- pricing
- placement
- promotion

Current app equivalent:

- very light coverage in `Metadata`
- some narrative spillover in `Notes`

Status:

- `Mostly missing`

Gap:

- no business-overview section
- current app does not organize narrative business context into a stable schema block

### `Market_Overview`

Workbook intent:

- market
- demand analysis
- supply analysis

Current app equivalent:

- not clearly represented

Status:

- `Missing`

Gap:

- no market-overview section in the app

### `Results_Overview`

Workbook intent:

- traction
- sales
- revenue
- clients analysis
- cohorts analysis
- direct / indirect / marketing / admin / tech costs
- unit economics
- CAC
- LTV
- financial statements and bank statements

Current app equivalent:

- not clearly represented

Status:

- `Missing`

Gap:

- no results/performance section in the app
- no clear place for commercial or financial performance tokens

### `Business_Plan`

Workbook intent:

- overview
- forecast
- short-term objectives
- long-term objectives
- resource use
- runway
- capital need
- funding strategy

Current app equivalent:

- not surfaced as its own section

Status:

- `Missing in the current UI grouping`

Gap:

- business-plan fields are not currently reflected in the company page structure

### `Fund_Raising`

Workbook intent:

- shareholder structure
- shareholders
- rounds raised
- amount raised

Current app equivalent:

- split across:
  - `Rounds`
  - `Funds`
  - some metadata

Status:

- `Partially aligned but grouped incorrectly`

Gap:

- the workbook expects company fund-raising to be its own section
- the app currently emphasizes linked rounds/funds instead of company-level capital structure

## Summary

### What the app currently gets right

- there is already a real company metadata concept
- company relationships to contacts, rounds, funds, artifacts, and notes are beginning to exist
- company documents and company notes are at least present somewhere in the UI

### Main structural mismatch

The workbook organizes `Company` as:

- `core metadata`
- `company operations and business structure`
- `company documents`
- `capital raising`
- `relationship layer`

The current app organizes `Company` mostly as:

- `small metadata`
- `linked records`

So the current app is too relationship-first and not structural enough.

### Recommended correction

For `Company`, the `Record View` should eventually move toward workbook-aligned top-level groups such as:

- `Metadata`
- `KDB`
- `Incorporation`
- `Documents`
- `Operations`
- `Business`
- `Market`
- `Results`
- `Business Plan`
- `Fund Raising`

Relationship-specific lists like:

- contacts
- rounds
- funds
- artifacts
- notes

should likely live inside `KDB`, or inside clearly related structural sections, instead of acting as the full company model by themselves.

## Immediate Design Implication

Before more `Company` UI work, the next design pass should decide:

1. whether the `Company Record View` should use the workbook section set directly
2. which workbook section labels should be translated into friendlier UI labels
3. how `KDB` should expose linked entities without taking over the whole page structure
