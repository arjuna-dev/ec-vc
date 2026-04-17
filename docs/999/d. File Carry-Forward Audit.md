# File Carry-Forward Audit

## Purpose

This document records which useful file-specific fields still exist in the old SQLite schema and should be carried forward into the new shared file birth.

The goal is not to carry forward the old schema architecture.

The goal is to carry forward the useful domain elements so we do not have to re-invent them while rebuilding the file system around the cleaner `LAMP` path.

## Rule

Every file should:

- be born through the same shared system
- have the same shared base
- use the same governance and data contract

But not every file should have the same token set.

Each file can add file-specific tokens on top of the shared base.

## Shared Base

Current target shared base:

- `System`
  - `ID`
  - `System.Status`
  - `History`
- `General`
  - `Name`
  - `Definition`
- `LDB`

## Important Boundary

This audit is about useful file-specific tokens.

It is not approval to carry forward:

- old alias rescue
- old pipeline scaffolding
- old join-table architecture
- old specialized relationship scaffolding

Those should increasingly come from explicit `LDB` relationship ownership instead.

## Current Drift

Current file birth in [electron-main.js](/abs/path/c:/Users/erikc/Coding_Repository/ec-vc/src-electron/electron-main.js:1474) is still too thin.

It mainly carries:

- file-specific `Name`
- file-specific `Summary` in some files

That means the schema still knows more than the file birth is currently preserving.

## Carry-Forward Inventory

### Companies

Current thin birth:

- `Name` from `Company_Name`
- `Summary` from `One_Liner`

Useful carry-forward tokens from `Companies` and closely related company tables:

- `Short_Name`
- `Website`
- `One_Liner`
- `Description`
- `Notable_News`
- `Updates`
- `Status`
- `Company_Type`
- `Legal_Entity`
- `Date_of_Incorporation`
- `incorporation_country`
- `Incorporation_Type`
- `Company_Stage`
- `PAX_Count`
- `PAX_Known`

### Contacts

Current thin birth:

- `Name`

Useful carry-forward tokens from `Contacts`:

- `Personal_Email`
- `Professional_Email`
- `Phone`
- `Country_based`
- `LinkedIn`
- `Status`
- `linked_user_id`

### Users

Current thin birth:

- `Name` from `User_Name`

Useful carry-forward tokens from `Users`:

- `User_PEmail`
- `Status`

### Projects

Current thin birth:

- `Name` from `Project_Name`

Useful carry-forward tokens from `Projects` and `Project_Overview`:

- `Status`
- `Project_Status`
- `Project_Priority_Rank`
- `Project_Start_Date`
- `Project_Due_Date`
- `Project_End_Date`
- `Project_Target_Amount`
- `Project_Summary`

Notes:

- `install_status`
- `install_error`

are legacy pipeline-era scaffolding and should not be treated as approved long-term tokens.

### Tasks

Current thin birth:

- `Name` from `Task_Name`
- `Summary` from `Task_Summary`

Useful carry-forward tokens from `Tasks` and `Task_Overview`:

- `Status`
- `Task_Status`
- `Task_Priority_Rank`
- `Task_Start_Date`
- `Task_Due_Date`
- `Task_End_Date`

### Notes

Current thin birth:

- `Name` from `Note_Name`
- `Summary` from `Note_Content`

Useful carry-forward tokens from `Notes`:

- `Note_Content`
- `Status`

### Artifacts

Current thin birth:

- `Name` from `title`

Useful carry-forward tokens from `Artifacts`:

- `artifact_format`
- `type`
- `description`
- `Status`
- `round_id`
- `fund_id`

### Intake

Current thin birth:

- `Name` from `Intake_Name`

Useful carry-forward tokens from `Intake`:

- `Intake_Summary`
- `Original_Artifact_Id`
- `Created_Files_JSON`
- `Working`
- `Status`

### Markets

Current thin birth:

- `Name` from `Market_Name`
- `Summary` from `Market_Summary`

Useful carry-forward tokens from `Markets`:

- `Status`

### Securities

Current thin birth:

- `Name` from `Security_Name`
- `Summary` from `Security_Summary`

Useful carry-forward tokens from `Securities`:

- `Status`

### Funds

Current thin birth:

- `Name` from `Fund_Name`

Useful carry-forward tokens from `Funds`, `Fund_Overview`, and `Fund_Strategy`:

- `Status`
- `Fund_Raising_Status`
- `Fund_Period`
- `Fund_Target_Size`
- `Fund_Commited_Amounts`
- `Fund_Min_Ticket_Size`
- `Fund_Close_Date`
- `Fund_Summary`
- `Fund_Reserve`
- `Fund_Initial_Ticket_Size`
- `Fund_Target_Positions`

Relationship-style strategy targets should move toward `LDB`, not stay as one-off schema scaffolding:

- target regions
- target industries
- target stages
- target asset types

### Rounds

Current thin birth:

- `Name` from `Round_Name`

Useful carry-forward tokens from `Rounds`, `Round_Overview`, and `Round_Economics`:

- `Status`
- `Round_Raising_Status`
- `Security_Type`
- `Round_Target_Size`
- `Round_Commited_Amounts`
- `Round_Min_Ticket_Size`
- `Round_Close_Date`
- `Round_Summary`
- `Round_Pre_Valuation`
- `Round_Post_Valuation`
- `Round_Previous_Post_Valuation`

### Opportunities

Current thin birth:

- `Name` from `Venture_Oppty_Name`

Useful carry-forward tokens from `Opportunities`:

- `kind`
- `company_id`
- `Round_Stage`
- `Type_of_Security`
- `Investment_Ask`
- `Round_Amount`
- `Hard_Commits`
- `Soft_Commits`
- `Pre_Valuation`
- `Post_Valuation`
- `Previous_Post`
- `First_Close_Date`
- `Next_Close_Date`
- `Final_Close_Date`
- `Raising_Status`
- `Status`

The long rights/provisions list should be reviewed carefully before rebirth:

- `Board_Seats`
- `Information_Rights`
- `Voting_Rights`
- `Liquidation_Preference`
- `Anti_Dilution_Provisions`
- `Conversion_Features`
- `Most_Favored_Nation`
- `ROFO_ROR`
- `Co_Sale_Right`
- `Tag_Drag_Along`
- `Put_Option`
- `Over_Allotment_Option`
- `Stacked_Series`

### User Roles

Current thin birth:

- `Name` from `Role_Name`
- `Summary` from `Role_Summary`

Useful carry-forward tokens from `Roles`:

- `Status`

### Companion Roles

Current thin birth:

- `Name` from `Companion_Role_Name`
- `Summary` from `Companion_Role_Summary`

Useful carry-forward tokens from `Companion_Roles`:

- `Companion_Role_Type`
- `Companion_Role_Status`
- `Companion_Role_Contract_Path`
- `Status`

### Building Blocks

Building Blocks already carries a richer born structure than most files.

This file should be treated more as a useful reference of a richer governed token inventory than as an exception to keep forever.

## Migration Use

This audit should be used to:

1. define which file-specific tokens each file should be born with
2. stop relying on old alias-era table naming as the file birth source
3. separate:
   - useful domain tokens to carry forward
   - relationship scaffolding to move toward `LDB`
   - legacy subsystem noise to delete

## Strict Conclusion

We did not lose the old useful file elements.

We mostly lost them from the current born file structure.

That means the next migration pass should not re-invent file-specific tokens from scratch.

It should extract the useful ones from the old schema and re-birth them through the shared file system cleanly.
