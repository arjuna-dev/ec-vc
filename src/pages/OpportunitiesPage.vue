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
          <q-btn
            color="primary"
            outline
            label="Create opportunity"
            @click="window.dispatchEvent(new Event('ecvc:open-opportunity-dialog'))"
          />
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
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () => !!bridge.value?.opportunities?.list && !!bridge.value?.opportunities?.upsertMany,
)

const rows = ref([])
const loading = ref(false)
const error = ref('')

const columns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'Round_Stage', label: 'Round', field: 'Round_Stage', align: 'left', sortable: true },
  {
    name: 'Round_Amount',
    label: 'Round Size (USD)',
    field: 'Round_Amount',
    align: 'right',
    sortable: true,
    format: (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('en-US')),
  },
  { name: 'Venture_Oppty_Name', label: 'Opportunity Name', field: 'Venture_Oppty_Name', align: 'left', sortable: true },
]

const csvHeaders = [
  'id',
  'company_id',
  'Company_Name',
  'Venture_Oppty_Name',
  'Round_Stage',
  'Round_Amount',
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
