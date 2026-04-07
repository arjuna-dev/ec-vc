<template>
  <div class="record-feed-entry-surface">
    <slot />
  </div>
</template>

<script setup>
defineOptions({
  name: 'RecordFeedEntrySurface',
})
</script>

<style scoped>
.record-feed-entry-surface {
  padding: var(--ds-record-feed-entry-padding-y) var(--ds-record-feed-entry-padding-x);
  background: var(--ds-record-feed-entry-surface);
  border: 1px solid var(--ds-record-feed-entry-border);
  border-radius: var(--ds-record-feed-entry-radius);
}
</style>
