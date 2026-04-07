<template>
  <div class="file-page-toolbar">
    <div class="file-page-toolbar__block file-page-toolbar__block--primary">
      <q-checkbox
        :model-value="allVisibleSelected"
        :indeterminate="someVisibleSelected && !allVisibleSelected"
        :disable="loading || disabled"
        dense
        color="dark"
        class="file-page-toolbar__select-all"
        @update:model-value="$emit('toggle-select-all', $event)"
      />
      <q-btn no-caps unelevated class="file-page-toolbar__add-button" :disable="loading || addDisabled" @click="$emit('add')">
        <span class="file-page-toolbar__add-button-inner">
          <span class="file-page-toolbar__add-button-plus">
            <q-icon name="add" />
          </span>
          <span class="file-page-toolbar__add-button-label">{{ addLabel }}</span>
        </span>
      </q-btn>
      <slot name="primary-trailing" />
    </div>

    <div class="file-page-toolbar__block file-page-toolbar__block--actions">
      <slot name="filters">
        <q-icon name="tune" size="18px" class="file-page-toolbar__filters-icon" />
      </slot>
      <q-input
        :model-value="searchQuery"
        dense
        outlined
        borderless
        class="file-page-toolbar__search"
        :placeholder="searchPlaceholder"
        :disable="loading"
        @update:model-value="$emit('update:searchQuery', $event)"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn-toggle
        v-if="showViewToggle"
        :model-value="viewMode"
        dense
        unelevated
        toggle-color="primary"
        color="grey-3"
        text-color="grey-8"
        class="file-page-toolbar__toggle file-page-toolbar__view-toggle"
        :disable="loading"
        :options="viewOptions"
        @update:model-value="$emit('update:viewMode', $event)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  allVisibleSelected: { type: Boolean, default: false },
  someVisibleSelected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  addDisabled: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Add Record' },
  searchQuery: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Search [file/Record]' },
  viewMode: { type: String, default: 'card' },
  viewOptions: { type: Array, default: () => [] },
  showViewToggle: { type: Boolean, default: true },
})

defineEmits(['toggle-select-all', 'add', 'update:searchQuery', 'update:viewMode'])
</script>

<style scoped>
.file-page-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px 20px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
}

.file-page-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-page-toolbar__block--primary {
  margin-right: 4px;
}

.file-page-toolbar__block--actions {
  grid-column: -2 / -1;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.file-page-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.file-page-toolbar__select-all {
  min-height: 26px;
  margin-left: -1px;
  color: var(--ds-color-text-default, #111111);
}

.file-page-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.file-page-toolbar__search :deep(.q-field__control),
.file-page-toolbar__search :deep(.q-field__native),
.file-page-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.file-page-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.file-page-toolbar__toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
}

.file-page-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.file-page-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.file-page-toolbar__view-toggle :deep(.q-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.file-page-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.file-page-toolbar__view-toggle :deep(.q-icon) {
  font-size: 16.2px;
}

.file-page-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
}

.file-page-toolbar__add-button:hover,
.file-page-toolbar__add-button:focus-visible {
  background: #f5f3ee;
}

.file-page-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.file-page-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.file-page-toolbar__add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  background: #2647ff;
  color: #ffffff;
}

.file-page-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 18px;
}

.file-page-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.92;
  letter-spacing: 0.01em;
}

@media (max-width: 900px) {
  .file-page-toolbar {
    grid-template-columns: 1fr;
  }

  .file-page-toolbar__block--actions {
    grid-column: auto;
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
