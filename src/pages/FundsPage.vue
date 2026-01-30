<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Funds requires Electron. Run <code>quasar dev -m electron</code> or
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
          <div class="text-h6">Funds</div>
          <div class="text-caption text-grey-7">All funds.</div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="funds"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateFund"
            create-label="Create fund"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadFunds" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No funds created yet.</div>
          <q-btn color="primary" outline label="Create fund" @click="fundDialogOpen = true" />
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

  <FundCreateDialog v-model="fundDialogOpen" @created="onFundCreated" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import FundCreateDialog from 'components/FundCreateDialog.vue'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.funds?.list &&
    !!bridge.value?.funds?.upsertMany &&
    !!bridge.value?.funds?.create &&
    !!bridge.value?.funds?.delete,
)

const rows = ref([])
const loading = ref(false)
const error = ref('')
const fundDialogOpen = ref(false)

const $q = useQuasar()

function openCreateFund() {
  fundDialogOpen.value = true
}

const columns = [
  { name: 'Fund_Oppty_Name', label: 'Fund', field: 'Fund_Oppty_Name', align: 'left', sortable: true },
  { name: 'Fund_Type', label: 'Type', field: 'Fund_Type', align: 'left', sortable: true },
  {
    name: 'Fund_Size_Target',
    label: 'Size Target (USD)',
    field: 'Fund_Size_Target',
    align: 'right',
    sortable: true,
    format: (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('en-US')),
  },
  {
    name: 'Investment_Ask',
    label: 'Investment Ask (USD)',
    field: 'Investment_Ask',
    align: 'right',
    sortable: true,
    format: (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('en-US')),
  },
  { name: 'Raising_Status', label: 'Raising Status', field: 'Raising_Status', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['id', 'Fund_Oppty_Name', 'Fund_Type', 'Fund_Size_Target', 'Investment_Ask', 'Raising_Status']

async function loadFunds() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.funds.list()
    rows.value = result?.funds || []
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.funds.upsertMany(importedRows)
  await loadFunds()
  return result
}

async function onFundCreated() {
  await loadFunds()
}

async function confirmDelete(row) {
  if (!bridge.value?.funds?.delete) return
  const name = row?.Fund_Oppty_Name ? ` (${row.Fund_Oppty_Name})` : ''

  $q
    .dialog({
      title: 'Delete fund?',
      message: `This will permanently delete this fund${name}.`,
      cancel: true,
      persistent: true,
    })
    .onOk(async () => {
      loading.value = true
      try {
        await bridge.value.funds.delete(row.id)
        await loadFunds()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.message || String(e) })
      } finally {
        loading.value = false
      }
    })
}

onMounted(() => {
  if (!hasBridge.value) return
  loadFunds()
})
</script>
