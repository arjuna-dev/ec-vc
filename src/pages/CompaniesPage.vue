<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Companies requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="companies-page">
      <section class="companies-shell">
        <div
          class="companies-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="companies-shell__copy">
            <div class="companies-shell__eyebrow">Dashboard</div>
            <h2 class="companies-shell__hero-title">Know which companies are ready to work.</h2>
            <p class="companies-shell__hero-text">{{ companiesHeroText }}</p>

          </div>

          <div class="companies-dashboard">
            <div class="companies-dashboard__stats">
              <article
                v-for="stat in companiesDashboardStats"
                :key="stat.label"
                class="companies-dashboard__stat"
                :class="`companies-dashboard__stat--${stat.tone}`"
              >
                <div class="companies-dashboard__stat-label">{{ stat.label }}</div>
                <div class="companies-dashboard__stat-value">{{ stat.value }}</div>
                <div class="companies-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="companies-dashboard__health">
              <div class="companies-dashboard__health-copy">
                <div class="companies-dashboard__health-label">Profile health</div>
                <div class="companies-dashboard__health-text">
                  {{ companiesDashboard.richCount }} rich, {{ companiesDashboard.mediumCount }} medium,
                  {{ companiesDashboard.sparseCount }} sparse
                </div>
              </div>

              <div class="companies-dashboard__health-bar" aria-hidden="true">
                <span
                  class="companies-dashboard__health-segment companies-dashboard__health-segment--sparse"
                  :style="{ width: `${companiesDashboard.sparseShare}%` }"
                />
                <span
                  class="companies-dashboard__health-segment companies-dashboard__health-segment--medium"
                  :style="{ width: `${companiesDashboard.mediumShare}%` }"
                />
                <span
                  class="companies-dashboard__health-segment companies-dashboard__health-segment--rich"
                  :style="{ width: `${companiesDashboard.richShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="companies-toolbar">
          <div class="companies-toolbar__block companies-toolbar__block--primary">
            <q-checkbox
              :model-value="allVisibleCompaniesSelected"
              :indeterminate="someVisibleCompaniesSelected && !allVisibleCompaniesSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="companies-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleCompanies"
            />
            <q-btn
              no-caps
              unelevated
              class="companies-toolbar__add-button"
              :disable="loading"
              @click="openCreateCompany"
            >
              <span class="companies-toolbar__add-button-inner">
                <span class="companies-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="companies-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn dense flat round icon="download" color="grey-6" class="companies-toolbar__icon-button" :disable="loading" @click="pickImportFile">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="companies-toolbar__block companies-toolbar__block--actions">
            <q-icon name="tune" size="18px" class="companies-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="companies-toolbar__search"
              placeholder="Search companies..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="companies-toolbar__toggle companies-toolbar__view-toggle"
              :disable="loading"
              :options="viewOptions"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="companies-surface">
          <div v-if="viewMode === 'table'" class="companies-table-tabs">
            <q-tabs
              v-model="companyTableTab"
              dense
              no-caps
              align="left"
              active-color="dark"
              indicator-color="dark"
              class="companies-table-tabs__nav"
            >
              <q-tab
                v-for="tab in companyTableTabs"
                :key="tab.value"
                :name="tab.value"
                :label="tab.label"
              />
            </q-tabs>
          </div>

          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="companies-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No companies found.</div>
            </div>
          </q-banner>

          <div v-else-if="showCompanyCards" class="row q-col-gutter-md companies-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card
                flat
                bordered
                class="company-card full-height"
                :style="getCompanyCardStyle(row)"
                @pointerenter="onCompanyCardPointerEnter"
                @pointermove="onCompanyCardPointerMove"
                @pointerleave="onCompanyCardPointerLeave"
              >
                <q-card-section class="company-card__control-row">
                  <q-checkbox
                    :model-value="isSelected(row)"
                    :disable="loading"
                    color="dark"
                    class="company-card__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="company-card__control-eye"
                    :disable="loading"
                    @click="openEyeView(row)"
                  />
                </q-card-section>
                <q-card-section class="company-card__hero">
                  <div class="company-card__hero-main">
                    <figure class="company-card__portrait">
                      <div class="company-card__portrait-shell" aria-hidden="true">
                        <div
                          class="company-card__portrait-badge"
                          :class="{ 'company-card__portrait-badge--logo': hasCompanyLogo(row) }"
                          :style="!hasCompanyLogo(row) ? { backgroundColor: getCompanyAvatarColor(row) } : undefined"
                        >
                          <img
                            v-if="hasCompanyLogo(row)"
                            class="company-card__portrait-logo"
                            :src="buildAvatarImage(row)"
                            :alt="row.Company_Name || 'Company logo'"
                          />
                          <template v-else>
                            {{ getCompanyInitials(row) }}
                          </template>
                        </div>
                      </div>
                    </figure>

                    <div class="company-card__hero-side">
                      <div class="company-card__hero-copy">
                        <div class="company-card__title">
                          {{ row.Company_Name || 'Unnamed company' }}
                        </div>

                        <div class="company-card__bottom-stack">
                          <div v-if="getCompanyMetadataRows(row).length" class="company-card__detail-stack">
                            <div
                              v-for="detail in getCompanyMetadataRows(row)"
                              :key="detail.label"
                              class="company-card__role company-card__role--detail"
                            >
                              <button
                                type="button"
                                class="company-card__inline-chip"
                                @click="openCompanyMetadataAction(detail, $event)"
                              >
                                <q-icon :name="detail.icon" size="14px" />
                                <span>{{ detail.value }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="company-card__summary">
                  <div class="company-card__summary-head">
                    <q-btn-toggle
                      :model-value="getCompanyCardPanel(row)"
                      dense
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="company-card__summary-toggle"
                      :options="getCompanyRelationshipOptions(row)"
                      @update:model-value="setCompanyCardPanel(row, $event)"
                    />
                    <q-btn-toggle
                      :model-value="getCompanyCardContentView(row)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="company-card__summary-view-toggle"
                      :options="companyCardContentViewOptions"
                      @update:model-value="setCompanyCardContentView(row, $event)"
                    />
                  </div>

                  <div class="company-card__summary-panel">
                    <div class="company-card__summary-panel-head">
                      <q-btn flat no-caps class="company-card__summary-add-relation" aria-label="Add Relation">
                        <span class="company-card__summary-add-relation-plus">
                          <q-icon name="add" />
                        </span>
                        <span class="company-card__summary-add-relation-label">Add Relation</span>
                      </q-btn>
                    </div>
                    <div class="company-card__summary-body">
                      <div class="company-card__summary-body-content">
                        <div
                          v-if="getCompanyActiveRelationshipItems(row).length"
                          :class="[
                            'company-card__notes-list',
                            { 'company-card__notes-list--rows': getCompanyCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="item in getCompanyActiveRelationshipItems(row)"
                            :key="item"
                            class="company-card__note-pill"
                          >
                            {{ item }}
                          </div>
                        </div>

                        <div v-else class="company-card__summary-empty">
                          No linked KDB relationships yet for this company.
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-table
            v-else-if="showCompanyMainTable"
            class="companies-table"
            flat
            bordered
            row-key="id"
            v-model:selected="selectedRows"
            v-model:pagination="pagination"
            selection="multiple"
            :rows="activeCompanyTableRows"
            :columns="activeCompanyColumns"
            :loading="loading"
            :rows-per-page-options="rowsPerPageOptions"
          >
            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="companies-table__actions">
                  <q-btn
                    dense
                    flat
                    round
                    icon="visibility"
                    color="grey-8"
                    :disable="loading"
                    @click="openEyeView(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="table_view"
                    color="grey-8"
                    :disable="loading"
                    @click="openCardsTableView(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="grey-8"
                    :disable="loading"
                    @click="confirmDelete(props.row)"
                  />
                </div>
              </q-td>
            </template>
          </q-table>

          <div v-else-if="showCompanySectionTable" class="companies-section-table">
            <div class="companies-section-table__header">
              <div>
                <div class="companies-section-table__eyebrow">{{ activeCompanySectionLabel }}</div>
                <div class="companies-section-table__title">
                  {{ activeCompanySectionTitle }}
                </div>
              </div>

              <q-badge v-if="activeCompanyRow" outline color="grey-8" class="companies-section-table__badge">
                {{ activeCompanyRow.Company_Name || 'Selected company' }}
              </q-badge>
            </div>

            <q-banner
              v-if="!activeCompanyRow"
              class="companies-empty-state bg-grey-1 text-black"
              rounded
            >
              Pick a company to open this subsection.
            </q-banner>

            <q-table
              v-else
              class="companies-table companies-table--subsection"
              flat
              bordered
              :row-key="activeCompanySectionRowKey"
              :rows="activeCompanySectionRows"
              :columns="activeCompanySectionColumns"
              :loading="companySectionLoading"
              :pagination="{ page: 1, rowsPerPage: 10 }"
              :rows-per-page-options="[10, 15, 25]"
            />
          </div>
        </div>
      </section>

      <SelectionActionBar
        :count="selectedCount"
        :loading="loading"
        @share="shareSelected"
        @edit="editSelected"
        @delete="confirmDeleteSelected"
      />
    </div>
  </q-page>

  <input
    ref="fileInput"
    type="file"
    accept=".csv,text/csv"
    style="display: none"
    @change="onImportFileSelected"
  />

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import SelectionActionBar from 'components/SelectionActionBar.vue'
import CompanyCreateDialog from 'components/CompanyCreateDialog.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'
import { countFilledContactFields, getContactCompletenessTheme } from 'src/utils/contactCompleteness'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { buildResolvedPagePath, createRecordViewOpener } from 'src/utils/recordViewNavigation'
import { copySelectionSummary } from 'src/utils/selectionShare'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.companies?.list &&
    !!bridge.value?.companies?.upsertMany &&
    !!bridge.value?.companies?.create &&
    !!bridge.value?.companies?.delete,
)

function onHeroDashboardPointerEnter(event) {
  updateHeroDashboardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}

function onHeroDashboardPointerMove(event) {
  updateHeroDashboardGradientPosition(event)
}

function onHeroDashboardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--hero-dashboard-blob-opacity', '0')
}

function updateHeroDashboardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const COMPANY_VIEW_MODES = new Set(['card', 'table'])
const COMPANY_TABLE_TABS = new Set([
  'cards',
  'all',
  'metadata',
  'kdb-relations',
  'incorporation',
  'documents',
  'operations',
  'business',
  'market',
  'results',
  'business-plan',
  'fund-raising',
])
const COMPANIES_BREADCRUMB_ACTION_OWNER = 'companies-page'

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const companySectionLoading = ref(false)
const error = ref('')
const companyDialogOpen = ref(false)
const companyKindFilter = ref('all')
const stageFilter = ref('')
const industryFilter = ref('')
const locationFilter = ref('')
const statusFilter = ref('')
const searchQuery = ref('')
const viewMode = ref(getRouteViewMode(route.query.view))
const companyTableTab = ref(getRouteTableTab(route.query.tableTab))
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)
const companyCardContentViews = ref({})
const companyCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const companyCardPanels = ref({})
const COMPANY_COMPLETENESS_IGNORED_FIELDS = new Set(['id', 'created_at', 'updated_at'])

function openCreateCompany() {
  companyDialogOpen.value = true
}

function onOpenCompanyDialog() {
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
}

function openCreateCompanyFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateCompany()
  globalThis.__ecvcOpenCompanyDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedCompanyDialogOpen() {
  if (globalThis.__ecvcOpenCompanyDialog !== true) return false
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
  return true
}

const openRecordView = createRecordViewOpener(router, {
  tableName: 'Companies',
  getReturnTo: getCompaniesReturnToPath,
})

function openEyeView(row) {
  openRecordView(row)
}

function openCardsTableView(row) {
  const rowId = String(row?.id || '').trim()
  if (rowId) {
    const focusedRow = rows.value.find((entry) => String(entry?.id || '').trim() === rowId)
    if (focusedRow) selectedRows.value = [focusedRow]
  }
  viewMode.value = 'table'
  companyTableTab.value = 'cards'
}

function getRouteViewMode(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return COMPANY_VIEW_MODES.has(normalized) ? normalized : 'card'
}

function getRouteTableTab(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return COMPANY_TABLE_TABS.has(normalized) ? normalized : 'all'
}

function getCompaniesReturnToPath() {
  const nextQuery = { ...route.query }

  if (viewMode.value === 'table') nextQuery.view = 'table'
  else delete nextQuery.view

  if (viewMode.value === 'table' && companyTableTab.value !== 'all') {
    nextQuery.tableTab = companyTableTab.value
  } else {
    delete nextQuery.tableTab
  }

  return buildResolvedPagePath(router, route, nextQuery)
}

function syncViewModeQuery() {
  const currentRouteView = getRouteViewMode(route.query.view)
  const nextView = COMPANY_VIEW_MODES.has(viewMode.value) ? viewMode.value : 'card'

  if (currentRouteView === nextView) return

  const nextQuery = { ...route.query }
  if (nextView === 'table') nextQuery.view = 'table'
  else delete nextQuery.view

  router.replace({ query: nextQuery })
}

const columns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'Short_Name', label: 'Short Name', field: 'Short_Name', align: 'left', sortable: true },
  { name: 'Website', label: 'Website', field: 'Website', align: 'left', sortable: true },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Company_Type', label: 'Type', field: 'Company_Type', align: 'left', sortable: true },
  { name: 'Company_Stage', label: 'Stage', field: 'Company_Stage', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'Company_Name',
  'Short_Name',
  'Website',
  'One_Liner',
  'Description',
  'Company_Type',
  'Company_Stage',
  'Status',
  'Date_of_Incorporation',
  'Headquarters_City_Name',
  'Incorporation_Country_Name',
  'PAX_Count',
]

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const companyTableTabs = [
  { label: 'Cards', value: 'cards' },
  { label: 'All', value: 'all' },
  { label: 'Metadata', value: 'metadata' },
  { label: 'KDB Relations', value: 'kdb-relations' },
  { label: 'Incorporation', value: 'incorporation' },
  { label: 'Documents', value: 'documents' },
  { label: 'Operations', value: 'operations' },
  { label: 'Business', value: 'business' },
  { label: 'Market', value: 'market' },
  { label: 'Results', value: 'results' },
  { label: 'Business Plan', value: 'business-plan' },
  { label: 'Fund Raising', value: 'fund-raising' },
]

const metadataColumns = [
  columns.find((column) => column.name === 'Company_Name'),
  columns.find((column) => column.name === 'Short_Name'),
  columns.find((column) => column.name === 'Website'),
  columns.find((column) => column.name === 'Status'),
  columns.find((column) => column.name === 'Company_Type'),
  columns.find((column) => column.name === 'Company_Stage'),
  columns.find((column) => column.name === 'created_at'),
  columns.find((column) => column.name === 'actions'),
].filter(Boolean)
const cardSummaryColumns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'card_subtitle', label: 'Summary', field: 'card_subtitle', align: 'left' },
  { name: 'Company_Type', label: 'Type', field: 'Company_Type', align: 'left', sortable: true },
  { name: 'Company_Stage', label: 'Stage', field: 'Company_Stage', align: 'left', sortable: true },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'card_location', label: 'Location', field: 'card_location', align: 'left' },
  { name: 'Website', label: 'Website', field: 'Website', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]
const companySectionRows = ref({
  'kdb-relations': [],
  incorporation: [],
  documents: [],
  operations: [],
  business: [],
  market: [],
  results: [],
  'business-plan': [],
  'fund-raising': [],
})
const companySectionTabs = new Set([
  'kdb-relations',
  'incorporation',
  'documents',
  'operations',
  'business',
  'market',
  'results',
  'business-plan',
  'fund-raising',
])
const companySectionColumns = {
  'kdb-relations': [
    { name: 'contact_count', label: 'Contacts', field: 'contact_count', align: 'right' },
    { name: 'company_count', label: 'Companies', field: 'company_count', align: 'right' },
    { name: 'fund_count', label: 'Funds', field: 'fund_count', align: 'right' },
    { name: 'round_count', label: 'Rounds', field: 'round_count', align: 'right' },
    { name: 'project_count', label: 'Projects', field: 'project_count', align: 'right' },
    { name: 'task_count', label: 'Tasks', field: 'task_count', align: 'right' },
    { name: 'note_count', label: 'Notes', field: 'note_count', align: 'right' },
    { name: 'artifact_count', label: 'Artifacts', field: 'artifact_count', align: 'right' },
  ],
  incorporation: [
    { name: 'Legal_Entity', label: 'Legal Name', field: 'Legal_Entity', align: 'left' },
    { name: 'Date_of_Incorporation', label: 'Incorporation Date', field: 'Date_of_Incorporation', align: 'left' },
    { name: 'incorporation_country', label: 'Country', field: 'incorporation_country', align: 'left' },
    { name: 'Incorporation_Type', label: 'Entity Type', field: 'Incorporation_Type', align: 'left' },
    { name: 'founder_count', label: 'Founders', field: 'founder_count', align: 'right' },
  ],
  documents: [
    { name: 'title', label: 'Document', field: 'title', align: 'left', sortable: true },
    { name: 'document_type', label: 'Type', field: 'document_type', align: 'left', sortable: true },
    { name: 'artifact_format', label: 'Format', field: 'artifact_format', align: 'left', sortable: true },
    { name: 'updated_at', label: 'Updated', field: 'updated_at', align: 'left', sortable: true },
  ],
  operations: [
    { name: 'Status', label: 'Status', field: 'Status', align: 'left' },
    { name: 'Company_Stage', label: 'Stage', field: 'Company_Stage', align: 'left' },
    { name: 'headquarters_city', label: 'HQ', field: 'headquarters_city', align: 'left' },
    { name: 'PAX_Count', label: 'PAX Count', field: 'PAX_Count', align: 'right' },
    { name: 'PAX_Known', label: 'PAX Known', field: 'PAX_Known', align: 'right' },
    { name: 'leadership_count', label: 'Leadership', field: 'leadership_count', align: 'right' },
    { name: 'advisor_count', label: 'Advisors', field: 'advisor_count', align: 'right' },
  ],
  business: [
    { name: 'Mission_Vision', label: 'Mission / Vision', field: 'Mission_Vision', align: 'left' },
    { name: 'Products_Services', label: 'Products', field: 'Products_Services', align: 'left' },
    { name: 'Development_Stage', label: 'Development', field: 'Development_Stage', align: 'left' },
    { name: 'ICP', label: 'ICP', field: 'ICP', align: 'left' },
    { name: 'Business_Model', label: 'Business Model', field: 'Business_Model', align: 'left' },
    { name: 'Pricing', label: 'Pricing', field: 'Pricing', align: 'left' },
  ],
  market: [
    { name: 'Industry', label: 'Industry', field: 'Industry', align: 'left' },
    { name: 'Niche', label: 'Niche', field: 'Niche', align: 'left' },
    { name: 'Demand_Analysis', label: 'Demand Analysis', field: 'Demand_Analysis', align: 'left' },
    { name: 'Supply_Analysis', label: 'Supply Analysis', field: 'Supply_Analysis', align: 'left' },
  ],
  results: [
    { name: 'Traction_Overview', label: 'Traction', field: 'Traction_Overview', align: 'left' },
    { name: 'Customer_Acquisition_Cost', label: 'CAC', field: 'Customer_Acquisition_Cost', align: 'right' },
    { name: 'Customer_Lifetime_Value', label: 'LTV', field: 'Customer_Lifetime_Value', align: 'right' },
    { name: 'General_Admin_Expenses', label: 'Admin', field: 'General_Admin_Expenses', align: 'right' },
    { name: 'Tech_Expenditure', label: 'Tech', field: 'Tech_Expenditure', align: 'right' },
  ],
  'business-plan': [
    { name: 'Overview', label: 'Overview', field: 'Overview', align: 'left' },
    { name: 'Forecast', label: 'Forecast', field: 'Forecast', align: 'left' },
    { name: 'Short_Term_Objectives', label: 'Short Term', field: 'Short_Term_Objectives', align: 'left' },
    { name: 'Long_Term_Objectives', label: 'Long Term', field: 'Long_Term_Objectives', align: 'left' },
    { name: 'Capital_Needs', label: 'Capital Needs', field: 'Capital_Needs', align: 'left' },
    { name: 'Funding_Strategy', label: 'Funding Strategy', field: 'Funding_Strategy', align: 'left' },
  ],
  'fund-raising': [
    { name: 'Rounds_Funds_Count', label: 'Rounds / Funds', field: 'Rounds_Funds_Count', align: 'right' },
    { name: 'Amount_Raised', label: 'Amount Raised', field: 'Amount_Raised', align: 'right' },
    { name: 'shareholder_count', label: 'Shareholders', field: 'shareholder_count', align: 'right' },
    { name: 'Shareholder_Structure_Artifact_Id', label: 'Shareholder Structure', field: 'Shareholder_Structure_Artifact_Id', align: 'left' },
  ],
}

const showCompanyCards = computed(() => viewMode.value === 'card')

const activeCompanyColumns = computed(() => {
  if (companyTableTab.value === 'cards') return cardSummaryColumns
  if (companyTableTab.value === 'metadata') return metadataColumns
  return columns
})
const activeCompanyTableRows = computed(() => {
  if (companyTableTab.value !== 'cards') return displayRows.value
  return displayRows.value.map((row) => ({
    ...row,
    card_subtitle: getCompanyCardSubtitle(row),
    card_location: getCompanyLocationValue(row),
  }))
})

const activeCompanyRow = computed(() => {
  const visibleRows = displayRows.value
  if (!visibleRows.length) return null

  const selectedIds = new Set(
    selectedRows.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  return (
    visibleRows.find((row) => selectedIds.has(String(row?.id || '').trim())) ||
    visibleRows[0] ||
    null
  )
})

const showCompanyMainTable = computed(
  () =>
    viewMode.value === 'table' &&
    !companySectionTabs.has(companyTableTab.value),
)

const showCompanySectionTable = computed(
  () => viewMode.value === 'table' && companySectionTabs.has(companyTableTab.value),
)

const activeCompanySectionRows = computed(
  () => companySectionRows.value[companyTableTab.value] || [],
)

const activeCompanySectionColumns = computed(
  () => companySectionColumns[companyTableTab.value] || [],
)

const activeCompanySectionLabel = computed(() => {
  const currentTab = companyTableTabs.find((tab) => tab.value === companyTableTab.value)
  return currentTab?.label || 'Section'
})

const activeCompanySectionTitle = computed(() => {
  if (!activeCompanyRow.value) return 'No company selected'
  return `${activeCompanySectionLabel.value} linked to ${activeCompanyRow.value.Company_Name || 'this company'}`
})

const activeCompanySectionRowKey = computed(() =>
  companyTableTab.value === 'artifacts' || companyTableTab.value === 'notes' ? 'id' : 'id',
)

const companiesDashboard = computed(() => {
  const total = rows.value.length
  const summary = rows.value.reduce(
    (accumulator, row) => {
      const hasWebsite = normalizeCompanyValue(row?.Website).length > 0
      const hasStatus = normalizeCompanyValue(row?.Status).length > 0
      const hasType = normalizeCompanyValue(row?.Company_Type).length > 0
      const hasSummary =
        normalizeCompanyValue(row?.One_Liner).length > 0 ||
        normalizeCompanyValue(row?.Description).length > 0
      const profileScore = [hasWebsite, hasStatus, hasType, hasSummary].filter(Boolean).length

      if (hasWebsite) accumulator.websiteCount += 1
      if (hasStatus) accumulator.statusCount += 1
      if (hasType) accumulator.typeCount += 1
      if (hasSummary) accumulator.summaryCount += 1

      if (profileScore <= 1) accumulator.sparseCount += 1
      else if (profileScore <= 3) accumulator.mediumCount += 1
      else accumulator.richCount += 1

      return accumulator
    },
    {
      websiteCount: 0,
      statusCount: 0,
      typeCount: 0,
      summaryCount: 0,
      sparseCount: 0,
      mediumCount: 0,
      richCount: 0,
    },
  )

  return {
    total,
    ...summary,
    typeRate: total ? Math.round((summary.typeCount / total) * 100) : 0,
    sparseShare: total ? (summary.sparseCount / total) * 100 : 0,
    mediumShare: total ? (summary.mediumCount / total) * 100 : 0,
    richShare: total ? (summary.richCount / total) * 100 : 0,
  }
})

const companiesHeroText = computed(() => {
  const { total, summaryCount, websiteCount, sparseCount } = companiesDashboard.value

  if (!total) {
    return 'Build your company map here. Add companies to track website coverage, operating context, and which records still need enrichment.'
  }

  return `${total} companies tracked, ${summaryCount} with a working summary, ${websiteCount} with public websites, and ${sparseCount} still need enrichment.`
})

const companiesDashboardStats = computed(() => [
  {
    label: 'Total companies',
    value: companiesDashboard.value.total,
    caption: 'Organizations in your workspace',
    tone: 'neutral',
  },
  {
    label: 'Websites',
    value: companiesDashboard.value.websiteCount,
    caption: 'Public presence available',
    tone: 'rich',
  },
  {
    label: 'Summaries',
    value: companiesDashboard.value.summaryCount,
    caption: 'One-liner or description captured',
    tone: 'rich',
  },
  {
    label: 'Need enrichment',
    value: companiesDashboard.value.sparseCount,
    caption: 'Missing core context',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...rows.value]

  if (companyKindFilter.value === 'asset_managers') {
    items = items.filter((row) => classifyCompanyKind(row) === 'asset_managers')
  } else if (companyKindFilter.value === 'corps') {
    items = items.filter((row) => classifyCompanyKind(row) === 'corps')
  }

  if (stageFilter.value) {
    items = items.filter((row) => normalizeCompanyValue(row?.Company_Stage) === stageFilter.value)
  }

  if (industryFilter.value) {
    items = items.filter(
      (row) =>
        normalizeCompanyValue(
          row?.Industry_Name ||
            row?.Industry ||
            row?.Industry_Sector ||
            row?.Sector ||
            row?.Vertical,
        ) === industryFilter.value,
    )
  }

  if (locationFilter.value) {
    items = items.filter(
      (row) =>
        normalizeCompanyValue(row?.Headquarters_City_Name || row?.Incorporation_Country_Name) ===
        locationFilter.value,
    )
  }

  if (statusFilter.value) {
    items = items.filter((row) => normalizeCompanyValue(row?.Status) === statusFilter.value)
  }

  if (query) {
    items = items.filter((row) =>
      [
        row?.Company_Name,
        row?.Short_Name,
        row?.Website,
        row?.Status,
        row?.Company_Type,
        row?.Company_Stage,
        row?.Headquarters_City_Name,
        row?.Incorporation_Country_Name,
        row?.created_at,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

const allVisibleCompaniesSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((row) => isSelected(row)),
)

const someVisibleCompaniesSelected = computed(
  () => displayRows.value.some((row) => isSelected(row)) && !allVisibleCompaniesSelected.value,
)

function toggleSelectAllVisibleCompanies(shouldSelect) {
  if (!shouldSelect) {
    const visibleIds = new Set(displayRows.value.map((row) => String(row?.id || '').trim()).filter(Boolean))
    selectedRows.value = selectedRows.value.filter(
      (row) => !visibleIds.has(String(row?.id || '').trim()),
    )
    return
  }

  const selectedIds = new Set(
    selectedRows.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  const additions = displayRows.value.filter((row) => {
    const rowId = String(row?.id || '').trim()
    return rowId && !selectedIds.has(rowId)
  })
  if (additions.length) selectedRows.value = [...selectedRows.value, ...additions]
}

function normalizeCompanyValue(value) {
  return String(value || '').trim()
}

function classifyCompanyKind(row) {
  const companyType = normalizeCompanyValue(row?.Company_Type).toLowerCase()
  const companyName = normalizeCompanyValue(row?.Company_Name).toLowerCase()
  const summary = normalizeCompanyValue(row?.One_Liner || row?.Description).toLowerCase()
  const combined = `${companyType} ${companyName} ${summary}`.trim()
  const assetManagerHints = [
    'asset manager',
    'investment manager',
    'fund manager',
    'venture partner',
    'venture capital',
    'asset management',
    'investment adviser',
    'investment advisor',
    'registered investment adviser',
    'ria',
    'family office',
    'fund',
    'gp',
  ]

  return assetManagerHints.some((hint) => combined.includes(hint)) ? 'asset_managers' : 'corps'
}

function hasCompanyLogo() {
  return false
}

function getCompanyInitials(row) {
  const label = normalizeCompanyValue(row?.Company_Name) || 'Company'
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'CO'
  )
}

function getCompanyAvatarColor(row) {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(normalizeCompanyValue(row?.Company_Name) || 'Company')) % palette.length]
}

function buildAvatarImage(label) {
  const text =
    typeof label === 'object' && label !== null
      ? String(label?.Company_Name || 'Company').trim()
      : String(label || 'Company').trim()
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'CO'

  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  const bg = palette[Math.abs(hashString(text)) % palette.length]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <rect width="112" height="112" rx="24" fill="${bg}" />
      <text x="56" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeSvg(initials)}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function hashString(value) {
  let hash = 0
  for (const char of String(value)) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash |= 0
  }
  return hash
}

function escapeSvg(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getCompanyCardStyle(row) {
  const theme = getContactCompletenessTheme(
    countFilledContactFields(row, COMPANY_COMPLETENESS_IGNORED_FIELDS),
  )

  return {
    '--company-card-blob-x': '50%',
    '--company-card-blob-y': '32%',
    '--company-card-blob-size': '58%',
    '--company-card-blob-opacity': '0',
    '--company-card-blob-strong': theme.blobStrong,
    '--company-card-blob-soft': theme.blobSoft,
    '--company-card-blob-fade': theme.blobFade,
  }
}

function onCompanyCardPointerEnter(event) {
  updateCompanyCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--company-card-blob-opacity', '1')
}

function onCompanyCardPointerMove(event) {
  updateCompanyCardGradientPosition(event)
}

function onCompanyCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--company-card-blob-opacity', '0')
}

function updateCompanyCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--company-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--company-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getCompanyCardSubtitle(row) {
  return (
    normalizeCompanyValue(row?.One_Liner) ||
    normalizeCompanyValue(row?.Company_Type) ||
    'Company story not added yet'
  )
}

function getCompanyCardContentView(row) {
  const rowId = String(row?.id || '').trim()
  return companyCardContentViews.value[rowId] || 'card'
}

function setCompanyCardContentView(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  companyCardContentViews.value = {
    ...companyCardContentViews.value,
    [rowId]: value || 'card',
  }
}

function getCompanyCardPanel(row) {
  const rowId = String(row?.id || '').trim()
  return resolveCardRelationshipPanel(companyCardPanels.value[rowId], getCompanyRelationshipItems(row))
}

function setCompanyCardPanel(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  companyCardPanels.value = {
    ...companyCardPanels.value,
    [rowId]: value || 'notes',
  }
}

function getCompanyRelationshipItems(row) {
  return buildCardRelationshipItems(row, ['Company'], {
    notes: getCompanyLinkedNotes,
    artifacts: getCompanyLinkedDocuments,
  })
}

function getCompanyRelationshipOptions(row) {
  return buildCardRelationshipOptions(getCompanyRelationshipItems(row))
}

function getCompanyActiveRelationshipItems(row) {
  return getCompanyRelationshipItems(row)[getCompanyCardPanel(row)] || []
}

function getCompanyMetadataRows(row) {
  const website = normalizeCompanyValue(row?.Website)
  const email = normalizeCompanyValue(row?.Company_Email || row?.Email || row?.email)
  const phone = normalizeCompanyValue(
    row?.Company_Phone || row?.Phone || row?.phone || row?.Phone_Number || row?.phone_number,
  )

  return [
    normalizeCompanyValue(row?.Company_Type)
      ? {
          label: 'Type',
          value: normalizeCompanyValue(row.Company_Type),
          icon: 'category',
        }
      : null,
    getCompanyLocationValue(row)
      ? {
          label: 'HQ',
          value: getCompanyLocationValue(row),
          icon: 'place',
        }
      : null,
    website
      ? {
          label: 'Website',
          value: formatCompanyWebsiteValue(website),
          icon: 'public',
          href: normalizeExternalUrl(website),
          external: true,
        }
      : null,
    email
      ? {
          label: 'Email',
          value: email,
          icon: 'mail',
          href: `mailto:${email}`,
        }
      : null,
    phone
      ? {
          label: 'Phone',
          value: phone,
          icon: 'call',
          href: `tel:${phone}`,
        }
      : null,
  ].filter(Boolean)
}

function getCompanyLinkedNotes(row) {
  return [
    ...String(row?.Company_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getCompanyLinkedDocuments(row) {
  return [
    ...String(row?.Company_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

async function openCompanyCardAction(link, event) {
  event?.preventDefault?.()
  event?.stopPropagation?.()

  const href = normalizeCompanyValue(link?.href)
  if (!href) return

  try {
    if (bridge.value?.links?.openExternal) {
      await bridge.value.links.openExternal(href)
      return
    }

    window.open(href, link?.external ? '_blank' : '_self', 'noopener,noreferrer')
  } catch (actionError) {
    $q.notify({
      type: 'negative',
      message: actionError?.message || 'Unable to open link.',
    })
  }
}

function normalizeExternalUrl(value) {
  const normalized = normalizeCompanyValue(value)
  if (!normalized) return ''
  if (/^[a-z][a-z\d+.-]*:/i.test(normalized)) return normalized
  return `https://${normalized}`
}

function formatCompanyWebsiteValue(value) {
  const normalized = normalizeExternalUrl(value)

  try {
    const url = new URL(normalized)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return normalizeCompanyValue(value)
  }
}

function getCompanyLocationValue(row) {
  return [row?.Headquarters_City_Name, row?.Incorporation_Country_Name]
    .map((value) => normalizeCompanyValue(value))
    .filter(Boolean)
    .slice(0, 2)
    .join(', ')
}

function exportCompaniesCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('companies.csv', csv, 'text/csv')
  if (ok !== true) $q.notify({ type: 'negative', message: 'Browser denied file download.' })
}

function pickImportFile() {
  fileInput.value?.click?.()
}

async function onImportFileSelected(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsed = csvToRows(text)
    const result = await importRows(parsed.rows)
    $q.notify({
      type: 'positive',
      message: `Imported CSV (${result?.inserted ?? 0} inserted, ${result?.updated ?? 0} updated, ${result?.skipped ?? 0} skipped).`,
    })
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.message || String(err) })
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function loadCompanies() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.companies.list()
    rows.value = result?.companies || []
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
  const result = await bridge.value.companies.upsertMany(importedRows)
  await loadCompanies()
  return result
}

async function onCompanyCreated() {
  await loadCompanies()
}

function normalizeSelectedRows() {
  const activeIds = new Set(displayRows.value.map((row) => String(row?.id || '').trim()))
  selectedRows.value = selectedRows.value.filter((row) =>
    activeIds.has(String(row?.id || '').trim()),
  )
}

function isSelected(row) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return false
  return selectedRows.value.some((selectedRow) => String(selectedRow?.id || '').trim() === rowId)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return

  const nextSelection = typeof shouldSelect === 'boolean' ? shouldSelect : !isSelected(row)

  if (nextSelection) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }

  selectedRows.value = selectedRows.value.filter(
    (selectedRow) => String(selectedRow?.id || '').trim() !== rowId,
  )
}

let companySectionRequestToken = 0

async function loadCompanySectionRows() {
  if (!companySectionTabs.has(companyTableTab.value)) return

  const companyId = String(activeCompanyRow.value?.id || '').trim()
  const activeTab = companyTableTab.value
  const requestToken = ++companySectionRequestToken

  if (!companyId) {
    companySectionRows.value = {
      ...companySectionRows.value,
      [activeTab]: [],
    }
    return
  }

  companySectionLoading.value = true
  try {
    let nextRows = []

    if (activeTab === 'kdb-relations' && bridge.value?.db?.query) {
      const [contactRows, companyRows, fundRows, roundRows, projectRows, taskRows, artifactRows] =
        await Promise.all([
          bridge.value.db.query(
            `
            SELECT contact_id FROM (
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_founders
              UNION
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_related_contacts
              UNION
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_captable_individuals
              UNION
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_referred_by
              UNION
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_referred_to
              UNION
              SELECT to_id AS contact_id, from_id AS company_id FROM Companies_Contacts_current_company
              UNION
              SELECT from_id AS contact_id, to_id AS company_id FROM Contacts_Companies_tenure
            )
            WHERE CAST(company_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT from_id FROM (
              SELECT from_id, to_id FROM Companies_Companies_captable_institutional_investors
              UNION
              SELECT from_id, to_id FROM Companies_Companies_companies_invested
            )
            WHERE CAST(to_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT to_id
            FROM Companies_Funds_has_funds
            WHERE CAST(from_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT round_id FROM (
              SELECT to_id AS round_id, from_id AS company_id FROM Companies_Rounds_has_rounds
              UNION
              SELECT round_id, sponsor_company_id AS company_id FROM Round_Overview WHERE sponsor_company_id IS NOT NULL
            )
            WHERE CAST(company_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT to_id
            FROM Companies_Projects_projects
            WHERE CAST(from_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT to_id
            FROM Companies_Tasks_tasks
            WHERE CAST(from_id AS TEXT) = ?
          `,
            [companyId],
          ),
          bridge.value.db.query(
            `
            SELECT artifact_id
            FROM Companies_Artifacts_documents
            WHERE CAST(company_id AS TEXT) = ?
          `,
            [companyId],
          ),
        ])
      const result = await bridge.value.notes.list?.()
      const notes = Array.isArray(result?.notes) ? result.notes : []
      nextRows = [
        {
          id: companyId,
          contact_count: Array.isArray(contactRows) ? contactRows.length : 0,
          company_count: Array.isArray(companyRows) ? companyRows.length : 0,
          fund_count: Array.isArray(fundRows) ? fundRows.length : 0,
          round_count: Array.isArray(roundRows) ? roundRows.length : 0,
          project_count: Array.isArray(projectRows) ? projectRows.length : 0,
          task_count: Array.isArray(taskRows) ? taskRows.length : 0,
          note_count: notes.filter(
            (note) =>
              String(note?.reference_type || '').trim() === 'company' &&
              String(note?.reference_id || '').trim() === companyId,
          ).length,
          artifact_count: Array.isArray(artifactRows) ? artifactRows.length : 0,
        },
      ]
    } else if (activeTab === 'incorporation' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cii.company_id AS id,
          cii.Legal_Entity,
          cii.Date_of_Incorporation,
          cii.incorporation_country,
          cii.Incorporation_Type,
          COUNT(DISTINCT cilf.contact_id) AS founder_count
        FROM Company_Incorporation_Info cii
        LEFT JOIN Company_Incorporation_Legal_Founders cilf ON cilf.company_id = cii.company_id
        WHERE CAST(cii.company_id AS TEXT) = ?
        GROUP BY cii.company_id, cii.Legal_Entity, cii.Date_of_Incorporation, cii.incorporation_country, cii.Incorporation_Type
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'documents' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          ca.artifact_id AS id,
          COALESCE(NULLIF(a.title, ''), ca.artifact_id) AS title,
          ca.document_type,
          a.artifact_format,
          COALESCE(a.updated_at, a.created_at) AS updated_at
        FROM Companies_Artifacts_documents rel
        INNER JOIN Company_Artifacts ca ON ca.artifact_id = rel.artifact_id
        LEFT JOIN Artifacts a ON a.artifact_id = ca.artifact_id
        WHERE CAST(rel.company_id AS TEXT) = ?
        ORDER BY COALESCE(a.updated_at, a.created_at) DESC, title
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'operations' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          coo.company_id AS id,
          coo.Status,
          coo.Company_Stage,
          coo.headquarters_city,
          coo.PAX_Count,
          coo.PAX_Known,
          COUNT(DISTINCT colt.contact_id) AS leadership_count,
          COUNT(DISTINCT coa.contact_id) AS advisor_count
        FROM Company_Operations_Overview coo
        LEFT JOIN Company_Operations_Leadership_Team colt ON colt.company_id = coo.company_id
        LEFT JOIN Company_Operations_Advisors coa ON coa.company_id = coo.company_id
        WHERE CAST(coo.company_id AS TEXT) = ?
        GROUP BY coo.company_id, coo.Status, coo.Company_Stage, coo.headquarters_city, coo.PAX_Count, coo.PAX_Known
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'business' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cbo.company_id AS id,
          cbo.Mission_Vision,
          cbo.Products_Services,
          cbo.Development_Stage,
          cbo.ICP,
          cbo.Business_Model,
          cbo.Pricing
        FROM Company_Business_Overview cbo
        WHERE CAST(cbo.company_id AS TEXT) = ?
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'market' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cmo.company_id AS id,
          cmo.Industry,
          cmo.Niche,
          cmo.Demand_Analysis,
          cmo.Supply_Analysis
        FROM Company_Market_Overview cmo
        WHERE CAST(cmo.company_id AS TEXT) = ?
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'results' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cro.company_id AS id,
          cro.Traction_Overview,
          cro.Customer_Acquisition_Cost,
          cro.Customer_Lifetime_Value,
          cro.General_Admin_Expenses,
          cro.Tech_Expenditure
        FROM Company_Results_Overview cro
        WHERE CAST(cro.company_id AS TEXT) = ?
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'business-plan' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cbp.company_id AS id,
          cbp.Overview,
          cbp.Forecast,
          cbp.Short_Term_Objectives,
          cbp.Long_Term_Objectives,
          cbp.Capital_Needs,
          cbp.Funding_Strategy
        FROM Company_Business_Plan cbp
        WHERE CAST(cbp.company_id AS TEXT) = ?
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    } else if (activeTab === 'fund-raising' && bridge.value?.db?.query) {
      const rowsResult = await bridge.value.db.query(
        `
        SELECT
          cfr.company_id AS id,
          cfr.Rounds_Funds_Count,
          cfr.Amount_Raised,
          cfr.Shareholder_Structure_Artifact_Id,
          COUNT(DISTINCT cfrs.contact_id) AS shareholder_count
        FROM Company_Fund_Raising cfr
        LEFT JOIN Company_Fund_Raising_Shareholders cfrs ON cfrs.company_id = cfr.company_id
        WHERE CAST(cfr.company_id AS TEXT) = ?
        GROUP BY cfr.company_id, cfr.Rounds_Funds_Count, cfr.Amount_Raised, cfr.Shareholder_Structure_Artifact_Id
      `,
        [companyId],
      )
      nextRows = Array.isArray(rowsResult) ? rowsResult : []
    }

    if (requestToken !== companySectionRequestToken) return
    companySectionRows.value = {
      ...companySectionRows.value,
      [activeTab]: nextRows,
    }
  } catch (e) {
    if (requestToken !== companySectionRequestToken) return
    companySectionRows.value = {
      ...companySectionRows.value,
      [activeTab]: [],
    }
    error.value = e?.message || String(e)
  } finally {
    if (requestToken === companySectionRequestToken) {
      companySectionLoading.value = false
    }
  }
}

async function deleteCompany(row) {
  await bridge.value.companies.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.companies?.delete) return
  const company = row?.Company_Name ? ` (${row.Company_Name})` : ''

  $q.dialog({
    title: 'Delete company?',
    message: `This will permanently delete this company${company}. If it has related opportunities, the delete will be blocked.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteCompany(row)
      await loadCompanies()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.companies?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected companies?',
    message: `This will permanently delete ${selectedCount.value} selected compan${selectedCount.value === 1 ? 'y' : 'ies'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteCompany(row)
      }
      selectedRows.value = []
      await loadCompanies()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

function editSelected() {
  const row = selectedRows.value[0]
  if (!row) return
  openRecordView(row)
}

async function shareSelected() {
  if (selectedCount.value === 0) return
  try {
    await copySelectionSummary({
      rows: selectedRows.value,
      getLabel: (row) => normalizeCompanyValue(row?.Company_Name) || `Company ${row?.id || ''}`.trim(),
      entityLabel: 'companies',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected compan${selectedCount.value === 1 ? 'y' : 'ies'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

async function openCompanyMetadataAction(link, event) {
  await openCompanyCardAction(link, event)
}

onMounted(async () => {
  setBreadcrumbActions(COMPANIES_BREADCRUMB_ACTION_OWNER, [
    {
      id: 'import-csv',
      label: 'Import CSV',
      icon: 'download',
      disabled: () => loading.value,
      onClick: pickImportFile,
    },
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: 'upload',
      disabled: () => loading.value || displayRows.value.length === 0,
      onClick: exportCompaniesCsv,
    },
  ])
  window.addEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
  if (!hasBridge.value) return
  await loadCompanies()
  consumeQueuedCompanyDialogOpen()
  openCreateCompanyFromQuery()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(COMPANIES_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateCompanyFromQuery()
  },
)

watch(
  () => route.query.view,
  (value) => {
    const nextView = getRouteViewMode(value)
    if (viewMode.value !== nextView) viewMode.value = nextView
  },
)

watch(
  () => route.query.tableTab,
  (value) => {
    const nextTab = getRouteTableTab(value)
    if (companyTableTab.value !== nextTab) companyTableTab.value = nextTab
  },
)

watch(viewMode, () => {
  syncViewModeQuery()
})

watch(companyTableTab, () => {
  syncViewModeQuery()
})

watch(displayRows, () => {
  normalizeSelectedRows()
})

watch(
  () => [companyTableTab.value, String(activeCompanyRow.value?.id || '').trim()].join(':'),
  async () => {
    if (!companySectionTabs.has(companyTableTab.value)) return
    await loadCompanySectionRows()
  },
)
</script>

<style scoped>
.companies-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.companies-table-tabs {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 4px;
}

.companies-table-tabs__nav {
  width: 100%;
  border-bottom: 1px solid rgba(17, 17, 17, 0.12);
}

.companies-table-tabs__nav :deep(.q-tabs__content) {
  justify-content: flex-start;
  gap: 8px;
}

.companies-table-tabs__nav :deep(.q-tab) {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(17, 17, 17, 0.12);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: rgba(255, 255, 255, 0.82);
}

.companies-table-tabs__nav :deep(.q-tab--active) {
  background: #fff;
  border-color: rgba(17, 17, 17, 0.2);
}

.companies-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.companies-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  box-shadow: var(--ds-shadow-card-soft);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.companies-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.companies-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.companies-shell__hero > * {
  position: relative;
  z-index: 1;
}

.companies-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: flex-start;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.companies-shell__eyebrow {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.16em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.companies-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.companies-shell__hero-text {
  margin: auto 0 0;
  display: flex;
  align-items: flex-end;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
  max-width: 52ch;
}

.companies-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.companies-shell__meta-pill {
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
  line-height: var(--ds-line-height-xs);
}

.companies-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ds-space-14);
}

.companies-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.companies-dashboard__stat {
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

.companies-dashboard__stat--neutral {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.companies-dashboard__stat--rich {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.companies-dashboard__stat--sparse {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.companies-dashboard__stat-label,
.companies-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.companies-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.companies-dashboard__stat-caption,
.companies-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.companies-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.companies-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.companies-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.companies-dashboard__health-segment {
  display: block;
  height: 100%;
}

.companies-dashboard__health-segment--sparse {
  background: #ff5521;
}

.companies-dashboard__health-segment--medium {
  background: #ebff5a;
}

.companies-dashboard__health-segment--rich {
  background: #2647ff;
}

.companies-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.companies-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.companies-toolbar__block--primary {
  margin-right: 4px;
}

.companies-toolbar__block--actions {
  grid-column: -2 / -1;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.companies-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.companies-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.companies-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.companies-toolbar__search :deep(.q-field__control),
.companies-toolbar__search :deep(.q-field__native),
.companies-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.companies-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.companies-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.companies-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.companies-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.companies-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.companies-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.companies-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.companies-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.companies-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
}

.companies-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.companies-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.companies-toolbar__add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
}

.companies-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.companies-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.companies-toolbar__toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.companies-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.companies-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.companies-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.companies-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.companies-empty-state {
  padding: 24px;
}

.companies-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.companies-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.companies-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.companies-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.companies-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.companies-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: var(--ds-space-12) var(--ds-space-16);
  border-top: 1px solid var(--ds-table-border);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.companies-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.companies-cards-grid {
  align-items: stretch;
}

.company-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border-radius: 28px;
  border-color: #e5e5e5;
  box-shadow: 0 16px 40px rgba(17, 17, 17, 0.05);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.company-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--company-card-blob-x) var(--company-card-blob-y),
    var(--company-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--company-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--company-card-blob-size) * 0.46),
    var(--company-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--company-card-blob-size) * 0.7),
    transparent var(--company-card-blob-size)
  );
  opacity: var(--company-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.company-card > * {
  position: relative;
  z-index: 1;
}

.company-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.company-card__hero {
  padding: 0;
}

.company-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.company-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.company-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 0;
}

.company-card__portrait::after {
  display: none;
}

.company-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.company-card__portrait-badge {
  display: flex;
  position: relative;
  z-index: 1;
  width: clamp(124px, 48%, 152px);
  height: clamp(124px, 48%, 152px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 40px rgba(17, 17, 17, 0.16);
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.2vw, 3rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
  overflow: hidden;
}

.company-card__portrait-badge--logo {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(17, 17, 17, 0.08);
}

.company-card__portrait-logo {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.company-card__hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}

.company-card__summary-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.company-card__title {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.company-card__bottom-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-card__role--detail {
  display: flex;
  align-items: center;
  width: 100%;
}

.company-card__inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0 10px;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.company-card__inline-chip:hover {
  color: #1d4ed8;
}

.company-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px 20px 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
  backdrop-filter: none;
}

.company-card__summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-card__summary-view-toggle {
  margin-left: auto;
  margin-right: 14px;
  border-radius: var(--ds-control-radius);
}

.company-card__summary-view-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.company-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.company-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.company-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.company-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.company-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.company-card__summary-toggle :deep(.q-btn) {
  position: relative;
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.company-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.company-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  transform: none;
  padding: 4px 7px;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(239, 239, 239, 0.5);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}

.company-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.company-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.company-card__summary-toggle {
  margin-left: 14px;
  margin-right: auto;
}

.company-card__summary-add-relation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  min-height: 22px;
  padding: 0 2px 0 0;
  color: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.company-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.company-card__summary-add-relation-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
}

.company-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 11px;
}

.company-card__summary-add-relation-label {
  color: rgba(17, 17, 17, 0.86);
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.company-card__summary-panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.company-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.company-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  direction: rtl;
  padding-left: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(17, 17, 17, 0.18) transparent;
}

.company-card__summary-body::-webkit-scrollbar {
  width: 6px;
}

.company-card__summary-body::-webkit-scrollbar-track {
  background: transparent;
}

.company-card__summary-body::-webkit-scrollbar-thumb {
  background: rgba(17, 17, 17, 0.16);
  border-radius: 999px;
}

.company-card__summary-body-content {
  direction: ltr;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.company-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.company-card__notes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.company-card__notes-list--rows {
  flex-direction: column;
  flex-wrap: nowrap;
}

.company-card__note-pill {
  padding: 8px 12px;
  color: #4b4b4b;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
}

.company-card__notes-list--rows .company-card__note-pill {
  width: 100%;
  border-radius: 12px;
}

.company-card__icon-action {
  color: #111;
  background: transparent;
  border: 0;
  transform: scale(0.75);
  transform-origin: center;
}

.company-card__select-box {
  margin-left: -3.5px;
  transform: scale(0.75);
  transform-origin: center;
}


.company-card__control-eye {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  padding: 0;
  color: #111;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.company-card__control-eye :deep(.q-icon) {
  font-size: 14px;
}

.companies-section-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.companies-section-table__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.companies-section-table__eyebrow {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.companies-section-table__title {
  color: #111;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.3;
}

.companies-section-table__badge {
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .companies-shell {
    gap: 32px;
  }

  .companies-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .companies-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
  }

  .companies-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .companies-toolbar__search {
    width: 100%;
  }

  .companies-toolbar__toggle {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .companies-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .companies-dashboard__stat {
    min-height: 98px;
  }

  .company-card {
    border-radius: 20px;
  }

  .company-card__hero-main {
    grid-template-columns: 1fr;
    height: auto;
  }

  .company-card__portrait {
    min-height: 148px;
    border-right: 0;
    border-bottom: 0;
  }

  .company-card__hero-side {
    gap: 12px;
    padding: 14px;
  }

  .company-card__summary {
    margin-right: 16px;
    margin-left: 16px;
  }
}
</style>
