<template>
  <q-card flat bordered class="home-dashboard-hero">
    <q-card-section class="home-dashboard-hero__content">
      <div class="home-dashboard-hero__main">
        <div class="home-dashboard-hero__kicker">{{ kicker }}</div>
        <div class="home-dashboard-hero__count">{{ count }}</div>
        <div class="home-dashboard-hero__text">{{ text }}</div>

        <div class="home-dashboard-hero__stats">
          <L3Box
            v-for="stat in stats"
            :key="stat.label"
            :label="stat.label"
            :value="String(stat.value ?? '')"
            :caption="stat.caption || ''"
            tone="inverse"
            class="home-dashboard-hero__stat"
          />
        </div>
      </div>

      <div class="home-dashboard-hero__side">
        <div class="home-dashboard-hero__panel">
          <div class="home-dashboard-hero__panel-label">{{ workspaceRootLabel }}</div>
          <div class="home-dashboard-hero__panel-value">{{ workspaceRootValue }}</div>
        </div>

        <div class="home-dashboard-hero__panel">
          <div class="home-dashboard-hero__panel-label">{{ signalsLabel }}</div>
          <div class="home-dashboard-hero__chip-group">
            <q-chip
              v-for="signal in signals"
              :key="signal.label"
              dense
              color="white"
              text-color="black"
              class="home-dashboard-hero__chip"
            >
              {{ signal.label }}
              <span class="home-dashboard-hero__chip-value">{{ signal.value }}</span>
            </q-chip>

            <span v-if="signals.length === 0" class="home-dashboard-hero__muted">
              {{ emptySignalText }}
            </span>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import L3Box from 'src/components/L3Box.vue'

defineProps({
  kicker: { type: String, default: 'Live overview' },
  count: { type: String, default: '...' },
  text: { type: String, default: 'records tracked across the workspace' },
  stats: {
    type: Array,
    default: () => [],
  },
  workspaceRootLabel: { type: String, default: 'Workspace root' },
  workspaceRootValue: { type: String, default: 'Not available' },
  signalsLabel: { type: String, default: 'Most active signals' },
  signals: {
    type: Array,
    default: () => [],
  },
  emptySignalText: { type: String, default: 'Add records to see live signals here.' },
})
</script>

<style scoped>
.home-dashboard-hero {
  overflow: hidden;
  border: none;
  color: var(--ds-color-brand-white);
  background: var(--ds-color-surface-hero-dark);
  box-shadow: var(--ds-shadow-hero-strong);
}

.home-dashboard-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(var(--ds-card-grid-min-width-sm), 0.85fr);
  gap: var(--ds-space-20);
  align-items: stretch;
  padding: var(--ds-panel-padding-lg);
}

.home-dashboard-hero__main,
.home-dashboard-hero__side {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-18);
}

.home-dashboard-hero__kicker {
  font-size: var(--ds-font-size-kicker);
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-color-text-inverse-muted);
}

.home-dashboard-hero__count {
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-display-hero);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.home-dashboard-hero__text {
  color: var(--ds-color-text-inverse-strong);
  font-size: var(--ds-font-size-base);
}

.home-dashboard-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.home-dashboard-hero__stat,
.home-dashboard-hero__panel {
  border: 1px solid var(--ds-color-border-inverse-soft);
  background: var(--ds-color-surface-stat-inverse);
  backdrop-filter: var(--ds-panel-blur-md);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-panel-padding-sm) var(--ds-panel-padding-md);
}

.home-dashboard-hero__stat {
  padding: 0;
  border: 0;
  background: transparent;
  backdrop-filter: none;
}

.home-dashboard-hero__panel-label {
  color: var(--ds-color-text-inverse-muted);
  font-size: var(--ds-font-size-panel-label);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-dashboard-hero__panel-value {
  font-size: var(--ds-font-size-panel-value);
  line-height: 1.2;
}

.home-dashboard-hero__panel-value {
  word-break: break-word;
}

.home-dashboard-hero__chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-8);
  align-items: center;
}

.home-dashboard-hero__chip {
  background: var(--ds-color-surface-overlay-light) !important;
}

.home-dashboard-hero__chip-value {
  margin-left: var(--ds-space-6);
  font-weight: var(--ds-font-weight-bold);
}

.home-dashboard-hero__muted {
  color: var(--ds-color-text-inverse-muted);
  font-size: var(--ds-font-size-body-emphasis);
}

@media (max-width: 900px) {
  .home-dashboard-hero__content {
    grid-template-columns: 1fr;
  }

  .home-dashboard-hero__stats {
    grid-template-columns: 1fr;
  }
}
</style>
