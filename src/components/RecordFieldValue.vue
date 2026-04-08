<template>
  <div class="record-field-value">{{ value }}</div>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    default: 'Enterprise SaaS',
  },
})
</script>

<style scoped>
.record-field-value {
  display: inline-flex;
  width: fit-content;
  padding: 4px 8px;
  color: var(--ds-color-brand-dark-grey);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.42);
  border: 0;
  border-radius: 4px;
  backdrop-filter: blur(10px);
}
</style>
