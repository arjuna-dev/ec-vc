<template>
  <section
    v-if="items.length"
    class="shell-section-toolbar"
    :class="{ 'shell-section-toolbar--mini': variant === 'mini' }"
    :aria-label="ariaLabel"
  >
    <div
      v-if="hasPrefixSlot || leftItems.length"
      class="shell-section-toolbar__lane shell-section-toolbar__lane--left"
    >
      <slot name="prefix" />
      <button
        v-for="section in leftItems"
        :key="section.value"
        type="button"
        class="shell-section-toolbar__item"
        :class="{
          'shell-section-toolbar__item--active': modelValue === section.value,
        }"
        @click="$emit('update:modelValue', section.value)"
      >
        <span class="shell-section-toolbar__item-label">{{ section.title }}</span>
      </button>
    </div>

    <div v-if="structuralItems.length" class="shell-section-toolbar__lane shell-section-toolbar__lane--data">
      <button
        v-if="showDataLaneScrollControls"
        type="button"
        class="shell-section-toolbar__scroll-btn"
        :disabled="!canScrollDataPrev"
        aria-label="Scroll data labels left"
        @click="scrollDataLane(-1)"
      >
        <q-icon name="chevron_left" size="16px" />
      </button>

      <div
        ref="dataLaneScrollRef"
        class="shell-section-toolbar__lane-scroll ds-mini-scrollbar"
        @scroll="updateDataLaneScrollState"
      >
        <button
          v-for="section in structuralItems"
          :key="section.value"
          type="button"
          class="shell-section-toolbar__item"
          :class="{
            'shell-section-toolbar__item--active': modelValue === section.value,
            'shell-section-toolbar__item--ldb': itemTone(section) === 'ldb',
            'shell-section-toolbar__item--system': itemTone(section) === 'system',
            'shell-section-toolbar__item--governance': itemTone(section) === 'governance',
          }"
          @click="$emit('update:modelValue', section.value)"
        >
          <span class="shell-section-toolbar__item-label">{{ section.title }}</span>
          <q-icon v-if="itemTone(section) === 'ldb'" name="share" :size="'var(--ds-toolbar-chip-toggle-icon-size)'" class="shell-section-toolbar__item-icon" />
        </button>
      </div>

      <button
        v-if="showDataLaneScrollControls"
        type="button"
        class="shell-section-toolbar__scroll-btn"
        :disabled="!canScrollDataNext"
        aria-label="Scroll data labels right"
        @click="scrollDataLane(1)"
      >
        <q-icon name="chevron_right" size="16px" />
      </button>
    </div>

    <div v-if="governanceItems.length" class="shell-section-toolbar__lane shell-section-toolbar__lane--governance">
      <button
        v-for="section in governanceItems"
        :key="section.value"
        type="button"
        class="shell-section-toolbar__item"
        :class="{
          'shell-section-toolbar__item--active': modelValue === section.value,
          'shell-section-toolbar__item--governance': itemTone(section) === 'governance',
        }"
        @click="$emit('update:modelValue', section.value)"
      >
        <span class="shell-section-toolbar__item-label">{{ section.title }}</span>
      </button>
    </div>

    <div v-if="showViewToggle" class="shell-section-toolbar__lane shell-section-toolbar__lane--right">
      <ViewModeToggle
        :model-value="viewMode"
        class="shell-section-toolbar__view-toggle"
        :options="viewOptions"
        @update:model-value="$emit('update:viewMode', $event)"
      />
    </div>

    <div v-if="hasSuffixSlot" class="shell-section-toolbar__lane shell-section-toolbar__lane--suffix">
      <slot name="suffix" />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import ViewModeToggle from 'src/components/ViewModeToggle.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'page' },
  viewOptions: { type: Array, default: () => [] },
  showViewToggle: { type: Boolean, default: true },
  ariaLabel: { type: String, default: 'Sections' },
  variant: { type: String, default: 'default' },
})

defineEmits(['update:modelValue', 'update:viewMode'])

const slots = useSlots()
const dataLaneScrollRef = ref(null)
const canScrollDataPrev = ref(false)
const canScrollDataNext = ref(false)
let dataLaneResizeObserver = null

const leftItems = computed(() =>
  props.items.filter((section) => itemLane(section) === 'left'),
)
const structuralItems = computed(() =>
  props.items.filter((section) => itemLane(section) === 'structural'),
)
const governanceItems = computed(() =>
  props.items.filter((section) => itemLane(section) === 'governance'),
)
const hasPrefixSlot = computed(() => Boolean(slots.prefix))
const hasSuffixSlot = computed(() => Boolean(slots.suffix))
const showDataLaneScrollControls = computed(() => canScrollDataPrev.value || canScrollDataNext.value)

function itemLane(section = {}) {
  if (section?.lane) return String(section.lane).trim().toLowerCase()
  return 'left'
}

function itemTone(section = {}) {
  if (section?.tone) return String(section.tone).trim().toLowerCase()
  return 'default'
}

function updateDataLaneScrollState() {
  const element = dataLaneScrollRef.value
  if (!element) {
    canScrollDataPrev.value = false
    canScrollDataNext.value = false
    return
  }
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  canScrollDataPrev.value = element.scrollLeft > 2
  canScrollDataNext.value = element.scrollLeft < (maxScrollLeft - 2)
}

function scrollDataLane(direction = 1) {
  const element = dataLaneScrollRef.value
  if (!element) return
  const delta = Math.max(120, Math.round(element.clientWidth * 0.45)) * (direction >= 0 ? 1 : -1)
  element.scrollBy({ left: delta, behavior: 'smooth' })
  window.setTimeout(updateDataLaneScrollState, 180)
}

watch(
  () => structuralItems.value.map((item) => item.value).join('|'),
  async () => {
    await nextTick()
    updateDataLaneScrollState()
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateDataLaneScrollState)
  }
  if (typeof ResizeObserver !== 'undefined' && dataLaneScrollRef.value) {
    dataLaneResizeObserver = new ResizeObserver(() => updateDataLaneScrollState())
    dataLaneResizeObserver.observe(dataLaneScrollRef.value)
  }
  nextTick(() => updateDataLaneScrollState())
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateDataLaneScrollState)
  }
  dataLaneResizeObserver?.disconnect?.()
})
</script>

<style scoped>
.shell-section-toolbar {
  position: sticky;
  top: var(--ds-toolbar-sticky-top);
  z-index: 3;
  display: grid;
  width: 100%;
  grid-template-columns: max-content minmax(0, 1fr) max-content max-content max-content;
  align-items: center;
  column-gap: var(--ds-toolbar-gap-sm);
  row-gap: var(--ds-toolbar-gap-sm);
  padding: var(--ds-toolbar-padding-sm);
  box-sizing: border-box;
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: var(--ds-panel-blur-md);
}

.shell-section-toolbar__lane {
  display: flex;
  align-items: center;
  gap: var(--ds-toolbar-gap-sm);
  min-width: 0;
}

.shell-section-toolbar__lane--left {
  flex-wrap: wrap;
  width: 100%;
}

.shell-section-toolbar__lane--mid,
.shell-section-toolbar__lane--data,
.shell-section-toolbar__lane--governance,
.shell-section-toolbar__lane--right,
.shell-section-toolbar__lane--suffix {
  justify-content: flex-start;
  white-space: nowrap;
}

.shell-section-toolbar__lane--data {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  width: 100%;
}

.shell-section-toolbar__lane-scroll {
  display: flex;
  align-items: center;
  gap: var(--ds-toolbar-gap-sm);
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
}

.shell-section-toolbar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--ds-toolbar-chip-padding-y) var(--ds-toolbar-chip-padding-x);
  color: var(--ds-color-text-subtle);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-toolbar-chip-radius);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.shell-section-toolbar__item-icon {
  opacity: 0.8;
}

.shell-section-toolbar__item:hover {
  color: var(--ds-color-text-primary);
  background: var(--ds-color-fill-subtle);
  border-color: var(--ds-color-border-dashed);
  transform: translateY(-1px);
}

.shell-section-toolbar__scroll-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  color: var(--ds-color-text-subtle);
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 6px;
  cursor: pointer;
}

.shell-section-toolbar__scroll-btn:hover:not(:disabled) {
  color: var(--ds-color-text-primary);
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(15, 23, 42, 0.18);
}

.shell-section-toolbar__scroll-btn:disabled {
  opacity: 0.36;
  cursor: default;
}

.shell-section-toolbar__item--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

.shell-section-toolbar__item--ldb {
  border-color: var(--ds-color-border-dashed);
}

.shell-section-toolbar__item--system {
  border-color: var(--ds-color-border-dashed);
}

.shell-section-toolbar__item--governance {
  border-color: var(--ds-color-border-dashed);
}

.shell-section-toolbar__item--ldb,
.shell-section-toolbar__item--system,
.shell-section-toolbar__item--governance {
  height: var(--ds-toolbar-chip-compact-height);
  min-height: var(--ds-toolbar-chip-compact-height);
  padding: 0 var(--ds-toolbar-chip-compact-padding-x);
  border-radius: var(--ds-toolbar-chip-compact-radius);
  align-self: center;
  flex: 0 0 auto;
}

.shell-section-toolbar__item--ldb .shell-section-toolbar__item-label,
.shell-section-toolbar__item--system .shell-section-toolbar__item-label,
.shell-section-toolbar__item--governance .shell-section-toolbar__item-label {
  font-size: var(--ds-font-size-xs);
}

.shell-section-toolbar__item--ldb .shell-section-toolbar__item-icon {
  font-size: var(--ds-toolbar-ldb-icon-size) !important;
}

.shell-section-toolbar--mini .shell-section-toolbar__lane--left,
.shell-section-toolbar--mini .shell-section-toolbar__lane--data,
.shell-section-toolbar--mini .shell-section-toolbar__lane--governance {
  padding: 4px;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.shell-section-toolbar--mini {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  backdrop-filter: none;
}

.shell-section-toolbar--mini .shell-section-toolbar__lane--data,
.shell-section-toolbar--mini .shell-section-toolbar__lane--governance {
  gap: calc(var(--ds-toolbar-gap-sm) * 0.75);
}

.shell-section-toolbar--mini .shell-section-toolbar__lane-scroll {
  gap: calc(var(--ds-toolbar-gap-sm) * 0.75);
}

.shell-section-toolbar--mini .shell-section-toolbar__item {
  border-radius: 4px;
}

.shell-section-toolbar--mini .shell-section-toolbar__item--ldb,
.shell-section-toolbar--mini .shell-section-toolbar__item--system,
.shell-section-toolbar--mini .shell-section-toolbar__item--governance {
  color: var(--ds-color-brand-black);
  background: transparent;
  border-color: rgba(15, 23, 42, 0.12);
}

.shell-section-toolbar--mini .shell-section-toolbar__item--ldb:hover,
.shell-section-toolbar--mini .shell-section-toolbar__item--system:hover,
.shell-section-toolbar--mini .shell-section-toolbar__item--governance:hover {
  color: var(--ds-color-brand-black);
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(15, 23, 42, 0.18);
}

.shell-section-toolbar--mini .shell-section-toolbar__item--ldb.shell-section-toolbar__item--active,
.shell-section-toolbar--mini .shell-section-toolbar__item--system.shell-section-toolbar__item--active,
.shell-section-toolbar--mini .shell-section-toolbar__item--governance.shell-section-toolbar__item--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

.shell-section-toolbar--mini .shell-section-toolbar__item--ldb,
.shell-section-toolbar--mini .shell-section-toolbar__item--system,
.shell-section-toolbar--mini .shell-section-toolbar__item--governance {
  height: var(--ds-toolbar-chip-compact-height);
  min-height: var(--ds-toolbar-chip-compact-height);
  padding: 0 var(--ds-toolbar-chip-compact-padding-x);
  align-self: center;
  flex: 0 0 auto;
}

.shell-section-toolbar--mini .shell-section-toolbar__item--ldb .shell-section-toolbar__item-label,
.shell-section-toolbar--mini .shell-section-toolbar__item--system .shell-section-toolbar__item-label,
.shell-section-toolbar--mini .shell-section-toolbar__item--governance .shell-section-toolbar__item-label {
  font-family: inherit;
  font-weight: inherit;
  font-size: calc(var(--ds-font-size-xs) * 0.75);
}

.shell-section-toolbar--mini .shell-section-toolbar__lane--governance .shell-section-toolbar__item--governance:not(.shell-section-toolbar__item--active) {
  background: color-mix(in srgb, var(--ds-color-brand-light-grey) 78%, white);
}

.shell-section-toolbar--mini .shell-section-toolbar__lane--governance .shell-section-toolbar__item--governance:not(.shell-section-toolbar__item--active):hover {
  background: color-mix(in srgb, var(--ds-color-brand-light-grey) 58%, white);
}


.shell-section-toolbar__view-toggle {
  align-self: center;
}

.shell-section-toolbar__view-toggle {
  --ds-toolbar-toggle-button-size: var(--ds-toolbar-chip-toggle-size);
  --ds-toolbar-toggle-icon-size: var(--ds-toolbar-chip-toggle-icon-size);
}

@media (max-width: 900px) {
  .shell-section-toolbar {
    grid-template-columns: 1fr;
  }

  .shell-section-toolbar__lane--left,
  .shell-section-toolbar__lane--data,
  .shell-section-toolbar__lane--governance,
  .shell-section-toolbar__lane--right,
  .shell-section-toolbar__lane--suffix {
    flex-wrap: wrap;
  }

  .shell-section-toolbar__lane--data {
    grid-template-columns: 1fr;
  }
}

</style>
