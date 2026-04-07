<template>
  <q-icon name="expand_more" class="dropdown-chevron" :class="`dropdown-chevron--${tone}`" />
</template>

<script setup>
defineProps({
  tone: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'light'].includes(value),
  },
})
</script>

<style scoped>
.dropdown-chevron {
  font-size: var(--ds-icon-size-md);
  line-height: 1;
}

.dropdown-chevron--dark {
  color: var(--ds-color-text-primary);
}

.dropdown-chevron--light {
  color: var(--ds-color-brand-white);
}
</style>
