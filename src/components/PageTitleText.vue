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
  font-family: var(--font-title);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
  white-space: nowrap;
}
</style>
