<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Notes</div>
        <div class="text-caption text-grey-7">All notes.</div>
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
        <TableCsvActions
          filename-base="notes"
          :headers="csvHeaders"
          :rows="rows"
          :on-import-rows="importRows"
          :on-create="openCreateNote"
          create-label="Add Note"
        />
      </div>
      <div class="col-auto">
        <q-btn dense flat icon="refresh" :loading="loading" @click="loadNotes" />
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

    <div v-else class="row q-col-gutter-md notes-grid">
      <div v-for="row in rows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="note-card full-height">
          <q-card-section class="q-pb-sm">
            <div class="row items-start justify-between q-col-gutter-sm">
              <div class="col">
                <div class="note-card__title">{{ row.Note_Name || 'Untitled note' }}</div>
                <div v-if="row.created_at" class="note-card__meta">{{ row.created_at }}</div>
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

    <NoteCreateDialog v-model="dialogOpen" @created="onCreated" />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'
import NoteCreateDialog from 'components/NoteCreateDialog.vue'

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)
const viewMode = ref('grid')
const selectedCount = computed(() => selectedRows.value.length)

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

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
  { label: 'Grid', value: 'grid', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

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
  window.addEventListener('ecvc:open-note-dialog', onOpenNoteDialog)
  await loadNotes()
  consumeQueuedOpen()
  openCreateFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-note-dialog', onOpenNoteDialog)
})

watch(
  () => route.query.create,
  () => openCreateFromQuery(),
)
</script>

<style scoped>
.notes-grid {
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
</style>
