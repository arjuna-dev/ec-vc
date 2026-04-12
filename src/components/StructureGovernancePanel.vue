<template>
  <div v-if="mode === 'views'" class="structure-governance-panel">
    <table class="structure-governance-panel__table">
      <thead>
        <tr>
          <th>View</th>
          <th>Side</th>
          <th>Tokens</th>
          <th>Subgroups</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="view in viewRows" :key="view.key">
          <td class="structure-governance-panel__cell--label">{{ view.label }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.side }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.tokenCount }}</td>
          <td class="structure-governance-panel__cell--data">{{ view.subgroupCount }}</td>
        </tr>
        <tr v-if="!viewRows.length">
          <td colspan="4" class="structure-governance-panel__empty">{{ emptyViewsLabel }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else-if="mode === 'tokens'" class="structure-governance-panel structure-governance-panel--groups">
    <section
      v-for="group in tokenGroups"
      :key="group.key"
      class="structure-governance-panel__group"
    >
      <div class="structure-governance-panel__group-head">
        <div class="structure-governance-panel__group-title">{{ group.label }}</div>
        <div class="structure-governance-panel__group-meta">{{ group.tokens.length }} tokens</div>
      </div>

      <table class="structure-governance-panel__table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Required</th>
            <th v-if="showWriteTarget">Write Target / Alias</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in group.tokens" :key="token.key">
            <td class="structure-governance-panel__cell--label">{{ token.label }}</td>
            <td class="structure-governance-panel__cell--data">{{ token.type }}</td>
            <td class="structure-governance-panel__cell--data">
              <SettingsCheckbox
                v-if="interactiveRequired"
                :model-value="Boolean(token.required)"
                tone="light"
                @update:model-value="$emit('toggle-required', token.key, $event)"
              />
              <span v-else>{{ token.required }}</span>
            </td>
            <td v-if="showWriteTarget" class="structure-governance-panel__cell--data">{{ token.writeTarget }}</td>
          </tr>
          <tr v-if="!group.tokens.length">
            <td :colspan="showWriteTarget ? 4 : 3" class="structure-governance-panel__empty">{{ emptyTokensLabel }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="!tokenGroups.length" class="structure-governance-panel__empty structure-governance-panel__empty--standalone">
      {{ emptyTokensLabel }}
    </div>
  </div>
</template>

<script setup>
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'

defineOptions({ name: 'StructureGovernancePanel' })

defineProps({
  mode: { type: String, default: 'views' },
  viewRows: { type: Array, default: () => [] },
  tokenGroups: { type: Array, default: () => [] },
  showWriteTarget: { type: Boolean, default: false },
  interactiveRequired: { type: Boolean, default: false },
  emptyViewsLabel: { type: String, default: 'No views declared.' },
  emptyTokensLabel: { type: String, default: 'No tokens declared.' },
})

defineEmits(['toggle-required'])
</script>

<style scoped>
.structure-governance-panel {
  display: grid;
  gap: 12px;
}

.structure-governance-panel--groups {
  gap: 14px;
}

.structure-governance-panel__group {
  display: grid;
  gap: 8px;
}

.structure-governance-panel__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.structure-governance-panel__group-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.02em;
}

.structure-governance-panel__group-meta {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  line-height: 1.35;
}

.structure-governance-panel__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: transparent;
}

.structure-governance-panel__table thead th {
  padding: 0 0 8px;
  color: var(--ds-color-text-secondary);
  border-bottom: 1px solid var(--ds-color-border-default);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.structure-governance-panel__table tbody td {
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ds-color-border-default) 72%, transparent);
  vertical-align: middle;
}

.structure-governance-panel__cell--label {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: 1.45;
}

.structure-governance-panel__cell--data {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
}

.structure-governance-panel__empty {
  padding: 14px 0 4px;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.45;
  text-align: center;
}

.structure-governance-panel__empty--standalone {
  padding-top: 0;
}
</style>
