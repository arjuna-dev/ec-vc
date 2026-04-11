<template>
  <HeroSurface>
    <Hero3ColOverlay>
      <template #left>
        <div class="hero-sandbox__portrait-holder">
          <slot name="portrait">
            <div class="hero-sandbox__portrait-badge">{{ initials }}</div>
          </slot>
        </div>
      </template>

      <template #middle>
        <div class="hero-sandbox__column-inner">
          <div class="hero-sandbox__middle-top">
            <RecordTitle class="hero-sandbox__title" :title="title" />
            <L2SettingsMenu
              title="Hero Fields"
              :groups="settingsGroups"
              @toggle-group="$emit('toggle-settings-group', $event)"
              @toggle-item="handleToggleSettingsItem"
            />
          </div>

          <RecordFieldsBox>
            <div v-if="fieldCards.length" class="hero-sandbox__field-grid">
              <RecordHeroFieldCard
                v-for="field in fieldCards"
                :key="field.key"
                :label="field.label"
                :description="field.description"
                :value="field.value"
                :status-icon="field.statusIcon"
                :interactive="interactive"
              />
            </div>
          </RecordFieldsBox>

          <RecordSummaryBox>
            <RecordHeroFieldCard
              label="Summary"
              description="General"
              :value="summaryValue"
              :status-icon="summaryStatusIcon"
              :interactive="interactive"
              :summary="true"
            />
          </RecordSummaryBox>
        </div>
      </template>

      <template #right>
        <RecordFeedPanel
          :model-value="feedTab"
          :tabs="feedTabs"
          :groups="feedGroups"
          :items="feedItems"
          :empty-message="feedEmptyMessage"
          class="hero-sandbox__feed-panel"
          @update:model-value="$emit('update:feedTab', $event)"
          @open-log="$emit('open-feed-log', $event)"
        />
      </template>
    </Hero3ColOverlay>
  </HeroSurface>
</template>

<script setup>
import Hero3ColOverlay from 'src/components/Hero3ColOverlay.vue'
import HeroSurface from 'src/components/HeroSurface.vue'
import L2SettingsMenu from 'src/components/L2SettingsMenu.vue'
import RecordFeedPanel from 'src/components/RecordFeedPanel.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
import RecordHeroFieldCard from 'src/components/RecordHeroFieldCard.vue'
import RecordTitle from 'src/components/RecordTitle.vue'

defineOptions({
  name: 'RecordHero',
})

defineProps({
  title: {
    type: String,
    default: 'Record Title',
  },
  initials: {
    type: String,
    default: 'RT',
  },
  settingsGroups: {
    type: Array,
    default: () => [],
  },
  fieldCards: {
    type: Array,
    default: () => [],
  },
  summaryValue: {
    type: String,
    default: '',
  },
  summaryStatusIcon: {
    type: String,
    default: '',
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  feedTab: {
    type: String,
    default: 'all',
  },
  feedTabs: {
    type: Array,
    default: () => [],
  },
  feedGroups: {
    type: Array,
    default: () => [],
  },
  feedItems: {
    type: Array,
    default: () => [],
  },
  feedEmptyMessage: {
    type: String,
    default: 'No feed items yet for this record.',
  },
})

const emit = defineEmits([
  'update:feedTab',
  'toggle-settings-group',
  'toggle-settings-item',
  'open-feed-log',
])

function handleToggleSettingsItem(itemKey, value) {
  emit('toggle-settings-item', itemKey, value)
}
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

.hero-sandbox__feed-panel {
  width: 100%;
  min-height: 100%;
}

.hero-sandbox__field-grid {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 14px;
  justify-content: start;
}
</style>
