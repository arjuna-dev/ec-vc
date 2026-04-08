<template>
  <div class="section-tabs">
    <div class="section-tabs__lane">
      <button
        v-for="tab in leftTabs"
        :key="tab.key"
        type="button"
        class="section-tabs__tab"
        :class="{ 'section-tabs__tab--active': tab.key === modelValue }"
        @click="$emit('update:modelValue', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="section-tabs__lane section-tabs__lane--right">
      <button
        v-for="tab in rightTabs"
        :key="tab.key"
        type="button"
        class="section-tabs__tab"
        :class="{ 'section-tabs__tab--active': tab.key === modelValue }"
        @click="$emit('update:modelValue', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SectionTabs' })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  leftTabs: {
    type: Array,
    default: () => [],
  },
  rightTabs: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.section-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.section-tabs__lane {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.section-tabs__lane--right {
  margin-left: auto;
}

.section-tabs__tab {
  min-height: 30px;
  padding: 0 12px;
  color: var(--ds-color-brand-black);
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.92);
  border-radius: var(--ds-radius-micro);
  font-family: var(--ds-font-title);
  font-size: 0.7rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.95;
}

.section-tabs__tab--active {
  color: var(--ds-color-brand-white);
  background: var(--ds-color-brand-black);
}
</style>
