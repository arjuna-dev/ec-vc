<template>
  <div class="record-title">{{ title }}</div>
</template>

<script setup>
defineOptions({
  name: 'RecordTitle',
})

defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.record-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-hero);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.95;
  letter-spacing: -0.08em;
  white-space: nowrap;
}
</style>
