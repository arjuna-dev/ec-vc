<template>
  <div class="dialog-shell-footer">
    <div v-if="resolvedLegendItems.length" class="dialog-shell-footer__legend">
      <div
        v-for="item in resolvedLegendItems"
        :key="item.label"
        class="dialog-shell-footer__status"
        :class="`dialog-shell-footer__status--${item.tone || 'default'}`"
      >
        {{ item.label }}
      </div>
    </div>

    <B10Button
      :label="cancelLabel"
      variant="subtle"
      size="small"
      :disable="cancelDisabled"
      @click="$emit('cancel')"
    />

    <B10Button
      :label="saveLabel"
      variant="primary"
      size="small"
      :disable="saveDisabled"
      :loading="loading"
      @click="$emit('save')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import B10Button from 'src/components/buttons/B10Button.vue'

const props = defineProps({
  legendItems: {
    type: Array,
    default: () => [],
  },
  cancelDisabled: {
    type: Boolean,
    default: false,
  },
  saveDisabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saveLabel: {
    type: String,
    default: 'Save',
  },
  cancelLabel: {
    type: String,
    default: 'Cancel',
  },
})

defineEmits(['cancel', 'save'])

const resolvedLegendItems = computed(() => props.legendItems || [])
</script>

<style scoped>
.dialog-shell-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ds-space-8);
  width: 100%;
}

.dialog-shell-footer__legend {
  display: flex;
  align-items: center;
  gap: var(--ds-space-8);
  margin-right: auto;
}

.dialog-shell-footer__status {
  display: inline-flex;
  align-items: center;
  padding: 1px var(--ds-space-10);
  border: 1px solid transparent;
  border-radius: var(--ds-radius-sm);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dialog-shell-footer__status--default {
  background: rgba(225, 239, 255, 0.96);
  color: rgba(24, 72, 144, 0.96);
  border-color: rgba(64, 121, 210, 0.32);
}

.dialog-shell-footer__status--suggested {
  background: rgba(255, 246, 214, 0.98);
  color: rgba(106, 78, 5, 0.92);
  border-color: rgba(186, 129, 13, 0.28);
}
</style>
