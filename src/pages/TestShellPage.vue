<template>
  <q-page class="q-pa-md test-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Test Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasSupportedBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but this section does not expose a supported list bridge yet.
      </q-banner>
    </div>

    <div v-else class="test-shell-body">
      <FilePageHeroDashboard
        eyebrow="Test Shell"
        :title="heroTitle"
        :text="heroText"
        :stats="heroStats"
        health-label="Contract health"
        :health-text="healthText"
        :health-segments="healthSegments"
      />

      <FilePageToolbar
        :all-visible-selected="false"
        :some-visible-selected="false"
        :disabled="true"
        :loading="loading"
        :search-query="searchQuery"
        :search-placeholder="searchPlaceholder"
        view-mode="card"
        :view-options="[]"
        :show-view-toggle="false"
        @toggle-select-all="noop"
        @add="notifyShellAction('Add Record')"
        @import="notifyShellAction('Import CSV')"
        @update:search-query="searchQuery = $event"
      />

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <q-card flat bordered class="test-shell-contract-card">
        <q-card-section class="test-shell-contract-card__head">
          <div>
            <div class="test-shell-contract-card__eyebrow">Strict Contract Check</div>
            <h3 class="test-shell-contract-card__title">Canonical Source Review</h3>
            <div class="test-shell-contract-card__source">
              Selected source: {{ activeRegistryEntry?.label || 'Section' }}
            </div>
          </div>
          <div class="test-shell-contract-card__meta">
            {{ rawRows.length }} real rows loaded
          </div>
        </q-card-section>

        <q-card-section class="test-shell-contract-card__body">
          <div class="test-shell-contract-card__summary">
            <p>
              The shared page shell is now reading only explicit canonical structure plus live row counts.
              Card rendering is intentionally blocked until the canonical architecture provides an explicit shell payload contract.
            </p>
          </div>

          <div class="test-shell-contract-grid">
            <article class="test-shell-contract-panel">
              <div class="test-shell-contract-panel__label">Canonical Inputs Present</div>
              <ul class="test-shell-contract-list">
                <li>`L1` entity: {{ activeRegistryEntry?.entityName || '--' }}</li>
                <li>`L2` sections: {{ level2Sections.length }}</li>
                <li>`L3` tokens: {{ level3Tokens.length }}</li>
                <li>`DB` rows: {{ rawRows.length }}</li>
              </ul>
            </article>

            <article class="test-shell-contract-panel test-shell-contract-panel--missing">
              <div class="test-shell-contract-panel__label">Explicit Contract Missing</div>
              <ul class="test-shell-contract-list">
                <li>`card.title` source mapping</li>
                <li>`card.subtitle` source mapping</li>
                <li>`card.chips[]` source mapping</li>
                <li>`card.summary` source mapping</li>
                <li>`card.sections[]` source-to-L2 ownership mapping</li>
              </ul>
            </article>
          </div>

          <div class="test-shell-canonical">
            <div class="test-shell-canonical__section">
              <div class="test-shell-canonical__label">Level 2 Sections</div>
              <div class="test-shell-canonical__chips">
                <span
                  v-for="section in level2Sections"
                  :key="section.key"
                  class="test-shell-canonical__chip"
                >
                  {{ section.label }}
                </span>
              </div>
            </div>

            <div class="test-shell-canonical__section">
              <div class="test-shell-canonical__label">Level 3 Tokens</div>
              <div class="test-shell-token-list">
                <div
                  v-for="token in visibleTokens"
                  :key="token.key"
                  class="test-shell-token-row"
                >
                  <div class="test-shell-token-row__name">{{ token.tokenName }}</div>
                  <div class="test-shell-token-row__meta">
                    {{ token.parentLabel }} • {{ token.tokenType || 'token' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="test-shell-canonical__section">
              <div class="test-shell-canonical__label">Live Row Shape</div>
              <div v-if="visibleRowKeys.length" class="test-shell-canonical__chips">
                <span
                  v-for="key in visibleRowKeys"
                  :key="key"
                  class="test-shell-canonical__chip test-shell-canonical__chip--row"
                >
                  {{ key }}
                </span>
              </div>
              <div v-else class="test-shell-contract-card__empty">
                No rows loaded for this section.
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import FilePageHeroDashboard from 'components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'components/FilePageToolbar.vue'
import {
  getFilePageRegistryEntry,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'

const route = useRoute()
const $q = useQuasar()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const rawRows = ref([])

const SECTION_LOADERS = {
  users: {
    listFn: (bridgeValue) => bridgeValue?.users?.list?.(),
    resultKey: 'users',
  },
  artifacts: {
    listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(),
    resultKey: 'artifacts',
  },
  contacts: {
    listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(),
    resultKey: 'contacts',
  },
  companies: {
    listFn: (bridgeValue) => bridgeValue?.companies?.list?.(),
    resultKey: 'companies',
  },
  projects: {
    listFn: (bridgeValue) => bridgeValue?.projects?.list?.(),
    resultKey: 'projects',
  },
  notes: {
    listFn: (bridgeValue) => bridgeValue?.notes?.list?.(),
    resultKey: 'notes',
  },
  tasks: {
    listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(),
    resultKey: 'tasks',
  },
}

const fallbackSectionKey =
  TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value ||
  TEST_SHELL_SECTION_OPTIONS[0]?.value ||
  'tasks'

const activeSectionKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})

const activeRegistryEntry = computed(
  () => getFilePageRegistryEntry(activeSectionKey.value) || getFilePageRegistryEntry(fallbackSectionKey),
)

const activeLoader = computed(() => SECTION_LOADERS[activeSectionKey.value] || null)
const hasSupportedBridge = computed(() => {
  if (!activeLoader.value) return false
  return typeof activeLoader.value.listFn(bridge.value) !== 'undefined'
})

const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSectionKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSectionKey.value] || [])

const visibleTokens = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const tokens = level3Tokens.value
  if (!query) return tokens.slice(0, 24)
  return tokens
    .filter((token) =>
      [token.tokenName, token.parentLabel, token.tokenType].some((value) =>
        String(value || '').toLowerCase().includes(query),
      ),
    )
    .slice(0, 24)
})

const visibleRowKeys = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const keyCounts = new Map()

  for (const row of rawRows.value) {
    for (const key of Object.keys(row || {})) {
      const normalizedKey = String(key || '').trim()
      if (!normalizedKey) continue
      if (query && !normalizedKey.toLowerCase().includes(query)) continue
      keyCounts.set(normalizedKey, (keyCounts.get(normalizedKey) || 0) + 1)
    }
  }

  return [...keyCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 24)
    .map(([key]) => key)
})

const heroTitle = computed(() => 'Test the shared page shell.')
const heroText = computed(
  () => 'This shell now reads only explicit canonical structure plus live source rows. Rendering stops where the explicit shell contract is still missing.',
)

const heroStats = computed(() => [
  {
    label: 'Rows',
    value: rawRows.value.length,
    caption: 'Loaded from live source',
    tone: 'neutral',
  },
  {
    label: 'L2',
    value: level2Sections.value.length,
    caption: 'Canonical sections present',
    tone: 'rich',
  },
  {
    label: 'L3',
    value: level3Tokens.value.length,
    caption: 'Canonical tokens present',
    tone: 'neutral',
  },
  {
    label: 'Gap',
    value: 5,
    caption: 'Explicit shell fields still undefined',
    tone: 'sparse',
  },
])

const healthText = computed(() => {
  return `Canonical structure is present, but explicit page-shell payload mapping is still missing for title, subtitle, chips, summary, and section ownership.`
})

const healthSegments = computed(() => [
  { tone: 'medium', width: 45 },
  { tone: 'rich', width: 35 },
  { tone: 'sparse', width: 20 },
])

const searchPlaceholder = computed(
  () => 'Filter canonical tokens and live row keys...',
)

watch(
  activeSectionKey,
  async () => {
    searchQuery.value = ''
    await loadRows()
  },
  { immediate: true },
)

async function loadRows() {
  error.value = ''
  rawRows.value = []
  const loader = activeLoader.value
  if (!loader) {
    error.value = 'This section does not have a supported live loader yet.'
    return
  }

  const bridgeValue = bridge.value
  if (!bridgeValue) {
    error.value = 'The preload bridge is not available.'
    return
  }

  loading.value = true
  try {
    const result = await loader.listFn(bridgeValue)
    rawRows.value = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
  } catch (loadError) {
    error.value = loadError?.message || `Could not load ${activeRegistryEntry.value?.label || 'records'}.`
  } finally {
    loading.value = false
  }
}

function notifyShellAction(label) {
  $q.notify({
    type: 'info',
    message: `${label} stays disabled here until the explicit shell contract exists.`,
  })
}

function noop() {}
</script>

<style scoped>
.test-shell-page,
.test-shell-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-shell-contract-card {
  border-radius: 28px;
  box-shadow: var(--ds-shadow-card-soft);
}

.test-shell-contract-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
}

.test-shell-contract-card__eyebrow,
.test-shell-contract-panel__label,
.test-shell-canonical__label {
  color: var(--ds-color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.test-shell-contract-card__title {
  margin: 8px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: 1.5rem;
  font-weight: var(--ds-font-weight-bold);
}

.test-shell-contract-card__meta {
  color: var(--ds-color-text-muted);
  font-size: 0.9rem;
}

.test-shell-contract-card__source {
  margin-top: 8px;
  color: var(--ds-color-text-secondary);
  font-size: 0.92rem;
}

.test-shell-contract-card__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-shell-contract-card__summary {
  color: var(--ds-color-text-secondary);
  line-height: 1.6;
}

.test-shell-contract-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.test-shell-contract-panel {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
}

.test-shell-contract-panel--missing {
  background: rgba(255, 244, 238, 0.84);
}

.test-shell-contract-list {
  margin: 0;
  padding-left: 18px;
  color: var(--ds-color-text-secondary);
  line-height: 1.6;
}

.test-shell-canonical {
  display: grid;
  gap: 18px;
}

.test-shell-canonical__section {
  display: grid;
  gap: 10px;
}

.test-shell-canonical__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-shell-canonical__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: var(--ds-color-text-secondary);
  font-size: 0.82rem;
}

.test-shell-canonical__chip--row {
  background: rgba(238, 241, 255, 0.96);
}

.test-shell-token-list {
  display: grid;
  gap: 10px;
}

.test-shell-token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
}

.test-shell-token-row__name {
  color: var(--ds-color-text-primary);
  font-weight: 600;
}

.test-shell-token-row__meta {
  color: var(--ds-color-text-muted);
  font-size: 0.82rem;
  text-align: right;
}

.test-shell-contract-card__empty {
  color: var(--ds-color-text-muted);
}

@media (max-width: 900px) {
  .test-shell-contract-grid {
    grid-template-columns: 1fr;
  }

  .test-shell-token-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-shell-token-row__meta {
    text-align: left;
  }
}
</style>
