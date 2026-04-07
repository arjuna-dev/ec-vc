<template>
  <button
    type="button"
    class="plus-with-label-button"
    :aria-label="ariaLabel || label"
    :disabled="disable"
    @click="$emit('click', $event)"
  >
    <span class="plus-with-label-button__inner">
      <PlusIconChip class="plus-with-label-button__icon" />
      <span class="plus-with-label-button__label">{{ label }}</span>
    </span>
  </button>
</template>

<script setup>
import PlusIconChip from 'src/components/PlusIconChip.vue'

defineProps({
  label: {
    type: String,
    default: 'Add Record',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.plus-with-label-button {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--ds-control-height-lg);
  min-height: var(--ds-control-height-lg);
  height: var(--ds-control-height-lg);
  padding: 0 var(--ds-space-12);
  color: var(--ds-color-brand-black);
  background: var(--ds-color-brand-white);
  border: 0;
  border-radius: var(--ds-radius-pill);
  box-shadow: none;
  white-space: nowrap;
  cursor: pointer;
}

.plus-with-label-button:hover,
.plus-with-label-button:focus-visible {
  background: var(--ds-color-surface-subtle);
}

.plus-with-label-button:disabled {
  cursor: default;
  opacity: 0.6;
}

.plus-with-label-button__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-12);
}

.plus-with-label-button__icon {
  flex: 0 0 auto;
}

.plus-with-label-button__label {
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-plus-label-line-height);
  letter-spacing: 0.01em;
}
</style>
