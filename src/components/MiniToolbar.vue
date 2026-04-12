<template>
  <ShellSectionToolbar
    :model-value="modelValue"
    :items="items"
    :view-mode="viewMode"
    :view-options="viewOptions"
    :show-view-toggle="showViewToggle"
    :aria-label="ariaLabel"
    variant="mini"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:view-mode="$emit('update:viewMode', $event)"
  />
</template>

<script setup>
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'

defineOptions({ name: 'MiniToolbar' })

defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'page' },
  viewOptions: { type: Array, default: () => [] },
  showViewToggle: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Mini Toolbar' },
})

defineEmits(['update:modelValue', 'update:viewMode'])
</script>
