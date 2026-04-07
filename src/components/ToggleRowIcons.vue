<template>
  <div
    v-if="variant === 'row-chevron-pair'"
    class="toggle-row-icons toggle-row-icons--pair"
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" class="toggle-row-icons__pair-chevron">
      <path d="M7 14L12 9L17 14" />
    </svg>
    <svg viewBox="0 0 24 24" class="toggle-row-icons__pair-chevron">
      <path d="M7 10L12 15L17 10" />
    </svg>
  </div>

  <button
    v-else
    type="button"
    class="toggle-row-icons toggle-row-icons--toggle"
    :class="{ 'toggle-row-icons--muted': tone === 'muted' }"
  >
    <span class="toggle-row-icons__label">{{ label }}</span>
    <q-icon :name="iconName" class="toggle-row-icons__icon" />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'toggle-inline',
    validator: (value) => ['toggle-inline', 'row-chevron-pair'].includes(value),
  },
  label: {
    type: String,
    default: 'General',
  },
  expanded: {
    type: Boolean,
    default: true,
  },
  direction: {
    type: String,
    default: 'down',
    validator: (value) => ['down', 'right'].includes(value),
  },
  tone: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'muted'].includes(value),
  },
})

const iconName = computed(() => {
  if (props.direction === 'right') return 'chevron_right'
  return props.expanded ? 'expand_more' : 'expand_less'
})
</script>

<style scoped>
.toggle-row-icons {
  display: inline-flex;
  align-items: center;
}

.toggle-row-icons--toggle {
  justify-content: flex-start;
  gap: var(--ds-space-4);
  padding: 0;
  color: var(--ds-color-text-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.toggle-row-icons--muted {
  color: color-mix(in srgb, var(--ds-color-text-primary) 58%, transparent);
}

.toggle-row-icons__label {
  line-height: 1;
}

.toggle-row-icons__icon {
  font-size: var(--ds-icon-size-sm);
  line-height: 1;
}

.toggle-row-icons--pair {
  display: grid;
  grid-template-columns: var(--ds-icon-size-sm) var(--ds-icon-size-sm);
  gap: 0;
  justify-content: end;
  color: color-mix(in srgb, var(--ds-color-text-primary) 58%, transparent);
}

.toggle-row-icons__pair-chevron {
  width: var(--ds-icon-size-sm);
  height: var(--ds-icon-size-sm);
  stroke: currentColor;
  stroke-width: 1.45;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
