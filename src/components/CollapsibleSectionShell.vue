<template>
  <section class="collapsible-section-shell">
    <div class="collapsible-section-shell__head">
      <button
        type="button"
        class="collapsible-section-shell__toggle"
        @click="$emit('toggle')"
      >
        <span class="collapsible-section-shell__title">{{ title }}</span>
        <q-icon
          :name="collapsed ? 'expand_more' : 'expand_less'"
          class="collapsible-section-shell__icon"
        />
      </button>
      <div v-if="$slots.actions" class="collapsible-section-shell__actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="!collapsed" class="collapsible-section-shell__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineOptions({ name: 'CollapsibleSectionShell' })

defineProps({
  title: {
    type: String,
    default: 'Section',
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle'])
</script>

<style scoped>
.collapsible-section-shell {
  display: grid;
  gap: 12px;
  width: 100%;
}

.collapsible-section-shell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.collapsible-section-shell__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  color: var(--ds-color-brand-black);
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.collapsible-section-shell__title {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.96;
}

.collapsible-section-shell__icon {
  color: var(--ds-color-brand-black);
  font-size: 1rem;
  flex: 0 0 auto;
}

.collapsible-section-shell__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.collapsible-section-shell__body {
  display: grid;
  gap: 12px;
}
</style>
