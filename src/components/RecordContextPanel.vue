<template>
  <section class="record-context-panel">
    <div class="record-context-panel__tabs" role="tablist" :aria-label="ariaLabel">
      <button
        type="button"
        class="record-context-panel__tab"
        @click="activeTab = 'notes'"
      >
        <ValueChipSurface
          :tone="activeTab === 'notes' ? 'button-neutral' : 'button-subtle'"
          size="small"
          class="record-context-panel__tab-surface"
        >
          <RecordFeedTabLabel label="Latest notes" />
        </ValueChipSurface>
      </button>
      <button
        type="button"
        class="record-context-panel__tab"
        @click="activeTab = 'documents'"
      >
        <ValueChipSurface
          :tone="activeTab === 'documents' ? 'button-neutral' : 'button-subtle'"
          size="small"
          class="record-context-panel__tab-surface"
        >
          <RecordFeedTabLabel label="Related artifacts" />
        </ValueChipSurface>
      </button>
    </div>

    <ul
      v-if="activeTab === 'notes' && notes.length"
      class="record-context-panel__list"
    >
      <li
        v-for="note in notes"
        :key="note.id"
        class="record-context-panel__item"
      >
        <div class="record-context-panel__row">
          <ButtonLabel class="record-context-panel__title" :label="note.title" />
          <RecordFieldDescription
            class="record-context-panel__meta"
            :description="note.created_at"
          />
        </div>
        <MainMenuRowLabel
          v-if="note.content"
          class="record-context-panel__content"
          :label="note.content"
        />
      </li>
    </ul>
    <div
      v-else-if="activeTab === 'notes'"
      class="record-context-panel__empty"
    >
      <MainMenuRowLabel :label="`No notes yet for this ${singularLabel.toLowerCase()}.`" />
    </div>

    <ul
      v-if="activeTab === 'documents' && documents.length"
      class="record-context-panel__list"
    >
      <li
        v-for="document in documents"
        :key="document.id"
        class="record-context-panel__item"
      >
        <div class="record-context-panel__row">
          <ButtonLabel class="record-context-panel__title" :label="document.title" />
          <RecordFieldDescription
            class="record-context-panel__meta"
            :description="document.meta"
          />
        </div>
        <MainMenuRowLabel
          v-if="document.content"
          class="record-context-panel__content"
          :label="document.content"
        />
      </li>
    </ul>
    <div
      v-else-if="activeTab === 'documents'"
      class="record-context-panel__empty"
    >
      <MainMenuRowLabel :label="`No related artifacts yet for this ${singularLabel.toLowerCase()}.`" />
    </div>
  </section>
</template>

<script setup>
import ButtonLabel from 'src/components/ButtonLabel.vue'
import MainMenuRowLabel from 'src/components/MainMenuRowLabel.vue'
import RecordFeedTabLabel from 'src/components/RecordFeedTabLabel.vue'
import RecordFieldDescription from 'src/components/RecordFieldDescription.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'

const activeTab = defineModel({
  type: String,
  default: 'notes',
})

defineOptions({
  name: 'RecordContextPanel',
})

defineProps({
  notes: {
    type: Array,
    default: () => [],
  },
  documents: {
    type: Array,
    default: () => [],
  },
  singularLabel: {
    type: String,
    default: 'record',
  },
  ariaLabel: {
    type: String,
    default: 'Record context',
  },
})
</script>

<style scoped>
.record-context-panel {
  display: grid;
}

.record-context-panel__tabs {
  display: inline-flex;
  gap: var(--ds-record-context-tab-gap);
  align-self: flex-start;
}

.record-context-panel__tab {
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.record-context-panel__tab-surface {
  min-height: var(--ds-control-height-sm);
}

.record-context-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  margin-top: var(--ds-record-context-list-margin-top);
  padding: 0;
  list-style: none;
}

.record-context-panel__item {
}

.record-context-panel__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.record-context-panel__title {
  color: var(--ds-color-text-primary);
  flex: 1 1 auto;
  min-width: 0;
}

.record-context-panel__content {
  margin-top: var(--ds-record-context-content-margin-top);
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
  color: var(--ds-color-brand-dark-grey);
  font-weight: var(--ds-font-weight-light);
}

.record-context-panel__meta {
  flex: 0 0 auto;
  padding: 0;
  color: var(--ds-color-text-muted-alt);
  white-space: nowrap;
}

.record-context-panel__empty {
  margin-top: var(--ds-record-context-empty-margin-top);
  color: var(--ds-color-brand-dark-grey);
}

.record-context-panel__empty :deep(.main-menu-row-label) {
  color: inherit;
  font-weight: var(--ds-font-weight-light);
}
</style>
