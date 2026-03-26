<template>
  <OpportunityCreateDialog
    :model-value="modelValue"
    initial-kind="fund"
    lock-kind
    @update:model-value="emit('update:modelValue', $event)"
    @created="emit('created', $event)"
  />
</template>

<script setup>
import OpportunityCreateDialog from './OpportunityCreateDialog.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])
</script>
