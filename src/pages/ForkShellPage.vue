<template>
  <q-page class="q-pa-md fork-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Fork Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="fork-shell">
      <q-banner v-if="!activeRegistryEntry" class="bg-red-2 text-black" rounded>
        This route needs a valid branchable `L1` in <code>section</code>.
      </q-banner>

      <q-banner
        v-else-if="!branchOptions.length"
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
        <div class="fork-shell__eyebrow">Fork Shell</div>
        <h1 class="fork-shell__title">Choose {{ branchLabel }}</h1>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCreateBranchEntry, getCreateBranches, getFilePageRegistryEntry } from 'src/utils/structureRegistry'

const route = useRoute()
const router = useRouter()

const isElectronRuntime = computed(() => typeof window !== 'undefined')
const sourceKey = computed(() => String(route.query.section || '').trim().toLowerCase())
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(sourceKey.value) || null)
const branchOptions = computed(() => getCreateBranches(sourceKey.value))
const branchLabel = computed(() =>
  String(activeRegistryEntry.value?.createBranchLabel || activeRegistryEntry.value?.singularLabel || 'Type').trim(),
)

function selectBranch(branch) {
  const branchEntry = getCreateBranchEntry(sourceKey.value, branch?.value)
  if (!branchEntry) return
  router.push({
    name: 'dialog-shell',
    query: {
      section: sourceKey.value,
      create: String(Date.now()),
      kind: branchEntry.value,
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
</style>
