<template>
  <B10Button
    :label="label"
    variant="neutral"
    size="small"
    class="fork-branch-card"
  />
</template>

<script setup>
import B10Button from 'src/components/buttons/B10Button.vue'

defineOptions({ name: 'ForkBranchCard' })

defineProps({
  label: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.fork-branch-card {
  width: auto;
}
</style>
