<template>
  <q-layout view="lHh Lpr lFf">
    <q-header :height-hint="108" class="ec-shell-header">
      <q-toolbar class="q-px-md ec-shell-toolbar">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="ec-shell-toolbar-title">
          <div v-if="!logoReady" class="ec-shell-toolbar-fallback">B10</div>
          <div
            ref="logoContainer"
            class="ec-shell-toolbar-lottie"
            :class="{ 'ec-shell-toolbar-lottie--hidden': !logoReady }"
          />
        </q-toolbar-title>

        <div class="ec-shell-version">MTK v0.0.1</div>
      </q-toolbar>

      <div class="ec-breadcrumb-bar">
        <q-breadcrumbs class="ec-breadcrumbs" separator="chevron_right">
          <template #separator>
            <q-icon name="chevron_right" size="16px" color="grey-5" />
          </template>

          <q-breadcrumbs-el
            v-for="item in breadcrumbItems"
            :key="`${item.label}-${item.to || 'current'}`"
            :label="item.label"
            :to="item.current ? void 0 : item.to"
            :class="{ 'ec-breadcrumbs__current': item.current }"
          />
        </q-breadcrumbs>
      </div>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="264"
      behavior="desktop"
      :overlay="false"
    >
      <div class="ec-drawer-content">
        <div class="ec-drawer-scroll">
          <q-list
            v-for="section in drawerNavigationSections"
            :key="section.label"
            class="ec-drawer-section"
          >
            <q-item-label header class="ec-nav-label">{{ section.label }}</q-item-label>

            <q-item
              v-for="item in section.items"
              :key="item.label"
              clickable
              :to="item.to"
              :exact="item.exact"
              class="ec-nav-item"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

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

    <OpportunityCreateDialog v-model="opportunityDialogOpen" />
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
import OpportunityCreateDialog from 'components/OpportunityCreateDialog.vue'

const leftDrawerOpen = ref(false)
const quickActionsOpen = ref(false)
const opportunityDialogOpen = ref(false)
const artifactDialogOpen = ref(false)
const auditUserLabel = ref('')
const logoContainer = ref(null)
const logoReady = ref(false)
const quickWidgetIconContainer = ref(null)
const quickWidgetPosition = ref({ x: 0, y: 0 })
const quickWidgetIsDragging = ref(false)
const quickWidgetIgnoreNextToggle = ref(false)

const QUICK_WIDGET_TRIGGER_SIZE = 112
const QUICK_WIDGET_ACTION_RADIUS = 96
const QUICK_WIDGET_ACTION_SIZE = 40
const QUICK_WIDGET_ACTION_HOVER_SCALE = 1.08
const QUICK_WIDGET_MARGIN = 16
const QUICK_WIDGET_POSITION_STORAGE_KEY = 'ecvc.quickWidgetPosition'
const primaryNavigationItems = [
  { label: 'Home', to: '/', exact: true, icon: 'home' },
  { label: 'Companies', to: '/companies', exact: true, icon: 'apartment' },
  { label: 'Contacts', to: '/contacts', exact: true, icon: 'people' },
  { label: 'Opportunities', to: '/opportunities', exact: true, icon: 'work' },
  { label: 'Pipelines', to: '/pipelines', exact: true, icon: 'schema' },
]
const secondaryNavigationItems = [
  { label: 'Artifacts', to: '/artifacts', exact: true, icon: 'attach_file' },
  { label: 'Notes', to: '/notes', exact: true, icon: 'note' },
  { label: 'Tasks', to: '/tasks', exact: true, icon: 'check_circle' },
  { label: 'Assistants', to: '/assistants', exact: true, icon: 'smart_toy' },
]
const routeLabelByName = {
  home: 'Home',
  companies: 'Companies',
  contacts: 'Contacts',
  opportunities: 'Opportunities',
  pipelines: 'Pipelines',
  artifacts: 'Artifacts',
  notes: 'Notes',
  tasks: 'Tasks',
  assistants: 'Assistants',
  settings: 'Settings',
  'user-settings': 'User settings',
  'file-system': 'File system',
  'databook-view': 'Databook',
}
const databookParentRouteByTableName = {
  companies: '/companies',
  contacts: '/contacts',
  opportunities: '/opportunities',
  pipelines: '/pipelines',
}

const router = useRouter()
const route = useRoute()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
let logoAnimation = null
let quickWidgetIconAnimation = null
let quickWidgetDragState = null

const drawerNavigationSections = computed(() => [
  {
    label: 'Main',
    items: primaryNavigationItems,
  },
  {
    label: 'Workspace',
    items: secondaryNavigationItems,
  },
  {
    label: 'Preferences',
    items: [
      {
        label: hasAuditUserLabel.value ? `User: ${drawerUserLabel.value}` : 'Set user',
        to: '/user-settings',
        exact: true,
        icon: 'account_circle',
      },
      {
        label: 'Settings',
        to: '/settings',
        exact: true,
        icon: 'settings',
      },
    ],
  },
])

const hasAuditUserLabel = computed(() => !!normalizeUserLabel(auditUserLabel.value))
const drawerUserLabel = computed(() =>
  hasAuditUserLabel.value ? normalizeUserLabel(auditUserLabel.value) : 'Set user',
)
const breadcrumbItems = computed(() => {
  const currentRouteName = String(route.name || '')

  if (!currentRouteName || currentRouteName === 'home') {
    return [{ label: 'Home', to: '/', current: true }]
  }

  const items = [{ label: 'Home', to: '/' }]

  if (currentRouteName === 'databook-view') {
    const tableName = String(route.params.tableName || '').toLowerCase()
    const parentRoute = databookParentRouteByTableName[tableName]
    const parentLabel =
      routeLabelByName[tableName] ||
      (tableName ? toTitleCase(tableName.replace(/[-_]/g, ' ')) : '')

    if (parentRoute && parentLabel) {
      items.push({ label: parentLabel, to: parentRoute })
    }

    items.push({ label: 'Databook', current: true })
    return items
  }

  items.push({
    label: routeLabelByName[currentRouteName] || toTitleCase(currentRouteName.replace(/-/g, ' ')),
    current: true,
  })

  return items
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
    onClick: openOpportunityFromQuickAction,
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
])

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
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

function openOpportunityDialog() {
  opportunityDialogOpen.value = true
}

function openArtifactDialog() {
  artifactDialogOpen.value = true
}

function clampQuickWidgetPosition(x, y) {
  if (typeof window === 'undefined') return { x, y }
  const triggerRadius = QUICK_WIDGET_TRIGGER_SIZE / 2
  const actionHalfSize = (QUICK_WIDGET_ACTION_SIZE * QUICK_WIDGET_ACTION_HOVER_SCALE) / 2
  const openRadius = QUICK_WIDGET_ACTION_RADIUS + actionHalfSize
  const minX = QUICK_WIDGET_MARGIN + openRadius - triggerRadius
  const minY = QUICK_WIDGET_MARGIN + openRadius - triggerRadius
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
  const total = quickWidgetActions.value.length
  const angleDeg = -90 - (360 / total) * index
  const angleRad = (angleDeg * Math.PI) / 180
  const offsetX = Math.cos(angleRad) * QUICK_WIDGET_ACTION_RADIUS
  const offsetY = Math.sin(angleRad) * QUICK_WIDGET_ACTION_RADIUS
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
    '--ec-quick-action-x': `${offsetX.toFixed(2)}px`,
    '--ec-quick-action-y': `${offsetY.toFixed(2)}px`,
    '--ec-quick-action-open-scale': '1',
    opacity: '1',
    pointerEvents: 'auto',
    transitionDelay: `${index * 28}ms`,
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
  quickActionsOpen.value = true
  playQuickWidgetTo()
}

function closeQuickActions() {
  if (!quickActionsOpen.value) return
  quickActionsOpen.value = false
  playQuickWidgetBack()
}

async function openOpportunityFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenOpportunityDialog = true
  try {
    await router.push({ name: 'opportunities', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-opportunity-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-opportunity-dialog'))
    }, 80)
  }
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
      preserveAspectRatio: 'xMidYMid meet',
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
  window.addEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.addEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.addEventListener('ecvc:user-label-changed', loadAuditUserLabel)
  window.addEventListener('resize', onQuickWidgetResize)
  syncUserNavState()
  loadQuickWidgetPosition()
  initLogoAnimation()
  playQuickWidgetIdle()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
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
    syncUserNavState()
  },
)
</script>

<style scoped>
.ec-breadcrumb-bar {
  border-top: 1px solid var(--ds-color-border-soft-alt);
  background: var(--ds-color-surface-subtle);
  padding: var(--ds-space-12) var(--ds-space-16);
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

.ec-drawer-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--ds-space-14) var(--ds-space-0);
}

.ec-drawer-section + .ec-drawer-section {
  margin-top: var(--ds-space-10);
}

.ec-quick-widget {
  position: fixed;
  z-index: 2000;
  width: 112px;
  height: 112px;
  overflow: visible;
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
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-4);
  min-width: 56px;
  transform: translate(calc(-50% + var(--ec-quick-action-x)), calc(-50% + var(--ec-quick-action-y)))
    scale(var(--ec-quick-action-open-scale));
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease;
}

.ec-quick-widget-action-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: var(--ds-radius-round);
  background: var(--ds-color-text-primary-deep) !important;
  color: var(--ds-color-surface-inverse) !important;
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

.ec-quick-widget-action-label {
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.04em;
  color: var(--ds-color-text-primary-deep);
  text-align: center;
  white-space: nowrap;
  background: var(--ds-color-surface-overlay-96);
  border-radius: var(--ds-radius-sm);
  padding: var(--ds-space-2) var(--ds-space-6);
  box-shadow: var(--ds-shadow-floating-label);
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
}
</style>
