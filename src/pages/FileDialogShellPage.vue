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
          @update:shell-selector-value="updateShellSelector"
          @change="updateFileStructureSession"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditFileShellDialog from 'src/components/AddEditFileShellDialog.vue'
import { TEST_SHELL_SECTION_OPTIONS, resolveApprovedFileSectionKey } from 'src/utils/structureRegistry'
import { applyFileRegistryPresenceChanges, buildFileRegistryPresenceChanges, resolveFileRegistryRow } from 'src/utils/fileStructurePersistence'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const fileStructureSessionsBySource = ref({})
const fileRegistryRows = ref([])
const fileRegistrySaveInFlightBySource = ref({})

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

async function updateFileStructureSession(snapshot = null) {
  const sourceKey = String(snapshot?.sourceKey || activeSourceKey.value || '').trim()
  if (!sourceKey || !snapshot || typeof snapshot !== 'object') return
  const fileRow = resolveFileRegistryRow(fileRegistryRows.value, sourceKey)
  const nextChanges = buildFileRegistryPresenceChanges(snapshot, fileRow)

  fileStructureSessionsBySource.value = {
    ...fileStructureSessionsBySource.value,
    [sourceKey]: {
      ...snapshot,
    },
  }

  if (!fileRow?.id || !nextChanges.length || fileRegistrySaveInFlightBySource.value[sourceKey]) return

  try {
    fileRegistrySaveInFlightBySource.value = {
      ...fileRegistrySaveInFlightBySource.value,
      [sourceKey]: true,
    }
    const bridge = typeof window !== 'undefined' ? window.ecvc : null
    await applyFileRegistryPresenceChanges({
      bridge,
      fileRow,
      changes: nextChanges,
    })
    await loadFileRegistryRows()
  } finally {
    fileRegistrySaveInFlightBySource.value = {
      ...fileRegistrySaveInFlightBySource.value,
      [sourceKey]: false,
    }
  }
}

async function loadFileRegistryRows() {
  try {
    const bridge = typeof window !== 'undefined' ? window.ecvc : null
    const result = await bridge?.['file-system']?.list?.()
    fileRegistryRows.value = Array.isArray(result?.files) ? result.files : []
  } catch {
    fileRegistryRows.value = []
  }
}
loadFileRegistryRows()
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
