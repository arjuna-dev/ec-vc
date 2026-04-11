<template>
  <q-page class="q-pa-md file-dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit File Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Add/Edit File Shell source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else class="file-dialog-shell-page__frame-wrap">
      <div class="file-dialog-shell-page__frame">
        <AddEditFileShellDialog
          :shell-selector-value="activeSourceKey"
          :shell-selector-options="TEST_SHELL_SECTION_OPTIONS"
          :can-configure-file-system="canConfigureFileSystem"
          @update:shell-selector-value="updateShellSelector"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditFileShellDialog from 'src/components/AddEditFileShellDialog.vue'
import { TEST_SHELL_SECTION_OPTIONS, resolveApprovedFileSectionKey } from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const canConfigureFileSystem = ref(false)

const activeSourceKey = computed(() => resolveValidShellSection(route.query.section, route.query.entity))
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))

function resolveValidShellSection(value, entityName = '') {
  return resolveApprovedFileSectionKey(value, String(entityName || '').trim())
}

function updateShellSelector(nextValue) {
  const section = resolveValidShellSection(nextValue, route.query.entity)
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
  padding-inline: 0;
}

.file-dialog-shell-page__frame {
  width: 75%;
}
</style>
