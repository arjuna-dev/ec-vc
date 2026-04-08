<template>
  <ValueChipSurface tone="default" size="small" class="record-field-label">
    <ButtonLabel :label="label" />
  </ValueChipSurface>
</template>

<script setup>
import ButtonLabel from 'src/components/ButtonLabel.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

defineProps({
  label: {
    type: String,
    default: 'Industry',
  },
})
</script>

<style scoped>
.record-field-label {
  width: fit-content;
  justify-self: start;
}

.record-field-label :deep(.button-label) {
  color: var(--ds-color-brand-white);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
}
</style>
