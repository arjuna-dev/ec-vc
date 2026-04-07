<template>
  <div class="widget-settings-menu">
    <div class="widget-settings-menu__header" @pointerdown.stop="$emit('header-pointerdown', $event)">
      <div class="widget-settings-menu__title">{{ title }}</div>
      <div class="widget-settings-menu__caption">{{ caption }}</div>
    </div>

    <div class="widget-settings-menu__list">
      <section
        v-for="section in sections"
        :key="section.id"
        class="widget-settings-menu__section"
      >
        <button
          type="button"
          class="widget-settings-menu__toggle"
          @click="$emit('toggle-section', section.id)"
        >
          <span class="widget-settings-menu__section-title">{{ section.label }}</span>
          <ToggleRowIcons
            label=""
            :expanded="isSectionOpen(section.id)"
            tone="default"
            :interactive="false"
          />
        </button>

        <template v-if="isSectionOpen(section.id)">
          <div
            v-for="action in section.actions"
            :key="action.id"
            class="widget-settings-menu__row"
          >
            <SettingsCheckbox
              :model-value="action.enabled"
              class="widget-settings-menu__checkbox"
              tone="dark"
              @update:model-value="$emit('set-enabled', action.id, $event)"
            />

            <div class="widget-settings-menu__row-label">{{ action.label }}</div>

            <div class="widget-settings-menu__row-actions">
              <q-btn
                flat
                dense
                round
                :disable="action.orderIndex === 0"
                class="widget-settings-menu__move-button"
                @click.stop="$emit('move-action', action.id, -1)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" class="widget-settings-menu__row-chevron">
                  <path d="M7 14L12 9L17 14" />
                </svg>
              </q-btn>
              <q-btn
                flat
                dense
                round
                :disable="action.orderIndex === section.actions.length - 1"
                class="widget-settings-menu__move-button"
                @click.stop="$emit('move-action', action.id, 1)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" class="widget-settings-menu__row-chevron">
                  <path d="M7 10L12 15L17 10" />
                </svg>
              </q-btn>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
import ToggleRowIcons from 'src/components/ToggleRowIcons.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Widget Settings',
  },
  caption: {
    type: String,
    default: 'Show, hide and reorder files',
  },
  sections: {
    type: Array,
    default: () => [],
  },
  openSectionIds: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['toggle-section', 'set-enabled', 'move-action', 'header-pointerdown'])

function isSectionOpen(sectionId) {
  return props.openSectionIds.includes(sectionId)
}
</script>

<style scoped>
.widget-settings-menu {
  width: var(--ds-widget-settings-width);
  max-width: min(var(--ds-widget-settings-width), calc(100vw - 16px));
  padding: var(--ds-space-4);
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid var(--ds-widget-settings-border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-control);
  backdrop-filter: blur(18px);
}

.widget-settings-menu__header {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-bottom: var(--ds-space-4);
}

.widget-settings-menu__title {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
}

.widget-settings-menu__caption {
  color: var(--ds-widget-settings-caption-color);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-xs);
}

.widget-settings-menu__list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
}

.widget-settings-menu__section {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.widget-settings-menu__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--ds-space-4);
  width: fit-content;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.widget-settings-menu__section-title {
  color: var(--ds-widget-settings-section-title-color);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: 0.06em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.widget-settings-menu__toggle :deep(.toggle-row-icons) {
  color: var(--ds-widget-settings-section-title-color);
}

.widget-settings-menu__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ds-space-8);
  min-height: var(--ds-settings-menu-row-height);
}

.widget-settings-menu__row-label {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
  line-height: var(--ds-line-height-sm);
}

.widget-settings-menu__row-actions {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.widget-settings-menu__move-button {
  min-width: 20px;
  min-height: 20px;
  padding: 0;
  color: var(--ds-widget-settings-button-color);
}

.widget-settings-menu__move-button[disabled] {
  opacity: var(--ds-widget-settings-button-disabled-opacity);
}

.widget-settings-menu__row-chevron {
  width: var(--ds-icon-size-sm);
  height: var(--ds-icon-size-sm);
  stroke: currentColor;
  stroke-width: 1.45;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
