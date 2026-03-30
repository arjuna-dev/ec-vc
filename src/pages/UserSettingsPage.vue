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
        <div class="settings-studio">
          <div class="settings-studio__main">
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
              </div>

              <div class="settings-dashboard">
                <div class="settings-dashboard__stats">
                  <article
                    v-for="stat in settingsDashboardStats"
                    :key="stat.label"
                    class="settings-dashboard__stat"
                    :class="`settings-dashboard__stat--${stat.tone}`"
                  >
                    <div class="settings-dashboard__stat-label">{{ stat.label }}</div>
                    <div class="settings-dashboard__stat-value">{{ stat.value }}</div>
                    <div class="settings-dashboard__stat-caption">{{ stat.caption }}</div>
                  </article>
                </div>

                <div class="settings-dashboard__health">
                  <div class="settings-dashboard__health-copy">
                    <div class="settings-dashboard__health-label">Profile health</div>
                    <div class="settings-dashboard__health-text">
                      {{ profileCompleteness.completeCount }} fields complete,
                      {{ profileCompleteness.missingCount }} still open
                    </div>
                  </div>

                  <div class="settings-dashboard__health-bar" aria-hidden="true">
                    <span
                      class="settings-dashboard__health-segment settings-dashboard__health-segment--missing"
                      :style="{ width: `${profileCompleteness.missingShare}%` }"
                    />
                    <span
                      class="settings-dashboard__health-segment settings-dashboard__health-segment--complete"
                      :style="{ width: `${profileCompleteness.completeShare}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-toolbar">
              <div class="settings-toolbar__block settings-toolbar__block--status">
                <q-icon name="tune" size="18px" class="settings-toolbar__filters-icon" />
                <div class="settings-toolbar__status-copy">
                  <div class="settings-toolbar__status-label">Node profile</div>
                  <div class="settings-toolbar__status-value">{{ settingsStatusText }}</div>
                </div>
              </div>

              <div class="settings-toolbar__block settings-toolbar__block--actions">
                <B10Button
                  variant="subtle"
                  icon-start="refresh"
                  label="Reload"
                  :disable="saving"
                  :loading="loading"
                  @click="loadUserSettings"
                />
                <B10Button
                  variant="primary"
                  icon-start="save"
                  label="Save Settings"
                  :loading="saving"
                  :disable="loading"
                  @click="saveUserSettings"
                />
              </div>
            </div>
          </div>

          <div class="settings-studio__side">
            <q-card bordered flat class="settings-form-card">
              <q-card-section class="settings-form-card__header">
                <div>
                  <div class="settings-form-card__eyebrow">Owner profile</div>
                  <div class="settings-form-card__title">Local node settings</div>
                </div>
                <div class="settings-form-card__caption">
                  Keep the local owner identity complete so Avatar, Files, and future agents all read
                  from the same base profile.
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="settings-form-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.Name"
                      outlined
                      dense
                      label="Name *"
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
            </q-card>

            <q-card bordered flat class="settings-sidecar">
              <q-card-section class="settings-sidecar__header">
                <div class="settings-form-card__eyebrow">Profile Signals</div>
                <div class="settings-sidecar__title">Current setup</div>
              </q-card-section>
              <q-separator />
              <q-card-section class="settings-sidecar__body">
                <div class="settings-sidecar__item">
                  <span>Name</span><strong>{{ form.Name || '--' }}</strong>
                </div>
                <div class="settings-sidecar__item">
                  <span>Email</span><strong>{{ form.User_PEmail || '--' }}</strong>
                </div>
                <div class="settings-sidecar__item">
                  <span>Phone</span><strong>{{ form.Phone || '--' }}</strong>
                </div>
                <div class="settings-sidecar__item">
                  <span>Region</span><strong>{{ form.Country_based || '--' }}</strong>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="settings-loadout">
          <div class="settings-loadout__header">
            <div>
              <div class="settings-form-card__eyebrow">Identity Deck</div>
              <div class="settings-loadout__title">Profile focus cards</div>
            </div>
            <div class="settings-form-card__caption">
              A quick read on what is ready, what is missing, and what the node will lean on next.
            </div>
          </div>

          <div class="settings-loadout__grid">
            <q-card
              v-for="card in settingsFocusCards"
              :key="card.label"
              flat
              bordered
              class="settings-focus-card"
            >
              <q-card-section class="settings-focus-card__body">
                <div class="settings-focus-card__label">{{ card.label }}</div>
                <div class="settings-focus-card__value">{{ card.value }}</div>
                <div class="settings-focus-card__caption">{{ card.caption }}</div>
              </q-card-section>
            </q-card>
          </div>
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

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.userSettings?.get && !!bridge.value?.userSettings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const form = ref({
  Name: '',
  User_PEmail: '',
  Professional_Email: '',
  Phone: '',
  LinkedIn: '',
  Country_based: '',
})

const profileFieldKeys = [
  'Name',
  'User_PEmail',
  'Professional_Email',
  'Phone',
  'LinkedIn',
  'Country_based',
]

const profileCompleteness = computed(() => {
  const completeCount = profileFieldKeys.reduce((count, key) => {
    return count + (String(form.value[key] || '').trim() ? 1 : 0)
  }, 0)
  const total = profileFieldKeys.length || 1
  const missingCount = total - completeCount

  return {
    total,
    completeCount,
    missingCount,
    completeShare: (completeCount / total) * 100,
    missingShare: (missingCount / total) * 100,
  }
})

const settingsHeroText = computed(() => {
  if (loading.value) return 'Loading the local owner profile and node settings.'
  if (!form.value.Name && !form.value.User_PEmail) {
    return 'Start by defining the owner profile that the node will use across settings, avatar, and shared local identity.'
  }

  return `${form.value.Name || 'Owner'} is the local node profile. Keep the core contact details current so the rest of the workspace stays grounded in one shared identity.`
})

const settingsStatusText = computed(() => {
  if (saving.value) return 'Saving changes...'
  if (loading.value) return 'Loading profile...'
  if (profileCompleteness.value.missingCount === 0) return 'Profile complete'
  return `${profileCompleteness.value.missingCount} fields still need setup`
})

const settingsDashboardStats = computed(() => [
  {
    label: 'Owner name',
    value: form.value.Name || '--',
    caption: form.value.Name ? 'Local owner profile loaded' : 'Set the local owner name',
    tone: form.value.Name ? 'rich' : 'sparse',
  },
  {
    label: 'Primary email',
    value: form.value.User_PEmail || '--',
    caption: form.value.User_PEmail ? 'Main node email is set' : 'Add the main node email',
    tone: form.value.User_PEmail ? 'rich' : 'sparse',
  },
  {
    label: 'Profile fields',
    value: `${profileCompleteness.value.completeCount}/${profileCompleteness.value.total}`,
    caption: `${profileCompleteness.value.missingCount} fields remaining`,
    tone: profileCompleteness.value.missingCount === 0 ? 'rich' : 'neutral',
  },
])

const settingsFocusCards = computed(() => [
  {
    label: 'Profile readiness',
    value: `${profileCompleteness.value.completeCount}/${profileCompleteness.value.total}`,
    caption:
      profileCompleteness.value.missingCount === 0
        ? 'Everything needed is in place.'
        : `${profileCompleteness.value.missingCount} details still need to be filled in.`,
  },
  {
    label: 'Primary identity',
    value: form.value.Name || 'Name pending',
    caption: form.value.User_PEmail || 'Add the main email so the node has a stable owner identity.',
  },
  {
    label: 'Professional layer',
    value: form.value.Professional_Email || 'Professional email pending',
    caption: form.value.LinkedIn || 'LinkedIn not set yet.',
  },
  {
    label: 'Regional anchor',
    value: form.value.Country_based || 'Country pending',
    caption: form.value.Phone || 'Phone not set yet.',
  },
])

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

function mapContactToForm(contact = null) {
  return {
    Name: contact?.Name || '',
    User_PEmail: '',
    Professional_Email: contact?.Professional_Email || '',
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
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveUserSettings() {
  if (!hasBridge.value) return
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
        Professional_Email: normalizeInput(form.value.Professional_Email),
        Phone: normalizeInput(form.value.Phone),
        LinkedIn: normalizeInput(form.value.LinkedIn),
        Country_based: normalizeInput(form.value.Country_based),
      },
    }
    const result = await bridge.value.userSettings.set(payload)
    form.value = mapUserSettingsToForm(result)
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

onMounted(() => {
  if (!hasBridge.value) return
  loadUserSettings()
})
</script>

<style scoped>
.settings-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-studio {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
  gap: 18px;
  align-items: start;
}

.settings-studio__main,
.settings-studio__side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.95fr);
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

.settings-dashboard__stat-label,
.settings-dashboard__health-label,
.settings-form-card__eyebrow,
.settings-toolbar__status-label,
.settings-focus-card__label {
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

.settings-shell__hero-text {
  max-width: 58ch;
  color: #475569;
  font-family: var(--font-body);
  font-size: 0.98rem;
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

.settings-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.settings-dashboard__stat {
  display: flex;
  min-height: 112px;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
}

.settings-dashboard__stat--rich {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(219, 234, 254, 0.92));
}

.settings-dashboard__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
}

.settings-dashboard__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.96), rgba(255, 237, 213, 0.92));
}

.settings-dashboard__stat-value {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.settings-dashboard__stat-caption,
.settings-dashboard__health-text,
.settings-toolbar__status-value,
.settings-form-card__caption,
.settings-focus-card__caption {
  color: #475569;
  font-family: var(--font-body);
  font-size: 0.88rem;
  line-height: 1.55;
}

.settings-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.78);
}

.settings-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-dashboard__health-bar {
  display: flex;
  overflow: hidden;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.settings-dashboard__health-segment {
  height: 100%;
}

.settings-dashboard__health-segment--missing {
  background: linear-gradient(90deg, #f97316, #fb923c);
}

.settings-dashboard__health-segment--complete {
  background: linear-gradient(90deg, #2563eb, #60a5fa);
}

.settings-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 16px 18px;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.settings-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-toolbar__block--actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.settings-toolbar__filters-icon {
  color: #475569;
}

.settings-toolbar__status-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-form-card,
.settings-sidecar {
  border-radius: 24px;
  border-color: rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.settings-form-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px 18px;
}

.settings-form-card__title,
.settings-sidecar__title,
.settings-loadout__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.settings-form-card__title,
.settings-sidecar__title {
  font-size: 1.1rem;
}

.settings-form-card__body,
.settings-sidecar__body {
  padding: 24px;
}

.settings-sidecar__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 22px 24px 18px;
}

.settings-sidecar__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-sidecar__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
}

.settings-sidecar__item span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-sidecar__item strong {
  color: #0f172a;
  font-size: 0.95rem;
}

.settings-loadout {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-loadout__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.settings-loadout__title {
  font-size: 1.35rem;
}

.settings-loadout__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.settings-focus-card {
  border-color: rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.settings-focus-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.settings-focus-card__value {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: var(--font-weight-black);
  line-height: 1.1;
}

@media (max-width: 1120px) {
  .settings-studio,
  .settings-shell__hero {
    grid-template-columns: 1fr;
  }

  .settings-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .settings-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .settings-toolbar__block--actions,
  .settings-form-card__header,
  .settings-loadout__header {
    justify-content: flex-start;
  }

  .settings-form-card__header,
  .settings-loadout__header {
    flex-direction: column;
  }

  .settings-loadout__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .settings-shell__hero,
  .settings-toolbar,
  .settings-form-card__body,
  .settings-sidecar__body {
    padding: 20px;
  }

  .settings-loadout__grid {
    grid-template-columns: 1fr;
  }
}
</style>
