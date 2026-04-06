<template>
  <q-page class="q-pa-md dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit Dialog Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <AddEditRecordShellDialog
      v-else
      :key="dialogRenderKey"
      v-model="dialogOpen"
      mode="create"
      :source-label="activeRegistryEntry?.label || 'Records'"
      :singular-label="activeRegistryEntry?.singularLabel || 'record'"
      :key-field-tokens="createKeyFieldTokens"
      :left-sections="dialogSectionSplit.leftSections"
      :right-sections="dialogSectionSplit.rightSections"
      :loading="dialogLoading"
      :submit-disabled="!canCreateWithShell"
      :initial-values="{}"
      :initial-field-meta="{}"
      initial-section-key="key-fields"
      :initial-artifacts="[]"
      :artifact-context="null"
      @request-close="dialogOpen = false"
      @submit="submitCreateRecord"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AddEditRecordShellDialog from 'src/components/AddEditRecordShellDialog.vue'
import {
  CANONICAL_OPTION_LISTS,
  getFilePageRegistryEntry,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { buildDialogSectionGroups, groupDialogLevel2Sections, splitDialogSections } from 'src/utils/dialogShellPayload'

const route = useRoute()
const $q = useQuasar()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const dialogOpen = ref(false)
const dialogRenderKey = ref(0)
const dialogLoading = ref(false)
const liveOptionRowsBySource = ref({})

const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const groupedLevel2Sections = computed(() => groupDialogLevel2Sections(level2Sections.value))

const createKeyFieldTokens = computed(() =>
  level3Tokens.value
    .filter((token) => String(token.level_3) === '1' || String(token.level_3) === '2')
    .map(normalizeCreateDialogToken),
)

const keyFieldKeys = computed(() => new Set(createKeyFieldTokens.value.map((token) => token.key)))
const createSectionGroups = computed(() =>
  buildDialogSectionGroups({
    groupedSections: groupedLevel2Sections.value,
    tokenFilter: (section) =>
      level3Tokens.value.filter(
        (token) => token.parentKey === section.key && !keyFieldKeys.value.has(token.key),
      ),
    mapToken: normalizeCreateDialogToken,
  }),
)
const dialogSectionSplit = computed(() => splitDialogSections(createSectionGroups.value))
const canCreateWithShell = computed(() => Boolean(bridge.value?.[activeSourceKey.value]?.create))

watch(activeSourceKey, async () => {
  await ensureLiveOptionsLoaded()
  dialogRenderKey.value += 1
  dialogOpen.value = true
}, { immediate: true })

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

function resolveSourceKeyFromEntityName(entityName) {
  const normalized = String(entityName || '').trim()
  return TEST_SHELL_SECTION_OPTIONS.find((entry) => String(entry.value || '').trim() === String(normalized || '').trim().toLowerCase())?.value
    || (getFilePageRegistryEntry(normalized)?.key || '')
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

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const titleToken = (LEVEL_3_FILE_REGISTRY_BY_KEY[sourceKey] || []).find((token) => String(token.level_3) === '1') || null
  return rows.map((row) => {
    const value = String(row?.id || row?.artifact_id || '').trim()
    const labelField = String(titleToken?.dbWriteField || titleToken?.tokenName || '').trim()
    const label = String(row?.[labelField] || row?.Name || value).trim()
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

async function ensureLiveOptionsLoaded() {
  const sourceKeys = new Set()
  for (const token of [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]) {
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
      const rows = Array.isArray(result) ? result : Object.values(result || {}).find((value) => Array.isArray(value)) || []
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: rows }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
    }
  }
}

async function submitCreateRecord({ values } = {}) {
  const payload = Object.fromEntries(
    [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
      .map((token) => {
        const value = values?.[token.key]
        if (Array.isArray(value) && !value.length) return null
        if (!Array.isArray(value) && String(value ?? '').trim() === '') return null
        return [String(token?.dbWriteField || token?.tokenName || token?.key || '').trim(), value]
      })
      .filter(Boolean),
  )

  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }

  dialogLoading.value = true
  try {
    const result = await bridge.value?.[activeSourceKey.value]?.create?.(payload)
    if (!result) {
      $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
      return
    }
    dialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    dialogLoading.value = false
  }
}
</script>

<style scoped>
</style>
