<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Companies requires Electron. Run <code>quasar dev -m electron</code> or
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
          <div class="text-h6">Companies</div>
          <div class="text-caption text-grey-7">All companies.</div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="companies"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateCompany"
            create-label="Create company"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadCompanies" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No companies created yet.</div>
          <q-btn color="primary" outline label="Create company" @click="companyDialogOpen = true" />
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

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CompanyCreateDialog from 'components/CompanyCreateDialog.vue'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.companies?.list &&
    !!bridge.value?.companies?.upsertMany &&
    !!bridge.value?.companies?.create &&
    !!bridge.value?.companies?.delete,
)

const rows = ref([])
const loading = ref(false)
const error = ref('')
const companyDialogOpen = ref(false)

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

function openCreateCompany() {
  companyDialogOpen.value = true
}

function onOpenCompanyDialog() {
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
}

function openCreateCompanyFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateCompany()
  globalThis.__ecvcOpenCompanyDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedCompanyDialogOpen() {
  if (globalThis.__ecvcOpenCompanyDialog !== true) return false
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
  return true
}

const columns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'Website', label: 'Website', field: 'Website', align: 'left', sortable: true },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Company_Type', label: 'Type', field: 'Company_Type', align: 'left', sortable: true },
  {
    name: 'Amount_Raised_AUMs',
    label: 'Raised/AUM (USD)',
    field: 'Amount_Raised_AUMs',
    align: 'right',
    sortable: true,
    format: (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('en-US')),
  },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['id', 'Company_Name', 'Website', 'Status', 'Company_Type', 'Amount_Raised_AUMs']

async function loadCompanies() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.companies.list()
    rows.value = result?.companies || []
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.companies.upsertMany(importedRows)
  await loadCompanies()
  return result
}

async function onCompanyCreated() {
  await loadCompanies()
}

async function confirmDelete(row) {
  if (!bridge.value?.companies?.delete) return
  const company = row?.Company_Name ? ` (${row.Company_Name})` : ''

  $q
    .dialog({
      title: 'Delete company?',
      message: `This will permanently delete this company${company}. If it has related opportunities, the delete will be blocked.`,
      cancel: true,
      persistent: true,
    })
    .onOk(async () => {
      loading.value = true
      try {
        await bridge.value.companies.delete(row.id)
        await loadCompanies()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.message || String(e) })
      } finally {
        loading.value = false
      }
    })
}

onMounted(async () => {
  window.addEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
  if (!hasBridge.value) return
  await loadCompanies()
  consumeQueuedCompanyDialogOpen()
  openCreateCompanyFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateCompanyFromQuery()
  },
)
</script>
