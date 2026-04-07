<template>
  <q-checkbox
    :model-value="modelValue"
    dense
    size="xs"
    checked-icon="check_box"
    unchecked-icon="check_box_outline_blank"
    class="settings-checkbox"
    :class="`settings-checkbox--${tone}`"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  tone: {
    type: String,
    default: 'light',
    validator: (value) => ['light', 'dark'].includes(value),
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.settings-checkbox--light :deep(.q-checkbox__bg) {
  border-color: rgba(17, 17, 17, 0.92);
  background: transparent;
}

.settings-checkbox--light :deep(.q-checkbox__inner) {
  color: var(--ds-color-brand-black);
}

.settings-checkbox--light :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
  border-color: var(--ds-color-brand-black);
  background: var(--ds-color-brand-black);
}

.settings-checkbox--light :deep(.q-checkbox__svg) {
  color: var(--ds-color-brand-white);
}

.settings-checkbox--dark :deep(.q-checkbox__bg) {
  border-color: rgba(255, 255, 255, 0.92);
  background: transparent;
}

.settings-checkbox--dark :deep(.q-checkbox__inner) {
  color: var(--ds-color-brand-white);
}

.settings-checkbox--dark :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
  border-color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-white);
}

.settings-checkbox--dark :deep(.q-checkbox__svg) {
  color: var(--ds-color-brand-black);
}
</style>
