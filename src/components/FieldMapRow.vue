<template>
  <div
    class="field-map-row"
    :class="{
      'field-map-row--wide': wide,
      'field-map-row--stacked-input': stackedInput,
      'field-map-row--verification-needed': verificationNeeded,
    }"
  >
    <div class="field-map-row__top-row">
      <div class="field-map-row__label-wrap">
        <div class="field-map-row__label">
          {{ label }}
          <q-tooltip v-if="typeHint" anchor="top middle" self="bottom middle">
            {{ typeHint }}
          </q-tooltip>
        </div>
      </div>
      <div class="field-map-row__value-row">
        <slot name="input" />
      </div>
      <div class="field-map-row__action-row">
        <slot name="parent-link" />
        <slot name="action" />
      </div>
    </div>
    <div v-if="$slots.below" class="field-map-row__below-row">
      <slot name="below" />
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
  stackedInput: {
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

.field-map-row__top-row {
  display: grid;
  grid-template-columns: minmax(0, var(--field-map-label-width, 20ch)) minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
}

.field-map-row__label-wrap {
  min-width: 0;
}

.field-map-row__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.field-map-row__value-row {
  min-width: 0;
}

.field-map-row__action-row {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.field-map-row__below-row {
  grid-column: 1 / -1;
}

.field-map-row--stacked-input .field-map-row__below-row {
  grid-column: 1 / span 2;
}
</style>
