<template>
  <section class="draft-window-shell">
    <header class="draft-window-shell__header">
      <div class="draft-window-shell__top-row">
        <button
          v-if="shellSelectorOptions.length"
          ref="shellSelectorButton"
          type="button"
          class="draft-window-shell__title-button"
          @click.stop="toggleShellSelector"
        >
          <span class="draft-window-shell__title-content">
            <RecordTitle :title="activeShellSelectorOption.label || 'PMP Window'" />
            <svg viewBox="0 0 24 24" class="draft-window-shell__title-chevron">
              <path :d="shellSelectorOpen ? 'M7 14L12 9L17 14' : 'M7 10L12 15L17 10'" />
            </svg>
          </span>
        </button>
        <div
          v-if="shellSelectorOpen"
          ref="shellSelectorMenu"
          class="draft-window-shell__source-menu"
        >
          <button
            v-for="option in shellSelectorOptions"
            :key="option.value"
            type="button"
            class="draft-window-shell__source-item"
            :class="{ 'draft-window-shell__source-item--active': shellSelectorValue === option.value }"
            @click.stop="selectShellSelectorOption(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="draft-window-shell__placeholder-grid">
        <section class="draft-window-shell__placeholder">
          <div class="draft-window-shell__placeholder-title">Header Placeholder</div>
          <div class="draft-window-shell__placeholder-copy">
            Draft space for top-of-window content.
          </div>
        </section>

        <section class="draft-window-shell__placeholder">
          <div class="draft-window-shell__placeholder-title">Summary Placeholder</div>
          <div class="draft-window-shell__placeholder-copy">
            This area will later render from the same explicit contract language.
          </div>
        </section>

        <section class="draft-window-shell__placeholder">
          <div class="draft-window-shell__placeholder-title">Action Placeholder</div>
          <div class="draft-window-shell__placeholder-copy">
            Keeping this intentionally light while we focus on the data section.
          </div>
        </section>
      </div>
    </header>

    <section class="draft-window-shell__data-section">
      <div class="draft-window-shell__data-title-row">
        <DialogShellTitleRow title="Data Section" class="draft-window-shell__data-title" />
        <button
          type="button"
          class="draft-window-shell__section-chevron"
          :aria-label="dataSurfaceCollapsed ? 'Expand data section' : 'Collapse data section'"
          @click="dataSurfaceCollapsed = !dataSurfaceCollapsed"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="draft-window-shell__section-chevron-icon">
            <path :d="dataSurfaceCollapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
          </svg>
        </button>
      </div>

      <div v-if="!dataSurfaceCollapsed" class="draft-window-shell__section-body">
        <div class="draft-window-shell__toolbar-row">
          <FileShellControlBar
            :model-value="dataToolbarView"
            aria-label="Data control bar"
            :items="dataControlContract.items"
            :all-visible-selected="dataControlContract.allVisibleSelected"
            :some-visible-selected="dataControlContract.someVisibleSelected"
            :show-select-all="false"
            :merge-middle-lanes="true"
            :loading="dataControlContract.loading"
            :add-disabled="dataControlContract.addDisabled"
            :search-query="dataControlContract.searchQuery"
            :search-placeholder="dataControlContract.searchPlaceholder"
            :view-mode="dataControlContract.viewMode"
            :show-collapse-toggle="false"
            :collapsed="dataControlContract.collapsed"
            @toggle-select-all="toggleSelectAllVisible"
            @add="handleDataToolbarAdd"
            @update:model-value="dataToolbarView = $event"
            @update:search-query="searchQuery = $event"
            @update:view-mode="viewMode = $event"
          >
            <template #controls-prefix>
              <button
                v-if="dataSurfaceContract.mode === 'tokens' && dataSurfaceContract.selectedTokenKeys.length"
                type="button"
                class="draft-window-shell__delete-btn"
                @click="deleteSelectedTokens"
              >
                Delete Selected
              </button>
            </template>
          </FileShellControlBar>
        </div>

        <div v-if="!dataControlContract.collapsed && dataSurfaceContract.mode !== 'data'" class="draft-window-shell__surface-wrap ds-mini-scrollbar">
          <StructureGovernancePanel
            :mode="dataSurfaceContract.mode"
            :view-rows="dataSurfaceContract.viewRows"
            :token-groups="dataSurfaceContract.tokenGroups"
            :token-columns="dataSurfaceContract.tokenColumns"
            :selected-token-keys="dataSurfaceContract.selectedTokenKeys"
            :empty-views-label="dataSurfaceContract.emptyViewsLabel"
            :empty-tokens-label="dataSurfaceContract.emptyTokensLabel"
            :hide-view-column="true"
            :show-select-all-header="true"
            :select-all-checked="dataSurfaceContract.allVisibleSelected"
            :select-all-indeterminate="dataSurfaceContract.someVisibleSelected"
            @toggle-select-all="toggleSelectAllVisible"
            @toggle-token-select="toggleTokenSelection"
            @update-token-cell="updateTokenCell"
          />
        </div>

        <div v-else-if="!dataControlContract.collapsed" class="draft-window-shell__surface-stack">
          <q-banner v-if="dataSurfaceContract.error" class="bg-red-2 text-black" rounded>
            {{ dataSurfaceContract.error }}
          </q-banner>

          <div v-if="viewMode === 'page'" class="draft-window-shell__surface-wrap ds-mini-scrollbar">
            <StructureGovernancePanel
              :mode="dataSurfaceContract.mode"
              :data-columns="dataSurfaceContract.dataColumns"
              :data-rows="dataSurfaceContract.dataRows"
              :selected-row-keys="dataSurfaceContract.selectedRowKeys"
              :empty-data-label="dataSurfaceContract.emptyDataLabel"
              :hide-view-column="true"
              :show-select-all-header="true"
              :select-all-checked="dataSurfaceContract.allVisibleSelected"
              :select-all-indeterminate="dataSurfaceContract.someVisibleSelected"
              @toggle-select-all="toggleSelectAllVisible"
              @toggle-data-select="toggleLeafSelection"
              @update-data-cell="updateDataCell"
            />
          </div>

          <div v-else class="draft-window-shell__card-grid">
            <article
              v-for="row in dataSurfaceContract.dataRows"
              :key="row.key"
              class="draft-window-shell__card"
            >
              <div class="draft-window-shell__card-title">{{ row[dataSurfaceContract.dataColumns[0]?.key] || row.key }}</div>
              <div
                v-for="column in dataSurfaceContract.dataColumns.slice(1)"
                :key="`${row.key}:${column.key}`"
                class="draft-window-shell__card-line"
              >
                <span class="draft-window-shell__card-label">{{ column.label }}</span>
                <span class="draft-window-shell__card-value">{{ row[column.key] || '-' }}</span>
              </div>
            </article>
            <div v-if="!dataSurfaceContract.dataRows.length" class="draft-window-shell__card-empty">
              {{ dataSurfaceContract.emptyDataLabel }}
            </div>
          </div>

          <SelectionActionBar
            :count="selectedDataRows.length"
            :loading="loading"
            :can-share="selectedDataRows.length > 0"
            :can-edit="false"
            :can-delete="canDeleteSelectedRows"
            @share="handleSelectedRowsShare"
            @remove="handleSelectedRowsDelete"
          />
        </div>
      </div>
    </section>

    <section class="draft-window-shell__data-section">
      <div class="draft-window-shell__data-title-row">
        <DialogShellTitleRow title="Governance Section" class="draft-window-shell__data-title" />
        <button
          type="button"
          class="draft-window-shell__section-chevron"
          :aria-label="governanceSurfaceCollapsed ? 'Expand governance section' : 'Collapse governance section'"
          @click="governanceSurfaceCollapsed = !governanceSurfaceCollapsed"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="draft-window-shell__section-chevron-icon">
            <path :d="governanceSurfaceCollapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
          </svg>
        </button>
      </div>

      <div v-if="!governanceSurfaceCollapsed" class="draft-window-shell__section-body">
        <div class="draft-window-shell__toolbar-row">
          <FileShellControlBar
            :model-value="governanceToolbarView"
            aria-label="Governance draft control bar"
            :items="governanceControlContract.items"
            :all-visible-selected="governanceControlContract.allVisibleSelected"
            :some-visible-selected="governanceControlContract.someVisibleSelected"
            :show-select-all="false"
            :merge-middle-lanes="true"
            :loading="governanceControlContract.loading"
            :add-disabled="governanceControlContract.addDisabled"
            :search-query="governanceControlContract.searchQuery"
            :search-placeholder="governanceControlContract.searchPlaceholder"
            :view-mode="governanceControlContract.viewMode"
            :show-collapse-toggle="false"
            :collapsed="governanceControlContract.collapsed"
            :select-disabled="true"
            :filter-disabled="true"
            @add="handleGovernanceToolbarAdd"
            @update:model-value="governanceToolbarView = $event"
            @update:search-query="governanceSearchQuery = $event"
            @update:view-mode="governanceViewMode = $event"
          />
        </div>

        <div v-if="!governanceControlContract.collapsed" class="draft-window-shell__surface-stack">
          <div v-if="governanceViewMode === 'page'" class="draft-window-shell__surface-wrap ds-mini-scrollbar">
            <StructureGovernancePanel
              :mode="governanceSurfaceContract.mode"
              :view-rows="governanceSurfaceContract.viewRows"
              :token-groups="governanceSurfaceContract.tokenGroups"
              :token-columns="governanceSurfaceContract.tokenColumns"
              :selected-token-keys="governanceSurfaceContract.selectedTokenKeys"
              :empty-views-label="governanceSurfaceContract.emptyViewsLabel"
              :empty-tokens-label="governanceSurfaceContract.emptyTokensLabel"
              :hide-view-column="true"
              :show-select-all-header="true"
              :select-all-checked="governanceSurfaceContract.allVisibleSelected"
              :select-all-indeterminate="governanceSurfaceContract.someVisibleSelected"
              @toggle-select-all="toggleGovernanceSelectAll"
              @toggle-view-select="toggleViewSelection"
              @update-view-cell="updateViewCell"
              @toggle-token-select="toggleTokenSelection"
              @update-token-cell="updateTokenCell"
            />
          </div>
          <div v-else class="draft-window-shell__card-grid">
            <article
              v-for="card in governanceCardRows"
              :key="card.key"
              class="draft-window-shell__card"
            >
              <div class="draft-window-shell__card-title">{{ card.title }}</div>
              <div
                v-for="line in card.lines"
                :key="`${card.key}:${line.label}`"
                class="draft-window-shell__card-line"
              >
                <span class="draft-window-shell__card-label">{{ line.label }}</span>
                <span class="draft-window-shell__card-value">{{ line.value || '-' }}</span>
              </div>
            </article>
            <div v-if="!governanceCardRows.length" class="draft-window-shell__card-empty">
              {{ governanceSurfaceContract.mode === 'views' ? governanceSurfaceContract.emptyViewsLabel : governanceSurfaceContract.emptyTokensLabel }}
            </div>
          </div>

          <SelectionActionBar
            :count="selectedGovernanceRowCount"
            :loading="loading"
            :can-share="false"
            :can-edit="false"
            :can-delete="selectedGovernanceRowCount > 0"
            @remove="handleSelectedGovernanceDelete"
          />
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import FileShellControlBar from 'src/components/FileShellControlBar.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import SelectionActionBar from 'src/components/SelectionActionBar.vue'
import { buildTokenGovernanceColumns } from 'src/utils/structureGovernanceColumns'
import { buildShellToolbarFeed } from 'src/utils/shellToolbarFeeder'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { splitDialogViews } from 'src/utils/dialogShellPayload'
import { shareRecordSelection } from 'src/utils/recordListSelectionActions'
import {
  buildFileShellPayload,
  getCanonicalTokenFieldNames,
  getCanonicalTokenValue,
  getCanonicalTokenWriteTarget,
  getFilePageRegistryEntry,
  getRegistryTitleTokenForSource,
  getRuntimeStructureVersion,
  resolveApprovedFileSectionKey,
  setRuntimeFileStructures,
  subscribeRuntimeFileStructures,
} from 'src/utils/structureRegistry'
import { buildSurfaceColumnFromToken } from 'src/utils/tokenSurfaceContract'
import { getLdbRelationshipContractsForEntity } from 'src/shared/ldbRelationshipContracts'
import { buildFileStructureSessionSnapshot } from 'src/utils/fileStructureSession'
import {
  appendDraftStructureToken,
  appendDraftStructureView,
  cloneFileStructureSections,
  collectStructureTokenKeys,
  deleteStructureTokens,
  renameStructureView,
  updateStructureTokenField,
} from 'src/utils/fileStructureState'

const props = defineProps({
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:shellSelectorValue', 'change'])
const $q = useQuasar()

const SECTION_LOADERS = {
  'file-system': { listFn: (bridgeValue) => bridgeValue?.['file-system']?.list?.(), resultKey: 'files', recordIdField: 'id' },
  events: { listFn: (bridgeValue) => bridgeValue?.events?.list?.(), resultKey: 'events', recordIdField: 'id' },
  users: { listFn: (bridgeValue) => bridgeValue?.users?.list?.(), resultKey: 'users', recordIdField: 'id' },
  markets: { listFn: (bridgeValue) => bridgeValue?.markets?.list?.(), resultKey: 'markets', recordIdField: 'id' },
  securities: { listFn: (bridgeValue) => bridgeValue?.securities?.list?.(), resultKey: 'securities', recordIdField: 'id' },
  artifacts: { listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(), resultKey: 'artifacts', recordIdField: 'artifact_id' },
  contacts: { listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(), resultKey: 'contacts', recordIdField: 'id' },
  companies: { listFn: (bridgeValue) => bridgeValue?.companies?.list?.(), resultKey: 'companies', recordIdField: 'id' },
  opportunities: { listFn: (bridgeValue) => bridgeValue?.opportunities?.list?.(), resultKey: 'opportunities', recordIdField: 'id' },
  funds: { listFn: (bridgeValue) => bridgeValue?.funds?.list?.(), resultKey: 'funds', recordIdField: 'id' },
  rounds: { listFn: (bridgeValue) => bridgeValue?.rounds?.list?.(), resultKey: 'rounds', recordIdField: 'id' },
  projects: { listFn: (bridgeValue) => bridgeValue?.projects?.list?.(), resultKey: 'projects', recordIdField: 'id' },
  notes: { listFn: (bridgeValue) => bridgeValue?.notes?.list?.(), resultKey: 'notes', recordIdField: 'id' },
  tasks: { listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(), resultKey: 'tasks', recordIdField: 'id' },
  'bb-file': { listFn: (bridgeValue) => bridgeValue?.['bb-file']?.list?.(), resultKey: 'buildingBlocks', recordIdField: 'id' },
  'user-roles': { listFn: (bridgeValue) => bridgeValue?.['user-roles']?.list?.(), resultKey: 'roles', recordIdField: 'id' },
  'companion-roles': { listFn: (bridgeValue) => bridgeValue?.['companion-roles']?.list?.() ?? { companionRoles: [] }, resultKey: 'companionRoles', recordIdField: 'id' },
  intake: { listFn: (bridgeValue) => bridgeValue?.intake?.list?.(), resultKey: 'intake', recordIdField: 'id' },
}

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const shellSelectorOpen = ref(false)
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null
const shellSelectorButton = ref(null)
const shellSelectorMenu = ref(null)
const pendingShellSelectorValue = ref('')
const dataToolbarView = ref('')
const governanceToolbarView = ref('tokens')
const dataSurfaceCollapsed = ref(false)
const governanceSurfaceCollapsed = ref(false)
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const governanceSearchQuery = ref('')
const viewMode = ref('page')
const governanceViewMode = ref('page')
const rawRowsBySource = ref({})
const structureStateBySource = ref({})
const sharedLdbLinksByRecordId = ref({})
const selectedLeafKeysBySource = ref({})
const selectedTokenKeysBySource = ref({})
const selectedViewKeysBySource = ref({})
const requiredFieldKeysBySource = ref({})

const optionEntityOptions = computed(() =>
  (Array.isArray(props.shellSelectorOptions) ? props.shellSelectorOptions : [])
    .map((option) => {
      const label = String(option?.label || '').trim()
      return label ? { value: label, label } : null
    })
    .filter(Boolean),
)

const tokenGovernanceColumns = computed(() =>
  buildTokenGovernanceColumns({
    labelCellClass: 'structure-governance-panel__cell--label',
    dataHeaderClass: 'structure-governance-panel__cell--data',
    dataCellClass: 'structure-governance-panel__cell--data',
    optionEntityOptions: optionEntityOptions.value,
  }),
)

const activeShellSelectorOption = computed(() =>
  props.shellSelectorOptions.find((option) => option.value === (pendingShellSelectorValue.value || props.shellSelectorValue))
  || props.shellSelectorOptions[0]
  || { value: '', label: 'Select File' },
)

const activeSettingsSourceKey = computed(() => activeShellSelectorOption.value.value || 'selected-file')
const activeLoader = computed(() => SECTION_LOADERS[activeSettingsSourceKey.value] || null)

const activeFilePayload = computed(() => {
  runtimeStructureVersion.value
  const fileShellPayload = buildFileShellPayload(activeSettingsSourceKey.value)
  const sections = fileShellPayload.sections.map((section) => ({
    ...section,
    tokens: fileShellPayload.tokens
      .filter((token) => token.parentKey === section.key)
      .map((token) => ({ ...token })),
  }))

  return {
    registryEntry: fileShellPayload.registryEntry,
    sections,
    tokens: fileShellPayload.tokens,
  }
})

const activeRegistryEntry = computed(() => activeFilePayload.value.registryEntry || null)
const payloadSections = computed(() => activeFilePayload.value.sections)
const payloadTokens = computed(() => activeFilePayload.value.tokens)
const fileViewGroups = computed(() => payloadSections.value)
const activeStructureSections = computed(() => {
  const sourceKey = activeSettingsSourceKey.value
  return structureStateBySource.value[sourceKey] || cloneFileStructureSections(fileViewGroups.value)
})
const toolbarViewSplit = computed(() => splitDialogViews(activeStructureSections.value))

const controlBarFeed = computed(() =>
  buildShellToolbarFeed({
    sections: activeStructureSections.value,
    governanceItems: [
      { value: 'tokens', title: 'Tokens' },
      { value: 'views', title: 'Views' },
    ],
    relationshipLabels: ['ldb'],
    systemLabels: ['system'],
  }),
)

const dataControlItems = computed(() =>
  [...controlBarFeed.value.leftItems, ...controlBarFeed.value.rightItems].map((item) => ({
    value: item.value,
    title: item.title,
    lane: 'left',
    tone: item.tone || '',
  })),
)

const governanceControlItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: [],
    rightItems: [],
    governanceItems: controlBarFeed.value.governanceItems,
    isRelationshipSectionLabel: controlBarFeed.value.isRelationshipSectionLabel,
  }),
)

const activeViewSection = computed(() => {
  return activeStructureSections.value.find((section) => section.key === dataToolbarView.value) || activeStructureSections.value[0] || null
})
const isLdbDataViewActive = computed(() => String(activeViewSection.value?.label || '').trim().toLowerCase() === 'ldb')

const activeGovernanceToolbarKey = computed(() => (
  governanceToolbarView.value === 'tokens' || governanceToolbarView.value === 'views'
    ? governanceToolbarView.value
    : ''
))

const effectiveStructureTokens = computed(() =>
  activeStructureSections.value.flatMap((section) => (Array.isArray(section?.tokens) ? section.tokens : [])),
)
const titleToken = computed(() =>
  effectiveStructureTokens.value.find((token) => String(token?.tokenRole || '').trim().toLowerCase() === 'title') || null,
)
const hiddenRecordIdFieldKey = computed(() => '__record_id__')

const sharedLdbDataTokens = computed(() => {
  if (!isLdbDataViewActive.value) return []

  const systemFileTitleToken = getRegistryTitleTokenForSource('file-system')
  const seenSourceKeys = new Set()
  const rows = Array.isArray(rawRowsBySource.value['file-system']) ? rawRowsBySource.value['file-system'] : []
  const sourceEntity = String(activeRegistryEntry.value?.entityName || '').trim()
  const allowedTargetEntities = new Set(
    getLdbRelationshipContractsForEntity(sourceEntity)
      .map((contract) => String(contract?.targetEntity || '').trim())
      .filter(Boolean),
  )

  return rows
    .map((row, index) => {
      const sourceKey = resolveApprovedFileSectionKey(
        row?.sourceKey || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
      )
      if (!sourceKey || sourceKey === 'bb-file' || seenSourceKeys.has(sourceKey)) return null

      const targetEntry = getFilePageRegistryEntry(sourceKey)
      const targetEntity = String(targetEntry?.entityName || '').trim()
      if (!targetEntity || (allowedTargetEntities.size && !allowedTargetEntities.has(targetEntity))) return null

      seenSourceKeys.add(sourceKey)
      return {
        key: `__shared_ldb__:${sourceKey}`,
        tokenName: `__shared_ldb__:${sourceKey}`,
        label:
          stringifyValue(systemFileTitleToken ? getCanonicalTokenValue(row, systemFileTitleToken) : null)
          || targetEntry.label
          || `File ${index + 1}`,
        tokenType: 'select_multi',
        parentKey: activeViewSection.value?.key || '',
        parentLabel: activeViewSection.value?.label || 'LDB',
        isSharedLdbToken: true,
        targetSourceKey: sourceKey,
        targetEntity,
        optionSource: 'shared_file_universe',
        optionEntity: targetEntity,
      }
    })
    .filter(Boolean)
})

const orderedViewTokens = computed(() => {
  const titleTokenKey = String(titleToken.value?.key || '').trim()
  return [...(Array.isArray(activeViewSection.value?.tokens) ? activeViewSection.value.tokens : [])].sort((left, right) => {
    if (left.key === titleTokenKey) return -1
    if (right.key === titleTokenKey) return 1
    return String(left.label || left.key || '').localeCompare(String(right.label || right.key || ''))
  })
})

const effectiveDataTokens = computed(() => {
  const orderedTokens = isLdbDataViewActive.value ? sharedLdbDataTokens.value : orderedViewTokens.value
  const tokensByKey = new Map()

  if (titleToken.value?.key) {
    tokensByKey.set(String(titleToken.value.key).trim(), titleToken.value)
  }

  orderedTokens.forEach((token) => {
    const key = String(token?.key || '').trim()
    if (!key || tokensByKey.has(key)) return
    tokensByKey.set(key, token)
  })

  return Array.from(tokensByKey.values())
})

const recordDataColumns = computed(() =>
  effectiveDataTokens.value.map((token) =>
    buildSurfaceColumnFromToken(token, {
      width: token.key === titleToken.value?.key ? 220 : 170,
      editable: canInlineEditDataToken(token),
      headerClass: 'structure-governance-panel__cell--data',
      cellClass: token.key === titleToken.value?.key
        ? 'structure-governance-panel__cell--label'
        : 'structure-governance-panel__cell--data',
      resolveDynamicOptions: (currentToken) => {
        if (isFileArchiveStatusToken(currentToken)) {
          return [
            { value: 'Active', label: 'Active' },
            { value: 'Archived', label: 'Archived' },
          ]
        }
        return []
      },
    }),
  ),
)

const governanceViewRows = computed(() =>
  [...toolbarViewSplit.value.leftSections, ...toolbarViewSplit.value.rightSections].map((section) => ({
    key: section.key,
    label: section.label,
    side: toolbarViewSplit.value.rightSections.some((entry) => entry.key === section.key) ? 'Right' : 'Left',
    tokenCount: Array.isArray(section.tokens) ? section.tokens.length : 0,
    editableColumns: ['label'],
    toneClassByColumn: {
      label: 'shared-row-surface__tone--editable',
    },
    cellContractByColumn: {
      label: {
        editable: true,
        reason: 'View labels are descriptive structure fields.',
        writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].label`,
      },
    },
  })),
)
const filteredGovernanceViewRows = computed(() => {
  const searchValue = String(governanceSearchQuery.value || '').trim().toLowerCase()
  if (!searchValue) return governanceViewRows.value
  return governanceViewRows.value.filter((row) =>
    [row.label, row.side, String(row.tokenCount || '')]
      .join(' ')
      .toLowerCase()
      .includes(searchValue),
  )
})

const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => {
    const section = activeStructureSections.value.find((entry) => entry.key === view.key)
    const baseTokens = Array.isArray(section?.tokens) ? section.tokens : []
    const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])

    return {
      key: view.key,
      label: view.label,
      tokens: baseTokens.map((token, index) => {
        return {
          ...token,
          key: token.key || `token-${index}`,
          label: token.label || '-',
          tokenType: token.tokenType || '-',
          optionSource: token.optionSource || '-',
          optionEntity: token.optionEntity || '-',
          optionList: token.optionList || '-',
          definition: token.definition || '-',
          dbWriteField: token.dbWriteField || token.dbFieldAliases?.[0] || '-',
          fieldClass: token.fieldClass || token.field_class || '-',
          required: requiredKeys.has(token.key),
          visible: 'Yes',
          editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '-',
          editableColumns: [
            'label',
            'tokenType',
            'optionSource',
            'optionEntity',
            'optionList',
            'definition',
            'dbWriteField',
            'fieldClass',
          ],
          toneClassByColumn: {
            label: 'shared-row-surface__tone--editable',
            tokenType: 'shared-row-surface__tone--editable',
            optionSource: 'shared-row-surface__tone--editable',
            optionEntity: 'shared-row-surface__tone--editable',
            optionList: 'shared-row-surface__tone--editable',
            definition: 'shared-row-surface__tone--editable',
            dbWriteField: 'shared-row-surface__tone--editable',
            fieldClass: 'shared-row-surface__tone--editable',
          },
          cellContractByColumn: {
            label: {
              editable: true,
              reason: 'Token labels are descriptive file governance fields.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].label`,
            },
            tokenType: {
              editable: true,
              reason: 'Token type is governed through file structure.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].tokenType`,
            },
            optionSource: {
              editable: true,
              reason: 'Option source is governed through file structure.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].optionSource`,
            },
            optionEntity: {
              editable: true,
              reason: 'Option entity is governed through file structure.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].optionEntity`,
            },
            optionList: {
              editable: true,
              reason: 'Option list is governed through file structure.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].optionList`,
            },
            definition: {
              editable: true,
              reason: 'Definitions live with the file token governance.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].definition`,
            },
            dbWriteField: {
              editable: true,
              reason: 'Write field is part of the governed token write contract.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].dbWriteField`,
            },
            fieldClass: {
              editable: true,
              reason: 'Field class is part of the governed token write contract.',
              writePath: `Defined_Structure.sections[${String(section?.key || '').trim()}].tokens[${String(token?.key || '').trim()}].fieldClass`,
            },
          },
        }
      }),
    }
  }),
)
const filteredTokenGroupsByView = computed(() => {
  const searchValue = String(governanceSearchQuery.value || '').trim().toLowerCase()
  if (!searchValue) return tokenGroupsByView.value
  return tokenGroupsByView.value
    .map((group) => ({
      ...group,
      tokens: (Array.isArray(group.tokens) ? group.tokens : []).filter((token) =>
        [
          token.label,
          token.tokenType,
          token.definition,
          token.optionSource,
          token.optionEntity,
          token.fieldClass,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchValue),
      ),
    }))
    .filter((group) => group.tokens.length)
})

const selectedLeafKeys = computed(() => selectedLeafKeysBySource.value[activeSettingsSourceKey.value] || [])
const selectedTokenKeys = computed(() => selectedTokenKeysBySource.value[activeSettingsSourceKey.value] || [])
const selectedViewKeys = computed(() => selectedViewKeysBySource.value[activeSettingsSourceKey.value] || [])
const activeRequiredFieldKeys = computed(() => requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
const visibleGovernanceRowKeys = computed(() => (
  activeGovernanceToolbarKey.value === 'views'
    ? governanceViewRows.value.map((row) => row.key)
    : tokenGroupsByView.value.flatMap((group) => (Array.isArray(group.tokens) ? group.tokens.map((token) => token.key) : []))
))
const governanceAllVisibleSelected = computed(() => {
  const keys = visibleGovernanceRowKeys.value
  if (!keys.length) return false
  const selected = activeGovernanceToolbarKey.value === 'views' ? selectedViewKeys.value : selectedTokenKeys.value
  return keys.every((key) => selected.includes(key))
})
const governanceSomeVisibleSelected = computed(() => {
  const keys = visibleGovernanceRowKeys.value
  if (!keys.length) return false
  const selected = activeGovernanceToolbarKey.value === 'views' ? selectedViewKeys.value : selectedTokenKeys.value
  return keys.some((key) => selected.includes(key)) && !governanceAllVisibleSelected.value
})

const displayRows = computed(() => {
  const searchValue = String(searchQuery.value || '').trim().toLowerCase()
  const rows = rawRowsBySource.value[activeSettingsSourceKey.value] || []
  return rows
    .map((row, index) => {
      const recordId = getRecordIdValue(row, activeSettingsSourceKey.value) || `draft-row-${index + 1}`
      const mappedRow = {
        key: recordId,
        [hiddenRecordIdFieldKey.value]: recordId,
      }
      const searchValues = [recordId.toLowerCase()]
      const editableColumns = []
      const toneClassByColumn = {}

      effectiveDataTokens.value.forEach((token) => {
        const value = token?.isSharedLdbToken
          ? getSharedLdbTokenValue(row, token)
          : stringifyValue(getCanonicalTokenValue(row, token))
        mappedRow[token.key] = value
        if (value) searchValues.push(value.toLowerCase())
        if (canInlineEditDataToken(token)) editableColumns.push(token.key)
        const toneClass = getDataCellToneClass(token)
        if (toneClass) toneClassByColumn[token.key] = toneClass
      })

      mappedRow.__searchText = searchValues.join(' ')
      mappedRow.editableColumns = editableColumns
      mappedRow.toneClassByColumn = toneClassByColumn
      return mappedRow
    })
    .filter((row) => !searchValue || row.__searchText.includes(searchValue))
})

const allVisibleSelected = computed(() =>
  displayRows.value.length > 0 && displayRows.value.every((row) => selectedLeafKeys.value.includes(row.key)),
)

const selectedDataRows = computed(() =>
  displayRows.value.filter((row) => selectedLeafKeys.value.includes(row.key)),
)

const someVisibleSelected = computed(() =>
  displayRows.value.some((row) => selectedLeafKeys.value.includes(row.key)) && !allVisibleSelected.value,
)

const canDeleteSelectedRows = computed(() =>
  selectedDataRows.value.length > 0 && typeof bridge.value?.[activeSettingsSourceKey.value]?.delete === 'function',
)

const dataControlContract = computed(() => ({
  activeViewKey: dataToolbarView.value,
  items: dataControlItems.value,
  allVisibleSelected: allVisibleSelected.value,
  someVisibleSelected: someVisibleSelected.value,
  loading: loading.value,
  addDisabled: false,
  searchQuery: searchQuery.value,
  searchPlaceholder: `Search ${activeRegistryEntry.value?.label || 'Records'}`,
  viewMode: viewMode.value,
  collapsed: dataSurfaceCollapsed.value,
}))

const dataSurfaceContract = computed(() => ({
  contextKind: 'file',
  sourceKey: activeSettingsSourceKey.value,
  surfaceKey: activeViewSection.value?.key || '',
  mode: 'data',
  dataColumns: recordDataColumns.value,
  dataRows: displayRows.value,
  selectedRowKeys: selectedLeafKeys.value,
  allVisibleSelected: allVisibleSelected.value,
  someVisibleSelected: someVisibleSelected.value,
  emptyDataLabel: `No rows available for ${activeRegistryEntry.value?.label || 'this section'}.`,
  error: error.value,
}))

const governanceControlContract = computed(() => ({
  activeViewKey: governanceToolbarView.value,
  items: governanceControlItems.value,
  allVisibleSelected: governanceAllVisibleSelected.value,
  someVisibleSelected: governanceSomeVisibleSelected.value,
  loading: false,
  addDisabled: false,
  searchQuery: governanceSearchQuery.value,
  searchPlaceholder: 'Search governance',
  viewMode: governanceViewMode.value,
  collapsed: governanceSurfaceCollapsed.value,
}))

const governanceSurfaceContract = computed(() => ({
  contextKind: 'file',
  sourceKey: activeSettingsSourceKey.value,
  surfaceKey: activeGovernanceToolbarKey.value || '',
  mode: activeGovernanceToolbarKey.value || 'tokens',
  viewRows: filteredGovernanceViewRows.value,
  tokenGroups: filteredTokenGroupsByView.value,
  tokenColumns: tokenGovernanceColumns.value,
  selectedTokenKeys: selectedTokenKeys.value,
  selectedViewKeys: selectedViewKeys.value,
  allVisibleSelected: governanceAllVisibleSelected.value,
  someVisibleSelected: governanceSomeVisibleSelected.value,
  emptyViewsLabel: 'No views declared for this file.',
  emptyTokensLabel: 'No tokens declared in this view.',
}))

const selectedGovernanceRowCount = computed(() => (
  activeGovernanceToolbarKey.value === 'views'
    ? selectedViewKeys.value.length
    : selectedTokenKeys.value.length
))

const governanceCardRows = computed(() => {
  if (governanceSurfaceContract.value.mode === 'views') {
    return governanceSurfaceContract.value.viewRows.map((row) => ({
      key: row.key,
      title: row.label,
      lines: [
        { label: 'Side', value: row.side },
        { label: 'Tokens', value: String(row.tokenCount ?? '-') },
      ],
    }))
  }

  return governanceSurfaceContract.value.tokenGroups.flatMap((group) =>
    (Array.isArray(group.tokens) ? group.tokens : []).map((token) => ({
      key: token.key,
      title: token.label,
      lines: [
        { label: 'View', value: group.label },
        { label: 'Type', value: token.tokenType },
        { label: 'Definition', value: token.definition },
      ],
    })),
  )
})

const fileStructureSnapshot = computed(() =>
  buildFileStructureSessionSnapshot({
    sourceKey: activeSettingsSourceKey.value,
    sourceLabel: activeShellSelectorOption.value.label,
    toolbarValue: dataToolbarView.value,
    sectionKey: activeViewSection.value?.key || '',
    viewRows: governanceViewRows.value,
    leafRows: displayRows.value,
    selectedLeafKeys: selectedLeafKeys.value,
    requiredFieldKeys: activeRequiredFieldKeys.value,
    deletedTokenKeys: payloadTokens.value
      .map((token) => String(token?.key || '').trim())
      .filter((key) => key && !collectStructureTokenKeys(activeStructureSections.value).includes(key)),
  }),
)

function selectShellSelectorOption(value) {
  pendingShellSelectorValue.value = String(value || '').trim()
  emit('update:shellSelectorValue', value)
  shellSelectorOpen.value = false
}

function toggleShellSelector() {
  shellSelectorOpen.value = !shellSelectorOpen.value
}

function toggleLeafSelection(rowKey) {
  const sourceKey = activeSettingsSourceKey.value
  const current = selectedLeafKeys.value
  selectedLeafKeysBySource.value = {
    ...selectedLeafKeysBySource.value,
    [sourceKey]: current.includes(rowKey)
      ? current.filter((key) => key !== rowKey)
      : [...current, rowKey],
  }
}

function toggleSelectAllVisible(nextValue) {
  const sourceKey = activeSettingsSourceKey.value
  const rowKeys = displayRows.value.map((row) => row.key)
  selectedLeafKeysBySource.value = {
    ...selectedLeafKeysBySource.value,
    [sourceKey]: nextValue ? rowKeys : [],
  }
}

async function handleSelectedRowsShare() {
  await shareRecordSelection({
    rows: selectedDataRows.value,
    entityLabel: activeRegistryEntry.value?.label || 'Records',
    singularLabel: activeRegistryEntry.value?.singularLabel || 'record',
    pluralLabel: activeRegistryEntry.value?.label || 'records',
    getLabel: (row) => row?.[titleToken.value?.key] || row?.key || '',
    notify: (payload) => $q.notify(payload),
  })
}

async function handleSelectedRowsDelete() {
  if (!canDeleteSelectedRows.value) return

  const deleteFn = bridge.value?.[activeSettingsSourceKey.value]?.delete
  if (typeof deleteFn !== 'function') return

  const selectedCount = selectedDataRows.value.length
  const entityLabel = String(activeRegistryEntry.value?.label || 'records').trim()

  $q.dialog({
    title: 'Delete Selected',
    message: `This will permanently delete ${selectedCount} selected ${entityLabel.toLowerCase()}.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      unelevated: true,
      noCaps: true,
    },
  }).onOk(async () => {
    loading.value = true
    error.value = ''

    try {
      for (const row of selectedDataRows.value) {
        await deleteFn(row.key)
      }

      selectedLeafKeysBySource.value = {
        ...selectedLeafKeysBySource.value,
        [activeSettingsSourceKey.value]: [],
      }

      const refreshedRows = await loadRowsForSource(activeSettingsSourceKey.value)
      if (activeSettingsSourceKey.value === 'file-system') {
        setRuntimeFileStructures(refreshedRows)
      }

      $q.notify({
        type: 'positive',
        message: `Deleted ${selectedCount} selected ${entityLabel.toLowerCase()}.`,
      })
    } catch (deleteError) {
      error.value = deleteError?.message || `Could not delete ${entityLabel.toLowerCase()}.`
      $q.notify({
        type: 'negative',
        message: error.value,
      })
    } finally {
      loading.value = false
    }
  })
}

async function handleSelectedGovernanceDelete() {
  if (activeGovernanceToolbarKey.value !== 'tokens') return
  if (!selectedTokenKeys.value.length) return
  await deleteSelectedTokens()
}

function getDefaultRequiredFieldKeysForSource(sourceKey) {
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const normalizedKey = String(titleToken?.key || '').trim()
  return normalizedKey ? [normalizedKey] : []
}

function buildSharedLdbLookupKey(recordId, targetEntity) {
  return `${String(recordId || '').trim()}::${String(targetEntity || '').trim()}`
}

function getRecordIdValue(row = {}, sourceKey = '') {
  const recordIdField = String(SECTION_LOADERS[sourceKey]?.recordIdField || 'id').trim() || 'id'
  return String(row?.[recordIdField] || '').trim()
}

function getSharedLdbTokenValue(row = {}, token = {}) {
  const recordId = getRecordIdValue(row, activeSettingsSourceKey.value)
  const targetEntity = String(token?.targetEntity || '').trim()
  const targetSourceKey = String(token?.targetSourceKey || '').trim()
  if (!recordId || !targetEntity || !targetSourceKey) return ''

  const lookupKey = buildSharedLdbLookupKey(recordId, targetEntity)
  const targetIds = Array.isArray(sharedLdbLinksByRecordId.value[lookupKey])
    ? sharedLdbLinksByRecordId.value[lookupKey]
    : []
  if (!targetIds.length) return ''

  const targetRows = Array.isArray(rawRowsBySource.value[targetSourceKey]) ? rawRowsBySource.value[targetSourceKey] : []
  const targetTitleToken = getRegistryTitleTokenForSource(targetSourceKey)

  return targetIds
    .map((targetId) => {
      const matchedRow = targetRows.find((candidate) => getRecordIdValue(candidate, targetSourceKey) === targetId) || null
      return stringifyValue(targetTitleToken && matchedRow ? getCanonicalTokenValue(matchedRow, targetTitleToken) : targetId)
    })
    .filter(Boolean)
    .join(', ')
}

function isSystemManagedReadOnlyToken(token = {}) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()

  if (token?.isSharedLdbToken) return false
  if (['id', 'datetime', 'date', 'creator'].includes(tokenType)) return true
  if (tokenName.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenName.includes('user_role') || tokenName.includes('role_link')) return true
  return false
}

function canInlineEditDataToken(token = {}) {
  if (!token?.key || token?.isSharedLdbToken) return false
  if (isSystemManagedReadOnlyToken(token)) return false
  return Boolean(
    getCanonicalTokenWriteTarget(
      token,
      String(activeRegistryEntry.value?.entityName || '').trim(),
      activeLoader.value?.recordIdField || 'id',
    )?.fieldName,
  )
}

function isFileArchiveStatusToken(token = {}) {
  if (activeSettingsSourceKey.value !== 'file-system') return false
  const tokenRole = String(token?.tokenRole || '').trim().toLowerCase()
  if (tokenRole === 'status') return true
  const writeTarget = getCanonicalTokenWriteTarget(
    token,
    String(activeRegistryEntry.value?.entityName || '').trim(),
    activeLoader.value?.recordIdField || 'id',
  )
  return String(writeTarget?.fieldName || '').trim() === 'File_Status'
}

function getDataCellToneClass(token = {}) {
  if (token?.isSharedLdbToken) return 'shared-row-surface__tone--linked'
  if (canInlineEditDataToken(token)) return 'shared-row-surface__tone--editable'
  return ''
}

function getFileDefinitionRowForSource(sourceKey = '', rows = []) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  return (Array.isArray(rows) ? rows : []).find((row) =>
    String(row?.sourceKey || '').trim().toLowerCase() === normalizedSourceKey,
  ) || null
}

function serializeStructureToken(token = {}) {
  const nextToken = { ...token }
  ;[
    'parentKey',
    'parentLabel',
    'editable',
    'isDraft',
    'isSharedLdbToken',
    'targetSourceKey',
    'targetEntity',
  ].forEach((key) => delete nextToken[key])
  return nextToken
}

function serializeStructureSection(section = {}) {
  const nextSection = { ...section }
  delete nextSection.editable
  delete nextSection.isDraft
  nextSection.tokens = (Array.isArray(section?.tokens) ? section.tokens : []).map((token) => serializeStructureToken(token))
  return nextSection
}

function stringifyDefinedStructure(sections = [], currentRow = null) {
  let version = 1
  try {
    const parsed = JSON.parse(String(currentRow?.Defined_Structure || '').trim() || '{}')
    version = Number(parsed?.version) || 1
  } catch {
    version = 1
  }

  return JSON.stringify({
    version,
    sections: (Array.isArray(sections) ? sections : []).map((section) => serializeStructureSection(section)),
  })
}

async function persistStructureSections(nextSections = [], actionLabel = 'draft_window_update_defined_structure') {
  const sourceKey = String(activeSettingsSourceKey.value || '').trim().toLowerCase()
  const bridgeValue = bridge.value
  if (!sourceKey || !bridgeValue?.records?.update) return false

  const fileSystemRows = rawRowsBySource.value['file-system'] || await loadRowsForSource('file-system')
  const fileDefinitionRow = getFileDefinitionRowForSource(sourceKey, fileSystemRows)
  const recordId = String(fileDefinitionRow?.id || '').trim()
  if (!recordId) {
    error.value = `Could not find the System Files row for ${activeShellSelectorOption.value.label || sourceKey}.`
    return false
  }

  const definedStructure = stringifyDefinedStructure(nextSections, fileDefinitionRow)

  try {
    await bridgeValue.records.update({
      tableName: 'Files',
      recordId,
      changes: [
        {
          table_name: 'Files',
          record_id: recordId,
          field_name: 'Defined_Structure',
          id_column: 'id',
          new_value: definedStructure,
        },
      ],
      actionLabel,
    })

    const refreshedRows = await loadRowsForSource('file-system')
    setRuntimeFileStructures(refreshedRows)
    const refreshedPayload = buildFileShellPayload(sourceKey)
    const refreshedSections = (Array.isArray(refreshedPayload?.sections) ? refreshedPayload.sections : []).map((section) => ({
      ...section,
      tokens: (Array.isArray(refreshedPayload?.tokens) ? refreshedPayload.tokens : [])
        .filter((token) => token.parentKey === section.key)
        .map((token) => ({ ...token })),
    }))
    structureStateBySource.value = {
      ...structureStateBySource.value,
      [sourceKey]: cloneFileStructureSections(refreshedSections),
    }
    return true
  } catch (persistError) {
    error.value = persistError?.message || 'Could not save file structure changes.'
    return false
  }
}

async function updateTokenCell(tokenKey, field, value) {
  if (field === 'required') {
    toggleRequiredField(tokenKey, Boolean(value))
    return
  }
  const nextSections = updateStructureTokenField(activeStructureSections.value, tokenKey, field, value)
  await persistStructureSections(nextSections, 'draft_window_update_structure_token')
}

async function updateDataCell(rowKey, columnKey, value) {
  const sourceKey = activeSettingsSourceKey.value
  const normalizedRowKey = String(rowKey || '').trim()
  const normalizedColumnKey = String(columnKey || '').trim()
  if (!sourceKey || !normalizedRowKey || !normalizedColumnKey) return

  const token = effectiveDataTokens.value.find((entry) => String(entry?.key || '').trim() === normalizedColumnKey) || null
  if (!token || !canInlineEditDataToken(token)) return
  const writeTarget = getCanonicalTokenWriteTarget(
    token,
    String(activeRegistryEntry.value?.entityName || '').trim(),
    activeLoader.value?.recordIdField || 'id',
  )
  if (!writeTarget?.tableName || !writeTarget?.fieldName) return

  const nextValue = isFileArchiveStatusToken(token)
    ? (String(value || '').trim() === 'Active' ? 'Active' : 'Archived')
    : String(value ?? '').trim()

  try {
    await bridge.value?.records?.update?.({
      tableName: writeTarget.tableName,
      recordId: normalizedRowKey,
      changes: [
        {
          table_name: writeTarget.tableName,
          record_id: normalizedRowKey,
          field_name: writeTarget.fieldName,
          id_column: writeTarget.idColumn || activeLoader.value?.recordIdField || 'id',
          new_value: nextValue,
        },
      ],
      actionLabel: 'draft_window_update_data_cell',
    })

    const refreshedRows = await loadRowsForSource(sourceKey)
    if (sourceKey === 'file-system') {
      setRuntimeFileStructures(refreshedRows)
    }
  } catch (updateError) {
    error.value = updateError?.message || 'Could not save the selected field.'
  }
}

async function updateViewCell(viewKey, field, value) {
  if (String(field || '').trim() !== 'label') return
  const nextSections = renameStructureView(activeStructureSections.value, viewKey, value)
  await persistStructureSections(nextSections, 'draft_window_update_structure_view')
}

function toggleRequiredField(tokenKey, value) {
  const sourceKey = activeSettingsSourceKey.value
  const current = new Set(requiredFieldKeysBySource.value[sourceKey] || [])
  if (value) current.add(tokenKey)
  else current.delete(tokenKey)
  requiredFieldKeysBySource.value = {
    ...requiredFieldKeysBySource.value,
    [sourceKey]: Array.from(current),
  }
}

function toggleTokenSelection(tokenKey, value) {
  const sourceKey = activeSettingsSourceKey.value
  const current = new Set(selectedTokenKeysBySource.value[sourceKey] || [])
  if (value) current.add(tokenKey)
  else current.delete(tokenKey)
  selectedTokenKeysBySource.value = {
    ...selectedTokenKeysBySource.value,
    [sourceKey]: Array.from(current),
  }
}

function toggleViewSelection(viewKey, value) {
  const sourceKey = activeSettingsSourceKey.value
  const current = new Set(selectedViewKeysBySource.value[sourceKey] || [])
  if (value) current.add(viewKey)
  else current.delete(viewKey)
  selectedViewKeysBySource.value = {
    ...selectedViewKeysBySource.value,
    [sourceKey]: Array.from(current),
  }
}

function toggleGovernanceSelectAll(nextValue) {
  const sourceKey = activeSettingsSourceKey.value
  const keys = visibleGovernanceRowKeys.value
  if (activeGovernanceToolbarKey.value === 'views') {
    selectedViewKeysBySource.value = {
      ...selectedViewKeysBySource.value,
      [sourceKey]: nextValue ? keys : [],
    }
    return
  }
  selectedTokenKeysBySource.value = {
    ...selectedTokenKeysBySource.value,
    [sourceKey]: nextValue ? keys : [],
  }
}

async function deleteSelectedTokens() {
  const sourceKey = activeSettingsSourceKey.value
  const selected = selectedTokenKeysBySource.value[sourceKey] || []
  if (!selected.length) return

  const nextSections = deleteStructureTokens(activeStructureSections.value, selected)
  const didPersist = await persistStructureSections(nextSections, 'draft_window_delete_structure_tokens')
  if (!didPersist) return

  const required = new Set(requiredFieldKeysBySource.value[sourceKey] || [])
  selected.forEach((key) => required.delete(key))
  requiredFieldKeysBySource.value = {
    ...requiredFieldKeysBySource.value,
    [sourceKey]: Array.from(required),
  }

  selectedTokenKeysBySource.value = {
    ...selectedTokenKeysBySource.value,
    [sourceKey]: [],
  }
}

function handleDataToolbarAdd() {
  handleDataAdd()
}

function handleGovernanceToolbarAdd() {
  handleGovernanceAdd()
}

async function handleGovernanceAdd() {
  if (governanceToolbarView.value === 'views') {
    await persistStructureSections(
      appendDraftStructureView(activeStructureSections.value),
      'draft_window_append_structure_view',
    )
    return
  }
  await persistStructureSections(
    appendDraftStructureToken(activeStructureSections.value, activeViewSection.value?.key),
    'draft_window_append_structure_token',
  )
}

function handleDataAdd() {
  const sourceKey = activeSettingsSourceKey.value
  const loader = activeLoader.value
  const recordIdField = String(loader?.recordIdField || 'id').trim() || 'id'
  const nextRow = {
    [recordIdField]: `draft-row-${Date.now()}`,
  }

  effectiveDataTokens.value.forEach((token) => {
    if (token?.isSharedLdbToken) return
    getCanonicalTokenFieldNames(token).forEach((fieldName) => {
      if (!fieldName) return
      if (nextRow[fieldName] != null) return
      nextRow[fieldName] = ''
    })
  })

  rawRowsBySource.value = {
    ...rawRowsBySource.value,
    [sourceKey]: [...(rawRowsBySource.value[sourceKey] || []), nextRow],
  }
}

function stringifyValue(value) {
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ')
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('label' in value) return stringifyValue(value.label)
    if ('value' in value) return stringifyValue(value.value)
    return ''
  }
  return String(value).trim()
}

async function loadRows() {
  const sourceKey = activeSettingsSourceKey.value
  const loader = activeLoader.value
  const bridgeValue = bridge.value

  error.value = ''
  if (!sourceKey) return

  if (!loader || !bridgeValue) {
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [sourceKey]: [],
    }
    return
  }

  loading.value = true
  try {
    const result = await loader.listFn(bridgeValue)
    const rows = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [sourceKey]: rows,
    }
  } catch (loadError) {
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [sourceKey]: [],
    }
    error.value = loadError?.message || `Could not load ${String(activeRegistryEntry.value?.label || 'records').toLowerCase()}.`
  } finally {
    loading.value = false
  }
}

async function loadRowsForSource(sourceKey = '') {
  const normalizedSourceKey = String(sourceKey || '').trim()
  const loader = SECTION_LOADERS[normalizedSourceKey] || null
  const bridgeValue = bridge.value

  if (!normalizedSourceKey) return []

  if (!loader || !bridgeValue) {
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [normalizedSourceKey]: [],
    }
    return []
  }

  try {
    const result = await loader.listFn(bridgeValue)
    const rows = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [normalizedSourceKey]: rows,
    }
    return rows
  } catch {
    rawRowsBySource.value = {
      ...rawRowsBySource.value,
      [normalizedSourceKey]: [],
    }
    return []
  }
}

function handleGlobalPointerDown(event) {
  const target = event?.target
  if (!target) return
  const clickedButton = shellSelectorButton.value?.contains?.(target)
  const clickedMenu = shellSelectorMenu.value?.contains?.(target)
  if (clickedButton || clickedMenu) return
  shellSelectorOpen.value = false
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('pointerdown', handleGlobalPointerDown)
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
    window.removeEventListener('pointerdown', handleGlobalPointerDown)
  }
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
})

watch(
  dataControlItems,
  (items) => {
    if (items.some((item) => item.value === dataToolbarView.value)) return
    dataToolbarView.value = items[0]?.value || ''
  },
  { immediate: true },
)

watch(
  governanceControlItems,
  (items) => {
    if (items.some((item) => item.value === governanceToolbarView.value)) return
    governanceToolbarView.value = items[0]?.value || 'tokens'
  },
  { immediate: true },
)

watch(
  () => props.shellSelectorValue,
  (value) => {
    pendingShellSelectorValue.value = String(value || '').trim()
  },
  { immediate: true },
)

watch(
  activeSettingsSourceKey,
  async (sourceKey) => {
    searchQuery.value = ''
    selectedLeafKeysBySource.value = {
      ...selectedLeafKeysBySource.value,
      [sourceKey]: [],
    }
    await loadRows()
  },
  { immediate: true },
)

watch(
  [activeSettingsSourceKey, activeStructureSections],
  ([sourceKey, sections]) => {
    const allowedRequiredKeys = new Set(collectStructureTokenKeys(sections))
    const existingRequired = Array.isArray(requiredFieldKeysBySource.value[sourceKey])
      ? requiredFieldKeysBySource.value[sourceKey].filter((itemKey) => allowedRequiredKeys.has(itemKey))
      : []

    requiredFieldKeysBySource.value = {
      ...requiredFieldKeysBySource.value,
      [sourceKey]: existingRequired.length ? existingRequired : getDefaultRequiredFieldKeysForSource(sourceKey),
    }
  },
  { immediate: true },
)

watch(
  [activeSettingsSourceKey, payloadSections],
  ([sourceKey, sections]) => {
    if (structureStateBySource.value[sourceKey]) return
    structureStateBySource.value = {
      ...structureStateBySource.value,
      [sourceKey]: cloneFileStructureSections(sections),
    }
  },
  { immediate: true },
)

watch(
  isLdbDataViewActive,
  async (isActive) => {
    if (!isActive) {
      sharedLdbLinksByRecordId.value = {}
      return
    }
    if (!rawRowsBySource.value['file-system']) {
      await loadRowsForSource('file-system')
    }
  },
  { immediate: true },
)

watch(
  sharedLdbDataTokens,
  async (tokens) => {
    const sourceKeys = (Array.isArray(tokens) ? tokens : [])
      .map((token) => String(token?.targetSourceKey || '').trim())
      .filter(Boolean)

    await Promise.all(
      sourceKeys.map((sourceKey) => (
        rawRowsBySource.value[sourceKey] ? Promise.resolve(rawRowsBySource.value[sourceKey]) : loadRowsForSource(sourceKey)
      )),
    )
  },
  { immediate: true },
)

watch(
  [() => rawRowsBySource.value[activeSettingsSourceKey.value], sharedLdbDataTokens, activeRegistryEntry, bridge],
  async ([rows, tokens]) => {
    if (!isLdbDataViewActive.value) {
      sharedLdbLinksByRecordId.value = {}
      return
    }

    const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
    if (!entityName || !bridge.value?.db?.query) {
      sharedLdbLinksByRecordId.value = {}
      return
    }

    const recordIds = (Array.isArray(rows) ? rows : [])
      .map((row) => getRecordIdValue(row, activeSettingsSourceKey.value))
      .filter(Boolean)
    const targetEntities = (Array.isArray(tokens) ? tokens : [])
      .map((token) => String(token?.targetEntity || '').trim())
      .filter(Boolean)

    if (!recordIds.length || !targetEntities.length) {
      sharedLdbLinksByRecordId.value = {}
      return
    }

    const recordPlaceholders = recordIds.map(() => '?').join(', ')
    const targetPlaceholders = targetEntities.map(() => '?').join(', ')
    const rowsResult = await bridge.value.db.query(
      `
        SELECT source_record_id AS source_id, target_entity, target_record_id AS target_id
        FROM LDB_Relationships
        WHERE source_entity = ?
          AND source_record_id IN (${recordPlaceholders})
          AND target_entity IN (${targetPlaceholders})
      `,
      [entityName, ...recordIds, ...targetEntities],
    )

    const nextMap = {}
    ;(Array.isArray(rowsResult) ? rowsResult : []).forEach((row) => {
      const sourceId = String(row?.source_id || '').trim()
      const targetEntity = String(row?.target_entity || '').trim()
      const targetId = String(row?.target_id || '').trim()
      if (!sourceId || !targetEntity || !targetId) return

      const key = buildSharedLdbLookupKey(sourceId, targetEntity)
      if (!nextMap[key]) nextMap[key] = []
      nextMap[key].push(targetId)
    })

    Object.keys(nextMap).forEach((key) => {
      nextMap[key] = Array.from(new Set(nextMap[key]))
    })

    sharedLdbLinksByRecordId.value = nextMap
  },
  { immediate: true },
)

watch(
  fileStructureSnapshot,
  (snapshot) => {
    emit('change', snapshot)
  },
  { immediate: true },
)
</script>

<style scoped>
.draft-window-shell {
  display: grid;
  gap: 16px;
  width: 100%;
}

.draft-window-shell__header,
.draft-window-shell__data-section {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.96));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
}

.draft-window-shell__header {
  padding: 22px 22px 18px;
}

.draft-window-shell__top-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.draft-window-shell__title-button {
  display: inline-flex;
  align-items: flex-end;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.draft-window-shell__title-content {
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
}

.draft-window-shell__title-button :deep(.record-title) {
  margin: 0;
}

.draft-window-shell__title-button :deep(.record-title__title) {
  color: #111827;
}

.draft-window-shell__title-chevron {
  width: 14px;
  height: 14px;
  margin-bottom: 4px;
  fill: none;
  stroke: #111827;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.draft-window-shell__source-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 20;
  display: grid;
  gap: 8px;
  min-width: 180px;
  padding: 10px;
  background: #111827;
  border-radius: 14px;
}

.draft-window-shell__source-item {
  padding: 8px 10px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  text-align: left;
  cursor: pointer;
}

.draft-window-shell__source-item--active {
  color: #111827;
  background: #fff;
  border-color: #fff;
}

.draft-window-shell__placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.draft-window-shell__placeholder {
  min-height: 120px;
  padding: 16px;
  border: 1px dashed rgba(15, 23, 42, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.66);
}

.draft-window-shell__placeholder-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: var(--font-weight-black);
}

.draft-window-shell__placeholder-copy {
  margin-top: 10px;
  color: rgba(15, 23, 42, 0.66);
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.45;
}

.draft-window-shell__data-section {
  padding: 18px 18px 20px;
}

.draft-window-shell__data-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.draft-window-shell__section-body {
  display: grid;
  gap: 10px;
}

.draft-window-shell__toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.draft-window-shell__toolbar-row :deep(.shell-section-toolbar) {
  flex: 1 1 auto;
  min-width: 0;
}

.draft-window-shell__surface-stack {
  display: grid;
  gap: 10px;
}

.draft-window-shell__surface-wrap {
  overflow-x: auto;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
}

.draft-window-shell__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.draft-window-shell__card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
}

.draft-window-shell__card-title {
  color: #111827;
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
}

.draft-window-shell__card-line {
  display: grid;
  gap: 2px;
}

.draft-window-shell__card-label {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  text-transform: uppercase;
}

.draft-window-shell__card-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
}

.draft-window-shell__card-empty {
  padding: 18px 12px;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  text-align: center;
}

.draft-window-shell__delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: rgba(15, 23, 42, 0.5);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.draft-window-shell__section-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.draft-window-shell__section-chevron-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--ds-color-brand-black);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (max-width: 900px) {
  .draft-window-shell__top-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .draft-window-shell__placeholder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
