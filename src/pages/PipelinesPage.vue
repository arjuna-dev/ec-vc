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

    <div v-else>
      <div class="row items-center q-col-gutter-sm page-title-section">
        <div class="col">
          <div class="text-h6">Pipelines</div>
          <div class="text-caption text-grey-7">
            Predefined pipelines you can create in the workspace.
          </div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="pipelines"
            :headers="csvHeaders"
            :rows="pipelines"
            :on-import-rows="importRows"
            :on-create="openCreatePipeline"
            create-label="Create pipeline"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadPipelines" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-table
        flat
        bordered
        row-key="pipeline_id"
        :rows="pipelines"
        :columns="columns"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-install_status="props">
          <q-td :props="props" class="pipeline-status-cell">
            <div class="pipeline-status-copy">
              <span class="pipeline-status-label">{{ statusLabel(props.row.install_status) }}</span>
              <span class="pipeline-status-percentage">{{ progressPercent(props.row) }}%</span>
            </div>
            <div
              class="pipeline-progress-track"
              role="progressbar"
              aria-label="Files loaded"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="progressPercent(props.row)"
            >
              <div
                class="pipeline-progress-fill"
                :style="{ width: `${progressPercent(props.row)}%` }"
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-stages="props">
          <q-td :props="props">
            <div class="pipeline-stage-icons">
              <q-avatar
                v-for="stage in stageTrack(props.row)"
                :key="`${props.row.pipeline_id}:${stage.index}:${stage.label}`"
                class="pipeline-stage-icon"
                size="28px"
                :class="{ 'pipeline-stage-icon--current': stage.isCurrent }"
                :style="{ backgroundColor: stage.color, opacity: stage.opacity }"
              >
                {{ stage.index }}
                <q-tooltip>{{ stage.tooltip }}</q-tooltip>
              </q-avatar>
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              outline
              color="primary"
              :label="
                props.row.install_status === 'installed'
                  ? 'DEACTIVATE Pipeline'
                  : 'ACTIVATE Pipeline'
              "
              :disable="isBusy(props.row.install_status) || loading"
              @click="togglePipeline(props.row)"
            />
            <q-btn
              class="q-ml-md"
              dense
              flat
              round
              icon="delete"
              color="negative"
              :disable="loading || props.row.pipeline_id === 'pipeline_default'"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>

  <PipelineCreateDialog v-model="pipelineDialogOpen" @created="onPipelineCreated" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'
import PipelineCreateDialog from 'components/PipelineCreateDialog.vue'

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
const loading = ref(false)
const error = ref('')
const pipelineDialogOpen = ref(false)

const $q = useQuasar()

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
const PROGRESS_BLUE = '#2647ff'
const PROGRESS_RED = '#ff5521'
const STAGE_LABELS = {
  0: 'No Information',
  1: 'Thesis Alignment',
  2: 'Team Analysis',
  3: 'Investment Committee',
  4: 'Due Diligence',
  5: 'Closing Documents',
}
const STAGE_ORDER = [0, 1, 2, 3, 4, 5]
const STAGE_INACTIVE_COLOR = '#b0b0b0'
const STAGE_COLORS = {
  0: PROGRESS_RED,
  1: '#ff8a3d',
  2: '#b677fe',
  3: '#ebf5a0',
  4: '#7ccf6b',
  5: '#2ca24d',
}

function statusLabel(status) {
  if (status === 'installed') return 'Created'
  if (status === 'installing') return 'Creating…'
  if (status === 'uninstalling') return 'Deleting…'
  if (status === 'error') return 'Error'
  return 'Not created'
}

function isBusy(status) {
  return status === 'installing' || status === 'uninstalling'
}

function toFiniteNumber(value) {
  const numeric = Number.parseFloat(value)
  return Number.isFinite(numeric) ? numeric : null
}

function clampPercent(value) {
  const numeric = toFiniteNumber(value)
  if (numeric === null) return null
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function firstNumericValue(row, keys) {
  for (const key of keys) {
    const numeric = toFiniteNumber(row?.[key])
    if (numeric !== null) return numeric
  }
  return null
}

function progressPercent(row) {
  const percentKeys = [
    'files_loaded_percent',
    'filesLoadedPercent',
    'progress_percent',
    'progressPercent',
    'load_percent',
    'loadPercent',
    'progress',
    'completion',
  ]
  const directPercent = firstNumericValue(row, percentKeys)
  const normalizedDirectPercent = clampPercent(directPercent)
  if (normalizedDirectPercent !== null) return normalizedDirectPercent

  const loadedFiles = firstNumericValue(row, [
    'files_loaded',
    'filesLoaded',
    'loaded_files',
    'loadedFiles',
    'processed_files',
    'processedFiles',
    'imputed_files',
    'imputedFiles',
  ])
  const totalFiles = firstNumericValue(row, ['files_total', 'filesTotal', 'total_files', 'totalFiles'])
  if (loadedFiles !== null && totalFiles && totalFiles > 0) {
    return clampPercent((loadedFiles / totalFiles) * 100) ?? 0
  }

  if (row?.install_status === 'installed') return 100
  if (row?.install_status === 'installing') return 60
  return 0
}

function parseStageIndex(value) {
  const numeric = toFiniteNumber(value)
  if (numeric !== null && numeric >= 0 && numeric <= 5) return Math.round(numeric)
  const text = String(value || '').trim().toLowerCase()
  const prefixNumber = text.match(/^(\d+)/u)
  if (prefixNumber) {
    const parsed = Number.parseInt(prefixNumber[1], 10)
    if (parsed >= 0 && parsed <= 5) return parsed
  }
  if (text.includes('thesis')) return 1
  if (text.includes('team')) return 2
  if (text.includes('committee')) return 3
  if (text.includes('diligence')) return 4
  if (text.includes('closing')) return 5
  return null
}

function normalizeStageIndex(value) {
  const index = parseStageIndex(value)
  return index === null ? null : Math.max(0, Math.min(5, index))
}

function currentStageIndex(row) {
  const directIndex = firstNumericValue(row, [
    'current_stage',
    'currentStage',
    'current_stage_index',
    'currentStageIndex',
    'stage_index',
    'stageIndex',
    'stage_position',
    'stagePosition',
  ])
  if (directIndex !== null) return Math.max(0, Math.min(5, Math.round(directIndex)))

  const directLabel = normalizeStageIndex(row?.current_stage_name || row?.currentStageName || row?.stage_name)
  if (directLabel !== null) return directLabel

  // No explicit progress info yet: default to stage 0.
  return 0
}

function stageTrack(row) {
  const current = currentStageIndex(row)
  return STAGE_ORDER.map((index) => {
    const label = STAGE_LABELS[index] || STAGE_LABELS[0]
    const isCurrent = index === current
    return {
      index,
      label,
      color: isCurrent ? STAGE_COLORS[index] || STAGE_COLORS[0] : STAGE_INACTIVE_COLOR,
      isCurrent,
      opacity: isCurrent ? 1 : 0.5,
      tooltip: `${index}. ${label}${isCurrent ? ' (Current stage)' : ''}`,
    }
  })
}

async function loadPipelines() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.pipelines.list()
    pipelines.value = result?.pipelines || []
  } catch (e) {
    error.value = e?.message || String(e)
    pipelines.value = []
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
      if (row.install_status === 'installed') {
        await bridge.value.pipelines.uninstall(row.pipeline_id)
      }
      await bridge.value.pipelines.delete(row.pipeline_id)
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

async function onPipelineCreated() {
  await loadPipelines()
}

onMounted(loadPipelines)
</script>

<style scoped>
.pipeline-status-cell {
  min-width: 280px;
}

.pipeline-status-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  white-space: nowrap;
}

.pipeline-status-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.pipeline-status-percentage {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.pipeline-progress-track {
  width: 100%;
  height: 18px;
  border-radius: 999px;
  overflow: hidden;
  background: v-bind(PROGRESS_RED);
}

.pipeline-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: v-bind(PROGRESS_BLUE);
  transition: width 180ms ease-out;
}

.pipeline-stage-icons {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  flex-wrap: wrap;
}

.pipeline-stage-icon {
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  transition: opacity 150ms ease-out;
}

.pipeline-stage-icon--current {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px rgba(0, 0, 0, 0.2);
}
</style>
