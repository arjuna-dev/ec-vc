<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Databooks requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="databook-page">
      <div class="databook-heading">
        <q-btn
          v-if="backLink"
          flat
          no-caps
          icon="arrow_back"
          class="databook-heading__back"
          :label="backLink.label"
          @click="router.push({ name: backLink.routeName })"
        />
        <div>
          <div class="databook-heading__eyebrow">{{ entityLabel }} databook</div>
          <div class="databook-heading__title">{{ databookTitle }}</div>
          <div class="databook-heading__subtitle">
            Review the full record, make edits in one place, and save a new audited snapshot.
          </div>
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <template v-if="fields.length">
        <div v-if="isContactView" class="contact-databook">
          <section class="contact-databook__hero">
            <div class="contact-databook__hero-main">
              <figure class="contact-databook__portrait">
                <img
                  class="contact-databook__portrait-image"
                  :src="contactAvatarImage"
                  :alt="contactName || 'Contact portrait'"
                />
                <div class="contact-databook__portrait-actions">
                  <q-btn
                    round
                    dense
                    size="sm"
                    unelevated
                    icon="edit"
                    class="contact-databook__portrait-action"
                    :loading="uploadingContactImage"
                    :disable="saving || !contactImageField"
                  >
                    <q-menu
                      anchor="bottom right"
                      self="top right"
                      class="contact-databook__portrait-menu"
                    >
                      <q-list dense style="min-width: 168px">
                        <q-item clickable v-close-popup @click="triggerContactImagePicker">
                          <q-item-section avatar>
                            <q-icon name="image" />
                          </q-item-section>
                          <q-item-section>Change image</q-item-section>
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          :disable="!hasContactCustomImage"
                          @click="removeContactImage"
                        >
                          <q-item-section avatar>
                            <q-icon name="delete" />
                          </q-item-section>
                          <q-item-section>Delete image</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                    <q-tooltip>Change image</q-tooltip>
                  </q-btn>
                </div>
              </figure>

              <div class="contact-databook__hero-copy">
                <div class="contact-databook__eyebrow">Contact profile</div>
                <h1 class="contact-databook__name">
                  {{ contactName || 'Unnamed contact' }}
                </h1>
                <div class="contact-databook__role">
                  {{ contactRole || 'Role not added yet' }}
                </div>

                <div v-if="contactHeroPills.length" class="contact-databook__pill-row">
                  <q-badge
                    v-for="pill in contactHeroPills"
                    :key="pill.label"
                    class="contact-databook__pill"
                  >
                    {{ pill.label }}
                  </q-badge>
                </div>

                <div v-if="contactActionLinks.length" class="contact-databook__actions">
                  <q-btn
                    v-for="link in contactActionLinks"
                    :key="link.label"
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="contact-databook__action"
                    :href="link.href"
                    :target="link.external ? '_blank' : undefined"
                    :rel="link.external ? 'noopener noreferrer' : undefined"
                  >
                    <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                    <span>{{ link.label }}</span>
                  </q-btn>
                </div>

              </div>
            </div>

            <div class="contact-databook__summary">
              <div class="contact-databook__summary-label">Relationship snapshot</div>
              <div class="contact-databook__summary-grid">
                <div
                  v-for="stat in contactSummaryStats"
                  :key="stat.label"
                  class="contact-databook__summary-item"
                >
                  <div class="contact-databook__summary-item-label">{{ stat.label }}</div>
                  <div class="contact-databook__summary-item-value">{{ stat.value }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="contact-databook__nav" aria-label="Contact sections">
            <button
              v-for="section in contactNavItems"
              :key="section.anchor"
              type="button"
              class="contact-databook__nav-item"
              :class="{ 'contact-databook__nav-item--active': activeContactSection === section.anchor }"
              @click="activeContactSection = section.anchor"
            >
              {{ section.title }}
            </button>
          </section>

          <section class="contact-databook__details">
            <article v-if="activeContentSection" class="contact-section-card contact-section-card--active">
              <div class="contact-section-card__header">
                <div>
                  <div class="contact-section-card__eyebrow">{{ activeContentSection.category }}</div>
                  <h2 class="contact-section-card__title">{{ activeContentSection.title }}</h2>
                </div>
                <div class="contact-section-card__caption">{{ activeContentSection.caption }}</div>
              </div>

              <q-banner
                v-if="!activeContentSection.fields.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No fields are mapped to this section in the current contact schema yet.
              </q-banner>

              <div v-else-if="activeContentSection.layout === 'note'" class="contact-note-card">
                <template v-if="editMode && activeContentSection.fields[0]">
                  <q-input
                    v-model="draftValues[activeContentSection.fields[0].key]"
                    type="textarea"
                    autogrow
                    outlined
                    :disable="saving || !activeContentSection.fields[0].editable"
                    :placeholder="activeContentSection.fields[0].editable ? 'Add context, notes, or next steps' : ''"
                  />
                </template>
                <template v-else>
                  <p class="contact-note-card__text">
                    {{ displayValue(activeContentSection.fields[0]?.value) }}
                  </p>
                  <div
                    v-if="
                      isHistoricalMode &&
                      activeContentSection.fields[0] &&
                      modifiedByMap[activeContentSection.fields[0].key]
                    "
                    class="contact-section-card__modified"
                  >
                    modified by {{ modifiedByMap[activeContentSection.fields[0].key] }}
                  </div>
                </template>
              </div>

              <div v-else class="contact-field-grid">
                <article
                  v-for="field in activeContentSection.fields"
                  :key="field.key"
                  class="contact-field-card"
                >
                  <div class="contact-field-card__label">{{ field.displayLabel || field.label }}</div>
                  <div
                    v-if="isHistoricalMode && modifiedByMap[field.key]"
                    class="contact-section-card__modified"
                  >
                    modified by {{ modifiedByMap[field.key] }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[field.key]"
                      dense
                      outlined
                      :disable="saving || !field.editable"
                      :placeholder="field.editable ? 'Enter value' : ''"
                    />
                  </template>
                  <template v-else>
                    <div class="contact-field-card__value">
                      {{ displayValue(field.value) }}
                    </div>
                  </template>
                </article>
              </div>
            </article>

            <div v-else-if="activeContactSection === 'system'" class="contact-system-grid">
              <article class="contact-side-card">
                <div class="contact-side-card__eyebrow">System</div>
                <h2 class="contact-side-card__title">Databook status</h2>
                <div class="contact-side-card__meta-list">
                  <div
                    v-for="item in contactMetaItems"
                    :key="item.label"
                    class="contact-side-card__meta-item"
                  >
                    <div class="contact-side-card__meta-label">{{ item.label }}</div>
                    <div class="contact-side-card__meta-value">{{ item.value }}</div>
                  </div>
                </div>
              </article>

              <article v-if="visibleSystemFields.length" class="contact-side-card">
                <div class="contact-side-card__eyebrow">Full record</div>
                <h2 class="contact-side-card__title">System fields</h2>
                <div class="contact-side-card__stack">
                  <div
                    v-for="field in visibleSystemFields"
                    :key="field.key"
                    class="contact-side-card__field"
                  >
                    <div class="contact-field-card__label">{{ field.label }}</div>
                    <div
                      v-if="isHistoricalMode && modifiedByMap[field.key]"
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[field.key] }}
                    </div>
                    <template v-if="editMode">
                      <q-input
                        v-model="draftValues[field.key]"
                        dense
                        outlined
                        :disable="saving || !field.editable"
                        :placeholder="field.editable ? 'Enter value' : ''"
                      />
                    </template>
                    <template v-else>
                      <div class="contact-field-card__value">
                        {{ displayValue(field.value) }}
                      </div>
                    </template>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <q-list v-else bordered separator>
          <q-item v-for="field in fields" :key="field.key">
            <q-item-section>
              <q-item-label caption class="text-weight-medium">{{ field.section }}</q-item-label>
              <q-item-label class="text-caption text-grey-7">{{ field.label }}</q-item-label>
              <q-item-label
                v-if="isHistoricalMode && modifiedByMap[field.key]"
                class="text-caption text-negative text-italic"
              >
                modified by {{ modifiedByMap[field.key] }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="databook-value-section">
              <template v-if="editMode">
                <q-input
                  v-model="draftValues[field.key]"
                  dense
                  outlined
                  :disable="saving || !field.editable"
                  :placeholder="field.editable ? 'Enter value' : ''"
                />
              </template>
              <template v-else>
                <div class="text-body2 databook-value">{{ displayValue(field.value) }}</div>
              </template>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <q-banner v-else-if="!loading" class="bg-grey-2 text-black" rounded>
        No Databook fields available for this record.
      </q-banner>

      <q-page-sticky position="top-right" :offset="[18, 18]">
        <div class="row q-gutter-sm">
          <q-btn-dropdown color="secondary" label="Versions" :disable="loading || saving || !hasVersionBridge">
            <q-list style="min-width: 260px">
              <q-item clickable v-close-popup @click="switchToLatestVersion">
                <q-item-section>
                  <q-item-label>Latest</q-item-label>
                  <q-item-label caption>Current editable databook</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-for="v in versions" :key="v.id" clickable v-close-popup @click="openVersion(v.id)">
                <q-item-section>
                  <q-item-label>{{ v.created_at }}</q-item-label>
                  <q-item-label caption>by {{ v.created_by_label || 'Unknown editor' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            round
            color="primary"
            :icon="editMode ? 'close' : 'edit'"
            :disable="loading || saving || !fields.length || isHistoricalMode"
            @click="editMode ? cancelEdit() : enterEditMode()"
          />
        </div>
      </q-page-sticky>

      <q-page-sticky v-if="editMode" position="bottom" :offset="[0, 16]">
        <q-banner class="bg-grey-10 text-white q-pa-sm rounded-borders">
          <div class="row items-center q-gutter-sm">
            <div class="col">Edit mode enabled. Save or cancel your changes.</div>
            <q-btn dense color="positive" label="Save" :loading="saving" @click="saveChanges" />
            <q-btn dense flat color="white" label="Cancel" :disable="saving" @click="cancelEdit" />
          </div>
        </q-banner>
      </q-page-sticky>

      <q-dialog v-model="showUserLabelDialog" persistent>
        <q-card style="min-width: 360px">
          <q-card-section>
            <div class="text-h6">Set Editor Name</div>
            <div class="text-caption text-grey-7">
              A display name is required before saving audited changes. You can also update it
              later in Settings.
            </div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="userLabelInput"
              autofocus
              outlined
              dense
              label="Display name"
              :disable="savingUserLabel"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" :disable="savingUserLabel" @click="showUserLabelDialog = false" />
            <q-btn color="primary" label="Save" :loading="savingUserLabel" @click="saveUserLabel" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <input
        ref="contactImageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onContactImageSelected"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const TABLE_LABELS = {
  Companies: 'Company',
  Contacts: 'Contact',
  Opportunities: 'Opportunity',
  Pipelines: 'Pipeline',
}

const TABLE_LIST_ROUTES = {
  Companies: { routeName: 'companies', label: 'Back to Companies' },
  Contacts: { routeName: 'contacts', label: 'Back to Contacts' },
  Opportunities: { routeName: 'opportunities', label: 'Back to Opportunities' },
  Pipelines: { routeName: 'pipelines', label: 'Back to Pipelines' },
}

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.databooks?.view &&
    !!bridge.value?.databooks?.update &&
    !!bridge.value?.audit?.me,
)
const hasVersionBridge = computed(
  () =>
    !!bridge.value?.databooks?.versions &&
    !!bridge.value?.databooks?.viewSnapshot &&
    !!bridge.value?.audit?.events,
)

const loading = ref(false)
const error = ref('')
const fields = ref([])
const currentView = ref(null)
const actor = ref(null)
const editMode = ref(false)
const saving = ref(false)
const draftValues = ref({})
const showUserLabelDialog = ref(false)
const userLabelInput = ref('')
const savingUserLabel = ref(false)
const versions = ref([])
const selectedVersionId = ref(null)
const modifiedByMap = ref({})
const activeContactSection = ref('general-info')
const contactImageInput = ref(null)
const uploadingContactImage = ref(false)

const isHistoricalMode = computed(() => !!selectedVersionId.value)
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const entityLabel = computed(
  () => currentView.value?.entity_label || TABLE_LABELS[tableNameParam.value] || 'Record',
)
const databookTitle = computed(() => {
  const name = String(currentView.value?.entity_name || '').trim()
  if (name) return `${name} Databook`
  return recordIdParam.value ? `${recordIdParam.value} Databook` : 'Databook'
})
const backLink = computed(
  () => TABLE_LIST_ROUTES[currentView.value?.table_name || tableNameParam.value] || null,
)
const isContactView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Contacts',
)
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [field.field_name, field])),
)
const contactImageField = computed(() => fieldByName.value.Profile_Image || null)
const contactName = computed(() => getFieldDisplayValue('Name'))
const contactRole = computed(() => getFieldDisplayValue('Role'))
const contactAvatarImage = computed(() =>
  getFieldDisplayValue('Profile_Image') ||
  buildAvatarImage(contactName.value || getFieldDisplayValue('Email') || 'Contact'),
)
const hasContactCustomImage = computed(() => String(getFieldDisplayValue('Profile_Image') || '').trim().length > 0)
const contactHeroPills = computed(() =>
  [
    getContactPill('Stakeholder_type', 'Stakeholder'),
    getContactPill('Closeness_Level', 'Closeness'),
    getContactPill('Country_based', 'Based in'),
  ].filter(Boolean),
)
const contactSummaryStats = computed(() => [
  { label: 'Preferred channel', value: getFieldDisplayValue('Email') || 'Not set' },
  { label: 'Phone', value: getFieldDisplayValue('Phone') || 'Not set' },
  { label: 'LinkedIn', value: getFieldDisplayValue('LinkedIn') || 'Not set' },
  { label: 'Updated', value: getFieldDisplayValue('updated_at') || 'Unknown' },
])
const contactActionLinks = computed(() => {
  const email = getFieldDisplayValue('Email')
  const phone = getFieldDisplayValue('Phone')
  const linkedIn = getFieldDisplayValue('LinkedIn')
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
})
const contactSections = computed(() => {
  const sections = [
    createContactSection({
      anchor: 'general-info',
      category: 'General info',
      title: 'General info',
      caption: 'Core contact details and the main ways to reach this person.',
      fieldConfigs: [
        { label: 'Name', aliases: ['Name'] },
        { label: 'Personal email', aliases: ['Personal_Email'] },
        { label: 'Business email', aliases: ['Business_Email', 'Email'] },
        { label: 'Phone', aliases: ['Phone'] },
        { label: 'Country based', aliases: ['Country_based'] },
        { label: 'LinkedIn', aliases: ['LinkedIn'] },
      ],
    }),
    createContactSection({
      anchor: 'employment',
      category: 'Employment',
      title: 'Employment',
      caption: 'Current role, tenure, expertise, and company context.',
      fieldConfigs: [
        { label: 'Previous companies', aliases: ['Previous_Companies'] },
        { label: 'Current companies', aliases: ['Current_Companies'] },
        { label: 'Tenure at firm', aliases: ['Tenure_at_Firm', 'Tenure_at_Firm_yrs'] },
        { label: 'Current roles', aliases: ['Current_Roles', 'Role'] },
        { label: 'Expertise', aliases: ['Expertise'] },
      ],
    }),
    createContactSection({
      anchor: 'studies',
      category: 'Studies',
      title: 'Studies',
      caption: 'Education background, program history, and professional credentials.',
      fieldConfigs: [
        { label: 'Degrees / Program', aliases: ['Degrees_Program'] },
        { label: 'University', aliases: ['University'] },
        { label: 'Credentials', aliases: ['Credentials'] },
      ],
    }),
    createContactSection({
      anchor: 'other',
      category: 'Other',
      title: 'Other',
      caption: 'Open notes and supporting context that does not fit the other groups.',
      fieldConfigs: [{ label: 'Comments', aliases: ['Comments', 'Comment'] }],
      layout: 'note',
    }),
  ]

  return sections
})
const contactNavItems = computed(() => [
  ...contactSections.value.map((section) => ({ anchor: section.anchor, title: section.title })),
  { anchor: 'system', title: 'System' },
])
const activeContentSection = computed(
  () => contactSections.value.find((section) => section.anchor === activeContactSection.value) || null,
)
const contactMetaItems = computed(() => [
  { label: 'Record ID', value: getFieldDisplayValue('id') || recordIdParam.value || '-' },
  { label: 'Created', value: getFieldDisplayValue('created_at') || 'Unknown' },
  { label: 'Last updated', value: getFieldDisplayValue('updated_at') || 'Unknown' },
  { label: 'Mode', value: isHistoricalMode.value ? 'Historical snapshot' : 'Live databook' },
])
const visibleSystemFields = computed(() => {
  const systemFields = ['id', 'created_at', 'updated_at']
    .map((fieldName) => fieldByName.value[fieldName])
    .filter(Boolean)

  if (editMode.value) return systemFields
  return systemFields.filter((field) => String(field.value || '').trim())
})

function displayValue(value) {
  const text = String(value || '').trim()
  return text.length ? text : '-'
}

function getFieldDisplayValue(fieldName) {
  const field = fieldByName.value[fieldName]
  if (!field) return ''
  if (!editMode.value) return String(field.value || '').trim()
  return String(draftValues.value[field.key] ?? field.value ?? '').trim()
}

function getContactPill(fieldName, prefix) {
  const value = getFieldDisplayValue(fieldName)
  if (!value) return null
  return { label: `${prefix}: ${value}` }
}

function resolveContactField(config = {}) {
  const aliases = Array.isArray(config.aliases) ? config.aliases : []
  const field = aliases.map((alias) => fieldByName.value[alias]).find(Boolean)
  if (!field) return null
  return {
    ...field,
    displayLabel: config.label || field.label,
  }
}

function createContactSection({ anchor, category, title, caption, fieldConfigs, layout = 'grid' }) {
  const sectionFields = (fieldConfigs || []).map(resolveContactField).filter(Boolean)

  return {
    anchor,
    category,
    title,
    caption,
    layout,
    fields: sectionFields,
  }
}

function normalizeExternalUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

function buildAvatarImage(labelValue) {
  const label = String(labelValue || 'Contact').trim()
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() || '')
    .join('') || 'C'

  const palettes = [
    ['#111111', '#404040'],
    ['#ff5521', '#ff8c42'],
    ['#2647ff', '#5a6fff'],
    ['#1d1d1b', '#757575'],
  ]
  const [start, end] = palettes[Math.abs(hashString(label)) % palettes.length]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="176" height="176" viewBox="0 0 176 176">
      <defs>
        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="176" height="176" rx="44" fill="url(#avatarGradient)" />
      <text x="88" y="98" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${escapeSvg(initials)}</text>
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

function normalizeIpcErrorMessage(errorValue) {
  const raw = String(errorValue?.message || errorValue || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

function enterEditMode() {
  const next = {}
  for (const field of fields.value) next[field.key] = field.value == null ? '' : String(field.value)
  draftValues.value = next
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  draftValues.value = {}
}

async function refreshActor() {
  if (!hasBridge.value) return
  actor.value = await bridge.value.audit.me()
  userLabelInput.value = String(actor.value?.user_label || '')
}

async function saveUserLabel() {
  const userLabel = String(userLabelInput.value || '').trim()
  if (!userLabel) return
  savingUserLabel.value = true
  try {
    actor.value = await bridge.value.audit.setUserLabel(userLabel)
    showUserLabelDialog.value = false
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    savingUserLabel.value = false
  }
}

async function ensureActorReadyForSave() {
  if (!hasBridge.value) return false
  if (actor.value?.user_label) return true
  await refreshActor()
  if (actor.value?.user_label) return true
  showUserLabelDialog.value = true
  return false
}

async function applyDatabookChanges(changes, { syncDraftFieldNames = [], exitEditMode = false } = {}) {
  if (!hasBridge.value) return false
  if (!tableNameParam.value || !recordIdParam.value) return false
  if (!Array.isArray(changes) || changes.length === 0) return true
  if (!(await ensureActorReadyForSave())) return false

  saving.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.update({
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
      changes,
    })
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : []
    if (editMode.value && syncDraftFieldNames.length) {
      const nextDraft = { ...draftValues.value }
      for (const fieldName of syncDraftFieldNames) {
        const field = fields.value.find((candidate) => candidate.field_name === fieldName)
        if (!field) continue
        nextDraft[field.key] = field.value == null ? '' : String(field.value)
      }
      draftValues.value = nextDraft
    }
    if (exitEditMode) cancelEdit()
    await loadVersions()
    return true
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
    if (/user label|user profile/i.test(message)) showUserLabelDialog.value = true
    return false
  } finally {
    saving.value = false
  }
}

async function saveChanges() {
  const changes = fields.value
    .filter((field) => field.editable)
    .map((field) => {
      const previousValue = field.value == null ? '' : String(field.value)
      const nextValue = draftValues.value[field.key] == null ? '' : String(draftValues.value[field.key])
      if (previousValue === nextValue) return null
      return {
        table_name: field.table_name,
        record_id: field.record_id,
        field_name: field.field_name,
        id_column: field.id_column,
        new_value: nextValue,
      }
    })
    .filter(Boolean)

  await applyDatabookChanges(changes, { exitEditMode: true })
}

async function loadDatabook() {
  if (!hasBridge.value) return
  if (!tableNameParam.value || !recordIdParam.value) {
    currentView.value = null
    fields.value = []
    versions.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.view(tableNameParam.value, recordIdParam.value)
    currentView.value = result || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
    selectedVersionId.value = null
    modifiedByMap.value = {}
    cancelEdit()
    await loadVersions()
    await refreshActor()
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
    currentView.value = null
    fields.value = []
    versions.value = []
  } finally {
    loading.value = false
  }
}

async function loadVersions() {
  if (!hasVersionBridge.value || !tableNameParam.value || !recordIdParam.value) return
  try {
    const result = await bridge.value.databooks.versions(tableNameParam.value, recordIdParam.value)
    versions.value = Array.isArray(result?.versions) ? result.versions : []
  } catch {
    versions.value = []
  }
}

function fieldMapByKey(list = []) {
  return Object.fromEntries((Array.isArray(list) ? list : []).map((field) => [field.key, field]))
}

function eventKey(field = {}) {
  return `${field.table_name || ''}|${field.record_id || ''}|${field.field_name || ''}`
}

async function openVersion(snapshotId) {
  if (!hasVersionBridge.value) return
  const sid = String(snapshotId || '').trim()
  if (!sid) return
  try {
    const snapshot = await bridge.value.databooks.viewSnapshot(sid)
    const versionPayload = snapshot?.payload || {}
    const versionFields = Array.isArray(versionPayload?.fields) ? versionPayload.fields : []
    const versionIndex = versions.value.findIndex((version) => version.id === sid)
    const priorVersion = versionIndex >= 0 ? versions.value[versionIndex + 1] : null

    const changedKeys = []
    if (priorVersion?.id) {
      const priorSnapshot = await bridge.value.databooks.viewSnapshot(priorVersion.id)
      const prevMap = fieldMapByKey(priorSnapshot?.payload?.fields || [])
      const currMap = fieldMapByKey(versionFields)
      for (const [key, currField] of Object.entries(currMap)) {
        const prevField = prevMap[key]
        if (String(prevField?.value ?? '') !== String(currField?.value ?? '')) changedKeys.push(key)
      }
    }

    const mods = {}
    if (changedKeys.length) {
      const selectedVersion = versions.value.find((version) => version.id === sid)
      const eventsResult = await bridge.value.audit.events({
        table_name: snapshot?.table_name || versionPayload?.table_name || tableNameParam.value,
        record_id: snapshot?.record_id || versionPayload?.record_id || recordIdParam.value,
        since: priorVersion?.created_at || null,
        until: selectedVersion?.created_at || null,
        limit: 1000,
      })
      const events = Array.isArray(eventsResult?.events) ? eventsResult.events : []
      const latestEventByKey = {}
      for (const eventRow of events) {
        const key = `${eventRow.table_name || ''}|${eventRow.record_id || ''}|${eventRow.field_name || ''}`
        if (!latestEventByKey[key]) latestEventByKey[key] = eventRow
      }
      for (const key of changedKeys) {
        const field = versionFields.find((candidate) => candidate.key === key)
        if (!field) continue
        const eventRow = latestEventByKey[eventKey(field)]
        mods[key] = eventRow?.edited_by_label || snapshot?.created_by_label || 'Unknown editor'
      }
    }

    selectedVersionId.value = sid
    editMode.value = false
    draftValues.value = {}
    currentView.value = versionPayload
    fields.value = versionFields
    modifiedByMap.value = mods
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  }
}

async function switchToLatestVersion() {
  selectedVersionId.value = null
  modifiedByMap.value = {}
  await loadDatabook()
}

function triggerContactImagePicker() {
  contactImageInput.value?.click?.()
}

async function onContactImageSelected(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  try {
    if (!contactImageField.value) throw new Error('Profile image field is not available for this contact.')
    if (!String(file.type || '').startsWith('image/')) {
      throw new Error('Please select an image file.')
    }

    uploadingContactImage.value = true
    const imageData = await readFileAsDataUrl(file)
    const saved = await applyDatabookChanges(
      [
        {
          table_name: contactImageField.value.table_name,
          record_id: contactImageField.value.record_id,
          field_name: contactImageField.value.field_name,
          id_column: contactImageField.value.id_column,
          new_value: imageData,
        },
      ],
      { syncDraftFieldNames: ['Profile_Image'] },
    )
    if (saved) {
      $q.notify({ type: 'positive', message: 'Contact image updated.' })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    uploadingContactImage.value = false
    if (contactImageInput.value) contactImageInput.value.value = ''
  }
}

async function removeContactImage() {
  if (!contactImageField.value) return
  uploadingContactImage.value = true
  try {
    const saved = await applyDatabookChanges(
      [
        {
          table_name: contactImageField.value.table_name,
          record_id: contactImageField.value.record_id,
          field_name: contactImageField.value.field_name,
          id_column: contactImageField.value.id_column,
          new_value: '',
        },
      ],
      { syncDraftFieldNames: ['Profile_Image'] },
    )
    if (saved) {
      $q.notify({ type: 'positive', message: 'Contact image removed.' })
    }
  } finally {
    uploadingContactImage.value = false
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

watch(
  () => `${route.params.tableName || ''}:${route.params.recordId || ''}`,
  () => {
    loadDatabook()
  },
)

onMounted(() => {
  if (!hasBridge.value) return
  loadDatabook()
})
</script>

<style scoped>
.databook-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.databook-heading {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  justify-content: space-between;
}

.databook-heading__back {
  flex: 0 0 auto;
  color: #111;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
}

.databook-heading__eyebrow {
  margin-bottom: 6px;
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.databook-heading__title {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.databook-heading__subtitle {
  max-width: 640px;
  margin-top: 10px;
  color: #5f5f5f;
  font-family: var(--font-body);
  font-size: var(--text-base---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-databook {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-databook__nav {
  position: sticky;
  top: 76px;
  z-index: 3;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(14px);
}

.contact-databook__nav-item {
  padding: 10px 16px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-databook__nav-item:hover {
  color: #111;
  background: rgba(255, 85, 33, 0.08);
  border-color: rgba(255, 85, 33, 0.2);
  transform: translateY(-1px);
}

.contact-databook__nav-item--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.contact-databook__details {
  display: flex;
  flex-direction: column;
}

.contact-databook__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.88fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 85, 33, 0.2), transparent 34%),
    radial-gradient(circle at 85% 20%, rgba(38, 71, 255, 0.12), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
}

.contact-databook__hero::after {
  position: absolute;
  right: -48px;
  bottom: -48px;
  width: 180px;
  height: 180px;
  content: '';
  background: rgba(235, 255, 90, 0.45);
  border-radius: 50%;
  filter: blur(10px);
}

.contact-databook__hero-main,
.contact-databook__summary {
  position: relative;
  z-index: 1;
}

.contact-databook__hero-main {
  display: flex;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 420px;
}

.contact-databook__portrait {
  position: relative;
  flex: 0 0 clamp(280px, 26vw, 370px);
  width: clamp(280px, 26vw, 370px);
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: #d8d4ca;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px 0 0 24px;
  box-shadow: none;
}

.contact-databook__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(17, 17, 17, 0.18) 100%);
  pointer-events: none;
}

.contact-databook__portrait-actions {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-databook__portrait-action {
  color: #111;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.2);
}

.contact-databook__portrait-action :deep(.q-btn__content) {
  min-width: 0;
  min-height: 0;
}

.contact-databook__portrait-action :deep(.q-icon) {
  font-size: 13px;
}

.contact-databook__portrait-menu {
  border-radius: 14px;
  overflow: hidden;
}

.contact-databook__portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(1) contrast(1.08);
}

.contact-databook__hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: 36px 36px 34px 16px;
}

.contact-databook__eyebrow,
.contact-section-card__eyebrow,
.contact-side-card__eyebrow,
.contact-databook__summary-label {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.contact-databook__name {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 4vw, 3.75rem);
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.contact-databook__role {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-databook__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-databook__pill {
  padding: 7px 10px;
  color: #111;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
}

.contact-databook__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.contact-databook__action {
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
}

.contact-databook__summary {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: 20px;
  background: rgba(17, 17, 17, 0.94);
  border-radius: 20px;
  color: #fff;
}

.contact-databook__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.contact-databook__summary-item {
  padding: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.contact-databook__summary-item-label {
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 16px;
}

.contact-databook__summary-item-value {
  margin-top: 8px;
  word-break: break-word;
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.contact-insight-card,
.contact-section-card,
.contact-side-card {
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(17, 17, 17, 0.05);
}

.contact-insight-card {
  min-height: 100%;
  padding: 18px;
}

.contact-insight-card__label {
  color: #757575;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.1em;
  line-height: 16px;
  text-transform: uppercase;
}

.contact-insight-card__value {
  margin-top: 12px;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-xl---black);
  font-weight: var(--font-weight-black);
  line-height: 1.1;
}

.contact-section-card,
.contact-side-card {
  padding: 22px;
  scroll-margin-top: 152px;
}

.contact-system-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.contact-section-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.contact-section-card__title,
.contact-side-card__title {
  margin: 6px 0 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-2xl---black);
  font-weight: var(--font-weight-black);
  line-height: 1.05;
}

.contact-section-card__caption {
  max-width: 260px;
  color: #707070;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 20px;
  text-align: right;
}

.contact-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.contact-field-card,
.contact-side-card__field,
.contact-side-card__meta-item {
  padding: 14px 16px;
  background: #fbfbfb;
  border: 1px solid rgba(17, 17, 17, 0.06);
  border-radius: 16px;
}

.contact-field-card__label,
.contact-side-card__meta-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 16px;
  text-transform: uppercase;
}

.contact-field-card__value,
.contact-side-card__meta-value,
.contact-note-card__text {
  margin-top: 10px;
  word-break: break-word;
  white-space: pre-wrap;
  color: #171717;
  font-family: var(--font-body);
  font-size: var(--text-base---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-section-card__modified {
  margin-top: 8px;
  color: #b42318;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-style: italic;
  line-height: 16px;
}

.contact-section-card__empty {
  border: 1px dashed rgba(17, 17, 17, 0.12);
}

.contact-note-card {
  padding: 18px;
  background: linear-gradient(180deg, #fffdf7 0%, #ffffff 100%);
  border: 1px solid rgba(255, 85, 33, 0.12);
  border-radius: 18px;
}

.contact-note-card__text {
  margin: 0;
}

.contact-side-card__meta-list,
.contact-side-card__stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.databook-value-section {
  min-width: 360px;
  max-width: 640px;
  width: 100%;
}

.databook-value {
  text-align: left;
  white-space: pre-wrap;
}

@media (max-width: 1100px) {
  .contact-databook__hero {
    grid-template-columns: 1fr;
  }

  .contact-section-card__header {
    flex-direction: column;
  }

  .contact-section-card__caption {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 720px) {
  .databook-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .databook-heading__title {
    font-size: 2.25rem;
  }

  .contact-databook__hero {
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .contact-databook__nav {
    top: 68px;
  }

  .contact-databook__hero-main {
    flex-direction: column;
    min-height: 0;
  }

  .contact-databook__portrait {
    width: 100%;
    min-height: 320px;
    flex-basis: auto;
    border-right: none;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 20px 20px 0 0;
  }

  .contact-databook__hero-copy {
    padding: 20px;
  }

  .contact-databook__summary {
    margin: 0 20px 20px;
  }

  .contact-databook__summary-grid,
  .contact-field-grid {
    grid-template-columns: 1fr;
  }

  .contact-system-grid {
    grid-template-columns: 1fr;
  }

  .contact-section-card,
  .contact-side-card {
    padding: 18px;
  }

  .databook-value-section {
    min-width: 100%;
  }
}
</style>
