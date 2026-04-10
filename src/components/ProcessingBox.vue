<template>
  <section class="processing-box" :class="{ 'processing-box--compact': compact }">
    <div class="processing-box__head">
      <div class="processing-box__title">{{ title }}</div>
      <div v-if="$slots.actions || meta" class="processing-box__head-right">
        <div v-if="meta" class="processing-box__meta">{{ meta }}</div>
        <slot name="actions" />
      </div>
    </div>
    <div class="processing-box__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineOptions({ name: 'ProcessingBox' })

defineProps({
  title: {
    type: String,
    default: 'Intake',
  },
  meta: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.processing-box {
  display: grid;
  gap: 8px;
  min-height: 0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 4px;
  box-sizing: border-box;
}

.processing-box--compact {
  align-content: start;
  gap: 4px;
  padding: 4px 5px;
  border-radius: 2px;
}

.processing-box__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.processing-box--compact .processing-box__head {
  gap: 6px;
}

.processing-box__title {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
}

.processing-box__head-right {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.processing-box__meta {
  color: rgba(17, 17, 17, 0.52);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  line-height: 1.2;
}

.processing-box__body {
  display: grid;
  gap: 4px;
  min-height: 0;
}
</style>
