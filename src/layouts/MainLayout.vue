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

        <div class="ec-drawer-footer">
          <div ref="drawerAnimationContainer" class="ec-drawer-footer-lottie" />
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-fab
      v-model="quickActionsOpen"
      class="fixed-bottom-right q-ma-md ec-quick-fab"
      direction="up"
      color="transparent"
      text-color="white"
      icon="none"
      active-icon="none"
      unelevated
      aria-label="Quick actions"
      @show="handleQuickFabShow"
      @hide="handleQuickFabHide"
    >
      <template #icon>
        <div ref="quickFabIconClosedContainer" class="ec-quick-fab-icon" />
      </template>
      <template #active-icon>
        <div ref="quickFabIconOpenContainer" class="ec-quick-fab-icon" />
      </template>
      <q-fab-action
        icon="work"
        color="primary"
        text-color="white"
        label="Create new opportunity"
        label-position="left"
        external-label
        @click="openOpportunityFromQuickAction"
      />
      <q-fab-action
        icon="attach_file"
        color="secondary"
        text-color="white"
        label="Add new artifact"
        label-position="left"
        external-label
        @click="openArtifactFromQuickAction"
      />
    </q-fab>

    <OpportunityCreateDialog v-model="opportunityDialogOpen" />
    <ArtifactAddDialog v-model="artifactDialogOpen" />
  </q-layout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const drawerAnimationContainer = ref(null)
const quickFabIconClosedContainer = ref(null)
const quickFabIconOpenContainer = ref(null)

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
let logoAnimation = null
let drawerAnimation = null
let quickFabClosedIconAnimation = null
let quickFabOpenIconAnimation = null

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function openOpportunityDialog() {
  opportunityDialogOpen.value = true
}

function openArtifactDialog() {
  artifactDialogOpen.value = true
}

function openOpportunityFromQuickAction() {
  quickActionsOpen.value = false
  openOpportunityDialog()
}

function openArtifactFromQuickAction() {
  quickActionsOpen.value = false
  openArtifactDialog()
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

function initDrawerAnimation() {
  if (!drawerAnimationContainer.value) return

  drawerAnimation?.destroy()
  drawerAnimation = lottie.loadAnimation({
    container: drawerAnimationContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/lottie/drop-files-here-mockup.json',
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })
}

function loadQuickFabAnimation(
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

function initStaticQuickFabIcon(container) {
  return loadQuickFabAnimation(container, widgetHomeStaticAnimationData, { stopAtStart: true })
}

function resetQuickFabClosedToHome() {
  quickFabClosedIconAnimation?.destroy()
  quickFabClosedIconAnimation = initStaticQuickFabIcon(quickFabIconClosedContainer.value)
}

function initQuickFabIcons() {
  resetQuickFabClosedToHome()
  quickFabOpenIconAnimation?.destroy()
  quickFabOpenIconAnimation = initStaticQuickFabIcon(quickFabIconOpenContainer.value)
}

function handleQuickFabShow() {
  quickFabClosedIconAnimation?.destroy()
  quickFabClosedIconAnimation = null
  nextTick(() => {
    quickFabOpenIconAnimation?.destroy()
    quickFabOpenIconAnimation = loadQuickFabAnimation(
      quickFabIconOpenContainer.value,
      widgetToTransitionAnimationData,
      { autoplay: true }
    )
  })
}

function handleQuickFabHide() {
  quickFabOpenIconAnimation?.destroy()
  quickFabOpenIconAnimation = null
  nextTick(() => {
    quickFabClosedIconAnimation?.destroy()
    quickFabClosedIconAnimation = loadQuickFabAnimation(
      quickFabIconClosedContainer.value,
      widgetBackTransitionAnimationData,
      {
        autoplay: true,
        onComplete: () => {
          if (!quickActionsOpen.value) {
            resetQuickFabClosedToHome()
          }
        },
      }
    )
  })
}

onMounted(() => {
  window.addEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.addEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.addEventListener('ecvc:opportunities-changed', loadDatabooks)
  loadDatabooks()
  initLogoAnimation()
  nextTick(() => {
    initDrawerAnimation()
    initQuickFabIcons()
  })
})

watch(leftDrawerOpen, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  initDrawerAnimation()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.removeEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
  window.removeEventListener('ecvc:opportunities-changed', loadDatabooks)
  logoAnimation?.destroy()
  drawerAnimation?.destroy()
  quickFabClosedIconAnimation?.destroy()
  quickFabOpenIconAnimation?.destroy()
  logoAnimation = null
  drawerAnimation = null
  quickFabClosedIconAnimation = null
  quickFabOpenIconAnimation = null
})
</script>

<style scoped>
.ec-quick-fab {
  z-index: 2000;
  --ec-quick-fab-size: 112px;
}

.ec-quick-fab :deep(.q-btn) {
  width: var(--ec-quick-fab-size);
  height: var(--ec-quick-fab-size);
  min-width: var(--ec-quick-fab-size);
  min-height: var(--ec-quick-fab-size);
  padding: 0;
  border-radius: 50%;
  background: transparent !important;
  box-shadow: none !important;
}

.ec-quick-fab :deep(.q-fab__icon-holder) {
  min-width: var(--ec-quick-fab-size);
  min-height: var(--ec-quick-fab-size);
}

.ec-quick-fab-icon {
  width: var(--ec-quick-fab-size);
  height: var(--ec-quick-fab-size);
}

.ec-quick-fab-icon :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
