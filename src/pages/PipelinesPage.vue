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
          <q-td :props="props">
            <q-badge :color="statusColor(props.row.install_status)" outline>
              {{ statusLabel(props.row.install_status) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-stages="props">
          <q-td :props="props">
            <div
              v-if="props.row.stages && props.row.stages.length"
              style="
                width: 150px;
                height: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                line-clamp: 4;
                -webkit-box-orient: vertical;
                white-space: normal;
                position: relative;
              "
            >
              {{
                JSON.parse(props.row.stages)
                  .map((stage) => stage.name) // Remove the "(Position: N)" part
                  .join(', ')
              }}
              <q-tooltip>
                {{
                  JSON.parse(props.row.stages)
                    .map((stage) => stage.name) // Full text on hover
                    .join(', ')
                }}
              </q-tooltip>
            </div>
            <div v-else>No stages available</div>
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
              class="q-ml-sm"
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

function statusLabel(status) {
  if (status === 'installed') return 'Created'
  if (status === 'installing') return 'Creating…'
  if (status === 'uninstalling') return 'Deleting…'
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
