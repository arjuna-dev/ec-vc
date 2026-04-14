<template>
  <div class="file-shell__control-row" :aria-label="ariaLabel">
    <div class="file-shell__control-lane">
      <div class="file-shell__control-lane-box file-shell__control-lane-box--left-controls">
        <q-checkbox
          :model-value="allVisibleSelected"
          :indeterminate="someVisibleSelected && !allVisibleSelected"
          :disable="loading || disabled || selectDisabled"
          dense
          color="dark"
          class="file-shell__control-select-all"
          @update:model-value="$emit('toggle-select-all', $event)"
        />
        <button
          type="button"
          class="file-shell__control-add"
          :disabled="loading || disabled || addDisabled"
          :aria-label="addAriaLabel"
          @click="$emit('add')"
        >
          <PlusIconChip />
        </button>
        <SearchBarInput
          :model-value="searchQuery"
          class="file-shell__control-search"
          :placeholder="searchPlaceholder"
          :disable="loading || disabled || searchDisabled"
          @update:model-value="$emit('update:searchQuery', $event)"
        />
        <q-btn
          flat
          round
          dense
          class="file-shell__control-filter"
          icon="filter_list"
          :disable="loading || disabled || filterDisabled"
          :aria-label="filterAriaLabel"
        >
          <q-menu
            v-if="hasFiltersSlot && !(loading || disabled || filterDisabled)"
            anchor="top left"
            self="top right"
            class="test-shell-filters-menu"
            content-class="test-shell-filters-menu__content"
          >
            <slot name="filters" />
          </q-menu>
        </q-btn>
      </div>
    </div>

    <div class="file-shell__control-lane">
      <div class="file-shell__control-lane-box file-shell__control-lane-box--views">
        <div
          ref="viewsScrollRef"
          class="file-shell__control-views-scroll ds-mini-scrollbar"
          @scroll="updateViewsScrollState"
        >
          <button
            v-for="item in viewItems"
            :key="`control-view:${item.value}`"
            type="button"
            class="file-shell__control-chip"
            :class="{ 'file-shell__control-chip--active': modelValue === item.value }"
            @click="$emit('update:modelValue', item.value)"
          >
            {{ item.title }}
          </button>
        </div>
        <div v-if="viewsCanScrollPrev || viewsCanScrollNext" class="file-shell__control-views-nav">
          <button
            type="button"
            class="file-shell__control-views-nav-btn"
            :disabled="!viewsCanScrollPrev"
            aria-label="Scroll view labels left"
            @click="scrollViews(-1)"
          >
            <q-icon name="chevron_left" size="14px" />
          </button>
          <button
            type="button"
            class="file-shell__control-views-nav-btn"
            :disabled="!viewsCanScrollNext"
            aria-label="Scroll view labels right"
            @click="scrollViews(1)"
          >
            <q-icon name="chevron_right" size="14px" />
          </button>
        </div>
      </div>
    </div>

    <div class="file-shell__control-lane">
      <div class="file-shell__control-lane-box file-shell__control-lane-box--governance">
        <div class="file-shell__control-governance-set">
          <button
            v-for="item in structuralItems"
            :key="`control-structural:${item.value}`"
            type="button"
            class="shell-section-toolbar__item"
            :class="structuralItemClass(item)"
            @click="$emit('update:modelValue', item.value)"
          >
            <span class="shell-section-toolbar__item-label">{{ item.title }}</span>
          </button>
        </div>
        <div class="file-shell__control-governance-set">
          <button
            v-for="item in governanceItems"
            :key="`control-governance:${item.value}`"
            type="button"
            class="shell-section-toolbar__item shell-section-toolbar__item--governance"
            :class="{ 'shell-section-toolbar__item--active': modelValue === item.value }"
            @click="$emit('update:modelValue', item.value)"
          >
            <span class="shell-section-toolbar__item-label">{{ item.title }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="file-shell__control-lane">
      <div class="file-shell__control-lane-box file-shell__control-lane-box--controls">
        <slot name="controls-prefix" />
        <button
          v-if="showViewModeToggle"
          type="button"
          class="file-shell__control-icon-btn"
          :class="{ 'file-shell__control-icon-btn--active': viewMode === 'page' }"
          :disabled="viewModeDisabled"
          aria-label="Row view"
          @click="$emit('update:viewMode', 'page')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="file-shell__control-row-icon">
            <path d="M5 7.25H19" />
            <path d="M5 12H19" />
            <path d="M5 16.75H19" />
          </svg>
        </button>
        <button
          v-if="showViewModeToggle"
          type="button"
          class="file-shell__control-icon-btn"
          :class="{ 'file-shell__control-icon-btn--active': viewMode === 'card' }"
          :disabled="viewModeDisabled"
          aria-label="Card view"
          @click="$emit('update:viewMode', 'card')"
        >
          <q-icon name="grid_view" size="14px" />
        </button>
        <button
          v-if="showCollapseToggle"
          type="button"
          class="file-shell__control-icon-btn"
          :disabled="collapseDisabled"
          :aria-label="collapsed ? expandAriaLabel : collapseAriaLabel"
          @click="$emit('toggle-collapse')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="file-shell__control-chevron-icon">
            <path :d="collapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
          </svg>
        </button>
        <slot name="controls-suffix" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import PlusIconChip from 'src/components/PlusIconChip.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: 'File shell control bar' },
  allVisibleSelected: { type: Boolean, default: false },
  someVisibleSelected: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  selectDisabled: { type: Boolean, default: false },
  addDisabled: { type: Boolean, default: false },
  addAriaLabel: { type: String, default: 'Add Record' },
  searchQuery: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Search' },
  searchDisabled: { type: Boolean, default: false },
  filterDisabled: { type: Boolean, default: false },
  filterAriaLabel: { type: String, default: 'Filters' },
  viewMode: { type: String, default: 'page' },
  viewModeDisabled: { type: Boolean, default: false },
  showViewModeToggle: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false },
  collapseDisabled: { type: Boolean, default: false },
  showCollapseToggle: { type: Boolean, default: true },
  collapseAriaLabel: { type: String, default: 'Collapse data surface' },
  expandAriaLabel: { type: String, default: 'Expand data surface' },
})

defineEmits(['toggle-select-all', 'add', 'update:searchQuery', 'update:modelValue', 'update:viewMode', 'toggle-collapse'])

const slots = useSlots()
const viewsScrollRef = ref(null)
const viewsCanScrollPrev = ref(false)
const viewsCanScrollNext = ref(false)

const normalizedItems = computed(() =>
  (Array.isArray(props.items) ? props.items : [])
    .map((item) => ({
      value: String(item?.value || item?.key || '').trim(),
      title: String(item?.title || item?.label || '').trim(),
      lane: String(item?.lane || '').trim(),
      tone: String(item?.tone || '').trim(),
    }))
    .filter((item) => item.value && item.title),
)
const viewItems = computed(() => normalizedItems.value.filter((item) => item.lane === 'left'))
const structuralItems = computed(() => normalizedItems.value.filter((item) => item.lane === 'structural'))
const governanceItems = computed(() => normalizedItems.value.filter((item) => item.lane === 'governance'))
const hasFiltersSlot = computed(() => Boolean(slots.filters))

function structuralItemClass(item) {
  return {
    'shell-section-toolbar__item--active': props.modelValue === item.value,
    'shell-section-toolbar__item--ldb': item.tone === 'ldb',
    'shell-section-toolbar__item--system': item.tone === 'system',
    'shell-section-toolbar__item--structural': item.tone === 'structural',
  }
}

function updateViewsScrollState() {
  const element = viewsScrollRef.value
  if (!element) {
    viewsCanScrollPrev.value = false
    viewsCanScrollNext.value = false
    return
  }
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  viewsCanScrollPrev.value = element.scrollLeft > 2
  viewsCanScrollNext.value = element.scrollLeft < (maxScrollLeft - 2)
}

function scrollViews(direction = 1) {
  const element = viewsScrollRef.value
  if (!element) return
  element.scrollBy({ left: direction * 120, behavior: 'smooth' })
  window.setTimeout(updateViewsScrollState, 180)
}

watch(
  [viewItems, structuralItems, governanceItems],
  async () => {
    await nextTick()
    updateViewsScrollState()
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window === 'undefined') return
  window.setTimeout(updateViewsScrollState, 0)
})

onBeforeUnmount(() => {
  viewsScrollRef.value = null
})
</script>

<style scoped>
.file-shell__control-row {
  width: 100%;
  min-height: 40px;
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) max-content max-content;
  align-items: center;
  column-gap: 10px;
  padding: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 0;
  border-radius: 6px;
}

.file-shell__control-lane {
  display: flex;
  align-items: center;
  position: relative;
  min-width: 0;
}

.file-shell__control-lane-box {
  min-height: 24px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  border: 0;
  border-radius: 6px;
}

.file-shell__control-lane-box--controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 0 6px;
  width: auto;
}

.file-shell__control-lane-box--left-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 0 6px;
  width: auto;
}

.file-shell__control-lane-box--views {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
  padding: 4px 6px;
  width: 100%;
}

.file-shell__control-lane-box--governance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  width: auto;
}

.file-shell__control-governance-set {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.file-shell__control-lane-box--governance .shell-section-toolbar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  color: var(--ds-color-text-subtle);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-toolbar-chip-radius);
  font-family: var(--ds-font-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.file-shell__control-lane-box--governance .shell-section-toolbar__item--ldb,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--system,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--structural,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--governance {
  color: var(--ds-color-brand-black);
  background: var(--ds-color-brand-light-grey);
  border-color: rgba(15, 23, 42, 0.12);
  border-radius: 4px;
  align-self: center;
  flex: 0 0 auto;
}

.file-shell__control-lane-box--governance .shell-section-toolbar__item--ldb .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--system .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--structural .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--governance .shell-section-toolbar__item-label {
  font-family: inherit;
  font-size: 10px;
}

.file-shell__control-lane-box--governance .shell-section-toolbar__item--ldb.shell-section-toolbar__item--active,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--system.shell-section-toolbar__item--active,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--structural.shell-section-toolbar__item--active,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--governance.shell-section-toolbar__item--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

.file-shell__control-lane-box--governance .shell-section-toolbar__item--ldb.shell-section-toolbar__item--active .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--system.shell-section-toolbar__item--active .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--structural.shell-section-toolbar__item--active .shell-section-toolbar__item-label,
.file-shell__control-lane-box--governance .shell-section-toolbar__item--governance.shell-section-toolbar__item--active .shell-section-toolbar__item-label {
  color: var(--ds-color-brand-white);
}

.file-shell__control-views-scroll {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.file-shell__control-views-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.file-shell__control-views-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  min-width: 18px;
  height: 16px;
  padding: 0;
  color: rgba(15, 23, 42, 0.72);
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.file-shell__control-views-nav-btn:disabled {
  opacity: 0.35;
}

.file-shell__control-select-all {
  min-height: 18px;
  margin-left: -1px;
  color: var(--ds-color-text-primary);
}

.file-shell__control-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: var(--ds-radius-round);
  cursor: pointer;
}

.file-shell__control-add:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.04);
}

.file-shell__control-add:disabled {
  opacity: 0.6;
  cursor: default;
}

.file-shell__control-add :deep(.plus-icon-chip) {
  --plus-icon-chip-size: 18px;
  --plus-icon-chip-glyph-size: 12px;
}

.file-shell__control-search {
  width: min(100%, 132px);
  min-width: 88px;
  flex: 0 1 132px;
}

.file-shell__control-search :deep(.q-field__control),
.file-shell__control-search :deep(.q-field__native),
.file-shell__control-search :deep(.q-field__input) {
  min-height: 22px;
  height: 22px;
}

.file-shell__control-search :deep(.q-field__control) {
  padding: 0 8px;
}

.file-shell__control-search :deep(.q-field__prepend) {
  min-width: 16px;
  padding-right: 4px;
}

.file-shell__control-search :deep(.q-field__prepend .q-icon) {
  font-size: 9.6px;
}

.file-shell__control-search :deep(.q-field__native),
.file-shell__control-search :deep(.q-field__input) {
  font-size: var(--ds-font-size-xs);
}

.file-shell__control-filter {
  color: var(--ds-color-text-muted);
}

.file-shell__control-filter :deep(.q-icon) {
  font-size: 15.456px;
}

.file-shell__control-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  color: rgba(15, 23, 42, 0.78);
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.file-shell__control-icon-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.file-shell__control-icon-btn--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
}

.file-shell__control-row-icon,
.file-shell__control-chevron-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.file-shell__control-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-brand-black);
  background: transparent;
  border: 1px solid var(--ds-color-border-default);
  border-radius: 4px;
  font-family: var(--ds-font-body);
  font-weight: var(--ds-font-weight-medium);
  font-size: var(--ds-font-size-xs);
  line-height: 1;
  white-space: nowrap;
}

.file-shell__control-lane-box--views .file-shell__control-chip {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 4px;
}

.file-shell__control-chip--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

.file-shell__control-lane-box--views .file-shell__control-chip--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

@media (max-width: 900px) {
  .file-shell__control-row {
    grid-template-columns: 1fr;
    row-gap: 8px;
  }

  .file-shell__control-lane-box--governance,
  .file-shell__control-lane-box--controls,
  .file-shell__control-lane-box--left-controls {
    flex-wrap: wrap;
  }
}
</style>
