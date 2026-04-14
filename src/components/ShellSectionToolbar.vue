<template>
  <section
    v-if="items.length"
    class="shell-section-toolbar"
    :class="{ 'shell-section-toolbar--mini': variant === 'mini' }"
    :style="{ gridTemplateColumns: toolbarGridTemplateColumns }"
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

    <div
      v-if="structuralItems.length"
      ref="dataLaneRef"
      class="shell-section-toolbar__lane shell-section-toolbar__lane--data"
      :class="{ 'shell-section-toolbar__lane--with-divider': hasVisibleLaneBeforeData }"
    >
      <div
        v-if="canResizeDataLane"
        class="shell-section-toolbar__divider-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize data lane"
        @mousedown.prevent="startLaneResize('data', $event)"
      />
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

    <div
      v-if="governanceItems.length"
      ref="governanceLaneRef"
      class="shell-section-toolbar__lane shell-section-toolbar__lane--governance"
      :class="{ 'shell-section-toolbar__lane--with-divider': hasVisibleLaneBeforeGovernance }"
    >
      <div
        v-if="canResizeGovernanceLane"
        class="shell-section-toolbar__divider-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize governance lane"
        @mousedown.prevent="startLaneResize('governance', $event)"
      />
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

    <div
      v-if="showViewToggle"
      class="shell-section-toolbar__lane shell-section-toolbar__lane--right"
      :class="{ 'shell-section-toolbar__lane--with-divider': hasVisibleLaneBeforeRight }"
    >
      <ViewModeToggle
        :model-value="viewMode"
        class="shell-section-toolbar__view-toggle"
        :options="viewOptions"
        @update:model-value="$emit('update:viewMode', $event)"
      />
    </div>

    <div
      v-if="hasSuffixSlot"
      class="shell-section-toolbar__lane shell-section-toolbar__lane--suffix"
      :class="{ 'shell-section-toolbar__lane--with-divider': hasVisibleLaneBeforeSuffix }"
    >
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
const dataLaneRef = ref(null)
const governanceLaneRef = ref(null)
const dataLaneScrollRef = ref(null)
const canScrollDataPrev = ref(false)
const canScrollDataNext = ref(false)
let dataLaneResizeObserver = null
const dataLaneWidth = ref(null)
const governanceLaneWidth = ref(null)
const resizeState = ref(null)

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
const hasVisibleLaneBeforeData = computed(() =>
  hasPrefixSlot.value || leftItems.value.length > 0,
)
const hasVisibleLaneBeforeGovernance = computed(() =>
  hasVisibleLaneBeforeData.value || structuralItems.value.length > 0,
)
const hasVisibleLaneBeforeRight = computed(() =>
  hasVisibleLaneBeforeGovernance.value || governanceItems.value.length > 0,
)
const hasVisibleLaneBeforeSuffix = computed(() =>
  hasVisibleLaneBeforeRight.value || props.showViewToggle,
)
const canResizeDataLane = computed(() =>
  structuralItems.value.length > 0 && (governanceItems.value.length > 0 || props.showViewToggle || hasSuffixSlot.value),
)
const canResizeGovernanceLane = computed(() =>
  governanceItems.value.length > 0 && (props.showViewToggle || hasSuffixSlot.value),
)
const toolbarGridTemplateColumns = computed(() => {
  const leftWidth = hasPrefixSlot.value || leftItems.value.length > 0 ? 'max-content' : '0px'
  const dataWidth = structuralItems.value.length > 0
    ? (dataLaneWidth.value ? `${Math.round(dataLaneWidth.value)}px` : 'minmax(220px, 1fr)')
    : '0px'
  const governanceWidth = governanceItems.value.length > 0
    ? (governanceLaneWidth.value ? `${Math.round(governanceLaneWidth.value)}px` : 'max-content')
    : '0px'
  const rightWidth = props.showViewToggle ? 'max-content' : '0px'
  const suffixWidth = hasSuffixSlot.value ? 'max-content' : '0px'
  return [leftWidth, dataWidth, governanceWidth, rightWidth, suffixWidth].join(' ')
})

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

function startLaneResize(lane, event) {
  const targetRef = lane === 'governance' ? governanceLaneRef.value : dataLaneRef.value
  if (!targetRef || typeof window === 'undefined') return
  resizeState.value = {
    lane,
    startX: event.clientX,
    startWidth: targetRef.getBoundingClientRect().width,
  }
  window.addEventListener('mousemove', onLaneResizeMove)
  window.addEventListener('mouseup', stopLaneResize)
}

function onLaneResizeMove(event) {
  const state = resizeState.value
  if (!state) return
  const delta = event.clientX - state.startX
  const nextWidth = Math.max(state.lane === 'governance' ? 140 : 220, state.startWidth + delta)
  if (state.lane === 'governance') {
    governanceLaneWidth.value = nextWidth
    return
  }
  dataLaneWidth.value = nextWidth
}

function stopLaneResize() {
  resizeState.value = null
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onLaneResizeMove)
    window.removeEventListener('mouseup', stopLaneResize)
  }
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
  stopLaneResize()
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
  margin-top: var(--ds-space-12);
  box-sizing: border-box;
  background: rgba(255, 159, 67, 0.24);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: var(--ds-panel-blur-md);
  box-shadow:
    0 1px 0 rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06);
}

.shell-section-toolbar__lane {
  display: flex;
  align-items: center;
  gap: var(--ds-toolbar-gap-sm);
  min-width: 0;
  position: relative;
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

.shell-section-toolbar__lane--with-divider::before {
  content: '';
  position: absolute;
  left: calc(var(--ds-toolbar-gap-sm) * -0.5);
  top: 50%;
  width: 1px;
  height: 50%;
  transform: translateY(-50%);
  background: rgba(15, 23, 42, 0.14);
  pointer-events: none;
}

.shell-section-toolbar__divider-handle {
  position: absolute;
  top: 50%;
  right: calc(var(--ds-toolbar-gap-sm) * -0.5);
  width: 12px;
  height: 70%;
  transform: translate(50%, -50%);
  padding: 0;
  background: transparent;
  border: 0;
  cursor: col-resize;
  z-index: 2;
}

.shell-section-toolbar__divider-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1px;
  height: 70%;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.18);
}

.shell-section-toolbar__divider-handle:hover::before {
  background: rgba(15, 23, 42, 0.36);
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

.shell-section-toolbar__item--active .shell-section-toolbar__item-label,
.shell-section-toolbar__item--active .shell-section-toolbar__item-icon {
  color: var(--ds-color-brand-white);
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
