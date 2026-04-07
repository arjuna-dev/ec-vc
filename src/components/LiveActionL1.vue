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
    <DropdownChevron class="live-action-l1__chevron" @click.stop="openMenu" />
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
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-right: 18px;
  overflow: visible;
}

.live-action-l1__select {
  width: min(220px, 100%);
  min-width: 0;
}

.live-action-l1__select :deep(.q-field__control) {
  min-height: 40px;
  padding: 0 4px 0 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.live-action-l1__select :deep(.q-field__native),
.live-action-l1__select :deep(.q-field__marginal) {
  color: #fff !important;
}

.live-action-l1__chevron {
  position: absolute;
  right: -4px;
  bottom: -2px;
  z-index: 2;
  cursor: pointer;
}

.live-action-l1__menu {
  background: #ffffff !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14) !important;
  border: 1px solid rgba(17, 17, 17, 0.08) !important;
}

.live-action-l1__menu :deep(.q-virtual-scroll__content),
.live-action-l1__menu :deep(.q-menu),
.live-action-l1__menu :deep(.q-list) {
  background: #ffffff !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0;
}

.live-action-l1__menu-item,
.live-action-l1__menu :deep(.q-item) {
  min-height: 34px;
  padding: 4px 6px;
  color: #ffffff;
  background: transparent;
}

.live-action-l1__menu-item.q-manual-focusable--focused,
.live-action-l1__menu-item.q-item--active,
.live-action-l1__menu :deep(.q-item.q-manual-focusable--focused),
.live-action-l1__menu :deep(.q-item--active) {
  background: transparent;
}
</style>
