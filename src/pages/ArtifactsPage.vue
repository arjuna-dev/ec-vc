<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Artifacts requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="artifacts-page">
      <header class="artifacts-page__heading">
        <div class="artifacts-page__heading-copy">
          <h1 class="artifacts-page__title">Artifacts</h1>
          <div class="artifacts-page__eyebrow">Workspace cockpit</div>
        </div>
      </header>

      <section class="artifacts-shell">
        <div class="artifacts-shell__hero">
          <div class="artifacts-shell__copy">
            <div class="artifacts-shell__eyebrow">Dashboard</div>
            <h2 class="artifacts-shell__hero-title">Review source files, links, and intake state in one place.</h2>
            <p class="artifacts-shell__hero-text">{{ artifactsHeroText }}</p>

          </div>

          <div class="artifacts-dashboard">
            <div class="artifacts-dashboard__stats">
              <article
                v-for="stat in artifactsDashboardStats"
                :key="stat.label"
                class="artifacts-dashboard__stat"
                :class="`artifacts-dashboard__stat--${stat.tone}`"
              >
                <div class="artifacts-dashboard__stat-label">{{ stat.label }}</div>
                <div class="artifacts-dashboard__stat-value">{{ stat.value }}</div>
                <div class="artifacts-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="artifacts-dashboard__health">
              <div class="artifacts-dashboard__health-copy">
                <div class="artifacts-dashboard__health-label">Review health</div>
                <div class="artifacts-dashboard__health-text">
                  {{ artifactsDashboard.readyCount }} ready, {{ artifactsDashboard.attentionCount }} need review,
                  {{ artifactsDashboard.linkedCount }} already linked
                </div>
              </div>

              <div class="artifacts-dashboard__health-bar" aria-hidden="true">
                <span
                  class="artifacts-dashboard__health-segment artifacts-dashboard__health-segment--sparse"
                  :style="{ width: `${artifactsDashboard.attentionShare}%` }"
                />
                <span
                  class="artifacts-dashboard__health-segment artifacts-dashboard__health-segment--medium"
                  :style="{ width: `${artifactsDashboard.linkedShare}%` }"
                />
                <span
                  class="artifacts-dashboard__health-segment artifacts-dashboard__health-segment--rich"
                  :style="{ width: `${artifactsDashboard.readyShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="artifacts-toolbar">
          <div class="artifacts-toolbar__block artifacts-toolbar__block--view">
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="artifacts-toolbar__toggle artifacts-toolbar__view-toggle"
              :options="viewModeOptions"
            />
          </div>

          <div class="artifacts-toolbar__block artifacts-toolbar__block--kind">
            <q-btn-toggle
              v-model="artifactKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="artifacts-toolbar__toggle artifacts-toolbar__kind-toggle"
              :options="artifactKindOptions"
            />
          </div>

          <div class="artifacts-toolbar__block artifacts-toolbar__block--filters">
            <q-icon name="tune" size="18px" class="artifacts-toolbar__filters-icon" />

            <q-select
              v-model="companyFilter"
              dense
              outlined
              clearable
              emit-value
              map-options
              class="artifacts-toolbar__filter-control"
              label="Company"
              :options="companyFilterOptions"
              :disable="loading || companyFilterOptions.length === 0"
            />

            <q-select
              v-model="opportunityFilter"
              dense
              outlined
              clearable
              emit-value
              map-options
              class="artifacts-toolbar__filter-control"
              label="Opportunity"
              :options="opportunityFilterOptions"
              :disable="loading || opportunityFilterOptions.length === 0"
            />

            <q-select
              v-model="projectFilter"
              dense
              outlined
              clearable
              emit-value
              map-options
              class="artifacts-toolbar__filter-control"
              label="Project"
              :options="projectFilterOptions"
              :disable="true"
            />

            <q-select
              v-model="typeFilter"
              dense
              outlined
              clearable
              emit-value
              map-options
              class="artifacts-toolbar__filter-control"
              label="Type"
              :options="typeFilterOptions"
              :disable="loading || typeFilterOptions.length === 0"
            />
          </div>

          <div class="artifacts-toolbar__block artifacts-toolbar__block--search">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="artifacts-toolbar__search"
              placeholder="Search artifacts..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <q-banner v-if="!loading && displayArtifactRows.length === 0" class="artifacts-empty-state bg-grey-2 text-black" rounded>
          <div class="row items-center justify-between">
            <div>No artifacts created yet.</div>
          </div>
        </q-banner>

        <div v-else-if="viewMode === 'grid'" class="row q-col-gutter-md artifacts-grid">
        <div
          v-for="group in displayArtifactGroups"
          :key="group.groupId"
          class="col-12 col-sm-6 col-lg-4"
        >
        <q-card
          flat
          bordered
          class="artifact-card full-height"
        >
          <q-card-section class="artifact-card__hero">
            <div class="artifact-card__hero-main">
              <figure class="artifact-card__portrait">
                <div class="artifact-card__portrait-shell" aria-hidden="true">
                  <div class="artifact-card__portrait-badge">
                    <q-icon name="description" size="24px" />
                  </div>
                </div>
              </figure>

              <div class="artifact-card__hero-side">
                <div class="artifact-card__hero-top">
                  <div class="artifact-card__hero-copy">
                    <div class="artifact-card__eyebrow">{{ formatGroupTypeLabel(group) }}</div>
                    <button
                      type="button"
                      class="artifact-card__title-button"
                      @click="void openArtifactForReview(group.previewArtifact)"
                    >
                      {{ group.primaryArtifact.title || artifactFileName(group.primaryArtifact) || 'Untitled artifact' }}
                    </button>
                    <div class="artifact-card__subtitle">
                      {{ getArtifactCardSubtitle(group) }}
                    </div>
                  </div>

                  <q-checkbox
                    :model-value="isSelected(group.primaryArtifact)"
                    :disable="loading || savingProperties"
                    color="dark"
                    @update:model-value="toggleRowSelection(group.primaryArtifact, $event)"
                  />
                </div>

                <div v-if="getArtifactCardPills(group).length" class="artifact-card__pill-row">
                  <q-badge
                    v-for="pill in getArtifactCardPills(group)"
                    :key="pill"
                    class="artifact-card__pill"
                  >
                    {{ pill }}
                  </q-badge>
                </div>

                <div class="artifact-card__quick-actions">
                  <q-btn
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="artifact-card__quick-action"
                    icon="visibility"
                    label="Preview"
                    :disable="loading"
                    @click="void openArtifactForReview(group.previewArtifact)"
                  />
                  <q-btn-dropdown
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="artifact-card__quick-action artifact-card__quick-action--dropdown"
                    icon="share"
                    label="Share"
                    :disable="loading"
                    dropdown-icon="keyboard_arrow_down"
                  >
                    <q-list dense style="min-width: 180px">
                      <q-item clickable v-close-popup @click="void shareArtifact(group.previewArtifact)">
                        <q-item-section avatar>
                          <q-icon name="folder_open" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Reveal in Folder</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="void downloadArtifact(group.previewArtifact)">
                        <q-item-section avatar>
                          <q-icon name="download" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>Download</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="artifact-card__quick-action"
                    :icon="artifactActionConfig(group.primaryArtifact).icon"
                    :label="artifactActionConfig(group.primaryArtifact).label"
                    :disable="loading || savingProperties"
                    @click="continueArtifactIntake(group.primaryArtifact)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="artifact-card__summary">
            <div class="artifact-card__summary-label">Highlights</div>

            <div class="artifact-card__details">
              <div
                v-for="detail in getArtifactCardDetails(group)"
                :key="detail.label"
                class="artifact-card__detail"
              >
                <q-icon :name="detail.icon" size="16px" class="artifact-card__detail-icon" />
                <div class="artifact-card__detail-copy">
                  <div class="artifact-card__detail-label">{{ detail.label }}</div>
                  <div class="artifact-card__detail-value">{{ detail.value }}</div>
                </div>
              </div>
            </div>

            <div
              v-if="group.primaryArtifact.description"
              class="artifact-card__description"
            >
              {{ group.primaryArtifact.description }}
            </div>
          </q-card-section>

          <q-card-actions class="artifact-card__footer">
            <div class="artifact-card__footer-actions">
              <q-btn
                flat
                round
                icon="visibility"
                class="artifact-card__icon-action"
                :disable="loading"
                title="Open artifact review"
                @click="void openArtifactForReview(group.previewArtifact)"
              />
            </div>

            <div class="artifact-card__footer-actions">
              <q-btn
                flat
                round
                icon="delete"
                class="artifact-card__icon-action"
                :disable="loading"
                title="Delete artifact"
                @click="confirmDelete(group.primaryArtifact)"
              />
            </div>
          </q-card-actions>
        </q-card>
        </div>
        </div>

        <q-table
          v-else
          class="artifacts-table"
          flat
          bordered
          row-key="artifact_id"
          v-model:selected="selectedRows"
          selection="multiple"
          :rows="displayArtifactRows"
          :columns="columns"
          :loading="loading"
          :pagination="{ rowsPerPage: 15 }"
        >
        <template #body-cell-opportunity_id="props">
          <q-td :props="props">
            <div class="column">
              <div>{{ resolveOpportunityLabel(props.row) }}</div>
              <div class="text-caption text-grey-6">{{ props.row.opportunity_id || 'Unlinked' }}</div>
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              round
              icon="visibility"
              color="primary"
              :disable="loading"
              @click="void openArtifactForReview(props.row)"
            />
            <q-btn
              dense
              flat
              round
              icon="tune"
              color="primary"
              :disable="loading || savingProperties"
              @click="void openPropertiesDialog(props.row)"
            />
            <q-btn
              dense
              flat
              round
              icon="delete"
              color="negative"
              :disable="loading"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
        </q-table>

        <div style="display: none">
          <TableCsvActions
            ref="csvActionsRef"
            filename-base="artifacts"
            :headers="csvHeaders"
            :rows="displayArtifactRows"
            :on-import-rows="importRows"
          />
        </div>
      </section>

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[36, 18]">
        <q-btn
          color="black"
          text-color="white"
          unelevated
          :disable="loading"
          label="Delete All"
          @click="confirmDeleteSelected"
        />
      </q-page-sticky>

      <q-dialog v-model="propertiesDialogOpen" persistent>
        <q-card style="width: 720px; max-width: 96vw">
          <q-card-section class="row items-start justify-between q-col-gutter-md">
            <div class="col">
              <div class="text-h6">Artifact Properties</div>
              <div class="text-caption text-grey-7">
                Review this artifact and manually adjust its linked opportunity when needed.
              </div>
            </div>
            <div class="col-auto text-caption text-grey-6">
              {{ artifactDisplayName(propertiesForm) || 'Artifact' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner v-if="propertiesError" class="bg-red-2 text-black q-mb-md" rounded>
              {{ propertiesError }}
            </q-banner>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input
                  v-model="propertiesForm.title"
                  outlined
                  dense
                  label="Title"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  :model-value="String(propertiesForm.artifact_type || '')"
                  outlined
                  dense
                  label="Artifact Type"
                  readonly
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.opportunity_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                  :options="opportunityOptions"
                  label="Linked Opportunity"
                  option-label="label"
                  option-value="value"
                  use-input
                  input-debounce="0"
                  @filter="filterOpportunityOptions"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  v-model="propertiesForm.artifact_format"
                  outlined
                  dense
                  label="Format"
                />
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-grey-7 q-mb-xs">Versions</div>
                <div class="artifact-properties__versions">
                  <q-chip
                    v-for="artifactType in propertiesForm.group_artifact_types"
                    :key="artifactType"
                    dense
                    square
                    color="grey-2"
                    text-color="grey-8"
                  >
                    {{ artifactType }}
                  </q-chip>
                  <span v-if="propertiesForm.group_artifact_types.length === 0" class="text-caption text-grey-6">
                    Artifact
                  </span>
                </div>
              </div>
              <div class="col-12">
                <q-input
                  v-model="propertiesForm.description"
                  outlined
                  type="textarea"
                  autogrow
                  label="Description"
                />
              </div>
              <div class="col-12">
                <div class="text-subtitle2 q-mb-sm">Relationships</div>
              </div>
              <div class="col-12 col-md-8">
                <q-select
                  v-model="propertiesForm.related_company_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="companyOptions"
                  label="Related Companies"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'company')"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="propertiesForm.company_document_type"
                  outlined
                  dense
                  clearable
                  :disable="propertiesForm.related_company_ids.length === 0"
                  :options="companyDocumentTypeOptions"
                  label="Company Document Type"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.related_industry_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="industryOptions"
                  label="Related Industries"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'industry')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.related_region_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="regionOptions"
                  label="Related Regions"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'region')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  :model-value="String(propertiesForm.fs_path || '')"
                  outlined
                  dense
                  label="File Path"
                  readonly
                >
                  <template #append>
                    <q-btn
                      flat
                      dense
                      round
                      icon="visibility"
                      :disable="!propertiesForm.artifact_id"
                      @click="void openArtifactForReview({ artifact_id: propertiesForm.artifact_id, fs_path: propertiesForm.fs_path, title: propertiesForm.title })"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  :model-value="String(propertiesForm.original_artifact_id || '')"
                  outlined
                  dense
                  label="Original Artifact"
                  readonly
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  :model-value="String(propertiesForm.created_at || '')"
                  outlined
                  dense
                  label="Created"
                  readonly
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" :disable="savingProperties" @click="closePropertiesDialog" />
            <q-btn
              color="primary"
              unelevated
              label="Save Properties"
              :loading="savingProperties"
              @click="saveArtifactProperties"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="previewDialogOpen" maximized @hide="closePreviewDialog">
        <q-card class="artifact-preview-dialog">
          <q-card-section class="row items-center justify-between q-col-gutter-md">
            <div class="col">
              <div class="text-h6">{{ previewState.fileName || 'Artifact preview' }}</div>
              <div class="text-caption text-grey-7">
                {{ previewLoading ? 'Loading preview...' : previewKindLabel }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                dense
                no-caps
                icon="right_panel_open"
                :label="previewSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'"
                @click="togglePreviewSidebar"
              />
              <q-btn flat round dense icon="close" @click="closePreviewDialog" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="artifact-preview-dialog__body artifact-preview-dialog__body--split">
            <div class="artifact-preview-dialog__main">
              <div v-if="previewLoading" class="artifact-preview-dialog__state">
                <q-spinner color="primary" size="40px" />
                <div class="text-subtitle2 q-mt-md">Loading artifact preview</div>
              </div>

              <iframe
                v-else-if="previewState.kind === 'pdf' && previewPdfSrc"
                :key="previewPdfSrc"
                :src="previewPdfSrc"
                class="artifact-preview-dialog__frame"
                title="Artifact PDF preview"
              />

              <img
                v-else-if="previewState.kind === 'image' && previewState.fileUrl"
                :src="previewState.fileUrl"
                :alt="previewState.fileName || 'Artifact preview'"
                class="artifact-preview-dialog__image"
              />

              <pre
                v-else-if="previewState.kind === 'text'"
                class="artifact-preview-dialog__text"
              ><code>{{ previewState.content || '' }}</code></pre>

              <div v-else class="artifact-preview-dialog__state">
                <q-icon name="description" size="40px" color="grey-5" />
                <div class="text-subtitle2 q-mt-md">Preview not available</div>
                <div class="text-caption text-grey-7 q-mt-sm">
                  Try Download if this artifact format does not support inline preview yet.
                </div>
              </div>
            </div>

            <aside v-if="previewSidebarOpen" class="artifact-preview-sidebar">
              <div class="artifact-preview-sidebar__section">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-subtitle2">Extraction Review</div>
                    <div class="text-caption text-grey-7">
                      Review by PDF page and see where the extracted data writes.
                    </div>
                  </div>
                  <div class="col-auto" v-if="showContinueDocumentReview">
                    <q-btn
                      color="primary"
                      outline
                      no-caps
                      :label="previewContinueActionConfig.label"
                      @click="continuePreviewDocumentReview"
                    />
                  </div>
                </div>
              </div>

              <div class="artifact-preview-sidebar__section">
                <div class="row items-center justify-between q-col-gutter-sm q-mb-sm">
                  <div class="col">
                    <div class="text-caption text-grey-7">Review Focus</div>
                    <div class="text-body2">{{ previewSelectedFocusClaim?.field_label || 'Connected data items' }}</div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      dense
                      round
                      :icon="previewFocusStripHidden ? 'visibility' : 'visibility_off'"
                      :aria-label="previewFocusStripHidden ? 'Show review focus' : 'Hide review focus'"
                      @click="void togglePreviewFocusSidebarSection()"
                    />
                  </div>
                </div>

                <div v-if="!previewFocusStripHidden" class="column q-gutter-sm">
                  <div v-if="previewFocusClaimRows.length" class="artifact-preview-sidebar__focus-chips">
                    <button
                      v-for="claim in previewFocusClaimRows"
                      :key="claim.claim_id"
                      type="button"
                      class="artifact-preview-dialog__focus-chip"
                      :class="{
                        'artifact-preview-dialog__focus-chip--active':
                          String(previewSelectedFocusClaimId || '') === String(claim.claim_id || ''),
                      }"
                      @click="selectPreviewFocusClaim(claim)"
                    >
                      {{ claim.field_label }}
                    </button>
                  </div>
                  <div v-else class="row items-center justify-between q-col-gutter-sm">
                    <div class="col text-caption text-grey-6">
                      No connected data items are loaded for this review yet.
                    </div>
                    <div class="col-auto">
                      <q-btn
                        flat
                        dense
                        no-caps
                        icon="restart_alt"
                        label="Load connected items"
                        @click="void ensurePreviewReviewDataLoaded({ force: true })"
                      />
                    </div>
                  </div>

                  <div v-if="previewSelectedFocusClaim" class="artifact-preview-sidebar__focus-card">
                    <div class="artifact-preview-sidebar__claim-title">{{ previewSelectedFocusClaim.field_label }}</div>
                    <div class="text-body2">{{ previewSelectedFocusClaim.field_value || 'No value' }}</div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ previewSelectedFocusClaim.owner_table || 'Draft Intake' }} • {{ previewSelectedFocusClaim.consumer_lane || 'Review' }}
                    </div>
                    <div class="text-caption text-blue-9 q-mt-xs">
                      Item box: {{ previewSelectedFocusClaim.item_box }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="previewState.kind === 'pdf' && previewPdfPageCount > 0" class="artifact-preview-sidebar__section">
                <div class="row items-center justify-between q-col-gutter-sm">
                  <div class="col-auto">
                    <q-btn
                      flat
                      dense
                      icon="chevron_left"
                      :disable="previewCurrentPage <= 1"
                      @click="setPreviewCurrentPage(previewCurrentPage - 1)"
                    />
                  </div>
                  <div class="col text-center">
                    <div class="text-caption text-grey-7">Page Review</div>
                    <div class="text-body2">Page {{ previewCurrentPage }} of {{ previewPdfPageCount }}</div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      dense
                      icon="chevron_right"
                      :disable="previewCurrentPage >= previewPdfPageCount"
                      @click="setPreviewCurrentPage(previewCurrentPage + 1)"
                    />
                  </div>
                </div>
                <div class="q-mt-sm">
                  <q-select
                    :model-value="previewCurrentPage"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="Jump to page"
                    :options="previewPageOptions"
                    @update:model-value="setPreviewCurrentPage"
                  />
                </div>
              </div>

              <div v-else-if="previewSectionOptions.length > 1" class="artifact-preview-sidebar__section">
                <q-select
                  v-model="previewSelectedSectionKey"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Slide / Section"
                  :options="previewSectionOptions"
                />
              </div>

              <div
                v-if="previewState.kind === 'pdf' && previewPdfPageCount <= 0"
                class="artifact-preview-sidebar__section"
              >
                <div class="text-caption text-grey-6">
                  Page-level mappings are not available for this file yet, so this review falls back to document-wide markdown.
                </div>
              </div>

              <div class="artifact-preview-sidebar__section">
                <div class="text-caption text-grey-7 q-mb-sm">Used data sections</div>
                <div v-if="previewUsedClaimRows.length" class="column q-gutter-sm">
                  <div
                    v-for="claim in previewUsedClaimRows"
                    :key="claim.claim_id"
                    class="artifact-preview-sidebar__claim"
                  >
                    <div class="artifact-preview-sidebar__claim-title">{{ claim.field_label }}</div>
                    <div class="text-body2">{{ claim.field_value || 'No value' }}</div>
                    <div class="text-caption text-grey-7">
                      {{ claim.owner_table || 'Draft Intake' }} • {{ claim.consumer_lane || 'Review' }}
                    </div>
                    <div class="text-caption text-blue-9 q-mt-xs">
                      Item box: {{ claim.item_box }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-caption text-grey-6">
                  No connected data items are available for this page yet.
                </div>
              </div>

              <div class="artifact-preview-sidebar__section artifact-preview-sidebar__section--grow">
                <div class="row items-center justify-between q-mb-sm">
                  <div class="text-caption text-grey-7">Markdown</div>
                  <q-chip
                    v-if="previewMarkdownSourceLabel"
                    dense
                    square
                    color="grey-2"
                    text-color="grey-8"
                  >
                    {{ previewMarkdownSourceLabel }}
                  </q-chip>
                </div>

                <div v-if="previewMarkdownLoading" class="artifact-preview-sidebar__state">
                  <q-spinner color="primary" size="20px" />
                  <span>Loading markdown...</span>
                </div>
                <div v-else-if="previewMarkdownError" class="text-caption text-negative">
                  {{ previewMarkdownError }}
                </div>
                <div v-else-if="previewSelectedMarkdownSection" class="column q-gutter-md">
                  <div
                    :key="previewSelectedMarkdownSection.key"
                    class="artifact-preview-sidebar__markdown-block"
                    :class="{ 'artifact-preview-sidebar__markdown-block--used': previewSelectedMarkdownSection.used }"
                  >
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-body2">{{ previewSelectedMarkdownSection.title }}</div>
                      <q-chip
                        v-if="previewSelectedMarkdownSection.used"
                        dense
                        square
                        color="amber-2"
                        text-color="amber-10"
                      >
                        Used
                      </q-chip>
                    </div>
                    <div
                      v-if="previewSelectedMarkdownSection.sourceTitle"
                      class="text-caption text-grey-7 q-mb-sm"
                    >
                      Source heading: {{ previewSelectedMarkdownSection.sourceTitle }}
                    </div>
                    <div v-if="previewSelectedMarkdownSection.ownedFields.length" class="q-mb-sm">
                      <q-chip
                        v-for="fieldKey in previewSelectedMarkdownSection.ownedFields"
                        :key="fieldKey"
                        dense
                        square
                        color="blue-1"
                        text-color="blue-9"
                        class="q-mr-xs q-mb-xs"
                      >
                        {{ fieldKey }}
                      </q-chip>
                    </div>
                    <pre class="artifact-preview-sidebar__markdown-text"><code>{{ previewSelectedMarkdownSection.text }}</code></pre>
                  </div>
                </div>
                <div v-else class="text-caption text-grey-6">
                  No markdown is available for this slide/section yet.
                </div>
              </div>
            </aside>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'
import { createIntakeDraft, useIntakeDraftState } from 'src/utils/intakeDraftState'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const intakeDraftState = useIntakeDraftState()
const hasBridge = computed(
  () =>
    !!bridge.value?.artifacts?.list &&
    !!bridge.value?.artifacts?.upsertMany &&
    !!bridge.value?.artifacts?.delete &&
    !!bridge.value?.db?.execute &&
    !!bridge.value?.db?.query,
)

const rows = ref([])
const opportunities = ref([])
const companies = ref([])
const industries = ref([])
const regions = ref([])
const filteredOpportunityOptions = ref([])
const filteredCompanyOptions = ref([])
const filteredIndustryOptions = ref([])
const filteredRegionOptions = ref([])
const artifactCompanyLinks = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const viewMode = ref('grid')
const artifactKindFilter = ref('all')
const companyFilter = ref('')
const opportunityFilter = ref('')
const projectFilter = ref('')
const typeFilter = ref('')
const searchQuery = ref('')
const previewDialogOpen = ref(false)
const previewLoading = ref(false)
const previewPdfObjectUrl = ref('')
const previewPdfPageCount = ref(0)
const previewSidebarOpen = ref(false)
const previewFocusStripHidden = ref(false)
const previewMarkdownLoading = ref(false)
const previewMarkdownError = ref('')
const previewMarkdownContent = ref('')
const previewMarkdownArtifactId = ref('')
const previewSelectedSectionKey = ref('')
const previewSelectedFocusClaimId = ref('')
const previewCurrentPage = ref(1)
const propertiesDialogOpen = ref(false)
const savingProperties = ref(false)
const propertiesError = ref('')
const propertiesForm = ref(createEmptyPropertiesForm())
const selectedCount = computed(() => selectedRows.value.length)
const previewState = ref(createEmptyPreviewState())
const csvActionsRef = ref(null)

const $q = useQuasar()
const ARTIFACTS_BREADCRUMB_ACTION_OWNER = 'artifacts-page'

const viewModeOptions = [
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const artifactKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'needs-review' },
  { label: 'Ready', value: 'ready' },
]

function continueArtifactIntake(row = {}) {
  const nextAction = artifactNextAction(row)
  if (nextAction === 'artifact-properties' || nextAction === 'ready') {
    void openPropertiesDialog(row)
    return
  }

  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId) {
    void openPropertiesDialog(row)
    return
  }

  createIntakeDraft({
    droppedFiles: [
      {
        name: artifactFileName(row) || String(row?.title || artifactId).trim(),
        path: String(row?.fs_path || '').trim() || null,
        size: 0,
      },
    ],
    opportunityId: String(row?.opportunity_id || '').trim() || null,
    stage: 'Quick Review Needed',
    resumeArtifactIds: [artifactId],
    resumeMode: 'existing-artifact-link',
    nextAction,
  })

  globalThis?.dispatchEvent?.(new Event('ecvc:open-artifact-dialog'))
}

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'artifact_type', label: 'Type', field: 'artifact_type', align: 'left', sortable: true },
  { name: 'artifact_format', label: 'Format', field: 'artifact_format', align: 'left', sortable: true },
  { name: 'opportunity_id', label: 'Opportunity', field: 'opportunity_id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'artifact_id',
  'original_artifact_id',
  'title',
  'artifact_type',
  'artifact_format',
  'type',
  'fs_path',
  'opportunity_id',
  'created_by',
  'created_at',
]

const companyDocumentTypeOptions = [
  'incorporation_certificate',
  'incorporation_articles',
  'company_bylaws',
  'intellectual_property',
  'yearly_statements',
  'quarterly_statements',
  'monthly_statements',
  'descriptive_materials',
]

const opportunityOptions = computed(() =>
  filteredOpportunityOptions.value.map((opportunity) => ({
    label: buildOpportunityOptionLabel(opportunity),
    value: opportunity.id,
  })),
)

const companyOptions = computed(() =>
  filteredCompanyOptions.value.map((company) => ({
    label: buildCompanyOptionLabel(company),
    value: String(company?.id || '').trim(),
  })),
)

const industryOptions = computed(() =>
  filteredIndustryOptions.value.map((industry) => ({
    label: String(industry?.Industry_Name || industry?.id || '').trim(),
    value: String(industry?.id || '').trim(),
  })),
)

const regionOptions = computed(() =>
  filteredRegionOptions.value.map((region) => ({
    label: String(region?.Name || region?.id || '').trim(),
    value: String(region?.id || '').trim(),
  })),
)

const latestArtifactGroups = computed(() =>
  groupArtifacts(rows.value)
    .sort((left, right) => parseDateValue(right.latestCreatedAt) - parseDateValue(left.latestCreatedAt))
    .slice(0, 12),
)

function normalizeArtifactFilterValue(value) {
  return String(value || '').trim()
}

function uniqueArtifactValues(values = []) {
  return [...new Set(values.map((value) => normalizeArtifactFilterValue(value)).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }))
}

function getArtifactCompanyIds(row = {}) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId) return []
  return artifactCompanyLinks.value
    .filter((entry) => String(entry?.artifact_id || '').trim() === artifactId)
    .map((entry) => String(entry?.company_id || '').trim())
    .filter(Boolean)
}

const companyFilterOptions = computed(() =>
  uniqueArtifactValues(
    rows.value.flatMap((row) =>
      getArtifactCompanyIds(row)
        .map((companyId) =>
          buildCompanyOptionLabel(
            companies.value.find((company) => String(company?.id || '').trim() === companyId),
          ),
        )
        .filter(Boolean),
    ),
  ),
)

const opportunityFilterOptions = computed(() =>
  uniqueArtifactValues(rows.value.map((row) => resolveOpportunityLabel(row))),
)

const projectFilterOptions = computed(() => [])

const typeFilterOptions = computed(() =>
  uniqueArtifactValues(rows.value.map((row) => row?.artifact_type)),
)

function matchesArtifactKind(row = {}) {
  if (artifactKindFilter.value === 'needs-review') return artifactNeedsAttention(row)
  if (artifactKindFilter.value === 'ready') return !artifactNeedsAttention(row)
  return true
}

function matchesArtifactFilters(row = {}, group = null) {
  if (!matchesArtifactKind(row)) return false

  if (companyFilter.value) {
    const companyLabels = getArtifactCompanyIds(row)
      .map((companyId) =>
        buildCompanyOptionLabel(
          companies.value.find((company) => String(company?.id || '').trim() === companyId),
        ),
      )
      .filter(Boolean)
    if (!companyLabels.includes(companyFilter.value)) return false
  }

  if (opportunityFilter.value && resolveOpportunityLabel(row) !== opportunityFilter.value) return false
  if (typeFilter.value && normalizeArtifactFilterValue(row?.artifact_type) !== typeFilter.value) return false

  const query = normalizeArtifactFilterValue(searchQuery.value).toLowerCase()
  if (!query) return true

  const haystack = [
    row?.title,
    row?.description,
    artifactDisplayName(row),
    artifactFileName(row),
    getArtifactCompanyIds(row)
      .map((companyId) =>
        buildCompanyOptionLabel(
          companies.value.find((company) => String(company?.id || '').trim() === companyId),
        ),
      )
      .filter(Boolean)
      .join(' '),
    resolveOpportunityLabel(row),
    row?.artifact_type,
    group?.versionSummary,
    group?.primaryArtifact?.title,
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ')

  return haystack.includes(query)
}

const displayArtifactRows = computed(() =>
  rows.value.filter((row) => matchesArtifactFilters(row)),
)

const displayArtifactGroups = computed(() =>
  latestArtifactGroups.value.filter((group) => matchesArtifactFilters(group.primaryArtifact, group)),
)

const artifactsDashboard = computed(() => {
  const total = rows.value.length
  const attentionCount = rows.value.filter((row) => artifactNeedsAttention(row)).length
  const readyCount = total - attentionCount
  const linkedCount = rows.value.filter((row) => normalizeArtifactFilterValue(row?.opportunity_id)).length
  const groupedCount = latestArtifactGroups.value.filter((group) => group.artifacts.length > 1).length
  const safeTotal = total || 1
  return {
    total,
    attentionCount,
    readyCount,
    linkedCount,
    groupedCount,
    readyRate: Math.round((readyCount / safeTotal) * 100),
    attentionShare: total ? (attentionCount / total) * 100 : 0,
    linkedShare: total ? (linkedCount / total) * 100 : 0,
    readyShare: total ? (readyCount / total) * 100 : 0,
  }
})

const artifactsHeroText = computed(() => {
  const { total, readyCount, attentionCount, linkedCount } = artifactsDashboard.value
  if (!total) {
    return 'Drop source files here to start review, linking, and artifact cleanup.'
  }
  return `${total} artifacts tracked, ${readyCount} ready, ${attentionCount} still need attention, and ${linkedCount} already linked into opportunities.`
})

const artifactsDashboardStats = computed(() => [
  {
    label: 'Total artifacts',
    value: artifactsDashboard.value.total,
    caption: 'Files tracked in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Ready',
    value: artifactsDashboard.value.readyCount,
    caption: 'No immediate review blockers',
    tone: 'rich',
  },
  {
    label: 'Linked',
    value: artifactsDashboard.value.linkedCount,
    caption: 'Already connected to an opportunity',
    tone: 'rich',
  },
  {
    label: 'Grouped',
    value: artifactsDashboard.value.groupedCount,
    caption: 'Have RAW and MD siblings together',
    tone: 'sparse',
  },
])

const previewPdfSrc = computed(() => {
  if (previewState.value.kind !== 'pdf') return ''
  const base =
    previewPdfObjectUrl.value ||
    previewState.value.fileUrl ||
    (previewState.value.fileDataBase64 ? `data:application/pdf;base64,${previewState.value.fileDataBase64}` : '')
  if (!base) return ''
  const page = Math.max(1, Number(previewCurrentPage.value || 1))
  return `${base}#page=${page}`
})

const previewKindLabel = computed(() => {
  if (previewState.value.kind === 'pdf') return 'PDF preview'
  if (previewState.value.kind === 'image') return 'Image preview'
  if (previewState.value.kind === 'text') return 'Text preview'
  return 'Artifact preview'
})

const previewArtifactGroup = computed(() => {
  const artifactId = String(previewState.value.artifactId || '').trim()
  if (!artifactId) return null
  return findArtifactGroup({ artifact_id: artifactId })
})

const previewReviewDraft = computed(() => {
  const previewArtifactIds = new Set(
    (previewArtifactGroup.value?.artifacts || [])
      .map((artifact) => String(artifact?.artifact_id || '').trim())
      .filter(Boolean),
  )
  if (!previewArtifactIds.size) return null

  return Object.values(intakeDraftState.drafts || {}).find((draft) => {
    const draftArtifactIds = [
      ...(Array.isArray(draft?.draftArtifactIds) ? draft.draftArtifactIds : []),
      ...(Array.isArray(draft?.resumeArtifactIds) ? draft.resumeArtifactIds : []),
      ...Object.values(draft?.releasedMarkdownChunks || {}).map((chunk) => chunk?.artifact_id),
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
    return draftArtifactIds.some((artifactId) => previewArtifactIds.has(artifactId))
  }) || null
})

const CONNECTED_CLAIM_OWNER_TABLES = new Set([
  'Companies',
  'Rounds',
  'Funds',
  'Contacts',
  'Tasks',
  'Projects',
  'Notes',
  'Artifacts',
  'Intros',
  'PipelineInvestmentProcess',
  'Regions',
  'Industries',
])

const NOISY_REVIEW_FIELD_KEYS = new Set([
  'documentType',
  'artifactTitle',
  'matchingDocumentName',
])

function isConnectedReviewClaim(claim = {}) {
  const fieldValue = String(claim?.field_value || '').trim()
  if (!fieldValue) return false

  const fieldKey = String(claim?.field_key || '').trim()
  if (NOISY_REVIEW_FIELD_KEYS.has(fieldKey)) return false

  const ownerTable = String(claim?.owner_table || '').trim()
  const consumerLane = String(claim?.consumer_lane || '').trim().toLowerCase()
  const itemBox = formatClaimItemBox(fieldKey)

  if (CONNECTED_CLAIM_OWNER_TABLES.has(ownerTable)) return true
  if (itemBox === 'Opportunity section') return true
  if (consumerLane === 'opportunity') return true
  return false
}

const previewConnectedClaimRows = computed(() => {
  const draft = previewReviewDraft.value
  const chunkIds = new Set(
    Object.values(draft?.releasedMarkdownChunks || {})
      .filter((chunk) => String(chunk?.artifact_id || '').trim() === previewMarkdownArtifactId.value)
      .map((chunk) => String(chunk?.chunk_id || '').trim())
      .filter(Boolean),
  )

  return (Array.isArray(draft?.usedMetadataClaims) ? draft.usedMetadataClaims : [])
    .filter((claim) => {
      const sourceChunkId = String(claim?.source_chunk_id || '').trim()
      return (!chunkIds.size || chunkIds.has(sourceChunkId)) && isConnectedReviewClaim(claim)
    })
    .map((claim) => ({
      ...claim,
      field_label: formatClaimFieldLabel(claim?.field_key),
      item_box: formatClaimItemBox(claim?.field_key),
    }))
})

const previewUsedClaimRows = computed(() => {
  if (previewState.value.kind === 'pdf') {
    const sourceChunkIds = Array.isArray(previewSelectedMarkdownSection.value?.sourceChunkIds)
      ? previewSelectedMarkdownSection.value.sourceChunkIds.map((value) => String(value || '').trim()).filter(Boolean)
      : []
    if (!sourceChunkIds.length) return []
    const sourceChunkIdSet = new Set(sourceChunkIds)
    return previewConnectedClaimRows.value.filter((claim) =>
      sourceChunkIdSet.has(String(claim?.source_chunk_id || '').trim()),
    )
  }
  if (!previewSelectedSectionKey.value) return previewConnectedClaimRows.value
  return previewConnectedClaimRows.value.filter(
    (claim) => String(claim?.source_chunk_id || '').trim() === String(previewSelectedSectionKey.value || '').trim(),
  )
})

const previewMarkdownSourceLabel = computed(() => {
  const artifact = (previewArtifactGroup.value?.artifacts || []).find(
    (entry) => String(entry?.artifact_id || '').trim() === previewMarkdownArtifactId.value,
  )
  const artifactType = String(artifact?.artifact_type || '').trim()
  return artifactType ? artifactType.toUpperCase() : ''
})

const previewMarkdownSections = computed(() => {
  const chunkMap = previewReviewDraft.value?.releasedMarkdownChunks || {}
  const chunkRows = Object.values(chunkMap)
    .filter((chunk) => String(chunk?.artifact_id || '').trim() === previewMarkdownArtifactId.value)
    .sort((left, right) => String(left?.created_at || '').localeCompare(String(right?.created_at || '')))

  const hasStructuredChunkSections = chunkRows.some((chunk) => {
    const pageRange = String(chunk?.source_page_range || '').trim()
    const markdownText = String(chunk?.markdown_text || '').trim()
    return Boolean(pageRange || markdownText)
  })

  if (previewState.value.kind === 'pdf' && previewPdfPageCount.value > 0) {
    return buildPdfPageSections({
      artifactId: previewMarkdownArtifactId.value || 'markdown',
      pageCount: previewPdfPageCount.value,
      chunkRows,
      markdown: previewMarkdownContent.value,
      usedClaims: previewConnectedClaimRows.value,
    })
  }

  if (chunkRows.length && hasStructuredChunkSections) {
    return chunkRows.map((chunk, index) => ({
      key: String(chunk?.chunk_id || `chunk:${index}`),
      title: formatPreviewSectionTitle(chunk, index),
      text: String(chunk?.markdown_text || '').trim() || previewMarkdownContent.value || 'Markdown text not stored for this chunk yet.',
      used:
        Array.isArray(chunk?.used_by) && chunk.used_by.length > 0
          ? true
          : previewConnectedClaimRows.value.some(
              (claim) => String(claim?.source_chunk_id || '').trim() === String(chunk?.chunk_id || '').trim(),
            ),
      ownedFields: Array.isArray(chunk?.owned_fields) ? chunk.owned_fields.filter(Boolean) : [],
      sourceChunkIds: [String(chunk?.chunk_id || `chunk:${index}`)],
    }))
  }

  if (!previewMarkdownContent.value.trim()) return []
  return derivePreviewSectionsFromMarkdown(previewMarkdownContent.value, {
    artifactId: previewMarkdownArtifactId.value,
    isPdf: false,
    usedClaims: previewConnectedClaimRows.value,
  })
})

const previewSectionOptions = computed(() =>
  previewMarkdownSections.value.map((section) => ({
    label: section.title,
    value: section.key,
  })),
)

const previewPageOptions = computed(() =>
  Array.from({ length: Math.max(0, Number(previewPdfPageCount.value || 0)) }, (_, index) => ({
    label: `Page ${index + 1}`,
    value: index + 1,
  })),
)

const previewSelectedMarkdownSection = computed(() => {
  if (!previewMarkdownSections.value.length) return null
  if (previewState.value.kind === 'pdf') {
    const page = Math.max(1, Math.min(Number(previewCurrentPage.value || 1), previewMarkdownSections.value.length))
    return previewMarkdownSections.value[page - 1] || null
  }
  const selectedKey = String(previewSelectedSectionKey.value || '').trim()
  return (
    previewMarkdownSections.value.find((section) => section.key === selectedKey) ||
    previewMarkdownSections.value[0]
  )
})

const previewFocusClaimRows = computed(() => {
  const seen = new Set()
  return previewConnectedClaimRows.value.filter((claim) => {
    const key = `${String(claim?.field_key || '').trim()}::${String(claim?.field_value || '').trim()}`
    if (!key.trim() || seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const previewSelectedFocusClaim = computed(() => {
  const selectedId = String(previewSelectedFocusClaimId.value || '').trim()
  return (
    previewFocusClaimRows.value.find((claim) => String(claim?.claim_id || '').trim() === selectedId) ||
    previewFocusClaimRows.value[0] ||
    null
  )
})

const previewPrimaryArtifact = computed(() => previewArtifactGroup.value?.primaryArtifact || null)

const showContinueDocumentReview = computed(
  () =>
    Boolean(previewPrimaryArtifact.value?.artifact_id) &&
    !previewMarkdownLoading.value &&
    (!previewSelectedMarkdownSection.value || !previewUsedClaimRows.value.length),
)

const previewContinueActionConfig = computed(() =>
  artifactActionConfig(previewPrimaryArtifact.value || {}),
)

async function loadArtifacts() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.artifacts.list()
    rows.value = result?.artifacts || []
    normalizeSelectedRows()
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
    normalizeSelectedRows()
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.artifacts.upsertMany(importedRows)
  await loadArtifacts()
  return result
}

async function loadOpportunities() {
  if (!bridge.value?.opportunities?.list) {
    opportunities.value = []
    filteredOpportunityOptions.value = []
    return
  }

  try {
    const result = await bridge.value.opportunities.list()
    opportunities.value = Array.isArray(result?.opportunities) ? result.opportunities : []
    filteredOpportunityOptions.value = [...opportunities.value]
  } catch {
    opportunities.value = []
    filteredOpportunityOptions.value = []
  }
}

async function loadRelationshipOptions() {
  await Promise.all([loadCompanies(), loadIndustries(), loadRegions(), loadArtifactCompanyLinks()])
}

async function loadCompanies() {
  if (!bridge.value?.companies?.list) {
    companies.value = []
    filteredCompanyOptions.value = []
    return
  }

  try {
    const result = await bridge.value.companies.list()
    companies.value = Array.isArray(result?.companies) ? result.companies : []
    filteredCompanyOptions.value = [...companies.value]
  } catch {
    companies.value = []
    filteredCompanyOptions.value = []
  }
}

async function loadIndustries() {
  if (!bridge.value?.db?.query) {
    industries.value = []
    filteredIndustryOptions.value = []
    return
  }

  try {
    const rows = await bridge.value.db.query(
      `
      SELECT id, Industry_Name
      FROM Industries
      ORDER BY COALESCE(Industry_Name, id), id
    `,
    )
    industries.value = Array.isArray(rows) ? rows : []
    filteredIndustryOptions.value = [...industries.value]
  } catch {
    industries.value = []
    filteredIndustryOptions.value = []
  }
}

async function loadRegions() {
  if (!bridge.value?.db?.query) {
    regions.value = []
    filteredRegionOptions.value = []
    return
  }

  try {
    const rows = await bridge.value.db.query(
      `
      SELECT id, Name
      FROM Regions
      ORDER BY COALESCE(Name, id), id
    `,
    )
    regions.value = Array.isArray(rows) ? rows : []
    filteredRegionOptions.value = [...regions.value]
  } catch {
    regions.value = []
    filteredRegionOptions.value = []
  }
}

function normalizeSelectedRows() {
  const activeIds = new Set(displayArtifactRows.value.map((row) => row.artifact_id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.artifact_id))
}

function isSelected(row) {
  const rowId = String(row?.artifact_id || '').trim()
  if (!rowId) return false
  return selectedRows.value.some((selectedRow) => String(selectedRow?.artifact_id || '').trim() === rowId)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = String(row?.artifact_id || '').trim()
  if (!rowId) return
  if (shouldSelect) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }
  selectedRows.value = selectedRows.value.filter(
    (selectedRow) => String(selectedRow?.artifact_id || '').trim() !== rowId,
  )
}

function parseDateValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return 0
  const parsed = Date.parse(raw.replace(' ', 'T'))
  return Number.isNaN(parsed) ? 0 : parsed
}

function artifactGroupKey(row = {}) {
  return String(row?.original_artifact_id || row?.artifact_id || '').trim()
}

function compareArtifactPriority(left = {}, right = {}) {
  const priority = {
    'llm-ready': 0,
    raw: 1,
    'llm-generated': 2,
  }
  const leftPriority = priority[String(left?.artifact_type || '').trim().toLowerCase()] ?? 99
  const rightPriority = priority[String(right?.artifact_type || '').trim().toLowerCase()] ?? 99
  if (leftPriority !== rightPriority) return leftPriority - rightPriority
  return parseDateValue(right?.created_at) - parseDateValue(left?.created_at)
}

function resolveMetadataArtifact(group = []) {
  return [...group].sort(compareArtifactPriority)[0] || {}
}

function resolvePreviewArtifact(group = []) {
  return (
    group.find((artifact) => String(artifact?.artifact_type || '').trim().toLowerCase() === 'raw') ||
    resolveMetadataArtifact(group)
  )
}

function groupArtifacts(items = []) {
  const grouped = new Map()
  for (const item of items) {
    const key = artifactGroupKey(item)
    if (!key) continue
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(item)
  }

  return [...grouped.entries()].map(([groupId, artifacts]) => {
    const sortedArtifacts = [...artifacts].sort(compareArtifactPriority)
    const primaryArtifact = resolveMetadataArtifact(sortedArtifacts)
    const previewArtifact = resolvePreviewArtifact(sortedArtifacts)
    const latestCreatedAt = sortedArtifacts.reduce((latest, artifact) => {
      return parseDateValue(artifact?.created_at) > parseDateValue(latest) ? artifact?.created_at || '' : latest
    }, '')
    const versionSummary = sortedArtifacts
      .map((artifact) => String(artifact?.artifact_type || 'artifact').trim().toUpperCase())
      .filter(Boolean)
      .join(' / ')

    return {
      groupId,
      artifacts: sortedArtifacts,
      primaryArtifact,
      previewArtifact,
      latestCreatedAt,
      versionSummary: versionSummary || 'ARTIFACT',
    }
  })
}

function findArtifactGroup(row = {}) {
  const key = artifactGroupKey(row)
  if (!key) return null
  return groupArtifacts(rows.value).find((group) => group.groupId === key) || null
}

function formatGroupTypeLabel(group = {}) {
  const primaryType = String(group?.primaryArtifact?.artifact_type || '').trim()
  if (primaryType) return primaryType
  if ((group?.artifacts || []).length > 1) return 'artifact set'
  return 'artifact'
}

function getArtifactCardSubtitle(group = {}) {
  const displayName =
    artifactDisplayName(group?.previewArtifact) || artifactDisplayName(group?.primaryArtifact) || 'Document'
  const title = String(group?.primaryArtifact?.title || '').trim()
  if (displayName && displayName !== title) return displayName
  const format = String(group?.primaryArtifact?.artifact_format || '').trim()
  return format ? `${group?.versionSummary || 'Single version'} • ${format}` : group?.versionSummary || 'Document'
}

function getArtifactCardPills(group = {}) {
  return [
    artifactStatusLabel(group?.primaryArtifact),
    String(group?.primaryArtifact?.artifact_format || '').trim(),
    group?.artifacts?.length > 1 ? group.versionSummary : '',
  ].filter(Boolean)
}

function getArtifactCardDetails(group = {}) {
  return [
    {
      label: 'Opportunity',
      value: resolveOpportunityLabel(group?.primaryArtifact),
      icon: 'schema',
    },
    {
      label: 'Created',
      value: formatArtifactDate(group?.latestCreatedAt),
      icon: 'schedule',
    },
    {
      label: 'Format',
      value: String(group?.primaryArtifact?.artifact_format || 'Unknown').trim(),
      icon: 'description',
    },
    {
      label: 'Versions',
      value: String(group?.versionSummary || 'Single version').trim(),
      icon: 'layers',
    },
  ]
}

function createEmptyPropertiesForm() {
  return {
    artifact_id: '',
    title: '',
    artifact_type: '',
    artifact_format: '',
    type: '',
    opportunity_id: null,
    description: '',
    group_artifact_ids: [],
    group_artifact_types: [],
    related_company_ids: [],
    company_document_type: null,
    related_industry_ids: [],
    related_region_ids: [],
    fs_path: '',
    original_artifact_id: '',
    created_at: '',
  }
}

function buildOpportunityOptionLabel(opportunity = {}) {
  const name = String(opportunity?.opportunity_name || opportunity?.Venture_Oppty_Name || 'Untitled opportunity').trim()
  const kind = String(opportunity?.kind || 'opportunity').trim()
  const company = String(opportunity?.Company_Name || '').trim()
  return company ? `${name} (${kind} • ${company})` : `${name} (${kind})`
}

function resolveOpportunityLabel(row = {}) {
  const opportunityId = String(row?.opportunity_id || '').trim()
  if (!opportunityId) return 'Unlinked'
  const match = opportunities.value.find((opportunity) => String(opportunity?.id || '').trim() === opportunityId)
  return match ? buildOpportunityOptionLabel(match) : opportunityId
}

function buildCompanyOptionLabel(company = {}) {
  const name = String(company?.Company_Name || '').trim()
  const type = String(company?.Company_Type || '').trim()
  return type ? `${name} (${type})` : name || String(company?.id || '').trim()
}

function artifactFileName(row = {}) {
  const fsPath = String(row?.fs_path || '').trim()
  if (!fsPath) return ''
  return fsPath.split(/[\\/]/).pop() || ''
}

function looksLikeUuid(value = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim(),
  )
}

function artifactBaseName(row = {}) {
  const fileName = artifactFileName(row)
  if (!fileName) return ''
  return fileName.replace(/\.[^.]+$/, '').trim()
}

function artifactDisplayName(row = {}) {
  const title = String(row?.title || '').trim()
  if (title && !looksLikeUuid(title)) return title
  return artifactBaseName(row) || artifactFileName(row)
}

function formatArtifactDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unknown'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString()
}

function artifactNeedsAttention(row = {}) {
  return artifactNextAction(row) !== 'ready'
}

function artifactNextAction(row = {}) {
  const title = String(row?.title || '').trim()
  const description = String(row?.description || '').trim()
  const opportunityId = String(row?.opportunity_id || '').trim()

  if (!title || !description) return 'artifact-properties'
  if (!opportunityId) return 'link-opportunity'
  return 'ready'
}

function artifactStatusLabel(row = {}) {
  const nextAction = artifactNextAction(row)
  if (nextAction === 'artifact-properties') return 'Needs properties'
  if (nextAction === 'link-opportunity') return 'Needs opportunity link'
  return 'Ready'
}

function artifactActionConfig(row = {}) {
  const nextAction = artifactNextAction(row)
  if (nextAction === 'artifact-properties') return { icon: 'tune', label: 'Fix Properties', iconOnly: true }
  if (nextAction === 'link-opportunity') return { icon: 'link', label: 'Link Opportunity', iconOnly: false }
  return { icon: 'tune', label: 'Open Properties', iconOnly: true }
}

function filterOpportunityOptions(value, update) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    if (!search) {
      filteredOpportunityOptions.value = [...opportunities.value]
      return
    }

    filteredOpportunityOptions.value = opportunities.value.filter((opportunity) => {
      const haystack = [
        opportunity?.opportunity_name,
        opportunity?.Venture_Oppty_Name,
        opportunity?.Company_Name,
        opportunity?.kind,
        opportunity?.id,
      ]
        .map((part) => String(part || '').toLowerCase())
        .join(' ')
      return haystack.includes(search)
    })
  })
}

function filterSelectableOptions(value, update, type) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    const configByType = {
      company: {
        source: companies.value,
        assign: (items) => {
          filteredCompanyOptions.value = items
        },
        fields: ['id', 'Company_Name', 'Company_Type', 'Website'],
      },
      industry: {
        source: industries.value,
        assign: (items) => {
          filteredIndustryOptions.value = items
        },
        fields: ['id', 'Industry_Name'],
      },
      region: {
        source: regions.value,
        assign: (items) => {
          filteredRegionOptions.value = items
        },
        fields: ['id', 'Name'],
      },
    }

    const config = configByType[type]
    if (!config) return
    if (!search) {
      config.assign([...config.source])
      return
    }

    config.assign(
      config.source.filter((item) =>
        config.fields
          .map((field) => String(item?.[field] || '').toLowerCase())
          .join(' ')
          .includes(search),
      ),
    )
  })
}

async function openPropertiesDialog(row) {
  propertiesError.value = ''
  filteredOpportunityOptions.value = [...opportunities.value]
  filteredCompanyOptions.value = [...companies.value]
  filteredIndustryOptions.value = [...industries.value]
  filteredRegionOptions.value = [...regions.value]
  const artifactGroup = findArtifactGroup(row)
  const nextForm = {
    artifact_id: String(row?.artifact_id || ''),
    title: String(row?.title || ''),
    artifact_type: String(row?.artifact_type || ''),
    artifact_format: String(row?.artifact_format || ''),
    type: String(row?.type || ''),
    opportunity_id: String(row?.opportunity_id || '').trim() || null,
    description: '',
    group_artifact_ids:
      artifactGroup?.artifacts?.map((artifact) => String(artifact?.artifact_id || '').trim()).filter(Boolean) || [],
    group_artifact_types:
      artifactGroup?.artifacts
        ?.map((artifact) => String(artifact?.artifact_type || '').trim().toUpperCase())
        .filter(Boolean) || [],
    related_company_ids: [],
    company_document_type: null,
    related_industry_ids: [],
    related_region_ids: [],
    fs_path: String(row?.fs_path || ''),
    original_artifact_id: String(row?.original_artifact_id || ''),
    created_at: String(row?.created_at || ''),
  }

  if (bridge.value?.db?.query && nextForm.artifact_id) {
    try {
      const [detailRows, companyRows, industryRows, regionRows] = await Promise.all([
        bridge.value.db.query(
          `
          SELECT description
          FROM Artifact_Details
          WHERE artifact_id = ?
          LIMIT 1
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT cad.company_id, ca.document_type
          FROM Companies_Artifacts_documents cad
          LEFT JOIN Company_Artifacts ca ON ca.artifact_id = cad.artifact_id
          WHERE cad.artifact_id = ?
          ORDER BY cad.company_id
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT industry_id
          FROM Artifacts_Industries
          WHERE artifact_id = ?
          ORDER BY industry_id
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT region_id
          FROM Artifacts_Regions
          WHERE artifact_id = ?
          ORDER BY region_id
        `,
          [nextForm.artifact_id],
        ),
      ])
      const detail = Array.isArray(detailRows) ? detailRows[0] : null
      nextForm.description = String(detail?.description || '')
      const companyLinks = Array.isArray(companyRows) ? companyRows : []
      nextForm.related_company_ids = companyLinks
        .map((entry) => String(entry?.company_id || '').trim())
        .filter(Boolean)
      nextForm.company_document_type = String(companyLinks[0]?.document_type || '').trim() || null
      nextForm.related_industry_ids = (Array.isArray(industryRows) ? industryRows : [])
        .map((entry) => String(entry?.industry_id || '').trim())
        .filter(Boolean)
      nextForm.related_region_ids = (Array.isArray(regionRows) ? regionRows : [])
        .map((entry) => String(entry?.region_id || '').trim())
        .filter(Boolean)
    } catch {
      // Keep the dialog usable even if the detail lookup fails.
    }
  }

  propertiesForm.value = nextForm
  propertiesDialogOpen.value = true
}

function closePropertiesDialog() {
  if (savingProperties.value) return
  propertiesDialogOpen.value = false
  propertiesError.value = ''
  propertiesForm.value = createEmptyPropertiesForm()
}

async function saveArtifactProperties() {
  if (!bridge.value?.db?.execute) return

  const artifactId = String(propertiesForm.value.artifact_id || '').trim()
  if (!artifactId) {
    propertiesError.value = 'Artifact ID is missing.'
    return
  }

  const targetArtifactIds = [
    ...new Set(
      (propertiesForm.value.group_artifact_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  if (targetArtifactIds.length === 0) targetArtifactIds.push(artifactId)

  const opportunityId = String(propertiesForm.value.opportunity_id || '').trim()
  const roundId = opportunityId && !opportunityId.startsWith('fund:') ? opportunityId : null
  const fundId = opportunityId && opportunityId.startsWith('fund:') ? opportunityId : null
  const relatedCompanyIds = [
    ...new Set(
      (propertiesForm.value.related_company_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const relatedIndustryIds = [
    ...new Set(
      (propertiesForm.value.related_industry_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const relatedRegionIds = [
    ...new Set(
      (propertiesForm.value.related_region_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const companyDocumentType = String(propertiesForm.value.company_document_type || '').trim() || null

  if (relatedCompanyIds.length > 0 && !companyDocumentType) {
    propertiesError.value = 'Company Document Type is required when Related Companies are selected.'
    return
  }

  savingProperties.value = true
  propertiesError.value = ''
  try {
    for (const targetArtifactId of targetArtifactIds) {
      await bridge.value.db.execute(
        `
        UPDATE Artifacts
        SET
          round_id = ?,
          fund_id = ?,
          title = ?,
          description = ?,
          artifact_format = ?,
          updated_at = datetime('now')
        WHERE artifact_id = ?
      `,
        [
          roundId,
          fundId,
          String(propertiesForm.value.title || '').trim() || null,
          String(propertiesForm.value.description || '').trim() || null,
          String(propertiesForm.value.artifact_format || '').trim().toLowerCase() || null,
          targetArtifactId,
        ],
      )

      await bridge.value.db.execute('DELETE FROM Companies_Artifacts_documents WHERE artifact_id = ?', [
        targetArtifactId,
      ])
      if (relatedCompanyIds.length > 0) {
        await bridge.value.db.execute(
          `
          INSERT INTO Company_Artifacts (artifact_id, document_type)
          VALUES (?, ?)
          ON CONFLICT(artifact_id) DO UPDATE SET
            document_type = excluded.document_type
        `,
          [targetArtifactId, companyDocumentType],
        )

        for (const companyId of relatedCompanyIds) {
          await bridge.value.db.execute(
            'INSERT OR IGNORE INTO Companies_Artifacts_documents (company_id, artifact_id) VALUES (?, ?)',
            [companyId, targetArtifactId],
          )
        }
      } else {
        await bridge.value.db.execute('DELETE FROM Company_Artifacts WHERE artifact_id = ?', [targetArtifactId])
      }

      await bridge.value.db.execute('DELETE FROM Artifacts_Industries WHERE artifact_id = ?', [targetArtifactId])
      for (const industryId of relatedIndustryIds) {
        await bridge.value.db.execute(
          'INSERT OR IGNORE INTO Artifacts_Industries (artifact_id, industry_id) VALUES (?, ?)',
          [targetArtifactId, industryId],
        )
      }

      await bridge.value.db.execute('DELETE FROM Artifacts_Regions WHERE artifact_id = ?', [targetArtifactId])
      for (const regionId of relatedRegionIds) {
        await bridge.value.db.execute(
          'INSERT OR IGNORE INTO Artifacts_Regions (artifact_id, region_id) VALUES (?, ?)',
          [targetArtifactId, regionId],
        )
      }
    }

    await loadArtifacts()
    propertiesDialogOpen.value = false
    $q.notify({ type: 'positive', message: 'Artifact properties updated.' })
  } catch (e) {
    propertiesError.value = e?.message || String(e)
  } finally {
    savingProperties.value = false
  }
}

async function previewArtifact(row, options = {}) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.preview) return ''
  const silent = Boolean(options?.silent)
  try {
    previewDialogOpen.value = true
    previewLoading.value = true
    resetPreviewPdfObjectUrl()
    previewPdfPageCount.value = 0
    previewState.value = createEmptyPreviewState()
    const preview = await bridge.value.artifacts.preview({ artifactId })
    previewState.value = {
      artifactId,
      fileName: String(row?.title || artifactDisplayName(row) || preview?.fileName || '').trim(),
      kind: String(preview?.kind || '').trim(),
      fileUrl: String(preview?.fileUrl || '').trim(),
      fileDataBase64: String(preview?.fileDataBase64 || ''),
      content: String(preview?.content || ''),
    }
    if (previewState.value.kind === 'pdf' && previewState.value.fileDataBase64) {
      previewPdfObjectUrl.value = buildPdfObjectUrl(previewState.value.fileDataBase64)
      previewPdfPageCount.value = await resolvePdfPageCount(previewState.value.fileDataBase64)
    }
    if (previewSidebarOpen.value) {
      await loadPreviewReviewSidebar(artifactId)
    }
    return previewState.value.kind
  } catch (e) {
    previewDialogOpen.value = false
    if (!silent) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    }
    return ''
  } finally {
    previewLoading.value = false
  }
}

async function loadArtifactCompanyLinks() {
  if (!bridge.value?.db?.query) {
    artifactCompanyLinks.value = []
    return
  }

  try {
    const rows = await bridge.value.db.query(
      `
      SELECT artifact_id, company_id
      FROM Companies_Artifacts_documents
      ORDER BY artifact_id, company_id
    `,
    )
    artifactCompanyLinks.value = Array.isArray(rows) ? rows : []
  } catch {
    artifactCompanyLinks.value = []
  }
}

function formatClaimFieldLabel(fieldKey = '') {
  const raw = String(fieldKey || '').trim()
  if (!raw) return 'Field'
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (value) => value.toUpperCase())
}

function formatClaimItemBox(fieldKey = '') {
  return {
    sponsorCompany: 'Company section',
    existingOpportunityMatch: 'Opportunity section',
    matchingDocumentName: 'Artifact intake',
    documentType: 'Artifact metadata',
    artifactTitle: 'Artifact title',
    relatedFund: 'Opportunity section',
    relatedRound: 'Opportunity section',
    relatedContact: 'Primary Contact section',
    website: 'Company section',
  }[String(fieldKey || '').trim()] || 'Dialog review'
}

function selectPreviewFocusClaim(claim = {}) {
  previewSelectedFocusClaimId.value = String(claim?.claim_id || '').trim()
  const sourceChunkId = String(claim?.source_chunk_id || '').trim()
  if (previewState.value.kind === 'pdf') {
    const match =
      sourceChunkId.match(/:slide:(\d+)$/i) ||
      sourceChunkId.match(/:page:(\d+)$/i) ||
      String(claim?.field_label || '').match(/\b(\d+)\b/)
    if (match?.[1]) {
      setPreviewCurrentPage(Number(match[1]))
      return
    }
  }
  if (sourceChunkId) {
    previewSelectedSectionKey.value = sourceChunkId
  }
}

function setPreviewCurrentPage(value) {
  const nextPage = Math.max(1, Math.min(Number(previewPdfPageCount.value || 1), Number(value || 1)))
  previewCurrentPage.value = nextPage
}

function formatPreviewSectionTitle(chunk = {}, index = 0) {
  const pageRange = String(chunk?.source_page_range || '').trim()
  if (pageRange) {
    if (pageRange.includes('-')) return `Slides ${pageRange}`
    return `Slide ${pageRange}`
  }
  const sectionHint = String(chunk?.section_hint || '').trim()
  return sectionHint || `Section ${index + 1}`
}

function expandPageRange(pageRange = '') {
  const normalized = String(pageRange || '').trim()
  if (!normalized) return []
  const values = []
  for (const part of normalized.split(',')) {
    const token = String(part || '').trim()
    if (!token) continue
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      if (start > 0 && end >= start) {
        for (let page = start; page <= end; page += 1) values.push(page)
      }
      continue
    }
    const page = Number(token)
    if (page > 0) values.push(page)
  }
  return [...new Set(values)]
}

function parseMarkdownPageSections(markdown = '', totalPages = 0) {
  const content = String(markdown || '').replaceAll('\r\n', '\n').trim()
  const sections = new Map()
  if (!content || totalPages <= 0) return sections

  const lines = content.split('\n')
  let currentPage = null
  let currentTitle = ''
  let buffer = []

  const commit = () => {
    if (!currentPage || currentPage < 1 || currentPage > totalPages) return
    const text = buffer.join('\n').trim()
    if (!text) return
    sections.set(currentPage, {
      text,
      title: currentTitle || `Page ${currentPage}`,
    })
  }

  for (const line of lines) {
    const trimmed = String(line || '').trim()
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/)
    const candidate = headingMatch ? String(headingMatch[1] || '').trim() : trimmed
    const pageMatch =
      candidate.match(/\b(?:slide|page)\s+(\d+)\b(?:\s*[:-]\s*(.+))?$/i) ||
      candidate.match(/^(\d+)\s*[-:.]\s*(.+)$/)

    if (pageMatch) {
      commit()
      currentPage = Number(pageMatch[1])
      currentTitle = String(pageMatch[2] || '').trim()
      buffer = [line]
      continue
    }

    if (currentPage) {
      buffer.push(line)
    }
  }

  commit()
  return sections
}

function buildPdfPageSections({ artifactId = '', pageCount = 0, chunkRows = [], markdown = '', usedClaims = [] } = {}) {
  const totalPages = Math.max(0, Number(pageCount || 0))
  if (!totalPages) return []

  const pages = Array.from({ length: totalPages }, (_, index) => ({
    key: `${artifactId}:page:${index + 1}`,
    title: `Page ${index + 1}`,
    text: '',
    sourceTitle: `Page ${index + 1}`,
    used: false,
    ownedFields: [],
    sourceChunkIds: [],
  }))

  const fallbackMarkdownSections = parseMarkdownPageSections(markdown, totalPages)

  for (const chunk of chunkRows) {
    const chunkId = String(chunk?.chunk_id || '').trim()
    const pageNumbers = expandPageRange(chunk?.source_page_range)
    if (!pageNumbers.length) continue
    for (const pageNumber of pageNumbers) {
      const page = pages[pageNumber - 1]
      if (!page) continue
      if (chunkId) page.sourceChunkIds.push(chunkId)
      const chunkText = String(chunk?.markdown_text || '').trim()
      if (chunkText) {
        page.text = page.text ? `${page.text}\n\n${chunkText}` : chunkText
      }
      const chunkFields = Array.isArray(chunk?.owned_fields) ? chunk.owned_fields.filter(Boolean) : []
      if (chunkFields.length) {
        page.ownedFields = [...new Set([...page.ownedFields, ...chunkFields])]
      }
      const sectionHint = String(chunk?.section_hint || '').trim()
      if (sectionHint) {
        page.sourceTitle = sectionHint
        page.title = `Page ${pageNumber} - ${sectionHint}`
      }
      if (Array.isArray(chunk?.used_by) && chunk.used_by.length > 0) {
        page.used = true
      }
    }
  }

  for (const [pageNumber, section] of fallbackMarkdownSections.entries()) {
    const page = pages[pageNumber - 1]
    if (!page) continue
    if (!page.text.trim()) {
      page.text = String(section?.text || '').trim()
    }
    const title = String(section?.title || '').trim()
    if (title) {
      page.sourceTitle = title
      page.title = `Page ${pageNumber} - ${title}`
    }
  }

  for (const claim of usedClaims) {
    const sourceChunkId = String(claim?.source_chunk_id || '').trim()
    if (!sourceChunkId) continue
    for (const page of pages) {
      if (!page.sourceChunkIds.includes(sourceChunkId)) continue
      page.used = true
      if (claim?.field_key) {
        page.ownedFields = [...new Set([...page.ownedFields, String(claim.field_key).trim()])]
      }
    }
  }

  if (!chunkRows.length && markdown.trim()) {
    pages[0].text = markdown.trim()
  }

  return pages.map((page, index) => ({
    ...page,
    sourceChunkIds: [...new Set(page.sourceChunkIds)],
    text: page.text.trim() || `No markdown mapped to Page ${index + 1} yet.`,
  }))
}

function derivePreviewSectionsFromMarkdown(markdown = '', { artifactId = '', isPdf = false, usedClaims = [] } = {}) {
  const content = String(markdown || '').replaceAll('\r\n', '\n').trim()
  if (!content) return []

  const lines = content.split('\n')
  const sections = []
  let current = null

  const startSection = (title, line) => {
    if (current) sections.push(current)
    current = {
      key: `${artifactId || 'markdown'}:${sections.length + 1}`,
      title: title || `${isPdf ? 'Slide' : 'Section'} ${sections.length + 1}`,
      lines: line ? [line] : [],
    }
  }

  for (const line of lines) {
    const trimmed = String(line || '').trim()
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    const slideMatch = trimmed.match(/^(slide|page)\s+(\d+)(?:\s*[:-]\s*(.+))?$/i)

    if (headingMatch) {
      startSection(headingMatch[2].trim(), line)
      continue
    }

    if (slideMatch) {
      const kind = /^page/i.test(slideMatch[1]) ? 'Page' : 'Slide'
      const suffix = String(slideMatch[3] || '').trim()
      startSection(`${kind} ${slideMatch[2]}${suffix ? ` - ${suffix}` : ''}`, line)
      continue
    }

    if (!current) {
      startSection(isPdf ? 'Document Review' : 'Full Markdown', '')
    }
    current.lines.push(line)
  }

  if (current) sections.push(current)

  const normalizedSections = sections
    .map((section, index) => {
      const text = section.lines.join('\n').trim()
      if (!text) return null
      return {
        key: section.key || `${artifactId || 'markdown'}:${index + 1}`,
        title: section.title || `${isPdf ? 'Slide' : 'Section'} ${index + 1}`,
        text,
        sourceTitle: section.title || '',
        used: index === 0 && usedClaims.length > 0,
        ownedFields: index === 0 ? usedClaims.map((claim) => claim.field_key).filter(Boolean) : [],
      }
    })
    .filter(Boolean)

  return normalizedSections.length
    ? normalizedSections
    : [
        {
          key: artifactId || 'markdown',
          title: isPdf ? 'Document Review' : 'Full Markdown',
          text: content,
          sourceTitle: isPdf ? 'Document Review' : 'Full Markdown',
          used: usedClaims.length > 0,
          ownedFields: usedClaims.map((claim) => claim.field_key).filter(Boolean),
        },
      ]
}

async function loadPreviewReviewSidebar(artifactId = '') {
  previewFocusStripHidden.value = false
  previewMarkdownLoading.value = true
  previewMarkdownError.value = ''
  previewMarkdownContent.value = ''
  previewMarkdownArtifactId.value = ''
  previewSelectedSectionKey.value = ''
  previewSelectedFocusClaimId.value = ''
  previewCurrentPage.value = 1

  const group = findArtifactGroup({ artifact_id: artifactId })
  const markdownArtifact = (group?.artifacts || []).find(
    (artifact) => String(artifact?.artifact_type || '').trim().toLowerCase() === 'llm-ready',
  )

  if (!markdownArtifact?.artifact_id) {
    previewMarkdownLoading.value = false
    previewMarkdownError.value = 'No markdown sibling was found for this artifact group yet.'
    return
  }

  previewMarkdownArtifactId.value = String(markdownArtifact.artifact_id || '').trim()

  if (!bridge.value?.artifacts?.preview) {
    previewMarkdownLoading.value = false
    previewMarkdownError.value = 'Markdown preview is not available in this runtime.'
    return
  }

  try {
    const markdownPreview = await bridge.value.artifacts.preview({ artifactId: previewMarkdownArtifactId.value })
    if (String(markdownPreview?.kind || '').trim() === 'text') {
      previewMarkdownContent.value = String(markdownPreview?.content || '')
    } else {
      previewMarkdownError.value = 'The markdown sibling could not be rendered as text.'
    }
  } catch (e) {
    previewMarkdownError.value = e?.message || String(e)
  } finally {
    previewMarkdownLoading.value = false
  }
}

async function ensurePreviewReviewDataLoaded(options = {}) {
  if (!previewState.value.artifactId) return
  if (previewMarkdownLoading.value) return
  if (!options?.force && previewMarkdownContent.value.trim() && previewMarkdownArtifactId.value) return
  await loadPreviewReviewSidebar(previewState.value.artifactId)
}

async function togglePreviewFocusSidebarSection() {
  previewFocusStripHidden.value = !previewFocusStripHidden.value
  if (!previewFocusStripHidden.value) {
    await ensurePreviewReviewDataLoaded()
  }
}

async function togglePreviewSidebar() {
  previewSidebarOpen.value = !previewSidebarOpen.value
  if (previewSidebarOpen.value && previewState.value.artifactId) {
    await loadPreviewReviewSidebar(previewState.value.artifactId)
  }
}

function continuePreviewDocumentReview() {
  if (!previewPrimaryArtifact.value) return
  continueArtifactIntake(previewPrimaryArtifact.value)
}

function buildPdfObjectUrl(fileDataBase64 = '') {
  const normalized = String(fileDataBase64 || '').trim()
  if (!normalized || typeof window === 'undefined' || typeof window.atob !== 'function') return ''
  const binary = window.atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

async function resolvePdfPageCount(fileDataBase64 = '') {
  const normalized = String(fileDataBase64 || '').trim()
  if (!normalized || typeof window === 'undefined' || typeof window.atob !== 'function') return 0
  try {
    const binary = window.atob(normalized)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const pdfDocument = await loadingTask.promise
    return Number(pdfDocument?.numPages || 0)
  } catch {
    return 0
  }
}

function resetPreviewPdfObjectUrl() {
  if (!previewPdfObjectUrl.value) return
  URL.revokeObjectURL(previewPdfObjectUrl.value)
  previewPdfObjectUrl.value = ''
}

function createEmptyPreviewState() {
  return {
    artifactId: '',
    fileName: '',
    kind: '',
    fileUrl: '',
    fileDataBase64: '',
    content: '',
  }
}

async function downloadArtifact(row) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.download) return
  try {
    await bridge.value.artifacts.download({ artifactId })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

async function shareArtifact(row, options = {}) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.share) return
  const silent = Boolean(options?.silent)
  try {
    await bridge.value.artifacts.share({ artifactId })
    if (!silent) {
      $q.notify({ type: 'positive', message: 'Artifact path copied and revealed in folder.' })
    }
  } catch (e) {
    if (!silent) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    }
    throw e
  }
}

async function openArtifactForReview(row) {
  const kind = await previewArtifact(row, { silent: true })
  if (kind && kind !== 'unsupported') return
  try {
    await shareArtifact(row, { silent: true })
    $q.notify({ type: 'info', message: 'Inline preview was not available, so the original file was opened in your folder.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

function closePreviewDialog() {
  previewDialogOpen.value = false
  previewLoading.value = false
  previewPdfPageCount.value = 0
  previewSidebarOpen.value = false
  previewFocusStripHidden.value = false
  previewMarkdownLoading.value = false
  previewMarkdownError.value = ''
  previewMarkdownContent.value = ''
  previewMarkdownArtifactId.value = ''
  previewSelectedSectionKey.value = ''
  previewSelectedFocusClaimId.value = ''
  previewCurrentPage.value = 1
  resetPreviewPdfObjectUrl()
  previewState.value = createEmptyPreviewState()
}

async function deleteArtifact(row) {
  await bridge.value.artifacts.delete(row.artifact_id)
}

async function confirmDelete(row) {
  if (!bridge.value?.artifacts?.delete) return
  const title = row?.title ? ` (${row.title})` : ''

  $q.dialog({
    title: 'Delete artifact?',
    message: `This will permanently delete this artifact${title}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteArtifact(row)
      await loadArtifacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.artifacts?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected artifacts?',
    message: `This will permanently delete ${selectedCount.value} selected artifact${selectedCount.value === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteArtifact(row)
      }
      selectedRows.value = []
      await loadArtifacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  setBreadcrumbActions(ARTIFACTS_BREADCRUMB_ACTION_OWNER, [
    {
      id: 'import-csv',
      label: 'Import CSV',
      icon: 'download',
      disabled: () => loading.value,
      onClick: () => csvActionsRef.value?.pickFile?.(),
    },
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: 'upload',
      disabled: () => loading.value || rows.value.length === 0,
      onClick: () => csvActionsRef.value?.exportCsv?.(),
    },
  ])
  if (!hasBridge.value) return
  loadArtifacts()
  loadOpportunities()
  loadRelationshipOptions()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(ARTIFACTS_BREADCRUMB_ACTION_OWNER)
  resetPreviewPdfObjectUrl()
})

watch(previewSectionOptions, (options) => {
  const firstValue = String(options?.[0]?.value || '').trim()
  const currentValue = String(previewSelectedSectionKey.value || '').trim()
  if (!firstValue) {
    previewSelectedSectionKey.value = ''
    return
  }
  if (!currentValue || !options.some((option) => String(option?.value || '').trim() === currentValue)) {
    previewSelectedSectionKey.value = firstValue
  }
})

watch(previewFocusClaimRows, (claims) => {
  const currentValue = String(previewSelectedFocusClaimId.value || '').trim()
  if (!claims.length) {
    previewSelectedFocusClaimId.value = ''
    return
  }
  if (!currentValue || !claims.some((claim) => String(claim?.claim_id || '').trim() === currentValue)) {
    previewSelectedFocusClaimId.value = String(claims[0]?.claim_id || '').trim()
  }
})

watch(displayArtifactRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.artifacts-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.artifacts-page__heading {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-12);
  flex-wrap: wrap;
}

.artifacts-page__heading-copy {
  max-width: 760px;
}

.artifacts-page__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b7280;
}

.artifacts-page__title {
  margin: 6px 0 8px;
  color: var(--ds-color-text-primary);
  font-family: var(--font-title);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.artifacts-shell {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-32);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.artifacts-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-24);
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(14, 165, 233, 0.14), transparent 24%),
    radial-gradient(circle at 14% 84%, rgba(59, 130, 246, 0.1), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-2xl);
}

.artifacts-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent 38%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.34) 100%);
  pointer-events: none;
}

.artifacts-shell__copy,
.artifacts-dashboard {
  position: relative;
  z-index: 1;
}

.artifacts-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: flex-start;
  min-width: 0;
}

.artifacts-shell__eyebrow,
.artifacts-dashboard__stat-label,
.artifacts-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.12em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.artifacts-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 13ch;
}

.artifacts-shell__hero-text {
  margin: auto 0 0;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.artifacts-shell__hero-text {
  display: flex;
  align-items: flex-end;
}

.artifacts-dashboard__stat-caption,
.artifacts-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.artifacts-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.artifacts-shell__meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--ds-space-12);
  color: var(--ds-color-text-subtle);
  background: var(--ds-color-surface-overlay-72);
  border: 1px solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
}

.artifacts-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.artifacts-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.artifacts-dashboard__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-6);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-84);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-card-soft);
}

.artifacts-dashboard__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.artifacts-dashboard__stat--rich {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.artifacts-dashboard__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.artifacts-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.artifacts-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.artifacts-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.artifacts-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.artifacts-dashboard__health-segment {
  display: block;
  height: 100%;
}

.artifacts-dashboard__health-segment--sparse {
  background: #ff5521;
}

.artifacts-dashboard__health-segment--medium {
  background: #ebff5a;
}

.artifacts-dashboard__health-segment--rich {
  background: #2647ff;
}

.artifacts-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.artifacts-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.artifacts-toolbar__block--filters {
  flex-wrap: nowrap;
}

.artifacts-toolbar__block--search {
  justify-content: flex-end;
}

.artifacts-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.artifacts-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.artifacts-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.artifacts-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.artifacts-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.artifacts-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.artifacts-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.artifacts-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.artifacts-toolbar__search :deep(.q-field__control),
.artifacts-toolbar__search :deep(.q-field__native),
.artifacts-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.artifacts-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.artifacts-toolbar__toggle {
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  background: var(--ds-control-surface);
  color: var(--ds-control-text);
  border-color: var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.artifacts-empty-state {
  padding: 24px;
}

.artifacts-grid {
  align-items: stretch;
}

.artifact-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.96)),
    #fff;
  box-shadow:
    0 20px 45px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.artifact-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 16%, rgba(14, 165, 233, 0.14), transparent 38%),
    radial-gradient(circle at 82% 0%, rgba(59, 130, 246, 0.12), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(251, 191, 36, 0.1), transparent 34%);
}

.artifact-card > * {
  position: relative;
  z-index: 1;
}

.artifact-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow:
    0 24px 52px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.artifact-card__title-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  line-height: 1.25;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
}

.artifact-card__title-button:hover {
  color: #2563eb;
}

.artifact-card__hero {
  padding-bottom: 12px;
}

.artifact-card__hero-main {
  display: grid;
  grid-template-columns: minmax(88px, 104px) minmax(0, 1fr);
  align-items: stretch;
  gap: 16px;
}

.artifact-card__portrait {
  margin: 0;
  min-height: 168px;
  position: relative;
}

.artifact-card__portrait::after {
  content: "";
  position: absolute;
  inset: 12px 8px -10px 8px;
  border-radius: 26px;
  background: rgba(14, 165, 233, 0.12);
  filter: blur(14px);
}

.artifact-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  min-height: 168px;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(14, 165, 233, 0.2), rgba(37, 99, 235, 0.16)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.4));
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 16px 28px rgba(14, 165, 233, 0.14);
}

.artifact-card__portrait-badge {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  color: #0f172a;
  box-shadow:
    0 14px 24px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.artifact-card__hero-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
}

.artifact-card__hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.artifact-card__hero-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 6px;
}

.artifact-card__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.artifact-card__subtitle {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.4;
}

.artifact-card__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.artifact-card__pill {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.78);
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.artifact-card__quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.artifact-card__quick-action {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(148, 163, 184, 0.22);
  color: #334155;
}

.artifact-card__quick-action--dropdown :deep(.q-btn-dropdown__arrow) {
  margin-left: 2px;
}

.artifact-card__summary {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.artifact-card__summary-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.artifact-card__details {
  display: grid;
  gap: 10px;
}

.artifact-card__detail {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.artifact-card__detail-icon {
  margin-top: 2px;
  color: #64748b;
}

.artifact-card__detail-copy {
  min-width: 0;
}

.artifact-card__detail-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.artifact-card__detail-value {
  margin-top: 2px;
  color: #0f172a;
  line-height: 1.45;
}

.artifact-card__description {
  margin-top: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #475569;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.artifact-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.54);
}

.artifact-card__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.artifact-card__icon-action {
  color: #475569;
}

.artifact-properties__versions {
  display: flex;
  min-height: 40px;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 4px;
  background: rgba(248, 250, 252, 0.7);
}

.artifact-preview-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.artifact-preview-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #f8fafc;
}

.artifact-preview-dialog__body--split {
  gap: 0;
  padding: 0;
}

.artifact-preview-dialog__main {
  display: flex;
  flex: 1;
  min-width: 0;
  position: relative;
  align-items: stretch;
  justify-content: center;
}

.artifact-preview-dialog__focus-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.artifact-preview-dialog__focus-chip {
  padding: 6px 10px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.96);
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.artifact-preview-dialog__focus-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.32);
  color: #1d4ed8;
}

.artifact-preview-dialog__focus-chip--active {
  border-color: rgba(59, 130, 246, 0.42);
  background: rgba(219, 234, 254, 0.96);
  color: #1d4ed8;
}

.artifact-preview-dialog__focus-chip--exit {
  border-color: rgba(148, 163, 184, 0.38);
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
}

.artifact-preview-dialog__focus-chip--empty {
  cursor: pointer;
  border-style: dashed;
}

.artifact-preview-dialog__state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.artifact-preview-dialog__frame {
  width: 100%;
  height: 100%;
  min-height: 70vh;
  border: 0;
  background: white;
}

.artifact-preview-dialog__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.artifact-preview-dialog__text {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: white;
  border-radius: 12px;
}

.artifact-preview-sidebar {
  width: min(420px, 38vw);
  min-width: 320px;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 16px;
  overflow: auto;
  border-left: 1px solid rgba(148, 163, 184, 0.25);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
}

.artifact-preview-sidebar__section {
  display: flex;
  flex-direction: column;
}

.artifact-preview-sidebar__section--grow {
  flex: 1;
  min-height: 0;
}

.artifact-preview-sidebar__claim {
  padding: 10px 12px;
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 12px;
  background: rgba(255, 251, 235, 0.92);
}

.artifact-preview-sidebar__focus-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.artifact-preview-sidebar__focus-card {
  padding: 10px 12px;
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 12px;
  background: rgba(239, 246, 255, 0.92);
}

.artifact-preview-sidebar__claim-title {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #92400e;
}

.artifact-preview-sidebar__state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
}

.artifact-preview-sidebar__markdown-block {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
}

.artifact-preview-sidebar__markdown-block--used {
  border-color: rgba(251, 191, 36, 0.55);
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.3);
  background: rgba(255, 251, 235, 0.92);
}

.artifact-preview-sidebar__markdown-text {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.45;
}

.artifacts-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.artifacts-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.artifacts-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.artifacts-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
}

@media (max-width: 900px) {
  .artifact-preview-sidebar {
    width: min(360px, 44vw);
  }
}

@media (max-width: 1200px) {
  .artifacts-shell {
    padding: 20px;
    gap: 20px;
  }

  .artifacts-shell__hero {
    grid-template-columns: 1fr;
  }

  .artifacts-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .artifacts-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .artifacts-toolbar__filter-control,
  .artifacts-toolbar__search,
  .artifacts-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .artifacts-shell__hero {
    padding: 18px;
    border-radius: 20px;
  }

  .artifacts-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .artifact-card__hero-main {
    grid-template-columns: 1fr;
  }

  .artifact-card__portrait {
    min-height: 132px;
  }

  .artifact-card__portrait-shell {
    min-height: 132px;
  }

  .artifact-card__quick-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .artifact-preview-dialog__body--split {
    flex-direction: column;
  }

  .artifact-preview-sidebar {
    width: 100%;
    min-width: 0;
    max-width: none;
    min-height: 240px;
    border-left: 0;
    border-top: 1px solid rgba(148, 163, 184, 0.25);
  }
}
</style>
