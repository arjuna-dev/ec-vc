<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Tasks</div>
        <div class="text-caption text-grey-7">All tasks.</div>
      </div>
      <div class="col-auto">
        <q-btn-toggle
          v-model="viewMode"
          dense
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          :options="viewOptions"
        />
      </div>
      <div class="col-auto">
        <q-btn dense flat icon="refresh" :loading="loading" @click="loadTasks" />
      </div>
      <div class="col-auto">
        <TableCsvActions
          ref="csvActionsRef"
          filename-base="tasks"
          :headers="csvHeaders"
          :rows="rows"
          :on-import-rows="importRows"
        />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <q-table
      v-if="viewMode === 'table'"
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

    <div v-else class="row q-col-gutter-md tasks-grid">
      <div v-for="row in rows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="task-card full-height">
          <q-card-section class="q-pb-sm">
            <div class="row items-start justify-between q-col-gutter-sm">
              <div class="col">
                <div class="task-card__title">{{ row.Task_Name || 'Untitled task' }}</div>
                <div v-if="row.Task_Description" class="task-card__summary">
                  {{ row.Task_Description }}
                </div>
              </div>
              <div class="col-auto">
                <q-checkbox
                  :model-value="isSelected(row)"
                  :disable="loading"
                  color="primary"
                  @update:model-value="toggleRowSelection(row, $event)"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm">
            <div v-if="row.Status" class="task-card__field">
              <q-icon name="flag" size="16px" class="q-mr-sm text-grey-7" />
              <span>{{ row.Status }}</span>
            </div>
            <div v-if="row.Priority" class="task-card__field">
              <q-icon name="priority_high" size="16px" class="q-mr-sm text-grey-7" />
              <span>{{ row.Priority }}</span>
            </div>
            <div v-if="row.Due_Date" class="task-card__field">
              <q-icon name="event" size="16px" class="q-mr-sm text-grey-7" />
              <span>{{ row.Due_Date }}</span>
            </div>
            <div v-if="row.contact_name" class="task-card__field">
              <q-icon name="person" size="16px" class="q-mr-sm text-grey-7" />
              <span>{{ row.contact_name }}</span>
            </div>
            <div v-if="row.company_name" class="task-card__field">
              <q-icon name="apartment" size="16px" class="q-mr-sm text-grey-7" />
              <span>{{ row.company_name }}</span>
            </div>
          </q-card-section>

          <q-space />

          <q-card-actions align="right">
            <q-btn
              dense
              flat
              round
              icon="delete"
              color="negative"
              :disable="loading"
              @click="confirmDelete(row)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

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
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const viewMode = ref('grid')
const selectedCount = computed(() => selectedRows.value.length)
const csvActionsRef = ref(null)

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const TASKS_BREADCRUMB_ACTION_OWNER = 'tasks-page'

const columns = [
  { name: 'Task_Name', label: 'Task', field: 'Task_Name', align: 'left', sortable: true },
  { name: 'Task_Description', label: 'Summary', field: 'Task_Description', align: 'left' },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Priority', label: 'Priority', field: 'Priority', align: 'left', sortable: true },
  { name: 'Due_Date', label: 'Due', field: 'Due_Date', align: 'left', sortable: true },
  { name: 'contact_name', label: 'Owner', field: 'contact_name', align: 'left', sortable: true },
  { name: 'company_name', label: 'Company', field: 'company_name', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'Task_Name',
  'Task_Summary',
  'Task_Status',
  'Task_Priority_Rank',
  'Task_Start_Date',
  'Task_Due_Date',
  'Task_End_Date',
  'Task_Team_Owner',
  'Task_Team_Assigned',
  'Task_Team_Support',
]

const viewOptions = [
  { label: 'Grid', value: 'grid', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
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

function isSelected(row) {
  return selectedRows.value.some((selectedRow) => selectedRow.id === row?.id)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  if (shouldSelect) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }
  selectedRows.value = selectedRows.value.filter((selectedRow) => String(selectedRow?.id || '').trim() !== rowId)
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
  setBreadcrumbActions(TASKS_BREADCRUMB_ACTION_OWNER, [
    {
      id: 'import-csv',
      label: 'Import CSV',
      icon: 'download',
      disabled: () => loading.value,
      onClick: () => csvActionsRef.value?.pickFile?.(),
    },
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: 'upload',
      disabled: () => loading.value || rows.value.length === 0,
      onClick: () => csvActionsRef.value?.exportCsv?.(),
    },
  ])
  window.addEventListener('ecvc:open-task-dialog', onOpenTaskDialog)
  await loadTasks()
  consumeQueuedOpen()
  openCreateFromQuery()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(TASKS_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('ecvc:open-task-dialog', onOpenTaskDialog)
})

watch(
  () => route.query.create,
  () => openCreateFromQuery(),
)
</script>

<style scoped>
.tasks-grid {
  align-items: stretch;
}

.task-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 18px;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.task-card__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.task-card__summary {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.45;
}

.task-card__field {
  display: flex;
  align-items: center;
  color: #334155;
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
