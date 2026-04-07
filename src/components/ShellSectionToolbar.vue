<template>
  <section v-if="items.length" class="shell-section-toolbar" :aria-label="ariaLabel">
    <button
      v-for="section in items"
      :key="section.value"
      type="button"
      class="shell-section-toolbar__item"
      :class="{
        'shell-section-toolbar__item--active': modelValue === section.value,
        'shell-section-toolbar__item--kdb': section.isKdb,
        'shell-section-toolbar__item--system': section.isSystem,
        'shell-section-toolbar__item--push-right': section.pushRight,
      }"
      @click="$emit('update:modelValue', section.value)"
    >
      <span class="shell-section-toolbar__item-label">{{ section.title }}</span>
      <q-icon v-if="section.isKdb" name="share" :size="'var(--ds-toolbar-chip-toggle-icon-size)'" class="shell-section-toolbar__item-icon" />
    </button>

    <ViewModeToggle
      v-if="showViewToggle"
      :model-value="viewMode"
      class="shell-section-toolbar__view-toggle"
      :options="viewOptions"
      @update:model-value="$emit('update:viewMode', $event)"
    />
  </section>
</template>

<script setup>
import ViewModeToggle from 'src/components/ViewModeToggle.vue'

defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'grid' },
  viewOptions: { type: Array, default: () => [] },
  showViewToggle: { type: Boolean, default: true },
  ariaLabel: { type: String, default: 'Sections' },
})

defineEmits(['update:modelValue', 'update:viewMode'])
</script>

<style scoped>
.shell-section-toolbar {
  position: sticky;
  top: var(--ds-toolbar-sticky-top);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--ds-toolbar-gap-sm);
  flex-wrap: wrap;
  padding: var(--ds-toolbar-padding-sm);
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: var(--ds-panel-blur-md);
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

.shell-section-toolbar__item--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-color: var(--ds-color-brand-black);
}

.shell-section-toolbar__item--kdb {
  border-color: var(--ds-color-border-dashed);
}

.shell-section-toolbar__item--system {
  border-color: var(--ds-color-border-dashed);
}

.shell-section-toolbar__item--kdb,
.shell-section-toolbar__item--system {
  height: var(--ds-toolbar-chip-compact-height);
  min-height: var(--ds-toolbar-chip-compact-height);
  padding: 0 var(--ds-toolbar-chip-compact-padding-x);
  border-radius: var(--ds-toolbar-chip-compact-radius);
}

.shell-section-toolbar__item--kdb .shell-section-toolbar__item-label,
.shell-section-toolbar__item--system .shell-section-toolbar__item-label {
  font-size: var(--ds-font-size-xs);
}

.shell-section-toolbar__item--kdb .shell-section-toolbar__item-icon {
  font-size: var(--ds-toolbar-kdb-icon-size) !important;
}

.shell-section-toolbar__item--push-right {
  margin-left: 0;
  align-self: center;
}

.shell-section-toolbar__view-toggle {
  align-self: center;
  margin-left: 6px;
  order: 999;
}

.shell-section-toolbar__view-toggle {
  --ds-toolbar-toggle-button-size: var(--ds-toolbar-chip-toggle-size);
  --ds-toolbar-toggle-icon-size: var(--ds-toolbar-chip-toggle-icon-size);
}

.shell-section-toolbar__item:not(.shell-section-toolbar__item--push-right) + .shell-section-toolbar__item--push-right {
  margin-left: auto;
}
</style>
