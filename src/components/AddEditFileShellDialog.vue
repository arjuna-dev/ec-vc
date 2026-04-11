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
            <MainMenuSubgroupRow
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
              title="Relevant Items"
              class="file-structure-shell__content-box-title"
            />
          </div>
          <div class="file-structure-shell__content-box-title-shell file-structure-shell__content-box-title-shell--menu">
            <L2SettingsMenu
              :title="generalElementSettingsTitle"
              :groups="liveGeneralElementSettingsGroups"
              @toggle-group="toggleSettingsGroup"
              @toggle-item="toggleSettingsItem"
            />
          </div>
        </div>
        <div class="file-structure-shell__guide-panel">
          <div class="file-structure-shell__guide-divider" />
          <div class="file-structure-shell__selected-l3-panel">
            <div
              v-for="item in selectedGeneralElementItems"
              :key="item.key"
              class="file-structure-shell__selected-l3-row"
            >
              <span class="file-structure-shell__selected-l3-label">{{ item.label }}</span>
              <span class="file-structure-shell__selected-l3-meta">{{ item.groupLabel }}</span>
            </div>
            <div v-if="!selectedGeneralElementItems.length" class="file-structure-shell__guide-meta">
              No L3 items selected for this file yet.
            </div>
          </div>
        </div>
      </RecordFieldsBox>

      <RecordFieldsBox class="file-structure-shell__content-box file-structure-shell__content-box--events">
        <div class="file-structure-shell__events-tabs">
          <SectionTabs
            v-model="activeEventsTab"
            :left-tabs="eventsTabs"
            :right-tabs="[]"
          />
        </div>
        <div class="file-structure-shell__guide-panel">
          <div class="file-structure-shell__guide-divider" />
          <div v-if="activeEventsTab === 'notes'" class="file-structure-shell__notes-panel">
            <div
              v-for="note in latestNotes"
              :key="note.id"
              class="file-structure-shell__notes-row"
            >
              <div class="file-structure-shell__notes-name">{{ note.name }}</div>
              <div class="file-structure-shell__notes-summary">{{ note.summary }}</div>
            </div>
            <div v-if="!latestNotes.length" class="file-structure-shell__guide-meta">
              No notes available yet.
            </div>
          </div>
          <div v-else-if="activeEventsTab === 'parameters'" class="file-structure-shell__system-panel">
            <div class="file-structure-shell__system-head">
              <div>Label</div>
              <div>Alias</div>
              <div>Type</div>
              <div>Required</div>
            </div>
            <div
              v-for="item in selectedSystemItems"
              :key="item.key"
              class="file-structure-shell__system-row"
            >
              <div class="file-structure-shell__system-label">{{ item.label }}</div>
              <div class="file-structure-shell__system-alias">{{ item.alias }}</div>
              <div class="file-structure-shell__system-type">{{ item.type }}</div>
              <div class="file-structure-shell__system-required">
                <SettingsCheckbox
                  :model-value="item.required"
                  tone="light"
                  @update:model-value="toggleRequiredField(item.key, $event)"
                />
              </div>
            </div>
            <div v-if="!selectedSystemItems.length" class="file-structure-shell__guide-meta">
              No selected items available yet.
            </div>
          </div>
        </div>
      </RecordFieldsBox>
    </div>

    <div class="file-structure-shell__toolbar-row">
      <ShellSectionToolbar
        v-model="activeL2Toolbar"
        :items="l2ToolbarItems"
        view-mode="card"
        :view-options="viewOptions"
        :show-view-toggle="false"
      />
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
      <div v-if="subgroupTabs.length" class="file-structure-shell__subgroup-tabs">
        <SectionTabs
          v-model="activeSubgroupKey"
          :left-tabs="subgroupTabs"
          :right-tabs="[]"
        />
      </div>

      <div class="file-structure-shell__leaf-table-wrap ds-mini-scrollbar">
        <table class="file-structure-shell__leaf-table">
          <colgroup>
            <col :style="columnStyle('select')">
            <col v-if="!structureColumnsCollapsed" :style="columnStyle('l2Section')">
            <col v-if="!structureColumnsCollapsed" :style="columnStyle('l2Sub')">
            <col v-if="!structureColumnsCollapsed" :style="columnStyle('l3Key')">
            <col v-if="!structureColumnsCollapsed" :style="columnStyle('structureOrder')">
            <col :style="columnStyle('label')">
            <col :style="columnStyle('type')">
            <col :style="columnStyle('visible')">
            <col :style="columnStyle('required')">
            <col :style="columnStyle('writeTarget')">
          </colgroup>
          <thead>
            <tr>
              <th aria-label="Selection"></th>
              <th v-if="!structureColumnsCollapsed" class="file-structure-shell__colhead--structure">
                <div class="file-structure-shell__header-cell">
                  <span>L2 Key</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize L2 Section column"
                    @pointerdown.prevent="startColumnResize('l2Section', $event)"
                  />
                </div>
              </th>
              <th v-if="!structureColumnsCollapsed" class="file-structure-shell__colhead--structure">
                <div class="file-structure-shell__header-cell">
                  <span>L2 Sub</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize L2 Sub column"
                    @pointerdown.prevent="startColumnResize('l2Sub', $event)"
                  />
                </div>
              </th>
              <th v-if="!structureColumnsCollapsed" class="file-structure-shell__colhead--structure">
                <div class="file-structure-shell__header-cell">
                  <span>L3 Key</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize L3 Key column"
                    @pointerdown.prevent="startColumnResize('l3Key', $event)"
                  />
                </div>
              </th>
              <th v-if="!structureColumnsCollapsed" class="file-structure-shell__colhead--structure">
                <div class="file-structure-shell__header-cell">
                  <span>Order</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize structure order column"
                    @pointerdown.prevent="startColumnResize('structureOrder', $event)"
                  />
                </div>
              </th>
              <th>
                <div class="file-structure-shell__label-header">
                  <button
                    type="button"
                    class="file-structure-shell__column-collapse-button"
                    :aria-label="structureColumnsCollapsed ? 'Expand structure columns' : 'Collapse structure columns'"
                    @click="structureColumnsCollapsed = !structureColumnsCollapsed"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="file-structure-shell__column-collapse-icon">
                      <path :d="structureColumnsCollapsed ? 'M14 7L9 12L14 17' : 'M10 7L15 12L10 17'" />
                    </svg>
                  </button>
                  <span>Label</span>
                </div>
                <button
                  type="button"
                  class="file-structure-shell__column-resizer"
                  aria-label="Resize label column"
                  @pointerdown.prevent="startColumnResize('label', $event)"
                />
              </th>
              <th class="file-structure-shell__colhead--data">
                <div class="file-structure-shell__header-cell">
                  <span>Type</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize type column"
                    @pointerdown.prevent="startColumnResize('type', $event)"
                  />
                </div>
              </th>
              <th class="file-structure-shell__colhead--data">
                <div class="file-structure-shell__header-cell">
                  <span>Visible</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize visible column"
                    @pointerdown.prevent="startColumnResize('visible', $event)"
                  />
                </div>
              </th>
              <th class="file-structure-shell__colhead--data">
                <div class="file-structure-shell__header-cell">
                  <span>Required</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize required column"
                    @pointerdown.prevent="startColumnResize('required', $event)"
                  />
                </div>
              </th>
              <th class="file-structure-shell__colhead--data">
                <div class="file-structure-shell__header-cell">
                  <span>Write Target / Alias</span>
                  <button
                    type="button"
                    class="file-structure-shell__column-resizer"
                    aria-label="Resize write target column"
                    @pointerdown.prevent="startColumnResize('writeTarget', $event)"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="token in activeLeafTokens" :key="token.key">
              <td>
                <SettingsCheckbox
                  :model-value="selectedLeafKeys.includes(token.key)"
                  tone="light"
                  @update:model-value="toggleLeafSelection(token.key)"
                />
              </td>
              <td v-if="!structureColumnsCollapsed" class="file-structure-shell__cell--structure">{{ token.parentL2 }}</td>
              <td v-if="!structureColumnsCollapsed" class="file-structure-shell__cell--structure">{{ token.parentSubgroup }}</td>
              <td v-if="!structureColumnsCollapsed" class="file-structure-shell__cell--l3-key">{{ token.key }}</td>
              <td v-if="!structureColumnsCollapsed" class="file-structure-shell__cell--structure">{{ token.order }}</td>
              <td class="file-structure-shell__cell--label">{{ token.label }}</td>
              <td class="file-structure-shell__cell--data">{{ token.type }}</td>
              <td class="file-structure-shell__cell--data">{{ token.visible }}</td>
              <td class="file-structure-shell__cell--data">
                <SettingsCheckbox
                  :model-value="token.required"
                  tone="light"
                  @update:model-value="toggleRequiredField(token.key, $event)"
                />
              </td>
              <td class="file-structure-shell__cell--data">{{ token.writeTarget }}</td>
            </tr>
            <tr v-if="!activeLeafTokens.length">
              <td :colspan="structureColumnsCollapsed ? 5 : 9" class="file-structure-shell__leaf-empty">No leaf items declared for this selection.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DialogShellFrame>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import L2SettingsMenu from 'src/components/L2SettingsMenu.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import MainMenuSubgroupRow from 'src/components/MainMenuSubgroupRow.vue'
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
import SectionTabs from 'src/components/SectionTabs.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
import { buildDialogSectionGroups, groupDialogLevel2Sections, splitDialogSections } from 'src/utils/dialogShellPayload'
import { LEVEL_2_FILE_REGISTRY_BY_KEY, LEVEL_3_FILE_REGISTRY_BY_KEY, getCanonicalTokenWriteTarget, getRegistryTitleTokenForSource } from 'src/utils/structureRegistry'

const props = defineProps({
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:shellSelectorValue'])
const FILE_GUIDE_DOC_URL = 'file:///C:/Users/erikc/Coding_Repository/ec-vc/docs/001/Active/001-Files.md'

const shellSelectorOpen = ref(false)
const shellSelectorButton = ref(null)
const shellSelectorMenu = ref(null)
const activeL2Toolbar = ref('')
const activeEventsTab = ref('notes')
const latestNotesBySource = ref({})
const boxesCollapsed = ref(false)
const leafItemsCollapsed = ref(false)
const structureColumnsCollapsed = ref(false)
const activeSubgroupKey = ref('')
const draftLeafRowsBySource = ref({})
const selectedLeafKeysBySource = ref({})
const expandedSettingsGroupsBySource = ref({})
const checkedSettingsItemsBySource = ref({})
const requiredFieldKeysBySource = ref({})
const columnWidths = reactive({
  select: 42,
  l2Section: 92,
  l2Sub: 78,
  l3Key: 108,
  structureOrder: 54,
  label: 180,
  type: 76,
  visible: 72,
  required: 84,
  writeTarget: 220,
})
const activeColumnResize = ref(null)
const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]
const eventsTabs = [
  { key: 'notes', label: 'Notes' },
  { key: 'feed', label: 'Feed' },
  { key: 'parameters', label: 'Parameters' },
]
const activeShellSelectorOption = computed(() =>
  props.shellSelectorOptions.find((option) => option.value === props.shellSelectorValue)
  || props.shellSelectorOptions[0]
  || { value: '', label: 'Select File' },
)
const activeSettingsSourceKey = computed(() => activeShellSelectorOption.value.value || 'selected-file')
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSettingsSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSettingsSourceKey.value] || [])
const groupedLevel2Sections = computed(() => groupDialogLevel2Sections(level2Sections.value))
const dialogSectionGroups = computed(() =>
  buildDialogSectionGroups({
    groupedSections: groupedLevel2Sections.value,
    tokenFilter: (section) => level3Tokens.value.filter((token) => token.parentKey === section.key),
  }),
)
const dialogSectionSplit = computed(() => splitDialogSections(dialogSectionGroups.value))
function isRelationshipSectionLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'kdb' || normalized === 'ldb'
}
const l2ToolbarItems = computed(() => [
  ...dialogSectionSplit.value.leftSections.map((section) => ({
    value: section.key,
    title: section.label,
    isKdb: false,
    isSystem: false,
    pushRight: false,
  })),
  ...dialogSectionSplit.value.rightSections.map((section, index) => {
    const normalized = String(section.rawLabel || section.label || '').trim().toLowerCase()
    return {
      value: section.key,
      title: section.label,
      isKdb: isRelationshipSectionLabel(normalized),
      isSystem: normalized === 'system',
      pushRight: index === 0,
    }
  }),
])
const activeSettingsSection = computed(
  () => dialogSectionGroups.value.find((section) => section.key === activeL2Toolbar.value) || dialogSectionGroups.value[0] || null,
)
const generalElementSettingsTitle = computed(() => 'General')
const baseSettingsGroups = computed(() => {
  if (!activeSettingsSection.value) return []

  const subgroupSource = Array.isArray(activeSettingsSection.value.subgroups) && activeSettingsSection.value.subgroups.length
    ? activeSettingsSection.value.subgroups.map((subgroup) => ({
      key: subgroup.key,
      label: subgroup.label,
      tokens: Array.isArray(subgroup.tokens) ? subgroup.tokens : [],
    }))
    : [{
      key: activeSettingsSection.value.key,
      label: activeSettingsSection.value.label,
      tokens: Array.isArray(activeSettingsSection.value.tokens) ? activeSettingsSection.value.tokens : [],
    }]

  return subgroupSource.map((group) => ({
    key: group.key,
    label: group.label,
    items: group.tokens.map((token) => ({
      key: token.key,
      label: token.label,
    })),
  }))
})
const liveGeneralElementSettingsGroups = computed(() => {
  const expandedKeys = new Set(expandedSettingsGroupsBySource.value[activeSettingsSourceKey.value] || [])
  const checkedItems = checkedSettingsItemsBySource.value[activeSettingsSourceKey.value] || {}
  return baseSettingsGroups.value.map((group) => ({
    key: group.key,
    label: group.label,
    expanded: expandedKeys.has(group.key),
    items: group.items.map((item) => ({
      ...item,
      checked: checkedItems[item.key] !== false,
    })),
  }))
})
const selectedGeneralElementItems = computed(() =>
  liveGeneralElementSettingsGroups.value.flatMap((group) =>
    group.items
      .filter((item) => item.checked !== false)
      .map((item) => ({
        key: item.key,
        label: item.label,
        groupLabel: group.label,
      })),
  ),
)
const selectedSystemItems = computed(() => {
  const checkedItems = checkedSettingsItemsBySource.value[activeSettingsSourceKey.value] || {}
  const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
  return level3Tokens.value
    .filter((token) => checkedItems[token.key] !== false)
    .map((token) => ({
      key: token.key,
      label: token.label || '—',
      alias: token.dbFieldAliases?.length ? token.dbFieldAliases.join(', ') : '—',
      type: token.tokenType || '—',
      required: requiredKeys.has(token.key),
    }))
})
const latestNotes = computed(() => latestNotesBySource.value[activeSettingsSourceKey.value] || [])
const subgroupTabs = computed(() =>
  (Array.isArray(activeSettingsSection.value?.subgroups) ? activeSettingsSection.value.subgroups : []).map((group) => ({
    key: group.key,
    label: group.label,
  })),
)
const activeLeafTokens = computed(() => {
  const subgroupMap = new Map(
    (Array.isArray(activeSettingsSection.value?.subgroups) ? activeSettingsSection.value.subgroups : []).map((group) => [group.key, group]),
  )
  const sourceTokens = subgroupTabs.value.length
    ? (subgroupMap.get(activeSubgroupKey.value)?.tokens || [])
    : (Array.isArray(activeSettingsSection.value?.tokens) ? activeSettingsSection.value.tokens : [])
  const draftTokens = draftLeafRowsBySource.value[activeSettingsSourceKey.value] || []
  const tokens = [...draftTokens, ...sourceTokens]

  return tokens.map((token, index) => {
    const checkedItems = checkedSettingsItemsBySource.value[activeSettingsSourceKey.value] || {}
    const requiredKeys = new Set(requiredFieldKeysBySource.value[activeSettingsSourceKey.value] || [])
    const writeTarget = token.isDraft ? null : getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
    return {
      key: token.key || '—',
      label: token.label || '—',
      parentL2: token.parentLabel || activeSettingsSection.value?.label || '—',
      parentSubgroup: token.draftParentSubgroup || subgroupMap.get(activeSubgroupKey.value)?.label || '—',
      type: token.tokenType || '—',
      visible: checkedItems[token.key] !== false ? 'Yes' : 'No',
      required: requiredKeys.has(token.key),
      editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
      relationshipMeaning: token.relationshipGroup || '—',
      writeTarget: writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '—',
      order: token.level_3 || String(index + 1),
      uiTreatment: token.tokenType || token.optionList || token.optionSource || '—',
    }
  })
})
const selectedLeafKeys = computed(() => selectedLeafKeysBySource.value[activeSettingsSourceKey.value] || [])

function columnStyle(columnKey) {
  const width = columnWidths[columnKey]
  return width ? { width: `${width}px`, minWidth: `${width}px` } : {}
}

function selectShellSelectorOption(value) {
  emit('update:shellSelectorValue', value)
  shellSelectorOpen.value = false
}

function openFileGuideDoc() {
  if (typeof window === 'undefined') return
  window.ecvc?.openExternal?.(FILE_GUIDE_DOC_URL)
}

async function loadLatestNotes() {
  if (typeof window === 'undefined') return
  const result = await window.ecvc?.notes?.list?.()
  const rows = Array.isArray(result?.notes) ? result.notes.slice(0, 5) : []
  latestNotesBySource.value = {
    ...latestNotesBySource.value,
    [activeSettingsSourceKey.value]: rows.map((note) => ({
      id: String(note?.id || ''),
      name: String(note?.Note_Name || note?.title || 'Untitled Note'),
      summary: String(note?.Note_Content || '').trim().slice(0, 96) || 'No summary yet.',
    })),
  }
}

function toggleShellSelector() {
  shellSelectorOpen.value = !shellSelectorOpen.value
}

function addLeafElement() {
  const sourceKey = activeSettingsSourceKey.value
  const currentDrafts = draftLeafRowsBySource.value[sourceKey] || []
  const nextIndex = currentDrafts.length + 1
  const nextKey = `${sourceKey}-draft-leaf-${nextIndex}`
  const parentSubgroup = subgroupTabs.value.find((tab) => tab.key === activeSubgroupKey.value)?.label || '—'
  draftLeafRowsBySource.value = {
    ...draftLeafRowsBySource.value,
    [sourceKey]: [
      ...currentDrafts,
      {
        isDraft: true,
        key: nextKey,
        label: `Draft Leaf ${nextIndex}`,
        parentLabel: activeSettingsSection.value?.label || '—',
        tokenType: 'text',
        relationshipGroup: '',
        level_3: String(nextIndex),
        dbFieldAliases: [],
        optionList: '',
        optionSource: '',
        draftParentSubgroup: parentSubgroup,
      },
    ],
  }
  selectedLeafKeysBySource.value = {
    ...selectedLeafKeysBySource.value,
    [sourceKey]: [...selectedLeafKeys.value, nextKey],
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

function toggleSettingsGroup(groupKey) {
  const sourceKey = activeSettingsSourceKey.value
  const current = Array.isArray(expandedSettingsGroupsBySource.value[sourceKey])
    ? expandedSettingsGroupsBySource.value[sourceKey]
    : []
  const next = current.includes(groupKey)
    ? current.filter((key) => key !== groupKey)
    : [...current, groupKey]
  expandedSettingsGroupsBySource.value = {
    ...expandedSettingsGroupsBySource.value,
    [sourceKey]: next,
  }
}

function toggleSettingsItem(itemKey, value) {
  const sourceKey = activeSettingsSourceKey.value
  const current = checkedSettingsItemsBySource.value[sourceKey] || {}
  checkedSettingsItemsBySource.value = {
    ...checkedSettingsItemsBySource.value,
    [sourceKey]: {
      ...current,
      [itemKey]: value,
    },
  }
}

function getDefaultRequiredFieldKeysForSource(sourceKey) {
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const normalizedKey = String(titleToken?.key || '').trim()
  return normalizedKey ? [normalizedKey] : []
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

function startColumnResize(columnKey, event) {
  if (event.button !== 0) return
  activeColumnResize.value = {
    columnKey,
    startX: event.clientX,
    startWidth: columnWidths[columnKey] || 0,
  }
}

function handleColumnResize(event) {
  if (!activeColumnResize.value) return
  const { columnKey, startX, startWidth } = activeColumnResize.value
  columnWidths[columnKey] = Math.max(36, startWidth + (event.clientX - startX))
}

function stopColumnResize() {
  activeColumnResize.value = null
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
  window.addEventListener('pointermove', handleColumnResize)
  window.addEventListener('pointerup', stopColumnResize)
  loadLatestNotes()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
  window.removeEventListener('pointermove', handleColumnResize)
  window.removeEventListener('pointerup', stopColumnResize)
})

watch(
  l2ToolbarItems,
  (items) => {
    if (items.some((item) => item.value === activeL2Toolbar.value)) return
    activeL2Toolbar.value = items[0]?.value || ''
  },
  { immediate: true },
)

watch(
  baseSettingsGroups,
  (groups) => {
    const sourceKey = activeSettingsSourceKey.value
    const groupKeys = groups.map((group) => group.key)
    const existingExpanded = Array.isArray(expandedSettingsGroupsBySource.value[sourceKey])
      ? expandedSettingsGroupsBySource.value[sourceKey].filter((key) => groupKeys.includes(key))
      : []
    const nextExpanded = existingExpanded.length ? existingExpanded : groupKeys

    expandedSettingsGroupsBySource.value = {
      ...expandedSettingsGroupsBySource.value,
      [sourceKey]: nextExpanded,
    }

    const existingChecked = checkedSettingsItemsBySource.value[sourceKey] || {}
    const allowedItemKeys = new Set(groups.flatMap((group) => group.items.map((item) => item.key)))
    const nextChecked = Object.fromEntries(
      Object.entries(existingChecked).filter(([itemKey]) => allowedItemKeys.has(itemKey)),
    )

    checkedSettingsItemsBySource.value = {
      ...checkedSettingsItemsBySource.value,
      [sourceKey]: nextChecked,
    }

    const allowedRequiredKeys = new Set(level3Tokens.value.map((token) => token.key))
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
  subgroupTabs,
  (tabs) => {
    if (tabs.some((tab) => tab.key === activeSubgroupKey.value)) return
    activeSubgroupKey.value = tabs[0]?.key || ''
  },
  { immediate: true },
)

watch(activeSettingsSourceKey, () => {
  loadLatestNotes()
})

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
  grid-template-columns: var(--file-structure-shell-side-column-width) minmax(0, 1fr) var(--file-structure-shell-side-column-width);
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

.file-structure-shell__subgroup-tabs {
  padding-top: 2px;
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

.file-structure-shell__leaf-table {
  width: max-content;
  border-collapse: collapse;
  min-width: 0;
}

.file-structure-shell__leaf-table th,
.file-structure-shell__leaf-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.file-structure-shell__leaf-table th {
  position: relative;
  color: rgba(15, 23, 42, 0.72);
  background: rgba(248, 250, 252, 0.96);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.1;
  white-space: nowrap;
}

.file-structure-shell__header-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.file-structure-shell__label-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.file-structure-shell__column-resizer {
  position: absolute;
  top: 0;
  right: -6px;
  width: 12px;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: col-resize;
}

.file-structure-shell__column-collapse-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.file-structure-shell__column-collapse-icon {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--ds-color-brand-black);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.file-structure-shell__leaf-table td {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.35;
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

.file-structure-shell__cell--l3-key {
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.25;
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__leaf-empty {
  color: rgba(15, 23, 42, 0.6);
  text-align: center;
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

.file-structure-shell__shell-selector :deep(.main-menu-subgroup-row) {
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
