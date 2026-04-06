<template>
  <FilePageShell shell-mode="file-lab" :source-key="activeSourceKey" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FilePageShell from 'src/components/FilePageShell.vue'
import { TEST_SHELL_SECTION_OPTIONS } from 'src/utils/structureRegistry'

const route = useRoute()
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value || TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})
</script>
