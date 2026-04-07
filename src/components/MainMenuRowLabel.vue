<template>
  <span class="main-menu-row-label">{{ label }}</span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'System Files',
  },
})
</script>

<style scoped>
.main-menu-row-label {
  flex: 1 1 auto;
  min-width: 0;
  color: inherit;
  font-family: var(--ds-font-body);
  font-size: 13px;
  font-weight: var(--ds-font-weight-light);
  line-height: 1.2;
}
</style>
