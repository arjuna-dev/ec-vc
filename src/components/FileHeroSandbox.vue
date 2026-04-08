<template>
  <HeroSandboxSurface>
    <Hero2ColOverlay>
      <template #left>
        <div class="file-hero-sandbox__copy">
          <RecordTitle class="file-hero-sandbox__title" title="Companies" />
          <div class="file-hero-sandbox__text">
            Track the live operating picture for this file and move through core workflows from one surface.
          </div>
        </div>
      </template>

      <template #right>
        <div class="file-hero-sandbox__dashboard">
          <div class="file-hero-sandbox__stats">
            <div class="file-hero-sandbox__stat-card">
              <L3Box label="Records" value="128" caption="Tracked in this file" />
            </div>
            <div class="file-hero-sandbox__stat-card">
              <L3Box label="Actions" value="24" caption="Ready for review" />
            </div>
            <div class="file-hero-sandbox__stat-card">
              <L3Box label="Reviews" value="8" caption="Need attention" />
            </div>
            <div class="file-hero-sandbox__stat-card">
              <L3Box label="Active" value="92%" caption="Healthy coverage" />
            </div>
          </div>

          <article class="file-hero-sandbox__health">
            <div class="file-hero-sandbox__health-label">File Health</div>
            <div class="file-hero-sandbox__health-text">Healthy structure with active records and recent updates.</div>
            <div class="file-hero-sandbox__health-bar">
              <span class="file-hero-sandbox__health-segment file-hero-sandbox__health-segment--rich" style="width: 42%" />
              <span class="file-hero-sandbox__health-segment file-hero-sandbox__health-segment--medium" style="width: 34%" />
              <span class="file-hero-sandbox__health-segment file-hero-sandbox__health-segment--sparse" style="width: 24%" />
            </div>
          </article>
        </div>
      </template>
    </Hero2ColOverlay>
  </HeroSandboxSurface>
</template>

<script setup>
import Hero2ColOverlay from 'src/components/Hero2ColOverlay.vue'
import HeroSandboxSurface from 'src/components/HeroSandboxSurface.vue'
import L3Box from 'src/components/L3Box.vue'
import RecordTitle from 'src/components/RecordTitle.vue'

defineOptions({ name: 'FileHeroSandbox' })
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

.file-hero-sandbox__title {
  margin-top: 38px;
  max-width: 12ch;
}

.file-hero-sandbox__text {
  margin-top: auto;
  max-width: 52ch;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-base);
}

.file-hero-sandbox__dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  width: 100%;
  min-width: 0;
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
}

.file-hero-sandbox__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.file-hero-sandbox__health {
  margin-top: auto;
  gap: var(--ds-space-12);
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
