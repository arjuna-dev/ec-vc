<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Assistants requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="assistants-page">
      <section class="assistants-shell">
        <div
          class="assistants-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="assistants-shell__copy">
            <div class="assistants-shell__eyebrow">Dashboard</div>
            <h2 class="assistants-shell__hero-title">Review the helpers powering your workflows.</h2>
            <p class="assistants-shell__hero-text">{{ assistantsHeroText }}</p>

          </div>

          <div class="assistants-dashboard">
            <div class="assistants-dashboard__stats">
              <article
                v-for="stat in assistantsDashboardStats"
                :key="stat.label"
                class="assistants-dashboard__stat"
                :class="`assistants-dashboard__stat--${stat.tone}`"
              >
                <div class="assistants-dashboard__stat-label">{{ stat.label }}</div>
                <div class="assistants-dashboard__stat-value">{{ stat.value }}</div>
                <div class="assistants-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="assistants-dashboard__health">
              <div class="assistants-dashboard__health-copy">
                <div class="assistants-dashboard__health-label">Coverage</div>
                <div class="assistants-dashboard__health-text">
                  {{ assistantsDashboard.promptedCount }} with prompts,
                  {{ assistantsDashboard.versionedCount }} versioned,
                  {{ assistantsDashboard.contractCount }} with input contracts
                </div>
              </div>

              <div class="assistants-dashboard__health-bar" aria-hidden="true">
                <span
                  class="assistants-dashboard__health-segment assistants-dashboard__health-segment--sparse"
                  :style="{ width: `${assistantsDashboard.unpromptedShare}%` }"
                />
                <span
                  class="assistants-dashboard__health-segment assistants-dashboard__health-segment--medium"
                  :style="{ width: `${assistantsDashboard.contractShare}%` }"
                />
                <span
                  class="assistants-dashboard__health-segment assistants-dashboard__health-segment--rich"
                  :style="{ width: `${assistantsDashboard.promptedShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="assistants-toolbar">
          <div class="assistants-toolbar__block assistants-toolbar__block--view">
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="assistants-toolbar__toggle assistants-toolbar__view-toggle"
              :options="viewOptions"
            />
          </div>

          <div class="assistants-toolbar__block assistants-toolbar__block--kind">
            <q-btn-toggle
              v-model="assistantKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="assistants-toolbar__toggle assistants-toolbar__kind-toggle"
              :options="assistantKindOptions"
            />
          </div>

          <div class="assistants-toolbar__block assistants-toolbar__block--search">
            <q-icon name="tune" size="18px" class="assistants-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="assistants-toolbar__search"
              placeholder="Search assistants..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black" rounded>
          {{ error }}
        </q-banner>

        <div class="assistants-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="assistants-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No assistants found.</div>
            </div>
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            class="assistants-table"
            flat
            bordered
            row-key="assistant_system_prompt_id"
            :rows="displayRows"
            :columns="columns"
            :loading="loading"
            :pagination="{ rowsPerPage: 15 }"
          />

          <div v-else class="row q-col-gutter-md assistants-cards-grid">
            <div v-for="assistant in displayRows" :key="assistant.assistant_system_prompt_id" class="col-12 col-md-6 col-lg-4">
              <q-card flat bordered class="assistant-card full-height">
                <q-card-section class="assistant-card__header">
                  <div class="row items-start justify-between q-col-gutter-sm no-wrap">
                    <div class="col">
                      <div class="assistant-card__title">
                        {{ assistant.name || 'Unnamed assistant' }}
                      </div>
                      <div v-if="assistant.version" class="assistant-card__meta">
                        Version {{ assistant.version }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-chip
                        dense
                        square
                        :color="assistant.system_prompt ? 'green-1' : 'amber-2'"
                        :text-color="assistant.system_prompt ? 'green-10' : 'amber-10'"
                      >
                        {{ assistant.system_prompt ? 'Prompted' : 'Needs prompt' }}
                      </q-chip>
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="assistant-card__body">
                  <div class="assistant-card__section">
                    <div class="assistant-card__section-label">System Prompt</div>
                    <div class="assistant-card__block">{{ assistant.system_prompt || 'No system prompt.' }}</div>
                  </div>

                  <div class="assistant-card__section">
                    <div class="assistant-card__section-label">Tools / Functions / Context</div>
                    <div class="assistant-card__block">{{ assistant.input_contract || 'None' }}</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.assistants?.list)

function onHeroDashboardPointerEnter(event) {
  updateHeroDashboardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}

function onHeroDashboardPointerMove(event) {
  updateHeroDashboardGradientPosition(event)
}

function onHeroDashboardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--hero-dashboard-blob-opacity', '0')
}

function updateHeroDashboardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}

const rows = ref([])
const loading = ref(false)
const error = ref('')
const viewMode = ref('card')
const assistantKindFilter = ref('all')
const searchQuery = ref('')

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const assistantKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Prompted', value: 'prompted' },
  { label: 'Unprompted', value: 'unprompted' },
]

const columns = [
  { name: 'name', label: 'Assistant', field: 'name', align: 'left', sortable: true },
  { name: 'version', label: 'Version', field: 'version', align: 'left', sortable: true },
  { name: 'system_prompt', label: 'System Prompt', field: 'system_prompt', align: 'left' },
  { name: 'input_contract', label: 'Tools / Functions / Context', field: 'input_contract', align: 'left' },
]

function normalizeAssistantValue(value) {
  return String(value || '').trim()
}

const assistantsDashboard = computed(() => {
  const total = rows.value.length
  const promptedCount = rows.value.filter((row) => normalizeAssistantValue(row?.system_prompt)).length
  const versionedCount = rows.value.filter((row) => normalizeAssistantValue(row?.version)).length
  const contractCount = rows.value.filter((row) => normalizeAssistantValue(row?.input_contract)).length
  const unpromptedCount = total - promptedCount
  const safeTotal = total || 1
  return {
    total,
    promptedCount,
    versionedCount,
    contractCount,
    unpromptedCount,
    promptRate: Math.round((promptedCount / safeTotal) * 100),
    promptedShare: total ? (promptedCount / total) * 100 : 0,
    contractShare: total ? (contractCount / total) * 100 : 0,
    unpromptedShare: total ? (unpromptedCount / total) * 100 : 0,
  }
})

const assistantsHeroText = computed(() => {
  const { total, promptedCount, versionedCount, contractCount } = assistantsDashboard.value
  if (!total) {
    return 'Assistant configurations will appear here as your workspace generates and stores them.'
  }
  return `${total} assistants tracked, ${promptedCount} with system prompts, ${versionedCount} versioned, and ${contractCount} already carrying input contract context.`
})

const assistantsDashboardStats = computed(() => [
  {
    label: 'Total assistants',
    value: assistantsDashboard.value.total,
    caption: 'Configurations available in the workspace',
    tone: 'neutral',
  },
  {
    label: 'Prompted',
    value: assistantsDashboard.value.promptedCount,
    caption: 'Have a system prompt',
    tone: 'rich',
  },
  {
    label: 'Versioned',
    value: assistantsDashboard.value.versionedCount,
    caption: 'Carry version metadata',
    tone: 'rich',
  },
  {
    label: 'Missing prompt',
    value: assistantsDashboard.value.unpromptedCount,
    caption: 'Need fuller configuration',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const query = normalizeAssistantValue(searchQuery.value).toLowerCase()
  let items = [...rows.value]

  if (assistantKindFilter.value === 'prompted') {
    items = items.filter((row) => normalizeAssistantValue(row?.system_prompt))
  } else if (assistantKindFilter.value === 'unprompted') {
    items = items.filter((row) => !normalizeAssistantValue(row?.system_prompt))
  }

  if (query) {
    items = items.filter((row) =>
      [row?.name, row?.version, row?.system_prompt, row?.input_contract]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

async function loadAssistants() {
  if (!bridge.value?.assistants?.list) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.assistants.list()
    rows.value = result?.assistants || []
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAssistants)
</script>

<style scoped>
.assistants-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-24);
}

.assistants-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.assistants-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  box-shadow: var(--ds-shadow-card-soft);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.assistants-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.assistants-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.assistants-shell__hero > * {
  position: relative;
  z-index: 1;
}

.assistants-shell__copy,
.assistants-dashboard {
  position: relative;
  z-index: 1;
}

.assistants-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  justify-content: flex-start;
  min-width: 0;
}

.assistants-shell__eyebrow,
.assistants-dashboard__stat-label,
.assistants-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.12em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.assistants-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.assistants-shell__hero-text {
  margin: auto 0 0;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.assistants-shell__hero-text {
  display: flex;
  align-items: flex-end;
}

.assistants-dashboard__stat-caption,
.assistants-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.assistants-shell__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
}

.assistants-shell__meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--ds-space-12);
  color: var(--ds-color-text-subtle);
  background: var(--ds-color-surface-overlay-72);
  border: 1px solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
}

.assistants-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.assistants-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.assistants-dashboard__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-6);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-84);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-card-soft);
}

.assistants-dashboard__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.assistants-dashboard__stat--rich {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.assistants-dashboard__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.assistants-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.assistants-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.assistants-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.assistants-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.assistants-dashboard__health-segment {
  display: block;
  height: 100%;
}

.assistants-dashboard__health-segment--sparse {
  background: #ff5521;
}

.assistants-dashboard__health-segment--medium {
  background: #ebff5a;
}

.assistants-dashboard__health-segment--rich {
  background: #2647ff;
}

.assistants-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.assistants-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.assistants-toolbar__block--filters {
  flex-wrap: nowrap;
}

.assistants-toolbar__block--search {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.assistants-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.assistants-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.assistants-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.assistants-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.assistants-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.assistants-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.assistants-toolbar__filter-control {
  flex: 0 1 clamp(110px, 16vw, 160px);
  min-width: 110px;
  background: var(--ds-control-surface);
  border-radius: var(--ds-control-radius);
}

.assistants-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.assistants-toolbar__search :deep(.q-field__control),
.assistants-toolbar__search :deep(.q-field__native),
.assistants-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.assistants-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.assistants-toolbar__toggle {
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  background: var(--ds-control-surface);
  color: var(--ds-control-text);
  border-color: var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.assistants-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistants-empty-state {
  padding: 24px;
}

.assistants-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.assistants-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.assistants-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.assistants-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
}

.assistants-cards-grid {
  align-items: stretch;
}

.assistant-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  border-radius: 24px;
  border-color: rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.assistant-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 16%, rgba(38, 71, 255, 0.08), transparent 34%),
    radial-gradient(circle at 88% 0%, rgba(235, 255, 90, 0.1), transparent 28%);
}

.assistant-card > * {
  position: relative;
  z-index: 1;
}

.assistant-card__header {
  padding-bottom: 10px;
}

.assistant-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.assistant-card__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.assistant-card__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.assistant-card__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
}

.assistant-card__section-label {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.assistant-card__block {
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.5;
  white-space: pre-wrap;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
}

@media (max-width: 1200px) {
  .assistants-shell {
    gap: 32px;
  }

  .assistants-shell__hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .assistants-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 20px;
  }

  .assistants-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .assistants-toolbar__filter-control,
  .assistants-toolbar__search,
  .assistants-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .assistants-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
