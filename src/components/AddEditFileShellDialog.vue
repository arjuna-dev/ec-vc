<template>
  <q-dialog v-model="open">
    <q-card class="file-structure-shell">
      <q-card-section class="file-structure-shell__header">
        <div class="file-structure-shell__header-copy">
          <div class="file-structure-shell__title-row">
            <div class="file-structure-shell__title">Add/Edit File Shell</div>
            <div v-if="shellSelectorOptions.length" class="file-structure-shell__shell-selector">
              <q-select
                :model-value="shellSelectorValue"
                dense
                dark
                options-dark
                borderless
                emit-value
                map-options
                hide-bottom-space
                hide-dropdown-icon
                :options="shellSelectorOptions"
                popup-content-class="file-structure-shell__shell-selector-menu"
                class="file-structure-shell__shell-selector-control"
                @update:model-value="emit('update:shellSelectorValue', $event)"
              >
                <template #selected-item="scope">
                  <span class="file-structure-shell__shell-selector-value">{{ scope.opt.label }}</span>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" class="file-structure-shell__shell-selector-option">
                    <q-item-section>
                      <span class="file-structure-shell__shell-selector-option-label">{{ scope.opt.label }}</span>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="file-structure-shell__body">
        <div class="file-structure-shell__section-stack">
          <section class="file-structure-shell__group">
            <button
              type="button"
              class="file-structure-shell__group-toggle"
              @click="sectionConfigurationCollapsed = !sectionConfigurationCollapsed"
            >
              <span class="file-structure-shell__group-title">Section Configuration</span>
              <q-icon
                :name="sectionConfigurationCollapsed ? 'expand_more' : 'expand_less'"
                class="file-structure-shell__group-toggle-icon"
              />
            </button>
            <button
              type="button"
              class="file-structure-shell__section-picker"
              @click.stop="sectionPickerOpen = true"
            >
              <span class="file-structure-shell__section-picker-label">{{ activeSectionOption.label }}</span>
              <q-icon name="expand_more" class="file-structure-shell__section-picker-icon" />
              <q-menu
                v-model="sectionPickerOpen"
                anchor="bottom right"
                self="top right"
                class="file-structure-shell__section-picker-menu"
              >
                <div class="file-structure-shell__section-menu">
                  <section
                    v-for="group in sectionOptionGroups"
                    :key="group.id"
                    class="file-structure-shell__section-menu-group"
                  >
                    <button
                      type="button"
                      class="file-structure-shell__section-menu-toggle"
                      @click.stop="toggleSectionGroup(group.id)"
                    >
                      <span class="file-structure-shell__section-menu-title">{{ group.label }}</span>
                      <q-icon
                        :name="isSectionGroupOpen(group.id) ? 'expand_less' : 'expand_more'"
                        class="file-structure-shell__section-menu-chevron"
                      />
                    </button>

                    <div v-if="isSectionGroupOpen(group.id)" class="file-structure-shell__section-menu-items">
                      <button
                        v-for="option in group.items"
                        :key="option.value"
                        type="button"
                        class="file-structure-shell__section-menu-item"
                        :class="{ 'file-structure-shell__section-menu-item--active': activeSectionSelection === option.value }"
                        @click.stop="selectSectionOption(option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </section>
                </div>
              </q-menu>
            </button>

            <div v-if="!sectionConfigurationCollapsed" class="file-structure-shell__group-body">
              <div class="file-structure-shell__grid">
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">L2 Headings</div>
                  <div class="file-structure-shell__field-surface" />
                </div>
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">Included Features</div>
                  <div class="file-structure-shell__field-surface" />
                </div>
              </div>
            </div>
          </section>

          <section class="file-structure-shell__group">
            <button
              type="button"
              class="file-structure-shell__group-toggle"
              @click="dataStructureCollapsed = !dataStructureCollapsed"
            >
              <span class="file-structure-shell__group-title">Data Structure</span>
              <q-icon
                :name="dataStructureCollapsed ? 'expand_more' : 'expand_less'"
                class="file-structure-shell__group-toggle-icon"
              />
            </button>

            <div v-if="!dataStructureCollapsed" class="file-structure-shell__group-body">
              <div class="file-structure-shell__grid">
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">Core Structure</div>
                  <div class="file-structure-shell__field-surface file-structure-shell__field-surface--tall" />
                </div>
                <div class="file-structure-shell__field">
                  <div class="file-structure-shell__field-label">Relations and Payloads</div>
                  <div class="file-structure-shell__field-surface file-structure-shell__field-surface--tall" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="file-structure-shell__actions">
        <q-btn flat no-caps class="file-structure-shell__action file-structure-shell__action--cancel" label="Cancel" @click="emit('requestClose')" />
        <q-btn unelevated no-caps disable class="file-structure-shell__action file-structure-shell__action--save" label="Save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'update:shellSelectorValue', 'requestClose'])

const sectionConfigurationCollapsed = ref(false)
const dataStructureCollapsed = ref(false)
const sectionPickerOpen = ref(false)
const activeSectionSelection = ref('general')
const openSectionGroups = ref(['system-created'])

const sectionOptionGroups = [
  {
    id: 'system-created',
    label: 'System Created',
    items: [
      { value: 'general', label: 'General' },
      { value: 'system', label: 'System' },
      { value: 'kdb', label: 'KDB' },
    ],
  },
  {
    id: 'user-created',
    label: 'User Created',
    items: [
      { value: 'summary', label: 'Summary' },
      { value: 'workflow', label: 'Workflow' },
      { value: 'resources', label: 'Resources' },
    ],
  },
]

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeSectionOption = computed(() =>
  sectionOptionGroups.flatMap((group) => group.items).find((option) => option.value === activeSectionSelection.value)
  || sectionOptionGroups[0].items[0],
)

function isSectionGroupOpen(groupId) {
  return openSectionGroups.value.includes(groupId)
}

function toggleSectionGroup(groupId) {
  openSectionGroups.value = isSectionGroupOpen(groupId)
    ? openSectionGroups.value.filter((value) => value !== groupId)
    : [...openSectionGroups.value, groupId]
}

function selectSectionOption(value) {
  activeSectionSelection.value = value
  sectionPickerOpen.value = false
}
</script>

<style scoped>
.file-structure-shell {
  width: min(1240px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 249, 252, 0.98));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
}

.file-structure-shell__header {
  padding: 26px 28px 20px;
}

.file-structure-shell__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.file-structure-shell__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 2.6vw, 2.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.file-structure-shell__shell-selector {
  min-width: 200px;
  padding: 0 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #111827;
}

.file-structure-shell__shell-selector-control {
  min-height: 40px;
}

.file-structure-shell__shell-selector-control :deep(.q-field__control) {
  min-height: 40px;
}

.file-structure-shell__shell-selector-value,
.file-structure-shell__shell-selector-option-label {
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.file-structure-shell__body {
  padding: 0 28px 20px;
}

.file-structure-shell__section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-structure-shell__group {
  position: relative;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  overflow: hidden;
}

.file-structure-shell__group-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 18px 22px;
  color: #0f172a;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.file-structure-shell__group-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__group-toggle-icon {
  margin-left: 2px;
  font-size: 20px;
}

.file-structure-shell__section-picker {
  position: absolute;
  top: 12px;
  right: 18px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  color: #fff;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 8px;
  cursor: pointer;
}

.file-structure-shell__section-picker-label {
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: 0.02em;
}

.file-structure-shell__section-picker-icon {
  font-size: 16px;
}

.file-structure-shell__section-menu {
  min-width: 230px;
  padding: 10px;
  background: #111827;
  border-radius: 14px;
}

.file-structure-shell__section-menu-group + .file-structure-shell__section-menu-group {
  margin-top: 8px;
}

.file-structure-shell__section-menu-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 4px;
  color: #fff;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.file-structure-shell__section-menu-title {
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__section-menu-chevron {
  font-size: 16px;
}

.file-structure-shell__section-menu-items {
  display: grid;
  gap: 4px;
  padding-top: 4px;
}

.file-structure-shell__section-menu-item {
  width: 100%;
  padding: 8px 10px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  text-align: left;
  cursor: pointer;
}

.file-structure-shell__section-menu-item--active {
  color: #111827;
  background: #fff;
  border-color: #fff;
}

.file-structure-shell__group-body {
  padding: 0 22px 22px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.file-structure-shell__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding-top: 18px;
}

.file-structure-shell__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-structure-shell__field-label {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__field-surface {
  min-height: 76px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(241, 245, 249, 0.86));
}

.file-structure-shell__field-surface--tall {
  min-height: 196px;
}

.file-structure-shell__actions {
  padding: 0 28px 24px;
  gap: 10px;
}

.file-structure-shell__action {
  min-width: 96px;
  border-radius: 10px;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
}

.file-structure-shell__action--cancel {
  color: #111827;
}

.file-structure-shell__action--save {
  color: #fff;
  background: #111827;
}

:global(.file-structure-shell__shell-selector-menu) {
  background: #111827;
}

@media (max-width: 900px) {
  .file-structure-shell {
    width: min(100vw - 20px, 1240px);
    max-width: calc(100vw - 20px);
    border-radius: 22px;
  }

  .file-structure-shell__header,
  .file-structure-shell__body,
  .file-structure-shell__actions {
    padding-left: 20px;
    padding-right: 20px;
  }

  .file-structure-shell__title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .file-structure-shell__section-picker {
    position: static;
    margin: 0 22px 14px;
  }

  .file-structure-shell__grid {
    grid-template-columns: 1fr;
  }
}
</style>
