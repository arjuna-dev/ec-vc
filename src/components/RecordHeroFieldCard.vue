<template>
  <article
    class="record-hero-field-card"
    :class="{
      'record-hero-field-card--interactive': interactive,
      'record-hero-field-card--summary': summary,
    }"
  >
    <div class="record-hero-field-card__top">
      <RecordFieldLabel :label="label" />
      <RecordFieldDescription :description="description" />
    </div>
    <div class="record-hero-field-card__bottom">
      <RecordFieldValue :value="value" />
      <RecordFieldStatusIcon
        v-if="statusIcon"
        :icon="statusIcon"
      />
    </div>
  </article>
</template>

<script setup>
import RecordFieldDescription from 'src/components/RecordFieldDescription.vue'
import RecordFieldLabel from 'src/components/RecordFieldLabel.vue'
import RecordFieldValue from 'src/components/RecordFieldValue.vue'
import RecordFieldStatusIcon from 'src/components/RecordFieldStatusIcon.vue'

defineProps({
  label: {
    type: String,
    default: 'Industry',
  },
  description: {
    type: String,
    default: 'General',
  },
  value: {
    type: String,
    default: 'Enterprise SaaS',
  },
  statusIcon: {
    type: String,
    default: '',
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  summary: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.record-hero-field-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-hero-field-card__top {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
}

.record-hero-field-card__bottom {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
}
</style>
