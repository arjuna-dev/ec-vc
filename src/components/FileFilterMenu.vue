<template>
  <div class="file-filter-menu">
    <div class="file-filter-menu__title">{{ title }}</div>

    <div class="file-filter-menu__rows">
      <div
        v-for="section in sections"
        :key="section.key"
        class="file-filter-menu__group"
      >
        <button
          type="button"
          class="file-filter-menu__heading"
          @click="$emit('toggle-section', section.key)"
        >
          <span class="file-filter-menu__heading-label">{{ section.label }}</span>
          <span class="file-filter-menu__heading-meta">{{ section.count }}</span>
          <ToggleRowIcons :expanded="expandedSectionKey !== section.key" label="" />
        </button>

        <div
          v-if="expandedSectionKey === section.key"
          class="file-filter-menu__children"
        >
          <button
            v-for="item in section.items"
            :key="item.key"
            type="button"
            class="file-filter-menu__child-row"
            :class="{ 'file-filter-menu__child-row--selected': item.selected }"
            @click="$emit('toggle-item', item.key)"
          >
            <SettingsCheckbox
              :model-value="item.selected"
              tone="dark"
              @update:model-value="$emit('toggle-item-checkbox', { key: item.key, value: $event })"
              @click.stop
            />
            <span class="file-filter-menu__child-label">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
import ToggleRowIcons from 'src/components/ToggleRowIcons.vue'

defineProps({
  title: {
    type: String,
    default: 'File Filter',
  },
  sections: {
    type: Array,
    default: () => [],
  },
  expandedSectionKey: {
    type: String,
    default: '',
  },
})

defineEmits(['toggle-section', 'toggle-item', 'toggle-item-checkbox'])
</script>

<style scoped>
.file-filter-menu {
  display: inline-flex;
  flex-direction: column;
  gap: var(--ds-space-10);
  min-width: 240px;
  padding: var(--ds-space-12);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-mini);
  background: var(--ds-color-brand-black);
}

.file-filter-menu__title {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
}

.file-filter-menu__rows {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
}

.file-filter-menu__group {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-6);
}

.file-filter-menu__heading {
  display: flex;
  align-items: center;
  gap: var(--ds-space-8);
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-brand-white);
  cursor: pointer;
}

.file-filter-menu__heading-label {
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
  text-transform: uppercase;
}

.file-filter-menu__heading-meta {
  color: color-mix(in srgb, var(--ds-color-brand-white) 68%, transparent);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
}

.file-filter-menu__heading :deep(.toggle-row-icons) {
  margin-left: auto;
  color: inherit;
}

.file-filter-menu__heading :deep(.toggle-row-icons--toggle) {
  color: inherit;
}

.file-filter-menu__children {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-6);
}

.file-filter-menu__child-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-8);
  width: 100%;
  min-height: var(--ds-control-height-sm);
  padding: 0;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--ds-color-brand-white) 78%, transparent);
  cursor: pointer;
}

.file-filter-menu__child-row--selected {
  color: var(--ds-color-brand-white);
}

.file-filter-menu__child-label {
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.2;
}
</style>
