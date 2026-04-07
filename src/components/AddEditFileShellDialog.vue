<template>
  <q-dialog v-model="open">
    <DialogShellFrame
      card-class="file-structure-shell"
      header-class="file-structure-shell__header"
      body-class="file-structure-shell__body"
      footer-class="file-structure-shell__actions"
    >
      <template #header>
        <div class="file-structure-shell__header-copy">
          <div class="file-structure-shell__title-row">
            <div class="file-structure-shell__title">Add/Edit File Shell</div>
            <div v-if="shellSelectorOptions.length" class="file-structure-shell__shell-selector">
              <q-select
                :model-value="shellSelectorValue"
                dense
                dark
                options-dark
                borderless
                emit-value
                map-options
                hide-bottom-space
                hide-dropdown-icon
                :options="shellSelectorOptions"
                popup-content-class="file-structure-shell__shell-selector-menu"
                class="file-structure-shell__shell-selector-control"
                @update:model-value="emit('update:shellSelectorValue', $event)"
              >
                <template #selected-item="scope">
                  <span class="file-structure-shell__shell-selector-value">{{ scope.opt.label }}</span>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" class="file-structure-shell__shell-selector-option">
                    <q-item-section>
                      <span class="file-structure-shell__shell-selector-option-label">{{ scope.opt.label }}</span>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </template>

      <template #default>
        <div class="file-structure-shell__section-stack">
          <section class="file-structure-shell__group">
            <div class="file-structure-shell__group-head">
              <button
                type="button"
                class="file-structure-shell__group-toggle"
                @click="sectionConfigurationCollapsed = !sectionConfigurationCollapsed"
              >
                <span class="file-structure-shell__group-title">Section Configuration</span>
                <q-icon
                  :name="sectionConfigurationCollapsed ? 'expand_more' : 'expand_less'"
                  class="file-structure-shell__group-toggle-icon"
                />
              </button>
            </div>

            <div v-if="!sectionConfigurationCollapsed" class="file-structure-shell__group-body">
              <div v-if="!canConfigureFileSystem" class="file-structure-shell__owner-note">
                This menu configuration is only available for File System owner.
              </div>
              <div class="file-structure-shell__table-shell">
                <div
                  class="file-structure-shell__table-wrap"
                >
                  <table class="file-structure-shell__table">
                  <thead>
                    <tr>
                      <th>Sections</th>
                      <th
                        v-for="column in sectionConfigurationColumns"
                        :key="column.id"
                        class="file-structure-shell__dynamic-column-head"
                        :class="{ 'file-structure-shell__dynamic-column-head--summary': column.id === 'summary' }"
                      >
                        <div class="file-structure-shell__column-head-inner">
                          <input
                            v-if="column.isEditing"
                            v-model="column.label"
                            type="text"
                            class="file-structure-shell__column-input"
                            @blur="finishColumnEdit(column.id)"
                            @keydown.enter.prevent="finishColumnEdit(column.id)"
                          />
                          <span v-else>{{ column.label }}</span>
                          <button
                            v-if="canConfigureFileSystem && column.deletable"
                            type="button"
                            class="file-structure-shell__delete-btn"
                            @click="removeSectionConfigurationColumn(column.id)"
                          >
                            <q-icon name="close" />
                          </button>
                        </div>
                      </th>
                      <th class="file-structure-shell__add-column-head">
                        <button
                          :disabled="!canConfigureFileSystem"
                          type="button"
                          class="file-structure-shell__add-column-btn"
                          @click="addSectionConfigurationColumn"
                        >
                          <q-icon name="add" />
                          <q-tooltip class="file-structure-shell__action-tooltip">Add Parameter</q-tooltip>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in sectionConfigurationRows" :key="row.key">
                      <td class="file-structure-shell__row-head">
                        <div class="file-structure-shell__row-head-inner">
                          <input
                            v-if="row.isEditing"
                            v-model="row.label"
                            type="text"
                            class="file-structure-shell__row-input"
                            @blur="finishRowEdit(row.key)"
                            @keydown.enter.prevent="finishRowEdit(row.key)"
                          />
                          <span v-else>{{ row.label }}</span>
                          <button
                            v-if="canConfigureFileSystem && row.deletable"
                            type="button"
                            class="file-structure-shell__delete-btn"
                            @click="removeSectionConfigurationRow(row.key)"
                          >
                            <q-icon name="close" />
                          </button>
                        </div>
                      </td>
                      <td
                        v-for="column in sectionConfigurationColumns"
                        :key="`${row.key}:${column.id}`"
                        class="file-structure-shell__table-cell"
                        :class="{ 'file-structure-shell__table-cell--summary': column.id === 'summary' }"
                      >
                        <div class="file-structure-shell__table-cell-surface" />
                      </td>
                      <td class="file-structure-shell__add-column-spacer" />
                    </tr>
                    <tr>
                      <td class="file-structure-shell__add-row-cell">
                        <button
                          :disabled="!canConfigureFileSystem"
                          type="button"
                          class="file-structure-shell__add-row-btn"
                          @click="addSectionConfigurationRow"
                        >
                          <q-icon name="add" />
                          <q-tooltip class="file-structure-shell__action-tooltip">Add Section</q-tooltip>
                        </button>
                      </td>
                      <td
                        v-for="column in sectionConfigurationColumns"
                        :key="`add-row:${column.id}`"
                        class="file-structure-shell__add-row-spacer"
                      />
                      <td class="file-structure-shell__add-column-spacer" />
                    </tr>
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section class="file-structure-shell__group">
            <div class="file-structure-shell__group-head">
              <button
                type="button"
                class="file-structure-shell__group-toggle"
                @click="dataStructureCollapsed = !dataStructureCollapsed"
              >
                <span class="file-structure-shell__group-title">Data Structure</span>
                <q-icon
                  :name="dataStructureCollapsed ? 'expand_more' : 'expand_less'"
                  class="file-structure-shell__group-toggle-icon"
                />
              </button>
              <button
                v-if="canConfigureFileSystem"
                type="button"
                class="file-structure-shell__section-picker"
                @click.stop="sectionPickerOpen = true"
              >
                <span class="file-structure-shell__section-picker-label">{{ activeSectionOption.label }}</span>
                <q-icon name="expand_more" class="file-structure-shell__section-picker-icon" />
                <q-menu
                  v-model="sectionPickerOpen"
                  anchor="bottom right"
                  self="top right"
                  class="file-structure-shell__section-picker-menu"
                >
                  <div class="file-structure-shell__section-menu">
                    <section
                      v-for="group in sectionOptionGroups"
                      :key="group.id"
                      class="file-structure-shell__section-menu-group"
                    >
                      <button
                        type="button"
                        class="file-structure-shell__section-menu-toggle"
                        @click.stop="toggleSectionGroup(group.id)"
                      >
                        <span class="file-structure-shell__section-menu-title">{{ group.label }}</span>
                        <q-icon
                          :name="isSectionGroupOpen(group.id) ? 'expand_less' : 'expand_more'"
                          class="file-structure-shell__section-menu-chevron"
                        />
                      </button>

                      <div v-if="isSectionGroupOpen(group.id)" class="file-structure-shell__section-menu-items">
                        <button
                          v-for="option in group.items"
                          :key="option.value"
                          type="button"
                          class="file-structure-shell__section-menu-item"
                          :class="{ 'file-structure-shell__section-menu-item--active': activeSectionSelection === option.value }"
                          @click.stop="selectSectionOption(option.value)"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </section>
                  </div>
                </q-menu>
              </button>
            </div>

            <div v-if="!dataStructureCollapsed" class="file-structure-shell__group-body">
              <div class="file-structure-shell__grid">
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">Core Structure</div>
                  <div class="file-structure-shell__field-surface file-structure-shell__field-surface--tall" />
                </div>
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">Relations and Payloads</div>
                  <div class="file-structure-shell__field-surface file-structure-shell__field-surface--tall" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <template #footer>
        <DialogShellFooter
          :save-disabled="true"
          @cancel="emit('requestClose')"
        />
      </template>
    </DialogShellFrame>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import DialogShellFooter from 'src/components/DialogShellFooter.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
  canConfigureFileSystem: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:shellSelectorValue', 'requestClose'])

const sectionConfigurationCollapsed = ref(false)
const dataStructureCollapsed = ref(false)
const sectionPickerOpen = ref(false)
const activeSectionSelection = ref('general')
const openSectionGroups = ref(['system-created'])
const nextSectionRowId = ref(2)
const sectionConfigurationRows = ref([
  { key: 'system', label: 'System', isEditing: false, deletable: false },
  { key: 'kdb', label: 'KDB', isEditing: false, deletable: false },
  { key: 'general', label: 'General', isEditing: false, deletable: false },
])
const nextSectionColumnId = ref(2)
const sectionConfigurationColumns = ref([
  { id: 'summary', label: 'Description / Summary', isEditing: false, deletable: false },
])

const sectionOptionGroups = [
  {
    id: 'system-created',
    label: 'System Created',
    items: [
      { value: 'general', label: 'General' },
      { value: 'system', label: 'System' },
      { value: 'kdb', label: 'KDB' },
    ],
  },
  {
    id: 'user-created',
    label: 'User Created',
    items: [
      { value: 'summary', label: 'Summary' },
      { value: 'workflow', label: 'Workflow' },
      { value: 'resources', label: 'Resources' },
    ],
  },
]

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeSectionOption = computed(() =>
  sectionOptionGroups.flatMap((group) => group.items).find((option) => option.value === activeSectionSelection.value)
  || sectionOptionGroups[0].items[0],
)

const canConfigureFileSystem = computed(() => props.canConfigureFileSystem)

function isSectionGroupOpen(groupId) {
  return openSectionGroups.value.includes(groupId)
}

function toggleSectionGroup(groupId) {
  if (!canConfigureFileSystem.value) return
  openSectionGroups.value = isSectionGroupOpen(groupId)
    ? openSectionGroups.value.filter((value) => value !== groupId)
    : [...openSectionGroups.value, groupId]
}

function selectSectionOption(value) {
  if (!canConfigureFileSystem.value) return
  activeSectionSelection.value = value
  sectionPickerOpen.value = false
}

function addSectionConfigurationColumn() {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationColumns.value = [
    ...sectionConfigurationColumns.value,
    {
      id: `custom-${nextSectionColumnId.value}`,
      label: '',
      isEditing: true,
      deletable: true,
    },
  ]
  nextSectionColumnId.value += 1
}

function finishColumnEdit(columnId) {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationColumns.value = sectionConfigurationColumns.value.map((column) => {
    if (column.id !== columnId) return column
    const nextLabel = String(column.label || '').trim() || 'New Column'
    return { ...column, label: nextLabel, isEditing: false }
  })
}

function removeSectionConfigurationColumn(columnId) {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationColumns.value = sectionConfigurationColumns.value.filter((column) => column.id !== columnId)
}

function addSectionConfigurationRow() {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationRows.value = [
    ...sectionConfigurationRows.value,
    {
      key: `custom-row-${nextSectionRowId.value}`,
      label: '',
      isEditing: true,
      deletable: true,
    },
  ]
  nextSectionRowId.value += 1
}

function finishRowEdit(rowKey) {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationRows.value = sectionConfigurationRows.value.map((row) => {
    if (row.key !== rowKey) return row
    const nextLabel = String(row.label || '').trim() || 'New Sub-Section'
    return { ...row, label: nextLabel, isEditing: false }
  })
}

function removeSectionConfigurationRow(rowKey) {
  if (!canConfigureFileSystem.value) return
  sectionConfigurationRows.value = sectionConfigurationRows.value.filter((row) => row.key !== rowKey)
}
</script>

<style scoped>
.file-structure-shell {
  width: min(1240px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 249, 252, 0.98));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
}

.file-structure-shell__header {
  padding: 26px 28px 20px;
}

.file-structure-shell__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.file-structure-shell__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 2.6vw, 2.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.file-structure-shell__shell-selector {
  min-width: 200px;
  padding: 0 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #111827;
}

.file-structure-shell__shell-selector-control {
  min-height: 40px;
}

.file-structure-shell__shell-selector-control :deep(.q-field__control) {
  min-height: 40px;
}

.file-structure-shell__shell-selector-value,
.file-structure-shell__shell-selector-option-label {
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.file-structure-shell__body {
  padding: 0 28px 20px;
}

.file-structure-shell__section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-structure-shell__group {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  overflow: hidden;
}

.file-structure-shell__group-head {
  display: flex;
  align-items: center;
  gap: 20px;
}

.file-structure-shell__group-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  padding: 18px 0 18px 22px;
  color: #0f172a;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.file-structure-shell__group-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__group-toggle-icon {
  margin-left: 2px;
  font-size: 20px;
}

.file-structure-shell__section-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  margin: 0;
  color: #fff;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 8px;
  cursor: pointer;
}

.file-structure-shell__section-picker-label {
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: 0.02em;
}

.file-structure-shell__section-picker-icon {
  font-size: 16px;
}

.file-structure-shell__section-menu {
  min-width: 230px;
  padding: 10px;
  background: #111827;
  border-radius: 14px;
}

.file-structure-shell__section-menu-group + .file-structure-shell__section-menu-group {
  margin-top: 8px;
}

.file-structure-shell__section-menu-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 4px;
  color: #fff;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.file-structure-shell__section-menu-title {
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__section-menu-chevron {
  font-size: 16px;
}

.file-structure-shell__section-menu-items {
  display: grid;
  gap: 4px;
  padding-top: 4px;
}

.file-structure-shell__section-menu-item {
  width: 100%;
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
  cursor: pointer;
}

.file-structure-shell__section-menu-item--active {
  color: #111827;
  background: #fff;
  border-color: #fff;
}

.file-structure-shell__group-body {
  padding: 0 22px 22px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.file-structure-shell__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding-top: 18px;
}

.file-structure-shell__table-shell {
  position: relative;
  width: fit-content;
  max-width: 100%;
  padding-top: 18px;
}

.file-structure-shell__table-wrap {
  width: 100%;
  max-width: 100%;
  max-height: 320px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #111111 transparent;
}

.file-structure-shell__table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.file-structure-shell__table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.file-structure-shell__table-wrap::-webkit-scrollbar-thumb {
  background: #111111;
  border-radius: 999px;
}

.file-structure-shell__owner-note {
  padding-top: 18px;
  color: rgba(15, 23, 42, 0.62);
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: var(--font-weight-black);
  line-height: 1.2;
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
