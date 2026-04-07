<template>
  <div class="dialog-shell-title-row" :class="toneClass">
    <div class="dialog-shell-title-row__copy">
      <div v-if="eyebrow" class="dialog-shell-title-row__eyebrow">{{ eyebrow }}</div>
      <div class="dialog-shell-title-row__title">{{ title }}</div>
    </div>

    <div v-if="$slots.actions" class="dialog-shell-title-row__actions">
      <slot name="actions" />
    </div>

    <button
      v-if="closable"
      type="button"
      class="dialog-shell-title-row__close"
      :aria-label="closeLabel"
      @click="$emit('close')"
    >
      <q-icon name="close" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  closable: { type: Boolean, default: false },
  closeLabel: { type: String, default: 'Close dialog' },
  tone: { type: String, default: 'default' },
})

defineEmits(['close'])

const toneClass = computed(() => `dialog-shell-title-row--${String(props.tone || 'default').trim().toLowerCase() || 'default'}`)
</script>

<style scoped>
.dialog-shell-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.dialog-shell-title-row__copy {
  min-width: 0;
  flex: 1 1 auto;
}

.dialog-shell-title-row__eyebrow {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--ds-font-title);
  font-size: 0.72rem;
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.dialog-shell-title-row__title {
  color: #111111;
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-page-title);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.94;
  margin: 0;
}

.dialog-shell-title-row__eyebrow + .dialog-shell-title-row__title {
  margin-top: 8px;
  font-size: 1.35rem;
  line-height: 0.96;
  color: #0f172a;
}

.dialog-shell-title-row__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
  flex: 0 1 auto;
}

.dialog-shell-title-row__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
  flex: 0 0 auto;
}

.dialog-shell-title-row--inverse .dialog-shell-title-row__eyebrow {
  color: rgba(255, 255, 255, 0.62);
}

.dialog-shell-title-row--inverse .dialog-shell-title-row__title {
  color: #ffffff;
}

.dialog-shell-title-row--inverse .dialog-shell-title-row__eyebrow + .dialog-shell-title-row__title {
  color: #ffffff;
}

.dialog-shell-title-row--inverse .dialog-shell-title-row__close {
  color: #ffffff;
}
</style>
