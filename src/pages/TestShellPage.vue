<template>
  <q-page class="q-pa-md test-shell-page">
    <section class="test-shell-panel">
      <div class="test-shell-panel__header">
        <div>
          <div class="test-shell-panel__eyebrow">Sandbox</div>
          <h2 class="test-shell-panel__title">Test Shell</h2>
          <p class="test-shell-panel__text">
            Pick a file section and inspect how the shared shell behaves before we start migrating
            the real pages onto it.
          </p>
        </div>

        <div class="test-shell-panel__controls">
          <q-toggle
            v-model="showTableView"
            color="primary"
            label="Table view"
          />
        </div>
      </div>
    </section>

    <section class="test-shell-preview">
      <FilePageHeroDashboard
        :title="activeShell.heroTitle"
        :text="activeShell.heroText"
        :stats="activeShell.stats"
        :health-label="activeShell.healthLabel"
        :health-text="activeShell.healthText"
        :health-segments="activeShell.healthSegments"
        :copy-justify="activeShell.copyJustify || 'space-between'"
        :eyebrow-letter-spacing="activeShell.eyebrowLetterSpacing || '0.12em'"
      />

      <FilePageToolbar
        :all-visible-selected="allVisibleRowsSelected"
        :some-visible-selected="someVisibleRowsSelected"
        :disabled="displayRows.length === 0"
        :loading="false"
        :search-query="searchQuery"
        :search-placeholder="activeShell.searchPlaceholder"
        :view-mode="viewMode"
        :view-options="viewOptions"
        @toggle-select-all="toggleSelectAllVisible"
        @add="notifyAction('Add Record')"
        @import="notifyAction('Import CSV')"
        @update:search-query="searchQuery = $event"
        @update:view-mode="viewMode = $event"
      />

      <div class="test-shell-surface">
        <q-banner
          v-if="displayRows.length === 0"
          class="test-shell-surface__empty bg-grey-1 text-black"
          rounded
        >
          No preview rows match the current search.
        </q-banner>

        <q-table
          v-else-if="viewMode === 'table'"
          class="test-shell-surface__table"
          flat
          bordered
          row-key="id"
          v-model:selected="selectedRows"
          v-model:pagination="pagination"
          selection="multiple"
          :rows="displayRows"
          :columns="tableColumns"
          :rows-per-page-options="[6, 12, 18]"
        >
          <template #body-cell-actions="props">
            <q-td :props="props">
              <div class="test-shell-surface__table-actions">
                <q-btn dense flat round icon="visibility" color="grey-8" @click="notifyAction(`Open ${props.row.title}`)" />
                <q-btn dense flat round icon="delete" color="grey-8" @click="notifyAction(`Delete ${props.row.title}`)" />
              </div>
            </q-td>
          </template>
        </q-table>

        <div v-else class="row q-col-gutter-md">
          <div v-for="row in displayRows" :key="row.id" class="col-12 col-sm-6 col-lg-4">
            <q-card flat bordered class="test-shell-card full-height">
              <q-card-section class="test-shell-card__control-row">
                <q-checkbox
                  :model-value="isSelected(row)"
                  color="dark"
                  @update:model-value="toggleRowSelection(row, $event)"
                />
                <q-btn flat round icon="visibility" @click="notifyAction(`Open ${row.title}`)" />
              </q-card-section>

              <q-card-section class="test-shell-card__hero">
                <div class="test-shell-card__hero-main">
                  <div class="test-shell-card__avatar" :style="{ backgroundColor: row.color }">
                    {{ row.initials }}
                  </div>

                  <div class="test-shell-card__hero-copy">
                    <div class="test-shell-card__title">{{ row.title }}</div>
                    <div class="test-shell-card__subtitle">{{ row.subtitle }}</div>

                    <div class="test-shell-card__chips">
                      <div v-for="chip in row.chips" :key="chip" class="test-shell-card__chip">
                        {{ chip }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-card-section class="test-shell-card__summary">
                <div class="test-shell-card__summary-label">Summary</div>
                <div class="test-shell-card__summary-text">{{ row.summary }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import FilePageHeroDashboard from 'components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'components/FilePageToolbar.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const shellPreviewConfigs = {
  tasks: {
    heroTitle: 'Keep the next actions visible and moving.',
    heroText: 'Preview how the shared shell feels for a tasks-style page before the cards underneath take over.',
    healthLabel: 'Task mix',
    healthText: '8 open, 3 completed, 5 assigned',
    stats: [
      { label: 'Open', value: 8, caption: 'Need attention this week', tone: 'rich' },
      { label: 'Completed', value: 3, caption: 'Closed recently', tone: 'neutral' },
      { label: 'Assigned', value: 5, caption: 'Already owned', tone: 'neutral' },
      { label: 'Stuck', value: 2, caption: 'Need unblockers', tone: 'sparse' },
    ],
    healthSegments: [
      { tone: 'sparse', width: 20 },
      { tone: 'medium', width: 30 },
      { tone: 'rich', width: 50 },
    ],
    searchPlaceholder: 'Search tasks...',
    rows: [
      buildRow('task-1', 'Draft partner update', 'Due tomorrow', ['Open', 'High Priority'], 'Turn meeting notes into a clean partner update before Friday.', '#2647ff'),
      buildRow('task-2', 'Review SAFE markups', 'Assigned to Erika', ['Legal', 'In Progress'], 'Check the latest SAFE comments and turn blockers into actions.', '#0f766e'),
      buildRow('task-3', 'Prepare diligence packet', 'Blocked by docs', ['Artifacts', 'Waiting'], 'Need the final deck and model before this packet can ship.', '#b45309'),
    ],
  },
  notes: {
    heroTitle: 'Capture what matters and find it quickly.',
    heroText: 'Preview the same shell with a quieter note-driven page profile.',
    healthLabel: 'Coverage',
    healthText: '14 authored, 10 named, 4 still untitled',
    stats: [
      { label: 'Total', value: 14, caption: 'Notes in this slice', tone: 'neutral' },
      { label: 'Named', value: 10, caption: 'Easy to find later', tone: 'rich' },
      { label: 'Authored', value: 14, caption: 'Creator metadata present', tone: 'neutral' },
      { label: 'Untitled', value: 4, caption: 'Still need cleanup', tone: 'sparse' },
    ],
    healthSegments: [
      { tone: 'sparse', width: 28 },
      { tone: 'medium', width: 22 },
      { tone: 'rich', width: 50 },
    ],
    searchPlaceholder: 'Search notes...',
    rows: [
      buildRow('note-1', 'Board prep notes', 'Meeting summary', ['Board', 'April'], 'Key takeaways from the April board prep call, including follow-up asks.', '#7c3aed'),
      buildRow('note-2', 'Founder dinner recap', 'Relationship note', ['Founder', 'Warm'], 'Personal context and next touchpoint for the founder relationship.', '#be185d'),
      buildRow('note-3', 'Market map scratchpad', 'Working draft', ['Research', 'Draft'], 'Loose notes for the emerging market map and category framing.', '#1d4ed8'),
    ],
  },
  companies: {
    heroTitle: 'Know which companies are ready to work.',
    heroText: 'Preview the shell with a more profile-heavy page where the cards likely need richer internals later.',
    healthLabel: 'Profile health',
    healthText: '6 rich, 9 medium, 5 sparse',
    copyJustify: 'flex-start',
    eyebrowLetterSpacing: '0.16em',
    stats: [
      { label: 'Tracked', value: 20, caption: 'Company records in scope', tone: 'neutral' },
      { label: 'Rich', value: 6, caption: 'Profiles ready to use', tone: 'rich' },
      { label: 'Medium', value: 9, caption: 'Need a little more detail', tone: 'neutral' },
      { label: 'Sparse', value: 5, caption: 'Still need structure', tone: 'sparse' },
    ],
    healthSegments: [
      { tone: 'sparse', width: 25 },
      { tone: 'medium', width: 45 },
      { tone: 'rich', width: 30 },
    ],
    searchPlaceholder: 'Search companies...',
    rows: [
      buildRow('company-1', 'North Coast Labs', 'Data tooling for operators', ['B2B SaaS', 'Seed'], 'Infrastructure company with strong operator adoption and clear expansion path.', '#2563eb'),
      buildRow('company-2', 'Harbor Health', 'Workflow software for clinics', ['Health', 'Series A'], 'Clinic operations software with solid retention but still sparse financial detail.', '#0f766e'),
      buildRow('company-3', 'Copper Grid', 'Industrial energy software', ['Climate', 'Pre-Seed'], 'Interesting wedge, but profile still needs more market and traction coverage.', '#b45309'),
    ],
  },
  contacts: {
    heroTitle: 'Relationship map at a glance.',
    heroText: 'Preview the same shell for a contact-heavy page where the system should still feel identical.',
    healthLabel: 'Profile health',
    healthText: '7 rich, 11 medium, 4 sparse',
    copyJustify: 'flex-start',
    eyebrowLetterSpacing: '0.16em',
    stats: [
      { label: 'Contacts', value: 22, caption: 'People in this slice', tone: 'neutral' },
      { label: 'Warm', value: 7, caption: 'Active relationships', tone: 'rich' },
      { label: 'Mapped', value: 11, caption: 'Basic profile coverage', tone: 'neutral' },
      { label: 'Thin', value: 4, caption: 'Need more context', tone: 'sparse' },
    ],
    healthSegments: [
      { tone: 'sparse', width: 18 },
      { tone: 'medium', width: 50 },
      { tone: 'rich', width: 32 },
    ],
    searchPlaceholder: 'Search contacts...',
    rows: [
      buildRow('contact-1', 'Maya Chen', 'Partner at North Ridge', ['Investor', 'Warm'], 'Active investor relationship with recent follow-up on infrastructure deals.', '#2647ff'),
      buildRow('contact-2', 'Luis Ortega', 'Founder at Harbor Health', ['Founder', 'Clinic Ops'], 'Strong context on customer pain and product roadmap, but sparse personal profile fields.', '#7c3aed'),
      buildRow('contact-3', 'Priya Shah', 'Chief of Staff at Copper Grid', ['Operator', 'Intro Pending'], 'Good connective tissue for the team, still waiting on a full intro cycle.', '#be185d'),
    ],
  },
}

const selectedShellKey = computed({
  get() {
    const current = String(route.query.section || '').trim().toLowerCase()
    return Object.prototype.hasOwnProperty.call(shellPreviewConfigs, current) ? current : 'tasks'
  },
  set(value) {
    const normalized = String(value || '').trim().toLowerCase()
    router.replace({
      query: {
        ...route.query,
        section: Object.prototype.hasOwnProperty.call(shellPreviewConfigs, normalized) ? normalized : 'tasks',
      },
    })
  },
})
const showTableView = ref(false)
const searchQuery = ref('')
const selectedRows = ref([])
const pagination = ref({ page: 1, rowsPerPage: 6 })

const activeShell = computed(() => shellPreviewConfigs[selectedShellKey.value] || shellPreviewConfigs.tasks)
const viewMode = computed({
  get: () => (showTableView.value ? 'table' : 'card'),
  set: (value) => {
    showTableView.value = value === 'table'
  },
})

const displayRows = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  if (!query) return activeShell.value.rows

  return activeShell.value.rows.filter((row) =>
    [row.title, row.subtitle, row.summary, ...(row.chips || [])].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

const tableColumns = computed(() => [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'subtitle', label: 'Subtitle', field: 'subtitle', align: 'left', sortable: true },
  { name: 'summary', label: 'Summary', field: 'summary', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
])

const visibleRowIds = computed(() => displayRows.value.map((row) => row.id))
const selectedRowIdSet = computed(() => new Set(selectedRows.value.map((row) => row.id)))
const allVisibleRowsSelected = computed(
  () => visibleRowIds.value.length > 0 && visibleRowIds.value.every((id) => selectedRowIdSet.value.has(id)),
)
const someVisibleRowsSelected = computed(
  () => visibleRowIds.value.some((id) => selectedRowIdSet.value.has(id)),
)

watch(selectedShellKey, () => {
  searchQuery.value = ''
  selectedRows.value = []
  pagination.value = { page: 1, rowsPerPage: 6 }
})

function buildRow(id, title, subtitle, chips, summary, color) {
  return {
    id,
    title,
    subtitle,
    chips,
    summary,
    color,
    initials:
      title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase?.() || '')
        .join('') || 'TS',
  }
}

function toggleSelectAllVisible(nextValue) {
  if (nextValue === false) {
    selectedRows.value = selectedRows.value.filter((row) => !visibleRowIds.value.includes(row.id))
    return
  }

  const preserved = selectedRows.value.filter((row) => !visibleRowIds.value.includes(row.id))
  selectedRows.value = [...preserved, ...displayRows.value]
}

function toggleRowSelection(row, nextValue) {
  const remaining = selectedRows.value.filter((entry) => entry.id !== row.id)
  selectedRows.value = nextValue === false ? remaining : [...remaining, row]
}

function isSelected(row) {
  return selectedRowIdSet.value.has(row.id)
}

function notifyAction(label) {
  $q.notify({
    type: 'info',
    message: `${label} is only wired as a shell preview here.`,
  })
}
</script>

<style scoped>
.test-shell-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.test-shell-panel,
.test-shell-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.test-shell-panel {
  padding: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 247, 255, 0.96) 100%);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-card-soft);
}

.test-shell-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.test-shell-panel__eyebrow,
.test-shell-card__summary-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.test-shell-panel__title {
  margin: 10px 0 0;
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.98;
}

.test-shell-panel__text {
  margin: 12px 0 0;
  max-width: 60ch;
  color: var(--ds-color-text-secondary);
}

.test-shell-panel__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.test-shell-surface__table-actions {
  display: inline-flex;
  gap: 4px;
}

.test-shell-card {
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-card-soft);
}

.test-shell-card__control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-shell-card__hero-main {
  display: flex;
  gap: 16px;
}

.test-shell-card__avatar {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: white;
  font-weight: 700;
}

.test-shell-card__hero-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: 1.15rem;
  font-weight: var(--ds-font-weight-bold);
}

.test-shell-card__subtitle,
.test-shell-card__summary-text {
  color: var(--ds-color-text-secondary);
}

.test-shell-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-shell-card__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.96);
  color: #334155;
}

@media (max-width: 900px) {
  .test-shell-panel__header {
    flex-direction: column;
  }
}
</style>
