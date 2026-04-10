<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Settings requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="settings-page">
      <section class="settings-shell">
        <div
          class="settings-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="settings-shell__copy">
            <h2 class="settings-shell__hero-title">Tune your Settings</h2>

            <div class="settings-identity-preview">
              <div class="settings-identity-preview__badge">
                <q-icon name="settings" class="settings-identity-preview__icon" />
              </div>
              <div class="settings-identity-preview__name">{{ form.Name || 'Owner Profile' }}</div>
              <div class="settings-identity-preview__meta">
                {{ form.User_PEmail || 'Primary email pending' }} /
                {{ form.Country_based || 'Region pending' }}
              </div>
            </div>

            <p class="settings-shell__hero-text">{{ settingsHeroText }}</p>

            <div class="settings-shell__hero-actions">
              <B10Button
                variant="primary"
                icon-start="description"
                label="Owner"
                :disable="!hasDocsBridge"
                @click="showOwnerManualDialog = true"
              />
            </div>
          </div>

          <div class="settings-hero-controls">
            <q-card bordered flat class="settings-form-card settings-form-card--hero">
              <q-card-section class="settings-form-card__header">
                <div>
                  <div class="settings-form-card__eyebrow">Owner Settings</div>
                  <div class="settings-form-card__title">Owner Settings</div>
                </div>
                <div class="settings-form-card__caption">
                  Keep the local owner identity complete so Companion, Files, and future agents all read
                  from the same base profile.
                </div>
              </q-card-section>

              <q-banner v-if="error" class="settings-form-card__error bg-red-2 text-black" rounded>
                {{ error }}
              </q-banner>
              <q-banner
                v-else-if="!canEditOwnerSettings"
                class="settings-form-card__error bg-orange-2 text-black"
                rounded
              >
                Owner authority is locked. Only the owner can update Owner Settings.
              </q-banner>

              <q-separator />

              <q-card-section class="settings-form-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Name"
                      outlined
                      dense
                      label="Name *"
                      :disable="loading || saving || !canEditOwnerSettings"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.User_PEmail"
                      outlined
                      dense
                      label="Email *"
                      :disable="loading || saving || !canEditOwnerSettings"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Phone"
                      outlined
                      dense
                      label="Phone"
                      :disable="loading || saving || !canEditOwnerSettings"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.LinkedIn"
                      outlined
                      dense
                      label="LinkedIn"
                      :disable="loading || saving || !canEditOwnerSettings"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Country_based"
                      outlined
                      dense
                      label="Country Based"
                      :disable="loading || saving || !canEditOwnerSettings"
                    />
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="right" class="settings-form-card__actions">
                <B10Button
                  variant="subtle"
                  icon-start="refresh"
                  label="Reload Owner Settings"
                  :disable="saving || loading"
                  :loading="loading"
                  @click="loadUserSettings"
                />
                <B10Button
                  variant="primary"
                  icon-start="save"
                  label="Save Owner Settings"
                  :loading="saving"
                  :disable="loading || !hasUnsavedChanges || !canEditOwnerSettings"
                  @click="saveUserSettings"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <div class="settings-secondary-shell">
          <div class="settings-secondary-toolbar">
            <div class="settings-secondary-toolbar__copy">
              <q-icon name="tune" size="18px" class="settings-secondary-toolbar__icon" />
              <div>
                <div class="settings-secondary-toolbar__label">My Workspace</div>
                <div class="settings-secondary-toolbar__text">{{ workspaceToolbarText }}</div>
              </div>
            </div>
          </div>

          <q-card bordered flat class="settings-form-card settings-form-card--workspace">
            <q-card-section class="settings-form-card__header">
              <div>
                <div class="settings-form-card__eyebrow">Workspace tuning</div>
                <div class="settings-form-card__title">My Workspace settings</div>
              </div>
              <div class="settings-form-card__caption">
                Shape how your workspace lands, mirrors, and behaves without touching the core data model.
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="settings-form-card__body">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="workspaceSettings.defaultLanding"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="Default Landing"
                    :options="workspaceLandingOptions"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="workspaceSettings.workspaceMode"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="Workspace Mode"
                    :options="workspaceModeOptions"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="workspaceSettings.fileMirroring"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="File Mirroring"
                    :options="fileMirroringOptions"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="workspaceSettings.reviewCadence"
                    outlined
                    dense
                    emit-value
                    map-options
                    label="Review Cadence"
                    :options="workspaceCadenceOptions"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="workspaceSettings.workspaceIntent"
                    outlined
                    autogrow
                    type="textarea"
                    label="Workspace Intent"
                  />
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right" class="settings-form-card__actions">
              <B10Button
                variant="subtle"
                icon-start="refresh"
                label="Reload Workspace"
                :disable="savingWorkspaceSettings"
                @click="loadWorkspaceSettings"
              />
              <B10Button
                variant="primary"
                icon-start="save"
                label="Save Workspace"
                :loading="savingWorkspaceSettings"
                :disable="!hasWorkspaceChanges"
                @click="saveWorkspaceSettings"
              />
            </q-card-actions>
          </q-card>
        </div>

        <q-dialog v-model="showOwnerManualDialog">
          <q-card class="owner-manual-dialog">
            <q-card-section class="owner-manual-dialog__head">
              <div class="settings-form-card__eyebrow">{{ activeOwnerDocument?.eyebrow || 'Owner' }}</div>
              <div class="settings-shell__hero-title owner-manual-dialog__title">
                {{ activeOwnerDocument?.heroTitle || 'Owner' }}
              </div>
              <div class="owner-manual-dialog__owner">For the Owner</div>
              <div class="owner-manual-dialog__lead">
                {{ ownerDialogLead }}
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="owner-manual-dialog__body">
              <div class="owner-manual-workspace">
                <div class="owner-manual-workspace__main">
                  <div v-if="ownerManualError" class="owner-manual-workspace__error">
                    {{ ownerManualError }}
                  </div>

                  <div class="owner-manual-workspace__toolbar">
                    <div class="owner-manual-workspace__toolbar-copy">
                      <div class="owner-manual-workspace__document-title">
                        {{ activeOwnerDocument?.label || 'Owner' }}
                      </div>
                      <div class="owner-manual-workspace__document-path">
                        {{ activeOwnerDocument?.path || '' }}
                      </div>
                    </div>

                    <div class="owner-manual-workspace__toolbar-actions">
                      <B10Button
                        variant="subtle"
                        icon-start="refresh"
                        label="Reload"
                        :disable="ownerManualLoading || ownerManualSaving || !hasDocsBridge"
                        @click="reloadActiveOwnerDocument"
                      />
                      <B10Button
                        variant="subtle"
                        :icon-start="ownerManualEditMode ? 'visibility' : 'edit'"
                        :label="ownerManualEditMode ? 'View' : 'Edit'"
                        :disable="ownerManualLoading || !hasDocsBridge"
                        @click="ownerManualEditMode = !ownerManualEditMode"
                      />
                      <B10Button
                        variant="primary"
                        icon-start="save"
                        label="Save"
                        :disable="!ownerManualDirty || ownerManualLoading || ownerManualSaving || !hasDocsBridge"
                        :loading="ownerManualSaving"
                        @click="saveActiveOwnerDocument"
                      />
                    </div>
                  </div>

                  <div v-if="ownerManualLoading" class="owner-manual-workspace__loading">
                    Loading document...
                  </div>

                  <template v-else>
                    <div v-if="!ownerManualEditMode && isOwnerGlossaryDocument" class="owner-glossary">
                      <div class="owner-glossary__toolbar">
                        <div class="owner-manual-workspace__section-title">Index / Glossary</div>
                        <q-select
                          v-model="ownerGlossarySourceFilter"
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Source"
                          :options="ownerGlossarySourceOptions"
                          class="owner-glossary__source-filter"
                        />
                      </div>

                      <div class="owner-glossary__table-wrap">
                        <table class="owner-glossary__table">
                          <thead>
                            <tr>
                              <th>Concept</th>
                              <th>Description</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="entry in filteredOwnerGlossaryEntries" :key="`${entry.Concept}-${entry.Source}`">
                              <td>{{ entry.Concept }}</td>
                              <td>{{ entry.Description }}</td>
                              <td>{{ entry.Source }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div v-else-if="!ownerManualEditMode" class="owner-manual-workspace__read">
                      <pre class="owner-manual-workspace__read-pre">{{ ownerManualSavedContent }}</pre>
                    </div>
                    <div v-else class="owner-manual-editor">
                      <div class="owner-manual-editor__panel">
                        <div class="owner-manual-workspace__section-title">Edit</div>
                        <q-input
                          v-model="ownerManualDraftContent"
                          type="textarea"
                          autogrow
                          outlined
                          class="owner-manual-editor__input"
                        />
                      </div>

                      <div class="owner-manual-editor__panel">
                        <div class="owner-manual-workspace__section-title">Pending Markup</div>
                        <div class="owner-manual-diff">
                          <div
                            v-for="(line, index) in ownerManualDiffLines"
                            :key="`${index}-${line.type}-${line.text}`"
                            class="owner-manual-diff__line"
                            :class="`owner-manual-diff__line--${line.type}`"
                          >
                            <span class="owner-manual-diff__marker">{{ ownerDiffMarkerFor(line.type) }}</span>
                            <span class="owner-manual-diff__text">{{ line.text || ' ' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-if="ownerManualReview" class="owner-manual-chat">
                    <div class="owner-manual-chat__eyebrow">Owner Acknowledgment</div>
                    <div class="owner-manual-chat__bubble">{{ ownerManualReview }}</div>
                  </div>
                </div>

                <aside class="owner-manual-workspace__menu">
                  <div class="owner-manual-workspace__section-title">Relevant Guides</div>
                  <div
                    v-for="group in ownerDocumentGroups"
                    :key="group.layer"
                    class="owner-manual-menu__group"
                  >
                    <div class="owner-manual-menu__group-label">{{ group.layer }}</div>
                    <button
                      v-for="document in group.documents"
                      :key="document.id"
                      type="button"
                      class="owner-manual-menu__item"
                      :class="{ 'owner-manual-menu__item--active': document.id === activeOwnerDocumentId }"
                      @click="selectOwnerDocument(document.id)"
                    >
                      <span class="owner-manual-menu__label">{{ document.label }}</span>
                      <span class="owner-manual-menu__meta">{{ document.short }}</span>
                    </button>
                  </div>
                </aside>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="owner-manual-dialog__actions">
              <B10Button variant="primary" label="Close" @click="showOwnerManualDialog = false" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import isEmail from 'validator/lib/isEmail.js'
import B10Button from 'src/components/buttons/B10Button.vue'

const $q = useQuasar()
const WORKSPACE_SETTINGS_STORAGE_KEY = 'ecvc.workspaceSettings'
const defaultWorkspaceSettings = {
  defaultLanding: 'home',
  workspaceMode: 'balanced',
  fileMirroring: 'balanced',
  reviewCadence: 'weekly',
  workspaceIntent: 'Keep My Workspace coherent, readable, and ready to branch from clean files.',
}
const workspaceLandingOptions = [
  { label: 'Home', value: 'home' },
  { label: 'Files', value: 'files' },
  { label: 'User Roles', value: 'user-roles' },
]
const workspaceModeOptions = [
  { label: 'Focused', value: 'focused' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Expanded', value: 'expanded' },
]
const fileMirroringOptions = [
  { label: 'App-first', value: 'app-first' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'File-first', value: 'file-first' },
]
const workspaceCadenceOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.userSettings?.get && !!bridge.value?.userSettings?.set)
const hasDocsBridge = computed(() => !!bridge.value?.docs?.read && !!bridge.value?.docs?.write)

const loading = ref(false)
const saving = ref(false)
const savingWorkspaceSettings = ref(false)
const error = ref('')
const showOwnerManualDialog = ref(false)
const ownerManualLoading = ref(false)
const ownerManualSaving = ref(false)
const ownerManualError = ref('')
const ownerManualSavedContent = ref('')
const ownerManualDraftContent = ref('')
const ownerManualReview = ref('')
const ownerManualEditMode = ref(false)
const ownerGlossarySourceFilter = ref('all')
const activeOwnerDocumentId = ref('owner')
const canEditOwnerSettings = ref(true)
const form = ref({
  Name: '',
  User_PEmail: '',
  Phone: '',
  LinkedIn: '',
  Country_based: '',
})
const savedForm = ref({
  Name: '',
  User_PEmail: '',
  Phone: '',
  LinkedIn: '',
  Country_based: '',
})
const workspaceSettings = ref({ ...defaultWorkspaceSettings })
const savedWorkspaceSettings = ref({ ...defaultWorkspaceSettings })

const settingsHeroText = computed(() => {
  if (loading.value) return 'Loading the local owner profile and node settings.'
  if (!canEditOwnerSettings.value) {
    return 'Owner authority is locked. Owner data stays visible here, but only the owner can update the local node profile.'
  }
  if (!form.value.Name && !form.value.User_PEmail) {
    return 'Start by defining the owner profile that the node will use across settings, companion, and shared local identity.'
  }

  return `${form.value.Name || 'Owner'} is the local node profile. Keep the core contact details current so the rest of the workspace stays grounded in one shared identity.`
})

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

function normalizeIpcErrorMessage(err) {
  const raw = String(err?.message || err || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

function normalizeInput(value) {
  return String(value || '').trim()
}

function normalizedFormSignature(value) {
  return JSON.stringify({
    Name: normalizeInput(value?.Name),
    User_PEmail: normalizeInput(value?.User_PEmail),
    Phone: normalizeInput(value?.Phone),
    LinkedIn: normalizeInput(value?.LinkedIn),
    Country_based: normalizeInput(value?.Country_based),
  })
}

function normalizedWorkspaceSignature(value) {
  return JSON.stringify({
    defaultLanding: String(value?.defaultLanding || ''),
    workspaceMode: String(value?.workspaceMode || ''),
    fileMirroring: String(value?.fileMirroring || ''),
    reviewCadence: String(value?.reviewCadence || ''),
    workspaceIntent: normalizeInput(value?.workspaceIntent),
  })
}

const hasUnsavedChanges = computed(
  () => normalizedFormSignature(form.value) !== normalizedFormSignature(savedForm.value)
)
const hasWorkspaceChanges = computed(
  () => normalizedWorkspaceSignature(workspaceSettings.value) !== normalizedWorkspaceSignature(savedWorkspaceSettings.value)
)
const ownerDocumentMenu = [
  {
    id: 'owner',
    layer: '000 Owner / Root Authority',
    label: 'Owner',
    short: 'Pause menu',
    path: 'docs/000/Active/000-Owner_Manual.md',
    eyebrow: 'Owner',
    heroTitle: 'Owner',
  },
  {
    id: 'files',
    layer: '001 System',
    label: 'Files',
    short: 'File guide rules',
    path: 'docs/001/Active/001-Files.md',
    eyebrow: 'Files',
    heroTitle: 'Files',
  },
  {
    id: 'product-reference',
    layer: '011 Operation Guides',
    label: 'Product Reference',
    short: 'Product language',
    path: 'docs/011/Active/011-product-reference-guide.md',
    eyebrow: 'Reference',
    heroTitle: 'Reference',
  },
  {
    id: 'glossary',
    layer: '000 Owner / Root Authority',
    label: 'Index / Glossary',
    short: 'Concept index',
    path: 'docs/000/Active/000-language-reference-glossary.md',
    eyebrow: 'Index / Glossary',
    heroTitle: 'Glossary',
  },
]
const groupOwnerDocuments = (documents) => {
  const groups = []
  documents.forEach((document) => {
    const layer = document.layer || 'Other'
    let group = groups.find((entry) => entry.layer === layer)
    if (!group) {
      group = { layer, documents: [] }
      groups.push(group)
    }
    group.documents.push(document)
  })
  return groups
}
const ownerDocumentGroups = computed(() => groupOwnerDocuments(ownerDocumentMenu))
const activeOwnerDocument = computed(
  () => ownerDocumentMenu.find((document) => document.id === activeOwnerDocumentId.value) || ownerDocumentMenu[0]
)
const ownerDialogLead = computed(() => {
  if (activeOwnerDocumentId.value === 'owner') {
    return 'Use the Owner manual as the pause menu for system, file, and governance navigation.'
  }

  if (activeOwnerDocumentId.value === 'glossary') {
    return 'Use the glossary to keep concepts, file language, and governance terms aligned while you edit.'
  }

  return 'Keep the owner-facing guidance readable, structured, and anchored to the real system contracts.'
})
const ownerManualDirty = computed(() => ownerManualDraftContent.value !== ownerManualSavedContent.value)
const isOwnerGlossaryDocument = computed(() => activeOwnerDocumentId.value === 'glossary')
const ownerGlossaryEntries = computed(() => parseGlossaryMarkdown(ownerManualSavedContent.value))
const ownerGlossarySourceOptions = computed(() => {
  const sources = Array.from(new Set(ownerGlossaryEntries.value.map((entry) => entry.Source).filter(Boolean))).sort()
  return [{ label: 'All Sources', value: 'all' }, ...sources.map((source) => ({ label: source, value: source }))]
})
const filteredOwnerGlossaryEntries = computed(() => {
  if (ownerGlossarySourceFilter.value === 'all') return ownerGlossaryEntries.value
  return ownerGlossaryEntries.value.filter((entry) => entry.Source === ownerGlossarySourceFilter.value)
})
const ownerManualDiffLines = computed(() =>
  buildLineDiff(ownerManualSavedContent.value, ownerManualDraftContent.value)
)
const workspaceToolbarText = computed(() => {
  const landing = workspaceLandingOptions.find((option) => option.value === workspaceSettings.value.defaultLanding)?.label || 'Home'
  const mode = workspaceModeOptions.find((option) => option.value === workspaceSettings.value.workspaceMode)?.label || 'Balanced'
  return `${landing} landing • ${mode} workspace mode`
})

function mapContactToForm(contact = null) {
  return {
    Name: contact?.Name || '',
    User_PEmail: '',
    Phone: contact?.Phone || '',
    LinkedIn: contact?.LinkedIn || '',
    Country_based: contact?.Country_based || '',
  }
}

function mapUserSettingsToForm(result = null) {
  const contact = result?.userContact || null
  const user = result?.user || null
  return {
    ...mapContactToForm(contact),
    User_PEmail: user?.User_PEmail || contact?.Personal_Email || contact?.Professional_Email || '',
  }
}

async function loadUserSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.userSettings.get()
    canEditOwnerSettings.value = result?.canEditOwnerSettings !== false
    form.value = mapUserSettingsToForm(result)
    savedForm.value = { ...form.value }
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveUserSettings() {
  if (!hasBridge.value) return
  if (!canEditOwnerSettings.value) return
  const name = normalizeInput(form.value.Name)
  const email = normalizeInput(form.value.User_PEmail)
  if (!name) {
    const message = 'User name should not be empty'
    error.value = message
    $q.notify({ type: 'negative', message: `Error: ${message}` })
    return
  }
  if (!email) {
    const message = 'User email should not be empty'
    error.value = message
    $q.notify({ type: 'negative', message: `Error: ${message}` })
    return
  }
  if (!isEmail(email)) {
    const message = 'Enter a valid email address'
    error.value = message
    $q.notify({ type: 'negative', message })
    return
  }

  saving.value = true
  error.value = ''
  try {
    const payload = {
      contact: {
        Name: name,
        User_PEmail: email,
        Personal_Email: email,
        Professional_Email: '',
        Phone: normalizeInput(form.value.Phone),
        LinkedIn: normalizeInput(form.value.LinkedIn),
        Country_based: normalizeInput(form.value.Country_based),
      },
    }
    const result = await bridge.value.userSettings.set(payload)
    form.value = mapUserSettingsToForm(result)
    savedForm.value = { ...form.value }
    globalThis?.dispatchEvent?.(new Event('ecvc:user-label-changed'))
    $q.notify({ type: 'positive', message: 'User settings saved' })
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    saving.value = false
  }
}

function loadWorkspaceSettings() {
  if (typeof window === 'undefined') return

  try {
    const storedValue = window.localStorage.getItem(WORKSPACE_SETTINGS_STORAGE_KEY)
    workspaceSettings.value = storedValue
      ? { ...defaultWorkspaceSettings, ...JSON.parse(storedValue) }
      : { ...defaultWorkspaceSettings }
  } catch {
    workspaceSettings.value = { ...defaultWorkspaceSettings }
  }

  savedWorkspaceSettings.value = { ...workspaceSettings.value }
}

async function saveWorkspaceSettings() {
  if (typeof window === 'undefined') return

  savingWorkspaceSettings.value = true
  try {
    window.localStorage.setItem(WORKSPACE_SETTINGS_STORAGE_KEY, JSON.stringify(workspaceSettings.value))
    savedWorkspaceSettings.value = { ...workspaceSettings.value }
    $q.notify({ type: 'positive', message: 'My Workspace settings saved' })
  } finally {
    savingWorkspaceSettings.value = false
  }
}

function parseGlossaryMarkdown(content) {
  const lines = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))

  if (lines.length < 3) return []

  const rows = lines.map((line) =>
    line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim()),
  )

  const headers = rows[0]
  return rows
    .slice(2)
    .filter((row) => row.length === headers.length)
    .map((row) =>
      headers.reduce((entry, header, index) => {
        entry[header] = row[index] || ''
        return entry
      }, {}),
    )
}

function buildLineDiff(before, after) {
  const a = String(before || '').split('\n')
  const b = String(after || '').split('\n')
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const lines = []
  let i = 0
  let j = 0

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ type: 'same', text: a[i] })
      i += 1
      j += 1
      continue
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: 'remove', text: a[i] })
      i += 1
    } else {
      lines.push({ type: 'add', text: b[j] })
      j += 1
    }
  }

  while (i < a.length) {
    lines.push({ type: 'remove', text: a[i] })
    i += 1
  }

  while (j < b.length) {
    lines.push({ type: 'add', text: b[j] })
    j += 1
  }

  return lines
}

function ownerDiffMarkerFor(type) {
  if (type === 'add') return '+'
  if (type === 'remove') return '-'
  return '·'
}

function createOwnerClarityPass() {
  const diffLines = ownerManualDiffLines.value
  const additions = diffLines.filter((line) => line.type === 'add').length
  const removals = diffLines.filter((line) => line.type === 'remove').length
  const headings = ownerManualDraftContent.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('#')).length
  const longLines = ownerManualDraftContent.value
    .split('\n')
    .filter((line) => line.length > 160).length

  const notes = [
    `${activeOwnerDocument.value?.label || 'Document'} saved with ${additions} additions and ${removals} removals.`,
    headings > 0 ? `The heading structure is still visible across ${headings} heading line(s).` : 'The heading structure is now missing, so this should be reviewed.',
    longLines > 0 ? `${longLines} long line(s) may still read densely.` : 'The updated lines look readable at a quick pass.',
  ]

  return notes.join(' ')
}

async function loadActiveOwnerDocument() {
  if (!showOwnerManualDialog.value || !hasDocsBridge.value) return
  ownerManualLoading.value = true
  ownerManualError.value = ''
  try {
    const result = await bridge.value.docs.read(activeOwnerDocument.value.path)
    ownerManualSavedContent.value = String(result?.content || '')
    ownerManualDraftContent.value = ownerManualSavedContent.value
    ownerManualReview.value = ''
    ownerGlossarySourceFilter.value = 'all'
  } catch (e) {
    ownerManualError.value = normalizeIpcErrorMessage(e)
  } finally {
    ownerManualLoading.value = false
  }
}

async function reloadActiveOwnerDocument() {
  await loadActiveOwnerDocument()
}

async function saveActiveOwnerDocument() {
  if (!hasDocsBridge.value || !ownerManualDirty.value || !activeOwnerDocument.value?.path) return

  ownerManualSaving.value = true
  ownerManualError.value = ''

  try {
    await bridge.value.docs.write(activeOwnerDocument.value.path, ownerManualDraftContent.value)
    ownerManualSavedContent.value = ownerManualDraftContent.value
    ownerManualReview.value = createOwnerClarityPass()
  } catch (e) {
    ownerManualError.value = normalizeIpcErrorMessage(e)
  } finally {
    ownerManualSaving.value = false
  }
}

function selectOwnerDocument(documentId) {
  activeOwnerDocumentId.value = documentId
}

onMounted(() => {
  loadWorkspaceSettings()
  if (!hasBridge.value) return
  loadUserSettings()
})

watch(showOwnerManualDialog, (isOpen) => {
  if (!isOpen) return
  ownerManualEditMode.value = false
  loadActiveOwnerDocument()
})
watch(activeOwnerDocumentId, () => {
  ownerManualEditMode.value = false
  if (showOwnerManualDialog.value) loadActiveOwnerDocument()
})
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 255, 0.94)),
    #fff;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.settings-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.18) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.settings-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.1);
}

.settings-shell__hero > * {
  position: relative;
  z-index: 1;
}

.settings-shell__copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.settings-form-card__eyebrow {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.settings-shell__hero-title {
  margin: 0;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--font-weight-black);
  line-height: 0.94;
}

.settings-shell__hero-text,
.settings-form-card__caption {
  color: #475569;
  font-family: var(--font-body);
  font-size: 0.94rem;
  line-height: 1.65;
}

.settings-shell__hero-actions {
  display: flex;
  align-items: center;
}

.settings-identity-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.settings-identity-preview__badge {
  display: flex;
  width: 98px;
  height: 112px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 30px 30px 24px 24px;
  background: linear-gradient(180deg, #6a91ff 0%, #335cff 100%);
  box-shadow:
    0 24px 36px rgba(79, 124, 255, 0.28),
    0 10px 28px rgba(15, 23, 42, 0.12);
}

.settings-identity-preview__icon {
  color: rgba(255, 255, 255, 0.96);
  font-size: 54px;
}

.settings-identity-preview__name {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.08rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  text-align: center;
}

.settings-identity-preview__meta {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.settings-hero-controls {
  display: flex;
  flex-direction: column;
}

.settings-form-card {
  border-radius: 24px;
  border-color: rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.settings-form-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px 18px;
}

.settings-form-card__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.settings-form-card__error {
  margin: 0 24px 16px;
}

.settings-form-card__body {
  padding: 24px;
}

.settings-form-card__actions {
  padding: 16px 24px 22px;
}

.owner-manual-dialog {
  width: min(980px, 94vw);
  max-width: 980px;
  border-radius: 28px;
  overflow: hidden;
}

.owner-manual-dialog__head {
  display: grid;
  gap: 8px;
  padding: 22px 24px 18px;
}

.owner-manual-dialog__title {
  margin: 0;
}

.owner-manual-dialog__owner {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.owner-manual-dialog__lead {
  color: #475569;
  font-family: var(--font-body);
  font-size: 0.94rem;
  line-height: 1.65;
}

.owner-manual-dialog__body {
  padding: 18px 24px 24px;
  max-height: min(78vh, 920px);
  overflow: hidden;
}

.owner-manual-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 260px);
  gap: 16px;
  height: calc(min(78vh, 920px) - 42px);
  min-height: 0;
}

.owner-manual-workspace__main,
.owner-manual-workspace__menu {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.owner-manual-workspace__main {
  overflow-y: auto;
  max-height: 100%;
  padding-right: 4px;
}

.owner-manual-workspace__menu {
  overflow-y: auto;
  max-height: 100%;
  padding-right: 4px;
}

.owner-manual-workspace__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.owner-manual-workspace__toolbar-copy,
.owner-manual-workspace__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.owner-manual-workspace__toolbar-actions {
  justify-content: flex-end;
}

.owner-manual-workspace__document-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.owner-manual-workspace__document-path {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.5;
}

.owner-manual-workspace__section-title {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-manual-workspace__loading,
.owner-manual-workspace__error,
.owner-manual-workspace__read,
.owner-manual-editor__panel,
.owner-manual-workspace__menu,
.owner-manual-chat,
.owner-glossary__table-wrap {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  padding: 18px;
}

.owner-manual-workspace__error {
  color: #b42318;
  background: rgba(254, 228, 226, 0.72);
  border-color: rgba(240, 68, 56, 0.18);
}

.owner-manual-workspace__read-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #233041;
}

.owner-manual-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.owner-manual-editor__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.owner-manual-editor__input :deep(textarea) {
  min-height: 380px;
}

.owner-manual-diff {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  max-height: 420px;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.owner-manual-diff__line {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  padding: 4px 8px;
  border-radius: 10px;
}

.owner-manual-diff__line--add {
  background: rgba(22, 163, 74, 0.08);
  color: #166534;
}

.owner-manual-diff__line--remove {
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
}

.owner-manual-diff__line--same {
  background: rgba(148, 163, 184, 0.08);
  color: #475569;
}

.owner-manual-diff__marker {
  font-weight: 700;
}

.owner-manual-diff__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.owner-manual-menu__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.96);
  cursor: pointer;
  text-align: left;
}

.owner-manual-menu__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.owner-manual-menu__group + .owner-manual-menu__group {
  margin-top: 14px;
}

.owner-manual-menu__group-label {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-manual-menu__item:hover {
  background: rgba(241, 245, 249, 0.98);
}

.owner-manual-menu__item--active {
  border-color: rgba(37, 99, 235, 0.28);
  background: rgba(219, 234, 254, 0.72);
}

.owner-manual-menu__label {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
}

.owner-manual-menu__meta {
  color: #64748b;
  font-size: 0.78rem;
}

.owner-manual-chat__eyebrow {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-manual-chat__bubble {
  margin-top: 8px;
  color: #233041;
  font-size: 0.92rem;
  line-height: 1.65;
}

.owner-glossary__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.owner-glossary__source-filter {
  min-width: 220px;
}

.owner-glossary__table-wrap {
  overflow: auto;
  padding: 0;
}

.owner-glossary__table {
  width: 100%;
  border-collapse: collapse;
}

.owner-glossary__table th,
.owner-glossary__table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.owner-glossary__table th {
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-glossary__table td {
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.55;
}

.owner-manual-dialog__actions {
  padding: 0 24px 22px;
}

.settings-secondary-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-secondary-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
}

.settings-secondary-toolbar__copy {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.settings-secondary-toolbar__icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.settings-secondary-toolbar__label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.settings-secondary-toolbar__text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 1120px) {
  .settings-shell__hero {
    grid-template-columns: 1fr;
  }

  .settings-form-card__header {
    flex-direction: column;
  }

  .owner-manual-workspace,
  .owner-manual-editor {
    grid-template-columns: 1fr;
  }

  .owner-manual-workspace__toolbar,
  .owner-glossary__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .owner-manual-workspace__toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .settings-shell__hero,
  .settings-form-card__body,
  .settings-form-card__actions {
    padding: 20px;
  }

  .settings-secondary-toolbar {
    padding: 20px;
  }

  .settings-form-card__error {
    margin: 0 20px 16px;
  }
}
</style>
