<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Contacts requires Electron. Run <code>quasar dev -m electron</code> or
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
          <div class="text-h6">Contacts</div>
          <div class="text-caption text-grey-7">All contacts.</div>
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="contacts"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateContact"
            create-label="Create contact"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadContacts" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No contacts created yet.</div>
          <q-btn color="primary" outline label="Create contact" @click="contactDialogOpen = true" />
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
      />
    </div>
  </q-page>

  <ContactCreateDialog v-model="contactDialogOpen" @created="onContactCreated" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ContactCreateDialog from 'components/ContactCreateDialog.vue'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.contacts?.list &&
    !!bridge.value?.contacts?.upsertMany &&
    !!bridge.value?.contacts?.create,
)

const rows = ref([])
const loading = ref(false)
const error = ref('')
const contactDialogOpen = ref(false)

function openCreateContact() {
  contactDialogOpen.value = true
}

const columns = [
  { name: 'Name', label: 'Name', field: 'Name', align: 'left', sortable: true },
  { name: 'Email', label: 'Email', field: 'Email', align: 'left', sortable: true },
  { name: 'Phone', label: 'Phone', field: 'Phone', align: 'left', sortable: true },
  { name: 'Role', label: 'Role', field: 'Role', align: 'left', sortable: true },
  { name: 'Stakeholder_type', label: 'Stakeholder', field: 'Stakeholder_type', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
]

const csvHeaders = ['id', 'Name', 'Email', 'Phone', 'LinkedIn', 'Role', 'Stakeholder_type']

async function loadContacts() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.contacts.list()
    rows.value = result?.contacts || []
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.contacts.upsertMany(importedRows)
  await loadContacts()
  return result
}

async function onContactCreated() {
  await loadContacts()
}

onMounted(() => {
  if (!hasBridge.value) return
  loadContacts()
})
</script>
