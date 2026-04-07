<template>
  <ValueChipSurface :tone="tone">
    <ValueChipLabel :label="label" :tone="tone === 'menu' ? 'menu' : 'default'" />
  </ValueChipSurface>
</template>

<script setup>
import ValueChipLabel from 'src/components/ValueChipLabel.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

defineProps({
  label: {
    type: String,
    default: 'Companies',
  },
  tone: {
    type: String,
    default: 'inverse',
    validator: (value) => ['default', 'inverse', 'menu'].includes(value),
  },
})
</script>
