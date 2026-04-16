<template>
  <SharedRowSurfaceTable
    v-if="mode === 'views'"
    column-width-key="governance:views"
    :columns="resolvedViewSurfaceColumns"
    :rows="resolvedViewSurfaceRows"
    :empty-label="emptyViewsLabel"
    @cell-click="handleViewSurfaceCellClick"
    @cell-dblclick="handleViewSurfaceCellDblclick"
  >
    <template #head="{ column }">
      <SettingsCheckbox
        v-if="column.key === '__select__' && showSelectAllHeader"
        :model-value="selectAllChecked"
        :indeterminate="selectAllIndeterminate"
        tone="light"
        @update:model-value="$emit('toggle-select-all', $event)"
      />
    </template>
    <template #cell="{ row, column }">
      <SettingsCheckbox
        v-if="column.key === '__select__'"
        :model-value="Boolean(row.selected)"
        tone="light"
        @update:model-value="$emit('toggle-view-select', row.key, $event)"
      />
      <input
        v-else-if="isViewCellEditing(row.key, column.key)"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input"
        type="text"
        @input="editingCellValue = $event.target.value"
        @blur="commitViewCellEdit(row.key, column.key, $event.target.value)"
        @keydown.enter.prevent="commitViewCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      >
      <span v-else>{{ row[column.key] }}</span>
    </template>
  </SharedRowSurfaceTable>

  <SharedRowSurfaceTable
    v-else-if="mode === 'tokens'"
    column-width-key="governance:tokens"
    :columns="resolvedTokenSurfaceColumns"
    :rows="resolvedTokenSurfaceRows"
    :empty-label="emptyTokensLabel"
    @cell-click="handleTokenSurfaceCellClick"
    @cell-dblclick="handleTokenSurfaceCellDblclick"
  >
    <template #head="{ column }">
      <SettingsCheckbox
        v-if="column.key === '__select__' && showSelectAllHeader"
        :model-value="selectAllChecked"
        :indeterminate="selectAllIndeterminate"
        tone="light"
        @update:model-value="$emit('toggle-select-all', $event)"
      />
    </template>
    <template #cell="{ row, column }">
      <SettingsCheckbox
        v-if="column.key === '__select__'"
        :model-value="selectedTokenKeySet.has(row.key)"
        tone="light"
        @update:model-value="$emit('toggle-token-select', row.key, $event)"
      />
      <SettingsCheckbox
        v-else-if="column.kind === 'checkbox'"
        :model-value="Boolean(row[column.key])"
        tone="light"
        @update:model-value="$emit('toggle-required', row.key, $event)"
      />
      <select
        v-else-if="isTokenCellEditing(row.key, column.key) && column.kind === 'select'"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input"
        @blur="commitTokenCellEdit(row.key, column.key, $event.target.value)"
        @change="commitTokenCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      >
        <option
          v-for="option in column.options || []"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <textarea
        v-else-if="isTokenCellEditing(row.key, column.key) && column.kind === 'textarea'"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input structure-governance-panel__cell-input--textarea"
        @input="editingCellValue = $event.target.value"
        @blur="commitTokenCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      />
      <input
        v-else-if="isTokenCellEditing(row.key, column.key)"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input"
        type="text"
        @input="editingCellValue = $event.target.value"
        @blur="commitTokenCellEdit(row.key, column.key, $event.target.value)"
        @keydown.enter.prevent="commitTokenCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      >
      <span v-else>{{ row[column.key] }}</span>
    </template>
  </SharedRowSurfaceTable>

  <SharedRowSurfaceTable
    v-else-if="mode === 'data'"
    column-width-key="governance:data"
    :columns="resolvedDataSurfaceColumns"
    :rows="resolvedDataSurfaceRows"
    :empty-label="emptyDataLabel"
    @cell-dblclick="handleDataSurfaceCellDblclick"
  >
    <template #head="{ column }">
      <SettingsCheckbox
        v-if="column.key === '__select__' && showSelectAllHeader"
        :model-value="selectAllChecked"
        :indeterminate="selectAllIndeterminate"
        tone="light"
        @update:model-value="$emit('toggle-select-all', $event)"
      />
    </template>
    <template #cell="{ row, column }">
      <SettingsCheckbox
        v-if="column.key === '__select__'"
        :model-value="selectedRowKeySet.has(row.key)"
        tone="light"
        @update:model-value="$emit('toggle-data-select', row.key, $event)"
      />
      <SettingsCheckbox
        v-else-if="column.kind === 'checkbox'"
        :model-value="Boolean(row[column.key])"
        tone="light"
        @update:model-value="$emit('update-data-cell', row.key, column.key, $event)"
      />
      <select
        v-else-if="isDataCellEditing(row.key, column.key) && column.kind === 'select'"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input"
        @blur="commitDataCellEdit(row.key, column.key, $event.target.value)"
        @change="commitDataCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      >
        <option
          v-for="option in column.options || []"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <textarea
        v-else-if="isDataCellEditing(row.key, column.key) && column.kind === 'textarea'"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input structure-governance-panel__cell-input--textarea"
        @input="editingCellValue = $event.target.value"
        @blur="commitDataCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      />
      <input
        v-else-if="isDataCellEditing(row.key, column.key)"
        ref="editingInput"
        :value="editingCellValue"
        class="structure-governance-panel__cell-input"
        type="text"
        @input="editingCellValue = $event.target.value"
        @blur="commitDataCellEdit(row.key, column.key, $event.target.value)"
        @keydown.enter.prevent="commitDataCellEdit(row.key, column.key, $event.target.value)"
        @keydown.esc.prevent="cancelDataCellEdit"
      >
      <span v-else>{{ row[column.key] }}</span>
    </template>
  </SharedRowSurfaceTable>
</template>

<script setup>
import { nextTick, ref, computed } from 'vue'
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
import SharedRowSurfaceTable from 'src/components/SharedRowSurfaceTable.vue'

defineOptions({ name: 'StructureGovernancePanel' })

const emit = defineEmits([
  'toggle-required',
  'toggle-token-select',
  'toggle-view-select',
  'toggle-data-select',
  'toggle-select-all',
  'update-view-cell',
  'update-data-cell',
  'update-token-cell',
])

const props = defineProps({
  mode: { type: String, default: 'views' },
  viewRows: { type: Array, default: () => [] },
  tokenGroups: { type: Array, default: () => [] },
  dataColumns: { type: Array, default: () => [] },
  dataRows: { type: Array, default: () => [] },
  selectedRowKeys: { type: Array, default: () => [] },
  selectedTokenKeys: { type: Array, default: () => [] },
  showWriteTarget: { type: Boolean, default: false },
  interactiveRequired: { type: Boolean, default: false },
  emptyViewsLabel: { type: String, default: 'No views declared.' },
  emptyTokensLabel: { type: String, default: 'No tokens declared.' },
  emptyDataLabel: { type: String, default: 'No rows declared.' },
  tokenColumns: { type: Array, default: () => [] },
  hideViewColumn: { type: Boolean, default: false },
  showSelectAllHeader: { type: Boolean, default: false },
  selectAllChecked: { type: Boolean, default: false },
  selectAllIndeterminate: { type: Boolean, default: false },
})

const editingCell = ref({ rowKey: '', columnKey: '' })
const editingCellValue = ref('')
const editingInput = ref(null)
const selectedRowKeySet = computed(() => new Set((Array.isArray(props.selectedRowKeys) ? props.selectedRowKeys : []).map((key) => String(key || '').trim())))
const selectedTokenKeySet = computed(() => new Set((Array.isArray(props.selectedTokenKeys) ? props.selectedTokenKeys : []).map((key) => String(key || '').trim())))
const resolvedViewSurfaceColumns = computed(() => [
  { key: '__select__', label: '', width: 22, isControl: true },
  ...(props.hideViewColumn ? [] : [{ key: '__view__', label: '', width: 22, isControl: true }]),
  { key: 'label', label: 'Name', width: 180, isPrimary: true },
  { key: 'side', label: 'Side', width: 84 },
  { key: 'tokenCount', label: 'Tokens', width: 84 },
])
const resolvedViewSurfaceRows = computed(() =>
  (Array.isArray(props.viewRows) ? props.viewRows : []).map((row) => ({
    ...row,
    editableColumns: Array.isArray(row?.editableColumns) ? row.editableColumns : ['label'],
  })),
)
const resolvedTokenRows = computed(() =>
  (Array.isArray(props.tokenGroups) ? props.tokenGroups : []).flatMap((group) => {
    const parentView = String(group?.label || '').trim() || '—'
    return (Array.isArray(group?.tokens) ? group.tokens : []).map((token) => ({
      ...token,
      parentView,
    }))
  }),
)
const resolvedDataSurfaceColumns = computed(() => [
  { key: '__select__', label: '', width: 22, isControl: true },
  ...(props.hideViewColumn ? [] : [{ key: '__view__', label: '', width: 22, isControl: true }]),
  ...(Array.isArray(props.dataColumns) ? props.dataColumns : []),
])
const resolvedDataSurfaceRows = computed(() =>
  (Array.isArray(props.dataRows) ? props.dataRows : []).map((row) => ({
    ...row,
    editableColumns: Array.isArray(row?.editableColumns)
      ? row.editableColumns
      : (Array.isArray(props.dataColumns) ? props.dataColumns : [])
          .filter((column) => isEditableColumn(column))
          .map((column) => column.key),
  })),
)
const resolvedTokenSurfaceColumns = computed(() => [
  { key: '__select__', label: '', width: 22, isControl: true },
  ...(props.hideViewColumn ? [] : [{ key: '__view__', label: '', width: 22, isControl: true }]),
  ...resolvedTokenColumns.value.map((column) => ({
    ...column,
    ...(column.key === 'label'
      ? {
          label: 'Name',
          width: Number(column.width || 180),
          isPrimary: true,
        }
      : {}),
  })),
])
const resolvedTokenSurfaceRows = computed(() =>
  resolvedTokenRows.value.map((row) => ({
    ...row,
    editableColumns: Array.isArray(row?.editableColumns)
      ? row.editableColumns
      : resolvedTokenColumns.value
          .filter((column) => isTokenEditable(column))
          .map((column) => column.key),
  })),
)
const resolvedTokenColumns = computed(() => {
  if (Array.isArray(props.tokenColumns) && props.tokenColumns.length) return props.tokenColumns
  const columns = [
    { key: 'label', label: 'Label', cellClass: 'structure-governance-panel__cell--label' },
    { key: 'type', label: 'Type', cellClass: 'structure-governance-panel__cell--data' },
    { key: 'required', label: 'Required', cellClass: 'structure-governance-panel__cell--data', kind: 'checkbox' },
  ]
  if (props.showWriteTarget) {
    columns.push({ key: 'writeTarget', label: 'Write Target / Alias', cellClass: 'structure-governance-panel__cell--data' })
  }
  return columns
})

function isEditableColumn(column = {}) {
  return Boolean(column?.editable) && column.kind !== 'checkbox'
}

function isViewCellEditing(rowKey = '', columnKey = '') {
  return editingCell.value.rowKey === String(rowKey || '').trim()
    && editingCell.value.columnKey === String(columnKey || '').trim()
}

async function startViewCellEdit(row = {}, column = {}) {
  if (!isEditableColumn(column)) return
  editingCell.value = {
    rowKey: String(row?.key || '').trim(),
    columnKey: String(column?.key || '').trim(),
  }
  editingCellValue.value = row?.[column.key] ?? ''
  await nextTick()
  focusEditingInput()
}

function commitViewCellEdit(rowKey = '', columnKey = '', value = '') {
  emit('update-view-cell', rowKey, columnKey, value)
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
}

function isDataCellEditing(rowKey = '', columnKey = '') {
  return editingCell.value.rowKey === String(rowKey || '').trim()
    && editingCell.value.columnKey === String(columnKey || '').trim()
}

async function startDataCellEdit(row = {}, column = {}) {
  if (!isEditableColumn(column)) return
  editingCell.value = {
    rowKey: String(row?.key || '').trim(),
    columnKey: String(column?.key || '').trim(),
  }
  editingCellValue.value = row?.[column.key] ?? ''
  await nextTick()
  focusEditingInput()
}

function commitDataCellEdit(rowKey = '', columnKey = '', value = '') {
  emit('update-data-cell', rowKey, columnKey, value)
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
}

function isTokenEditable(column = {}) {
  return Boolean(column?.editable) && column.kind !== 'checkbox'
}

function isTokenCellEditing(rowKey = '', columnKey = '') {
  return editingCell.value.rowKey === String(rowKey || '').trim()
    && editingCell.value.columnKey === String(columnKey || '').trim()
}

async function startTokenCellEdit(token = {}, column = {}) {
  if (!isTokenEditable(column)) return
  editingCell.value = {
    rowKey: String(token?.key || '').trim(),
    columnKey: String(column?.key || '').trim(),
  }
  editingCellValue.value = token?.[column.key] ?? ''
  await nextTick()
  focusEditingInput()
}

function commitTokenCellEdit(rowKey = '', columnKey = '', value = '') {
  emit('update-token-cell', rowKey, columnKey, value)
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
}

function handleTokenSurfaceCellDblclick(row, column) {
  if (!row || !column) return
  if (column.key === '__select__' || column.key === '__view__') return
  startTokenCellEdit(row, column)
}

function handleTokenSurfaceCellClick(row, column) {
  if (!row || !column) return
  if (column.key === '__select__' || column.key === '__view__') return
  startTokenCellEdit(row, column)
}

function handleViewSurfaceCellDblclick(row, column) {
  if (!row || !column) return
  if (column.key === '__select__' || column.key === '__view__') return
  startViewCellEdit(row, column)
}

function handleViewSurfaceCellClick(row, column) {
  if (!row || !column) return
  if (column.key === '__select__' || column.key === '__view__') return
  startViewCellEdit(row, column)
}

function handleDataSurfaceCellDblclick(row, column) {
  if (!row || !column) return
  if (column.key === '__select__' || column.key === '__view__') return
  startDataCellEdit(row, column)
}

function cancelDataCellEdit() {
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
}

function focusEditingInput() {
  const element = editingInput.value
  if (!element || typeof element.focus !== 'function') return
  element.focus()
  if (typeof element.select === 'function') {
    element.select()
  }
}
</script>

<style scoped>
.structure-governance-panel {
  --structure-governance-select-col-width: 44px;
  --structure-governance-view-col-width: 32px;
  --structure-governance-type-col-width: 112px;
  --structure-governance-required-col-width: 92px;
  --structure-governance-write-col-width: 220px;
  display: grid;
  gap: 12px;
}

.structure-governance-panel--groups {
  gap: 14px;
}

.structure-governance-panel__group {
  display: grid;
  gap: 8px;
}

.structure-governance-panel__group-toggle {
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.structure-governance-panel__group-head {
  display: grid;
  grid-template-columns: var(--structure-governance-select-col-width) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.structure-governance-panel__group-spacer {
  min-width: var(--structure-governance-select-col-width);
}

.structure-governance-panel__group-head-leading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.structure-governance-panel__group-toggle-icon {
  color: var(--ds-color-text-secondary);
  flex: 0 0 auto;
}

.structure-governance-panel__group-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.02em;
}

.structure-governance-panel__group-meta {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  line-height: 1.35;
}

.structure-governance-panel__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: transparent;
}

.structure-governance-panel__table thead th {
  padding: 0 0 8px;
  color: var(--ds-color-text-secondary);
  border-bottom: 1px solid var(--ds-color-border-default);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.structure-governance-panel__table--shared-head {
  margin-bottom: 2px;
}

.structure-governance-panel__col--select {
  width: var(--structure-governance-select-col-width);
}

.structure-governance-panel__col--view {
  width: var(--structure-governance-view-col-width);
}

.structure-governance-panel__col--type {
  width: var(--structure-governance-type-col-width);
}

.structure-governance-panel__col--required {
  width: var(--structure-governance-required-col-width);
}

.structure-governance-panel__col--side,
.structure-governance-panel__col--count {
  width: 1%;
}

.structure-governance-panel__col--write {
  width: var(--structure-governance-write-col-width);
}

.structure-governance-panel__table tbody td {
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border-default) 72%, transparent);
  vertical-align: middle;
}

.structure-governance-panel__cell--label {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.45;
}

.structure-governance-panel__cell--data {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
  white-space: nowrap;
}

.structure-governance-panel__cell--control {
  color: var(--ds-color-text-secondary);
  text-align: center;
}

.structure-governance-panel__cell--editable {
  cursor: text;
}

.structure-governance-panel__eye-icon {
  opacity: 0.72;
}

.structure-governance-panel__cell-input {
  width: 100%;
  min-width: 0;
  padding: 4px 6px;
  color: var(--ds-color-text-primary);
  background: #fff;
  border: 1px solid var(--ds-color-border-default);
  border-radius: 6px;
  font: inherit;
}

.structure-governance-panel__cell-input--textarea {
  min-height: 84px;
  resize: vertical;
}

.structure-governance-panel__empty {
  padding: 14px 0 4px;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
  text-align: center;
}

.structure-governance-panel__empty--standalone {
  padding-top: 0;
}
</style>
