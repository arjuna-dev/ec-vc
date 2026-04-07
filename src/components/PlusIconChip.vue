<template>
  <span
    class="plus-icon-chip"
    :class="[`plus-icon-chip--${size}`]"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <span class="plus-icon-chip__glyph">+</span>
  </span>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['md'].includes(value),
  },
  decorative: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.plus-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  border-radius: 50%;
  background: var(--ds-color-brand-blue);
  color: var(--ds-color-brand-white);
}

.plus-icon-chip__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  font-family: var(--ds-font-title);
  font-size: 18px;
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.04em;
  transform: translate(-0.25px, -0.75px);
}
</style>
