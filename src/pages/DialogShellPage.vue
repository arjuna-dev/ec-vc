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
        Add/Edit Dialog Shell source is not mapped to an approved file view.
      </q-banner>
    </div>

    <AddEditRecordShellDialog
      v-else
      v-model="dialogOpen"
      :mode="dialogMode"
      :source-label="activeRegistryEntry?.label || 'Records'"
      :singular-label="activeRegistryEntry?.singularLabel || 'record'"
      :primary-tokens="createPrimaryTokens"
      :promoted-general-tokens="promotedGeneralTokens"
      :general-settings-groups="generalSettingsGroups"
      :left-sections="dialogViewSplit.leftSections"
      :right-sections="dialogViewSplit.rightSections"
      :branch-selector-token-key="branchSelectorTokenKey"
      :show-shell-selector="dialogMode !== 'edit'"
      :shell-selector-value="activeSourceKey"
      :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
      :prefer-add-layout="isAddAction"
      :initial-resources-collapsed="dialogMode === 'edit' ? true : false"
      :initial-record-data-collapsed="dialogMode === 'edit' ? false : true"
      :initial-snapshot="dialogInitialSnapshot"
      :loading="dialogLoading"
      :submit-disabled="dialogMode === 'edit' ? !canEditWithShell : !canCreateWithShell"
      :initial-values="dialogInitialValues"
      :initial-field-meta="dialogInitialFieldMeta"
      :initial-section-key="dialogInitialSectionKey"
      :history-items="dialogHistoryItems"
      :history-loading="dialogHistoryLoading"
      :history-table-name="dialogHistoryTableName"
      :history-record-id="dialogRecordId"
      :initial-artifacts="[]"
      :artifact-context="null"
      @update:shell-selector-value="updateShellSelector"
      @toggle-general-settings-group="toggleGeneralSettingsGroup"
      @toggle-general-settings-item="toggleGeneralSettingsItem"
      @request-close="handleDialogClose"
      @submit="submitDialogRecord"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AddEditRecordShellDialog from 'src/components/AddEditRecordShellDialog.vue'
import { consumePendingAddEditShellRequest, setPendingAddEditShellRequest } from 'src/utils/addEditShellState'
import { getLdbRelationshipContractForToken, getLdbRelationshipContractsForEntity } from 'src/shared/ldbRelationshipContracts'
import { loadShellFieldSelectionMap, persistShellFieldSelectionMap } from 'src/utils/shellFieldSelection'
import {
  getCreateBranchEntry,
  getCreateBranches,
  getCreateBranchTokenName,
  getCanonicalTokenFieldNames,
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getRegistrySummaryTokenForSource,
  getRegistryTitleTokenForSource,
  getRuntimeTableNameForEntityName,
  getRuntimeStructureVersion,
  subscribeRuntimeFileStructures,
  buildFileShellPayload,
  resolveApprovedFileSectionKey,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { buildDialogViews, groupDialogViews, splitDialogViews } from 'src/utils/dialogShellPayload'
import { buildTokenUpdateChanges, normalizeTokenWriteValue } from 'src/utils/tokenWriteChanges'
import { submitSharedRecordEditSession } from 'src/utils/sharedRecordEditSession'

function isRelationshipView(sectionOrLabel) {
  const normalized = String(
    typeof sectionOrLabel === 'string'
      ? sectionOrLabel
      : sectionOrLabel?.label || '',
  )
    .trim()
    .toLowerCase()
  return normalized === 'ldb'
}

const route = useRoute()
const $q = useQuasar()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const dialogOpen = ref(false)
const dialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const dialogMode = ref('create')
const dialogInitialValues = ref({})
const dialogInitialFieldMeta = ref({})
const dialogInitialSnapshot = ref(null)
const dialogInitialSectionKey = ref('general')
const dialogRecordId = ref('')
const dialogEntityName = ref('')
const dialogHistoryItems = ref([])
const dialogHistoryLoading = ref(false)
const generalFieldKeysBySource = ref(loadShellFieldSelectionMap())
const expandedGeneralSettingsGroupKeys = ref([])
const isAddAction = computed(() => dialogMode.value === 'create' && Boolean(String(route.query.create || '').trim()))
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null

const dialogShellSourceKey = ref(resolveValidShellSection(route.query.section, route.query.entity))
const activeSourceKey = computed(() => dialogShellSourceKey.value)
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const fileShellPayload = computed(() => {
  runtimeStructureVersion.value
  return buildFileShellPayload(activeSourceKey.value)
})
const fileViews = computed(() => fileShellPayload.value.sections)
const fileTokens = computed(() => fileShellPayload.value.tokens)
const groupedViews = computed(() => groupDialogViews(fileViews.value))
const canonicalNameToken = computed(() => getRegistryTitleTokenForSource(activeSourceKey.value) || null)
const canonicalSummaryToken = computed(() => getRegistrySummaryTokenForSource(activeSourceKey.value) || null)

const createPrimaryTokens = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchToken = branchTokenName
    ? fileTokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName) || null
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
    groupedViews.value
      .flatMap((group) => (Array.isArray(group.views) ? group.views : []))
      .filter((view) => {
        const label = String(view?.label || '').trim().toLowerCase()
        return label !== 'general' && label !== 'system' && !isRelationshipView(label)
      })
      .map((view) => view.key),
  )

  return fileTokens.value
    .filter((token) => selectedKeys.has(token.key) && nonCoreSectionKeys.has(token.parentKey))
    .map(normalizeCreateDialogToken)
})
const generalSourceGroups = computed(() =>
  groupedViews.value.filter((group) =>
    Array.isArray(group.views) &&
    group.views.some((view) => {
      const label = String(view.label || '').trim().toLowerCase()
      return label !== 'general' && label !== 'system' && !isRelationshipView(label)
    }),
  ),
)
const generalSelectableTokens = computed(() => {
  const allowedViewKeys = new Set(
    generalSourceGroups.value.flatMap((group) => (Array.isArray(group.views) ? group.views : []).map((view) => view.key)),
  )
  return fileTokens.value
    .filter((token) => allowedViewKeys.has(token.parentKey))
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
  items: (Array.isArray(group.views) ? group.views : [])
    .flatMap((view) =>
      fileTokens.value
        .filter((token) => token.parentKey === view.key)
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
const sharedLdbSectionTokens = computed(() => {
  if (!activeRegistryEntry.value?.entityName) return []

  const systemFileTitleToken = getRegistryTitleTokenForSource('file-system')
  const seenSourceKeys = new Set()
  const rows = Array.isArray(liveOptionRowsBySource.value['file-system']) ? liveOptionRowsBySource.value['file-system'] : []

  return rows
    .map((row, index) => {
      const sourceKey = resolveApprovedFileSectionKey(
        row?.File_Source_Key || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
      )
      if (!sourceKey || sourceKey === 'bb-file' || seenSourceKeys.has(sourceKey)) return null

      const targetEntry = getFilePageRegistryEntry(sourceKey)
      if (!targetEntry?.entityName) return null

      seenSourceKeys.add(sourceKey)
      return normalizeCreateDialogToken({
        key: `__shared_ldb__:${sourceKey}`,
        tokenName: `__shared_ldb__:${sourceKey}`,
        label:
          String(systemFileTitleToken ? getCanonicalTokenValue(row, systemFileTitleToken) : '').trim()
          || targetEntry.label
          || `File ${index + 1}`,
        tokenType: 'select_multi',
        inputOptions: buildLiveEntityOptions(sourceKey),
        parentKey: dialogLdbSectionKey.value,
        parentLabel: 'LDB',
        isSharedLdbToken: true,
        targetSourceKey: sourceKey,
        targetEntity: String(targetEntry.entityName || '').trim(),
      })
    })
    .filter(Boolean)
})
const createViewGroups = computed(() =>
  buildDialogViews({
    groupedViews: groupedViews.value,
    tokenFilter: (view) => (
      isRelationshipView(view)
        ? sharedLdbSectionTokens.value
        : fileTokens.value.filter(
            (token) => token.parentKey === view.key && !primaryTokenKeys.value.has(token.key),
          )
    ),
    mapToken: normalizeCreateDialogToken,
    keepEmptySections: true,
  }),
)
const dialogViewSplit = computed(() => splitDialogViews(createViewGroups.value))
const canCreateWithShell = computed(() => {
  const branchEntries = getCreateBranches(activeSourceKey.value)
  if (branchEntries.length) {
    return branchEntries.some((branch) => Boolean(bridge.value?.[String(branch?.targetSourceKey || '').trim()]?.create))
  }
  return Boolean(bridge.value?.[activeSourceKey.value]?.create)
})
const canEditWithShell = computed(() => Boolean(dialogRecordId.value && dialogEntityName.value && bridge.value?.records?.update))
const dialogLdbSectionKey = computed(
  () => createViewGroups.value.find((section) => isRelationshipView(section))?.key || 'general',
)
const dialogHistoryTableName = computed(() => String(getRuntimeTableNameForEntityName(dialogEntityName.value) || '').trim())

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

    if (existing.length || generalFieldKeysBySource.value[sourceKey]) {
      generalFieldKeysBySource.value = {
        ...generalFieldKeysBySource.value,
        [sourceKey]: normalized,
      }
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
  [activeSourceKey, createPrimaryTokens, createViewGroups, () => route.query.edit, () => route.query.entity, () => route.query.editSection, () => route.query.kind],
  async ([, , , editRecordId, editEntityName, editSection]) => {
    const normalizedRecordId = String(editRecordId || '').trim()
    if (!normalizedRecordId) {
      const pending = consumePendingAddEditShellRequest(activeSourceKey.value)
      dialogMode.value = 'create'
      dialogRecordId.value = ''
      dialogEntityName.value = ''
      dialogHistoryItems.value = []
      dialogHistoryLoading.value = false
      dialogInitialValues.value = buildCreateDialogInitialValues(pending)
      dialogInitialFieldMeta.value = buildCreateDialogInitialFieldMeta(pending)
      dialogInitialSnapshot.value = pending?.snapshot || null
      dialogInitialSectionKey.value = 'general'
      dialogOpen.value = true
      return
    }

    dialogMode.value = 'edit'
    dialogRecordId.value = normalizedRecordId
    dialogEntityName.value = String(editEntityName || activeRegistryEntry.value?.entityName || '').trim()
    dialogInitialSectionKey.value = isRelationshipView(editSection) ? dialogLdbSectionKey.value : 'general'
    dialogInitialValues.value = {}
    dialogInitialFieldMeta.value = {}
    dialogHistoryItems.value = []
    dialogInitialSnapshot.value = null

    const payload = await loadEditDialogRecordPayload(dialogEntityName.value, dialogRecordId.value)
    if (!payload?.record) {
      $q.notify({ type: 'negative', message: 'Could not load the true record fields for edit.' })
      return
    }

    dialogInitialValues.value = buildEditDialogInitialValuesFromPayload(payload)
    await loadDialogHistory()
    dialogOpen.value = true
  },
  { immediate: true },
)

function buildCreateDialogInitialValues(pending = null) {
  const nextInitialValues = {}
  if (pending?.snapshot?.values && typeof pending.snapshot.values === 'object') {
    Object.assign(nextInitialValues, pending.snapshot.values)
  }
  if (pending?.initialValues && typeof pending.initialValues === 'object') {
    Object.assign(nextInitialValues, pending.initialValues)
  }
  Object.assign(nextInitialValues, buildContextRelationshipPrefill().initialValues)
  const requestedBranch = String(route.query.kind || '').trim().toLowerCase()
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchEntry = getCreateBranchEntry(activeSourceKey.value, requestedBranch)
  const branchToken = branchTokenName
    ? [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)].find(
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
  if (pending?.snapshot?.verification?.changes && typeof pending.snapshot.verification.changes === 'object') {
    Object.assign(nextFieldMeta, pending.snapshot.verification.changes)
  }
  Object.assign(nextFieldMeta, buildContextRelationshipPrefill().initialFieldMeta)
  return nextFieldMeta
}

function handleDialogClose(snapshot) {
  if (snapshot?.closeReason === 'discard' || !snapshot?.hasUserChanges) {
    dialogInitialSnapshot.value = null
    return
  }
  setPendingAddEditShellRequest({
    sourceKey: activeSourceKey.value,
    initialValues: snapshot?.values || {},
    initialFieldMeta: snapshot?.verification?.changes || {},
    snapshot,
  })
}

function reopenDialogShell() {
  dialogOpen.value = true
}

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('ecvc:reopen-dialog-shell', reopenDialogShell)
  }
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
    window.removeEventListener('ecvc:reopen-dialog-shell', reopenDialogShell)
  }
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
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
  return resolveApprovedFileSectionKey(value, entityName)
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
  if (optionSource === 'shared_file_universe' || token?.isSharedLdbToken) {
    const sourceKey = String(token?.targetSourceKey || '').trim() || resolveSourceKeyFromEntityName(token?.optionEntity)
    return sourceKey ? buildLiveEntityOptions(sourceKey) : []
  }
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

  const matchingTokens = fileTokens.value.filter((token) => {
    const relationshipContract = getLdbRelationshipContractForToken(targetEntityName, token)
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
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
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
  if (token?.isSharedLdbToken) return getSharedLdbTokenRawValueFromPayload(payload, token)

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

function getSharedLdbTokenRawValueFromPayload(payload, token) {
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const targetEntity = String(token?.targetEntity || '').trim()
  if (!entityName || !targetEntity) return []

  const contracts = getLdbRelationshipContractsForEntity(entityName).filter(
    (contract) => String(contract?.targetEntity || '').trim() === targetEntity,
  )
  if (!contracts.length) return []

  const values = contracts.flatMap((contract) => {
    const sourceToken = fileTokens.value.find(
      (entry) => String(entry?.tokenName || '').trim() === String(contract?.sourceToken || '').trim(),
    )
    if (!sourceToken) return []
    const rawValue = getEditDialogTokenValueFromPayload(payload, sourceToken)
    if (Array.isArray(rawValue)) return rawValue.map((value) => String(value || '').trim()).filter(Boolean)
    return String(rawValue || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  })

  return Array.from(new Set(values))
}

async function loadEditDialogRecordPayload(entityName, recordId) {
  const normalizedEntityName = String(entityName || '').trim()
  const normalizedRecordId = String(recordId || '').trim()
  if (!bridge.value?.records?.view || !normalizedEntityName || !normalizedRecordId) return null
  return await bridge.value.records.view(normalizedEntityName, normalizedRecordId)
}

function formatHistoryActorLabel(actorValue) {
  const normalized = String(actorValue || '').trim()
  if (!normalized) return 'Missing actor'
  return `Unresolved actor: ${normalized}`
}

function buildHistoryEventTitle(event = {}) {
  const action = String(event?.action_label || '').trim().toLowerCase()
  const recordLabel = String(event?.record_name || event?.record_label || event?.record_id || '').trim()
  const fieldLabel = String(event?.field_label || event?.field_name || '').trim()
  if (action === 'created') return recordLabel ? `Created ${recordLabel}` : 'Created missing record label'
  if (action === 'deleted') return recordLabel ? `Deleted ${recordLabel}` : 'Deleted missing record label'
  if (action === 'verified') return fieldLabel ? `Verified ${fieldLabel}` : 'Verified missing field label'
  if (action === 'modified') return fieldLabel ? `Modified ${fieldLabel}` : (recordLabel ? `Modified ${recordLabel}` : 'Modified missing record label')
  if (fieldLabel) return `${action || 'Updated'} ${fieldLabel}`
  if (recordLabel) return `${action || 'Updated'} ${recordLabel}`
  return String(event?.summary || event?.action_label || 'History item').trim()
}

function normalizeDialogHistoryItems(events = []) {
  return (Array.isArray(events) ? events : [])
    .map((event, index) => ({
      id: String(event?.id || '').trim() || `history:${index}`,
      sourceLabel: formatHistoryActorLabel(event?.edited_by),
      meta: String(event?.edited_at || '').trim() || 'Missing datetime',
      title: buildHistoryEventTitle(event),
      openable: Boolean(String(event?.id || '').trim()),
    }))
    .filter((item) => item.title)
}

async function loadDialogHistory() {
  const tableName = dialogHistoryTableName.value
  const recordId = String(dialogRecordId.value || '').trim()
  if (!tableName || !recordId || !bridge.value?.audit?.history) {
    dialogHistoryItems.value = []
    dialogHistoryLoading.value = false
    return
  }

  dialogHistoryLoading.value = true
  try {
    const result = await bridge.value.audit.history({
      table_name: tableName,
      record_id: recordId,
      limit: 8,
    })
    dialogHistoryItems.value = normalizeDialogHistoryItems(result?.events)
  } catch {
    dialogHistoryItems.value = []
  } finally {
    dialogHistoryLoading.value = false
  }
}

function buildEditDialogInitialValuesFromPayload(payload) {
  const allTokens = [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
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
    ...createViewGroups.value.flatMap((section) => section.tokens),
  ])

  if (!liveOptionRowsBySource.value['file-system']) {
    await loadLiveOptionRowsForSource('file-system')
  }

  const systemRows = Array.isArray(liveOptionRowsBySource.value['file-system']) ? liveOptionRowsBySource.value['file-system'] : []
  for (const row of systemRows) {
    const sourceKey = resolveApprovedFileSectionKey(
      row?.File_Source_Key || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
    )
    if (!sourceKey || sourceKey === 'bb-file' || liveOptionRowsBySource.value[sourceKey]) continue
    await loadLiveOptionRowsForSource(sourceKey)
  }
}

async function submitDialogRecord({ values } = {}) {
  if (dialogMode.value === 'edit') {
    await submitEditRecord(values)
    return
  }
  await submitCreateRecord(values)
}

async function submitCreateRecord(values = {}) {
  const allCreateTokens = [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
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
      const branchLabel = String(activeRegistryEntry.value?.createBranchLabel || 'Fork').trim()
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
        if (!getLdbRelationshipContractForToken(createdEntityName, token)) return []
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
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Missing record type'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    dialogLoading.value = false
  }
}

async function submitEditRecord(values = {}) {
  const allTokens = [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]

  dialogLoading.value = true
  try {
    const result = await submitSharedRecordEditSession({
      bridge: bridge.value,
      tokens: allTokens,
      values,
      initialValues: dialogInitialValues.value,
      recordId: dialogRecordId.value,
      entityName: dialogEntityName.value,
      actionLabel: 'shared_dialog_shell_edit',
    })
    if (!result.changes.length) {
      dialogOpen.value = false
      return
    }
    dialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Missing record type'} updated.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    dialogLoading.value = false
  }
}
</script>

<style scoped>
</style>
