<template>
  <div class="record-feed-time">{{ label }}</div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Most Recent',
  },
})
</script>

<style scoped>
.record-feed-time {
  color: var(--ds-record-feed-time-color);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-record-feed-time-size);
  line-height: var(--ds-record-feed-time-line-height);
}
</style>
