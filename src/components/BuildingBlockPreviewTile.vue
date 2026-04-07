<template>
  <article
    class="building-block-preview-tile"
    :class="[`building-block-preview-tile--${size}`, { 'building-block-preview-tile--collapsed': isCollapsed }]"
  >
    <BuildingBlockTileHeader
      :title="tileTitle"
      :graph-label="tileGraphLabel"
      :shells-label="tileShellsLabel"
      :status-label="tileStatusLabel"
      :status-class="statusClass"
      :collapsed="isCollapsed"
      @toggle-collapse="isCollapsed = !isCollapsed"
    >
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </BuildingBlockTileHeader>

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

      <template v-else-if="blockKey === 'fonts'">
        <div class="building-block-preview-tile__foundation-stack">
          <article
            v-for="sample in foundationFontSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-panel"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-font-sample" :style="{ fontFamily: sample.fontFamily }">
              {{ sample.sample }}
            </div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'type-scale'">
        <div class="building-block-preview-tile__foundation-stack">
          <div
            v-for="sample in foundationTypeScaleSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-type-row"
          >
            <div class="building-block-preview-tile__foundation-type-meta">
              <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
              <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
            </div>
            <div class="building-block-preview-tile__foundation-type-sample" :style="{ fontSize: sample.size }">
              Sample Text
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'font-weights'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationFontWeightSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-weight-sample" :style="{ fontWeight: sample.weight }">
              Weight Sample
            </div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'colors'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationColorSwatches"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-swatch" :style="{ background: sample.color }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'surfaces'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationSurfaceSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-surface" :style="{ background: sample.background }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'borders'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationBorderSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-border-sample" :style="{ border: sample.border }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'radius'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationRadiusSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-radius-sample" :style="{ borderRadius: sample.radius }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'shadows'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationShadowSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-shadow-sample" :style="{ boxShadow: sample.shadow }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'spacing'">
        <div class="building-block-preview-tile__foundation-stack">
          <div
            v-for="sample in foundationSpacingSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-spacing-row"
          >
            <div class="building-block-preview-tile__foundation-type-meta">
              <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}px</div>
              <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
            </div>
            <div class="building-block-preview-tile__foundation-spacing-track">
              <div class="building-block-preview-tile__foundation-spacing-bar" :style="{ width: sample.width }" />
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'icon-sizing'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationIconSizeSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-icon-sample" :style="{ width: sample.size, height: sample.size }">
              <q-icon name="add" :size="sample.size" />
            </div>
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'formatting-rules'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationFormattingSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-format-value">{{ sample.value }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'motion-rules'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationMotionSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-motion-sample" :style="{ transform: sample.transform }" />
            <div class="building-block-preview-tile__foundation-token">{{ sample.detail }}</div>
          </article>
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

      <template v-else-if="blockKey === 'l2-toolbar'">
        <ShellSectionToolbar
          model-value="general"
          :items="l2ToolbarItems"
          view-mode="card"
          :view-options="viewOptions"
          :show-view-toggle="true"
        />
      </template>

      <template v-else>
        <div class="building-block-preview-tile__placeholder">
          <div class="building-block-preview-tile__placeholder-title">Preview<br>Pending</div>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import HomeDashboardHero from 'src/components/HomeDashboardHero.vue'
import FilePageHeroDashboard from 'src/components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import BuildingBlockTileHeader from 'src/components/BuildingBlockTileHeader.vue'
import { BUILDING_BLOCK_DETAILS_BY_ID, getBuildingBlockGraphCounts, getBuildingBlockTileSize } from 'src/utils/buildingBlocks'
import {
  GENERAL_SETTINGS_BORDER_SAMPLES,
  GENERAL_SETTINGS_COLOR_SWATCHES,
  GENERAL_SETTINGS_FONT_SAMPLES,
  GENERAL_SETTINGS_FONT_WEIGHT_SAMPLES,
  GENERAL_SETTINGS_FORMATTING_SAMPLES,
  GENERAL_SETTINGS_ICON_SIZE_SAMPLES,
  GENERAL_SETTINGS_MOTION_SAMPLES,
  GENERAL_SETTINGS_RADIUS_SAMPLES,
  GENERAL_SETTINGS_SHADOW_SAMPLES,
  GENERAL_SETTINGS_SPACING_SAMPLES,
  GENERAL_SETTINGS_SURFACE_SAMPLES,
  GENERAL_SETTINGS_TYPE_SCALE_SAMPLES,
} from 'src/utils/generalSettingsCatalog'

const props = defineProps({
  blockKey: { type: String, required: true },
  title: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  collapseState: { type: String, default: '' },
  collapseVersion: { type: Number, default: 0 },
})

const detail = computed(() => BUILDING_BLOCK_DETAILS_BY_ID[props.blockKey] || null)
const isCollapsed = ref(false)
const size = computed(() => getBuildingBlockTileSize(props.blockKey))
const tileTitle = computed(() => props.title || detail.value?.title || 'Building Block')
const tileGraphCounts = computed(() => getBuildingBlockGraphCounts(props.blockKey))
const tileGraphLabel = computed(() => `[${tileGraphCounts.value.parentCount}/${tileGraphCounts.value.childCount}]`)
const tileShellsLabel = computed(() => `Shells: ${(detail.value?.usedInShells || []).length}`)
const tileStatusLabel = computed(() => props.statusLabel || detail.value?.statusLabel || 'Extract Next')
const statusClass = computed(() =>
  (detail.value?.status || '').trim() === 'canonical'
    ? 'building-block-preview-tile__status--canonical'
    : 'building-block-preview-tile__status--extract',
)
const stageClass = computed(() =>
  ['fonts', 'type-scale', 'colors', 'surfaces', 'spacing', 'formatting-rules', 'motion-rules', 'file-dashboard', 'home-dashboard', 'file-toolbar', 'l2-toolbar'].includes(props.blockKey)
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

const l2ToolbarItems = [
  { value: 'general', title: 'General', isKdb: false, isSystem: false, pushRight: false },
  { value: 'resources', title: 'Resources', isKdb: false, isSystem: false, pushRight: false },
  { value: 'record-data', title: 'Record Data', isKdb: false, isSystem: false, pushRight: false },
  { value: 'kdb', title: 'KDB', isKdb: true, isSystem: false, pushRight: true },
  { value: 'system', title: 'System', isKdb: false, isSystem: true, pushRight: false },
]

const foundationFontSamples = GENERAL_SETTINGS_FONT_SAMPLES
const foundationTypeScaleSamples = GENERAL_SETTINGS_TYPE_SCALE_SAMPLES
const foundationFontWeightSamples = GENERAL_SETTINGS_FONT_WEIGHT_SAMPLES
const foundationColorSwatches = GENERAL_SETTINGS_COLOR_SWATCHES
const foundationSurfaceSamples = GENERAL_SETTINGS_SURFACE_SAMPLES
const foundationBorderSamples = GENERAL_SETTINGS_BORDER_SAMPLES
const foundationRadiusSamples = GENERAL_SETTINGS_RADIUS_SAMPLES
const foundationShadowSamples = GENERAL_SETTINGS_SHADOW_SAMPLES
const foundationSpacingSamples = GENERAL_SETTINGS_SPACING_SAMPLES
const foundationIconSizeSamples = GENERAL_SETTINGS_ICON_SIZE_SAMPLES
const foundationFormattingSamples = GENERAL_SETTINGS_FORMATTING_SAMPLES
const foundationMotionSamples = GENERAL_SETTINGS_MOTION_SAMPLES

const fileDashboardHealth = [
  { tone: 'positive', width: 58 },
  { tone: 'warning', width: 24 },
  { tone: 'neutral', width: 18 },
]

const addLabel = computed(() => (props.blockKey === 'plus-with-label' ? 'Add Record' : 'Add'))

watch(
  () => props.collapseVersion,
  () => {
    if (props.collapseState === 'collapsed') isCollapsed.value = true
    if (props.collapseState === 'expanded') isCollapsed.value = false
  },
)
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

.building-block-preview-tile--sm { --tile-cols: 4; --tile-rows: 4; }
.building-block-preview-tile--md { --tile-cols: 6; --tile-rows: 4; }
.building-block-preview-tile--lg { --tile-cols: 9; --tile-rows: 6; }
.building-block-preview-tile--toolbar-wide { --tile-cols: 14; --tile-rows: 4; }
.building-block-preview-tile--dashboard { --tile-cols: 16; --tile-rows: 10; }
.building-block-preview-tile--hero-dashboard { --tile-cols: 18; --tile-rows: 11; }
.building-block-preview-tile--full-row {
  --tile-rows: 11;
  grid-column: 1 / -1;
}
.building-block-preview-tile--stat-box { --tile-cols: 6; --tile-rows: 6; }
.building-block-preview-tile--live-link { --tile-cols: 7; --tile-rows: 4; }
.building-block-preview-tile--settings-menu { --tile-cols: 8; --tile-rows: 8; }
.building-block-preview-tile--widget-settings { --tile-cols: 8; --tile-rows: 8; }
.building-block-preview-tile--title-wide { --tile-cols: 10; --tile-rows: 5; }

.building-block-preview-tile--collapsed {
  grid-row: span 2;
  gap: 8px;
}

.building-block-preview-tile--full-row:not(.building-block-preview-tile--collapsed) {
  padding: 18px 10px 18px 12px;
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

.building-block-preview-tile__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

.building-block-preview-tile__stage--left {
  justify-content: center;
  width: 100%;
}

.building-block-preview-tile__stage--row {
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.building-block-preview-tile__stage--stretch {
  align-items: stretch;
  justify-content: stretch;
}

.building-block-preview-tile--full-row .building-block-preview-tile__stage--stretch {
  width: 100%;
}

.building-block-preview-tile--full-row :deep(.home-dashboard-hero),
.building-block-preview-tile--full-row :deep(.file-page-hero-dashboard),
.building-block-preview-tile--full-row :deep(.file-page-toolbar),
.building-block-preview-tile--full-row :deep(.shell-section-toolbar) {
  width: 100%;
  max-width: none;
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

.building-block-preview-tile__foundation-stack {
  display: grid;
  gap: 10px;
  width: 100%;
}

.building-block-preview-tile__foundation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
}

.building-block-preview-tile__foundation-panel,
.building-block-preview-tile__foundation-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  min-width: 0;
}

.building-block-preview-tile__foundation-meta {
  color: rgba(17, 17, 17, 0.58);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.building-block-preview-tile__foundation-token {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
  word-break: break-word;
}

.building-block-preview-tile__foundation-font-sample {
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base-regular);
  line-height: var(--ds-line-height-base);
}

.building-block-preview-tile__foundation-type-row,
.building-block-preview-tile__foundation-spacing-row {
  display: grid;
  grid-template-columns: minmax(132px, 160px) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
}

.building-block-preview-tile__foundation-type-meta {
  display: grid;
  gap: 4px;
}

.building-block-preview-tile__foundation-type-sample {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-weight: var(--ds-font-weight-black);
  letter-spacing: -0.03em;
  line-height: 1;
}

.building-block-preview-tile__foundation-weight-sample {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.building-block-preview-tile__foundation-swatch,
.building-block-preview-tile__foundation-surface,
.building-block-preview-tile__foundation-border-sample,
.building-block-preview-tile__foundation-radius-sample,
.building-block-preview-tile__foundation-shadow-sample {
  width: 100%;
  min-height: 56px;
  border-radius: 12px;
}

.building-block-preview-tile__foundation-swatch {
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__foundation-surface {
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__foundation-border-sample,
.building-block-preview-tile__foundation-radius-sample,
.building-block-preview-tile__foundation-shadow-sample {
  background: rgba(248, 250, 252, 0.84);
}

.building-block-preview-tile__foundation-spacing-track {
  display: flex;
  align-items: center;
  min-height: 14px;
  width: 100%;
}

.building-block-preview-tile__foundation-spacing-bar {
  height: 10px;
  border-radius: 999px;
  background: var(--ds-color-brand-blue);
}

.building-block-preview-tile__foundation-icon-sample {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: var(--ds-color-brand-blue);
  border-radius: 999px;
}

.building-block-preview-tile__foundation-format-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-black);
  letter-spacing: -0.03em;
  line-height: 1;
}

.building-block-preview-tile__foundation-motion-sample {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(38, 71, 255, 0.18), rgba(17, 17, 17, 0.08)),
    var(--ds-color-surface-subtle);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__placeholder {
  display: grid;
  align-content: center;
  justify-items: center;
  width: 100%;
  text-align: center;
}

.building-block-preview-tile__placeholder-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

@media (max-width: 900px) {
  .building-block-preview-tile--title-wide,
  .building-block-preview-tile--toolbar-wide,
  .building-block-preview-tile--dashboard,
  .building-block-preview-tile--hero-dashboard {
    --tile-cols: 8;
  }

  .building-block-preview-tile--full-row {
    --tile-rows: 12;
  }

  .building-block-preview-tile--dashboard,
  .building-block-preview-tile--hero-dashboard {
    --tile-rows: 12;
  }
}
</style>
