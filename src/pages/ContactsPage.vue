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
      <section class="contacts-shell">
        <div
          class="contacts-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="contacts-shell__copy">
            <div class="contacts-shell__eyebrow">Dashboard</div>
            <h2 class="contacts-shell__hero-title">Relationship map at a glance.</h2>
            <p class="contacts-shell__hero-text">{{ contactsHeroText }}</p>

          </div>

          <div class="contacts-dashboard">
            <div class="contacts-dashboard__stats">
              <article
                v-for="stat in contactsDashboardStats"
                :key="stat.label"
                class="contacts-dashboard__stat"
                :class="`contacts-dashboard__stat--${stat.tone}`"
              >
                <div class="contacts-dashboard__stat-label">{{ stat.label }}</div>
                <div class="contacts-dashboard__stat-value">{{ stat.value }}</div>
                <div class="contacts-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="contacts-dashboard__health">
              <div class="contacts-dashboard__health-copy">
                <div class="contacts-dashboard__health-label">Profile health</div>
                <div class="contacts-dashboard__health-text">
                  {{ contactsDashboard.richCount }} rich, {{ contactsDashboard.mediumCount }} medium,
                  {{ contactsDashboard.sparseCount }} sparse
                </div>
              </div>

              <div class="contacts-dashboard__health-bar" aria-hidden="true">
                <span
                  class="contacts-dashboard__health-segment contacts-dashboard__health-segment--sparse"
                  :style="{ width: `${contactsDashboard.sparseShare}%` }"
                />
                <span
                  class="contacts-dashboard__health-segment contacts-dashboard__health-segment--medium"
                  :style="{ width: `${contactsDashboard.mediumShare}%` }"
                />
                <span
                  class="contacts-dashboard__health-segment contacts-dashboard__health-segment--rich"
                  :style="{ width: `${contactsDashboard.richShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="contacts-toolbar">
          <div class="contacts-toolbar__block contacts-toolbar__block--primary">
            <q-checkbox
              :model-value="allVisibleContactsSelected"
              :indeterminate="someVisibleContactsSelected && !allVisibleContactsSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="contacts-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleContacts"
            />
            <q-btn
              no-caps
              unelevated
              class="contacts-toolbar__add-button"
              :disable="loading"
              @click="openCreateContact"
            >
              <span class="contacts-toolbar__add-button-inner">
                <span class="contacts-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="contacts-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn dense flat round icon="download" color="grey-6" class="contacts-toolbar__icon-button" :disable="loading" @click="pickImportFile">
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="contacts-toolbar__block contacts-toolbar__block--search">
            <q-icon name="tune" size="18px" class="contacts-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="contacts-toolbar__search"
              placeholder="Search contacts..."
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
              class="contacts-toolbar__toggle contacts-toolbar__view-toggle"
              :disable="loading"
              :options="viewOptions"
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
              <q-card
                flat
                bordered
                class="contact-card full-height"
                :style="getContactCardStyle(row)"
                @pointerenter="onContactCardPointerEnter"
                @pointermove="onContactCardPointerMove"
                @pointerleave="onContactCardPointerLeave"
              >
                <q-card-section class="contact-card__control-row">
                  <q-checkbox
                    :model-value="isSelected(row)"
                    :disable="loading"
                    color="dark"
                    class="contact-card__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="contact-card__control-eye"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />
                </q-card-section>
                <q-card-section class="contact-card__hero">
                  <div class="contact-card__hero-main">
                    <figure
                      class="contact-card__portrait"
                      :class="{ 'contact-card__portrait--placeholder': !hasContactProfileImage(row) }"
                    >
                      <img
                        v-if="hasContactProfileImage(row)"
                        class="contact-card__portrait-image"
                        :src="buildAvatarImage(row)"
                        :alt="row.Name || 'Contact portrait'"
                      />
                      <div v-else class="contact-card__portrait-placeholder" aria-hidden="true">
                        <div
                          class="contact-card__portrait-avatar"
                          :style="{ backgroundColor: getContactAvatarColor(row) }"
                        >
                          {{ getContactInitials(row) }}
                        </div>
                      </div>
                    </figure>

                    <div class="contact-card__hero-side">
                      <div class="contact-card__hero-copy">
                        <div class="contact-card__title">
                          <span class="contact-card__title-line">{{ getContactNameLines(row).firstLine }}</span>
                          <span class="contact-card__title-line">{{ getContactNameLines(row).secondLine || ' ' }}</span>
                        </div>
                        <div class="contact-card__role">
                          {{ normalizeInputValue(row?.Country_based) || 'Add country base' }}
                        </div>
                        <div class="contact-card__bottom-stack">
                          <div v-if="getContactRoleCompanyChips(row).length" class="contact-card__role-chip-row">
                            <div
                              v-for="chip in getContactRoleCompanyChips(row)"
                              :key="`${chip.type}-${chip.value}`"
                              class="contact-card__role-chip"
                            >
                              <q-icon :name="chip.icon" size="14px" />
                              <span>{{ chip.value }}</span>
                            </div>
                          </div>
                          <div v-if="getContactPrimaryDetails(row).length" class="contact-card__detail-stack">
                            <div
                              v-for="detail in getContactPrimaryDetails(row)"
                              :key="detail.label"
                              class="contact-card__role contact-card__role--detail"
                            >
                              <button
                                type="button"
                                class="contact-card__inline-chip"
                                @click="openContactCardAction(detail, $event)"
                              >
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

                <q-card-section class="contact-card__summary">
                  <div class="contact-card__summary-head">
                    <q-btn-toggle
                      :model-value="getContactCardPanel(row)"
                      dense
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-card__summary-toggle"
                      :options="getContactRelationshipOptions(row)"
                      @update:model-value="setContactCardPanel(row, $event)"
                    />
                    <q-btn-toggle
                      :model-value="getContactCardContentView(row)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="contact-card__summary-view-toggle"
                      :options="contactCardContentViewOptions"
                      @update:model-value="setContactCardContentView(row, $event)"
                    />
                  </div>

                  <div class="contact-card__summary-panel">
                    <div class="contact-card__summary-panel-head">
                      <q-btn flat no-caps class="contact-card__summary-add-relation" aria-label="Add Relation">
                        <span class="contact-card__summary-add-relation-plus">
                          <q-icon name="add" />
                        </span>
                        <span class="contact-card__summary-add-relation-label">Add Relation</span>
                      </q-btn>
                    </div>
                    <div class="contact-card__summary-body">
                      <div class="contact-card__summary-body-content">
                        <div
                          v-if="getContactActiveRelationshipItems(row).length"
                          :class="[
                            'contact-card__notes-list',
                            { 'contact-card__notes-list--rows': getContactCardContentView(row) === 'table' },
                          ]"
                        >
                          <div
                            v-for="item in getContactActiveRelationshipItems(row)"
                            :key="item"
                            class="contact-card__note-pill"
                          >
                            {{ item }}
                          </div>
                        </div>

                        <div v-else class="contact-card__summary-empty">
                          No linked KDB relationships yet for this contact.
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
import SelectionActionBar from 'components/SelectionActionBar.vue'
import ContactCreateDialog from 'components/ContactCreateDialog.vue'
import { countFilledContactFields, getContactCompletenessTheme } from 'src/utils/contactCompleteness'
import { csvToRows, rowsToCsv } from 'src/utils/csv'
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
    !!bridge.value?.contacts?.list &&
    !!bridge.value?.contacts?.upsertMany &&
    !!bridge.value?.contacts?.create &&
    !!bridge.value?.contacts?.delete,
)
const contactCardContentViews = ref({})
const contactCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const contactCardPanels = ref({})

function getContactCardContentView(row) {
  const rowId = getRowId(row)
  return contactCardContentViews.value[rowId] || 'card'
}

function setContactCardContentView(row, value) {
  const rowId = getRowId(row)
  if (!rowId) return
  contactCardContentViews.value = {
    ...contactCardContentViews.value,
    [rowId]: value || 'card',
  }
}

function getContactCardPanel(row) {
  const rowId = getRowId(row)
  return resolveCardRelationshipPanel(contactCardPanels.value[rowId], getContactRelationshipItems(row))
}

function setContactCardPanel(row, value) {
  const rowId = getRowId(row)
  if (!rowId) return
  contactCardPanels.value = {
    ...contactCardPanels.value,
    [rowId]: value || 'notes',
  }
}

function getContactRelationshipItems(row) {
  return buildCardRelationshipItems(row, ['Contact'], {
    notes: getContactLinkedNotes,
    artifacts: getContactLinkedDocuments,
  })
}

function getContactRelationshipOptions(row) {
  return buildCardRelationshipOptions(getContactRelationshipItems(row))
}

function getContactActiveRelationshipItems(row) {
  return getContactRelationshipItems(row)[getContactCardPanel(row)] || []
}

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
const contactDialogOpen = ref(false)
const contactKindFilter = ref('all')
const locationFilter = ref('')
const industryFilter = ref('')
const projectFilter = ref('')
const companyFilter = ref('')
const searchQuery = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const selectedCount = computed(() => selectedRows.value.length)
const rowsPerPageOptions = [10, 15, 25, 50]

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const CONTACT_VIEW_MODES = new Set(['card', 'table'])
const CONTACTS_BREADCRUMB_ACTION_OWNER = 'contacts-page'
const viewMode = ref(getRouteViewMode(route.query.view))
const contactsDashboard = computed(() => {
  const total = rows.value.length
  const counts = rows.value.reduce(
    (summary, row) => {
      const filledCount = countFilledContactFields(row)
      const email = primaryEmail(row)
      const phone = normalizeInputValue(row?.Phone)
      const linkedIn = normalizeInputValue(row?.LinkedIn)

      if (email || phone) summary.reachableCount += 1
      if (linkedIn) summary.linkedInCount += 1
      if (!email && !phone && !linkedIn) summary.missingCoreCount += 1

      if (filledCount < 2) summary.sparseCount += 1
      else if (filledCount < 5) summary.mediumCount += 1
      else summary.richCount += 1

      return summary
    },
    {
      reachableCount: 0,
      linkedInCount: 0,
      missingCoreCount: 0,
      sparseCount: 0,
      mediumCount: 0,
      richCount: 0,
    },
  )

  const safeTotal = total || 1
  return {
    total,
    ...counts,
    reachableRate: Math.round((counts.reachableCount / safeTotal) * 100),
    sparseShare: total ? (counts.sparseCount / total) * 100 : 0,
    mediumShare: total ? (counts.mediumCount / total) * 100 : 0,
    richShare: total ? (counts.richCount / total) * 100 : 0,
  }
})
const contactsHeroText = computed(() => {
  const { total, richCount, sparseCount, linkedInCount } = contactsDashboard.value

  if (!total) {
    return 'Start building your relationship map. Add contacts to track reachability, data quality, and warm paths.'
  }

  return `${total} contacts tracked, ${richCount} rich profiles ready to work, ${sparseCount} still need context, and ${linkedInCount} already include LinkedIn.`
})
const contactsDashboardStats = computed(() => [
  {
    label: 'Total contacts',
    value: contactsDashboard.value.total,
    caption: 'People in your network',
    tone: 'neutral',
  },
  {
    label: 'Reachable',
    value: contactsDashboard.value.reachableCount,
    caption: 'Email or phone available',
    tone: 'rich',
  },
  {
    label: 'Rich profiles',
    value: contactsDashboard.value.richCount,
    caption: 'Databooks with strong detail',
    tone: 'rich',
  },
  {
    label: 'Need enrichment',
    value: contactsDashboard.value.sparseCount,
    caption: 'Less than 3 fields filled',
    tone: 'sparse',
  },
])

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
  router.push({
    name: 'databook-view',
    params: { tableName: 'Contacts', recordId },
    query: { returnTo: getContactsReturnToPath() },
  })
}

function getRouteViewMode(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return CONTACT_VIEW_MODES.has(normalized) ? normalized : 'card'
}

function getContactsReturnToPath() {
  const nextQuery = { ...route.query }

  if (viewMode.value === 'table') nextQuery.view = 'table'
  else delete nextQuery.view

  return router.resolve({
    path: route.path,
    query: nextQuery,
  }).fullPath
}

function syncViewModeQuery() {
  const currentRouteView = getRouteViewMode(route.query.view)
  const nextView = CONTACT_VIEW_MODES.has(viewMode.value) ? viewMode.value : 'card'

  if (currentRouteView === nextView) return

  const nextQuery = { ...route.query }
  if (nextView === 'table') nextQuery.view = 'table'
  else delete nextQuery.view

  router.replace({ query: nextQuery })
}

const displayRows = computed(() => {
  const query = String(searchQuery.value || '')
    .trim()
    .toLowerCase()

  let items = [...rows.value]

  if (contactKindFilter.value === 'connected') {
    items = items.filter((row) => hasConnectedSignal(row))
  }

  if (locationFilter.value) {
    items = items.filter((row) => normalizeInputValue(row?.Country_based) === locationFilter.value)
  }

  if (industryFilter.value) {
    items = items.filter(
      (row) =>
        normalizeInputValue(
          row?.Industry_Name ||
            row?.industry_name ||
            row?.Industry ||
            row?.industry ||
            row?.Industry_Sector,
        ) === industryFilter.value,
    )
  }

  if (projectFilter.value) {
    items = items.filter(
      (row) =>
        normalizeInputValue(row?.project_name || row?.Project_Name || row?.current_project_name) ===
        projectFilter.value,
    )
  }

  if (companyFilter.value) {
    items = items.filter(
      (row) =>
        normalizeInputValue(
          row?.company_name ||
            row?.Company_Name ||
            row?.Current_Company_Name ||
            row?.Organization_Name,
        ) === companyFilter.value,
    )
  }

  if (query) {
    items = items.filter((row) =>
      [
        row?.Name,
        row?.Personal_Email,
        row?.Professional_Email,
        row?.Phone,
        row?.Country_based,
        row?.LinkedIn,
        row?.created_at,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

const allVisibleContactsSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((row) => isSelected(row)),
)

const someVisibleContactsSelected = computed(
  () => displayRows.value.some((row) => isSelected(row)) && !allVisibleContactsSelected.value,
)

function toggleSelectAllVisibleContacts(shouldSelect) {
  if (!shouldSelect) {
    const visibleIds = new Set(displayRows.value.map((row) => getRowId(row)).filter(Boolean))
    selectedRows.value = selectedRows.value.filter((row) => !visibleIds.has(getRowId(row)))
    return
  }

  const selectedIds = new Set(selectedRows.value.map((row) => getRowId(row)).filter(Boolean))
  const additions = displayRows.value.filter((row) => {
    const rowId = getRowId(row)
    return rowId && !selectedIds.has(rowId)
  })
  if (additions.length) selectedRows.value = [...selectedRows.value, ...additions]
}

function hasConnectedSignal(row) {
  return (
    normalizeInputValue(row?.LinkedIn).length > 0 ||
    normalizeInputValue(
      row?.company_name || row?.Company_Name || row?.Current_Company_Name || row?.Organization_Name,
    ).length > 0
  )
}

function buildAvatarImage(row) {
  const initials = getContactInitials(row)
  const bg = getContactAvatarColor(row)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <rect width="112" height="112" rx="24" fill="${bg}" />
      <text x="56" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">${escapeSvg(initials)}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function hasContactProfileImage() {
  return false
}

function getContactInitials(row) {
  return getContactAvatarLabel(row)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'C'
}

function getContactAvatarColor(row) {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(getContactAvatarLabel(row))) % palette.length]
}

function getContactAvatarLabel(row) {
  return String(row?.Name || row?.Professional_Email || row?.Personal_Email || 'Contact').trim()
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

function getContactCardStyle(row) {
  const theme = getContactCompletenessTheme(countFilledContactFields(row))
  return {
    '--contact-card-blob-x': '50%',
    '--contact-card-blob-y': '28%',
    '--contact-card-blob-size': '62%',
    '--contact-card-blob-opacity': '0',
    '--contact-card-blob-strong': theme.blobStrong,
    '--contact-card-blob-soft': theme.blobSoft,
    '--contact-card-blob-fade': theme.blobFade,
  }
}

function onContactCardPointerEnter(event) {
  updateContactCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--contact-card-blob-opacity', '1')
}

function onContactCardPointerMove(event) {
  updateContactCardGradientPosition(event)
}

function onContactCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--contact-card-blob-opacity', '0')
}

function updateContactCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--contact-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--contact-card-blob-y', `${clamp(y, 10, 90)}%`)
}


// eslint-disable-next-line no-unused-vars
function getContactCurrentRoleCompany(row) {
  const role = normalizeInputValue(
    row?.Current_Role || row?.Role || row?.Title || row?.Position || row?.Current_Position,
  )
  const company = normalizeInputValue(
    row?.Current_Company_Name || row?.Company_Name || row?.company_name || row?.Organization_Name,
  )
  if (role && company) return `${role} • ${company}`
  return role || company || ''
}

function getContactRoleCompanyChips(row) {
  const role = normalizeInputValue(
    row?.Current_Role || row?.Role || row?.Title || row?.Position || row?.Current_Position,
  )
  const company = normalizeInputValue(
    row?.Current_Company_Name || row?.Company_Name || row?.company_name || row?.Organization_Name,
  )

  return [
    role
      ? {
          type: 'role',
          value: role,
          icon: 'theater_comedy',
        }
      : null,
    company
      ? {
          type: 'company',
          value: company,
          icon: 'apartment',
        }
      : null,
  ].filter(Boolean)
}

// eslint-disable-next-line no-unused-vars
const countryFlagByName = {
  argentina: '🇦🇷',
  australia: '🇦🇺',
  austria: '🇦🇹',
  belgium: '🇧🇪',
  brazil: '🇧🇷',
  canada: '🇨🇦',
  chile: '🇨🇱',
  china: '🇨🇳',
  colombia: '🇨🇴',
  denmark: '🇩🇰',
  finland: '🇫🇮',
  france: '🇫🇷',
  germany: '🇩🇪',
  'hong kong': '🇭🇰',
  india: '🇮🇳',
  ireland: '🇮🇪',
  israel: '🇮🇱',
  italy: '🇮🇹',
  japan: '🇯🇵',
  luxembourg: '🇱🇺',
  mexico: '🇲🇽',
  netherlands: '🇳🇱',
  'new zealand': '🇳🇿',
  norway: '🇳🇴',
  portugal: '🇵🇹',
  singapore: '🇸🇬',
  'south korea': '🇰🇷',
  spain: '🇪🇸',
  sweden: '🇸🇪',
  switzerland: '🇨🇭',
  'united arab emirates': '🇦🇪',
  'united kingdom': '🇬🇧',
  uk: '🇬🇧',
  'united states': '🇺🇸',
  usa: '🇺🇸',
  uruguay: '🇺🇾',
}

// eslint-disable-next-line no-unused-vars
const countryCodeByName = {
  argentina: 'AR',
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  canada: 'CA',
  chile: 'CL',
  china: 'CN',
  colombia: 'CO',
  denmark: 'DK',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  'hong kong': 'HK',
  india: 'IN',
  ireland: 'IE',
  israel: 'IL',
  italy: 'IT',
  japan: 'JP',
  luxembourg: 'LU',
  mexico: 'MX',
  netherlands: 'NL',
  'new zealand': 'NZ',
  norway: 'NO',
  portugal: 'PT',
  singapore: 'SG',
  'south korea': 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  'united arab emirates': 'AE',
  'united kingdom': 'GB',
  uk: 'GB',
  'united states': 'US',
  usa: 'US',
  uruguay: 'UY',
}

// eslint-disable-next-line no-unused-vars
function getFlagEmojiFromCountryCode(code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return ''
  return String.fromCodePoint(...[...normalized].map((char) => 127397 + char.charCodeAt(0)))
}

const countryDialCodeByName = {
  argentina: '54',
  australia: '61',
  austria: '43',
  belgium: '32',
  brazil: '55',
  canada: '1',
  chile: '56',
  china: '86',
  colombia: '57',
  denmark: '45',
  finland: '358',
  france: '33',
  germany: '49',
  'hong kong': '852',
  india: '91',
  ireland: '353',
  israel: '972',
  italy: '39',
  japan: '81',
  luxembourg: '352',
  mexico: '52',
  netherlands: '31',
  'new zealand': '64',
  norway: '47',
  portugal: '351',
  singapore: '65',
  'south korea': '82',
  spain: '34',
  sweden: '46',
  switzerland: '41',
  'united arab emirates': '971',
  'united kingdom': '44',
  uk: '44',
  'united states': '1',
  usa: '1',
  uruguay: '598',
}

const countryCityCodeLengthByName = {
  argentina: 2,
  australia: 2,
  austria: 2,
  belgium: 2,
  brazil: 2,
  canada: 3,
  chile: 2,
  china: 2,
  colombia: 3,
  denmark: 2,
  finland: 2,
  france: 1,
  germany: 2,
  'hong kong': 0,
  india: 2,
  ireland: 2,
  israel: 2,
  italy: 2,
  japan: 2,
  luxembourg: 2,
  mexico: 2,
  netherlands: 2,
  'new zealand': 2,
  norway: 2,
  portugal: 2,
  singapore: 0,
  'south korea': 2,
  spain: 2,
  sweden: 2,
  switzerland: 2,
  'united arab emirates': 2,
  'united kingdom': 2,
  uk: 2,
  'united states': 3,
  usa: 3,
  uruguay: 2,
}

function getContactLinkedNotes(row) {
  return [
    ...String(row?.Contact_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getContactPrimaryDetails(row) {
  const email = primaryEmail(row)
  const phone = normalizeInputValue(row?.Phone)
  const linkedIn = normalizeInputValue(row?.LinkedIn)

  return [
    email
      ? {
          label: 'Email',
          value: email,
          icon: 'mail',
          href: `mailto:${email}`,
        }
      : null,
    phone
      ? {
          label: 'Phone',
          value: formatContactPhone(row),
          icon: 'call',
          href: `tel:${phone}`,
        }
      : null,
    linkedIn
      ? {
          label: 'LinkedIn',
          value: 'LinkedIn',
          icon: 'north_east',
          href: normalizeExternalUrl(linkedIn),
          external: true,
        }
      : null,
  ].filter(Boolean)
}

function getContactNameLines(row) {
  const rawName = String(row?.Name || '').trim()
  if (!rawName) {
    return { firstLine: 'Unnamed', secondLine: 'contact' }
  }

  const parts = rawName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return { firstLine: parts[0], secondLine: '' }
  }

  if (parts.length === 2) {
    return {
      firstLine: parts[0],
      secondLine: parts[1],
    }
  }

  return {
    firstLine: parts.slice(0, -1).join(' '),
    secondLine: parts.slice(-1).join(' '),
  }
}

function getContactLinkedDocuments(row) {
  return [
    ...String(row?.Contact_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(row?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

async function openContactCardAction(link, event) {
  event?.preventDefault?.()
  event?.stopPropagation?.()

  const href = normalizeInputValue(link?.href)
  if (!href) return

  try {
    if (bridge.value?.links?.openExternal) {
      await bridge.value.links.openExternal(href)
      return
    }

    window.open(href, link?.external ? '_blank' : '_self', 'noopener,noreferrer')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Unable to open link.',
    })
  }
}

function normalizeInputValue(value) {
  return String(value || '').trim()
}

function primaryEmail(row) {
  return normalizeInputValue(row?.Professional_Email) || normalizeInputValue(row?.Personal_Email)
}

function formatContactPhone(row) {
  const rawPhone = normalizeInputValue(row?.Phone)
  if (!rawPhone) return ''

  const digits = rawPhone.replace(/\D/g, '')
  if (!digits) return rawPhone

  const country = normalizeInputValue(row?.Country_based).toLowerCase()
  const fallbackCountryCode = countryDialCodeByName[country] || ''
  const hasExplicitCountryPrefix = rawPhone.startsWith('+')

  let countryCode = ''
  let localDigits = digits

  if (
    fallbackCountryCode &&
    digits.startsWith(fallbackCountryCode) &&
    digits.length > fallbackCountryCode.length + 4 &&
    (hasExplicitCountryPrefix || digits.length > 10)
  ) {
    countryCode = fallbackCountryCode
    localDigits = digits.slice(fallbackCountryCode.length)
  } else if (fallbackCountryCode) {
    countryCode = fallbackCountryCode
  } else if (digits.length > 10) {
    countryCode = digits.slice(0, digits.length - 10)
    localDigits = digits.slice(-10)
  }

  const cityCodeLength = getContactCityCodeLength(country, localDigits.length)
  const cityCode = localDigits.slice(0, cityCodeLength)
  const lastFour = localDigits.slice(-4)
  const middleDigits = localDigits.slice(cityCode.length, Math.max(cityCode.length, localDigits.length - 4))

  const parts = []
  if (countryCode) parts.push(`+${countryCode}`)
  if (cityCode) parts.push(cityCode)
  if (middleDigits) parts.push(middleDigits)
  if (lastFour && lastFour !== middleDigits) parts.push(lastFour)

  return parts.join('-') || rawPhone
}

function getContactCityCodeLength(country, length) {
  const mappedLength = countryCityCodeLengthByName[country]
  if (typeof mappedLength === 'number') return Math.min(mappedLength, Math.max(0, length - 4))
  if (length <= 7) return Math.max(0, length - 4)
  return 0
}

function normalizeExternalUrl(value) {
  const normalized = normalizeInputValue(value)
  if (!normalized) return ''
  if (/^[a-z][a-z\d+.-]*:/i.test(normalized)) return normalized
  return `https://${normalized}`
}

const columns = [
  { name: 'Name', label: 'Name', field: 'Name', align: 'left', sortable: true },
  {
    name: 'Personal_Email',
    label: 'Personal Email',
    field: 'Personal_Email',
    align: 'left',
    sortable: true,
  },
  {
    name: 'Professional_Email',
    label: 'Professional Email',
    field: 'Professional_Email',
    align: 'left',
    sortable: true,
  },
  { name: 'Phone', label: 'Phone', field: 'Phone', align: 'left', sortable: true },
  { name: 'Country_based', label: 'Country', field: 'Country_based', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'id',
  'Name',
  'Personal_Email',
  'Professional_Email',
  'Phone',
  'LinkedIn',
  'Country_based',
]
const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
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
  const activeIds = new Set(displayRows.value.map((row) => getRowId(row)))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(getRowId(row)))
}

function isSelected(row) {
  const rowId = getRowId(row)
  if (!rowId) return false
  return selectedRows.value.some((selectedRow) => getRowId(selectedRow) === rowId)
}

function toggleRowSelection(row, shouldSelect) {
  const rowId = getRowId(row)
  if (!rowId) return

  if (typeof shouldSelect !== 'boolean') {
    shouldSelect = !isSelected(row)
  }

  if (shouldSelect) {
    if (isSelected(row)) return
    selectedRows.value = [...selectedRows.value, row]
    return
  }

  selectedRows.value = selectedRows.value.filter((selectedRow) => getRowId(selectedRow) !== rowId)
}

function getRowId(row) {
  return String(row?.id || '').trim()
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
      getLabel: (row) => String(row?.Name || '').trim() || `Contact ${getRowId(row)}`.trim(),
      entityLabel: 'contacts',
    })
    $q.notify({
      type: 'positive',
      message: `Copied ${selectedCount.value} selected contact${selectedCount.value === 1 ? '' : 's'}.`,
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

onMounted(async () => {
  setBreadcrumbActions(CONTACTS_BREADCRUMB_ACTION_OWNER, [
    {
      id: 'import-csv',
      label: 'Import CSV',
      icon: 'download',
      disabled: () => loading.value,
      onClick: pickImportFile,
    },
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: 'upload',
      disabled: () => loading.value || displayRows.value.length === 0,
      onClick: exportContactsCsv,
    },
  ])
  window.addEventListener('ecvc:open-contact-dialog', onOpenContactDialog)
  if (!hasBridge.value) return
  await loadContacts()
  consumeQueuedContactDialogOpen()
  openCreateContactFromQuery()
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(CONTACTS_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('ecvc:open-contact-dialog', onOpenContactDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateContactFromQuery()
  },
)

watch(
  () => route.query.view,
  (value) => {
    const nextView = getRouteViewMode(value)
    if (viewMode.value !== nextView) viewMode.value = nextView
  },
)

watch(viewMode, () => {
  syncViewModeQuery()
})

watch(displayRows, () => {
  normalizeSelectedRows()
})
</script>

<style scoped>
.contacts-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.contacts-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.contacts-shell__hero {
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

.contacts-shell__hero::before {
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

.contacts-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.contacts-shell__hero > * {
  position: relative;
  z-index: 1;
}

.contacts-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  min-width: 0;
  justify-content: flex-start;
  position: relative;
  z-index: 1;
}

.contacts-shell__eyebrow {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.16em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contacts-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.contacts-shell__hero-text {
  margin: auto 0 0;
  display: flex;
  align-items: flex-end;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
  max-width: 52ch;
}

.contacts-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.contacts-shell__meta-pill {
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
  line-height: var(--ds-line-height-xs);
}

.contacts-dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.contacts-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.contacts-dashboard__stat {
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

.contacts-dashboard__stat--neutral {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.contacts-dashboard__stat--rich {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.contacts-dashboard__stat--sparse {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.contacts-dashboard__stat-label,
.contacts-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contacts-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.contacts-dashboard__stat-caption,
.contacts-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.contacts-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.contacts-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.contacts-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.contacts-dashboard__health-segment {
  display: block;
  height: 100%;
}

.contacts-dashboard__health-segment--sparse {
  background: #ff5521;
}

.contacts-dashboard__health-segment--medium {
  background: #ebff5a;
}

.contacts-dashboard__health-segment--rich {
  background: #2647ff;
}

.contacts-toolbar {
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.contacts-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.contacts-toolbar__block--primary {
  margin-right: 4px;
}

.contacts-toolbar__block--search {
  grid-column: -2 / -1;
  padding-top: 2px;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.contacts-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.contacts-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.contacts-toolbar__toggle {
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

.contacts-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.contacts-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.contacts-toolbar__search {
  align-self: center;
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.contacts-toolbar__search :deep(.q-field__control),
.contacts-toolbar__search :deep(.q-field__native),
.contacts-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.contacts-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.contacts-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.contacts-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.contacts-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.contacts-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.contacts-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.contacts-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.contacts-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.contacts-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.contacts-toolbar__add-button:hover,
.contacts-toolbar__add-button:focus-visible {
  transform: translateY(-1px);
}

.contacts-toolbar__add-button:active,
.contacts-toolbar__add-button.q-btn--active,
.contacts-toolbar__add-button.q-btn--standard.q-btn--active {
  color: #ffffff;
  background: #111111;
}

.contacts-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.contacts-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.contacts-toolbar__add-button-plus {
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
  border: 0;
  box-shadow: none;
}

.contacts-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.contacts-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
  letter-spacing: 0.01em;
}

.contacts-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
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
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.contacts-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.contacts-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
  letter-spacing: 0;
}

.contacts-table :deep(th .q-table__sort-icon) {
  font-size: 20px;
}

.contacts-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.contacts-table :deep(.q-table__bottom) {
  min-height: 56px;
  padding: var(--ds-space-12) var(--ds-space-16);
  border-top: 1px solid var(--ds-table-border);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border-color: rgba(17, 17, 17, 0.08);
  border-radius: 28px;
  box-shadow: 0 18px 42px rgba(17, 17, 17, 0.06);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.contact-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--contact-card-blob-x) var(--contact-card-blob-y),
    var(--contact-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--contact-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--contact-card-blob-size) * 0.46),
    var(--contact-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--contact-card-blob-size) * 0.7),
    transparent var(--contact-card-blob-size)
  );
  opacity: var(--contact-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.contact-card > * {
  position: relative;
  z-index: 1;
}

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.contact-card__hero {
  padding: 0;
}

.contact-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.contact-card__control-row :deep(.q-checkbox__inner),
.contact-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.contact-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 244px;
  height: 248px;
}

.contact-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-width: 0;
  padding: 18px 18px 6px 12px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.contact-card__hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.contact-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #d8d4ca;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
}

.contact-card__portrait--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-right: 0;
}

.contact-card__portrait--placeholder::after {
  display: none;
}

.contact-card__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(17, 17, 17, 0.2) 100%);
  pointer-events: none;
}

.contact-card__portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.08);
}

.contact-card__portrait-placeholder {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.contact-card__portrait-avatar {
  display: flex;
  width: clamp(104px, 42%, 136px);
  height: clamp(104px, 42%, 136px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 36px rgba(17, 17, 17, 0.14);
  font-family: var(--font-title);
  font-size: clamp(2.4rem, 5vw, 3.5rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.contact-card__hero-copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.contact-card__summary-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.contact-card__title {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.35rem, 2.2vw, 1.7rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.contact-card__title-line {
  display: block;
}

.contact-card__role-chip-row {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 4px;
  align-items: flex-start;
  overflow: visible;
}

.contact-card__role-chip {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  min-height: 24px;
  padding: 0 8px;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.contact-card__role-chip:empty {
  display: none;
}

.contact-card__role {
  color: #4b4b4b;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 16px;
  text-wrap: balance;
}

.contact-card__location-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-card__location-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 20px;
  width: 20px;
  min-width: 20px;
  min-height: 20px;
  font-size: 16px;
  line-height: 1;
  text-align: center;
}

.contact-card__location-text {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
}

.contact-card__role--secondary {
  color: #111;
  font-weight: var(--font-weight-medium);
}

.contact-card__bottom-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
}

.contact-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0;
}

.contact-card__role--detail {
  display: flex;
  align-items: center;
  width: 100%;
}

.contact-card__inline-chip {
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
  cursor: pointer;
}

.contact-card__inline-chip:hover {
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.22);
}

.contact-card__hero-select-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-height: 32px;
}

.contact-card__pill-row,
.contact-card__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.contact-card__pill-row {
  align-content: flex-start;
}

.contact-card__quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-content: start;
}

.contact-card__pill {
  padding: 6px 9px;
  color: #111;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.contact-card__quick-action {
  min-height: 30px;
  width: 100%;
  padding: 0 10px;
  color: #111;
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.contact-card__quick-action :deep(.q-btn__content) {
  min-width: 0;
  justify-content: flex-start;
}

.contact-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px 20px 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
  backdrop-filter: none;
}

.contact-card__summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 14px;
}

.contact-card__summary-view-toggle {
  margin-left: auto;
  margin-right: 14px;
  border-radius: var(--ds-control-radius);
}

.contact-card__summary-view-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.contact-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.contact-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.contact-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.contact-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.contact-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.contact-card__summary-toggle :deep(.q-btn) {
  position: relative;
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.contact-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.contact-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  transform: none;
  padding: 4px 7px;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(239, 239, 239, 0.5);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}

.contact-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.contact-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.contact-card__summary-toggle {
  margin-right: auto;
}

.contact-card__summary-panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 4px;
}

.contact-card__summary-add-relation {
  padding: 0;
  min-height: 0;
  color: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
  line-height: 1;
}

.contact-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
  line-height: 1;
}

.contact-card__summary-add-relation-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  min-width: 14px;
  min-height: 14px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
}

.contact-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 9px;
}

.contact-card__summary-add-relation-label {
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.01em;
}

.contact-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  direction: rtl;
  padding-left: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(17, 17, 17, 0.18) transparent;
}

.contact-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.contact-card__summary-body::-webkit-scrollbar {
  width: 6px;
}

.contact-card__summary-body::-webkit-scrollbar-track {
  background: transparent;
}

.contact-card__summary-body::-webkit-scrollbar-thumb {
  background: rgba(17, 17, 17, 0.16);
  border-radius: 999px;
}

.contact-card__summary-body-content {
  direction: ltr;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.contact-card__action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-card__action-row {
  display: grid;
  grid-template-columns: 102px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.contact-card__info-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 12px;
  color: #111;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.contact-card__info-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.26);
  color: #1d4ed8;
}

.contact-card__action-value {
  min-width: 0;
  color: #111;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  word-break: break-word;
}

.contact-card__portrait-eye {
  display: none;
}

.contact-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.contact-card__detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.contact-card__detail-icon {
  margin-top: 2px;
  color: #6f6f6f;
}

.contact-card__detail-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.contact-card__detail-label {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  line-height: 16px;
}

.contact-card__detail-value {
  overflow: hidden;
  color: #111;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.contact-card__notes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-card__notes-list--rows {
  flex-direction: column;
  flex-wrap: nowrap;
}

.contact-card__note-pill {
  padding: 8px 12px;
  color: #4b4b4b;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
}

.contact-card__notes-list--rows .contact-card__note-pill {
  width: 100%;
  border-radius: 12px;
}

.contact-card__footer-action {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.contact-card__footer-action--primary {
  color: #fff;
  background: #111;
}

.contact-card__icon-action {
  color: #111;
  background: transparent;
  border: 0;
  transform: scale(0.75);
  transform-origin: center;
}

.contact-card__control-eye {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  padding: 0;
  color: #111;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.contact-card__control-eye :deep(.q-icon) {
  font-size: 13px;
}

.contact-card__select-box {
  margin-left: -3.5px;
  transform: scale(0.72);
  transform-origin: center;
}


@media (max-width: 1200px) {
  .contacts-shell {
    gap: 32px;
  }

  .contacts-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .contacts-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
  }

  .contacts-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .contacts-toolbar__block--search {
    grid-column: auto;
  }

  .contacts-toolbar__search {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .contacts-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .contacts-dashboard__stat {
    min-height: 98px;
  }

  .contact-card {
    border-radius: 20px;
  }

  .contact-card__hero-main {
    grid-template-columns: 1fr;
    height: 324px;
  }

  .contact-card__portrait {
    min-height: 156px;
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  }

  .contact-card__hero-top {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }

  .contact-card__hero-side {
    gap: 12px;
    padding: 14px;
  }

  .contact-card__portrait-avatar {
    width: 104px;
    height: 104px;
    font-size: 2.5rem;
  }

  .contact-card__quick-actions {
    grid-template-columns: 1fr;
  }

  .contact-card__title {
    font-size: 1.3rem;
  }

  .contact-card__summary,
  .contact-card__footer {
    margin-right: 16px;
    margin-left: 16px;
  }

  .contact-card__details {
    grid-template-columns: 1fr;
  }

  .contact-card__footer {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
