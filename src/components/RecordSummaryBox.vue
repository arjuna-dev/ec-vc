<template>
  <div class="record-summary-box">
    <slot />
  </div>
</template>

<script setup>
defineOptions({ name: 'RecordSummaryBox' })
</script>

<style scoped>
.record-summary-box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow: hidden;
}

.record-summary-box__label {
  color: rgba(17, 17, 17, 0.7);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
}
</style>
