<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <section
        ref="contactHeroRef"
        class="contact-databook__hero"
        :style="structuredRecordHeroStyle"
        @pointerenter="startContactHeroPointerTracking"
        @pointermove="onContactHeroPointerMove"
        @pointerleave="onContactHeroPointerLeave"
      >
        <div class="contact-databook__hero-main">
          <figure class="contact-databook__portrait contact-databook__portrait--initials-only">
            <div class="contact-databook__portrait-placeholder" aria-hidden="true">
              <div
                class="contact-databook__portrait-placeholder-initials"
                :style="{ backgroundColor: heroAvatarColor }"
              >
                {{ heroInitials }}
              </div>
            </div>
          </figure>

          <div class="contact-databook__hero-copy">
            <div class="record-shell__hero-name-row">
              <h1 class="contact-databook__name">
                {{ heroName }}
              </h1>

              <q-btn
                flat
                round
                dense
                icon="tune"
                class="record-shell__hero-icon-button"
                aria-label="Hero field settings"
              >
                <q-tooltip>Hero Fields</q-tooltip>
                <q-menu anchor="bottom right" self="top right">
                  <div class="record-shell__settings-panel">
                    <div class="record-shell__settings-title">Hero Fields</div>
                    <div
                      v-for="section in selectableSections"
                      :key="section.key"
                      class="record-shell__settings-group"
                    >
                      <button
                        type="button"
                        class="record-shell__settings-heading"
                        @click="toggleExpandedSection(section.key)"
                      >
                        <span>{{ section.label }}</span>
                        <q-icon :name="isSectionExpanded(section.key) ? 'expand_less' : 'expand_more'" size="14px" />
                      </button>

                      <div v-if="isSectionExpanded(section.key)" class="record-shell__settings-children">
                        <label
                          v-for="token in getSectionTokens(section.key)"
                          :key="token.key"
                          class="record-shell__settings-row"
                        >
                          <q-checkbox
                            :model-value="isSelectedToken(token.key)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            @update:model-value="setTokenSelected(token.key, $event)"
                          />
                          <span>{{ token.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </q-menu>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="add"
                class="record-shell__hero-icon-button record-shell__hero-icon-button--create"
                aria-label="Add record"
                @click="openCreateRecordDialog"
              >
                <q-tooltip>Add Record</q-tooltip>
              </q-btn>
            </div>

            <div class="contact-databook__role">
              {{ heroSubtitle }}
            </div>
            <div class="contact-databook__role contact-databook__role--location">
              {{ heroSecondaryLine }}
            </div>

            <div class="record-shell__hero-field-columns">
              <div v-if="selectedHeroFieldCards.length" class="record-shell__hero-field-stack">
                <article
                  v-for="field in selectedHeroFieldCards"
                  :key="field.key"
                  class="record-shell__hero-field-card"
                >
                  <div class="record-shell__hero-field-top">
                    <div class="record-shell__hero-field-label">{{ field.label }}</div>
                    <div class="record-shell__hero-field-description">{{ field.description }}</div>
                  </div>
                  <div class="record-shell__hero-field-bottom">
                    <div class="record-shell__hero-field-value">{{ field.value }}</div>
                    <q-icon :name="field.statusIcon" size="15px" class="record-shell__hero-field-status" />
                  </div>
                </article>
              </div>

              <div class="record-shell__hero-field-stack record-shell__hero-field-stack--summary">
                <article class="record-shell__hero-field-card record-shell__hero-field-card--summary">
                  <div class="record-shell__hero-field-top">
                    <div class="record-shell__hero-field-label">Summary</div>
                    <div class="record-shell__hero-field-description">General</div>
                  </div>
                  <div class="record-shell__hero-field-bottom">
                    <div class="record-shell__hero-field-value">{{ heroSummaryValue }}</div>
                    <q-icon :name="heroSummaryStatusIcon" size="15px" class="record-shell__hero-field-status" />
                  </div>
                </article>
              </div>
            </div>

            <div class="contact-databook__hero-notes-panel">
              <div class="contact-databook__hero-tabs" role="tablist" :aria-label="`${activeRegistryEntry?.label || 'Record'} context`">
                <button
                  type="button"
                  class="contact-databook__hero-tab"
                  :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'notes' }"
                  @click="genericHeroPanelTab = 'notes'"
                >
                  Latest notes
                </button>
                <button
                  type="button"
                  class="contact-databook__hero-tab"
                  :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'documents' }"
                  @click="genericHeroPanelTab = 'documents'"
                >
                  Related artifacts
                </button>
              </div>

              <ul
                v-if="genericHeroPanelTab === 'notes' && genericHeroNotes.length"
                class="contact-databook__hero-notes"
              >
                <li
                  v-for="note in genericHeroNotes"
                  :key="note.id"
                  class="contact-databook__hero-note"
                >
                  <div class="contact-databook__notes-row">
                    <div class="contact-databook__notes-title">{{ note.title }}</div>
                    <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                  </div>
                  <div v-if="note.content" class="contact-databook__notes-content">
                    {{ note.content }}
                  </div>
                </li>
              </ul>
              <div
                v-else-if="genericHeroPanelTab === 'notes'"
                class="contact-databook__hero-panel-empty"
              >
                No notes yet for this {{ (activeRegistryEntry?.singularLabel || 'record').toLowerCase() }}.
              </div>

              <ul
                v-if="genericHeroPanelTab === 'documents' && genericHeroDocuments.length"
                class="contact-databook__hero-documents"
              >
                <li
                  v-for="document in genericHeroDocuments"
                  :key="document.id"
                  class="contact-databook__hero-document"
                >
                  <div class="contact-databook__notes-row">
                    <div class="contact-databook__notes-title">{{ document.title }}</div>
                    <div class="contact-databook__notes-meta">{{ document.meta }}</div>
                  </div>
                  <div v-if="document.content" class="contact-databook__notes-content">
                    {{ document.content }}
                  </div>
                </li>
              </ul>
              <div
                v-else-if="genericHeroPanelTab === 'documents'"
                class="contact-databook__hero-panel-empty"
              >
                No related artifacts yet for this {{ (activeRegistryEntry?.singularLabel || 'record').toLowerCase() }}.
              </div>
            </div>
          </div>
        </div>

        <div class="contact-databook__summary">
          <div class="contact-databook__summary-header contact-databook__summary-header--feed">
            <div class="contact-databook__summary-label">Record Feed</div>
          </div>

          <div v-if="recordFeedTabOptions.length" class="contact-databook__summary-feed-tabs">
            <button
              v-for="tab in recordFeedTabOptions"
              :key="tab.id"
              type="button"
              class="contact-databook__summary-feed-tab"
              :class="{ 'contact-databook__summary-feed-tab--active': activeRecordFeedTab === tab.id }"
              @click="activeRecordFeedTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="displayedRecordFeedItems.length" class="contact-databook__summary-feed-list">
            <div
              v-for="item in displayedRecordFeedItems"
              :key="item.id"
              class="contact-databook__summary-feed-entry"
            >
              <div class="contact-databook__summary-feed-entry-top">
                <div class="contact-databook__summary-feed-entry-source">{{ item.sourceLabel }}</div>
                <div class="contact-databook__summary-feed-entry-time">{{ item.meta }}</div>
              </div>
              <div class="contact-databook__summary-feed-entry-title">{{ item.title }}</div>
              <div v-if="item.content" class="contact-databook__summary-feed-entry-content">
                {{ item.content }}
              </div>
            </div>
          </div>
          <div v-else class="contact-databook__summary-feed-state">
            No feed items yet for this record.
          </div>
        </div>
      </section>

      <section v-if="recordShellNavItems.length" class="contact-databook__nav" aria-label="Record sections">
        <button
          v-for="section in recordShellNavItems"
          :key="section.value"
          type="button"
          class="contact-databook__nav-item"
          :class="{
            'contact-databook__nav-item--active': activeSectionKey === section.value,
            'contact-databook__nav-item--kdb': section.isKdb,
            'contact-databook__nav-item--system': section.isSystem,
            'contact-databook__nav-item--push-right': section.pushRight,
          }"
          @click="activeSectionKey = section.value"
        >
          <span class="contact-databook__nav-item-label">{{ section.title }}</span>
          <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
        </button>
        <q-btn-toggle
          v-model="recordShellTopNavViewMode"
          dense
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          class="contact-section-card__view-toggle contact-databook__nav-view-toggle"
          :options="CONTACT_KDB_VIEW_OPTIONS"
        />
      </section>

      <section class="record-shell__panel">
        <div class="record-shell__panel-head">
          <div class="record-shell__panel-title">{{ activeSection?.label || 'Section' }}</div>
          <div class="record-shell__panel-meta">{{ activeSectionTokens.length }} fields</div>
        </div>

        <div v-if="isKdbSectionActive" class="record-shell__kdb-grid">
          <div v-for="token in activeSectionTokens" :key="token.key" class="record-shell__field-card">
            <div class="record-shell__field-label">{{ token.label }}</div>
            <div class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
          </div>
        </div>

        <div v-else class="record-shell__field-grid">
          <div
            v-for="token in activeSectionTokens"
            :key="token.key"
            class="record-shell__field-card"
            :class="{ 'record-shell__field-card--selected': isSelectedToken(token.key) }"
          >
            <div class="record-shell__field-label">{{ token.label }}</div>
            <div class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
          </div>
        </div>
      </section>

      <CreateRecordShellDialog
        :key="createDialogRenderKey"
        v-model="createDialogOpen"
        :mode="createDialogMode"
        :source-label="activeRegistryEntry?.label || 'Records'"
        :singular-label="activeRegistryEntry?.singularLabel || 'record'"
        :key-field-tokens="createKeyFieldTokens"
        :left-sections="createDialogLeftSections"
        :right-sections="createDialogRightSections"
        :loading="createDialogLoading"
        :submit-disabled="createDialogLoading"
        :initial-values="dialogInitialValues"
        :initial-field-meta="dialogInitialFieldMeta"
        initial-section-key="key-fields"
        :initial-artifacts="[]"
        :artifact-context="null"
        @change="handleDialogChange"
        @request-close="handleDialogClose"
        @submit="submitCreateRecord"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import CreateRecordShellDialog from 'src/components/CreateRecordShellDialog.vue'
import {
  CANONICAL_OPTION_LISTS,
  getCanonicalTokenFieldNames,
  getFilePageRegistryEntry,
  LEVEL_1_FILE_REGISTRY,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const CONTACT_KDB_VIEW_OPTIONS = [
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedSectionKeys = ref([])
const activeSectionKey = ref('')
const contactHeroRef = ref(null)
const contactHeroGradient = ref({ x: 50, y: 30, size: 60, opacity: 0 })
const genericHeroPanelTab = ref('notes')
const activeRecordFeedTab = ref('all')
const recordShellTopNavViewMode = ref('grid')
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const hasBridge = computed(() => Boolean(bridge.value))
const loading = ref(false)
const error = ref('')
const currentView = ref(null)
const fields = ref([])
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const isRecordRoute = computed(() => Boolean(tableNameParam.value && recordIdParam.value))
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => {
  if (isRecordRoute.value) {
    return resolveSourceKeyFromTableName(currentView.value?.table_name || tableNameParam.value) || fallbackSectionKey
  }
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [String(field?.field_name || '').trim(), field])),
)

const canonicalNameToken = computed(() => level3Tokens.value.find((token) => String(token.level_3) === '1') || null)
const canonicalSummaryToken = computed(() =>
  level3Tokens.value.find((token) => String(token.level_3) === '2' || String(token.label || '').trim().toLowerCase() === 'summary') || null,
)

const selectableTokens = computed(() =>
  level3Tokens.value.filter((token) => {
    const label = String(token.label || '').trim().toLowerCase()
    return label !== 'name' && label !== 'summary'
  }),
)

const selectedTokenKeys = computed({
  get() {
    const raw = route.query.l3
    const values = raw == null || raw === ''
      ? getDefaultSelectedTokenKeys()
      : (Array.isArray(raw) ? raw : String(raw || '').split(','))
    const allowed = new Set(selectableTokens.value.map((token) => token.key))
    return values.map((value) => String(value || '').trim()).filter((value) => value && allowed.has(value))
  },
  set(value) {
    const normalized = Array.from(new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)))
    router.replace({ query: { ...route.query, section: activeSourceKey.value, ...(normalized.length ? { l3: normalized.join(',') } : { l3: undefined }) } })
  },
})

const selectedTokenKeySet = computed(() => new Set(selectedTokenKeys.value))
const selectableSections = computed(() => level2Sections.value.filter((section) => selectableTokens.value.some((token) => token.parentKey === section.key)))
const selectedHeroTokens = computed(() => selectableTokens.value.filter((token) => selectedTokenKeySet.value.has(token.key)))
const createKeyFieldTokens = computed(() => [canonicalNameToken.value, canonicalSummaryToken.value].filter(Boolean).map(normalizeCreateDialogToken))
const createSectionGroups = computed(() =>
  selectableSections.value
    .map((section) => ({
      key: section.key,
      label: section.label,
      tokens: selectableTokens.value
        .filter((token) => token.parentKey === section.key && (isRecordRoute.value || selectedTokenKeySet.value.has(token.key)))
        .map(normalizeCreateDialogToken),
    }))
    .filter((section) => section.tokens.length),
)
const createDialogLeftSections = computed(() => createSectionGroups.value.filter((section) => !['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase())))
const createDialogRightSections = computed(() => createSectionGroups.value.filter((section) => ['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase())))
const activeSection = computed(() => level2Sections.value.find((section) => section.key === activeSectionKey.value) || level2Sections.value[0] || null)
const activeSectionTokens = computed(() => selectableTokens.value.filter((token) => token.parentKey === activeSection.value?.key))
const isKdbSectionActive = computed(() => String(activeSection.value?.label || '').trim().toLowerCase() === 'kdb')
const toolbarLeftSections = computed(() => level2Sections.value.filter((section) => !['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase())))
const toolbarRightSections = computed(() => level2Sections.value.filter((section) => ['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase())))

const heroInitials = computed(() => String(activeRegistryEntry.value?.singularLabel || 'Record').slice(0, 2).toUpperCase())
const structuredRecordThemeMap = {
  users: { strong: 'rgba(31, 111, 235, 0.2)', soft: 'rgba(31, 111, 235, 0.14)', fade: 'rgba(31, 111, 235, 0.06)' },
  artifacts: { strong: 'rgba(147, 51, 234, 0.2)', soft: 'rgba(147, 51, 234, 0.14)', fade: 'rgba(147, 51, 234, 0.06)' },
  opportunities: { strong: 'rgba(249, 115, 22, 0.2)', soft: 'rgba(249, 115, 22, 0.14)', fade: 'rgba(249, 115, 22, 0.06)' },
  funds: { strong: 'rgba(16, 185, 129, 0.2)', soft: 'rgba(16, 185, 129, 0.14)', fade: 'rgba(16, 185, 129, 0.06)' },
  rounds: { strong: 'rgba(245, 158, 11, 0.2)', soft: 'rgba(245, 158, 11, 0.14)', fade: 'rgba(245, 158, 11, 0.06)' },
  projects: { strong: 'rgba(37, 99, 235, 0.2)', soft: 'rgba(37, 99, 235, 0.14)', fade: 'rgba(37, 99, 235, 0.06)' },
  pipelines: { strong: 'rgba(37, 99, 235, 0.2)', soft: 'rgba(37, 99, 235, 0.14)', fade: 'rgba(37, 99, 235, 0.06)' },
}
const structuredRecordHeroStyle = computed(() => {
  const theme = structuredRecordThemeMap[activeSourceKey.value] || structuredRecordThemeMap.users
  return {
    '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
    '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
    '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
    '--contact-hero-blob-opacity': String(contactHeroGradient.value.opacity),
    '--contact-hero-blob-strong': theme.strong,
    '--contact-hero-blob-soft': theme.soft,
    '--contact-hero-blob-fade': theme.fade,
  }
})
const heroAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(`${activeSourceKey.value}:${heroName.value}`)) % palette.length]
})
const heroName = computed(() => getTokenDisplayValue(canonicalNameToken.value) || `${activeRegistryEntry.value?.singularLabel || 'Record'} Name`)
const heroSubtitle = computed(() => {
  if (isRecordRoute.value) return `${activeRegistryEntry.value?.label || currentView.value?.table_name || 'Record'} Record`
  return activeRegistryEntry.value?.label || 'Record Shell'
})
const heroSecondaryLine = computed(() => {
  if (isRecordRoute.value) return `Record ID ${recordIdParam.value || '-'}`
  return 'Expanded record-view skeleton for the selected L1 payload.'
})
const heroSummaryValue = computed(() => getTokenDisplayValue(canonicalSummaryToken.value) || 'No summary captured for this record yet.')
const heroSummaryStatusIcon = computed(() => (getTokenDisplayValue(canonicalSummaryToken.value) ? 'task_alt' : 'schedule'))
const selectedHeroFieldCards = computed(() =>
  selectedHeroTokens.value.map((token) => {
    const sectionLabel = level2Sections.value.find((section) => section.key === token.parentKey)?.label || 'Field'
    return {
      key: token.key,
      label: token.label,
      description: sectionLabel,
      value: getTokenDisplayValue(token),
      statusIcon: getTokenDisplayValue(token) ? 'task_alt' : 'schedule',
    }
  }),
)
const genericHeroNotes = computed(() =>
  selectedHeroTokens.value.slice(0, 4).map((token, index) => ({
    id: token.key,
    title: token.label,
    created_at: index === 0 ? 'Selected now' : 'Ready',
    content: getTokenDisplayValue(token),
  })),
)
const genericHeroDocuments = computed(() => [
  {
    id: 'record-shell-summary',
    title: 'Summary',
    meta: 'Pinned field',
    content: heroSummaryValue.value,
  },
])
const feedItems = computed(() => [
  {
    id: 'feed-1',
    feedKey: 'all',
    sourceLabel: isRecordRoute.value ? 'Record' : 'Record Shell',
    meta: isRecordRoute.value ? `ID ${recordIdParam.value || '-'}` : 'Now',
    title: isRecordRoute.value ? (currentView.value?.table_name || activeRegistryEntry.value?.label || 'Record') : 'Template feed lane',
    content: isRecordRoute.value
      ? `Viewing ${activeRegistryEntry.value?.singularLabel || 'record'} through the shared Record Shell.`
      : 'This right-side black box is the dedicated feed surface for the selected L1 record skeleton.',
  },
  {
    id: 'feed-2',
    feedKey: 'all',
    sourceLabel: 'Payload',
    meta: getFieldDisplayValue('updated_at') || getFieldDisplayValue('created_at') || 'Live',
    title: isRecordRoute.value ? 'Shared record payload' : 'L1-driven structure',
    content: isRecordRoute.value
      ? `${fields.value.length} fields loaded from databooks.view(${tableNameParam.value}, ${recordIdParam.value}).`
      : 'Changing the L1 at the top swaps the canonical record skeleton underneath this template.',
  },
])
const recordFeedTabOptions = computed(() => [{ id: 'all', label: 'All' }])
const displayedRecordFeedItems = computed(() => feedItems.value.filter((item) => item.feedKey === activeRecordFeedTab.value))
const recordShellNavItems = computed(() => [
  ...toolbarLeftSections.value.map((section) => ({ value: section.key, title: section.label, isKdb: false, isSystem: false, pushRight: false })),
  ...toolbarRightSections.value.map((section, index) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    return {
      value: section.key,
      title: section.label,
      isKdb: normalized === 'kdb',
      isSystem: normalized === 'system',
      pushRight: index === 0,
    }
  }),
])
const createDialogMode = computed(() => (isRecordRoute.value ? 'edit' : 'create'))
const dialogInitialValues = computed(() => {
  const tokens = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    tokens.map((token) => [token.key, getTokenDialogValue(token)]),
  )
})
const dialogInitialFieldMeta = computed(() => ({}))

watch(level2Sections, (sections) => {
  if (!sections.length) {
    activeSectionKey.value = ''
    expandedSectionKeys.value = []
    return
  }
  if (!sections.some((section) => section.key === activeSectionKey.value)) activeSectionKey.value = sections[0].key
  expandedSectionKeys.value = sections.map((section) => section.key)
}, { immediate: true })

watch(activeSourceKey, async () => { await ensureLiveOptionsLoaded() }, { immediate: true })
watch(
  () => `${tableNameParam.value}:${recordIdParam.value}`,
  () => {
    loadRecordView()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
})

function isSectionExpanded(sectionKey) { return expandedSectionKeys.value.includes(sectionKey) }
function toggleExpandedSection(sectionKey) {
  expandedSectionKeys.value = isSectionExpanded(sectionKey)
    ? expandedSectionKeys.value.filter((key) => key !== sectionKey)
    : [...expandedSectionKeys.value, sectionKey]
}
function getSectionTokens(sectionKey) { return selectableTokens.value.filter((token) => token.parentKey === sectionKey) }
function isSelectedToken(tokenKey) { return selectedTokenKeySet.value.has(tokenKey) }
function setTokenSelected(tokenKey, isSelected) {
  const next = new Set(selectedTokenKeys.value)
  if (isSelected) next.add(tokenKey)
  else next.delete(tokenKey)
  selectedTokenKeys.value = Array.from(next)
}

function openCreateRecordDialog() {
  createDialogMode.value = 'create'
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}
function handleDialogChange() {}
function handleDialogClose() { createDialogOpen.value = false }

async function submitCreateRecord({ values } = {}) {
  if (isRecordRoute.value) {
    await submitRecordUpdate(values)
    return
  }
  const payload = buildCreatePayload(values)
  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.[activeSourceKey.value]?.create?.(payload)
    if (!result) {
      $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
      return
    }
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    createDialogLoading.value = false
  }
}

async function submitRecordUpdate(values = {}) {
  const changes = buildRecordUpdateChanges(values)
  if (!changes.length) {
    createDialogOpen.value = false
    $q.notify({ type: 'info', message: 'No record changes to save.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.databooks?.update?.({
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
      changes,
      actionLabel: 'record_shell_edit_session',
    })
    for (const change of changes) {
      await bridge.value?.verification?.upsert?.({
        tableName: change.table_name,
        recordId: change.record_id,
        fieldName: change.field_name,
        state: 'verified',
        source: 'direct_user_input',
        actionLabel: 'record_shell_edit_session',
      })
    }
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} updated.` })
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    createDialogLoading.value = false
  }
}

function buildRecordUpdateChanges(values = {}) {
  const seenFieldNames = new Set()
  return [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
    .map((token) => {
      const field = resolveExistingFieldForToken(token)
      if (!field || !field.editable) return null
      const fieldName = String(field.field_name || '').trim()
      if (!fieldName || seenFieldNames.has(fieldName)) return null
      seenFieldNames.add(fieldName)

      const previousValue = normalizeDialogValue(field.value)
      const nextValue = normalizeDialogValue(values?.[token.key])
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
}

function buildCreatePayload(values = {}) {
  const allTokens = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens
      .map((token) => {
        const value = values?.[token.key]
        if (Array.isArray(value) && !value.length) return null
        if (!Array.isArray(value) && String(value ?? '').trim() === '') return null
        return [resolveWriteField(token), value]
      })
      .filter(Boolean),
  )
}

function resolveWriteField(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return String(token?.dbWriteField || aliases[0] || token?.tokenName || token?.key || '').trim()
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  const optionList = String(token?.optionList || '').trim()
  if (optionSource === 'canonical_list' && optionList) return CANONICAL_OPTION_LISTS[optionList] || []
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
  return Array.isArray(token?.inputOptions) ? token.inputOptions : []
}

function getLiveEntityOptionsForToken(token) {
  const sourceKey = resolveSourceKeyFromEntityName(token?.optionEntity)
  return sourceKey ? buildLiveEntityOptions(sourceKey) : []
}

function getLiveEntitySetOptionsForToken(token) {
  return (Array.isArray(token?.optionEntities) ? token.optionEntities : [])
    .map((entityName) => resolveSourceKeyFromEntityName(entityName))
    .filter(Boolean)
    .flatMap((sourceKey) => buildLiveEntityOptions(sourceKey))
}

function resolveSourceKeyFromEntityName(entityName) {
  const normalized = String(entityName || '').trim()
  return LEVEL_1_FILE_REGISTRY.find((entry) => String(entry.entityName || '').trim() === normalized)?.key || ''
}

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const titleToken = (LEVEL_3_FILE_REGISTRY_BY_KEY[sourceKey] || []).find((token) => String(token.level_3) === '1') || null
  return rows.map((row) => {
    const value = String(resolveLiveEntityRecordId(row, sourceKey) || '').trim()
    const label = String(row?.[resolveWriteField(titleToken || {})] || '').trim() || value
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

function resolveLiveEntityRecordId(row, sourceKey) {
  if (!row || typeof row !== 'object') return ''
  return sourceKey === 'artifacts' ? row.artifact_id || row.id || '' : row.id || row.artifact_id || ''
}

async function ensureLiveOptionsLoaded() {
  const tokensToLoad = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens), ...selectableTokens.value.map((token) => normalizeCreateDialogToken(token))]
  const sourceKeys = new Set()
  for (const token of tokensToLoad) {
    const optionSource = String(token?.optionSource || '').trim()
    if (optionSource === 'live_entity') {
      const sourceKey = resolveSourceKeyFromEntityName(token.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }
    if (optionSource === 'live_entity_set') {
      for (const entityName of Array.isArray(token?.optionEntities) ? token.optionEntities : []) {
        const sourceKey = resolveSourceKeyFromEntityName(entityName)
        if (sourceKey) sourceKeys.add(sourceKey)
      }
    }
  }
  for (const sourceKey of sourceKeys) {
    if (liveOptionRowsBySource.value[sourceKey]) continue
    try {
      const result = await bridge.value?.[sourceKey]?.list?.()
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: normalizeListResult(result) }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
    }
  }
}

function normalizeListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

function getDefaultSelectedTokenKeys() {
  if (activeSourceKey.value === 'users') {
    const preferred = selectableTokens.value
      .filter((token) => {
        const aliases = getCanonicalTokenFieldNames(token).map((value) => String(value || '').trim())
        const tokenName = String(token?.tokenName || '').trim()
        return aliases.includes('User_PEmail')
          || aliases.includes('Role_Name')
          || aliases.includes('id')
          || tokenName === 'User_Role'
      })
      .map((token) => token.key)
    if (preferred.length) return preferred
  }
  return selectableTokens.value.slice(0, 3).map((token) => token.key)
}

function resolveSourceKeyFromTableName(tableName) {
  const normalized = String(tableName || '').trim().toLowerCase()
  if (!normalized) return ''
  const direct = LEVEL_1_FILE_REGISTRY.find((entry) =>
    [entry.key, entry.routeName, entry.entityName, entry.label].some((value) => String(value || '').trim().toLowerCase() === normalized),
  )
  return direct?.key || ''
}

function resolveExistingFieldForToken(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return aliases.map((alias) => fieldByName.value[alias]).find(Boolean) || null
}

function getTokenRawValue(token) {
  if (!token) return ''
  const aliases = getCanonicalTokenFieldNames(token)
  for (const alias of aliases) {
    const field = fieldByName.value[alias]
    if (field && field.value != null && String(field.value).trim() !== '') return field.value
    const recordValue = currentView.value?.record?.[alias]
    if (recordValue != null && String(recordValue).trim() !== '') return recordValue
  }
  return ''
}

function getTokenDisplayValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue.length ? rawValue.join(', ') : 'No value yet'
  const normalized = String(rawValue ?? '').trim()
  return normalized || 'No value yet'
}

function getTokenDialogValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return rawValue == null ? '' : String(rawValue)
}

function getFieldDisplayValue(fieldName) {
  const field = fieldByName.value[String(fieldName || '').trim()]
  if (field) return String(field.value ?? '').trim()
  const recordValue = currentView.value?.record?.[fieldName]
  return recordValue == null ? '' : String(recordValue).trim()
}

function normalizeDialogValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '')).join(', ')
  return value == null ? '' : String(value)
}

function normalizeIpcErrorMessage(ipcError) {
  const raw = String(ipcError?.message || ipcError || '').trim()
  const prefix = "Error invoking remote method '"
  if (!raw.startsWith(prefix)) return raw
  const separatorIndex = raw.indexOf("':")
  return separatorIndex > -1 ? raw.slice(separatorIndex + 2).trim() : raw
}

async function loadRecordView() {
  if (!hasBridge.value || !isRecordRoute.value) {
    currentView.value = null
    fields.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.view(tableNameParam.value, recordIdParam.value)
    currentView.value = result || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
  } catch (loadError) {
    error.value = normalizeIpcErrorMessage(loadError)
    currentView.value = null
    fields.value = []
  } finally {
    loading.value = false
  }
}

function hashString(value = '') {
  let hash = 0
  const normalized = String(value || '')
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index)
    hash |= 0
  }
  return hash
}

function onContactHeroPointerMove(event) {
  const heroElement = contactHeroRef.value
  if (!heroElement) return
  const rect = heroElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  contactHeroGradient.value = {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(90, y)),
    size: 60,
    opacity: 1,
  }
}

function startContactHeroPointerTracking() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onContactHeroPointerMove)
  window.addEventListener('pointermove', onContactHeroPointerMove)
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 1,
  }
}

function onContactHeroPointerLeave() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 0,
  }
}
</script>

<style scoped>
.record-shell { display: flex; flex-direction: column; gap: 20px; }
.contact-databook__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.88fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
}

.contact-databook__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--contact-hero-blob-x) var(--contact-hero-blob-y),
    var(--contact-hero-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--contact-hero-blob-soft, rgba(38, 71, 255, 0.14)) calc(var(--contact-hero-blob-size) * 0.46),
    var(--contact-hero-blob-fade, rgba(38, 71, 255, 0.06)) calc(var(--contact-hero-blob-size) * 0.7),
    transparent var(--contact-hero-blob-size)
  );
  opacity: var(--contact-hero-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
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

.contact-databook__portrait--initials-only {
  background: transparent;
}

.contact-databook__portrait--initials-only::after {
  display: none;
}

.contact-databook__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.contact-databook__portrait-placeholder-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(132px, 18vw, 188px);
  height: clamp(132px, 18vw, 188px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 40px rgba(17, 17, 17, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-title);
  font-size: clamp(2.6rem, 4vw, 4rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
}

.contact-databook__hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--ds-space-12);
  min-width: 0;
  padding: 36px 36px 34px 16px;
}

.record-shell__hero-name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 8px;
}

.record-shell__hero-icon-button {
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
}

.record-shell__hero-icon-button--create {
  color: #2669ff;
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(38, 105, 255, 0.18);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.record-shell__hero-icon-button :deep(.q-icon) {
  font-size: 16px;
}

.contact-databook__summary-label {
  color: var(--ds-color-text-muted-alt);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-databook__name {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.6rem, 3.2vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.95;
}

.contact-databook__mini-dashboard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.contact-databook__mini-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 9px;
}

.contact-databook__mini-label {
  color: #6f6f6f;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.contact-databook__mini-value {
  margin-top: 3px;
  color: #111;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
  word-break: break-word;
}

.contact-databook__role {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-databook__role--location {
  color: #6b6b6b;
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.record-shell__hero-field-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.record-shell__hero-field-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record-shell__hero-field-stack--summary {
  align-self: start;
}

.record-shell__hero-field-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-shell__hero-field-top {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
}

.record-shell__hero-field-bottom {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
}

.record-shell__hero-field-label {
  display: inline-flex;
  width: fit-content;
  justify-self: start;
  padding: 7px 10px;
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  background: #111;
  border: 1px solid #111;
  border-radius: 4px;
}

.record-shell__hero-field-description {
  display: inline-flex;
  align-items: flex-end;
  align-self: end;
  padding: 0 10px 1px 0;
  color: #5c5c5c;
  font-family: var(--ds-font-family-body);
  font-size: 0.68rem;
  line-height: 1;
  text-align: left;
  justify-self: start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
}

.record-shell__hero-field-value {
  display: inline-flex;
  width: fit-content;
  margin-left: 10px;
  padding: 4px 8px;
  color: rgba(17, 17, 17, 0.66);
  font-family: var(--ds-font-family-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.42);
  border: 0;
  border-radius: 4px;
  backdrop-filter: blur(10px);
}

.record-shell__hero-field-card--summary .record-shell__hero-field-label,
.record-shell__hero-field-card--summary .record-shell__hero-field-value {
  border-radius: 4px;
}

.record-shell__hero-field-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #2669ff;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.contact-databook__hero-notes-panel {
  display: none;
}

.contact-databook__hero-tabs {
  display: inline-flex;
  gap: 6px;
  align-self: flex-start;
  padding: 4px;
  background: rgba(17, 17, 17, 0.05);
  border-radius: 999px;
}

.contact-databook__hero-tab {
  padding: 7px 12px;
  color: var(--ds-color-text-muted-alt);
  background: transparent;
  border: 0;
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
  cursor: pointer;
}

.contact-databook__hero-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(17, 17, 17, 0.08);
}

.contact-databook__hero-notes,
.contact-databook__hero-documents {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  margin-top: 10px;
  padding: 0;
  list-style: none;
}

.contact-databook__hero-note,
.contact-databook__hero-document {
  position: relative;
  padding-left: 18px;
}

.contact-databook__hero-note::before,
.contact-databook__hero-document::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 6px;
  height: 6px;
  content: '';
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.3);
}

.contact-databook__notes-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.contact-databook__notes-title {
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-content {
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-meta {
  flex: 0 0 auto;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
  white-space: nowrap;
}

.contact-databook__hero-panel-empty {
  margin-top: 10px;
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.contact-databook__summary {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-card);
  color: #fff;
}

.contact-databook__summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.contact-databook__summary-header--feed {
  justify-content: flex-start;
  gap: 20px;
}

.contact-databook__summary-feed-state {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__summary-feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.contact-databook__summary-feed-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.contact-databook__summary-feed-tab {
  min-height: 24px;
  padding: 0 9px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.contact-databook__summary-feed-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.94);
}

.contact-databook__summary-feed-entry {
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.contact-databook__summary-feed-entry-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.contact-databook__summary-feed-entry-source {
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.contact-databook__summary-feed-entry-time {
  color: rgba(255, 255, 255, 0.54);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  line-height: 1.3;
}

.contact-databook__summary-feed-entry-title {
  margin-top: 4px;
  color: #ffffff;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__summary-feed-entry-content {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.74);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
}
.contact-databook__nav {
  position: sticky;
  top: 76px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--ds-color-surface-base-88);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  backdrop-filter: blur(14px);
}

.contact-databook__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-databook__nav-item-icon {
  opacity: 0.8;
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

.contact-databook__nav-item--kdb {
  border-color: rgba(17, 17, 17, 0.16);
}

.contact-databook__nav-item--system {
  border-color: rgba(17, 17, 17, 0.22);
}

.contact-databook__nav-item--kdb,
.contact-databook__nav-item--system {
  height: 26px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 8px;
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-label,
.contact-databook__nav-item--system .contact-databook__nav-item-label {
  font-size: calc(var(--text-sm---medium) * 0.72);
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-icon {
  font-size: 12px !important;
}

.contact-databook__nav-item--push-right {
  margin-left: 0;
  align-self: center;
}

.contact-databook__nav-view-toggle {
  align-self: center;
  margin-left: 6px;
  order: 999;
}

.contact-databook__nav-view-toggle :deep(.q-btn-group) {
  gap: 0;
}

.contact-databook__nav-view-toggle :deep(.q-btn) {
  min-width: 20px;
  min-height: 20px;
  padding: 0 2px;
  border-radius: 5px;
}

.contact-databook__nav-view-toggle :deep(.q-icon) {
  font-size: 14px;
}

.contact-databook__nav-item:not(.contact-databook__nav-item--push-right) + .contact-databook__nav-item--push-right {
  margin-left: auto;
}
.record-shell__panel { display:grid; gap:12px; padding:16px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(255,255,255,.96); }
.record-shell__panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.record-shell__panel-title { color:#111; font-family:var(--font-title); font-size:.94rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__panel-meta { color:rgba(17,17,17,.54); font-size:.72rem; }
.record-shell__field-grid, .record-shell__kdb-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
.record-shell__field-card { padding:10px 12px; border:1px solid rgba(17,17,17,.08); border-radius:6px; background:rgba(17,17,17,.02); }
.record-shell__field-card--selected { border-color:rgba(38,71,255,.3); background:rgba(38,71,255,.05); }
.record-shell__field-label { color:#111; font-size:.8rem; font-weight:600; line-height:1.3; }
.record-shell__field-value { margin-top:4px; color:rgba(17,17,17,.58); font-size:.72rem; line-height:1.4; }
.record-shell__settings-panel { width:min(280px,calc(100vw - 24px)); padding:10px; background:rgba(248,248,246,.98); border:1px solid rgba(17,17,17,.08); box-shadow:0 16px 32px rgba(17,17,17,.12); }
.record-shell__settings-title { color:#111; font-family:var(--font-title); font-size:.84rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__settings-group + .record-shell__settings-group { margin-top:10px; }
.record-shell__settings-heading { display:flex; align-items:center; justify-content:space-between; width:100%; padding:0; background:transparent; border:0; text-align:left; }
.record-shell__settings-children { display:grid; gap:4px; margin-top:4px; }
.record-shell__settings-row { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:8px; min-height:28px; padding:2px 4px; }
@media (max-width: 1180px) {
  .contact-databook__hero { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .contact-databook__hero-main { flex-direction: column; }
  .contact-databook__portrait {
    width: 100%;
    flex-basis: auto;
    min-height: 240px;
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 24px 24px 0 0;
  }
  .record-shell__hero-field-columns {
    grid-template-columns: 1fr;
  }
  .record-shell__toolbar { flex-direction:column; align-items:stretch; }
  .record-shell__toolbar-right { margin-left:0; justify-content:flex-start; }
}
</style>
