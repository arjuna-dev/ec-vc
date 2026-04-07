<template>
  <div class="record-feed-label">{{ label }}</div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Record Feed',
  },
})
</script>

<style scoped>
.record-feed-label {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-size: var(--ds-record-feed-label-size);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-line-height-xs);
  letter-spacing: var(--ds-record-feed-label-letter-spacing);
}
</style>
