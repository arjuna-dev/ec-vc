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
      <div class="databook-heading" :class="{ 'databook-heading--compact': isContactView }">
        <div class="databook-heading__main">
          <div>
            <div class="databook-heading__eyebrow">{{ entityLabel }} databook</div>
            <template v-if="isContactView">
              <div class="databook-heading__subtitle">
                Version history and edit controls for this contact record.
              </div>
            </template>
            <template v-else>
              <div class="databook-heading__title">{{ databookTitle }}</div>
              <div class="databook-heading__subtitle">
                Review the full record, make edits in one place, and save a new audited snapshot.
              </div>
            </template>
          </div>
        </div>

        <div class="databook-heading__actions">
          <q-btn
            v-if="backLink"
            flat
            no-caps
            icon="arrow_back"
            class="databook-heading__back databook-heading__action"
            :label="backLink.label"
            @click="router.push({ name: backLink.routeName })"
          />

          <q-btn-dropdown
            no-caps
            unelevated
            class="databook-heading__action databook-heading__action--versions"
            label="Versions"
            :disable="loading || saving || !hasVersionBridge"
          >
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
            no-caps
            unelevated
            class="databook-heading__action databook-heading__action--edit"
            :icon="editMode ? 'close' : 'edit'"
            :label="editMode ? 'Close edit' : 'Edit'"
            :disable="loading || saving || !fields.length || isHistoricalMode"
            @click="editMode ? cancelEdit() : enterEditMode()"
          />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <template v-if="fields.length">
        <div v-if="isContactView" class="contact-databook">
          <section
            ref="contactHeroRef"
            class="contact-databook__hero"
            :style="contactHeroStyle"
            @pointermove="onContactHeroPointerMove"
            @pointerleave="onContactHeroPointerLeave"
          >
            <div class="contact-databook__hero-main">
              <figure class="contact-databook__portrait">
                <img
                  v-if="hasContactCustomImage"
                  class="contact-databook__portrait-image"
                  :src="contactAvatarImage"
                  :alt="contactName || 'Contact portrait'"
                />
                <div v-else class="contact-databook__portrait-placeholder" aria-hidden="true">
                  <q-icon name="account_circle" class="contact-databook__portrait-placeholder-icon" />
                </div>
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
              <div class="contact-databook__summary-header">
                <div class="contact-databook__summary-label">Relationship snapshot</div>
                <q-btn
                  round
                  flat
                  dense
                  icon="add"
                  aria-label="Customize relationship snapshot"
                  class="contact-databook__summary-add"
                >
                  <q-menu
                    anchor="bottom right"
                    self="top right"
                    class="contact-databook__summary-menu"
                  >
                    <q-list dense style="min-width: 220px">
                      <q-item-label header>Snapshot fields</q-item-label>
                      <q-item
                        v-for="option in availableContactSummaryOptions"
                        :key="option.id"
                        clickable
                        @click="toggleContactSummaryStat(option.id)"
                      >
                        <q-item-section>{{ option.label }}</q-item-section>
                        <q-item-section side>
                          <q-icon :name="isContactSummaryStatSelected(option.id) ? 'check' : 'add'" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <div v-if="contactSummaryStats.length" class="contact-databook__summary-grid">
                <div
                  v-for="stat in contactSummaryStats"
                  :key="stat.id"
                  class="contact-databook__summary-item"
                >
                  <div class="contact-databook__summary-item-label">{{ stat.label }}</div>
                  <div class="contact-databook__summary-item-value">{{ stat.displayValue }}</div>
                </div>
              </div>
              <div v-if="contactNotes.length" class="contact-databook__summary-notes-panel">
                <div class="contact-databook__summary-notes-label">Latest notes</div>
                <ul class="contact-databook__summary-notes">
                  <li
                    v-for="note in contactNotes"
                    :key="note.id"
                    class="contact-databook__summary-note"
                  >
                    <div class="contact-databook__summary-note-row">
                      <div class="contact-databook__summary-note-title">{{ note.title }}</div>
                      <div class="contact-databook__summary-note-meta">{{ note.created_at }}</div>
                    </div>
                    <div v-if="note.content" class="contact-databook__summary-note-content">
                      {{ note.content }}
                    </div>
                  </li>
                </ul>
              </div>
              <div v-else-if="!contactSummaryStats.length" class="contact-databook__summary-empty">
                Use the + button to add the contact details you want to keep in view here.
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
                <div class="contact-section-card__intro">
                  <h2 class="contact-section-card__title">{{ activeContentSection.title }}</h2>
                  <div v-if="activeContentSection.caption" class="contact-section-card__caption">
                    {{ activeContentSection.caption }}
                  </div>
                </div>
                <svg
                  v-if="activeContentSection.icon"
                  class="contact-section-card__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    v-for="(shape, index) in activeContentSection.icon.circles || []"
                    :key="`circle-${index}`"
                    :cx="shape.cx"
                    :cy="shape.cy"
                    :r="shape.r"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    v-for="(shape, index) in activeContentSection.icon.paths || []"
                    :key="`path-${index}`"
                    :d="shape"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>

              <q-banner
                v-if="!activeContentSection.fields.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No fields are mapped to this section in the current contact schema yet.
              </q-banner>

              <div v-else-if="activeContentSection.layout === 'note'" class="contact-field-grid contact-field-grid--single">
                <article
                  v-if="activeContentSection.fields[0]"
                  class="contact-field-card contact-field-card--note"
                >
                  <div class="contact-field-card__label">
                    {{
                      activeContentSection.fields[0].displayLabel || activeContentSection.fields[0].label
                    }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[activeContentSection.fields[0].key]"
                      type="textarea"
                      autogrow
                      outlined
                      class="contact-field-card__input"
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
                        modifiedByMap[activeContentSection.fields[0].key]
                      "
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[activeContentSection.fields[0].key] }}
                    </div>
                  </template>
                </article>
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
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">Databook status</h2>
                    <div class="contact-side-card__eyebrow">System</div>
                  </div>
                </div>
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
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">System fields</h2>
                    <div class="contact-side-card__eyebrow">Full record</div>
                  </div>
                </div>
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

      <q-dialog v-model="showContactImageCropDialog" persistent>
        <q-card class="contact-image-cropper-dialog">
          <q-card-section>
            <div class="text-h6">Crop image</div>
            <div class="text-caption text-grey-7">
              Drag to reposition and use zoom to fit the portrait frame.
            </div>
          </q-card-section>

          <q-card-section class="contact-image-cropper-dialog__body">
            <div class="contact-image-cropper" @pointerdown="startContactImageCropDrag">
              <div class="contact-image-cropper__frame">
                <img
                  v-if="pendingContactImageSrc"
                  :src="pendingContactImageSrc"
                  alt="Selected contact portrait"
                  class="contact-image-cropper__image"
                  :style="contactImageCropStyle"
                  draggable="false"
                />
                <div class="contact-image-cropper__overlay" />
              </div>
            </div>

            <div class="contact-image-cropper__controls">
              <div class="text-caption text-grey-7">Zoom</div>
              <q-slider
                v-model="contactImageCropZoom"
                :min="1"
                :max="3"
                :step="0.01"
                color="primary"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" :disable="uploadingContactImage" @click="cancelContactImageCrop" />
            <q-btn
              color="primary"
              label="Save image"
              :loading="uploadingContactImage"
              @click="confirmContactImageCrop"
            />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const DEFAULT_CONTACT_SUMMARY_STAT_IDS = ['role', 'stakeholder', 'country', 'phone']
const CONTACT_IMAGE_CROP_FRAME_WIDTH = 280
const CONTACT_IMAGE_CROP_FRAME_HEIGHT = 420
const CONTACT_IMAGE_OUTPUT_WIDTH = 800
const CONTACT_IMAGE_OUTPUT_HEIGHT = 1200
const CONTACT_HERO_GRADIENT_DEFAULT = {
  x: 88,
  y: 14,
  size: 52,
}
const CONTACT_SUMMARY_OPTIONS = [
  { id: 'role', label: 'Current role', aliases: ['Current_Roles', 'Role'] },
  { id: 'company', label: 'Current company', aliases: ['Current_Companies'] },
  { id: 'expertise', label: 'Expertise', aliases: ['Expertise'] },
  { id: 'stakeholder', label: 'Stakeholder type', aliases: ['Stakeholder_type'] },
  { id: 'closeness', label: 'Closeness level', aliases: ['Closeness_Level'] },
  { id: 'country', label: 'Based in', aliases: ['Country_based'] },
  { id: 'phone', label: 'Phone', aliases: ['Phone'] },
  { id: 'email', label: 'Business email', aliases: ['Business_Email', 'Email'] },
  { id: 'personal-email', label: 'Personal email', aliases: ['Personal_Email'] },
  { id: 'linkedin', label: 'LinkedIn', aliases: ['LinkedIn'] },
  { id: 'tenure', label: 'Tenure at firm', aliases: ['Tenure_at_Firm', 'Tenure_at_Firm_yrs'] },
  { id: 'university', label: 'University', aliases: ['University'] },
  { id: 'credentials', label: 'Credentials', aliases: ['Credentials'] },
  { id: 'updated', label: 'Updated', aliases: ['updated_at'] },
]

const CONTACT_SECTION_ICONS = {
  person: {
    circles: [{ cx: 12, cy: 7.25, r: 3.15 }],
    paths: ['M5 19.25c1.55-3.45 4.08-5.18 7-5.18s5.45 1.73 7 5.18'],
  },
  briefcase: {
    paths: [
      'M4.75 8.5h14.5a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H4.75A1.75 1.75 0 0 1 3 17.25v-7A1.75 1.75 0 0 1 4.75 8.5Z',
      'M9 8.5V6.75A1.75 1.75 0 0 1 10.75 5h2.5A1.75 1.75 0 0 1 15 6.75V8.5',
      'M3 12.25h18',
    ],
  },
  book: {
    paths: [
      'M6.25 5.25h9.5A2.25 2.25 0 0 1 18 7.5v11.25H8.5A2.5 2.5 0 0 0 6 21.25V7.5a2.25 2.25 0 0 1 2.25-2.25Z',
      'M6 18.75c0-1.38 1.12-2.5 2.5-2.5H18',
      'M9.5 9.25h5',
      'M9.5 12.25h5',
    ],
  },
  note: {
    paths: [
      'M7.25 4.75h9.5A2.25 2.25 0 0 1 19 7v10a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5 17V7a2.25 2.25 0 0 1 2.25-2.25Z',
      'M8.75 9.25h6.5',
      'M8.75 12.25h6.5',
      'M8.75 15.25h4.5',
    ],
  },
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
const contactHeroRef = ref(null)
const contactImageInput = ref(null)
const uploadingContactImage = ref(false)
const showContactImageCropDialog = ref(false)
const pendingContactImageSrc = ref('')
const pendingContactImageNaturalSize = ref({ width: 0, height: 0 })
const contactImageCropZoom = ref(1)
const contactImageCropOffset = ref({ x: 0, y: 0 })
const selectedContactSummaryStatIds = ref([])
const contactNotes = ref([])
const contactHeroGradient = ref({ ...CONTACT_HERO_GRADIENT_DEFAULT })

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
const contactAvatarImage = computed(() => getFieldDisplayValue('Profile_Image'))
const hasContactCustomImage = computed(() => String(getFieldDisplayValue('Profile_Image') || '').trim().length > 0)
const contactImageCropBaseScale = computed(() => {
  const { width, height } = pendingContactImageNaturalSize.value
  if (!width || !height) return 1
  return Math.max(CONTACT_IMAGE_CROP_FRAME_WIDTH / width, CONTACT_IMAGE_CROP_FRAME_HEIGHT / height)
})
const contactImageCropDisplaySize = computed(() => ({
  width: pendingContactImageNaturalSize.value.width * contactImageCropBaseScale.value * contactImageCropZoom.value,
  height:
    pendingContactImageNaturalSize.value.height * contactImageCropBaseScale.value * contactImageCropZoom.value,
}))
const contactImageCropStyle = computed(() => ({
  width: `${contactImageCropDisplaySize.value.width}px`,
  height: `${contactImageCropDisplaySize.value.height}px`,
  transform: `translate(-50%, -50%) translate(${contactImageCropOffset.value.x}px, ${contactImageCropOffset.value.y}px)`,
}))
const contactHeroStyle = computed(() => ({
  '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
  '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
  '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
}))
const contactHeroPills = computed(() =>
  [
    getContactPill('Stakeholder_type', 'Stakeholder'),
    getContactPill('Closeness_Level', 'Closeness'),
    getContactPill('Country_based', 'Based in'),
  ].filter(Boolean),
)
const contactSummaryStorageKey = computed(() => {
  const userKey = normalizeUserLabel(actor.value?.user_label || '') || 'guest'
  return `ecvc.contactSummary.${userKey}`
})
const availableContactSummaryOptions = computed(() =>
  CONTACT_SUMMARY_OPTIONS.map((option) => ({
    ...option,
    value: resolveContactSummaryValue(option),
  })),
)
const contactSummaryStats = computed(() => {
  const selectedIds = new Set(selectedContactSummaryStatIds.value)
  return availableContactSummaryOptions.value
    .filter((option) => selectedIds.has(option.id))
    .map((option) => ({
      ...option,
      displayValue: option.value || 'Not added yet',
    }))
})
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
      icon: CONTACT_SECTION_ICONS.person,
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
      icon: CONTACT_SECTION_ICONS.briefcase,
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
      icon: CONTACT_SECTION_ICONS.book,
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
      icon: CONTACT_SECTION_ICONS.note,
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

function normalizeUserLabel(value) {
  return String(value || '').trim()
}

function resolveContactSummaryValue(option = {}) {
  const aliases = Array.isArray(option.aliases) ? option.aliases : []
  return aliases.map((alias) => getFieldDisplayValue(alias)).find((value) => String(value || '').trim()) || ''
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

function loadContactSummarySelection(storageKey) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function saveContactSummarySelection(storageKey, ids) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids))
  } catch {
    // Ignore storage write failures and keep the in-memory selection.
  }
}

function syncContactSummarySelection() {
  const validIds = CONTACT_SUMMARY_OPTIONS.map((option) => option.id)
  const currentIds = selectedContactSummaryStatIds.value.filter((id) => validIds.includes(id))
  if (currentIds.length) {
    selectedContactSummaryStatIds.value = currentIds
    saveContactSummarySelection(contactSummaryStorageKey.value, currentIds)
    return
  }

  const defaults = DEFAULT_CONTACT_SUMMARY_STAT_IDS.filter((id) => validIds.includes(id))
  const fallback = defaults.length ? defaults : validIds.slice(0, 4)
  selectedContactSummaryStatIds.value = fallback
  saveContactSummarySelection(contactSummaryStorageKey.value, fallback)
}

function isContactSummaryStatSelected(id) {
  return selectedContactSummaryStatIds.value.includes(id)
}

function toggleContactSummaryStat(id) {
  if (!id) return
  const next = selectedContactSummaryStatIds.value.includes(id)
    ? selectedContactSummaryStatIds.value.filter((candidate) => candidate !== id)
    : [...selectedContactSummaryStatIds.value, id]

  selectedContactSummaryStatIds.value = next
  saveContactSummarySelection(contactSummaryStorageKey.value, next)
}

async function loadContactNotes() {
  if (!bridge.value?.notes?.list || !isContactView.value || !recordIdParam.value) {
    contactNotes.value = []
    return
  }

  try {
    const result = await bridge.value.notes.list()
    const notes = Array.isArray(result?.notes) ? result.notes : []
    contactNotes.value = notes
      .filter(
        (note) =>
          String(note?.reference_type || '').trim() === 'contact' &&
          String(note?.reference_id || '').trim() === recordIdParam.value,
      )
      .slice(0, 10)
      .map((note) => ({
        id: note.id,
        title: String(note.title || 'Untitled note').trim() || 'Untitled note',
        content: String(note.content || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 140),
        created_at: formatNoteDate(note.created_at),
      }))
  } catch {
    contactNotes.value = []
  }
}

function formatNoteDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unknown date'
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
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

function createContactSection({ anchor, category, title, icon, caption, fieldConfigs, layout = 'grid' }) {
  const sectionFields = (fieldConfigs || []).map(resolveContactField).filter(Boolean)

  return {
    anchor,
    category,
    title,
    icon,
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
    await loadContactNotes()
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
    currentView.value = null
    fields.value = []
    versions.value = []
    contactNotes.value = []
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
  if (!file) {
    if (contactImageInput.value) contactImageInput.value.value = ''
    return
  }

  try {
    if (!contactImageField.value) throw new Error('Profile image field is not available for this contact.')
    if (!String(file.type || '').startsWith('image/')) {
      throw new Error('Please select an image file.')
    }

    const imageData = await readFileAsDataUrl(file)
    const dimensions = await loadImageDimensions(imageData)
    pendingContactImageSrc.value = imageData
    pendingContactImageNaturalSize.value = dimensions
    contactImageCropZoom.value = 1
    contactImageCropOffset.value = { x: 0, y: 0 }
    showContactImageCropDialog.value = true
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
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

async function saveContactImage(imageData) {
  if (!contactImageField.value) return false
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
  return saved
}

function cancelContactImageCrop() {
  showContactImageCropDialog.value = false
  pendingContactImageSrc.value = ''
  pendingContactImageNaturalSize.value = { width: 0, height: 0 }
  contactImageCropZoom.value = 1
  contactImageCropOffset.value = { x: 0, y: 0 }
}

let contactImageCropDragState = null

function startContactImageCropDrag(event) {
  if (!pendingContactImageSrc.value || uploadingContactImage.value) return
  contactImageCropDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startOffset: { ...contactImageCropOffset.value },
  }
  window.addEventListener('pointermove', onContactImageCropPointerMove)
  window.addEventListener('pointerup', stopContactImageCropDrag)
  window.addEventListener('pointercancel', stopContactImageCropDrag)
}

function clampContactImageCropOffset(offset = { x: 0, y: 0 }) {
  const maxX = Math.max(0, (contactImageCropDisplaySize.value.width - CONTACT_IMAGE_CROP_FRAME_WIDTH) / 2)
  const maxY = Math.max(0, (contactImageCropDisplaySize.value.height - CONTACT_IMAGE_CROP_FRAME_HEIGHT) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

function onContactImageCropPointerMove(event) {
  if (!contactImageCropDragState || event.pointerId !== contactImageCropDragState.pointerId) return
  const dx = event.clientX - contactImageCropDragState.startX
  const dy = event.clientY - contactImageCropDragState.startY
  contactImageCropOffset.value = clampContactImageCropOffset({
    x: contactImageCropDragState.startOffset.x + dx,
    y: contactImageCropDragState.startOffset.y + dy,
  })
}

function stopContactImageCropDrag(event) {
  if (event && contactImageCropDragState && event.pointerId !== contactImageCropDragState.pointerId) return
  contactImageCropDragState = null
  window.removeEventListener('pointermove', onContactImageCropPointerMove)
  window.removeEventListener('pointerup', stopContactImageCropDrag)
  window.removeEventListener('pointercancel', stopContactImageCropDrag)
}

function onContactHeroPointerMove(event) {
  if (!contactHeroRef.value) return
  const rect = contactHeroRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

  contactHeroGradient.value = {
    x: clamp(x, 8, 92),
    y: clamp(y, 8, 92),
    size: 60,
  }
}

function onContactHeroPointerLeave() {
  contactHeroGradient.value = { ...CONTACT_HERO_GRADIENT_DEFAULT }
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Unable to load the selected image.'))
    image.src = src
  })
}

async function renderContactImageCrop() {
  if (!pendingContactImageSrc.value) throw new Error('Select an image before saving.')

  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image()
    nextImage.onload = () => resolve(nextImage)
    nextImage.onerror = () => reject(new Error('Unable to prepare the selected image.'))
    nextImage.src = pendingContactImageSrc.value
  })

  const scale = contactImageCropBaseScale.value * contactImageCropZoom.value
  const drawWidth = pendingContactImageNaturalSize.value.width * scale
  const drawHeight = pendingContactImageNaturalSize.value.height * scale
  const left = CONTACT_IMAGE_CROP_FRAME_WIDTH / 2 - drawWidth / 2 + contactImageCropOffset.value.x
  const top = CONTACT_IMAGE_CROP_FRAME_HEIGHT / 2 - drawHeight / 2 + contactImageCropOffset.value.y
  const sourceX = Math.max(0, (0 - left) / scale)
  const sourceY = Math.max(0, (0 - top) / scale)
  const sourceWidth = Math.min(
    pendingContactImageNaturalSize.value.width - sourceX,
    CONTACT_IMAGE_CROP_FRAME_WIDTH / scale,
  )
  const sourceHeight = Math.min(
    pendingContactImageNaturalSize.value.height - sourceY,
    CONTACT_IMAGE_CROP_FRAME_HEIGHT / scale,
  )

  const canvas = document.createElement('canvas')
  canvas.width = CONTACT_IMAGE_OUTPUT_WIDTH
  canvas.height = CONTACT_IMAGE_OUTPUT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to crop the selected image.')

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    CONTACT_IMAGE_OUTPUT_WIDTH,
    CONTACT_IMAGE_OUTPUT_HEIGHT,
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}

async function confirmContactImageCrop() {
  uploadingContactImage.value = true
  try {
    const croppedImage = await renderContactImageCrop()
    const saved = await saveContactImage(croppedImage)
    if (saved) cancelContactImageCrop()
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
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

watch(contactImageCropZoom, () => {
  contactImageCropOffset.value = clampContactImageCropOffset(contactImageCropOffset.value)
})

watch(
  contactSummaryStorageKey,
  (storageKey) => {
    selectedContactSummaryStatIds.value = loadContactSummarySelection(storageKey)
  },
  { immediate: true },
)

watch(availableContactSummaryOptions, syncContactSummarySelection, { immediate: true })

onMounted(() => {
  if (!hasBridge.value) return
  loadDatabook()
})

onBeforeUnmount(() => {
  stopContactImageCropDrag()
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

.databook-heading--compact {
  align-items: center;
}

.databook-heading__main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
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
  margin-top: 10px;
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

.databook-heading__actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.databook-heading--compact .databook-heading__eyebrow {
  margin-bottom: 2px;
}

.databook-heading--compact .databook-heading__subtitle {
  max-width: 440px;
  margin-top: 0;
  color: #707070;
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.databook-heading--compact .databook-heading__actions {
  align-items: center;
}

.databook-heading__action {
  border-radius: 999px;
}

.databook-heading__action--versions {
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.databook-heading__action--versions:hover,
.databook-heading__action--versions:focus-visible {
  background: #e5e7eb;
}

.databook-heading__action--versions :deep(.q-icon),
.databook-heading__action--versions :deep(.q-btn-dropdown__arrow) {
  color: #6b7280;
}

.databook-heading__action--edit {
  color: #ffffff;
  background: var(--b10-brand-azul);
  border: 1px solid var(--b10-brand-azul);
}

.databook-heading__action--edit:hover,
.databook-heading__action--edit:focus-visible {
  background: #1f3cf3;
  border-color: #1f3cf3;
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
    radial-gradient(
      circle at var(--contact-hero-blob-x) var(--contact-hero-blob-y),
      rgba(38, 71, 255, 0.2) 0%,
      rgba(38, 71, 255, 0.16) calc(var(--contact-hero-blob-size) * 0.36),
      rgba(38, 71, 255, 0.08) calc(var(--contact-hero-blob-size) * 0.58),
      transparent var(--contact-hero-blob-size)
    ),
    linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
  transition: box-shadow 0.3s ease;
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

.contact-databook__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(17, 17, 17, 0.08) 100%);
}

.contact-databook__portrait-placeholder-icon {
  font-size: clamp(124px, 18vw, 188px);
  color: rgba(255, 255, 255, 0.92);
}

.contact-image-cropper-dialog {
  width: 420px;
  max-width: 94vw;
}

.contact-image-cropper-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contact-image-cropper {
  display: flex;
  justify-content: center;
  user-select: none;
}

.contact-image-cropper__frame {
  position: relative;
  width: 280px;
  height: 420px;
  overflow: hidden;
  background: #e7e5e4;
  border-radius: 20px;
  cursor: grab;
  touch-action: none;
}

.contact-image-cropper__frame:active {
  cursor: grabbing;
}

.contact-image-cropper__image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  transform-origin: center;
  will-change: transform;
}

.contact-image-cropper__overlay {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 20px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.26);
  pointer-events: none;
}

.contact-image-cropper__controls {
  padding: 0 10px;
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

.contact-databook__summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.contact-databook__summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.contact-databook__summary-add {
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.contact-databook__summary-add:hover,
.contact-databook__summary-add:focus-visible {
  background: rgba(255, 255, 255, 0.12);
}

.contact-databook__summary-menu {
  border-radius: 16px;
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

.contact-databook__summary-notes-panel {
  margin-top: 18px;
}

.contact-databook__summary-notes-label {
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 16px;
  text-transform: uppercase;
}

.contact-databook__summary-notes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  padding: 0;
  list-style: none;
}

.contact-databook__summary-note {
  position: relative;
  padding-left: 18px;
}

.contact-databook__summary-note::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 6px;
  height: 6px;
  content: '';
  background: rgba(255, 255, 255, 0.62);
  border-radius: 999px;
}

.contact-databook__summary-note-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.contact-databook__summary-note-title {
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.contact-databook__summary-note-content {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.contact-databook__summary-note-meta {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.54);
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  line-height: 16px;
  white-space: nowrap;
}

.contact-databook__summary-empty {
  margin-top: 18px;
  padding: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.72);
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
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

.contact-section-card--active {
  min-height: 320px;
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

.contact-section-card__intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 640px;
}

.contact-side-card__header {
  margin-bottom: 18px;
}

.contact-side-card__intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-section-card__title,
.contact-side-card__title {
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: var(--text-2xl---black);
  font-weight: var(--font-weight-black);
  line-height: 1.05;
}

.contact-section-card__caption {
  color: #707070;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 20px;
  text-align: left;
}

.contact-section-card__icon {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  margin-top: 1px;
  color: #a3a3a3;
}

.contact-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.contact-field-grid--single {
  grid-template-columns: minmax(0, 1fr);
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

.contact-field-card__input {
  margin-top: 10px;
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

.contact-field-card--note {
  min-height: 184px;
}

.contact-note-card__text {
  margin: 0;
}

.contact-side-card__meta-list,
.contact-side-card__stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 0;
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

  .databook-heading__main {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .databook-heading__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
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
