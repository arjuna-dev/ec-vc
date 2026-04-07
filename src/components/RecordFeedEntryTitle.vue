<template>
  <div class="record-feed-entry-title">{{ title }}</div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Updated record note',
  },
})
</script>

<style scoped>
.record-feed-entry-title {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}
</style>
