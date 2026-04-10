<template>
  <HeroSurface>
    <Hero2ColOverlay>
      <template #left>
        <div class="file-hero-sandbox__copy">
          <div class="file-hero-sandbox__text">
            {{ text }}
          </div>
        </div>
      </template>

      <template #right>
        <div class="file-hero-sandbox__dashboard">
          <div class="file-hero-sandbox__stats">
            <div
              v-for="(stat, index) in normalizedStats"
              :key="`${stat.label}-${index}`"
              class="file-hero-sandbox__stat-card"
            >
              <L3Box :label="stat.label" :value="stat.value" :caption="stat.caption" :tone="stat.tone" />
            </div>
          </div>

          <article class="file-hero-sandbox__health">
            <div class="file-hero-sandbox__health-label">{{ actionLabelText }}</div>
            <div class="file-hero-sandbox__health-text">{{ healthText }}</div>
            <div class="file-hero-sandbox__health-bar">
              <span
                v-for="(segment, index) in normalizedHealthSegments"
                :key="`${segment.tone}-${index}`"
                class="file-hero-sandbox__health-segment"
                :class="`file-hero-sandbox__health-segment--${segment.tone}`"
                :style="{ width: `${segment.width}%` }"
              />
            </div>
            <div v-if="normalizedActionItems.length" class="file-hero-sandbox__action-panel">
              <div class="file-hero-sandbox__action-title">{{ actionTitleText }}</div>
              <div class="file-hero-sandbox__action-list">
                <article
                  v-for="(item, index) in normalizedActionItems"
                  :key="`${item.label}-${index}`"
                  class="file-hero-sandbox__action-item"
                >
                  <div class="file-hero-sandbox__action-item-label">{{ item.label }}</div>
                  <div v-if="item.caption" class="file-hero-sandbox__action-item-caption">{{ item.caption }}</div>
                </article>
              </div>
            </div>
          </article>
        </div>
      </template>
    </Hero2ColOverlay>
  </HeroSurface>
</template>

<script setup>
import { computed } from 'vue'
import Hero2ColOverlay from 'src/components/Hero2ColOverlay.vue'
import HeroSurface from 'src/components/HeroSurface.vue'
import L3Box from 'src/components/L3Box.vue'

defineOptions({ name: 'FileHero' })

const props = defineProps({
  text: {
    type: String,
    default: 'Track the live operating picture for this file and move through core workflows from one surface.',
  },
  stats: {
    type: Array,
    default: () => [],
  },
  healthText: {
    type: String,
    default: 'Healthy structure with active records and recent updates.',
  },
  healthSegments: {
    type: Array,
    default: () => [],
  },
  actionLabel: {
    type: String,
    default: 'File Health',
  },
  actionTitle: {
    type: String,
    default: '',
  },
  actionItems: {
    type: Array,
    default: () => [],
  },
})

const fallbackStats = [
  { label: 'Records', value: '128', caption: 'Tracked in this file', tone: 'neutral' },
  { label: 'Actions', value: '24', caption: 'Ready for review', tone: 'rich' },
  { label: 'Reviews', value: '8', caption: 'Need attention', tone: 'sparse' },
  { label: 'Active', value: '92%', caption: 'Healthy coverage', tone: 'rich' },
]

const fallbackHealthSegments = [
  { tone: 'rich', width: 42 },
  { tone: 'medium', width: 34 },
  { tone: 'sparse', width: 24 },
]

const normalizedStats = computed(() => (props.stats.length ? props.stats : fallbackStats))
const normalizedHealthSegments = computed(() =>
  props.healthSegments.length ? props.healthSegments : fallbackHealthSegments,
)
const normalizedActionItems = computed(() =>
  (Array.isArray(props.actionItems) ? props.actionItems : [])
    .map((item) => ({
      label: String(item?.label || '').trim(),
      caption: String(item?.caption || '').trim(),
    }))
    .filter((item) => item.label),
)
const actionLabelText = computed(() => String(props.actionLabel || '').trim() || 'File Health')
const actionTitleText = computed(() => String(props.actionTitle || '').trim() || 'Open Issues')
</script>

<style scoped>
.file-hero-sandbox__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  min-width: 0;
  height: 100%;
}

.file-hero-sandbox__stat-label,
.file-hero-sandbox__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.file-hero-sandbox__text {
  max-width: 52ch;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-base);
}

.file-hero-sandbox__dashboard {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--ds-space-12);
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.file-hero-sandbox__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
  width: 100%;
}

.file-hero-sandbox__stat-card {
  display: flex;
  min-width: 0;
  min-height: var(--ds-card-min-height-lg);
  padding: 0;
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-card-soft);
  overflow: hidden;
}

.file-hero-sandbox__stat-card :deep(.l3-box) {
  width: 100%;
  min-height: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.file-hero-sandbox__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
  width: 100%;
  min-width: 0;
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-card-soft);
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}

.file-hero-sandbox__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.file-hero-sandbox__health { gap: var(--ds-space-12); }

.file-hero-sandbox__action-panel {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
  min-height: 0;
}

.file-hero-sandbox__action-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.file-hero-sandbox__action-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
}

.file-hero-sandbox__action-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--ds-space-8) var(--ds-space-10);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.58);
}

.file-hero-sandbox__action-item-label {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
}

.file-hero-sandbox__action-item-caption {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-xs);
}

.file-hero-sandbox__health-bar {
  display: flex;
  width: 100%;
  height: var(--ds-size-health-bar);
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.file-hero-sandbox__health-segment {
  display: block;
  height: 100%;
}

.file-hero-sandbox__health-segment--sparse {
  background: var(--ds-color-fill-health-sparse);
}

.file-hero-sandbox__health-segment--medium {
  background: var(--ds-color-fill-health-medium);
}

.file-hero-sandbox__health-segment--rich {
  background: var(--ds-color-fill-health-rich);
}
</style>
