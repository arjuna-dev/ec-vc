<template>
  <div class="card-subsection-toolbar">
    <q-btn-toggle
      :model-value="subsectionModelValue"
      dense
      unelevated
      no-caps
      toggle-color="dark"
      color="white"
      text-color="grey-8"
      class="card-subsection-toolbar__sections"
      :options="subsectionOptions"
      @update:model-value="$emit('update:subsectionModelValue', $event)"
    />

    <q-btn-toggle
      :model-value="contentViewModelValue"
      dense
      unelevated
      toggle-color="primary"
      color="grey-3"
      text-color="grey-8"
      class="card-subsection-toolbar__view-toggle"
      :options="contentViewOptions"
      @update:model-value="$emit('update:contentViewModelValue', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  subsectionModelValue: {
    type: String,
    default: '',
  },
  subsectionOptions: {
    type: Array,
    default: () => [],
  },
  contentViewModelValue: {
    type: String,
    default: 'card',
  },
  contentViewOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:subsectionModelValue', 'update:contentViewModelValue'])
</script>

<style scoped>
.card-subsection-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.card-subsection-toolbar__sections {
  flex: 1 1 auto;
  min-width: 0;
  border-radius: var(--ds-control-radius);
}

.card-subsection-toolbar__sections :deep(.q-btn-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.card-subsection-toolbar__sections :deep(.q-btn) {
  min-height: 24px;
  min-width: 0;
  width: auto;
  padding: 0 8px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: transparent;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.card-subsection-toolbar__sections :deep(.q-btn + .q-btn) {
  margin-left: 0;
}

.card-subsection-toolbar__view-toggle {
  margin-left: auto;
  border-radius: var(--ds-control-radius);
}

.card-subsection-toolbar__view-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.card-subsection-toolbar__view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.card-subsection-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.card-subsection-toolbar__view-toggle :deep(.q-icon) {
  font-size: 13px;
}
</style>
