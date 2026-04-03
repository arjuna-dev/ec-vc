<template>
  <FileRecordsShell
    entity-label="Company (2)"
    :is-electron-runtime="isElectronRuntime"
    :has-bridge="hasBridge"
    hero-title="Render companies through the shared file-page shell."
    :hero-text="heroText"
    :stats="dashboardStats"
    :loading="loading"
    :error="error"
    :display-rows="displayRows"
    :columns="columns"
    :rows-per-page-options="rowsPerPageOptions"
    :search-query="searchQuery"
    :view-mode="viewMode"
    :view-options="viewOptions"
    :selected-rows="selectedRows"
    :pagination="pagination"
    search-placeholder="Search companies..."
    empty-message="No companies found."
    empty-summary-message="No company summary yet."
    :get-row-title="getRowTitle"
    :get-row-subtitle="getRowSubtitle"
    :get-row-initials="getRowInitials"
    :get-row-avatar-color="getRowAvatarColor"
    :get-row-metadata="getRowMetadata"
    :get-row-summary="getRowSummary"
    @add="openCreateCompany"
    @import="pickImportFile"
    @open-record="openRecordView"
    @delete-row="confirmDelete"
    @share-selected="shareSelected"
    @edit-selected="editSelected"
    @delete-selected="confirmDeleteSelected"
    @update:search-query="searchQuery = $event"
    @update:view-mode="viewMode = $event"
    @update:selected-rows="selectedRows = $event"
    @update:pagination="pagination = $event"
  />

  <TableCsvActions
    ref="csvActionsRef"
    filename-base="companies-2"
    :headers="csvHeaders"
    :rows="displayRows"
    :on-import-rows="importRows"
    class="company-two-page__csv-actions"
  />

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CompanyCreateDialog from 'components/CompanyCreateDialog.vue'
import FileRecordsShell from 'components/FileRecordsShell.vue'
import TableCsvActions from 'components/TableCsvActions.vue'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'
import { openFirstSelectedRecord, shareRecordSelection } from 'src/utils/recordListSelectionActions'
import { normalizeRouteQueryValue, syncRouteQueryState } from 'src/utils/recordListRouteState'
import { buildResolvedPagePath, createRecordViewOpener } from 'src/utils/recordViewNavigation'

const COMPANY_VIEW_MODES = new Set(['card', 'table'])
const COMPANY_TWO_BREADCRUMB_ACTION_OWNER = 'company-two-page'
const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const rowsPerPageOptions = [10, 15, 25, 50]
const columns = [
  { name: 'Company_Name', label: 'Company', field: 'Company_Name', align: 'left', sortable: true },
  { name: 'Short_Name', label: 'Short Name', field: 'Short_Name', align: 'left', sortable: true },
  { name: 'Website', label: 'Website', field: 'Website', align: 'left', sortable: true },
  { name: 'Status', label: 'Status', field: 'Status', align: 'left', sortable: true },
  { name: 'Company_Type', label: 'Type', field: 'Company_Type', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]
const csvHeaders = [
  'id',
  'Company_Name',
  'Short_Name',
  'Website',
  'One_Liner',
  'Description',
  'Company_Type',
  'Status',
  'Date_of_Incorporation',
  'Headquarters_City_Name',
  'Incorporation_Country_Name',
]

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const rows = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const viewMode = ref(getRouteViewMode(route.query.view))
const pagination = ref({ page: 1, rowsPerPage: 10 })
const companyDialogOpen = ref(false)
const csvActionsRef = ref(null)

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

const displayRows = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  if (!query) return rows.value

  return rows.value.filter((row) =>
    [
      row?.Company_Name,
      row?.Short_Name,
      row?.Website,
      row?.Status,
      row?.Company_Type,
      row?.One_Liner,
      row?.Description,
      row?.Headquarters_City_Name,
      row?.Incorporation_Country_Name,
    ].some((value) => String(value || '').toLowerCase().includes(query)),
  )
})

const dashboard = computed(() => {
  const total = rows.value.length
  const summary = rows.value.reduce(
    (accumulator, row) => {
      const hasWebsite = normalizeValue(row?.Website).length > 0
      const hasStatus = normalizeValue(row?.Status).length > 0
      const hasType = normalizeValue(row?.Company_Type).length > 0
      const hasSummary = normalizeValue(row?.One_Liner || row?.Description).length > 0
      const score = [hasWebsite, hasStatus, hasType, hasSummary].filter(Boolean).length

      if (hasWebsite) accumulator.websiteCount += 1
      if (hasStatus) accumulator.statusCount += 1
      if (hasType) accumulator.typeCount += 1
      if (hasSummary) accumulator.summaryCount += 1

      if (score <= 1) accumulator.sparseCount += 1
      else if (score <= 3) accumulator.mediumCount += 1
      else accumulator.richCount += 1

      return accumulator
    },
    {
      websiteCount: 0,
      statusCount: 0,
      typeCount: 0,
      summaryCount: 0,
      sparseCount: 0,
      mediumCount: 0,
      richCount: 0,
    },
  )

  return {
    total,
    ...summary,
    websiteRate: total ? Math.round((summary.websiteCount / total) * 100) : 0,
    statusRate: total ? Math.round((summary.statusCount / total) * 100) : 0,
  }
})

const dashboardStats = computed(() => [
  {
    label: 'Records',
    value: dashboard.value.total,
    caption: `${dashboard.value.websiteRate}% have websites`,
    tone: 'neutral',
  },
  {
    label: 'Typed',
    value: dashboard.value.typeCount,
    caption: `${dashboard.value.statusRate}% have status`,
    tone: 'rich',
  },
  {
    label: 'Need love',
    value: dashboard.value.sparseCount,
    caption: 'Profiles missing basics',
    tone: 'sparse',
  },
  {
    label: 'Searchable',
    value: dashboard.value.summaryCount,
    caption: 'Have a one-liner or description',
    tone: 'neutral',
  },
])

const heroText = computed(() => {
  if (!rows.value.length) {
    return 'This page is the control test: company data rendered through the shared shell instead of the bespoke company page.'
  }
  return `${dashboard.value.richCount} rich profiles, ${dashboard.value.mediumCount} medium profiles, and ${dashboard.value.sparseCount} that still need more structure.`
})

const openRecordView = createRecordViewOpener(router, {
  tableName: 'Companies',
  getReturnTo: getReturnToPath,
})

function getRouteViewMode(value) {
  return normalizeRouteQueryValue(value, COMPANY_VIEW_MODES, 'card')
}

function normalizeValue(value) {
  return String(value || '').trim()
}

function getReturnToPath() {
  return buildResolvedPagePath(router, route, viewMode.value === 'card' ? {} : { view: viewMode.value })
}

function getRowTitle(row) {
  return normalizeValue(row?.Company_Name) || 'Unnamed company'
}

function getRowSubtitle(row) {
  return normalizeValue(row?.One_Liner) || normalizeValue(row?.Status)
}

function getRowInitials(row) {
  return getRowTitle(row)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'CO'
}

function getRowAvatarColor(row) {
  const palette = ['#2563eb', '#0f766e', '#b45309', '#7c3aed', '#be185d', '#1d4ed8']
  const hash = [...getRowTitle(row)].reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

function getRowMetadata(row) {
  return [
    buildMetadataItem('language', row?.Company_Type),
    buildMetadataItem('flag', row?.Status),
    buildMetadataItem('public', row?.Website),
    buildMetadataItem('place', row?.Headquarters_City_Name || row?.Incorporation_Country_Name),
  ].filter(Boolean)
}

function buildMetadataItem(icon, value) {
  const normalized = normalizeValue(value)
  if (!normalized) return null
  return { icon, label: normalized, value: normalized }
}

function getRowSummary(row) {
  return normalizeValue(row?.Description) || normalizeValue(row?.One_Liner)
}

function openCreateCompany() {
  companyDialogOpen.value = true
}

function pickImportFile() {
  csvActionsRef.value?.pickFile?.()
}

async function importRows(importedRows = []) {
  if (!bridge.value?.companies?.upsertMany) return { inserted: 0, updated: 0, skipped: importedRows.length }
  const result = await bridge.value.companies.upsertMany(importedRows)
  await loadCompanies()
  return result || { inserted: 0, updated: 0, skipped: 0 }
}

async function loadCompanies() {
  if (!bridge.value?.companies?.list) return

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.companies.list()
    rows.value = Array.isArray(result?.companies) ? result.companies : []
  } catch (err) {
    rows.value = []
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

async function deleteCompany(row) {
  await bridge.value.companies.delete(row.id)
}

function confirmDelete(row) {
  if (!bridge.value?.companies?.delete) return
  const company = normalizeValue(row?.Company_Name)
  $q.dialog({
    title: 'Delete company',
    message: `This will permanently delete this company${company ? `: ${company}` : ''}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await deleteCompany(row)
    await loadCompanies()
  })
}

function confirmDeleteSelected() {
  if (!bridge.value?.companies?.delete || selectedRows.value.length === 0) return
  const count = selectedRows.value.length
  $q.dialog({
    title: 'Delete selected companies',
    message: `This will permanently delete ${count} selected compan${count === 1 ? 'y' : 'ies'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    for (const row of selectedRows.value) {
      await deleteCompany(row)
    }
    selectedRows.value = []
    await loadCompanies()
  })
}

function editSelected() {
  return openFirstSelectedRecord(selectedRows.value, openRecordView)
}

async function shareSelected() {
  return shareRecordSelection({
    rows: selectedRows.value,
    getLabel: (row) => normalizeValue(row?.Company_Name) || `Company ${row?.id || ''}`.trim(),
    entityLabel: 'companies',
    singularLabel: 'company',
    pluralLabel: 'companies',
    notify: (payload) => $q.notify(payload),
  })
}

function onCompanyCreated() {
  loadCompanies()
}

onMounted(async () => {
  setBreadcrumbActions(COMPANY_TWO_BREADCRUMB_ACTION_OWNER, [
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
      disabled: () => loading.value || displayRows.value.length === 0,
      onClick: () => csvActionsRef.value?.exportCsv?.(),
    },
  ])

  if (!hasBridge.value) return
  await loadCompanies()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(COMPANY_TWO_BREADCRUMB_ACTION_OWNER)
})

watch(
  () => route.query.view,
  (value) => {
    const nextView = getRouteViewMode(value)
    if (viewMode.value !== nextView) viewMode.value = nextView
  },
)

watch(viewMode, () => {
  syncRouteQueryState({
    router,
    currentQuery: route.query,
    currentState: {
      view: COMPANY_VIEW_MODES.has(viewMode.value) ? viewMode.value : 'card',
    },
    stateEntries: [{ key: 'view', fallbackValue: 'card' }],
  })
})
</script>

<style scoped>
.company-two-page__csv-actions {
  display: none;
}
</style>
