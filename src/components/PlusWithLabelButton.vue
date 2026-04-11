<template>
  <button
    type="button"
    class="plus-with-label-button"
    :class="`plus-with-label-button--${variant}`"
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
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'record-feed'].includes(value),
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

.plus-with-label-button--record-feed {
  min-width: 0;
  min-height: 0;
  height: auto;
  padding: 0;
  color: var(--ds-color-brand-white);
  background: rgba(17, 17, 17, 1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 2px;
  line-height: 1;
  width: fit-content;
}

.plus-with-label-button--record-feed:hover,
.plus-with-label-button--record-feed:focus-visible {
  background: rgba(32, 32, 32, 1);
}

.plus-with-label-button--record-feed .plus-with-label-button__inner {
  gap: 0;
}

.plus-with-label-button--record-feed .plus-with-label-button__icon {
  margin: 0;
  line-height: 0;
}

.plus-with-label-button--record-feed .plus-with-label-button__label {
  display: block;
  font-size: 10px;
  line-height: 1;
  padding: 0;
  margin: 0;
  white-space: nowrap;
}

.plus-with-label-button--record-feed :deep(.plus-icon-chip) {
  --plus-icon-chip-size: 4px;
  --plus-icon-chip-glyph-size: 4px;
  background: var(--ds-color-brand-white);
  color: var(--ds-color-brand-black);
  border-radius: 2px;
}
</style>
