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
              <div class="fork-shell-card__title-row">
                <div class="fork-shell-card__title">{{ headerTitle }}</div>
              </div>
              <div class="fork-shell-card__eyebrow">Choose the branch path to continue into Add/Edit Shell</div>
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

            <div v-else class="fork-shell-card__panel">
              <div class="fork-shell-card__panel-head">
                <div class="fork-shell-card__panel-title">Fork Options</div>
                <div class="fork-shell-card__panel-meta">{{ branchOptions.length }} paths</div>
              </div>

              <div class="fork-shell-card__grid">
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
                    <div class="fork-shell-card__branch-caption">Open {{ branch.label }} in the shared create flow.</div>
                  </div>
                </button>
              </div>
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

function reopenForkShell() {
  closingToRoute.value = false
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
  border-radius: 4px;
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
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  background: #000000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  text-transform: lowercase;
}

.fork-shell-modal__selector-option-label {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 8px;
  color: #ffffff;
  background: #111111;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
  font-family: var(--font-title);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.03em;
}

.fork-shell-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: min(46vh, 420px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 246, 244, 0.98) 100%);
  border-radius: 18px;
  overflow: hidden;
}

.fork-shell-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.fork-shell-card__header-copy {
  flex: 1 1 auto;
  min-height: 1px;
  min-width: 0;
}

.fork-shell-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 12px;
}

.fork-shell-card__eyebrow {
  color: rgba(17, 17, 17, 0.52);
  font-size: 0.78rem;
  line-height: 1.35;
}

.fork-shell-card__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1.46rem;
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
  gap: 10px;
  padding: 10px 18px 18px;
}

.fork-shell-card__panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 10px 18px 18px;
  background: rgba(249, 249, 247, 0.92);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 4px;
}

.fork-shell-card__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.fork-shell-card__panel-title {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  color: #111111;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.92);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.fork-shell-card__panel-meta {
  color: rgba(17, 17, 17, 0.52);
  font-family: var(--font-body);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
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
  min-height: 104px;
  padding: 18px;
  text-align: left;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 4px;
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
  border-radius: 4px;
  background: #111111;
  color: #ffffff;
}

.fork-shell-card__branch-copy {
  display: grid;
  gap: 4px;
}

.fork-shell-card__branch-title {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 26px;
  padding: 0 8px;
  color: #111111;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.92);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.fork-shell-card__branch-caption {
  color: rgba(17, 17, 17, 0.62);
  font-size: 0.8rem;
  line-height: 1.35;
}

:global(.fork-shell-modal__selector-menu) {
  background: #ffffff !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14) !important;
  border: 1px solid rgba(17, 17, 17, 0.08) !important;
}

:global(.fork-shell-modal__selector-menu .q-virtual-scroll__content),
:global(.fork-shell-modal__selector-menu .q-menu),
:global(.fork-shell-modal__selector-menu .q-list) {
  background: #ffffff !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0;
}

:global(.fork-shell-modal__selector-menu .q-item) {
  min-height: 34px;
  padding: 4px 6px;
  color: #ffffff;
  background: transparent;
}

:global(.fork-shell-modal__selector-menu .q-item.q-manual-focusable--focused),
:global(.fork-shell-modal__selector-menu .q-item--active) {
  background: transparent;
}

:global(.fork-shell-modal__selector-menu .q-item.q-manual-focusable--focused .fork-shell-modal__selector-option-label),
:global(.fork-shell-modal__selector-menu .q-item--active .fork-shell-modal__selector-option-label) {
  background: #000000;
  box-shadow: 0 0 0 1px #ffffff;
}

@media (max-width: 900px) {
  .fork-shell-modal {
    width: min(100vw - 20px, 680px);
  }

  .fork-shell-card {
    min-height: calc(100vh - 20px);
    max-height: calc(100vh - 20px);
  }

  .fork-shell-modal__selector {
    min-width: 0;
    width: 100%;
  }

  .fork-shell-card__header {
    flex-direction: column;
  }

  .fork-shell-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
