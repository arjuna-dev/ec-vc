<template>
  <div class="shared-row-surface">
    <div class="shared-row-surface__scroll ds-mini-scrollbar">
      <table class="shared-row-surface__table">
        <thead>
          <tr>
            <th
              v-for="column in resolvedColumns"
              :key="column.key"
              :class="[
                'shared-row-surface__head',
                column.isControl ? 'shared-row-surface__head--control' : '',
              ]"
              :style="columnStyle(column)"
            >
              <slot name="head" :column="column">
              <div v-if="!column.isControl" class="shared-row-surface__head-inner">
                <span>{{ column.label }}</span>
                <button
                  v-if="isResizableColumn(column)"
                  type="button"
                  class="shared-row-surface__resize-handle"
                  :aria-label="`Resize ${column.label} column`"
                  @pointerdown.stop.prevent="startColumnResize(column, $event)"
                  @dblclick.stop.prevent="resetColumnWidth(column)"
                />
              </div>
              </slot>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <td
              v-for="column in resolvedColumns"
              :key="`${row.key}:${column.key}`"
              :class="[
                'shared-row-surface__cell',
                column.isControl ? 'shared-row-surface__cell--control' : '',
                isEditableCell(row, column) ? 'shared-row-surface__cell--editable' : '',
                row.toneClassByColumn?.[column.key] || '',
              ]"
              :style="columnStyle(column)"
              @dblclick="$emit('cell-dblclick', row, column)"
            >
              <slot name="cell" :row="row" :column="column">
                <span>{{ row[column.key] }}</span>
              </slot>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="resolvedColumns.length" class="shared-row-surface__empty">
              {{ emptyLabel }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ name: 'SharedRowSurfaceTable' })

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  emptyLabel: { type: String, default: 'No rows available.' },
  columnWidthKey: { type: String, default: '' },
})

defineEmits(['cell-dblclick'])

const resolvedColumns = computed(() =>
  (Array.isArray(props.columns) ? props.columns : []).map((column) => ({
    ...column,
    key: String(column?.key || '').trim(),
  })).filter((column) => column.key),
)
const resolvedColumnWidthStorageKey = computed(() => {
  const key = String(props.columnWidthKey || '').trim()
  return key ? `ecvc:shared-row-surface-widths:${key}` : ''
})
const columnWidths = ref({})
const resizeState = ref({
  columnKey: '',
  pointerId: null,
  startX: 0,
  startWidth: 0,
})

function loadStoredColumnWidths() {
  const storageKey = String(resolvedColumnWidthStorageKey.value || '').trim()
  if (!storageKey || typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistColumnWidths(nextWidths = {}) {
  const storageKey = String(resolvedColumnWidthStorageKey.value || '').trim()
  if (!storageKey || typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nextWidths))
  } catch {
    // Ignore storage errors and keep the live widths in memory.
  }
}

watch(
  [resolvedColumns, resolvedColumnWidthStorageKey],
  ([columns]) => {
    const storedWidths = loadStoredColumnWidths()
    const next = {}
    ;(Array.isArray(columns) ? columns : []).forEach((column) => {
      const key = String(column?.key || '').trim()
      if (!key) return
      next[key] = Number(columnWidths.value[key] || storedWidths[key] || column?.width || 0)
    })
    columnWidths.value = next
  },
  { immediate: true },
)

function columnStyle(column = {}) {
  const key = String(column?.key || '').trim()
  const width = Number(columnWidths.value[key] || column?.width || 0)
  return width > 0 ? { width: `${width}px`, minWidth: `${width}px` } : {}
}

function isEditableCell(row = {}, column = {}) {
  const editableColumns = row?.editableColumns instanceof Set
    ? row.editableColumns
    : new Set(Array.isArray(row?.editableColumns) ? row.editableColumns : [])
  return editableColumns.has(column.key)
}

function isResizableColumn(column = {}) {
  return !column?.isControl && Number(column?.width || 0) > 0
}

function startColumnResize(column = {}, event) {
  const key = String(column?.key || '').trim()
  if (!key) return
  resizeState.value = {
    columnKey: key,
    pointerId: event?.pointerId ?? null,
    startX: Number(event?.clientX || 0),
    startWidth: Number(columnWidths.value[key] || column?.width || 0),
  }
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopColumnResize)
  window.addEventListener('pointercancel', stopColumnResize)
}

function handlePointerMove(event) {
  const key = String(resizeState.value.columnKey || '').trim()
  if (!key) return
  const deltaX = Number(event?.clientX || 0) - Number(resizeState.value.startX || 0)
  const nextWidth = Math.max(22, Math.round(Number(resizeState.value.startWidth || 0) + deltaX))
  columnWidths.value = {
    ...columnWidths.value,
    [key]: nextWidth,
  }
  persistColumnWidths(columnWidths.value)
}

function stopColumnResize() {
  resizeState.value = {
    columnKey: '',
    pointerId: null,
    startX: 0,
    startWidth: 0,
  }
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopColumnResize)
  window.removeEventListener('pointercancel', stopColumnResize)
}

function resetColumnWidth(column = {}) {
  const key = String(column?.key || '').trim()
  if (!key) return
  columnWidths.value = {
    ...columnWidths.value,
    [key]: Number(column?.width || 0),
  }
  persistColumnWidths(columnWidths.value)
}

onBeforeUnmount(() => {
  stopColumnResize()
})
</script>

<style scoped>
.shared-row-surface {
  min-width: 0;
  max-width: 100%;
}

.shared-row-surface__scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  padding-bottom: 4px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.96);
  box-sizing: border-box;
}

.shared-row-surface__table {
  width: max-content;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  background: transparent;
}

.shared-row-surface__head,
.shared-row-surface__cell {
  min-width: 144px;
  padding: 10px 12px;
  overflow: hidden;
  box-sizing: border-box;
  vertical-align: middle;
  text-align: left;
  white-space: nowrap;
}

.shared-row-surface__head {
  position: sticky;
  top: 0;
  z-index: 2;
  padding-top: 8px;
  padding-bottom: 8px;
  background: #f3f4f6;
  color: rgba(17, 17, 17, 0.68);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
  line-height: 0.96;
}

.shared-row-surface__head-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  position: relative;
  padding-right: 10px;
}

.shared-row-surface__resize-handle {
  position: absolute;
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  width: 14px;
  min-width: 14px;
  height: calc(100% + 8px);
  padding: 0;
  background: transparent;
  border: 0;
  border-right: 2px solid rgba(17, 17, 17, 0.18);
  cursor: col-resize;
  z-index: 6;
  touch-action: none;
}

.shared-row-surface__resize-handle:hover,
.shared-row-surface__resize-handle:focus-visible {
  border-right-color: rgba(17, 17, 17, 0.46);
  outline: none;
}

.shared-row-surface__head--control,
.shared-row-surface__cell--control {
  width: 22px;
  min-width: 22px;
  max-width: 22px;
  padding: 6px 0;
  padding-left: 0;
  padding-right: 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.98);
}

.shared-row-surface__head--control {
  background: #eef0f2;
}

.shared-row-surface__cell {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.45;
  background: transparent;
}

.shared-row-surface__cell--editable {
  cursor: text;
}

.shared-row-surface__cell--editable:hover {
  background: color-mix(in srgb, var(--ds-color-surface-muted, #f4f4f2) 55%, transparent);
}

.shared-row-surface__tone--editable,
.shared-row-surface__cell--editable,
.shared-row-surface__cell--editable :deep(*) {
  color: #2f6bff;
}

.shared-row-surface__tone--editable {
  color: #2f6bff;
}

.shared-row-surface__tone--linked {
  color: #238b45;
}

.shared-row-surface__tone--suggested {
  color: #b08900;
}

.shared-row-surface__tone--preselected {
  color: #8c8c8c;
}

.shared-row-surface__tone--verified {
  color: #111111;
}

.shared-row-surface__empty {
  padding: 14px 0 4px;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
  text-align: center;
}
</style>
