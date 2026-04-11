<template>
  <q-btn-toggle
    :model-value="modelValue"
    dense
    unelevated
    toggle-color="primary"
    color="grey-3"
    text-color="grey-8"
    class="view-mode-toggle"
    :disable="disable"
    :options="options"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'page',
  },
  options: {
    type: Array,
    default: () => [],
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.view-mode-toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  min-height: var(--ds-toolbar-toggle-button-size);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
}

.view-mode-toggle :deep(.q-btn-group) {
  display: inline-flex;
  align-items: center;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.view-mode-toggle :deep(.q-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--ds-toolbar-toggle-button-size);
  min-height: var(--ds-toolbar-toggle-button-size);
  height: var(--ds-toolbar-toggle-button-size);
  padding-inline: 4px;
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.view-mode-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.view-mode-toggle :deep(.q-icon) {
  font-size: var(--ds-toolbar-toggle-icon-size);
}
</style>
