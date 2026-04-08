<template>
  <div class="bb-selection-frame">
    <slot />
  </div>
</template>

<script setup>
defineOptions({ name: 'BbSelectionFrame' })
</script>

<style scoped>
.bb-selection-frame {
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid var(--ds-color-brand-light-grey);
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.72);
  overflow: auto;
}
</style>
