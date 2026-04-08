<template>
  <div class="shell-open-dialog-button__root">
    <q-btn
      no-caps
      flat
      :ripple="false"
      class="shell-open-dialog-button"
      padding="0"
      @click="handleClick"
    >
      <ValueChipSurface tone="menu" class="shell-open-dialog-button__surface">
        <ValueChipLabel :label="resolvedLabel" tone="default" />
      </ValueChipSurface>
    </q-btn>

    <q-dialog
      v-if="kind === 'bb'"
      v-model="dialogOpen"
      class="shell-open-dialog-button__dialog-host"
    >
      <div class="shell-open-dialog-button__bb-window-host">
        <AddEditBbShellWindow />
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AddEditBbShellWindow from 'src/components/AddEditBbShellWindow.vue'
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

const emit = defineEmits(['click'])

const dialogOpen = ref(false)

const resolvedLabel = computed(() => {
  const explicit = String(props.label || '').trim()
  if (explicit) return explicit

  if (props.kind === 'fork') return 'Open Fork'
  if (props.kind === 'file') return 'Open File Dialog'
  if (props.kind === 'bb') return 'Open BB Shell'
  return 'Open Dialog'
})

function handleClick(event) {
  if (props.kind === 'bb') {
    dialogOpen.value = true
    return
  }

  emit('click', event)
}
</script>

<style scoped>
.shell-open-dialog-button {
  min-height: 0;
  border-radius: 0;
}

.shell-open-dialog-button__root {
  display: contents;
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

.shell-open-dialog-button__dialog {
  position: relative;
  border-radius: var(--ds-radius-lg);
  overflow: auto;
  resize: horizontal;
  min-width: 720px;
  max-width: calc(100vw - 32px);
}

.shell-open-dialog-button__dialog-host :deep(.q-dialog__inner) {
  padding: 16px;
  align-items: flex-start;
}

.shell-open-dialog-button__dialog-host :deep(.q-dialog__inner > div) {
  border-radius: var(--ds-radius-lg);
  overflow: visible;
}

.shell-open-dialog-button__bb-window-host {
  min-width: min(1240px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: auto;
}

</style>
