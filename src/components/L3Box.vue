<template>
  <article class="l3-box" :class="`l3-box--${tone}`">
    <div class="l3-box__label">{{ label }}</div>
    <div class="l3-box__value">{{ value }}</div>
    <div v-if="caption" class="l3-box__caption">{{ caption }}</div>
  </article>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'L3',
  },
  value: {
    type: String,
    default: '128',
  },
  caption: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'default',
  },
})
</script>

<style scoped>
.l3-box {
  display: flex;
  min-height: var(--ds-card-min-height-lg);
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-8);
  padding: var(--ds-space-16);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}

.l3-box--default {
  background: var(--ds-color-surface-stat-default);
}

.l3-box--inverse {
  background: var(--ds-color-surface-stat-inverse);
  border-color: var(--ds-color-border-inverse-soft);
  backdrop-filter: var(--ds-panel-blur-md);
}

.l3-box__label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.l3-box__value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-stat-value);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.92;
}

.l3-box__caption {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.l3-box--inverse .l3-box__label {
  color: var(--ds-color-text-inverse-muted);
}

.l3-box--inverse .l3-box__value,
.l3-box--inverse .l3-box__caption {
  color: var(--ds-color-brand-white);
}
</style>
