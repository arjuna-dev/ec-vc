# Company Tab Redesign Proposal

## Purpose

Define a workbook-aligned `Company` tab model for both:

- `EyeView`
- `DataBook`

This proposal is based on:

- [company-schema-gap-map.md](c:/Users/erikc/Coding_Repository/ec-vc/docs/company-schema-gap-map.md)
- [item-addressing-convention.md](c:/Users/erikc/Coding_Repository/ec-vc/docs/item-addressing-convention.md)
- [B10_DOS v260400 vrev.xlsx](c:/Users/erikc/Coding_Repository/ec-vc/docs/B10_DOS%20v260400%20vrev.xlsx)

## Core Rule

`EyeView` and `DataBook` should use the same level-2 company structure.

The difference should be presentation only:

- `EyeView`
  curated profile-style layout
- `DataBook`
  workbook-style table layout

## Proposed Company Level-2 Tabs

These are the recommended company tabs going forward.

### `4.1 Metadata`

Workbook basis:

- `Meta_Data`

Contains:

- company id
- creator
- timestamps
- company short name
- website
- status
- tagline / one-liner

Why:

- first-order record identity

### `4.2 KDB Relations`

Workbook basis:

- `KDB_Relations`

Contains:

- contacts
- companies
- funds
- rounds
- projects
- tasks
- notes
- artifacts
- users

Why:

- all canonical links in one relationship layer

Important note:

- this should replace the current pattern where relationships dominate the top-level company model

### `4.3 Incorporation`

Workbook basis:

- `Inc_Info`

Contains:

- legal name
- incorporation date
- incorporation country
- entity type
- founders

Why:

- legal structure should stand on its own

### `4.4 Documents`

Workbook basis:

- `Co_Docs`

Contains:

- incorporation certificate
- incorporation articles
- agreements
- bylaws
- IP
- yearly statements
- quarterly statements
- monthly statements
- descriptive materials

Why:

- company documents are more specific than generic artifact listings

### `4.5 Operations`

Workbook basis:

- `Ops_Overview`

Contains:

- status
- stage
- HQ locations
- operations locations
- pax count
- known pax
- business / corporate / organizational structure
- leadership team
- advisors

Why:

- operational structure is a real company section, not just metadata

### `4.6 Business`

Workbook basis:

- `Business_Overview`

Contains:

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

Why:

- business narrative needs its own structured home

### `4.7 Market`

Workbook basis:

- `Market_Overview`

Contains:

- market
- demand analysis
- supply analysis

Why:

- market context is distinct from company description

### `4.8 Results`

Workbook basis:

- `Results_Overview`

Contains:

- traction
- sales
- revenue
- client analysis
- cohorts
- costs
- unit economics
- CAC
- LTV
- statements and bank records

Why:

- performance and financial outcomes should be grouped together

### `4.9 Business Plan`

Workbook basis:

- `Business_Plan`

Contains:

- plan overview
- forecast
- short-term objectives
- long-term objectives
- use of resources
- runway
- capital need
- funding strategy

Why:

- planning artifacts and strategy deserve a dedicated section

### `4.10 Fund Raising`

Workbook basis:

- `Fund_Raising`

Contains:

- shareholder structure
- shareholders
- rounds raised
- amount raised

Why:

- capital structure should be shown as company fund-raising, not only as linked rounds/funds

## Recommended UI Labels

The workbook names are useful, but some should be made more readable in the app.

Recommended UI labels:

- `4.1 Metadata`
- `4.2 KDB Relations`
- `4.3 Incorporation`
- `4.4 Documents`
- `4.5 Operations`
- `4.6 Business`
- `4.7 Market`
- `4.8 Results`
- `4.9 Business Plan`
- `4.10 Fund Raising`

## Tabs by View

### `EyeView`

Recommended company nav:

- `Metadata`
- `KDB Relations`
- `Incorporation`
- `Documents`
- `Operations`
- `Business`
- `Market`
- `Results`
- `Business Plan`
- `Fund Raising`

Behavior:

- curated layout
- section-specific cards
- relationship sections shown as curated related-item blocks

### `DataBook`

Top-level stays:

- `Card`
- `Table`

Inside `Table`, recommended order:

- `Cards`
- `All`
- `Metadata`
- `KDB Relations`
- `Incorporation`
- `Documents`
- `Operations`
- `Business`
- `Market`
- `Results`
- `Business Plan`
- `Fund Raising`

Behavior:

- stable workbook frame
- tab switching should feel local and instant
- `Cards` should show only the fields currently surfaced on company cards, but in table/workbook form

## Current-to-Proposed Mapping

Current app tab to proposed destination:

- `Metadata`
  stays as `Metadata`
- `Contacts`
  moves under `KDB Relations`
- `Rounds`
  moves under `KDB Relations`, while capital context also appears in `Fund Raising`
- `Funds`
  moves under `KDB Relations`
- `Artifacts`
  becomes mostly `Documents`, with broader artifact links still visible in `KDB Relations`
- `Notes`
  moves under `KDB Relations`, with narrative content also usable inside `Business`

## Important Structural Rule

The proposed tabs should be driven by existing backend company tables wherever possible:

- `Companies`
- `Company_Incorporation_Info`
- `Company_Operations_Overview`
- `Company_Business_Overview`
- `Company_Market_Overview`
- `Company_Results_Overview`
- `Company_Business_Plan`
- `Company_Fund_Raising`
- `Company_Artifacts`

And supported by relationship tables for:

- contacts
- rounds
- funds
- projects
- tasks
- notes
- artifacts

## What Not To Do

- do not keep relationship tabs as the whole company model
- do not let `Artifacts` stand in for all document structure
- do not keep `EyeView` and `DataBook` on different structural models
- do not use temporary UI groupings as permanent address anchors

## Recommended Next Implementation Step

For `Company`:

1. update `DataBook` tabs to the proposed company structure
2. make `Cards` inside `Table` a workbook/table representation of card-visible fields
3. make tab switching local without the current reload feel
4. then align `EyeView` sections to the exact same level-2 set
