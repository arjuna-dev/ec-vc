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
        v-for="(action, index) in quickWidgetActions"
        :key="action.id"
        class="ec-quick-widget-action"
        :style="quickWidgetActionStyle(index)"
      >
        <q-btn
          round
          dense
          unelevated
          class="ec-quick-widget-action-button"
          :icon="action.icon"
          :aria-label="action.label"
          @click.stop="action.onClick"
        />
        <div class="ec-quick-widget-action-label">{{ action.label }}</div>
      </div>

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
    <q-dialog v-model="opportunityKindDialogOpen" persistent>
      <q-card style="width: 420px; max-width: 92vw">
        <q-card-section class="q-px-lg q-pt-lg q-pb-sm">
          <div class="text-h6">Choose Opportunity Type</div>
          <div class="text-caption text-grey-7">
            Start by confirming whether this opportunity is a fund or a round.
          </div>
        </q-card-section>

        <q-card-section class="q-px-lg q-pb-md">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-btn
                class="full-width"
                color="primary"
                icon="account_balance_wallet"
                label="Fund"
                @click="confirmOpportunityKind('fund')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-btn
                class="full-width"
                outline
                color="primary"
                icon="donut_large"
                label="Round"
                @click="confirmOpportunityKind('round')"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-lg q-py-md">
          <q-btn flat no-caps label="Close" @click="opportunityKindDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <ArtifactAddDialog v-model="artifactDialogOpen" />
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lottie from 'lottie-web'
import logoAnimationData from 'src/assets/lottie/animation-b10-firma.json'
import widgetBackAnimationData from 'src/assets/lottie/widget-back.json'
import widgetOpenAnimationData from 'src/assets/lottie/widget-open.json'
import widgetToAnimationData from 'src/assets/lottie/widget-to.json'

import ArtifactAddDialog from 'components/ArtifactAddDialog.vue'
import { removeIntakeDraft, setActiveIntakeDraft, useIntakeDraftState } from 'src/utils/intakeDraftState'
import { useBreadcrumbActionsState } from 'src/utils/breadcrumbActionsState'

const leftDrawerOpen = ref(false)
const quickActionsOpen = ref(false)
const quickOpportunityBranchOpen = ref(false)
const artifactDialogOpen = ref(false)
const opportunityKindDialogOpen = ref(false)
const auditUserLabel = ref('')
const logoContainer = ref(null)
const logoReady = ref(false)
const quickWidgetIconContainer = ref(null)
const quickWidgetPosition = ref({ x: 0, y: 0 })
const quickWidgetIsDragging = ref(false)
const quickWidgetIgnoreNextToggle = ref(false)
const draftTrayDismissed = ref(false)
const drawerSectionOpen = ref({
  preferences: true,
  main: true,
  radars: true,
  tokenzMarket: true,
  workspace: true,
})

const QUICK_WIDGET_TRIGGER_SIZE = 112
const QUICK_WIDGET_ACTION_RADIUS = 84
const QUICK_WIDGET_BRANCH_RADIUS = 88
const QUICK_WIDGET_ACTION_SIZE = 40
const QUICK_WIDGET_ACTION_HOVER_SCALE = 1.08
const QUICK_WIDGET_MARGIN = 16
const QUICK_WIDGET_POSITION_STORAGE_KEY = 'ecvc.quickWidgetPosition'
const mainNavigationItems = [
  { label: 'Home', to: '/', exact: true, icon: 'accessibility_new' },
  { label: 'Settings', to: '/user-settings', exact: true, icon: 'settings' },
  { label: 'Avatar', to: '/avatar', exact: true, icon: 'smart_toy' },
  { label: 'Roles', to: '/assistants', exact: true, icon: 'theater_comedy' },
].map((item) => ({
  ...item,
  itemClass: 'ec-nav-item--primary',
  iconSize: '22px',
}))
const ownerWorldNavigationItems = [
  { label: 'Home', to: '/dealz-world-home', exact: true, icon: 'public' },
  { label: 'Workspaces', to: '/workspaces', exact: true, icon: 'dns' },
  { label: 'Pipelines', to: '/world-pipelines', exact: true, icon: 'filter_alt' },
  {
    kind: 'toggle',
    label: 'Radars',
    itemClass: 'ec-nav-item--workspace-toggle',
    icon: 'satellite_alt',
    toggleKey: 'radars',
  },
  { label: 'Regions', to: '/regions', exact: true, icon: 'public', parentKey: 'radars' },
  { label: 'Asset Classes', to: '/asset-classes', exact: true, icon: 'category', parentKey: 'radars' },
  { label: 'Industries', to: '/industries', exact: true, icon: 'domain', parentKey: 'radars' },
  { label: 'Stages', to: '/stages', exact: true, icon: 'stairs', parentKey: 'radars' },
  { label: 'Shared Knowledge', to: '/shared-knowledge', exact: true, icon: 'auto_stories' },
  { label: 'Marketplace', to: '/marketplace', exact: true, icon: 'storefront' },
  { label: 'Events', to: '/merch-events', exact: true, icon: 'calendar_month' },
].map((item) => (
  item.parentKey
    ? {
        ...item,
        itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
        iconSize: '18px',
      }
    : {
        ...item,
        itemClass: item.itemClass ? `ec-nav-item--primary ${item.itemClass}` : 'ec-nav-item--primary',
        iconSize: '22px',
      }
))
const workspaceNavigationItems = [
  { label: 'Users', to: '/users', exact: true, icon: 'badge' },
  { label: 'Artifacts', to: '/artifacts', exact: true, icon: 'attach_file' },
  { label: 'Contacts', to: '/contacts', exact: true, icon: 'people' },
  { label: 'Companies', to: '/companies', exact: true, icon: 'apartment' },
  { label: 'Opportunities', to: '/opportunities', exact: true, icon: 'work' },
  { label: 'Pipelines', to: '/projects', exact: true, icon: 'schema' },
  { label: 'Notes', to: '/notes', exact: true, icon: 'note' },
  { label: 'Tasks', to: '/tasks', exact: true, icon: 'check_circle' },
  { label: 'File System', to: '/file-system', exact: true, icon: 'folder_open' },
].map((item) => ({
  ...item,
  itemClass: 'ec-nav-item--secondary ec-nav-item--workspace-child',
  iconSize: '18px',
}))
const tokenzMarketNavigationItems = [
  { label: 'Home', to: '/tokenz-market-home', exact: true, icon: 'toll' },
  { label: 'Wallet', to: '/tokenz-wallet', exact: true, icon: 'account_balance_wallet' },
  { label: 'Markets', to: '/tokenz-markets', exact: true, icon: 'newspaper' },
  { label: 'Vehicles', to: '/tokenz-vehicles', exact: true, icon: 'layers' },
].map((item) => ({
  ...item,
  itemClass: 'ec-nav-item--primary',
  iconSize: '22px',
}))
const routeLabelByName = {
  home: 'Home',
  companies: 'Companies',
  contacts: 'Contacts',
  users: 'Users',
  opportunities: 'Opportunities',
  funds: 'Funds',
  rounds: 'Rounds',
  pipelines: 'Pipelines',
  projects: 'Pipelines',
  artifacts: 'Artifacts',
  notes: 'Notes',
  tasks: 'Tasks',
  assistants: 'Roles',
  avatar: 'Avatar',
  'user-settings': 'Settings',
  'dealz-world-home': 'Home',
  workspaces: 'Workspaces',
  'world-pipelines': 'Pipelines',
  radars: 'Radars',
  regions: 'Regions',
  'asset-classes': 'Asset Classes',
  industries: 'Industries',
  stages: 'Stages',
  'shared-knowledge': 'Shared Knowledge',
  marketplace: 'Marketplace',
  'merch-events': 'Events',
  'tokenz-market-home': 'Home',
  'tokenz-wallet': 'Wallet',
  'tokenz-markets': 'Markets',
  'tokenz-vehicles': 'Vehicles',
  'file-system': 'File System',
  'databook-view': 'Databook',
}
const router = useRouter()
const route = useRoute()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const intakeDraftState = useIntakeDraftState()
const breadcrumbActionsState = useBreadcrumbActionsState()
const fallbackToolbarUpdatedAt = ref(new Date())
let logoAnimation = null
let quickWidgetIconAnimation = null
let quickWidgetDragState = null
const intakeDraftCount = computed(() => intakeDraftState.draftOrder.length)
const intakeDrafts = computed(() =>
  intakeDraftState.draftOrder.map((draftId) => intakeDraftState.drafts[draftId]).filter(Boolean),
)

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
      ...workspaceNavigationItems.map((item) => ({
        ...item,
        parentKey: 'workspace',
      })),
    ],
  },
  {
    label: 'Dealz',
    key: 'preferences',
    items: ownerWorldNavigationItems,
  },
  {
    label: 'Tokenz',
    key: 'tokenzMarket',
    items: tokenzMarketNavigationItems,
  },
])

const currentHeaderTitle = computed(() => {
  const currentRouteName = String(route.name || '')

  if (!currentRouteName || currentRouteName === 'home') {
    return 'Home'
  }

  if (currentRouteName === 'databook-view') {
    return 'Databook'
  }

  return routeLabelByName[currentRouteName] || toTitleCase(currentRouteName.replace(/[-_]/g, ' '))
})
const breadcrumbActions = computed(() => breadcrumbActionsState.actions || [])
const fallbackToolbarUpdatedLabel = computed(() => {
  const value = fallbackToolbarUpdatedAt.value
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return ''
  }

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)

  return `Updated ${formatted}`
})
const toolbarActions = computed(() => {
  if (String(route.name || '') === 'home') {
    return breadcrumbActions.value
  }

  return [
    {
      id: 'global-updated',
      kind: 'text',
      label: fallbackToolbarUpdatedLabel.value,
    },
    {
      id: 'global-refresh',
      icon: 'refresh',
      label: 'Refresh',
      onClick: refreshCurrentPage,
    },
  ]
})

const quickWidgetStyle = computed(() => ({
  left: `${quickWidgetPosition.value.x}px`,
  top: `${quickWidgetPosition.value.y}px`,
}))

const quickWidgetActions = computed(() => [
  {
    id: 'opportunity',
    label: 'Opportunity',
    icon: 'work',
    onClick: openOpportunityKindDialog,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'people',
    onClick: openContactFromQuickAction,
  },
  {
    id: 'company',
    label: 'Company',
    icon: 'apartment',
    onClick: openCompanyFromQuickAction,
  },
  {
    id: 'note',
    label: 'Note',
    icon: 'note',
    onClick: openNoteFromQuickAction,
  },
  {
    id: 'task',
    label: 'Task',
    icon: 'check_circle',
    onClick: openTaskFromQuickAction,
  },
  {
    id: 'artifact',
    label: intakeDraftCount.value > 0 ? `Artifact (${intakeDraftCount.value})` : 'Artifact',
    icon: 'attach_file',
    onClick: openArtifactFromQuickAction,
  },
])

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

function draftPrimaryLabel(draft = {}) {
  return String(draft?.droppedFiles?.[0]?.name || '').trim() || 'Untitled draft'
}

function draftSecondaryLabel(draft = {}) {
  const opportunityId = String(draft?.opportunityId || '').trim()
  return opportunityId ? `Linked opportunity: ${opportunityId}` : ''
}

function resumeDraft(draftId) {
  setActiveIntakeDraft(draftId)
  openArtifactDialog()
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
  const total = quickWidgetActions.value.length
  return -90 - (360 / total) * index
}

function quickWidgetActionOffsetById(actionId, radius = QUICK_WIDGET_ACTION_RADIUS) {
  const circleOrder = ['opportunity', 'task', 'contact', 'artifact', 'company', 'note']
  const resolvedId = String(actionId || '').trim()
  const orderIndex = circleOrder.indexOf(resolvedId)
  const angleIndex = orderIndex >= 0 ? orderIndex : 0
  const angleRad = (quickWidgetActionAngle(angleIndex) * Math.PI) / 180

  return {
    x: Math.cos(angleRad) * radius,
    y: Math.sin(angleRad) * radius,
  }
}

function quickWidgetActionOffset(index, radius = QUICK_WIDGET_ACTION_RADIUS) {
  const action = quickWidgetActions.value[index]
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
  const opportunityIndex = quickWidgetActions.value.findIndex((action) => action.id === 'opportunity')
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
  quickOpportunityBranchOpen.value = false
  quickActionsOpen.value = false
  playQuickWidgetBack()
}

function openOpportunityKindDialog() {
  closeQuickActions()
  opportunityKindDialogOpen.value = true
}

function confirmOpportunityKind(kind) {
  opportunityKindDialogOpen.value = false
  if (kind === 'fund') {
    void openFundFromQuickAction()
    return
  }
  void openRoundFromQuickAction()
}

async function openNoteFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenNoteDialog = true
  try {
    await router.push({ name: 'notes', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-note-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-note-dialog'))
    }, 80)
  }
}

async function openCompanyFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenCompanyDialog = true
  try {
    await router.push({ name: 'companies', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-company-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-company-dialog'))
    }, 80)
  }
}

async function openContactFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenContactDialog = true
  try {
    await router.push({ name: 'contacts', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-contact-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-contact-dialog'))
    }, 80)
  }
}

async function openTaskFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenTaskDialog = true
  try {
    await router.push({ name: 'tasks', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-task-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-task-dialog'))
    }, 80)
  }
}

async function openArtifactFromQuickAction() {
  closeQuickActions()
  try {
    await router.push({ name: 'artifacts' })
  } finally {
    draftTrayDismissed.value = false
    globalThis?.dispatchEvent?.(new Event('ecvc:open-artifact-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-artifact-dialog'))
    }, 80)
  }
}

async function openFundFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenFundDialog = true
  try {
    await router.push({ name: 'funds', query: { create: 'fund' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-fund-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-fund-dialog'))
    }, 80)
  }
}

async function openRoundFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenRoundDialog = true
  try {
    await router.push({ name: 'rounds', query: { create: 'round' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-round-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-round-dialog'))
    }, 80)
  }
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
  syncUserNavState()
  loadQuickWidgetPosition()
  initLogoAnimation()
  playQuickWidgetIdle()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.removeEventListener('ecvc:user-label-changed', loadAuditUserLabel)
  window.removeEventListener('resize', onQuickWidgetResize)
  window.removeEventListener('pointermove', onQuickWidgetPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetPointerUp)
  logoAnimation?.destroy()
  quickWidgetIconAnimation?.destroy()
  logoAnimation = null
  quickWidgetIconAnimation = null
  quickWidgetDragState = null
})

watch(
  () => route.fullPath,
  () => {
    fallbackToolbarUpdatedAt.value = new Date()
    syncUserNavState()
  },
)

watch(
  () => intakeDraftCount.value,
  (count) => {
    if (count > 0) draftTrayDismissed.value = false
  },
)

function resolveBreadcrumbActionDisabled(action) {
  if (typeof action?.disabled === 'function') return !!action.disabled()
  return !!action?.disabled
}

function refreshCurrentPage() {
  fallbackToolbarUpdatedAt.value = new Date()
  router.go(0)
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
  margin-left: auto;
  min-width: 0;
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
