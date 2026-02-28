<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Notes</div>
        <div class="text-caption text-grey-7">All notes.</div>
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
          <q-btn dense flat round icon="delete" color="negative" :disable="loading" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

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
const loading = ref(false)
const error = ref('')
const dialogOpen = ref(false)

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'content', label: 'Content', field: 'content', align: 'left' },
  {
    name: 'linked_entity',
    label: 'Linked To',
    field: (row) => row.opportunity_name || row.contact_name || row.pipeline_name || row.company_name || '',
    align: 'left',
    sortable: true,
  },
  { name: 'reference_type', label: 'Type', field: 'reference_type', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'title',
  'content',
  'opportunity_id',
  'contact_id',
  'pipeline_id',
  'company_id',
  'reference_type',
  'reference_id',
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
  } catch (e) {
    error.value = e?.message || String(e)
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

async function confirmDelete(row) {
  if (!bridge.value?.notes?.delete) return
  $q
    .dialog({ title: 'Delete note?', message: 'This will permanently delete this note.', cancel: true, persistent: true })
    .onOk(async () => {
      loading.value = true
      try {
        await bridge.value.notes.delete(row.id)
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
