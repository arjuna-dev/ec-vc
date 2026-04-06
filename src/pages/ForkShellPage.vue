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
      @hide="handleDialogHide"
    >
      <div class="fork-shell-modal">
        <div
          v-if="branchableShellOptions.length"
          class="fork-shell-modal__selector"
        >
          <div class="fork-shell-modal__selector-label">Live Action L1</div>
          <q-select
            :model-value="activeSourceKey"
            dense
            dark
            options-dark
            borderless
            emit-value
            map-options
            hide-bottom-space
            hide-dropdown-icon
            :options="branchableShellOptions"
            popup-content-class="fork-shell-modal__selector-menu"
            class="fork-shell-modal__selector-control"
            @update:model-value="updateShellSelector"
          >
            <template #selected-item="scope">
              <span class="fork-shell-modal__selector-value">{{ scope.opt.label }}</span>
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps" class="fork-shell-modal__selector-option">
                <q-item-section>
                  <span class="fork-shell-modal__selector-option-label">{{ scope.opt.label }}</span>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <q-card class="fork-shell-card">
          <q-card-section class="fork-shell-card__header">
            <div class="fork-shell-card__header-copy">
              <div class="fork-shell-card__eyebrow">Fork</div>
              <h1 class="fork-shell-card__title">{{ headerTitle }}</h1>
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
                <div class="fork-shell-card__branch-icon">
                  <q-icon :name="branch.icon || 'call_split'" size="24px" />
                </div>
                <div class="fork-shell-card__branch-copy">
                  <div class="fork-shell-card__branch-title">{{ branch.label }}</div>
                </div>
              </button>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const closingToRoute = ref(false)
const forkShellSourceKey = ref(resolveValidForkSection(route.query.section))
const activeSourceKey = computed(() => forkShellSourceKey.value)
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const branchOptions = computed(() => getCreateBranches(activeSourceKey.value))
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
    name: 'dialog-shell',
    query: {
      section: activeSourceKey.value,
      create: String(Date.now()),
      kind: branchEntry.value,
    },
  })
}

function handleDialogHide() {
  if (closingToRoute.value) return
  closingToRoute.value = true
  goBack()
}

function goBack() {
  const returnTo = String(route.query.returnTo || '').trim()
  if (returnTo) {
    router.push(returnTo)
    return
  }

  if (activeRegistryEntry.value?.routeName) {
    router.push({ name: activeRegistryEntry.value.routeName })
    return
  }

  router.push({ name: 'home' })
}
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

.fork-shell-modal__selector {
  justify-self: start;
  min-width: 220px;
  padding: 8px 14px;
  background: rgba(18, 24, 37, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(10, 14, 24, 0.22);
}

.fork-shell-modal__selector-label {
  margin-bottom: 2px;
  color: rgba(247, 244, 238, 0.72);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fork-shell-modal__selector-control :deep(.q-field__control) {
  min-height: auto;
  padding: 0;
}

.fork-shell-modal__selector-control :deep(.q-field__native),
.fork-shell-modal__selector-control :deep(.q-field__marginal) {
  color: #f7f4ee;
}

.fork-shell-modal__selector-value {
  color: #f7f4ee;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
}

.fork-shell-modal__selector-option-label {
  color: #111111;
  font-size: 0.9rem;
  font-weight: 600;
}

.fork-shell-card {
  width: 100%;
  padding: 8px;
  background:
    radial-gradient(circle at top right, rgba(38, 71, 255, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 244, 238, 0.96));
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 32px;
  box-shadow: 0 26px 72px rgba(17, 17, 17, 0.18);
}

.fork-shell-card__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 8px;
}

.fork-shell-card__header-copy {
  display: grid;
  gap: 6px;
}

.fork-shell-card__eyebrow {
  color: rgba(17, 17, 17, 0.52);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fork-shell-card__title {
  margin: 0;
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.fork-shell-card__close {
  color: rgba(17, 17, 17, 0.62);
}

.fork-shell-card__body {
  padding: 8px 18px 18px;
}

.fork-shell-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.fork-shell-card__branch {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  min-height: 96px;
  padding: 18px;
  text-align: left;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.fork-shell-card__branch:hover,
.fork-shell-card__branch:focus-visible {
  background: #ffffff;
  border-color: rgba(38, 71, 255, 0.28);
  transform: translateY(-1px);
}

.fork-shell-card__branch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(38, 71, 255, 0.1);
  color: #2647ff;
}

.fork-shell-card__branch-copy {
  display: grid;
  gap: 4px;
}

.fork-shell-card__branch-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1.05;
}

:global(.fork-shell-modal__selector-menu) {
  background: #ffffff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

:global(.fork-shell-modal__selector-menu .q-item) {
  min-height: 40px;
}

:global(.fork-shell-modal__selector-menu .q-item.q-manual-focusable--focused),
:global(.fork-shell-modal__selector-menu .q-item--active) {
  background: rgba(38, 71, 255, 0.08);
}

@media (max-width: 640px) {
  .fork-shell-modal {
    width: min(100vw - 20px, 680px);
  }

  .fork-shell-modal__selector {
    min-width: 0;
    width: 100%;
  }

  .fork-shell-card__header {
    align-items: center;
  }

  .fork-shell-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
