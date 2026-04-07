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

const padding = computed(() =>
  props.size === 'small'
    ? 'var(--ds-button-padding-y-sm) var(--ds-button-padding-x-sm)'
    : 'var(--ds-button-padding-y-md) var(--ds-button-padding-x-md)',
)

const buttonClasses = computed(() => [
  'b10-btn',
  `b10-btn--${props.variant}`,
  `b10-btn--${props.size}`,
  `b10-btn--state-${effectiveState.value}`,
  {
    'b10-btn--block': props.block,
  },
])
</script>

<style scoped lang="scss">
.b10-btn {
  border: 1px solid transparent;
  border-radius: var(--ds-button-radius);
  font-family: var(--ds-button-font-family);
  font-size: var(--ds-button-font-size);
  font-weight: var(--ds-button-font-weight);
  letter-spacing: 0;
  line-height: var(--ds-button-line-height);
  min-height: 0;

  :deep(.q-btn__content) {
    align-items: center;
    flex-wrap: nowrap;
    gap: var(--ds-button-gap);
    line-height: 1;
    white-space: nowrap;
  }

  :deep(.q-btn__content .block) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.q-icon) {
    font-size: var(--ds-icon-size-sm);
  }
}

.b10-btn--block {
  width: 100%;
}

.b10-btn--primary.b10-btn--state-default {
  background: var(--ds-button-primary-bg);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.b10-btn--primary.b10-btn--state-default:not(.q-btn--disabled):hover,
.b10-btn--primary.b10-btn--state-hover:not(.q-btn--disabled) {
  background: var(--ds-button-primary-bg-hover);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.b10-btn--neutral.b10-btn--state-default {
  background: var(--ds-button-neutral-bg);
  border-color: var(--ds-button-neutral-border);
  color: var(--ds-button-neutral-text);
}

.b10-btn--neutral.b10-btn--state-default:not(.q-btn--disabled):hover,
.b10-btn--neutral.b10-btn--state-hover:not(.q-btn--disabled) {
  background: var(--ds-button-neutral-bg-hover);
  border-color: var(--ds-button-neutral-border);
  color: var(--ds-button-neutral-text);
}

.b10-btn--subtle.b10-btn--state-default {
  background: transparent;
  border-color: transparent;
  color: var(--ds-button-subtle-text);
}

.b10-btn--subtle.b10-btn--state-default:not(.q-btn--disabled):hover,
.b10-btn--subtle.b10-btn--state-hover:not(.q-btn--disabled) {
  background: transparent;
  border-color: var(--ds-button-subtle-border-hover);
  color: var(--ds-button-subtle-text-hover);
}

.b10-btn--state-disabled,
.b10-btn.q-btn--disabled {
  background: var(--ds-button-disabled-bg);
  border-color: var(--ds-button-disabled-border);
  color: var(--ds-button-disabled-text);
  opacity: 1 !important;
}
</style>
