<template>
  <article class="building-block-tile">
    <div v-if="$slots.actions" class="building-block-tile__actions">
      <slot name="actions" />
    </div>

    <div class="building-block-tile__label">{{ label }}</div>
    <div v-if="statusLabel" class="building-block-tile__status" :class="statusClass">
      {{ statusLabel }}
    </div>

    <div class="building-block-tile__title" :class="{ 'building-block-tile__title--placeholder': !title }">
      {{ title || 'Untitled building block' }}
    </div>

    <div v-if="summary" class="building-block-tile__summary">
      {{ summary }}
    </div>

    <div v-if="metaItems.length" class="building-block-tile__meta">
      <div
        v-for="item in metaItems"
        :key="item.label"
        class="building-block-tile__meta-row"
      >
        <div class="building-block-tile__meta-label">{{ item.label }}</div>
        <div class="building-block-tile__meta-value">{{ item.value }}</div>
      </div>
    </div>

    <div v-if="$slots.default" class="building-block-tile__body">
      <slot />
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Building Block' },
  title: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  statusTone: { type: String, default: 'extract' },
  summary: { type: String, default: '' },
  metaItems: {
    type: Array,
    default: () => [],
  },
})

const statusClass = computed(() =>
  props.statusTone === 'canonical'
    ? 'building-block-tile__status--canonical'
    : 'building-block-tile__status--extract',
)
</script>

<style scoped>
.building-block-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
}

.building-block-tile__actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.building-block-tile__label {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-block-tile__status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 20px;
  padding: 0 8px;
  border: 1px solid transparent;
  font-family: var(--font-title);
  font-size: 0.58rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-block-tile__status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.building-block-tile__status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.18);
}

.building-block-tile__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.38rem;
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  letter-spacing: -0.04em;
  max-width: calc(100% - 56px);
}

.building-block-tile__title--placeholder {
  color: rgba(15, 23, 42, 0.45);
}

.building-block-tile__summary {
  color: rgba(15, 23, 42, 0.78);
  font-family: var(--font-body);
  font-size: 0.88rem;
  line-height: 1.45;
}

.building-block-tile__meta {
  display: grid;
  gap: 10px;
}

.building-block-tile__meta-row {
  display: grid;
  gap: 3px;
}

.building-block-tile__meta-label {
  color: rgba(15, 23, 42, 0.54);
  font-family: var(--font-title);
  font-size: 0.62rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.building-block-tile__meta-value {
  color: #0f172a;
  font-family: var(--font-body);
  font-size: 0.82rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.building-block-tile__body {
  margin-top: auto;
}
</style>
