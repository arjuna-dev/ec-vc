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
      <RecordSummaryBox class="file-structure-shell__content-box">
        <div class="file-structure-shell__content-box-title-shell">
          <DialogShellTitleRow
            title="Summary Box"
            class="file-structure-shell__content-box-title"
          />
        </div>
        <div class="file-structure-shell__placeholder-copy">
          File summary content will render here.
        </div>
      </RecordSummaryBox>

      <RecordFieldsBox class="file-structure-shell__content-box">
        <div class="file-structure-shell__content-box-title-row">
          <div class="file-structure-shell__content-box-title-shell">
            <DialogShellTitleRow
              title="General Elements"
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
        <div class="file-structure-shell__placeholder-copy">
          General file properties will render here.
        </div>
      </RecordFieldsBox>

      <RecordFieldsBox class="file-structure-shell__content-box">
        <div class="file-structure-shell__content-box-title-shell">
          <DialogShellTitleRow
            title="Events Feed"
            class="file-structure-shell__content-box-title"
          />
        </div>
        <div class="file-structure-shell__placeholder-copy">
          Event activity will render here.
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
          <thead>
            <tr>
              <th aria-label="Selection"></th>
              <th>Order</th>
              <th>Label</th>
              <th>L3 Key</th>
              <th>Parent L2</th>
              <th>Parent Subgroup</th>
              <th>Type</th>
              <th>Value</th>
              <th>Visible</th>
              <th>Editable</th>
              <th>KDB Meaning</th>
              <th>Write Target / Alias</th>
              <th>Order</th>
              <th>UI Treatment</th>
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
              <td>{{ token.order }}</td>
              <td>{{ token.label }}</td>
              <td>
                {{ token.key }}
              </td>
              <td>{{ token.parentL2 }}</td>
              <td>{{ token.parentSubgroup }}</td>
              <td>{{ token.type }}</td>
              <td>{{ token.value }}</td>
              <td>{{ token.visible }}</td>
              <td>{{ token.editable }}</td>
              <td>{{ token.relationshipMeaning }}</td>
              <td>{{ token.writeTarget }}</td>
              <td>{{ token.order }}</td>
              <td>{{ token.uiTreatment }}</td>
            </tr>
            <tr v-if="!activeLeafTokens.length">
              <td colspan="13" class="file-structure-shell__leaf-empty">No leaf items declared for this selection.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DialogShellFrame>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import { LEVEL_2_FILE_REGISTRY_BY_KEY, LEVEL_3_FILE_REGISTRY_BY_KEY, getCanonicalTokenWriteTarget } from 'src/utils/structureRegistry'

const props = defineProps({
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:shellSelectorValue'])

const shellSelectorOpen = ref(false)
const shellSelectorButton = ref(null)
const shellSelectorMenu = ref(null)
const activeL2Toolbar = ref('')
const boxesCollapsed = ref(false)
const leafItemsCollapsed = ref(false)
const activeSubgroupKey = ref('')
const draftLeafRowsBySource = ref({})
const selectedLeafKeysBySource = ref({})
const expandedSettingsGroupsBySource = ref({})
const checkedSettingsItemsBySource = ref({})
const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
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
const l2ToolbarItems = computed(() => [
  ...dialogSectionSplit.value.leftSections.map((section) => ({
    value: section.key,
    title: section.label,
    isKdb: false,
    isSystem: false,
    pushRight: false,
  })),
  ...dialogSectionSplit.value.rightSections.map((section, index) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    return {
      value: section.key,
      title: section.label,
      isKdb: normalized === 'kdb',
      isSystem: normalized === 'system',
      pushRight: index === 0,
    }
  }),
])
const activeSettingsSection = computed(
  () => dialogSectionGroups.value.find((section) => section.key === activeL2Toolbar.value) || dialogSectionGroups.value[0] || null,
)
const generalElementSettingsTitle = computed(() => `${activeShellSelectorOption.value.label} Settings`)
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
    const writeTarget = token.isDraft ? null : getCanonicalTokenWriteTarget(token, activeShellSelectorOption.value.label, 'id')
    return {
      key: token.key || '—',
      label: token.label || '—',
      parentL2: token.parentLabel || activeSettingsSection.value?.label || '—',
      parentSubgroup: token.draftParentSubgroup || subgroupMap.get(activeSubgroupKey.value)?.label || '—',
      type: token.tokenType || '—',
      value: '—',
      visible: checkedItems[token.key] !== false ? 'Yes' : 'No',
      editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
      relationshipMeaning: token.relationshipGroup || '—',
      writeTarget: writeTarget?.fieldName ? `${writeTarget.tableName}.${writeTarget.fieldName}` : token.dbFieldAliases?.join(', ') || '—',
      order: token.level_3 || String(index + 1),
      uiTreatment: token.tokenType || token.optionList || token.optionSource || '—',
    }
  })
})
const selectedLeafKeys = computed(() => selectedLeafKeysBySource.value[activeSettingsSourceKey.value] || [])

function selectShellSelectorOption(value) {
  emit('update:shellSelectorValue', value)
  shellSelectorOpen.value = false
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
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
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

</script>

<style scoped>
.file-structure-shell {
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.file-structure-shell__content-box-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
}

.file-structure-shell__content-box-title-shell {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--ds-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
}

.file-structure-shell__content-box-title-shell--menu {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border-color: transparent;
  background: transparent;
}

.file-structure-shell__content-box-title {
  padding-bottom: 0;
}

.file-structure-shell__content-box-title:deep(.dialog-shell-title-row__title) {
  font-size: var(--ds-font-size-base);
  line-height: 1;
}

.file-structure-shell__placeholder-copy {
  color: rgba(15, 23, 42, 0.74);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-body-md);
  line-height: 1.45;
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
  width: 100%;
  border-collapse: collapse;
  min-width: 1280px;
}

.file-structure-shell__leaf-table th,
.file-structure-shell__leaf-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.file-structure-shell__leaf-table th {
  color: rgba(15, 23, 42, 0.72);
  background: rgba(248, 250, 252, 0.96);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.1;
  white-space: nowrap;
}

.file-structure-shell__leaf-table td {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.35;
}

.file-structure-shell__leaf-table td:nth-child(n + 4) {
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
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
