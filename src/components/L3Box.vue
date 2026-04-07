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
  min-height: 116px;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-8);
  padding: var(--ds-space-16);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}

.l3-box--default {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.l3-box--inverse {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(14px);
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
  font-size: clamp(1.8rem, 2vw, 2.4rem);
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
  color: rgba(255, 255, 255, 0.72);
}

.l3-box--inverse .l3-box__value,
.l3-box--inverse .l3-box__caption {
  color: var(--ds-color-brand-white);
}
</style>
