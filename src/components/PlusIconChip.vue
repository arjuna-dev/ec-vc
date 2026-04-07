<template>
  <span
    class="plus-icon-chip"
    :class="[`plus-icon-chip--${size}`]"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <q-icon name="add" class="plus-icon-chip__glyph" />
  </span>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'widget',
    validator: (value) => ['widget', 'compare'].includes(value),
  },
  decorative: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.plus-icon-chip {
  --plus-icon-chip-size: 22px;
  --plus-icon-chip-glyph-size: var(--ds-icon-size-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--plus-icon-chip-size);
  height: var(--plus-icon-chip-size);
  min-width: var(--plus-icon-chip-size);
  min-height: var(--plus-icon-chip-size);
  border-radius: var(--ds-radius-round);
  background: var(--ds-color-brand-blue);
  color: var(--ds-color-brand-white);
}

.plus-icon-chip--widget {
  --plus-icon-chip-size: 22px;
  --plus-icon-chip-glyph-size: var(--ds-icon-size-sm);
}

.plus-icon-chip--compare {
  --plus-icon-chip-size: 36px;
  --plus-icon-chip-glyph-size: 29.5px;
}

.plus-icon-chip__glyph {
  display: block;
  color: inherit;
  font-size: var(--plus-icon-chip-glyph-size);
  line-height: 1;
  transform: translate(-0.2px, -0.45px);
}

.plus-icon-chip--compare .plus-icon-chip__glyph {
  transform: translate(-0.6px, 0.05px);
  text-shadow:
    0 0 0 currentColor,
    0.2px 0 0 currentColor,
    -0.2px 0 0 currentColor;
}
</style>
