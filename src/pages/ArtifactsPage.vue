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
      <div class="row items-center q-col-gutter-sm page-title-section">
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
          <q-btn color="primary" outline label="Create artifact" @click="openCreateArtifact" />
        </div>
      </q-banner>

      <q-table
        v-else
        flat
        bordered
        row-key="artifact_id"
        v-model:selected="selectedRows"
        selection="multiple"
        :rows="rows"
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

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[18 * 2, 18]">
        <q-btn
          color="negative"
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
              {{ propertiesForm.artifact_id || 'Unsaved artifact' }}
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
                <q-input
                  :model-value="String(propertiesForm.type || '')"
                  outlined
                  dense
                  label="Category"
                  readonly
                />
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
              <div class="col-12 col-md-6">
                <q-input
                  :model-value="String(propertiesForm.fs_path || '')"
                  outlined
                  dense
                  label="File Path"
                  readonly
                />
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
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.artifacts?.list &&
    !!bridge.value?.artifacts?.upsertMany &&
    !!bridge.value?.artifacts?.delete &&
    !!bridge.value?.db?.execute,
)

const rows = ref([])
const opportunities = ref([])
const filteredOpportunityOptions = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const propertiesDialogOpen = ref(false)
const savingProperties = ref(false)
const propertiesError = ref('')
const propertiesForm = ref(createEmptyPropertiesForm())
const selectedCount = computed(() => selectedRows.value.length)

const $q = useQuasar()

function openCreateArtifact() {
  globalThis?.dispatchEvent?.(new Event('ecvc:open-artifact-dialog'))
}

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'artifact_type', label: 'Type', field: 'artifact_type', align: 'left', sortable: true },
  { name: 'artifact_format', label: 'Format', field: 'artifact_format', align: 'left', sortable: true },
  { name: 'type', label: 'Category', field: 'type', align: 'left', sortable: true },
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

const opportunityOptions = computed(() =>
  filteredOpportunityOptions.value.map((opportunity) => ({
    label: buildOpportunityOptionLabel(opportunity),
    value: opportunity.id,
  })),
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

function normalizeSelectedRows() {
  const activeIds = new Set(rows.value.map((row) => row.artifact_id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.artifact_id))
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

async function openPropertiesDialog(row) {
  propertiesError.value = ''
  filteredOpportunityOptions.value = [...opportunities.value]
  const nextForm = {
    artifact_id: String(row?.artifact_id || ''),
    title: String(row?.title || ''),
    artifact_type: String(row?.artifact_type || ''),
    artifact_format: String(row?.artifact_format || ''),
    type: String(row?.type || ''),
    opportunity_id: String(row?.opportunity_id || '').trim() || null,
    description: '',
    fs_path: String(row?.fs_path || ''),
    original_artifact_id: String(row?.original_artifact_id || ''),
    created_at: String(row?.created_at || ''),
  }

  if (bridge.value?.db?.query && nextForm.artifact_id) {
    try {
      const detailRows = await bridge.value.db.query(
        `
        SELECT description
        FROM Artifact_Details
        WHERE artifact_id = ?
        LIMIT 1
      `,
        [nextForm.artifact_id],
      )
      const detail = Array.isArray(detailRows) ? detailRows[0] : null
      nextForm.description = String(detail?.description || '')
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

  const opportunityId = String(propertiesForm.value.opportunity_id || '').trim()
  const roundId = opportunityId && !opportunityId.startsWith('fund:') ? opportunityId : null
  const fundId = opportunityId && opportunityId.startsWith('fund:') ? opportunityId : null

  savingProperties.value = true
  propertiesError.value = ''
  try {
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
        artifactId,
      ],
    )

    await loadArtifacts()
    propertiesDialogOpen.value = false
    $q.notify({ type: 'positive', message: 'Artifact properties updated.' })
  } catch (e) {
    propertiesError.value = e?.message || String(e)
  } finally {
    savingProperties.value = false
  }
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
  if (!hasBridge.value) return
  loadArtifacts()
  loadOpportunities()
})
</script>
