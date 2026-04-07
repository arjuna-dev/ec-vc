<template>
  <div class="page-title-text">{{ title }}</div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.page-title-text {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-page-title);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.95;
  letter-spacing: -0.08em;
  white-space: nowrap;
}
</style>
