<template>
  <span class="record-feed-tab-label">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Activity',
  },
})
</script>

<style scoped>
.record-feed-tab-label {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: var(--ds-record-feed-tab-label-size);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-record-feed-tab-label-letter-spacing);
  line-height: var(--ds-record-feed-tab-label-line-height);
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
