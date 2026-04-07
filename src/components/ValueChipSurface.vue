<template>
  <span class="value-chip-surface" :class="`value-chip-surface--${tone}`">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'inverse', 'menu'].includes(value),
  },
})
</script>

<style scoped>
.value-chip-surface {
  display: inline-flex;
  align-items: center;
  background: var(--ds-color-brand-black);
  color: var(--ds-color-brand-white);
  border-radius: var(--ds-radius-sm);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ds-color-brand-white) 82%, transparent);
}

.value-chip-surface--default,
.value-chip-surface--inverse {
  min-height: var(--ds-control-height-md);
  padding: 0 var(--ds-space-12);
}

.value-chip-surface--menu {
  min-height: 26px;
  padding: 0 var(--ds-space-8);
}
</style>
