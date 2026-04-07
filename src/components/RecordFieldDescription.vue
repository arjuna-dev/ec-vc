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
  color: #5c5c5c;
  font-family: var(--ds-font-family-body);
  font-size: 0.68rem;
  line-height: 1;
  text-align: left;
  justify-self: start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
}
</style>
