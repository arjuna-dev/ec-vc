<template>
  <div
    class="field-map-row"
    :class="{
      'field-map-row--wide': wide,
      'field-map-row--verification-needed': verificationNeeded,
    }"
  >
    <div class="field-map-row__label-row">
      <div class="field-map-row__label-wrap">
        <div class="field-map-row__label">
          {{ label }}
          <q-tooltip v-if="typeHint" anchor="top middle" self="bottom middle">
            {{ typeHint }}
          </q-tooltip>
        </div>
      </div>
      <slot name="parent-link" />
    </div>

    <div class="field-map-row__value-row">
      <slot name="input" />
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'FieldMapRow' })

defineProps({
  label: {
    type: String,
    default: 'Field',
  },
  typeHint: {
    type: String,
    default: '',
  },
  wide: {
    type: Boolean,
    default: false,
  },
  verificationNeeded: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.field-map-row {
  display: grid;
  gap: 8px;
  align-content: start;
}

.field-map-row--wide {
  grid-column: 1 / -1;
}

.field-map-row__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-map-row__label-wrap {
  min-width: 0;
}

.field-map-row__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
}

.field-map-row__value-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
}
</style>
