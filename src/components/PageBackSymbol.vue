<template>
  <button
    type="button"
    class="page-back-symbol"
    :aria-label="ariaLabel"
    @click="emit('click', $event)"
  >
    <WestIcon
      :icon="icon"
      class="page-back-symbol__icon"
    />
    <PageBackLabel :label="label" />
  </button>
</template>

<script setup>
import PageBackLabel from 'src/components/PageBackLabel.vue'
import WestIcon from 'src/components/WestIcon.vue'

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
  min-height: 32px;
  padding: 0 var(--ds-space-8) 0 var(--ds-space-4);
  border: 0;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-surface-base);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.page-back-symbol:hover,
.page-back-symbol:focus-visible {
  background: var(--ds-color-surface-subtle);
}

.page-back-symbol:focus-visible {
  outline: none;
}

.page-back-symbol__icon {
  flex: 0 0 auto;
  font-size: var(--ds-icon-size-sm);
}
</style>
