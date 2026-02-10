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

    <div v-else>
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col">
          <div class="text-h6">Opportunities</div>
          <div class="text-caption text-grey-7">All created opportunities.</div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="opportunities"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateOpportunity"
            create-label="Create opportunity"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadOpportunities" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No opportunities created yet.</div>
          <q-btn color="primary" outline label="Create opportunity" @click="openCreateOpportunity" />
        </div>
      </q-banner>

      <q-table
        v-else
        flat
        bordered
        row-key="id"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template #body-cell-actions="props">
          <q-td :props="props">
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
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'

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
const loading = ref(false)
const error = ref('')

const $q = useQuasar()

function openCreateOpportunity() {
  globalThis?.dispatchEvent?.(new Event('ecvc:open-opportunity-dialog'))
}

const columns = [
  { name: 'kind', label: 'Kind', field: 'kind', align: 'left', sortable: true },
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'Round_Stage', label: 'Round', field: 'Round_Stage', align: 'left', sortable: true },
  { name: 'Fund_Type', label: 'Fund Type', field: 'Fund_Type', align: 'left', sortable: true },
  {
    name: 'size',
    label: 'Size / Target (USD)',
    field: (row) => row.kind === 'fund' ? row.Fund_Size_Target : row.Round_Amount,
    align: 'right',
    sortable: true,
    format: (_v, row) => {
      const value = row.kind === 'fund' ? row.Fund_Size_Target : row.Round_Amount
      return value === null || value === undefined || value === '' ? '' : Number(value).toLocaleString('en-US')
    },
  },
  { name: 'Venture_Oppty_Name', label: 'Opportunity Name', field: 'Venture_Oppty_Name', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'kind',
  'company_id',
  'Company_Name',
  'Venture_Oppty_Name',
  'Round_Stage',
  'Round_Amount',
  'Fund_Type',
  'Fund_Size_Target',
  'Pipeline_Stage',
  'Pipeline_Status',
  'Raising_Status',
]

async function loadOpportunities() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.opportunities.list()
    rows.value = result?.opportunities || []
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.opportunities.upsertMany(importedRows)
  await loadOpportunities()
  return result
}

async function confirmDelete(row) {
  if (!bridge.value?.opportunities?.delete) return
  const company = row?.Company_Name ? ` (${row.Company_Name})` : ''

  $q
    .dialog({
      title: 'Delete opportunity?',
      message: `This will permanently delete this opportunity${company}.`,
      cancel: true,
      persistent: true,
    })
    .onOk(async () => {
      loading.value = true
      try {
        await bridge.value.opportunities.delete(row.id)
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
</script>
