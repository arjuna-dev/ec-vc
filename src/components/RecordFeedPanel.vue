<template>
  <section class="record-feed-panel">
    <div class="record-feed-panel__header record-feed-panel__header--main">
      <RecordFeedLabel :label="title" />
    </div>

    <div v-if="tabs.length" class="record-feed-panel__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="record-feed-panel__tab"
        @click="activeTab = tab.id"
      >
        <ValueChipSurface
          :tone="activeTab === tab.id ? 'button-neutral' : 'inverse'"
          size="small"
          class="record-feed-panel__tab-surface"
        >
          <RecordFeedTabLabel :label="tab.label" />
        </ValueChipSurface>
      </button>
    </div>

    <div v-if="displayedItems.length" class="record-feed-panel__list">
      <RecordFeedEntrySurface
        v-for="item in displayedItems"
        :key="item.id"
        class="record-feed-panel__entry"
      >
        <div class="record-feed-panel__entry-top">
          <RecordFeedTime :label="item.meta" />
          <div class="record-feed-panel__entry-top-right">
            <EyeIconButton
              v-if="item.hasLogPage"
              class="record-feed-panel__entry-toggle"
              aria-label="Open feed log"
              icon="open_in_new"
              tone="inverse"
              @click="$emit('open-log', item.id)"
            />
          </div>
        </div>
        <RecordFeedEntryTitle
          class="record-feed-panel__entry-title"
          :title="item.title"
        />
      </RecordFeedEntrySurface>
    </div>
    <div v-else class="record-feed-panel__state">
      <RecordFeedEmpty :message="emptyMessage" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import RecordFeedEmpty from 'src/components/RecordFeedEmpty.vue'
import RecordFeedEntrySurface from 'src/components/RecordFeedEntrySurface.vue'
import RecordFeedEntryTitle from 'src/components/RecordFeedEntryTitle.vue'
import RecordFeedLabel from 'src/components/RecordFeedLabel.vue'
import RecordFeedTabLabel from 'src/components/RecordFeedTabLabel.vue'
import RecordFeedTime from 'src/components/RecordFeedTime.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'
import EyeIconButton from 'src/components/buttons/EyeIconButton.vue'

defineOptions({
  name: 'RecordFeedPanel',
})

const activeTab = defineModel({
  type: String,
  default: 'all',
})

const props = defineProps({
  title: {
    type: String,
    default: 'Record Feed',
  },
  tabs: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyMessage: {
    type: String,
    default: 'No feed items yet for this record.',
  },
})

defineEmits(['open-log'])

const displayedItems = computed(() => {
  const active = String(activeTab.value || '').trim()
  return props.items.filter((item) => String(item?.feedKey || '').trim() === active)
})
</script>

<style scoped>
.record-feed-panel {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-lg);
}

.record-feed-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.record-feed-panel__header--main {
  justify-content: flex-start;
  gap: 20px;
}

.record-feed-panel__state {
  margin-top: 18px;
}

.record-feed-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.record-feed-panel__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.record-feed-panel__tab {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.record-feed-panel__tab-surface {
  min-height: 24px;
}

.record-feed-panel__entry {
}

.record-feed-panel__entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.record-feed-panel__entry-top-right {
  display: flex;
  align-items: center;
  gap: 0;
}

.record-feed-panel__entry-title {
  margin-top: 4px;
}

.record-feed-panel__entry-toggle {
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
}

.record-feed-panel__entry-toggle :deep(.q-icon) {
  font-size: 13px;
}
</style>
