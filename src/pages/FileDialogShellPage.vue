<template>
  <q-page class="q-pa-md file-dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit File Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <AddEditFileShellDialog
      v-else
      v-model="dialogOpen"
      :shell-selector-value="activeSourceKey"
      :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
      @update:shell-selector-value="updateShellSelector"
      @request-close="dialogOpen = false"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditFileShellDialog from 'src/components/AddEditFileShellDialog.vue'
import { TEST_SHELL_SECTION_OPTIONS } from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const dialogOpen = ref(false)

const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => resolveValidShellSection(route.query.section))

watch(
  activeSourceKey,
  () => {
    if (!dialogOpen.value) dialogOpen.value = true
  },
  { immediate: true },
)

function resolveValidShellSection(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === normalized) ? normalized : fallbackSectionKey
}

function updateShellSelector(nextValue) {
  const section = resolveValidShellSection(nextValue)
  router.replace({
    query: {
      ...route.query,
      section,
    },
  })
}

function reopenFileDialogShell() {
  dialogOpen.value = true
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('ecvc:reopen-file-dialog-shell', reopenFileDialogShell)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('ecvc:reopen-file-dialog-shell', reopenFileDialogShell)
})
</script>

<style scoped>
.file-dialog-shell-page {
  min-height: 100%;
}
</style>
