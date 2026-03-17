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

    <div v-else class="contacts-page">
      <header class="contacts-page__heading">
        <h1 class="contacts-page__title">Contacts</h1>
      </header>

      <section class="contacts-shell">
        <div class="contacts-shell__hero">
          <div class="contacts-shell__copy">
            <h2 class="contacts-shell__hero-title">Welcome back!</h2>
            <p class="contacts-shell__hero-text">Here's a list of all of your contacts.</p>
          </div>
          <q-avatar size="36px" class="contacts-shell__hero-avatar">
            <img :src="heroAvatarImage" alt="Contacts overview avatar" />
          </q-avatar>
        </div>

        <div class="contacts-toolbar">
          <div class="contacts-toolbar__left">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="contacts-toolbar__search"
              placeholder="Filter contacts..."
              :disable="loading"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="add_circle_outline"
              label="Import CSV"
              class="contacts-toolbar__button"
              :disable="loading"
              @click="pickImportFile"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="download"
              label="Export CSV"
              class="contacts-toolbar__button"
              :disable="loading || displayRows.length === 0"
              @click="exportContactsCsv"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="flag"
              label="Priority"
              class="contacts-toolbar__button"
              :class="{ 'contacts-toolbar__button--active': priorityMode }"
              :disable="loading"
              @click="togglePriorityMode"
            />
          </div>

          <div class="contacts-toolbar__right">
            <q-btn-dropdown
              dense
              outline
              no-caps
              icon="tune"
              dropdown-icon="keyboard_arrow_down"
              class="contacts-view-button"
              :disable="loading"
              label="View"
            >
              <q-list class="contacts-view-menu">
                <q-item
                  v-for="option in viewOptions"
                  :key="option.value"
                  clickable
                  v-close-popup
                  :active="viewMode === option.value"
                  active-class="contacts-view-menu__item--active"
                  @click="viewMode = option.value"
                >
                  <q-item-section avatar>
                    <q-icon :name="option.icon" color="black" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ option.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <B10Button
              variant="primary"
              size="small"
              icon-start="add"
              label="Add Contact"
              :disable="loading"
              @click="openCreateContact"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="contacts-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="contacts-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No contacts found.</div>
              <q-btn
                color="black"
                text-color="white"
                no-caps
                unelevated
                label="Create contact"
                @click="contactDialogOpen = true"
              />
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="contacts-table"
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
                <div class="contacts-table__actions">
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

          <div v-else class="row q-col-gutter-md contacts-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat bordered class="contact-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start no-wrap">
                    <div class="col-auto q-pr-md">
                      <q-avatar size="56px" class="contact-card__avatar">
                        <img :src="buildAvatarImage(row)" :alt="row.Name || 'Contact avatar'" />
                      </q-avatar>
                    </div>
                    <div class="col">
                      <div class="contact-card__eyebrow">Contact</div>
                      <div class="contact-card__title">
                        {{ row.Name || 'Unnamed contact' }}
                      </div>
                      <div v-if="row.Role" class="contact-card__role">{{ row.Role }}</div>
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
                  <div v-if="row.Email" class="contact-card__field">
                    <q-icon name="mail" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.Email }}</span>
                  </div>
                  <div v-if="row.Phone" class="contact-card__field">
                    <q-icon name="call" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.Phone }}</span>
                  </div>
                  <div v-if="row.LinkedIn" class="contact-card__field">
                    <q-icon name="link" size="16px" class="q-mr-sm text-grey-7" />
                    <span class="ellipsis">{{ row.LinkedIn }}</span>
                  </div>
                  <div class="row q-col-gutter-sm q-pt-xs">
                    <div v-if="row.Stakeholder_type" class="col-auto">
                      <q-badge outline color="grey-7" text-color="grey-8">
                        {{ row.Stakeholder_type }}
                      </q-badge>
                    </div>
                    <div v-if="row.created_at" class="col-auto">
                      <q-badge outline color="grey-6" text-color="grey-8">
                        {{ row.created_at }}
                      </q-badge>
                    </div>
                  </div>
                </q-card-section>

                <q-space />

                <q-card-actions align="between">
                  <q-btn
                    dense
                    flat
                    color="grey-9"
                    label="Databook"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />
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

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[18 * 2, 18]">
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
  </q-page>

  <input
    ref="fileInput"
    type="file"
    accept=".csv,text/csv"
    style="display: none"
    @change="onImportFileSelected"
  />

  <ContactCreateDialog v-model="contactDialogOpen" @created="onContactCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import ContactCreateDialog from 'components/ContactCreateDialog.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.contacts?.list &&
    !!bridge.value?.contacts?.upsertMany &&
    !!bridge.value?.contacts?.create &&
    !!bridge.value?.contacts?.delete,
)

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const contactDialogOpen = ref(false)
const viewMode = ref('table')
const searchQuery = ref('')
const priorityMode = ref(false)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const selectedCount = computed(() => selectedRows.value.length)
const rowsPerPageOptions = [10, 15, 25, 50]
const heroAvatarImage = computed(() => buildAvatarImage({ Name: 'EC VC' }))

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

function openCreateContact() {
  contactDialogOpen.value = true
}

function onOpenContactDialog() {
  globalThis.__ecvcOpenContactDialog = false
  openCreateContact()
}

function openCreateContactFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateContact()
  globalThis.__ecvcOpenContactDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedContactDialogOpen() {
  if (globalThis.__ecvcOpenContactDialog !== true) return false
  globalThis.__ecvcOpenContactDialog = false
  openCreateContact()
  return true
}

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  router.push({ name: 'databook-view', params: { tableName: 'Contacts', recordId } })
}

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...rows.value]

  if (query) {
    items = items.filter((row) =>
      [
        row?.Name,
        row?.Email,
        row?.Phone,
        row?.Role,
        row?.Stakeholder_type,
        row?.LinkedIn,
        row?.created_at,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  if (priorityMode.value) {
    items.sort((a, b) => {
      const priorityA = Number(a?.Closeness_Level || 0)
      const priorityB = Number(b?.Closeness_Level || 0)
      if (priorityA !== priorityB) return priorityB - priorityA
      return String(a?.Name || '').localeCompare(String(b?.Name || ''))
    })
  }

  return items
})

function buildAvatarImage(row) {
  const customImage = String(row?.Profile_Image || '').trim()
  if (customImage) return customImage

  const label = String(row?.Name || row?.Email || 'Contact').trim()
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'C'

  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  const bg = palette[Math.abs(hashString(label)) % palette.length]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <rect width="112" height="112" rx="24" fill="${bg}" />
      <text x="56" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">${escapeSvg(initials)}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function hashString(value) {
  let hash = 0
  for (const char of String(value)) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash |= 0
  }
  return hash
}

function escapeSvg(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const columns = [
  { name: 'Name', label: 'Name', field: 'Name', align: 'left', sortable: true },
  { name: 'Email', label: 'Email', field: 'Email', align: 'left', sortable: true },
  { name: 'Phone', label: 'Phone', field: 'Phone', align: 'left', sortable: true },
  { name: 'Role', label: 'Role', field: 'Role', align: 'left', sortable: true },
  {
    name: 'Stakeholder_type',
    label: 'Stakeholder',
    field: 'Stakeholder_type',
    align: 'left',
    sortable: true,
  },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['id', 'Name', 'Email', 'Phone', 'LinkedIn', 'Role', 'Stakeholder_type']
const viewOptions = [
  { label: 'Cards', value: 'card', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

function exportContactsCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('contacts.csv', csv, 'text/csv')
  if (ok !== true) $q.notify({ type: 'negative', message: 'Browser denied file download.' })
}

function pickImportFile() {
  fileInput.value?.click?.()
}

async function onImportFileSelected(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsed = csvToRows(text)
    const result = await importRows(parsed.rows)
    $q.notify({
      type: 'positive',
      message: `Imported CSV (${result?.inserted ?? 0} inserted, ${result?.updated ?? 0} updated, ${result?.skipped ?? 0} skipped).`,
    })
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.message || String(err) })
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function togglePriorityMode() {
  priorityMode.value = !priorityMode.value
}

async function loadContacts() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.contacts.list()
    rows.value = result?.contacts || []
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
  const result = await bridge.value.contacts.upsertMany(importedRows)
  await loadContacts()
  return result
}

async function onContactCreated() {
  await loadContacts()
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

  selectedRows.value = selectedRows.value.filter((selectedRow) => selectedRow.id !== rowId)
}

async function deleteContact(row) {
  await bridge.value.contacts.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.contacts?.delete) return
  const name = row?.Name ? ` (${row.Name})` : ''

  $q.dialog({
    title: 'Delete contact?',
    message: `This will permanently delete this contact${name}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteContact(row)
      await loadContacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.contacts?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected contacts?',
    message: `This will permanently delete ${selectedCount.value} selected contact${selectedCount.value === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteContact(row)
      }
      selectedRows.value = []
      await loadContacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  window.addEventListener('ecvc:open-contact-dialog', onOpenContactDialog)
  if (!hasBridge.value) return
  await loadContacts()
  consumeQueuedContactDialogOpen()
  openCreateContactFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-contact-dialog', onOpenContactDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateContactFromQuery()
  },
)

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.contacts-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contacts-page__heading {
  display: flex;
  align-items: center;
}

.contacts-page__title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-4xl---black);
  font-weight: var(--font-weight-black);
  letter-spacing: 0;
  line-height: 40px;
}

.contacts-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.contacts-shell__hero {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.contacts-shell__copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.contacts-shell__hero-title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-2xl---black);
  font-weight: var(--font-weight-black);
  line-height: 32px;
}

.contacts-shell__hero-text {
  margin: 0;
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-base---light);
  font-weight: var(--font-weight-light);
  line-height: 24px;
}

.contacts-shell__hero-avatar {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.contacts-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.contacts-toolbar__left,
.contacts-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contacts-toolbar__left {
  flex: 1 1 auto;
  min-width: 0;
}

.contacts-toolbar__search {
  width: 300px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.contacts-toolbar__search :deep(.q-field__control),
.contacts-toolbar__search :deep(.q-field__native),
.contacts-toolbar__search :deep(.q-field__input) {
  min-height: 32px;
  height: 32px;
}

.contacts-toolbar__search :deep(.q-field__control) {
  padding: 0 12px;
}

.contacts-toolbar__button,
.contacts-view-button {
  height: 32px;
  background: #fff;
  color: #0a0a0a;
  border-color: #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 16px;
}

.contacts-toolbar__button--active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.contacts-view-menu {
  min-width: 150px;
  background: #fff;
  color: #111;
}

.contacts-view-menu__item--active {
  background: #111;
  color: #fff;
}

.contacts-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contacts-empty-state {
  padding: 24px;
}

.contacts-table {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.contacts-table :deep(thead tr) {
  background: #f5f5f5;
}

.contacts-table :deep(th) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
  letter-spacing: 0;
}

.contacts-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.contacts-table :deep(td) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.contacts-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.contacts-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.contacts-cards-grid {
  align-items: stretch;
}

.contact-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 8px;
  border-color: #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.contact-card__eyebrow {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---light);
  font-weight: var(--font-weight-light);
  line-height: 16px;
  text-transform: uppercase;
}

.contact-card__title {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-base---black);
  font-weight: var(--font-weight-black);
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.contact-card__role {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.contact-card__avatar {
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.08);
}

.contact-card__field {
  display: flex;
  align-items: center;
  min-width: 0;
  color: #404040;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

@media (max-width: 900px) {
  .contacts-shell {
    padding: 20px;
    gap: 20px;
  }

  .contacts-toolbar,
  .contacts-toolbar__left,
  .contacts-toolbar__right {
    flex-direction: column;
    align-items: stretch;
  }

  .contacts-toolbar__search {
    width: 100%;
  }
}
</style>
