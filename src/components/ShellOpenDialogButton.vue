<template>
  <B10Button
    :label="resolvedLabel"
    variant="neutral"
    size="small"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import B10Button from 'src/components/buttons/B10Button.vue'

const props = defineProps({
  kind: {
    type: String,
    default: 'record',
    validator: (value) => ['record', 'file', 'bb', 'fork'].includes(value),
  },
  label: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])

const resolvedLabel = computed(() => {
  const explicit = String(props.label || '').trim()
  if (explicit) return explicit

  if (props.kind === 'fork') return 'Open Fork'
  if (props.kind === 'file') return 'Open File Dialog'
  if (props.kind === 'bb') return 'Open BB Shell'
  return 'Open Dialog'
})
</script>
