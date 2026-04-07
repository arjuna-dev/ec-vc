<template>
  <q-icon
    :name="resolvedIcon"
    size="15px"
    class="record-field-status-icon"
    :style="{ color: resolvedColor }"
  />
</template>

<script setup>
import { computed } from 'vue'

const STATUS_ICON_BY_STATE = Object.freeze({
  verified: 'check_circle',
  default_preselected_unverified: 'auto_awesome',
  suggested_unverified: 'lightbulb',
  rejected: 'cancel',
})

const STATUS_COLOR_BY_STATE = Object.freeze({
  verified: 'var(--ds-color-brand-blue)',
  default_preselected_unverified: 'rgba(35, 92, 26, 0.96)',
  suggested_unverified: 'rgba(186, 129, 13, 0.92)',
  rejected: 'rgba(166, 43, 43, 0.92)',
})

const props = defineProps({
  state: {
    type: String,
    default: 'verified',
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
})

const resolvedIcon = computed(() => props.icon || STATUS_ICON_BY_STATE[props.state] || STATUS_ICON_BY_STATE.verified)
const resolvedColor = computed(() => props.color || STATUS_COLOR_BY_STATE[props.state] || STATUS_COLOR_BY_STATE.verified)
</script>

<style scoped>
.record-field-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: 0;
  border-radius: 0;
}
</style>
