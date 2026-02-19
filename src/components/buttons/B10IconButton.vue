<template>
  <q-btn
    round
    unelevated
    :ripple="false"
    :class="buttonClasses"
    :icon="icon"
    :disable="isDisabled"
    :loading="loading"
    :padding="padding"
    :aria-label="ariaLabel || icon"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'neutral', 'subtle'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['medium', 'small'].includes(value),
  },
  state: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'hover', 'disabled'].includes(value),
  },
  disable: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'star_border',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])

const isDisabled = computed(() => props.disable || props.state === 'disabled')

const effectiveState = computed(() => {
  if (isDisabled.value) return 'disabled'
  return props.state === 'hover' ? 'hover' : 'default'
})

const padding = computed(() => (props.size === 'small' ? '8px' : '12px'))

const buttonClasses = computed(() => [
  'b10-icon-btn',
  `b10-icon-btn--${props.variant}`,
  `b10-icon-btn--${props.size}`,
  `b10-icon-btn--state-${effectiveState.value}`,
])
</script>

<style scoped lang="scss">
.b10-icon-btn {
  border: 1px solid transparent;
  border-radius: 32px;
  min-height: 0;
  min-width: 0;

  :deep(.q-btn__content) {
    line-height: 1;
  }

  :deep(.q-icon) {
    font-size: 20px;
  }
}

.b10-icon-btn--primary.b10-icon-btn--state-default {
  background: var(--b10-color-bg-brand-default);
  border-color: var(--b10-color-border-brand-default);
  color: var(--b10-color-text-brand-on-brand);
}

.b10-icon-btn--primary.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--primary.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--b10-color-bg-brand-hover);
  border-color: var(--b10-color-border-brand-default);
  color: var(--b10-color-text-brand-on-brand);
}

.b10-icon-btn--neutral.b10-icon-btn--state-default {
  background: var(--b10-color-bg-default-secondary);
  border-color: var(--b10-color-border-default);
  color: var(--b10-color-text-default);
}

.b10-icon-btn--neutral.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--neutral.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--b10-color-bg-default-secondary-hover);
  border-color: var(--b10-color-border-default);
  color: var(--b10-color-text-default);
}

.b10-icon-btn--subtle.b10-icon-btn--state-default {
  background: transparent;
  border-color: transparent;
  color: var(--b10-color-text-default);
}

.b10-icon-btn--subtle.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--subtle.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--b10-color-bg-default-default-hover);
  border-color: transparent;
  color: var(--b10-color-text-default);
}

.b10-icon-btn--state-disabled,
.b10-icon-btn.q-btn--disabled {
  background: var(--b10-color-bg-disabled-default);
  border-color: var(--b10-color-border-disabled-default);
  color: var(--b10-color-text-disabled-on-disabled);
  opacity: 1 !important;
}
</style>
