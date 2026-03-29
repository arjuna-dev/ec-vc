<template>
  <q-page-sticky v-if="count > 0" position="bottom-right" :offset="[36, 18]">
    <div class="selection-action-bar">
      <div class="selection-action-bar__count">{{ count }} selected</div>

      <q-btn
        v-if="canShare"
        dense
        flat
        round
        icon="share"
        class="selection-action-bar__share-btn"
        :disable="loading"
        aria-label="Share selected"
        @click="$emit('share')"
      >
        <q-tooltip>Share selected</q-tooltip>
      </q-btn>

      <q-btn
        v-if="canDelete"
        dense
        flat
        round
        icon="delete"
        color="negative"
        :disable="loading"
        aria-label="Delete selected"
        @click="$emit('delete')"
      >
        <q-tooltip>Delete selected</q-tooltip>
      </q-btn>
    </div>
  </q-page-sticky>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  canShare: {
    type: Boolean,
    default: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['share', 'delete'])
</script>

<style scoped>
.selection-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(14px);
}

.selection-action-bar__count {
  padding: 0 6px 0 2px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.selection-action-bar__share-btn {
  color: var(--ds-color-brand-blue);
}
</style>
