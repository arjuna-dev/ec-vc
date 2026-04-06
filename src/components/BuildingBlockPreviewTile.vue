<template>
  <article
    class="building-block-preview-tile"
    :class="[`building-block-preview-tile--${size}`, { 'building-block-preview-tile--collapsed': isCollapsed }]"
  >
    <div v-if="$slots.actions" class="building-block-preview-tile__actions">
      <slot name="actions" />
    </div>

    <div class="building-block-preview-tile__header">
      <div class="building-block-preview-tile__header-main">
        <div class="building-block-preview-tile__label-row">
          <div class="building-block-preview-tile__label">{{ tileTitle }}</div>
          <button
            type="button"
            class="building-block-preview-tile__collapse-toggle"
            :aria-label="isCollapsed ? 'Expand block tile' : 'Collapse block tile'"
            @click="isCollapsed = !isCollapsed"
          >
            <q-icon :name="isCollapsed ? 'chevron_right' : 'expand_more'" size="16px" />
          </button>
        </div>

        <div
          v-if="isCollapsed"
          class="building-block-preview-tile__title building-block-preview-tile__title--inline"
          :class="{ 'building-block-preview-tile__title--placeholder': !title }"
        >
          {{ title || 'Untitled building block' }}
        </div>

        <div v-else class="building-block-preview-tile__status" :class="statusClass">{{ tileStatusLabel }}</div>
      </div>
    </div>

    <div v-if="!isCollapsed" class="building-block-preview-tile__stage" :class="stageClass">
      <template v-if="blockKey === 'page-title-crumb'">
        <div class="building-block-preview-tile__crumb-shell">
          <div class="building-block-preview-tile__crumb-row">
            <span class="building-block-preview-tile__crumb-link">Files</span>
            <span class="building-block-preview-tile__crumb-separator">/</span>
            <span class="building-block-preview-tile__crumb-current">Building Blocks</span>
          </div>
          <div class="building-block-preview-tile__page-title">Building Blocks</div>
        </div>
      </template>

      <template v-else-if="blockKey === 'plus-icon'">
        <button
          type="button"
          class="building-block-preview-tile__file-add-button-plus building-block-preview-tile__file-add-button-plus--standalone"
          aria-label="Add"
        >
          <q-icon name="add" />
        </button>
      </template>

      <template v-else-if="blockKey === 'plus-with-label'">
        <button type="button" class="building-block-preview-tile__file-add-button">
          <span class="building-block-preview-tile__file-add-button-inner">
            <span class="building-block-preview-tile__file-add-button-plus">
              <q-icon name="add" />
            </span>
            <span class="building-block-preview-tile__file-add-button-label">{{ addLabel }}</span>
          </span>
        </button>
      </template>

      <template v-else-if="blockKey === 'file-dashboard'">
        <FilePageHeroDashboard
          eyebrow="Dashboard"
          title="Companies"
          text="Track the live operating picture for this file and move through core workflows from one surface."
          :stats="fileDashboardStats"
          health-label="File Health"
          health-text="Healthy structure with active records and recent updates."
          :health-segments="fileDashboardHealth"
        />
      </template>

      <template v-else-if="blockKey === 'home-dashboard'">
        <HomeDashboardHero
          count="2.4k"
          text="records tracked across the workspace"
          :stats="homeDashboardStats"
          workspace-root-value="C:\\Workspace\\B10"
          :signals="homeDashboardSignals"
        />
      </template>

      <template v-else-if="blockKey === 'file-toolbar'">
        <FilePageToolbar
          :all-visible-selected="false"
          :some-visible-selected="true"
          add-label="Add Record"
          search-query=""
          search-placeholder="Search Companies"
          view-mode="card"
          :view-options="viewOptions"
          :show-view-toggle="true"
        />
      </template>

      <template v-else>
        <div class="building-block-preview-tile__placeholder">
          <div class="building-block-preview-tile__placeholder-title">Preview Pending</div>
          <div class="building-block-preview-tile__placeholder-text">
            This building block does not have a shared live preview yet.
          </div>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import HomeDashboardHero from 'src/components/HomeDashboardHero.vue'
import FilePageHeroDashboard from 'src/components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import { BUILDING_BLOCK_DETAILS_BY_ID, getBuildingBlockTileSize } from 'src/utils/buildingBlocks'

const props = defineProps({
  blockKey: { type: String, required: true },
  title: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
})

const detail = computed(() => BUILDING_BLOCK_DETAILS_BY_ID[props.blockKey] || null)
const isCollapsed = ref(false)
const size = computed(() => getBuildingBlockTileSize(props.blockKey))
const tileTitle = computed(() => props.title || detail.value?.title || 'Building Block')
const tileStatusLabel = computed(() => props.statusLabel || detail.value?.statusLabel || 'Extract Next')
const statusClass = computed(() =>
  (detail.value?.status || '').trim() === 'canonical'
    ? 'building-block-preview-tile__status--canonical'
    : 'building-block-preview-tile__status--extract',
)
const stageClass = computed(() =>
  ['file-dashboard', 'home-dashboard', 'file-toolbar'].includes(props.blockKey)
    ? 'building-block-preview-tile__stage--stretch'
    : props.blockKey === 'page-title-crumb'
      ? 'building-block-preview-tile__stage--left'
      : 'building-block-preview-tile__stage--row',
)

const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]

const fileDashboardStats = [
  { label: 'Records', value: '128', caption: 'Tracked rows', tone: 'neutral' },
  { label: 'Updated', value: '12', caption: 'Changed today', tone: 'positive' },
  { label: 'Open', value: '7', caption: 'Items needing attention', tone: 'warning' },
  { label: 'Links', value: '93%', caption: 'KDB coverage', tone: 'positive' },
]

const homeDashboardStats = [
  { label: 'Open tasks', value: '27' },
  { label: 'Recent adds (7d)', value: '41' },
  { label: 'Projects active', value: '12/16' },
]

const homeDashboardSignals = [
  { label: 'Companies', value: '412' },
  { label: 'Tasks', value: '183' },
  { label: 'Opportunities', value: '74' },
]

const fileDashboardHealth = [
  { tone: 'positive', width: 58 },
  { tone: 'warning', width: 24 },
  { tone: 'neutral', width: 18 },
]

const addLabel = computed(() => (props.blockKey === 'plus-with-label' ? 'Add Record' : 'Add'))
</script>

<style scoped>
.building-block-preview-tile {
  --tile-cols: 4;
  --tile-rows: 4;
  position: relative;
  display: flex;
  flex-direction: column;
  grid-column: span var(--tile-cols);
  grid-row: span var(--tile-rows);
  gap: 10px;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
}

.building-block-preview-tile--collapsed {
  --tile-rows: 2;
  gap: 8px;
}

.building-block-preview-tile--sm { --tile-cols: 4; --tile-rows: 4; }
.building-block-preview-tile--md { --tile-cols: 6; --tile-rows: 4; }
.building-block-preview-tile--lg { --tile-cols: 9; --tile-rows: 6; }
.building-block-preview-tile--toolbar-wide { --tile-cols: 14; --tile-rows: 4; }
.building-block-preview-tile--dashboard { --tile-cols: 16; --tile-rows: 10; }
.building-block-preview-tile--stat-box { --tile-cols: 6; --tile-rows: 6; }
.building-block-preview-tile--live-link { --tile-cols: 7; --tile-rows: 4; }
.building-block-preview-tile--settings-menu { --tile-cols: 8; --tile-rows: 8; }
.building-block-preview-tile--widget-settings { --tile-cols: 8; --tile-rows: 8; }
.building-block-preview-tile--title-wide { --tile-cols: 10; --tile-rows: 5; }

.building-block-preview-tile__actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.building-block-preview-tile__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.building-block-preview-tile__header-main {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.building-block-preview-tile__label-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.building-block-preview-tile__label {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-block-preview-tile__collapse-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.building-block-preview-tile__status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 20px;
  padding: 0 8px;
  border: 1px solid transparent;
  font-family: var(--font-title);
  font-size: 0.58rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.building-block-preview-tile__status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.building-block-preview-tile__status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.18);
}

.building-block-preview-tile__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.38rem;
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  letter-spacing: -0.04em;
  max-width: calc(100% - 56px);
}

.building-block-preview-tile__title--placeholder {
  color: rgba(15, 23, 42, 0.45);
}

.building-block-preview-tile__title--inline {
  max-width: 100%;
  font-size: 0.98rem;
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.building-block-preview-tile__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

.building-block-preview-tile__stage--left {
  justify-content: flex-start;
  width: 100%;
}

.building-block-preview-tile__stage--row {
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.building-block-preview-tile__stage--stretch {
  align-items: stretch;
  justify-content: stretch;
}

.building-block-preview-tile__crumb-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.building-block-preview-tile__crumb-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.building-block-preview-tile__crumb-link,
.building-block-preview-tile__crumb-separator {
  color: rgba(15, 23, 42, 0.56);
  font-family: var(--font-body);
  font-size: 0.84rem;
  line-height: 1;
}

.building-block-preview-tile__crumb-current,
.building-block-preview-tile__page-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
}

.building-block-preview-tile__crumb-current {
  font-size: 0.84rem;
  line-height: 1;
}

.building-block-preview-tile__page-title {
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.08em;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}

.building-block-preview-tile__file-add-button {
  align-self: center;
  min-width: 36px;
  min-height: 36px;
  height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
  cursor: pointer;
}

.building-block-preview-tile__file-add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.building-block-preview-tile__file-add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #ffffff;
  background: #2647ff;
  border-radius: 999px;
}

.building-block-preview-tile__file-add-button-plus :deep(.q-icon) {
  font-size: 16px;
}

.building-block-preview-tile__file-add-button-plus--standalone {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
}

.building-block-preview-tile__file-add-button-plus--standalone :deep(.q-icon) {
  font-size: 20px;
}

.building-block-preview-tile__file-add-button-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: -0.02em;
}

.building-block-preview-tile__placeholder {
  display: grid;
  gap: 8px;
  align-content: center;
  width: 100%;
}

.building-block-preview-tile__placeholder-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.building-block-preview-tile__placeholder-text {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-body);
  font-size: 0.84rem;
  line-height: 1.35;
}

@media (max-width: 900px) {
  .building-block-preview-tile--title-wide,
  .building-block-preview-tile--toolbar-wide,
  .building-block-preview-tile--dashboard {
    --tile-cols: 8;
  }

  .building-block-preview-tile--dashboard {
    --tile-rows: 12;
  }
}
</style>
