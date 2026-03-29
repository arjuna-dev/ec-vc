<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Notes requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="notes-page">
      <header class="notes-page__heading">
        <h1 class="notes-page__title">Notes</h1>
      </header>

      <section class="notes-shell">
        <div class="notes-shell__hero">
          <div class="notes-shell__copy">
            <div class="notes-shell__eyebrow">Dashboard</div>
            <h2 class="notes-shell__hero-title">Capture what matters and find it quickly.</h2>
            <p class="notes-shell__hero-text">{{ notesHeroText }}</p>

          </div>

          <div class="notes-dashboard">
            <div class="notes-dashboard__stats">
              <article
                v-for="stat in notesDashboardStats"
                :key="stat.label"
                class="notes-dashboard__stat"
                :class="`notes-dashboard__stat--${stat.tone}`"
              >
                <div class="notes-dashboard__stat-label">{{ stat.label }}</div>
                <div class="notes-dashboard__stat-value">{{ stat.value }}</div>
                <div class="notes-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="notes-dashboard__health">
              <div class="notes-dashboard__health-copy">
                <div class="notes-dashboard__health-label">Coverage</div>
                <div class="notes-dashboard__health-text">
                  {{ notesDashboard.authoredCount }} authored, {{ notesDashboard.namedCount }} named,
                  {{ notesDashboard.untitledCount }} still untitled
                </div>
              </div>

              <div class="notes-dashboard__health-bar" aria-hidden="true">
                <span
                  class="notes-dashboard__health-segment notes-dashboard__health-segment--sparse"
                  :style="{ width: `${notesDashboard.untitledShare}%` }"
                />
                <span
                  class="notes-dashboard__health-segment notes-dashboard__health-segment--medium"
                  :style="{ width: `${notesDashboard.authoredShare}%` }"
                />
                <span
                  class="notes-dashboard__health-segment notes-dashboard__health-segment--rich"
                  :style="{ width: `${notesDashboard.namedShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="notes-toolbar">
          <div class="notes-toolbar__block notes-toolbar__block--view">
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="notes-toolbar__toggle notes-toolbar__view-toggle"
              :options="viewOptions"
            />
          </div>

          <div class="notes-toolbar__block notes-toolbar__block--kind">
            <q-btn-toggle
              v-model="noteKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="notes-toolbar__toggle notes-toolbar__kind-toggle"
              :options="noteKindOptions"
            />
          </div>

          <div class="notes-toolbar__block notes-toolbar__block--search">
            <q-icon name="tune" size="18px" class="notes-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="notes-toolbar__search"
              placeholder="Search notes..."
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

        <div class="notes-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="notes-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No notes found.</div>
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="notes-table"
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
                <div class="notes-table__actions">
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

          <div v-else class="row q-col-gutter-md notes-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat bordered class="note-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start justify-between q-col-gutter-sm">
                    <div class="col">
                      <div class="note-card__eyebrow">Note</div>
                      <div class="note-card__title">{{ row.Note_Name || 'Untitled note' }}</div>
                      <div v-if="row.created_at" class="note-card__meta">{{ row.created_at }}</div>
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
                  <div v-if="row.Note_Content" class="note-card__content">
                    {{ row.Note_Content }}
                  </div>
                  <div v-if="row.created_by_name" class="note-card__field">
                    <q-icon name="person" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.created_by_name }}</span>
                  </div>
                  <div v-if="row.created_by_email" class="note-card__field">
                    <q-icon name="mail" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.created_by_email }}</span>
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
        filename-base="notes"
        :headers="csvHeaders"
        :rows="displayRows"
        :on-import-rows="importRows"
      />
    </div>

    <NoteCreateDialog v-model="dialogOpen" @created="onCreated" />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'
import NoteCreateDialog from 'components/NoteCreateDialog.vue'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.notes?.list &&
    !!bridge.value?.notes?.upsertMany &&
    !!bridge.value?.notes?.delete,
)

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const viewMode = ref('card')
const noteKindFilter = ref('all')
const creatorFilter = ref('')
const searchQuery = ref('')
const selectedCount = computed(() => selectedRows.value.length)
const csvActionsRef = ref(null)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const rowsPerPageOptions = [10, 15, 25, 50]

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const NOTES_BREADCRUMB_ACTION_OWNER = 'notes-page'

const columns = [
  { name: 'Note_Name', label: 'Note', field: 'Note_Name', align: 'left', sortable: true },
  { name: 'Note_Content', label: 'Content', field: 'Note_Content', align: 'left' },
  { name: 'created_by_name', label: 'Creator', field: 'created_by_name', align: 'left', sortable: true },
  { name: 'created_by_email', label: 'Email', field: 'created_by_email', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['id', 'Note_Name', 'Note_Content', 'created_by', 'created_by_name', 'created_by_email', 'created_at']

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const noteKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Named', value: 'named' },
  { label: 'Untitled', value: 'untitled' },
]

function normalizeNoteValue(value) {
  return String(value || '').trim()
}

const notesDashboard = computed(() => {
  const total = rows.value.length
  const namedCount = rows.value.filter((row) => normalizeNoteValue(row?.Note_Name)).length
  const authoredCount = rows.value.filter((row) => normalizeNoteValue(row?.created_by_name)).length
  const untitledCount = total - namedCount
  const safeTotal = total || 1
  return {
    total,
    namedCount,
    authoredCount,
    untitledCount,
    namedRate: Math.round((namedCount / safeTotal) * 100),
    namedShare: total ? (namedCount / total) * 100 : 0,
    authoredShare: total ? (authoredCount / total) * 100 : 0,
    untitledShare: total ? (untitledCount / total) * 100 : 0,
  }
})

const notesHeroText = computed(() => {
  const { total, namedCount, authoredCount, untitledCount } = notesDashboard.value
  if (!total) {
    return 'Start writing notes to capture meetings, reminders, and research in one place.'
  }
  return `${total} notes tracked, ${namedCount} already titled, ${authoredCount} with creator context, and ${untitledCount} still need cleanup.`
})

const notesDashboardStats = computed(() => [
  {
    label: 'Total notes',
    value: notesDashboard.value.total,
    caption: 'Entries captured in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Named',
    value: notesDashboard.value.namedCount,
    caption: 'Already titled for faster review',
    tone: 'rich',
  },
  {
    label: 'Authored',
    value: notesDashboard.value.authoredCount,
    caption: 'Include a creator name',
    tone: 'rich',
  },
  {
    label: 'Untitled',
    value: notesDashboard.value.untitledCount,
    caption: 'Still need a better label',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const query = normalizeNoteValue(searchQuery.value).toLowerCase()
  let items = [...rows.value]

  if (noteKindFilter.value === 'named') {
    items = items.filter((row) => normalizeNoteValue(row?.Note_Name))
  } else if (noteKindFilter.value === 'untitled') {
    items = items.filter((row) => !normalizeNoteValue(row?.Note_Name))
  }

  if (creatorFilter.value) {
    items = items.filter((row) => normalizeNoteValue(row?.created_by_name) === creatorFilter.value)
  }

  if (query) {
    items = items.filter((row) =>
      [
        row?.Note_Name,
        row?.Note_Content,
        row?.created_by_name,
        row?.created_by_email,
        row?.created_at,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

function openCreateNote() {
  dialogOpen.value = true
}

function onOpenNoteDialog() {
  globalThis.__ecvcOpenNoteDialog = false
  openCreateNote()
}

function openCreateFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateNote()
  globalThis.__ecvcOpenNoteDialog = false
  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedOpen() {
  if (globalThis.__ecvcOpenNoteDialog !== true) return false
  globalThis.__ecvcOpenNoteDialog = false
  openCreateNote()
  return true
}

async function loadNotes() {
  if (!bridge.value?.notes?.list) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.notes.list()
    rows.value = result?.notes || []
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
  const result = await bridge.value.notes.upsertMany(importedRows)
  await loadNotes()
  return result
}

async function onCreated() {
  await loadNotes()
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

async function deleteNote(row) {
  await bridge.value.notes.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.notes?.delete) return
  $q.dialog({
    title: 'Delete note?',
    message: 'This will permanently delete this note.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteNote(row)
      await loadNotes()
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.notes?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected notes?',
    message: `This will permanently delete ${selectedCount.value} selected note${selectedCount.value === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteNote(row)
      }
      selectedRows.value = []
      await loadNotes()
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  setBreadcrumbActions(NOTES_BREADCRUMB_ACTION_OWNER, [
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
  window.addEventListener('ecvc:open-note-dialog', onOpenNoteDialog)
  await loadNotes()
  consumeQueuedOpen()
  openCreateFromQuery()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(NOTES_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('ecvc:open-note-dialog', onOpenNoteDialog)
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
.notes-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.notes-page__heading {
  display: flex;
  align-items: center;
  gap: var(--ds-space-12);
}

.notes-page__title {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: var(--ds-font-size-4xl);
  font-weight: var(--ds-font-weight-black);
  line-height: var(--ds-line-height-title);
}

.notes-shell {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-32);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.notes-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-24);
  overflow: hidden;
  background:
    radial-gradient(circle at 80% 18%, rgba(251, 191, 36, 0.18), transparent 24%),
    radial-gradient(circle at 12% 82%, rgba(38, 71, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #fdfcf8 0%, #f6f3eb 100%);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-2xl);
}

.notes-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent 38%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.34) 100%);
  pointer-events: none;
}

.notes-shell__copy,
.notes-dashboard {
  position: relative;
  z-index: 1;
}

.notes-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: space-between;
  min-width: 0;
}

.notes-shell__eyebrow,
.notes-dashboard__stat-label,
.notes-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.12em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.notes-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.notes-shell__hero-text {
  margin: auto 0 0;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.notes-shell__hero-text {
  display: flex;
  align-items: flex-end;
}

.notes-dashboard__stat-caption,
.notes-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.notes-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.notes-shell__meta-pill {
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

.notes-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.notes-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.notes-dashboard__stat {
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

.notes-dashboard__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.notes-dashboard__stat--rich {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.notes-dashboard__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.notes-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.notes-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.notes-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.notes-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.notes-dashboard__health-segment {
  display: block;
  height: 100%;
}

.notes-dashboard__health-segment--sparse {
  background: #ff5521;
}

.notes-dashboard__health-segment--medium {
  background: #ebff5a;
}

.notes-dashboard__health-segment--rich {
  background: #2647ff;
}

.notes-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.notes-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.notes-toolbar__block--filters {
  flex-wrap: nowrap;
}

.notes-toolbar__block--search {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.notes-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.notes-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.notes-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.notes-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.notes-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.notes-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.notes-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.notes-toolbar__search :deep(.q-field__control),
.notes-toolbar__search :deep(.q-field__native),
.notes-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.notes-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.notes-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.notes-toolbar__toggle {
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

.notes-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notes-empty-state {
  padding: 24px;
}

.notes-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.notes-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.notes-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.notes-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
}

.notes-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.notes-cards-grid {
  align-items: stretch;
}

.note-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 18px;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.note-card__eyebrow {
  color: #737373;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.note-card__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.note-card__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
}

.note-card__content {
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}

.note-card__field {
  display: flex;
  align-items: center;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .notes-shell {
    padding: 20px;
    gap: 20px;
  }

  .notes-shell__hero {
    grid-template-columns: 1fr;
  }

  .notes-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .notes-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .notes-toolbar__filter-control,
  .notes-toolbar__search,
  .notes-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .notes-shell__hero {
    padding: 18px;
    border-radius: 20px;
  }

  .notes-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
