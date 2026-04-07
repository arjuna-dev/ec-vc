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

const padding = computed(() =>
  props.size === 'small' ? 'var(--ds-icon-button-padding-sm)' : 'var(--ds-icon-button-padding-md)',
)

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
  border-radius: var(--ds-radius-round);
  min-height: 0;
  min-width: 0;

  :deep(.q-btn__content) {
    width: 100%;
    height: 100%;
    display: inline-flex;
    line-height: 1;
    align-items: center;
    justify-content: center;
  }

  :deep(.q-icon) {
    display: block;
    font-size: var(--ds-icon-size-md);
  }
}

.b10-icon-btn--small {
  width: var(--ds-icon-button-size-sm);
  height: var(--ds-icon-button-size-sm);
  min-width: var(--ds-icon-button-size-sm);
  min-height: var(--ds-icon-button-size-sm);

  :deep(.q-icon) {
    font-size: var(--ds-icon-size-sm);
  }
}

.b10-icon-btn--medium {
  width: var(--ds-icon-button-size-md);
  height: var(--ds-icon-button-size-md);
  min-width: var(--ds-icon-button-size-md);
  min-height: var(--ds-icon-button-size-md);
}

.b10-icon-btn--primary.b10-icon-btn--state-default {
  background: var(--ds-button-primary-bg);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.b10-icon-btn--primary.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--primary.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--ds-button-primary-bg-hover);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.b10-icon-btn--neutral.b10-icon-btn--state-default {
  background: var(--ds-button-icon-neutral-bg);
  border-color: var(--ds-button-icon-neutral-border);
  color: var(--ds-button-neutral-text);
}

.b10-icon-btn--neutral.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--neutral.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--ds-button-icon-neutral-bg-hover);
  border-color: var(--ds-button-icon-neutral-border);
  color: var(--ds-button-neutral-text);
}

.b10-icon-btn--subtle.b10-icon-btn--state-default {
  background: transparent;
  border-color: transparent;
  color: var(--ds-button-icon-subtle-text);
}

.b10-icon-btn--subtle.b10-icon-btn--state-default:not(.q-btn--disabled):hover,
.b10-icon-btn--subtle.b10-icon-btn--state-hover:not(.q-btn--disabled) {
  background: var(--ds-button-icon-subtle-bg-hover);
  border-color: transparent;
  color: var(--ds-button-icon-subtle-text);
}

.b10-icon-btn--state-disabled,
.b10-icon-btn.q-btn--disabled {
  background: var(--ds-button-disabled-bg);
  border-color: var(--ds-button-disabled-border);
  color: var(--ds-button-disabled-text);
  opacity: 1 !important;
}
</style>
