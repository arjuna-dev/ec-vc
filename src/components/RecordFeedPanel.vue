<template>
  <section class="record-feed-panel">
    <div class="record-feed-panel__header record-feed-panel__header--main">
      <RecordFeedLabel :label="title" />
      <div class="record-feed-panel__add-slot">
        <PlusWithLabelButton
          class="record-feed-panel__add"
          :class="{ 'record-feed-panel__add--hidden': !showAddButton }"
          :label="resolvedAddLabel"
          :disable="!showAddButton"
          @click="showAddButton ? $emit('request-add', activeTab) : null"
        />
      </div>
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

    <div v-if="displayedGroups.length" class="record-feed-panel__group-stack">
      <section
        v-for="group in displayedGroups"
        :key="group.id"
        class="record-feed-panel__group"
      >
        <div class="record-feed-panel__group-label">{{ group.label }}</div>
        <div class="record-feed-panel__list">
          <RecordFeedEntrySurface
            v-for="item in group.items"
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
      </section>
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
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'
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
  groups: {
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
  addButtonTabs: {
    type: Array,
    default: () => ['notes', 'artifacts', 'intake'],
  },
})

defineEmits(['open-log', 'request-add'])

const displayedItems = computed(() => {
  const availableTabs = Array.isArray(props.tabs) ? props.tabs : []
  const active = String(activeTab.value || '').trim()
  const resolvedActive = availableTabs.some((tab) => String(tab?.id || '').trim() === active)
    ? active
    : String(availableTabs[0]?.id || '').trim()
  return props.items.filter((item) => String(item?.feedKey || '').trim() === resolvedActive)
})

const displayedGroups = computed(() => {
  const activeItems = displayedItems.value
  const groups = Array.isArray(props.groups) ? props.groups : []
  return groups
    .map((group) => {
      const groupId = String(group?.id || '').trim()
      const items = activeItems.filter((item) => String(item?.groupKey || '').trim() === groupId)
      return {
        id: groupId,
        label: String(group?.label || '').trim() || 'Group',
        items,
      }
    })
    .filter((group) => group.id && group.items.length)
})

const showAddButton = computed(() => {
  const active = String(activeTab.value || '').trim().toLowerCase()
  return (Array.isArray(props.addButtonTabs) ? props.addButtonTabs : [])
    .map((tab) => String(tab || '').trim().toLowerCase())
    .includes(active)
})

const resolvedAddLabel = computed(() => {
  const active = String(activeTab.value || '').trim().toLowerCase()
  if (active === 'notes') return 'Add Note'
  if (active === 'artifacts') return 'Add Artifact'
  if (active === 'intake') return 'Add Intake'
  return 'Add'
})
</script>

<style scoped>
.record-feed-panel {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  margin: 10px;
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
  justify-content: space-between;
  gap: 20px;
}

.record-feed-panel__add-slot {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
}

.record-feed-panel__add {
  display: inline-flex;
  flex: 0 0 auto;
}

.record-feed-panel__add--hidden {
  visibility: hidden;
  pointer-events: none;
}

.record-feed-panel__add :deep(.plus-with-label-button) {
  align-self: center;
  display: inline-flex;
  min-width: 0;
  min-height: 0;
  height: auto;
  padding: 0;
  color: var(--ds-color-brand-white);
  background: rgba(17, 17, 17, 1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--ds-radius-sm);
  line-height: 1;
  width: fit-content;
}

.record-feed-panel__add :deep(.plus-with-label-button:hover),
.record-feed-panel__add :deep(.plus-with-label-button:focus-visible) {
  background: rgba(32, 32, 32, 1);
}

.record-feed-panel__add :deep(.plus-with-label-button__inner) {
  gap: 0;
  align-items: center;
  line-height: 1;
}

.record-feed-panel__add :deep(.plus-with-label-button__icon) {
  margin: 0;
  line-height: 0;
}

.record-feed-panel__add :deep(.plus-with-label-button__label) {
  color: inherit;
  display: block;
  font-size: 10px;
  line-height: 1;
  padding: 0;
  margin: 0;
  white-space: nowrap;
}

.record-feed-panel__add :deep(.plus-icon-chip) {
  --plus-icon-chip-size: 4px;
  --plus-icon-chip-glyph-size: 4px;
  background: var(--ds-color-brand-white);
  color: var(--ds-color-brand-black);
}

.record-feed-panel__state {
  margin-top: 18px;
}

.record-feed-panel__group-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.record-feed-panel__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-feed-panel__group-label {
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-feed-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
