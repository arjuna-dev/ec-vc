<template>
  <span class="value-chip-surface" :class="[`value-chip-surface--${tone}`, `value-chip-surface--${size}`]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone: {
    type: String,
    default: 'default',
    validator: (value) =>
      [
        'default',
        'inverse',
        'menu',
        'button-primary',
        'button-primary-hover',
        'button-neutral',
        'button-neutral-hover',
        'button-subtle',
        'button-subtle-hover',
        'button-disabled',
      ].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['medium', 'small'].includes(value),
  },
})
</script>

<style scoped>
.value-chip-surface {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-button-gap);
  box-sizing: border-box;
  border: 1px solid transparent;
  background: var(--ds-color-brand-black);
  color: var(--ds-color-brand-white);
  border-radius: var(--ds-radius-mini);
  box-shadow: var(--ds-value-chip-outline);
}

.value-chip-surface--default,
.value-chip-surface--inverse {
  min-height: var(--ds-control-height-md);
  padding: 0 var(--ds-space-12);
}

.value-chip-surface--menu {
  min-height: calc(var(--ds-control-height-sm) + var(--ds-space-2));
  padding: 0 var(--ds-space-8);
}

.value-chip-surface--button-primary,
.value-chip-surface--button-primary-hover,
.value-chip-surface--button-neutral,
.value-chip-surface--button-neutral-hover,
.value-chip-surface--button-subtle,
.value-chip-surface--button-subtle-hover,
.value-chip-surface--button-disabled {
  box-shadow: none;
}

.value-chip-surface--button-primary {
  background: var(--ds-button-primary-bg);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.value-chip-surface--button-primary-hover {
  background: var(--ds-button-primary-bg-hover);
  border-color: var(--ds-button-primary-border);
  color: var(--ds-button-primary-text);
}

.value-chip-surface--button-neutral {
  background: var(--ds-button-neutral-bg);
  border-color: var(--ds-button-neutral-border);
  color: var(--ds-button-neutral-text);
}

.value-chip-surface--button-neutral-hover {
  background: var(--ds-button-neutral-bg-hover);
  border-color: var(--ds-button-neutral-border);
  color: var(--ds-button-neutral-text);
}

.value-chip-surface--button-subtle {
  background: transparent;
  border-color: transparent;
  color: var(--ds-button-subtle-text);
}

.value-chip-surface--button-subtle-hover {
  background: transparent;
  border-color: var(--ds-button-subtle-border-hover);
  color: var(--ds-button-subtle-text-hover);
}

.value-chip-surface--button-disabled {
  background: var(--ds-button-disabled-bg);
  border-color: var(--ds-button-disabled-border);
  color: var(--ds-button-disabled-text);
}

.value-chip-surface--button-primary.value-chip-surface--medium,
.value-chip-surface--button-primary-hover.value-chip-surface--medium,
.value-chip-surface--button-neutral.value-chip-surface--medium,
.value-chip-surface--button-neutral-hover.value-chip-surface--medium,
.value-chip-surface--button-subtle.value-chip-surface--medium,
.value-chip-surface--button-subtle-hover.value-chip-surface--medium,
.value-chip-surface--button-disabled.value-chip-surface--medium {
  min-height: var(--ds-control-height-md);
  padding: var(--ds-button-padding-y-md) var(--ds-button-padding-x-md);
}

.value-chip-surface--button-primary.value-chip-surface--small,
.value-chip-surface--button-primary-hover.value-chip-surface--small,
.value-chip-surface--button-neutral.value-chip-surface--small,
.value-chip-surface--button-neutral-hover.value-chip-surface--small,
.value-chip-surface--button-subtle.value-chip-surface--small,
.value-chip-surface--button-subtle-hover.value-chip-surface--small,
.value-chip-surface--button-disabled.value-chip-surface--small {
  min-height: var(--ds-control-height-sm);
  padding: var(--ds-button-padding-y-sm) var(--ds-button-padding-x-sm);
}
</style>
