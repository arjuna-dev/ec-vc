<template>
  <q-page class="q-pa-md add-edit-bb-shell-page">
    <AddEditBbShell
      v-model="dialogOpen"
      :detail="activeDetail"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEditBbShell from 'src/components/AddEditBbShell.vue'
import {
  BUILDING_BLOCK_OPTIONS,
  getBuildingBlockDetail,
} from 'src/utils/buildingBlocks'

const route = useRoute()
const router = useRouter()
const dialogOpen = ref(false)

const fallbackBlockId = BUILDING_BLOCK_OPTIONS[0]?.value || 'page-title-crumb'
const activeBlockId = computed(() => resolveValidBlockId(route.query.block))
const activeDetail = computed(() => getBuildingBlockDetail(activeBlockId.value))

watch(
  activeBlockId,
  (nextValue) => {
    syncBlockQuery(nextValue)
    if (!dialogOpen.value) dialogOpen.value = true
  },
  { immediate: true },
)

function resolveValidBlockId(value) {
  const normalized = String(value || '').trim()
  return BUILDING_BLOCK_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : fallbackBlockId
}

function syncBlockQuery(block) {
  if (route.query.block === block) return
  router.replace({
    query: {
      ...route.query,
      block,
    },
  })
}

function reopenBbShell() {
  dialogOpen.value = true
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('ecvc:reopen-bb-shell', reopenBbShell)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('ecvc:reopen-bb-shell', reopenBbShell)
})
</script>

<style scoped>
.add-edit-bb-shell-page {
  min-height: 100%;
}
</style>
