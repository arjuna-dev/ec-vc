<template>
  <DialogShellFrame
    card-class="file-structure-shell"
    header-class="file-structure-shell__header"
    body-class="file-structure-shell__body"
  >
    <template #header>
      <div class="file-structure-shell__header-copy">
        <div class="file-structure-shell__title-row">
          <RecordTitle title="Add/Edit File Shell" />
          <button
            v-if="shellSelectorOptions.length"
            ref="shellSelectorButton"
            type="button"
            class="file-structure-shell__shell-selector"
            @click.stop="toggleShellSelector"
          >
            <MainMenuSubgroupRow
              :label="activeShellSelectorOption.label"
              :expanded="shellSelectorOpen"
            />
          </button>
          <div
            v-if="shellSelectorOpen"
            ref="shellSelectorMenu"
            class="file-structure-shell__shell-selector-dropdown"
          >
            <div class="file-structure-shell__section-menu">
              <button
                v-for="option in shellSelectorOptions"
                :key="option.value"
                type="button"
                class="file-structure-shell__section-menu-item"
                :class="{ 'file-structure-shell__section-menu-item--active': shellSelectorValue === option.value }"
                @click.stop="selectShellSelectorOption(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DialogShellFrame>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import MainMenuSubgroupRow from 'src/components/MainMenuSubgroupRow.vue'
import RecordTitle from 'src/components/RecordTitle.vue'

const props = defineProps({
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:shellSelectorValue'])

const shellSelectorOpen = ref(false)
const shellSelectorButton = ref(null)
const shellSelectorMenu = ref(null)
const activeShellSelectorOption = computed(() =>
  props.shellSelectorOptions.find((option) => option.value === props.shellSelectorValue)
  || props.shellSelectorOptions[0]
  || { value: '', label: 'Select File' },
)

function selectShellSelectorOption(value) {
  emit('update:shellSelectorValue', value)
  shellSelectorOpen.value = false
}

function toggleShellSelector() {
  shellSelectorOpen.value = !shellSelectorOpen.value
}

function handleGlobalPointerDown(event) {
  const target = event?.target
  if (!target) return
  const clickedButton = shellSelectorButton.value?.contains?.(target)
  const clickedMenu = shellSelectorMenu.value?.contains?.(target)
  if (clickedButton || clickedMenu) return
  shellSelectorOpen.value = false
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('pointerdown', handleGlobalPointerDown)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
})

</script>

<style scoped>
.file-structure-shell {
  width: 100%;
  max-width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--ds-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 249, 252, 0.98));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.16);
}

.file-structure-shell__header {
  padding: 26px 28px 0;
}

.file-structure-shell__title-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.file-structure-shell__shell-selector {
  position: relative;
  flex: 0 0 auto;
  width: auto;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #111827;
  cursor: pointer;
}

.file-structure-shell__shell-selector:hover {
  background: #0b1220;
  border-color: rgba(15, 23, 42, 0.24);
}

.file-structure-shell__shell-selector :deep(.main-menu-subgroup-row) {
  color: #fff;
}

.file-structure-shell__shell-selector-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
}

.file-structure-shell__section-menu {
  display: inline-grid;
  min-width: 0;
  width: max-content;
  max-width: min(320px, calc(100vw - 48px));
  padding: 10px;
  background: #111827;
  border-radius: 14px;
}

.file-structure-shell__section-menu-item {
  width: auto;
  min-width: 0;
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
  white-space: nowrap;
  cursor: pointer;
}

.file-structure-shell__section-menu-item--active {
  color: #111827;
  background: #fff;
  border-color: #fff;
}

.file-structure-shell__table {
  width: max-content;
  border-collapse: collapse;
  table-layout: auto;
}

.file-structure-shell__table col:first-child {
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__table th,
.file-structure-shell__table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
}

.file-structure-shell__table th {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.file-structure-shell__table td {
  color: #111827;
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.35;
}

.file-structure-shell__table th:first-child,
.file-structure-shell__table td:first-child {
  width: 1%;
  white-space: nowrap;
  padding-right: 18px;
}

.file-structure-shell__row-head {
  width: 1%;
  white-space: nowrap;
}

.file-structure-shell__column-head-inner,
.file-structure-shell__row-head-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.file-structure-shell__dynamic-column-head {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.file-structure-shell__dynamic-column-head--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.file-structure-shell__table-cell {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.file-structure-shell__table-cell--summary {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.file-structure-shell__column-input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  outline: none;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
}

.file-structure-shell__add-column-head,
.file-structure-shell__add-column-spacer {
  width: 1%;
  padding-left: 6px;
  padding-right: 0;
  white-space: nowrap;
}

.file-structure-shell__add-column-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
}

.file-structure-shell__add-column-btn:disabled,
.file-structure-shell__add-row-btn:disabled {
  opacity: 0.32;
  cursor: default;
  box-shadow: none;
}

.file-structure-shell__add-column-btn :deep(.q-icon) {
  font-size: 16px;
}

.file-structure-shell__row-input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  outline: none;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
}

.file-structure-shell__add-row-cell {
  padding-top: 14px;
  padding-bottom: 0;
}

.file-structure-shell__add-row-spacer {
  padding-top: 14px;
  padding-bottom: 0;
  border-bottom: 0;
}

.file-structure-shell__add-row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
}

.file-structure-shell__add-row-btn :deep(.q-icon) {
  font-size: 16px;
}

.file-structure-shell__action-tooltip {
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
}

.file-structure-shell__delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: rgba(15, 23, 42, 0.5);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 160ms ease;
}

.file-structure-shell__delete-btn:hover {
  color: #0f172a;
}

.file-structure-shell__table-cell-surface {
  min-height: 52px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(241, 245, 249, 0.86));
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

  .file-structure-shell__group-head {
    flex-wrap: wrap;
    align-items: center;
  }

  .file-structure-shell__section-picker {
    margin: 0;
  }

  .file-structure-shell__grid {
    grid-template-columns: 1fr;
  }
}
</style>
