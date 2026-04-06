<template>
  <q-page class="q-pa-md fork-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Fork Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="fork-shell">
      <q-banner
        v-if="!branchOptions.length"
        class="bg-red-2 text-black"
        rounded
      >
        {{ activeRegistryEntry.label }} does not declare any create branches yet.
      </q-banner>

      <div v-else class="fork-shell__frame">
        <button
          type="button"
          class="fork-shell__live-link"
          @click="openSourceFile"
        >
          {{ activeRegistryEntry.label }}
        </button>

        <section class="fork-shell__panel">
          <div class="fork-shell__title-row">
            <div class="fork-shell__title-copy">
              <div class="fork-shell__eyebrow">Fork Shell</div>
              <h1 class="fork-shell__title">Choose {{ branchLabel }}</h1>
            </div>

            <div class="fork-shell__shell-selector">
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
                :options="TEST_SHELL_SECTION_OPTIONS"
                popup-content-class="fork-shell__shell-selector-menu"
                class="fork-shell__shell-selector-control"
                @update:model-value="updateShellSelector"
              >
                <template #selected-item="scope">
                  <span class="fork-shell__shell-selector-value">{{ scope.opt.label }}</span>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" class="fork-shell__shell-selector-option">
                    <q-item-section>
                      <span class="fork-shell__shell-selector-option-label">{{ scope.opt.label }}</span>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <p class="fork-shell__text">
            Fork rules live here. Pick the branch to continue into the shared Add/Edit Shell with the branch already selected.
          </p>

          <div class="fork-shell__grid">
            <button
              v-for="branch in branchOptions"
              :key="branch.value"
              type="button"
              class="fork-shell__branch-card"
              @click="selectBranch(branch)"
            >
              <div class="fork-shell__branch-icon">
                <q-icon :name="branch.icon || 'call_split'" size="24px" />
              </div>
              <div class="fork-shell__branch-copy">
                <div class="fork-shell__branch-title">{{ branch.label }}</div>
                <div class="fork-shell__branch-caption">
                  Continue into {{ activeRegistryEntry.singularLabel || 'record' }} create flow as {{ branch.label }}.
                </div>
              </div>
            </button>
          </div>

          <div class="fork-shell__actions">
            <q-btn flat no-caps label="Back" @click="goBack" />
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCreateBranchEntry,
  getCreateBranches,
  getFilePageRegistryEntry,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()

const isElectronRuntime = computed(() => typeof window !== 'undefined')
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const forkShellSourceKey = ref(resolveValidShellSection(route.query.section))
const activeSourceKey = computed(() => forkShellSourceKey.value)
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const branchOptions = computed(() => getCreateBranches(activeSourceKey.value))
const branchLabel = computed(() =>
  String(activeRegistryEntry.value?.createBranchLabel || activeRegistryEntry.value?.singularLabel || 'Type').trim(),
)

watch(
  () => route.query.section,
  (nextValue) => {
    const validValue = resolveValidShellSection(nextValue)
    if (validValue !== forkShellSourceKey.value) {
      forkShellSourceKey.value = validValue
    }
  },
)

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

function updateShellSelector(nextValue) {
  const nextSection = resolveValidShellSection(nextValue)
  forkShellSourceKey.value = nextSection
  router.replace({
    query: {
      ...route.query,
      section: nextSection,
    },
  })
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

function openSourceFile() {
  if (activeRegistryEntry.value?.routeName) {
    router.push({ name: activeRegistryEntry.value.routeName })
    return
  }
  goBack()
}

function resolveValidShellSection(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === normalized) ? normalized : fallbackSectionKey
}
</script>

<style scoped>
.fork-shell-page,
.fork-shell {
  min-height: 100%;
}

.fork-shell {
  display: grid;
}

.fork-shell__frame {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.fork-shell__live-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(17, 17, 17, 0.52);
  font-family: var(--ds-font-family-body);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.fork-shell__live-link:hover,
.fork-shell__live-link:focus-visible {
  color: #2647ff;
}

.fork-shell__panel {
  display: grid;
  gap: 18px;
  max-width: 920px;
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(38, 71, 255, 0.1), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 244, 238, 0.96));
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 28px;
}

.fork-shell__title-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.fork-shell__title-copy {
  display: grid;
  gap: 10px;
}

.fork-shell__eyebrow {
  color: rgba(17, 17, 17, 0.55);
  font-family: var(--ds-font-family-body);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fork-shell__title {
  margin: 0;
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.fork-shell__shell-selector {
  min-width: 200px;
  padding: 6px 12px;
  background: #1f2230;
  border-radius: 999px;
}

.fork-shell__shell-selector-control :deep(.q-field__control) {
  min-height: auto;
  padding: 0;
}

.fork-shell__shell-selector-control :deep(.q-field__native),
.fork-shell__shell-selector-control :deep(.q-field__marginal) {
  color: #f7f4ee;
}

.fork-shell__shell-selector-value {
  color: #f7f4ee;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fork-shell__shell-selector-option-label {
  color: #111111;
  font-size: 0.88rem;
  font-weight: 600;
}

.fork-shell__text {
  max-width: 640px;
  margin: 0;
  color: rgba(17, 17, 17, 0.72);
  font-size: 1rem;
  line-height: 1.5;
}

.fork-shell__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.fork-shell__branch-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
  padding: 18px;
  text-align: left;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 20px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.fork-shell__branch-card:hover,
.fork-shell__branch-card:focus-visible {
  background: #ffffff;
  border-color: rgba(38, 71, 255, 0.28);
  transform: translateY(-1px);
}

.fork-shell__branch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(38, 71, 255, 0.1);
  color: #2647ff;
}

.fork-shell__branch-copy {
  display: grid;
  gap: 6px;
}

.fork-shell__branch-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.fork-shell__branch-caption {
  color: rgba(17, 17, 17, 0.68);
  font-size: 0.92rem;
  line-height: 1.45;
}

.fork-shell__actions {
  display: flex;
  justify-content: flex-end;
}

:global(.fork-shell__shell-selector-menu) {
  background: #ffffff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

:global(.fork-shell__shell-selector-menu .q-item) {
  min-height: 40px;
}

:global(.fork-shell__shell-selector-menu .q-item.q-manual-focusable--focused),
:global(.fork-shell__shell-selector-menu .q-item--active) {
  background: rgba(38, 71, 255, 0.08);
}

@media (max-width: 720px) {
  .fork-shell__shell-selector {
    width: 100%;
  }
}
</style>
