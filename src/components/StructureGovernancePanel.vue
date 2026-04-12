<template>
  <div v-if="mode === 'views'" class="structure-governance-panel">
    <table class="structure-governance-panel__table">
      <colgroup>
        <col class="structure-governance-panel__col structure-governance-panel__col--select">
        <col class="structure-governance-panel__col structure-governance-panel__col--view">
        <col class="structure-governance-panel__col structure-governance-panel__col--label">
        <col class="structure-governance-panel__col structure-governance-panel__col--side">
        <col class="structure-governance-panel__col structure-governance-panel__col--count">
        <col class="structure-governance-panel__col structure-governance-panel__col--count">
      </colgroup>
      <thead>
        <tr>
          <th aria-label="Selection"></th>
          <th aria-label="View"></th>
          <th>View</th>
          <th>Side</th>
          <th>Tokens</th>
          <th>Subgroups</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="view in viewRows" :key="view.key">
          <td class="structure-governance-panel__cell--data">
            <SettingsCheckbox
              :model-value="Boolean(view.selected)"
              tone="light"
              @update:model-value="$emit('toggle-view-select', view.key, $event)"
            />
          </td>
          <td class="structure-governance-panel__cell--control">
            <q-icon name="visibility" size="14px" class="structure-governance-panel__eye-icon" />
          </td>
          <td class="structure-governance-panel__cell--label">{{ view.label }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.side }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.tokenCount }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.subgroupCount }}</td>
        </tr>
        <tr v-if="!viewRows.length">
          <td colspan="6" class="structure-governance-panel__empty">{{ emptyViewsLabel }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else-if="mode === 'tokens'" class="structure-governance-panel structure-governance-panel--groups">
    <table class="structure-governance-panel__table structure-governance-panel__table--shared-head">
      <colgroup>
        <col class="structure-governance-panel__col structure-governance-panel__col--select">
        <col class="structure-governance-panel__col structure-governance-panel__col--view">
        <col class="structure-governance-panel__col structure-governance-panel__col--label">
        <col class="structure-governance-panel__col structure-governance-panel__col--type">
        <col class="structure-governance-panel__col structure-governance-panel__col--required">
        <col v-if="showWriteTarget" class="structure-governance-panel__col structure-governance-panel__col--write">
      </colgroup>
      <thead>
        <tr>
          <th aria-label="Selection"></th>
          <th aria-label="View"></th>
          <th>Label</th>
          <th>Type</th>
          <th>Required</th>
          <th v-if="showWriteTarget">Write Target / Alias</th>
        </tr>
      </thead>
    </table>

    <section
      v-for="group in tokenGroups"
      :key="group.key"
      class="structure-governance-panel__group"
    >
      <button
        type="button"
        class="structure-governance-panel__group-toggle"
        :aria-label="`${isGroupExpanded(group.key) ? 'Collapse' : 'Expand'} ${group.label}`"
        @click="toggleGroup(group.key)"
      >
        <div class="structure-governance-panel__group-head">
          <div class="structure-governance-panel__group-spacer" aria-hidden="true"></div>
          <div class="structure-governance-panel__group-head-leading">
            <q-icon
              :name="isGroupExpanded(group.key) ? 'expand_more' : 'chevron_right'"
              size="14px"
              class="structure-governance-panel__group-toggle-icon"
            />
            <div class="structure-governance-panel__group-title">{{ group.label }}</div>
            <div class="structure-governance-panel__group-meta">{{ group.tokens.length }} tokens</div>
          </div>
        </div>
      </button>

      <table v-if="isGroupExpanded(group.key)" class="structure-governance-panel__table">
        <colgroup>
          <col class="structure-governance-panel__col structure-governance-panel__col--select">
          <col class="structure-governance-panel__col structure-governance-panel__col--view">
          <col class="structure-governance-panel__col structure-governance-panel__col--label">
          <col class="structure-governance-panel__col structure-governance-panel__col--type">
          <col class="structure-governance-panel__col structure-governance-panel__col--required">
          <col v-if="showWriteTarget" class="structure-governance-panel__col structure-governance-panel__col--write">
        </colgroup>
        <tbody>
          <tr v-for="token in group.tokens" :key="token.key">
            <td class="structure-governance-panel__cell--data">
              <SettingsCheckbox
                :model-value="true"
                tone="light"
                @update:model-value="$emit('toggle-token-select', token.key, $event)"
              />
            </td>
            <td class="structure-governance-panel__cell--control">
              <q-icon name="visibility" size="14px" class="structure-governance-panel__eye-icon" />
            </td>
            <td class="structure-governance-panel__cell--label">{{ token.label }}</td>
            <td class="structure-governance-panel__cell--data">{{ token.type }}</td>
            <td class="structure-governance-panel__cell--data">
              <SettingsCheckbox
                v-if="interactiveRequired"
                :model-value="Boolean(token.required)"
                tone="light"
                @update:model-value="$emit('toggle-required', token.key, $event)"
              />
              <span v-else>{{ token.required }}</span>
            </td>
            <td v-if="showWriteTarget" class="structure-governance-panel__cell--data">{{ token.writeTarget }}</td>
          </tr>
          <tr v-if="!group.tokens.length">
            <td :colspan="showWriteTarget ? 6 : 5" class="structure-governance-panel__empty">{{ emptyTokensLabel }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="!tokenGroups.length" class="structure-governance-panel__empty structure-governance-panel__empty--standalone">
      {{ emptyTokensLabel }}
    </div>
  </div>

  <div v-else-if="mode === 'data'" class="structure-governance-panel">
    <table class="structure-governance-panel__table">
      <colgroup>
        <col class="structure-governance-panel__col structure-governance-panel__col--select">
        <col class="structure-governance-panel__col structure-governance-panel__col--view">
        <col
          v-for="column in dataColumns"
          :key="column.key"
          :style="columnStyle(column)"
        >
      </colgroup>
      <thead>
        <tr>
          <th aria-label="Selection"></th>
          <th aria-label="View"></th>
          <th
            v-for="column in dataColumns"
            :key="column.key"
            :class="column.headerClass"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in dataRows" :key="row.key">
          <td class="structure-governance-panel__cell--data">
            <SettingsCheckbox
              :model-value="selectedRowKeySet.has(row.key)"
              tone="light"
              @update:model-value="$emit('toggle-data-select', row.key, $event)"
            />
          </td>
          <td class="structure-governance-panel__cell--control">
            <q-icon name="visibility" size="14px" class="structure-governance-panel__eye-icon" />
          </td>
          <td
            v-for="column in dataColumns"
            :key="`${row.key}:${column.key}`"
            :class="[column.cellClass, { 'structure-governance-panel__cell--editable': isEditableColumn(row, column) }]"
            @dblclick="startDataCellEdit(row, column)"
          >
            <SettingsCheckbox
              v-if="column.kind === 'checkbox'"
              :model-value="Boolean(row[column.key])"
              tone="light"
              @update:model-value="$emit('update-data-cell', row.key, column.key, $event)"
            />
            <select
              v-else-if="isDataCellEditing(row.key, column.key) && column.kind === 'select'"
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
            <input
              v-else-if="isDataCellEditing(row.key, column.key)"
              :value="editingCellValue"
              class="structure-governance-panel__cell-input"
              type="text"
              @input="editingCellValue = $event.target.value"
              @blur="commitDataCellEdit(row.key, column.key, $event.target.value)"
              @keydown.enter.prevent="commitDataCellEdit(row.key, column.key, $event.target.value)"
              @keydown.esc.prevent="cancelDataCellEdit"
            >
            <span v-else>{{ row[column.key] }}</span>
          </td>
        </tr>
        <tr v-if="!dataRows.length">
          <td :colspan="dataColumns.length + 2" class="structure-governance-panel__empty">{{ emptyDataLabel }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { nextTick, ref, watch, computed } from 'vue'
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'

defineOptions({ name: 'StructureGovernancePanel' })

const emit = defineEmits(['toggle-required', 'toggle-token-select', 'toggle-view-select', 'toggle-data-select', 'update-data-cell'])

const props = defineProps({
  mode: { type: String, default: 'views' },
  viewRows: { type: Array, default: () => [] },
  tokenGroups: { type: Array, default: () => [] },
  dataColumns: { type: Array, default: () => [] },
  dataRows: { type: Array, default: () => [] },
  selectedRowKeys: { type: Array, default: () => [] },
  showWriteTarget: { type: Boolean, default: false },
  interactiveRequired: { type: Boolean, default: false },
  emptyViewsLabel: { type: String, default: 'No views declared.' },
  emptyTokensLabel: { type: String, default: 'No tokens declared.' },
  emptyDataLabel: { type: String, default: 'No rows declared.' },
})

const expandedGroupKeys = ref([])
const editingCell = ref({ rowKey: '', columnKey: '' })
const editingCellValue = ref('')
const selectedRowKeySet = computed(() => new Set((Array.isArray(props.selectedRowKeys) ? props.selectedRowKeys : []).map((key) => String(key || '').trim())))

watch(
  () => props.tokenGroups,
  (groups) => {
    const groupKeys = (Array.isArray(groups) ? groups : []).map((group) => String(group?.key || '').trim()).filter(Boolean)
    expandedGroupKeys.value = groupKeys.filter((key) => expandedGroupKeys.value.includes(key))
    if (!expandedGroupKeys.value.length && groupKeys.length) {
      expandedGroupKeys.value = [...groupKeys]
    }
  },
  { immediate: true },
)

function isGroupExpanded(groupKey = '') {
  return expandedGroupKeys.value.includes(String(groupKey || '').trim())
}

function toggleGroup(groupKey = '') {
  const normalized = String(groupKey || '').trim()
  if (!normalized) return
  expandedGroupKeys.value = isGroupExpanded(normalized)
    ? expandedGroupKeys.value.filter((key) => key !== normalized)
    : [...expandedGroupKeys.value, normalized]
}

function columnStyle(column = {}) {
  const width = Number(column?.width || 0)
  return width > 0 ? { width: `${width}px`, minWidth: `${width}px` } : {}
}

function isEditableColumn(row = {}, column = {}) {
  const isRowEditable = String(row?.editable || '').trim().toLowerCase() !== 'no'
  return Boolean(column?.editable) && column.kind !== 'checkbox' && isRowEditable
}

function isDataCellEditing(rowKey = '', columnKey = '') {
  return editingCell.value.rowKey === String(rowKey || '').trim()
    && editingCell.value.columnKey === String(columnKey || '').trim()
}

async function startDataCellEdit(row = {}, column = {}) {
  if (!isEditableColumn(row, column)) return
  editingCell.value = {
    rowKey: String(row?.key || '').trim(),
    columnKey: String(column?.key || '').trim(),
  }
  editingCellValue.value = row?.[column.key] ?? ''
  await nextTick()
}

function commitDataCellEdit(rowKey = '', columnKey = '', value = '') {
  emit('update-data-cell', rowKey, columnKey, value)
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
}

function cancelDataCellEdit() {
  editingCell.value = { rowKey: '', columnKey: '' }
  editingCellValue.value = ''
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
