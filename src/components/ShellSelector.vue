<template>
  <div v-if="options.length" class="shell-selector">
    <q-select
      :model-value="modelValue"
      dense
      borderless
      emit-value
      map-options
      hide-bottom-space
      hide-dropdown-icon
      :options="options"
      popup-content-class="shell-selector__menu"
      class="shell-selector__control"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #selected-item="scope">
        <ValueChipSurface tone="default" size="small" class="shell-selector__surface">
          <span class="shell-selector__value">{{ scope.opt.label }}</span>
          <DropdownChevron tone="light" />
        </ValueChipSurface>
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps" class="shell-selector__option">
          <q-item-section>
            <span class="shell-selector__option-label">{{ scope.opt.label }}</span>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup>
import DropdownChevron from 'src/components/DropdownChevron.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

defineOptions({ name: 'ShellSelector' })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.shell-selector {
  display: inline-flex;
  min-width: 0;
}

.shell-selector__control {
  min-width: 0;
}

.shell-selector__surface {
  min-width: 0;
}

.shell-selector__value {
  color: var(--ds-color-brand-white);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
  white-space: nowrap;
}

.shell-selector__option-label {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.2;
}
</style>
