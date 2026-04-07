<template>
  <div class="main-menu-subgroup-row">
    <span class="main-menu-subgroup-row__label">{{ label }}</span>
    <ToggleRowIcons
      label=""
      :expanded="expanded"
      tone="muted"
    />
  </div>
</template>

<script setup>
import ToggleRowIcons from 'src/components/ToggleRowIcons.vue'

defineProps({
  label: {
    type: String,
    default: 'Shells',
  },
  expanded: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.main-menu-subgroup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-8);
  width: 100%;
  min-height: var(--ds-control-height-sm);
  padding: 0;
  color: var(--ds-color-brand-white);
  border: 0;
  background: transparent;
}

.main-menu-subgroup-row__label {
  flex: 1 1 auto;
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: var(--ds-nav-subgroup-font-size);
  font-weight: var(--ds-font-weight-light);
  letter-spacing: var(--ds-nav-subgroup-letter-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.main-menu-subgroup-row :deep(.toggle-row-icons) {
  color: rgb(255 255 255 / 0.78);
}
</style>
