<template>
  <div class="record-feed-empty">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'No feed items yet for this record.',
  },
})
</script>

<style scoped>
.record-feed-empty {
  color: var(--ds-record-feed-empty-color);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}
</style>
