<template>
  <q-btn
    flat
    dense
    round
    icon="menu"
    class="main-menu-icon-button"
    :aria-label="ariaLabel"
    :disable="disable"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
defineProps({
  ariaLabel: {
    type: String,
    default: 'Menu',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.main-menu-icon-button {
  color: var(--ds-color-brand-black);
}
</style>
