<template>
  <div class="live-action-l1">
    <q-select
      ref="selectRef"
      :model-value="modelValue"
      dense
      :dark="tone === 'inverse'"
      :options-dark="tone === 'inverse'"
      borderless
      hide-bottom-space
      emit-value
      map-options
      hide-dropdown-icon
      :options="options"
      popup-content-class="live-action-l1__menu"
      class="live-action-l1__select"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #selected-item="scope">
        <ValueChip :label="scope.opt.label" :tone="tone === 'inverse' ? 'inverse' : 'default'" />
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps" class="live-action-l1__menu-item">
          <q-item-section>
            <ValueChip :label="scope.opt.label" tone="menu" />
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <button type="button" class="live-action-l1__chevron-button" aria-label="Open selector" @click.stop="openMenu">
      <DropdownChevron :tone="tone === 'inverse' ? 'dark' : 'dark'" class="live-action-l1__chevron" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DropdownChevron from 'src/components/DropdownChevron.vue'
import ValueChip from 'src/components/ValueChip.vue'

const selectRef = ref(null)

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  tone: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'inverse'].includes(value),
  },
})

defineEmits(['update:modelValue'])

function openMenu() {
  const select = selectRef.value
  if (!select) return
  if (typeof select.showPopup === 'function') {
    select.showPopup()
    return
  }
  if (typeof select.focus === 'function') {
    select.focus()
  }
}
</script>

<style scoped>
.live-action-l1 {
  display: inline-flex;
  align-items: flex-end;
  gap: var(--ds-space-4);
  overflow: visible;
}

.live-action-l1__select {
  flex: 1 1 auto;
  width: auto;
  min-width: min(var(--ds-live-action-width), 100%);
  max-width: 100%;
}

.live-action-l1__select :deep(.q-field__control) {
  min-height: var(--ds-control-height-xl);
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.live-action-l1__select :deep(.q-field__native),
.live-action-l1__select :deep(.q-field__marginal) {
  color: var(--ds-color-brand-white) !important;
}

.live-action-l1__chevron-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-icon-size-md);
  height: var(--ds-icon-size-md);
  padding: 0;
  margin-bottom: var(--ds-space-4);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.live-action-l1__chevron {
  flex: 0 0 auto;
}

.live-action-l1__menu {
  background: var(--ds-color-surface-base) !important;
  box-shadow: var(--ds-shadow-card-soft) !important;
  border: 1px solid var(--ds-color-border-default) !important;
  border-radius: var(--ds-live-action-menu-radius);
}

.live-action-l1__menu :deep(.q-virtual-scroll__content),
.live-action-l1__menu :deep(.q-menu),
.live-action-l1__menu :deep(.q-list) {
  background: var(--ds-color-surface-base) !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0;
}

.live-action-l1__menu-item,
.live-action-l1__menu :deep(.q-item) {
  min-height: var(--ds-live-action-menu-item-height);
  padding: var(--ds-live-action-menu-item-padding-y) var(--ds-live-action-menu-item-padding-x);
  color: var(--ds-color-brand-white);
  background: transparent;
}

.live-action-l1__menu-item.q-manual-focusable--focused,
.live-action-l1__menu-item.q-item--active,
.live-action-l1__menu :deep(.q-item.q-manual-focusable--focused),
.live-action-l1__menu :deep(.q-item--active) {
  background: transparent;
}
</style>
