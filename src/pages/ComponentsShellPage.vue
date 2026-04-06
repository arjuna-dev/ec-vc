<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__board">
      <article class="components-shell-page__card components-shell-page__card--md">
        <div class="components-shell-page__card-label">Page Title / Crumb</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--left">
          <div class="components-shell-page__crumb-shell">
            <div class="components-shell-page__crumb-row">
              <span class="components-shell-page__crumb-link">Files</span>
              <span class="components-shell-page__crumb-separator">/</span>
              <span class="components-shell-page__crumb-current">Companies</span>
            </div>
            <div class="components-shell-page__page-title">Companies</div>
          </div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <div class="components-shell-page__card-label">Page Back Symbol</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__back-button" aria-label="Back">
            <q-icon name="arrow_back" />
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <div class="components-shell-page__card-label">B10 Logo</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__logo-badge">B10</div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <div class="components-shell-page__card-label">Plus Icon</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-icon-button" aria-label="Add">
            <q-icon name="add" />
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <div class="components-shell-page__card-label">Plus With Label</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-label-button">
            <q-icon name="add" />
            <span>Add</span>
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <div class="components-shell-page__card-label">B10 Button</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <B10Button label="Primary" variant="primary" />
          <B10Button label="Neutral" variant="neutral" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <div class="components-shell-page__card-label">B10 Icon Button</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <B10IconButton icon="arrow_back" variant="neutral" aria-label="Back" />
          <B10IconButton icon="add" variant="primary" aria-label="Add" />
          <B10IconButton icon="tune" variant="subtle" aria-label="Settings" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--xl">
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

      <article class="components-shell-page__card components-shell-page__card--xl">
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
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import FilePageHeroDashboard from 'src/components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

const activeToolbarSection = ref('general')
const toolbarViewMode = ref('card')

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
</script>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fill, 120px);
  grid-auto-rows: 120px;
  grid-auto-flow: dense;
  gap: 18px;
  justify-content: start;
  align-items: start;
}

.components-shell-page__card {
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
  font-size: 1.55rem;
  line-height: 0.94;
}

.components-shell-page__back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: #111111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  cursor: pointer;
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

@media (max-width: 900px) {
  .components-shell-page__board {
    grid-template-columns: repeat(auto-fill, 100px);
    grid-auto-rows: 100px;
    gap: 14px;
  }

  .components-shell-page__card {
    padding: 14px;
  }

  .components-shell-page__card--lg,
  .components-shell-page__card--xl {
    grid-column: span 3;
  }
}
</style>
