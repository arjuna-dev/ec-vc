<template>
  <q-btn
    no-caps
    unelevated
    :ripple="false"
    :class="buttonClasses"
    :label="label"
    :icon="iconStart || void 0"
    :icon-right="iconEnd || void 0"
    :disable="isDisabled"
    :loading="loading"
    :padding="padding"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'Button',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'subtle'].includes(value),
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
  iconStart: {
    type: String,
    default: '',
  },
  iconEnd: {
    type: String,
    default: '',
  },
  block: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const isDisabled = computed(() => props.disable || props.state === 'disabled')

const effectiveState = computed(() => {
  if (isDisabled.value) return 'disabled'
  return props.state === 'hover' ? 'hover' : 'default'
})

const padding = computed(() => (props.size === 'small' ? '8px 8px' : '12px 12px'))

const buttonClasses = computed(() => [
  'b10-btn-danger',
  `b10-btn-danger--${props.variant}`,
  `b10-btn-danger--${props.size}`,
  `b10-btn-danger--state-${effectiveState.value}`,
  {
    'b10-btn-danger--block': props.block,
  },
])
</script>

<style scoped lang="scss">
.b10-btn-danger {
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 0;
  line-height: 1;
  min-height: 0;

  :deep(.q-btn__content) {
    gap: 8px;
    line-height: 1;
  }

  :deep(.q-icon) {
    font-size: 16px;
  }
}

.b10-btn-danger--block {
  width: 100%;
}

.b10-btn-danger--primary.b10-btn-danger--state-default {
  background: var(--b10-color-bg-danger-default);
  border-color: var(--b10-color-border-danger-secondary);
  color: var(--b10-color-text-danger-on-danger);
}

.b10-btn-danger--primary.b10-btn-danger--state-default:not(.q-btn--disabled):hover,
.b10-btn-danger--primary.b10-btn-danger--state-hover:not(.q-btn--disabled) {
  background: var(--b10-color-bg-danger-hover);
  border-color: var(--b10-color-border-danger-default);
  color: var(--b10-color-text-danger-on-danger);
}

.b10-btn-danger--subtle.b10-btn-danger--state-default {
  background: transparent;
  border-color: transparent;
  color: var(--b10-color-text-danger-default);
}

.b10-btn-danger--subtle.b10-btn-danger--state-default:not(.q-btn--disabled):hover,
.b10-btn-danger--subtle.b10-btn-danger--state-hover:not(.q-btn--disabled) {
  background: var(--b10-color-bg-danger-tertiary-hover);
  border-color: var(--b10-color-border-danger-default);
  color: var(--b10-color-text-danger-default);
}

.b10-btn-danger--state-disabled,
.b10-btn-danger.q-btn--disabled {
  background: var(--b10-color-bg-disabled-default);
  border-color: var(--b10-color-border-disabled-default);
  color: var(--b10-color-text-disabled-on-disabled);
  opacity: 1 !important;
}
</style>
