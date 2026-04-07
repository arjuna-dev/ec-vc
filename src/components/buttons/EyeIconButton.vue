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
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  border-radius: 50%;
  color: rgba(17, 17, 17, 0.82);
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
  font-size: 16px;
  transform: translateY(0.5px);
}
</style>
