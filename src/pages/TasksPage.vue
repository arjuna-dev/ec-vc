<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Tasks</div>
        <div class="text-caption text-grey-7">All tasks.</div>
      </div>
      <div class="col-auto">
        <TableCsvActions
          filename-base="tasks"
          :headers="csvHeaders"
          :rows="rows"
          :on-import-rows="importRows"
          :on-create="openCreateTask"
          create-label="Add Task"
        />
      </div>
      <div class="col-auto">
        <q-btn dense flat icon="refresh" :loading="loading" @click="loadTasks" />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <q-table
      flat
      bordered
      row-key="id"
      v-model:selected="selectedRows"
      selection="multiple"
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

    <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[18 * 2, 18]">
      <q-btn
        color="negative"
        unelevated
        :disable="loading"
        label="Delete All"
        @click="confirmDeleteSelected"
      />
    </q-page-sticky>

    <TaskCreateDialog v-model="dialogOpen" @created="onCreated" />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'
import TaskCreateDialog from 'components/TaskCreateDialog.vue'

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const selectedCount = computed(() => selectedRows.value.length)

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const columns = [
  { name: 'Task_Name', label: 'Task', field: 'Task_Name', align: 'left', sortable: true },
  { name: 'Task_Description', label: 'Description', field: 'Task_Description', align: 'left' },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Priority', label: 'Priority', field: 'Priority', align: 'left', sortable: true },
  { name: 'Due_Date', label: 'Due', field: 'Due_Date', align: 'left', sortable: true },
  {
    name: 'opportunity_name',
    label: 'Opportunity',
    field: 'opportunity_name',
    align: 'left',
    sortable: true,
  },
  { name: 'contact_name', label: 'Contact', field: 'contact_name', align: 'left', sortable: true },
  {
    name: 'pipeline_name',
    label: 'Pipeline',
    field: 'pipeline_name',
    align: 'left',
    sortable: true,
  },
  { name: 'company_name', label: 'Company', field: 'company_name', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'Task_Name',
  'Task_Description',
  'Status',
  'Priority',
  'Due_Date',
  'opportunity_id',
  'contact_id',
  'pipeline_id',
  'company_id',
]

function openCreateTask() {
  dialogOpen.value = true
}

function onOpenTaskDialog() {
  globalThis.__ecvcOpenTaskDialog = false
  openCreateTask()
}

function openCreateFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateTask()
  globalThis.__ecvcOpenTaskDialog = false
  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedOpen() {
  if (globalThis.__ecvcOpenTaskDialog !== true) return false
  globalThis.__ecvcOpenTaskDialog = false
  openCreateTask()
  return true
}

async function loadTasks() {
  if (!bridge.value?.tasks?.list) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.tasks.list()
    rows.value = result?.tasks || []
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
  const result = await bridge.value.tasks.upsertMany(importedRows)
  await loadTasks()
  return result
}

async function onCreated() {
  await loadTasks()
}

function normalizeSelectedRows() {
  const activeIds = new Set(rows.value.map((row) => row.id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.id))
}

async function deleteTask(row) {
  await bridge.value.tasks.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.tasks?.delete) return
  $q.dialog({
    title: 'Delete task?',
    message: 'This will permanently delete this task.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteTask(row)
      await loadTasks()
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.tasks?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected tasks?',
    message: `This will permanently delete ${selectedCount.value} selected task${selectedCount.value === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteTask(row)
      }
      selectedRows.value = []
      await loadTasks()
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  window.addEventListener('ecvc:open-task-dialog', onOpenTaskDialog)
  await loadTasks()
  consumeQueuedOpen()
  openCreateFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-task-dialog', onOpenTaskDialog)
})

watch(
  () => route.query.create,
  () => openCreateFromQuery(),
)
</script>
