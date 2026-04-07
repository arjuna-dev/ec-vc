<template>
  <div class="record-fields-box">
    <div class="record-fields-box__label">Field's Box</div>
  </div>
</template>

<script setup>
defineOptions({ name: 'RecordFieldsBox' })
</script>

<style scoped>
.record-fields-box {
  width: 100%;
  min-height: 72px;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.record-fields-box__label {
  color: rgba(17, 17, 17, 0.7);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
}
</style>
