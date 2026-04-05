<template>
  <q-page class="home-dashboard q-pa-md">
    <q-banner v-if="!isElectronRuntime" class="bg-orange-2 text-black" rounded>
      Home dashboard live data requires Electron. Run <code>quasar dev -m electron</code> or
      <code>quasar build -m electron</code>.
    </q-banner>

    <q-banner v-else-if="!hasBridge" class="bg-red-2 text-black" rounded>
      Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
      available).
    </q-banner>

    <template v-else>
      <q-banner v-if="hasLoadErrors" class="bg-amber-2 text-black" rounded>
        Some dashboard sections could not load: {{ failedSectionLabels }}. Refresh to try again.
      </q-banner>

      <q-card flat bordered class="home-dashboard__hero">
        <q-card-section class="home-dashboard__hero-content">
          <div class="home-dashboard__hero-main">
            <div class="home-dashboard__hero-kicker">Live overview</div>
            <div class="home-dashboard__hero-count">
              {{ hasLoadedOnce ? formatCompact(totalRecords) : '...' }}
            </div>
            <div class="home-dashboard__hero-text">records tracked across the workspace</div>

            <div class="home-dashboard__hero-stats">
              <div class="home-dashboard__hero-stat">
                <span class="home-dashboard__hero-stat-label">Open tasks</span>
                <strong>{{ hasLoadedOnce ? formatCompact(openTasksCount) : '...' }}</strong>
              </div>
              <div class="home-dashboard__hero-stat">
                <span class="home-dashboard__hero-stat-label">Recent adds (7d)</span>
                <strong>{{ hasLoadedOnce ? formatCompact(recentAddsCount) : '...' }}</strong>
              </div>
              <div class="home-dashboard__hero-stat">
                <span class="home-dashboard__hero-stat-label">Projects active</span>
                <strong
                  >{{ hasLoadedOnce ? formatCompact(installedPipelinesCount) : '...' }}/{{
                    hasLoadedOnce ? formatCompact(pipelinesCount) : '...'
                  }}</strong
                >
              </div>
            </div>
          </div>

          <div class="home-dashboard__hero-side">
            <div class="home-dashboard__hero-panel">
              <div class="home-dashboard__hero-panel-label">Workspace root</div>
              <div class="home-dashboard__hero-panel-value">
                {{ workspaceRoot ? shortenPath(workspaceRoot) : 'Not available' }}
              </div>
            </div>

            <div class="home-dashboard__hero-panel">
              <div class="home-dashboard__hero-panel-label">Most active signals</div>
              <div class="home-dashboard__hero-chip-group">
                <q-chip
                  v-for="signal in topWorkspaceSignals"
                  :key="signal.label"
                  dense
                  color="white"
                  text-color="black"
                  class="home-dashboard__hero-chip"
                >
                  {{ signal.label }}
                  <span class="home-dashboard__hero-chip-value">{{ signal.value }}</span>
                </q-chip>

                <span v-if="topWorkspaceSignals.length === 0" class="home-dashboard__hero-muted">
                  Add records to see live signals here.
                </span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="col-12 col-sm-6 col-lg-3"
        >
          <q-card
            flat
            bordered
            class="home-dashboard__metric-card"
            :style="{ '--metric-accent': card.accent }"
          >
            <q-card-section class="home-dashboard__metric-card-top">
              <div class="home-dashboard__metric-icon">
                <q-icon :name="card.icon" size="20px" />
              </div>

              <div class="home-dashboard__metric-copy">
                <div class="home-dashboard__metric-label">{{ card.label }}</div>
                <div class="home-dashboard__metric-value">
                  {{ hasLoadedOnce ? formatCompact(card.count) : '...' }}
                </div>
                <div class="home-dashboard__metric-helper">{{ card.helper }}</div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="between">
              <q-btn flat no-caps color="grey-8" :label="card.actionLabel" :to="card.to" />
              <q-icon name="arrow_outward" color="grey-6" size="18px" />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-xl-5">
          <q-card
            flat
            bordered
            class="home-dashboard__panel full-height"
            @pointerenter="onDashboardPanelPointerEnter"
            @pointermove="onDashboardPanelPointerMove"
            @pointerleave="onDashboardPanelPointerLeave"
          >
            <q-card-section class="home-dashboard__panel-header">
              <div>
                <div class="home-dashboard__panel-title">Recent activity</div>
                <div class="home-dashboard__panel-caption">
                  Latest records created across the workspace.
                </div>
              </div>
              <q-icon name="schedule" size="20px" color="grey-6" />
            </q-card-section>

            <q-separator />

            <q-list v-if="recentActivity.length > 0" separator>
              <q-item v-for="item in recentActivity" :key="item.key" clickable :to="item.to">
                <q-item-section avatar>
                  <q-avatar size="40px" color="grey-2" text-color="grey-8">
                    <q-icon :name="item.icon" size="18px" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ item.title }}</q-item-label>
                  <q-item-label caption>{{ item.subtitle }}</q-item-label>
                </q-item-section>

                <q-item-section side top>
                  <q-item-label caption>{{ formatDateTime(item.date) }}</q-item-label>
                  <q-item-label caption class="home-dashboard__list-muted">
                    {{ formatRelativeTime(item.date) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="home-dashboard__empty-state">
              No recent activity yet. Create a record in any section and it will appear here.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <q-card
            flat
            bordered
            class="home-dashboard__panel full-height"
            @pointerenter="onDashboardPanelPointerEnter"
            @pointermove="onDashboardPanelPointerMove"
            @pointerleave="onDashboardPanelPointerLeave"
          >
            <q-card-section class="home-dashboard__panel-header">
              <div>
                <div class="home-dashboard__panel-title">Task focus</div>
                <div class="home-dashboard__panel-caption">
                  What needs attention right now.
                </div>
              </div>
              <q-icon name="task_alt" size="20px" color="grey-6" />
            </q-card-section>

            <q-separator />

            <q-card-section class="home-dashboard__stack">
              <div class="home-dashboard__focus-metrics">
                <div class="home-dashboard__focus-metric">
                  <span>Overdue</span>
                  <strong>{{ hasLoadedOnce ? formatCompact(overdueTasksCount) : '...' }}</strong>
                </div>
                <div class="home-dashboard__focus-metric">
                  <span>Due this week</span>
                  <strong>{{ hasLoadedOnce ? formatCompact(dueThisWeekCount) : '...' }}</strong>
                </div>
                <div class="home-dashboard__focus-metric">
                  <span>Completed</span>
                  <strong>{{ hasLoadedOnce ? formatCompact(completedTasksCount) : '...' }}</strong>
                </div>
              </div>

              <div class="home-dashboard__progress-block">
                <div class="home-dashboard__progress-label">
                  <span>Task completion</span>
                  <strong>{{ formatPercent(taskCompletionRatio) }}</strong>
                </div>
                <q-linear-progress
                  rounded
                  size="10px"
                  color="black"
                  track-color="grey-3"
                  :value="taskCompletionRatio"
                />
              </div>

              <div>
                <div class="home-dashboard__subsection-title">Upcoming</div>

                <div v-if="upcomingTasks.length > 0" class="home-dashboard__mini-list">
                  <div
                    v-for="task in upcomingTasks"
                    :key="task.id"
                    class="home-dashboard__mini-list-item"
                  >
                    <div>
                      <div class="home-dashboard__mini-list-title">
                        {{ task.Task_Name || 'Untitled task' }}
                      </div>
                      <div class="home-dashboard__mini-list-caption">
                        {{ task.company_name || task.opportunity_name || task.contact_name || 'Task' }}
                      </div>
                    </div>
                    <q-badge outline color="grey-7" text-color="grey-8">
                      {{ formatDueState(task.Task_Due_Date) }}
                    </q-badge>
                  </div>
                </div>

                <div v-else class="home-dashboard__empty-inline">
                  No upcoming due dates found.
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6 col-xl-4">
          <q-card
            flat
            bordered
            class="home-dashboard__panel full-height"
            @pointerenter="onDashboardPanelPointerEnter"
            @pointermove="onDashboardPanelPointerMove"
            @pointerleave="onDashboardPanelPointerLeave"
          >
            <q-card-section class="home-dashboard__panel-header">
              <div>
                <div class="home-dashboard__panel-title">Workspace signals</div>
                <div class="home-dashboard__panel-caption">
                  Coverage and deal-flow health at a glance.
                </div>
              </div>
              <q-icon name="insights" size="20px" color="grey-6" />
            </q-card-section>

            <q-separator />

            <q-card-section class="home-dashboard__stack">
              <div class="home-dashboard__progress-block">
                <div class="home-dashboard__progress-label">
                  <span>Pipeline activation</span>
                  <strong>{{ installedPipelinesCount }}/{{ pipelinesCount }}</strong>
                </div>
                <q-linear-progress
                  rounded
                  size="10px"
                  color="orange-8"
                  track-color="grey-3"
                  :value="pipelineActivationRatio"
                />
              </div>

              <div class="home-dashboard__progress-block">
                <div class="home-dashboard__progress-label">
                  <span>Notes linked to records</span>
                  <strong>{{ linkedNotesCount }}/{{ notesCount }}</strong>
                </div>
                <q-linear-progress
                  rounded
                  size="10px"
                  color="blue-8"
                  track-color="grey-3"
                  :value="notesLinkRatio"
                />
              </div>

              <div>
                <div class="home-dashboard__subsection-title">Opportunity mix</div>
                <div class="home-dashboard__hero-chip-group">
                  <q-chip
                    v-for="signal in opportunitySignals"
                    :key="signal.label"
                    dense
                    outline
                    color="grey-7"
                  >
                    {{ signal.label }}
                    <span class="home-dashboard__chip-value">{{ signal.value }}</span>
                  </q-chip>
                  <span v-if="opportunitySignals.length === 0" class="home-dashboard__empty-inline">
                    No opportunity signals yet.
                  </span>
                </div>
              </div>

              <div>
                <div class="home-dashboard__subsection-title">Coverage</div>
                <div class="home-dashboard__coverage-list">
                  <div
                    v-for="item in workspaceCoverage"
                    :key="item.label"
                    class="home-dashboard__coverage-item"
                  >
                    <div>
                      <div class="home-dashboard__coverage-label">{{ item.label }}</div>
                      <div class="home-dashboard__coverage-caption">{{ item.caption }}</div>
                    </div>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.label"
          class="col-12 col-sm-6 col-lg-3"
        >
          <q-card flat bordered class="home-dashboard__shortcut-card">
            <q-card-section class="home-dashboard__shortcut-top">
              <q-avatar size="42px" color="grey-2" text-color="grey-8">
                <q-icon :name="shortcut.icon" size="20px" />
              </q-avatar>
              <div>
                <div class="home-dashboard__shortcut-label">{{ shortcut.label }}</div>
                <div class="home-dashboard__shortcut-caption">{{ shortcut.caption }}</div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="between">
              <q-btn flat no-caps color="grey-8" :label="shortcut.actionLabel" :to="shortcut.to" />
              <q-icon name="east" color="grey-6" size="18px" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { clearBreadcrumbActions, setBreadcrumbActions } from 'src/utils/breadcrumbActionsState'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.fs?.workspaceRoot &&
    !!bridge.value?.companies?.list &&
    !!bridge.value?.contacts?.list &&
    !!bridge.value?.opportunities?.list &&
    !!bridge.value?.projects?.list &&
    !!bridge.value?.artifacts?.list &&
    !!bridge.value?.notes?.list &&
    !!bridge.value?.tasks?.list &&
    !!bridge.value?.roles?.list,
)

const collectionConfigs = [
  {
    key: 'companies',
    label: 'Companies',
    icon: 'apartment',
    to: '/companies',
    accent: '#1d1d1b',
    actionLabel: 'Open companies',
    load: async () => (await bridge.value.companies.list())?.companies || [],
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'people',
    to: '/contacts',
    accent: '#2647ff',
    actionLabel: 'Open contacts',
    load: async () => (await bridge.value.contacts.list())?.contacts || [],
  },
  {
    key: 'funds',
    label: 'Funds',
    icon: 'account_balance_wallet',
    to: '/funds',
    accent: '#ff5521',
    actionLabel: 'Open funds',
    load: async () =>
      ((await bridge.value.opportunities.list())?.opportunities || []).filter(
        (row) => String(row?.kind || '').trim().toLowerCase() === 'fund',
      ),
  },
  {
    key: 'rounds',
    label: 'Rounds',
    icon: 'donut_large',
    to: '/rounds',
    accent: '#ff7a59',
    actionLabel: 'Open rounds',
    load: async () =>
      ((await bridge.value.opportunities.list())?.opportunities || []).filter(
        (row) => String(row?.kind || '').trim().toLowerCase() === 'round',
      ),
  },
  {
    key: 'pipelines',
    label: 'Projects',
    icon: 'schema',
    to: '/projects',
    accent: '#0f766e',
    actionLabel: 'Open projects',
    load: async () => (await bridge.value.projects.list())?.projects || [],
  },
  {
    key: 'artifacts',
    label: 'Artifacts',
    icon: 'attach_file',
    to: '/artifacts',
    accent: '#9333ea',
    actionLabel: 'Open artifacts',
    load: async () => (await bridge.value.artifacts.list())?.artifacts || [],
  },
  {
    key: 'notes',
    label: 'Notes',
    icon: 'note',
    to: '/notes',
    accent: '#2563eb',
    actionLabel: 'Open notes',
    load: async () => (await bridge.value.notes.list())?.notes || [],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'check_circle',
    to: '/tasks',
    accent: '#111827',
    actionLabel: 'Open tasks',
    load: async () => (await bridge.value.tasks.list())?.tasks || [],
  },
  {
    key: 'roles',
    label: 'Roles',
    icon: 'theater_comedy',
    to: '/roles',
    accent: '#db2777',
    actionLabel: 'Open roles',
    load: async () => (await bridge.value.roles.list())?.roles || [],
  },
]

const collectionConfigByKey = Object.fromEntries(collectionConfigs.map((config) => [config.key, config]))
const HOME_BREADCRUMB_ACTION_OWNER = 'home-page'

function createEmptyCollections() {
  return Object.fromEntries(collectionConfigs.map((config) => [config.key, []]))
}

const collections = ref(createEmptyCollections())
const workspaceRoot = ref('')
const loading = ref(false)
const hasLoadedOnce = ref(false)
const lastUpdatedAt = ref(null)
const loadErrors = ref({})

const companies = computed(() => collections.value.companies || [])
const contacts = computed(() => collections.value.contacts || [])
const funds = computed(() => collections.value.funds || [])
const rounds = computed(() => collections.value.rounds || [])
const opportunities = computed(() => [...funds.value, ...rounds.value])
const pipelines = computed(() => collections.value.pipelines || [])
const artifacts = computed(() => collections.value.artifacts || [])
const notes = computed(() => collections.value.notes || [])
const tasks = computed(() => collections.value.tasks || [])
const roles = computed(() => collections.value.roles || [])

const companiesCount = computed(() => companies.value.length)
const contactsCount = computed(() => contacts.value.length)
const opportunitiesCount = computed(() => opportunities.value.length)
const fundsCount = computed(() => funds.value.length)
const roundsCount = computed(() => rounds.value.length)
const pipelinesCount = computed(() => pipelines.value.length)
const artifactsCount = computed(() => artifacts.value.length)
const notesCount = computed(() => notes.value.length)
const tasksCount = computed(() => tasks.value.length)
const rolesCount = computed(() => roles.value.length)

const installedPipelinesCount = computed(
  () => pipelines.value.filter((row) => String(row?.install_status || '') === 'installed').length,
)
const openTasksCount = computed(() => tasks.value.filter((row) => !isTaskCompleted(row)).length)
const completedTasksCount = computed(() => tasks.value.filter((row) => isTaskCompleted(row)).length)
const overdueTasksCount = computed(
  () =>
    tasks.value.filter((row) => {
      if (isTaskCompleted(row)) return false
      const dueDate = parseDateValue(row?.Task_Due_Date)
      return !!dueDate && dueDate < startOfToday()
    }).length,
)
const dueThisWeekCount = computed(
  () =>
    tasks.value.filter((row) => {
      if (isTaskCompleted(row)) return false
      const dueDate = parseDateValue(row?.Task_Due_Date)
      if (!dueDate) return false
      const dayDelta = daysBetween(startOfToday(), dueDate)
      return dayDelta >= 0 && dayDelta <= 6
    }).length,
)
const linkedNotesCount = computed(
  () =>
    notes.value.filter((row) =>
      [row?.opportunity_id, row?.contact_id, row?.pipeline_id, row?.company_id, row?.reference_id]
        .map((value) => String(value || '').trim())
        .some(Boolean),
    ).length,
)
const notesLinkRatio = computed(() => ratio(linkedNotesCount.value, notesCount.value))
const taskCompletionRatio = computed(() => ratio(completedTasksCount.value, tasksCount.value))
const pipelineActivationRatio = computed(() =>
  ratio(installedPipelinesCount.value, pipelinesCount.value),
)

const totalRecords = computed(
  () =>
    companiesCount.value +
    contactsCount.value +
    opportunitiesCount.value +
    pipelinesCount.value +
    artifactsCount.value +
    notesCount.value +
    tasksCount.value +
    rolesCount.value,
)

const activityItems = computed(() => [
    ...companies.value.map((row) => ({
      key: `companies-${row.id}`,
      title: row.Company_Name || 'Untitled company',
      subtitle: row.Status ? `Company • ${row.Status}` : 'Company',
      date: parseDateValue(row.created_at),
      icon: 'apartment',
      to: '/companies',
    })),
    ...contacts.value.map((row) => ({
      key: `contacts-${row.id}`,
      title: row.Name || 'Untitled contact',
      subtitle:
        row.Professional_Email || row.Personal_Email
          ? `Contact • ${row.Professional_Email || row.Personal_Email}`
          : 'Contact',
      date: parseDateValue(row.created_at),
      icon: 'people',
      to: '/contacts',
    })),
    ...opportunities.value.map((row) => ({
      key: `opportunities-${row.id}`,
      title: row.opportunity_name || row.Venture_Oppty_Name || row.Company_Name || 'Opportunity',
      subtitle: row.kind ? `Opportunity • ${toTitleCase(row.kind)}` : 'Opportunity',
      date: parseDateValue(row.created_at),
      icon: 'work',
      to: '/opportunities',
    })),
    ...pipelines.value.map((row) => ({
      key: `projects-${row.id}`,
      title: row.Project_Name || 'Untitled project',
      subtitle: row.install_status ? `Project • ${statusLabel(row.install_status)}` : 'Project',
      date: parseDateValue(row.created_at),
      icon: 'schema',
      to: '/projects',
    })),
    ...artifacts.value.map((row) => ({
      key: `artifacts-${row.artifact_id}`,
      title: row.title || 'Untitled artifact',
      subtitle: row.artifact_type ? `Artifact • ${row.artifact_type}` : 'Artifact',
      date: parseDateValue(row.created_at),
      icon: 'attach_file',
      to: '/artifacts',
    })),
    ...notes.value.map((row) => ({
      key: `notes-${row.id}`,
      title: row.Note_Name || 'Untitled note',
      subtitle: row.created_by_name ? `Note • ${row.created_by_name}` : 'Note',
      date: parseDateValue(row.created_at),
      icon: 'note',
      to: '/notes',
    })),
    ...tasks.value.map((row) => ({
      key: `tasks-${row.id}`,
      title: row.Task_Name || 'Untitled task',
      subtitle: row.Task_Status ? `Task • ${row.Task_Status}` : 'Task',
      date: parseDateValue(row.created_at),
      icon: 'check_circle',
      to: '/tasks',
    })),
  ])

const recentActivity = computed(() =>
  activityItems.value
    .filter((item) => item.date)
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 8)
)

const recentAddsCount = computed(() => {
  const today = startOfToday()
  return activityItems.value.filter((item) => {
    if (!item.date) return false
    const dayDelta = daysBetween(item.date, today)
    return dayDelta >= 0 && dayDelta <= 6
  }).length
})

const upcomingTasks = computed(() =>
  tasks.value
    .filter((row) => !isTaskCompleted(row) && parseDateValue(row?.Task_Due_Date))
    .sort((left, right) => parseDateValue(left.Task_Due_Date) - parseDateValue(right.Task_Due_Date))
    .slice(0, 5),
)

const opportunitySignals = computed(() => {
  const items = topCountEntries(
    opportunities.value.flatMap((row) => [row?.kind, row?.Round_Stage, row?.Fund_Type]),
    4,
  )

  return items.map((entry) => ({
    label: toTitleCase(entry.label.replace(/_/g, ' ')),
    value: entry.count,
  }))
})

const topWorkspaceSignals = computed(() => {
  const signals = [
    { label: 'Companies', value: companiesCount.value },
    { label: 'Contacts', value: contactsCount.value },
    { label: 'Open tasks', value: openTasksCount.value },
    { label: 'Artifacts', value: artifactsCount.value },
  ]

  return signals.filter((signal) => signal.value > 0).slice(0, 4)
})

const workspaceCoverage = computed(() => [
  {
    label: 'Companies with website',
    caption: 'Organizations ready for external reference',
    value: countWithAnyValue(companies.value, ['Website']),
  },
  {
    label: 'Contacts with LinkedIn',
    caption: 'Relationship records with social context',
    value: countWithAnyValue(contacts.value, ['LinkedIn']),
  },
  {
    label: 'Artifacts linked to deal flow',
    caption: 'Artifacts tied to an opportunity',
    value: countWithAnyValue(artifacts.value, ['opportunity_id']),
  },
  {
    label: 'Notes linked to records',
    caption: 'Notes connected to companies, contacts, pipelines, or opportunities',
    value: linkedNotesCount.value,
  },
])

const summaryCards = computed(() => [
  {
    ...collectionConfigByKey.companies,
    count: companiesCount.value,
    helper: `${countWithAnyValue(companies.value, ['Website'])} with website`,
  },
  {
    ...collectionConfigByKey.contacts,
    count: contactsCount.value,
    helper: `${countWithAnyValue(contacts.value, ['Personal_Email', 'Professional_Email'])} with email`,
  },
  {
    ...collectionConfigByKey.funds,
    count: fundsCount.value,
    helper: `${countWithAnyValue(funds.value, ['Fund_Size_Target', 'Investment_Ask'])} with size data`,
  },
  {
    ...collectionConfigByKey.rounds,
    count: roundsCount.value,
    helper: `${countWithAnyValue(rounds.value, ['Round_Stage', 'Investment_Ask'])} with round data`,
  },
  {
    ...collectionConfigByKey.pipelines,
    count: pipelinesCount.value,
    helper: `${installedPipelinesCount.value} active • ${totalPipelineStages()} stages`,
  },
  {
    ...collectionConfigByKey.artifacts,
    count: artifactsCount.value,
    helper: `${countWithAnyValue(artifacts.value, ['opportunity_id'])} linked to opportunities`,
  },
  {
    ...collectionConfigByKey.notes,
    count: notesCount.value,
    helper: `${linkedNotesCount.value} linked to records`,
  },
  {
    ...collectionConfigByKey.tasks,
    count: tasksCount.value,
    helper: `${openTasksCount.value} open • ${overdueTasksCount.value} overdue`,
  },
  {
    ...collectionConfigByKey.roles,
    count: rolesCount.value,
    helper: roles.value.length > 0 ? 'Roles available' : 'No roles yet',
  },
])

const shortcuts = computed(() => [
  {
    label: 'Browse File System',
    caption: workspaceRoot.value ? shortenPath(workspaceRoot.value) : 'Open the workspace browser',
    icon: 'folder_open',
    actionLabel: 'Open browser',
    to: { name: 'file-system' },
  },
  {
    label: 'Review Companies',
    caption: 'Check organizations, statuses, and linked context',
    icon: 'apartment',
    actionLabel: 'Go to companies',
    to: '/companies',
  },
  {
    label: 'Create Task',
    caption: 'Capture next actions from the dashboard',
    icon: 'playlist_add_check_circle',
    actionLabel: 'Go to tasks',
    to: { path: '/tasks', query: { create: '1' } },
  },
  {
    label: 'Create Contact',
    caption: 'Add new people directly into the workspace',
    icon: 'person_add',
    actionLabel: 'Go to contacts',
    to: { path: '/contacts', query: { create: '1' } },
  },
])

const hasLoadErrors = computed(() => Object.keys(loadErrors.value).length > 0)
const failedSectionLabels = computed(() =>
  Object.keys(loadErrors.value)
    .map((key) => (key === 'workspaceRoot' ? 'Workspace root' : collectionConfigByKey[key]?.label || key))
    .join(', '),
)
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return ''
  return `Updated ${formatRelativeTime(lastUpdatedAt.value)}`
})

async function refreshDashboard() {
  if (!hasBridge.value || loading.value) return

  loading.value = true
  const nextCollections = createEmptyCollections()
  const nextErrors = {}

  const loaders = collectionConfigs.map(async (config) => {
    try {
      nextCollections[config.key] = await config.load()
    } catch (error) {
      nextErrors[config.key] = extractErrorMessage(error)
      nextCollections[config.key] = []
    }
  })

  try {
    workspaceRoot.value = (await bridge.value.fs.workspaceRoot()) || ''
  } catch (error) {
    workspaceRoot.value = ''
    nextErrors.workspaceRoot = extractErrorMessage(error)
  }

  await Promise.all(loaders)

  collections.value = nextCollections
  loadErrors.value = nextErrors
  lastUpdatedAt.value = new Date()
  hasLoadedOnce.value = true
  loading.value = false
}

function onWindowFocus() {
  refreshDashboard()
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') refreshDashboard()
}

function totalPipelineStages() {
  return pipelines.value.reduce((sum, row) => sum + parsePipelineStages(row).length, 0)
}

function parsePipelineStages(row) {
  try {
    return JSON.parse(row?.stages || '[]')
  } catch {
    return []
  }
}

function countWithAnyValue(rows, fields) {
  return rows.filter((row) =>
    fields.some((field) => {
      const value = row?.[field]
      return value !== null && value !== undefined && String(value).trim() !== ''
    }),
  ).length
}

function isTaskCompleted(row) {
  const status = String(row?.Task_Status || row?.Status || '').trim().toLowerCase()
  return ['done', 'completed', 'complete', 'closed', 'resolved'].some((value) =>
    status.includes(value),
  )
}

function parseDateValue(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value).trim()
  if (!raw) return null

  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d/.test(raw) ? raw.replace(/\s+/, 'T') : raw
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function daysBetween(left, right) {
  const leftDate = left instanceof Date ? new Date(left) : parseDateValue(left)
  const rightDate = right instanceof Date ? new Date(right) : parseDateValue(right)
  if (!leftDate || !rightDate) return Number.POSITIVE_INFINITY

  leftDate.setHours(0, 0, 0, 0)
  rightDate.setHours(0, 0, 0, 0)

  return Math.round((rightDate.getTime() - leftDate.getTime()) / 86400000)
}

function ratio(part, total) {
  if (!total) return 0
  return Math.max(0, Math.min(1, part / total))
}

function onDashboardPanelPointerEnter(event) {
  updateDashboardPanelGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--home-dashboard-panel-blob-opacity', '1')
}

function onDashboardPanelPointerMove(event) {
  updateDashboardPanelGradientPosition(event)
}

function onDashboardPanelPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--home-dashboard-panel-blob-opacity', '0')
}

function updateDashboardPanelGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--home-dashboard-panel-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--home-dashboard-panel-blob-y', `${clamp(y, 10, 90)}%`)
}

function formatCompact(value) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value || 0),
  )
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`
}

function formatDateTime(value) {
  const date = parseDateValue(value)
  if (!date) return 'No date'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatRelativeTime(value) {
  const date = parseDateValue(value)
  if (!date) return ''

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absMinutes < 60) return rtf.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')

  const diffMonths = Math.round(diffDays / 30)
  return rtf.format(diffMonths, 'month')
}

function formatDueState(value) {
  const date = parseDateValue(value)
  if (!date) return 'No due date'

  const delta = daysBetween(startOfToday(), date)
  if (delta < 0) return 'Overdue'
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function topCountEntries(values, limit = 4) {
  const counts = new Map()

  values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1)
    })

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit)
}

function shortenPath(value) {
  const pathValue = String(value || '').trim()
  if (!pathValue) return ''
  if (pathValue.length <= 44) return pathValue
  return `...${pathValue.slice(-41)}`
}

function statusLabel(status) {
  if (status === 'installed') return 'Created'
  if (status === 'installing') return 'Creating'
  if (status === 'uninstalling') return 'Deleting'
  if (status === 'error') return 'Error'
  return 'Not created'
}

function toTitleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function extractErrorMessage(error) {
  return error?.message || String(error)
}

watchEffect(() => {
  setBreadcrumbActions(HOME_BREADCRUMB_ACTION_OWNER, [
    ...(lastUpdatedLabel.value
      ? [
          {
            id: 'home-updated',
            kind: 'text',
            label: lastUpdatedLabel.value,
          },
        ]
      : []),
    {
      id: 'home-refresh',
      icon: 'refresh',
      label: 'Refresh',
      disabled: loading.value,
      onClick: refreshDashboard,
    },
  ])
})

onMounted(() => {
  refreshDashboard()
  window.addEventListener('focus', onWindowFocus)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  clearBreadcrumbActions(HOME_BREADCRUMB_ACTION_OWNER)
  window.removeEventListener('focus', onWindowFocus)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 32px;
}

.home-dashboard__hero {
  overflow: hidden;
  border: none;
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(235, 255, 90, 0.32), transparent 34%),
    radial-gradient(circle at bottom left, rgba(255, 85, 33, 0.35), transparent 30%),
    linear-gradient(135deg, #111111 0%, #2c2c2c 45%, #ff5521 100%);
  box-shadow: 0 24px 50px rgba(17, 24, 39, 0.16);
}

.home-dashboard__hero-content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.85fr);
  gap: 20px;
  align-items: stretch;
  padding: 22px;
}

.home-dashboard__hero-main,
.home-dashboard__hero-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.home-dashboard__hero-kicker {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.home-dashboard__hero-count {
  font-family: var(--font-title);
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.home-dashboard__hero-text {
  color: rgba(255, 255, 255, 0.84);
  font-size: 1rem;
}

.home-dashboard__hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.home-dashboard__hero-stat,
.home-dashboard__hero-panel {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  padding: 14px 16px;
}

.home-dashboard__hero-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-dashboard__hero-stat-label,
.home-dashboard__hero-panel-label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-dashboard__hero-stat strong,
.home-dashboard__hero-panel-value {
  font-size: 1.2rem;
  line-height: 1.2;
}

.home-dashboard__hero-panel-value {
  word-break: break-word;
}

.home-dashboard__hero-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.home-dashboard__hero-chip {
  background: rgba(255, 255, 255, 0.92) !important;
}

.home-dashboard__hero-chip-value,
.home-dashboard__chip-value {
  margin-left: 6px;
  font-weight: 700;
}

.home-dashboard__hero-muted {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.95rem;
}

.home-dashboard__metric-card,
.home-dashboard__panel,
.home-dashboard__shortcut-card {
  height: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.home-dashboard__metric-card {
  border-top: 3px solid var(--metric-accent);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.home-dashboard__panel {
  position: relative;
  overflow: hidden;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.home-dashboard__panel::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--home-dashboard-panel-blob-x, 50%) var(--home-dashboard-panel-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--home-dashboard-panel-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--home-dashboard-panel-blob-size, 62%) * 0.7),
    transparent var(--home-dashboard-panel-blob-size, 62%)
  );
  opacity: var(--home-dashboard-panel-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.home-dashboard__panel > * {
  position: relative;
  z-index: 1;
}

.home-dashboard__metric-card:hover,
.home-dashboard__panel:hover,
.home-dashboard__shortcut-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
}

.home-dashboard__metric-card-top,
.home-dashboard__shortcut-top,
.home-dashboard__panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.home-dashboard__metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(17, 24, 39, 0.06);
  color: #111827;
  flex-shrink: 0;
}

.home-dashboard__metric-copy {
  min-width: 0;
}

.home-dashboard__metric-label,
.home-dashboard__panel-title,
.home-dashboard__shortcut-label {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.home-dashboard__metric-value {
  margin-top: 6px;
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.home-dashboard__metric-helper,
.home-dashboard__panel-caption,
.home-dashboard__shortcut-caption,
.home-dashboard__list-muted,
.home-dashboard__coverage-caption,
.home-dashboard__empty-inline {
  color: #64748b;
  font-size: 0.9rem;
}

.home-dashboard__stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.home-dashboard__focus-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.home-dashboard__focus-metric {
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-dashboard__focus-metric span,
.home-dashboard__progress-label span,
.home-dashboard__coverage-label,
.home-dashboard__subsection-title,
.home-dashboard__mini-list-caption {
  color: #64748b;
  font-size: 0.83rem;
}

.home-dashboard__focus-metric strong,
.home-dashboard__progress-label strong,
.home-dashboard__coverage-item strong {
  color: #111827;
  font-size: 1.1rem;
}

.home-dashboard__progress-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-dashboard__progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-dashboard__mini-list,
.home-dashboard__coverage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-dashboard__mini-list-item,
.home-dashboard__coverage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  padding: 12px 14px;
}

.home-dashboard__mini-list-title {
  color: #111827;
  font-weight: 700;
}

.home-dashboard__empty-state {
  padding: 18px;
  color: #64748b;
  font-size: 0.95rem;
}

.home-dashboard__shortcut-top {
  align-items: center;
}

@media (max-width: 1199px) {
  .home-dashboard__hero-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .home-dashboard__hero-stats,
  .home-dashboard__focus-metrics {
    grid-template-columns: 1fr;
  }

  .home-dashboard__hero-content {
    padding: 18px;
  }

  .home-dashboard__title {
    font-size: 2.6rem;
  }

  .home-dashboard__metric-value {
    font-size: 1.7rem;
  }

  .home-dashboard__mini-list-item,
  .home-dashboard__coverage-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
