<template>
  <q-btn
    flat
    round
    dense
    icon="filter_list"
    aria-label="File shell filters"
    class="filter-list-icon"
    :disable="disable"
    @click="$emit('click', $event)"
  />
</template>

<script setup>
defineProps({
  disable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.filter-list-icon {
  color: var(--ds-color-text-muted);
}
</style>
