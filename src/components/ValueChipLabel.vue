<template>
  <span class="value-chip-label" :class="`value-chip-label--${tone}`">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Companies',
  },
  tone: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'menu'].includes(value),
  },
})
</script>

<style scoped>
.value-chip-label {
  display: inline-flex;
  align-items: center;
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-weight: var(--ds-font-weight-bold);
  text-transform: lowercase;
}

.value-chip-label--default {
  font-size: var(--ds-font-size-base);
  line-height: 1;
  letter-spacing: -0.04em;
}

.value-chip-label--menu {
  font-size: var(--ds-font-size-sm);
  line-height: 0.96;
  letter-spacing: -0.03em;
}
</style>
