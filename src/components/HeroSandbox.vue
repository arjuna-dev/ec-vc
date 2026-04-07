<template>
  <HeroSandboxSurface>
    <HeroSandboxOverlay>
      <template #left>
        <div class="hero-sandbox__portrait-holder">
          <div class="hero-sandbox__portrait-badge">RT</div>
        </div>
      </template>

      <template #middle>
        <div class="hero-sandbox__column-inner">
          <div class="hero-sandbox__middle-top">
            <RecordTitle class="hero-sandbox__title" title="Record Title" />
            <div class="hero-sandbox__settings-menu">
              <B10IconButton
                icon="tune"
                variant="subtle"
                size="small"
                aria-label="Record settings"
                @click="settingsMenuOpen = true"
              />
              <q-menu v-model="settingsMenuOpen" anchor="bottom right" self="top right">
                <L2SettingsMenu title="Hero Fields" :groups="settingsGroups" />
              </q-menu>
            </div>
          </div>

          <RecordFieldsBox />
          <RecordSummaryBox />
        </div>
      </template>

      <template #right>
        <RecordFeedPanel
          v-model="activeFeedTab"
          :tabs="feedTabs"
          :items="feedItems"
          empty-message="No feed items yet for this record."
          class="hero-sandbox__feed-panel"
        />
      </template>
    </HeroSandboxOverlay>
  </HeroSandboxSurface>
</template>

<script setup>
import { ref } from 'vue'
import HeroSandboxOverlay from 'src/components/HeroSandboxOverlay.vue'
import HeroSandboxSurface from 'src/components/HeroSandboxSurface.vue'
import L2SettingsMenu from 'src/components/L2SettingsMenu.vue'
import RecordFeedPanel from 'src/components/RecordFeedPanel.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'

defineOptions({
  name: 'HeroSandbox',
})

const settingsMenuOpen = ref(false)
const activeFeedTab = ref('all')

const settingsGroups = [
  {
    key: 'general',
    label: 'General',
    expanded: true,
    items: [
      { key: 'name', label: 'Name', checked: true },
      { key: 'summary', label: 'Summary', checked: true },
    ],
  },
]

const feedTabs = [
  { id: 'all', label: 'Activity' },
  { id: 'notes', label: 'Notes' },
]

const feedItems = [
  { id: '1', feedKey: 'all', meta: 'Most Recent', title: 'Founder note updated after partner call', hasLogPage: true },
  { id: '2', feedKey: 'notes', meta: 'Today', title: 'Partner intro captured for follow-up', hasLogPage: true },
]
</script>

<style scoped>
.hero-sandbox__portrait-holder {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
}

.hero-sandbox__portrait-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 132px;
  height: 132px;
  border-radius: var(--ds-radius-round);
  background: var(--ds-color-brand-black);
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-hero);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.04em;
}

.hero-sandbox__column-inner {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  min-width: 0;
  min-height: 100%;
}

.hero-sandbox__middle-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.hero-sandbox__title {
  min-width: 0;
}

.hero-sandbox__settings-menu {
  display: inline-flex;
  align-items: flex-start;
}

.hero-sandbox__feed-panel {
  width: 100%;
  min-height: 100%;
}
</style>
