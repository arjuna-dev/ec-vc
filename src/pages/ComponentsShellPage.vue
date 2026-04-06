<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__sections">
      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('basic')">
          <span class="components-shell-page__section-title">Basic Elements</span>
          <q-icon :name="isSectionOpen('basic') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('basic')" class="components-shell-page__board">
      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('b10-logo')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">B10 Logo</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('b10-logo')">{{ componentStatusLabel('b10-logo') }}</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__logo-shell">
            <div v-if="!logoReady" class="components-shell-page__logo-fallback">B10</div>
            <div
              ref="logoContainer"
              class="components-shell-page__logo-lottie"
              :class="{ 'components-shell-page__logo-lottie--hidden': !logoReady }"
            />
          </div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('b10-button')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">B10 Button</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('b10-button')">{{ componentStatusLabel('b10-button') }}</div>
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
        <div class="components-shell-page__card-status" :class="componentStatusClass('b10-icon-button')">{{ componentStatusLabel('b10-icon-button') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <B10IconButton icon="arrow_back" variant="neutral" aria-label="Back" />
          <B10IconButton icon="add" variant="primary" aria-label="Add" />
          <B10IconButton icon="tune" variant="subtle" aria-label="Settings" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('main-menu-icon')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Main Menu Icon</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('main-menu-icon')">{{ componentStatusLabel('main-menu-icon') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <q-btn flat dense round icon="menu" aria-label="Menu" class="components-shell-page__menu-icon-button" />
        </div>
      </article>
        </div>
      </section>

      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('navigation')">
          <span class="components-shell-page__section-title">Navigation Components</span>
          <q-icon :name="isSectionOpen('navigation') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('navigation')" class="components-shell-page__board">
      <BuildingBlockPreviewTile block-key="page-title-crumb">
        <template #actions>
          <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('page-title-crumb')">
            <q-icon name="visibility" />
          </button>
        </template>
      </BuildingBlockPreviewTile>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('page-back-symbol')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Page Back Symbol</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('page-back-symbol')">{{ componentStatusLabel('page-back-symbol') }}</div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__back-button" aria-label="Back">
            <q-icon name="west" />
            <span>Back</span>
          </button>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--toolbar-wide">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('main-menu-row')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Main Menu Row</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('main-menu-row')">{{ componentStatusLabel('main-menu-row') }}</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__nav-row">
            <span class="components-shell-page__nav-row-icon material-icons">folder_open</span>
            <span class="components-shell-page__nav-row-label">System Files</span>
          </div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--toolbar-wide">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('main-menu-subgroup-row')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Main Menu Subgroup Row</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('main-menu-subgroup-row')">{{ componentStatusLabel('main-menu-subgroup-row') }}</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__nav-subgroup">
            <div class="components-shell-page__nav-subgroup-title">Shells</div>
            <q-icon name="expand_less" size="18px" class="components-shell-page__nav-subgroup-chevron" />
          </div>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--live-link">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('live-action-l1')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Live Action L1</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('live-action-l1')">{{ componentStatusLabel('live-action-l1') }}</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__live-link-wrap">
            <span class="components-shell-page__live-link-label">Live Link</span>
            <div class="components-shell-page__live-link-value">Companies</div>
            <q-icon name="expand_more" class="components-shell-page__live-link-chevron" />
          </div>
        </div>
      </article>
      <article class="components-shell-page__card components-shell-page__card--lg">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('l2-toolbar')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">L2 Toolbar</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('l2-toolbar')">{{ componentStatusLabel('l2-toolbar') }}</div>
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
      <article class="components-shell-page__card components-shell-page__card--settings-menu">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('l2-settings-menu')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">L2 Settings Menu</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('l2-settings-menu')">{{ componentStatusLabel('l2-settings-menu') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <div class="components-shell-page__l2-settings-panel">
            <div class="components-shell-page__l2-settings-title">Hero Fields</div>
            <div class="components-shell-page__l2-settings-group">
              <button type="button" class="components-shell-page__l2-settings-heading">
                <span>General</span>
                <q-icon name="expand_less" size="14px" />
              </button>
              <label class="components-shell-page__l2-settings-row">
                <q-checkbox model-value dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" />
                <span class="components-shell-page__l2-settings-row-copy">
                  <span class="components-shell-page__l2-settings-row-label">Name</span>
                  <span class="components-shell-page__l2-settings-row-value">Shown</span>
                </span>
              </label>
              <label class="components-shell-page__l2-settings-row">
                <q-checkbox model-value dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" />
                <span class="components-shell-page__l2-settings-row-copy">
                  <span class="components-shell-page__l2-settings-row-label">Summary</span>
                  <span class="components-shell-page__l2-settings-row-value">Shown</span>
                </span>
              </label>
            </div>
            <div class="components-shell-page__l2-settings-group">
              <button type="button" class="components-shell-page__l2-settings-heading">
                <span>System</span>
                <q-icon name="expand_less" size="14px" />
              </button>
              <label class="components-shell-page__l2-settings-row">
                <q-checkbox model-value="false" dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" />
                <span class="components-shell-page__l2-settings-row-copy">
                  <span class="components-shell-page__l2-settings-row-label">Record ID</span>
                  <span class="components-shell-page__l2-settings-row-value">Hidden</span>
                </span>
              </label>
              <label class="components-shell-page__l2-settings-row">
                <q-checkbox model-value dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" />
                <span class="components-shell-page__l2-settings-row-copy">
                  <span class="components-shell-page__l2-settings-row-label">Updated At</span>
                  <span class="components-shell-page__l2-settings-row-value">Shown</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </article>
      <article class="components-shell-page__card components-shell-page__card--widget-settings">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('widget-settings-menu')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Widget Settings Menu</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('widget-settings-menu')">{{ componentStatusLabel('widget-settings-menu') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <div class="components-shell-page__widget-settings-panel">
            <div class="components-shell-page__widget-settings-header">
              <div class="components-shell-page__widget-settings-eyebrow">Widget</div>
              <div class="components-shell-page__widget-settings-title">Widget Settings</div>
              <div class="components-shell-page__widget-settings-caption">Show, hide and reorder files</div>
            </div>
            <div class="components-shell-page__widget-settings-list">
              <section class="components-shell-page__widget-settings-section">
                <button type="button" class="components-shell-page__widget-settings-toggle">
                  <span class="components-shell-page__widget-settings-section-title">Files</span>
                  <q-icon name="expand_less" size="16px" class="components-shell-page__widget-settings-section-chevron" />
                </button>
                <div class="components-shell-page__widget-settings-row">
                  <q-checkbox model-value dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" class="components-shell-page__widget-settings-checkbox" />
                  <div class="components-shell-page__widget-settings-row-label">Companies</div>
                  <div class="components-shell-page__widget-settings-row-actions">
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
                      <path d="M7 14L12 9L17 14" />
                    </svg>
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
                      <path d="M7 10L12 15L17 10" />
                    </svg>
                  </div>
                </div>
                <div class="components-shell-page__widget-settings-row">
                  <q-checkbox model-value dense size="xs" checked-icon="check_box" unchecked-icon="check_box_outline_blank" class="components-shell-page__widget-settings-checkbox" />
                  <div class="components-shell-page__widget-settings-row-label">Users</div>
                  <div class="components-shell-page__widget-settings-row-actions">
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
                      <path d="M7 14L12 9L17 14" />
                    </svg>
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
                      <path d="M7 10L12 15L17 10" />
                    </svg>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </article>
      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('toggle-row-icons')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Toggle / Row Icons</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('toggle-row-icons')">{{ componentStatusLabel('toggle-row-icons') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <button type="button" class="components-shell-page__toggle-inline">
            <span>General</span>
            <q-icon name="expand_more" />
          </button>
          <button type="button" class="components-shell-page__toggle-inline">
            <span>System</span>
            <q-icon name="chevron_right" />
          </button>
          <div class="components-shell-page__row-chevron-pair">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
              <path d="M7 14L12 9L17 14" />
            </svg>
            <svg viewBox="0 0 24 24" aria-hidden="true" class="components-shell-page__widget-settings-row-chevron">
              <path d="M7 10L12 15L17 10" />
            </svg>
          </div>
        </div>
      </article>
        </div>
      </section>

      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('dialog')">
          <span class="components-shell-page__section-title">Dialog Components</span>
          <q-icon :name="isSectionOpen('dialog') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('dialog')" class="components-shell-page__board">
      <BuildingBlockPreviewTile block-key="plus-icon">
        <template #actions>
          <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('plus-icon')">
            <q-icon name="visibility" />
          </button>
        </template>
      </BuildingBlockPreviewTile>

      <BuildingBlockPreviewTile block-key="plus-with-label">
        <template #actions>
          <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('plus-with-label')">
            <q-icon name="visibility" />
          </button>
        </template>
      </BuildingBlockPreviewTile>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('eye-icon')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Eye Icon</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('eye-icon')">{{ componentStatusLabel('eye-icon') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <EyeIconButton aria-label="View row" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--sm">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('edit-button')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Edit Button</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('edit-button')">{{ componentStatusLabel('edit-button') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--row">
          <q-btn flat dense round icon="edit" class="components-shell-page__edit-button" aria-label="Edit row" />
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--md">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('mini-scrollbar')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Mini Scrollbar</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('mini-scrollbar')">{{ componentStatusLabel('mini-scrollbar') }}</div>
        <div class="components-shell-page__card-stage">
          <div class="components-shell-page__scrollbar-sample">
            <div class="components-shell-page__scrollbar-sample-track">
              <div class="components-shell-page__scrollbar-sample-thumb" />
            </div>
          </div>
        </div>
      </article>
        </div>
      </section>

      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('file')">
          <span class="components-shell-page__section-title">File Components</span>
          <q-icon :name="isSectionOpen('file') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('file')" class="components-shell-page__board">
      <article class="components-shell-page__card components-shell-page__card--dashboard">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('home-dashboard')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">Home Dashboard</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('home-dashboard')">{{ componentStatusLabel('home-dashboard') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <HomeDashboardHero
            count="2.4k"
            text="records tracked across the workspace"
            :stats="homeDashboardStats"
            workspace-root-value="C:\\Workspace\\B10"
            :signals="homeDashboardSignals"
          />
        </div>
      </article>

      <BuildingBlockPreviewTile block-key="file-dashboard">
        <template #actions>
          <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('file-dashboard')">
            <q-icon name="visibility" />
          </button>
        </template>
      </BuildingBlockPreviewTile>

      <article class="components-shell-page__card components-shell-page__card--stat-box">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('l3-box')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">L3 Box</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('l3-box')">{{ componentStatusLabel('l3-box') }}</div>
        <div class="components-shell-page__card-stage components-shell-page__card-stage--stretch">
          <article class="components-shell-page__stat-box components-shell-page__stat-box--sparse">
            <div class="components-shell-page__stat-box-label">L3</div>
            <div class="components-shell-page__stat-box-value">128</div>
            <div class="components-shell-page__stat-box-caption">Canonical tokens</div>
          </article>
        </div>
      </article>

      <article class="components-shell-page__card components-shell-page__card--toolbar-wide">
        <button type="button" class="components-shell-page__inspect-btn" aria-label="View component details" @click="openComponentDetail('file-toolbar')">
          <q-icon name="visibility" />
        </button>
        <div class="components-shell-page__card-label">File Toolbar</div>
        <div class="components-shell-page__card-status" :class="componentStatusClass('file-toolbar')">{{ componentStatusLabel('file-toolbar') }}</div>
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
        </div>
      </section>

      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('record')">
          <span class="components-shell-page__section-title">Record Components</span>
          <q-icon :name="isSectionOpen('record') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('record')" class="components-shell-page__board"></div>
      </section>

      <section class="components-shell-page__section">
        <button type="button" class="components-shell-page__section-toggle" @click="toggleSection('shell')">
          <span class="components-shell-page__section-title">Shell Components</span>
          <q-icon :name="isSectionOpen('shell') ? 'expand_less' : 'expand_more'" size="18px" />
        </button>
        <div v-if="isSectionOpen('shell')" class="components-shell-page__board"></div>
      </section>
    </section>

  </q-page>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import lottie from 'lottie-web'
import HomeDashboardHero from 'src/components/HomeDashboardHero.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import BuildingBlockPreviewTile from 'src/components/BuildingBlockPreviewTile.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'
import EyeIconButton from 'src/components/buttons/EyeIconButton.vue'
import logoAnimationData from 'src/assets/lottie/animation-b10-firma.json'
import { BUILDING_BLOCK_DETAILS_BY_ID } from 'src/utils/buildingBlocks'

const activeToolbarSection = ref('general')
const toolbarViewMode = ref('card')
const openSections = ref({
  basic: true,
  navigation: true,
  dialog: true,
  file: true,
  record: true,
  shell: true,
})
const router = useRouter()
const logoContainer = ref(null)
const logoReady = ref(false)
let logoAnimation = null

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

const homeDashboardStats = [
  { label: 'Open tasks', value: '27' },
  { label: 'Recent adds (7d)', value: '41' },
  { label: 'Projects active', value: '12/16' },
]

const homeDashboardSignals = [
  { label: 'Companies', value: '412' },
  { label: 'Tasks', value: '183' },
  { label: 'Opportunities', value: '74' },
]

function componentStatusLabel(componentId) {
  return BUILDING_BLOCK_DETAILS_BY_ID[componentId]?.statusLabel || 'Unknown'
}

function componentStatusClass(componentId) {
  return BUILDING_BLOCK_DETAILS_BY_ID[componentId]?.status === 'canonical'
    ? 'components-shell-page__card-status--canonical'
    : 'components-shell-page__card-status--extract'
}

function isSectionOpen(sectionKey) {
  return Boolean(openSections.value[sectionKey])
}

function toggleSection(sectionKey) {
  openSections.value[sectionKey] = !openSections.value[sectionKey]
}

function openComponentDetail(componentId) {
  router.push({
    name: 'bb-shell',
    query: {
      block: componentId,
    },
  })
}

function initLogoAnimation() {
  if (!logoContainer.value) return
  logoReady.value = false

  logoAnimation?.destroy()
  logoAnimation = lottie.loadAnimation({
    container: logoContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: logoAnimationData,
    rendererSettings: {
      preserveAspectRatio: 'xMaxYMid meet',
    },
  })

  logoAnimation.addEventListener('DOMLoaded', () => {
    logoReady.value = true
  })
  logoAnimation.addEventListener('data_failed', () => {
    logoReady.value = false
  })
}

onMounted(() => {
  initLogoAnimation()
})

onBeforeUnmount(() => {
  logoAnimation?.destroy()
  logoAnimation = null
})
</script>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.components-shell-page__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.components-shell-page__section-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: fit-content;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.components-shell-page__section-title {
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  letter-spacing: -0.02em;
  line-height: 1;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fill, 40px);
  grid-auto-rows: 40px;
  grid-auto-flow: dense;
  gap: 16px;
  justify-content: start;
  align-items: start;
}

.components-shell-page__card {
  --components-card-cols: 4;
  --components-card-rows: 4;
  position: relative;
  display: flex;
  flex-direction: column;
  grid-column: span var(--components-card-cols);
  grid-row: span var(--components-card-rows);
  gap: 10px;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
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
  --components-card-cols: 4;
  --components-card-rows: 4;
}

.components-shell-page__card--md {
  --components-card-cols: 6;
  --components-card-rows: 4;
}

.components-shell-page__card--lg {
  --components-card-cols: 9;
  --components-card-rows: 6;
}

.components-shell-page__card--xl {
  --components-card-cols: 11;
  --components-card-rows: 8;
}

.components-shell-page__card--toolbar-wide {
  --components-card-cols: 14;
  --components-card-rows: 4;
}

.components-shell-page__card--dashboard {
  --components-card-cols: 16;
  --components-card-rows: 10;
}

.components-shell-page__card--stat-box {
  --components-card-cols: 6;
  --components-card-rows: 6;
}

.components-shell-page__card--live-link {
  --components-card-cols: 7;
  --components-card-rows: 4;
}

.components-shell-page__card--settings-menu {
  --components-card-cols: 8;
  --components-card-rows: 8;
}

.components-shell-page__card--widget-settings {
  --components-card-cols: 8;
  --components-card-rows: 8;
}

.components-shell-page__card--title-wide {
  --components-card-cols: 10;
  --components-card-rows: 5;
}

.components-shell-page__card-label {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.components-shell-page__card-status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 20px;
  padding: 0 8px;
  border: 1px solid transparent;
  font-family: var(--font-title);
  font-size: 0.58rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.components-shell-page__card-status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.components-shell-page__card-status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.18);
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
  width: 100%;
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
  min-width: 0;
  width: 100%;
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
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
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

.components-shell-page__menu-icon-button {
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 30px;
  color: #111111;
}

.components-shell-page__nav-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: min(280px, 100%);
  min-height: 34px;
  padding: 0 6px;
}

.components-shell-page__nav-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111111;
  font-size: 18px;
  line-height: 1;
}

.components-shell-page__nav-row-label {
  color: #111111;
  font-family: var(--font-body);
  font-size: 0.84rem;
  line-height: 1.2;
}

.components-shell-page__nav-subgroup {
  display: inline-grid;
  grid-template-columns: auto 18px;
  align-items: center;
  gap: 6px;
  min-height: 28px;
}

.components-shell-page__nav-subgroup-title {
  color: rgba(15, 23, 42, 0.74);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__nav-subgroup-chevron {
  color: rgba(15, 23, 42, 0.92);
}

.components-shell-page__logo-shell {
  width: 120px;
  height: 51px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.components-shell-page__logo-lottie {
  display: block;
  width: 120px;
  max-width: 100%;
  height: 51px;
}

.components-shell-page__logo-lottie--hidden {
  opacity: 0;
}

.components-shell-page__logo-lottie :deep(svg) {
  width: 100%;
  height: 100%;
}

.components-shell-page__logo-fallback {
  font-family: var(--font-body);
  font-size: var(--text-2xl---black);
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: -1px;
}

.components-shell-page__file-add-button {
  align-self: center;
  min-width: 36px;
  min-height: 36px;
  height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
  cursor: pointer;
}

.components-shell-page__file-add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.components-shell-page__file-add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #ffffff;
  background: #2647ff;
  border-radius: 999px;
}

.components-shell-page__file-add-button-plus :deep(.q-icon) {
  font-size: 16px;
}

.components-shell-page__file-add-button-plus--standalone {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
}

.components-shell-page__file-add-button-plus--standalone :deep(.q-icon) {
  font-size: 20px;
}

.components-shell-page__file-add-button-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: -0.02em;
}

.components-shell-page__stat-box {
  display: flex;
  min-height: 116px;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
}

.components-shell-page__stat-box-label {
  color: var(--ds-color-text-muted, rgba(17, 17, 17, 0.62));
  font-family: var(--ds-font-family-body, var(--font-body));
  font-size: var(--ds-font-size-xs-medium, 0.72rem);
  font-weight: var(--ds-font-weight-medium, 500);
  line-height: var(--ds-line-height-xs, 1);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.components-shell-page__stat-box-value {
  color: var(--ds-color-text-primary, #111111);
  font-family: var(--ds-font-family-title, var(--font-title));
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black, 900);
  line-height: 0.92;
}

.components-shell-page__stat-box-caption {
  color: var(--ds-color-text-secondary, rgba(17, 17, 17, 0.72));
  font-family: var(--ds-font-family-body, var(--font-body));
  font-size: var(--ds-font-size-sm-regular, 0.84rem);
  font-weight: var(--ds-font-weight-regular, 400);
  line-height: var(--ds-line-height-sm, 1.35);
}

.components-shell-page__live-link-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 18px;
  overflow: visible;
}

.components-shell-page__live-link-label {
  color: rgba(15, 23, 42, 0.72);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.components-shell-page__live-link-value {
  color: #fff;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  background: #000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
}

.components-shell-page__live-link-chevron {
  position: absolute;
  right: -4px;
  bottom: -2px;
  z-index: 2;
  color: #111111;
  font-size: 20px;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.18);
  cursor: pointer;
}

.components-shell-page__l2-settings-panel {
  width: min(280px, 100%);
  padding: 10px;
  background: rgba(248, 248, 246, 0.98);
  border: 1px solid rgba(17, 17, 17, 0.08);
  box-shadow: 0 16px 32px rgba(17, 17, 17, 0.12);
}

.components-shell-page__l2-settings-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.components-shell-page__l2-settings-group + .components-shell-page__l2-settings-group {
  margin-top: 10px;
}

.components-shell-page__l2-settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  text-align: left;
}

.components-shell-page__l2-settings-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 2px 4px;
}

.components-shell-page__l2-settings-row-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.components-shell-page__l2-settings-row-label {
  color: #111111;
  font-family: var(--font-body);
  font-size: 0.76rem;
  line-height: 1.15;
}

.components-shell-page__l2-settings-row-value {
  color: rgba(17, 17, 17, 0.56);
  font-family: var(--font-title);
  font-size: 0.62rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.05em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__widget-settings-panel {
  width: min(220px, 100%);
  padding: 10px;
  background: rgba(17, 17, 17, 0.96);
  border-radius: 18px;
}

.components-shell-page__widget-settings-header {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-bottom: 4px;
}

.components-shell-page__widget-settings-eyebrow {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.components-shell-page__widget-settings-title {
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.components-shell-page__widget-settings-caption {
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  line-height: 1.2;
}

.components-shell-page__widget-settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.components-shell-page__widget-settings-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.components-shell-page__widget-settings-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: fit-content;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.components-shell-page__widget-settings-section-title {
  color: rgba(255, 255, 255, 0.54);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__widget-settings-section-chevron {
  color: rgba(255, 255, 255, 0.94);
  line-height: 1;
}

.components-shell-page__widget-settings-row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 3px;
  padding: 4px 4px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.components-shell-page__widget-settings-checkbox {
  min-height: 16px;
}

.components-shell-page__widget-settings-row-label {
  min-width: 0;
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 0.64rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.components-shell-page__widget-settings-row-actions {
  display: grid;
  grid-template-columns: 14px 14px;
  align-items: center;
  gap: 0;
  justify-content: end;
  color: rgba(255, 255, 255, 0.42);
}

.components-shell-page__widget-settings-row-chevron {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 1.45;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.components-shell-page__edit-button {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  color: #2647ff;
}

.components-shell-page__edit-button :deep(.q-icon) {
  font-size: 14px;
}

.components-shell-page__scrollbar-sample {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(140px, 100%);
  height: 100%;
}

.components-shell-page__scrollbar-sample-track {
  position: relative;
  width: 3px;
  height: 74px;
  background: rgba(17, 17, 17, 0.14);
}

.components-shell-page__scrollbar-sample-thumb {
  position: absolute;
  top: 14px;
  left: 0;
  width: 3px;
  height: 22px;
  background: #111111;
}

.components-shell-page__toggle-inline {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  width: max-content;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.82rem;
}

.components-shell-page__row-chevron-pair {
  display: grid;
  grid-template-columns: 14px 14px;
  align-items: center;
  gap: 0;
  color: rgba(17, 17, 17, 0.58);
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

.components-shell-page__detail-status-row {
  display: flex;
  align-items: center;
}

.components-shell-page__detail-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border: 1px solid transparent;
  font-family: var(--font-title);
  font-size: 0.66rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__detail-status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.components-shell-page__detail-status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.16);
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
    grid-template-columns: repeat(auto-fill, 32px);
    grid-auto-rows: 32px;
    gap: 14px;
  }

  .components-shell-page__card {
    padding: 14px;
  }

  .components-shell-page__card--lg,
  .components-shell-page__card--xl,
  .components-shell-page__card--live-link,
  .components-shell-page__card--settings-menu,
  .components-shell-page__card--widget-settings,
  .components-shell-page__card--title-wide,
  .components-shell-page__card--toolbar-wide,
  .components-shell-page__card--dashboard {
    --components-card-cols: 9;
  }

  .components-shell-page__card--dashboard {
    --components-card-rows: 10;
  }

  .components-shell-page__card--settings-menu,
  .components-shell-page__card--widget-settings {
    --components-card-rows: 9;
  }

  .components-shell-page__card--title-wide,
  .components-shell-page__card--toolbar-wide {
    --components-card-rows: 5;
  }
}
</style>
