<template>
  <span class="button-label">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Button',
  },
})
</script>

<style scoped>
.button-label {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: -0.02em;
  line-height: var(--ds-line-height-xs);
  white-space: nowrap;
}
</style>
