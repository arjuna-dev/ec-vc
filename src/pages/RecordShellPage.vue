<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <section class="record-shell__hero">
        <div class="record-shell__hero-left">
          <div class="record-shell__avatar-shell">
            <div class="record-shell__avatar-badge" :style="{ backgroundColor: heroAvatarColor }">
              {{ heroInitials }}
            </div>
          </div>
        </div>

        <div class="record-shell__hero-middle">
          <div class="record-shell__hero-top-row">
            <div class="record-shell__hero-eyebrow">
              {{ activeRegistryEntry?.label || 'Record Shell' }}
            </div>

            <div class="record-shell__hero-actions">
              <q-btn
                flat
                round
                dense
                icon="tune"
                class="record-shell__settings-btn"
                aria-label="Record shell field settings"
              >
                <q-menu
                  anchor="bottom right"
                  self="top right"
                  class="record-shell__settings-menu"
                  content-class="record-shell__settings-menu-content"
                >
                  <div class="record-shell__settings-panel">
                    <div class="record-shell__settings-panel-title">Hero Fields</div>

                    <div class="record-shell__settings-groups">
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
                          <span class="record-shell__settings-heading-label">{{ section.label }}</span>
                          <q-icon
                            :name="isSectionExpanded(section.key) ? 'expand_less' : 'expand_more'"
                            size="14px"
                            class="record-shell__settings-heading-arrow"
                          />
                        </button>

                        <div
                          v-if="isSectionExpanded(section.key)"
                          class="record-shell__settings-children"
                        >
                          <label
                            v-for="token in getSectionTokens(section.key)"
                            :key="token.key"
                            class="record-shell__settings-option"
                          >
                            <q-checkbox
                              :model-value="isSelectedToken(token.key)"
                              dense
                              size="xs"
                              checked-icon="check_box"
                              unchecked-icon="check_box_outline_blank"
                              class="record-shell__settings-checkbox"
                              @update:model-value="setTokenSelected(token.key, $event)"
                            />
                            <span class="record-shell__settings-option-label">{{ token.label }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-menu>
              </q-btn>

              <q-btn
                no-caps
                unelevated
                class="record-shell__edit-btn"
                label="Edit"
                @click="openCreateDialog"
              />
            </div>
          </div>

          <div class="record-shell__name-box">
            {{ activeRegistryEntry?.singularLabel || 'Record' }} Name
          </div>

          <div class="record-shell__selected-fields">
            <div
              v-for="token in selectedHeroTokens"
              :key="token.key"
              class="record-shell__selected-field"
            >
              <div class="record-shell__selected-field-label">{{ token.label }}</div>
              <div class="record-shell__selected-field-value">Ready in dialog</div>
            </div>

            <div v-if="!selectedHeroTokens.length" class="record-shell__selected-empty">
              Use the settings icon to choose which fields should sit between Name and Summary.
            </div>
          </div>

          <div class="record-shell__summary-box">
            <div class="record-shell__summary-label">Summary</div>
            <div class="record-shell__summary-value">
              Summary sits at the end of the middle block and remains pinned for every record shell.
            </div>
          </div>
        </div>

        <div class="record-shell__hero-right">
          <div class="record-shell__feed-header">Record Feed</div>
          <div class="record-shell__feed-list">
            <div
              v-for="item in feedPreviewItems"
              :key="item.id"
              class="record-shell__feed-item"
            >
              <div class="record-shell__feed-item-top">
                <span class="record-shell__feed-item-source">{{ item.source }}</span>
                <span class="record-shell__feed-item-time">{{ item.time }}</span>
              </div>
              <div class="record-shell__feed-item-title">{{ item.title }}</div>
              <div class="record-shell__feed-item-copy">{{ item.copy }}</div>
            </div>
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

      <section class="record-shell__section-panel">
        <div class="record-shell__section-panel-head">
          <div class="record-shell__section-panel-title">
            {{ activeSection?.label || 'Section' }}
          </div>
          <div class="record-shell__section-panel-meta">
            {{ activeSectionTokens.length }} tokens
          </div>
        </div>

        <div class="record-shell__section-token-grid">
          <div
            v-for="token in activeSectionTokens"
            :key="token.key"
            class="record-shell__section-token"
            :class="{ 'record-shell__section-token--selected': isSelectedToken(token.key) }"
          >
            <div class="record-shell__section-token-label">{{ token.label }}</div>
            <div class="record-shell__section-token-state">
              {{ isSelectedToken(token.key) ? 'Selected for hero' : 'Available' }}
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
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  LEVEL_1_FILE_REGISTRY,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedSectionKeys = ref([])
const activeSectionKey = ref('')

const fallbackSectionKey =
  TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value ||
  TEST_SHELL_SECTION_OPTIONS[0]?.value ||
  'tasks'

const activeSourceKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  if (TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current)) return current
  return fallbackSectionKey
})

const activeRegistryEntry = computed(
  () => getFilePageRegistryEntry(activeSourceKey.value) || getFilePageRegistryEntry(fallbackSectionKey),
)

const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])

const canonicalNameToken = computed(
  () =>
    level3Tokens.value.find(
      (token) => String(token.parentLevel_2) === '3' && String(token.level_3) === '1',
    ) || null,
)

const canonicalSummaryToken = computed(
  () =>
    level3Tokens.value.find(
      (token) =>
        (String(token.parentLevel_2) === '3' && String(token.level_3) === '2')
        || String(token.label || '').trim().toLowerCase() === 'summary',
    ) || null,
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
    const rawItems = Array.isArray(raw) ? raw : String(raw || '').split(',')
    const allowed = new Set(selectableTokens.value.map((token) => token.key))
    return rawItems
      .map((value) => String(value || '').trim())
      .filter((value) => value && allowed.has(value))
  },
  set(value) {
    const normalized = Array.from(
      new Set(
        (Array.isArray(value) ? value : [])
          .map((item) => String(item || '').trim())
          .filter(Boolean),
      ),
    )

    router.replace({
      query: {
        ...route.query,
        section: activeSourceKey.value,
        ...(normalized.length ? { l3: normalized.join(',') } : { l3: undefined }),
      },
    })
  },
})

const selectedTokenKeySet = computed(() => new Set(selectedTokenKeys.value))

const selectableSections = computed(() =>
  level2Sections.value.filter((section) =>
    selectableTokens.value.some((token) => token.parentKey === section.key),
  ),
)

const selectedHeroTokens = computed(() =>
  selectableTokens.value.filter((token) => selectedTokenKeySet.value.has(token.key)),
)

const createKeyFieldTokens = computed(() =>
  [canonicalNameToken.value, canonicalSummaryToken.value]
    .filter(Boolean)
    .map((token) => normalizeCreateDialogToken(token)),
)

const createSectionGroups = computed(() =>
  selectableSections.value
    .map((section) => ({
      key: section.key,
      label: section.label,
      tokens: selectableTokens.value
        .filter((token) => token.parentKey === section.key && selectedTokenKeySet.value.has(token.key))
        .map((token) => normalizeCreateDialogToken(token)),
    }))
    .filter((section) => section.tokens.length),
)

const createDialogLeftSections = computed(() =>
  createSectionGroups.value.filter((section) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    return normalized !== 'kdb' && normalized !== 'system'
  }),
)

const createDialogRightSections = computed(() =>
  createSectionGroups.value.filter((section) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    return normalized === 'kdb' || normalized === 'system'
  }),
)

const activeSection = computed(
  () => level2Sections.value.find((section) => section.key === activeSectionKey.value) || level2Sections.value[0] || null,
)

const activeSectionTokens = computed(() =>
  selectableTokens.value.filter((token) => token.parentKey === activeSection.value?.key),
)

const toolbarLeftSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.label || '').trim().toLowerCase()
    return label !== 'kdb' && label !== 'system'
  }),
)

const toolbarRightSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.label || '').trim().toLowerCase()
    return label === 'kdb' || label === 'system'
  }),
)

const heroInitials = computed(() => {
  const sourceLabel = String(activeRegistryEntry.value?.singularLabel || 'Record').trim()
  return sourceLabel.slice(0, 2).toUpperCase()
})

const heroAvatarColor = computed(() => {
  const palette = {
    users: '#2647ff',
    contacts: '#111111',
    companies: '#1f8f6a',
    projects: '#a54b1a',
    tasks: '#6a44c6',
    notes: '#7c5b1b',
    roles: '#8f2f5a',
    artifacts: '#3a3a3a',
  }
  return palette[activeSourceKey.value] || '#2647ff'
})

const feedPreviewItems = computed(() => {
  const sourceLabel = activeRegistryEntry.value?.singularLabel || 'Record'
  return [
    {
      id: 'feed-1',
      source: 'Shell',
      time: 'Now',
      title: `${sourceLabel} feed will live here`,
      copy: 'This right panel is reserved for the record feed and stays visually independent from the hero fields.',
    },
    {
      id: 'feed-2',
      source: 'Contract',
      time: 'Preview',
      title: 'Shared record feed box',
      copy: 'The hero stays card-like on the left and middle, while the feed remains a dedicated black panel on the right.',
    },
  ]
})

watch(
  level2Sections,
  (sections) => {
    if (!sections.length) {
      activeSectionKey.value = ''
      expandedSectionKeys.value = []
      return
    }

    if (!sections.some((section) => section.key === activeSectionKey.value)) {
      activeSectionKey.value = sections[0].key
    }

    expandedSectionKeys.value = sections.map((section) => section.key)
  },
  { immediate: true },
)

watch(
  activeSourceKey,
  async () => {
    await ensureLiveOptionsLoaded()
  },
  { immediate: true },
)

function isSectionExpanded(sectionKey) {
  return expandedSectionKeys.value.includes(sectionKey)
}

function toggleExpandedSection(sectionKey) {
  if (isSectionExpanded(sectionKey)) {
    expandedSectionKeys.value = expandedSectionKeys.value.filter((key) => key !== sectionKey)
    return
  }
  expandedSectionKeys.value = [...expandedSectionKeys.value, sectionKey]
}

function getSectionTokens(sectionKey) {
  return selectableTokens.value.filter((token) => token.parentKey === sectionKey)
}

function isSelectedToken(tokenKey) {
  return selectedTokenKeySet.value.has(tokenKey)
}

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

function handleDialogClose() {
  createDialogOpen.value = false
}

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
    $q.notify({
      type: 'positive',
      message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.`,
    })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    createDialogLoading.value = false
  }
}

function buildCreatePayload(values = {}) {
  const allTokens = [
    ...createKeyFieldTokens.value,
    ...createSectionGroups.value.flatMap((section) => section.tokens),
  ]

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
  const tokenType = String(token?.tokenType || '').trim()
  if (!tokenType.startsWith('select_')) return token

  return {
    ...token,
    inputOptions: getInputOptionsForToken(token),
  }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  const optionList = String(token?.optionList || '').trim()

  if (optionSource === 'canonical_list' && optionList) {
    return CANONICAL_OPTION_LISTS[optionList] || []
  }

  if (optionSource === 'live_entity') {
    return getLiveEntityOptionsForToken(token)
  }

  if (optionSource === 'live_entity_set') {
    return getLiveEntitySetOptionsForToken(token)
  }

  return Array.isArray(token?.inputOptions) ? token.inputOptions : []
}

function getLiveEntityOptionsForToken(token) {
  const entityName = String(token?.optionEntity || '').trim()
  const sourceKey = resolveSourceKeyFromEntityName(entityName)
  if (!sourceKey) return []
  return buildLiveEntityOptions(sourceKey)
}

function getLiveEntitySetOptionsForToken(token) {
  const entityNames = Array.isArray(token?.optionEntities) ? token.optionEntities : []
  const sourceKeys = entityNames
    .map((entityName) => resolveSourceKeyFromEntityName(entityName))
    .filter(Boolean)

  return sourceKeys.flatMap((sourceKey) => buildLiveEntityOptions(sourceKey))
}

function resolveSourceKeyFromEntityName(entityName) {
  const normalized = String(entityName || '').trim()
  if (!normalized) return ''
  return (
    LEVEL_1_FILE_REGISTRY.find((entry) => String(entry.entityName || '').trim() === normalized)?.key || ''
  )
}

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const registryEntry = getFilePageRegistryEntry(sourceKey)
  const titleToken =
    (LEVEL_3_FILE_REGISTRY_BY_KEY[sourceKey] || []).find(
      (token) => String(token.parentLevel_2) === '3' && String(token.level_3) === '1',
    ) || null

  return rows
    .map((row) => {
      const value = String(resolveLiveEntityRecordId(row, sourceKey) || '').trim()
      const label = String(getCanonicalTokenValue(row, titleToken || {}) || '').trim() || value
      if (!value || !label) return null
      return {
        label,
        value,
        sourceLabel: registryEntry?.label || sourceKey,
      }
    })
    .filter(Boolean)
}

function resolveLiveEntityRecordId(row, sourceKey) {
  if (!row || typeof row !== 'object') return ''
  const preferredFields = ['id', 'artifact_id']
  for (const fieldName of preferredFields) {
    const value = row[fieldName]
    if (value != null && String(value).trim()) return value
  }
  if (sourceKey === 'artifacts') return row.artifact_id || row.id || ''
  return row.id || ''
}

async function ensureLiveOptionsLoaded() {
  const tokensToLoad = [
    ...createKeyFieldTokens.value,
    ...createSectionGroups.value.flatMap((section) => section.tokens),
    ...selectableTokens.value.map((token) => normalizeCreateDialogToken(token)),
  ]

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
      liveOptionRowsBySource.value = {
        ...liveOptionRowsBySource.value,
        [sourceKey]: normalizeListResult(result),
      }
    } catch {
      liveOptionRowsBySource.value = {
        ...liveOptionRowsBySource.value,
        [sourceKey]: [],
      }
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
.record-shell-page,
.record-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.record-shell__hero {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: stretch;
}

.record-shell__hero-left,
.record-shell__hero-middle,
.record-shell__hero-right {
  min-height: 420px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.record-shell__hero-left {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 28%, rgba(38, 71, 255, 0.18), transparent 56%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 244, 238, 0.96) 100%);
}

.record-shell__avatar-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 28px;
}

.record-shell__avatar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 148px;
  height: 148px;
  border-radius: 999px;
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 2.8rem;
  font-weight: var(--font-weight-black);
  box-shadow: 0 20px 36px rgba(17, 17, 17, 0.16);
}

.record-shell__hero-middle {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
}

.record-shell__hero-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.record-shell__hero-eyebrow {
  color: rgba(17, 17, 17, 0.56);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-shell__hero-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.record-shell__settings-btn {
  color: #111111;
}

.record-shell__edit-btn {
  background: #2647ff;
  color: #ffffff;
  border-radius: 3px;
  padding-inline: 12px;
}

.record-shell__name-box {
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(1.55rem, 2vw, 2rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.record-shell__selected-fields {
  display: grid;
  gap: 8px;
  min-height: 0;
  margin-top: 2px;
}

.record-shell__selected-field,
.record-shell__summary-box {
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.86);
}

.record-shell__selected-field-label,
.record-shell__summary-label {
  color: rgba(17, 17, 17, 0.58);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-shell__selected-field-value,
.record-shell__summary-value,
.record-shell__selected-empty {
  margin-top: 4px;
  color: rgba(17, 17, 17, 0.78);
  font-size: 0.82rem;
  line-height: 1.4;
}

.record-shell__selected-empty {
  padding: 12px;
  border: 1px dashed rgba(17, 17, 17, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
}

.record-shell__summary-box {
  margin-top: auto;
}

.record-shell__hero-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  color: #ffffff;
  background: #111111;
}

.record-shell__feed-header {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.record-shell__feed-list {
  display: grid;
  gap: 10px;
}

.record-shell__feed-item {
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
}

.record-shell__feed-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.record-shell__feed-item-source,
.record-shell__feed-item-time {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-shell__feed-item-title {
  margin-top: 6px;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.record-shell__feed-item-copy {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.76rem;
  line-height: 1.45;
}

.record-shell__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.record-shell__toolbar-left,
.record-shell__toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.record-shell__toolbar-right {
  justify-content: flex-end;
  margin-left: auto;
}

.record-shell__toolbar-tab {
  min-height: 30px;
  padding: 0 11px;
  color: #111111;
  background: #fdfdfb;
  border: 1px solid #111111;
  border-radius: 2px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  letter-spacing: 0.01em;
  cursor: pointer;
}

.record-shell__toolbar-tab--active {
  color: #ffffff;
  background: #111111;
}

.record-shell__section-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
}

.record-shell__section-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.record-shell__section-panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.record-shell__section-panel-meta {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.72rem;
}

.record-shell__section-token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.record-shell__section-token {
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
  background: rgba(17, 17, 17, 0.02);
}

.record-shell__section-token--selected {
  border-color: rgba(38, 71, 255, 0.32);
  background: rgba(38, 71, 255, 0.06);
}

.record-shell__section-token-label {
  color: #111111;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
}

.record-shell__section-token-state {
  margin-top: 4px;
  color: rgba(17, 17, 17, 0.56);
  font-size: 0.72rem;
}

.record-shell__settings-panel {
  width: min(280px, calc(100vw - 24px));
  padding: 10px;
  background: rgba(248, 248, 246, 0.98);
  border: 1px solid rgba(17, 17, 17, 0.08);
  box-shadow: 0 16px 32px rgba(17, 17, 17, 0.12);
}

.record-shell__settings-panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.record-shell__settings-groups {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.record-shell__settings-group {
  display: grid;
  gap: 4px;
}

.record-shell__settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  text-align: left;
}

.record-shell__settings-heading-label,
.record-shell__settings-option-label {
  font-size: 0.74rem;
  line-height: 1.2;
}

.record-shell__settings-heading-arrow {
  color: #111111;
}

.record-shell__settings-children {
  display: grid;
  gap: 6px;
}

.record-shell__settings-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.record-shell__settings-checkbox {
  min-height: 16px;
}

@media (max-width: 1180px) {
  .record-shell__hero {
    grid-template-columns: 1fr;
  }

  .record-shell__hero-left,
  .record-shell__hero-middle,
  .record-shell__hero-right {
    min-height: auto;
  }

  .record-shell__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .record-shell__toolbar-right {
    margin-left: 0;
    justify-content: flex-start;
  }
}
</style>
