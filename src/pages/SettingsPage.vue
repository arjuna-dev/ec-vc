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
            <h2 class="avatar-shell__hero-title">Tune your Avatar</h2>

            <div class="avatar-preview-inline">
              <div class="avatar-preview-inline__stage">
                <div class="avatar-preview-inline__bot" :style="avatarBotStyle">
                  <q-icon name="smart_toy" class="avatar-preview-inline__icon" />
                </div>
              </div>
              <div class="avatar-preview-inline__name">{{ avatarProfile.name || 'Mini-Me' }}</div>
              <div class="avatar-preview-inline__meta">
                {{ avatarArchetypeLabel }} / {{ avatarColorLabel }} / {{ avatarTemperamentLabel }}
              </div>
            </div>

            <p class="avatar-shell__hero-text">{{ avatarSummaryText }}</p>
          </div>

          <div class="avatar-hero-controls">
            <div class="avatar-hero-controls__frame">
              <div class="avatar-card__switcher">
                <B10IconButton
                  variant="subtle"
                  size="small"
                  icon="chevron_left"
                  aria-label="Show previous avatar control panel"
                  @click="showPreviousHeroControl"
                />
                <div class="avatar-card__switcher-label">{{ activeHeroControlStepLabel }}</div>
                <B10IconButton
                  variant="subtle"
                  size="small"
                  icon="chevron_right"
                  aria-label="Show next avatar control panel"
                  @click="showNextHeroControl"
                />
              </div>
            </div>
            <q-card flat bordered class="avatar-card avatar-card--hero">
              <q-card-section class="avatar-card__header">
                <div class="avatar-card__header-copy">
                  <div class="avatar-card__eyebrow">{{ activeHeroControlEyebrow }}</div>
                  <div class="avatar-card__title">{{ activeHeroControlTitle }}</div>
                </div>
                <div class="avatar-card__header-actions">
                  <div class="avatar-card__caption">{{ activeHeroControlCaption }}</div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section v-if="activeHeroControl === 'shell'" class="avatar-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input v-model="avatarProfile.name" outlined dense label="Avatar Name" />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="avatarProfile.archetype"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Archetype"
                      :options="avatarArchetypeOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="avatarProfile.colorway"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Colorway"
                      :options="avatarColorOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="avatarProfile.temperament"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Temperament"
                      :options="avatarTemperamentOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="avatarProfile.voice"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Voice"
                      :options="avatarVoiceOptions"
                    />
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
              <q-card-section v-else-if="activeHeroControl === 'operator'" class="avatar-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="llmProfile.provider"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Preferred Provider"
                      :options="providerOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="llmProfile.model"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Preferred Model"
                      :options="modelOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="llmProfile.responseStyle"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Response Style"
                      :options="responseStyleOptions"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="llmProfile.autonomy"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Autonomy"
                      :options="autonomyOptions"
                    />
                  </div>
                  <div class="col-12">
                    <div class="avatar-slider">
                      <div class="avatar-slider__row">
                        <div class="avatar-card__eyebrow">Temperature</div>
                        <div class="avatar-slider__value">{{ llmProfile.temperature.toFixed(1) }}</div>
                      </div>
                      <q-slider
                        v-model="llmProfile.temperature"
                        :min="0"
                        :max="1.5"
                        :step="0.1"
                        color="primary"
                      />
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
              <q-card-actions
                v-if="activeHeroControl === 'operator'"
                align="right"
                class="avatar-card__actions"
              >
                <B10Button
                  variant="primary"
                  icon-start="save"
                  label="Save Keys"
                  :loading="saving"
                  :disable="loading"
                  @click="saveSettings"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>{{ error }}</q-banner>

        <div class="avatar-loadout">
          <div class="avatar-loadout__header">
            <div>
              <div class="avatar-card__eyebrow">Loadout Deck</div>
              <div class="avatar-loadout__title">Previous and alternate builds</div>
            </div>
            <div class="avatar-card__caption">
              Swap between saved moods and operator setups while shaping the right avatar fit.
            </div>
          </div>

          <div class="avatar-builds-inline">
            <q-card
              v-for="build in avatarBuildDeck"
              :key="build.id"
              flat
              bordered
              class="avatar-build-card"
              clickable
              @click="applyBuildPreset(build)"
            >
              <q-card-section class="avatar-build-card__header">
                <div class="avatar-build-card__badge" :style="build.previewStyle">
                  <q-icon name="smart_toy" class="avatar-build-card__icon" />
                </div>
                <div>
                  <div class="avatar-build-card__title">{{ build.name }}</div>
                  <div class="avatar-build-card__meta">
                    {{ build.archetypeLabel }} / {{ build.colorLabel }} / {{ build.temperamentLabel }}
                  </div>
                </div>
              </q-card-section>
              <q-card-section class="avatar-build-card__body">
                <div class="avatar-build-card__summary">{{ build.summary }}</div>
              </q-card-section>
              <q-card-actions align="right" class="avatar-build-card__actions">
                <B10Button
                  variant="subtle"
                  icon-start="download"
                  label="Load"
                  @click.stop="applyBuildPreset(build)"
                />
              </q-card-actions>
            </q-card>
          </div>
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

const avatarArchetypeOptions = [
  { label: 'Guide', value: 'guide' },
  { label: 'Strategist', value: 'strategist' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Scout', value: 'scout' },
]
const avatarColorOptions = [
  { label: 'Aurora Blue', value: 'aurora-blue' },
  { label: 'Solar Gold', value: 'solar-gold' },
  { label: 'Forest Mint', value: 'forest-mint' },
  { label: 'Signal Coral', value: 'signal-coral' },
]
const avatarTemperamentOptions = [
  { label: 'Calm', value: 'calm' },
  { label: 'Bold', value: 'bold' },
  { label: 'Warm', value: 'warm' },
  { label: 'Sharp', value: 'sharp' },
]
const avatarVoiceOptions = [
  { label: 'Founder-friendly', value: 'founder-friendly' },
  { label: 'Concise operator', value: 'concise-operator' },
  { label: 'Playful guide', value: 'playful-guide' },
  { label: 'Executive strategist', value: 'executive-strategist' },
]
const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'Hybrid', value: 'hybrid' },
]
const modelOptions = [
  { label: 'GPT-5 style', value: 'gpt-5-style' },
  { label: 'Fast model', value: 'fast-model' },
  { label: 'Deep reasoning', value: 'deep-reasoning' },
  { label: 'Balanced default', value: 'balanced-default' },
]
const responseStyleOptions = [
  { label: 'Strategic', value: 'strategic' },
  { label: 'Practical', value: 'practical' },
  { label: 'Creative', value: 'creative' },
  { label: 'Analytical', value: 'analytical' },
]
const autonomyOptions = [
  { label: 'Guard-railed', value: 'guard-railed' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Proactive', value: 'proactive' },
]

const defaultAvatarProfile = {
  name: 'Mini-Me',
  archetype: 'strategist',
  colorway: 'aurora-blue',
  temperament: 'calm',
  voice: 'founder-friendly',
  originStory: 'A composed strategist avatar tuned to help the owner steer the node with clarity and momentum.',
}
const defaultLlmProfile = {
  provider: 'hybrid',
  model: 'balanced-default',
  responseStyle: 'strategic',
  autonomy: 'balanced',
  temperature: 0.7,
  systemNotes: 'Keep the workspace coherent, useful, and founder-friendly.',
}

const isElectronRuntime = computed(
  () => typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent || '')
)
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.settings?.get && !!bridge.value?.settings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const activeHeroControl = ref('shell')
const openaiApiKey = ref('')
const geminiApiKey = ref('')
const showOpenaiApiKey = ref(false)
const showGeminiApiKey = ref(false)
const avatarProfile = ref({ ...defaultAvatarProfile })
const llmProfile = ref({ ...defaultLlmProfile })

const avatarThemeMap = {
  'aurora-blue': {
    soft: 'rgba(79,124,255,0.16)',
    shadow: 'rgba(79,124,255,0.24)',
    botMain: 'linear-gradient(180deg,#6a91ff 0%,#335cff 100%)',
    botGlow: 'rgba(79,124,255,0.32)',
    botEye: '#dff5ff',
  },
  'solar-gold': {
    soft: 'rgba(245,158,11,0.16)',
    shadow: 'rgba(245,158,11,0.24)',
    botMain: 'linear-gradient(180deg,#ffd166 0%,#f59e0b 100%)',
    botGlow: 'rgba(245,158,11,0.28)',
    botEye: '#fff7db',
  },
  'forest-mint': {
    soft: 'rgba(16,185,129,0.16)',
    shadow: 'rgba(16,185,129,0.24)',
    botMain: 'linear-gradient(180deg,#6ee7b7 0%,#059669 100%)',
    botGlow: 'rgba(16,185,129,0.28)',
    botEye: '#eafff6',
  },
  'signal-coral': {
    soft: 'rgba(251,113,133,0.16)',
    shadow: 'rgba(251,113,133,0.24)',
    botMain: 'linear-gradient(180deg,#fda4af 0%,#ef4444 100%)',
    botGlow: 'rgba(251,113,133,0.28)',
    botEye: '#fff0f3',
  },
}

const avatarArchetypeLabel = computed(
  () => avatarArchetypeOptions.find((option) => option.value === avatarProfile.value.archetype)?.label || 'Strategist'
)
const avatarColorLabel = computed(
  () => avatarColorOptions.find((option) => option.value === avatarProfile.value.colorway)?.label || 'Aurora Blue'
)
const avatarTemperamentLabel = computed(
  () => avatarTemperamentOptions.find((option) => option.value === avatarProfile.value.temperament)?.label || 'Calm'
)
const llmProviderLabel = computed(
  () => providerOptions.find((option) => option.value === llmProfile.value.provider)?.label || 'Hybrid'
)
const llmModelLabel = computed(
  () => modelOptions.find((option) => option.value === llmProfile.value.model)?.label || 'Balanced default'
)
const autonomyLabel = computed(
  () => autonomyOptions.find((option) => option.value === llmProfile.value.autonomy)?.label || 'Balanced'
)
const activeHeroControlEyebrow = computed(() =>
  activeHeroControl.value === 'shell' ? 'Avatar Tuning' : 'LLM Control'
)
const activeHeroControlTitle = computed(() =>
  activeHeroControl.value === 'shell' ? 'Tune the shell' : 'Tune the operator'
)
const activeHeroControlCaption = computed(() =>
  activeHeroControl.value === 'shell'
    ? 'Set how the avatar looks, sounds, and introduces itself in the workspace.'
    : 'Keep the familiar model controls and API fields close to the avatar builder.'
)
const activeHeroControlStepLabel = computed(() => (activeHeroControl.value === 'shell' ? '1 / 2' : '2 / 2'))

const avatarSummaryText = computed(
  () => normalizeInput(avatarProfile.value.originStory) || defaultAvatarProfile.originStory
)
const avatarThemeFor = (colorway) => avatarThemeMap[colorway] || avatarThemeMap['aurora-blue']
const createPreviewStyle = (colorway) => {
  const theme = avatarThemeFor(colorway)
  return {
    '--avatar-build-main': theme.botMain,
    '--avatar-build-glow': theme.botGlow,
  }
}
const avatarHeroStyle = computed(() => {
  const theme = avatarThemeMap[avatarProfile.value.colorway] || avatarThemeMap['aurora-blue']
  return { '--avatar-hero-soft': theme.soft, '--avatar-hero-shadow': theme.shadow }
})
const avatarBotStyle = computed(() => {
  const theme = avatarThemeMap[avatarProfile.value.colorway] || avatarThemeMap['aurora-blue']
  return {
    '--avatar-bot-main': theme.botMain,
    '--avatar-bot-glow': theme.botGlow,
    '--avatar-bot-eye': theme.botEye,
  }
})
const avatarBuildDeck = computed(() => [
  {
    id: 'current-build',
    name: avatarProfile.value.name || 'Mini-Me',
    archetype: avatarProfile.value.archetype,
    colorway: avatarProfile.value.colorway,
    temperament: avatarProfile.value.temperament,
    voice: avatarProfile.value.voice,
    originStory: avatarProfile.value.originStory,
    provider: llmProfile.value.provider,
    model: llmProfile.value.model,
    responseStyle: llmProfile.value.responseStyle,
    autonomy: llmProfile.value.autonomy,
    temperature: llmProfile.value.temperature,
    systemNotes: llmProfile.value.systemNotes,
    archetypeLabel: avatarArchetypeLabel.value,
    colorLabel: avatarColorLabel.value,
    temperamentLabel: avatarTemperamentLabel.value,
    providerLabel: llmProviderLabel.value,
    modelLabel: llmModelLabel.value,
    autonomyLabel: autonomyLabel.value,
    summary: avatarSummaryText.value,
    previewStyle: createPreviewStyle(avatarProfile.value.colorway),
  },
  {
    id: 'boardroom-keeper',
    name: 'Boardroom Keeper',
    archetype: 'guardian',
    colorway: 'forest-mint',
    temperament: 'warm',
    voice: 'executive-strategist',
    originStory: 'A calm room-holder built for sensitive partner updates and trust-heavy threads.',
    provider: 'hybrid',
    model: 'deep-reasoning',
    responseStyle: 'analytical',
    autonomy: 'guard-railed',
    temperature: 0.5,
    systemNotes: 'Stay measured, organized, and protective of context.',
    archetypeLabel: 'Guardian',
    colorLabel: 'Forest Mint',
    temperamentLabel: 'Warm',
    providerLabel: 'Hybrid',
    modelLabel: 'Deep reasoning',
    autonomyLabel: 'Guard-railed',
    summary: 'A calm room-holder built for sensitive partner updates and trust-heavy threads.',
    previewStyle: createPreviewStyle('forest-mint'),
  },
  {
    id: 'deal-scout',
    name: 'Deal Scout',
    archetype: 'scout',
    colorway: 'signal-coral',
    temperament: 'sharp',
    voice: 'concise-operator',
    originStory: 'A quick pattern finder for intake, triage, and first-pass sorting.',
    provider: 'openai',
    model: 'fast-model',
    responseStyle: 'practical',
    autonomy: 'proactive',
    temperature: 0.6,
    systemNotes: 'Keep momentum high and summarize fast.',
    archetypeLabel: 'Scout',
    colorLabel: 'Signal Coral',
    temperamentLabel: 'Sharp',
    providerLabel: 'OpenAI',
    modelLabel: 'Fast model',
    autonomyLabel: 'Proactive',
    summary: 'A quick pattern finder for intake, triage, and first-pass sorting.',
    previewStyle: createPreviewStyle('signal-coral'),
  },
  {
    id: 'founder-guide',
    name: 'Founder Guide',
    archetype: 'guide',
    colorway: 'solar-gold',
    temperament: 'bold',
    voice: 'playful-guide',
    originStory: 'A brighter coaching build for brainstorming, motivation, and narrative work.',
    provider: 'gemini',
    model: 'balanced-default',
    responseStyle: 'creative',
    autonomy: 'balanced',
    temperature: 1.0,
    systemNotes: 'Be encouraging, flexible, and imagination-friendly.',
    archetypeLabel: 'Guide',
    colorLabel: 'Solar Gold',
    temperamentLabel: 'Bold',
    providerLabel: 'Gemini',
    modelLabel: 'Balanced default',
    autonomyLabel: 'Balanced',
    summary: 'A brighter coaching build for brainstorming, motivation, and narrative work.',
    previewStyle: createPreviewStyle('solar-gold'),
  },
])

watch(
  avatarProfile,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(value))
    }
  },
  { deep: true }
)
watch(
  llmProfile,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(value))
    }
  },
  { deep: true }
)

function loadLocalBuilderState() {
  if (typeof window === 'undefined') return

  try {
    const storedAvatar = window.localStorage.getItem(AVATAR_STORAGE_KEY)
    if (storedAvatar) {
      avatarProfile.value = { ...defaultAvatarProfile, ...JSON.parse(storedAvatar) }
    }
  } catch {
    avatarProfile.value = { ...defaultAvatarProfile }
  }

  try {
    const storedLlm = window.localStorage.getItem(LLM_STORAGE_KEY)
    if (storedLlm) {
      llmProfile.value = { ...defaultLlmProfile, ...JSON.parse(storedLlm) }
    }
  } catch {
    llmProfile.value = { ...defaultLlmProfile }
  }
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

function normalizeInput(value) {
  return String(value || '').trim()
}

function showPreviousHeroControl() {
  activeHeroControl.value = activeHeroControl.value === 'shell' ? 'operator' : 'shell'
}

function showNextHeroControl() {
  activeHeroControl.value = activeHeroControl.value === 'shell' ? 'operator' : 'shell'
}

function applyBuildPreset(build) {
  avatarProfile.value = {
    name: build.name,
    archetype: build.archetype,
    colorway: build.colorway,
    temperament: build.temperament,
    voice: build.voice,
    originStory: build.originStory,
  }
  llmProfile.value = {
    provider: build.provider,
    model: build.model,
    responseStyle: build.responseStyle,
    autonomy: build.autonomy,
    temperature: build.temperature,
    systemNotes: build.systemNotes,
  }
  $q.notify({ type: 'positive', message: `${build.name} loaded` })
}

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
  } catch (errorValue) {
    error.value = normalizeIpcErrorMessage(errorValue)
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
  } catch (errorValue) {
    const message = normalizeIpcErrorMessage(errorValue)
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
.avatar-page,
.avatar-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.avatar-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 28px;
  background:
    radial-gradient(circle at 12% 18%, var(--avatar-hero-soft), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 255, 0.96));
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.avatar-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    var(--avatar-hero-shadow) 0%,
    var(--avatar-hero-soft) 34%,
    transparent 64%
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.avatar-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.1);
}

.avatar-shell__hero > * {
  position: relative;
  z-index: 1;
}

.avatar-shell__copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  min-height: 100%;
}

.avatar-hero-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-hero-controls__frame {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -6px;
}

.avatar-card__eyebrow,
.avatar-toolbar__eyebrow,
.avatar-shell__hero-title {
  margin: 0;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 2.9rem);
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  max-width: 9ch;
}

.avatar-shell__hero-text,
.avatar-card__caption,
.avatar-toolbar__text {
  color: #475569;
  font-family: var(--font-body);
  line-height: 1.6;
}

.avatar-preview-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-preview-inline__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  min-height: 150px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(226, 232, 240, 0.08));
}

.avatar-preview-inline__bot {
  display: flex;
  width: 104px;
  height: 126px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 32px 32px 28px 28px;
  background: var(--avatar-bot-main);
  box-shadow:
    0 24px 36px var(--avatar-bot-glow),
    0 10px 28px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transform: translateY(-4px);
}

.avatar-preview-inline__icon {
  color: rgba(255, 255, 255, 0.96);
  font-size: 58px;
  filter: drop-shadow(0 8px 18px rgba(15, 23, 42, 0.18));
}

.avatar-preview-inline__name,
.avatar-card__title,
.avatar-sidecar__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  text-align: center;
}

.avatar-preview-inline__meta {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.avatar-card,
.avatar-sidecar {
  border-color: rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.avatar-card--hero {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
}

.avatar-card__header,
.avatar-sidecar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px 18px;
}

.avatar-card__body,
.avatar-sidecar__body {
  padding: 24px;
}

.avatar-card__header-copy,
.avatar-card__header-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-card__header-actions {
  align-items: flex-end;
}

.avatar-card__switcher {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
}

.avatar-card__switcher-label {
  min-width: 40px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}

.avatar-card__body--builds {
  padding-top: 18px;
}

.avatar-card__actions {
  padding: 0 24px 22px;
}

.avatar-builds-inline {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.avatar-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
}

.avatar-slider__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.avatar-build-card {
  border-color: rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.avatar-build-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.24);
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.1);
}

.avatar-build-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 12px;
}

.avatar-build-card__badge {
  display: flex;
  width: 62px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 24px 24px 20px 20px;
  background: var(--avatar-build-main);
  box-shadow:
    0 16px 28px var(--avatar-build-glow),
    0 8px 18px rgba(15, 23, 42, 0.1);
}

.avatar-build-card__icon {
  color: rgba(255, 255, 255, 0.96);
  font-size: 34px;
}

.avatar-build-card__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1.1;
}

.avatar-build-card__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.5;
}

.avatar-build-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 18px 16px;
}

.avatar-build-card__summary {
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
}

.avatar-build-card__actions {
  padding: 0 12px 12px;
}

@media (max-width: 1200px) {
  .avatar-shell__hero,
  .avatar-builds-inline {
    grid-template-columns: 1fr;
  }

  .avatar-card__header,
  .avatar-sidecar__header {
    flex-direction: column;
    align-items: stretch;
  }

  .avatar-card__header-actions {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .avatar-shell__hero,
  .avatar-card__body {
    padding: 20px;
  }

  .avatar-preview-inline__stage {
    width: 156px;
    min-height: 130px;
  }

  .avatar-preview-inline__bot {
    width: 92px;
    height: 112px;
  }

  .avatar-preview-inline__icon {
    font-size: 50px;
  }
}
</style>
