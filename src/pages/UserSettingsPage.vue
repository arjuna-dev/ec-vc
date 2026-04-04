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
              <div class="settings-identity-preview__name">{{ fullProfileName || 'Owner Profile' }}</div>
              <div class="settings-identity-preview__meta">
                {{ form.User_PEmail || 'Primary email pending' }} /
                {{ form.Country_based || 'Region pending' }}
              </div>
            </div>

            <p class="settings-shell__hero-text">{{ settingsHeroText }}</p>
          </div>

          <div class="settings-hero-controls">
            <q-card bordered flat class="settings-form-card settings-form-card--hero">
              <q-card-section class="settings-form-card__header">
                <div>
                  <div class="settings-form-card__eyebrow">Owner Settings</div>
                  <div class="settings-form-card__title">Owner Settings</div>
                </div>
                <div class="settings-form-card__caption">
                  Keep the local owner identity complete so Avatar, Files, and future agents all read
                  from the same base profile.
                </div>
              </q-card-section>

              <q-banner v-if="error" class="settings-form-card__error bg-red-2 text-black" rounded>
                {{ error }}
              </q-banner>

              <q-separator />

              <q-card-section class="settings-form-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Given_Names"
                      outlined
                      dense
                      label="Given Names *"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Last_Names"
                      outlined
                      dense
                      label="Last Names"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.User_PEmail"
                      outlined
                      dense
                      label="Email *"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Professional_Email"
                      outlined
                      dense
                      label="Professional Email"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Phone"
                      outlined
                      dense
                      label="Phone"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.LinkedIn"
                      outlined
                      dense
                      label="LinkedIn"
                      :disable="loading || saving"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Country_based"
                      outlined
                      dense
                      label="Country Based"
                      :disable="loading || saving"
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
                  :disable="loading || !hasUnsavedChanges"
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
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
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
  { label: 'Roles', value: 'roles' },
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

const loading = ref(false)
const saving = ref(false)
const savingWorkspaceSettings = ref(false)
const error = ref('')
const form = ref({
  Given_Names: '',
  Last_Names: '',
  User_PEmail: '',
  Professional_Email: '',
  Phone: '',
  LinkedIn: '',
  Country_based: '',
})
const savedForm = ref({
  Given_Names: '',
  Last_Names: '',
  User_PEmail: '',
  Professional_Email: '',
  Phone: '',
  LinkedIn: '',
  Country_based: '',
})
const workspaceSettings = ref({ ...defaultWorkspaceSettings })
const savedWorkspaceSettings = ref({ ...defaultWorkspaceSettings })

const fullProfileName = computed(() => [form.value.Given_Names, form.value.Last_Names].map(normalizeInput).filter(Boolean).join(' ').trim())

const settingsHeroText = computed(() => {
  if (loading.value) return 'Loading the local owner profile and node settings.'
  if (!fullProfileName.value && !form.value.User_PEmail) {
    return 'Start by defining the owner profile that the node will use across settings, avatar, and shared local identity.'
  }

  return `${fullProfileName.value || 'Owner'} is the local node profile. Keep the core contact details current so the rest of the workspace stays grounded in one shared identity.`
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
    Given_Names: normalizeInput(value?.Given_Names),
    Last_Names: normalizeInput(value?.Last_Names),
    User_PEmail: normalizeInput(value?.User_PEmail),
    Professional_Email: normalizeInput(value?.Professional_Email),
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
const workspaceToolbarText = computed(() => {
  const landing = workspaceLandingOptions.find((option) => option.value === workspaceSettings.value.defaultLanding)?.label || 'Home'
  const mode = workspaceModeOptions.find((option) => option.value === workspaceSettings.value.workspaceMode)?.label || 'Balanced'
  return `${landing} landing • ${mode} workspace mode`
})

function mapContactToForm(contact = null) {
  const nameParts = splitNameParts(contact?.Name)
  return {
    Given_Names: nameParts.givenNames,
    Last_Names: nameParts.lastNames,
    User_PEmail: '',
    Professional_Email: contact?.Professional_Email || '',
    Phone: contact?.Phone || '',
    LinkedIn: contact?.LinkedIn || '',
    Country_based: contact?.Country_based || '',
  }
}

function splitNameParts(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  return {
    givenNames: parts.slice(0, -1).join(' ') || parts[0] || '',
    lastNames: parts.length > 1 ? parts.slice(-1).join(' ') : '',
  }
}

function mapUserSettingsToForm(result = null) {
  const contact = result?.userContact || null
  const user = result?.user || null
  return {
    ...mapContactToForm(contact),
    User_PEmail: user?.User_PEmail || contact?.Professional_Email || contact?.Personal_Email || '',
  }
}

async function loadUserSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.userSettings.get()
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
  const name = fullProfileName.value
  const email = normalizeInput(form.value.User_PEmail)
  if (!name) {
    const message = 'Given names should not be empty'
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
        Professional_Email: normalizeInput(form.value.Professional_Email),
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

onMounted(() => {
  loadWorkspaceSettings()
  if (!hasBridge.value) return
  loadUserSettings()
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
  border: 1px solid var(--ds-color-border-soft);
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
