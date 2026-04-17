<template>
  <q-page class="fork-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Fork Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <q-dialog
      v-else
      v-model="dialogOpen"
    >
      <div class="fork-shell-modal" :class="{ 'fork-shell-modal--compact': compactForkLayout }">
        <ForkSelectorSurface
          :model-value="activeSourceKey"
          :options="branchableShellOptions"
          @update:model-value="updateShellSelector"
        />

        <q-card
          class="fork-shell-card"
          :class="{ 'fork-shell-card--compact': compactForkLayout }"
        >
          <q-card-section class="fork-shell-card__header">
            <div class="fork-shell-card__header-copy">
              <div class="fork-shell-card__title-row">
                <div class="fork-shell-card__title">{{ headerTitle }}</div>
              </div>
            </div>

            <q-btn
              flat
              round
              dense
              icon="close"
              aria-label="Close fork shell"
              class="fork-shell-card__close"
              @click="dialogOpen = false"
            />
          </q-card-section>

          <q-card-section class="fork-shell-card__body">
            <q-banner
              v-if="!branchableShellOptions.length"
              class="bg-red-2 text-black"
              rounded
            >
              No branchable Live Action L1 entries are available yet.
            </q-banner>

            <div v-else class="fork-shell-card__grid">
              <button
                v-for="branch in branchOptions"
                :key="branch.value"
                type="button"
                class="fork-shell-card__branch"
                @click="selectBranch(branch)"
              >
                <ForkBranchCard :label="branch.label" />
              </button>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ForkBranchCard from 'src/components/ForkBranchCard.vue'
import ForkSelectorSurface from 'src/components/ForkSelectorSurface.vue'
import {
  TEST_SHELL_SECTION_OPTIONS,
  getCreateBranchEntry,
  getCreateBranches,
  getFilePageRegistryEntry,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()

const isElectronRuntime = computed(() => typeof window !== 'undefined')
const branchableShellOptions = Object.freeze(
  TEST_SHELL_SECTION_OPTIONS.filter((option) => getCreateBranches(option.value).length).map((option) => ({
    label: option.label,
    value: option.value,
  })),
)
const fallbackSectionKey = branchableShellOptions[0]?.value || ''
const dialogOpen = ref(true)
const forkShellSourceKey = ref(resolveValidForkSection(route.query.section))
const activeSourceKey = computed(() => forkShellSourceKey.value)
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const branchOptions = computed(() => getCreateBranches(activeSourceKey.value))
const compactForkLayout = computed(() => branchOptions.value.length <= 2)
const headerTitle = computed(() => {
  const l1Name = String(activeRegistryEntry.value?.label || 'L1').trim()
  return `${l1Name} Fork`
})

watch(
  () => route.query.section,
  (nextValue) => {
    const validValue = resolveValidForkSection(nextValue)
    if (validValue !== forkShellSourceKey.value) {
      forkShellSourceKey.value = validValue
    }
  },
)

function resolveValidForkSection(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (branchableShellOptions.some((option) => option.value === normalized)) return normalized
  return fallbackSectionKey
}

function updateShellSelector(nextValue) {
  const nextSection = resolveValidForkSection(nextValue)
  if (!nextSection) return
  forkShellSourceKey.value = nextSection
  router.replace({
    query: {
      ...route.query,
      section: nextSection,
    },
  })
}

function selectBranch(branch) {
  const branchEntry = getCreateBranchEntry(activeSourceKey.value, branch?.value)
  if (!branchEntry) return
  router.push({
    name: 'draft-window',
    query: {
      section: activeSourceKey.value,
      create: String(Date.now()),
      kind: branchEntry.value,
    },
  })
}

function reopenForkShell() {
  dialogOpen.value = true
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('ecvc:reopen-fork-shell', reopenForkShell)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('ecvc:reopen-fork-shell', reopenForkShell)
})

</script>

<style scoped>
.fork-shell-page {
  min-height: 100%;
}

.fork-shell-modal {
  display: grid;
  gap: 14px;
  width: min(680px, calc(100vw - 32px));
}

.fork-shell-modal--compact {
  width: min(408px, calc(100vw - 32px));
}

.fork-shell-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: min(46vh, 420px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 246, 244, 0.98) 100%);
  border-radius: 4px;
  overflow: hidden;
}

.fork-shell-card--compact {
  min-height: 0;
}

.fork-shell-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.fork-shell-card__header-copy {
  flex: 1 1 auto;
  min-height: 1px;
  min-width: 0;
}

.fork-shell-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-bottom: 0;
}

.fork-shell-card__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  margin-bottom: 0;
}

.fork-shell-card__close {
  color: rgba(17, 17, 17, 0.62);
}

.fork-shell-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 14px 20px 18px;
}

.fork-shell-card--compact .fork-shell-card__body {
  padding: 12px 20px 14px;
}

.fork-shell-card__grid {
  display: inline-grid;
  grid-template-columns: repeat(4, max-content);
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
}

.fork-shell-card__branch {
  display: inline-flex;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease;
}

.fork-shell-card__branch:hover,
.fork-shell-card__branch:focus-visible {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .fork-shell-modal {
    width: min(100vw - 20px, 680px);
  }

  .fork-shell-card {
    min-height: calc(100vh - 20px);
    max-height: calc(100vh - 20px);
  }

  :deep(.fork-selector-surface) {
    width: fit-content;
    max-width: 100%;
  }

  .fork-shell-card__header {
    flex-direction: column;
  }

  .fork-shell-card__grid {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;
    width: 100%;
    margin: 0;
    flex-wrap: wrap;
  }
}
</style>
