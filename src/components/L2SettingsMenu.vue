<template>
  <div class="l2-settings-menu">
    <div class="l2-settings-menu__title">{{ title }}</div>

    <div
      v-for="group in groups"
      :key="group.key"
      class="l2-settings-menu__group"
    >
      <button
        type="button"
        class="l2-settings-menu__heading"
        @click="$emit('toggle-group', group.key)"
      >
        <ToggleRowIcons
          :label="group.label"
          :expanded="group.expanded !== false"
          :interactive="false"
        />
      </button>

      <div
        v-if="group.expanded !== false"
        class="l2-settings-menu__children"
      >
        <label
          v-for="item in group.items"
          :key="item.key"
          class="l2-settings-menu__row"
        >
          <q-checkbox
            :model-value="item.checked"
            dense
            size="xs"
            checked-icon="check_box"
            unchecked-icon="check_box_outline_blank"
            @update:model-value="$emit('toggle-item', item.key, $event)"
          />

          <span class="l2-settings-menu__row-label">{{ item.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import ToggleRowIcons from 'src/components/ToggleRowIcons.vue'

defineProps({
  title: {
    type: String,
    default: 'Hero Fields',
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['toggle-group', 'toggle-item'])
</script>

<style scoped>
.l2-settings-menu {
  width: min(280px, 100%);
  padding: var(--ds-space-10);
  background: color-mix(in srgb, var(--ds-color-surface-base) 96%, #f8f8f6 4%);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  box-shadow: var(--ds-shadow-card);
}

.l2-settings-menu__title {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: 0.84rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
}

.l2-settings-menu__group + .l2-settings-menu__group {
  margin-top: var(--ds-space-10);
}

.l2-settings-menu__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.l2-settings-menu__children {
  display: grid;
  gap: var(--ds-space-4);
  margin-top: var(--ds-space-4);
}

.l2-settings-menu__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--ds-space-8);
  min-height: 28px;
  padding: 2px 4px;
}

.l2-settings-menu__row-label {
  min-width: 0;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: 0.76rem;
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.15;
}
</style>
