<template>
  <q-icon
    :name="icon"
    :size="iconSize"
    class="main-menu-row-icon"
    :class="iconClass"
  />
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'folder_open',
  },
  iconSize: {
    type: String,
    default: 'var(--ds-icon-size-md)',
  },
  iconClass: {
    type: [String, Array, Object],
    default: '',
  },
})
</script>

<style scoped>
.main-menu-row-icon {
  flex: 0 0 var(--ds-nav-row-icon-lane);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
</style>
