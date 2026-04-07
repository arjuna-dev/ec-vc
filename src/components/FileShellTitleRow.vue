<template>
  <div class="file-shell-title-row">
    <PageTitleText :title="title" />
    <PageBackSymbol
      v-if="showBack"
      :label="backLabel"
      :aria-label="backAriaLabel"
      @click="$emit('back')"
    />
  </div>
</template>

<script setup>
import PageBackSymbol from 'src/components/PageBackSymbol.vue'
import PageTitleText from 'src/components/PageTitleText.vue'

defineProps({
  title: {
    type: String,
    default: '',
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  backLabel: {
    type: String,
    default: 'Back',
  },
  backAriaLabel: {
    type: String,
    default: 'Back',
  },
})

defineEmits(['back'])
</script>

<style scoped>
.file-shell-title-row {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-8);
  min-width: 0;
  flex: 0 1 auto;
}
</style>
