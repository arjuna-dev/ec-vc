<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <section class="contact-databook__hero">
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
                icon="edit"
                class="record-shell__hero-icon-button record-shell__hero-icon-button--edit"
                aria-label="Edit record"
                @click="openCreateDialog"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
            </div>

            <div class="contact-databook__role">
              {{ heroSubtitle }}
            </div>
            <div class="contact-databook__role contact-databook__role--location">
              {{ heroSecondaryLine }}
            </div>

            <div v-if="genericMiniDashboardStats.length" class="contact-databook__mini-dashboard">
              <div v-for="stat in genericMiniDashboardStats" :key="stat.id" class="contact-databook__mini-item">
                <div class="contact-databook__mini-label">{{ stat.label }}</div>
                <div class="contact-databook__mini-value">{{ stat.displayValue }}</div>
              </div>
            </div>

            <div v-if="genericRecordPills.length" class="contact-databook__pill-row">
              <q-badge
                v-for="pill in genericRecordPills"
                :key="pill"
                class="contact-databook__pill"
              >
                {{ pill }}
              </q-badge>
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

      <section class="record-shell__toolbar">
        <div class="record-shell__toolbar-left">
          <button
            v-for="section in toolbarLeftSections"
            :key="section.key"
            type="button"
            class="record-shell__toolbar-tab"
            :class="{ 'record-shell__toolbar-tab--active': activeSectionKey === section.key }"
            @click="activeSectionKey = section.key"
          >
            {{ section.label }}
          </button>
        </div>

        <div class="record-shell__toolbar-right">
          <button
            v-for="section in toolbarRightSections"
            :key="section.key"
            type="button"
            class="record-shell__toolbar-tab"
            :class="{ 'record-shell__toolbar-tab--active': activeSectionKey === section.key }"
            @click="activeSectionKey = section.key"
          >
            {{ section.label }}
          </button>
        </div>
      </section>

      <section class="record-shell__panel">
        <div class="record-shell__panel-head">
          <div class="record-shell__panel-title">{{ activeSection?.label || 'Section' }}</div>
          <div class="record-shell__panel-meta">{{ activeSectionTokens.length }} fields</div>
        </div>

        <div v-if="isKdbSectionActive" class="record-shell__kdb-grid">
          <div v-for="token in activeSectionTokens" :key="token.key" class="record-shell__field-card">
            <div class="record-shell__field-label">{{ token.label }}</div>
            <div class="record-shell__field-value">Relationship lane</div>
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
            <div class="record-shell__field-value">
              {{ isSelectedToken(token.key) ? 'Selected for hero' : 'Available in skeleton' }}
            </div>
          </div>
        </div>
      </section>

      <CreateRecordShellDialog
        :key="createDialogRenderKey"
        v-model="createDialogOpen"
        mode="create"
        :source-label="activeRegistryEntry?.label || 'Records'"
        :singular-label="activeRegistryEntry?.singularLabel || 'record'"
        :key-field-tokens="createKeyFieldTokens"
        :left-sections="createDialogLeftSections"
        :right-sections="createDialogRightSections"
        :loading="createDialogLoading"
        :submit-disabled="false"
        :initial-values="{}"
        :initial-field-meta="{}"
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
import { computed, ref, watch } from 'vue'
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
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedSectionKeys = ref([])
const activeSectionKey = ref('')
const genericHeroPanelTab = ref('notes')
const activeRecordFeedTab = ref('all')
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])

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
    const values = Array.isArray(raw) ? raw : String(raw || '').split(',')
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
      tokens: selectableTokens.value.filter((token) => token.parentKey === section.key && selectedTokenKeySet.value.has(token.key)).map(normalizeCreateDialogToken),
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
const heroAvatarColor = computed(() => ({ users: '#2647ff', contacts: '#111111', companies: '#1f8f6a', projects: '#a54b1a', tasks: '#6a44c6', notes: '#7c5b1b', roles: '#8f2f5a', artifacts: '#3a3a3a' }[activeSourceKey.value] || '#2647ff'))
const heroName = computed(() => `${activeRegistryEntry.value?.singularLabel || 'Record'} Name`)
const heroSubtitle = computed(() => activeRegistryEntry.value?.label || 'Record Shell')
const heroSecondaryLine = computed(() => 'Expanded record-view skeleton for the selected L1 payload.')
const heroStats = computed(() => [
  { id: 'l2', label: 'L2', value: level2Sections.value.length },
  { id: 'l3', label: 'L3', value: level3Tokens.value.length },
  { id: 'hero', label: 'Hero Fields', value: selectedHeroTokens.value.length },
])
const genericMiniDashboardStats = computed(() => heroStats.value.map((stat) => ({ id: stat.id, label: stat.label, displayValue: String(stat.value) })))
const genericRecordPills = computed(() => selectedHeroTokens.value.map((token) => token.label))
const genericHeroNotes = computed(() =>
  selectedHeroTokens.value.slice(0, 4).map((token, index) => ({
    id: token.key,
    title: token.label,
    created_at: index === 0 ? 'Selected now' : 'Ready',
    content: 'Included in the Record Shell hero payload.',
  })),
)
const genericHeroDocuments = computed(() => [
  {
    id: 'record-shell-summary',
    title: 'Summary',
    meta: 'Pinned field',
    content: 'Summary stays anchored as the closing field in the middle block.',
  },
])
const feedItems = computed(() => [
  { id: 'feed-1', feedKey: 'all', sourceLabel: 'Record Shell', meta: 'Now', title: 'Template feed lane', content: 'This right-side black box is the dedicated feed surface for the selected L1 record skeleton.' },
  { id: 'feed-2', feedKey: 'all', sourceLabel: 'Payload', meta: 'Live', title: 'L1-driven structure', content: 'Changing the L1 at the top swaps the canonical record skeleton underneath this template.' },
])
const recordFeedTabOptions = computed(() => [{ id: 'all', label: 'All' }])
const displayedRecordFeedItems = computed(() => feedItems.value.filter((item) => item.feedKey === activeRecordFeedTab.value))

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

function openCreateDialog() {
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}
function handleDialogChange() {}
function handleDialogClose() { createDialogOpen.value = false }

async function submitCreateRecord({ values } = {}) {
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
  background:
    radial-gradient(circle at 22% 22%, rgba(38, 71, 255, 0.2) 0%, rgba(38, 71, 255, 0.14) 22%, rgba(38, 71, 255, 0.06) 38%, transparent 58%),
    linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
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

.record-shell__hero-icon-button--edit {
  color: #ffffff;
  background: #2669ff;
  border-color: #2669ff;
  box-shadow: 0 10px 24px rgba(38, 105, 255, 0.22);
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

.contact-databook__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-databook__pill {
  padding: 7px 10px;
  color: #111;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
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
.record-shell__toolbar { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; }
.record-shell__toolbar-left, .record-shell__toolbar-right { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.record-shell__toolbar-right { margin-left:auto; justify-content:flex-end; }
.record-shell__toolbar-tab { min-height:30px; padding:0 11px; color:#111; background:#fdfdfb; border:1px solid #111; border-radius:2px; font-family:var(--font-title); font-size:.76rem; font-weight:var(--font-weight-black); line-height:.96; letter-spacing:.01em; cursor:pointer; }
.record-shell__toolbar-tab--active { color:#fff; background:#111; }
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
  .record-shell__toolbar { flex-direction:column; align-items:stretch; }
  .record-shell__toolbar-right { margin-left:0; justify-content:flex-start; }
}
</style>
