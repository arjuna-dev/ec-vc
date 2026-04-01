<template>
  <OpportunityCreateDialog
    :model-value="modelValue"
    :initial-data="initialData"
    initial-kind="round"
    lock-kind
    @update:model-value="emit('update:modelValue', $event)"
    @created="emit('created', $event)"
  />
</template>

<script setup>
import OpportunityCreateDialog from './OpportunityCreateDialog.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'created'])
</script>
