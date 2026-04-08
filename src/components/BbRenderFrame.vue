<template>
  <div class="bb-render-frame">
    <slot />
  </div>
</template>

<script setup>
defineOptions({ name: 'BbRenderFrame' })
</script>

<style scoped>
.bb-render-frame {
  width: 100%;
  min-height: 100px;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--ds-color-brand-light-grey);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-brand-white);
}
</style>
