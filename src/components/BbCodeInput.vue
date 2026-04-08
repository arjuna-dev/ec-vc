<template>
  <q-input
    :model-value="modelValue"
    dense
    outlined
    borderless
    class="bb-code-input"
    :placeholder="placeholder"
    :disable="disable"
    @update:model-value="$emit('update:modelValue', $event)"
    @keyup.enter="$emit('enter')"
  />
</template>

<script setup>
defineOptions({ name: 'BbCodeInput' })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Enter bb:code',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'enter'])
</script>

<style scoped>
.bb-code-input {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-radius-micro);
  box-shadow: var(--ds-control-shadow);
}

.bb-code-input :deep(.q-field__control),
.bb-code-input :deep(.q-field__native),
.bb-code-input :deep(.q-field__input) {
  min-height: calc(var(--ds-control-height-md) * 0.85);
  height: calc(var(--ds-control-height-md) * 0.85);
}

.bb-code-input :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.bb-code-input :deep(.q-field__input),
.bb-code-input :deep(.q-field__native) {
  font-size: var(--ds-font-size-xs);
  text-align: center;
}
</style>
