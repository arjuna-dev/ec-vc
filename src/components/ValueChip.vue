<template>
  <span class="value-chip" :class="`value-chip--${tone}`">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Companies',
  },
  tone: {
    type: String,
    default: 'inverse',
    validator: (value) => ['default', 'inverse', 'menu'].includes(value),
  },
})
</script>

<style scoped>
.value-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--ds-font-title);
  font-weight: var(--ds-font-weight-bold);
  text-transform: lowercase;
}

.value-chip--inverse,
.value-chip--default {
  min-height: var(--ds-control-height-md);
  padding: 0 var(--ds-space-12);
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-radius: var(--ds-radius-sm);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ds-color-brand-white) 82%, transparent);
  font-size: var(--ds-font-size-base);
  line-height: 1;
  letter-spacing: -0.04em;
}

.value-chip--menu {
  min-height: 26px;
  padding: 0 var(--ds-space-8);
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border-radius: var(--ds-radius-sm);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ds-color-brand-white) 82%, transparent);
  font-size: var(--ds-font-size-sm);
  line-height: 0.96;
  letter-spacing: -0.03em;
}
</style>
