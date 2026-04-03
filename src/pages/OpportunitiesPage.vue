<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Opportunities requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="opportunities-page">
      <section class="opportunities-shell">
        <div
          class="opportunities-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="opportunities-shell__copy">
            <div class="opportunities-shell__eyebrow">{{ currentOpportunityMode.eyebrow }}</div>
            <h2 class="opportunities-shell__hero-title">{{ currentOpportunityMode.heroTitle }}</h2>
            <p class="opportunities-shell__hero-text">{{ opportunitiesHeroText }}</p>

          </div>

          <div class="opportunities-dashboard">
            <div class="opportunities-dashboard__stats">
              <article
                v-for="stat in opportunitiesDashboardStats"
                :key="stat.label"
                class="opportunities-dashboard__stat"
                :class="`opportunities-dashboard__stat--${stat.tone}`"
              >
                <div class="opportunities-dashboard__stat-label">{{ stat.label }}</div>
                <div class="opportunities-dashboard__stat-value">{{ stat.value }}</div>
                <div class="opportunities-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="opportunities-dashboard__health">
              <div class="opportunities-dashboard__health-copy">
                <div class="opportunities-dashboard__health-label">Deal readiness</div>
                <div class="opportunities-dashboard__health-text">
                  {{ opportunitiesDashboard.richCount }} rich, {{ opportunitiesDashboard.mediumCount }} medium,
                  {{ opportunitiesDashboard.sparseCount }} sparse
                </div>
              </div>

              <div class="opportunities-dashboard__health-bar" aria-hidden="true">
                <span
                  class="opportunities-dashboard__health-segment opportunities-dashboard__health-segment--sparse"
                  :style="{ width: `${opportunitiesDashboard.sparseShare}%` }"
                />
                <span
                  class="opportunities-dashboard__health-segment opportunities-dashboard__health-segment--medium"
                  :style="{ width: `${opportunitiesDashboard.mediumShare}%` }"
                />
                <span
                  class="opportunities-dashboard__health-segment opportunities-dashboard__health-segment--rich"
                  :style="{ width: `${opportunitiesDashboard.richShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="opportunities-toolbar">
          <div class="opportunities-toolbar__block opportunities-toolbar__block--primary">
            <q-checkbox
              :model-value="allVisibleOpportunitiesSelected"
              :indeterminate="someVisibleOpportunitiesSelected && !allVisibleOpportunitiesSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="opportunities-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleOpportunities"
            />
            <q-btn
              no-caps
              unelevated
              class="opportunities-toolbar__add-button"
              :disable="loading"
              @click="openCreateOpportunityRecord"
            >
              <span class="opportunities-toolbar__add-button-inner">
                <span class="opportunities-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="opportunities-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn dense flat round icon="download" color="grey-6" class="opportunities-toolbar__icon-button" :disable="loading" @click="pickImportFile">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="opportunities-toolbar__block opportunities-toolbar__block--actions">
            <q-icon name="tune" size="18px" class="opportunities-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="opportunities-toolbar__search"
              :placeholder="`Search ${currentOpportunityMode.queryLabel}...`"
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
              class="opportunities-toolbar__toggle opportunities-toolbar__view-toggle"
              :disable="loading"
              :options="viewOptions"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="opportunities-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="opportunities-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>{{ currentOpportunityMode.emptyLabel }}</div>
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="opportunities-table"
            flat
            bordered
            row-key="id"
            v-model:selected="selectedRows"
            v-model:pagination="pagination"
            selection="multiple"
            :rows="displayRows"
            :columns="columns"
            :loading="loading"
            :rows-per-page-options="rowsPerPageOptions"
          >
            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="opportunities-table__actions">
                  <q-btn
                    dense
                    flat
                    round
                    icon="visibility"
                    color="grey-8"
                    :disable="loading"
                    @click="openRecordView(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="grey-8"
                    :disable="loading || !canDeleteOpportunities"
                    @click="confirmDelete(props.row)"
                  />
                </div>
              </q-td>
            </template>
          </q-table>

          <div v-else class="row q-col-gutter-md opportunities-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card
                flat
                bordered
                class="opportunity-card full-height"
                :style="getOpportunityCardStyle()"
                @pointerenter="onOpportunityCardPointerEnter"
                @pointermove="onOpportunityCardPointerMove"
                @pointerleave="onOpportunityCardPointerLeave"
              >
                <q-card-section class="opportunity-card__control-row">
                  <q-checkbox
                    :model-value="isSelected(row)"
                    :disable="loading"
                    color="dark"
                    class="opportunity-card__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="opportunity-card__control-eye"
                    :disable="loading"
                    @click="openRecordView(row)"
                  />
                </q-card-section>
                <q-card-section class="opportunity-card__hero">
                  <div class="opportunity-card__hero-main">
                    <figure class="opportunity-card__portrait">
                      <div class="opportunity-card__portrait-shell" aria-hidden="true">
                        <div
                          class="opportunity-card__portrait-badge"
                          :style="{ backgroundColor: getOpportunityAvatarColor(row.opportunity_name || row.Company_Name || row.kind) }"
                        >
                          {{ getOpportunityAvatarInitial(row.opportunity_name || row.Company_Name || row.kind) }}
                        </div>
                      </div>
                    </figure>

                    <div class="opportunity-card__hero-side">
                      <div class="opportunity-card__hero-copy">
                        <div class="opportunity-card__title">
                          {{ row.opportunity_name || row.Venture_Oppty_Name || 'Unnamed opportunity' }}
                        </div>

                        <div class="opportunity-card__bottom-stack">
                          <div v-if="getOpportunityMetadataRows(row).length" class="opportunity-card__detail-stack">
                            <div
                              v-for="detail in getOpportunityMetadataRows(row)"
                              :key="detail.label"
                              class="opportunity-card__detail-row"
                            >
                              <button
                                type="button"
                                class="opportunity-card__inline-chip"
                                @click="openOpportunityMetadataAction(detail, $event)"
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

                <q-card-section class="opportunity-card__summary">
                  <div class="opportunity-card__summary-head">
                    <q-btn-toggle
                      :model-value="getOpportunityCardPanel(row)"
                      dense
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="opportunity-card__summary-toggle"
                      :options="getOpportunityRelationshipOptions(row)"
                      @update:model-value="setOpportunityCardPanel(row, $event)"
                    />
                    <q-btn-toggle
                      :model-value="getOpportunityCardContentView(row)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="opportunity-card__summary-view-toggle"
                      :options="opportunityCardContentViewOptions"
                      @update:model-value="setOpportunityCardContentView(row, $event)"
                    />
                  </div>

                  <div class="opportunity-card__summary-panel">
                    <div class="opportunity-card__summary-panel-head">
                      <q-btn flat no-caps class="opportunity-card__summary-add-relation" aria-label="Add Relation">
                        <span class="opportunity-card__summary-add-relation-plus">
                          <q-icon name="add" />
                        </span>
                        <span class="opportunity-card__summary-add-relation-label">Add Relation</span>
                      </q-btn>
                    </div>
                    <div class="opportunity-card__summary-body">
                      <div class="opportunity-card__summary-body-content">
                        <div
                          v-if="getOpportunityActiveRelationshipItems(row).length"
                          :class="[
                            'opportunity-card__notes-list',
                            { 'opportunity-card__notes-list--rows': getOpportunityCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="item in getOpportunityActiveRelationshipItems(row)"
                            :key="item"
                            class="opportunity-card__note-pill"
                          >
                            {{ item }}
                          </div>
                        </div>

                        <div v-else class="opportunity-card__summary-empty">
                          No linked KDB relationships yet for this opportunity.
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <SelectionActionBar
        :count="selectedCount"
        :loading="loading"
        :can-delete="canDeleteOpportunities"
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

  <FundCreateDialog
    v-if="dialogKind === 'fund'"
    v-model="dialogOpen"
    @created="onOpportunityCreated"
  />
  <OpportunityCreateDialog
    v-else-if="dialogKind === 'opportunity'"
    v-model="dialogOpen"
    @created="onOpportunityCreated"
  />
  <RoundCreateDialog
    v-else
    v-model="dialogOpen"
    @created="onOpportunityCreated"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { exportFile, useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import SelectionActionBar from 'components/SelectionActionBar.vue'
import FundCreateDialog from 'src/components/FundCreateDialog.vue'
import OpportunityCreateDialog from 'src/components/OpportunityCreateDialog.vue'
import RoundCreateDialog from 'src/components/RoundCreateDialog.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { createRecordViewOpener } from 'src/utils/recordViewNavigation'
import { copySelectionSummary } from 'src/utils/selectionShare'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'

const ALL_OPPORTUNITIES_FILTER = 'all'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.opportunities?.list &&
    !!bridge.value?.opportunities?.upsertMany &&
    !!bridge.value?.opportunities?.delete,
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

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

function updateHeroDashboardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const dialogKind = ref('round')
const kindFilter = ref(ALL_OPPORTUNITIES_FILTER)
const searchQuery = ref('')
const regionFilter = ref('')
const stageFilter = ref('')
const industryFilter = ref('')
const statusFilter = ref('')
const viewMode = ref('card')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)
const opportunityCardContentViews = ref({})
const opportunityCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const opportunityCardPanels = ref({})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const currentOpportunityMode = computed(() => {
  if (kindFilter.value === 'fund') {
    return {
      title: 'Funds',
      eyebrow: 'Dashboard',
      heroTitle: 'See which funds are taking shape.',
      queryLabel: 'funds',
      kind: 'fund',
      emptyLabel: 'No funds found.',
    }
  }
  if (kindFilter.value === 'round') {
    return {
      title: 'Rounds',
      eyebrow: 'Dashboard',
      heroTitle: 'See which rounds are taking shape.',
      queryLabel: 'rounds',
      kind: 'round',
      emptyLabel: 'No rounds found.',
    }
  }
  return {
    title: 'Opportunities',
    eyebrow: 'Dashboard',
    heroTitle: 'See which deals are taking shape.',
    queryLabel: 'opportunities',
    kind: '',
    emptyLabel: 'No opportunities found.',
  }
})
const canImportOpportunities = false
const canDeleteOpportunities = true
const OPPORTUNITIES_BREADCRUMB_ACTION_OWNER = 'opportunities-page'

function onOpenFundDialog() {
  globalThis.__ecvcOpenFundDialog = false
  dialogKind.value = 'fund'
  dialogOpen.value = true
}

function onOpenRoundDialog() {
  globalThis.__ecvcOpenRoundDialog = false
  dialogKind.value = 'round'
  dialogOpen.value = true
}

function openCreateFromQuery() {
  const createValue = String(route.query.create || '').trim().toLowerCase()
  if (!createValue) return
  dialogKind.value =
    createValue === 'fund' ? 'fund' : createValue === 'opportunity' ? 'opportunity' : 'round'
  dialogOpen.value = true
  globalThis.__ecvcOpenFundDialog = false
  globalThis.__ecvcOpenRoundDialog = false
  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedOpen() {
  if (globalThis.__ecvcOpenFundDialog === true) {
    onOpenFundDialog()
    return true
  }
  if (globalThis.__ecvcOpenRoundDialog === true) {
    onOpenRoundDialog()
    return true
  }
  return false
}

function openCreateOpportunityRecord() {
  if (currentOpportunityMode.value.kind === 'fund') {
    onOpenFundDialog()
    return
  }
  if (currentOpportunityMode.value.kind === 'round') {
    onOpenRoundDialog()
    return
  }
  dialogKind.value = 'opportunity'
  dialogOpen.value = true
}

async function onOpportunityCreated() {
  await loadOpportunities()
}

const openRecordView = createRecordViewOpener(router, {
  getTableName: (row) => (row?.kind === 'fund' ? 'Funds' : row?.kind === 'round' ? 'Rounds' : 'Funds'),
  getReturnTo: () => route.fullPath,
})

const columns = [
  { name: 'kind', label: 'Kind', field: 'kind', align: 'left', sortable: true },
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'Round_Stage', label: 'Round', field: 'Round_Stage', align: 'left', sortable: true },
  { name: 'Fund_Type', label: 'Fund Type', field: 'Fund_Type', align: 'left', sortable: true },
  {
    name: 'opportunity_name',
    label: 'Opportunity Name',
    field: 'opportunity_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'size',
    label: 'Size / Target (USD)',
    field: (row) => opportunityNumericSize(row),
    align: 'right',
    sortable: true,
    format: (_v, row) => displaySize(row),
  },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'kind',
  'company_id',
  'Company_Name',
  'opportunity_name',
  'Venture_Oppty_Name',
  'Round_Stage',
  'Round_Amount',
  'Fund_Type',
  'Fund_Size_Target',
  'Pipeline_Stage',
  'Pipeline_Status',
  'Raising_Status',
]

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const opportunitiesDashboard = computed(() => {
  const total = displayRows.value.length
  const summary = displayRows.value.reduce(
    (accumulator, row) => {
      const hasKind = normalizeOpportunityValue(row?.kind).length > 0
      const hasOwner = normalizeOpportunityValue(row?.Company_Name).length > 0
      const hasName =
        normalizeOpportunityValue(row?.opportunity_name).length > 0 ||
        normalizeOpportunityValue(row?.Venture_Oppty_Name).length > 0
      const hasStage =
        normalizeOpportunityValue(row?.Round_Stage).length > 0 ||
        normalizeOpportunityValue(row?.Pipeline_Stage).length > 0
      const hasFundType = normalizeOpportunityValue(row?.Fund_Type).length > 0
      const hasSize = opportunityNumericSize(row) > 0
      const hasStatus =
        normalizeOpportunityValue(row?.Raising_Status).length > 0 ||
        normalizeOpportunityValue(row?.Pipeline_Status).length > 0
      const profileScore = [hasKind, hasOwner, hasName, hasStage, hasFundType, hasSize, hasStatus].filter(
        Boolean,
      ).length

      if (hasStage) accumulator.stageCount += 1
      if (hasSize) accumulator.sizeCount += 1
      if (normalizeOpportunityValue(row?.kind).toLowerCase() === 'fund') accumulator.fundCount += 1
      if (normalizeOpportunityValue(row?.kind).toLowerCase() === 'round') accumulator.roundCount += 1

      if (profileScore < 3) accumulator.sparseCount += 1
      else if (profileScore <= 5) accumulator.mediumCount += 1
      else accumulator.richCount += 1

      return accumulator
    },
    {
      stageCount: 0,
      sizeCount: 0,
      fundCount: 0,
      roundCount: 0,
      sparseCount: 0,
      mediumCount: 0,
      richCount: 0,
    },
  )

  return {
    total,
    ...summary,
    sparseShare: total ? (summary.sparseCount / total) * 100 : 0,
    mediumShare: total ? (summary.mediumCount / total) * 100 : 0,
    richShare: total ? (summary.richCount / total) * 100 : 0,
    filteredKindCount: currentOpportunityMode.value.kind
      ? currentOpportunityMode.value.kind === 'fund'
        ? summary.fundCount
        : summary.roundCount
      : total,
  }
})

const opportunitiesHeroText = computed(() => {
  const { total, stageCount, sizeCount, sparseCount } = opportunitiesDashboard.value

  if (!total) {
    return `Track every ${currentOpportunityMode.value.queryLabel} record here. Add deal details to understand stage coverage, sizing, and which records still need context.`
  }

  return `${total} ${currentOpportunityMode.value.queryLabel} tracked, ${stageCount} already staged, ${sizeCount} sized, and ${sparseCount} still need more investment context.`
})

const opportunitiesDashboardStats = computed(() => [
  {
    label: `Total ${currentOpportunityMode.value.queryLabel}`,
    value: opportunitiesDashboard.value.total,
    caption: 'Deals and fund tracks in motion',
    tone: 'neutral',
  },
  {
    label: 'Staged',
    value: opportunitiesDashboard.value.stageCount,
    caption: 'Round or pipeline stage mapped',
    tone: 'rich',
  },
  {
    label: 'Sized',
    value: opportunitiesDashboard.value.sizeCount,
    caption: 'Amount or target captured',
    tone: 'rich',
  },
  {
    label: 'Need enrichment',
    value: opportunitiesDashboard.value.sparseCount,
    caption: 'Still missing key deal context',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...rows.value]

  if (currentOpportunityMode.value.kind) {
    items = items.filter(
      (row) => normalizeOpportunityValue(row?.kind).toLowerCase() === currentOpportunityMode.value.kind,
    )
  }

  if (query) {
    items = items.filter((row) =>
      [
        row?.kind,
        row?.Company_Name,
        row?.created_at,
        row?.Round_Stage,
        row?.Fund_Type,
        row?.opportunity_name,
        row?.Venture_Oppty_Name,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  if (regionFilter.value) {
    items = items.filter(
      (row) =>
        normalizeOpportunityValue(
          row?.Headquarters_City ||
            row?.Headquarters_City_Name,
        ) === regionFilter.value,
    )
  }

  if (stageFilter.value) {
    items = items.filter(
      (row) => normalizeOpportunityValue(row?.Round_Stage || row?.Pipeline_Stage) === stageFilter.value,
    )
  }

  if (statusFilter.value) {
    items = items.filter(
      (row) => normalizeOpportunityValue(row?.Raising_Status || row?.Pipeline_Status) === statusFilter.value,
    )
  }

  if (industryFilter.value) {
    items = items.filter(
      (row) =>
        normalizeOpportunityValue(
          row?.Industry_Name ||
            row?.Industry ||
            row?.industry ||
            row?.Industry_Sector ||
            row?.Sector ||
            row?.Vertical ||
            row?.Company_Industry,
        ) === industryFilter.value,
    )
  }

  return items
})

const allVisibleOpportunitiesSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((row) => isSelected(row)),
)

const someVisibleOpportunitiesSelected = computed(
  () =>
    displayRows.value.some((row) => isSelected(row)) && !allVisibleOpportunitiesSelected.value,
)

function toggleSelectAllVisibleOpportunities(shouldSelect) {
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

function opportunityNumericSize(row) {
  const value = row?.kind === 'fund' ? row?.Fund_Size_Target : row?.Round_Amount
  return Number(value || 0)
}

function displaySize(row) {
  const value = opportunityNumericSize(row)
  return value ? value.toLocaleString('en-US') : ''
}

function normalizeOpportunityValue(value) {
  return String(value || '').trim()
}

function getOpportunityCardStyle() {
  return {
    '--opportunity-card-blob-x': '50%',
    '--opportunity-card-blob-y': '30%',
    '--opportunity-card-blob-size': '60%',
    '--opportunity-card-blob-opacity': '0',
    '--opportunity-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--opportunity-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--opportunity-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onOpportunityCardPointerEnter(event) {
  updateOpportunityCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--opportunity-card-blob-opacity', '1')
}

function onOpportunityCardPointerMove(event) {
  updateOpportunityCardGradientPosition(event)
}

function onOpportunityCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--opportunity-card-blob-opacity', '0')
}

function updateOpportunityCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  element.style.setProperty('--opportunity-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--opportunity-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getOpportunityCardContentView(row) {
  const rowId = String(row?.id || '').trim()
  return opportunityCardContentViews.value[rowId] || 'card'
}

function setOpportunityCardContentView(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  opportunityCardContentViews.value = {
    ...opportunityCardContentViews.value,
    [rowId]: value || 'card',
  }
}

function getOpportunityCardPanel(row) {
  const rowId = String(row?.id || '').trim()
  return resolveCardRelationshipPanel(opportunityCardPanels.value[rowId], getOpportunityRelationshipItems(row))
}

function setOpportunityCardPanel(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  opportunityCardPanels.value = {
    ...opportunityCardPanels.value,
    [rowId]: value || 'notes',
  }
}

function getOpportunityRelationshipItems(row) {
  return buildCardRelationshipItems(row, ['Opportunity', 'Fund', 'Round'], {
    notes: getOpportunityLinkedNotes,
    artifacts: getOpportunityLinkedDocuments,
  })
}

function getOpportunityRelationshipOptions(row) {
  return buildCardRelationshipOptions(getOpportunityRelationshipItems(row))
}

function getOpportunityActiveRelationshipItems(row) {
  return getOpportunityRelationshipItems(row)[getOpportunityCardPanel(row)] || []
}

function getOpportunityStatusValue(row) {
  return (
    normalizeOpportunityValue(row?.Raising_Status) ||
    normalizeOpportunityValue(row?.Pipeline_Status) ||
    normalizeOpportunityValue(row?.Status)
  )
}

function getOpportunityAvatarColor() {
  return '#111111'
}

function getOpportunityAvatarInitial(label) {
  const text = String(label || 'Opportunity').trim()
  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'OP'
  )
}

function getOpportunityClosingDateValue(row) {
  return (
    normalizeOpportunityValue(row?.Closing_Date) ||
    normalizeOpportunityValue(row?.Close_Date) ||
    normalizeOpportunityValue(row?.Round_Close_Date) ||
    normalizeOpportunityValue(row?.Fund_Close_Date)
  )
}

function getOpportunityMetadataRows(row) {
  const company = normalizeOpportunityValue(row?.Company_Name)
  const kind = normalizeOpportunityValue(row?.kind)
  const size = displaySize(row)
  const closingDate = getOpportunityClosingDateValue(row)
  const status = getOpportunityStatusValue(row)

  return [
    company
      ? { label: 'Company', value: company, icon: 'apartment' }
      : null,
    kind
      ? { label: 'Kind', value: kind, icon: 'category' }
      : null,
    size
      ? { label: 'Size', value: size, icon: 'payments' }
      : null,
    closingDate
      ? { label: 'Closing date', value: closingDate, icon: 'event' }
      : null,
    status
      ? { label: 'Status', value: status, icon: 'flag' }
      : null,
  ].filter(Boolean)
}

function getOpportunityLinkedNotes(row) {
  return [
    ...String(row?.Opportunity_Note || row?.Fund_Note || row?.Round_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getOpportunityLinkedDocuments(row) {
  return [
    ...String(row?.Opportunity_Artifact || row?.Fund_Artifact || row?.Round_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function openOpportunityMetadataAction(link, event) {
  event?.preventDefault?.()
  event?.stopPropagation?.()
}

function exportOpportunitiesCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('opportunities.csv', csv, 'text/csv')
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

async function loadOpportunities() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.opportunities.list()
    rows.value = result?.opportunities || []
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
  if (!canImportOpportunities) {
    throw new Error(`Import is not wired yet for ${currentOpportunityMode.value.queryLabel}.`)
  }
  const result = await bridge.value.opportunities.upsertMany(importedRows)
  await loadOpportunities()
  return result
}

function normalizeSelectedRows() {
  const activeIds = new Set(displayRows.value.map((row) => row.id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.id))
}

function isSelected(row) {
  return selectedRows.value.some((selectedRow) => selectedRow.id === row?.id)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return

  if (shouldSelect) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }

  selectedRows.value = selectedRows.value.filter((selectedRow) => selectedRow.id !== rowId)
}

async function deleteOpportunity(row) {
  if (!canDeleteOpportunities) return
  await bridge.value.opportunities.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.opportunities?.delete || !canDeleteOpportunities) return
  const company = row?.Company_Name ? ` (${row.Company_Name})` : ''

  $q.dialog({
    title: 'Delete opportunity?',
    message: `This will permanently delete this opportunity${company}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteOpportunity(row)
      await loadOpportunities()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.opportunities?.delete || selectedCount.value === 0 || !canDeleteOpportunities) return
  $q.dialog({
    title: 'Delete selected opportunities?',
    message: `This will permanently delete ${selectedCount.value} selected opportunit${selectedCount.value === 1 ? 'y' : 'ies'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteOpportunity(row)
      }
      selectedRows.value = []
      await loadOpportunities()
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
      getLabel: (row) =>
        normalizeOpportunityValue(row?.opportunity_name) ||
        normalizeOpportunityValue(row?.Venture_Oppty_Name) ||
        normalizeOpportunityValue(row?.Company_Name) ||
        `Opportunity ${row?.id || ''}`.trim(),
      entityLabel: 'opportunities',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected opportunit${selectedCount.value === 1 ? 'y' : 'ies'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

function onChanged() {
  loadOpportunities()
}

function routeKindFilterValue() {
  const routeName = String(route.name || '').trim().toLowerCase()
  const queryKind = String(route.query.kind || '').trim().toLowerCase()

  if (queryKind === 'fund' || queryKind === 'round') return queryKind
  if (routeName === 'funds') return 'fund'
  if (routeName === 'rounds') return 'round'
  return ALL_OPPORTUNITIES_FILTER
}

function syncKindFilterFromRoute() {
  kindFilter.value = routeKindFilterValue()
}

function syncRouteToKindFilter(nextKind) {
  const normalizedKind =
    nextKind === 'fund' || nextKind === 'round' ? nextKind : ALL_OPPORTUNITIES_FILTER
  const nextQuery = { ...route.query }

  if (normalizedKind === ALL_OPPORTUNITIES_FILTER) delete nextQuery.kind
  else nextQuery.kind = normalizedKind

  if (
    route.name !== 'opportunities' ||
    String(route.query.kind || '') !== String(nextQuery.kind || '')
  ) {
    router.replace({ name: 'opportunities', query: nextQuery })
  }
}

onMounted(() => {
  setBreadcrumbActions(OPPORTUNITIES_BREADCRUMB_ACTION_OWNER, [
    {
      id: 'import-csv',
      label: 'Import CSV',
      icon: 'download',
      disabled: () => loading.value || !canImportOpportunities,
      onClick: pickImportFile,
    },
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: 'upload',
      disabled: () => loading.value || displayRows.value.length === 0,
      onClick: exportOpportunitiesCsv,
    },
  ])
  if (!hasBridge.value) return
  loadOpportunities()
  consumeQueuedOpen()
  openCreateFromQuery()
  window.addEventListener('ecvc:opportunities-changed', onChanged)
  window.addEventListener('ecvc:open-fund-dialog', onOpenFundDialog)
  window.addEventListener('ecvc:open-round-dialog', onOpenRoundDialog)
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(OPPORTUNITIES_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('ecvc:opportunities-changed', onChanged)
  window.removeEventListener('ecvc:open-fund-dialog', onOpenFundDialog)
  window.removeEventListener('ecvc:open-round-dialog', onOpenRoundDialog)
})

watch(displayRows, () => {
  normalizeSelectedRows()
})

watch(
  () => [route.name, route.query.kind],
  () => {
    syncKindFilterFromRoute()
  },
  { immediate: true },
)

watch(kindFilter, (nextKind, previousKind) => {
  if (nextKind === previousKind) return
  syncRouteToKindFilter(nextKind)
})

watch(
  () => route.query.create,
  () => {
    openCreateFromQuery()
  },
)
</script>

<style scoped>
.opportunities-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.opportunities-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.opportunities-shell__hero {
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

.opportunities-shell__hero::before {
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

.opportunities-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.opportunities-shell__hero > * {
  position: relative;
  z-index: 1;
}

.opportunities-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: flex-start;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.opportunities-shell__eyebrow {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.16em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.opportunities-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.opportunities-shell__hero-text {
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

.opportunities-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.opportunities-shell__meta-pill {
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

.opportunities-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ds-space-14);
}

.opportunities-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.opportunities-dashboard__stat {
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

.opportunities-dashboard__stat--neutral {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.opportunities-dashboard__stat--rich {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.opportunities-dashboard__stat--sparse {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.opportunities-dashboard__stat-label,
.opportunities-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.opportunities-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.opportunities-dashboard__stat-caption,
.opportunities-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.opportunities-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.opportunities-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.opportunities-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.opportunities-dashboard__health-segment {
  display: block;
  height: 100%;
}

.opportunities-dashboard__health-segment--sparse {
  background: #ff5521;
}

.opportunities-dashboard__health-segment--medium {
  background: #ebff5a;
}

.opportunities-dashboard__health-segment--rich {
  background: #2647ff;
}

.opportunities-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.opportunities-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.opportunities-toolbar__block--primary {
  margin-right: 4px;
}

.opportunities-toolbar__block--actions {
  grid-column: -2 / -1;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.opportunities-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.opportunities-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.opportunities-toolbar__toggle {
  flex: 0 0 auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.opportunities-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.opportunities-toolbar__search :deep(.q-field__control),
.opportunities-toolbar__search :deep(.q-field__native),
.opportunities-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.opportunities-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.opportunities-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.opportunities-toolbar__toggle {
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

.opportunities-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.opportunities-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.opportunities-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.opportunities-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.opportunities-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.opportunities-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.opportunities-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.opportunities-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.opportunities-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.opportunities-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.opportunities-toolbar__add-button:hover,
.opportunities-toolbar__add-button:focus-visible {
  transform: translateY(-1px);
}

.opportunities-toolbar__add-button:active,
.opportunities-toolbar__add-button.q-btn--active,
.opportunities-toolbar__add-button.q-btn--standard.q-btn--active {
  color: #ffffff;
  background: #111111;
}

.opportunities-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.opportunities-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.opportunities-toolbar__add-button-plus {
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

.opportunities-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.opportunities-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
  letter-spacing: 0.01em;
}

.opportunities-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.opportunities-empty-state {
  padding: 24px;
}

.opportunities-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.opportunities-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.opportunities-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.opportunities-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.opportunities-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.opportunities-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: var(--ds-space-12) var(--ds-space-16);
  border-top: 1px solid var(--ds-table-border);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.opportunities-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.opportunities-cards-grid {
  align-items: stretch;
}

.opportunity-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border-radius: 28px;
  border-color: #e5e5e5;
  box-shadow: none;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.opportunity-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--opportunity-card-blob-x) var(--opportunity-card-blob-y),
    var(--opportunity-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--opportunity-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--opportunity-card-blob-size) * 0.46),
    var(--opportunity-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--opportunity-card-blob-size) * 0.7),
    transparent var(--opportunity-card-blob-size)
  );
  opacity: var(--opportunity-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.opportunity-card > * {
  position: relative;
  z-index: 1;
}

.opportunity-card:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

.opportunity-card:hover::before {
  opacity: max(var(--opportunity-card-blob-opacity, 0), 0.95);
}

.opportunity-card__hero {
  padding: 0;
}

.opportunity-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.opportunity-card__control-row :deep(.q-checkbox__inner),
.opportunity-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.opportunity-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.opportunity-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 0;
}

.opportunity-card__portrait::after {
  display: none;
}

.opportunity-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.opportunity-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: transparent;
  overflow: hidden;
}

.opportunity-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.opportunity-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.opportunity-card__portrait-badge {
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

.opportunity-card__summary {
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

.opportunity-card__bottom-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opportunity-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.opportunity-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.opportunity-card__inline-chip {
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
  cursor: default;
}

.opportunity-card__summary {
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
}

.opportunity-card__summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.opportunity-card__summary-view-toggle {
  margin-left: auto;
  margin-right: 14px;
  border-radius: var(--ds-control-radius);
}

.opportunity-card__summary-view-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.opportunity-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.opportunity-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.opportunity-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.opportunity-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.opportunity-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.opportunity-card__summary-toggle :deep(.q-btn) {
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

.opportunity-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.opportunity-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
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

.opportunity-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.opportunity-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.opportunity-card__summary-toggle {
  margin-left: 14px;
  margin-right: auto;
}

.opportunity-card__summary-add-relation {
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

.opportunity-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.opportunity-card__summary-add-relation-plus {
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

.opportunity-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 11px;
}

.opportunity-card__summary-add-relation-label {
  color: rgba(17, 17, 17, 0.86);
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.opportunity-card__summary-panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.opportunity-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.opportunity-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  direction: rtl;
  padding-left: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(17, 17, 17, 0.18) transparent;
}

.opportunity-card__summary-body::-webkit-scrollbar {
  width: 6px;
}

.opportunity-card__summary-body::-webkit-scrollbar-track {
  background: transparent;
}

.opportunity-card__summary-body::-webkit-scrollbar-thumb {
  background: rgba(17, 17, 17, 0.16);
  border-radius: 999px;
}

.opportunity-card__summary-body-content {
  direction: ltr;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.opportunity-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.opportunity-card__notes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunity-card__notes-list--rows {
  flex-direction: column;
  flex-wrap: nowrap;
}

.opportunity-card__note-pill {
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

.opportunity-card__notes-list--rows .opportunity-card__note-pill {
  width: 100%;
  border-radius: 12px;
}

.opportunity-card__icon-action {
  color: #111;
  background: transparent;
  border: 0;
  transform: scale(0.75);
  transform-origin: center;
}

.opportunity-card__select-box {
  margin-left: -3.5px;
  transform: scale(0.75);
  transform-origin: center;
}


.opportunity-card__control-eye {
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

.opportunity-card__control-eye :deep(.q-icon) {
  font-size: 14px;
}

.opportunity-card__field {
  display: flex;
  align-items: center;
  min-width: 0;
  color: #404040;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.opportunity-card__footer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 1200px) {
  .opportunities-shell {
    gap: 32px;
  }

  .opportunities-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .opportunities-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
  }

  .opportunities-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .opportunities-toolbar__search {
    width: 100%;
  }

  .opportunities-toolbar__filter-control {
    min-width: 0;
    width: 100%;
  }

  .opportunities-toolbar__toggle {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .opportunities-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .opportunities-dashboard__stat {
    min-height: 98px;
  }

  .opportunity-card__hero-main {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
