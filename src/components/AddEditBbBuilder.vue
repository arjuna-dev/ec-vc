<template>
  <div class="add-edit-bb-builder">
    <div class="add-edit-bb-builder__frame">
      <div class="add-edit-bb-builder__header-block">
        <div class="add-edit-bb-builder__dialog-header">
          <div class="add-edit-bb-builder__title-block">
            <RecordTitle title="Add/Edit BB" />
          </div>
          <div class="add-edit-bb-builder__header-code-box">
            <SearchBarInput
              v-model="bbCode"
              placeholder="Enter bb:code"
              @keyup.enter="selectBbFromCode"
            />
          </div>
          <div class="add-edit-bb-builder__control-box">
            <SearchBarInput
              v-model="searchValue"
              placeholder="Search"
            />
          </div>
          <button
            type="button"
            class="add-edit-bb-builder__close"
            aria-label="Close builder"
            @click="clearRenderedBlock"
          >
            <q-icon name="close" />
          </button>
        </div>
        <div class="add-edit-bb-builder__divider" />
      </div>

      <div class="add-edit-bb-builder__body">
        <BbRenderFrame>
          <BuildingBlockPreviewTile
            v-if="selectedBlockKey"
            :block-key="selectedBlockKey"
            class="add-edit-bb-builder__rendered-bb"
          />
        </BbRenderFrame>
        <div class="add-edit-bb-builder__divider add-edit-bb-builder__divider--body" />
        <div class="add-edit-bb-builder__tabs-row">
          <SectionTabs
            v-model="activeSectionTab"
            :left-tabs="sectionTabsLeft"
            :right-tabs="[]"
          />
          <button
            type="button"
            class="add-edit-bb-builder__grid-toggle"
            :aria-label="bbGridExpanded ? 'Collapse building blocks' : 'Expand building blocks'"
            @click="bbGridExpanded = !bbGridExpanded"
          >
            <q-icon :name="bbGridExpanded ? 'unfold_less' : 'unfold_more'" />
          </button>
        </div>

        <BbSelectionFrame v-if="bbGridExpanded">
          <div class="add-edit-bb-builder__bb-scroll ds-mini-scrollbar">
            <div class="add-edit-bb-builder__bb-grid">
              <button
                v-for="code in activeBbCodes"
                :key="code"
                type="button"
                class="add-edit-bb-builder__bb-code"
                @click="selectBbFromList(code)"
              >
                {{ code }}
              </button>
            </div>
          </div>
        </BbSelectionFrame>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BbRenderFrame from 'src/components/BbRenderFrame.vue'
import BbSelectionFrame from 'src/components/BbSelectionFrame.vue'
import BuildingBlockPreviewTile from 'src/components/BuildingBlockPreviewTile.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'
import SectionTabs from 'src/components/SectionTabs.vue'
import { DEFAULT_BUILDING_BLOCK_FILE_ROWS, getBuildingBlockDetail } from 'src/utils/buildingBlocks'

defineOptions({ name: 'AddEditBbBuilder' })

const bbCode = ref('')
const searchValue = ref('')
const activeSectionTab = ref('Basic Elements')
const bbGridExpanded = ref(true)
const selectedBlockKey = ref('')

const sectionTabsLeft = computed(() =>
  Array.from(new Set(DEFAULT_BUILDING_BLOCK_FILE_ROWS.map((row) => String(row?.Category || '').trim()).filter(Boolean)))
    .map((label) => ({
      key: label,
      label: label.replace(/\s+Components$/i, ''),
    })),
)

const activeBbCodes = computed(() =>
  DEFAULT_BUILDING_BLOCK_FILE_ROWS
    .filter((row) => String(row?.Category || '').trim() === activeSectionTab.value)
    .filter((row) => {
      const query = String(searchValue.value || '').trim().toLowerCase()
      if (!query) return true
      const code = String(row?.id || '').trim().toLowerCase()
      const name = String(row?.Name || '').trim().toLowerCase()
      return code.includes(query) || name.includes(query)
    })
    .map((row) => String(row?.id || '').trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })),
)

function normalizeBlockKey(value) {
  return String(value || '').trim().replace(/^bb:/i, '')
}

function selectBbFromCode() {
  const normalized = normalizeBlockKey(bbCode.value)
  if (!normalized || !getBuildingBlockDetail(normalized)) return
  selectedBlockKey.value = normalized
}

function selectBbFromList(code) {
  const normalized = normalizeBlockKey(code)
  if (!normalized) return
  selectedBlockKey.value = normalized
  bbCode.value = `bb:${normalized}`
}

function clearRenderedBlock() {
  selectedBlockKey.value = ''
  bbCode.value = ''
}
</script>

<style scoped>
.add-edit-bb-builder {
  min-height: 100%;
  padding: 16px;
}

.add-edit-bb-builder__frame {
  width: fit-content;
  max-width: calc(100vw - 32px);
  margin: 0 auto;
  padding: 16px;
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-brand-white);
}

.add-edit-bb-builder__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--ds-color-brand-dark-grey);
  background: transparent;
  border: 0;
  cursor: pointer;
  flex: 0 0 auto;
}

.add-edit-bb-builder__header-block {
  display: grid;
  gap: 10px;
}

.add-edit-bb-builder__dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-edit-bb-builder__title-block {
  min-width: 0;
  flex: 1 1 auto;
}

.add-edit-bb-builder__header-code-box,
.add-edit-bb-builder__control-box {
  width: 144px;
  min-width: 144px;
  flex: 0 0 144px;
}

.add-edit-bb-builder__divider {
  width: 100%;
  height: 1px;
  background: var(--ds-color-brand-light-grey);
}

.add-edit-bb-builder__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.add-edit-bb-builder__divider--body {
  margin: 0;
}

.add-edit-bb-builder__rendered-bb {
  width: 100%;
}

.add-edit-bb-builder__rendered-bb :deep(.building-block-tile-header) {
  display: none;
}

.add-edit-bb-builder__rendered-bb :deep(.building-block-preview-tile) {
  border: 0;
  box-shadow: none;
  background: transparent;
}

.add-edit-bb-builder__rendered-bb :deep(.building-block-preview-tile__stage) {
  padding: 0;
}

.add-edit-bb-builder__tabs-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  max-width: 100%;
}

.add-edit-bb-builder__grid-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--ds-color-brand-dark-grey);
  background: transparent;
  border: 0;
  cursor: pointer;
  flex: 0 0 auto;
}

.add-edit-bb-builder__header-code-box :deep(.search-bar-input),
.add-edit-bb-builder__control-box :deep(.search-bar-input) {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.add-edit-bb-builder__header-code-box :deep(.q-field__control),
.add-edit-bb-builder__header-code-box :deep(.q-field__native),
.add-edit-bb-builder__header-code-box :deep(.q-field__input),
.add-edit-bb-builder__control-box :deep(.q-field__control),
.add-edit-bb-builder__control-box :deep(.q-field__native),
.add-edit-bb-builder__control-box :deep(.q-field__input) {
  min-height: calc(var(--ds-control-height-md) * 0.85);
  height: calc(var(--ds-control-height-md) * 0.85);
}

.add-edit-bb-builder__header-code-box :deep(.q-field__control),
.add-edit-bb-builder__control-box :deep(.q-field__control) {
  border-radius: var(--ds-radius-micro);
}

.add-edit-bb-builder__header-code-box :deep(.q-field__prepend) {
  display: none;
}

.add-edit-bb-builder__header-code-box :deep(.q-field__input),
.add-edit-bb-builder__header-code-box :deep(.q-field__native) {
  font-size: var(--ds-font-size-xs);
  text-align: center;
}

.add-edit-bb-builder__control-box :deep(.q-field__input),
.add-edit-bb-builder__control-box :deep(.q-field__native) {
  font-size: var(--ds-font-size-xs);
  text-align: left;
}

.add-edit-bb-builder__bb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
}

.add-edit-bb-builder__bb-scroll {
  max-height: 125px;
  overflow-y: auto;
  overflow-x: hidden;
}

.add-edit-bb-builder__bb-code {
  min-width: 0;
  padding: 0;
  color: var(--ds-color-brand-dark-grey);
  background: transparent;
  border: 0;
  text-align: left;
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.4;
  cursor: pointer;
}
</style>
