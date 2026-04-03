<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        {{ entityLabel }} requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not available).
      </q-banner>
    </div>

    <div v-else class="file-records-shell">
      <section class="file-records-shell__hero">
        <div class="file-records-shell__copy">
          <div class="file-records-shell__eyebrow">Dashboard</div>
          <h2 class="file-records-shell__title">{{ heroTitle }}</h2>
          <p class="file-records-shell__text">{{ heroText }}</p>
        </div>

        <div class="file-records-shell__stats">
          <article
            v-for="stat in stats"
            :key="stat.label"
            class="file-records-shell__stat"
            :class="`file-records-shell__stat--${stat.tone || 'neutral'}`"
          >
            <div class="file-records-shell__stat-label">{{ stat.label }}</div>
            <div class="file-records-shell__stat-value">{{ stat.value }}</div>
            <div class="file-records-shell__stat-caption">{{ stat.caption }}</div>
          </article>
        </div>
      </section>

      <div class="file-records-shell__toolbar">
        <div class="file-records-shell__toolbar-block">
          <q-checkbox
            :model-value="allVisibleRowsSelected"
            :indeterminate="someVisibleRowsSelected && !allVisibleRowsSelected"
            :disable="loading || displayRows.length === 0"
            color="dark"
            @update:model-value="toggleSelectAllVisibleRows"
          />
          <q-btn no-caps unelevated color="dark" label="Add Record" :disable="loading" @click="$emit('add')" />
          <q-btn dense flat round icon="download" color="grey-6" :disable="loading" @click="$emit('import')">
            <q-tooltip>Import CSV</q-tooltip>
          </q-btn>
        </div>

        <div class="file-records-shell__toolbar-block">
          <q-input
            :model-value="searchQuery"
            dense
            outlined
            borderless
            class="file-records-shell__search"
            :placeholder="searchPlaceholder"
            :disable="loading"
            @update:model-value="$emit('update:searchQuery', $event)"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn-toggle
            :model-value="viewMode"
            dense
            unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="viewOptions"
            :disable="loading"
            @update:model-value="$emit('update:viewMode', $event)"
          />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <div v-if="!loading && displayRows.length === 0" class="file-records-shell__empty">
        <q-banner class="bg-grey-1 text-black" rounded>
          {{ emptyMessage }}
        </q-banner>
      </div>

      <q-table
        v-else-if="viewMode === 'table'"
        flat
        bordered
        class="file-records-shell__table"
        :row-key="rowKey"
        v-model:selected="selectedRowsModel"
        v-model:pagination="paginationModel"
        selection="multiple"
        :rows="displayRows"
        :columns="columns"
        :loading="loading"
        :rows-per-page-options="rowsPerPageOptions"
      >
        <template #body-cell-actions="props">
          <q-td :props="props">
            <div class="file-records-shell__table-actions">
              <q-btn dense flat round icon="visibility" color="grey-8" :disable="loading" @click="$emit('open-record', props.row)" />
              <q-btn dense flat round icon="delete" color="grey-8" :disable="loading" @click="$emit('delete-row', props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>

      <div v-else class="row q-col-gutter-md">
        <div v-for="row in displayRows" :key="String(row?.[rowKey] || '')" class="col-12 col-sm-6 col-lg-4">
          <q-card flat bordered class="file-records-shell__card full-height">
            <q-card-section class="file-records-shell__card-controls">
              <q-checkbox
                :model-value="isRowSelected(row)"
                :disable="loading"
                color="dark"
                @update:model-value="toggleRowSelection(row, $event)"
              />
              <q-btn flat round icon="visibility" :disable="loading" @click="$emit('open-record', row)" />
            </q-card-section>

            <q-card-section class="file-records-shell__card-hero">
              <div class="file-records-shell__avatar" :style="{ backgroundColor: getRowAvatarColor(row) }">
                {{ getRowInitials(row) }}
              </div>

              <div class="file-records-shell__card-copy">
                <div class="file-records-shell__card-title">{{ getRowTitle(row) }}</div>
                <div v-if="getRowSubtitle(row)" class="file-records-shell__card-subtitle">{{ getRowSubtitle(row) }}</div>
                <div v-if="getRowMetadata(row).length" class="file-records-shell__meta-list">
                  <div
                    v-for="detail in getRowMetadata(row)"
                    :key="`${detail.label}:${detail.value}`"
                    class="file-records-shell__meta-chip"
                  >
                    <q-icon :name="detail.icon || 'info'" size="14px" />
                    <span>{{ detail.value }}</span>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section>
              <div class="file-records-shell__summary-label">Summary</div>
              <div class="file-records-shell__summary-text">
                {{ getRowSummary(row) || emptySummaryMessage }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <SelectionActionBar
        :count="selectedRows.length"
        :loading="loading"
        @share="$emit('share-selected')"
        @edit="$emit('edit-selected')"
        @delete="$emit('delete-selected')"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import SelectionActionBar from 'components/SelectionActionBar.vue'

const props = defineProps({
  isElectronRuntime: { type: Boolean, default: false },
  hasBridge: { type: Boolean, default: false },
  entityLabel: { type: String, required: true },
  heroTitle: { type: String, required: true },
  heroText: { type: String, required: true },
  stats: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  displayRows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowsPerPageOptions: { type: Array, default: () => [10, 15, 25, 50] },
  searchQuery: { type: String, default: '' },
  viewMode: { type: String, default: 'card' },
  viewOptions: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] },
  pagination: { type: Object, default: () => ({ page: 1, rowsPerPage: 10 }) },
  searchPlaceholder: { type: String, default: 'Search records...' },
  emptyMessage: { type: String, default: 'No records found.' },
  emptySummaryMessage: { type: String, default: 'No summary available yet.' },
  rowKey: { type: String, default: 'id' },
  getRowTitle: { type: Function, required: true },
  getRowSubtitle: { type: Function, default: () => '' },
  getRowInitials: { type: Function, required: true },
  getRowAvatarColor: { type: Function, required: true },
  getRowMetadata: { type: Function, default: () => [] },
  getRowSummary: { type: Function, default: () => '' },
})

const emit = defineEmits([
  'add',
  'import',
  'open-record',
  'delete-row',
  'share-selected',
  'edit-selected',
  'delete-selected',
  'update:searchQuery',
  'update:viewMode',
  'update:selectedRows',
  'update:pagination',
])

const selectedRowsModel = computed({
  get: () => props.selectedRows,
  set: (value) => emit('update:selectedRows', value),
})

const paginationModel = computed({
  get: () => props.pagination,
  set: (value) => emit('update:pagination', value),
})

const visibleRowIds = computed(() =>
  props.displayRows.map((row) => String(row?.[props.rowKey] || '').trim()).filter(Boolean),
)

const selectedRowIds = computed(
  () => new Set(props.selectedRows.map((row) => String(row?.[props.rowKey] || '').trim()).filter(Boolean)),
)

const allVisibleRowsSelected = computed(
  () => visibleRowIds.value.length > 0 && visibleRowIds.value.every((id) => selectedRowIds.value.has(id)),
)

const someVisibleRowsSelected = computed(
  () => visibleRowIds.value.some((id) => selectedRowIds.value.has(id)),
)

function isRowSelected(row) {
  return selectedRowIds.value.has(String(row?.[props.rowKey] || '').trim())
}

function toggleRowSelection(row, nextValue) {
  const rowId = String(row?.[props.rowKey] || '').trim()
  if (!rowId) return

  const remaining = props.selectedRows.filter((entry) => String(entry?.[props.rowKey] || '').trim() !== rowId)
  emit('update:selectedRows', nextValue === false ? remaining : [...remaining, row])
}

function toggleSelectAllVisibleRows(nextValue) {
  if (nextValue === false) {
    emit(
      'update:selectedRows',
      props.selectedRows.filter((row) => !visibleRowIds.value.includes(String(row?.[props.rowKey] || '').trim())),
    )
    return
  }

  const preserved = props.selectedRows.filter((row) => !visibleRowIds.value.includes(String(row?.[props.rowKey] || '').trim()))
  emit('update:selectedRows', [...preserved, ...props.displayRows])
}
</script>

<style scoped>
.file-records-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 16px;
}

.file-records-shell__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 1fr);
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-base);
}

.file-records-shell__eyebrow,
.file-records-shell__stat-label,
.file-records-shell__summary-label {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.file-records-shell__title {
  margin: 28px 0 0;
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
}

.file-records-shell__text,
.file-records-shell__stat-caption,
.file-records-shell__card-subtitle,
.file-records-shell__summary-text {
  color: var(--ds-color-text-secondary);
}

.file-records-shell__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.file-records-shell__stat,
.file-records-shell__card {
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  background: rgba(255, 255, 255, 0.94);
}

.file-records-shell__stat {
  padding: 16px;
}

.file-records-shell__toolbar,
.file-records-shell__toolbar-block,
.file-records-shell__card-controls,
.file-records-shell__card-hero,
.file-records-shell__meta-list {
  display: flex;
}

.file-records-shell__toolbar,
.file-records-shell__toolbar-block {
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.file-records-shell__search {
  min-width: min(320px, 72vw);
  background: white;
  border-radius: 999px;
}

.file-records-shell__table-actions {
  display: inline-flex;
  gap: 4px;
}

.file-records-shell__card-controls {
  justify-content: space-between;
  align-items: center;
}

.file-records-shell__card-hero {
  gap: 16px;
}

.file-records-shell__avatar {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: white;
  font-weight: 700;
}

.file-records-shell__card-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.file-records-shell__card-title {
  font-family: var(--ds-font-family-title);
  font-size: 1.15rem;
  font-weight: var(--ds-font-weight-bold);
}

.file-records-shell__meta-list {
  flex-wrap: wrap;
}

.file-records-shell__meta-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.96);
  color: #334155;
}

@media (max-width: 900px) {
  .file-records-shell__hero {
    grid-template-columns: 1fr;
  }

  .file-records-shell__search {
    min-width: 0;
    flex: 1;
  }
}
</style>
