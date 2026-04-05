<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <section class="record-shell__controls">
        <div class="record-shell__select-wrap">
          <q-select
            ref="sectionSelectRef"
            v-model="selectedSection"
            dense
            dark
            options-dark
            borderless
            hide-bottom-space
            emit-value
            map-options
            hide-dropdown-icon
            :options="shellSectionOptions"
            popup-content-class="record-shell__select-menu"
            class="record-shell__select"
          >
            <template #selected-item="scope">
              <span class="record-shell__select-value">{{ scope.opt.label }}</span>
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps" class="record-shell__select-menu-item">
                <q-item-section>
                  <span class="record-shell__select-menu-value">{{ scope.opt.label }}</span>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-icon name="expand_more" class="record-shell__select-chevron" @click.stop="openSectionMenu" />
        </div>
      </section>

      <section class="record-shell__hero">
        <div class="record-shell__hero-main">
          <figure class="record-shell__portrait">
            <div class="record-shell__portrait-shell">
              <div class="record-shell__portrait-badge" :style="{ backgroundColor: heroAvatarColor }">
                {{ heroInitials }}
              </div>
            </div>
          </figure>

          <div class="record-shell__hero-copy">
            <div class="record-shell__hero-top-row">
              <h1 class="record-shell__name">
                {{ activeRegistryEntry?.singularLabel || 'Record' }} Name
              </h1>

              <div class="record-shell__hero-top-actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="tune"
                  class="record-shell__hero-settings"
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

                <q-btn no-caps flat round dense icon="edit" class="record-shell__hero-edit-btn" @click="openCreateDialog">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="record-shell__hero-meta">
              <div class="record-shell__subtitle">{{ activeRegistryEntry?.label || 'Record Shell' }}</div>
              <div class="record-shell__secondary">Expanded record-view skeleton for the selected L1 payload.</div>
            </div>

            <div class="record-shell__stats">
              <div v-for="stat in heroStats" :key="stat.id" class="record-shell__stat">
                <div class="record-shell__stat-label">{{ stat.label }}</div>
                <div class="record-shell__stat-value">{{ stat.value }}</div>
              </div>
            </div>

            <div v-if="selectedHeroTokens.length" class="record-shell__pill-row">
              <q-badge v-for="token in selectedHeroTokens" :key="token.key" class="record-shell__pill">
                {{ token.label }}
              </q-badge>
            </div>

            <div class="record-shell__summary-box">
              <div class="record-shell__summary-label">Summary</div>
              <div class="record-shell__summary-value">
                Summary remains pinned as the closing field in the middle block.
              </div>
            </div>
          </div>
        </div>

        <div class="record-shell__feed">
          <div class="record-shell__feed-label">Record Feed</div>
          <div class="record-shell__feed-list">
            <article v-for="item in feedItems" :key="item.id" class="record-shell__feed-entry">
              <div class="record-shell__feed-entry-top">
                <span>{{ item.source }}</span>
                <span>{{ item.time }}</span>
              </div>
              <div class="record-shell__feed-entry-title">{{ item.title }}</div>
              <div class="record-shell__feed-entry-copy">{{ item.copy }}</div>
            </article>
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
const sectionSelectRef = ref(null)
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedSectionKeys = ref([])
const activeSectionKey = ref('')
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const shellSectionOptions = TEST_SHELL_SECTION_OPTIONS
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'

const selectedSection = computed({
  get() {
    const current = String(route.query.section || '').trim().toLowerCase()
    return shellSectionOptions.some((option) => option.value === current) ? current : fallbackSectionKey
  },
  set(value) {
    const nextValue = String(value || '').trim().toLowerCase()
    const normalizedValue = shellSectionOptions.some((option) => option.value === nextValue) ? nextValue : fallbackSectionKey
    router.replace({ query: { ...route.query, section: normalizedValue } })
  },
})

const activeSourceKey = computed(() => selectedSection.value)
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
const heroStats = computed(() => [
  { id: 'l2', label: 'L2', value: level2Sections.value.length },
  { id: 'l3', label: 'L3', value: level3Tokens.value.length },
  { id: 'hero', label: 'Hero Fields', value: selectedHeroTokens.value.length },
])
const feedItems = computed(() => [
  { id: 'feed-1', source: 'Record Shell', time: 'Now', title: 'Template feed lane', copy: 'This right-side black box is the dedicated feed surface for the selected L1 record skeleton.' },
  { id: 'feed-2', source: 'Payload', time: 'Live', title: 'L1-driven structure', copy: 'Changing the L1 at the top swaps the canonical record skeleton underneath this template.' },
])

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

function openSectionMenu() {
  const select = sectionSelectRef.value
  if (select?.showPopup) select.showPopup()
  else if (select?.focus) select.focus()
}

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
.record-shell__controls { display: flex; justify-content: center; }
.record-shell__select-wrap { position: relative; display: inline-flex; align-items: flex-start; padding-right: 18px; }
.record-shell__select { width: min(220px, 100%); min-width: 0; }
.record-shell__select :deep(.q-field__control) { min-height: 40px; padding: 0 4px 0 0; background: transparent; border-radius: 0; box-shadow: none; }
.record-shell__select :deep(.q-field__native), .record-shell__select :deep(.q-field__marginal) { color: #fff !important; }
.record-shell__select-value, .record-shell__select-menu-value { display: inline-flex; align-items: center; min-height: 26px; padding: 0 8px; color: #fff; background: #111; box-shadow: 0 0 0 1px rgba(255,255,255,.82); font-family: var(--font-title); font-weight: 800; line-height: .96; }
.record-shell__select-value { min-height: 32px; padding: 0 10px; font-size: 1rem; letter-spacing: -.04em; text-transform: lowercase; }
.record-shell__select-chevron { position: absolute; right: -4px; bottom: -2px; color: #111; font-size: 20px; cursor: pointer; }
.record-shell__hero { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 20px; }
.record-shell__hero-main, .record-shell__feed { min-height: 420px; border-radius: 14px; overflow: hidden; }
.record-shell__hero-main { display: grid; grid-template-columns: minmax(0,1fr) 260px; background: linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(248,246,240,.98) 100%); border: 1px solid rgba(17,17,17,.08); }
.record-shell__portrait { margin: 0; }
.record-shell__portrait-shell { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; padding: 24px; }
.record-shell__portrait-badge { display:flex; width:clamp(124px,48%,152px); height:clamp(124px,48%,152px); align-items:center; justify-content:center; color:#fff; border-radius:999px; box-shadow:0 18px 40px rgba(17,17,17,.16); font-family:var(--font-title); font-size:clamp(2.2rem,4.2vw,3rem); font-weight:var(--font-weight-black); }
.record-shell__hero-copy { display:flex; flex-direction:column; gap:10px; min-width:0; padding:16px 18px 14px 14px; }
.record-shell__hero-top-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:start; gap:8px; }
.record-shell__hero-top-actions { display:contents; }
.record-shell__hero-edit-btn,
.record-shell__hero-settings { color:#111; }
.record-shell__hero-edit-btn :deep(.q-icon),
.record-shell__hero-settings :deep(.q-icon) { font-size:18px; }
.record-shell__name { margin:0; color:#0a0a0a; font-family:var(--font-title); font-size:clamp(1.4rem,2vw,1.7rem); font-weight:var(--font-weight-black); line-height:.96; min-width:0; }
.record-shell__hero-meta { display:grid; gap:4px; }
.record-shell__subtitle, .record-shell__secondary { color:rgba(17,17,17,.7); font-size:.82rem; line-height:1.35; }
.record-shell__stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.record-shell__stat, .record-shell__summary-box { padding:10px 12px; border:1px solid rgba(17,17,17,.08); border-radius:6px; background:rgba(255,255,255,.8); }
.record-shell__stat-label, .record-shell__summary-label { color:rgba(17,17,17,.56); font-size:.64rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.record-shell__stat-value { margin-top:4px; color:#111; font-family:var(--font-title); font-size:.88rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__pill-row { display:flex; flex-wrap:wrap; gap:6px; }
.record-shell__pill { color:#111; background:rgba(17,17,17,.08); }
.record-shell__summary-box { margin-top:auto; }
.record-shell__summary-value { margin-top:6px; color:rgba(17,17,17,.76); font-size:.8rem; line-height:1.45; }
.record-shell__feed { display:flex; flex-direction:column; gap:10px; padding:14px; color:#fff; background:#111; }
.record-shell__feed-label { font-family:var(--font-title); font-size:.84rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__feed-list { display:flex; flex-direction:column; gap:8px; }
.record-shell__feed-entry { padding:10px 12px; border:1px solid rgba(255,255,255,.08); border-radius:8px; background:rgba(255,255,255,.04); }
.record-shell__feed-entry-top { display:flex; align-items:center; justify-content:space-between; gap:8px; color:rgba(255,255,255,.56); font-size:.64rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.record-shell__feed-entry-title { margin-top:6px; font-family:var(--font-title); font-size:.82rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__feed-entry-copy { margin-top:6px; color:rgba(255,255,255,.76); font-size:.76rem; line-height:1.45; }
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
@media (max-width: 1180px) { .record-shell__hero { grid-template-columns:1fr; } }
@media (max-width: 900px) { .record-shell__hero-main { grid-template-columns:1fr; } .record-shell__toolbar { flex-direction:column; align-items:stretch; } .record-shell__toolbar-right { margin-left:0; justify-content:flex-start; } }
</style>
