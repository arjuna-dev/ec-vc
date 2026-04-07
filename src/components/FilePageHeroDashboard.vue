<template>
  <div
    class="file-page-hero"
    :style="heroStyle"
    @pointerenter="onPointerEnter"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div class="file-page-hero__copy" :style="copyStyle">
      <div class="file-page-hero__eyebrow">{{ eyebrow }}</div>
      <h2 class="file-page-hero__title">{{ title }}</h2>
      <p class="file-page-hero__text">{{ text }}</p>
    </div>

    <div class="file-page-hero__dashboard">
      <div class="file-page-hero__stats">
        <article
          v-for="stat in stats"
          :key="stat.label"
          class="file-page-hero__stat"
          :class="`file-page-hero__stat--${stat.tone || 'neutral'}`"
        >
          <div class="file-page-hero__stat-label">{{ stat.label }}</div>
          <div class="file-page-hero__stat-value">{{ stat.value }}</div>
          <div class="file-page-hero__stat-caption">{{ stat.caption }}</div>
        </article>
      </div>

      <div class="file-page-hero__health">
        <div class="file-page-hero__health-copy">
          <div class="file-page-hero__health-label">{{ healthLabel }}</div>
          <div class="file-page-hero__health-text">{{ healthText }}</div>
        </div>

        <div class="file-page-hero__health-bar" aria-hidden="true">
          <span
            v-for="segment in healthSegments"
            :key="segment.tone"
            class="file-page-hero__health-segment"
            :class="`file-page-hero__health-segment--${segment.tone}`"
            :style="{ width: `${segment.width}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: { type: String, default: 'Dashboard' },
  title: { type: String, required: true },
  text: { type: String, required: true },
  stats: { type: Array, default: () => [] },
  healthLabel: { type: String, required: true },
  healthText: { type: String, required: true },
  healthSegments: { type: Array, default: () => [] },
  copyJustify: { type: String, default: 'space-between' },
  heroTextMaxWidth: { type: String, default: '52ch' },
  eyebrowLetterSpacing: { type: String, default: '0.12em' },
  statLabelLetterSpacing: { type: String, default: '0.08em' },
})

const heroStyle = computed(() => ({
  '--file-page-hero-text-max-width': props.heroTextMaxWidth,
  '--file-page-hero-eyebrow-spacing': props.eyebrowLetterSpacing,
  '--file-page-hero-stat-spacing': props.statLabelLetterSpacing,
}))

const copyStyle = computed(() => ({
  justifyContent: props.copyJustify,
}))

function onPointerEnter(event) {
  updateGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}

function onPointerMove(event) {
  updateGradientPosition(event)
}

function onPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--hero-dashboard-blob-opacity', '0')
}

function updateGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return

  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}
</script>

<style scoped>
.file-page-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  box-shadow: var(--ds-shadow-card-soft);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.file-page-hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.file-page-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.file-page-hero > * {
  position: relative;
  z-index: 1;
}

.file-page-hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  min-width: 0;
}

.file-page-hero__eyebrow,
.file-page-hero__stat-label,
.file-page-hero__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.file-page-hero__eyebrow {
  letter-spacing: var(--file-page-hero-eyebrow-spacing);
}

.file-page-hero__stat-label,
.file-page-hero__health-label {
  letter-spacing: var(--file-page-hero-stat-spacing);
}

.file-page-hero__title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 12ch;
}

.file-page-hero__text {
  margin: auto 0 0;
  display: flex;
  align-items: flex-end;
  max-width: var(--file-page-hero-text-max-width);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.file-page-hero__dashboard {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ds-space-12);
}

.file-page-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.file-page-hero__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-8);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-card-soft);
}

.file-page-hero__stat--neutral {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.file-page-hero__stat--rich {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.file-page-hero__stat--sparse {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.file-page-hero__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
}

.file-page-hero__stat-caption,
.file-page-hero__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.file-page-hero__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-light);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
}

.file-page-hero__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.file-page-hero__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.file-page-hero__health-segment {
  display: block;
  height: 100%;
}

.file-page-hero__health-segment--sparse {
  background: #ff5521;
}

.file-page-hero__health-segment--medium {
  background: #ebff5a;
}

.file-page-hero__health-segment--rich {
  background: #2647ff;
}

@media (max-width: 900px) {
  .file-page-hero {
    grid-template-columns: 1fr;
  }
}
</style>
