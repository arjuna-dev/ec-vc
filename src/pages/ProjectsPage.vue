<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Projects requires Electron. Run <code>quasar dev -m electron</code> or
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
      <section class="pipelines-shell">
        <div
          class="pipelines-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="pipelines-shell__copy">
            <div class="pipelines-shell__eyebrow">Dashboard</div>
            <h2 class="pipelines-shell__hero-title">See what is ready in your workspace.</h2>
            <p class="pipelines-shell__hero-text">{{ pipelinesHeroText }}</p>

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
          <div class="pipelines-toolbar__block pipelines-toolbar__block--view">
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="pipelines-toolbar__toggle pipelines-toolbar__view-toggle"
              :disable="loading"
              :options="viewOptions"
            />
          </div>

          <div class="pipelines-toolbar__block pipelines-toolbar__block--kind">
            <q-btn-toggle
              v-model="pipelineKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="pipelines-toolbar__toggle pipelines-toolbar__kind-toggle"
              :disable="loading"
              :options="pipelineKindOptions"
            />
          </div>

          <div class="pipelines-toolbar__block pipelines-toolbar__block--search">
            <q-icon name="tune" size="18px" class="pipelines-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="pipelines-toolbar__search"
              placeholder="Search projects..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn dense flat round icon="download" color="grey-6" :disable="loading" @click="pickImportFile">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
            <q-btn dense flat round icon="upload" color="grey-6" :disable="loading || displayRows.length === 0" @click="exportPipelinesCsv">
              <q-tooltip>Export CSV</q-tooltip>
            </q-btn>
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
              <div>No projects found.</div>
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
                <q-card-section class="pipeline-card__shell">
                  <aside class="pipeline-card__stage-panel">
                    <div class="pipeline-card__summary-label">Stages</div>

                    <div v-if="getPipelineCardStages(row).length" class="pipeline-card__stage-map">
                      <div
                        v-for="(stage, stageIndex) in getPipelineCardStages(row)"
                        :key="`${row.pipeline_id}-${stageIndex}-${stage?.name || 'stage'}`"
                        class="pipeline-card__stage-stop"
                      >
                        <div class="pipeline-card__stage-chip">
                          <div class="pipeline-card__stage-number">{{ stageIndex + 1 }}</div>
                          <div class="pipeline-card__stage-name">
                            {{ formatPipelineStageName(stage?.name) || `Stage ${stageIndex + 1}` }}
                          </div>
                        </div>
                        <div
                          v-if="stageIndex < getPipelineCardStages(row).length - 1"
                          class="pipeline-card__stage-connector"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div v-if="!getPipelineCardStages(row).length" class="pipeline-card__summary-empty">
                      No stages mapped yet.
                    </div>
                  </aside>

                  <div class="pipeline-card__main">
                    <div class="pipeline-card__hero-top">
                      <div class="pipeline-card__hero-copy">
                        <div class="pipeline-card__title">{{ getPipelineCardTitle(row) }}</div>
                        <div class="pipeline-card__meta-stack">
                          <div class="pipeline-card__meta-row">
                            <span class="pipeline-card__meta-label">Owner</span>
                            <span class="pipeline-card__meta-value">{{ getPipelineOwnerLabel(row) }}</span>
                          </div>
                          <div class="pipeline-card__meta-row">
                            <span class="pipeline-card__meta-label">Assigned Team</span>
                            <span class="pipeline-card__meta-value">{{ getPipelineTeamLabel(row) }}</span>
                          </div>
                        </div>
                      </div>

                      <q-checkbox
                        :model-value="isSelected(row)"
                        :disable="loading"
                        color="dark"
                        @update:model-value="toggleRowSelection(row, $event)"
                      />
                    </div>

                    <q-card-actions align="between" class="pipeline-card__footer">
                      <div class="pipeline-card__footer-actions">
                        <q-btn
                          flat
                          round
                          icon="visibility"
                          class="pipeline-card__icon-action"
                          :disable="loading"
                          @click="openDatabook(row)"
                        />
                      </div>
                      <div class="pipeline-card__footer-actions">
                        <q-btn
                          flat
                          round
                          icon="delete"
                          class="pipeline-card__icon-action"
                          :disable="loading || row.pipeline_id === 'pipeline_default'"
                          @click="confirmDelete(row)"
                        />
                      </div>
                    </q-card-actions>
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
        :can-delete="canDeleteSelectedPipelines"
        @share="shareSelected"
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

  <ProjectCreateDialog v-model="pipelineDialogOpen" @created="onPipelineCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import SelectionActionBar from 'components/SelectionActionBar.vue'
import ProjectCreateDialog from 'components/ProjectCreateDialog.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { copySelectionSummary } from 'src/utils/selectionShare'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.projects?.list &&
    !!bridge.value?.projects?.upsertMany &&
    !!bridge.value?.projects?.create &&
    !!bridge.value?.projects?.delete,
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

const pipelines = ref([])
const pipelineOwnerById = ref({})
const pipelineTeamById = ref({})
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const pipelineDialogOpen = ref(false)
const searchQuery = ref('')
const pipelineKindFilter = ref('all')
const stageFilter = ref('')
const statusFilter = ref('')
const viewMode = ref('card')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)
const canDeleteSelectedPipelines = computed(
  () =>
    !!bridge.value?.projects?.delete &&
    selectedRows.value.some((row) => String(row?.pipeline_id || '').trim() !== 'pipeline_default'),
)

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const PROJECTS_BREADCRUMB_ACTION_OWNER = 'projects-page'

const columns = [
  { name: 'name', label: 'Project Name', field: 'name', align: 'left', sortable: true },
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
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const pipelineKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Own', value: 'own' },
  { label: 'Others', value: 'others' },
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
    return 'Create pipeline templates here, define stages, and activate them in the workspace.'
  }

  return `${total} templates tracked, ${installedCount} active, ${stagedCount} stage-ready, and ${inactiveCount} still need setup.`
})

const pipelinesDashboardStats = computed(() => [
  {
    label: 'Total projects',
    value: pipelinesDashboard.value.total,
    caption: 'Templates in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Created',
    value: pipelinesDashboard.value.installedCount,
    caption: 'Already active',
    tone: 'rich',
  },
  {
    label: 'Stage-ready',
    value: pipelinesDashboard.value.stagedCount,
    caption: 'With defined stages',
    tone: 'rich',
  },
  {
    label: 'Need setup',
    value: pipelinesDashboard.value.inactiveCount,
    caption: 'Still need setup',
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

  if (pipelineKindFilter.value === 'own') {
    items = items.filter((row) => isOwnPipeline(row))
  } else if (pipelineKindFilter.value === 'others') {
    items = items.filter((row) => !isOwnPipeline(row))
  }

  if (stageFilter.value) {
    items = items.filter((row) =>
      parsedStages(row).some((stage) => normalizePipelineValue(stage?.name) === stageFilter.value),
    )
  }

  if (statusFilter.value) {
    items = items.filter((row) => statusLabel(row?.install_status) === statusFilter.value)
  }

  if (query) {
    items = items.filter((row) =>
      [row?.name, row?.dir_name, row?.install_status, stageSummary(row)]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
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

function normalizePipelineValue(value) {
  return String(value || '').trim()
}

function isOwnPipeline(row) {
  return Boolean(row?.is_default) || String(row?.install_status || '').trim() === 'installed'
}

function stageSummary(row) {
  return parsedStages(row)
    .map((stage) => stage?.name)
    .filter(Boolean)
    .join(', ')
}

function getPipelineCardTitle(row) {
  if (row?.pipeline_id === 'pipeline_default') {
    return 'User Pipeline'
  }

  return normalizePipelineValue(row?.name) || 'Unnamed project'
}

function getPipelineCardStages(row) {
  return parsedStages(row).filter((stage) => normalizePipelineValue(stage?.name))
}

function getPipelineOwnerLabel(row) {
  const pipelineId = String(row?.pipeline_id || '').trim()
  return pipelineOwnerById.value[pipelineId] || 'Unassigned'
}

function getPipelineTeamLabel(row) {
  const pipelineId = String(row?.pipeline_id || '').trim()
  const names = Array.isArray(pipelineTeamById.value[pipelineId]) ? pipelineTeamById.value[pipelineId] : []
  return names.length ? names.join(', ') : 'No team assigned'
}

function formatPipelineStageName(name) {
  const cleaned = String(name || '')
    .replace(/^\s*\d+[\s._-]*/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
}

function exportPipelinesCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('projects.csv', csv, 'text/csv')
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

async function loadPipelines() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.projects.list()
    pipelines.value = result?.projects || []
    await loadPipelineTeamMetadata()
    normalizeSelectedRows()
  } catch (e) {
    error.value = e?.message || String(e)
    pipelines.value = []
    pipelineOwnerById.value = {}
    pipelineTeamById.value = {}
    normalizeSelectedRows()
  } finally {
    loading.value = false
  }
}

async function loadPipelineTeamMetadata() {
  if (!bridge.value?.db?.query) {
    pipelineOwnerById.value = {}
    pipelineTeamById.value = {}
    return
  }

  const ownerRows = await bridge.value.db.query(
    `
    SELECT
      pt.project_id AS pipeline_id,
      owner.Name AS owner_name
    FROM Project_Team pt
    LEFT JOIN Contacts owner ON owner.id = pt.Project_Team_Owner
  `,
  )

  const teamRows = await bridge.value.db.query(
    `
    SELECT
      cppr.to_id AS pipeline_id,
      contact.Name AS contact_name
    FROM Contacts_Projects_project_roles cppr
    LEFT JOIN Contacts contact ON contact.id = cppr.from_id
  `,
  )

  const nextOwnerById = {}
  for (const row of Array.isArray(ownerRows) ? ownerRows : []) {
    const pipelineId = String(row?.pipeline_id || '').trim()
    const ownerName = normalizePipelineValue(row?.owner_name)
    if (!pipelineId || !ownerName) continue
    nextOwnerById[pipelineId] = ownerName
  }

  const nextTeamById = {}
  for (const row of Array.isArray(teamRows) ? teamRows : []) {
    const pipelineId = String(row?.pipeline_id || '').trim()
    const contactName = normalizePipelineValue(row?.contact_name)
    if (!pipelineId || !contactName) continue
    if (!Array.isArray(nextTeamById[pipelineId])) nextTeamById[pipelineId] = []
    if (!nextTeamById[pipelineId].includes(contactName) && nextOwnerById[pipelineId] !== contactName) {
      nextTeamById[pipelineId].push(contactName)
    }
  }

  pipelineOwnerById.value = nextOwnerById
  pipelineTeamById.value = nextTeamById
}

async function togglePipeline(row) {
  if (!hasBridge.value) return
  error.value = ''
  loading.value = true
  try {
    if (row.install_status === 'installed') {
      await bridge.value.projects.uninstall(row.pipeline_id)
    } else {
      await bridge.value.projects.install(row.pipeline_id)
    }
    await loadPipelines()
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function confirmDelete(row) {
  if (!bridge.value?.projects?.delete) return
  if (row?.pipeline_id === 'pipeline_default') return

  $q.dialog({
    title: 'Delete project?',
    message:
      row.install_status === 'installed'
        ? `This will uninstall and permanently delete project "${row.name}".`
        : `This will permanently delete project "${row.name}".`,
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
    await bridge.value.projects.uninstall(row.pipeline_id)
  }
  await bridge.value.projects.delete(row.pipeline_id)
}

async function confirmDeleteSelected() {
  if (!bridge.value?.projects?.delete || selectedCount.value === 0) return
  const deletableRows = selectedRows.value.filter((row) => row.pipeline_id !== 'pipeline_default')
  if (deletableRows.length === 0) {
    $q.notify({ type: 'warning', message: 'The user pipeline cannot be deleted.' })
    return
  }

  $q.dialog({
    title: 'Delete selected projects?',
    message: `This will permanently delete ${deletableRows.length} selected project${deletableRows.length === 1 ? '' : 's'}.`,
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

async function shareSelected() {
  if (selectedCount.value === 0) return
  try {
    await copySelectionSummary({
      rows: selectedRows.value,
      getLabel: (row) => getPipelineCardTitle(row),
      entityLabel: 'projects',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected project${selectedCount.value === 1 ? '' : 's'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.projects.upsertMany(importedRows)
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
    params: { tableName: 'Projects', recordId },
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
  setBreadcrumbActions(PROJECTS_BREADCRUMB_ACTION_OWNER, [
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
      onClick: exportPipelinesCsv,
    },
  ])
  window.addEventListener('ecvc:open-pipeline-dialog', onOpenPipelineDialog)
  if (!hasBridge.value) return
  await loadPipelines()
  consumeQueuedPipelineDialogOpen()
  openCreatePipelineFromQuery()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(PROJECTS_BREADCRUMB_ACTION_OWNER)
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
  gap: var(--ds-space-24);
}

.pipelines-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.pipelines-shell__hero {
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

.pipelines-shell__hero::before {
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

.pipelines-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.pipelines-shell__hero > * {
  position: relative;
  z-index: 1;
}

.pipelines-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: flex-start;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.pipelines-shell__eyebrow {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.16em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.pipelines-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.pipelines-shell__hero-text {
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

.pipelines-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.pipelines-shell__meta-pill {
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

.pipelines-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ds-space-14);
}

.pipelines-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.pipelines-dashboard__stat {
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
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.pipelines-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.pipelines-dashboard__stat-caption,
.pipelines-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.pipelines-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.pipelines-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.pipelines-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
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

.pipelines-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.pipelines-toolbar__block--filters {
  flex-wrap: nowrap;
}

.pipelines-toolbar__block--search {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.pipelines-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.pipelines-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.pipelines-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.pipelines-toolbar__search :deep(.q-field__control),
.pipelines-toolbar__search :deep(.q-field__native),
.pipelines-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.pipelines-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.pipelines-toolbar__toggle {
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

.pipelines-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.pipelines-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.pipelines-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.pipelines-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.pipelines-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
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
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.pipelines-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.pipelines-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.pipelines-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.pipelines-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.pipelines-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: var(--ds-space-12) var(--ds-space-16);
  border-top: 1px solid var(--ds-table-border);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
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
  border-radius: 20px;
  border-color: rgba(17, 17, 17, 0.1);
  box-shadow: 0 12px 30px rgba(17, 17, 17, 0.06);
  overflow: hidden;
}

.pipeline-card__shell {
  display: grid;
  grid-template-columns: 184px minmax(0, 1fr);
  flex: 1 1 auto;
  gap: 0;
  padding: 0;
}

.pipeline-card__stage-panel {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 18px 16px;
  background:
    radial-gradient(circle at 26% 24%, rgba(235, 255, 90, 0.16), transparent 28%),
    radial-gradient(circle at 74% 76%, rgba(38, 71, 255, 0.12), transparent 32%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border-right: 1px solid rgba(17, 17, 17, 0.08);
}

.pipeline-card__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 16px;
}

.pipeline-card__hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.pipeline-card__hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}

.pipeline-card__summary-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.pipeline-card__title {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.pipeline-card__meta-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline-card__meta-row {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.pipeline-card__meta-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pipeline-card__meta-value {
  color: #4b4b4b;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-wrap: balance;
}

.pipeline-card__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pipeline-card__stage-map {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  overflow-y: auto;
  padding: 2px 2px 0;
  scrollbar-width: thin;
}

.pipeline-card__stage-stop {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.pipeline-card__stage-chip {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(17, 17, 17, 0.06);
}

.pipeline-card__stage-number {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #111;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}

.pipeline-card__stage-name {
  max-width: 124px;
  color: #111;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-medium);
  line-height: 18px;
  word-break: break-word;
}

.pipeline-card__stage-connector {
  width: 2px;
  height: 18px;
  margin-left: 11px;
  background: rgba(17, 17, 17, 0.18);
  border-radius: 999px;
}

.pipeline-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.pipeline-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
}

.pipeline-card__icon-action {
  color: #111;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.1);
}

@media (max-width: 1200px) {
  .pipelines-shell {
    gap: 32px;
  }

  .pipelines-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .pipelines-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
  }

  .pipelines-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .pipelines-toolbar__search {
    width: 100%;
  }

  .pipelines-toolbar__filter-control,
  .pipelines-toolbar__toggle {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .pipelines-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .pipelines-dashboard__stat {
    min-height: 98px;
  }

  .pipeline-card__shell {
    grid-template-columns: 1fr;
  }

  .pipeline-card__stage-panel {
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  }

  .pipeline-card__main {
    padding: 16px;
  }
}
</style>
