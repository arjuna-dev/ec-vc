<template>
  <q-page class="q-pa-md add-edit-bb-shell-page">
    <q-dialog
      v-model="dialogOpen"
      class="add-edit-bb-shell-page__dialog-host"
    >
      <div class="add-edit-bb-shell-page__window-host">
        <AddEditBbShellWindow />
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AddEditBbShellWindow from 'src/components/AddEditBbShellWindow.vue'

defineOptions({ name: 'AddEditBbShellPage' })

const dialogOpen = ref(false)

function reopenBbShell() {
  dialogOpen.value = true
}

onMounted(() => {
  dialogOpen.value = true
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('ecvc:reopen-bb-shell', reopenBbShell)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('ecvc:reopen-bb-shell', reopenBbShell)
})
</script>

<style scoped>
.add-edit-bb-shell-page {
  min-height: 100%;
}

.add-edit-bb-shell-page__dialog-host :deep(.q-dialog__inner) {
  padding: 16px;
  align-items: flex-start;
}

.add-edit-bb-shell-page__dialog-host :deep(.q-dialog__inner > div) {
  border-radius: var(--ds-radius-lg);
  overflow: visible;
}

.add-edit-bb-shell-page__window-host {
  min-width: min(1240px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: auto;
}
</style>
