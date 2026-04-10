<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Companion requires Electron. Run <code>quasar dev -m electron</code> or
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
            <h2 class="avatar-shell__hero-title">Tune your Companion</h2>

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

            <div class="avatar-shell__hero-actions">
              <B10Button
                variant="primary"
                icon-start="description"
                label="Companion"
                :disable="!hasDocsBridge"
                @click="showCompanionContractDialog = true"
              />
            </div>
          </div>

          <div class="avatar-hero-controls">
            <div class="avatar-hero-controls__frame">
              <div class="avatar-card__switcher">
                <B10IconButton
                  variant="subtle"
                  size="small"
                  icon="chevron_left"
                  aria-label="Show previous companion control panel"
                  @click="showPreviousHeroControl"
                />
                <div class="avatar-card__switcher-label">{{ activeHeroControlStepLabel }}</div>
                <B10IconButton
                  variant="subtle"
                  size="small"
                  icon="chevron_right"
                  aria-label="Show next companion control panel"
                  @click="showNextHeroControl"
                />
              </div>
            </div>
            <q-card flat bordered class="avatar-card avatar-card--hero">
              <q-card-section class="avatar-card__header">
                <div class="avatar-card__header-copy">
                  <div class="avatar-card__eyebrow">{{ activeHeroControlEyebrow }}</div>
                  <div v-if="activeHeroControlTitle" class="avatar-card__title">{{ activeHeroControlTitle }}</div>
                </div>
                <div class="avatar-card__header-actions">
                  <div class="avatar-card__caption">{{ activeHeroControlCaption }}</div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section v-if="activeHeroControl === 'shell'" class="avatar-card__body">
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-input v-model="avatarProfile.name" outlined dense label="Companion Name" />
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
                        <div class="avatar-slider__label">Temperature</div>
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
                </div>
              </q-card-section>
              <q-card-section v-else-if="activeHeroControl === 'keys'" class="avatar-card__body">
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
              <q-card-actions
                v-if="activeHeroControl === 'keys'"
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

        <div class="avatar-shell__roles-toolbar">
          <ShellSectionToolbar
            v-model="activeCompanionRole"
            :items="companionRoleToolbarItems"
            :show-view-toggle="false"
            aria-label="Companion Roles"
          />
        </div>

        <q-dialog v-model="showCompanionContractDialog">
          <q-card class="companion-contract-dialog">
            <q-card-section class="companion-contract-dialog__head">
              <div class="avatar-card__eyebrow">{{ activeCompanionDocument?.eyebrow || 'Companion' }}</div>
              <div class="avatar-shell__hero-title companion-contract-dialog__title">
                {{ activeCompanionDocument?.heroTitle || 'Companion' }}
              </div>
              <div class="companion-contract-dialog__owner">For the Owner</div>
              <div class="companion-contract-dialog__lead">{{ companionDialogLead }}</div>
            </q-card-section>

            <q-separator />

            <q-card-section class="companion-contract-dialog__body">
              <div class="companion-contract-workspace">
                <div class="companion-contract-workspace__main">
                  <div v-if="companionDocError" class="companion-contract-workspace__error">
                    {{ companionDocError }}
                  </div>

                  <div class="companion-contract-workspace__toolbar">
                    <div class="companion-contract-workspace__toolbar-copy">
                      <div class="companion-contract-workspace__document-title">
                        {{ activeCompanionDocument?.label || 'Companion' }}
                      </div>
                      <div class="companion-contract-workspace__document-path">
                        {{ activeCompanionDocument?.path || '' }}
                      </div>
                    </div>

                    <div class="companion-contract-workspace__toolbar-actions">
                      <B10Button
                        variant="subtle"
                        icon-start="refresh"
                        label="Reload"
                        :disable="companionDocLoading || companionDocSaving || !hasDocsBridge"
                        @click="reloadActiveCompanionDocument"
                      />
                      <B10Button
                        variant="subtle"
                        :icon-start="companionDocEditMode ? 'visibility' : 'edit'"
                        :label="companionDocEditMode ? 'View' : 'Edit'"
                        :disable="companionDocLoading || !hasDocsBridge"
                        @click="companionDocEditMode = !companionDocEditMode"
                      />
                      <B10Button
                        variant="primary"
                        icon-start="save"
                        label="Save"
                        :disable="!companionDocDirty || companionDocLoading || companionDocSaving || !hasDocsBridge"
                        :loading="companionDocSaving"
                        @click="saveActiveCompanionDocument"
                      />
                    </div>
                  </div>

                  <div v-if="companionDocLoading" class="companion-contract-workspace__loading">
                    Loading document...
                  </div>

                  <template v-else>
                    <div v-if="!companionDocEditMode && isGlossaryDocument" class="companion-glossary">
                      <div class="companion-glossary__toolbar">
                        <div class="companion-contract-workspace__section-title">Index / Glossary</div>
                        <q-select
                          v-model="companionGlossarySourceFilter"
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Source"
                          :options="companionGlossarySourceOptions"
                          class="companion-glossary__source-filter"
                        />
                      </div>

                      <div class="companion-glossary__table-wrap">
                        <table class="companion-glossary__table">
                          <thead>
                            <tr>
                              <th>Concept</th>
                              <th>Description</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="entry in filteredCompanionGlossaryEntries" :key="`${entry.Concept}-${entry.Source}`">
                              <td>{{ entry.Concept }}</td>
                              <td>{{ entry.Description }}</td>
                              <td>{{ entry.Source }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div v-else-if="!companionDocEditMode" class="companion-contract-workspace__read">
                      <pre class="companion-contract-workspace__read-pre">{{ companionDocSavedContent }}</pre>
                    </div>

                    <div v-else class="companion-contract-editor">
                      <div class="companion-contract-editor__panel">
                        <div class="companion-contract-workspace__section-title">Edit</div>
                        <q-input
                          v-model="companionDocDraftContent"
                          type="textarea"
                          autogrow
                          outlined
                          class="companion-contract-editor__input"
                        />
                      </div>

                      <div class="companion-contract-editor__panel">
                        <div class="companion-contract-workspace__section-title">Pending Markup</div>
                        <div class="companion-contract-diff">
                          <div
                            v-for="(line, index) in companionDocDiffLines"
                            :key="`${index}-${line.type}-${line.text}`"
                            class="companion-contract-diff__line"
                            :class="`companion-contract-diff__line--${line.type}`"
                          >
                            <span class="companion-contract-diff__marker">{{ companionDiffMarkerFor(line.type) }}</span>
                            <span class="companion-contract-diff__text">{{ line.text || ' ' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-if="companionDocReview" class="companion-contract-chat">
                    <div class="companion-contract-chat__eyebrow">Companion Acknowledgment</div>
                    <div class="companion-contract-chat__bubble">{{ companionDocReview }}</div>
                  </div>
                </div>

                <aside class="companion-contract-workspace__menu">
                  <div class="companion-contract-workspace__section-title">Relevant Contracts</div>
                  <button
                    v-for="document in companionDocumentMenu"
                    :key="document.id"
                    type="button"
                    class="companion-contract-menu__item"
                    :class="{ 'companion-contract-menu__item--active': document.id === activeCompanionDocumentId }"
                    @click="selectCompanionDocument(document.id)"
                  >
                    <span class="companion-contract-menu__label">{{ document.label }}</span>
                    <span class="companion-contract-menu__meta">{{ document.short }}</span>
                  </button>
                </aside>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="companion-contract-dialog__actions">
              <B10Button variant="primary" label="Close" @click="showCompanionContractDialog = false" />
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
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'

const $q = useQuasar()
const AVATAR_STORAGE_KEY = 'ecvc.avatarBuilderProfile'
const LLM_STORAGE_KEY = 'ecvc.avatarLlmProfile'
const showCompanionContractDialog = ref(false)
const companionDocumentMenu = [
  {
    id: 'companion',
    label: 'Companion',
    short: 'Main contract',
    path: 'docs/000-Companion.md',
    eyebrow: 'Companion',
    heroTitle: 'Companion',
  },
  {
    id: 'record-architecture',
    label: 'Record Architecture',
    short: 'Shell + ownership',
    path: 'docs/011-record-architecture-master-plan.md',
    eyebrow: 'Architecture',
    heroTitle: 'Record',
  },
  {
    id: 'field-class-map',
    label: 'Field Class Map',
    short: 'Token behavior',
    path: 'docs/001-field-classification-map.md',
    eyebrow: 'Field Class Map',
    heroTitle: 'Field Class',
  },
  {
    id: 'product-reference',
    label: 'Product Reference',
    short: 'Product language',
    path: 'docs/011-product-reference-guide.md',
    eyebrow: 'Reference',
    heroTitle: 'Reference',
  },
  {
    id: 'workstream-tracker',
    label: 'ECS Workstream Tracker',
    short: 'Active direction',
    path: 'docs/999-ECS_Workstream_Tracker.md',
    eyebrow: 'Tracker',
    heroTitle: 'Tracker',
  },
  {
    id: 'game-rulebook',
    label: 'Game Rulebook',
    short: 'Boards + points',
    path: 'docs/010_Game_Rulebook.md',
    eyebrow: 'Game Rulebook',
    heroTitle: 'Game',
  },
  {
    id: 'game-master',
    label: 'Game Master',
    short: 'Guide behavior',
    path: 'docs/100_Game_Master.md',
    eyebrow: 'Game Master',
    heroTitle: 'Master',
  },
  {
    id: 'glossary',
    label: 'Index / Glossary',
    short: 'Concept index',
    path: 'docs/000-language-reference-glossary.md',
    eyebrow: 'Index / Glossary',
    heroTitle: 'Glossary',
  },
]
const activeCompanionDocumentId = ref('companion')
const companionDocLoading = ref(false)
const companionDocSaving = ref(false)
const companionDocError = ref('')
const companionDocSavedContent = ref('')
const companionDocDraftContent = ref('')
const companionDocReview = ref('')
const companionDocEditMode = ref(false)
const companionGlossarySourceFilter = ref('all')

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
  originStory: 'A composed strategist companion tuned to help the owner steer the node with clarity and momentum.',
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
const hasDocsBridge = computed(() => !!bridge.value?.docs?.read && !!bridge.value?.docs?.write)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const activeHeroControl = ref('shell')
const activeCompanionRole = ref('master-companion-role')
const heroControlOrder = ['shell', 'operator', 'keys']
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
const activeHeroControlEyebrow = computed(() => {
  if (activeHeroControl.value === 'shell') return 'Tune Shell'
  if (activeHeroControl.value === 'operator') return 'LLM Control'
  return 'API Keys'
})
const activeHeroControlTitle = computed(() => '')
const activeHeroControlCaption = computed(() => {
  if (activeHeroControl.value === 'shell') {
    return 'Set how the companion looks, sounds, and introduces itself in the workspace.'
  }

  if (activeHeroControl.value === 'operator') {
    return 'Keep the familiar model controls close to the companion builder.'
  }

  return 'Store the provider keys that let your companion operator connect when needed.'
})
const activeHeroControlStepLabel = computed(() => {
  const currentIndex = heroControlOrder.indexOf(activeHeroControl.value)
  return `${currentIndex + 1} / ${heroControlOrder.length}`
})
const activeCompanionDocument = computed(
  () => companionDocumentMenu.find((document) => document.id === activeCompanionDocumentId.value) || companionDocumentMenu[0]
)
const companionRoleToolbarItems = computed(() => [
  {
    title: 'Master Companion Role',
    value: 'master-companion-role',
  },
])
const companionDialogLead = computed(() => {
  if (activeCompanionDocumentId.value === 'companion') {
    return 'This companion should be helpful about content, strict about structure, and honest about missing ownership.'
  }

  if (activeCompanionDocumentId.value === 'field-class-map') {
    return 'Use this live map to classify tokens quickly, align ownership behavior, and turn remembered exceptions into explicit structure.'
  }

  if (activeCompanionDocumentId.value === 'glossary') {
    return 'Use the glossary to keep concepts, contract terms, and their source context aligned while you edit.'
  }

  return 'Work through the active contract directly, keep changes readable, and preserve the ownership logic underneath it.'
})
const companionDocDirty = computed(() => companionDocDraftContent.value !== companionDocSavedContent.value)
const isGlossaryDocument = computed(() => activeCompanionDocumentId.value === 'glossary')
const companionGlossaryEntries = computed(() => parseGlossaryMarkdown(companionDocSavedContent.value))
const companionGlossarySourceOptions = computed(() => {
  const sources = Array.from(new Set(companionGlossaryEntries.value.map((entry) => entry.Source).filter(Boolean))).sort()
  return [{ label: 'All Sources', value: 'all' }, ...sources.map((source) => ({ label: source, value: source }))]
})
const filteredCompanionGlossaryEntries = computed(() => {
  if (companionGlossarySourceFilter.value === 'all') return companionGlossaryEntries.value
  return companionGlossaryEntries.value.filter((entry) => entry.Source === companionGlossarySourceFilter.value)
})
const companionDocDiffLines = computed(() =>
  buildLineDiff(companionDocSavedContent.value, companionDocDraftContent.value)
)

const avatarSummaryText = computed(
  () => normalizeInput(avatarProfile.value.originStory) || defaultAvatarProfile.originStory
)
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
watch(showCompanionContractDialog, (isOpen) => {
  if (!isOpen) return
  companionDocEditMode.value = false
  loadActiveCompanionDocument()
})
watch(activeCompanionDocumentId, () => {
  companionDocEditMode.value = false
  if (showCompanionContractDialog.value) loadActiveCompanionDocument()
})

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

function companionDiffMarkerFor(type) {
  if (type === 'add') return '+'
  if (type === 'remove') return '-'
  return '·'
}

function createCompanionClarityPass() {
  const diffLines = companionDocDiffLines.value
  const additions = diffLines.filter((line) => line.type === 'add').length
  const removals = diffLines.filter((line) => line.type === 'remove').length
  const headings = companionDocDraftContent.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('#')).length
  const longLines = companionDocDraftContent.value
    .split('\n')
    .filter((line) => line.length > 160).length

  const notes = [
    `${activeCompanionDocument.value?.label || 'Document'} saved with ${additions} additions and ${removals} removals.`,
    headings > 0 ? `The heading structure is still visible across ${headings} heading line(s).` : 'The heading structure is now missing, so this should be reviewed.',
    longLines > 0 ? `${longLines} long line(s) may still read densely.` : 'The updated lines look readable at a quick pass.',
  ]

  return notes.join(' ')
}

async function loadActiveCompanionDocument() {
  if (!showCompanionContractDialog.value || !hasDocsBridge.value) return

  companionDocLoading.value = true
  companionDocError.value = ''

  try {
    const result = await bridge.value.docs.read(activeCompanionDocument.value.path)
    companionDocSavedContent.value = String(result?.content || '')
    companionDocDraftContent.value = companionDocSavedContent.value
    companionDocReview.value = ''
    companionGlossarySourceFilter.value = 'all'
  } catch (errorValue) {
    companionDocError.value = normalizeIpcErrorMessage(errorValue)
  } finally {
    companionDocLoading.value = false
  }
}

async function reloadActiveCompanionDocument() {
  await loadActiveCompanionDocument()
}

function selectCompanionDocument(documentId) {
  activeCompanionDocumentId.value = documentId
}

async function saveActiveCompanionDocument() {
  if (!hasDocsBridge.value || !companionDocDirty.value) return

  companionDocSaving.value = true
  companionDocError.value = ''

  try {
    const reviewMessage = createCompanionClarityPass()
    await bridge.value.docs.write({
      relativePath: activeCompanionDocument.value.path,
      content: companionDocDraftContent.value,
    })
    companionDocSavedContent.value = companionDocDraftContent.value
    companionDocEditMode.value = false
    companionDocReview.value = reviewMessage
    $q.notify({ type: 'positive', message: `${activeCompanionDocument.value.label} saved` })
  } catch (errorValue) {
    companionDocError.value = normalizeIpcErrorMessage(errorValue)
    $q.notify({ type: 'negative', message: companionDocError.value })
  } finally {
    companionDocSaving.value = false
  }
}

function showPreviousHeroControl() {
  const currentIndex = heroControlOrder.indexOf(activeHeroControl.value)
  const nextIndex = (currentIndex - 1 + heroControlOrder.length) % heroControlOrder.length
  activeHeroControl.value = heroControlOrder[nextIndex]
}

function showNextHeroControl() {
  const currentIndex = heroControlOrder.indexOf(activeHeroControl.value)
  const nextIndex = (currentIndex + 1) % heroControlOrder.length
  activeHeroControl.value = heroControlOrder[nextIndex]
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

.avatar-shell__hero-title {
  margin: 0;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 2.9rem);
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  max-width: 9ch;
}

.avatar-card__eyebrow {
  margin: 0;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.5rem, 2.25vw, 2.175rem);
  font-weight: var(--font-weight-black);
  line-height: 0.94;
}

.avatar-shell__hero-text,
.avatar-card__caption {
  color: #475569;
  font-family: var(--font-body);
  line-height: 1.6;
}

.avatar-shell__hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-shell__roles-toolbar {
  margin-top: -2px;
}

.avatar-shell__roles-toolbar :deep(.shell-section-toolbar) {
  position: static;
  top: auto;
}

.companion-contract-dialog {
  width: min(1240px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 249, 252, 0.98));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
}

.companion-contract-dialog__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px 28px 20px;
}

.companion-contract-dialog__title {
  max-width: none;
}

.companion-contract-dialog__owner {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.companion-contract-dialog__lead,
.companion-contract-dialog__copy {
  margin: 0;
  color: #475569;
  font-family: var(--font-body);
  line-height: 1.65;
}

.companion-contract-dialog__body {
  padding: 22px 28px 28px;
  max-height: min(78vh, 920px);
  overflow: hidden;
}

.companion-contract-workspace__section-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.companion-contract-dialog__actions {
  padding: 0 28px 24px;
}

.companion-contract-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) 280px;
  gap: 20px;
  align-items: start;
  height: calc(min(78vh, 920px) - 50px);
  min-height: 0;
}

.companion-contract-workspace__main,
.companion-contract-workspace__menu {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.companion-contract-workspace__main {
  overflow-y: auto;
  max-height: 100%;
  padding-right: 4px;
}

.companion-contract-workspace__menu {
  overflow-y: auto;
  max-height: 100%;
  padding-right: 4px;
}

.companion-contract-workspace__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
}

.companion-contract-workspace__toolbar-copy,
.companion-contract-workspace__toolbar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.companion-contract-workspace__toolbar-actions {
  align-items: flex-end;
}

.companion-contract-workspace__document-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.companion-contract-workspace__document-path {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
}

.companion-contract-workspace__loading,
.companion-contract-workspace__error,
.companion-contract-workspace__read,
.companion-contract-editor__panel,
.companion-contract-workspace__menu,
.companion-contract-chat,
.companion-glossary__table-wrap {
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
}

.companion-contract-workspace__error {
  color: #991b1b;
  background: rgba(254, 242, 242, 0.92);
  border-color: rgba(239, 68, 68, 0.2);
}

.companion-contract-workspace__read-pre {
  margin: 0;
  white-space: pre-wrap;
  color: #334155;
  font-family: var(--font-body);
  line-height: 1.7;
}

.companion-contract-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-height: 0;
}

.companion-contract-editor__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.companion-contract-editor__input :deep(textarea) {
  min-height: 420px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.55;
}

.companion-contract-diff {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  max-height: 420px;
  overflow: auto;
}

.companion-contract-diff__line {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  padding: 4px 8px;
  border-radius: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
}

.companion-contract-diff__line--add {
  background: rgba(220, 252, 231, 0.8);
  color: #166534;
}

.companion-contract-diff__line--remove {
  background: rgba(254, 226, 226, 0.8);
  color: #991b1b;
}

.companion-contract-diff__line--same {
  background: rgba(241, 245, 249, 0.7);
  color: #64748b;
}

.companion-contract-diff__marker {
  font-weight: 800;
}

.companion-contract-diff__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.companion-contract-menu__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.84);
  text-align: left;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.companion-contract-menu__item:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.24);
}

.companion-contract-menu__item--active {
  border-color: rgba(37, 99, 235, 0.3);
  background: rgba(239, 246, 255, 0.92);
}

.companion-contract-menu__label {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.96rem;
  font-weight: var(--font-weight-black);
}

.companion-contract-menu__meta {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.companion-contract-chat__eyebrow {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.companion-contract-chat__bubble {
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 18px 18px 18px 6px;
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.94));
  color: #0f172a;
  line-height: 1.65;
}

.companion-glossary {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.companion-glossary__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.companion-glossary__source-filter {
  min-width: 220px;
}

.companion-glossary__table {
  width: 100%;
  border-collapse: collapse;
}

.companion-glossary__table th,
.companion-glossary__table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.companion-glossary__table th {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.86rem;
  font-weight: var(--font-weight-black);
}

.companion-glossary__table td {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.55;
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
.avatar-sidecar__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  text-align: center;
}

.avatar-card__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
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

.avatar-slider__label {
  color: rgba(0, 0, 0, 0.6);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25;
}

@media (max-width: 1200px) {
  .avatar-shell__hero {
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

  .companion-contract-workspace,
  .companion-contract-editor {
    grid-template-columns: 1fr;
  }

  .companion-contract-workspace__toolbar,
  .companion-glossary__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .companion-contract-workspace__toolbar-actions {
    align-items: stretch;
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
