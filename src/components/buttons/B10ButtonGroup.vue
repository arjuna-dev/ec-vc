<template>
  <div :class="groupClasses" :style="groupStyle">
    <B10Button
      v-if="buttonStart"
      :class="itemClasses"
      :label="startLabel"
      :variant="startVariant"
      :size="size"
      :state="startState"
      :disable="startDisabled"
      @click="$emit('start-click', $event)"
    />
    <B10Button
      v-if="buttonEnd"
      :class="itemClasses"
      :label="endLabel"
      :variant="endVariant"
      :size="size"
      :state="endState"
      :disable="endDisabled"
      @click="$emit('end-click', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import B10Button from 'src/components/buttons/B10Button.vue'

const props = defineProps({
  align: {
    type: String,
    default: 'justify',
    validator: (value) => ['justify', 'start', 'end', 'center', 'stack'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['medium', 'small'].includes(value),
  },
  width: {
    type: [Number, String],
    default: 240,
  },
  buttonStart: {
    type: Boolean,
    default: true,
  },
  buttonEnd: {
    type: Boolean,
    default: true,
  },
  startLabel: {
    type: String,
    default: 'Button',
  },
  endLabel: {
    type: String,
    default: 'Button',
  },
  startVariant: {
    type: String,
    default: 'subtle',
    validator: (value) => ['primary', 'neutral', 'subtle'].includes(value),
  },
  endVariant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'neutral', 'subtle'].includes(value),
  },
  startState: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'hover', 'disabled'].includes(value),
  },
  endState: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'hover', 'disabled'].includes(value),
  },
  startDisabled: {
    type: Boolean,
    default: false,
  },
  endDisabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['start-click', 'end-click'])

const groupClasses = computed(() => [
  'b10-button-group',
  `b10-button-group--${props.align}`,
])

const itemClasses = computed(() => ({
  'b10-button-group__item--grow': props.align === 'justify',
  'b10-button-group__item--stack': props.align === 'stack',
}))

const groupStyle = computed(() => ({ width: normalizeWidth(props.width) }))

function normalizeWidth(width) {
  return typeof width === 'number' ? `${width}px` : width
}
</script>

<style scoped lang="scss">
.b10-button-group {
  align-items: center;
  display: flex;
  gap: 16px;
}

.b10-button-group--start {
  justify-content: flex-start;
}

.b10-button-group--end {
  justify-content: flex-end;
}

.b10-button-group--center {
  justify-content: center;
}

.b10-button-group--justify {
  justify-content: flex-start;
}

.b10-button-group--stack {
  align-items: stretch;
  flex-direction: column;
  justify-content: center;
}

.b10-button-group__item--grow {
  flex: 1 1 0;
}

.b10-button-group__item--stack {
  width: 100%;
}
</style>
