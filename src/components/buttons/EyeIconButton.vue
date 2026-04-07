<template>
  <q-btn
    flat
    round
    icon="visibility"
    class="eye-icon-button"
    padding="0"
    :aria-label="ariaLabel"
    :disable="disable"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
defineProps({
  ariaLabel: { type: String, default: 'View row' },
  disable: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<style scoped>
.eye-icon-button {
  width: var(--ds-control-height-sm);
  height: var(--ds-control-height-sm);
  min-width: var(--ds-control-height-sm);
  min-height: var(--ds-control-height-sm);
  padding: 0;
  border-radius: var(--ds-radius-round);
  color: var(--ds-color-text-primary);
}

.eye-icon-button :deep(.q-btn__content) {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.eye-icon-button :deep(.q-icon) {
  display: block;
  font-size: var(--ds-icon-size-sm);
}
</style>
