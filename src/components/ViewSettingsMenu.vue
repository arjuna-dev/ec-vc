<template>
  <div ref="menuRoot" class="view-settings-menu-shell">
    <B10IconButton
      icon="tune"
      variant="subtle"
      size="small"
      :aria-label="title"
      @click="toggleMenu"
    />

    <div v-if="menuOpen" class="view-settings-menu">
      <div class="view-settings-menu__title">{{ title }}</div>

      <div
        v-for="group in groups"
        :key="group.key"
        class="view-settings-menu__group"
      >
        <button
          type="button"
          class="view-settings-menu__heading"
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
          class="view-settings-menu__children"
        >
          <label
            v-for="item in group.items"
            :key="item.key"
            class="view-settings-menu__row"
          >
            <SettingsCheckbox
              :model-value="item.checked"
              tone="light"
              @update:model-value="$emit('toggle-item', item.key, $event)"
            />

            <span class="view-settings-menu__row-label">{{ item.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
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

const menuOpen = ref(false)
const menuRoot = ref(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handlePointerDown(event) {
  const target = event?.target
  if (!target) return
  if (menuRoot.value?.contains?.(target)) return
  menuOpen.value = false
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('pointerdown', handlePointerDown)
})
</script>

<style scoped>
.view-settings-menu-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0;
  overflow: visible;
}

.view-settings-menu-shell :deep(.b10-icon-btn) {
  align-self: center;
  padding: 0 !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  min-height: 18px !important;
}

.view-settings-menu-shell :deep(.q-btn) {
  padding: 0 !important;
}

.view-settings-menu-shell :deep(.q-icon) {
  font-size: 14px !important;
}

.view-settings-menu {
  position: absolute;
  top: calc(100% + var(--ds-space-8));
  right: 0;
  z-index: 20;
  width: max-content;
  min-width: min(220px, calc(100vw - 32px));
  max-width: min(var(--ds-settings-menu-width), calc(100vw - 32px));
  padding: var(--ds-space-10);
  background: var(--ds-color-surface-overlay-strong);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  box-shadow: var(--ds-shadow-card-soft);
}

.view-settings-menu__title {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-settings-menu-title-size);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-line-height-xs);
  margin-bottom: var(--ds-space-10);
}

.view-settings-menu__group + .view-settings-menu__group {
  margin-top: var(--ds-space-10);
}

.view-settings-menu__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: fit-content;
  min-width: 100%;
  padding: 0;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.view-settings-menu__children {
  display: grid;
  gap: var(--ds-space-4);
  margin-top: var(--ds-space-4);
}

.view-settings-menu__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--ds-space-8);
  min-height: var(--ds-settings-menu-row-height);
  padding: var(--ds-space-2) var(--ds-space-4);
}

.view-settings-menu__row-label {
  min-width: 0;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-settings-menu-row-label-size);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}
</style>
