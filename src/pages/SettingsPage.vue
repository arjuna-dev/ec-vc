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
        <div
          class="avatar-shell__hero"
          :style="avatarHeroStyle"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="avatar-shell__copy">
            <div class="avatar-shell__eyebrow">Avatar Builder</div>
            <h2 class="avatar-shell__hero-title">Build the node avatar, then tune how it thinks.</h2>
            <p class="avatar-shell__hero-text">
              Shape the Level 0 presence with a live preview, game-like identity controls, and the
              usual LLM configuration inputs on the same page.
            </p>

            <div class="avatar-shell__pill-row">
              <q-badge v-for="pill in avatarHeroPills" :key="pill" class="avatar-shell__pill">
                {{ pill }}
              </q-badge>
            </div>
          </div>

          <div class="avatar-preview-card">
            <div class="avatar-preview-card__stage">
              <div class="avatar-preview-card__bot" :style="avatarBotStyle">
                <div class="avatar-preview-card__bot-core">
                  <div class="avatar-preview-card__bot-eyes"><span /><span /></div>
                  <div class="avatar-preview-card__bot-mouth" />
                </div>
              </div>
            </div>
            <div class="avatar-preview-card__label">Preview</div>
            <div class="avatar-preview-card__name">{{ avatarProfile.name || 'Avatar' }}</div>
            <div class="avatar-preview-card__meta">
              {{ avatarArchetypeLabel }} · {{ avatarColorLabel }} · {{ avatarTemperamentLabel }}
            </div>
          </div>
        </div>

        <div class="avatar-toolbar">
          <div class="avatar-toolbar__status">
            <q-icon name="construction" size="18px" class="avatar-toolbar__icon" />
            <div>
              <div class="avatar-toolbar__eyebrow">Builder Status</div>
              <div class="avatar-toolbar__text">{{ avatarStatusText }}</div>
            </div>
          </div>

          <div class="avatar-toolbar__actions">
            <B10Button
              variant="subtle"
              icon-start="refresh"
              label="Reload Keys"
              :disable="saving"
              :loading="loading"
              @click="loadSettings"
            />
            <B10Button
              variant="primary"
              icon-start="save"
              label="Save Keys"
              :loading="saving"
              :disable="loading"
              @click="saveSettings"
            />
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>{{ error }}</q-banner>

        <div class="avatar-grid">
          <q-card flat bordered class="avatar-card">
            <q-card-section class="avatar-card__header">
              <div>
                <div class="avatar-card__eyebrow">Avatar</div>
                <div class="avatar-card__title">Create the avatar</div>
              </div>
              <div class="avatar-card__caption">
                Build the identity shell the owner will play with while shaping the node.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="avatar-card__body">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input v-model="avatarProfile.name" outlined dense label="Avatar Name" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="avatarProfile.archetype" outlined dense emit-value map-options label="Archetype" :options="avatarArchetypeOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="avatarProfile.colorway" outlined dense emit-value map-options label="Colorway" :options="avatarColorOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="avatarProfile.temperament" outlined dense emit-value map-options label="Temperament" :options="avatarTemperamentOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="avatarProfile.voice" outlined dense emit-value map-options label="Voice" :options="avatarVoiceOptions" />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="avatarProfile.originStory"
                    outlined
                    autogrow
                    type="textarea"
                    label="Origin Story"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="avatar-card">
            <q-card-section class="avatar-card__header">
              <div>
                <div class="avatar-card__eyebrow">LLM Control</div>
                <div class="avatar-card__title">Tune the operator</div>
              </div>
              <div class="avatar-card__caption">
                Keep the familiar model controls and API fields close to the avatar builder.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="avatar-card__body">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select v-model="llmProfile.provider" outlined dense emit-value map-options label="Preferred Provider" :options="providerOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="llmProfile.model" outlined dense emit-value map-options label="Preferred Model" :options="modelOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="llmProfile.responseStyle" outlined dense emit-value map-options label="Response Style" :options="responseStyleOptions" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="llmProfile.autonomy" outlined dense emit-value map-options label="Autonomy" :options="autonomyOptions" />
                </div>
                <div class="col-12">
                  <div class="avatar-slider">
                    <div class="avatar-slider__row">
                      <div class="avatar-card__eyebrow">Temperature</div>
                      <div class="avatar-slider__value">{{ llmProfile.temperature.toFixed(1) }}</div>
                    </div>
                    <q-slider v-model="llmProfile.temperature" :min="0" :max="1.5" :step="0.1" color="primary" />
                  </div>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="llmProfile.systemNotes"
                    outlined
                    autogrow
                    type="textarea"
                    label="System Notes"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="avatar-grid avatar-grid--lower">
          <q-card flat bordered class="avatar-card">
            <q-card-section class="avatar-card__header">
              <div>
                <div class="avatar-card__eyebrow">API Keys</div>
                <div class="avatar-card__title">Provider access</div>
              </div>
              <div class="avatar-card__caption">
                Keys are saved locally through the app bridge. Builder preferences stay local in the browser layer.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="avatar-card__body">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="openaiApiKey"
                    outlined
                    :type="showOpenaiApiKey ? 'text' : 'password'"
                    label="OpenAI API Key"
                    :disable="loading || saving"
                  >
                    <template #append>
                      <B10IconButton
                        variant="subtle"
                        size="small"
                        :icon="showOpenaiApiKey ? 'visibility_off' : 'visibility'"
                        :disable="loading || saving"
                        @click="showOpenaiApiKey = !showOpenaiApiKey"
                      />
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="geminiApiKey"
                    outlined
                    :type="showGeminiApiKey ? 'text' : 'password'"
                    label="Gemini API Key"
                    :disable="loading || saving"
                  >
                    <template #append>
                      <B10IconButton
                        variant="subtle"
                        size="small"
                        :icon="showGeminiApiKey ? 'visibility_off' : 'visibility'"
                        :disable="loading || saving"
                        @click="showGeminiApiKey = !showGeminiApiKey"
                      />
                    </template>
                  </q-input>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="avatar-sidecar">
            <q-card-section class="avatar-sidecar__header">
              <div class="avatar-card__eyebrow">Loadout</div>
              <div class="avatar-sidecar__title">Current build</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="avatar-sidecar__body">
              <div class="avatar-sidecar__item"><span>Name</span><strong>{{ avatarProfile.name || 'Avatar' }}</strong></div>
              <div class="avatar-sidecar__item"><span>Archetype</span><strong>{{ avatarArchetypeLabel }}</strong></div>
              <div class="avatar-sidecar__item"><span>Provider</span><strong>{{ llmProviderLabel }}</strong></div>
              <div class="avatar-sidecar__item"><span>Model</span><strong>{{ llmModelLabel }}</strong></div>
              <div class="avatar-sidecar__item"><span>Voice</span><strong>{{ avatarVoiceLabel }}</strong></div>
              <div class="avatar-sidecar__item"><span>Autonomy</span><strong>{{ autonomyLabel }}</strong></div>
            </q-card-section>
          </q-card>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

const $q = useQuasar()
const AVATAR_STORAGE_KEY = 'ecvc.avatarBuilderProfile'
const LLM_STORAGE_KEY = 'ecvc.avatarLlmProfile'

const avatarArchetypeOptions = [{ label: 'Guide', value: 'guide' }, { label: 'Strategist', value: 'strategist' }, { label: 'Guardian', value: 'guardian' }, { label: 'Scout', value: 'scout' }]
const avatarColorOptions = [{ label: 'Aurora Blue', value: 'aurora-blue' }, { label: 'Solar Gold', value: 'solar-gold' }, { label: 'Forest Mint', value: 'forest-mint' }, { label: 'Signal Coral', value: 'signal-coral' }]
const avatarTemperamentOptions = [{ label: 'Calm', value: 'calm' }, { label: 'Bold', value: 'bold' }, { label: 'Warm', value: 'warm' }, { label: 'Sharp', value: 'sharp' }]
const avatarVoiceOptions = [{ label: 'Founder-friendly', value: 'founder-friendly' }, { label: 'Concise operator', value: 'concise-operator' }, { label: 'Playful guide', value: 'playful-guide' }, { label: 'Executive strategist', value: 'executive-strategist' }]
const providerOptions = [{ label: 'OpenAI', value: 'openai' }, { label: 'Gemini', value: 'gemini' }, { label: 'Hybrid', value: 'hybrid' }]
const modelOptions = [{ label: 'GPT-5 style', value: 'gpt-5-style' }, { label: 'Fast model', value: 'fast-model' }, { label: 'Deep reasoning', value: 'deep-reasoning' }, { label: 'Balanced default', value: 'balanced-default' }]
const responseStyleOptions = [{ label: 'Strategic', value: 'strategic' }, { label: 'Practical', value: 'practical' }, { label: 'Creative', value: 'creative' }, { label: 'Analytical', value: 'analytical' }]
const autonomyOptions = [{ label: 'Guard-railed', value: 'guard-railed' }, { label: 'Balanced', value: 'balanced' }, { label: 'Proactive', value: 'proactive' }]

const defaultAvatarProfile = { name: 'Avatar', archetype: 'guide', colorway: 'aurora-blue', temperament: 'calm', voice: 'founder-friendly', originStory: 'A Level 0 node presence designed to coordinate, clarify, and protect coherence.' }
const defaultLlmProfile = { provider: 'hybrid', model: 'balanced-default', responseStyle: 'strategic', autonomy: 'balanced', temperature: 0.7, systemNotes: 'Keep the workspace coherent, useful, and founder-friendly.' }

const isElectronRuntime = computed(() => typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent || ''))
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.settings?.get && !!bridge.value?.settings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const openaiApiKey = ref('')
const geminiApiKey = ref('')
const showOpenaiApiKey = ref(false)
const showGeminiApiKey = ref(false)
const avatarProfile = ref({ ...defaultAvatarProfile })
const llmProfile = ref({ ...defaultLlmProfile })

const avatarThemeMap = {
  'aurora-blue': { accent: '#4f7cff', soft: 'rgba(79,124,255,0.16)', shadow: 'rgba(79,124,255,0.24)', botMain: 'linear-gradient(180deg,#6a91ff 0%,#335cff 100%)', botGlow: 'rgba(79,124,255,0.32)', botEye: '#dff5ff' },
  'solar-gold': { accent: '#f59e0b', soft: 'rgba(245,158,11,0.16)', shadow: 'rgba(245,158,11,0.24)', botMain: 'linear-gradient(180deg,#ffd166 0%,#f59e0b 100%)', botGlow: 'rgba(245,158,11,0.28)', botEye: '#fff7db' },
  'forest-mint': { accent: '#10b981', soft: 'rgba(16,185,129,0.16)', shadow: 'rgba(16,185,129,0.24)', botMain: 'linear-gradient(180deg,#6ee7b7 0%,#059669 100%)', botGlow: 'rgba(16,185,129,0.28)', botEye: '#eafff6' },
  'signal-coral': { accent: '#fb7185', soft: 'rgba(251,113,133,0.16)', shadow: 'rgba(251,113,133,0.24)', botMain: 'linear-gradient(180deg,#fda4af 0%,#ef4444 100%)', botGlow: 'rgba(251,113,133,0.28)', botEye: '#fff0f3' },
}

const avatarArchetypeLabel = computed(() => avatarArchetypeOptions.find((o) => o.value === avatarProfile.value.archetype)?.label || 'Guide')
const avatarColorLabel = computed(() => avatarColorOptions.find((o) => o.value === avatarProfile.value.colorway)?.label || 'Aurora Blue')
const avatarTemperamentLabel = computed(() => avatarTemperamentOptions.find((o) => o.value === avatarProfile.value.temperament)?.label || 'Calm')
const avatarVoiceLabel = computed(() => avatarVoiceOptions.find((o) => o.value === avatarProfile.value.voice)?.label || 'Founder-friendly')
const llmProviderLabel = computed(() => providerOptions.find((o) => o.value === llmProfile.value.provider)?.label || 'Hybrid')
const llmModelLabel = computed(() => modelOptions.find((o) => o.value === llmProfile.value.model)?.label || 'Balanced default')
const autonomyLabel = computed(() => autonomyOptions.find((o) => o.value === llmProfile.value.autonomy)?.label || 'Balanced')

const avatarHeroPills = computed(() => [avatarArchetypeLabel.value, avatarColorLabel.value, llmProviderLabel.value])
const avatarStatusText = computed(() => saving.value ? 'Saving provider keys...' : loading.value ? 'Loading avatar control surface...' : `${avatarProfile.value.name || 'Avatar'} is set to ${avatarArchetypeLabel.value.toLowerCase()} mode with ${llmProviderLabel.value}.`)
const avatarHeroStyle = computed(() => {
  const theme = avatarThemeMap[avatarProfile.value.colorway] || avatarThemeMap['aurora-blue']
  return { '--avatar-hero-soft': theme.soft, '--avatar-hero-shadow': theme.shadow }
})
const avatarBotStyle = computed(() => {
  const theme = avatarThemeMap[avatarProfile.value.colorway] || avatarThemeMap['aurora-blue']
  return { '--avatar-bot-main': theme.botMain, '--avatar-bot-glow': theme.botGlow, '--avatar-bot-eye': theme.botEye }
})

watch(avatarProfile, (value) => { if (typeof window !== 'undefined') window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(value)) }, { deep: true })
watch(llmProfile, (value) => { if (typeof window !== 'undefined') window.localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(value)) }, { deep: true })

function loadLocalBuilderState() {
  if (typeof window === 'undefined') return
  try {
    const storedAvatar = window.localStorage.getItem(AVATAR_STORAGE_KEY)
    if (storedAvatar) avatarProfile.value = { ...defaultAvatarProfile, ...JSON.parse(storedAvatar) }
  } catch {
    avatarProfile.value = { ...defaultAvatarProfile }
  }
  try {
    const storedLlm = window.localStorage.getItem(LLM_STORAGE_KEY)
    if (storedLlm) llmProfile.value = { ...defaultLlmProfile, ...JSON.parse(storedLlm) }
  } catch {
    llmProfile.value = { ...defaultLlmProfile }
  }
}

function onHeroDashboardPointerEnter(event) {
  updateHeroDashboardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}
function onHeroDashboardPointerMove(event) { updateHeroDashboardGradientPosition(event) }
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

function normalizeInput(value) { return String(value || '').trim() }
function normalizeIpcErrorMessage(errorValue) {
  const raw = String(errorValue?.message || errorValue || '').trim()
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
    const result = await bridge.value.settings.set({
      openaiApiKey: normalizeInput(openaiApiKey.value),
      geminiApiKey: normalizeInput(geminiApiKey.value),
    })
    openaiApiKey.value = result?.openaiApiKey || ''
    geminiApiKey.value = result?.geminiApiKey || ''
    $q.notify({ type: 'positive', message: 'API keys saved' })
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadLocalBuilderState()
  if (hasBridge.value) loadSettings()
})
</script>

<style scoped>
.avatar-page,.avatar-shell{display:flex;flex-direction:column;gap:24px}
.avatar-shell__hero{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:24px;padding:28px;overflow:hidden;border:1px solid rgba(15,23,42,.08);border-radius:28px;background:radial-gradient(circle at 12% 18%,var(--avatar-hero-soft),transparent 32%),linear-gradient(135deg,rgba(255,255,255,.98),rgba(243,246,255,.96));box-shadow:0 22px 48px rgba(15,23,42,.08);transition:transform 180ms ease,box-shadow 180ms ease}
.avatar-shell__hero::before{position:absolute;inset:0;content:'';background:radial-gradient(circle at var(--hero-dashboard-blob-x,50%) var(--hero-dashboard-blob-y,28%),var(--avatar-hero-shadow) 0%,var(--avatar-hero-soft) 34%,transparent 64%);opacity:var(--hero-dashboard-blob-opacity,0);pointer-events:none;transition:opacity 180ms ease}
.avatar-shell__hero:hover{transform:translateY(-2px);box-shadow:0 28px 56px rgba(15,23,42,.1)}
.avatar-shell__hero>*{position:relative;z-index:1}
.avatar-shell__copy{display:flex;flex-direction:column;gap:16px}
.avatar-shell__eyebrow,.avatar-card__eyebrow,.avatar-toolbar__eyebrow,.avatar-preview-card__label{color:#64748b;font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.avatar-shell__hero-title{margin:0;color:#0f172a;font-family:var(--font-title);font-size:clamp(2rem,3vw,2.9rem);font-weight:var(--font-weight-black);line-height:.94;max-width:12ch}
.avatar-shell__hero-text,.avatar-card__caption,.avatar-toolbar__text,.avatar-preview-card__meta{color:#475569;font-family:var(--font-body);line-height:1.6}
.avatar-shell__pill-row{display:flex;flex-wrap:wrap;gap:8px}
.avatar-shell__pill{padding:6px 10px;color:#111827;background:rgba(255,255,255,.82);border:1px solid rgba(17,17,17,.08);border-radius:999px;font-size:11px;font-weight:600}
.avatar-preview-card{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:24px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.74);backdrop-filter:blur(18px)}
.avatar-preview-card__stage{display:flex;align-items:center;justify-content:center;min-height:280px;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(226,232,240,.45))}
.avatar-preview-card__bot{display:flex;width:164px;height:198px;align-items:center;justify-content:center;border-radius:44px 44px 36px 36px;background:var(--avatar-bot-main);box-shadow:0 24px 44px var(--avatar-bot-glow),inset 0 1px 0 rgba(255,255,255,.38)}
.avatar-preview-card__bot-core{display:flex;width:116px;height:116px;flex-direction:column;align-items:center;justify-content:center;gap:18px;border-radius:32px;background:rgba(15,23,42,.2)}
.avatar-preview-card__bot-eyes{display:flex;gap:18px}
.avatar-preview-card__bot-eyes span{display:block;width:18px;height:18px;border-radius:999px;background:var(--avatar-bot-eye);box-shadow:0 0 14px rgba(255,255,255,.44)}
.avatar-preview-card__bot-mouth{width:46px;height:10px;border-radius:999px;background:rgba(255,255,255,.58)}
.avatar-preview-card__name,.avatar-card__title,.avatar-sidecar__title{color:#0f172a;font-family:var(--font-title);font-size:1.1rem;font-weight:var(--font-weight-black);line-height:1}
.avatar-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:16px 18px;border-radius:24px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.92);box-shadow:0 16px 34px rgba(15,23,42,.06)}
.avatar-toolbar__status,.avatar-toolbar__actions{display:flex;align-items:center;gap:12px}
.avatar-toolbar__actions{justify-content:flex-end;flex-wrap:wrap}
.avatar-toolbar__icon{color:#475569}
.avatar-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.avatar-grid--lower{grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr)}
.avatar-card,.avatar-sidecar{border-radius:24px;border-color:rgba(15,23,42,.08);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.94));box-shadow:0 18px 40px rgba(15,23,42,.06)}
.avatar-card__header,.avatar-sidecar__header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 24px 18px}
.avatar-card__body,.avatar-sidecar__body{padding:24px}
.avatar-slider{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.8);border:1px solid rgba(15,23,42,.08)}
.avatar-slider__row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.avatar-sidecar__body{display:flex;flex-direction:column;gap:12px}
.avatar-sidecar__item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.78);border:1px solid rgba(15,23,42,.08)}
.avatar-sidecar__item span{color:#64748b;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.avatar-sidecar__item strong{color:#0f172a;font-size:.95rem}
@media (max-width:1200px){.avatar-shell__hero,.avatar-grid,.avatar-grid--lower{grid-template-columns:1fr}.avatar-toolbar{grid-template-columns:1fr;align-items:stretch}.avatar-toolbar__status,.avatar-toolbar__actions,.avatar-card__header,.avatar-sidecar__header{flex-direction:column;align-items:stretch}.avatar-toolbar__actions{justify-content:flex-start}}
@media (max-width:640px){.avatar-shell__hero,.avatar-preview-card,.avatar-card__body,.avatar-sidecar__body{padding:20px}.avatar-preview-card__stage{min-height:220px}.avatar-preview-card__bot{width:132px;height:164px}.avatar-preview-card__bot-core{width:94px;height:94px}}
</style>
