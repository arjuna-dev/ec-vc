<template>
  <B10IconButton
    icon="edit"
    variant="subtle"
    size="small"
    color="var(--ds-color-brand-blue)"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

defineProps({
  ariaLabel: {
    type: String,
    default: 'Edit row',
  },
})

defineEmits(['click'])
</script>
