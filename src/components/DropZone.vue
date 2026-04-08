<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone--active': active }"
    @dragover.prevent="$emit('dragover', $event)"
    @dragleave.prevent="$emit('dragleave', $event)"
    @drop.prevent="$emit('drop', $event)"
  >
    <div class="drop-zone__copy">
      <div v-if="title" class="drop-zone__title">{{ title }}</div>
      <div class="drop-zone__caption">{{ caption }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineOptions({ name: 'DropZone' })

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: 'Drag files here',
  },
})

defineEmits(['dragover', 'dragleave', 'drop'])
</script>

<style scoped>
.drop-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 130px;
  padding: 14px 16px 12px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px dashed var(--ds-color-border-dashed);
  border-radius: var(--ds-radius-mini);
  box-sizing: border-box;
}

.drop-zone--active {
  background: rgba(238, 241, 255, 0.98);
  border-color: rgba(38, 71, 255, 0.6);
}

.drop-zone__copy {
  display: grid;
  gap: 4px;
}

.drop-zone__title {
  display: none;
}

.drop-zone__caption {
  color: rgba(17, 17, 17, 0.62);
  font-family: var(--ds-font-body);
  font-size: 0.76rem;
  line-height: 1.35;
}
</style>
