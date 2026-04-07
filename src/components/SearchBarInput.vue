<template>
  <q-input
    :model-value="modelValue"
    dense
    outlined
    borderless
    class="search-bar-input"
    :placeholder="placeholder"
    :disable="disable"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #prepend>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-bar-input {
  width: min(100%, var(--ds-toolbar-search-width));
  min-width: min(100%, var(--ds-toolbar-search-width));
  flex: 0 0 min(100%, var(--ds-toolbar-search-width));
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.search-bar-input :deep(.q-field__control),
.search-bar-input :deep(.q-field__native),
.search-bar-input :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.search-bar-input :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.search-bar-input :deep(.q-field__prepend) {
  height: 100%;
  min-height: inherit;
  align-items: center;
}

.search-bar-input :deep(.q-field__prepend .q-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--ds-icon-size-md) * 0.8);
  transform: translateY(0);
}
</style>
