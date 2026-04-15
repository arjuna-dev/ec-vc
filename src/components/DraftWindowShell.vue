<template>
  <section class="draft-window-shell">
    <header class="draft-window-shell__header">
      <div class="draft-window-shell__top-row">
        <RecordTitle title="Draft Window" />
        <button
          v-if="shellSelectorOptions.length"
          ref="shellSelectorButton"
          type="button"
          class="draft-window-shell__source-button"
          @click.stop="toggleShellSelector"
        >
          <MainMenuGroupRow
            :label="activeShellSelectorOption.label"
            :expanded="shellSelectorOpen"
          />
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
            v-model="dataControlContract.activeViewKey"
            aria-label="Data control bar"
            :items="dataControlContract.items"
            :all-visible-selected="dataControlContract.allVisibleSelected"
            :some-visible-selected="dataControlContract.someVisibleSelected"
            :loading="dataControlContract.loading"
            :add-disabled="dataControlContract.addDisabled"
            :search-query="dataControlContract.searchQuery"
            :search-placeholder="dataControlContract.searchPlaceholder"
            :view-mode="dataControlContract.viewMode"
            :show-collapse-toggle="false"
            :collapsed="dataControlContract.collapsed"
            @toggle-select-all="toggleSelectAllVisible"
            @add="handleToolbarAdd"
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

          <div class="draft-window-shell__surface-wrap ds-mini-scrollbar">
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
            />
          </div>
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
            v-model="governanceControlContract.activeViewKey"
            aria-label="Governance draft control bar"
            :items="governanceControlContract.items"
            :all-visible-selected="governanceControlContract.allVisibleSelected"
            :some-visible-selected="governanceControlContract.someVisibleSelected"
            :loading="governanceControlContract.loading"
            :add-disabled="governanceControlContract.addDisabled"
            :search-query="governanceControlContract.searchQuery"
            :search-placeholder="governanceControlContract.searchPlaceholder"
            :view-mode="governanceControlContract.viewMode"
            :show-collapse-toggle="false"
            :collapsed="governanceControlContract.collapsed"
            :select-disabled="true"
            :search-disabled="true"
            :filter-disabled="true"
            @add="handleToolbarAdd"
            @update:search-query="governanceSearchQuery = $event"
            @update:view-mode="governanceViewMode = $event"
          />
        </div>

        <div v-if="!governanceControlContract.collapsed" class="draft-window-shell__surface-stack">
          <div class="draft-window-shell__surface-wrap ds-mini-scrollbar">
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
              @toggle-token-select="toggleTokenSelection"
              @update-token-cell="updateTokenCell"
            />
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import MainMenuGroupRow from 'src/components/MainMenuGroupRow.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import FileShellControlBar from 'src/components/FileShellControlBar.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import { buildTokenGovernanceColumns } from 'src/utils/structureGovernanceColumns'
import { buildShellToolbarFeed } from 'src/utils/shellToolbarFeeder'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { splitDialogViews } from 'src/utils/dialogShellPayload'
import {
  buildFileShellPayload,
  getCanonicalTokenValue,
  getCanonicalTokenWriteTarget,
  getRegistryTitleTokenForSource,
  getRuntimeStructureVersion,
  subscribeRuntimeFileStructures,
} from 'src/utils/structureRegistry'
import { buildFileStructureSessionSnapshot } from 'src/utils/fileStructureSession'

const props = defineProps({
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:shellSelectorValue', 'change'])

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
const tokenFieldOverridesBySource = ref({})
const selectedLeafKeysBySource = ref({})
const selectedTokenKeysBySource = ref({})
const selectedViewKeysBySource = ref({})
const deletedTokenKeysBySource = ref({})
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
const toolbarViewSplit = computed(() => splitDialogViews(fileViewGroups.value))

function isRelationshipSectionLabel(value = '') {
  return String(value || '').trim().toLowerCase() === 'ldb'
}

const controlBarFeed = computed(() =>
  buildShellToolbarFeed({
    sections: fileViewGroups.value,
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
  return fileViewGroups.value.find((section) => section.key === dataToolbarView.value) || fileViewGroups.value[0] || null
})

const activeGovernanceToolbarKey = computed(() => (
  governanceToolbarView.value === 'tokens' || governanceToolbarView.value === 'views'
    ? governanceToolbarView.value
    : ''
))

const orderedViewTokens = computed(() => {
  const titleTokenKey = String(getRegistryTitleTokenForSource(activeSettingsSourceKey.value)?.key || '').trim()
  return [...(Array.isArray(activeViewSection.value?.tokens) ? activeViewSection.value.tokens : [])].sort((left, right) => {
    if (left.key === titleTokenKey) return -1
    if (right.key === titleTokenKey) return 1
    return String(left.label || left.key || '').localeCompare(String(right.label || right.key || ''))
  })
})

const recordDataColumns = computed(() =>
  orderedViewTokens.value.map((token) => ({
    key: token.key,
    label: token.label || token.key || 'Field',
    width: token.key === getRegistryTitleTokenForSource(activeSettingsSourceKey.value)?.key ? 220 : 170,
    headerClass: 'structure-governance-panel__cell--data',
    cellClass: token.key === getRegistryTitleTokenForSource(activeSettingsSourceKey.value)?.key
      ? 'structure-governance-panel__cell--label'
      : 'structure-governance-panel__cell--data',
  })),
)

const governanceViewRows = computed(() =>
  [...toolbarViewSplit.value.leftSections, ...toolbarViewSplit.value.rightSections].map((section) => ({
    key: section.key,
    label: section.label,
    side: toolbarViewSplit.value.rightSections.some((entry) => entry.key === section.key) ? 'Right' : 'Left',
    tokenCount: Array.isArray(section.tokens) ? section.tokens.length : 0,
  })),
)

const isRelationshipSettingsSection = computed(() =>
  isRelationshipSectionLabel(activeViewSection.value?.label),
)

const sharedLdbLeafTokens = computed(() => {
  if (!isRelationshipSettingsSection.value) return []

  return (Array.isArray(props.shellSelectorOptions) ? props.shellSelectorOptions : [])
    .map((option, index) => {
      const sourceKey = String(option?.value || '').trim().toLowerCase()
      if (!sourceKey || sourceKey === 'bb-file') return null
      return {
        key: `__shared_ldb__:${sourceKey}`,
        label: String(option?.label || `File ${index + 1}`).trim() || `File ${index + 1}`,
        parentLabel: activeViewSection.value?.label || 'LDB',
        tokenType: 'select_multi',
        relationshipGroup: 'ldb',
        dbFieldAliases: [],
        optionList: '',
        optionSource: 'shared_file_universe',
        optionEntity: '',
        fieldClass: 'ldb_relationship',
        dbWriteField: '',
        targetSourceKey: sourceKey,
        editable: true,
      }
    })
    .filter(Boolean)
})

const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => {
    const section = fileViewGroups.value.find((entry) => entry.key === view.key)
    const deletedKeys = new Set(deletedTokenKeysBySource.value[activeSettingsSourceKey.value] || [])
    const baseTokens = (Array.isArray(section?.tokens) ? section.tokens : []).filter((token) => !deletedKeys.has(token.key))
    const ldbTokens = view.key === activeViewSection.value?.key && isRelationshipSettingsSection.value ? sharedLdbLeafTokens.value : []
    const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])

    return {
      key: view.key,
      label: view.label,
      tokens: [...ldbTokens, ...baseTokens].map((token, index) => {
        const writeTarget = getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
        const overrides = tokenFieldOverridesBySource.value[activeSettingsSourceKey.value]?.[token.key] || {}

        return {
          key: token.key || `token-${index}`,
          label: (overrides.label ?? token.label) || '-',
          type: (overrides.type ?? token.tokenType) || '-',
          optionSource: (overrides.optionSource ?? token.optionSource) || '-',
          optionEntity: (overrides.optionEntity ?? token.optionEntity) || '-',
          optionList: (overrides.optionList ?? token.optionList) || '-',
          definition: (overrides.definition ?? token.definition) || '-',
          dbWriteField: (overrides.dbWriteField ?? token.dbWriteField) || token.dbFieldAliases?.[0] || '-',
          fieldClass: (overrides.fieldClass ?? token.fieldClass ?? token.field_class) || '-',
          required: requiredKeys.has(token.key),
          visible: 'Yes',
          writeTarget: overrides.writeTarget ?? (writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '-'),
          editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '-',
        }
      }),
    }
  }),
)

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
  const recordIdField = String(activeLoader.value?.recordIdField || 'id').trim() || 'id'
  const rows = rawRowsBySource.value[activeSettingsSourceKey.value] || []

  return rows
    .map((row, index) => {
      const recordId = String(row?.[recordIdField] || '').trim() || `draft-row-${index + 1}`
      const mappedRow = { key: recordId }
      const searchValues = []

      orderedViewTokens.value.forEach((token) => {
        const value = stringifyValue(getCanonicalTokenValue(row, token))
        mappedRow[token.key] = value
        if (value) searchValues.push(value.toLowerCase())
      })

      mappedRow.__searchText = searchValues.join(' ')
      return mappedRow
    })
    .filter((row) => !searchValue || row.__searchText.includes(searchValue))
})

const allVisibleSelected = computed(() =>
  displayRows.value.length > 0 && displayRows.value.every((row) => selectedLeafKeys.value.includes(row.key)),
)

const someVisibleSelected = computed(() =>
  displayRows.value.some((row) => selectedLeafKeys.value.includes(row.key)) && !allVisibleSelected.value,
)

const dataControlContract = computed(() => ({
  activeViewKey: dataToolbarView.value,
  items: dataControlItems.value,
  allVisibleSelected: allVisibleSelected.value,
  someVisibleSelected: someVisibleSelected.value,
  loading: loading.value,
  addDisabled: true,
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
  addDisabled: true,
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
  viewRows: governanceViewRows.value,
  tokenGroups: tokenGroupsByView.value,
  tokenColumns: tokenGovernanceColumns.value,
  selectedTokenKeys: selectedTokenKeys.value,
  selectedViewKeys: selectedViewKeys.value,
  allVisibleSelected: governanceAllVisibleSelected.value,
  someVisibleSelected: governanceSomeVisibleSelected.value,
  emptyViewsLabel: 'No views declared for this file.',
  emptyTokensLabel: 'No tokens declared in this view.',
}))

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
    deletedTokenKeys: deletedTokenKeysBySource.value[activeSettingsSourceKey.value] || [],
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

function getDefaultRequiredFieldKeysForSource(sourceKey) {
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const normalizedKey = String(titleToken?.key || '').trim()
  return normalizedKey ? [normalizedKey] : []
}

function updateTokenCell(tokenKey, field, value) {
  if (field === 'required') {
    toggleRequiredField(tokenKey, Boolean(value))
    return
  }
  const sourceKey = activeSettingsSourceKey.value
  const currentBySource = tokenFieldOverridesBySource.value[sourceKey] || {}
  const currentToken = currentBySource[tokenKey] || {}
  tokenFieldOverridesBySource.value = {
    ...tokenFieldOverridesBySource.value,
    [sourceKey]: {
      ...currentBySource,
      [tokenKey]: {
        ...currentToken,
        [field]: String(value ?? '').trim() || '-',
      },
    },
  }
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

function deleteSelectedTokens() {
  const sourceKey = activeSettingsSourceKey.value
  const selected = selectedTokenKeysBySource.value[sourceKey] || []
  if (!selected.length) return

  const deleted = new Set(deletedTokenKeysBySource.value[sourceKey] || [])
  selected.forEach((key) => deleted.add(key))
  deletedTokenKeysBySource.value = {
    ...deletedTokenKeysBySource.value,
    [sourceKey]: Array.from(deleted),
  }

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

function handleToolbarAdd() {}

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
  [activeSettingsSourceKey, payloadTokens],
  ([sourceKey, tokens]) => {
    const allowedRequiredKeys = new Set((Array.isArray(tokens) ? tokens : []).map((token) => token.key))
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
  gap: 16px;
}

.draft-window-shell__source-button {
  margin-left: auto;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #111827;
  cursor: pointer;
}

.draft-window-shell__source-button :deep(.main-menu-group-row) {
  color: #fff;
}

.draft-window-shell__source-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
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
    align-items: stretch;
  }

  .draft-window-shell__source-button {
    margin-left: 0;
  }

  .draft-window-shell__placeholder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
