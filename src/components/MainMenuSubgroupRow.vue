<template>
  <div class="main-menu-subgroup-row">
    <span class="main-menu-subgroup-row__label">{{ label }}</span>
    <ToggleRowIcons
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
  min-height: 24px;
  padding: 0;
  color: var(--ds-color-brand-white);
  border: 0;
  background: transparent;
}

.main-menu-subgroup-row__label {
  flex: 1 1 auto;
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: 0.72rem;
  font-weight: var(--ds-font-weight-light);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}
</style>
