<template>
  <div class="editable-grid-table">
    <div class="editable-grid-table__wrap ds-mini-scrollbar">
      <table class="editable-grid-table__table">
        <thead>
          <tr>
            <th>Sections</th>
            <th
              v-for="column in columns"
              :key="column.id"
              class="editable-grid-table__dynamic-column-head"
              :class="{ 'editable-grid-table__dynamic-column-head--summary': column.id === 'summary' }"
            >
              <div class="editable-grid-table__head-inner">
                <input
                  v-if="column.isEditing"
                  :value="column.label"
                  type="text"
                  class="editable-grid-table__text-input"
                  @input="$emit('updateColumnLabel', column.id, $event.target.value)"
                  @blur="$emit('finishColumnEdit', column.id)"
                  @keydown.enter.prevent="$emit('finishColumnEdit', column.id)"
                />
                <span v-else>{{ column.label }}</span>
                <button
                  v-if="canEdit && column.deletable"
                  type="button"
                  class="editable-grid-table__delete-btn"
                  @click="$emit('removeColumn', column.id)"
                >
                  <q-icon name="close" />
                </button>
              </div>
            </th>
            <th class="editable-grid-table__add-column-head">
              <PlusWithLabelButton
                label="Add"
                aria-label="Add"
                :disable="!canEdit"
                class="editable-grid-table__add-action"
                @click="$emit('addColumn')"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <td class="editable-grid-table__row-head">
              <div class="editable-grid-table__head-inner">
                <input
                  v-if="row.isEditing"
                  :value="row.label"
                  type="text"
                  class="editable-grid-table__text-input"
                  @input="$emit('updateRowLabel', row.key, $event.target.value)"
                  @blur="$emit('finishRowEdit', row.key)"
                  @keydown.enter.prevent="$emit('finishRowEdit', row.key)"
                />
                <MainMenuRowLabel v-else :label="row.label" />
                <button
                  v-if="canEdit && row.deletable"
                  type="button"
                  class="editable-grid-table__delete-btn"
                  @click="$emit('removeRow', row.key)"
                >
                  <q-icon name="close" />
                </button>
              </div>
            </td>
            <td
              v-for="column in columns"
              :key="`${row.key}:${column.id}`"
              class="editable-grid-table__cell"
              :class="{ 'editable-grid-table__cell--summary': column.id === 'summary' }"
            >
              <div class="editable-grid-table__cell-surface" />
            </td>
            <td class="editable-grid-table__add-column-spacer" />
          </tr>
          <tr>
            <td class="editable-grid-table__add-row-cell">
              <PlusWithLabelButton
                label="Add"
                aria-label="Add"
                :disable="!canEdit"
                class="editable-grid-table__add-action"
                @click="$emit('addRow')"
              />
            </td>
            <td
              v-for="column in columns"
              :key="`add-row:${column.id}`"
              class="editable-grid-table__add-row-spacer"
            />
            <td class="editable-grid-table__add-column-spacer" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import MainMenuRowLabel from 'src/components/MainMenuRowLabel.vue'
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'

defineOptions({ name: 'EditableGridTable' })

defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'updateColumnLabel',
  'finishColumnEdit',
  'removeColumn',
  'addColumn',
  'updateRowLabel',
  'finishRowEdit',
  'removeRow',
  'addRow',
])
</script>

<style scoped>
.editable-grid-table {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.editable-grid-table__wrap {
  width: 100%;
  max-width: 100%;
  max-height: 320px;
  overflow: auto;
}

.editable-grid-table__table {
  width: max-content;
  border-collapse: collapse;
  table-layout: auto;
}

.editable-grid-table__table th,
.editable-grid-table__table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.editable-grid-table__table th {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: 0.84rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
}

.editable-grid-table__table td {
  color: #111827;
  font-family: var(--ds-font-body);
  font-size: 0.9rem;
  line-height: 1.35;
}

.editable-grid-table__table th:first-child,
.editable-grid-table__table td:first-child {
  width: 1%;
  white-space: nowrap;
  padding-right: 18px;
}

.editable-grid-table__row-head {
  width: 1%;
  white-space: nowrap;
}

.editable-grid-table__head-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.editable-grid-table__dynamic-column-head {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.editable-grid-table__dynamic-column-head--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.editable-grid-table__cell {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.editable-grid-table__cell--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.editable-grid-table__text-input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  color: var(--ds-color-brand-black);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  outline: none;
  font-family: var(--ds-font-title);
  font-size: 0.82rem;
  font-weight: var(--ds-font-weight-bold);
  box-sizing: border-box;
}

.editable-grid-table__add-column-head,
.editable-grid-table__add-column-spacer {
  width: 1%;
  padding-left: 6px;
  padding-right: 0;
  white-space: nowrap;
}

.editable-grid-table__add-row-cell {
  padding-top: 14px;
  padding-bottom: 0;
}

.editable-grid-table__add-row-spacer {
  padding-top: 14px;
  padding-bottom: 0;
  border-bottom: 0;
}

.editable-grid-table__add-action {
  align-self: start;
  transform: scale(0.5);
  transform-origin: top left;
}

.editable-grid-table__delete-btn {
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

.editable-grid-table__cell-surface {
  min-height: 52px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(241, 245, 249, 0.86));
}
</style>
