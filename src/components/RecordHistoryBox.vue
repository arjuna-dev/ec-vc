<template>
  <div class="record-history-box">
    <div class="record-history-box__head">
      <div class="record-history-box__title">{{ title }}</div>
      <div v-if="Array.isArray(items) && items.length" class="record-history-box__meta">{{ items.length }} events</div>
    </div>

    <div v-if="loading" class="record-history-box__state">
      Loading history...
    </div>

    <div v-else-if="!items.length" class="record-history-box__state">
      {{ emptyLabel }}
    </div>

    <div v-else class="record-history-box__list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="record-history-box__item"
        :class="{ 'record-history-box__item--openable': item.openable !== false }"
        @click="handleOpen(item)"
      >
        <div class="record-history-box__item-top">
          <div class="record-history-box__item-source">{{ item.sourceLabel || 'System' }}</div>
          <div class="record-history-box__item-time">{{ item.meta || 'Recent' }}</div>
        </div>
        <div class="record-history-box__item-title">{{ item.title || 'Event' }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'History',
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyLabel: {
    type: String,
    default: 'No history yet.',
  },
})

const emit = defineEmits(['open-item'])

function handleOpen(item) {
  if (!item || item.openable === false) return
  emit('open-item', item)
}
</script>

<style scoped>
.record-history-box {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
  background: rgba(17, 17, 17, 0.02);
}

.record-history-box__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.record-history-box__title {
  color: #111;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
}

.record-history-box__meta,
.record-history-box__state,
.record-history-box__item-source,
.record-history-box__item-time {
  color: rgba(17, 17, 17, 0.58);
  font-size: 0.72rem;
  line-height: 1.2;
}

.record-history-box__list {
  display: grid;
  gap: 8px;
}

.record-history-box__item {
  display: grid;
  gap: 4px;
  padding: 10px;
  text-align: left;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.82);
  cursor: pointer;
}

.record-history-box__item--openable:hover {
  border-color: rgba(17, 17, 17, 0.18);
  background: rgba(255, 255, 255, 0.96);
}

.record-history-box__item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.record-history-box__item-title {
  color: #111;
  font-size: 0.76rem;
  line-height: 1.35;
}
</style>
