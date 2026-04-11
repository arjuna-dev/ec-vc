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
      <q-btn
        v-if="showForkSelector"
        flat
        no-caps
        dense
        class="file-page-toolbar__fork-trigger"
        :disable="loading || disabled"
      >
        <span class="file-page-toolbar__fork-trigger-label">{{ activeForkLabel }}</span>
        <q-icon name="expand_more" size="14px" />
        <q-menu
          anchor="bottom left"
          self="top left"
          class="file-page-toolbar__fork-menu"
          content-class="file-page-toolbar__fork-menu-content"
        >
          <div class="file-page-toolbar__fork-list">
            <button
              v-for="option in normalizedForkOptions"
              :key="option.value"
              type="button"
              class="file-page-toolbar__fork-option"
              :class="{ 'file-page-toolbar__fork-option--active': option.value === forkValue }"
              @click="selectForkValue(option.value)"
            >
              <span class="file-page-toolbar__fork-option-label">{{ option.label }}</span>
            </button>
          </div>
        </q-menu>
      </q-btn>
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
import { computed } from 'vue'

const props = defineProps({
  allVisibleSelected: { type: Boolean, default: false },
  someVisibleSelected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  addDisabled: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Add Record' },
  searchQuery: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Search [file/Record]' },
  viewMode: { type: String, default: 'page' },
  viewOptions: { type: Array, default: () => [] },
  showViewToggle: { type: Boolean, default: true },
  forkValue: { type: String, default: '' },
  forkOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['toggle-select-all', 'add', 'update:searchQuery', 'update:viewMode', 'update:forkValue'])

const normalizedForkOptions = computed(() =>
  (Array.isArray(props.forkOptions) ? props.forkOptions : [])
    .map((option) => ({
      value: String(option?.value || '').trim(),
      label: String(option?.label || '').trim(),
    }))
    .filter((option) => option.label),
)

const showForkSelector = computed(() => normalizedForkOptions.value.length > 0)
const activeForkLabel = computed(() => {
  const matchedOption = normalizedForkOptions.value.find((option) => option.value === String(props.forkValue || '').trim())
  return matchedOption?.label || 'All'
})

function selectForkValue(value) {
  emit('update:forkValue', value)
}
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
  border-radius: var(--ds-radius-sm);
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

.file-page-toolbar__fork-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--ds-toolbar-toggle-button-size);
  padding: 0 10px;
  color: var(--ds-color-text-primary);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  background: transparent;
}

.file-page-toolbar__fork-trigger-label {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-xs);
}

.file-page-toolbar__fork-list {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  padding: 6px;
  gap: 4px;
}

.file-page-toolbar__fork-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-color-text-primary);
  cursor: pointer;
}

.file-page-toolbar__fork-option--active {
  background: var(--ds-color-surface-muted);
}

.file-page-toolbar__fork-option-label {
  color: inherit;
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-xs);
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
