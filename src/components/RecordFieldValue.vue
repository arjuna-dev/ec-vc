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
  color: rgba(17, 17, 17, 0.66);
  font-family: var(--ds-font-family-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.42);
  border: 0;
  border-radius: 4px;
  backdrop-filter: blur(10px);
}
</style>
