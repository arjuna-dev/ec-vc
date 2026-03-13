<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Companies requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="companies-page">
      <header class="companies-page__heading">
        <h1 class="companies-page__title">Companies</h1>
      </header>

      <section class="companies-shell">
        <div class="companies-shell__hero">
          <div class="companies-shell__copy">
            <h2 class="companies-shell__hero-title">Welcome back!</h2>
            <p class="companies-shell__hero-text">Here's a list of all of your companies.</p>
          </div>
          <q-avatar size="36px" class="companies-shell__hero-avatar">
            <img :src="heroAvatarImage" alt="Companies overview avatar" />
          </q-avatar>
        </div>

        <div class="companies-toolbar">
          <div class="companies-toolbar__left">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="companies-toolbar__search"
              placeholder="Filter companies..."
              :disable="loading"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="add_circle_outline"
              label="Import CSV"
              class="companies-toolbar__button"
              :disable="loading"
              @click="pickImportFile"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="download"
              label="Export CSV"
              class="companies-toolbar__button"
              :disable="loading || displayRows.length === 0"
              @click="exportCompaniesCsv"
            />

            <q-btn
              dense
              outline
              no-caps
              icon="flag"
              label="Priority"
              class="companies-toolbar__button"
              :class="{ 'companies-toolbar__button--active': priorityMode }"
              :disable="loading"
              @click="togglePriorityMode"
            />
          </div>

          <div class="companies-toolbar__right">
            <q-btn-dropdown
              dense
              outline
              no-caps
              icon="tune"
              dropdown-icon="keyboard_arrow_down"
              class="companies-view-button"
              :disable="loading"
              label="View"
            >
              <q-list class="companies-view-menu">
                <q-item
                  v-for="option in viewOptions"
                  :key="option.value"
                  clickable
                  v-close-popup
                  :active="viewMode === option.value"
                  active-class="companies-view-menu__item--active"
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
              label="Add Company"
              :disable="loading"
              @click="openCreateCompany"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="companies-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="companies-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No companies found.</div>
              <q-btn
                color="black"
                text-color="white"
                no-caps
                unelevated
                label="Create company"
                @click="companyDialogOpen = true"
              />
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="companies-table"
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
                <div class="companies-table__actions">
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

          <div v-else class="row q-col-gutter-md companies-cards-grid">
            <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat bordered class="company-card full-height">
                <q-card-section class="q-pb-sm">
                  <div class="row items-start no-wrap">
                    <div class="col-auto q-pr-md">
                      <q-avatar size="56px" class="company-card__avatar">
                        <img :src="buildAvatarImage(row.Company_Name)" :alt="row.Company_Name || 'Company avatar'" />
                      </q-avatar>
                    </div>
                    <div class="col">
                      <div class="company-card__eyebrow">Company</div>
                      <div class="company-card__title">
                        {{ row.Company_Name || 'Unnamed company' }}
                      </div>
                      <div v-if="row.Company_Type" class="company-card__subtitle">
                        {{ row.Company_Type }}
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
                  <div v-if="row.Website" class="company-card__field">
                    <q-icon name="public" size="16px" class="q-mr-sm text-grey-7" />
                    <span class="ellipsis">{{ row.Website }}</span>
                  </div>
                  <div v-if="row.Status" class="company-card__field">
                    <q-icon name="schedule" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ row.Status }}</span>
                  </div>
                  <div v-if="displayAmount(row.Amount_Raised_AUMs)" class="company-card__field">
                    <q-icon name="payments" size="16px" class="q-mr-sm text-grey-7" />
                    <span>{{ displayAmount(row.Amount_Raised_AUMs) }}</span>
                  </div>
                  <div class="row q-col-gutter-sm q-pt-xs">
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

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exportFile, useQuasar } from 'quasar'
import CompanyCreateDialog from 'components/CompanyCreateDialog.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.companies?.list &&
    !!bridge.value?.companies?.upsertMany &&
    !!bridge.value?.companies?.create &&
    !!bridge.value?.companies?.delete,
)

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const companyDialogOpen = ref(false)
const searchQuery = ref('')
const priorityMode = ref(false)
const viewMode = ref('table')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const rowsPerPageOptions = [10, 15, 25, 50]
const selectedCount = computed(() => selectedRows.value.length)
const heroAvatarImage = computed(() => buildAvatarImage('CO'))

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

function openCreateCompany() {
  companyDialogOpen.value = true
}

function onOpenCompanyDialog() {
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
}

function openCreateCompanyFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateCompany()
  globalThis.__ecvcOpenCompanyDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedCompanyDialogOpen() {
  if (globalThis.__ecvcOpenCompanyDialog !== true) return false
  globalThis.__ecvcOpenCompanyDialog = false
  openCreateCompany()
  return true
}

function openDatabook(row) {
  const recordId = String(row?.id || '').trim()
  if (!recordId) return
  router.push({ name: 'databook-view', params: { tableName: 'Companies', recordId } })
}

const columns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'Website', label: 'Website', field: 'Website', align: 'left', sortable: true },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Company_Type', label: 'Type', field: 'Company_Type', align: 'left', sortable: true },
  {
    name: 'Amount_Raised_AUMs',
    label: 'Raised/AUM (USD)',
    field: 'Amount_Raised_AUMs',
    align: 'right',
    sortable: true,
    format: (v) => displayAmount(v),
  },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = ['id', 'Company_Name', 'Website', 'Status', 'Company_Type', 'Amount_Raised_AUMs']

const viewOptions = [
  { label: 'Cards', value: 'card', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...rows.value]

  if (query) {
    items = items.filter((row) =>
      [row?.Company_Name, row?.Website, row?.Status, row?.Company_Type, row?.created_at]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  if (priorityMode.value) {
    items.sort((a, b) => {
      const amountA = Number(a?.Amount_Raised_AUMs || 0)
      const amountB = Number(b?.Amount_Raised_AUMs || 0)
      if (amountA !== amountB) return amountB - amountA
      return String(a?.Company_Name || '').localeCompare(String(b?.Company_Name || ''))
    })
  }

  return items
})

function displayAmount(value) {
  return value === null || value === undefined || value === ''
    ? ''
    : Number(value).toLocaleString('en-US')
}

function buildAvatarImage(label) {
  const text = String(label || 'Company').trim()
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'CO'

  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  const bg = palette[Math.abs(hashString(text)) % palette.length]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <rect width="112" height="112" rx="24" fill="${bg}" />
      <text x="56" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeSvg(initials)}</text>
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

function exportCompaniesCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('companies.csv', csv, 'text/csv')
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

async function loadCompanies() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.companies.list()
    rows.value = result?.companies || []
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
  const result = await bridge.value.companies.upsertMany(importedRows)
  await loadCompanies()
  return result
}

async function onCompanyCreated() {
  await loadCompanies()
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

async function deleteCompany(row) {
  await bridge.value.companies.delete(row.id)
}

async function confirmDelete(row) {
  if (!bridge.value?.companies?.delete) return
  const company = row?.Company_Name ? ` (${row.Company_Name})` : ''

  $q.dialog({
    title: 'Delete company?',
    message: `This will permanently delete this company${company}. If it has related opportunities, the delete will be blocked.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteCompany(row)
      await loadCompanies()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.companies?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected companies?',
    message: `This will permanently delete ${selectedCount.value} selected compan${selectedCount.value === 1 ? 'y' : 'ies'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteCompany(row)
      }
      selectedRows.value = []
      await loadCompanies()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  window.addEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
  if (!hasBridge.value) return
  await loadCompanies()
  consumeQueuedCompanyDialogOpen()
  openCreateCompanyFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-company-dialog', onOpenCompanyDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateCompanyFromQuery()
  },
)

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.companies-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.companies-page__heading {
  display: flex;
  align-items: center;
}

.companies-page__title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-4xl---black);
  font-weight: var(--font-weight-black);
  line-height: 40px;
}

.companies-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.companies-shell__hero {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.companies-shell__copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
}

.companies-shell__hero-title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-2xl---black);
  font-weight: var(--font-weight-black);
  line-height: 32px;
}

.companies-shell__hero-text {
  margin: 0;
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-base---light);
  font-weight: var(--font-weight-light);
  line-height: 24px;
}

.companies-shell__hero-avatar {
  box-shadow: var(--box--shadow--shadow-xs);
}

.companies-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.companies-toolbar__left,
.companies-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.companies-toolbar__left {
  flex: 1 1 auto;
  min-width: 0;
}

.companies-toolbar__search {
  width: 300px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: var(--box--shadow--shadow-xs);
}

.companies-toolbar__search :deep(.q-field__control),
.companies-toolbar__search :deep(.q-field__native),
.companies-toolbar__search :deep(.q-field__input) {
  min-height: 32px;
  height: 32px;
}

.companies-toolbar__search :deep(.q-field__control) {
  padding: 0 12px;
}

.companies-toolbar__button,
.companies-view-button {
  height: 32px;
  background: #fff;
  color: #0a0a0a;
  border-color: #e5e5e5;
  border-radius: 8px;
  box-shadow: var(--box--shadow--shadow-xs);
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 16px;
}

.companies-toolbar__button--active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.companies-view-menu {
  min-width: 150px;
  background: #fff;
  color: #111;
}

.companies-view-menu__item--active {
  background: #111;
  color: #fff;
}

.companies-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.companies-empty-state {
  padding: 24px;
}

.companies-table {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.companies-table :deep(thead tr) {
  background: #f5f5f5;
}

.companies-table :deep(th) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.companies-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.companies-table :deep(td) {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.companies-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.companies-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.companies-cards-grid {
  align-items: stretch;
}

.company-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 8px;
  border-color: #e5e5e5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.company-card__eyebrow {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---light);
  font-weight: var(--font-weight-light);
  line-height: 16px;
  text-transform: uppercase;
}

.company-card__title {
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: var(--text-base---black);
  font-weight: var(--font-weight-black);
  line-height: 24px;
}

.company-card__subtitle {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.company-card__avatar {
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.08);
}

.company-card__field {
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
  .companies-shell {
    padding: 20px;
    gap: 20px;
  }

  .companies-toolbar,
  .companies-toolbar__left,
  .companies-toolbar__right {
    flex-direction: column;
    align-items: stretch;
  }

  .companies-toolbar__search {
    width: 100%;
  }
}
</style>
