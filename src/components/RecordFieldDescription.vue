<template>
  <div class="record-field-description">{{ description }}</div>
</template>

<script setup>
defineProps({
  description: {
    type: String,
    default: 'General',
  },
})
</script>

<style scoped>
.record-field-description {
  display: inline-flex;
  align-items: flex-end;
  align-self: end;
  padding: 0 10px 1px 0;
  color: var(--ds-color-brand-dark-grey);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
  text-align: left;
  justify-self: start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
}
</style>
