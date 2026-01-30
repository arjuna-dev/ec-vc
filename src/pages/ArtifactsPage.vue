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

    <div v-else>
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col">
          <div class="text-h6">Artifacts</div>
          <div class="text-caption text-grey-7">All artifacts stored in the database.</div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="artifacts"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateArtifact"
            create-label="Add artifact"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadArtifacts" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No artifacts created yet.</div>
          <q-btn
            color="primary"
            outline
            label="Create artifact"
            @click="window.dispatchEvent(new Event('ecvc:open-artifact-dialog'))"
          />
        </div>
      </q-banner>

      <q-table
        v-else
        flat
        bordered
        row-key="artifact_id"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.artifacts?.list && !!bridge.value?.artifacts?.upsertMany)

const rows = ref([])
const loading = ref(false)
const error = ref('')

function openCreateArtifact() {
  window.dispatchEvent(new Event('ecvc:open-artifact-dialog'))
}

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'artifact_type', label: 'Type', field: 'artifact_type', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'pipeline_id', label: 'Pipeline', field: 'pipeline_id', align: 'left', sortable: true },
  { name: 'stage_id', label: 'Stage', field: 'stage_id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
]

const csvHeaders = [
  'artifact_id',
  'title',
  'artifact_type',
  'status',
  'fs_path',
  'opportunity_id',
  'pipeline_id',
  'stage_id',
  'generated_by',
]

async function loadArtifacts() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.artifacts.list()
    rows.value = result?.artifacts || []
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.artifacts.upsertMany(importedRows)
  await loadArtifacts()
  return result
}

onMounted(() => {
  if (!hasBridge.value) return
  loadArtifacts()
})
</script>
