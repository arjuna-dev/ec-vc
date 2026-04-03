<template>
  <component :is="activeSectionComponent" :key="activeSectionKey" />
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { TEST_SHELL_SECTION_OPTIONS } from 'src/utils/structureRegistry'

const route = useRoute()

const sectionComponentByKey = {
  users: defineAsyncComponent(() => import('./UsersPage.vue')),
  artifacts: defineAsyncComponent(() => import('./ArtifactsPage.vue')),
  contacts: defineAsyncComponent(() => import('./ContactsPage.vue')),
  companies: defineAsyncComponent(() => import('./CompaniesPage.vue')),
  projects: defineAsyncComponent(() => import('./ProjectsPage.vue')),
  notes: defineAsyncComponent(() => import('./NotesPage.vue')),
  tasks: defineAsyncComponent(() => import('./TasksPage.vue')),
}

const fallbackSectionKey =
  TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value ||
  TEST_SHELL_SECTION_OPTIONS[0]?.value ||
  'users'

const activeSectionKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})

const activeSectionComponent = computed(
  () => sectionComponentByKey[activeSectionKey.value] || sectionComponentByKey[fallbackSectionKey],
)
</script>
