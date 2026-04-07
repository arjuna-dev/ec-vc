<template>
  <q-icon
    :name="icon"
    :size="size"
    class="west-icon"
  />
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'west',
  },
  size: {
    type: String,
    default: '16px',
  },
})
</script>

<style scoped>
.west-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-brand-black);
  line-height: 1;
}
</style>
