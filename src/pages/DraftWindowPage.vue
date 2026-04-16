<template>
  <q-page class="q-pa-md draft-window-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Draft Window requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Draft Window source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else class="draft-window-page__frame-wrap">
      <div class="draft-window-page__frame">
        <q-banner class="draft-window-page__banner bg-grey-1 text-black" rounded>
          Temporary workbench for shaping the dialog shell structure before it is promoted into the live add/edit flows.
        </q-banner>

        <DraftWindowShell
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
import DraftWindowShell from 'src/components/DraftWindowShell.vue'
import {
  getRuntimeStructureVersion,
  getRuntimeTestShellSectionOptions,
  resolveApprovedFileSectionKey,
  subscribeRuntimeFileStructures,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const draftWindowSessionsBySource = ref({})
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

  draftWindowSessionsBySource.value = {
    ...draftWindowSessionsBySource.value,
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
.draft-window-page {
  min-height: 100%;
}

.draft-window-page__frame-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  padding-inline: 0;
}

.draft-window-page__frame {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 75%;
}

.draft-window-page__banner {
  border: 1px solid rgba(17, 17, 17, 0.08);
}
</style>
