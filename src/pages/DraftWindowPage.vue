<template>
  <q-page class="q-pa-md draft-window-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        PMP Window requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        PMP Window source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else class="draft-window-page__frame-wrap">
      <div class="draft-window-page__frame">
        <q-banner class="draft-window-page__banner bg-grey-1 text-black" rounded>
          Live PMP workbench for testing the shared file structure pass before it is promoted into the real flows.
        </q-banner>

        <DraftWindowShell
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
import DraftWindowShell from 'src/components/DraftWindowShell.vue'
import { TEST_SHELL_SECTION_OPTIONS, resolveApprovedFileSectionKey } from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const draftWindowSessionsBySource = ref({})

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

  draftWindowSessionsBySource.value = {
    ...draftWindowSessionsBySource.value,
    [sourceKey]: {
      ...snapshot,
    },
  }
}
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
