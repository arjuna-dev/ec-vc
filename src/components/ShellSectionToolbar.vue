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
      <q-icon v-if="section.isKdb" name="share" size="14px" class="shell-section-toolbar__item-icon" />
    </button>

    <q-btn-toggle
      v-if="showViewToggle"
      :model-value="viewMode"
      dense
      unelevated
      toggle-color="primary"
      color="grey-3"
      text-color="grey-8"
      class="shell-section-toolbar__view-toggle"
      :options="viewOptions"
      @update:model-value="$emit('update:viewMode', $event)"
    />
  </section>
</template>

<script setup>
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
  top: 76px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  backdrop-filter: blur(14px);
}

.shell-section-toolbar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  font-family: var(--ds-font-body);
  font-size: var(--text-sm---medium);
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
  color: #111;
  background: rgba(255, 85, 33, 0.08);
  border-color: rgba(255, 85, 33, 0.2);
  transform: translateY(-1px);
}

.shell-section-toolbar__item--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.shell-section-toolbar__item--kdb {
  border-color: rgba(17, 17, 17, 0.16);
}

.shell-section-toolbar__item--system {
  border-color: rgba(17, 17, 17, 0.22);
}

.shell-section-toolbar__item--kdb,
.shell-section-toolbar__item--system {
  height: 26px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 8px;
}

.shell-section-toolbar__item--kdb .shell-section-toolbar__item-label,
.shell-section-toolbar__item--system .shell-section-toolbar__item-label {
  font-size: calc(var(--text-sm---medium) * 0.72);
}

.shell-section-toolbar__item--kdb .shell-section-toolbar__item-icon {
  font-size: 12px !important;
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

.shell-section-toolbar__view-toggle :deep(.q-btn-group) {
  gap: 0;
}

.shell-section-toolbar__view-toggle :deep(.q-btn) {
  min-width: 20px;
  min-height: 20px;
  padding: 0 2px;
  border-radius: 5px;
}

.shell-section-toolbar__view-toggle :deep(.q-icon) {
  font-size: 14px;
}

.shell-section-toolbar__item:not(.shell-section-toolbar__item--push-right) + .shell-section-toolbar__item--push-right {
  margin-left: auto;
}
</style>
