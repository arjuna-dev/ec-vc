<template>
  <div
    v-if="options.length"
    class="fork-selector-surface"
    :data-hover-label="hoverLabel"
  >
    <LiveActionL1
      :model-value="modelValue"
      :options="options"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import LiveActionL1 from 'src/components/LiveActionL1.vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  hoverLabel: {
    type: String,
    default: 'Live Action L1',
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.fork-selector-surface {
  position: relative;
  justify-self: start;
  min-width: 0;
}

.fork-selector-surface::before {
  content: attr(data-hover-label);
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  padding: 3px 6px;
  color: rgba(17, 17, 17, 0.62);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-radius-sm);
  font-family: var(--ds-font-body);
  font-size: 0.68rem;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateY(2px);
  transition: opacity 120ms ease, transform 120ms ease;
}

.fork-selector-surface:hover::before,
.fork-selector-surface:focus-within::before {
  opacity: 1;
  transform: translateY(0);
}
</style>
