<template>
  <div class="entry-input-list-box">
    <input
      :value="inputValue"
      type="text"
      class="entry-input-list-box__input"
      @input="$emit('update:inputValue', $event.target.value)"
      @keydown.enter.stop.prevent="$emit('submit')"
    />

    <div v-if="entries.length" class="entry-input-list-box__list">
      <label
        v-for="entry in entries"
        :key="entry.id"
        class="entry-input-list-box__row"
        :class="{ 'entry-input-list-box__row--expanded': expandedIds.includes(entry.id) }"
      >
        <q-checkbox
          :model-value="selectedIds.includes(entry.id)"
          dense
          size="xs"
          checked-icon="check_box"
          unchecked-icon="check_box_outline_blank"
          class="entry-input-list-box__checkbox"
          @update:model-value="$emit('toggleSelect', entry.id, $event)"
        />
        <button
          type="button"
          class="entry-input-list-box__toggle"
          @click="$emit('toggleExpanded', entry.id)"
        >
          {{ entry.value }}
        </button>
      </label>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'EntryInputListBox' })

defineProps({
  inputValue: {
    type: String,
    default: '',
  },
  entries: {
    type: Array,
    default: () => [],
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
  expandedIds: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:inputValue', 'submit', 'toggleSelect', 'toggleExpanded'])
</script>

<style scoped>
.entry-input-list-box {
  display: grid;
  gap: 4px;
  min-height: 0;
}

.entry-input-list-box__input {
  width: 100%;
  height: 16px;
  padding: 1px 4px;
  color: var(--ds-color-brand-black);
  border: 1px solid rgba(17, 17, 17, 0.18);
  outline: none;
  box-sizing: border-box;
  font-family: var(--ds-font-body);
  font-size: 0.76rem;
  line-height: 12px;
  background: rgba(255, 255, 255, 0.96);
}

.entry-input-list-box__list {
  display: grid;
  align-content: start;
  gap: 3px;
  min-height: 0;
  max-height: 124px;
  overflow: auto;
}

.entry-input-list-box__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 4px;
}

.entry-input-list-box__checkbox {
  margin: 0;
}

.entry-input-list-box__toggle {
  min-width: 0;
  padding: 0;
  color: var(--ds-color-brand-black);
  background: transparent;
  border: 0;
  font-family: var(--ds-font-body);
  font-size: 0.72rem;
  line-height: 1.2;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.entry-input-list-box__row--expanded .entry-input-list-box__toggle {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
</style>
