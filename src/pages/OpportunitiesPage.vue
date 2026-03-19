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
        <h1 class="opportunities-page__title">Opportunities</h1>
      </header>

      <section class="opportunities-shell">
        <div class="opportunities-shell__hero">
          <div class="opportunities-shell__copy">
            <div class="opportunities-shell__eyebrow">Opportunities dashboard</div>
            <h2 class="opportunities-shell__hero-title">See which deals are taking shape.</h2>
            <p class="opportunities-shell__hero-text">{{ opportunitiesHeroText }}</p>

            <div class="opportunities-shell__hero-meta">
              <div class="opportunities-shell__meta-pill">
                {{ viewMode === 'card' ? 'Card view active' : 'Table view active' }}
              </div>
              <div v-if="selectedCount > 0" class="opportunities-shell__meta-pill">
                {{ selectedCount }} selected
              </div>
              <div class="opportunities-shell__meta-pill">
                {{ opportunitiesDashboard.fundCount }} fund opportunities
              </div>
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
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="opportunities-toolbar__search"
              placeholder="Filter opportunities..."
              :disable="loading"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="add_circle_outline"
              label="Import CSV"
              class="opportunities-toolbar__button"
              :disable="loading"
              @click="pickImportFile"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="download"
              label="Export CSV"
              class="opportunities-toolbar__button"
              :disable="loading || displayRows.length === 0"
              @click="exportOpportunitiesCsv"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="flag"
              label="Priority"
              class="opportunities-toolbar__button"
              :class="{ 'opportunities-toolbar__button--active': priorityMode }"
              :disable="loading"
              @click="togglePriorityMode"
            />
          </div>

          <div class="opportunities-toolbar__right">
            <q-btn-dropdown
              dense
              outline
              no-caps
              icon="tune"
              dropdown-icon="keyboard_arrow_down"
              class="opportunities-view-button"
              :disable="loading"
              label="View"
            >
              <q-list class="opportunities-view-menu">
                <q-item
                  v-for="option in viewOptions"
                  :key="option.value"
                  clickable
                  v-close-popup
                  :active="viewMode === option.value"
                  active-class="opportunities-view-menu__item--active"
                  @click="viewMode = option.value"
                >
                  <q-item-section avatar>
                    <q-icon :name="option.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ option.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <B10Button
              variant="primary"
              size="small"
              icon-start="add"
              label="Add Opportunity"
              :disable="loading"
              @click="openCreateOpportunity"
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
              <div>No opportunities found.</div>
              <q-btn
                color="black"
                text-color="white"
                no-caps
                unelevated
                label="Create opportunity"
                @click="openCreateOpportunity"
              />
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
                    :disable="loading"
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
                    <div class="col">
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
                    :disable="loading"
                    @click="confirmDelete(row)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[18 * 2, 18]">
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
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { exportFile, useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import B10Button from 'src/components/buttons/B10Button.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

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
const searchQuery = ref('')
const priorityMode = ref(false)
const viewMode = ref('card')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

function openCreateOpportunity() {
  globalThis?.dispatchEvent?.(new Event('ecvc:open-opportunity-dialog'))
}

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  router.push({
    name: 'databook-view',
    params: { tableName: 'Opportunities', recordId },
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
  { label: 'Cards', value: 'card', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

const opportunitiesDashboard = computed(() => {
  const total = rows.value.length
  const summary = rows.value.reduce(
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

      if (profileScore < 3) accumulator.sparseCount += 1
      else if (profileScore <= 5) accumulator.mediumCount += 1
      else accumulator.richCount += 1

      return accumulator
    },
    {
      stageCount: 0,
      sizeCount: 0,
      fundCount: 0,
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
  }
})

const opportunitiesHeroText = computed(() => {
  const { total, stageCount, sizeCount, sparseCount } = opportunitiesDashboard.value

  if (!total) {
    return 'Track every opportunity here. Add deal details to understand stage coverage, sizing, and which records still need context.'
  }

  return `${total} opportunities tracked, ${stageCount} already staged, ${sizeCount} sized, and ${sparseCount} still need more investment context.`
})

const opportunitiesDashboardStats = computed(() => [
  {
    label: 'Total opportunities',
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

  if (priorityMode.value) {
    items.sort((a, b) => {
      const aSize = opportunityNumericSize(a)
      const bSize = opportunityNumericSize(b)
      if (aSize !== bSize) return bSize - aSize
      return String(a?.opportunity_name || a?.Venture_Oppty_Name || '').localeCompare(
        String(b?.opportunity_name || b?.Venture_Oppty_Name || ''),
      )
    })
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

function togglePriorityMode() {
  priorityMode.value = !priorityMode.value
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
  await bridge.value.opportunities.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.opportunities?.delete) return
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
  if (!bridge.value?.opportunities?.delete || selectedCount.value === 0) return
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

onMounted(() => {
  if (!hasBridge.value) return
  loadOpportunities()
  window.addEventListener('ecvc:opportunities-changed', onChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:opportunities-changed', onChanged)
})

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.opportunities-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.opportunities-page__heading {
  display: flex;
  align-items: center;
}

.opportunities-page__title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-4xl---black);
  font-weight: var(--font-weight-black);
  line-height: 40px;
}

.opportunities-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.opportunities-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 85, 33, 0.12), transparent 24%),
    radial-gradient(circle at 14% 84%, rgba(38, 71, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
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
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.opportunities-shell__eyebrow {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.16em;
  line-height: 16px;
  text-transform: uppercase;
}

.opportunities-shell__hero-title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.opportunities-shell__hero-text {
  margin: 0;
  color: #5d5a54;
  font-family: var(--font-body);
  font-size: var(--text-base---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
  max-width: 52ch;
}

.opportunities-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunities-shell__meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  color: #4b4b4b;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  line-height: 16px;
}

.opportunities-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.opportunities-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.opportunities-dashboard__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  box-shadow: 0 14px 28px rgba(17, 17, 17, 0.04);
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
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 16px;
  text-transform: uppercase;
}

.opportunities-dashboard__stat-value {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.opportunities-dashboard__stat-caption,
.opportunities-dashboard__health-text {
  color: #5d5a54;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 20px;
}

.opportunities-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
}

.opportunities-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.opportunities-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.06);
  border-radius: 999px;
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
}

.opportunities-toolbar__right {
  flex: 0 0 auto;
  margin-left: auto;
}

.opportunities-toolbar__search {
  flex: 1 1 300px;
  min-width: 220px;
  width: 300px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: var(--box--shadow--shadow-xs);
}

.opportunities-toolbar__search :deep(.q-field__control),
.opportunities-toolbar__search :deep(.q-field__native),
.opportunities-toolbar__search :deep(.q-field__input) {
  min-height: 32px;
  height: 32px;
}

.opportunities-toolbar__search :deep(.q-field__control) {
  padding: 0 12px;
}

.opportunities-toolbar__button,
.opportunities-view-button {
  flex: 0 0 auto;
  height: 32px;
  background: #fff;
  color: #0a0a0a;
  border-color: #e5e5e5;
  border-radius: 8px;
  box-shadow: var(--box--shadow--shadow-xs);
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 16px;
}

.opportunities-toolbar__button--active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.opportunities-view-menu {
  min-width: 150px;
  background: #fff;
  color: #111;
}

.opportunities-view-menu__item--active {
  background: #111;
  color: #fff;
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
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.opportunities-table :deep(thead tr) {
  background: #f5f5f5;
}

.opportunities-table :deep(th) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.opportunities-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.opportunities-table :deep(td) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.opportunities-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
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
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---light);
  font-weight: var(--font-weight-light);
  line-height: 16px;
  text-transform: uppercase;
}

.opportunity-card__title {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-base---black);
  font-weight: var(--font-weight-black);
  line-height: 24px;
}

.opportunity-card__subtitle {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
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
  }

  .opportunities-toolbar__button,
  .opportunities-view-button {
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
