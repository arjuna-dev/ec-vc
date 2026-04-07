<template>
  <span class="page-back-label">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Back',
  },
})
</script>

<style scoped>
.page-back-label {
  display: inline-flex;
  align-items: center;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: 0.84rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
</style>
