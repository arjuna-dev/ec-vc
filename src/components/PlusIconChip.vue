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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--ds-color-brand-blue);
  color: var(--ds-color-brand-white);
}

.plus-icon-chip--widget {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
}

.plus-icon-chip--compare {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}

.plus-icon-chip__glyph {
  display: block;
  color: inherit;
  font-size: 18px;
  line-height: 1;
  transform: translateY(-0.5px);
}

.plus-icon-chip--compare .plus-icon-chip__glyph {
  font-size: 29.5px;
  transform: translate(-0.6px, 0.05px);
  text-shadow:
    0 0 0 currentColor,
    0.2px 0 0 currentColor,
    -0.2px 0 0 currentColor;
}
</style>
