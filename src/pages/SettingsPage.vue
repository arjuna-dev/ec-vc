<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Avatar requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="avatar-page">
      <section class="avatar-shell">
        <div class="avatar-shell__hero">
          <div class="avatar-shell__copy">
            <div class="avatar-shell__eyebrow">Avatar</div>
            <h2 class="avatar-shell__hero-title">Avatar house, node identity, and control surface.</h2>
            <p class="avatar-shell__hero-text">
              The Avatar is the Level 0 designation for the Owner-facing node agent. This page is
              its house, landing, and control surface for identity-level operating settings.
            </p>
          </div>

          <div class="avatar-shell__meta">
            <div class="avatar-shell__meta-card">
              <div class="avatar-shell__meta-label">Home</div>
              <div class="avatar-shell__meta-value">Avatar House</div>
              <div class="avatar-shell__meta-caption">Level 0 node coordination</div>
            </div>
            <div class="avatar-shell__meta-card">
              <div class="avatar-shell__meta-label">Settings</div>
              <div class="avatar-shell__meta-value">API + identity</div>
              <div class="avatar-shell__meta-caption">Local control surface</div>
            </div>
          </div>
        </div>

        <section class="avatar-homebase">
          <div class="avatar-homebase__copy">
            <div class="avatar-homebase__eyebrow">Avatar House</div>
            <h3 class="avatar-homebase__title">The Avatar lives here.</h3>
            <p class="avatar-homebase__text">
              This is the master landing area for the Level 0 node agent: the Owner-facing avatar
              that coordinates, delegates, and protects coherence across the workspace.
            </p>
          </div>

          <q-card flat bordered class="golden-agent-house">
            <q-card-section class="golden-agent-house__header">
              <div class="row items-start justify-between q-col-gutter-sm no-wrap">
                <div class="col">
                  <div class="golden-agent-house__title-row">
                    <q-icon name="home" size="22px" class="golden-agent-house__home-icon" />
                    <div class="golden-agent-house__title">{{ goldenAgentHome.name }}</div>
                  </div>
                  <div class="golden-agent-house__meta">
                    {{ goldenAgentHome.domain }} · Parent {{ goldenAgentHome.parent }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-chip
                    dense
                    square
                    :color="goldenAgentHome.configStatus === 'Live Config' ? 'green-1' : 'grey-2'"
                    :text-color="goldenAgentHome.configStatus === 'Live Config' ? 'green-10' : 'grey-8'"
                  >
                    {{ goldenAgentHome.configStatus }}
                  </q-chip>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="golden-agent-house__body">
              <div class="golden-agent-house__panel">
                <div class="golden-agent-house__panel-label">Mission</div>
                <div class="golden-agent-house__panel-value">{{ goldenAgentHome.mission }}</div>
              </div>

              <div class="golden-agent-house__panel">
                <div class="golden-agent-house__panel-label">Managed Scope</div>
                <div class="golden-agent-house__panel-value">{{ goldenAgentHome.scope }}</div>
              </div>

              <div class="golden-agent-house__panel">
                <div class="golden-agent-house__panel-label">Responsibilities</div>
                <div class="golden-agent-house__pill-row">
                  <q-chip
                    v-for="responsibility in goldenAgentHome.responsibilities"
                    :key="responsibility"
                    dense
                    square
                    class="golden-agent-house__pill"
                  >
                    {{ responsibility }}
                  </q-chip>
                </div>
              </div>

              <div class="golden-agent-house__footer">
                <div class="golden-agent-house__footer-item">
                  <span class="golden-agent-house__footer-label">Linked config</span>
                  <span class="golden-agent-house__footer-value">
                    {{ goldenAgentHome.linkedConfigName || 'Not attached yet' }}
                  </span>
                </div>
                <div class="golden-agent-house__footer-item">
                  <span class="golden-agent-house__footer-label">Next action</span>
                  <span class="golden-agent-house__footer-value">{{ goldenAgentHome.nextAction }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </section>

        <section class="avatar-settings">
          <div class="avatar-settings__header">
            <div>
              <div class="avatar-settings__eyebrow">Settings</div>
              <h3 class="avatar-settings__title">API settings inside the Avatar view.</h3>
            </div>
            <div class="avatar-settings__caption">
              Keys stay local to the app database, but they now live under the Avatar control
              surface instead of owning the whole page.
            </div>
          </div>

          <q-banner v-if="error" class="bg-red-2 text-black" rounded>
            {{ error }}
          </q-banner>

          <q-card bordered flat class="avatar-settings__card">
            <q-card-section class="q-gutter-md">
              <div class="text-subtitle2">API settings</div>

              <q-input
                v-model="openaiApiKey"
                outlined
                :type="showOpenaiApiKey ? 'text' : 'password'"
                label="OpenAI API Key"
                autocomplete="off"
                spellcheck="false"
                :disable="loading || saving"
              >
                <template #append>
                  <B10IconButton
                    variant="subtle"
                    size="small"
                    :icon="showOpenaiApiKey ? 'visibility_off' : 'visibility'"
                    :disable="loading || saving"
                    :aria-label="showOpenaiApiKey ? 'Hide OpenAI API key' : 'Show OpenAI API key'"
                    @click="showOpenaiApiKey = !showOpenaiApiKey"
                  />
                </template>
              </q-input>

              <q-input
                v-model="geminiApiKey"
                outlined
                :type="showGeminiApiKey ? 'text' : 'password'"
                label="Gemini API Key"
                autocomplete="off"
                spellcheck="false"
                :disable="loading || saving"
              >
                <template #append>
                  <B10IconButton
                    variant="subtle"
                    size="small"
                    :icon="showGeminiApiKey ? 'visibility_off' : 'visibility'"
                    :disable="loading || saving"
                    :aria-label="showGeminiApiKey ? 'Hide Gemini API key' : 'Show Gemini API key'"
                    @click="showGeminiApiKey = !showGeminiApiKey"
                  />
                </template>
              </q-input>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
              <B10Button
                variant="subtle"
                icon-start="refresh"
                label="Reload"
                :disable="saving"
                :loading="loading"
                @click="loadSettings"
              />
              <B10Button
                variant="primary"
                icon-start="save"
                label="Save"
                :loading="saving"
                :disable="loading"
                @click="saveSettings"
              />
            </q-card-actions>
          </q-card>
        </section>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

const $q = useQuasar()

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.settings?.get && !!bridge.value?.settings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const openaiApiKey = ref('')
const geminiApiKey = ref('')
const showOpenaiApiKey = ref(false)
const showGeminiApiKey = ref(false)

const goldenAgentHome = computed(() => ({
  name: 'Avatar',
  domain: 'Node',
  parent: 'Owner',
  mission: 'Act as the Owner-facing Level 0 coordinator for the node and keep priorities aligned.',
  scope: 'Whole workspace, all sections, and cross-domain orchestration.',
  responsibilities: ['Delegate work', 'Keep coherence', 'Escalate priorities'],
  linkedConfigName: null,
  configStatus: 'Blueprint',
  nextAction: 'Define core operating rules and escalation paths.',
}))

function normalizeInput(value) {
  return String(value || '').trim()
}

function normalizeIpcErrorMessage(error) {
  const raw = String(error?.message || error || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

async function loadSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.settings.get()
    openaiApiKey.value = result?.openaiApiKey || ''
    geminiApiKey.value = result?.geminiApiKey || ''
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  if (!hasBridge.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      openaiApiKey: normalizeInput(openaiApiKey.value),
      geminiApiKey: normalizeInput(geminiApiKey.value),
    }

    const result = await bridge.value.settings.set(payload)
    openaiApiKey.value = result?.openaiApiKey || ''
    geminiApiKey.value = result?.geminiApiKey || ''
    $q.notify({ type: 'positive', message: 'Settings saved' })
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
  loadSettings()
})
</script>

<style scoped>
.avatar-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.avatar-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 16px;
}

.avatar-shell__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-card-soft);
}

.avatar-shell__copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.avatar-shell__eyebrow,
.avatar-homebase__eyebrow,
.avatar-settings__eyebrow,
.golden-agent-house__panel-label,
.golden-agent-house__footer-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.avatar-shell__hero-title,
.avatar-homebase__title,
.avatar-settings__title {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.98;
}

.avatar-shell__hero-title {
  font-size: clamp(2rem, 3vw, 2.8rem);
  max-width: 12ch;
}

.avatar-homebase__title,
.avatar-settings__title {
  font-size: clamp(1.35rem, 2vw, 1.9rem);
}

.avatar-shell__hero-text,
.avatar-homebase__text,
.avatar-settings__caption,
.avatar-shell__meta-caption {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  line-height: var(--ds-line-height-base);
}

.avatar-shell__hero-text,
.avatar-homebase__text {
  margin: 0;
  max-width: 48ch;
}

.avatar-shell__meta {
  display: grid;
  gap: 12px;
}

.avatar-shell__meta-card {
  padding: 16px 18px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface-overlay-84);
  box-shadow: var(--ds-shadow-card-soft);
}

.avatar-shell__meta-label {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.avatar-shell__meta-value {
  margin-top: 8px;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: 1.3rem;
  font-weight: var(--ds-font-weight-black);
}

.avatar-homebase,
.avatar-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.avatar-homebase__copy,
.avatar-settings__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.golden-agent-house {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border-color: rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.golden-agent-house::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 16%, rgba(38, 71, 255, 0.1), transparent 34%),
    radial-gradient(circle at 88% 0%, rgba(235, 255, 90, 0.12), transparent 28%);
}

.golden-agent-house > * {
  position: relative;
  z-index: 1;
}

.golden-agent-house__header {
  padding-bottom: 10px;
}

.golden-agent-house__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.golden-agent-house__home-icon {
  color: #2647ff;
}

.golden-agent-house__title {
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.2;
}

.golden-agent-house__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.82rem;
}

.golden-agent-house__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.golden-agent-house__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
}

.golden-agent-house__panel-value,
.golden-agent-house__footer-value {
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.5;
}

.golden-agent-house__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.golden-agent-house__pill {
  background: rgba(38, 71, 255, 0.08);
  color: #2647ff;
}

.golden-agent-house__footer {
  display: grid;
  gap: 10px;
}

.golden-agent-house__footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avatar-settings__card {
  max-width: 820px;
}

@media (max-width: 900px) {
  .avatar-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .avatar-homebase,
  .avatar-settings {
    padding: 20px;
  }

  .avatar-homebase__copy,
  .avatar-settings__header {
    flex-direction: column;
  }
}
</style>
