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
        <div
          class="tasks-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
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
          <div class="tasks-toolbar__block tasks-toolbar__block--primary">
            <q-checkbox
              :model-value="allVisibleTasksSelected"
              :indeterminate="someVisibleTasksSelected && !allVisibleTasksSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="tasks-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleTasks"
            />
            <q-btn
              no-caps
              unelevated
              class="tasks-toolbar__add-button"
              :disable="loading"
              @click="openCreateTask"
            >
              <span class="tasks-toolbar__add-button-inner">
                <span class="tasks-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="tasks-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn dense flat round icon="download" color="grey-6" class="tasks-toolbar__icon-button" :disable="loading" @click="csvActionsRef?.pickFile?.()">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="tasks-toolbar__block tasks-toolbar__block--actions">
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
                    icon="visibility"
                    color="grey-8"
                    :disable="loading"
                    @click="openDatabook(props.row)"
                  />
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
              <q-card
                flat
                bordered
                class="task-card full-height"
                :style="getTaskCardStyle()"
                @pointerenter="onTaskCardPointerEnter"
                @pointermove="onTaskCardPointerMove"
                @pointerleave="onTaskCardPointerLeave"
              >
                <q-card-section class="task-card__control-row">
                  <q-checkbox
                    :model-value="isSelected(row)"
                    :disable="loading"
                    color="dark"
                    class="task-card__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="task-card__control-eye"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />
                </q-card-section>
                <q-card-section class="task-card__hero">
                  <div class="task-card__hero-main">
                    <figure class="task-card__portrait">
                      <div class="task-card__portrait-shell" aria-hidden="true">
                        <div
                          class="task-card__portrait-badge"
                          :style="{ backgroundColor: getTaskAvatarColor(row.Task_Name || 'Task') }"
                        >
                          {{ getTaskAvatarInitial(row.Task_Name || 'Task') }}
                        </div>
                      </div>
                    </figure>

                    <div class="task-card__hero-side">
                      <div class="task-card__hero-copy">
                        <div class="task-card__title">{{ row.Task_Name || 'Untitled task' }}</div>

                        <div class="task-card__bottom-stack">
                          <div v-if="getTaskMetadataRows(row).length" class="task-card__detail-stack">
                            <div
                              v-for="detail in getTaskMetadataRows(row)"
                              :key="detail.label"
                              class="task-card__detail-row"
                            >
                              <button type="button" class="task-card__inline-chip">
                                <q-icon :name="detail.icon" size="14px" />
                                <span>{{ detail.value }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="task-card__summary">
                  <div class="task-card__summary-head">
                    <q-btn-toggle
                      :model-value="getTaskCardPanel(row)"
                      dense
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="task-card__summary-toggle"
                      :options="getTaskRelationshipOptions(row)"
                      @update:model-value="setTaskCardPanel(row, $event)"
                    />
                    <q-btn-toggle
                      :model-value="getTaskCardContentView(row)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="task-card__summary-view-toggle"
                      :options="taskCardContentViewOptions"
                      @update:model-value="setTaskCardContentView(row, $event)"
                    />
                  </div>

                  <div class="task-card__summary-panel">
                    <div class="task-card__summary-body">
                      <div class="task-card__summary-body-content">
                        <div
                          v-if="getTaskActiveRelationshipItems(row).length"
                          :class="[
                            'task-card__notes-list',
                            { 'task-card__notes-list--rows': getTaskCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="item in getTaskActiveRelationshipItems(row)"
                            :key="item"
                            class="task-card__note-pill"
                          >
                            {{ item }}
                          </div>
                        </div>

                        <div v-else class="task-card__summary-empty">
                          No linked KDB relationships yet.
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <SelectionActionBar
        :count="selectedCount"
        :loading="loading"
        @share="shareSelected"
        @edit="editSelected"
        @delete="confirmDeleteSelected"
      />
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
import SelectionActionBar from 'components/SelectionActionBar.vue'
import TableCsvActions from 'components/TableCsvActions.vue'
import TaskCreateDialog from 'components/TaskCreateDialog.vue'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { copySelectionSummary } from 'src/utils/selectionShare'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'

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

function onHeroDashboardPointerEnter(event) {
  updateHeroDashboardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}

function onHeroDashboardPointerMove(event) {
  updateHeroDashboardGradientPosition(event)
}

function onHeroDashboardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--hero-dashboard-blob-opacity', '0')
}

function updateHeroDashboardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}

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
const taskCardContentViews = ref({})
const taskCardPanels = ref({})

const taskCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

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

const allVisibleTasksSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((row) => isSelected(row)),
)

const someVisibleTasksSelected = computed(
  () => displayRows.value.some((row) => isSelected(row)) && !allVisibleTasksSelected.value,
)

function toggleSelectAllVisibleTasks(shouldSelect) {
  if (!shouldSelect) {
    const visibleIds = new Set(displayRows.value.map((row) => String(row?.id || '').trim()).filter(Boolean))
    selectedRows.value = selectedRows.value.filter(
      (row) => !visibleIds.has(String(row?.id || '').trim()),
    )
    return
  }

  const selectedIds = new Set(
    selectedRows.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  const additions = displayRows.value.filter((row) => {
    const rowId = String(row?.id || '').trim()
    return rowId && !selectedIds.has(rowId)
  })
  if (additions.length) selectedRows.value = [...selectedRows.value, ...additions]
}

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

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  router.push({
    name: 'databook-view',
    params: { tableName: 'Tasks', recordId },
    query: { returnTo: route.fullPath },
  })
}

function getTaskAvatarColor() {
  return '#111111'
}

function getTaskAvatarInitial(label) {
  const text = String(label || 'Task').trim()
  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'TA'
  )
}

function getTaskCardStyle() {
  return {
    '--task-card-blob-x': '50%',
    '--task-card-blob-y': '30%',
    '--task-card-blob-size': '60%',
    '--task-card-blob-opacity': '0',
    '--task-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--task-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--task-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onTaskCardPointerEnter(event) {
  updateTaskCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--task-card-blob-opacity', '1')
}

function onTaskCardPointerMove(event) {
  updateTaskCardGradientPosition(event)
}

function onTaskCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--task-card-blob-opacity', '0')
}

function updateTaskCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  element.style.setProperty('--task-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--task-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getTaskCardContentView(row) {
  const rowId = String(row?.id || '').trim()
  return taskCardContentViews.value[rowId] || 'card'
}

function setTaskCardContentView(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  taskCardContentViews.value = { ...taskCardContentViews.value, [rowId]: value || 'card' }
}

function getTaskCardPanel(row) {
  const rowId = String(row?.id || '').trim()
  return resolveCardRelationshipPanel(taskCardPanels.value[rowId], getTaskRelationshipItems(row))
}

function setTaskCardPanel(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  taskCardPanels.value = { ...taskCardPanels.value, [rowId]: value || 'notes' }
}

function getTaskRelationshipItems(row) {
  return buildCardRelationshipItems(row, ['Task'], {
    notes: getTaskLinkedNotes,
    artifacts: getTaskLinkedArtifacts,
  })
}

function getTaskRelationshipOptions(row) {
  return buildCardRelationshipOptions(getTaskRelationshipItems(row))
}

function getTaskActiveRelationshipItems(row) {
  return getTaskRelationshipItems(row)[getTaskCardPanel(row)] || []
}

function getTaskMetadataRows(row) {
  return [
    normalizeTaskValue(row?.Task_Description)
      ? { label: 'Summary', value: normalizeTaskValue(row?.Task_Description), icon: 'notes' }
      : null,
    normalizeTaskValue(row?.company_name)
      ? { label: 'Company', value: normalizeTaskValue(row?.company_name), icon: 'apartment' }
      : null,
    normalizeTaskValue(row?.contact_name)
      ? { label: 'Owner', value: normalizeTaskValue(row?.contact_name), icon: 'person' }
      : null,
    normalizeTaskValue(row?.Due_Date)
      ? { label: 'Due date', value: normalizeTaskValue(row?.Due_Date), icon: 'event' }
      : null,
  ].filter(Boolean)
}

function getTaskLinkedNotes(row) {
  return [
    ...String(row?.Task_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getTaskLinkedArtifacts(row) {
  return [
    ...String(row?.Task_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
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

function editSelected() {
  const row = selectedRows.value[0]
  if (!row) return
  openDatabook(row)
}

async function shareSelected() {
  if (selectedCount.value === 0) return
  try {
    await copySelectionSummary({
      rows: selectedRows.value,
      getLabel: (row) => normalizeTaskValue(row?.Task_Name) || `Task ${row?.id || ''}`.trim(),
      entityLabel: 'tasks',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected task${selectedCount.value === 1 ? '' : 's'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
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
  gap: 40px;
  padding-top: 16px;
}

.tasks-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  box-shadow: var(--ds-shadow-card-soft);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.tasks-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.tasks-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.tasks-shell__hero > * {
  position: relative;
  z-index: 1;
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
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.tasks-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.tasks-toolbar__block--primary {
  margin-right: 4px;
}

.tasks-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.tasks-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.tasks-toolbar__block--actions {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.tasks-toolbar__toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.tasks-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.tasks-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.tasks-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.tasks-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.tasks-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.tasks-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.tasks-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.tasks-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
}

.tasks-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.tasks-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.tasks-toolbar__add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
}

.tasks-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.tasks-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.tasks-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.tasks-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.tasks-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
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

.task-card__hero {
  padding: 0;
}

.task-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.task-card__control-row :deep(.q-checkbox__inner),
.task-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.task-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--task-card-blob-x) var(--task-card-blob-y),
    var(--task-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--task-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--task-card-blob-size) * 0.46),
    var(--task-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--task-card-blob-size) * 0.7),
    transparent var(--task-card-blob-size)
  );
  opacity: var(--task-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.task-card > * {
  position: relative;
  z-index: 1;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.task-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.task-card__portrait {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
}

.task-card__portrait-shell {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.task-card__portrait-badge {
  display: flex;
  width: clamp(124px, 48%, 152px);
  height: clamp(124px, 48%, 152px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 40px rgba(17, 17, 17, 0.16);
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.2vw, 3rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.task-card__hero-side {
  display: flex;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.task-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.task-card__bottom-stack,
.task-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card__detail-stack {
  gap: 4px;
}

.task-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.task-card__inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0 10px;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.task-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
}

.task-card__summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-card__summary-view-toggle,
.task-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.task-card__summary-view-toggle {
  margin-left: auto;
  margin-right: 14px;
}

.task-card__summary-view-toggle :deep(.q-btn-group),
.task-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.task-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.task-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.task-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.task-card__summary-toggle :deep(.q-btn) {
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.task-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.task-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.task-card__summary-toggle {
  margin-right: auto;
}

.task-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.task-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.task-card__summary-body-content,
.task-card__notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card__notes-list--rows {
  gap: 6px;
}

.task-card__note-pill {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  color: #111;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1.4;
}

.task-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.task-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  border-radius: 28px;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.task-card__control-eye {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.task-card__control-eye :deep(.q-icon) {
  font-size: 14px;
}

.task-card__select-box {
  margin-left: -3.5px;
  transform: scale(0.75);
  transform-origin: center;
}


.task-card__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
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
    gap: 32px;
  }

  .tasks-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .tasks-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
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
  .tasks-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
