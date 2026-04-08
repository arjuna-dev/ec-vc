<template>
  <div class="add-edit-bb-shell-header-frame">
    <div class="add-edit-bb-shell-header-frame__title-block">
      <RecordTitle :title="title" />
    </div>
    <div class="add-edit-bb-shell-header-frame__code-box">
      <BbCodeInput
        :model-value="bbCode"
        placeholder="Enter bb:code"
        @update:model-value="$emit('update:bbCode', $event)"
        @enter="$emit('enter')"
      />
    </div>
    <div class="add-edit-bb-shell-header-frame__search-box">
      <SearchBarInput
        :model-value="searchValue"
        placeholder="Search"
        @update:model-value="$emit('update:searchValue', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import BbCodeInput from 'src/components/BbCodeInput.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'

defineOptions({ name: 'AddEditBbShellHeaderFrame' })

defineProps({
  title: { type: String, default: 'Add/Edit BB' },
  bbCode: { type: String, default: '' },
  searchValue: { type: String, default: '' },
})

defineEmits(['update:bbCode', 'update:searchValue', 'enter'])
</script>

<style scoped>
.add-edit-bb-shell-header-frame {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.add-edit-bb-shell-header-frame__title-block {
  min-width: 0;
  flex: 1 1 auto;
}

.add-edit-bb-shell-header-frame__code-box,
.add-edit-bb-shell-header-frame__search-box {
  width: 144px;
  min-width: 144px;
  flex: 0 0 144px;
}

.add-edit-bb-shell-header-frame__code-box :deep(.bb-code-input),
.add-edit-bb-shell-header-frame__search-box :deep(.search-bar-input) {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.add-edit-bb-shell-header-frame__search-box :deep(.q-field__control),
.add-edit-bb-shell-header-frame__search-box :deep(.q-field__native),
.add-edit-bb-shell-header-frame__search-box :deep(.q-field__input) {
  min-height: calc(var(--ds-control-height-md) * 0.85);
  height: calc(var(--ds-control-height-md) * 0.85);
}

.add-edit-bb-shell-header-frame__search-box :deep(.q-field__control) {
  border-radius: var(--ds-radius-micro);
}

.add-edit-bb-shell-header-frame__search-box :deep(.q-field__input),
.add-edit-bb-shell-header-frame__search-box :deep(.q-field__native) {
  font-size: var(--ds-font-size-xs);
  text-align: left;
}
</style>
