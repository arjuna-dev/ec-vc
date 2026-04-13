<template>
  <DialogShellFrame
    card-class="file-structure-shell"
    header-class="file-structure-shell__header"
    body-class="file-structure-shell__body"
  >
    <template #header>
      <div class="file-structure-shell__header-copy">
        <div class="file-structure-shell__title-row">
          <RecordTitle title="Add/Edit File Shell" />
          <PlusWithLabelButton
            label="Add Element"
            aria-label="Add Element"
            @click="addLeafElement"
          />
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
      <MiniToolbar
        v-model="miniToolbarActiveKey"
        aria-label="Shell mini toolbar"
        :items="miniToolbarItems"
        :view-mode="miniToolbarViewMode"
        :view-options="miniToolbarViewOptions"
        :show-view-toggle="false"
      />
      <q-input
        v-model="searchQuery"
        dense
        outlined
        placeholder="Search"
        class="file-structure-shell__toolbar-search"
      />
      <button
        v-if="isTokensToolbarActive"
        type="button"
        class="file-structure-shell__delete-btn"
        @click="addTokenElement"
      >
        Add Token
      </button>
      <button
        v-if="!isGovernanceToolbarActive"
        type="button"
        class="file-structure-shell__delete-btn"
        @click="addLeafElement"
      >
        Add Row
      </button>
      <button
        v-if="isTokensToolbarActive && selectedTokenKeys.length"
        type="button"
        class="file-structure-shell__delete-btn"
        @click="deleteSelectedTokens"
      >
        Delete Selected
      </button>
      <button
        type="button"
        class="file-structure-shell__chevron-button file-structure-shell__chevron-button--toolbar"
        :aria-label="leafItemsCollapsed ? 'Expand leaf items' : 'Collapse leaf items'"
        @click="leafItemsCollapsed = !leafItemsCollapsed"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="file-structure-shell__chevron-icon">
          <path :d="leafItemsCollapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
        </svg>
      </button>
    </div>

    <div v-if="!leafItemsCollapsed" class="file-structure-shell__leaf-area">
      <div v-if="isViewsToolbarActive" class="file-structure-shell__leaf-table-wrap ds-mini-scrollbar">
        <StructureGovernancePanel
          mode="views"
          :view-rows="governanceViewRows"
          empty-views-label="No views declared for this file."
        />
      </div>

      <div v-else-if="isTokensToolbarActive" class="file-structure-shell__token-groups">
        <StructureGovernancePanel
          mode="tokens"
          :token-groups="tokenGroupsByView"
          :token-columns="tokenGovernanceColumns"
          :show-write-target="true"
          :interactive-required="true"
          :selected-token-keys="selectedTokenKeys"
          empty-tokens-label="No tokens declared in this view."
          @toggle-required="toggleRequiredField"
          @toggle-token-select="toggleTokenSelection"
          @update-token-cell="updateTokenCell"
        />
      </div>

      <div v-if="!isGovernanceToolbarActive" class="file-structure-shell__leaf-table-wrap ds-mini-scrollbar">
        <StructureGovernancePanel
          mode="data"
          :data-columns="leafDataColumns"
          :data-rows="displayLeafTokens"
          :selected-row-keys="selectedLeafKeys"
          empty-data-label="No leaf items declared for this selection."
          @toggle-data-select="toggleLeafSelection"
          @update-data-cell="updateLeafCell"
        />
      </div>
    </div>
  </DialogShellFrame>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import MainMenuGroupRow from 'src/components/MainMenuGroupRow.vue'
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
import MiniToolbar from 'src/components/MiniToolbar.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { splitDialogViews } from 'src/utils/dialogShellPayload'
import {
  buildFileShellPayload,
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
const FILE_GUIDE_DOC_URL = 'file:///C:/Users/erikc/Coding_Repository/ec-vc/docs/000/System.md'
const $q = useQuasar()

const shellSelectorOpen = ref(false)
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null
const shellSelectorButton = ref(null)
const shellSelectorMenu = ref(null)
const pendingShellSelectorValue = ref('')
const activeToolbarView = ref('')
const miniToolbarActiveKey = computed({
  get: () => activeToolbarView.value,
  set: (value) => {
    activeToolbarView.value = value
  },
})
const boxesCollapsed = ref(false)
const leafItemsCollapsed = ref(false)
const draftLeafRowsBySource = ref({})
const draftTokenRowsBySource = ref({})
const leafFieldOverridesBySource = ref({})
const tokenFieldOverridesBySource = ref({})
const selectedLeafKeysBySource = ref({})
const selectedTokenKeysBySource = ref({})
const deletedTokenKeysBySource = ref({})
const searchQuery = ref('')
const requiredFieldKeysBySource = ref({})
const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]
const miniToolbarViewMode = computed(() => 'card')
const miniToolbarViewOptions = computed(() => viewOptions)
const tokenTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'rich_text', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'select_single', label: 'Select Single' },
  { value: 'select_multi', label: 'Select Multi' },
  { value: 'creator', label: 'Creator' },
]
const optionSourceOptions = [
  { value: 'live_entity', label: 'Live Entity' },
  { value: 'option_list', label: 'Option List' },
  { value: 'shared_file_universe', label: 'Shared File Universe' },
  { value: 'manual', label: 'Manual' },
]
const fieldClassOptions = [
  { value: 'owned', label: 'Owned' },
  { value: 'directional', label: 'Directional' },
  { value: 'ldb_relationship', label: 'LDB Relationship' },
  { value: 'system', label: 'System' },
]
const optionEntityOptions = computed(() =>
  (Array.isArray(props.shellSelectorOptions) ? props.shellSelectorOptions : [])
    .map((option) => {
      const label = String(option?.label || '').trim()
      return label ? { value: label, label } : null
    })
    .filter(Boolean),
)
const tokenGovernanceColumns = computed(() => [
  { key: 'label', label: 'Label', width: 180, cellClass: 'file-structure-shell__cell--label', editable: true, kind: 'text' },
  { key: 'type', label: 'Type', width: 112, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: tokenTypeOptions },
  { key: 'optionSource', label: 'Option Source', width: 150, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: optionSourceOptions },
  { key: 'optionEntity', label: 'Option Entity', width: 160, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: optionEntityOptions.value },
  { key: 'optionList', label: 'Option List', width: 140, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
  { key: 'dbWriteField', label: 'DB Write Field', width: 180, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
  { key: 'fieldClass', label: 'Field Class', width: 140, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: fieldClassOptions },
  { key: 'required', label: 'Required', width: 84, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', kind: 'checkbox' },
  { key: 'writeTarget', label: 'Write Target / Alias', width: 220, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
])
const leafDataColumns = computed(() => [
  { key: 'parentView', label: 'View', width: 140, headerClass: 'file-structure-shell__colhead--structure', cellClass: 'file-structure-shell__cell--structure' },
  { key: 'key', label: 'Token Key', width: 108, headerClass: 'file-structure-shell__colhead--structure', cellClass: 'file-structure-shell__cell--l3-key' },
  { key: 'order', label: 'Order', width: 54, headerClass: 'file-structure-shell__colhead--structure', cellClass: 'file-structure-shell__cell--structure' },
  { key: 'label', label: 'Label', width: 180, cellClass: 'file-structure-shell__cell--label', editable: true, kind: 'text' },
  { key: 'type', label: 'Type', width: 112, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: tokenTypeOptions },
  { key: 'optionSource', label: 'Option Source', width: 150, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: optionSourceOptions },
  { key: 'optionEntity', label: 'Option Entity', width: 160, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: optionEntityOptions.value },
  { key: 'optionList', label: 'Option List', width: 140, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
  { key: 'dbWriteField', label: 'DB Write Field', width: 180, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
  { key: 'fieldClass', label: 'Field Class', width: 140, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: fieldClassOptions },
  { key: 'visible', label: 'Visible', width: 72, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] },
  { key: 'required', label: 'Required', width: 84, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', kind: 'checkbox' },
  { key: 'writeTarget', label: 'Write Target / Alias', width: 220, headerClass: 'file-structure-shell__colhead--data', cellClass: 'file-structure-shell__cell--data', editable: true, kind: 'text' },
])
const activeShellSelectorOption = computed(() =>
  props.shellSelectorOptions.find((option) => option.value === (pendingShellSelectorValue.value || props.shellSelectorValue))
  || props.shellSelectorOptions[0]
  || { value: '', label: 'Select File' },
)
const activeSettingsSourceKey = computed(() => activeShellSelectorOption.value.value || 'selected-file')
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
const miniToolbarItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: toolbarViewSplit.value.leftSections,
    rightItems: toolbarViewSplit.value.rightSections,
    governanceItems: [
      { value: 'tokens', title: 'Tokens' },
      { value: 'views', title: 'Views' },
    ],
    isRelationshipSectionLabel,
  }),
)
const isGovernanceToolbarActive = computed(() => activeToolbarView.value === 'tokens' || activeToolbarView.value === 'views')
const isTokensToolbarActive = computed(() => activeToolbarView.value === 'tokens')
const isViewsToolbarActive = computed(() => activeToolbarView.value === 'views')
const activeViewSection = computed(
  () => {
    if (isGovernanceToolbarActive.value) return null
    return fileViewGroups.value.find((section) => section.key === activeToolbarView.value) || fileViewGroups.value[0] || null
  },
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
        tokenOrder: String(index + 1),
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

  return tokens.map((token, index) => {
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
        dbWriteField: token.dbWriteField || token.dbFieldAliases?.[0] || '—',
        fieldClass: token.fieldClass || token.field_class || '—',
        visible: 'Yes',
        required: requiredKeys.has(token.key),
        editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
        relationshipMeaning: token.relationshipGroup || '—',
        writeTarget: writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '—',
        order: token.tokenOrder || String(index + 1),
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
    const filteredTokens = searchQuery.value
      ? groupTokens.filter((token) => String(token.label || '').toLowerCase().includes(searchQuery.value.toLowerCase()))
      : groupTokens
    return {
      key: view.key,
      label: view.label,
      tokens: filteredTokens.map((token, index) => {
        const writeTarget = getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
        const overrides = tokenFieldOverridesBySource.value[activeSettingsSourceKey.value]?.[token.key] || {}
        return {
            key: token.key || `token-${index}`,
            label: (overrides.label ?? token.label) || '—',
            type: (overrides.type ?? token.tokenType) || '—',
            optionSource: (overrides.optionSource ?? token.optionSource) || '—',
            optionEntity: (overrides.optionEntity ?? token.optionEntity) || '—',
            optionList: (overrides.optionList ?? token.optionList) || '—',
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
    .filter((token) => {
      if (!searchQuery.value) return true
      return String(token.label || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    })
    .map((token) => {
    const overrides = leafFieldOverridesBySource.value[activeSettingsSourceKey.value]?.[token.key] || {}
    return {
      ...token,
      label: overrides.label ?? token.label,
      type: overrides.type ?? token.type,
      optionSource: overrides.optionSource ?? token.optionSource,
      optionEntity: overrides.optionEntity ?? token.optionEntity,
      optionList: overrides.optionList ?? token.optionList,
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

function addLeafElement() {
  const sourceKey = activeSettingsSourceKey.value
  const currentDrafts = draftLeafRowsBySource.value[sourceKey] || []
  const nextIndex = currentDrafts.length + 1
  const nextKey = `${sourceKey}-draft-leaf-${nextIndex}`
  const nextLabel = ensureUniqueTokenLabel(`Draft Leaf ${nextIndex}`, sourceKey)
  draftLeafRowsBySource.value = {
    ...draftLeafRowsBySource.value,
    [sourceKey]: [
      ...currentDrafts,
      {
        isDraft: true,
        key: nextKey,
        label: nextLabel,
        parentLabel: activeViewSection.value?.label || '—',
        tokenType: 'text',
        relationshipGroup: '',
        tokenOrder: String(nextIndex),
        dbFieldAliases: [],
        optionList: '',
        optionSource: '',
      },
    ],
  }
  selectedLeafKeysBySource.value = {
    ...selectedLeafKeysBySource.value,
    [sourceKey]: [...selectedLeafKeys.value, nextKey],
  }
}

function addTokenElement() {
  const sourceKey = activeSettingsSourceKey.value
  const currentDrafts = draftTokenRowsBySource.value[sourceKey] || []
  const nextIndex = currentDrafts.length + 1
  const nextKey = `${sourceKey}-draft-token-${nextIndex}`
  const nextLabel = ensureUniqueTokenLabel(`Draft Token ${nextIndex}`, sourceKey)
  draftTokenRowsBySource.value = {
    ...draftTokenRowsBySource.value,
    [sourceKey]: [
      ...currentDrafts,
      {
        isDraft: true,
        key: nextKey,
        label: nextLabel,
        tokenType: 'text',
        tokenOrder: String(nextIndex),
        dbFieldAliases: [],
        optionList: '',
        optionSource: '',
        optionEntity: '',
        fieldClass: '',
        editable: true,
      },
    ],
  }
  selectedTokenKeysBySource.value = {
    ...selectedTokenKeysBySource.value,
    [sourceKey]: [...selectedTokenKeys.value, nextKey],
  }
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
  if (field === 'label') {
    const nextLabel = String(value ?? '').trim()
    if (!nextLabel) return
    if (isDuplicateTokenLabel(tokenKey, nextLabel)) {
      notifyDuplicateTokenLabel(nextLabel)
      return
    }
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
  if (field === 'label') {
    const nextLabel = String(value ?? '').trim()
    if (!nextLabel) return
    if (isDuplicateTokenLabel(tokenKey, nextLabel)) {
      notifyDuplicateTokenLabel(nextLabel)
      return
    }
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

function normalizeTokenLabel(value) {
  return String(value || '').trim().toLowerCase()
}

function notifyDuplicateTokenLabel(label) {
  $q?.notify?.({
    type: 'negative',
    message: `Token labels must be unique. "${label}" already exists in this file.`,
  })
}

function collectTokenLabelsForSource(sourceKey, excludedKey) {
  const labels = new Set()
  const tokenOverrides = tokenFieldOverridesBySource.value[sourceKey] || {}
  const leafOverrides = leafFieldOverridesBySource.value[sourceKey] || {}
  const addToken = (token) => {
    if (!token) return
    const tokenKey = String(token.key || '').trim()
    if (excludedKey && tokenKey === excludedKey) return
    const overrideLabel = tokenOverrides[tokenKey]?.label ?? leafOverrides[tokenKey]?.label
    const label = normalizeTokenLabel(overrideLabel || token.label || token.tokenName || token.key)
    if (label) labels.add(label)
  }

  ;(Array.isArray(payloadTokens.value) ? payloadTokens.value : []).forEach(addToken)
  ;(draftTokenRowsBySource.value[sourceKey] || []).forEach(addToken)
  ;(draftLeafRowsBySource.value[sourceKey] || []).forEach(addToken)
  return labels
}

function isDuplicateTokenLabel(tokenKey, nextLabel) {
  const sourceKey = activeSettingsSourceKey.value
  const normalized = normalizeTokenLabel(nextLabel)
  if (!normalized) return false
  const labels = collectTokenLabelsForSource(sourceKey, tokenKey)
  return labels.has(normalized)
}

function ensureUniqueTokenLabel(baseLabel, sourceKey) {
  const labels = collectTokenLabelsForSource(sourceKey)
  let nextLabel = String(baseLabel || '').trim() || 'New Token'
  if (!labels.has(normalizeTokenLabel(nextLabel))) return nextLabel
  let counter = 2
  while (labels.has(normalizeTokenLabel(`${nextLabel} ${counter}`))) {
    counter += 1
  }
  return `${nextLabel} ${counter}`
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
  miniToolbarItems,
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
