<template>
  <DialogShellFrame
    card-class="file-structure-shell"
    header-class="file-structure-shell__header"
    body-class="file-structure-shell__body"
  >
    <template #header>
      <div class="file-structure-shell__header-copy">
        <div class="file-structure-shell__title-row">
          <RecordTitle title="Draft Window" />
          <button
            v-if="shellSelectorOptions.length"
            ref="shellSelectorButton"
            type="button"
            class="file-structure-shell__shell-selector"
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
            class="file-structure-shell__shell-selector-dropdown"
          >
            <div class="file-structure-shell__section-menu">
              <button
                v-for="option in shellSelectorOptions"
                :key="option.value"
                type="button"
                class="file-structure-shell__section-menu-item"
                :class="{ 'file-structure-shell__section-menu-item--active': shellSelectorValue === option.value }"
                @click.stop="selectShellSelectorOption(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
        <div class="file-structure-shell__divider" />
        <div class="file-structure-shell__dialog-title-row">
          <DialogShellTitleRow
            :title="activeShellSelectorOption.label"
            class="file-structure-shell__dialog-title-copy"
          />
          <button
            type="button"
            class="file-structure-shell__chevron-button"
            :aria-label="boxesCollapsed ? 'Expand boxes' : 'Collapse boxes'"
            @click="boxesCollapsed = !boxesCollapsed"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="file-structure-shell__chevron-icon">
              <path :d="boxesCollapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <div v-if="!boxesCollapsed" class="file-structure-shell__content-grid">
      <RecordSummaryBox class="file-structure-shell__content-box file-structure-shell__content-box--summary">
        <div class="file-structure-shell__content-box-title-row">
          <div class="file-structure-shell__content-box-title-shell">
            <DialogShellTitleRow
              title="Summary"
              class="file-structure-shell__content-box-title"
            />
          </div>
          <div class="file-structure-shell__content-box-title-shell file-structure-shell__content-box-title-shell--doc">
            <button
              type="button"
              class="file-structure-shell__doc-link"
              aria-label="Open File Guide"
              title="Open File Guide"
              @click="openFileGuideDoc"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="file-structure-shell__doc-link-icon">
                <path
                  d="M7 3H14L19 8V21H7V3ZM13 4.5V9H17.5L13 4.5ZM9 13H17V14.5H9V13ZM9 16H17V17.5H9V16ZM9 10H12V11.5H9V10Z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="file-structure-shell__guide-panel">
          <div class="file-structure-shell__guide-divider" />
        </div>
      </RecordSummaryBox>

      <RecordFieldsBox class="file-structure-shell__content-box">
        <div class="file-structure-shell__content-box-title-row">
          <div class="file-structure-shell__content-box-title-shell">
            <DialogShellTitleRow
              title="General"
              class="file-structure-shell__content-box-title"
            />
          </div>
        </div>
        <div class="file-structure-shell__guide-panel">
          <div class="file-structure-shell__guide-divider" />
        </div>
      </RecordFieldsBox>

      <RecordFieldsBox class="file-structure-shell__content-box file-structure-shell__content-box--events">
        <div class="file-structure-shell__content-box-title-row">
          <div class="file-structure-shell__content-box-title-shell">
            <DialogShellTitleRow
              title="File Feed"
              class="file-structure-shell__content-box-title"
            />
          </div>
        </div>
        <div class="file-structure-shell__guide-panel">
          <div class="file-structure-shell__guide-divider" />
          <div class="file-structure-shell__guide-meta">
            Tokens and Views were removed from this quick surface.
          </div>
        </div>
      </RecordFieldsBox>
    </div>

    <div class="file-structure-shell__toolbar-row">
      <FileShellControlBar
        v-model="dataControlContract.activeViewKey"
        aria-label="File shell control bar"
        :items="dataControlContract.items"
        :all-visible-selected="dataControlContract.allVisibleSelected"
        :some-visible-selected="dataControlContract.someVisibleSelected"
        :loading="dataControlContract.loading"
        :add-disabled="dataControlContract.addDisabled"
        :search-query="dataControlContract.searchQuery"
        :search-placeholder="dataControlContract.searchPlaceholder"
        :view-mode="dataControlContract.viewMode"
        :collapsed="dataControlContract.collapsed"
        collapse-aria-label="Collapse file data surface"
        expand-aria-label="Expand file data surface"
        @toggle-select-all="toggleSelectAllVisible"
        @add="handleToolbarAdd"
        @update:search-query="searchQuery = $event"
        @update:view-mode="viewMode = $event"
        @toggle-collapse="dataSurfaceCollapsed = !dataSurfaceCollapsed"
      >
        <template #controls-prefix>
          <button
            v-if="dataSurfaceContract.mode === 'tokens' && dataSurfaceContract.selectedTokenKeys.length"
            type="button"
            class="file-structure-shell__delete-btn"
            @click="deleteSelectedTokens"
          >
            Delete Selected
          </button>
        </template>
      </FileShellControlBar>
    </div>

    <div v-if="!dataControlContract.collapsed && dataSurfaceContract.mode !== 'data'" class="file-structure-shell__leaf-table-wrap ds-mini-scrollbar">
      <StructureGovernancePanel
        :mode="dataSurfaceContract.mode"
        :view-rows="dataSurfaceContract.viewRows"
        :token-groups="dataSurfaceContract.tokenGroups"
        :token-columns="dataSurfaceContract.tokenColumns"
        :selected-token-keys="dataSurfaceContract.selectedTokenKeys"
        :empty-views-label="dataSurfaceContract.emptyViewsLabel"
        :empty-tokens-label="dataSurfaceContract.emptyTokensLabel"
        @toggle-token-select="toggleTokenSelection"
        @update-token-cell="updateTokenCell"
      />
    </div>

    <div v-else-if="!dataControlContract.collapsed" class="file-structure-shell__leaf-area">
      <q-banner v-if="dataSurfaceContract.error" class="bg-red-2 text-black" rounded>
        {{ dataSurfaceContract.error }}
      </q-banner>

      <div class="file-structure-shell__leaf-table-wrap ds-mini-scrollbar">
        <StructureGovernancePanel
          :mode="dataSurfaceContract.mode"
          :data-columns="dataSurfaceContract.dataColumns"
          :data-rows="dataSurfaceContract.dataRows"
          :selected-row-keys="dataSurfaceContract.selectedRowKeys"
          :empty-data-label="dataSurfaceContract.emptyDataLabel"
          @toggle-data-select="toggleLeafSelection"
          @update-data-cell="updateLeafCell"
        />
      </div>
    </div>
  </DialogShellFrame>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import MainMenuGroupRow from 'src/components/MainMenuGroupRow.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
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
  getFilePageRegistryEntry,
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
const FILE_GUIDE_DOC_URL = 'file:///C:/Users/erikc/Coding_Repository/ec-vc/docs/000/c. System.md'
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
const activeToolbarView = ref('')
const boxesCollapsed = ref(false)
const leafItemsCollapsed = ref(false)
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const viewMode = ref('page')
const rawRowsBySource = ref({})
const draftLeafRowsBySource = ref({})
const draftTokenRowsBySource = ref({})
const leafFieldOverridesBySource = ref({})
const tokenFieldOverridesBySource = ref({})
const selectedLeafKeysBySource = ref({})
const selectedTokenKeysBySource = ref({})
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
const activeRegistryEntry = computed(() => activeFilePayload.value.registryEntry || null)
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
  const registryEntry = fileShellPayload.registryEntry
  const sections = fileShellPayload.sections.map((section) => ({
    ...section,
    tokens: fileShellPayload.tokens
      .filter((token) => token.parentKey === section.key)
      .map((token) => ({ ...token })),
  }))

  return {
    registryEntry,
    sections,
    tokens: fileShellPayload.tokens,
  }
})
const payloadSections = computed(() => activeFilePayload.value.sections)
const payloadTokens = computed(() => activeFilePayload.value.tokens)
const fileViewGroups = computed(() => payloadSections.value)
const toolbarViewSplit = computed(() => splitDialogViews(fileViewGroups.value))
function isRelationshipSectionLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
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
const controlBarItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: controlBarFeed.value.leftItems,
    rightItems: controlBarFeed.value.rightItems,
    governanceItems: controlBarFeed.value.governanceItems,
    isRelationshipSectionLabel: controlBarFeed.value.isRelationshipSectionLabel,
  }),
)
const isGovernanceToolbarActive = computed(() => activeToolbarView.value === 'tokens' || activeToolbarView.value === 'views')
const activeViewKey = activeToolbarView
const dataSurfaceCollapsed = leafItemsCollapsed
const activeGovernanceToolbarKey = computed(() => (isGovernanceToolbarActive.value ? activeToolbarView.value : ''))
const supportsActiveSourceEditing = computed(() => false)
const canCreateWithShell = computed(() => false)
const activeViewSection = computed(
  () => {
    if (isGovernanceToolbarActive.value) return null
    return fileViewGroups.value.find((section) => section.key === activeToolbarView.value) || fileViewGroups.value[0] || null
  },
)
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
const isRelationshipSettingsSection = computed(() =>
  isRelationshipSectionLabel(activeViewSection.value?.label),
)
const governanceViewRows = computed(() =>
  [...toolbarViewSplit.value.leftSections, ...toolbarViewSplit.value.rightSections].map((section) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    return {
      key: section.key,
      label: section.label,
      side: toolbarViewSplit.value.rightSections.some((entry) => entry.key === section.key) ? 'Right' : 'Left',
      tokenCount: Array.isArray(section.tokens) ? section.tokens.length : 0,
      sortOrder: normalized,
    }
  }),
)
const sharedLdbLeafTokens = computed(() => {
  if (!isRelationshipSettingsSection.value) return []

  return (Array.isArray(props.shellSelectorOptions) ? props.shellSelectorOptions : [])
    .map((option, index) => {
      const sourceKey = String(option?.value || '').trim().toLowerCase()
      if (!sourceKey || sourceKey === 'bb-file') return null

      const targetEntry = getFilePageRegistryEntry(sourceKey)
      return {
        key: `__shared_ldb__:${sourceKey}`,
        label: String(option?.label || targetEntry?.label || `File ${index + 1}`).trim() || `File ${index + 1}`,
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
const activeLeafTokens = computed(() => {
  const deletedKeys = new Set(deletedTokenKeysBySource.value[activeSettingsSourceKey.value] || [])
  const sourceTokens = isRelationshipSettingsSection.value
    ? sharedLdbLeafTokens.value
    : (Array.isArray(activeViewSection.value?.tokens) ? activeViewSection.value.tokens : [])
  const draftTokens = draftLeafRowsBySource.value[activeSettingsSourceKey.value] || []
  const tokens = [...draftTokens, ...sourceTokens].filter((token) => !deletedKeys.has(token.key))

  return tokens.map((token) => {
      const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
      const writeTarget = token.isDraft ? null : getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
      return {
        key: token.key || '—',
        label: token.label || '—',
      parentView: token.parentLabel || activeViewSection.value?.label || '—',
        type: token.tokenType || '—',
        optionSource: token.optionSource || '—',
        optionEntity: token.optionEntity || '—',
        optionList: token.optionList || '—',
        definition: token.definition || '—',
        dbWriteField: token.dbWriteField || token.dbFieldAliases?.[0] || '—',
        fieldClass: token.fieldClass || token.field_class || '—',
        visible: 'Yes',
        required: requiredKeys.has(token.key),
        editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
        relationshipMeaning: token.relationshipGroup || '—',
        writeTarget: writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '—',
        uiTreatment: token.tokenType || token.optionList || token.optionSource || '—',
      }
  })
})
const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => {
    const section = fileViewGroups.value.find((entry) => entry.key === view.key)
    const deletedKeys = new Set(deletedTokenKeysBySource.value[activeSettingsSourceKey.value] || [])
    const baseTokens = (Array.isArray(section?.tokens) ? section.tokens : []).filter(
      (token) => !deletedKeys.has(token.key),
    )
    const draftTokens = draftTokenRowsBySource.value[activeSettingsSourceKey.value] || []
    const groupTokens = [...draftTokens, ...baseTokens]
      const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
      return {
        key: view.key,
        label: view.label,
        tokens: groupTokens.map((token, index) => {
        const writeTarget = getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
        const overrides = tokenFieldOverridesBySource.value[activeSettingsSourceKey.value]?.[token.key] || {}
        return {
            key: token.key || `token-${index}`,
            label: (overrides.label ?? token.label) || '—',
            type: (overrides.type ?? token.tokenType) || '—',
            optionSource: (overrides.optionSource ?? token.optionSource) || '—',
            optionEntity: (overrides.optionEntity ?? token.optionEntity) || '—',
            optionList: (overrides.optionList ?? token.optionList) || '—',
            definition: (overrides.definition ?? token.definition) || '—',
            dbWriteField: (overrides.dbWriteField ?? token.dbWriteField) || token.dbFieldAliases?.[0] || '—',
            fieldClass: (overrides.fieldClass ?? token.fieldClass ?? token.field_class) || '—',
            required: requiredKeys.has(token.key),
            visible: 'Yes',
            writeTarget: overrides.writeTarget ?? (writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '—'),
            editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
          }
        }),
      }
    }),
  )
const displayLeafTokens = computed(() =>
  activeLeafTokens.value
    .map((token) => {
    const overrides = leafFieldOverridesBySource.value[activeSettingsSourceKey.value]?.[token.key] || {}
    return {
      ...token,
      label: overrides.label ?? token.label,
      type: overrides.type ?? token.type,
      optionSource: overrides.optionSource ?? token.optionSource,
      optionEntity: overrides.optionEntity ?? token.optionEntity,
      optionList: overrides.optionList ?? token.optionList,
      definition: overrides.definition ?? token.definition,
      dbWriteField: overrides.dbWriteField ?? token.dbWriteField,
      fieldClass: overrides.fieldClass ?? token.fieldClass,
      visible: overrides.visible ?? token.visible,
      writeTarget: overrides.writeTarget ?? token.writeTarget,
    }
  }),
)
const selectedLeafKeys = computed(() => selectedLeafKeysBySource.value[activeSettingsSourceKey.value] || [])
const selectedTokenKeys = computed(() => selectedTokenKeysBySource.value[activeSettingsSourceKey.value] || [])
const activeRequiredFieldKeys = computed(() => requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
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
const searchPlaceholder = computed(() => `Search ${activeFilePayload.value.registryEntry?.label || 'Records'}`)
const dataControlContract = computed(() => ({
  activeViewKey: activeViewKey.value,
  items: controlBarItems.value,
  allVisibleSelected: allVisibleSelected.value,
  someVisibleSelected: someVisibleSelected.value,
  loading: loading.value,
  addDisabled: !supportsActiveSourceEditing.value || !canCreateWithShell.value,
  searchQuery: searchQuery.value,
  searchPlaceholder: searchPlaceholder.value,
  viewMode: viewMode.value,
  collapsed: dataSurfaceCollapsed.value,
}))
const dataSurfaceContract = computed(() => ({
  mode: activeGovernanceToolbarKey.value || 'data',
  sourceKey: activeSettingsSourceKey.value,
  surfaceKey: activeViewSection.value?.key || activeGovernanceToolbarKey.value || '',
  contextKind: 'file',
  dataColumns: recordDataColumns.value,
  dataRows: displayRows.value,
  selectedRowKeys: selectedLeafKeys.value,
  viewRows: governanceViewRows.value,
  tokenGroups: tokenGroupsByView.value,
  tokenColumns: tokenGovernanceColumns.value,
  selectedTokenKeys: selectedTokenKeys.value,
  emptyDataLabel: `No rows available for ${activeRegistryEntry.value?.label || 'this section'}.`,
  emptyViewsLabel: 'No views declared for this file.',
  emptyTokensLabel: 'No tokens declared in this view.',
  error: error.value,
}))
const fileStructureSnapshot = computed(() =>
  buildFileStructureSessionSnapshot({
    sourceKey: activeSettingsSourceKey.value,
    sourceLabel: activeShellSelectorOption.value.label,
    toolbarValue: activeToolbarView.value,
    sectionKey: activeViewSection.value?.key || '',
    viewRows: governanceViewRows.value,
    leafRows: displayLeafTokens.value,
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

function openFileGuideDoc() {
  if (typeof window === 'undefined') return
  window.ecvc?.openExternal?.(FILE_GUIDE_DOC_URL)
}

function toggleShellSelector() {
  shellSelectorOpen.value = !shellSelectorOpen.value
}

function toggleLeafSelection(tokenKey) {
  const sourceKey = activeSettingsSourceKey.value
  const current = selectedLeafKeys.value
  selectedLeafKeysBySource.value = {
    ...selectedLeafKeysBySource.value,
    [sourceKey]: current.includes(tokenKey)
      ? current.filter((key) => key !== tokenKey)
      : [...current, tokenKey],
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

function getDefaultRequiredFieldKeysForSource(sourceKey) {
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const normalizedKey = String(titleToken?.key || '').trim()
  return normalizedKey ? [normalizedKey] : []
}

function updateLeafCell(tokenKey, field, value) {
  if (field === 'required') {
    toggleRequiredField(tokenKey, Boolean(value))
    return
  }
  const sourceKey = activeSettingsSourceKey.value
  const currentBySource = leafFieldOverridesBySource.value[sourceKey] || {}
  const currentToken = currentBySource[tokenKey] || {}
  leafFieldOverridesBySource.value = {
    ...leafFieldOverridesBySource.value,
    [sourceKey]: {
      ...currentBySource,
      [tokenKey]: {
        ...currentToken,
        [field]: String(value ?? '').trim() || '—',
      },
    },
  }
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
        [field]: String(value ?? '').trim() || '—',
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
  controlBarItems,
  (items) => {
    if (items.some((item) => item.value === activeToolbarView.value)) return
    activeToolbarView.value = items[0]?.value || ''
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
.file-structure-shell {
  --file-structure-shell-side-column-width: 232px;
  width: 100%;
  max-width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--ds-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 249, 252, 0.98));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
}

.file-structure-shell__header {
  padding: 26px 28px 0;
}

.file-structure-shell__title-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.file-structure-shell__divider {
  width: 100%;
  height: 1px;
  margin-top: 18px;
  background: rgba(15, 23, 42, 0.12);
}

.file-structure-shell__dialog-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
}

.file-structure-shell__dialog-title-copy {
  min-width: 0;
}

.file-structure-shell__content-grid {
  display: grid;
  grid-template-columns: var(--file-structure-shell-side-column-width) minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  padding: 10px 16px 18px;
  align-items: stretch;
}

.file-structure-shell__content-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 260px;
  align-self: stretch;
}

.file-structure-shell__content-box--summary {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  justify-self: start;
  align-self: start;
}

.file-structure-shell__content-box--events {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  justify-self: end;
  align-self: start;
}

.file-structure-shell__content-box-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.file-structure-shell__content-box-title-shell {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--ds-radius-md);
  background: transparent;
}

.file-structure-shell__content-box-title-shell--menu {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border-color: transparent;
  background: transparent;
}

.file-structure-shell__content-box-title-shell--doc {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border: 0;
  background: transparent;
}

.file-structure-shell__content-box-title {
  padding-bottom: 0;
}

.file-structure-shell__content-box-title:deep(.dialog-shell-title-row__title) {
  color: var(--ds-color-brand-black);
  font-size: var(--ds-font-size-base);
  line-height: 1;
}

.file-structure-shell__doc-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.72);
  line-height: 1;
  cursor: pointer;
}

.file-structure-shell__doc-link-icon {
  display: block;
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.file-structure-shell__placeholder-copy {
  color: rgba(15, 23, 42, 0.74);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-body-md);
  line-height: 1.45;
}

.file-structure-shell__guide-divider {
  width: 100%;
  height: 1px;
  background: rgba(15, 23, 42, 0.12);
}

.file-structure-shell__selected-l3-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.file-structure-shell__selected-l3-row {
  display: grid;
  gap: 2px;
  padding: 10px;
}

.file-structure-shell__selected-l3-label {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.3;
}

.file-structure-shell__selected-l3-meta {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.25;
}

.file-structure-shell__events-tabs {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
}

.file-structure-shell__notes-panel,
.file-structure-shell__system-panel {
  display: grid;
  gap: 8px;
}

.file-structure-shell__notes-row {
  display: grid;
  gap: 4px;
}

.file-structure-shell__notes-name,
.file-structure-shell__system-label,
.file-structure-shell__system-type,
.file-structure-shell__system-head {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
}

.file-structure-shell__notes-name {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.3;
}

.file-structure-shell__notes-summary {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.3;
}

.file-structure-shell__system-head,
.file-structure-shell__system-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.file-structure-shell__system-head {
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
}

.file-structure-shell__system-label,
.file-structure-shell__system-type {
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.3;
}

.file-structure-shell__system-alias {
  color: rgba(15, 23, 42, 0.34);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.3;
}

.file-structure-shell__guide-copy,
.file-structure-shell__guide-meta {
  color: rgba(15, 23, 42, 0.74);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.4;
}

.file-structure-shell__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 10px;
}

.file-structure-shell__toolbar-row :deep(.shell-section-toolbar) {
  flex: 1 1 auto;
  min-width: 0;
}

.file-structure-shell__chevron-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}

.file-structure-shell__chevron-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--ds-color-brand-black);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.file-structure-shell__leaf-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px 18px;
}

.file-structure-shell__leaf-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.94);
}

.file-structure-shell__leaf-table-wrap.ds-mini-scrollbar {
  scrollbar-width: thin;
}

.file-structure-shell__colhead--structure {
  font-size: var(--ds-font-size-xs);
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__colhead--data {
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__cell--structure {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.25;
  white-space: nowrap;
}

.file-structure-shell__cell--label {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
}

.file-structure-shell__cell--data {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.25;
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__cell--control {
  color: rgba(15, 23, 42, 0.62);
  text-align: center;
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__eye-icon {
  opacity: 0.72;
}

.file-structure-shell__cell--l3-key {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.25;
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__shell-selector {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
  width: auto;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #111827;
  cursor: pointer;
}

.file-structure-shell__shell-selector:hover {
  background: #0b1220;
  border-color: rgba(15, 23, 42, 0.24);
}

.file-structure-shell__shell-selector :deep(.main-menu-group-row) {
  color: #fff;
}

.file-structure-shell__shell-selector-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
}

.file-structure-shell__section-menu {
  display: inline-grid;
  min-width: 0;
  width: max-content;
  max-width: min(320px, calc(100vw - 48px));
  padding: 10px;
  background: #111827;
  border-radius: 14px;
}

.file-structure-shell__section-menu-item {
  width: auto;
  min-width: 0;
  padding: 8px 10px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.file-structure-shell__section-menu-item--active {
  color: #111827;
  background: #fff;
  border-color: #fff;
}

.file-structure-shell__table {
  width: max-content;
  border-collapse: collapse;
  table-layout: auto;
}

.file-structure-shell__table col:first-child {
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__table th,
.file-structure-shell__table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.file-structure-shell__table th {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__table td {
  color: #111827;
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.35;
}

.file-structure-shell__table th:first-child,
.file-structure-shell__table td:first-child {
  width: 1%;
  white-space: nowrap;
  padding-right: 18px;
}

.file-structure-shell__row-head {
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__column-head-inner,
.file-structure-shell__row-head-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.file-structure-shell__dynamic-column-head {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.file-structure-shell__dynamic-column-head--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.file-structure-shell__table-cell {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.file-structure-shell__table-cell--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.file-structure-shell__column-input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  outline: none;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
}

.file-structure-shell__add-column-head,
.file-structure-shell__add-column-spacer {
  width: 1%;
  padding-left: 6px;
  padding-right: 0;
  white-space: nowrap;
}

.file-structure-shell__add-column-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
}

.file-structure-shell__add-column-btn:disabled,
.file-structure-shell__add-row-btn:disabled {
  opacity: 0.32;
  cursor: default;
  box-shadow: none;
}

.file-structure-shell__add-column-btn :deep(.q-icon) {
  font-size: 16px;
}

.file-structure-shell__row-input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  outline: none;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
}

.file-structure-shell__add-row-cell {
  padding-top: 14px;
  padding-bottom: 0;
}

.file-structure-shell__add-row-spacer {
  padding-top: 14px;
  padding-bottom: 0;
  border-bottom: 0;
}

.file-structure-shell__add-row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
}

.file-structure-shell__add-row-btn :deep(.q-icon) {
  font-size: 16px;
}

.file-structure-shell__action-tooltip {
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.file-structure-shell__delete-btn {
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
  transition: color 160ms ease;
}

.file-structure-shell__delete-btn:hover {
  color: #0f172a;
}

.file-structure-shell__table-cell-surface {
  min-height: 52px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(241, 245, 249, 0.86));
}

.file-structure-shell__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-structure-shell__field-label {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__field-surface {
  min-height: 76px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(241, 245, 249, 0.86));
}

.file-structure-shell__field-surface--tall {
  min-height: 196px;
}

.file-structure-shell__actions {
  padding: 0 28px 24px;
  gap: 10px;
}

.file-structure-shell__action {
  min-width: 96px;
  border-radius: 10px;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
}

.file-structure-shell__action--cancel {
  color: #111827;
}

.file-structure-shell__action--save {
  color: #fff;
  background: #111827;
}

:global(.file-structure-shell__shell-selector-menu) {
  background: #111827;
}

@media (max-width: 900px) {
  .file-structure-shell {
    width: min(100vw - 20px, 1240px);
    max-width: calc(100vw - 20px);
    border-radius: 22px;
  }

  .file-structure-shell__header,
  .file-structure-shell__body,
  .file-structure-shell__actions {
    padding-left: 20px;
    padding-right: 20px;
  }

  .file-structure-shell__title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .file-structure-shell__content-grid {
    grid-template-columns: 1fr;
    padding-left: 20px;
    padding-right: 20px;
  }

  .file-structure-shell__group-head {
    flex-wrap: wrap;
    align-items: center;
  }

  .file-structure-shell__section-picker {
    margin: 0;
  }

  .file-structure-shell__grid {
    grid-template-columns: 1fr;
  }
}
</style>
