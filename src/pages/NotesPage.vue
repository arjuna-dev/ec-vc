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
      <section class="notes-shell">
        <div
          class="notes-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
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
          <div class="notes-toolbar__block notes-toolbar__block--primary">
            <q-checkbox
              :model-value="allVisibleNotesSelected"
              :indeterminate="someVisibleNotesSelected && !allVisibleNotesSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="notes-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleNotes"
            />
            <q-btn
              no-caps
              unelevated
              class="notes-toolbar__add-button"
              :disable="loading"
              @click="openCreateNote"
            >
              <span class="notes-toolbar__add-button-inner">
                <span class="notes-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="notes-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn dense flat round icon="download" color="grey-6" class="notes-toolbar__icon-button" :disable="loading" @click="csvActionsRef?.pickFile?.()">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="notes-toolbar__block notes-toolbar__block--actions">
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

          <div v-else class="row q-col-gutter-md notes-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card
                flat
                bordered
                class="note-card full-height"
                :style="getNoteCardStyle()"
                @pointerenter="onNoteCardPointerEnter"
                @pointermove="onNoteCardPointerMove"
                @pointerleave="onNoteCardPointerLeave"
              >
                <q-card-section class="note-card__control-row">
                  <q-checkbox
                    :model-value="isSelected(row)"
                    :disable="loading"
                    color="dark"
                    class="note-card__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="note-card__control-eye"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />
                </q-card-section>
                <q-card-section class="note-card__hero">
                  <div class="note-card__hero-main">
                    <figure class="note-card__portrait">
                      <div class="note-card__portrait-shell" aria-hidden="true">
                        <div
                          class="note-card__portrait-badge"
                          :style="{ backgroundColor: getNoteAvatarColor(row.Note_Name || 'Note') }"
                        >
                          {{ getNoteAvatarInitial(row.Note_Name || 'Note') }}
                        </div>
                      </div>
                    </figure>

                    <div class="note-card__hero-side">
                      <div class="note-card__hero-copy">
                        <div class="note-card__title">{{ row.Note_Name || 'Untitled note' }}</div>

                        <div class="note-card__bottom-stack">
                          <div v-if="getNoteMetadataRows(row).length" class="note-card__detail-stack">
                            <div
                              v-for="detail in getNoteMetadataRows(row)"
                              :key="detail.label"
                              class="note-card__detail-row"
                            >
                              <button type="button" class="note-card__inline-chip">
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

                <q-card-section class="note-card__summary">
                  <div class="note-card__summary-head">
                    <q-btn-toggle
                      :model-value="getNoteCardPanel(row)"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="note-card__summary-toggle"
                      :options="noteCardPanelOptions"
                      @update:model-value="setNoteCardPanel(row, $event)"
                    />
                    <q-btn-toggle
                      :model-value="getNoteCardContentView(row)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="note-card__summary-view-toggle"
                      :options="noteCardContentViewOptions"
                      @update:model-value="setNoteCardContentView(row, $event)"
                    />
                  </div>

                  <div class="note-card__summary-panel">
                    <div class="note-card__summary-body">
                      <div class="note-card__summary-body-content">
                        <div
                          v-if="getNoteCardPanel(row) === 'notes' && getNoteLinkedNotes(row).length"
                          :class="[
                            'note-card__notes-list',
                            { 'note-card__notes-list--rows': getNoteCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="note in getNoteLinkedNotes(row)"
                            :key="note"
                            class="note-card__note-pill"
                          >
                            {{ note }}
                          </div>
                        </div>

                        <div
                          v-else-if="getNoteCardPanel(row) === 'artifacts' && getNoteLinkedArtifacts(row).length"
                          :class="[
                            'note-card__notes-list',
                            { 'note-card__notes-list--rows': getNoteCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="artifact in getNoteLinkedArtifacts(row)"
                            :key="artifact"
                            class="note-card__note-pill"
                          >
                            {{ artifact }}
                          </div>
                        </div>

                        <div v-else class="note-card__summary-empty">
                          {{ getNoteCardPanel(row) === 'notes' ? 'No linked notes yet.' : 'No linked artifacts yet.' }}
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
import SelectionActionBar from 'components/SelectionActionBar.vue'
import TableCsvActions from 'components/TableCsvActions.vue'
import NoteCreateDialog from 'components/NoteCreateDialog.vue'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { copySelectionSummary } from 'src/utils/selectionShare'

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
const noteKindFilter = ref('all')
const creatorFilter = ref('')
const searchQuery = ref('')
const selectedCount = computed(() => selectedRows.value.length)
const csvActionsRef = ref(null)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const rowsPerPageOptions = [10, 15, 25, 50]
const noteCardContentViews = ref({})
const noteCardPanels = ref({})

const noteCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const noteCardPanelOptions = [
  { label: 'Notes', value: 'notes' },
  { label: 'Artifacts', value: 'artifacts' },
]

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


function normalizeNoteValue(value) {
  return String(value || '').trim()
}

function parseNoteDateValue(value) {
  const raw = normalizeNoteValue(value)
  if (!raw) return 0
  const timestamp = Date.parse(raw)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function isRecentNote(row = {}) {
  const timestamp = parseNoteDateValue(row?.updated_at || row?.created_at)
  if (!timestamp) return false
  const ageMs = Date.now() - timestamp
  return ageMs <= 1000 * 60 * 60 * 24 * 14
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

  if (noteKindFilter.value === 'favorites') {
    items = items.filter((row) => normalizeNoteValue(row?.Note_Name))
  } else if (noteKindFilter.value === 'recent') {
    items = items.filter((row) => isRecentNote(row))
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

const allVisibleNotesSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((row) => isSelected(row)),
)

const someVisibleNotesSelected = computed(
  () => displayRows.value.some((row) => isSelected(row)) && !allVisibleNotesSelected.value,
)

function toggleSelectAllVisibleNotes(shouldSelect) {
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

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  router.push({
    name: 'databook-view',
    params: { tableName: 'Notes', recordId },
    query: { returnTo: route.fullPath },
  })
}

function getNoteAvatarColor() {
  return '#111111'
}

function getNoteAvatarInitial(label) {
  const text = String(label || 'Note').trim()
  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'NO'
  )
}

function getNoteCardStyle() {
  return {
    '--note-card-blob-x': '50%',
    '--note-card-blob-y': '30%',
    '--note-card-blob-size': '60%',
    '--note-card-blob-opacity': '0',
    '--note-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--note-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--note-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onNoteCardPointerEnter(event) {
  updateNoteCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--note-card-blob-opacity', '1')
}

function onNoteCardPointerMove(event) {
  updateNoteCardGradientPosition(event)
}

function onNoteCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--note-card-blob-opacity', '0')
}

function updateNoteCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  element.style.setProperty('--note-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--note-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getNoteCardContentView(row) {
  const rowId = String(row?.id || '').trim()
  return noteCardContentViews.value[rowId] || 'card'
}

function setNoteCardContentView(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  noteCardContentViews.value = { ...noteCardContentViews.value, [rowId]: value || 'card' }
}

function getNoteCardPanel(row) {
  const rowId = String(row?.id || '').trim()
  return noteCardPanels.value[rowId] || 'notes'
}

function setNoteCardPanel(row, value) {
  const rowId = String(row?.id || '').trim()
  if (!rowId) return
  noteCardPanels.value = { ...noteCardPanels.value, [rowId]: value || 'notes' }
}

function getNoteMetadataRows(row) {
  const preview = normalizeNoteValue(row?.Note_Content).slice(0, 80)
  return [
    preview ? { label: 'Preview', value: preview, icon: 'notes' } : null,
    normalizeNoteValue(row?.created_by_name)
      ? { label: 'Author', value: normalizeNoteValue(row?.created_by_name), icon: 'person' }
      : null,
    normalizeNoteValue(row?.created_by_email)
      ? { label: 'Email', value: normalizeNoteValue(row?.created_by_email), icon: 'mail' }
      : null,
    normalizeNoteValue(row?.created_at)
      ? { label: 'Created', value: normalizeNoteValue(row?.created_at), icon: 'schedule' }
      : null,
  ].filter(Boolean)
}

function getNoteLinkedNotes(row) {
  return [
    ...String(row?.Note_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getNoteLinkedArtifacts(row) {
  return [
    ...String(row?.Note_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
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
      getLabel: (row) => normalizeNoteValue(row?.Note_Name) || `Note ${row?.id || ''}`.trim(),
      entityLabel: 'notes',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected note${selectedCount.value === 1 ? '' : 's'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
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

.notes-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.notes-shell__hero {
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

.notes-shell__hero::before {
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

.notes-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.notes-shell__hero > * {
  position: relative;
  z-index: 1;
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
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.notes-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.notes-toolbar__block--primary {
  margin-right: 4px;
}

.notes-toolbar__block--actions {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.notes-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.notes-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.notes-toolbar__toggle {
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

.notes-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.notes-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.notes-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.notes-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.notes-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.notes-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.notes-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.notes-toolbar__add-button {
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

.notes-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.notes-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.notes-toolbar__add-button-plus {
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

.notes-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.notes-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.notes-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.notes-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.notes-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
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

.note-card__hero {
  padding: 0;
}

.note-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.note-card__control-row :deep(.q-checkbox__inner),
.note-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.note-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--note-card-blob-x) var(--note-card-blob-y),
    var(--note-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--note-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--note-card-blob-size) * 0.46),
    var(--note-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--note-card-blob-size) * 0.7),
    transparent var(--note-card-blob-size)
  );
  opacity: var(--note-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.note-card > * {
  position: relative;
  z-index: 1;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.note-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.note-card__portrait {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
}

.note-card__portrait-shell {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.note-card__portrait-badge {
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

.note-card__hero-side {
  display: flex;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.note-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.note-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.note-card__bottom-stack,
.note-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-card__detail-stack {
  gap: 4px;
}

.note-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.note-card__inline-chip {
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

.note-card__summary {
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

.note-card__summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-card__summary-view-toggle,
.note-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.note-card__summary-view-toggle {
  margin-left: auto;
}

.note-card__summary-view-toggle :deep(.q-btn-group),
.note-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.note-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.note-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.note-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.note-card__summary-toggle :deep(.q-btn) {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.note-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.note-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.note-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.note-card__summary-body-content,
.note-card__notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-card__notes-list--rows {
  gap: 6px;
}

.note-card__note-pill {
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

.note-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.note-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 18px;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.note-card__control-eye {
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

.note-card__control-eye :deep(.q-icon) {
  font-size: 14px;
}

.note-card__select-box {
  transform: scale(0.75);
  transform-origin: center;
}

.note-card__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
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
    gap: 32px;
  }

  .notes-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .notes-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
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
  .notes-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
