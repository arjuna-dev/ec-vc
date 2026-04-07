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
    default: '24px',
  },
  iconClass: {
    type: [String, Array, Object],
    default: '',
  },
})
</script>

<style scoped>
.main-menu-row-icon {
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
</style>
