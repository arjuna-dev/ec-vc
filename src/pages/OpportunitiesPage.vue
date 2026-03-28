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
      <header class="opportunities-page__heading">
        <h1 class="opportunities-page__title">{{ currentOpportunityMode.title }}</h1>
      </header>

      <section class="opportunities-shell">
        <div class="opportunities-shell__hero">
          <div class="opportunities-shell__copy">
            <div class="opportunities-shell__eyebrow">{{ currentOpportunityMode.eyebrow }}</div>
            <h2 class="opportunities-shell__hero-title">{{ currentOpportunityMode.heroTitle }}</h2>
            <p class="opportunities-shell__hero-text">{{ opportunitiesHeroText }}</p>

            <div class="opportunities-shell__hero-meta">
              <div class="opportunities-shell__meta-pill">
                {{ viewMode === 'card' ? 'Card view active' : 'Table view active' }}
              </div>
              <div v-if="selectedCount > 0" class="opportunities-shell__meta-pill">
                {{ selectedCount }} selected
              </div>
              <div class="opportunities-shell__meta-pill">{{ opportunitiesDashboard.filteredKindCount }} in view</div>
            </div>
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
          <div class="opportunities-toolbar__left">
            <q-btn-toggle
              v-model="kindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="opportunities-toolbar__toggle opportunities-toolbar__kind-toggle"
              :options="kindFilterOptions"
              :disable="loading"
            />

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

          </div>

          <div class="opportunities-toolbar__right">
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
            <q-btn
              dense
              flat
              round
              icon="download"
              :disable="loading || !canImportOpportunities"
              @click="pickImportFile"
            >
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              round
              icon="upload"
              :disable="loading || displayRows.length === 0"
              @click="exportOpportunitiesCsv"
            >
              <q-tooltip>Export CSV</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="opportunities-filterbar">
          <div class="opportunities-filterbar__label">Gold filters</div>

          <q-select
            v-model="companyFilter"
            dense
            outlined
            clearable
            emit-value
            map-options
            class="opportunities-filterbar__control"
            label="Sponsor Company"
            :options="companyFilterOptions"
            :disable="loading || companyFilterOptions.length === 0"
          />

          <q-select
            v-model="stageFilter"
            dense
            outlined
            clearable
            emit-value
            map-options
            class="opportunities-filterbar__control"
            label="Stage"
            :options="stageFilterOptions"
            :disable="loading || stageFilterOptions.length === 0"
          />

          <q-select
            v-model="statusFilter"
            dense
            outlined
            clearable
            emit-value
            map-options
            class="opportunities-filterbar__control"
            label="Status"
            :options="statusFilterOptions"
            :disable="loading || statusFilterOptions.length === 0"
          />

          <q-select
            v-model="fundTypeFilter"
            dense
            outlined
            clearable
            emit-value
            map-options
            class="opportunities-filterbar__control"
            label="Fund Type"
            :options="fundTypeFilterOptions"
            :disable="loading || fundTypeFilterOptions.length === 0"
          />
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
                    @click="openDatabook(props.row)"
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
              <q-card flat bordered class="opportunity-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start no-wrap">
                    <div class="col-auto q-pr-md">
                      <q-avatar size="56px" class="opportunity-card__avatar">
                        <img
                          :src="buildAvatarImage(row.opportunity_name || row.Company_Name || row.kind)"
                          :alt="row.opportunity_name || 'Opportunity avatar'"
                        />
                      </q-avatar>
                    </div>
                    <div class="col opportunity-card__copy">
                      <div class="opportunity-card__eyebrow">{{ row.kind || 'Opportunity' }}</div>
                      <div class="opportunity-card__title">
                        {{ row.opportunity_name || row.Venture_Oppty_Name || 'Unnamed opportunity' }}
                      </div>
                      <div v-if="row.Company_Name" class="opportunity-card__subtitle">
                        {{ row.Company_Name }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-checkbox
                        :model-value="isSelected(row)"
                        :disable="loading"
                        color="dark"
                        @update:model-value="toggleRowSelection(row, $event)"
                      />
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm">
                  <div v-if="row.Round_Stage" class="opportunity-card__field">
                    <q-icon name="layers" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.Round_Stage }}</span>
                  </div>
                  <div v-if="row.Fund_Type" class="opportunity-card__field">
                    <q-icon name="account_balance" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.Fund_Type }}</span>
                  </div>
                  <div v-if="displaySize(row)" class="opportunity-card__field">
                    <q-icon name="payments" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ displaySize(row) }}</span>
                  </div>
                  <div class="row q-col-gutter-sm q-pt-xs">
                    <div v-if="row.created_at" class="col-auto">
                      <q-badge outline color="grey-6" text-color="grey-8">
                        {{ row.created_at }}
                      </q-badge>
                    </div>
                  </div>
                </q-card-section>

                <q-space />

                <q-card-actions align="between">
                  <q-btn
                    dense
                    flat
                    color="grey-9"
                    label="Databook"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="grey-8"
                    :disable="loading || !canDeleteOpportunities"
                    @click="confirmDelete(row)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <q-page-sticky
        v-if="selectedCount > 0 && canDeleteOpportunities"
        position="bottom-right"
        :offset="[18 * 2, 18]"
      >
        <q-btn
          color="black"
          text-color="white"
          unelevated
          :disable="loading"
          label="Delete All"
          @click="confirmDeleteSelected"
        />
      </q-page-sticky>
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
import FundCreateDialog from 'src/components/FundCreateDialog.vue'
import RoundCreateDialog from 'src/components/RoundCreateDialog.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

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

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const dialogKind = ref('round')
const kindFilter = ref(ALL_OPPORTUNITIES_FILTER)
const searchQuery = ref('')
const companyFilter = ref('')
const stageFilter = ref('')
const statusFilter = ref('')
const fundTypeFilter = ref('')
const viewMode = ref('card')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const kindFilterOptions = [
  { label: 'All', value: ALL_OPPORTUNITIES_FILTER },
  { label: 'Funds', value: 'fund' },
  { label: 'Rounds', value: 'round' },
]
const currentOpportunityMode = computed(() => {
  if (kindFilter.value === 'fund') {
    return {
      title: 'Funds',
      eyebrow: 'Funds dashboard',
      heroTitle: 'See which funds are taking shape.',
      queryLabel: 'funds',
      kind: 'fund',
      emptyLabel: 'No funds found.',
    }
  }
  if (kindFilter.value === 'round') {
    return {
      title: 'Rounds',
      eyebrow: 'Rounds dashboard',
      heroTitle: 'See which rounds are taking shape.',
      queryLabel: 'rounds',
      kind: 'round',
      emptyLabel: 'No rounds found.',
    }
  }
  return {
    title: 'Opportunities',
    eyebrow: 'Opportunities dashboard',
    heroTitle: 'See which deals are taking shape.',
    queryLabel: 'opportunities',
    kind: '',
    emptyLabel: 'No opportunities found.',
  }
})
const canImportOpportunities = false
const canDeleteOpportunities = true

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
  dialogKind.value = createValue === 'fund' ? 'fund' : 'round'
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

async function onOpportunityCreated() {
  await loadOpportunities()
}

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  const tableName = row?.kind === 'fund' ? 'Funds' : row?.kind === 'round' ? 'Rounds' : 'Funds'
  router.push({
    name: 'databook-view',
    params: { tableName, recordId },
    query: { returnTo: route.fullPath },
  })
}

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

function uniqueOpportunityValues(resolver) {
  return [...new Set(rows.value.map((row) => normalizeOpportunityValue(resolver(row))).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }))
}

const companyFilterOptions = computed(() => uniqueOpportunityValues((row) => row?.Company_Name))
const stageFilterOptions = computed(() =>
  uniqueOpportunityValues((row) => row?.Round_Stage || row?.Pipeline_Stage),
)
const statusFilterOptions = computed(() =>
  uniqueOpportunityValues((row) => row?.Raising_Status || row?.Pipeline_Status),
)
const fundTypeFilterOptions = computed(() => uniqueOpportunityValues((row) => row?.Fund_Type))

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

  if (companyFilter.value) {
    items = items.filter((row) => normalizeOpportunityValue(row?.Company_Name) === companyFilter.value)
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

  if (fundTypeFilter.value) {
    items = items.filter((row) => normalizeOpportunityValue(row?.Fund_Type) === fundTypeFilter.value)
  }

  return items
})

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

function buildAvatarImage(label) {
  const text = String(label || 'Opportunity').trim()
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'OP'

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
  if (!hasBridge.value) return
  loadOpportunities()
  consumeQueuedOpen()
  openCreateFromQuery()
  window.addEventListener('ecvc:opportunities-changed', onChanged)
  window.addEventListener('ecvc:open-fund-dialog', onOpenFundDialog)
  window.addEventListener('ecvc:open-round-dialog', onOpenRoundDialog)
})

onBeforeUnmount(() => {
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

.opportunities-page__heading {
  display: flex;
  align-items: center;
}

.opportunities-page__title {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: var(--ds-font-size-4xl);
  font-weight: var(--ds-font-weight-black);
  line-height: var(--ds-line-height-title);
}

.opportunities-shell {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-32);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.opportunities-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-24);
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 85, 33, 0.12), transparent 24%),
    radial-gradient(circle at 14% 84%, rgba(38, 71, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-2xl);
}

.opportunities-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent 38%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.34) 100%);
  pointer-events: none;
}

.opportunities-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: space-between;
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
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.opportunities-shell__hero-text {
  margin: 0;
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
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.opportunities-toolbar__left,
.opportunities-toolbar__right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunities-toolbar__left {
  flex: 1 1 720px;
  min-width: 0;
  gap: 20px;
}

.opportunities-toolbar__right {
  flex: 0 0 auto;
  margin-left: auto;
}

.opportunities-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.opportunities-toolbar__search {
  flex: 0 1 34%;
  min-width: 220px;
  width: clamp(260px, 33vw, 420px);
  max-width: 100%;
  margin-inline-start: clamp(12px, 3vw, 44px);
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

.opportunities-toolbar__toggle {
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

.opportunities-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.opportunities-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.opportunities-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.opportunities-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.opportunities-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.opportunities-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-xl);
}

.opportunities-filterbar__label {
  flex: 0 0 auto;
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.opportunities-filterbar__control {
  flex: 1 1 180px;
  min-width: 180px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
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
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 8px;
  border-color: #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.opportunity-card__eyebrow {
  min-width: 0;
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---light);
  font-weight: var(--font-weight-light);
  line-height: 16px;
  text-transform: uppercase;
}

.opportunity-card__copy {
  min-width: 0;
}

.opportunity-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-base---black);
  font-weight: var(--font-weight-black);
  line-height: 24px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.opportunity-card__subtitle {
  min-width: 0;
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.opportunity-card__avatar {
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.08);
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

@media (max-width: 1200px) {
  .opportunities-shell {
    padding: 20px;
    gap: 20px;
  }

  .opportunities-shell__hero {
    grid-template-columns: 1fr;
  }

  .opportunities-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .opportunities-toolbar__left,
  .opportunities-toolbar__right {
    flex: none;
    flex-direction: column;
    align-items: stretch;
  }

  .opportunities-toolbar__right {
    margin-left: 0;
  }

  .opportunities-toolbar__search {
    flex: none;
    width: 100%;
    margin-inline-start: 0;
  }

  .opportunities-filterbar {
    flex-direction: column;
    align-items: stretch;
  }

  .opportunities-filterbar__control {
    min-width: 0;
    width: 100%;
  }

  .opportunities-toolbar__toggle {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .opportunities-shell__hero {
    padding: 18px;
    border-radius: 20px;
  }

  .opportunities-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .opportunities-dashboard__stat {
    min-height: 98px;
  }
}
</style>
