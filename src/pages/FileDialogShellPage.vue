<template>
  <q-page class="q-pa-md file-dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit File Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="file-dialog-shell-page__frame-wrap">
      <AddEditFileShellDialog
        :shell-selector-value="activeSourceKey"
        :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
        :can-configure-file-system="canConfigureFileSystem"
        @update:shell-selector-value="updateShellSelector"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditFileShellDialog from 'src/components/AddEditFileShellDialog.vue'
import { TEST_SHELL_SECTION_OPTIONS } from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const canConfigureFileSystem = ref(false)

const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => resolveValidShellSection(route.query.section))

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

async function loadFileSystemOwnership() {
  try {
    const bridge = typeof window !== 'undefined' ? window.ecvc : null
    const result = await bridge?.userSettings?.get?.()
    canConfigureFileSystem.value = result?.canEditOwnerSettings !== false
  } catch {
    canConfigureFileSystem.value = false
  }
}

onMounted(() => {
  loadFileSystemOwnership()
})
</script>

<style scoped>
.file-dialog-shell-page {
  min-height: 100%;
}

.file-dialog-shell-page__frame-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
