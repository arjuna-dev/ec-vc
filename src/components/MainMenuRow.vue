<template>
  <div class="main-menu-row">
    <q-icon
      :name="icon"
      :size="iconSize"
      class="main-menu-row__icon"
      :class="iconClass"
    />
    <span class="main-menu-row__label">{{ label }}</span>
  </div>
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
  min-height: 26px;
  padding: 0 var(--ds-space-8);
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
  border: 0;
  border-radius: var(--ds-radius-sm);
}

.main-menu-row__icon {
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.main-menu-row__label {
  flex: 1 1 auto;
  color: inherit;
  font-family: var(--ds-font-body);
  font-size: 13px;
  font-weight: var(--ds-font-weight-light);
  line-height: 1.2;
}
</style>
