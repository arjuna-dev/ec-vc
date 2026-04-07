<template>
  <button
    type="button"
    class="page-back-symbol"
    :aria-label="ariaLabel"
    @click="emit('click', $event)"
  >
    <q-icon :name="icon" class="page-back-symbol__icon" />
    <span class="page-back-symbol__label">{{ label }}</span>
  </button>
</template>

<script setup>
const emit = defineEmits(['click'])

defineProps({
  label: {
    type: String,
    default: 'Back',
  },
  ariaLabel: {
    type: String,
    default: 'Back',
  },
  icon: {
    type: String,
    default: 'west',
  },
})
</script>

<style scoped>
.page-back-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-8);
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-brand-black);
  cursor: pointer;
  font-family: var(--ds-font-title);
  font-size: 0.84rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.02em;
}

.page-back-symbol__label {
  white-space: nowrap;
}

.page-back-symbol__icon {
  font-size: 18px;
}
</style>
