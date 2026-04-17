<template>
  <q-page class="q-pa-md intake-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Intake Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Intake Shell source is not mapped to an approved file view.
      </q-banner>
    </div>

    <IntakeShellDialog
      :key="dialogRenderKey"
      v-else
      v-model="dialogOpen"
      :mode="dialogMode"
      :source-label="activeRegistryEntry?.label || 'Intake'"
      :singular-label="activeRegistryEntry?.singularLabel || 'intake record'"
      :primary-tokens="createPrimaryTokens"
      :left-sections="dialogViewSplit.leftSections"
      :right-sections="dialogViewSplit.rightSections"
      :branch-selector-token-key="branchSelectorTokenKey"
      :show-shell-selector="false"
      :shell-selector-value="activeSourceKey"
      :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
      :loading="dialogLoading"
      :submit-disabled="dialogMode === 'edit' ? !canEditWithShell : !canCreateWithShell"
      :initial-values="dialogInitialValues"
      :initial-field-meta="dialogInitialFieldMeta"
      :initial-section-key="dialogInitialSectionKey"
      :initial-artifacts="dialogInitialArtifacts"
      :initial-project-ids="dialogInitialProjectIds"
      :initial-snapshot="dialogInitialSnapshot"
      :artifact-context="dialogArtifactContext"
      @request-close="handleDialogClose"
      @change="handleDialogChange"
      @submit="submitDialogRecord"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import IntakeShellDialog from 'src/components/IntakeShellDialog.vue'
import {
  getCreateBranchEntry,
  getCreateBranches,
  getCreateBranchTokenName,
  getCanonicalTokenFieldNames,
  getCanonicalTokenWriteFieldName,
  getDefaultTokenCreateValue,
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getRegistrySummaryTokenForSource,
  getRegistryTitleTokenForSource,
  getRuntimeStructureVersion,
  subscribeRuntimeFileStructures,
  buildFileShellPayload,
  resolveApprovedFileSectionKey,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import {
  getLiveOptionRowsState,
  loadFileRecordRows,
  subscribeLiveOptionRowsState,
} from 'src/utils/fileRecordLoaders'
import { buildSurfaceSections, groupSurfaceViews, splitSurfaceSections } from 'src/utils/shellViewLayout'
import { buildTokenUpdateChanges, normalizeTokenWriteValue } from 'src/utils/tokenWriteChanges'

const route = useRoute()
const $q = useQuasar()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const dialogOpen = ref(false)
const dialogLoading = ref(false)
const liveOptionRowsBySource = ref(getLiveOptionRowsState())
const dialogRenderKey = ref(0)
const dialogMode = ref('create')
const dialogInitialValues = ref({})
const dialogInitialFieldMeta = ref({})
const dialogInitialSectionKey = ref('general')
const dialogRecordId = ref('')
const dialogEntityName = ref('')
const dialogInitialArtifacts = ref([])
const dialogInitialProjectIds = ref([])
const dialogInitialSnapshot = ref(null)
const dialogArtifactContext = ref(null)
const pendingIntakeRequest = ref(null)
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null
let liveOptionRowsUnsub = null

const fallbackSectionKey = 'intake'
const dialogShellSourceKey = ref(resolveValidShellSection(route.query.section || fallbackSectionKey))
const activeSourceKey = computed(() => dialogShellSourceKey.value)
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const fileShellPayload = computed(() => {
  runtimeStructureVersion.value
  return buildFileShellPayload(activeSourceKey.value)
})
const fileViews = computed(() => fileShellPayload.value.sections)
const fileTokens = computed(() => fileShellPayload.value.tokens)
const groupedViews = computed(() => groupSurfaceViews(fileViews.value))

const createPrimaryTokens = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchToken = branchTokenName
    ? fileTokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName) || null
    : null
  const tokens = [
    getRegistryTitleTokenForSource(activeSourceKey.value),
    getRegistrySummaryTokenForSource(activeSourceKey.value),
  ]
  return [...tokens, branchToken]
    .filter(Boolean)
    .filter((token, index, list) => list.findIndex((entry) => entry.key === token.key) === index)
    .map(normalizeCreateDialogToken)
})

const primaryTokenKeys = computed(() => new Set(createPrimaryTokens.value.map((token) => token.key)))
const branchSelectorTokenKey = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  if (!branchTokenName) return ''
  return createPrimaryTokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName)?.key || ''
})
const createViewGroups = computed(() =>
  buildSurfaceSections({
    groupedViews: groupedViews.value,
    tokenFilter: (view) =>
      fileTokens.value.filter(
        (token) => token.parentKey === view.key && !primaryTokenKeys.value.has(token.key),
      ),
    mapToken: normalizeCreateDialogToken,
    keepEmptySections: true,
  }),
)
const dialogViewSplit = computed(() => splitSurfaceSections(createViewGroups.value))
const canCreateWithShell = computed(() => {
  const branchEntries = getCreateBranches(activeSourceKey.value)
  if (branchEntries.length) {
    return branchEntries.some((branch) => Boolean(bridge.value?.[String(branch?.targetSourceKey || '').trim()]?.create))
  }
  return Boolean(bridge.value?.[activeSourceKey.value]?.create)
})
const canEditWithShell = computed(() => Boolean(dialogRecordId.value && dialogEntityName.value && bridge.value?.records?.update))
function isRelationshipViewLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
}
const dialogLdbSectionKey = computed(
  () => createViewGroups.value.find((section) => isRelationshipViewLabel(section?.label))?.key || 'general',
)

watch(
  () => route.query.section,
  (nextValue) => {
    const validValue = resolveValidShellSection(nextValue)
    if (validValue !== dialogShellSourceKey.value) {
      dialogShellSourceKey.value = validValue
    }
  },
)

watch(activeSourceKey, async () => {
  await ensureLiveOptionsLoaded()
  if (!dialogOpen.value) dialogOpen.value = true
}, { immediate: true })

function buildRouteArtifactContext() {
  const entityName = String(route.query.contextEntity || '').trim()
  const entityLabel = String(route.query.contextEntityLabel || '').trim()
  const recordId = String(route.query.contextRecordId || '').trim()
  const recordLabel = String(route.query.contextRecordLabel || '').trim()
  if (!entityName || !recordId) return null
  return {
    entityName,
    entityLabel,
    recordId,
    recordLabel,
    state: 'default_preselected_unverified',
  }
}

watch(
  () => route.query.open,
  () => {
    const pending = pendingIntakeRequest.value
    pendingIntakeRequest.value = null
    if (!pending) {
      dialogArtifactContext.value = buildRouteArtifactContext()
      return
    }
    const pendingSnapshot = pending.snapshot && typeof pending.snapshot === 'object' ? pending.snapshot : null
    dialogInitialSnapshot.value = pendingSnapshot
    dialogInitialArtifacts.value = Array.isArray(pendingSnapshot?.stagedArtifacts)
      ? pendingSnapshot.stagedArtifacts
      : Array.isArray(pending.initialArtifacts) ? pending.initialArtifacts : []
    dialogInitialProjectIds.value = Array.isArray(pending.projectIds) ? pending.projectIds : []
    dialogArtifactContext.value = pending.artifactContext && typeof pending.artifactContext === 'object'
      ? pending.artifactContext
      : null
    dialogRenderKey.value += 1
  },
  { immediate: true },
)

watch(
  [activeSourceKey, createPrimaryTokens, createViewGroups, () => route.query.edit, () => route.query.entity, () => route.query.editSection, () => route.query.kind],
  async ([, , , editRecordId, editEntityName, editSection]) => {
    const normalizedRecordId = String(editRecordId || '').trim()
    if (!normalizedRecordId) {
      dialogMode.value = 'create'
      dialogRecordId.value = ''
      dialogEntityName.value = ''
      dialogInitialValues.value = buildCreateDialogInitialValues()
      dialogInitialFieldMeta.value = {}
      dialogInitialSectionKey.value = 'general'
      dialogInitialProjectIds.value = []
      dialogInitialSnapshot.value = null
      dialogRenderKey.value += 1
      return
    }

    dialogMode.value = 'edit'
    dialogRecordId.value = normalizedRecordId
    dialogEntityName.value = String(editEntityName || activeRegistryEntry.value?.entityName || '').trim()
    dialogInitialSectionKey.value = isRelationshipViewLabel(editSection) ? dialogLdbSectionKey.value : 'general'
    dialogInitialValues.value = {}
    dialogInitialFieldMeta.value = {}
    dialogInitialSnapshot.value = null

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

function buildPendingIntakeRequest(snapshot = null) {
  if (!snapshot || typeof snapshot !== 'object') return null
  const draftSnapshot = snapshot.draftSnapshot && typeof snapshot.draftSnapshot === 'object'
    ? snapshot.draftSnapshot
    : null
  const stagedArtifacts = Array.isArray(draftSnapshot?.stagedArtifacts) ? draftSnapshot.stagedArtifacts : []
  const hasDraft = Boolean(snapshot.hasUserChanges) || stagedArtifacts.length > 0
  if (!hasDraft) return null
  return {
    initialArtifacts: stagedArtifacts.length ? stagedArtifacts : dialogInitialArtifacts.value,
    artifactContext: dialogArtifactContext.value,
    projectIds: Array.isArray(draftSnapshot?.selectedProjectIds) ? draftSnapshot.selectedProjectIds : [],
    snapshot: draftSnapshot,
  }
}

function handleDialogChange(snapshot) {
  const pending = buildPendingIntakeRequest(snapshot)
  pendingIntakeRequest.value = pending
}

function handleDialogClose(snapshot) {
  dialogOpen.value = false
  const pending = buildPendingIntakeRequest(snapshot)
  pendingIntakeRequest.value = pending
}

function buildCreateDialogInitialValues() {
  const nextInitialValues = {}
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

onMounted(() => {
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
  liveOptionRowsUnsub = subscribeLiveOptionRowsState((rowsBySource) => {
    liveOptionRowsBySource.value = { ...rowsBySource }
  })
})

onBeforeUnmount(() => {
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
  if (liveOptionRowsUnsub) liveOptionRowsUnsub()
  liveOptionRowsUnsub = null
})

function resolveValidShellSection(value) {
  return resolveApprovedFileSectionKey(value, 'Intake') || fallbackSectionKey
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
  return Array.isArray(token?.inputOptions) ? token.inputOptions : []
}

function resolveSourceKeyFromEntityName(entityName) {
  return getFilePageRegistryEntryByEntityReference(entityName)?.key || ''
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
  const allTokens = [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens.map((token) => {
      const value = getEditDialogTokenValueFromPayload(payload, token)
      return [token.key, normalizeCreateDialogInitialValue(token, value)]
    }),
  )
}

async function ensureLiveOptionsLoaded() {
  const sourceKeys = new Set()
  for (const token of [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]) {
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
    liveOptionRowsBySource.value = await loadFileRecordRows({
      sourceKey,
      bridgeValue: bridge.value,
      currentRowsBySource: liveOptionRowsBySource.value,
      skipSourceKey: activeSourceKey.value,
    })
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
  const payload = Object.fromEntries(
    [...createPrimaryTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
      .map((token) => {
        if (branchSelectorTokenKey.value && token.key === branchSelectorTokenKey.value) return null
        const rawValue = values?.[token.key]
        const defaultValue = getDefaultTokenCreateValue(token)
        const effectiveValue = rawValue == null || String(rawValue).trim() === ''
          ? defaultValue
          : rawValue
        const normalizedValue = normalizeTokenWriteValue(token, effectiveValue)
        if (normalizedValue == null) return null
        const writeField = getCanonicalTokenWriteFieldName(token)
        if (!writeField) return null
        return [writeField, normalizedValue]
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
    dialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
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
    const changes = allTokens.flatMap((token) =>
      buildTokenUpdateChanges(token, {
        nextValue: values?.[token.key],
        initialValue: dialogInitialValues.value?.[token.key],
        recordId: dialogRecordId.value,
        entityName: dialogEntityName.value,
      }),
    )
    const tableName = String(dialogEntityName.value || '').trim()
      ? getFilePageRegistryEntryByEntityReference(dialogEntityName.value)?.entityName || dialogEntityName.value
      : ''
    if (!tableName || !dialogRecordId.value || !dialogEntityName.value) {
      throw new Error('This record cannot be edited from the shared shell yet.')
    }
    if (changes.length) {
      await bridge.value?.records?.update?.({
        tableName,
        recordId: dialogRecordId.value,
        changes,
        actionLabel: 'shared_dialog_shell_edit',
      })
    }
    if (!changes.length) {
      dialogOpen.value = false
      return
    }
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
