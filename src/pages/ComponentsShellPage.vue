<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__board">
      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('page-title-crumb')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Page Title / Crumb</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--left">
          <div class="components-shell-page__crumb-shell">
            <div class="components-shell-page__crumb-row">
              <span class="components-shell-page__crumb-link">Files</span>
              <span class="components-shell-page__crumb-separator">/</span>
              <span class="components-shell-page__crumb-current">Components Shell</span>
            </div>
            <div class="components-shell-page__page-title">Components Shell</div>
          </div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('page-back-symbol')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Page Back Symbol</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__back-button" aria-label="Back">
            <q-icon name="west" />
            <span>Back</span>
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('b10-logo')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">B10 Logo</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__logo-badge">B10</div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('plus-icon')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Plus Icon</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-icon-button" aria-label="Add">
            <q-icon name="add" />
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('plus-with-label')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Plus With Label</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-label-button">
            <q-icon name="add" />
            <span>Add</span>
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('b10-button')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">B10 Button</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <B10Button label="Primary" variant="primary" />
          <B10Button label="Neutral" variant="neutral" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('b10-icon-button')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">B10 Icon Button</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <B10IconButton icon="arrow_back" variant="neutral" aria-label="Back" />
          <B10IconButton icon="add" variant="primary" aria-label="Add" />
          <B10IconButton icon="tune" variant="subtle" aria-label="Settings" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--dashboard">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('file-dashboard')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">File Dashboard</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <FilePageHeroDashboard
            eyebrow="Dashboard"
            title="Companies"
            text="Track the live operating picture for this file and move through core workflows from one surface."
            :stats="fileDashboardStats"
            health-label="File Health"
            health-text="Healthy structure with active records and recent updates."
            :health-segments="fileDashboardHealth"
          />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--toolbar-wide">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('file-toolbar')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">File Toolbar</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <FilePageToolbar
            :all-visible-selected="false"
            :some-visible-selected="true"
            add-label="Add Record"
            search-query=""
            search-placeholder="Search Companies"
            view-mode="card"
            :view-options="viewOptions"
            :show-view-toggle="true"
          />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--lg">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('l2-toolbar')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">L2 Toolbar</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <ShellSectionToolbar
            v-model="activeToolbarSection"
            :items="toolbarItems"
            :view-mode="toolbarViewMode"
            :view-options="viewOptions"
            :show-view-toggle="true"
            aria-label="Level 2 Sections"
            @update:view-mode="toolbarViewMode = $event"
          />
        </div>
      </article>
    </section>

    <q-dialog v-model="componentDetailOpen">
      <q-card class="components-shell-page__detail-card">
        <q-card-section class="components-shell-page__detail-head">
          <div>
            <div class="components-shell-page__detail-eyebrow">Component Details</div>
            <div class="components-shell-page__detail-title">{{ selectedComponentDetail?.title || 'Component' }}</div>
          </div>
          <button type="button" class="components-shell-page__detail-close" aria-label="Close details" @click="componentDetailOpen = false">
            <q-icon name="close" />
          </button>
        </q-card-section>

        <q-card-section class="components-shell-page__detail-body">
          <div class="components-shell-page__detail-meta">
            <div class="components-shell-page__detail-meta-label">ID</div>
            <div class="components-shell-page__detail-meta-value">{{ selectedComponentDetail?.id || '' }}</div>
          </div>

          <div class="components-shell-page__detail-meta">
            <div class="components-shell-page__detail-meta-label">Use</div>
            <div class="components-shell-page__detail-meta-copy">{{ selectedComponentDetail?.summary || '' }}</div>
          </div>

          <div class="components-shell-page__detail-meta">
            <div class="components-shell-page__detail-meta-label">Prompt</div>
            <textarea
              readonly
              class="components-shell-page__detail-prompt"
              :value="selectedComponentDetail?.prompt || ''"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import FilePageHeroDashboard from 'src/components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

const activeToolbarSection = ref('general')
const toolbarViewMode = ref('card')
const componentDetailOpen = ref(false)
const selectedComponentId = ref('page-title-crumb')

const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]

const toolbarItems = [
  { title: 'General', value: 'general' },
  { title: 'Tasks', value: 'tasks' },
  { title: 'Notes', value: 'notes' },
  { title: 'KDB', value: 'kdb', isKdb: true, pushRight: true },
  { title: 'System', value: 'system', isSystem: true },
]

const fileDashboardStats = [
  { label: 'Records', value: '128', caption: 'Tracked rows', tone: 'neutral' },
  { label: 'Updated', value: '12', caption: 'Changed today', tone: 'positive' },
  { label: 'Open', value: '7', caption: 'Items needing attention', tone: 'warning' },
  { label: 'Links', value: '93%', caption: 'KDB coverage', tone: 'positive' },
]

const fileDashboardHealth = [
  { tone: 'positive', width: 58 },
  { tone: 'warning', width: 24 },
  { tone: 'neutral', width: 18 },
]

const componentDetailsById = {
  'page-title-crumb': {
    id: 'cmp-page-title-crumb',
    title: 'Page Title / Crumb',
    summary: 'Use this for page headers that show the current area plus the main page title.',
    prompt: 'Render the Page Title / Crumb component from Components Shell with a breadcrumb row above a large page title, using the same typography and spacing as the canonical component.',
  },
  'page-back-symbol': {
    id: 'cmp-page-back-symbol',
    title: 'Page Back Symbol',
    summary: 'Use this for compact back navigation inside shell headers and detail surfaces.',
    prompt: 'Render the Page Back Symbol from Components Shell exactly, using the same circular neutral button treatment and arrow icon.',
  },
  'b10-logo': {
    id: 'cmp-b10-logo',
    title: 'B10 Logo',
    summary: 'Use this for compact brand badges or temporary logo placeholders.',
    prompt: 'Render the B10 Logo from Components Shell exactly as the compact black badge with the same title-font styling.',
  },
  'plus-icon': {
    id: 'cmp-plus-icon',
    title: 'Plus Icon',
    summary: 'Use this for isolated add actions where only the icon should show.',
    prompt: 'Render the Plus Icon component from Components Shell exactly, using the same electric-blue circular button with white plus icon.',
  },
  'plus-with-label': {
    id: 'cmp-plus-with-label',
    title: 'Plus With Label',
    summary: 'Use this for add actions that need icon plus text in one control.',
    prompt: 'Render the Plus With Label component from Components Shell exactly, using the same electric-blue button, white plus icon, and title-font label treatment.',
  },
  'b10-button': {
    id: 'cmp-b10-button',
    title: 'B10 Button',
    summary: 'Use this for canonical B10 primary and neutral action buttons.',
    prompt: 'Render the B10 Button component from Components Shell using the real shared B10Button variants rather than recreating local button styles.',
  },
  'b10-icon-button': {
    id: 'cmp-b10-icon-button',
    title: 'B10 Icon Button',
    summary: 'Use this for canonical icon-only actions that should come from the B10 button system.',
    prompt: 'Render the B10 Icon Button component from Components Shell using the shared B10IconButton component and its existing variants.',
  },
  'file-dashboard': {
    id: 'cmp-file-dashboard',
    title: 'File Dashboard',
    summary: 'Use this for file-level hero dashboards showing title, copy, stats, and health.',
    prompt: 'Render the File Dashboard component from Components Shell using the real FilePageHeroDashboard surface, preserving its hero, stats, and health structure.',
  },
  'file-toolbar': {
    id: 'cmp-file-toolbar',
    title: 'File Toolbar',
    summary: 'Use this for the top toolbar inside file pages with add, search, and view controls.',
    prompt: 'Render the File Toolbar component from Components Shell using the real FilePageToolbar component, keeping its existing add, search, and view-toggle layout.',
  },
  'l2-toolbar': {
    id: 'cmp-l2-toolbar',
    title: 'L2 Toolbar',
    summary: 'Use this for section switching across General, KDB, System, and similar level-2 groupings.',
    prompt: 'Render the L2 Toolbar component from Components Shell using the real ShellSectionToolbar component with the same compact section-chip treatment.',
  },
}

const selectedComponentDetail = computed(() => componentDetailsById[selectedComponentId.value] || null)

function openComponentDetail(componentId) {
  selectedComponentId.value = componentId
  componentDetailOpen.value = true
}
</script>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fill, 140px);
  grid-auto-rows: 140px;
  grid-auto-flow: dense;
  gap: 18px;
  justify-content: start;
  align-items: start;
}

.components-shell-page__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
}

.components-shell-page__inspect-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: rgba(15, 23, 42, 0.72);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  cursor: pointer;
}

.components-shell-page__card--sm {
  grid-column: span 1;
  grid-row: span 1;
}

.components-shell-page__card--md {
  grid-column: span 2;
  grid-row: span 1;
}

.components-shell-page__card--lg {
  grid-column: span 3;
  grid-row: span 2;
}

.components-shell-page__card--xl {
  grid-column: span 4;
  grid-row: span 3;
}

.components-shell-page__card--toolbar-wide {
  grid-column: span 5;
  grid-row: span 2;
}

.components-shell-page__card--dashboard {
  grid-column: span 6;
  grid-row: span 4;
}

.components-shell-page__card-label {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__card-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

.components-shell-page__card-stage--left {
  justify-content: flex-start;
}

.components-shell-page__card-stage--row {
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.components-shell-page__card-stage--stretch {
  align-items: stretch;
  justify-content: stretch;
}

.components-shell-page__crumb-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.components-shell-page__crumb-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.components-shell-page__crumb-link,
.components-shell-page__crumb-separator {
  color: rgba(15, 23, 42, 0.56);
  font-family: var(--font-body);
  font-size: 0.84rem;
  line-height: 1;
}

.components-shell-page__crumb-current,
.components-shell-page__page-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
}

.components-shell-page__crumb-current {
  font-size: 0.84rem;
  line-height: 1;
}

.components-shell-page__page-title {
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.08em;
  white-space: nowrap;
}

.components-shell-page__back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 6px;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.01em;
}

.components-shell-page__back-button span {
  font-family: var(--font-body);
}

.components-shell-page__back-button :deep(.q-icon) {
  font-size: 1em;
}

.components-shell-page__logo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  min-height: 28px;
  padding: 0 10px;
  color: #ffffff;
  background: #111111;
  border-radius: 999px;
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: 0.08em;
}

.components-shell-page__plus-icon-button,
.components-shell-page__plus-label-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
  cursor: pointer;
}

.components-shell-page__plus-icon-button {
  width: 36px;
  padding: 0;
}

.components-shell-page__plus-icon-button :deep(.q-icon),
.components-shell-page__plus-label-button :deep(.q-icon) {
  font-size: 16px;
}

.components-shell-page__plus-label-button span {
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: 0.01em;
}

.components-shell-page__detail-card {
  width: min(640px, calc(100vw - 32px));
  border-radius: 10px;
}

.components-shell-page__detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.components-shell-page__detail-eyebrow {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__detail-title {
  margin-top: 8px;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.35rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.components-shell-page__detail-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.components-shell-page__detail-body {
  display: grid;
  gap: 16px;
}

.components-shell-page__detail-meta {
  display: grid;
  gap: 8px;
}

.components-shell-page__detail-meta-label {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__detail-meta-value,
.components-shell-page__detail-meta-copy {
  color: #0f172a;
  font-family: var(--font-body);
  font-size: 0.94rem;
  line-height: 1.5;
}

.components-shell-page__detail-prompt {
  width: 100%;
  min-height: 124px;
  padding: 12px 14px;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 1.5;
  resize: vertical;
}

@media (max-width: 900px) {
  .components-shell-page__board {
    grid-template-columns: repeat(auto-fill, 110px);
    grid-auto-rows: 110px;
    gap: 14px;
  }

  .components-shell-page__card {
    padding: 14px;
  }

  .components-shell-page__card--lg,
  .components-shell-page__card--xl,
  .components-shell-page__card--toolbar-wide,
  .components-shell-page__card--dashboard {
    grid-column: span 3;
  }

  .components-shell-page__card--dashboard {
    grid-row: span 4;
  }
}
</style>
