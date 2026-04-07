<template>
  <q-btn
    no-caps
    flat
    :ripple="false"
    :class="buttonClasses"
    :disable="isDisabled"
    :loading="loading"
    padding="0"
    @click="$emit('click', $event)"
  >
    <ValueChipSurface :tone="surfaceTone" :size="size" class="b10-btn__surface">
      <q-icon v-if="iconStart" :name="iconStart" class="b10-btn__icon" />
      <ButtonLabel :label="label" />
      <q-icon v-if="iconEnd" :name="iconEnd" class="b10-btn__icon" />
    </ValueChipSurface>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import ButtonLabel from 'src/components/ButtonLabel.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

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

const buttonClasses = computed(() => [
  'b10-btn',
  `b10-btn--${props.variant}`,
  `b10-btn--state-${effectiveState.value}`,
  {
    'b10-btn--block': props.block,
  },
])

const surfaceTone = computed(() => {
  if (effectiveState.value === 'disabled') return 'button-disabled'
  if (props.variant === 'primary') {
    return effectiveState.value === 'hover' ? 'button-primary-hover' : 'button-primary'
  }
  if (props.variant === 'neutral') {
    return effectiveState.value === 'hover' ? 'button-neutral-hover' : 'button-neutral'
  }
  return effectiveState.value === 'hover' ? 'button-subtle-hover' : 'button-subtle'
})
</script>

<style scoped lang="scss">
.b10-btn {
  min-height: 0;
  color: inherit;
  border-radius: 0;

  :deep(.q-btn__content) {
    align-items: center;
    line-height: 1;
    white-space: nowrap;
  }

  :deep(.q-focus-helper) {
    display: none;
  }
}

.b10-btn__surface {
  width: 100%;
}

.b10-btn__icon {
  font-size: var(--ds-icon-size-sm);
}

.b10-btn--block {
  width: 100%;
}

.b10-btn.q-btn--disabled {
  opacity: 1 !important;
}
</style>
