<template>
  <q-btn
    no-caps
    flat
    :ripple="false"
    class="shell-open-dialog-button"
    padding="0"
    @click="$emit('click', $event)"
  >
    <ValueChipSurface tone="menu" class="shell-open-dialog-button__surface">
      <ValueChipLabel :label="resolvedLabel" tone="default" />
    </ValueChipSurface>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import ValueChipLabel from 'src/components/ValueChipLabel.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

const props = defineProps({
  kind: {
    type: String,
    default: 'record',
    validator: (value) => ['record', 'file', 'bb', 'fork'].includes(value),
  },
  label: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])

const resolvedLabel = computed(() => {
  const explicit = String(props.label || '').trim()
  if (explicit) return explicit

  if (props.kind === 'fork') return 'Open Fork'
  if (props.kind === 'file') return 'Open File Dialog'
  if (props.kind === 'bb') return 'Open BB Shell'
  return 'Open Dialog'
})
</script>

<style scoped>
.shell-open-dialog-button {
  min-height: 0;
  border-radius: 0;
}

.shell-open-dialog-button :deep(.q-btn__content) {
  align-items: center;
  line-height: 1;
  white-space: nowrap;
}

.shell-open-dialog-button :deep(.q-focus-helper) {
  display: none;
}

.shell-open-dialog-button__surface {
  padding-inline: var(--ds-space-12);
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;
}

.shell-open-dialog-button:hover .shell-open-dialog-button__surface,
.shell-open-dialog-button:focus-visible .shell-open-dialog-button__surface {
  background: var(--ds-button-hover-surface);
  border-color: var(--ds-button-hover-border);
  color: var(--ds-button-hover-text);
}
</style>
