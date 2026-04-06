<template>
    <q-layout view="lHh Lpr lFf">
    <q-header :height-hint="108" class="ec-shell-header">
      <q-toolbar class="q-px-md ec-shell-toolbar">
        <div class="ec-shell-toolbar-heading">
          <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
          <div class="ec-shell-page-title">{{ currentHeaderTitle }}</div>
          <q-btn
            flat
            dense
            no-caps
            icon="west"
            label="Back"
            class="ec-shell-back-btn"
            @click="goBack"
          />
        </div>

        <div v-if="isSelectableShellRoute" class="ec-shell-toolbar-center">
          <div class="ec-shell-test-select-wrap">
            <span class="ec-shell-test-select__label">Live Link</span>
            <q-select
              ref="testShellSectionSelectRef"
              v-model="selectedShellSection"
              dense
              dark
              options-dark
              borderless
              hide-bottom-space
              emit-value
              map-options
              hide-dropdown-icon
              :options="shellSectionOptions"
              popup-content-class="ec-shell-test-select-menu"
              class="ec-shell-test-select"
            >
              <template #selected-item="scope">
                <span class="ec-shell-test-select__value">{{ scope.opt.label }}</span>
              </template>
              <template #option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  class="ec-shell-test-select-menu__item"
                >
                  <q-item-section>
                    <span class="ec-shell-test-select-menu__value">{{ scope.opt.label }}</span>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-icon
              name="expand_more"
              class="ec-shell-test-select__chevron"
              @click.stop="openShellSectionMenu"
            />
          </div>
        </div>
        <div v-else-if="isFileDialogShellRoute || isDialogShellRoute || isForkShellRoute" class="ec-shell-toolbar-center">
          <button
            type="button"
            class="ec-shell-dialog-open-btn"
            @click="reopenActiveRouteShellFromHeader"
          >
            {{ isForkShellRoute ? 'Open Fork' : isFileDialogShellRoute ? 'Open File Dialog' : 'Open Dialog' }}
          </button>
        </div>

        <q-toolbar-title class="ec-shell-toolbar-title">
          <div v-if="toolbarActions.length" class="ec-shell-toolbar-actions">
            <template v-for="action in toolbarActions" :key="action.id">
              <div v-if="action.kind === 'text'" class="ec-shell-toolbar-status">
                {{ action.label }}
              </div>
              <q-btn
                v-else
                dense
                flat
                round
                class="ec-shell-toolbar-action-btn"
                :icon="action.icon"
                :disable="resolveBreadcrumbActionDisabled(action)"
                @click="action.onClick?.()"
              >
                <q-tooltip>{{ action.label }}</q-tooltip>
              </q-btn>
            </template>
          </div>
          <div class="ec-shell-brand-box">
            <div v-if="!logoReady" class="ec-shell-toolbar-fallback">B10</div>
            <div
              ref="logoContainer"
              class="ec-shell-toolbar-lottie"
              :class="{ 'ec-shell-toolbar-lottie--hidden': !logoReady }"
            />
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      behavior="desktop"
      :overlay="false"
    >
      <div class="ec-drawer-content">
        <div class="ec-drawer-scroll">
          <q-list
            v-for="section in drawerNavigationSections"
            :key="section.key"
            class="ec-drawer-section"
          >
            <q-item
              clickable
              dense
              class="ec-drawer-section__toggle"
              @click="toggleDrawerSection(section.key)"
            >
              <q-item-section>
                <q-item-label
                  header
                  class="ec-nav-label"
                  :class="section.labelClass"
                >{{ section.label }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :name="isDrawerSectionOpen(section.key) ? 'expand_less' : 'expand_more'"
                  size="18px"
                />
              </q-item-section>
            </q-item>

            <template v-if="isDrawerSectionOpen(section.key)">
              <template v-for="item in section.items" :key="item.label">
              <template v-if="!item.parentKey || isDrawerSectionOpen(item.parentKey)">
              <q-item
                v-if="item.kind === 'toggle'"
                clickable
                dense
                class="ec-nav-item"
                :class="item.itemClass"
                @click="toggleDrawerSection(item.toggleKey)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="item.icon"
                    :size="item.iconSize || '24px'"
                    :class="item.iconClass"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    :name="isDrawerSectionOpen(item.toggleKey) ? 'expand_less' : 'expand_more'"
                    size="18px"
                  />
                </q-item-section>
              </q-item>
              <q-item
                v-else-if="item.kind === 'subheader'"
                dense
                class="ec-nav-subheader"
                :class="item.itemClass"
              >
                <q-item-section>
                  <q-item-label class="ec-nav-label" :class="item.labelClass">{{ item.label }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                v-else
                clickable
                :to="item.to"
                :exact="item.exact"
                class="ec-nav-item"
                :class="item.itemClass"
                @click="handleDrawerItemClick(item)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="item.icon"
                    :size="item.iconSize || '24px'"
                    :class="item.iconClass"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.label }}</q-item-label>
                </q-item-section>
              </q-item>
              </template>
              </template>
            </template>
          </q-list>
        </div>

        <div class="ec-drawer-footer">
          <div class="ec-drawer-footer__text">App version: MTK v0.0.1</div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div
      v-if="intakeDraftCount > 0 && !draftTrayDismissed"
      class="ec-intake-drafts"
    >
      <div class="ec-intake-drafts__header">
        <div>
          <div class="ec-intake-drafts__eyebrow">Draft Files</div>
          <div class="ec-intake-drafts__title">{{ intakeDraftCount }} active</div>
        </div>
        <q-btn
          flat
          dense
          round
          icon="close"
          aria-label="Hide draft files"
          @click="draftTrayDismissed = true"
        />
      </div>

      <div class="ec-intake-drafts__list">
        <div
          v-for="draft in intakeDrafts"
          :key="draft.id"
          class="ec-intake-drafts__item"
        >
          <div class="ec-intake-drafts__item-copy">
            <div class="ec-intake-drafts__item-title">{{ draftPrimaryLabel(draft) }}</div>
            <div class="ec-intake-drafts__item-meta">
              {{ draft.stage || 'Draft' }} • {{ draft.droppedFiles?.length || 0 }} files
            </div>
            <div v-if="draftSecondaryLabel(draft)" class="ec-intake-drafts__item-subtitle">
              {{ draftSecondaryLabel(draft) }}
            </div>
          </div>

          <div class="ec-intake-drafts__item-actions">
            <q-btn flat dense no-caps label="Resume" @click="resumeDraft(draft.id)" />
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              aria-label="Discard draft"
              @click="discardDraft(draft.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="ec-quick-widget" :style="quickWidgetStyle">
      <div
        v-for="(action, index) in quickWidgetRingActions"
        :key="action.id"
        class="ec-quick-widget-action"
        :style="quickWidgetActionStyle(index)"
      >
        <q-btn
          round
          dense
          unelevated
          :ref="action.id === 'settings' ? setQuickWidgetSettingsTarget : undefined"
          :class="[
            'ec-quick-widget-action-button',
            { 'ec-quick-widget-action-button--settings': action.id === 'settings' },
          ]"
          :icon="action.icon"
          :aria-label="action.label"
          @click.stop="action.onClick($event)"
        />
        <div class="ec-quick-widget-action-label">{{ action.label }}</div>
      </div>

      <q-menu
        v-model="quickWidgetSettingsOpen"
        :target="quickWidgetSettingsTarget"
        :offset="[quickWidgetSettingsOffset.x, quickWidgetSettingsOffset.y]"
        no-parent-event
        anchor="top right"
        self="top left"
        class="ec-quick-widget-settings-menu"
      >
        <div class="ec-quick-widget-settings-window">
          <div class="ec-quick-widget-settings-panel">
            <div
              class="ec-quick-widget-settings-panel__header"
              :class="{ 'ec-quick-widget-settings-panel__header--dragging': quickWidgetSettingsIsDragging }"
              @pointerdown.stop="onQuickWidgetSettingsPointerDown"
            >
              <div class="ec-quick-widget-settings-panel__title">Widget Settings</div>
              <div class="ec-quick-widget-settings-panel__caption">
                Show, hide and reorder files
              </div>
            </div>

            <div class="ec-quick-widget-settings-panel__list">
              <section
                v-for="settingsSection in quickWidgetSettingsSections"
                :key="settingsSection.id"
                class="ec-quick-widget-settings-section"
              >
                <button
                  type="button"
                  class="ec-quick-widget-settings-section__toggle"
                  @click="toggleQuickWidgetSettingsSection(settingsSection.id)"
                >
                  <span class="ec-quick-widget-settings-section__title">{{ settingsSection.label }}</span>
                  <q-icon
                    :name="isQuickWidgetSettingsSectionOpen(settingsSection.id) ? 'expand_less' : 'expand_more'"
                    size="16px"
                    class="ec-quick-widget-settings-section__chevron"
                  />
                </button>

                <template v-if="isQuickWidgetSettingsSectionOpen(settingsSection.id)">
                  <div
                    v-for="settingsAction in settingsSection.actions"
                    :key="settingsAction.id"
                    class="ec-quick-widget-settings-row"
                  >
                    <q-checkbox
                      :model-value="isQuickWidgetActionEnabled(settingsAction.id)"
                      dense
                      size="xs"
                      checked-icon="check_box"
                      unchecked-icon="check_box_outline_blank"
                      class="ec-quick-widget-settings-row__checkbox"
                      @update:model-value="setQuickWidgetActionEnabled(settingsAction.id, $event)"
                    />

                    <div class="ec-quick-widget-settings-row__copy">
                      <div class="ec-quick-widget-settings-row__label">{{ settingsAction.label }}</div>
                    </div>

                    <div class="ec-quick-widget-settings-row__actions">
                      <q-btn
                        flat
                        dense
                        round
                        :disable="settingsAction.orderIndex === 0"
                        @click.stop="moveQuickWidgetAction(settingsAction.id, -1)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" class="ec-quick-widget-settings-row__chevron">
                          <path d="M7 14L12 9L17 14" />
                        </svg>
                      </q-btn>
                      <q-btn
                        flat
                        dense
                        round
                        :disable="settingsAction.orderIndex === quickWidgetSettingsActionCount - 1"
                        @click.stop="moveQuickWidgetAction(settingsAction.id, 1)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" class="ec-quick-widget-settings-row__chevron">
                          <path d="M7 10L12 15L17 10" />
                        </svg>
                      </q-btn>
                    </div>
                  </div>
                </template>
              </section>
            </div>
          </div>
        </div>
      </q-menu>

      <div
        v-for="(action, index) in quickOpportunityBranchActions"
        :key="action.id"
        class="ec-quick-widget-action ec-quick-widget-action--branch"
        :style="quickOpportunityBranchActionStyle(index)"
      >
        <q-btn
          round
          dense
          unelevated
          class="ec-quick-widget-action-button ec-quick-widget-action-button--branch"
          :icon="action.icon"
          :aria-label="action.label"
          @click.stop="action.onClick"
        />
        <div class="ec-quick-widget-action-label">{{ action.label }}</div>
      </div>

      <q-btn
        round
        unelevated
        class="ec-quick-widget-trigger"
        :class="{ 'ec-quick-widget-trigger--dragging': quickWidgetIsDragging }"
        aria-label="Quick actions"
        @pointerdown.stop="onQuickWidgetPointerDown"
        @click.stop="toggleQuickActions"
      >
        <div ref="quickWidgetIconContainer" class="ec-quick-widget-icon" />
      </q-btn>
    </div>
    <q-dialog v-model="intakeQueueDialogOpen" persistent>
      <q-card style="width: 560px; max-width: 94vw">
        <q-card-section class="q-px-lg q-pt-lg q-pb-sm">
          <div class="text-h6">{{ intakeQueueDialogTitle }}</div>
          <div class="text-caption text-grey-7">{{ intakeQueueDialogCaption }}</div>
        </q-card-section>

        <q-card-section v-if="activeIntakeQueueItem?.kind === 'field-review'" class="q-px-lg q-pb-md">
          <div class="column q-gutter-md">
            <div
              v-for="field in intakeQueueEditableFields"
              :key="field.key"
              class="ec-intake-queue-field"
            >
              <div class="ec-intake-queue-field__meta">
                <div class="ec-intake-queue-field__label">{{ field.label }}</div>
                <div class="ec-intake-queue-field__caption">{{ field.owner }} to {{ field.target }}</div>
              </div>
              <q-input
                v-model="intakeQueueFieldEdits[field.key]"
                outlined
                autogrow
                :label="field.label"
              />
              <div class="row justify-end q-gutter-sm">
                <q-btn
                  flat
                  no-caps
                  label="Skip Field"
                  @click="dismissActiveIntakeField(field.key)"
                />
                <q-btn
                  color="primary"
                  no-caps
                  label="Verify Field"
                  @click="confirmActiveIntakeField(field.key)"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-lg q-py-md">
          <q-btn
            v-if="activeIntakeQueueItem?.kind === 'field-review'"
            flat
            no-caps
            label="Skip Bundle"
            @click="dismissActiveIntakeFieldBundle"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ArtifactAddDialog v-model="artifactDialogOpen" />
  </q-layout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lottie from 'lottie-web'
import logoAnimationData from 'src/assets/lottie/animation-b10-firma.json'
import widgetBackAnimationData from 'src/assets/lottie/widget-back.json'
import widgetOpenAnimationData from 'src/assets/lottie/widget-open.json'
import widgetToAnimationData from 'src/assets/lottie/widget-to.json'

import ArtifactAddDialog from 'components/ArtifactAddDialog.vue'
import {
  removeIntakeDraft,
  setActiveIntakeDraft,
  updateIntakeDraft,
  useIntakeDraftState,
} from 'src/utils/intakeDraftState'
import { useBreadcrumbActionsState } from 'src/utils/breadcrumbActionsState'
import { RECORD_VIEW_ROUTE_NAME } from 'src/utils/recordViewNavigation'
import {
  getCreateBranchEntry,
  getCreateBranches,
  getFilePageRegistryEntry,
  TEST_SHELL_SECTION_OPTIONS,
  validateLevel1BootstrapContracts,
  WORKSPACE_FILE_NAV_ITEMS,
} from 'src/utils/structureRegistry'
import {
  activateNextIntakeReviewItem,
  dismissIntakeReviewItem,
  resolveIntakeReviewItem,
  useIntakeReviewQueueState,
} from 'src/utils/intakeReviewQueueState'
import { setPendingAddEditShellRequest } from 'src/utils/addEditShellState'

const leftDrawerOpen = ref(false)
const quickActionsOpen = ref(false)
const quickOpportunityBranchOpen = ref(false)
const artifactDialogOpen = ref(false)
const auditUserLabel = ref('')
const logoContainer = ref(null)
const logoReady = ref(false)
const quickWidgetIconContainer = ref(null)
const quickWidgetPosition = ref({ x: 0, y: 0 })
const quickWidgetIsDragging = ref(false)
const quickWidgetIgnoreNextToggle = ref(false)
const quickWidgetSettingsOpen = ref(false)
const quickWidgetSettingsOffset = ref({ x: 40, y: 0 })
const quickWidgetSettingsIsDragging = ref(false)
const quickWidgetSettingsTarget = ref(null)
const quickWidgetSettingsSectionOpen = ref({
  files: true,
  'knowledge-dbs': true,
})
const draftTrayDismissed = ref(false)
const intakeQueueDialogOpen = ref(false)
const intakeQueueFieldEdits = ref({})
const testShellSectionSelectRef = ref(null)
const drawerSectionOpen = ref({
  main: true,
  radars: true,
  workspace: true,
  'knowledge-dbs': false,
  'test-shells': false,
})

const QUICK_WIDGET_TRIGGER_SIZE = 112
const QUICK_WIDGET_ACTION_RADIUS = 84
const QUICK_WIDGET_BRANCH_RADIUS = 88
const QUICK_WIDGET_ACTION_SIZE = 40
const QUICK_WIDGET_ACTION_HOVER_SCALE = 1.08
const QUICK_WIDGET_MARGIN = 16
const QUICK_WIDGET_POSITION_STORAGE_KEY = 'ecvc.quickWidgetPosition'
const QUICK_WIDGET_ACTION_SETTINGS_STORAGE_KEY = 'ecvc.quickWidgetActionSettings'
const DEFAULT_QUICK_WIDGET_ACTION_ORDER = [
  'users',
  'artifact',
  'contact',
  'company',
  'opportunity',
  'project',
  'note',
  'task',
  'industries',
  'securities',
  'artifacts-processed',
  'settings',
]
const mainNavigationItems = [
  { label: 'Home', to: '/', exact: true, icon: 'home' },
  { label: 'Owner', to: '/user-settings', exact: true, icon: 'accessibility_new' },
  { label: 'Companion', to: '/avatar', exact: true, icon: 'smart_toy' },
].map((item) => ({
  ...item,
  itemClass: 'ec-nav-item--primary',
  iconSize: '22px',
}))
const workspaceFileNavItems = WORKSPACE_FILE_NAV_ITEMS.filter((item) => item.to !== '/roles' && item.to !== '/companion-roles')
const companiesNavIndex = workspaceFileNavItems.findIndex((item) => item.to === '/companies')

if (companiesNavIndex >= 0) {
  workspaceFileNavItems.splice(companiesNavIndex + 1, 0, {
    label: 'Opportunities',
    to: '/opportunities',
    exact: true,
    icon: 'work',
  })
} else {
  workspaceFileNavItems.push({ label: 'Opportunities', to: '/opportunities', exact: true, icon: 'work' })
}

const workspaceNavigationItems = [
  ...workspaceFileNavItems,
  {
    label: 'User Roles',
    to: '/roles',
    exact: true,
    icon: 'theater_comedy',
    parentKey: 'knowledge-dbs',
    itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  },
  {
    label: 'Companion Roles',
    to: '/companion-roles',
    exact: true,
    icon: 'smart_toy',
    parentKey: 'knowledge-dbs',
    itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  },
  {
    label: 'Markets',
    to: '/industries',
    exact: true,
    icon: 'category',
    parentKey: 'knowledge-dbs',
    itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  },
  {
    label: 'Securities',
    to: '/securities',
    exact: true,
    icon: 'receipt_long',
    parentKey: 'knowledge-dbs',
    itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  },
  {
    label: 'Ingestion',
    to: '/artifacts-processed',
    exact: true,
    icon: 'hub',
    parentKey: 'knowledge-dbs',
    itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  },
  { label: 'System Files', to: '/file-system', exact: true, icon: 'folder_open' },
].map((item) => ({
  ...item,
  itemClass: item.itemClass || 'ec-nav-item--secondary ec-nav-item--workspace-child',
  iconSize: item.iconSize || '18px',
}))
const testShellNavigationItems = [
  { label: 'File Shell', to: '/test-shell', exact: true, icon: 'science' },
  { label: 'Record Shell', to: '/record-shell', exact: true, icon: 'album' },
  { label: 'Add/Edit File Shell', to: '/file-dialog-shell', exact: true, icon: 'web_asset' },
  { label: 'Add/Edit Record Shell', to: '/dialog-shell', exact: true, icon: 'web_asset' },
  { label: 'Ingestion Shell', to: '/ingestion-shell', exact: true, icon: 'hourglass_top' },
  { label: 'Fork Shell', to: '/fork-shell', exact: true, icon: 'call_split' },
].map((item) => ({
  ...item,
  itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  iconSize: '18px',
}))
const routeLabelByName = {
  home: 'Home',
  companies: 'Companies',
  contacts: 'Contacts',
  users: 'Users',
  opportunities: 'Opportunities',
  funds: 'Funds',
  rounds: 'Rounds',
  projects: 'Projects',
  artifacts: 'Artifacts',
  industries: 'Markets',
  notes: 'Notes',
  securities: 'Securities',
  'artifacts-processed': 'Ingestion',
  tasks: 'Tasks',
  'test-shell': 'File Shell',
  'record-shell': 'Record Shell',
  'fork-shell': 'Fork Shell',
  'file-dialog-shell': 'Add/Edit File Shell',
  'dialog-shell': 'Add/Edit Record Shell',
  'ingestion-shell': 'Ingestion Shell',
  roles: 'User Roles',
  'companion-roles': 'Companion Roles',
  avatar: 'Companion',
  'user-settings': 'Owner',
  pipelines: 'Projects',
  'file-system': 'System Files',
  [RECORD_VIEW_ROUTE_NAME]: 'Record View',
}
const router = useRouter()
const route = useRoute()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const intakeDraftState = useIntakeDraftState()
const intakeReviewQueueState = useIntakeReviewQueueState()
const breadcrumbActionsState = useBreadcrumbActionsState()
let logoAnimation = null
let quickWidgetIconAnimation = null
let quickWidgetDragState = null
let quickWidgetSettingsDragState = null
const intakeDraftCount = computed(() => intakeDraftState.draftOrder.length)
const intakeDrafts = computed(() =>
  intakeDraftState.draftOrder.map((draftId) => intakeDraftState.drafts[draftId]).filter(Boolean),
)
const activeIntakeQueueItem = computed(() => {
  const activeId = String(intakeReviewQueueState.activeItemId || '').trim()
  return intakeReviewQueueState.items.find((item) => String(item?.id || '').trim() === activeId) || null
})
const intakeQueueDialogTitle = computed(
  () => activeIntakeQueueItem.value?.payload?.title || 'Review extracted data',
)
const intakeQueueDialogCaption = computed(() => {
  return 'The intake flow surfaced new values. Verify them as they arrive.'
})
const intakeQueueEditableFields = computed(() =>
  Array.isArray(activeIntakeQueueItem.value?.payload?.fields)
    ? activeIntakeQueueItem.value.payload.fields
    : [],
)
let intakeQueueNextTimer = null
let pendingEntityDialogAdvance = false

const drawerNavigationSections = computed(() => [
  {
    label: 'My Workspace',
    key: 'main',
    items: [
      ...mainNavigationItems,
      {
        kind: 'toggle',
        label: 'Files',
        itemClass: 'ec-nav-item--primary ec-nav-item--workspace-toggle',
        icon: 'folder',
        iconSize: '22px',
        toggleKey: 'workspace',
      },
      ...workspaceNavigationItems
        .filter((item) => item.parentKey !== 'knowledge-dbs')
        .map((item) => ({
          ...item,
          parentKey: 'workspace',
        })),
      {
        kind: 'toggle',
        label: 'Knowledge DBs',
        itemClass: 'ec-nav-item--primary ec-nav-item--workspace-toggle',
        icon: 'folder',
        iconSize: '22px',
        toggleKey: 'knowledge-dbs',
      },
      ...workspaceNavigationItems
        .filter((item) => item.parentKey === 'knowledge-dbs')
        .map((item) => ({
          ...item,
          parentKey: 'knowledge-dbs',
        })),
      {
        kind: 'toggle',
        label: 'Test Shells',
        itemClass: 'ec-nav-item--primary ec-nav-item--workspace-toggle',
        icon: 'egg',
        iconSize: '22px',
        toggleKey: 'test-shells',
      },
      ...testShellNavigationItems.map((item) => ({
        ...item,
        parentKey: 'test-shells',
      })),
    ],
  },
])

const currentHeaderTitle = computed(() => {
  const currentRouteName = String(route.name || '')

  if (!currentRouteName || currentRouteName === 'home') {
    return 'Home'
  }

  if (currentRouteName === RECORD_VIEW_ROUTE_NAME) {
    const recordLabelByTableName = {
      contacts: 'Contact Records',
      companies: 'Company Records',
      users: 'User Records',
      artifacts: 'Artifact Records',
      notes: 'Note Records',
      tasks: 'Task Records',
      projects: 'Project Records',
      funds: 'Fund Records',
      rounds: 'Round Records',
      opportunities: 'Opportunity Records',
    }
    const tableName = String(route.params.tableName || '').toLowerCase()
    if (recordLabelByTableName[tableName]) {
      return recordLabelByTableName[tableName]
    }
    return 'Record View'
  }

  return routeLabelByName[currentRouteName] || toTitleCase(currentRouteName.replace(/[-_]/g, ' '))
})
const breadcrumbActions = computed(() => breadcrumbActionsState.actions || [])
const toolbarActions = computed(() => {
  if (String(route.name || '') === 'home') {
    return breadcrumbActions.value
  }

  return []
})
const isSelectableShellRoute = computed(() => ['test-shell', 'record-shell'].includes(String(route.name || '')))
const isFileDialogShellRoute = computed(() => String(route.name || '') === 'file-dialog-shell')
const isDialogShellRoute = computed(() => String(route.name || '') === 'dialog-shell')
const isForkShellRoute = computed(() => String(route.name || '') === 'fork-shell')
const shellSectionOptions = TEST_SHELL_SECTION_OPTIONS
const selectedShellSection = computed({
  get() {
    const current = String(route.query.section || '').trim().toLowerCase()
    return shellSectionOptions.some((option) => option.value === current) ? current : 'tasks'
  },
  set(value) {
    const nextValue = String(value || '').trim().toLowerCase()
    const normalizedValue = shellSectionOptions.some((option) => option.value === nextValue) ? nextValue : 'tasks'
    router.replace({
      query: {
        ...route.query,
        section: normalizedValue,
      },
    })
  },
})

function openShellSectionMenu() {
  const select = testShellSectionSelectRef.value
  if (!select) return
  if (typeof select.showPopup === 'function') {
    select.showPopup()
    return
  }
  if (typeof select.focus === 'function') {
    select.focus()
  }
}

function reopenActiveRouteShellFromHeader() {
  if (typeof window === 'undefined') return
  if (isForkShellRoute.value) {
    window.dispatchEvent(new CustomEvent('ecvc:reopen-fork-shell'))
    return
  }
  if (isFileDialogShellRoute.value) {
    window.dispatchEvent(new CustomEvent('ecvc:reopen-file-dialog-shell'))
    return
  }
  window.dispatchEvent(new CustomEvent('ecvc:reopen-dialog-shell'))
}

const quickWidgetStyle = computed(() => ({
  left: `${quickWidgetPosition.value.x}px`,
  top: `${quickWidgetPosition.value.y}px`,
}))

const quickWidgetActionSettings = ref({
  order: [...DEFAULT_QUICK_WIDGET_ACTION_ORDER],
  enabled: Object.fromEntries(DEFAULT_QUICK_WIDGET_ACTION_ORDER.map((id) => [id, true])),
})

const quickWidgetActionCatalog = computed(() => {
  const actionById = {
    users: {
      id: 'users',
      label: 'Users',
      group: 'files',
      icon: 'badge',
      onClick: openUserFromQuickAction,
    },
    opportunity: {
      id: 'opportunity',
      label: 'Opportunities',
      group: 'files',
      icon: 'work',
      onClick: () => openShellCreateFromQuickAction('opportunities'),
    },
    contact: {
      id: 'contact',
      label: 'Contact',
      group: 'files',
      icon: 'people',
      onClick: openContactFromQuickAction,
    },
    company: {
      id: 'company',
      label: 'Company',
      group: 'files',
      icon: 'apartment',
      onClick: openCompanyFromQuickAction,
    },
    project: {
      id: 'project',
      label: 'Project',
      group: 'files',
      icon: 'schema',
      onClick: openProjectFromQuickAction,
    },
    note: {
      id: 'note',
      label: 'Note',
      group: 'files',
      icon: 'note',
      onClick: openNoteFromQuickAction,
    },
    task: {
      id: 'task',
      label: 'Task',
      group: 'files',
      icon: 'check_circle',
      onClick: openTaskFromQuickAction,
    },
    artifact: {
      id: 'artifact',
      label: intakeDraftCount.value > 0 ? `Artifact (${intakeDraftCount.value})` : 'Artifact',
      group: 'files',
      icon: 'attach_file',
      onClick: openArtifactFromQuickAction,
    },
    industries: {
      id: 'industries',
      label: 'Markets',
      group: 'knowledge-dbs',
      icon: 'category',
      onClick: () => openShellCreateFromQuickAction('industries'),
    },
    securities: {
      id: 'securities',
      label: 'Securities',
      group: 'knowledge-dbs',
      icon: 'receipt_long',
      onClick: () => openShellCreateFromQuickAction('securities'),
    },
    'artifacts-processed': {
      id: 'artifacts-processed',
      label: 'Ingestion',
      group: 'knowledge-dbs',
      icon: 'hub',
      onClick: () => openShellCreateFromQuickAction('artifacts-processed'),
    },
    settings: {
      id: 'settings',
      label: 'Settings',
      group: 'system',
      icon: 'tune',
      onClick: () => {
        quickWidgetSettingsOpen.value = true
      },
    },
  }

  const configuredOrder = Array.isArray(quickWidgetActionSettings.value?.order)
    ? quickWidgetActionSettings.value.order
    : []
  const order = [
    ...configuredOrder.filter((id) => actionById[id]),
    ...DEFAULT_QUICK_WIDGET_ACTION_ORDER.filter((id) => !configuredOrder.includes(id)),
  ]

  return order.map((id) => actionById[id]).filter(Boolean)
})

const quickWidgetSettingsActions = computed(() =>
  quickWidgetActionCatalog.value
    .filter((action) => action.id !== 'settings')
    .map((action, orderIndex) => ({ ...action, orderIndex })),
)

const quickWidgetSettingsActionCount = computed(() => quickWidgetSettingsActions.value.length)

const quickWidgetSettingsSections = computed(() => {
  const sectionDefs = [
    { id: 'files', label: 'Files' },
    { id: 'knowledge-dbs', label: 'Knowledge DBs' },
  ]

  return sectionDefs
    .map((section) => ({
      ...section,
      actions: quickWidgetSettingsActions.value.filter((action) => action.group === section.id),
    }))
    .filter((section) => section.actions.length)
})

const quickWidgetActions = computed(() =>
  quickWidgetActionCatalog.value.filter((action) => isQuickWidgetActionEnabled(action.id)),
)

const quickWidgetRingActions = computed(() =>
  quickWidgetActions.value.map((action) =>
    action.id === 'settings'
      ? {
          ...action,
          onClick: (evt) => {
            setQuickWidgetSettingsTarget(evt?.currentTarget ?? evt?.target ?? null)
            quickWidgetSettingsOpen.value = !quickWidgetSettingsOpen.value
          },
        }
      : action,
  ),
)

const quickOpportunityBranchActions = computed(() => [
  {
    id: 'fund',
    label: 'Fund',
    icon: 'account_balance_wallet',
    onClick: openFundFromQuickAction,
  },
  {
    id: 'round',
    label: 'Round',
    icon: 'donut_large',
    onClick: openRoundFromQuickAction,
  },
])

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function isDrawerSectionOpen(sectionKey) {
  return drawerSectionOpen.value[sectionKey] !== false
}

function toggleDrawerSection(sectionKey) {
  drawerSectionOpen.value = {
    ...drawerSectionOpen.value,
    [sectionKey]: !isDrawerSectionOpen(sectionKey),
  }
}

function normalizeUserLabel(value) {
  return String(value || '').trim()
}

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

async function loadAuditUserLabel() {
  if (!bridge.value?.audit?.me) {
    auditUserLabel.value = ''
    return
  }
  try {
    const result = await bridge.value.audit.me()
    auditUserLabel.value = normalizeUserLabel(result?.user_label)
  } catch {
    auditUserLabel.value = ''
  }
}

async function syncUserNavState() {
  await loadAuditUserLabel()
}

function openArtifactDialog() {
  draftTrayDismissed.value = false
  artifactDialogOpen.value = true
}

function clearIntakeQueueNextTimer() {
  if (!intakeQueueNextTimer) return
  clearTimeout(intakeQueueNextTimer)
  intakeQueueNextTimer = null
}

function scheduleNextIntakeQueueItem() {
  clearIntakeQueueNextTimer()
  intakeQueueNextTimer = setTimeout(() => {
    activateNextIntakeReviewItem()
  }, 2000)
}

function normalizeValue(value) {
  return value == null ? '' : String(value).trim()
}

function createFieldSourceSnapshot(value = '', kind = '') {
  return {
    value,
    kind,
  }
}

function draftWithFieldReviewApplied(draft = {}, fields = []) {
  const nextOpportunityForm = { ...(draft?.opportunityForm || {}) }
  const nextCompanyForm = { ...(draft?.companyForm || {}) }
  const nextContactForm = { ...(draft?.contactForm || {}) }
  const nextFieldSourceModes = { ...(draft?.fieldSourceModes || {}) }
  const nextAutofilledFlags = { ...(draft?.autofilledFlags || {}) }
  const nextAiSnapshots = { ...(draft?.aiGeneratedFieldSnapshots || {}) }
  const nextReviewFields = { ...(draft?.intakeReviewFields || {}) }
  const nextReviewVerified = { ...(draft?.intakeReviewVerified || {}) }
  const nextConfirmedValues = { ...(draft?.intakeConfirmedFieldValues || {}) }
  const nextLockedFields = { ...(draft?.intakeLockedFields || {}) }
  const nextFieldSources = { ...(draft?.intakeFieldSources || {}) }

  const assignAiField = (section, key, value) => {
    const fieldKey = `${section}.${key}`
    if (section === 'company') nextCompanyForm[key] = value
    else if (section === 'contact') nextContactForm[key] = value
    else nextOpportunityForm[key] = value
    nextFieldSourceModes[fieldKey] = 'ai'
    nextAutofilledFlags[fieldKey] = true
    nextAiSnapshots[fieldKey] =
      section === 'company'
        ? {
            value,
            companyForm: {
              ...nextCompanyForm,
              [key]: value,
            },
            companyId: nextOpportunityForm.company_id || null,
            companyLinkMode: draft?.companyLinkMode || 'new',
            companySourceChoice: draft?.companySourceChoice || 'input',
          }
        : section === 'contact'
          ? {
              value,
              contactForm: {
                ...nextContactForm,
                [key]: value,
              },
              contactLinkMode: draft?.contactLinkMode || 'new',
            }
          : createFieldSourceSnapshot(value, nextOpportunityForm.kind || draft?.opportunityForm?.kind || '')
  }

  for (const field of fields) {
    const key = String(field?.key || '').trim()
    const value = normalizeValue(field?.value)
    if (!key || !value) continue
    nextReviewFields[key] = value
    nextReviewVerified[key] = true
    nextConfirmedValues[key] = value
    nextLockedFields[key] = true
    nextFieldSources[key] = 'User verified prompt suggestion'

    if (key === 'companyName') assignAiField('company', 'Company_Name', value)
    else if (key === 'companyLocation') assignAiField('company', 'Headquarters_City', value)
    else if (key === 'companyOneLiner') assignAiField('company', 'One_Liner', value)
    else if (key === 'companyDescription') assignAiField('company', 'Description', value)
    else if (key === 'companyStatus') assignAiField('company', 'Status', value)
    else if (key === 'companyWebsite') assignAiField('company', 'Website', value)
    else if (key === 'contactName') assignAiField('contact', 'Name', value)
    else if (key === 'contactEmail') assignAiField('contact', 'Professional_Email', value)
    else if (key === 'opportunityName') assignAiField('opportunity', 'Venture_Oppty_Name', value)
    else if (key === 'targetSize') assignAiField('opportunity', 'Investment_Ask', value)
    else if (key === 'committedAmounts') assignAiField('opportunity', 'Hard_Commits', value)
    else if (key === 'closeDate') assignAiField('opportunity', 'Final_Close_Date', value)
    else if (key === 'raisingStatus') assignAiField('opportunity', 'Raising_Status', value)
    else if (key === 'fundPeriod') assignAiField('opportunity', 'Pipeline_Status', value)
    else if (key === 'roundStage') assignAiField('opportunity', 'Round_Stage', value)
    else if (key === 'securityType') assignAiField('opportunity', 'Type_of_Security', value)
    else if (key === 'preValuation') assignAiField('opportunity', 'Pre_Valuation', value)
    else if (key === 'postValuation') assignAiField('opportunity', 'Post_Valuation', value)
    else if (key === 'previousPost') assignAiField('opportunity', 'Previous_Post', value)
  }

  return {
    opportunityForm: nextOpportunityForm,
    companyForm: nextCompanyForm,
    contactForm: nextContactForm,
    fieldSourceModes: nextFieldSourceModes,
    autofilledFlags: nextAutofilledFlags,
    aiGeneratedFieldSnapshots: nextAiSnapshots,
    intakeReviewFields: nextReviewFields,
    intakeReviewVerified: nextReviewVerified,
    intakeConfirmedFieldValues: nextConfirmedValues,
    intakeLockedFields: nextLockedFields,
    intakeFieldSources: nextFieldSources,
    stage: 'Ready for Review',
  }
}

function scrubFieldFromQueuedBundles(draftId, fieldKey) {
  const normalizedDraftId = String(draftId || '').trim()
  const normalizedFieldKey = String(fieldKey || '').trim()
  if (!normalizedDraftId || !normalizedFieldKey) return

  for (const item of intakeReviewQueueState.items) {
    if (String(item?.draftId || '').trim() !== normalizedDraftId) continue
    if (String(item?.kind || '').trim() !== 'field-review') continue
    const existingFields = Array.isArray(item?.payload?.fields) ? item.payload.fields : []
    const nextFields = existingFields.filter((field) => String(field?.key || '').trim() !== normalizedFieldKey)
    if (nextFields.length === existingFields.length) continue
    if (!nextFields.length) {
      item.status = 'resolved'
      if (String(intakeReviewQueueState.activeItemId || '').trim() === String(item.id || '').trim()) {
        intakeReviewQueueState.activeItemId = null
      }
      continue
    }
    item.payload = {
      ...item.payload,
      fields: nextFields,
    }
    item.updatedAt = Date.now()
  }
}

function closeActiveIntakeQueueItem(action = 'resolved') {
  const itemId = String(activeIntakeQueueItem.value?.id || '').trim()
  if (!itemId) return
  intakeQueueDialogOpen.value = false
  if (action === 'dismissed') dismissIntakeReviewItem(itemId)
  else resolveIntakeReviewItem(itemId)
  scheduleNextIntakeQueueItem()
}

function consumeActiveFieldBundle(fields = [], nextAction = 'resolved') {
  const activeItem = activeIntakeQueueItem.value
  if (!activeItem || activeItem.kind !== 'field-review') return
  const draftId = String(activeItem.draftId || '').trim()
  const draft = draftId ? intakeDraftState.drafts[draftId] || null : null

  if (draft && fields.length) {
    updateIntakeDraft(draftId, draftWithFieldReviewApplied(draft, fields))
    fields.forEach((field) => scrubFieldFromQueuedBundles(draftId, field.key))
    globalThis?.dispatchEvent?.(
      new CustomEvent('ecvc:intake-draft-review-applied', { detail: { draftId } }),
    )
  }

  const remainingFields = intakeQueueEditableFields.value.filter(
    (field) => !fields.some((consumedField) => consumedField.key === field.key),
  )
  if (remainingFields.length) {
    activeItem.payload = {
      ...activeItem.payload,
      fields: remainingFields,
    }
    activeItem.updatedAt = Date.now()
    return
  }

  closeActiveIntakeQueueItem(nextAction)
}

function confirmActiveIntakeField(fieldKey) {
  const value = normalizeValue(intakeQueueFieldEdits.value[fieldKey])
  if (!value) {
    dismissActiveIntakeField(fieldKey)
    return
  }
  const field = intakeQueueEditableFields.value.find((entry) => entry.key === fieldKey)
  if (!field) return
  consumeActiveFieldBundle([{ ...field, value }], 'resolved')
}

function openActiveEntityCreateDialog() {
  const activeItem = activeIntakeQueueItem.value
  if (!activeItem || activeItem.kind !== 'entity-create') return
  const entityTypeName = String(activeItem.payload?.entityType || '').trim().toLowerCase()
  const routeNameByEntityType = {
    company: 'companies',
    contact: 'contacts',
    fund: 'funds',
    round: 'rounds',
  }
  const sourceKeyByEntityType = {
    company: 'companies',
    contact: 'contacts',
    fund: 'funds',
    round: 'rounds',
  }
  const routeName = routeNameByEntityType[entityTypeName]
  const sourceKey = sourceKeyByEntityType[entityTypeName]
  if (!routeName || !sourceKey) return
  setPendingAddEditShellRequest({
    sourceKey,
    initialValues: JSON.parse(JSON.stringify(activeItem.payload?.entity || {})),
  })
  router.push({ name: routeName, query: { ...route.query, create: '1' } })
  const itemId = String(activeItem.id || '').trim()
  if (itemId) resolveIntakeReviewItem(itemId)
  pendingEntityDialogAdvance = true
}

function dismissActiveIntakeField(fieldKey) {
  const activeItem = activeIntakeQueueItem.value
  if (!activeItem || activeItem.kind !== 'field-review') return
  const remainingFields = intakeQueueEditableFields.value.filter((entry) => entry.key !== fieldKey)
  if (remainingFields.length) {
    activeItem.payload = {
      ...activeItem.payload,
      fields: remainingFields,
    }
    activeItem.updatedAt = Date.now()
    return
  }
  closeActiveIntakeQueueItem('dismissed')
}

function dismissActiveIntakeFieldBundle() {
  closeActiveIntakeQueueItem('dismissed')
}

function draftPrimaryLabel(draft = {}) {
  return String(draft?.droppedFiles?.[0]?.name || '').trim() || 'Untitled draft'
}

function draftSecondaryLabel(draft = {}) {
  const opportunityId = String(draft?.opportunityId || '').trim()
  return opportunityId ? `Linked opportunity: ${opportunityId}` : ''
}

function resumeDraft(draftId) {
  setActiveIntakeDraft(draftId)
  const draft = intakeDraftState.drafts[String(draftId || '').trim()] || null
  if (String(draft?.resumeMode || '').trim() === 'existing-artifact-link') {
    openArtifactDialog()
    return
  }

  const kind = String(draft?.opportunityForm?.kind || '').trim().toLowerCase() === 'fund' ? 'fund' : 'round'
  const eventName = kind === 'fund' ? 'ecvc:open-fund-dialog' : 'ecvc:open-round-dialog'
  const routeName = kind === 'fund' ? 'funds' : 'rounds'
  const flagName = kind === 'fund' ? '__ecvcOpenFundDialog' : '__ecvcOpenRoundDialog'

  draftTrayDismissed.value = false
  globalThis[flagName] = true
  router.push({ name: routeName, query: { create: kind } }).finally(async () => {
    await nextTick()
    globalThis?.dispatchEvent?.(new Event(eventName))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event(eventName))
    }, 80)
  })
}

function discardDraft(draftId) {
  removeIntakeDraft(draftId)
  if (intakeDraftState.draftOrder.length === 0) {
    draftTrayDismissed.value = false
  }
}

function clampQuickWidgetPosition(x, y) {
  if (typeof window === 'undefined') return { x, y }
  const triggerRadius = QUICK_WIDGET_TRIGGER_SIZE / 2
  const actionHalfSize = (QUICK_WIDGET_ACTION_SIZE * QUICK_WIDGET_ACTION_HOVER_SCALE) / 2
  const openRadius = QUICK_WIDGET_ACTION_RADIUS + actionHalfSize + 20
  const minX = QUICK_WIDGET_MARGIN + openRadius - triggerRadius
  const minY = QUICK_WIDGET_MARGIN
  const maxX = window.innerWidth - QUICK_WIDGET_MARGIN - openRadius - triggerRadius
  const maxY = window.innerHeight - QUICK_WIDGET_MARGIN - openRadius - triggerRadius
  const fallbackX = Math.max(0, (window.innerWidth - QUICK_WIDGET_TRIGGER_SIZE) / 2)
  const fallbackY = Math.max(0, (window.innerHeight - QUICK_WIDGET_TRIGGER_SIZE) / 2)
  const clampedX = maxX >= minX ? Math.min(Math.max(x, minX), maxX) : fallbackX
  const clampedY = maxY >= minY ? Math.min(Math.max(y, minY), maxY) : fallbackY
  return {
    x: clampedX,
    y: clampedY,
  }
}

function setDefaultQuickWidgetPosition() {
  if (typeof window === 'undefined') return
  quickWidgetPosition.value = clampQuickWidgetPosition(
    window.innerWidth - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN,
    window.innerHeight - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN,
  )
}

function persistQuickWidgetPosition() {
  if (typeof window === 'undefined') return
  window.localStorage?.setItem(
    QUICK_WIDGET_POSITION_STORAGE_KEY,
    JSON.stringify(quickWidgetPosition.value),
  )
}

function normalizeQuickWidgetActionSettings(rawSettings = {}) {
  const enabledInput = rawSettings?.enabled && typeof rawSettings.enabled === 'object' ? rawSettings.enabled : {}
  const orderInput = Array.isArray(rawSettings?.order) ? rawSettings.order : []
  const order = [
    ...orderInput.filter((id) => DEFAULT_QUICK_WIDGET_ACTION_ORDER.includes(id)),
    ...DEFAULT_QUICK_WIDGET_ACTION_ORDER.filter((id) => !orderInput.includes(id)),
  ]

  return {
    order,
    enabled: Object.fromEntries(
      DEFAULT_QUICK_WIDGET_ACTION_ORDER.map((id) => [id, enabledInput[id] !== false]),
    ),
  }
}

function persistQuickWidgetActionSettings() {
  if (typeof window === 'undefined') return
  window.localStorage?.setItem(
    QUICK_WIDGET_ACTION_SETTINGS_STORAGE_KEY,
    JSON.stringify(quickWidgetActionSettings.value),
  )
}

function loadQuickWidgetActionSettings() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage?.getItem(QUICK_WIDGET_ACTION_SETTINGS_STORAGE_KEY)
    if (!raw) {
      quickWidgetActionSettings.value = normalizeQuickWidgetActionSettings()
      return
    }
    quickWidgetActionSettings.value = normalizeQuickWidgetActionSettings(JSON.parse(raw))
  } catch {
    quickWidgetActionSettings.value = normalizeQuickWidgetActionSettings()
  }
}

function isQuickWidgetActionEnabled(actionId) {
  if (String(actionId || '').trim() === 'settings') return true
  return quickWidgetActionSettings.value?.enabled?.[actionId] !== false
}

function setQuickWidgetActionEnabled(actionId, enabled) {
  quickWidgetActionSettings.value = {
    ...quickWidgetActionSettings.value,
    enabled: {
      ...quickWidgetActionSettings.value.enabled,
      [actionId]: enabled !== false,
    },
  }
  persistQuickWidgetActionSettings()
}

function moveQuickWidgetAction(actionId, direction) {
  const currentOrder = [...(quickWidgetActionSettings.value?.order || [])]
  const fromIndex = currentOrder.indexOf(actionId)
  const toIndex = fromIndex + direction
  if (fromIndex < 0 || toIndex < 0 || toIndex >= currentOrder.length) return
  const [moved] = currentOrder.splice(fromIndex, 1)
  currentOrder.splice(toIndex, 0, moved)
  quickWidgetActionSettings.value = {
    ...quickWidgetActionSettings.value,
    order: currentOrder,
  }
  persistQuickWidgetActionSettings()
}

function setQuickWidgetSettingsTarget(element) {
  quickWidgetSettingsTarget.value = element?.$el ?? element ?? null
}

function isQuickWidgetSettingsSectionOpen(sectionKey) {
  return quickWidgetSettingsSectionOpen.value[String(sectionKey || '').trim()] !== false
}

function toggleQuickWidgetSettingsSection(sectionKey) {
  const normalizedKey = String(sectionKey || '').trim()
  if (!normalizedKey) return
  quickWidgetSettingsSectionOpen.value = {
    ...quickWidgetSettingsSectionOpen.value,
    [normalizedKey]: !isQuickWidgetSettingsSectionOpen(normalizedKey),
  }
}

function onQuickWidgetSettingsPointerDown(evt) {
  if (evt.pointerType === 'mouse' && evt.button !== 0) return
  quickWidgetSettingsDragState = {
    pointerId: evt.pointerId,
    startX: evt.clientX,
    startY: evt.clientY,
    startOffsetX: quickWidgetSettingsOffset.value.x,
    startOffsetY: quickWidgetSettingsOffset.value.y,
  }
  quickWidgetSettingsIsDragging.value = true
  window.addEventListener('pointermove', onQuickWidgetSettingsPointerMove)
  window.addEventListener('pointerup', onQuickWidgetSettingsPointerUp)
  window.addEventListener('pointercancel', onQuickWidgetSettingsPointerUp)
}

function onQuickWidgetSettingsPointerMove(evt) {
  if (!quickWidgetSettingsDragState || evt.pointerId !== quickWidgetSettingsDragState.pointerId) return
  const dx = evt.clientX - quickWidgetSettingsDragState.startX
  const dy = evt.clientY - quickWidgetSettingsDragState.startY
  quickWidgetSettingsOffset.value = {
    x: quickWidgetSettingsDragState.startOffsetX + dx,
    y: quickWidgetSettingsDragState.startOffsetY + dy,
  }
}

function onQuickWidgetSettingsPointerUp(evt) {
  if (!quickWidgetSettingsDragState || evt.pointerId !== quickWidgetSettingsDragState.pointerId) return
  quickWidgetSettingsIsDragging.value = false
  quickWidgetSettingsDragState = null
  window.removeEventListener('pointermove', onQuickWidgetSettingsPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetSettingsPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetSettingsPointerUp)
}

function loadQuickWidgetPosition() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage?.getItem(QUICK_WIDGET_POSITION_STORAGE_KEY)
    if (!raw) {
      setDefaultQuickWidgetPosition()
      return
    }
    const parsed = JSON.parse(raw)
    const x = Number(parsed?.x)
    const y = Number(parsed?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      setDefaultQuickWidgetPosition()
      return
    }
    quickWidgetPosition.value = clampQuickWidgetPosition(x, y)
  } catch {
    setDefaultQuickWidgetPosition()
  }
}

function onQuickWidgetResize() {
  const { x, y } = quickWidgetPosition.value
  quickWidgetPosition.value = clampQuickWidgetPosition(x, y)
}

function quickWidgetActionAngle(index) {
  const total = quickWidgetRingActions.value.length
  if (total <= 0) return -90
  return -90 - (360 / total) * index
}

function quickWidgetActionOffsetById(actionId, radius = QUICK_WIDGET_ACTION_RADIUS) {
  const resolvedId = String(actionId || '').trim()
  const orderIndex = quickWidgetRingActions.value.findIndex((action) => action.id === resolvedId)
  const angleIndex = orderIndex >= 0 ? orderIndex : 0
  const angleRad = (quickWidgetActionAngle(angleIndex) * Math.PI) / 180

  return {
    x: Math.cos(angleRad) * radius,
    y: Math.sin(angleRad) * radius,
  }
}

function quickWidgetActionOffset(index, radius = QUICK_WIDGET_ACTION_RADIUS) {
  const action = quickWidgetRingActions.value[index]
  return quickWidgetActionOffsetById(action?.id, radius)
}

function onQuickWidgetPointerDown(evt) {
  if (evt.pointerType === 'mouse' && evt.button !== 0) return
  quickWidgetDragState = {
    pointerId: evt.pointerId,
    startX: evt.clientX,
    startY: evt.clientY,
    startLeft: quickWidgetPosition.value.x,
    startTop: quickWidgetPosition.value.y,
    dragged: false,
  }
  window.addEventListener('pointermove', onQuickWidgetPointerMove)
  window.addEventListener('pointerup', onQuickWidgetPointerUp)
  window.addEventListener('pointercancel', onQuickWidgetPointerUp)
}

function onQuickWidgetPointerMove(evt) {
  if (!quickWidgetDragState || evt.pointerId !== quickWidgetDragState.pointerId) return
  const dx = evt.clientX - quickWidgetDragState.startX
  const dy = evt.clientY - quickWidgetDragState.startY
  if (!quickWidgetDragState.dragged && Math.hypot(dx, dy) >= 4) {
    quickWidgetDragState.dragged = true
    quickWidgetIsDragging.value = true
  }
  if (!quickWidgetDragState.dragged) return
  evt.preventDefault()
  quickWidgetPosition.value = clampQuickWidgetPosition(
    quickWidgetDragState.startLeft + dx,
    quickWidgetDragState.startTop + dy,
  )
}

function onQuickWidgetPointerUp(evt) {
  if (!quickWidgetDragState || evt.pointerId !== quickWidgetDragState.pointerId) return
  if (quickWidgetDragState.dragged) {
    quickWidgetIgnoreNextToggle.value = true
    persistQuickWidgetPosition()
  }
  quickWidgetIsDragging.value = false
  quickWidgetDragState = null
  window.removeEventListener('pointermove', onQuickWidgetPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetPointerUp)
}

function quickWidgetActionStyle(index) {
  const offset = quickWidgetActionOffset(index)
  if (!quickActionsOpen.value) {
    return {
      '--ec-quick-action-x': '0px',
      '--ec-quick-action-y': '0px',
      '--ec-quick-action-open-scale': '0.2',
      opacity: '0',
      pointerEvents: 'none',
      transitionDelay: '0ms',
    }
  }
  return {
    '--ec-quick-action-x': `${offset.x.toFixed(2)}px`,
    '--ec-quick-action-y': `${offset.y.toFixed(2)}px`,
    '--ec-quick-action-open-scale': '1',
    opacity: '1',
    pointerEvents: 'auto',
    transitionDelay: `${index * 28}ms`,
  }
}

function quickOpportunityBranchActionStyle(index) {
  const opportunityIndex = quickWidgetRingActions.value.findIndex((action) => action.id === 'opportunity')
  const parentOffset =
    opportunityIndex >= 0 ? quickWidgetActionOffset(opportunityIndex) : { x: 0, y: -QUICK_WIDGET_ACTION_RADIUS }
  const parentAngle = quickWidgetActionAngle(opportunityIndex >= 0 ? opportunityIndex : 0)
  const branchAngle = parentAngle + (index === 0 ? -30 : 30)
  const branchAngleRad = (branchAngle * Math.PI) / 180
  const branchOffsetX = parentOffset.x + Math.cos(branchAngleRad) * QUICK_WIDGET_BRANCH_RADIUS
  const branchOffsetY = parentOffset.y + Math.sin(branchAngleRad) * QUICK_WIDGET_BRANCH_RADIUS

  if (!quickActionsOpen.value || !quickOpportunityBranchOpen.value) {
    return {
      '--ec-quick-action-x': `${parentOffset.x.toFixed(2)}px`,
      '--ec-quick-action-y': `${parentOffset.y.toFixed(2)}px`,
      '--ec-quick-action-open-scale': '0.2',
      opacity: '0',
      pointerEvents: 'none',
      transitionDelay: '0ms',
    }
  }

  return {
    '--ec-quick-action-x': `${branchOffsetX.toFixed(2)}px`,
    '--ec-quick-action-y': `${branchOffsetY.toFixed(2)}px`,
    '--ec-quick-action-open-scale': '1',
    opacity: '1',
    pointerEvents: 'auto',
    transitionDelay: `${160 + index * 36}ms`,
  }
}

function toggleQuickActions() {
  if (quickWidgetIgnoreNextToggle.value) {
    quickWidgetIgnoreNextToggle.value = false
    return
  }
  if (quickActionsOpen.value) {
    closeQuickActions()
    return
  }
  quickOpportunityBranchOpen.value = false
  quickActionsOpen.value = true
  playQuickWidgetTo()
}

function closeQuickActions() {
  if (!quickActionsOpen.value) return
  quickWidgetSettingsOpen.value = false
  quickOpportunityBranchOpen.value = false
  quickActionsOpen.value = false
  playQuickWidgetBack()
}

async function openNoteFromQuickAction() {
  await openShellCreateFromQuickAction('notes')
}

async function openCompanyFromQuickAction() {
  await openShellCreateFromQuickAction('companies')
}

async function openContactFromQuickAction() {
  await openShellCreateFromQuickAction('contacts')
}

async function openUserFromQuickAction() {
  await openShellCreateFromQuickAction('users')
}

async function openTaskFromQuickAction() {
  await openShellCreateFromQuickAction('tasks')
}

async function openProjectFromQuickAction() {
  await openShellCreateFromQuickAction('projects')
}

async function openArtifactFromQuickAction() {
  await openShellCreateFromQuickAction('artifacts')
}

async function openFundFromQuickAction() {
  await openShellCreateFromQuickAction('opportunities', { kind: 'fund' })
}

async function openRoundFromQuickAction() {
  await openShellCreateFromQuickAction('opportunities', { kind: 'round' })
}

async function openShellCreateFromQuickAction(section, extraQuery = {}) {
  closeQuickActions()
  const sourceKey = String(section || '').trim().toLowerCase()
  const requestedBranch = String(extraQuery?.kind || '').trim().toLowerCase()
  const targetEntry = getFilePageRegistryEntry(sourceKey)
  const targetRouteName = String(targetEntry?.routeName || '').trim()
  if (!targetRouteName) {
    return
  }
  if (!requestedBranch && getCreateBranches(sourceKey).length) {
    await router.push({
      name: 'fork-shell',
      query: {
        section: sourceKey,
        returnTo: route.fullPath,
      },
    })
    return
  }
  if (requestedBranch && getCreateBranchEntry(sourceKey, requestedBranch)) {
    await router.push({
      name: 'dialog-shell',
      query: {
        section: sourceKey,
        create: String(Date.now()),
        kind: requestedBranch,
      },
    })
    return
  }
  await router.push({
    name: targetRouteName,
    query: {
      create: String(Date.now()),
      ...extraQuery,
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

function loadQuickWidgetAnimation(
  container,
  animationData,
  { loop = false, autoplay = false, stopAtStart = false, onComplete } = {},
) {
  if (!container) return null
  const animation = lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop,
    autoplay,
    animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  })
  if (stopAtStart) {
    animation.addEventListener('DOMLoaded', () => {
      animation.goToAndStop(0, true)
    })
  }
  if (onComplete) {
    animation.addEventListener('complete', onComplete)
  }
  return animation
}

function playQuickWidgetIdle() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetToAnimationData,
    { autoplay: false, stopAtStart: true },
  )
}

function playQuickWidgetTo() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetToAnimationData,
    {
      autoplay: true,
      onComplete: () => {
        if (quickActionsOpen.value) {
          playQuickWidgetOpen()
        }
      },
    },
  )
}

function playQuickWidgetBack() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetBackAnimationData,
    {
      autoplay: true,
      onComplete: () => {
        if (!quickActionsOpen.value) {
          playQuickWidgetIdle()
        }
      },
    },
  )
}

function playQuickWidgetOpen() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetOpenAnimationData,
    { autoplay: true, loop: true },
  )
}

onMounted(() => {
  window.addEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.addEventListener('ecvc:user-label-changed', loadAuditUserLabel)
  window.addEventListener('resize', onQuickWidgetResize)
  if (import.meta.env.DEV && typeof console !== 'undefined') {
    const bootstrapIssues = validateLevel1BootstrapContracts({ bridgeValue: bridge.value })
    if (bootstrapIssues.length) {
      console.warn('[ec-vc] L1 bootstrap contract issues detected', bootstrapIssues)
    }
  }
  syncUserNavState()
  loadQuickWidgetActionSettings()
  loadQuickWidgetPosition()
  initLogoAnimation()
  playQuickWidgetIdle()
  activateNextIntakeReviewItem()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.removeEventListener('ecvc:user-label-changed', loadAuditUserLabel)
  window.removeEventListener('resize', onQuickWidgetResize)
  window.removeEventListener('pointermove', onQuickWidgetPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetPointerUp)
  window.removeEventListener('pointermove', onQuickWidgetSettingsPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetSettingsPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetSettingsPointerUp)
  logoAnimation?.destroy()
  quickWidgetIconAnimation?.destroy()
  logoAnimation = null
  quickWidgetIconAnimation = null
  quickWidgetDragState = null
  quickWidgetSettingsDragState = null
  clearIntakeQueueNextTimer()
})

watch(
  () => route.fullPath,
  () => {
    syncUserNavState()
  },
)

watch(
  () => intakeDraftCount.value,
  (count) => {
    if (count > 0) draftTrayDismissed.value = false
  },
)

watch(
  () => [activeIntakeQueueItem.value?.id || null, activeIntakeQueueItem.value?.updatedAt || null],
  () => {
    const item = activeIntakeQueueItem.value
    if (!item) {
      intakeQueueDialogOpen.value = false
      intakeQueueFieldEdits.value = {}
      return
    }
    if (item.kind === 'entity-create') {
      intakeQueueDialogOpen.value = false
      intakeQueueFieldEdits.value = {}
      openActiveEntityCreateDialog()
      return
    }
    if (item.kind === 'field-review') {
      intakeQueueFieldEdits.value = Object.fromEntries(
        intakeQueueEditableFields.value.map((field) => [field.key, field.value]),
      )
    } else {
      intakeQueueFieldEdits.value = {}
    }
    intakeQueueDialogOpen.value = true
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    if (!pendingEntityDialogAdvance) return
    pendingEntityDialogAdvance = false
    scheduleNextIntakeQueueItem()
  },
)

function resolveBreadcrumbActionDisabled(action) {
  if (typeof action?.disabled === 'function') return !!action.disabled()
  return !!action?.disabled
}

function handleDrawerItemClick(item) {
  const itemTarget = String(item?.to || '').trim()
  const routeName = String(route.name || '').trim()
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return
  if (itemTarget === '/file-dialog-shell' && routeName === 'file-dialog-shell') {
    window.dispatchEvent(new CustomEvent('ecvc:reopen-file-dialog-shell'))
    return
  }
  if (itemTarget === '/dialog-shell' && routeName === 'dialog-shell') {
    window.dispatchEvent(new CustomEvent('ecvc:reopen-dialog-shell'))
    return
  }
  if (itemTarget === '/fork-shell' && routeName === 'fork-shell') {
    window.dispatchEvent(new CustomEvent('ecvc:reopen-fork-shell'))
  }
}

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }

  router.push({ name: 'home' })
}

</script>

<style scoped>
.ec-shell-toolbar {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-12);
  padding-top: calc(var(--ds-space-12) + 70px);
  padding-bottom: 12px;
}

.ec-intake-queue-field {
  display: grid;
  gap: 8px;
}

.ec-intake-queue-field__meta {
  display: grid;
  gap: 2px;
}

.ec-intake-queue-field__label {
  font-weight: 700;
}

.ec-intake-queue-field__caption {
  color: var(--ds-color-text-navigation);
  font-size: var(--ds-font-size-sm);
}

.ec-create-branch-dialog-title {
  color: var(--ds-color-text-header);
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.04em;
  text-transform: lowercase;
}

.ec-shell-toolbar-heading {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-10);
  min-width: 0;
  flex: 0 1 auto;
}

.ec-shell-page-title {
  color: var(--ds-color-text-header);
  font-family: var(--font-title);
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
  white-space: nowrap;
}

.ec-shell-back-btn {
  align-self: flex-end;
  padding: 0 6px;
  color: var(--ds-color-text-header);
  font-size: var(--ds-font-size-sm);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.01em;
}

.ec-shell-back-btn :deep(.q-btn__content) {
  font-weight: 800;
}

.ec-shell-back-btn :deep(.q-icon) {
  font-size: 1em;
}

.ec-shell-toolbar-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-10);
}

.ec-shell-toolbar-status {
  color: var(--ds-color-text-navigation);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
  white-space: nowrap;
  align-self: flex-end;
  margin-bottom: 2px;
}

.ec-shell-toolbar-action-btn {
  align-self: flex-end;
  color: color-mix(in srgb, var(--ds-color-text-navigation) 72%, white 28%);
}

.ec-shell-toolbar-action-btn :deep(.q-btn__content) {
  align-items: flex-end;
}

.ec-shell-toolbar-action-btn :deep(.q-icon) {
  transform: translateY(-1px);
}

.ec-shell-toolbar-title {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 12px;
  margin-left: auto;
  min-width: 0;
}

.ec-shell-toolbar-center {
  flex: 1 1 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  padding-inline: 12px;
}

.ec-shell-dialog-open-btn {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  background: #000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
  color: #fff;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  cursor: pointer;
}

.ec-shell-dialog-open-btn:hover,
.ec-shell-dialog-open-btn:focus-visible {
  background: #111;
  box-shadow: 0 0 0 1px #ffffff;
  outline: none;
}

.ec-shell-test-select {
  width: min(220px, 100%);
  min-width: 0;
}

.ec-shell-test-select :deep(.q-field__control) {
  min-height: 40px;
  padding: 0 4px 0 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.ec-shell-test-select :deep(.q-field__native),
.ec-shell-test-select :deep(.q-field__marginal) {
  color: #fff !important;
}

.ec-shell-test-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 18px;
  overflow: visible;
}

.ec-shell-test-select__label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.ec-shell-test-select__value {
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

.ec-shell-test-select__chevron {
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

.ec-shell-test-select-menu {
  background: #ffffff !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14) !important;
  border: 1px solid rgba(17, 17, 17, 0.08) !important;
}

.ec-shell-test-select-menu :deep(.q-virtual-scroll__content),
.ec-shell-test-select-menu :deep(.q-menu),
.ec-shell-test-select-menu :deep(.q-list) {
  background: #ffffff !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0;
}

.ec-shell-test-select-menu__item,
.ec-shell-test-select-menu :deep(.q-item) {
  min-height: 34px;
  padding: 4px 6px;
  color: #ffffff;
  background: transparent;
}

.ec-shell-test-select-menu__value {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 8px;
  color: #ffffff;
  background: #111111;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
  font-family: var(--font-title);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.03em;
}

.ec-shell-test-select-menu__item.q-manual-focusable--focused,
.ec-shell-test-select-menu__item.q-item--active,
.ec-shell-test-select-menu :deep(.q-item.q-manual-focusable--focused),
.ec-shell-test-select-menu :deep(.q-item--active) {
  background: transparent;
}

.ec-shell-test-select-menu__item.q-manual-focusable--focused .ec-shell-test-select-menu__value,
.ec-shell-test-select-menu__item.q-item--active .ec-shell-test-select-menu__value,
.ec-shell-test-select-menu :deep(.q-item.q-manual-focusable--focused .q-item__label),
.ec-shell-test-select-menu :deep(.q-item--active .q-item__label) {
  background: #000000;
  box-shadow: 0 0 0 1px #ffffff;
}

.ec-breadcrumb-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
  border-top: 1px solid var(--ds-color-border-soft-alt);
  background: var(--ds-color-surface-subtle);
  padding: var(--ds-space-12) var(--ds-space-16);
}

.ec-breadcrumb-primary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ec-breadcrumb-back {
  color: var(--ds-color-text-navigation);
  flex: 0 0 auto;
}

.ec-breadcrumbs {
  color: var(--ds-color-text-navigation);
  min-height: 28px;
}

.ec-breadcrumbs :deep(.q-breadcrumbs__el) {
  align-items: center;
  color: var(--ds-color-text-navigation);
  display: inline-flex;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
  text-decoration: none;
}

.ec-breadcrumbs :deep(.q-breadcrumbs__el:hover) {
  color: var(--ds-color-brand-blue);
}

.ec-breadcrumbs__current {
  color: var(--ds-color-text-header) !important;
  font-weight: var(--ds-font-weight-medium) !important;
  pointer-events: none;
}

.ec-breadcrumbs__placeholder {
  min-width: 4px;
  padding: 0 !important;
  color: transparent !important;
}

.ec-breadcrumb-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.ec-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ec-drawer-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px var(--ds-space-0) 8px;
}

.ec-drawer-footer {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 10px 16px;
}

.ec-drawer-section + .ec-drawer-section {
  margin-top: 6px;
}

.ec-nav-label {
  white-space: nowrap;
}

.ec-nav-label--secondary {
  font-size: 11px;
}

.ec-nav-subheader {
  min-height: auto;
  padding: 10px 16px 4px 16px;
}

.ec-nav-subheader--secondary {
  margin-top: 6px;
}

.ec-nav-item--workspace-toggle {
  margin-top: 6px;
}

.ec-nav-item--workspace-toggle :deep(.q-item__section--avatar) {
  align-items: center;
}

.ec-nav-item--workspace-toggle :deep(.q-item__section--avatar .q-icon) {
  transform: translateY(-1px);
}

.ec-nav-branch {
  display: flex;
  flex-direction: column;
}

.ec-nav-item--nested {
  padding-left: var(--ds-space-16);
}

.ec-nav-item--nested :deep(.q-item__section--avatar) {
  min-width: 40px;
}

.ec-nav-item :deep(.q-item__section--avatar) {
  min-width: 40px;
  justify-content: center;
}

.ec-nav-item :deep(.q-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ec-nav-item--primary :deep(.q-item__label) {
  font-size: 13px;
  line-height: 1.2;
}

.ec-nav-item--primary {
  min-height: 34px;
}

.ec-nav-icon--widget-blue {
  color: var(--b10-brand-azul, #2647ff);
}

.ec-drawer-footer__text {
  display: flex;
  align-items: center;
  min-height: 20px;
  padding-left: 16px;
  font-size: 11px;
  text-align: left;
  line-height: 1.2;
}

.ec-nav-item--secondary :deep(.q-item__label) {
  font-size: 11px;
}

.ec-nav-item--secondary {
  margin-left: 24px;
}

.ec-nav-item--secondary :deep(.q-item__section--avatar) {
  min-width: 40px;
}

.ec-nav-item--workspace-child {
  min-height: 28px;
}

.ec-nav-item--workspace-group {
  margin-left: 0;
}

.ec-nav-item--workspace-child + .ec-nav-item--workspace-child {
  margin-top: -1px;
}

.ec-nav-item--workspace-child :deep(.q-item__section) {
  padding-top: 1px;
  padding-bottom: 1px;
}

.ec-quick-widget {
  position: fixed;
  z-index: 4000;
  width: 112px;
  height: 112px;
  overflow: visible;
}

.ec-quick-widget-settings-menu {
  border-radius: 18px;
  overflow: hidden;
}

.ec-quick-widget-settings-window {
  will-change: transform;
}

.ec-quick-widget-settings-panel {
  width: 200px;
  max-width: min(200px, calc(100vw - 16px));
  padding: 5px;
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(18px);
}

.ec-quick-widget-settings-panel__header {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-bottom: 4px;
  cursor: grab;
  user-select: none;
}

.ec-quick-widget-settings-panel__header--dragging {
  cursor: grabbing;
}

.ec-quick-widget-settings-panel__eyebrow {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ec-quick-widget-settings-panel__title {
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.ec-quick-widget-settings-panel__caption {
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  line-height: 1.2;
}

.ec-quick-widget-settings-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ec-quick-widget-settings-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ec-quick-widget-settings-section__toggle {
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

.ec-quick-widget-settings-section__title {
  color: rgba(255, 255, 255, 0.54);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.ec-quick-widget-settings-section__chevron {
  color: rgba(255, 255, 255, 0.94);
  line-height: 1;
}

.ec-quick-widget-settings-row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 3px;
  padding: 4px 4px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ec-quick-widget-settings-row__copy {
  min-width: 0;
}

.ec-quick-widget-settings-row__label {
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

.ec-quick-widget-settings-row__toggle-spacer {
  width: 14px;
  height: 14px;
}

.ec-quick-widget-settings-row__actions {
  display: grid;
  grid-template-columns: 14px 14px;
  align-items: center;
  gap: 0;
  justify-content: end;
}

.ec-quick-widget-settings-row__actions :deep(.q-btn) {
  color: rgba(255, 255, 255, 0.42);
  width: 14px;
  height: 14px;
  min-width: 14px;
  min-height: 14px;
  padding: 0;
}

.ec-quick-widget-settings-row__chevron {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 1.45;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ec-quick-widget-settings-row__actions :deep(.q-btn:disabled) {
  color: rgba(255, 255, 255, 0.12) !important;
}

.ec-quick-widget-settings-row__checkbox {
  min-height: 16px;
}

.ec-quick-widget-settings-row__checkbox :deep(.q-checkbox__inner) {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.34) !important;
}

.ec-quick-widget-settings-row__checkbox :deep(.q-checkbox__inner--truthy) {
  color: rgba(255, 255, 255, 0.62) !important;
}

.ec-quick-widget-settings-row__checkbox :deep(.q-checkbox__bg) {
  background: transparent !important;
}

.ec-intake-drafts {
  position: fixed;
  right: 20px;
  bottom: 148px;
  z-index: 1900;
  width: min(360px, calc(100vw - 32px));
  max-height: min(420px, calc(100vh - 220px));
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.ec-intake-drafts__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.ec-intake-drafts__eyebrow {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ec-intake-drafts__title {
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.ec-intake-drafts__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(min(420px, calc(100vh - 220px)) - 60px);
  padding: 12px;
  overflow: auto;
}

.ec-intake-drafts__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%);
}

.ec-intake-drafts__item-copy {
  min-width: 0;
}

.ec-intake-drafts__item-title {
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.ec-intake-drafts__item-meta,
.ec-intake-drafts__item-subtitle {
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.ec-intake-drafts__item-meta {
  margin-top: 4px;
}

.ec-intake-drafts__item-subtitle {
  margin-top: 2px;
}

.ec-intake-drafts__item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ec-quick-widget-trigger {
  width: 112px;
  height: 112px;
  min-width: 112px;
  min-height: 112px;
  padding: 0;
  border-radius: 50%;
  background: transparent !important;
  box-shadow: none !important;
  transition: transform 0.22s ease;
  transform-origin: center;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.ec-quick-widget-trigger:hover,
.ec-quick-widget-trigger:focus-visible {
  transform: scale(1.15);
}

.ec-quick-widget-trigger--dragging {
  cursor: grabbing;
}

.ec-quick-widget-trigger--dragging:hover,
.ec-quick-widget-trigger--dragging:focus-visible {
  transform: none;
}

.ec-quick-widget-trigger :deep(.q-focus-helper) {
  opacity: 0 !important;
}

.ec-quick-widget-action {
  --ec-quick-action-x: 0px;
  --ec-quick-action-y: 0px;
  --ec-quick-action-open-scale: 0.2;
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transform: translate(calc(-50% + var(--ec-quick-action-x)), calc(-50% + var(--ec-quick-action-y)))
    scale(var(--ec-quick-action-open-scale));
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease;
}

.ec-quick-widget-action--branch {
  z-index: 1;
}

.ec-quick-widget-action-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: var(--ds-radius-round);
  background: var(--ds-color-text-primary-deep) !important;
  color: var(--ds-color-surface-inverse) !important;
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: var(--ds-shadow-fab);
  transition: transform 0.16s ease;
}

.ec-quick-widget-action-button :deep(.q-icon) {
  font-size: 20px;
}

.ec-quick-widget-action-button:hover,
.ec-quick-widget-action-button:focus-visible {
  transform: scale(1.08);
}

.ec-quick-widget-action-button--branch {
  background: color-mix(in srgb, var(--ds-color-text-primary-deep) 88%, white 12%) !important;
}

.ec-quick-widget-action-button--settings {
  background: var(--ds-color-surface-inverse) !important;
  color: var(--ds-color-text-primary-deep) !important;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.ec-quick-widget-action-label {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.04em;
  color: var(--ds-color-text-primary-deep);
  text-align: center;
  white-space: nowrap;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: var(--ds-radius-sm);
  padding: var(--ds-space-2) var(--ds-space-6);
  box-shadow: var(--ds-shadow-floating-label);
  opacity: 0;
  transform: translate(-50%, 4px);
  pointer-events: none;
  transition:
    opacity 0.14s ease,
    transform 0.16s ease;
}

.ec-quick-widget-action:hover .ec-quick-widget-action-label,
.ec-quick-widget-action:focus-within .ec-quick-widget-action-label {
  opacity: 1;
  transform: translate(-50%, 0);
}

.ec-quick-widget-icon {
  width: 112px;
  height: 112px;
  transform-origin: center;
  filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.18))
    drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12));
}

.ec-quick-widget-icon :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

@media (max-width: 900px) {
  .ec-shell-version {
    display: none;
  }

  .ec-intake-drafts {
    right: 12px;
    bottom: 132px;
    width: min(340px, calc(100vw - 24px));
  }
}
</style>
