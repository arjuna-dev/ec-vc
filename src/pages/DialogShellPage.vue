<template>
  <q-page class="q-pa-md dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit Dialog Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Add/Edit Dialog Shell source is not mapped to an approved file section.
      </q-banner>
    </div>

    <AddEditRecordShellDialog
      :key="dialogRenderKey"
      v-else
      v-model="dialogOpen"
      :mode="dialogMode"
      :source-label="activeRegistryEntry?.label || 'Records'"
      :singular-label="activeRegistryEntry?.singularLabel || 'record'"
      :primary-tokens="createPrimaryTokens"
      :promoted-general-tokens="promotedGeneralTokens"
      :general-settings-groups="generalSettingsGroups"
      :left-sections="dialogSectionSplit.leftSections"
      :right-sections="dialogSectionSplit.rightSections"
      :branch-selector-token-key="branchSelectorTokenKey"
      :show-shell-selector="dialogMode !== 'edit'"
      :shell-selector-value="activeSourceKey"
      :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
      :prefer-add-layout="isAddAction"
      :initial-resources-collapsed="dialogMode === 'edit'"
      :initial-record-data-collapsed="false"
      :loading="dialogLoading"
      :submit-disabled="dialogMode === 'edit' ? !canEditWithShell : !canCreateWithShell"
      :initial-values="dialogInitialValues"
      :initial-field-meta="dialogInitialFieldMeta"
      :initial-section-key="dialogInitialSectionKey"
      :initial-artifacts="[]"
      :artifact-context="null"
      @update:shell-selector-value="updateShellSelector"
      @toggle-general-settings-group="toggleGeneralSettingsGroup"
      @toggle-general-settings-item="toggleGeneralSettingsItem"
      @request-close="dialogOpen = false"
      @submit="submitDialogRecord"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AddEditRecordShellDialog from 'src/components/AddEditRecordShellDialog.vue'
import { consumePendingAddEditShellRequest } from 'src/utils/addEditShellState'
import { getKdbRelationshipContractForToken } from 'src/shared/kdbRelationshipContracts'
import { loadShellFieldSelectionMap, persistShellFieldSelectionMap } from 'src/utils/shellFieldSelection'
import {
  CANONICAL_OPTION_LISTS,
  getCreateBranchEntry,
  getCreateBranches,
  getCreateBranchTokenName,
  getCanonicalTokenFieldNames,
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getRuntimeTableNameForEntityName,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { buildDialogSectionGroups, groupDialogLevel2Sections, splitDialogSections } from 'src/utils/dialogShellPayload'
import { buildTokenUpdateChanges, normalizeTokenWriteValue } from 'src/utils/tokenWriteChanges'

const route = useRoute()
const $q = useQuasar()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const dialogOpen = ref(false)
const dialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const dialogRenderKey = ref(0)
const dialogMode = ref('create')
const dialogInitialValues = ref({})
const dialogInitialFieldMeta = ref({})
const dialogInitialSectionKey = ref('general')
const dialogRecordId = ref('')
const dialogEntityName = ref('')
const generalFieldKeysBySource = ref(loadShellFieldSelectionMap())
const expandedGeneralSettingsGroupKeys = ref([])
const isAddAction = computed(() => dialogMode.value === 'create' && Boolean(String(route.query.create || '').trim()))

const dialogShellSourceKey = ref(resolveValidShellSection(route.query.section, route.query.entity))
const activeSourceKey = computed(() => dialogShellSourceKey.value)
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const groupedLevel2Sections = computed(() => groupDialogLevel2Sections(level2Sections.value))
const canonicalNameToken = computed(() => level3Tokens.value.find((token) => String(token.level_3) === '1') || null)
const canonicalSummaryToken = computed(() =>
  level3Tokens.value.find((token) => String(token.level_3) === '2' || String(token.label || '').trim().toLowerCase() === 'summary') || null,
)

const createPrimaryTokens = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchToken = branchTokenName
    ? level3Tokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName) || null
    : null
  return [canonicalNameToken.value, canonicalSummaryToken.value, branchToken]
    .filter(Boolean)
    .filter((token, index, list) => list.findIndex((entry) => entry.key === token.key) === index)
    .map(normalizeCreateDialogToken)
})

const promotedGeneralTokens = computed(() => {
  const selectedKeys = new Set(
    (Array.isArray(generalFieldKeysBySource.value[activeSourceKey.value]) ? generalFieldKeysBySource.value[activeSourceKey.value] : [])
      .map((key) => String(key || '').trim())
      .filter(Boolean),
  )
  if (!selectedKeys.size) return []

  const nonCoreSectionKeys = new Set(
    groupedLevel2Sections.value
      .flatMap((group) => (Array.isArray(group.sections) ? group.sections : []))
      .filter((section) => {
        const label = String(section?.label || '').trim().toLowerCase()
        return !['general', 'kdb', 'system'].includes(label)
      })
      .map((section) => section.key),
  )

  return level3Tokens.value
    .filter((token) => selectedKeys.has(token.key) && nonCoreSectionKeys.has(token.parentKey))
    .map(normalizeCreateDialogToken)
})
const generalSourceGroups = computed(() =>
  groupedLevel2Sections.value.filter((group) =>
    Array.isArray(group.sections) &&
    group.sections.some((section) => {
      const label = String(section.label || '').trim().toLowerCase()
      return !['general', 'kdb', 'system'].includes(label)
    }),
  ),
)
const generalSelectableTokens = computed(() => {
  const allowedSectionKeys = new Set(
    generalSourceGroups.value.flatMap((group) => (Array.isArray(group.sections) ? group.sections : []).map((section) => section.key)),
  )
  return level3Tokens.value
    .filter((token) => allowedSectionKeys.has(token.parentKey))
    .map(normalizeCreateDialogToken)
})
const selectedGeneralTokenKeys = computed({
  get() {
    const values = Array.isArray(generalFieldKeysBySource.value[activeSourceKey.value]) ? generalFieldKeysBySource.value[activeSourceKey.value] : []
    const allowed = new Set(generalSelectableTokens.value.map((token) => token.key))
    return values.map((value) => String(value || '').trim()).filter((value) => value && allowed.has(value))
  },
  set(value) {
    const normalized = Array.from(new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)))
    generalFieldKeysBySource.value = {
      ...generalFieldKeysBySource.value,
      [activeSourceKey.value]: normalized,
    }
  },
})
const generalSelectedTokenKeySet = computed(() => new Set(selectedGeneralTokenKeys.value))
const generalSettingsGroups = computed(() => generalSourceGroups.value.map((group) => ({
  key: group.value,
  label: group.title,
  expanded: expandedGeneralSettingsGroupKeys.value.includes(group.value),
  items: (Array.isArray(group.sections) ? group.sections : [])
    .flatMap((section) =>
      level3Tokens.value
        .filter((token) => token.parentKey === section.key)
        .map(normalizeCreateDialogToken),
    )
    .map((token) => ({
      key: token.key,
      label: token.label,
      checked: generalSelectedTokenKeySet.value.has(token.key),
    })),
})).filter((group) => group.items.length))

const primaryTokenKeys = computed(() => new Set(createPrimaryTokens.value.map((token) => token.key)))
const branchSelectorTokenKey = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  if (!branchTokenName) return ''
  return createPrimaryTokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName)?.key || ''
})
const createSectionGroups = computed(() =>
  buildDialogSectionGroups({
    groupedSections: groupedLevel2Sections.value,
    tokenFilter: (section) =>
      level3Tokens.value.filter(
        (token) => token.parentKey === section.key && !primaryTokenKeys.value.has(token.key),
      ),
    mapToken: normalizeCreateDialogToken,
  }),
)
const dialogSectionSplit = computed(() => splitDialogSections(createSectionGroups.value))
const canCreateWithShell = computed(() => {
  const branchEntries = getCreateBranches(activeSourceKey.value)
  if (branchEntries.length) {
    return branchEntries.some((branch) => Boolean(bridge.value?.[String(branch?.targetSourceKey || '').trim()]?.create))
  }
  return Boolean(bridge.value?.[activeSourceKey.value]?.create)
})
const canEditWithShell = computed(() => Boolean(dialogRecordId.value && dialogEntityName.value && bridge.value?.records?.update))
const dialogKdbSectionKey = computed(
  () => createSectionGroups.value.find((section) => String(section.label || '').trim().toLowerCase() === 'kdb')?.key || 'general',
)

watch(generalSourceGroups, (groups) => {
  const nextKeys = groups.map((group) => group.value)
  expandedGeneralSettingsGroupKeys.value = nextKeys.filter((key) => expandedGeneralSettingsGroupKeys.value.includes(key))
  if (!expandedGeneralSettingsGroupKeys.value.length && nextKeys.length) {
    expandedGeneralSettingsGroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

watch(
  [activeSourceKey, generalSelectableTokens],
  () => {
    const sourceKey = activeSourceKey.value
    const allowedKeys = new Set(generalSelectableTokens.value.map((token) => token.key))
    const existing = Array.isArray(generalFieldKeysBySource.value[sourceKey]) ? generalFieldKeysBySource.value[sourceKey] : []
    const normalized = existing.filter((key) => allowedKeys.has(key))

    if (normalized.length) {
      if (normalized.length !== existing.length) {
        generalFieldKeysBySource.value = {
          ...generalFieldKeysBySource.value,
          [sourceKey]: normalized,
        }
      }
      return
    }

    generalFieldKeysBySource.value = {
      ...generalFieldKeysBySource.value,
      [sourceKey]: generalSelectableTokens.value.slice(0, 4).map((token) => token.key),
    }
  },
  { immediate: true },
)

watch(
  generalFieldKeysBySource,
  (value) => {
    persistShellFieldSelectionMap(value)
  },
  { deep: true },
)

watch(
  () => route.query.section,
  (nextValue) => {
    const validValue = resolveValidShellSection(nextValue, route.query.entity)
    if (validValue !== dialogShellSourceKey.value) {
      dialogShellSourceKey.value = validValue
    }
  },
)

watch(activeSourceKey, async () => {
  await ensureLiveOptionsLoaded()
  if (!dialogOpen.value) dialogOpen.value = true
}, { immediate: true })

watch(
  [activeSourceKey, createPrimaryTokens, createSectionGroups, () => route.query.edit, () => route.query.entity, () => route.query.editSection, () => route.query.kind],
  async ([, , , editRecordId, editEntityName, editSection]) => {
    const normalizedRecordId = String(editRecordId || '').trim()
    if (!normalizedRecordId) {
      const pending = consumePendingAddEditShellRequest(activeSourceKey.value)
      dialogMode.value = 'create'
      dialogRecordId.value = ''
      dialogEntityName.value = ''
      dialogInitialValues.value = buildCreateDialogInitialValues(pending)
      dialogInitialFieldMeta.value = buildCreateDialogInitialFieldMeta(pending)
      dialogInitialSectionKey.value = 'general'
      dialogRenderKey.value += 1
      return
    }

    dialogMode.value = 'edit'
    dialogRecordId.value = normalizedRecordId
    dialogEntityName.value = String(editEntityName || activeRegistryEntry.value?.entityName || '').trim()
    dialogInitialSectionKey.value = String(editSection || '').trim().toLowerCase() === 'kdb' ? dialogKdbSectionKey.value : 'general'
    dialogInitialValues.value = {}
    dialogInitialFieldMeta.value = {}

    const payload = await loadEditDialogRecordPayload(dialogEntityName.value, dialogRecordId.value)
    if (!payload?.record) {
      $q.notify({ type: 'negative', message: 'Could not load the true record fields for edit.' })
      return
    }

    dialogInitialValues.value = buildEditDialogInitialValuesFromPayload(payload)
    dialogRenderKey.value += 1
    dialogOpen.value = true
  },
  { immediate: true },
)

function buildCreateDialogInitialValues(pending = null) {
  const nextInitialValues = {}
  if (pending?.initialValues && typeof pending.initialValues === 'object') {
    Object.assign(nextInitialValues, pending.initialValues)
  }
  Object.assign(nextInitialValues, buildContextRelationshipPrefill().initialValues)
  const requestedBranch = String(route.query.kind || '').trim().toLowerCase()
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchEntry = getCreateBranchEntry(activeSourceKey.value, requestedBranch)
  const branchToken = branchTokenName
    ? [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)].find(
        (token) => String(token?.tokenName || '').trim() === branchTokenName,
      ) || null
    : null

  if (branchToken && branchEntry) {
    nextInitialValues[branchToken.key] = resolveCreateDialogOptionValue(branchToken, branchEntry.value)
  }

  return nextInitialValues
}

function buildCreateDialogInitialFieldMeta(pending = null) {
  const nextFieldMeta = {}
  if (pending?.initialFieldMeta && typeof pending.initialFieldMeta === 'object') {
    Object.assign(nextFieldMeta, pending.initialFieldMeta)
  }
  Object.assign(nextFieldMeta, buildContextRelationshipPrefill().initialFieldMeta)
  return nextFieldMeta
}

function reopenDialogShell() {
  dialogOpen.value = true
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('ecvc:reopen-dialog-shell', reopenDialogShell)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('ecvc:reopen-dialog-shell', reopenDialogShell)
})

function updateShellSelector(nextValue) {
  dialogShellSourceKey.value = resolveValidShellSection(nextValue, route.query.entity)
}

function toggleGeneralSettingsGroup(groupKey) {
  const normalized = String(groupKey || '').trim()
  if (!normalized) return
  expandedGeneralSettingsGroupKeys.value = expandedGeneralSettingsGroupKeys.value.includes(normalized)
    ? expandedGeneralSettingsGroupKeys.value.filter((key) => key !== normalized)
    : [...expandedGeneralSettingsGroupKeys.value, normalized]
}

function toggleGeneralSettingsItem(itemKey, nextChecked) {
  const normalized = String(itemKey || '').trim()
  if (!normalized) return
  const existing = new Set(selectedGeneralTokenKeys.value)
  if (nextChecked) existing.add(normalized)
  else existing.delete(normalized)
  selectedGeneralTokenKeys.value = Array.from(existing)
}

function resolveValidShellSection(value, entityName = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === normalized)) return normalized
  return resolveSourceKeyFromEntityName(entityName)
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

function resolveSourceKeyFromEntityName(entityName) {
  return getFilePageRegistryEntryByEntityReference(entityName)?.key || ''
}

function buildContextRelationshipPrefill() {
  const normalizedContextEntity = String(route.query.contextEntity || '').trim()
  const normalizedContextRecordId = String(route.query.contextRecordId || '').trim()
  if (!normalizedContextEntity || !normalizedContextRecordId) {
    return { initialValues: {}, initialFieldMeta: {} }
  }

  const targetEntityName = String(activeRegistryEntry.value?.entityName || '').trim()
  if (!targetEntityName) return { initialValues: {}, initialFieldMeta: {} }

  const matchingTokens = level3Tokens.value.filter((token) => {
    const relationshipContract = getKdbRelationshipContractForToken(targetEntityName, token?.tokenName)
    return String(relationshipContract?.targetEntity || '').trim() === normalizedContextEntity
  })

  if (!matchingTokens.length) return { initialValues: {}, initialFieldMeta: {} }

  const initialValues = {}
  const initialFieldMeta = {}

  matchingTokens.forEach((token) => {
    const tokenKey = String(token?.key || '').trim()
    const tokenType = String(token?.tokenType || '').trim()
    const tokenName = String(token?.tokenName || '').trim()
    if (!tokenKey || !tokenName) return

    initialValues[tokenKey] = tokenType === 'select_multi' ? [normalizedContextRecordId] : normalizedContextRecordId
    initialFieldMeta[tokenKey] = {
      fieldName: tokenName,
      tableName: getRuntimeTableNameForEntityName(targetEntityName),
      recordId: '',
      verificationState: 'default_preselected_unverified',
      verificationSource: 'action_route_preselected',
    }
  })

  return { initialValues, initialFieldMeta }
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
    const label = String(titleToken ? getCanonicalTokenValue(row, titleToken) : '').trim()
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

async function loadLiveOptionRowsForSource(sourceKey) {
  if (!sourceKey) return
  try {
    const result = await bridge.value?.[sourceKey]?.list?.()
    const rows = Array.isArray(result) ? result : Object.values(result || {}).find((value) => Array.isArray(value)) || []
    liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: rows }
  } catch {
    liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
  }
}

async function ensureLiveOptionsLoadedForTokens(tokens = []) {
  const sourceKeys = new Set()
  for (const token of Array.isArray(tokens) ? tokens : []) {
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
    await loadLiveOptionRowsForSource(sourceKey)
  }
}

function resolveCreateDialogOptionValue(token, rawValue) {
  if (rawValue == null) return ''
  const normalized = String(rawValue || '').trim()
  if (!normalized) return ''
  const options = Array.isArray(token?.inputOptions) ? token.inputOptions : getInputOptionsForToken(token)
  const matchedOption = options.find((option) => {
    const optionValue = String(option?.value ?? '').trim()
    const optionLabel = String(option?.label ?? '').trim()
    return normalized === optionValue || normalized === optionLabel
  })
  return matchedOption ? matchedOption.value : normalized
}

function normalizeCreateDialogInitialValue(token, value) {
  const tokenType = String(token?.tokenType || '').trim()

  if (tokenType === 'select_multi') {
    const values = Array.isArray(value)
      ? value
      : String(value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

    return values.map((item) => resolveCreateDialogOptionValue(token, item)).filter(Boolean)
  }

  if (tokenType === 'select_single') {
    return resolveCreateDialogOptionValue(token, value)
  }

  return value == null ? '' : String(value)
}

function getEditDialogTokenValueFromPayload(payload, token) {
  if (!payload) return ''

  const fieldNames = getCanonicalTokenFieldNames(token)
  const payloadFields = Array.isArray(payload.fields) ? payload.fields : []

  for (const fieldName of fieldNames) {
    const matchingField = payloadFields.find((field) => String(field?.field_name || '').trim() === fieldName)
    if (!matchingField) continue
    const relationshipIds = Array.isArray(matchingField?.relationship_ids)
      ? matchingField.relationship_ids.map((value) => String(value || '').trim()).filter(Boolean)
      : []
    if (relationshipIds.length) return relationshipIds

    const fieldValue = matchingField?.value
    if (fieldValue != null && !(typeof fieldValue === 'string' && !fieldValue.trim())) {
      return fieldValue
    }
  }

  for (const fieldName of fieldNames) {
    const recordValue = payload.record?.[fieldName]
    if (recordValue != null && !(typeof recordValue === 'string' && !recordValue.trim())) {
      return recordValue
    }
  }

  return ''
}

async function loadEditDialogRecordPayload(entityName, recordId) {
  const normalizedEntityName = String(entityName || '').trim()
  const normalizedRecordId = String(recordId || '').trim()
  if (!bridge.value?.records?.view || !normalizedEntityName || !normalizedRecordId) return null
  return await bridge.value.records.view(normalizedEntityName, normalizedRecordId)
}

function buildEditDialogInitialValuesFromPayload(payload) {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens.map((token) => {
      const value = getEditDialogTokenValueFromPayload(payload, token)
      return [token.key, normalizeCreateDialogInitialValue(token, value)]
    }),
  )
}

async function ensureLiveOptionsLoaded() {
  await ensureLiveOptionsLoadedForTokens([
    ...createPrimaryTokens.value,
    ...createSectionGroups.value.flatMap((section) => section.tokens),
  ])
}

async function submitDialogRecord({ values } = {}) {
  if (dialogMode.value === 'edit') {
    await submitEditRecord(values)
    return
  }
  await submitCreateRecord(values)
}

async function submitCreateRecord(values = {}) {
  const allCreateTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  const payload = Object.fromEntries(
    allCreateTokens
      .map((token) => {
        if (branchSelectorTokenKey.value && token.key === branchSelectorTokenKey.value) return null
        const normalizedValue = normalizeTokenWriteValue(token, values?.[token.key])
        if (normalizedValue == null) return null
        return [String(token?.dbWriteField || token?.tokenName || token?.key || '').trim(), normalizedValue]
      })
      .filter(Boolean),
  )

  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }

  dialogLoading.value = true
  try {
    let result = null
    const branchEntry = getCreateBranchEntry(activeSourceKey.value, values?.[branchSelectorTokenKey.value])
    const createTargetSourceKey = branchEntry?.targetSourceKey || activeSourceKey.value
    if (branchSelectorTokenKey.value) {
      const branchLabel = String(activeRegistryEntry.value?.createBranchLabel || 'Type').trim()
      if (!branchEntry?.targetSourceKey) {
        $q.notify({ type: 'negative', message: `Choose ${branchLabel} before continuing.` })
        return
      }
      result = await bridge.value?.[branchEntry.targetSourceKey]?.create?.(payload)
    } else {
      result = await bridge.value?.[activeSourceKey.value]?.create?.(payload)
    }
    if (!result) {
      $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
      return
    }

    const createdRecordId = String(result?.id || '').trim()
    const createdEntityName = String(getFilePageRegistryEntry(createTargetSourceKey)?.entityName || '').trim()
    if (createdRecordId && createdEntityName && bridge.value?.records?.update) {
      const relationshipChanges = allCreateTokens.flatMap((token) => {
        if (!getKdbRelationshipContractForToken(createdEntityName, token?.tokenName)) return []
        return buildTokenUpdateChanges(token, {
          nextValue: values?.[token.key],
          initialValue: null,
          recordId: createdRecordId,
          entityName: createdEntityName,
          tableName: getRuntimeTableNameForEntityName(createdEntityName),
        })
      })

      if (relationshipChanges.length) {
        await bridge.value.records.update({
          tableName: getRuntimeTableNameForEntityName(createdEntityName),
          recordId: createdRecordId,
          changes: relationshipChanges,
          actionLabel: 'shared_dialog_shell_birth_relationships',
        })
      }
    }

    dialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    dialogLoading.value = false
  }
}

async function submitEditRecord(values = {}) {
  if (!dialogRecordId.value || !dialogEntityName.value) {
    $q.notify({ type: 'negative', message: 'This record cannot be edited from the shared shell yet.' })
    return
  }

  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  const changes = allTokens.flatMap((token) =>
    buildTokenUpdateChanges(token, {
      nextValue: values?.[token.key],
      initialValue: dialogInitialValues.value?.[token.key],
      recordId: dialogRecordId.value,
      entityName: dialogEntityName.value,
      tableName: getRuntimeTableNameForEntityName(dialogEntityName.value),
    }),
  )

  if (!changes.length) {
    dialogOpen.value = false
    return
  }

  dialogLoading.value = true
  try {
    await bridge.value?.records?.update?.({
      tableName: getRuntimeTableNameForEntityName(dialogEntityName.value),
      recordId: dialogRecordId.value,
      changes,
      actionLabel: 'shared_dialog_shell_edit',
    })
    dialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} updated.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    dialogLoading.value = false
  }
}
</script>

<style scoped>
</style>
