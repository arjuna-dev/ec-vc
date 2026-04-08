<template>
  <label class="artifact-row">
    <q-checkbox
      :model-value="selected"
      dense
      size="xs"
      checked-icon="check_box"
      unchecked-icon="check_box_outline_blank"
      class="artifact-row__checkbox"
      @update:model-value="$emit('update:selected', $event)"
    />
    <div class="artifact-row__preview">
      <q-icon :name="icon" class="artifact-row__icon" />
    </div>
    <span class="artifact-row__name">{{ name }}</span>
    <span class="artifact-row__size">{{ size }}</span>
  </label>
</template>

<script setup>
defineOptions({ name: 'ArtifactRow' })

defineProps({
  selected: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'description',
  },
  name: {
    type: String,
    default: 'Artifact.pdf',
  },
  size: {
    type: String,
    default: '240 KB',
  },
})

defineEmits(['update:selected'])
</script>

<style scoped>
.artifact-row {
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 5px;
  padding: 8px 8px 6px;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
  box-sizing: border-box;
}

.artifact-row__checkbox {
  position: absolute;
  top: -7px;
  left: -7px;
  margin: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 999px;
}

.artifact-row__preview {
  display: grid;
  place-items: center;
  width: 58px;
  height: 68px;
  background: rgba(248, 248, 246, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 6px;
}

.artifact-row__icon {
  color: var(--ds-color-brand-black);
  font-size: 2rem;
}

.artifact-row__name {
  width: 100%;
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artifact-row__size {
  color: rgba(17, 17, 17, 0.55);
  font-family: var(--ds-font-body);
  font-size: 0.68rem;
  line-height: 1.2;
}
</style>
