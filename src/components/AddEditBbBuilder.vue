<template>
  <div class="add-edit-bb-builder">
    <div class="add-edit-bb-builder__frame" :style="frameStyle">
      <div class="add-edit-bb-builder__header-block">
        <div class="add-edit-bb-builder__dialog-header">
          <div class="add-edit-bb-builder__title-block">
            <RecordTitle title="Add/Edit BB" />
          </div>
          <div class="add-edit-bb-builder__header-code-box">
            <BbCodeInput
              v-model="bbCode"
              placeholder="Enter bb:code"
              @enter="selectBbFromCode"
            />
          </div>
          <div class="add-edit-bb-builder__control-box">
            <SearchBarInput
              v-model="searchValue"
              placeholder="Search"
            />
          </div>
        </div>
        <div class="add-edit-bb-builder__divider" />
      </div>

      <div class="add-edit-bb-builder__body">
        <div class="add-edit-bb-builder__render-row">
          <div class="add-edit-bb-builder__render-main">
            <BbRenderFrame>
              <BuildingBlockPreviewTile
                v-if="selectedBlockKey"
                :block-key="selectedBlockKey"
                class="add-edit-bb-builder__rendered-bb"
              />
            </BbRenderFrame>
          </div>
        </div>
        <div class="add-edit-bb-builder__divider add-edit-bb-builder__divider--body" />
        <div class="add-edit-bb-builder__tabs-row">
          <SectionTabs
            v-model="activeSectionTab"
            :left-tabs="sectionTabsLeft"
            :right-tabs="[]"
          />
          <div class="add-edit-bb-builder__tabs-actions">
            <MainMenuIconButton
              aria-label="Toggle built from building blocks"
              :disable="!selectedBlockKey"
              @click="detailsPanelOpen = !detailsPanelOpen"
            />
            <button
              type="button"
              class="add-edit-bb-builder__grid-toggle"
              :aria-label="bbGridExpanded ? 'Collapse building blocks' : 'Expand building blocks'"
              @click="bbGridExpanded = !bbGridExpanded"
            >
              <q-icon :name="bbGridExpanded ? 'unfold_less' : 'unfold_more'" />
            </button>
            <button
              type="button"
              class="add-edit-bb-builder__close"
              aria-label="Close builder"
              @click="clearRenderedBlock"
            >
              <q-icon name="close" />
            </button>
          </div>
        </div>

        <BbSelectionFrame v-if="bbGridExpanded">
          <div class="add-edit-bb-builder__bb-scroll ds-mini-scrollbar">
            <div
              v-if="detailsPanelOpen && layeredBbColumns.length"
              class="add-edit-bb-builder__bb-layer-grid"
              :style="{ '--bb-layer-column-count': String(layeredBbColumns.length) }"
            >
              <section
                v-for="column in layeredBbColumns"
                :key="column.layer"
                class="add-edit-bb-builder__bb-layer-column"
              >
                <div class="add-edit-bb-builder__bb-layer-heading">{{ column.label }}</div>
                <div class="add-edit-bb-builder__bb-layer-list ds-mini-scrollbar">
                  <button
                    v-for="item in column.items"
                    :key="item.key"
                    type="button"
                    class="add-edit-bb-builder__bb-code"
                    @click="selectBbFromList(item.key)"
                  >
                    {{ item.key }}
                  </button>
                </div>
              </section>
            </div>

            <div v-else-if="activeBbCodeItems.length" class="add-edit-bb-builder__bb-grid">
              <button
                v-for="item in activeBbCodeItems"
                :key="item.key"
                type="button"
                class="add-edit-bb-builder__bb-code"
                @click="selectBbFromList(item.key)"
              >
                {{ item.key }}
              </button>
            </div>

            <div v-else class="add-edit-bb-builder__bb-empty">
              No child BB codes are defined for the rendered building block yet.
            </div>
          </div>
        </BbSelectionFrame>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BbCodeInput from 'src/components/BbCodeInput.vue'
import BbRenderFrame from 'src/components/BbRenderFrame.vue'
import BbSelectionFrame from 'src/components/BbSelectionFrame.vue'
import BuildingBlockPreviewTile from 'src/components/BuildingBlockPreviewTile.vue'
import MainMenuIconButton from 'src/components/buttons/MainMenuIconButton.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'
import SectionTabs from 'src/components/SectionTabs.vue'
import { DEFAULT_BUILDING_BLOCK_FILE_ROWS, getBuildingBlockDetail, getBuildingBlockTileSize } from 'src/utils/buildingBlocks'

defineOptions({ name: 'AddEditBbBuilder' })

const bbCode = ref('')
const searchValue = ref('')
const activeSectionTab = ref('Basic Elements')
const bbGridExpanded = ref(true)
const detailsPanelOpen = ref(false)
const selectedBlockKey = ref('')
const MAX_BB_LAYER_COLUMNS = DEFAULT_BUILDING_BLOCK_FILE_ROWS.reduce((maxDepth, row) => {
  const key = String(row?.id || '').trim()
  return Math.max(maxDepth, getBlockDepth(key))
}, 0)

const selectedBlockTileSize = computed(() => getBuildingBlockTileSize(selectedBlockKey.value))

const frameStyle = computed(() => ({
  width: resolveFrameWidth(selectedBlockTileSize.value),
  maxWidth: 'calc(100vw - 32px)',
}))

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

const builtFromBlockItems = computed(() => {
  const detail = getBuildingBlockDetail(selectedBlockKey.value)
  const dependencies = Array.isArray(detail?.builtFromBbs) ? detail.builtFromBbs : []
  return dependencies
    .map((dependency) => {
      const key = String(dependency || '').trim()
      if (!key) return null
      const childDetail = getBuildingBlockDetail(key)
      return {
        key,
        title: String(childDetail?.title || key).trim(),
      }
    })
    .filter(Boolean)
})

const activeBbCodeItems = computed(() => {
  if (detailsPanelOpen.value) return builtFromBlockItems.value
  return activeBbCodes.value.map((key) => ({ key }))
})

const layeredBbColumns = computed(() => {
  if (!detailsPanelOpen.value) return []
  const normalizedSelectedKey = normalizeBlockKey(selectedBlockKey.value)
  if (!normalizedSelectedKey || !getBuildingBlockDetail(normalizedSelectedKey)) return createEmptyLayerColumns()

  const memo = new Map()
  const reachableKeys = collectReachableKeys(normalizedSelectedKey)
  const query = String(searchValue.value || '').trim().toLowerCase()
  const columns = createEmptyLayerColumns()

  reachableKeys.forEach((key) => {
    const detail = getBuildingBlockDetail(key)
    const item = {
      key,
      title: String(detail?.title || key).trim(),
    }
    if (query && !item.key.toLowerCase().includes(query) && !item.title.toLowerCase().includes(query)) return
    const layer = Math.min(getBlockLayerFromLeaf(key, memo), Math.max(MAX_BB_LAYER_COLUMNS - 1, 0))
    columns[layer]?.items.push(item)
  })

  return columns.map((column) => ({
    ...column,
    items: [...column.items].sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' })),
  }))
})

function normalizeBlockKey(value) {
  return String(value || '').trim().replace(/^bb:/i, '')
}

function getChildBlockKeys(blockKey = '') {
  const detail = getBuildingBlockDetail(blockKey)
  return (Array.isArray(detail?.builtFromBbs) ? detail.builtFromBbs : [])
    .map((dependency) => normalizeBlockKey(dependency))
    .filter((dependency) => dependency && !!getBuildingBlockDetail(dependency))
}

function getBlockDepth(blockKey = '', visiting = new Set()) {
  const normalizedKey = normalizeBlockKey(blockKey)
  if (!normalizedKey || visiting.has(normalizedKey)) return 0
  const childKeys = getChildBlockKeys(normalizedKey)
  if (!childKeys.length) return 1
  const nextVisiting = new Set(visiting)
  nextVisiting.add(normalizedKey)
  return 1 + Math.max(...childKeys.map((childKey) => getBlockDepth(childKey, nextVisiting)))
}

function getBlockLayerFromLeaf(blockKey = '', memo = new Map(), visiting = new Set()) {
  const normalizedKey = normalizeBlockKey(blockKey)
  if (!normalizedKey) return 0
  if (memo.has(normalizedKey)) return memo.get(normalizedKey)
  if (visiting.has(normalizedKey)) return 0
  const childKeys = getChildBlockKeys(normalizedKey)
  if (!childKeys.length) {
    memo.set(normalizedKey, 0)
    return 0
  }
  const nextVisiting = new Set(visiting)
  nextVisiting.add(normalizedKey)
  const layer = 1 + Math.max(...childKeys.map((childKey) => getBlockLayerFromLeaf(childKey, memo, nextVisiting)))
  memo.set(normalizedKey, layer)
  return layer
}

function collectReachableKeys(blockKey = '', visited = new Set()) {
  const normalizedKey = normalizeBlockKey(blockKey)
  if (!normalizedKey || visited.has(normalizedKey) || !getBuildingBlockDetail(normalizedKey)) return visited
  visited.add(normalizedKey)
  getChildBlockKeys(normalizedKey).forEach((childKey) => collectReachableKeys(childKey, visited))
  return visited
}

function createEmptyLayerColumns() {
  return Array.from({ length: MAX_BB_LAYER_COLUMNS }, (_, layer) => ({
    layer,
    label: `${layer} ${layer === 1 ? 'Layer' : 'Layers'}`,
    items: [],
  }))
}

function resolveFrameWidth(tileSize = '') {
  const normalizedTileSize = String(tileSize || '').trim().toLowerCase()
  if (normalizedTileSize === 'full-row') return 'min(1680px, calc(100vw - 32px))'
  if (['dashboard', 'hero-dashboard', 'toolbar-wide'].includes(normalizedTileSize)) return 'min(1520px, calc(100vw - 32px))'
  if (['title-wide', 'lg', 'settings-menu', 'widget-settings', 'live-link', 'stat-box'].includes(normalizedTileSize)) {
    return 'min(1360px, calc(100vw - 32px))'
  }
  return 'min(1180px, calc(100vw - 32px))'
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
  detailsPanelOpen.value = false
}
</script>

<style scoped>
.add-edit-bb-builder {
  min-height: 100%;
  padding: 16px;
}

.add-edit-bb-builder__frame {
  min-width: 0;
  margin: 0 auto;
  padding: 16px;
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-brand-white);
  box-sizing: border-box;
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
  width: 100%;
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
  width: 100%;
  padding-top: 10px;
}

.add-edit-bb-builder__render-row {
  display: grid;
  width: 100%;
}

.add-edit-bb-builder__render-main {
  display: grid;
  min-width: 0;
  width: 100%;
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
  width: 100%;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.add-edit-bb-builder__rendered-bb :deep(.building-block-preview-tile__stage) {
  width: 100%;
  padding: 0;
}

.add-edit-bb-builder__tabs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.add-edit-bb-builder__tabs-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex: 0 0 auto;
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

.add-edit-bb-builder__header-code-box :deep(.bb-code-input),
.add-edit-bb-builder__control-box :deep(.search-bar-input) {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.add-edit-bb-builder__control-box :deep(.q-field__control),
.add-edit-bb-builder__control-box :deep(.q-field__native),
.add-edit-bb-builder__control-box :deep(.q-field__input) {
  min-height: calc(var(--ds-control-height-md) * 0.85);
  height: calc(var(--ds-control-height-md) * 0.85);
}

.add-edit-bb-builder__control-box :deep(.q-field__control) {
  border-radius: var(--ds-radius-micro);
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

.add-edit-bb-builder__bb-layer-grid {
  display: grid;
  grid-template-columns: repeat(var(--bb-layer-column-count), minmax(140px, 1fr));
  gap: 12px;
  min-width: max-content;
}

.add-edit-bb-builder__bb-layer-column {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 140px;
}

.add-edit-bb-builder__bb-layer-heading {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
}

.add-edit-bb-builder__bb-layer-list {
  display: grid;
  align-content: start;
  gap: 8px;
  max-height: calc((var(--ds-font-size-sm) * 1.4 * 5) + (8px * 4));
  overflow-y: auto;
  overflow-x: hidden;
}

.add-edit-bb-builder__bb-scroll {
  max-height: 220px;
  overflow-y: auto;
  overflow-x: auto;
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

.add-edit-bb-builder__bb-empty {
  color: var(--ds-color-brand-dark-grey);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm);
  line-height: 1.4;
}

@media (max-width: 900px) {
  .add-edit-bb-builder__render-row {
    grid-template-columns: 1fr;
  }
}
</style>
