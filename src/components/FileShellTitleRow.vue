<template>
  <div class="file-shell-title-row">
    <div class="file-shell-title-row__leading">
      <PageTitleText :title="title" />
      <PageBackSymbol
        v-if="showBack"
        :label="backLabel"
        :aria-label="backAriaLabel"
        @click="$emit('back')"
      />
    </div>

    <LiveActionL1
      v-if="showSelector"
      :model-value="modelValue"
      :options="options"
      :tone="tone"
      class="file-shell-title-row__selector"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import LiveActionL1 from 'src/components/LiveActionL1.vue'
import PageBackSymbol from 'src/components/PageBackSymbol.vue'
import PageTitleText from 'src/components/PageTitleText.vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  tone: {
    type: String,
    default: 'default',
  },
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
  showSelector: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['back', 'update:modelValue'])
</script>

<style scoped>
.file-shell-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: flex-start;
  gap: var(--ds-space-12);
  min-width: 0;
  width: 100%;
}

.file-shell-title-row__leading {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-8);
  min-width: 0;
  grid-column: 1;
  justify-self: start;
}

.file-shell-title-row__selector {
  grid-column: 2;
  align-self: flex-start;
  justify-self: center;
}
</style>
