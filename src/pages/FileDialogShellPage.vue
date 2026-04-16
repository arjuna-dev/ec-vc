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
          :shell-selector-options="shellSectionOptions"
          @update:shell-selector-value="updateShellSelector"
          @change="updateFileStructureSession"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditFileShellDialog from 'src/components/AddEditFileShellDialog.vue'
import {
  getRuntimeStructureVersion,
  getRuntimeTestShellSectionOptions,
  resolveApprovedFileSectionKey,
  subscribeRuntimeFileStructures,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const fileStructureSessionsBySource = ref({})
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null

const shellSectionOptions = computed(() => {
  runtimeStructureVersion.value
  return getRuntimeTestShellSectionOptions()
})

const activeSourceKey = computed(() => {
  const resolved = resolveValidShellSection(route.query.section, route.query.entity)
  if (shellSectionOptions.value.some((option) => option.value === resolved)) return resolved
  return shellSectionOptions.value[0]?.value || ''
})
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

  fileStructureSessionsBySource.value = {
    ...fileStructureSessionsBySource.value,
    [sourceKey]: {
      ...snapshot,
    },
  }
}

onMounted(() => {
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
})

onBeforeUnmount(() => {
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
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
