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
              <q-card
                flat
                bordered
                class="contact-card full-height"
                :style="getContactCardStyle(row)"
                @pointerenter="onContactCardPointerEnter"
                @pointermove="onContactCardPointerMove"
                @pointerleave="onContactCardPointerLeave"
              >
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
                      <div class="contact-card__hero-top">
                        <div class="contact-card__hero-copy">
                          <div class="contact-card__eyebrow">Contact profile</div>
                          <div class="contact-card__title">
                            {{ row.Name || 'Unnamed contact' }}
                          </div>
                          <div class="contact-card__role">
                            {{ row.Role || 'Role not added yet' }}
                          </div>
                        </div>

                        <q-btn
                          round
                          dense
                          size="sm"
                          unelevated
                          no-caps
                          class="contact-card__select-button"
                          :class="{ 'contact-card__select-button--active': isSelected(row) }"
                          :icon="isSelected(row) ? 'check' : 'add'"
                          :disable="loading"
                          :aria-pressed="isSelected(row) ? 'true' : 'false'"
                          @click.stop="toggleRowSelection(row)"
                        />
                      </div>

                      <div v-if="getContactCardPills(row).length" class="contact-card__pill-row">
                        <q-badge
                          v-for="pill in getContactCardPills(row)"
                          :key="pill"
                          class="contact-card__pill"
                        >
                          {{ pill }}
                        </q-badge>
                      </div>

                      <div v-if="getContactCardActionLinks(row).length" class="contact-card__quick-actions">
                        <q-btn
                          v-for="link in getContactCardActionLinks(row)"
                          :key="link.label"
                          outline
                          no-caps
                          unelevated
                          size="sm"
                          class="contact-card__quick-action"
                          type="button"
                          @click="openContactCardAction(link, $event)"
                        >
                          <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                          <span>{{ link.label }}</span>
                        </q-btn>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="contact-card__summary">
                  <div class="contact-card__summary-label">Highlights</div>

                  <div v-if="getContactCardDetails(row).length" class="contact-card__details">
                    <div
                      v-for="detail in getContactCardDetails(row)"
                      :key="detail.label"
                      class="contact-card__detail"
                    >
                      <q-icon :name="detail.icon" size="16px" class="contact-card__detail-icon" />
                      <div class="contact-card__detail-copy">
                        <div class="contact-card__detail-label">{{ detail.label }}</div>
                        <div class="contact-card__detail-value">{{ detail.value }}</div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="contact-card__summary-empty">
                    Add more contact details to make this card richer.
                  </div>
                </q-card-section>

                <q-card-actions class="contact-card__footer">
                  <q-btn
                    no-caps
                    unelevated
                    class="contact-card__footer-action contact-card__footer-action--primary"
                    label="Open databook"
                    :disable="loading"
                    @click="openDatabook(row)"
                  />

                  <div class="contact-card__footer-actions">
                    <q-btn
                      flat
                      round
                      icon="delete"
                      class="contact-card__icon-action"
                      :disable="loading"
                      @click="confirmDelete(row)"
                    />
                  </div>
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
import { countFilledContactFields, getContactCompletenessTheme } from 'src/utils/contactCompleteness'
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
const searchQuery = ref('')
const priorityMode = ref(false)
const pagination = ref({ page: 1, rowsPerPage: 10 })
const fileInput = ref(null)
const selectedCount = computed(() => selectedRows.value.length)
const rowsPerPageOptions = [10, 15, 25, 50]
const heroAvatarImage = computed(() => buildAvatarImage({ Name: 'EC VC' }))
const contactCardDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const CONTACT_VIEW_MODES = new Set(['card', 'table'])
const viewMode = ref(getRouteViewMode(route.query.view))

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
  return CONTACT_VIEW_MODES.has(normalized) ? normalized : 'table'
}

function getContactsReturnToPath() {
  const nextQuery = { ...route.query }

  if (viewMode.value === 'card') nextQuery.view = 'card'
  else delete nextQuery.view

  return router.resolve({
    path: route.path,
    query: nextQuery,
  }).fullPath
}

function syncViewModeQuery() {
  const currentRouteView = getRouteViewMode(route.query.view)
  const nextView = CONTACT_VIEW_MODES.has(viewMode.value) ? viewMode.value : 'table'

  if (currentRouteView === nextView) return

  const nextQuery = { ...route.query }
  if (nextView === 'card') nextQuery.view = 'card'
  else delete nextQuery.view

  router.replace({ query: nextQuery })
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

function hasContactProfileImage(row) {
  return normalizeInputValue(row?.Profile_Image).length > 0
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
  return String(row?.Name || row?.Email || 'Contact').trim()
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
    '--contact-card-blob-size': '31%',
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

function getContactCardPills(row) {
  return [
    normalizeInputValue(row?.Stakeholder_type),
    row?.Closeness_Level ? `Closeness ${normalizeInputValue(row.Closeness_Level)}` : '',
    row?.Country_based ? `Based in ${normalizeInputValue(row.Country_based)}` : '',
  ]
    .filter(Boolean)
    .slice(0, 3)
}

function getContactCardActionLinks(row) {
  const email = normalizeInputValue(row?.Email)
  const phone = normalizeInputValue(row?.Phone)
  const linkedIn = normalizeInputValue(row?.LinkedIn)

  return [
    email ? { label: 'Email', icon: 'mail', href: `mailto:${email}`, external: false } : null,
    phone ? { label: 'Call', icon: 'call', href: `tel:${phone}`, external: false } : null,
    linkedIn
      ? {
          label: 'LinkedIn',
          icon: 'north_east',
          href: normalizeExternalUrl(linkedIn),
          external: true,
        }
      : null,
  ].filter(Boolean)
}

function getContactCardDetails(row) {
  return [
    row?.Email ? { label: 'Email', value: normalizeInputValue(row.Email), icon: 'mail' } : null,
    row?.Phone ? { label: 'Phone', value: normalizeInputValue(row.Phone), icon: 'call' } : null,
    row?.LinkedIn
      ? {
          label: 'LinkedIn',
          value: formatLinkedInValue(row.LinkedIn),
          icon: 'link',
        }
      : null,
    row?.created_at
      ? {
          label: 'Created',
          value: formatCardDate(row.created_at),
          icon: 'schedule',
        }
      : null,
    row?.Stakeholder_type
      ? {
          label: 'Stakeholder',
          value: normalizeInputValue(row.Stakeholder_type),
          icon: 'flag',
        }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 4)
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

function normalizeExternalUrl(value) {
  const normalized = normalizeInputValue(value)
  if (!normalized) return ''
  if (/^[a-z][a-z\d+.-]*:/i.test(normalized)) return normalized
  return `https://${normalized}`
}

function formatLinkedInValue(value) {
  const normalized = normalizeExternalUrl(value)

  try {
    const url = new URL(normalized)
    const path = url.pathname.replace(/\/$/, '')
    return `${url.hostname.replace(/^www\./, '')}${path && path !== '/' ? path : ''}`
  } catch {
    return normalizeInputValue(value)
  }
}

function formatCardDate(value) {
  const normalized = normalizeInputValue(value)
  if (!normalized) return ''

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return normalized

  return contactCardDateFormatter.format(parsed)
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
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.contacts-toolbar__left,
.contacts-toolbar__right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.contacts-toolbar__left {
  flex: 1 1 720px;
  min-width: 0;
}

.contacts-toolbar__right {
  flex: 0 0 auto;
  margin-left: auto;
}

.contacts-toolbar__search {
  flex: 1 1 300px;
  min-width: 220px;
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
  flex: 0 0 auto;
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border-color: rgba(17, 17, 17, 0.08);
  border-radius: 24px;
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

.contact-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 292px;
}

.contact-card__hero-side {
  display: grid;
  grid-template-rows: auto auto auto;
  align-content: start;
  gap: 10px;
  min-width: 0;
  padding: 16px 18px 18px 14px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.contact-card__hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
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
  background:
    radial-gradient(circle at 28% 26%, rgba(255, 255, 255, 0.22), transparent 30%),
    linear-gradient(180deg, #ebe7df 0%, #dcd6cd 100%);
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
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding-top: 1px;
}

.contact-card__eyebrow,
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

.contact-card__role {
  color: #4b4b4b;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-wrap: balance;
}

.contact-card__select-button {
  position: relative;
  z-index: 2;
  cursor: pointer;
  margin-right: -2px;
  margin-top: 0;
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.14);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.contact-card__select-button :deep(.q-btn__content) {
  min-width: 0;
}

.contact-card__select-button--active {
  color: #fff;
  background: #111;
  border-color: #111;
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
  margin: 20px 20px 0;
  padding: 16px 18px 18px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(18px);
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

.contact-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 20px;
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
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.1);
}

@media (max-width: 1200px) {
  .contacts-shell {
    padding: 20px;
    gap: 20px;
  }

  .contacts-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .contacts-toolbar__left,
  .contacts-toolbar__right {
    flex: none;
    flex-direction: column;
    align-items: stretch;
  }

  .contacts-toolbar__right {
    margin-left: 0;
  }

  .contacts-toolbar__search {
    flex: none;
    width: 100%;
  }

  .contacts-toolbar__button,
  .contacts-view-button {
    width: 100%;
  }
}

@media (max-width: 640px) {
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
