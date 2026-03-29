<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Agents requires Electron. Run <code>quasar dev -m electron</code> or
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
            <h2 class="assistants-shell__hero-title">Review the agents powering your workflows.</h2>
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
              v-model="assistantLevelFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="assistants-toolbar__toggle assistants-toolbar__kind-toggle"
              :disable="loading"
              :options="assistantLevelOptions"
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
              placeholder="Search agents..."
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
            v-if="!loading && (viewMode === 'org' ? filteredOrgSections.length === 0 : displayRows.length === 0)"
            class="assistants-empty-state bg-grey-1 text-black"
            rounded
          >
            <div class="row items-center justify-between">
              <div>No agents found.</div>
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
            <template #body-cell-level="props">
              <q-td :props="props">
                {{ props.row.levelLabel || '--' }}
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

          <section v-else-if="viewMode === 'org'" class="assistants-hierarchy">
            <div class="assistants-hierarchy__header">
              <div>
                <div class="assistants-hierarchy__eyebrow">Agent Structure</div>
                <h3 class="assistants-hierarchy__title">Agent roles by scope and responsibility.</h3>
              </div>
              <div class="assistants-hierarchy__caption">
                Avatar-level design lives in the Avatar section. This view is just the agent org structure.
              </div>
            </div>

            <div
              v-for="section in filteredOrgSections"
              :key="section.level"
              class="assistants-hierarchy__level"
            >
              <div class="assistants-hierarchy__level-header">
                <div>
                  <div class="assistants-hierarchy__level-eyebrow">{{ section.levelLabel }}</div>
                  <div class="assistants-hierarchy__level-title">{{ section.levelName }}</div>
                </div>
                <div class="assistants-hierarchy__level-copy">{{ section.description }}</div>
              </div>

              <div class="row q-col-gutter-md assistants-hierarchy__grid">
                <div
                  v-for="agent in section.items"
                  :key="agent.name"
                  class="col-12 col-md-6 col-xl-4"
                >
                  <q-card flat bordered class="agent-hierarchy-card full-height">
                    <q-card-section class="agent-hierarchy-card__header">
                      <div class="row items-start justify-between q-col-gutter-sm no-wrap">
                        <div class="col">
                          <div class="agent-hierarchy-card__title">{{ agent.name }}</div>
                          <div class="agent-hierarchy-card__meta">
                            {{ agent.domain }} - Parent {{ agent.parent }}
                          </div>
                        </div>
                      </div>
                    </q-card-section>

                    <q-separator />

                    <q-card-section class="agent-hierarchy-card__body">
                      <div class="agent-hierarchy-card__section">
                        <div class="agent-hierarchy-card__section-label">Mission</div>
                        <div class="agent-hierarchy-card__block">{{ agent.mission }}</div>
                      </div>

                      <div class="agent-hierarchy-card__section">
                        <div class="agent-hierarchy-card__section-label">Managed Scope</div>
                        <div class="agent-hierarchy-card__block">{{ agent.scope }}</div>
                      </div>

                      <div class="agent-hierarchy-card__section">
                        <div class="agent-hierarchy-card__section-label">Primary Responsibilities</div>
                        <div class="agent-hierarchy-card__pills">
                          <q-chip
                            v-for="responsibility in agent.responsibilities"
                            :key="responsibility"
                            dense
                            square
                            class="agent-hierarchy-card__pill"
                          >
                            {{ responsibility }}
                          </q-chip>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </section>

          <div v-else class="row q-col-gutter-md assistants-cards-grid">
            <div v-for="assistant in displayRows" :key="assistant.assistant_system_prompt_id" class="col-12 col-md-6 col-lg-4">
              <q-card flat bordered class="assistant-card full-height">
                <q-card-section class="assistant-card__hero">
                  <div class="assistant-card__hero-main">
                    <figure class="assistant-card__portrait">
                      <div class="assistant-card__portrait-shell" aria-hidden="true">
                        <div
                          class="assistant-card__portrait-badge"
                          :style="{ background: getAgentPortraitGradient(assistant) }"
                        >
                          <div class="assistant-card__portrait-mark">{{ getAgentPortraitMark(assistant) }}</div>
                          <div class="assistant-card__portrait-frame">{{ getAgentFrameLabel(assistant) }}</div>
                        </div>
                      </div>
                    </figure>

                    <div class="assistant-card__hero-side">
                      <div class="assistant-card__hero-top">
                        <div class="assistant-card__hero-copy">
                          <div class="assistant-card__title">
                            {{ assistant.name || 'Unnamed agent' }}
                          </div>
                        <div class="assistant-card__subtitle">
                          {{ assistant.domain }} - {{ assistant.levelLabel }} - Parent {{ assistant.parent || 'Unknown' }}
                        </div>
                      </div>
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
                  <div class="assistant-card__summary-label">Highlights</div>

                  <div class="assistant-card__details">
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
const assistantLevelFilter = ref('all')
const searchQuery = ref('')

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
  { value: 'org', icon: 'account_tree' },
]

const assistantLevelOptions = [
  { label: 'All', value: 'all' },
  { label: 'L0', value: 'level-0' },
  { label: 'L1', value: 'level-1' },
  { label: 'L2', value: 'level-2' },
  { label: 'L3', value: 'level-3' },
]

const AGENT_HIERARCHY_BLUEPRINTS = [
  {
    level: 1,
    levelLabel: 'Level 1',
    levelName: 'Domain Stewards',
    description: 'Section stewards responsible for order, coverage, and process quality in each major workspace area.',
    items: [
      {
        name: 'Users Steward',
        domain: 'Users',
        parent: 'Avatar',
        mission: 'Keep internal team records, permissions, and node roles organized.',
        scope: 'Users section and related ownership links.',
        responsibilities: ['Maintain users', 'Watch permissions', 'Track owner links'],
        keywords: ['users'],
        nextAction: 'Define permission and team-role conventions.',
      },
      {
        name: 'Contacts Steward',
        domain: 'Contacts',
        parent: 'Avatar',
        mission: 'Keep relationship records complete, reachable, and well linked.',
        scope: 'Contacts section and network quality.',
        responsibilities: ['Maintain reachability', 'Enrich profiles', 'Link records'],
        keywords: ['contacts'],
        nextAction: 'Define profile health thresholds.',
      },
      {
        name: 'Companies Steward',
        domain: 'Companies',
        parent: 'Avatar',
        mission: 'Keep company records schema-aligned and databook-ready.',
        scope: 'Companies section and workbook alignment.',
        responsibilities: ['Align schema', 'Watch databooks', 'Protect structure'],
        keywords: ['companies', 'company'],
        nextAction: 'Finish schema-aligned company views.',
      },
      {
        name: 'Opportunities Steward',
        domain: 'Opportunities',
        parent: 'Avatar',
        mission: 'Keep funds and rounds structured for pipeline movement and review.',
        scope: 'Opportunities, funds, and rounds.',
        responsibilities: ['Track raises', 'Link sponsors', 'Maintain rounds'],
        keywords: ['opportunities', 'fund', 'round'],
        nextAction: 'Clarify fund versus round workflows.',
      },
      {
        name: 'Pipelines Steward',
        domain: 'Pipelines',
        parent: 'Avatar',
        mission: 'Keep pipeline stages, status, and execution flow organized.',
        scope: 'Pipelines and project-stage orchestration.',
        responsibilities: ['Manage stages', 'Track status', 'Surface blockages'],
        keywords: ['pipeline', 'project'],
        nextAction: 'Align default pipeline structure with workbook behavior.',
      },
      {
        name: 'Notes Steward',
        domain: 'Notes',
        parent: 'Avatar',
        mission: 'Keep notes structured, retrievable, and tied to the right records.',
        scope: 'Notes and knowledge capture.',
        responsibilities: ['Structure notes', 'Link records', 'Maintain clarity'],
        keywords: ['notes', 'note'],
        nextAction: 'Define note templates and note-link rules.',
      },
      {
        name: 'Tasks Steward',
        domain: 'Tasks',
        parent: 'Avatar',
        mission: 'Keep tasks clear, assigned, and tied to the right operating layer.',
        scope: 'Tasks and execution ownership.',
        responsibilities: ['Assign work', 'Track status', 'Escalate blockers'],
        keywords: ['tasks', 'task'],
        nextAction: 'Clarify task ownership model across levels.',
      },
      {
        name: 'Artifacts Steward',
        domain: 'Artifacts',
        parent: 'Avatar',
        mission: 'Guide intake, filing, conversion, and archive hygiene for source materials.',
        scope: 'Artifacts and file intake.',
        responsibilities: ['Manage intake', 'File records', 'Watch conversion'],
        keywords: ['artifacts', 'artifact', 'intake'],
        nextAction: 'Design the artifact intake process end to end.',
      },
      {
        name: 'Agents Steward',
        domain: 'Agents',
        parent: 'Avatar',
        mission: 'Keep the agent operating system itself coherent and well documented.',
        scope: 'Agent hierarchy, card model, and role definitions.',
        responsibilities: ['Define roles', 'Track coverage', 'Maintain hierarchy'],
        keywords: ['agents', 'assistant', 'prompt'],
        nextAction: 'Attach live configs to hierarchy cards.',
      },
    ],
  },
  {
    level: 2,
    levelLabel: 'Level 2',
    levelName: 'Process Stewards',
    description: 'Workflow-specific agents that maintain recurring processes inside a domain.',
    items: [
      {
        name: 'Intake Steward',
        domain: 'Artifacts',
        parent: 'Artifacts Steward',
        mission: 'Control the path from incoming file to structured workspace record.',
        scope: 'Artifact landing, triage, and routing.',
        responsibilities: ['Receive files', 'Classify intake', 'Route to sections'],
        keywords: ['intake', 'artifact'],
        nextAction: 'Define landing, confirmation, and redirect rules.',
      },
      {
        name: 'Workbook Steward',
        domain: 'Workspace Files',
        parent: 'Avatar',
        mission: 'Keep workbook mirrors coherent, numbered, and easy to audit.',
        scope: 'Excel mirrors and change logs.',
        responsibilities: ['Mirror records', 'Protect numbering', 'Track changes'],
        keywords: ['workbook', 'excel', 'mirror'],
        nextAction: 'Clarify source-of-truth rules between app and files.',
      },
      {
        name: 'Databook Steward',
        domain: 'Companies',
        parent: 'Companies Steward',
        mission: 'Keep databooks structured like a workbook and aligned to schema tabs.',
        scope: 'Databook UX, tabs, and layout logic.',
        responsibilities: ['Align tabs', 'Protect workbook feel', 'Surface gaps'],
        keywords: ['databook'],
        nextAction: 'Complete the workbook-like databook pass.',
      },
      {
        name: 'Permissions Steward',
        domain: 'Users',
        parent: 'Users Steward',
        mission: 'Maintain a clean separation between Owner, Avatar, Users, and Agent permissions.',
        scope: 'Roles and access semantics.',
        responsibilities: ['Define roles', 'Protect ownership', 'Clarify permissions'],
        keywords: ['user', 'owner', 'permission'],
        nextAction: 'Map permission language into the glossary.',
      },
    ],
  },
  {
    level: 3,
    levelLabel: 'Level 3',
    levelName: 'Leaf Stewards',
    description: 'Narrow execution agents responsible for record-level and file-level upkeep.',
    items: [
      {
        name: 'Company Record Steward',
        domain: 'Companies',
        parent: 'Companies Steward',
        mission: 'Maintain one company record and its related databook completeness.',
        scope: 'Single company record and linked sections.',
        responsibilities: ['Maintain record', 'Watch completeness', 'Link related data'],
        keywords: ['company'],
        nextAction: 'Define leaf ownership lifecycle for company records.',
      },
      {
        name: 'Pipeline Stage Steward',
        domain: 'Pipelines',
        parent: 'Pipelines Steward',
        mission: 'Watch one pipeline path or stage for drift, blockers, and stale work.',
        scope: 'Single pipeline stage or lane.',
        responsibilities: ['Watch stage', 'Track movement', 'Flag blockers'],
        keywords: ['pipeline', 'stage'],
        nextAction: 'Define stage-level alerting rules.',
      },
      {
        name: 'Artifact Filing Steward',
        domain: 'Artifacts',
        parent: 'Intake Steward',
        mission: 'Make sure each file lands in the right archive family and linked records.',
        scope: 'Single artifact or artifact batch.',
        responsibilities: ['File correctly', 'Preserve links', 'Maintain archive order'],
        keywords: ['artifact', 'file'],
        nextAction: 'Define final filing destinations per artifact type.',
      },
      {
        name: 'Task Follow-Up Steward',
        domain: 'Tasks',
        parent: 'Tasks Steward',
        mission: 'Keep leaf execution moving and unresolved work visible.',
        scope: 'Single task thread or action cluster.',
        responsibilities: ['Track progress', 'Push follow-up', 'Close loops'],
        keywords: ['task'],
        nextAction: 'Define follow-up cadence and stale-task thresholds.',
      },
    ],
  },
]

const columns = [
  { name: 'name', label: 'Agent', field: 'name', align: 'left', sortable: true },
  { name: 'level', label: 'Level', field: 'levelLabel', align: 'left', sortable: true },
  { name: 'parent', label: 'Parent', field: 'parent', align: 'left', sortable: true },
  { name: 'version', label: 'Version', field: 'version', align: 'left', sortable: true },
  { name: 'config_status', label: 'Config', field: 'linkedConfigName', align: 'left', sortable: true },
  { name: 'mission', label: 'Mission', field: 'mission', align: 'left' },
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
    return 'Start building the agent roster. This page tracks active agent layers and their live configs.'
  }
  return `${total} agents tracked across Levels 1 to 3, ${promptedCount} with prompts, ${versionedCount} versioned, and ${contractCount} carrying input contract context.`
})

const assistantsDashboardStats = computed(() => [
  {
    label: 'Total agents',
    value: assistantsDashboard.value.total,
    caption: 'Active agent roster',
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

function getAgentPortraitMark(agent) {
  return `A${agent.level || ''}`
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

function getAgentCardPills(agent) {
  return [
    agent.levelLabel,
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
  ]
}

function findConfigForBlueprint(blueprint) {
  return rows.value.find((row) => {
    const haystack = buildAssistantSearchText(row)
    return blueprint.keywords.some((keyword) => haystack.includes(keyword))
  }) || null
}

const agentHierarchySections = computed(() =>
  AGENT_HIERARCHY_BLUEPRINTS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const matchingConfig = findConfigForBlueprint(item)
      return {
        ...item,
        assistant_system_prompt_id: matchingConfig?.assistant_system_prompt_id || `blueprint:${section.level}:${item.name}`,
        level: section.level,
        levelLabel: section.levelLabel,
        levelName: section.levelName,
        version: matchingConfig?.version || null,
        system_prompt: matchingConfig?.system_prompt || null,
        input_contract: matchingConfig?.input_contract || null,
        output_contract: matchingConfig?.output_contract || null,
        schema_name: matchingConfig?.schema_name || null,
        linkedConfigName: matchingConfig?.name || null,
      }
    }),
  })),
)

const allAgentRows = computed(() =>
  agentHierarchySections.value.flatMap((section) => section.items),
)

const displayRows = computed(() => {
  const query = normalizeAssistantValue(searchQuery.value).toLowerCase()
  let items = [...allAgentRows.value]

  if (assistantLevelFilter.value !== 'all') {
    const levelNumber = Number(assistantLevelFilter.value.replace('level-', ''))
    items = items.filter((row) => row.level === levelNumber)
  }

  if (query) {
    items = items.filter((row) =>
      [row?.name, row?.version, row?.mission, row?.scope, row?.domain, row?.parent]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }

  return items
})

const filteredOrgSections = computed(() => {
  const ids = new Set(displayRows.value.map((item) => item.assistant_system_prompt_id))
  return agentHierarchySections.value
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => ids.has(item.assistant_system_prompt_id)),
    }))
    .filter((section) => section.items.length > 0)
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
  min-width: 62px;
  padding-inline: 14px;
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

.assistant-card__hero {
  padding-bottom: 12px;
}

.assistant-card__hero-main {
  display: flex;
  gap: 16px;
}

.assistant-card__portrait {
  margin: 0;
  flex: 0 0 108px;
}

.assistant-card__portrait-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108px;
  height: 108px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.8), transparent 55%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.assistant-card__portrait-badge {
  display: flex;
  width: 82px;
  height: 82px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  color: #fff;
  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.assistant-card__portrait-mark {
  font-family: var(--ds-font-family-title);
  font-size: 1.35rem;
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}

.assistant-card__portrait-frame {
  margin-top: 6px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.assistant-card__hero-side {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.assistant-card__hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.assistant-card__hero-copy {
  min-width: 0;
}

.assistant-card__title {
  color: #0f172a;
  font-family: var(--ds-font-family-title);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
}

.assistant-card__subtitle,
.assistant-card__meta {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
}

.assistant-card__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assistant-card__pill {
  background: rgba(38, 71, 255, 0.08);
  color: #2647ff;
  border: 1px solid rgba(38, 71, 255, 0.12);
}

.assistant-card__quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assistant-card__quick-action {
  border-radius: 999px;
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
}

.assistant-card__summary {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.assistant-card__summary-label,
.assistant-card__detail-label {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.assistant-card__details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assistant-card__detail {
  display: flex;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.assistant-card__detail-icon {
  color: #2647ff;
  flex: 0 0 auto;
}

.assistant-card__detail-copy {
  min-width: 0;
}

.assistant-card__detail-value {
  margin-top: 4px;
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.5;
}

.assistant-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 0;
}

.assistant-card__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-card__footer-chip {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.assistant-card__icon-action {
  color: #2647ff;
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

  .assistants-toolbar__filter-control,
  .assistants-toolbar__search,
  .assistants-toolbar__toggle {
    width: 100%;
    min-width: 0;
  }

  .assistant-card__hero-main {
    flex-direction: column;
  }

  .assistant-card__portrait {
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .assistants-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
