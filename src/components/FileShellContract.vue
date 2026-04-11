<template>
  <FilePageShell v-if="resolvedSourceKey" :shell-mode="resolvedShellMode" :source-key="resolvedSourceKey" />
  <q-page v-else class="q-pa-md">
    <q-banner class="bg-red-2 text-black" rounded>
      File Shell route is not mapped to an approved file source.
    </q-banner>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FilePageShell from 'src/components/FilePageShell.vue'
import { getFilePageRegistryEntryByRouteName, TEST_SHELL_SECTION_OPTIONS } from 'src/utils/structureRegistry'

defineOptions({ name: 'FileShellContract' })

const props = defineProps({
  mode: {
    type: String,
    default: 'page',
  },
  sourceKey: {
    type: String,
    default: '',
  },
})

const route = useRoute()

const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value || TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'

const resolvedMode = computed(() => {
  const normalizedMode = String(props.mode || '').trim().toLowerCase()
  return normalizedMode === 'lab' ? 'file-lab' : 'file-page'
})

const resolvedSourceKey = computed(() => {
  const propSourceKey = String(props.sourceKey || '').trim().toLowerCase()
  if (TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === propSourceKey)) return propSourceKey

  if (resolvedMode.value === 'file-lab') {
    const routeSectionKey = String(route.query.section || '').trim().toLowerCase()
    return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === routeSectionKey) ? routeSectionKey : fallbackSectionKey
  }

  const routeEntry = getFilePageRegistryEntryByRouteName(route.name)
  return String(routeEntry?.key || '').trim().toLowerCase()
})
</script>
