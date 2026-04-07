<template>
  <div class="main-menu-row">
    <MainMenuRowIcon
      :icon="icon"
      :icon-size="iconSize"
      :icon-class="iconClass"
    />
    <MainMenuRowLabel :label="label" />
  </div>
</template>

<script setup>
import MainMenuRowIcon from 'src/components/MainMenuRowIcon.vue'
import MainMenuRowLabel from 'src/components/MainMenuRowLabel.vue'

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
  label: {
    type: String,
    default: 'System Files',
  },
})
</script>

<style scoped>
.main-menu-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--ds-space-8);
  width: 100%;
  min-height: 24px;
  padding: 0 var(--ds-space-8);
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border: 0;
  border-radius: var(--ds-radius-sm);
}
</style>
