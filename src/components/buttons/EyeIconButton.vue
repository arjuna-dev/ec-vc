<template>
  <q-btn
    flat
    round
    dense
    icon="visibility"
    class="eye-icon-button"
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
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  color: rgba(17, 17, 17, 0.82);
}

.eye-icon-button :deep(.q-icon) {
  font-size: 16px;
}
</style>
