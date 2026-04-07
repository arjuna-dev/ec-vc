<template>
  <div class="record-field-label">{{ label }}</div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Industry',
  },
})
</script>

<style scoped>
.record-field-label {
  display: inline-flex;
  width: fit-content;
  justify-self: start;
  padding: 7px 10px;
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  background: #111;
  border: 1px solid #111;
  border-radius: 4px;
}
</style>
