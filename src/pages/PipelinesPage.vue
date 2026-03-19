<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Pipelines requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="pipelines-page">
      <header class="pipelines-page__heading">
        <h1 class="pipelines-page__title">Pipelines</h1>
      </header>

      <section class="pipelines-shell">
        <div class="pipelines-shell__hero">
          <div class="pipelines-shell__copy">
            <div class="pipelines-shell__eyebrow">Pipelines dashboard</div>
            <h2 class="pipelines-shell__hero-title">See what is ready in your workspace.</h2>
            <p class="pipelines-shell__hero-text">{{ pipelinesHeroText }}</p>

            <div class="pipelines-shell__hero-meta">
              <div class="pipelines-shell__meta-pill">
                {{ viewMode === 'card' ? 'Card view active' : 'Table view active' }}
              </div>
              <div v-if="selectedCount > 0" class="pipelines-shell__meta-pill">
                {{ selectedCount }} selected
              </div>
              <div class="pipelines-shell__meta-pill">
                {{ pipelinesDashboard.totalStageCount }} stages mapped
              </div>
            </div>
          </div>

          <div class="pipelines-dashboard">
            <div class="pipelines-dashboard__stats">
              <article
                v-for="stat in pipelinesDashboardStats"
                :key="stat.label"
                class="pipelines-dashboard__stat"
                :class="`pipelines-dashboard__stat--${stat.tone}`"
              >
                <div class="pipelines-dashboard__stat-label">{{ stat.label }}</div>
                <div class="pipelines-dashboard__stat-value">{{ stat.value }}</div>
                <div class="pipelines-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="pipelines-dashboard__health">
              <div class="pipelines-dashboard__health-copy">
                <div class="pipelines-dashboard__health-label">Workspace readiness</div>
                <div class="pipelines-dashboard__health-text">
                  {{ pipelinesDashboard.installedCount }} created, {{ pipelinesDashboard.busyCount }} in progress,
                  {{ pipelinesDashboard.inactiveCount }} not created
                </div>
              </div>

              <div class="pipelines-dashboard__health-bar" aria-hidden="true">
                <span
                  class="pipelines-dashboard__health-segment pipelines-dashboard__health-segment--sparse"
                  :style="{ width: `${pipelinesDashboard.inactiveShare}%` }"
                />
                <span
                  class="pipelines-dashboard__health-segment pipelines-dashboard__health-segment--medium"
                  :style="{ width: `${pipelinesDashboard.busyShare}%` }"
                />
                <span
                  class="pipelines-dashboard__health-segment pipelines-dashboard__health-segment--rich"
                  :style="{ width: `${pipelinesDashboard.installedShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="pipelines-toolbar">
          <div class="pipelines-toolbar__left">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="pipelines-toolbar__search"
              placeholder="Filter pipelines..."
              :disable="loading"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="add_circle_outline"
              label="Import CSV"
              class="pipelines-toolbar__button"
              :disable="loading"
              @click="pickImportFile"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="download"
              label="Export CSV"
              class="pipelines-toolbar__button"
              :disable="loading || displayRows.length === 0"
              @click="exportPipelinesCsv"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="flag"
              label="Priority"
              class="pipelines-toolbar__button"
              :class="{ 'pipelines-toolbar__button--active': priorityMode }"
              :disable="loading"
              @click="togglePriorityMode"
            />
          </div>

          <div class="pipelines-toolbar__right">
            <q-btn-dropdown
              dense
              outline
              no-caps
              icon="tune"
              dropdown-icon="keyboard_arrow_down"
              class="pipelines-view-button"
              :disable="loading"
              label="View"
            >
              <q-list class="pipelines-view-menu">
                <q-item
                  v-for="option in viewOptions"
                  :key="option.value"
                  clickable
                  v-close-popup
                  :active="viewMode === option.value"
                  active-class="pipelines-view-menu__item--active"
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
              label="Add Pipeline"
              :disable="loading"
              @click="openCreatePipeline"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="pipelines-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="pipelines-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No pipelines found.</div>
              <q-btn
                color="black"
                text-color="white"
                no-caps
                unelevated
                label="Create pipeline"
                @click="openCreatePipeline"
              />
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="pipelines-table"
            flat
            bordered
            row-key="pipeline_id"
            v-model:selected="selectedRows"
            v-model:pagination="pagination"
            selection="multiple"
            :rows="displayRows"
            :columns="columns"
            :loading="loading"
            :rows-per-page-options="rowsPerPageOptions"
          >
            <template #body-cell-install_status="props">
              <q-td :props="props">
                <q-badge :color="statusColor(props.row.install_status)" outline>
                  {{ statusLabel(props.row.install_status) }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-stages="props">
              <q-td :props="props">
                <div class="pipelines-table__stages">
                  {{ stageSummary(props.row) || 'No stages available' }}
                  <q-tooltip v-if="stageSummary(props.row)">
                    {{ stageSummary(props.row) }}
                  </q-tooltip>
                </div>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="pipelines-table__actions">
                  <q-btn
                    dense
                    outline
                    no-caps
                    color="grey-8"
                    :label="props.row.install_status === 'installed' ? 'Deactivate' : 'Activate'"
                    :disable="isBusy(props.row.install_status) || loading"
                    @click="togglePipeline(props.row)"
                  />
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
                    :disable="loading || props.row.pipeline_id === 'pipeline_default'"
                    @click="confirmDelete(props.row)"
                  />
                </div>
              </q-td>
            </template>
          </q-table>

          <div v-else class="row q-col-gutter-md pipelines-cards-grid">
            <div
              v-for="row in displayRows"
              :key="row.pipeline_id"
              class="col-12 col-sm-6 col-lg-4"
            >
              <q-card flat bordered class="pipeline-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start no-wrap">
                    <div class="col-auto q-pr-md">
                      <q-avatar size="56px" class="pipeline-card__avatar">
                        <img :src="buildAvatarImage(row.name)" :alt="row.name || 'Pipeline avatar'" />
                      </q-avatar>
                    </div>
                    <div class="col">
                      <div class="pipeline-card__eyebrow">Pipeline</div>
                      <div class="pipeline-card__title">{{ row.name || 'Unnamed pipeline' }}</div>
                      <div class="pipeline-card__subtitle">{{ statusLabel(row.install_status) }}</div>
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
                  <div class="row q-col-gutter-sm">
                    <div class="col-auto">
                      <q-badge :color="statusColor(row.install_status)" outline>
                        {{ statusLabel(row.install_status) }}
                      </q-badge>
                    </div>
                    <div v-if="row.pipeline_id === 'pipeline_default'" class="col-auto">
                      <q-badge outline color="grey-6" text-color="grey-8">Default</q-badge>
                    </div>
                  </div>
                  <div class="pipeline-card__field">
                    <q-icon name="schema" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ stageSummary(row) || 'No stages available' }}</span>
                  </div>
                </q-card-section>

                <q-space />

                <q-card-actions align="between" class="pipeline-card__actions">
                  <q-btn
                    dense
                    outline
                    no-caps
                    color="grey-8"
                    :label="row.install_status === 'installed' ? 'Deactivate' : 'Activate'"
                    :disable="isBusy(row.install_status) || loading"
                    @click="togglePipeline(row)"
                  />
                  <div class="row items-center q-gutter-xs">
                    <q-btn
                      dense
                      flat
                      round
                      icon="visibility"
                      color="grey-8"
                      :disable="loading"
                      @click="openDatabook(row)"
                    />
                    <q-btn
                      dense
                      flat
                      round
                      icon="delete"
                      color="grey-8"
                      :disable="loading || row.pipeline_id === 'pipeline_default'"
                      @click="confirmDelete(row)"
                    />
                  </div>
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

  <PipelineCreateDialog v-model="pipelineDialogOpen" @created="onPipelineCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import PipelineCreateDialog from 'components/PipelineCreateDialog.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.pipelines?.list &&
    !!bridge.value?.pipelines?.upsertMany &&
    !!bridge.value?.pipelines?.create &&
    !!bridge.value?.pipelines?.delete,
)

const pipelines = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const pipelineDialogOpen = ref(false)
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

const columns = [
  { name: 'name', label: 'Pipeline Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'install_status',
    label: 'Status',
    field: 'install_status',
    align: 'left',
    sortable: true,
  },
  { name: 'stages', label: 'Stages', field: 'stages', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['pipeline_id', 'name', 'dir_name', 'is_default']

const viewOptions = [
  { label: 'Cards', value: 'card', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

const pipelinesDashboard = computed(() => {
  const total = pipelines.value.length
  const summary = pipelines.value.reduce(
    (accumulator, row) => {
      const stages = parsedStages(row)
      const stageCount = stages.length
      const status = String(row?.install_status || '').trim()

      accumulator.totalStageCount += stageCount
      if (stageCount > 0) accumulator.stagedCount += 1
      if (row?.pipeline_id === 'pipeline_default') accumulator.defaultCount += 1

      if (status === 'installed') accumulator.installedCount += 1
      else if (status === 'installing' || status === 'uninstalling') accumulator.busyCount += 1
      else accumulator.inactiveCount += 1

      return accumulator
    },
    {
      installedCount: 0,
      busyCount: 0,
      inactiveCount: 0,
      stagedCount: 0,
      totalStageCount: 0,
      defaultCount: 0,
    },
  )

  return {
    total,
    ...summary,
    installedShare: total ? (summary.installedCount / total) * 100 : 0,
    busyShare: total ? (summary.busyCount / total) * 100 : 0,
    inactiveShare: total ? (summary.inactiveCount / total) * 100 : 0,
  }
})

const pipelinesHeroText = computed(() => {
  const { total, installedCount, stagedCount, inactiveCount } = pipelinesDashboard.value

  if (!total) {
    return 'Create pipeline templates here to map your process, define stages, and activate them inside the workspace.'
  }

  return `${total} pipeline templates available, ${installedCount} already created in the workspace, ${stagedCount} with defined stages, and ${inactiveCount} still need setup.`
})

const pipelinesDashboardStats = computed(() => [
  {
    label: 'Total pipelines',
    value: pipelinesDashboard.value.total,
    caption: 'Templates available in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Created',
    value: pipelinesDashboard.value.installedCount,
    caption: 'Already active in the workspace',
    tone: 'rich',
  },
  {
    label: 'Stage-ready',
    value: pipelinesDashboard.value.stagedCount,
    caption: 'Templates with defined stages',
    tone: 'rich',
  },
  {
    label: 'Need setup',
    value: pipelinesDashboard.value.inactiveCount,
    caption: 'Not yet created in the workspace',
    tone: 'sparse',
  },
])

function statusLabel(status) {
  if (status === 'installed') return 'Created'
  if (status === 'installing') return 'Creating...'
  if (status === 'uninstalling') return 'Deleting...'
  if (status === 'error') return 'Error'
  return 'Not created'
}

function statusColor(status) {
  if (status === 'installed') return 'green'
  if (status === 'installing' || status === 'uninstalling') return 'blue'
  if (status === 'error') return 'red'
  return 'grey'
}

function isBusy(status) {
  return status === 'installing' || status === 'uninstalling'
}

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...pipelines.value]

  if (query) {
    items = items.filter((row) =>
      [row?.name, row?.dir_name, row?.install_status, stageSummary(row)]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  if (priorityMode.value) {
    items.sort((a, b) => {
      const defaultScoreA = a?.pipeline_id === 'pipeline_default' ? 1 : 0
      const defaultScoreB = b?.pipeline_id === 'pipeline_default' ? 1 : 0
      if (defaultScoreA !== defaultScoreB) return defaultScoreB - defaultScoreA

      const installedScoreA = a?.install_status === 'installed' ? 1 : 0
      const installedScoreB = b?.install_status === 'installed' ? 1 : 0
      if (installedScoreA !== installedScoreB) return installedScoreB - installedScoreA

      return String(a?.name || '').localeCompare(String(b?.name || ''))
    })
  }

  return items
})

function parsedStages(row) {
  try {
    return JSON.parse(row?.stages || '[]')
  } catch {
    return []
  }
}

function stageSummary(row) {
  return parsedStages(row)
    .map((stage) => stage?.name)
    .filter(Boolean)
    .join(', ')
}

function buildAvatarImage(label) {
  const text = String(label || 'Pipeline').trim()
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'PI'

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

function exportPipelinesCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('pipelines.csv', csv, 'text/csv')
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

async function loadPipelines() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.pipelines.list()
    pipelines.value = result?.pipelines || []
    normalizeSelectedRows()
  } catch (e) {
    error.value = e?.message || String(e)
    pipelines.value = []
    normalizeSelectedRows()
  } finally {
    loading.value = false
  }
}

async function togglePipeline(row) {
  if (!hasBridge.value) return
  error.value = ''
  loading.value = true
  try {
    if (row.install_status === 'installed') {
      await bridge.value.pipelines.uninstall(row.pipeline_id)
    } else {
      await bridge.value.pipelines.install(row.pipeline_id)
    }
    await loadPipelines()
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function confirmDelete(row) {
  if (!bridge.value?.pipelines?.delete) return
  if (row?.pipeline_id === 'pipeline_default') return

  $q.dialog({
    title: 'Delete pipeline?',
    message:
      row.install_status === 'installed'
        ? `This will uninstall and permanently delete pipeline "${row.name}".`
        : `This will permanently delete pipeline "${row.name}".`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deletePipeline(row)
      await loadPipelines()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

function normalizeSelectedRows() {
  const activeIds = new Set(displayRows.value.map((row) => row.pipeline_id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.pipeline_id))
}

function isSelected(row) {
  return selectedRows.value.some((selectedRow) => selectedRow.pipeline_id === row?.pipeline_id)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = String(row?.pipeline_id || '').trim()
  if (!rowId) return

  if (shouldSelect) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }

  selectedRows.value = selectedRows.value.filter((selectedRow) => selectedRow.pipeline_id !== rowId)
}

async function deletePipeline(row) {
  if (row.install_status === 'installed') {
    await bridge.value.pipelines.uninstall(row.pipeline_id)
  }
  await bridge.value.pipelines.delete(row.pipeline_id)
}

async function confirmDeleteSelected() {
  if (!bridge.value?.pipelines?.delete || selectedCount.value === 0) return
  const deletableRows = selectedRows.value.filter((row) => row.pipeline_id !== 'pipeline_default')
  if (deletableRows.length === 0) {
    $q.notify({ type: 'warning', message: 'The default pipeline cannot be deleted.' })
    return
  }

  $q.dialog({
    title: 'Delete selected pipelines?',
    message: `This will permanently delete ${deletableRows.length} selected pipeline${deletableRows.length === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of deletableRows) {
        await deletePipeline(row)
      }
      selectedRows.value = []
      await loadPipelines()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function importRows(importedRows) {
  const result = await bridge.value.pipelines.upsertMany(importedRows)
  await loadPipelines()
  return result
}

function openCreatePipeline() {
  pipelineDialogOpen.value = true
}

function openDatabook(row) {
  const recordId = String(row?.pipeline_id || '').trim()
  if (!recordId) return
  router.push({
    name: 'databook-view',
    params: { tableName: 'Pipelines', recordId },
    query: { returnTo: route.fullPath },
  })
}

function onOpenPipelineDialog() {
  globalThis.__ecvcOpenPipelineDialog = false
  openCreatePipeline()
}

function openCreatePipelineFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreatePipeline()
  globalThis.__ecvcOpenPipelineDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedPipelineDialogOpen() {
  if (globalThis.__ecvcOpenPipelineDialog !== true) return false
  globalThis.__ecvcOpenPipelineDialog = false
  openCreatePipeline()
  return true
}

async function onPipelineCreated() {
  await loadPipelines()
}

onMounted(async () => {
  window.addEventListener('ecvc:open-pipeline-dialog', onOpenPipelineDialog)
  if (!hasBridge.value) return
  await loadPipelines()
  consumeQueuedPipelineDialogOpen()
  openCreatePipelineFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-pipeline-dialog', onOpenPipelineDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreatePipelineFromQuery()
  },
)

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.pipelines-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pipelines-page__heading {
  display: flex;
  align-items: center;
}

.pipelines-page__title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-4xl---black);
  font-weight: var(--font-weight-black);
  line-height: 40px;
}

.pipelines-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.pipelines-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(235, 255, 90, 0.18), transparent 24%),
    radial-gradient(circle at 14% 84%, rgba(38, 71, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
}

.pipelines-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent 38%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.34) 100%);
  pointer-events: none;
}

.pipelines-shell__copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.pipelines-shell__eyebrow {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.16em;
  line-height: 16px;
  text-transform: uppercase;
}

.pipelines-shell__hero-title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.pipelines-shell__hero-text {
  margin: 0;
  color: #5d5a54;
  font-family: var(--font-body);
  font-size: var(--text-base---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
  max-width: 52ch;
}

.pipelines-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pipelines-shell__meta-pill {
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

.pipelines-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.pipelines-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.pipelines-dashboard__stat {
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

.pipelines-dashboard__stat--neutral {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.pipelines-dashboard__stat--rich {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.pipelines-dashboard__stat--sparse {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.pipelines-dashboard__stat-label,
.pipelines-dashboard__health-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 16px;
  text-transform: uppercase;
}

.pipelines-dashboard__stat-value {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.pipelines-dashboard__stat-caption,
.pipelines-dashboard__health-text {
  color: #5d5a54;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 20px;
}

.pipelines-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
}

.pipelines-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pipelines-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: rgba(17, 17, 17, 0.06);
  border-radius: 999px;
}

.pipelines-dashboard__health-segment {
  display: block;
  height: 100%;
}

.pipelines-dashboard__health-segment--sparse {
  background: #ff5521;
}

.pipelines-dashboard__health-segment--medium {
  background: #ebff5a;
}

.pipelines-dashboard__health-segment--rich {
  background: #2647ff;
}

.pipelines-toolbar {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.pipelines-toolbar__left,
.pipelines-toolbar__right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pipelines-toolbar__left {
  flex: 1 1 720px;
  min-width: 0;
}

.pipelines-toolbar__right {
  flex: 0 0 auto;
  margin-left: auto;
}

.pipelines-toolbar__search {
  flex: 1 1 300px;
  min-width: 220px;
  width: 300px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: var(--box--shadow--shadow-xs);
}

.pipelines-toolbar__search :deep(.q-field__control),
.pipelines-toolbar__search :deep(.q-field__native),
.pipelines-toolbar__search :deep(.q-field__input) {
  min-height: 32px;
  height: 32px;
}

.pipelines-toolbar__search :deep(.q-field__control) {
  padding: 0 12px;
}

.pipelines-toolbar__button,
.pipelines-view-button {
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

.pipelines-toolbar__button--active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.pipelines-view-menu {
  min-width: 150px;
  background: #fff;
  color: #111;
}

.pipelines-view-menu__item--active {
  background: #111;
  color: #fff;
}

.pipelines-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pipelines-empty-state {
  padding: 24px;
}

.pipelines-table {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.pipelines-table :deep(thead tr) {
  background: #f5f5f5;
}

.pipelines-table :deep(th) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.pipelines-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.pipelines-table :deep(td) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.pipelines-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.pipelines-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.pipelines-table__stages {
  width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.pipelines-cards-grid {
  align-items: stretch;
}

.pipeline-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 8px;
  border-color: #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.pipeline-card__eyebrow {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---light);
  font-weight: var(--font-weight-light);
  line-height: 16px;
  text-transform: uppercase;
}

.pipeline-card__title {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-base---black);
  font-weight: var(--font-weight-black);
  line-height: 24px;
}

.pipeline-card__subtitle {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.pipeline-card__avatar {
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.08);
}

.pipeline-card__field {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  color: #404040;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.pipeline-card__actions {
  align-items: center;
}

@media (max-width: 1200px) {
  .pipelines-shell {
    padding: 20px;
    gap: 20px;
  }

  .pipelines-shell__hero {
    grid-template-columns: 1fr;
  }

  .pipelines-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .pipelines-toolbar__left,
  .pipelines-toolbar__right {
    flex: none;
    flex-direction: column;
    align-items: stretch;
  }

  .pipelines-toolbar__right {
    margin-left: 0;
  }

  .pipelines-toolbar__search {
    flex: none;
    width: 100%;
  }

  .pipelines-toolbar__button,
  .pipelines-view-button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .pipelines-shell__hero {
    padding: 18px;
    border-radius: 20px;
  }

  .pipelines-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .pipelines-dashboard__stat {
    min-height: 98px;
  }
}
</style>
