<template>
  <section v-if="items.length" class="contact-databook__nav" :aria-label="ariaLabel">
    <button
      v-for="section in items"
      :key="section.value"
      type="button"
      class="contact-databook__nav-item"
      :class="{
        'contact-databook__nav-item--active': modelValue === section.value,
        'contact-databook__nav-item--kdb': section.isKdb,
        'contact-databook__nav-item--system': section.isSystem,
        'contact-databook__nav-item--push-right': section.pushRight,
      }"
      @click="$emit('update:modelValue', section.value)"
    >
      <span class="contact-databook__nav-item-label">{{ section.title }}</span>
      <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
    </button>

    <q-btn-toggle
      v-if="showViewToggle"
      :model-value="viewMode"
      dense
      unelevated
      toggle-color="primary"
      color="grey-3"
      text-color="grey-8"
      class="contact-databook__nav-view-toggle"
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
.contact-databook__nav {
  position: sticky;
  top: 76px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--ds-color-surface-base-88);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  backdrop-filter: blur(14px);
}

.contact-databook__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-databook__nav-item-icon {
  opacity: 0.8;
}

.contact-databook__nav-item:hover {
  color: #111;
  background: rgba(255, 85, 33, 0.08);
  border-color: rgba(255, 85, 33, 0.2);
  transform: translateY(-1px);
}

.contact-databook__nav-item--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.contact-databook__nav-item--kdb {
  border-color: rgba(17, 17, 17, 0.16);
}

.contact-databook__nav-item--system {
  border-color: rgba(17, 17, 17, 0.22);
}

.contact-databook__nav-item--kdb,
.contact-databook__nav-item--system {
  height: 26px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 8px;
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-label,
.contact-databook__nav-item--system .contact-databook__nav-item-label {
  font-size: calc(var(--text-sm---medium) * 0.72);
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-icon {
  font-size: 12px !important;
}

.contact-databook__nav-item--push-right {
  margin-left: 0;
  align-self: center;
}

.contact-databook__nav-view-toggle {
  align-self: center;
  margin-left: 6px;
  order: 999;
}

.contact-databook__nav-view-toggle :deep(.q-btn-group) {
  gap: 0;
}

.contact-databook__nav-view-toggle :deep(.q-btn) {
  min-width: 20px;
  min-height: 20px;
  padding: 0 2px;
  border-radius: 5px;
}

.contact-databook__nav-view-toggle :deep(.q-icon) {
  font-size: 14px;
}

.contact-databook__nav-item:not(.contact-databook__nav-item--push-right) + .contact-databook__nav-item--push-right {
  margin-left: auto;
}
</style>
