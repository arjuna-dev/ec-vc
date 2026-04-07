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
            :value="stat.value"
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
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(235, 255, 90, 0.32), transparent 34%),
    radial-gradient(circle at bottom left, rgba(255, 85, 33, 0.35), transparent 30%),
    linear-gradient(135deg, #111111 0%, #2c2c2c 45%, #ff5521 100%);
  box-shadow: 0 24px 50px rgba(17, 24, 39, 0.16);
}

.home-dashboard-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.85fr);
  gap: 20px;
  align-items: stretch;
  padding: 22px;
}

.home-dashboard-hero__main,
.home-dashboard-hero__side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.home-dashboard-hero__kicker {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.home-dashboard-hero__count {
  font-family: var(--font-title);
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.home-dashboard-hero__text {
  color: rgba(255, 255, 255, 0.84);
  font-size: 1rem;
}

.home-dashboard-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.home-dashboard-hero__stat,
.home-dashboard-hero__panel {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  padding: 14px 16px;
}

.home-dashboard-hero__stat {
  padding: 0;
  border: 0;
  background: transparent;
  backdrop-filter: none;
}

.home-dashboard-hero__panel-label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-dashboard-hero__panel-value {
  font-size: 1.2rem;
  line-height: 1.2;
}

.home-dashboard-hero__panel-value {
  word-break: break-word;
}

.home-dashboard-hero__chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.home-dashboard-hero__chip {
  background: rgba(255, 255, 255, 0.92) !important;
}

.home-dashboard-hero__chip-value {
  margin-left: 6px;
  font-weight: 700;
}

.home-dashboard-hero__muted {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.95rem;
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
