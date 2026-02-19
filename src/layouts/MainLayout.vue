<template>
  <q-layout view="lHh Lpr lFf">
    <q-header :height-hint="60">
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

        <div class="ec-shell-version">Quasar v{{ $q.version }}</div>
      </q-toolbar>
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
        <q-list class="ec-drawer-menu">
          <q-item clickable to="/settings" class="ec-nav-item ec-nav-item--settings">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Settings</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="ec-drawer-head-separator" />

          <q-item clickable to="/" exact class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="folder" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Files</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/pipelines" class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="schema" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Pipelines</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/opportunities" class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="work" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Opportunities</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/artifacts" class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="attach_file" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Artifacts</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/companies" class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="apartment" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Companies</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/contacts" class="ec-nav-item">
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Contacts</q-item-label>
            </q-item-section>
          </q-item>
          <q-expansion-item
            class="ec-nav-item"
            icon="menu_book"
            label="Databooks"
            :default-opened="false"
            @show="loadDatabooks"
          >
            <q-item
              v-for="db in databooks"
              :key="db.opportunity_id"
              clickable
              :to="`/databooks/${encodeURIComponent(db.opportunity_id)}`"
              class="ec-nav-item"
            >
              <q-item-section>
                <q-item-label>{{ databookLabel(db) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!databooks.length">
              <q-item-section>
                <q-item-label caption class="text-grey-7">No active opportunities</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>

      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div class="ec-quick-widget" :style="quickWidgetStyle">
      <q-btn
        v-for="(action, index) in quickWidgetActions"
        :key="action.id"
        round
        dense
        unelevated
        class="ec-quick-widget-action"
        :class="{ 'ec-quick-widget-action--artifact-dragover': isArtifactAction(action) && artifactQuickDropActive }"
        :icon="action.icon"
        :aria-label="action.label"
        :style="quickWidgetActionStyle(index)"
        @click.stop="action.onClick"
        @dragenter.prevent="onQuickActionDragEnter($event, action)"
        @dragover.prevent="onQuickActionDragOver($event, action)"
        @dragleave.prevent="onQuickActionDragLeave($event, action)"
        @drop.prevent="onQuickActionDrop($event, action)"
      >
        <q-tooltip anchor="center left" self="center right">{{ action.label }}</q-tooltip>
      </q-btn>
      <div v-if="artifactQuickDropActive" class="ec-quick-widget-dropbox">
        Drop files to add artifact
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
        <div
          ref="quickWidgetIconContainer"
          class="ec-quick-widget-icon ec-quick-widget-icon--spin"
        />
      </q-btn>
    </div>

    <OpportunityCreateDialog v-model="opportunityDialogOpen" />
    <ArtifactAddDialog ref="artifactDialogRef" v-model="artifactDialogOpen" />
  </q-layout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import lottie from 'lottie-web'
import logoAnimationData from 'src/assets/lottie/animation-b10-firma.json'
import widgetBackTransitionAnimationData from 'src/assets/lottie/widget-back-transition.json'
import widgetHomeStaticAnimationData from 'src/assets/lottie/widget-home-static.json'
import widgetToTransitionAnimationData from 'src/assets/lottie/widget-to-transition.json'

import ArtifactAddDialog from 'components/ArtifactAddDialog.vue'
import OpportunityCreateDialog from 'components/OpportunityCreateDialog.vue'

const leftDrawerOpen = ref(false)
const quickActionsOpen = ref(false)
const opportunityDialogOpen = ref(false)
const artifactDialogOpen = ref(false)
const databooks = ref([])
const logoContainer = ref(null)
const logoReady = ref(false)
const quickWidgetIconContainer = ref(null)
const quickWidgetPosition = ref({ x: 0, y: 0 })
const quickWidgetIsDragging = ref(false)
const quickWidgetIgnoreNextToggle = ref(false)
const artifactDialogRef = ref(null)
const artifactQuickDropActive = ref(false)
const artifactQuickDropDepth = ref(0)

const QUICK_WIDGET_TRIGGER_SIZE = 112
const QUICK_WIDGET_ACTION_RADIUS = 96
const QUICK_WIDGET_MARGIN = 16
const QUICK_WIDGET_POSITION_STORAGE_KEY = 'ecvc.quickWidgetPosition'

const router = useRouter()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
let logoAnimation = null
let quickWidgetIconAnimation = null
let quickWidgetDragState = null

const quickWidgetStyle = computed(() => ({
  left: `${quickWidgetPosition.value.x}px`,
  top: `${quickWidgetPosition.value.y}px`,
}))

const quickWidgetActions = computed(() => [
  {
    id: 'artifact',
    label: 'Add new artifact',
    icon: 'attach_file',
    onClick: openArtifactFromQuickAction,
  },
  {
    id: 'opportunity',
    label: 'Create new opportunity',
    icon: 'work',
    onClick: openOpportunityFromQuickAction,
  },
  {
    id: 'pipeline',
    label: 'New pipeline',
    icon: 'schema',
    onClick: openPipelineFromQuickAction,
  },
  {
    id: 'company',
    label: 'New company',
    icon: 'apartment',
    onClick: openCompanyFromQuickAction,
  },
  {
    id: 'contact',
    label: 'New contact',
    icon: 'people',
    onClick: openContactFromQuickAction,
  },
])

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function openOpportunityDialog() {
  opportunityDialogOpen.value = true
}

function openArtifactDialog() {
  artifactDialogOpen.value = true
}

function hasFilesInDragEvent(evt) {
  const types = Array.from(evt?.dataTransfer?.types || [])
  return types.includes('Files')
}

function isArtifactAction(action) {
  return action?.id === 'artifact'
}

function onQuickActionDragEnter(evt, action) {
  if (!isArtifactAction(action)) return
  if (!hasFilesInDragEvent(evt)) return
  artifactQuickDropDepth.value += 1
  artifactQuickDropActive.value = true
}

function onQuickActionDragOver(evt, action) {
  if (!isArtifactAction(action)) return
  if (!hasFilesInDragEvent(evt)) return
  artifactQuickDropActive.value = true
  if (evt?.dataTransfer) evt.dataTransfer.dropEffect = 'copy'
}

function onQuickActionDragLeave(evt, action) {
  if (!isArtifactAction(action)) return
  artifactQuickDropDepth.value = Math.max(0, artifactQuickDropDepth.value - 1)
  if (artifactQuickDropDepth.value === 0) artifactQuickDropActive.value = false
}

async function openArtifactDialogWithFiles(files = []) {
  closeQuickActions()
  artifactDialogOpen.value = true
  await nextTick()
  artifactDialogRef.value?.stageDroppedFiles?.(files)
}

async function onQuickActionDrop(evt, action) {
  if (!isArtifactAction(action)) return
  artifactQuickDropDepth.value = 0
  artifactQuickDropActive.value = false
  const files = Array.from(evt?.dataTransfer?.files || [])
  if (files.length === 0) return
  await openArtifactDialogWithFiles(files)
}

function clampQuickWidgetPosition(x, y) {
  if (typeof window === 'undefined') return { x, y }
  const maxX = Math.max(
    QUICK_WIDGET_MARGIN,
    window.innerWidth - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN
  )
  const maxY = Math.max(
    QUICK_WIDGET_MARGIN,
    window.innerHeight - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN
  )
  return {
    x: Math.min(Math.max(x, QUICK_WIDGET_MARGIN), maxX),
    y: Math.min(Math.max(y, QUICK_WIDGET_MARGIN), maxY),
  }
}

function setDefaultQuickWidgetPosition() {
  if (typeof window === 'undefined') return
  quickWidgetPosition.value = clampQuickWidgetPosition(
    window.innerWidth - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN,
    window.innerHeight - QUICK_WIDGET_TRIGGER_SIZE - QUICK_WIDGET_MARGIN
  )
}

function persistQuickWidgetPosition() {
  if (typeof window === 'undefined') return
  window.localStorage?.setItem(
    QUICK_WIDGET_POSITION_STORAGE_KEY,
    JSON.stringify(quickWidgetPosition.value)
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
    quickWidgetDragState.startTop + dy
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
  const angleDeg = -90 + (360 / total) * index
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

function openOpportunityFromQuickAction() {
  closeQuickActions()
  openOpportunityDialog()
}

async function openPipelineFromQuickAction() {
  closeQuickActions()
  globalThis.__ecvcOpenPipelineDialog = true
  try {
    await router.push({ name: 'pipelines', query: { create: '1' } })
  } finally {
    globalThis?.dispatchEvent?.(new Event('ecvc:open-pipeline-dialog'))
    setTimeout(() => {
      globalThis?.dispatchEvent?.(new Event('ecvc:open-pipeline-dialog'))
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

function openArtifactFromQuickAction() {
  openArtifactDialogWithFiles([])
}

function isActiveOpportunity(row) {
  const status = String(row?.Raising_Status || '')
    .trim()
    .toLowerCase()
  if (!status) return true
  return !['closed', 'inactive', 'archived', 'dead'].includes(status)
}

function databookLabel(row) {
  const name = String(row?.opportunity_name || '').trim()
  return `${name || row?.opportunity_id || 'Untitled'} Databook`
}

async function loadDatabooks() {
  if (!bridge.value?.databooks?.list) return
  try {
    const result = await bridge.value.databooks.list()
    databooks.value = (result?.databooks || []).filter(isActiveOpportunity)
  } catch {
    databooks.value = []
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
  { loop = false, autoplay = false, stopAtStart = false, onComplete } = {}
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

function playQuickWidgetHome() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetHomeStaticAnimationData,
    { autoplay: true, loop: true }
  )
}

function playQuickWidgetTo() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetToTransitionAnimationData,
    { autoplay: true }
  )
}

function playQuickWidgetBack() {
  quickWidgetIconAnimation?.destroy()
  quickWidgetIconAnimation = loadQuickWidgetAnimation(
    quickWidgetIconContainer.value,
    widgetBackTransitionAnimationData,
    {
      autoplay: true,
      onComplete: () => {
        if (!quickActionsOpen.value) {
          playQuickWidgetHome()
        }
      },
    }
  )
}

onMounted(() => {
  window.addEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.addEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.addEventListener('ecvc:opportunities-changed', loadDatabooks)
  window.addEventListener('resize', onQuickWidgetResize)
  loadQuickWidgetPosition()
  loadDatabooks()
  initLogoAnimation()
  playQuickWidgetHome()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.removeEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.removeEventListener('ecvc:opportunities-changed', loadDatabooks)
  window.removeEventListener('resize', onQuickWidgetResize)
  window.removeEventListener('pointermove', onQuickWidgetPointerMove)
  window.removeEventListener('pointerup', onQuickWidgetPointerUp)
  window.removeEventListener('pointercancel', onQuickWidgetPointerUp)
  logoAnimation?.destroy()
  quickWidgetIconAnimation?.destroy()
  logoAnimation = null
  quickWidgetIconAnimation = null
  quickWidgetDragState = null
  artifactQuickDropActive.value = false
  artifactQuickDropDepth.value = 0
})
</script>

<style scoped>
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
  --ec-quick-action-hover-scale: 1;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  background: #1b1b1d !important;
  color: #ffffff !important;
  transform: translate(
      calc(-50% + var(--ec-quick-action-x)),
      calc(-50% + var(--ec-quick-action-y))
    )
    scale(var(--ec-quick-action-open-scale))
    scale(var(--ec-quick-action-hover-scale));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.18s ease;
}

.ec-quick-widget-action :deep(.q-icon) {
  font-size: 20px;
}

.ec-quick-widget-action :deep(.q-btn__content) {
  transition: transform 0.16s ease;
}

.ec-quick-widget-action:hover,
.ec-quick-widget-action:focus-visible {
  --ec-quick-action-hover-scale: 1.08;
  transition-delay: 80ms;
}

.ec-quick-widget-action:hover :deep(.q-btn__content),
.ec-quick-widget-action:focus-visible :deep(.q-btn__content) {
  transform: scale(1.12);
}

.ec-quick-widget-action--artifact-dragover {
  border: 2px dashed #ffffff;
  background: var(--q-primary, #1976d2) !important;
}

.ec-quick-widget-dropbox {
  position: absolute;
  left: 50%;
  top: -36px;
  transform: translateX(-50%);
  min-width: 190px;
  padding: 8px 10px;
  border: 2px dashed var(--q-primary, #1976d2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.98);
  color: #263238;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
  pointer-events: none;
}

.ec-quick-widget-icon {
  width: 112px;
  height: 112px;
  transform-origin: center;
  filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.18))
    drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12));
}

.ec-quick-widget-icon--spin {
  animation: ec-quick-widget-home-spin 14s linear infinite;
  will-change: transform;
}

.ec-quick-widget-icon :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

@keyframes ec-quick-widget-home-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
