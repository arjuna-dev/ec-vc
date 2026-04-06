# Legacy Surface Audit

## Purpose

Track which frontend surfaces are:

- live shared shell surfaces
- live route surfaces
- removed legacy surfaces

This audit exists to keep the UI system manageable before heavier data loads and larger interaction volume.

## Live Shared Shell Surfaces

- `File Shell`
  - `src/components/FilePageShell.vue`
- `Record Shell`
  - `src/pages/RecordShellPage.vue`
- `Add/Edit Shell`
  - `src/components/AddEditRecordShellDialog.vue`
- `Add/Edit Shell Route`
  - `src/pages/DialogShellPage.vue`
- `File Shell Lab Route`
  - `src/pages/TestShellPage.vue`

## Live Route-Mounted Pages

These are still mounted by `src/router/routes.js`:

- `HomePage.vue`
- `IndexPage.vue`
- `ProjectsPage.vue`
- `OpportunitiesPage.vue`
- `ArtifactsPage.vue`
- `CompaniesPage.vue`
- `ContactsPage.vue`
- `UsersPage.vue`
- `IndustriesPage.vue`
- `SecuritiesPage.vue`
- `IngestionPage.vue`
- `NotesPage.vue`
- `TasksPage.vue`
- `RecordShellPage.vue`
- `DialogShellPage.vue`
- `AssistantsPage.vue`
- `SettingsPage.vue`
- `UserSettingsPage.vue`
- `ErrorNotFound.vue`

## Removed Legacy Dialog Surfaces

These old entity-specific create dialogs were removed after live entry points were migrated to the shared `Add/Edit Shell`:

- `CompanyCreateDialog.vue`
- `ContactCreateDialog.vue`
- `FundCreateDialog.vue`
- `RoundCreateDialog.vue`
- `OpportunityCreateDialog.vue`
- `ProjectCreateDialog.vue`
- `TaskCreateDialog.vue`
- `UserCreateDialog.vue`
- `NoteCreateDialog.vue`

## Removed Unreferenced Legacy Pages

These page files were removed because they were not route-mounted and had no imports inside `src`:

- `AssetClassesPage.vue`
- `DealzRadarPage.vue`
- `DealzWorldHomePage.vue`
- `MarketplacePage.vue`
- `MerchEventsPage.vue`
- `RecordPage.vue`
- `RegionsPage.vue`
- `SharedKnowledgePage.vue`
- `StagesPage.vue`
- `TeamSpacesPage.vue`
- `TokenzMarketHomePage.vue`
- `TokenzMarketsPage.vue`
- `TokenzVehiclesPage.vue`
- `TokenzWalletPage.vue`
- `WorldProjectsPage.vue`

## Working Rule

If a surface is not:

- route-mounted
- imported by a live surface
- or part of the approved shell set

it should be treated as a removal candidate rather than left in place indefinitely.
