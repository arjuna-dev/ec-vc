<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        SRRs requires Electron. Run <code>quasar dev -m electron</code> or
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
            <h2 class="assistants-shell__hero-title">Review your Avatar roles.</h2>
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
              :disable="loading"
              :options="viewOptions"
            />
          </div>

          <div class="assistants-toolbar__block assistants-toolbar__block--kind">
            <q-btn-toggle
              v-model="assistantRoleFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="assistants-toolbar__toggle assistants-toolbar__kind-toggle"
              :disable="loading"
              :options="assistantRoleOptions"
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
              placeholder="Search SRRs..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              dense
              flat
              round
              icon="download"
              color="grey-6"
              class="assistants-toolbar__icon-button"
              disable
            >
              <q-tooltip>Import CSV is not available for roles yet</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              round
              icon="upload"
              color="grey-6"
              class="assistants-toolbar__icon-button"
              :disable="loading || displayRows.length === 0"
              @click="exportAssistantsCsv"
            >
              <q-tooltip>Export CSV</q-tooltip>
            </q-btn>
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
              <div>No SRRs found.</div>
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
          >
            <template #body-cell-role="props">
              <q-td :props="props">
                {{ props.row.roleLabel || '--' }}
              </q-td>
            </template>
            <template #body-cell-parent="props">
              <q-td :props="props">
                {{ props.row.parent || '--' }}
              </q-td>
            </template>
            <template #body-cell-config_status="props">
              <q-td :props="props">
                {{ props.row.linkedConfigName || '--' }}
              </q-td>
            </template>
          </q-table>

          <div v-else class="row q-col-gutter-md assistants-cards-grid">
            <div v-for="assistant in displayRows" :key="assistant.assistant_system_prompt_id" class="col-12 col-md-6 col-lg-4">
              <q-card
                flat
                bordered
                class="assistant-card full-height"
                :style="getAgentCardStyle(assistant)"
                @pointerenter="onAgentCardPointerEnter"
                @pointermove="onAgentCardPointerMove"
                @pointerleave="onAgentCardPointerLeave"
              >
                <q-card-section class="assistant-card__hero">
                  <div class="assistant-card__hero-main">
                    <figure class="assistant-card__portrait">
                      <div class="assistant-card__portrait-shell" aria-hidden="true">
                        <div
                          class="assistant-card__portrait-badge"
                          :style="{ background: getAgentPortraitGradient(assistant) }"
                        >
                          <div class="assistant-card__portrait-mark">
                            <q-icon name="smart_toy" class="assistant-card__portrait-avatar" />
                            <q-icon
                              :name="getAgentMaskIcon(assistant)"
                              class="assistant-card__portrait-mask"
                            />
                          </div>
                          <div class="assistant-card__portrait-frame">{{ getAgentFrameLabel(assistant) }}</div>
                        </div>
                      </div>
                    </figure>

                    <div class="assistant-card__hero-side">
                      <div class="assistant-card__hero-top">
                        <div class="assistant-card__hero-copy">
                          <div class="assistant-card__title">
                            {{ assistant.name || 'Unnamed SRR' }}
                          </div>
                          <div class="assistant-card__role">
                            {{ assistant.domain || 'SRR domain' }} • {{ assistant.roleLabel || 'Unassigned role' }}
                          </div>
                        </div>
                        <q-badge class="assistant-card__level-badge">
                          {{ assistant.parent || 'Avatar' }}
                        </q-badge>
                      </div>

                      <div class="assistant-card__pill-row">
                        <q-badge
                          v-for="pill in getAgentCardPills(assistant)"
                          :key="pill"
                          class="assistant-card__pill"
                        >
                          {{ pill }}
                        </q-badge>
                      </div>

                      <div class="assistant-card__quick-actions">
                        <q-btn
                          v-for="action in getAgentCardActionLinks(assistant)"
                          :key="action.label"
                          outline
                          no-caps
                          unelevated
                          size="sm"
                          class="assistant-card__quick-action"
                          type="button"
                        >
                          <q-icon :name="action.icon" size="16px" class="q-mr-sm" />
                          <span>{{ action.label }}</span>
                        </q-btn>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="assistant-card__summary">
                  <div class="assistant-card__summary-head">
                    <div class="assistant-card__summary-label">Highlights</div>
                  </div>

                  <div class="assistant-card__summary-panel">
                    <div class="assistant-card__summary-body">
                      <div class="assistant-card__summary-body-content">
                        <div v-if="getAgentCardDetails(assistant).length" class="assistant-card__details">
                          <div
                            v-for="detail in getAgentCardDetails(assistant)"
                            :key="detail.label"
                            class="assistant-card__detail"
                          >
                            <q-icon :name="detail.icon" size="16px" class="assistant-card__detail-icon" />
                            <div class="assistant-card__detail-copy">
                              <div class="assistant-card__detail-label">{{ detail.label }}</div>
                              <div class="assistant-card__detail-value">{{ detail.value }}</div>
                            </div>
                          </div>
                        </div>

                        <div v-else class="assistant-card__summary-empty">
                          Add more linked agent detail to make this card richer.
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-actions class="assistant-card__footer">
                  <div class="assistant-card__footer-actions">
                    <q-chip dense square class="assistant-card__footer-chip">
                      {{ assistant.linkedConfigName || 'No linked config yet' }}
                    </q-chip>
                  </div>
                  <div class="assistant-card__footer-actions">
                    <q-btn flat round icon="stadia_controller" class="assistant-card__icon-action" />
                  </div>
                </q-card-actions>
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
import { exportFile, useQuasar } from 'quasar'
import { rowsToCsv } from 'src/utils/csv'

const $q = useQuasar()

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
const assistantRoleFilter = ref('all')
const searchQuery = ref('')

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const assistantRoleOptions = [
  { label: 'All', value: 'all' },
  { label: 'File Stewards', value: 'file-steward' },
  { label: 'Pipeline Managers', value: 'pipeline-manager' },
  { label: 'Team Managers', value: 'team-manager' },
  { label: 'SRR Managers', value: 'agents-manager' },
]

const columns = [
  { name: 'name', label: 'SRR', field: 'name', align: 'left', sortable: true },
  { name: 'role', label: 'Role', field: 'roleLabel', align: 'left', sortable: true },
  { name: 'parent', label: 'Parent', field: 'parent', align: 'left', sortable: true },
  { name: 'version', label: 'Version', field: 'version', align: 'left', sortable: true },
  { name: 'config_status', label: 'Config', field: 'linkedConfigName', align: 'left', sortable: true },
  { name: 'mission', label: 'Mission', field: 'mission', align: 'left' },
]

const csvHeaders = [
  'assistant_system_prompt_id',
  'name',
  'version',
  'description',
  'system_prompt',
  'input_contract',
  'output_contract',
  'schema_name',
  'domain',
  'roleLabel',
  'parent',
  'mission',
  'scope',
  'nextAction',
]

function normalizeAssistantValue(value) {
  return String(value || '').trim()
}

const assistantsDashboard = computed(() => {
  const total = allAgentRows.value.length
  const promptedCount = allAgentRows.value.filter((row) => normalizeAssistantValue(row?.system_prompt)).length
  const versionedCount = allAgentRows.value.filter((row) => normalizeAssistantValue(row?.version)).length
  const contractCount = allAgentRows.value.filter((row) => normalizeAssistantValue(row?.input_contract)).length
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
    return 'Start building the SRR roster. This page tracks active skills, roles, responsibilities, and their live configs.'
  }
  return `${total} SRR cards tracked across active roles, ${promptedCount} with prompts, ${versionedCount} versioned, and ${contractCount} carrying input contract context.`
})

const assistantsDashboardStats = computed(() => [
  {
    label: 'Total SRRs',
    value: assistantsDashboard.value.total,
    caption: 'Active SRR roster',
    tone: 'neutral',
  },
  {
    label: 'Prompted',
    value: assistantsDashboard.value.promptedCount,
    caption: 'Live configs with system prompts',
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

function buildAssistantSearchText(row) {
  return [row?.name, row?.version, row?.description, row?.system_prompt, row?.input_contract, row?.schema_name]
    .map((value) => String(value || '').toLowerCase())
    .join(' ')
}

function hashString(value) {
  return Array.from(String(value || '')).reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0)
  }, 0)
}

function deriveAgentRole(agent) {
  const haystack = [
    agent?.name,
    agent?.domain,
    agent?.mission,
    agent?.scope,
    ...(Array.isArray(agent?.responsibilities) ? agent.responsibilities : []),
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ')

  if (haystack.includes('pipeline') || haystack.includes('stage')) {
    return { key: 'pipeline-manager', label: 'Pipeline Manager' }
  }

  if (
    haystack.includes('user')
    || haystack.includes('team')
    || haystack.includes('permission')
    || haystack.includes('owner')
  ) {
    return { key: 'team-manager', label: 'Team Manager' }
  }

  if (haystack.includes('agent') || haystack.includes('prompt')) {
    return { key: 'agents-manager', label: 'SRR Manager' }
  }

  return { key: 'file-steward', label: 'File Steward' }
}

function getAgentMaskIcon(agent) {
  const icons = {
    'file-steward': 'inventory_2',
    'pipeline-manager': 'filter_alt',
    'team-manager': 'badge',
    'agents-manager': 'theater_comedy',
  }

  return icons[agent?.role] || 'masks'
}

function getAgentFrameLabel(agent) {
  const frames = ['MK-I', 'MK-II', 'ARC', 'PIX', 'BOLT', 'NOVA']
  return frames[Math.abs(hashString(agent.name)) % frames.length]
}

function getAgentPortraitGradient(agent) {
  const gradients = [
    'linear-gradient(180deg, rgba(38,71,255,0.95), rgba(103,128,255,0.78))',
    'linear-gradient(180deg, rgba(255,85,33,0.95), rgba(255,160,126,0.78))',
    'linear-gradient(180deg, rgba(43,58,78,0.95), rgba(107,127,151,0.78))',
    'linear-gradient(180deg, rgba(37,154,111,0.95), rgba(138,225,193,0.78))',
  ]
  return gradients[Math.abs(hashString(agent.domain)) % gradients.length]
}

function getAgentCardStyle(agent) {
  const toneIndex = Math.abs(hashString(`${agent.domain}:${agent.role}`)) % 4
  const tones = [
    {
      strong: 'rgba(38, 71, 255, 0.2)',
      soft: 'rgba(38, 71, 255, 0.1)',
      fade: 'rgba(38, 71, 255, 0.05)',
    },
    {
      strong: 'rgba(255, 122, 0, 0.18)',
      soft: 'rgba(255, 169, 77, 0.1)',
      fade: 'rgba(255, 169, 77, 0.05)',
    },
    {
      strong: 'rgba(31, 160, 118, 0.18)',
      soft: 'rgba(88, 214, 169, 0.1)',
      fade: 'rgba(88, 214, 169, 0.05)',
    },
    {
      strong: 'rgba(111, 76, 255, 0.18)',
      soft: 'rgba(157, 129, 255, 0.1)',
      fade: 'rgba(157, 129, 255, 0.05)',
    },
  ]
  const tone = tones[toneIndex]
  return {
    '--assistant-card-blob-x': '50%',
    '--assistant-card-blob-y': '28%',
    '--assistant-card-blob-size': '62%',
    '--assistant-card-blob-opacity': '0',
    '--assistant-card-blob-strong': tone.strong,
    '--assistant-card-blob-soft': tone.soft,
    '--assistant-card-blob-fade': tone.fade,
  }
}

function onAgentCardPointerEnter(event) {
  updateAgentCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--assistant-card-blob-opacity', '1')
}

function onAgentCardPointerMove(event) {
  updateAgentCardGradientPosition(event)
}

function onAgentCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--assistant-card-blob-opacity', '0')
}

function updateAgentCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--assistant-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--assistant-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getAgentCardPills(agent) {
  return [
    agent.roleLabel,
    agent.domain,
    agent.version ? `v${agent.version}`.replace('vv', 'v') : 'Customizable',
  ]
}

function getAgentCardActionLinks() {
  return [
    { label: 'Portrait', icon: 'smart_toy' },
    { label: 'Parameters', icon: 'tune' },
  ]
}

function getAgentCardDetails(agent) {
  return [
    { label: 'Mission', value: agent.mission, icon: 'flag' },
    { label: 'Scope', value: agent.scope, icon: 'hub' },
    { label: 'Next action', value: agent.nextAction, icon: 'play_arrow' },
  ].filter((detail) => normalizeAssistantValue(detail.value))
}

function startCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function inferAssistantDomain(row) {
  const schemaLabel = startCase(row?.schema_name)
  if (schemaLabel) return schemaLabel

  const haystack = buildAssistantSearchText(row)
  if (haystack.includes('company')) return 'Companies'
  if (haystack.includes('contact')) return 'Contacts'
  if (haystack.includes('artifact') || haystack.includes('file')) return 'Artifacts'
  if (haystack.includes('task')) return 'Tasks'
  if (haystack.includes('pipeline') || haystack.includes('stage')) return 'Pipelines'
  if (haystack.includes('user') || haystack.includes('team')) return 'Users'
  if (haystack.includes('note')) return 'Notes'
  if (haystack.includes('round') || haystack.includes('fund') || haystack.includes('opportunit')) return 'Opportunities'
  return 'General'
}

function summarizePrompt(text) {
  const normalized = normalizeAssistantValue(text).replace(/\s+/g, ' ')
  if (!normalized) return ''
  if (normalized.length <= 140) return normalized
  return `${normalized.slice(0, 137).trimEnd()}...`
}

function mapAssistantRow(row) {
  const role = deriveAgentRole(row)
  return {
    ...row,
    domain: inferAssistantDomain(row),
    mission: normalizeAssistantValue(row?.description) || summarizePrompt(row?.system_prompt) || null,
    scope: startCase(row?.schema_name) || normalizeAssistantValue(row?.input_contract) || null,
    nextAction: normalizeAssistantValue(row?.output_contract) || null,
    parent: 'Live config',
    role: role.key,
    roleLabel: role.label,
    linkedConfigName: normalizeAssistantValue(row?.name) || null,
  }
}

const allAgentRows = computed(() => rows.value.map(mapAssistantRow))

const displayRows = computed(() => {
  const query = normalizeAssistantValue(searchQuery.value).toLowerCase()
  let items = [...allAgentRows.value]

  if (assistantRoleFilter.value !== 'all') {
    items = items.filter((row) => row.role === assistantRoleFilter.value)
  }

  if (query) {
    items = items.filter((row) =>
      [row?.name, row?.version, row?.mission, row?.scope, row?.domain, row?.parent, row?.roleLabel]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

function exportAssistantsCsv() {
  const csv = rowsToCsv(csvHeaders, displayRows.value)
  const ok = exportFile('roles.csv', csv, 'text/csv')
  if (ok !== true) {
    $q.notify({ type: 'negative', message: 'Browser denied file download.' })
  }
}

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

.assistants-toolbar__block--view {
  padding-top: 2px;
  margin-right: 18px;
}

.assistants-toolbar__block--search {
  grid-column: -2 / -1;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.assistants-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.assistants-toolbar__toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.assistants-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.assistants-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.assistants-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.assistants-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.assistants-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.assistants-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.assistants-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.assistants-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.assistants-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.assistants-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
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

.assistants-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistants-hierarchy {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.assistants-hierarchy__header,
.assistants-hierarchy__level-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.assistants-hierarchy__eyebrow,
.assistants-hierarchy__level-eyebrow,
.agent-hierarchy-card__section-label,
.agent-hierarchy-card__footer-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.assistants-hierarchy__title,
.assistants-hierarchy__level-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}

.assistants-hierarchy__title {
  margin: 6px 0 0;
  font-size: clamp(1.35rem, 2vw, 1.8rem);
}

.assistants-hierarchy__level-title {
  margin-top: 6px;
  font-size: 1.1rem;
}

.assistants-hierarchy__caption,
.assistants-hierarchy__level-copy {
  max-width: 44ch;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.assistants-hierarchy__level {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistants-hierarchy__grid {
  align-items: stretch;
}

.agent-hierarchy-card {
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

.agent-hierarchy-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 16%, rgba(38, 71, 255, 0.08), transparent 34%),
    radial-gradient(circle at 88% 0%, rgba(235, 255, 90, 0.1), transparent 28%);
}

.agent-hierarchy-card > * {
  position: relative;
  z-index: 1;
}

.agent-hierarchy-card__header {
  padding-bottom: 10px;
}

.agent-hierarchy-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.agent-hierarchy-card__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.agent-hierarchy-card__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
}

.agent-hierarchy-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.agent-hierarchy-card__block {
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.5;
}

.agent-hierarchy-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.agent-hierarchy-card__pill {
  background: rgba(38, 71, 255, 0.08);
  color: #2647ff;
}

.agent-hierarchy-card__footer {
  display: grid;
  gap: 10px;
}

.agent-hierarchy-card__footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.agent-hierarchy-card__footer-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-sm);
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
  background: linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border-color: rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 18px 42px rgba(17, 17, 17, 0.06);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.assistant-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--assistant-card-blob-x) var(--assistant-card-blob-y),
    var(--assistant-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--assistant-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--assistant-card-blob-size) * 0.46),
    var(--assistant-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--assistant-card-blob-size) * 0.7),
    transparent var(--assistant-card-blob-size)
  );
  opacity: var(--assistant-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.assistant-card > * {
  position: relative;
  z-index: 1;
}

.assistant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.assistant-card__hero {
  padding: 0;
}

.assistant-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.assistant-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #d8d4ca;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
}

.assistant-card__portrait-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.14), transparent 55%),
    linear-gradient(180deg, rgba(17, 17, 17, 0.04), rgba(17, 17, 17, 0.16));
}

.assistant-card__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(17, 17, 17, 0.2) 100%);
  pointer-events: none;
}

.assistant-card__portrait-badge {
  display: flex;
  width: clamp(118px, 44%, 148px);
  height: clamp(118px, 44%, 148px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 32px;
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 36px rgba(17, 17, 17, 0.14);
}

.assistant-card__portrait-mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78px;
  height: 78px;
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.8vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
  letter-spacing: 0.02em;
}

.assistant-card__portrait-avatar {
  font-size: 54px;
  color: rgba(255, 255, 255, 0.94);
  filter: drop-shadow(0 10px 16px rgba(17, 17, 17, 0.18));
}

.assistant-card__portrait-mask {
  position: absolute;
  right: 2px;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 5px;
  font-size: 16px;
  color: rgba(38, 71, 255, 0.94);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  box-shadow: 0 10px 20px rgba(17, 17, 17, 0.18);
}

.assistant-card__portrait-frame {
  margin-top: 8px;
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.1em;
}

.assistant-card__hero-side {
  display: grid;
  grid-template-rows: auto auto auto;
  align-content: start;
  min-width: 0;
  gap: 6px;
  padding: 12px 16px 12px 12px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.assistant-card__hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.assistant-card__hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.assistant-card__title {
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.35rem, 2.2vw, 1.7rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.assistant-card__role,
.assistant-card__meta {
  color: #4b4b4b;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-wrap: balance;
}

.assistant-card__level-badge {
  padding: 6px 9px;
  color: #111;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.assistant-card__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
}

.assistant-card__pill {
  padding: 6px 9px;
  color: #111;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.assistant-card__quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-content: start;
}

.assistant-card__quick-action {
  min-height: 30px;
  width: 100%;
  padding: 0 10px;
  color: #111;
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.assistant-card__quick-action :deep(.q-btn__content) {
  min-width: 0;
  justify-content: flex-start;
}

.assistant-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px 20px 0;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
  backdrop-filter: none;
}

.assistant-card__summary-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 30px;
}

.assistant-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.assistant-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.assistant-card__summary-body-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.assistant-card__summary-label,
.assistant-card__detail-label {
  color: #737373;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 16px;
  text-transform: uppercase;
}

.assistant-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.assistant-card__detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.assistant-card__detail-icon {
  margin-top: 2px;
  color: #6f6f6f;
}

.assistant-card__detail-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.assistant-card__detail-value {
  overflow: hidden;
  color: #111;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.assistant-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 20px;
}

.assistant-card__footer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.assistant-card__footer-chip {
  padding: 6px 9px;
  color: #111;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.assistant-card__icon-action {
  color: #111;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 17, 17, 0.1);
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

  .assistants-hierarchy {
    padding: 20px;
  }

  .assistants-hierarchy__header,
  .assistants-hierarchy__level-header {
    flex-direction: column;
  }

  .assistants-toolbar__block {
    flex-direction: column;
    align-items: stretch;
  }

  .assistants-toolbar__search,
  .assistants-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }

  .assistant-card__hero-main {
    grid-template-columns: 1fr;
    height: 324px;
  }

  .assistant-card__portrait {
    min-height: 156px;
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  }

  .assistant-card__hero-top {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }

  .assistant-card__hero-side {
    gap: 12px;
    padding: 14px;
  }

  .assistant-card__portrait-badge {
    width: 104px;
    height: 104px;
  }

  .assistant-card__quick-actions {
    grid-template-columns: 1fr;
  }

  .assistant-card__title {
    font-size: 1.3rem;
  }

  .assistant-card__summary,
  .assistant-card__footer {
    margin-right: 16px;
    margin-left: 16px;
  }

  .assistant-card__details {
    grid-template-columns: 1fr;
  }

  .assistant-card__footer {
    padding-right: 0;
    padding-left: 0;
  }
}

@media (max-width: 640px) {
  .assistants-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .assistant-card {
    border-radius: 20px;
  }
}
</style>
