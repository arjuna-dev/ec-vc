<template>
  <div ref="menuRoot" class="l2-settings-menu-shell">
    <B10IconButton
      icon="tune"
      variant="subtle"
      size="small"
      :aria-label="title"
      @click="toggleMenu"
    />

    <div v-if="menuOpen" class="l2-settings-menu">
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
            <SettingsCheckbox
              :model-value="item.checked"
              tone="light"
              @update:model-value="$emit('toggle-item', item.key, $event)"
            />

            <span class="l2-settings-menu__row-label">{{ item.label }}</span>
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
.l2-settings-menu-shell {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  height: 100%;
  padding: 0;
}

.l2-settings-menu-shell :deep(.b10-icon-btn) {
  align-self: stretch;
  height: 100%;
  padding: 0 !important;
}

.l2-settings-menu-shell :deep(.q-btn) {
  padding: 0 !important;
}

.l2-settings-menu {
  position: absolute;
  top: calc(100% + var(--ds-space-8));
  right: 0;
  z-index: 20;
  width: fit-content;
  max-width: min(var(--ds-settings-menu-width), 100%);
  padding: var(--ds-space-10);
  background: var(--ds-color-surface-overlay-strong);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  box-shadow: var(--ds-shadow-card-soft);
}

.l2-settings-menu__title {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-settings-menu-title-size);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-line-height-xs);
  margin-bottom: var(--ds-space-10);
}

.l2-settings-menu__group + .l2-settings-menu__group {
  margin-top: var(--ds-space-10);
}

.l2-settings-menu__heading {
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
  min-height: var(--ds-settings-menu-row-height);
  padding: var(--ds-space-2) var(--ds-space-4);
}

.l2-settings-menu__row-label {
  min-width: 0;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-settings-menu-row-label-size);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

</style>
