<template>
  <div class="building-block-tile-header">
    <div v-if="$slots.leading" class="building-block-tile-header__leading">
      <slot name="leading" />
    </div>

    <div class="building-block-tile-header__main">
      <div class="building-block-tile-header__label-row">
        <div class="building-block-tile-header__label">{{ title }}</div>
        <div v-if="graphLabel" class="building-block-tile-header__graph">{{ graphLabel }}</div>
        <div v-if="shellsLabel" class="building-block-tile-header__shells">{{ shellsLabel }}</div>
        <button
          type="button"
          class="building-block-tile-header__collapse-toggle"
          :aria-label="collapsed ? 'Expand block tile' : 'Collapse block tile'"
          @click="$emit('toggle-collapse')"
        >
          <q-icon :name="collapsed ? 'expand_more' : 'expand_less'" size="16px" />
        </button>
      </div>

      <div v-if="!collapsed && statusLabel" class="building-block-tile-header__status" :class="statusClass">{{ statusLabel }}</div>
    </div>

    <div v-if="$slots.actions" class="building-block-tile-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  graphLabel: { type: String, default: '' },
  shellsLabel: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  statusClass: { type: [String, Array, Object], default: '' },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['toggle-collapse'])
</script>

<style scoped>
.building-block-tile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
}

.building-block-tile-header__leading {
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 0 0 auto;
}

.building-block-tile-header__main {
  display: grid;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.building-block-tile-header__label-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

.building-block-tile-header__label {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--ds-font-title);
  font-size: 0.86rem;
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: -0.02em;
  line-height: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
}

.building-block-tile-header__collapse-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.building-block-tile-header__graph {
  color: rgba(15, 23, 42, 0.52);
  font-family: var(--ds-font-title);
  font-size: 0.62rem;
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.04em;
  line-height: 1;
  white-space: nowrap;
  flex: 0 0 auto;
}

.building-block-tile-header__shells {
  color: rgba(15, 23, 42, 0.52);
  font-family: var(--ds-font-title);
  font-size: 0.62rem;
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.04em;
  line-height: 1;
  white-space: nowrap;
  flex: 0 0 auto;
}

.building-block-tile-header__status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 20px;
  padding: 0 8px;
  border: 1px solid transparent;
  font-family: var(--ds-font-title);
  font-size: 0.58rem;
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-block-tile-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  flex-shrink: 0;
  min-width: max-content;
}
</style>
