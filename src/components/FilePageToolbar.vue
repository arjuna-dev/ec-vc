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
      <PlusWithLabelButton :label="addLabel" :disable="loading || addDisabled" @click="$emit('add')" />
      <slot name="primary-trailing" />
    </div>

    <div class="file-page-toolbar__block file-page-toolbar__block--actions">
      <slot name="filters">
        <FilterListIcon class="file-page-toolbar__filters-icon" :disable="loading" />
      </slot>
      <SearchBarInput
        :model-value="searchQuery"
        class="file-page-toolbar__search"
        :placeholder="searchPlaceholder"
        :disable="loading"
        @update:model-value="$emit('update:searchQuery', $event)"
      />
      <ViewModeToggle
        v-if="showViewToggle"
        :model-value="viewMode"
        class="file-page-toolbar__view-toggle"
        :disable="loading"
        :options="viewOptions"
        @update:model-value="$emit('update:viewMode', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import FilterListIcon from 'src/components/FilterListIcon.vue'
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'
import ViewModeToggle from 'src/components/ViewModeToggle.vue'

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
  gap: var(--ds-toolbar-gap-md);
  min-width: 0;
  padding: var(--ds-toolbar-padding-y) var(--ds-toolbar-padding-x);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
}

.file-page-toolbar__block {
  display: flex;
  align-items: center;
  gap: var(--ds-toolbar-gap-md);
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
  min-height: var(--ds-toolbar-toggle-button-size);
  margin-left: -1px;
  color: var(--ds-color-text-primary);
}

.file-page-toolbar__search {
  flex: 0 0 auto;
}

.file-page-toolbar__view-toggle {
  align-self: center;
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
