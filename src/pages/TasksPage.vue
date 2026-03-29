<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Tasks requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="tasks-page">
      <section class="tasks-shell">
        <div class="tasks-shell__hero">
          <div class="tasks-shell__copy">
            <div class="tasks-shell__eyebrow">Dashboard</div>
            <h2 class="tasks-shell__hero-title">Keep the next actions visible and moving.</h2>
            <p class="tasks-shell__hero-text">{{ tasksHeroText }}</p>

          </div>

          <div class="tasks-dashboard">
            <div class="tasks-dashboard__stats">
              <article
                v-for="stat in tasksDashboardStats"
                :key="stat.label"
                class="tasks-dashboard__stat"
                :class="`tasks-dashboard__stat--${stat.tone}`"
              >
                <div class="tasks-dashboard__stat-label">{{ stat.label }}</div>
                <div class="tasks-dashboard__stat-value">{{ stat.value }}</div>
                <div class="tasks-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="tasks-dashboard__health">
              <div class="tasks-dashboard__health-copy">
                <div class="tasks-dashboard__health-label">Task mix</div>
                <div class="tasks-dashboard__health-text">
                  {{ tasksDashboard.openCount }} open, {{ tasksDashboard.completedCount }} completed,
                  {{ tasksDashboard.assignedCount }} assigned
                </div>
              </div>

              <div class="tasks-dashboard__health-bar" aria-hidden="true">
                <span
                  class="tasks-dashboard__health-segment tasks-dashboard__health-segment--sparse"
                  :style="{ width: `${tasksDashboard.completedShare}%` }"
                />
                <span
                  class="tasks-dashboard__health-segment tasks-dashboard__health-segment--medium"
                  :style="{ width: `${tasksDashboard.assignedShare}%` }"
                />
                <span
                  class="tasks-dashboard__health-segment tasks-dashboard__health-segment--rich"
                  :style="{ width: `${tasksDashboard.openShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="tasks-toolbar">
          <div class="tasks-toolbar__block tasks-toolbar__block--view">
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="tasks-toolbar__toggle tasks-toolbar__view-toggle"
              :options="viewOptions"
            />
          </div>

          <div class="tasks-toolbar__block tasks-toolbar__block--kind">
            <q-btn-toggle
              v-model="taskKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="tasks-toolbar__toggle tasks-toolbar__kind-toggle"
              :options="taskKindOptions"
            />
          </div>

          <div class="tasks-toolbar__block tasks-toolbar__block--search">
            <q-icon name="tune" size="18px" class="tasks-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="tasks-toolbar__search"
              placeholder="Search tasks..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn dense flat round icon="download" color="grey-6" :disable="loading" @click="csvActionsRef?.pickFile?.()">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
            <q-btn dense flat round icon="upload" color="grey-6" :disable="loading || displayRows.length === 0" @click="csvActionsRef?.exportCsv?.()">
              <q-tooltip>Export CSV</q-tooltip>
            </q-btn>
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="tasks-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="tasks-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No tasks found.</div>
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="tasks-table"
            flat
            bordered
            row-key="id"
            v-model:selected="selectedRows"
            v-model:pagination="pagination"
            selection="multiple"
            :rows="displayRows"
            :columns="columns"
            :loading="loading"
            :rows-per-page-options="rowsPerPageOptions"
          >
            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="tasks-table__actions">
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="grey-8"
                    :disable="loading"
                    @click="confirmDelete(props.row)"
                  />
                </div>
              </q-td>
            </template>
          </q-table>

          <div v-else class="row q-col-gutter-md tasks-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat bordered class="task-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start justify-between q-col-gutter-sm">
                    <div class="col">
                      <div class="task-card__eyebrow">Task</div>
                      <div class="task-card__title">{{ row.Task_Name || 'Untitled task' }}</div>
                      <div v-if="row.Task_Description" class="task-card__summary">
                        {{ row.Task_Description }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-checkbox
                        :model-value="isSelected(row)"
                        :disable="loading"
                        color="dark"
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
                    color="grey-8"
                    :disable="loading"
                    @click="confirmDelete(row)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[36, 18]">
        <q-btn
          color="black"
          text-color="white"
          unelevated
          :disable="loading"
          label="Delete All"
          @click="confirmDeleteSelected"
        />
      </q-page-sticky>
    </div>

    <div style="display: none">
      <TableCsvActions
        ref="csvActionsRef"
        filename-base="tasks"
        :headers="csvHeaders"
        :rows="displayRows"
        :on-import-rows="importRows"
      />
    </div>

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

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.tasks?.list &&
    !!bridge.value?.tasks?.upsertMany &&
    !!bridge.value?.tasks?.delete,
)

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const viewMode = ref('card')
const taskKindFilter = ref('all')
const statusFilter = ref('')
const priorityFilter = ref('')
const ownerFilter = ref('')
const projectFilter = ref('')
const searchQuery = ref('')
const selectedCount = computed(() => selectedRows.value.length)
const csvActionsRef = ref(null)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const rowsPerPageOptions = [10, 15, 25, 50]

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
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const taskKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Done', value: 'done' },
]

function normalizeTaskValue(value) {
  return String(value || '').trim()
}

function isCompletedTask(row = {}) {
  return /done|complete|completed|closed/i.test(normalizeTaskValue(row?.Status))
}

const tasksDashboard = computed(() => {
  const total = rows.value.length
  const completedCount = rows.value.filter((row) => isCompletedTask(row)).length
  const openCount = total - completedCount
  const assignedCount = rows.value.filter((row) => normalizeTaskValue(row?.contact_name)).length
  const safeTotal = total || 1
  return {
    total,
    completedCount,
    openCount,
    assignedCount,
    openRate: Math.round((openCount / safeTotal) * 100),
    openShare: total ? (openCount / total) * 100 : 0,
    completedShare: total ? (completedCount / total) * 100 : 0,
    assignedShare: total ? (assignedCount / total) * 100 : 0,
  }
})

const tasksHeroText = computed(() => {
  const { total, openCount, completedCount, assignedCount } = tasksDashboard.value
  if (!total) {
    return 'Start tracking tasks to keep diligence, follow-ups, and operations moving.'
  }
  return `${total} tasks in motion, ${openCount} still active, ${completedCount} already closed, and ${assignedCount} with a named owner.`
})

const tasksDashboardStats = computed(() => [
  {
    label: 'Total tasks',
    value: tasksDashboard.value.total,
    caption: 'Items tracked in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Open',
    value: tasksDashboard.value.openCount,
    caption: 'Still need attention',
    tone: 'rich',
  },
  {
    label: 'Assigned',
    value: tasksDashboard.value.assignedCount,
    caption: 'Include an owner',
    tone: 'rich',
  },
  {
    label: 'Done',
    value: tasksDashboard.value.completedCount,
    caption: 'Already completed',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const query = normalizeTaskValue(searchQuery.value).toLowerCase()
  let items = [...rows.value]

  if (taskKindFilter.value === 'open') {
    items = items.filter((row) => !isCompletedTask(row))
  } else if (taskKindFilter.value === 'done') {
    items = items.filter((row) => isCompletedTask(row))
  }

  if (statusFilter.value) {
    items = items.filter((row) => normalizeTaskValue(row?.Status) === statusFilter.value)
  }
  if (priorityFilter.value) {
    items = items.filter((row) => normalizeTaskValue(row?.Priority) === priorityFilter.value)
  }
  if (ownerFilter.value) {
    items = items.filter((row) => normalizeTaskValue(row?.contact_name) === ownerFilter.value)
  }
  if (projectFilter.value) {
    items = items.filter(
      (row) =>
        normalizeTaskValue(row?.project_name || row?.Project_Name || row?.current_project_name) ===
        projectFilter.value,
    )
  }

  if (query) {
    items = items.filter((row) =>
      [
        row?.Task_Name,
        row?.Task_Description,
        row?.Status,
        row?.Priority,
        row?.Due_Date,
        row?.contact_name,
        row?.company_name,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

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
  const activeIds = new Set(displayRows.value.map((row) => row.id))
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

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.tasks-shell {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-32);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.tasks-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-24);
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 18%, rgba(38, 71, 255, 0.14), transparent 24%),
    radial-gradient(circle at 12% 84%, rgba(235, 255, 90, 0.14), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f5f2ea 100%);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-2xl);
}

.tasks-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent 38%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.34) 100%);
  pointer-events: none;
}

.tasks-shell__copy,
.tasks-dashboard {
  position: relative;
  z-index: 1;
}

.tasks-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: space-between;
  min-width: 0;
}

.tasks-shell__eyebrow,
.tasks-dashboard__stat-label,
.tasks-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.12em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.tasks-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.tasks-shell__hero-text {
  margin: auto 0 0;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.tasks-shell__hero-text {
  display: flex;
  align-items: flex-end;
}

.tasks-dashboard__stat-caption,
.tasks-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.tasks-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.tasks-shell__meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--ds-space-12);
  color: var(--ds-color-text-subtle);
  background: var(--ds-color-surface-overlay-72);
  border: 1px solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
}

.tasks-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.tasks-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.tasks-dashboard__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-6);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-84);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-card-soft);
}

.tasks-dashboard__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.tasks-dashboard__stat--rich {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.tasks-dashboard__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.tasks-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.tasks-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.tasks-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.tasks-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.tasks-dashboard__health-segment {
  display: block;
  height: 100%;
}

.tasks-dashboard__health-segment--sparse {
  background: #ff5521;
}

.tasks-dashboard__health-segment--medium {
  background: #ebff5a;
}

.tasks-dashboard__health-segment--rich {
  background: #2647ff;
}

.tasks-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.tasks-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.tasks-toolbar__block--filters {
  flex-wrap: nowrap;
}

.tasks-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.tasks-toolbar__block--search {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.tasks-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.tasks-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.tasks-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.tasks-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.tasks-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.tasks-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.tasks-toolbar__search :deep(.q-field__control),
.tasks-toolbar__search :deep(.q-field__native),
.tasks-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.tasks-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.tasks-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.tasks-toolbar__toggle {
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  background: var(--ds-control-surface);
  color: var(--ds-control-text);
  border-color: var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.tasks-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tasks-empty-state {
  padding: 24px;
}

.tasks-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.tasks-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.tasks-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.tasks-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
}

.tasks-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.tasks-cards-grid {
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

.task-card__eyebrow {
  color: #737373;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
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

@media (max-width: 1200px) {
  .tasks-shell {
    padding: 20px;
    gap: 20px;
  }

  .tasks-shell__hero {
    grid-template-columns: 1fr;
  }

  .tasks-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .tasks-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .tasks-toolbar__filter-control,
  .tasks-toolbar__search,
  .tasks-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .tasks-shell__hero {
    padding: 18px;
    border-radius: 20px;
  }

  .tasks-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
