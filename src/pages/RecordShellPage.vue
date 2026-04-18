<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Record Shell source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <div class="record-shell__hero-frame">
        <button
          type="button"
          class="record-shell__hero-chevron"
          :aria-label="heroCollapsed ? 'Expand record hero' : 'Collapse record hero'"
          @click="heroCollapsed = !heroCollapsed"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="record-shell__hero-chevron-icon">
            <path :d="heroCollapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
          </svg>
        </button>

        <div v-if="heroCollapsed" class="record-shell__hero-collapsed">
          <div class="record-shell__hero-collapsed-title">{{ heroName }}</div>
          <div class="record-shell__hero-collapsed-summary">{{ recordHeroCollapsedText }}</div>
        </div>

        <RecordHero
          v-else
          ref="contactHeroRef"
          :style="structuredRecordHeroStyle"
          :title="heroName"
          :initials="heroInitials"
          :settings-groups="heroSettingsGroups"
          :field-cards="selectedHeroFieldCards"
          :summary-value="heroSummaryValue"
          :summary-status-icon="heroSummaryStatusIcon"
          :interactive="isRecordRoute"
          :feed-tab="activeRecordFeedTab"
          :feed-tabs="recordFeedTabOptions"
          :feed-groups="recordFeedGroupOptions"
          :feed-items="feedItems"
          feed-empty-message="No feed items yet for this record."
          @pointerenter="startContactHeroPointerTracking"
          @pointermove="onContactHeroPointerMove"
          @pointerleave="onContactHeroPointerLeave"
          @update:feed-tab="activeRecordFeedTab = $event"
          @toggle-settings-group="toggleHeroGroup"
          @toggle-settings-item="setTokenSelected"
          @open-feed-log="openFeedItemLog"
          @request-feed-add="handleRecordFeedAdd"
        >
          <template #portrait>
            <figure class="record-shell__portrait record-shell__portrait--initials-only">
              <div class="record-shell__portrait-placeholder" aria-hidden="true">
                <div
                  class="record-shell__portrait-placeholder-initials"
                  :style="{ backgroundColor: heroAvatarColor }"
                >
                  {{ heroInitials }}
                </div>
              </div>
            </figure>
          </template>
        </RecordHero>
      </div>

      <FileShellControlBar
        v-if="controlBarItems.length"
        v-model="activeViewGroupKey"
        aria-label="Record shell control bar"
        :items="controlBarItems"
        :disabled="true"
        :select-disabled="true"
        :add-disabled="true"
        :search-disabled="true"
        :filter-disabled="true"
        search-placeholder="Search disabled for this shell"
        :view-mode="'page'"
        :view-mode-disabled="true"
        :collapsed="recordDataSurfaceCollapsed"
        collapse-aria-label="Collapse record data surface"
        expand-aria-label="Expand record data surface"
        @toggle-collapse="recordDataSurfaceCollapsed = !recordDataSurfaceCollapsed"
      />

      <div v-if="!recordDataSurfaceCollapsed && activeGovernanceToolbarKey" class="record-shell__governance-surface">
          <StructureGovernancePanel
            :mode="activeGovernanceToolbarKey === 'governance:views' ? 'views' : 'tokens'"
            :view-rows="governanceViewRows"
            :token-groups="tokenGroupsByView"
            :token-columns="tokenGovernanceColumns"
            empty-views-label="No views declared for this record."
            empty-tokens-label="No tokens declared in this view."
            @update-token-cell="updateTokenCell"
          />
      </div>

      <section v-else-if="!recordDataSurfaceCollapsed" class="record-shell__panel">
        <div v-if="isSystemViewActive" class="record-shell__system-grid">
          <div class="record-shell__system-column">
            <div class="record-shell__field-grid">
              <div
                v-for="token in systemViewTokens"
                :key="token.key"
                class="record-shell__field-card"
              >
                <div class="record-shell__field-label-row">
                  <div class="record-shell__field-label">{{ token.label }}</div>
                </div>
                <div v-if="isRecordRoute" class="record-shell__field-value-row">
                  <div
                    v-if="isSystemReadOnlyInline(token)"
                    class="record-shell__field-static-box"
                  >
                    {{ getTokenDisplayValue(token) }}
                  </div>
                  <q-select
                    v-else-if="token.tokenType === 'select_multi'"
                    :model-value="inlineMultiValue(token)"
                    dense
                    outlined
                    use-chips
                    multiple
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                  />
                  <q-select
                    v-else-if="token.tokenType === 'select_single'"
                    :model-value="inlineSingleValue(token)"
                    dense
                    outlined
                    use-chips
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="commitInlineFieldValue(token, $event)"
                  />
                  <q-input
                    v-else
                    :model-value="inlineStringValue(token)"
                    dense
                    outlined
                    :disable="loading || !isInlineFieldEditable(token)"
                    :type="inlineInputType(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                    @keydown.enter.stop.prevent="commitInlineFieldValue(token)"
                  />
                  <q-btn
                    v-if="showInlineFieldVerificationAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                  >
                    <q-icon
                      :name="inlineFieldVerificationIcon(token)"
                      :class="inlineFieldVerificationIconClass(token)"
                      :style="inlineFieldVerificationIconStyle(token)"
                      size="14px"
                    />
                    <q-menu anchor="bottom right" self="top left">
                      <q-list dense class="record-shell__verification-menu">
                        <q-item
                          v-for="option in fieldVerificationActionOptions"
                          :key="option.value"
                          clickable
                          v-close-popup
                          class="record-shell__verification-menu-item"
                          @click="updateInlineFieldVerificationState(token, option.value)"
                        >
                          <q-item-section avatar>
                            <q-icon :name="option.icon" :style="{ color: option.color }" size="14px" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label class="record-shell__verification-menu-label">{{ option.label }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                  <q-btn
                    v-if="showInlineFieldCopyAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                    aria-label="Copy field value"
                    @click="copyInlineFieldValue(token)"
                  >
                    <q-icon name="content_copy" size="14px" />
                  </q-btn>
                </div>
                <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
              </div>
            </div>
          </div>

          <div class="record-shell__system-column record-shell__system-column--history">
            <div v-if="historySummaryItems.length" class="record-shell__history-summary-box">
              <div
                v-for="item in historySummaryItems"
                :key="item.key"
                class="record-shell__history-summary-item"
              >
                <div class="record-shell__history-summary-label">{{ item.label }}</div>
                <div class="record-shell__history-summary-value">{{ item.value }}</div>
              </div>
            </div>
            <RecordHistoryBox
              title="History"
              :items="isRecordRoute ? feedItems : []"
              :loading="loading"
              empty-label="No history yet for this record."
              @open-item="openFeedItemLog($event?.id)"
            />
          </div>
        </div>

        <div v-else class="record-shell__field-grid">
          <div
            v-for="token in activeViewTokens"
            :key="token.key"
            class="record-shell__field-card"
          >
            <div class="record-shell__field-label-row">
              <div class="record-shell__field-label">{{ token.label }}</div>
            </div>
            <div v-if="isRecordRoute" class="record-shell__field-value-row">
              <div
                v-if="isSystemReadOnlyInline(token)"
                class="record-shell__field-static-box"
              >
                {{ getTokenDisplayValue(token) }}
              </div>
              <q-select
                v-else-if="token.tokenType === 'select_multi'"
                :model-value="inlineMultiValue(token)"
                dense
                outlined
                use-chips
                multiple
                emit-value
                map-options
                :options="token.inputOptions || []"
                :disable="loading || !isInlineFieldEditable(token)"
                class="record-shell__field-input"
                @update:model-value="updateInlineFieldValue(token, $event)"
                @blur="commitInlineFieldValue(token)"
              />
              <q-select
                v-else-if="token.tokenType === 'select_single'"
                :model-value="inlineSingleValue(token)"
                dense
                outlined
                use-chips
                emit-value
                map-options
                :options="token.inputOptions || []"
                :disable="loading || !isInlineFieldEditable(token)"
                class="record-shell__field-input"
                @update:model-value="commitInlineFieldValue(token, $event)"
              />
              <q-input
                v-else
                :model-value="inlineStringValue(token)"
                dense
                outlined
                :disable="loading || !isInlineFieldEditable(token)"
                :type="inlineInputType(token)"
                class="record-shell__field-input"
                @update:model-value="updateInlineFieldValue(token, $event)"
                @blur="commitInlineFieldValue(token)"
                @keydown.enter.stop.prevent="commitInlineFieldValue(token)"
              />
              <q-btn
                v-if="showInlineFieldVerificationAction(token)"
                flat
                dense
                size="sm"
                :disable="loading"
                class="record-shell__field-action"
              >
                <q-icon
                  :name="inlineFieldVerificationIcon(token)"
                  :class="inlineFieldVerificationIconClass(token)"
                  :style="inlineFieldVerificationIconStyle(token)"
                  size="14px"
                />
                <q-menu anchor="bottom right" self="top left">
                  <q-list dense class="record-shell__verification-menu">
                    <q-item
                      v-for="option in fieldVerificationActionOptions"
                      :key="option.value"
                      clickable
                      v-close-popup
                      class="record-shell__verification-menu-item"
                      @click="updateInlineFieldVerificationState(token, option.value)"
                    >
                      <q-item-section avatar>
                        <q-icon :name="option.icon" :style="{ color: option.color }" size="14px" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="record-shell__verification-menu-label">{{ option.label }}</q-item-label>
                      </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
              </q-btn>
              <q-btn
                v-if="showInlineFieldCopyAction(token)"
                flat
                dense
                size="sm"
                :disable="loading"
                class="record-shell__field-action"
                aria-label="Copy field value"
                @click="copyInlineFieldValue(token)"
              >
                <q-icon name="content_copy" size="14px" />
              </q-btn>
            </div>
            <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
          </div>
        </div>
      </section>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import FileShellControlBar from 'src/components/FileShellControlBar.vue'
import RecordHistoryBox from 'src/components/RecordHistoryBox.vue'
import { buildTokenGovernanceColumns } from 'src/utils/structureGovernanceColumns'
import RecordHero from 'src/components/RecordHero.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import {
  getCanonicalTokenFieldNames,
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getRegistrySummaryTokenForSource,
  getRegistryTitleTokenForSource,
  getRuntimeStructureVersion,
  subscribeRuntimeFileStructures,
  getRuntimeTableNameForEntityName,
  buildFileShellPayload,
  FILE_SOURCE_REGISTRY,
  resolveApprovedFileSectionKey,
} from 'src/utils/structureRegistry'
import {
  hydrateFileRecordUniverseFromSystemFiles,
  getLiveOptionRowsState,
  loadFileRecordRows,
  subscribeLiveOptionRowsState,
} from 'src/utils/fileRecordLoaders'
import { buildSurfaceSections, groupSurfaceViews } from 'src/utils/shellViewLayout'
import { filterRecordFeedTabs, RECORD_FEED_GROUP_OPTIONS } from 'src/utils/recordFeedContract'
import { buildShellToolbarFeed } from 'src/utils/shellToolbarFeeder'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { buildTokenUpdateChanges, tokenSupportsRecordUpdate } from 'src/utils/tokenWriteChanges'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const SHELL_FIELD_SELECTION_STORAGE_KEY = 'ecvc:shell-field-selection-by-source'

function normalizeShellFieldSelectionMap(value) {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value)
      .map(([sourceKey, keys]) => [
        String(sourceKey || '').trim().toLowerCase(),
        Array.from(new Set((Array.isArray(keys) ? keys : []).map((key) => String(key || '').trim()).filter(Boolean))),
      ])
      .filter(([sourceKey]) => Boolean(sourceKey)),
  )
}

function loadShellFieldSelectionMap() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return normalizeShellFieldSelectionMap(JSON.parse(window.localStorage.getItem(SHELL_FIELD_SELECTION_STORAGE_KEY) || '{}'))
  } catch {
    return {}
  }
}

function persistShellFieldSelectionMap(value) {
  const normalized = normalizeShellFieldSelectionMap(value)
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SHELL_FIELD_SELECTION_STORAGE_KEY, JSON.stringify(normalized))
  }
  return normalized
}

const liveOptionRowsVersion = ref(0)
const liveOptionRowsBySource = computed(() => {
  liveOptionRowsVersion.value
  return getLiveOptionRowsState()
})
const expandedViewKeys = ref([])
const expandedHeroGroupKeys = ref([])
const activeViewGroupKey = ref('')
const contactHeroRef = ref(null)
const contactHeroGradient = ref({ x: 50, y: 30, size: 60, opacity: 0 })
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null
let liveOptionRowsUnsub = null
const activeRecordFeedTab = ref('events')
const heroCollapsed = ref(false)
const recordDataSurfaceCollapsed = ref(false)
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const hasBridge = computed(() => Boolean(bridge.value))
const loading = ref(false)
const inlineFieldSavingKeys = ref([])
const error = ref('')
const currentView = ref(null)
const fields = ref([])
const auditEvents = ref([])
const fieldVerificationStates = ref({})
const inlineFieldValues = ref({})
const heroFieldKeysBySource = ref(loadShellFieldSelectionMap())
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const isRecordRoute = computed(() => Boolean(tableNameParam.value && recordIdParam.value))
const activeSourceKey = computed(() => {
  if (isRecordRoute.value) {
    return resolveSourceKeyFromTableName(currentView.value?.table_name || tableNameParam.value) || ''
  }
  return resolveApprovedFileSectionKey(route.query.section) || ''
})
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const fileShellPayload = computed(() => {
  runtimeStructureVersion.value
  return buildFileShellPayload(activeSourceKey.value)
})
const fileViews = computed(() => fileShellPayload.value.sections)
const rawFileTokens = computed(() => fileShellPayload.value.tokens)
const fileTokens = computed(() => rawFileTokens.value)
const governanceViewRows = computed(() =>
  fileViews.value.map((view) => {
    const normalized = String(view.label || '').trim().toLowerCase()
    return {
      key: view.key,
      label: view.label,
      side: normalized === 'system' || isRelationshipViewLabel(normalized) ? 'Right' : 'Left',
      tokenCount: fileTokens.value.filter((token) => token.parentKey === view.key).length,
    }
  }),
)
const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => ({
    key: view.key,
    label: view.label,
    tokens: fileTokens.value
      .filter((token) => token.parentKey === view.key)
      .map((token) => ({
        key: token.key,
        label: token.label || '—',
        type: token.tokenType || '—',
        optionSource: token.optionSource || '—',
        optionEntity: token.optionEntity || '—',
        optionList: token.optionList || '—',
        dbWriteField: token.dbWriteField || token.dbFieldAliases?.[0] || '—',
        fieldClass: token.fieldClass || token.field_class || '—',
        required: token.required ? 'Yes' : '—',
        writeTarget: token.dbWriteField || token.dbFieldAliases?.join(', ') || '—',
        editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
      })),
  })),
)
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [String(field?.field_name || '').trim(), field])),
)
const runtimeTableName = computed(() =>
  String(getRuntimeTableNameForEntityName(activeRegistryEntry.value?.entityName || tableNameParam.value) || tableNameParam.value || '').trim(),
)

const canonicalNameToken = computed(() => getRegistryTitleTokenForSource(activeSourceKey.value) || null)
const canonicalSummaryToken = computed(() => getRegistrySummaryTokenForSource(activeSourceKey.value) || null)

const selectableTokens = computed(() =>
  fileTokens.value.filter((token) => {
    const label = String(token.label || '').trim().toLowerCase()
    return label !== 'name' && label !== 'definition'
  }),
)
const viewDisplayTokens = computed(() => fileTokens.value.map((token) => normalizeCreateDialogToken(token)))
const normalizedSelectableTokens = computed(() => selectableTokens.value.map((token) => normalizeCreateDialogToken(token)))

const selectedTokenKeys = computed({
  get() {
    const values = Array.isArray(heroFieldKeysBySource.value[activeSourceKey.value]) ? heroFieldKeysBySource.value[activeSourceKey.value] : []
    const allowed = new Set(normalizedSelectableTokens.value.map((token) => token.key))
    return values.map((value) => String(value || '').trim()).filter((value) => value && allowed.has(value))
  },
  set(value) {
    const normalized = Array.from(new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)))
    heroFieldKeysBySource.value = {
      ...heroFieldKeysBySource.value,
      [activeSourceKey.value]: normalized,
    }
  },
})

const selectedTokenKeySet = computed(() => new Set(selectedTokenKeys.value))

const OPTION_ENTITY_OPTIONS = Object.freeze(
  FILE_SOURCE_REGISTRY
    .map((entry) => {
      const label = String(entry?.label || '').trim()
      return label ? { label, value: label } : null
    })
    .filter(Boolean),
)
const tokenGovernanceColumns = computed(() =>
  buildTokenGovernanceColumns({
    labelCellClass: 'structure-governance-panel__cell--label',
    dataHeaderClass: 'structure-governance-panel__cell--data',
    dataCellClass: 'structure-governance-panel__cell--data',
    optionEntityOptions: OPTION_ENTITY_OPTIONS,
  }),
)

function updateTokenCell() {
  return
}

function isRelationshipViewLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
}
const heroSourceGroups = computed(() =>
  groupedViews.value.filter((group) =>
    Array.isArray(group.views) &&
    group.views.some((view) => {
      const label = String(view.label || '').trim().toLowerCase()
      return label !== 'general' && label !== 'system' && !isRelationshipViewLabel(label)
    }),
  ),
)
const heroSelectableTokens = computed(() => {
  const allowedSectionKeys = new Set(
    heroSourceGroups.value.flatMap((group) => (Array.isArray(group.views) ? group.views : []).map((view) => view.key)),
  )
  return normalizedSelectableTokens.value.filter((token) => allowedSectionKeys.has(token.parentKey))
})
const selectedHeroTokens = computed(() =>
  heroSelectableTokens.value.filter((token) => selectedTokenKeySet.value.has(token.key)),
)
const createKeyFieldTokens = computed(() => [canonicalNameToken.value, canonicalSummaryToken.value].filter(Boolean).map(normalizeCreateDialogToken))
const groupedViews = computed(() =>
  groupSurfaceViews(fileViews.value).map((group) => {
    if (Array.isArray(group.views) && group.views.length === 1) {
      const viewLabel = String(group.views[0]?.label || '').trim()
      const normalized = viewLabel.toLowerCase()
      if (normalized === 'system' || normalized === 'ldb') {
        return { ...group, title: viewLabel }
      }
    }
    return group
  }),
)
const sharedLdbLinksByTargetEntity = ref({})
const sharedLdbViewTokens = computed(() => {
  if (!activeRegistryEntry.value?.entityName) return []

  const systemFileTitleToken = getRegistryTitleTokenForSource('file-system')
  const seenSourceKeys = new Set()
  const rows = Array.isArray(liveOptionRowsBySource.value['file-system']) ? liveOptionRowsBySource.value['file-system'] : []

  return rows
    .map((row, index) => {
      const sourceKey = resolveApprovedFileSectionKey(
        row?.sourceKey || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
      )
      if (!sourceKey || sourceKey === 'bb-file' || seenSourceKeys.has(sourceKey)) return null

      const targetEntry = getFilePageRegistryEntry(sourceKey)
      if (!targetEntry?.entityName) return null

      seenSourceKeys.add(sourceKey)
      return normalizeCreateDialogToken({
        key: `__shared_ldb__:${sourceKey}`,
        tokenName: `__shared_ldb__:${sourceKey}`,
        label:
          String(systemFileTitleToken ? getCanonicalTokenValue(row, systemFileTitleToken) : '').trim()
          || targetEntry.label
          || `File ${index + 1}`,
        tokenType: 'select_multi',
        inputOptions: buildLiveEntityOptions(sourceKey),
        parentKey: activeViewEntries.value[0]?.key || '',
        parentLabel: activeViewEntries.value[0]?.label || 'LDB',
        isSharedLdbToken: true,
        targetSourceKey: sourceKey,
        targetEntity: String(targetEntry.entityName || '').trim(),
      })
    })
    .filter(Boolean)
})
const createViewGroups = computed(() =>
  buildSurfaceSections({
    groupedViews: groupedViews.value,
    tokenFilter: (view) => (
      isRelationshipViewLabel(view?.label)
        ? sharedLdbViewTokens.value
        : normalizedSelectableTokens.value.filter(
            (token) => token.parentKey === view.key && (isRecordRoute.value || selectedTokenKeySet.value.has(token.key)),
          )
    ),
    mapToken: normalizeCreateDialogToken,
    keepEmptySections: true,
  }),
)
const activeGovernanceToolbarKey = computed(() => {
  const current = String(activeViewGroupKey.value || '').trim().toLowerCase()
  return current.startsWith('governance:') ? current : ''
})
const activeViewGroup = computed(() => {
  if (activeGovernanceToolbarKey.value) return null
  return groupedViews.value.find((group) => group.value === activeViewGroupKey.value) || groupedViews.value[0] || null
})
const activeViewEntries = computed(() => activeViewGroup.value?.views || [])
const activeViewTokens = computed(() => {
  if (isLdbViewActive.value) return sharedLdbViewTokens.value
  return viewDisplayTokens.value.filter((token) => activeViewEntries.value.some((view) => view.key === token.parentKey))
})
const isLdbViewActive = computed(() =>
  activeViewEntries.value.some((view) => isRelationshipViewLabel(view.label)),
)
const isSystemViewActive = computed(() => activeViewEntries.value.some((view) => String(view.label || '').trim().toLowerCase() === 'system'))
const systemViewTokens = computed(() => activeViewTokens.value.filter((token) => !isHistoryDerivedSystemToken(token)))
const heroInitials = computed(() => {
  const label = String(activeRegistryEntry.value?.singularLabel || '').trim()
  return label ? label.slice(0, 2).toUpperCase() : '??'
})
const structuredRecordHeroStyle = computed(() => {
  return {
    '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
    '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
    '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
    '--contact-hero-blob-opacity': String(contactHeroGradient.value.opacity),
    '--contact-hero-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--contact-hero-blob-soft': 'rgba(38, 71, 255, 0.14)',
    '--contact-hero-blob-fade': 'rgba(38, 71, 255, 0.06)',
  }
})
const heroAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(heroName.value)) % palette.length]
})
const heroName = computed(() => {
  if (!canonicalNameToken.value) return 'Missing canonical Name token'
  const value = getTokenDisplayValue(canonicalNameToken.value)
  return value || 'Missing Name value'
})
const heroSummaryValue = computed(() => {
  if (!canonicalSummaryToken.value) return 'Missing canonical Summary token'
  const value = getTokenDisplayValue(canonicalSummaryToken.value)
  return value || 'Summary not set'
})
const recordHeroCollapsedText = computed(() => {
  const summary = String(heroSummaryValue.value || '').trim()
  if (!summary) return 'Record hero collapsed'
  return summary.length > 160 ? `${summary.slice(0, 157)}...` : summary
})
const heroSummaryStatusIcon = computed(() => (tokenHasStoredValue(canonicalSummaryToken.value) ? 'task_alt' : ''))
const recordFeedArtifactContext = computed(() => {
  if (!isRecordRoute.value) return null
  const entityName = String(activeRegistryEntry.value?.entityName || tableNameParam.value || '').trim()
  const entityLabel = String(activeRegistryEntry.value?.label || activeRegistryEntry.value?.singularLabel || '').trim() || 'Missing record type'
  const recordId = String(recordIdParam.value || '').trim()
  const recordLabel = String(heroName.value || '').trim() || recordId
  if (!entityName || !recordId) return null
  return {
    entityName,
    entityLabel,
    recordId,
    recordLabel,
  }
})
const selectedHeroFieldCards = computed(() =>
  selectedHeroTokens.value.map((token) => {
    const viewLabel = fileViews.value.find((view) => view.key === token.parentKey)?.label || 'Unmapped view'
    return {
      key: token.key,
      label: token.label,
      description: viewLabel,
      value: getTokenDisplayValue(token),
      statusIcon: tokenHasStoredValue(token) ? 'task_alt' : '',
    }
  }),
)
const recordFeedGroupOptions = computed(() => RECORD_FEED_GROUP_OPTIONS)
const feedItems = computed(() => {
  if (isRecordRoute.value) return auditEvents.value
  return [
    {
      id: 'feed-template-1',
      feedKey: 'events',
      groupKey: 'lifecycle',
      sourceLabel: 'Record Shell',
      meta: 'Now',
      title: 'Template feed lane',
      content: 'This right-side black box is the dedicated feed surface for the selected file record skeleton.',
      hasLogPage: false,
    },
    {
      id: 'feed-template-2',
      feedKey: 'events',
      groupKey: 'actions',
      sourceLabel: 'Payload',
      meta: 'Live',
      title: 'File-driven structure',
      content: 'Changing the file at the top swaps the canonical record skeleton underneath this template.',
      hasLogPage: false,
    },
  ]
})
const recordFeedTabOptions = computed(() => filterRecordFeedTabs(feedItems.value))
const historySummaryItems = computed(() => {
  const lifecycleItems = auditEvents.value.filter((item) => String(item?.groupKey || '').trim() === 'lifecycle')
  const createdEvent = [...lifecycleItems]
    .reverse()
    .find((item) => String(item?.title || '').trim().toLowerCase().includes('created'))
  if (!createdEvent) return []

  return [
    {
      key: 'creator',
      label: 'Creator',
      value: String(createdEvent.sourceLabel || '').trim(),
    },
    {
      key: 'datetime',
      label: 'Datetime',
      value: String(createdEvent.meta || '').trim(),
    },
  ].filter((item) => item.value)
})
const recordShellToolbarFeed = computed(() =>
  buildShellToolbarFeed({
    sections: groupedViews.value,
    governanceItems: [
      { value: 'governance:tokens', title: 'Tokens' },
      { value: 'governance:views', title: 'Views' },
    ],
    relationshipLabels: ['ldb'],
    systemLabels: ['system'],
    groupBy: 'none',
    getGroupValue: (group) => group?.value,
    getGroupTitle: (group) => group?.title,
  }),
)
const controlBarItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: recordShellToolbarFeed.value.leftItems,
    rightItems: recordShellToolbarFeed.value.rightItems,
    governanceItems: recordShellToolbarFeed.value.governanceItems,
    isRelationshipSectionLabel: recordShellToolbarFeed.value.isRelationshipSectionLabel,
  }),
)
const fieldVerificationActionOptions = [
  { label: 'Verify field', value: 'verified', icon: 'check_circle', color: 'rgba(35, 92, 26, 0.96)' },
  { label: 'Pre-Selected', value: 'default_preselected_unverified', icon: 'auto_awesome', color: 'rgba(64, 121, 210, 0.92)' },
  { label: 'Suggested', value: 'suggested_unverified', icon: 'lightbulb', color: 'rgba(186, 129, 13, 0.92)' },
  { label: 'Reject field', value: 'rejected', icon: 'cancel', color: 'rgba(166, 43, 43, 0.92)' },
]
const heroSettingsGroups = computed(() => heroSourceGroups.value.map((group) => ({
  key: group.value,
  label: group.title,
  expanded: isHeroGroupExpanded(group.value),
  items: (Array.isArray(group.views) ? group.views : [])
    .flatMap((section) => getViewTokens(section.key))
    .map((token) => ({
      key: token.key,
      label: token.label,
      checked: isSelectedToken(token.key),
    })),
})).filter((group) => group.items.length))

watch(fileViews, (sections) => {
  if (!sections.length) {
    activeViewGroupKey.value = ''
    expandedViewKeys.value = []
    return
  }
  const groups = groupedViews.value
  if (!groups.some((group) => group.value === activeViewGroupKey.value)) activeViewGroupKey.value = groups[0]?.value || ''
  expandedViewKeys.value = sections.map((section) => section.key)
}, { immediate: true })

watch(heroSourceGroups, (groups) => {
  const nextKeys = groups.map((group) => group.value)
  expandedHeroGroupKeys.value = nextKeys.filter((key) => expandedHeroGroupKeys.value.includes(key))
  if (!expandedHeroGroupKeys.value.length && nextKeys.length) {
    expandedHeroGroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

watch(activeSourceKey, async () => { await ensureLiveOptionsLoaded() }, { immediate: true })
watch(
  [activeSourceKey, heroSelectableTokens],
  () => {
    const sourceKey = activeSourceKey.value
    const allowedKeys = new Set(heroSelectableTokens.value.map((token) => token.key))
    const existing = Array.isArray(heroFieldKeysBySource.value[sourceKey]) ? heroFieldKeysBySource.value[sourceKey] : []
    const normalized = existing.filter((key) => allowedKeys.has(key))

    if (normalized.length) {
      if (normalized.length !== existing.length) {
        heroFieldKeysBySource.value = {
          ...heroFieldKeysBySource.value,
          [sourceKey]: normalized,
        }
      }
      return
    }

    if (existing.length || heroFieldKeysBySource.value[sourceKey]) {
      heroFieldKeysBySource.value = {
        ...heroFieldKeysBySource.value,
        [sourceKey]: normalized,
      }
    }
  },
  { immediate: true },
)
watch(
  heroFieldKeysBySource,
  (value) => {
    persistShellFieldSelectionMap(value)
  },
  { deep: true },
)
watch(
  () => `${tableNameParam.value}:${recordIdParam.value}`,
  () => {
    loadRecordView()
  },
  { immediate: true },
)

watch(
  [recordIdParam, activeRegistryEntry, sharedLdbViewTokens, bridge],
  async ([recordId]) => {
    const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
    const normalizedRecordId = String(recordId || '').trim()
    if (!entityName || !normalizedRecordId || !bridge.value?.ldb?.linksForRecord) {
      sharedLdbLinksByTargetEntity.value = {}
      return
    }

    const targetEntities = (Array.isArray(sharedLdbViewTokens.value) ? sharedLdbViewTokens.value : [])
      .map((token) => String(token?.targetEntity || '').trim())
      .filter(Boolean)
    if (!targetEntities.length) {
      sharedLdbLinksByTargetEntity.value = {}
      return
    }

    const result = await bridge.value.ldb.linksForRecord({
      sourceEntity: entityName,
      recordId: normalizedRecordId,
      targetEntities,
    })
    const rows = Array.isArray(result?.links) ? result.links : []

    const nextMap = {}
    ;(Array.isArray(rows) ? rows : []).forEach((row) => {
      const targetEntity = String(row?.target_entity || '').trim()
      const targetId = String(row?.target_id || '').trim()
      if (!targetEntity || !targetId) return
      if (!nextMap[targetEntity]) nextMap[targetEntity] = []
      nextMap[targetEntity].push(targetId)
    })

    Object.keys(nextMap).forEach((key) => {
      nextMap[key] = Array.from(new Set(nextMap[key]))
    })

    sharedLdbLinksByTargetEntity.value = nextMap
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
  if (liveOptionRowsUnsub) liveOptionRowsUnsub()
  liveOptionRowsUnsub = null
})

onMounted(() => {
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
  liveOptionRowsUnsub = subscribeLiveOptionRowsState(() => {
    liveOptionRowsVersion.value += 1
  })
})

function isHeroGroupExpanded(groupKey) { return expandedHeroGroupKeys.value.includes(groupKey) }
function toggleHeroGroup(groupKey) {
  expandedHeroGroupKeys.value = isHeroGroupExpanded(groupKey)
    ? expandedHeroGroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedHeroGroupKeys.value, groupKey]
}
function getViewTokens(viewKey) { return selectableTokens.value.filter((token) => token.parentKey === viewKey) }
function isSelectedToken(tokenKey) { return selectedTokenKeySet.value.has(tokenKey) }
function setTokenSelected(tokenKey, isSelected) {
  const next = new Set(selectedTokenKeys.value)
  if (isSelected) next.add(tokenKey)
  else next.delete(tokenKey)
  selectedTokenKeys.value = Array.from(next)
}

function handleRecordFeedAdd(feedTab) {
  const normalizedFeedTab = String(feedTab || '').trim().toLowerCase()
  if (!['notes', 'artifacts', 'intake'].includes(normalizedFeedTab)) return

  if (normalizedFeedTab === 'intake') {
    router.push({
      name: 'intake-shell',
      query: {
        section: 'intake',
        create: '1',
        contextEntity: String(recordFeedArtifactContext.value?.entityName || '').trim(),
        contextEntityLabel: String(recordFeedArtifactContext.value?.entityLabel || '').trim(),
        contextRecordId: String(recordFeedArtifactContext.value?.recordId || '').trim(),
        contextRecordLabel: String(recordFeedArtifactContext.value?.recordLabel || '').trim(),
        open: String(Date.now()),
      },
    })
    return
  }

  router.push({
    name: 'draft-window',
    query: {
      section: normalizedFeedTab,
      create: '1',
      contextEntity: String(recordFeedArtifactContext.value?.entityName || '').trim(),
      contextRecordId: String(recordFeedArtifactContext.value?.recordId || '').trim(),
    },
  })
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
  if (optionSource === 'shared_file_universe' || token?.isSharedLdbToken) {
    const sourceKey = String(token?.targetSourceKey || '').trim() || resolveSourceKeyFromEntityName(token?.optionEntity)
    return sourceKey ? buildLiveEntityOptions(sourceKey) : []
  }
  return Array.isArray(token?.inputOptions) ? token.inputOptions : []
}

function getLiveEntityOptionsForToken(token) {
  const sourceKey = resolveSourceKeyFromEntityName(token?.optionEntity)
  return sourceKey ? buildLiveEntityOptions(sourceKey) : []
}

function getLiveEntitySetOptionsForToken(token) {
  return (Array.isArray(token?.optionEntities) ? token.optionEntities : [])
    .map((entityName) => resolveSourceKeyFromEntityName(entityName))
    .filter(Boolean)
    .flatMap((sourceKey) => buildLiveEntityOptions(sourceKey))
}

function resolveSourceKeyFromEntityName(entityName) {
  return getFilePageRegistryEntryByEntityReference(entityName)?.sourceKey || ''
}

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  return rows.map((row) => {
    const value = String(resolveLiveEntityRecordId(row, sourceKey) || '').trim()
    const label = String(getCanonicalTokenValue(row, titleToken || {}) || '').trim()
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

function resolveLiveEntityRecordId(row, sourceKey) {
  if (!row || typeof row !== 'object') return ''
  return sourceKey === 'artifacts' ? row.artifact_id || row.id || '' : row.id || row.artifact_id || ''
}

async function ensureLiveOptionsLoaded() {
  const tokensToLoad = [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens), ...selectableTokens.value.map((token) => normalizeCreateDialogToken(token))]
  const sourceKeys = new Set()
  for (const token of tokensToLoad) {
    const optionSource = String(token?.optionSource || '').trim()
    if (optionSource === 'live_entity') {
      const sourceKey = resolveSourceKeyFromEntityName(token.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }
    if (optionSource === 'live_entity_set') {
      for (const entityName of Array.isArray(token?.optionEntities) ? token.optionEntities : []) {
        const sourceKey = resolveSourceKeyFromEntityName(entityName)
        if (sourceKey) sourceKeys.add(sourceKey)
      }
    }
    if (optionSource === 'shared_file_universe' || token?.isSharedLdbToken) {
      const sourceKey = String(token?.targetSourceKey || '').trim() || resolveSourceKeyFromEntityName(token?.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }
  }
  for (const sourceKey of sourceKeys) {
    await loadFileRecordRows({
      sourceKey,
      bridgeValue: bridge.value,
      currentRowsBySource: getLiveOptionRowsState(),
      skipSourceKey: activeSourceKey.value,
    })
  }

  await hydrateFileRecordUniverseFromSystemFiles({
    bridgeValue: bridge.value,
    currentRowsBySource: getLiveOptionRowsState(),
    skipSourceKey: activeSourceKey.value,
  })
}

function resolveSourceKeyFromTableName(tableName) {
  const normalized = String(tableName || '').trim().toLowerCase()
  if (!normalized) return ''
  const direct = FILE_SOURCE_REGISTRY.find((entry) =>
    [entry.sourceKey, entry.routeName, entry.entityName, entry.label].some((value) => String(value || '').trim().toLowerCase() === normalized),
  )
  if (direct?.sourceKey) return direct.sourceKey

  return getFilePageRegistryEntryByEntityReference(String(tableName || '').trim())?.sourceKey || ''
}

function resolveExistingFieldForToken(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return aliases.map((alias) => fieldByName.value[alias]).find(Boolean) || null
}

function getTokenRawValue(token) {
  if (!token) return ''
  if (token?.isSharedLdbToken) return getSharedLdbTokenRawValue(token)
  const aliases = getCanonicalTokenFieldNames(token)
  for (const alias of aliases) {
    const field = fieldByName.value[alias]
    if (field && field.value != null && String(field.value).trim() !== '') return field.value
    const recordValue = currentView.value?.record?.[alias]
    if (recordValue != null && String(recordValue).trim() !== '') return recordValue
  }
  return ''
}

function getSharedLdbTokenRawValue(token) {
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const targetEntity = String(token?.targetEntity || '').trim()
  if (!entityName || !targetEntity) return []
  return Array.isArray(sharedLdbLinksByTargetEntity.value[targetEntity]) ? sharedLdbLinksByTargetEntity.value[targetEntity] : []
}

function getTokenDisplayValue(token) {
  const rawValue = getTokenRawValue(token)
  if (token?.isSharedLdbToken) {
    const values = Array.isArray(rawValue) ? rawValue : []
    if (!values.length) return 'Missing value'
    const options = Array.isArray(token?.inputOptions) ? token.inputOptions : []
    return values
      .map((value) => options.find((option) => String(option?.value || '').trim() === String(value || '').trim())?.label || String(value || '').trim())
      .filter(Boolean)
      .join(', ') || 'Missing value'
  }
  if (Array.isArray(rawValue)) return rawValue.length ? rawValue.join(', ') : 'Missing value'
  const normalized = String(rawValue ?? '').trim()
  return normalized || 'Missing value'
}

function getTokenDialogValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return rawValue == null ? '' : String(rawValue)
}

function tokenHasStoredValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue.some((item) => String(item || '').trim())
  return String(rawValue ?? '').trim() !== ''
}

function normalizeIpcErrorMessage(ipcError) {
  const raw = String(ipcError?.message || ipcError || '').trim()
  const prefix = "Error invoking remote method '"
  if (!raw.startsWith(prefix)) return raw
  const separatorIndex = raw.indexOf("':")
  return separatorIndex > -1 ? raw.slice(separatorIndex + 2).trim() : raw
}

function openFeedItemLog(eventId) {
  if (!isRecordRoute.value || !eventId) return
  router.push({
    name: 'record-event',
    params: {
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
      eventId,
    },
  })
}

async function loadRecordView() {
  if (!hasBridge.value || !isRecordRoute.value) {
    currentView.value = null
    fields.value = []
    auditEvents.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.records.shellView(tableNameParam.value, recordIdParam.value)
    currentView.value = result?.view || null
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : []
    if (!Array.isArray(liveOptionRowsBySource.value.users)) {
      await loadFileRecordRows({
        sourceKey: 'users',
        bridgeValue: bridge.value,
        currentRowsBySource: getLiveOptionRowsState(),
      })
    }
    fieldVerificationStates.value = Object.fromEntries(
      (Array.isArray(result?.verificationFields) ? result.verificationFields : []).map((field) => [
        String(field?.field_name || '').trim(),
        String(field?.state || '').trim(),
      ]),
    )
    auditEvents.value = Array.isArray(result?.auditFeedItems) ? result.auditFeedItems : []
    inlineFieldValues.value = Object.fromEntries(
      [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
        .map((token) => [token.key, getTokenDialogValue(token)]),
    )
  } catch (loadError) {
    error.value = normalizeIpcErrorMessage(loadError)
    currentView.value = null
    fields.value = []
    auditEvents.value = []
    fieldVerificationStates.value = {}
    inlineFieldValues.value = {}
  } finally {
    loading.value = false
  }
}

function inlineInputType(token) {
  const normalizedType = String(token?.tokenType || '').trim().toLowerCase()
  if (normalizedType === 'email') return 'email'
  if (normalizedType === 'phone') return 'tel'
  if (normalizedType === 'url') return 'url'
  if (normalizedType === 'date') return 'date'
  if (normalizedType === 'datetime') return 'datetime-local'
  return 'text'
}

function inlineRawValue(token) {
  const explicitValue = inlineFieldValues.value?.[token?.key]
  if (explicitValue != null && (Array.isArray(explicitValue) || String(explicitValue).trim() !== '')) return explicitValue
  return getTokenDialogValue(token)
}

function inlineStringValue(token) {
  const rawValue = inlineRawValue(token)
  return rawValue == null ? '' : String(rawValue)
}

function inlineSingleValue(token) {
  const rawValue = inlineRawValue(token)
  return rawValue == null ? '' : rawValue
}

function inlineMultiValue(token) {
  const rawValue = inlineRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return String(rawValue || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function updateInlineFieldValue(token, nextValue) {
  inlineFieldValues.value = {
    ...inlineFieldValues.value,
    [token.key]: nextValue,
  }
}

function isSystemManagedReadOnlyToken(token) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()

  if (['id', 'creator'].includes(tokenType)) return true
  if (tokenName.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenName.includes('user_role') || tokenName.includes('role_link')) return true
  return false
}

function isHistoryDerivedSystemToken(token) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()
  const tokenLabel = String(token?.label || '').trim().toLowerCase()
  const inputSource = String(token?.inputSource || '').trim().toLowerCase()

  if (tokenType === 'creator') return true
  if (inputSource === 'system_actor') return true
  if (tokenName.includes('creator') || tokenLabel.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenType === 'datetime' && tokenLabel === 'datetime') return true
  return false
}

function isInlineFieldEditable(token) {
  if (isSystemManagedReadOnlyToken(token)) return false
  const field = resolveExistingFieldForToken(token)
  if (field) return Boolean(field.editable)
  return tokenSupportsRecordUpdate(token, activeRegistryEntry.value?.entityName || tableNameParam.value)
}

function isSystemReadOnlyInline(token) {
  return Boolean(
    isRecordRoute.value &&
    isSystemViewActive.value &&
    !isInlineFieldEditable(token),
  )
}

function inlineFieldHasValue(token) {
  const value = inlineRawValue(token)
  if (Array.isArray(value)) return value.length > 0
  return String(value ?? '').trim().length > 0
}

function isInlineReviewTrackedField(token) {
  const field = resolveExistingFieldForToken(token)
  const aliases = [
    String(field?.field_name || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ].filter(Boolean)
  return aliases.some((alias) => String(fieldVerificationStates.value?.[alias] || '').trim())
}

function resolvedInlineFieldVerificationState(token) {
  const field = resolveExistingFieldForToken(token)
  const aliases = [
    String(field?.field_name || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ].filter(Boolean)
  for (const alias of aliases) {
    const state = String(fieldVerificationStates.value?.[alias] || '').trim()
    if (state) return state
  }
  return ''
}

function showInlineFieldVerificationAction(token) {
  return isInlineReviewTrackedField(token) && inlineFieldHasValue(token)
}

function isInlineCopyableIdField(token) {
  const aliases = [
    String(token?.tokenName || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ]
    .map((alias) => String(alias || '').trim().toLowerCase())
    .filter(Boolean)

  return aliases.some((alias) => alias === 'id' || alias.endsWith('_id'))
}

function showInlineFieldCopyAction(token) {
  if (isSystemReadOnlyInline(token)) return inlineFieldHasValue(token)
  return isInlineCopyableIdField(token) && inlineFieldHasValue(token)
}

async function copyInlineFieldValue(token) {
  const rawValue = inlineRawValue(token)
  const value = Array.isArray(rawValue)
    ? rawValue.map((item) => String(item || '').trim()).filter(Boolean).join(', ')
    : String(rawValue ?? '').trim()
  if (!value) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      $q.notify({ type: 'positive', message: `${token?.label || 'Missing field label'} copied` })
      return
    }
    throw new Error('Clipboard unavailable')
  } catch {
    $q.notify({ type: 'negative', message: 'Could not copy field value.' })
  }
}

function inlineFieldVerificationIcon(token) {
  const state = resolvedInlineFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.icon || 'help'
}

function inlineFieldVerificationIconClass(token) {
  const state = resolvedInlineFieldVerificationState(token)
  return state ? `record-shell__verification-icon--${state}` : ''
}

function inlineFieldVerificationIconStyle(token) {
  const state = resolvedInlineFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.color ? { color: option.color } : {}
}

async function commitInlineFieldValue(token, explicitValue) {
  if (!isRecordRoute.value) return
  const field = resolveExistingFieldForToken(token)
  if (field && !field.editable) return
  const reviewTracked = isInlineReviewTrackedField(token)

  const nextValue = explicitValue === undefined ? inlineRawValue(token) : explicitValue
  const changes = buildTokenUpdateChanges(token, {
    nextValue,
    initialValue: field ? field.value : getTokenDialogValue(token),
    recordId: recordIdParam.value,
    entityName: activeRegistryEntry.value?.entityName || tableNameParam.value,
    idColumn: String(field?.id_column || 'id').trim() || 'id',
  })
  if (!changes.length) return

  const verificationFieldName = String(field?.field_name || token?.tokenName || '').trim()
  const saveKey = `${token.key}:${verificationFieldName || 'write'}`
  if (inlineFieldSavingKeys.value.includes(saveKey)) return
  inlineFieldSavingKeys.value = [...inlineFieldSavingKeys.value, saveKey]

  try {
    const result = await bridge.value?.records?.shellUpdate?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes,
      verification: reviewTracked && verificationFieldName
        ? {
            tableName: String(field?.table_name || runtimeTableName.value).trim(),
            recordId: String(field?.record_id || recordIdParam.value).trim(),
            fieldName: verificationFieldName,
            state: 'verified',
            source: 'direct_user_input',
            actionLabel: 'record_shell_field_edit',
          }
        : null,
      actionLabel: 'record_shell_field_edit',
    })
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
    fieldVerificationStates.value = Object.fromEntries(
      (Array.isArray(result?.verificationFields) ? result.verificationFields : []).map((entry) => [
        String(entry?.field_name || '').trim(),
        String(entry?.state || '').trim(),
      ]),
    )
    auditEvents.value = Array.isArray(result?.auditFeedItems) ? result.auditFeedItems : auditEvents.value
    inlineFieldValues.value = {
      ...inlineFieldValues.value,
      [token.key]: nextValue,
    }
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    inlineFieldSavingKeys.value = inlineFieldSavingKeys.value.filter((key) => key !== saveKey)
  }
}

async function updateInlineFieldVerificationState(token, nextState) {
  if (!isRecordRoute.value || !inlineFieldHasValue(token)) return
  const field = resolveExistingFieldForToken(token)
  if (!field) return
  try {
    const result = await bridge.value?.records?.shellUpdate?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes: [],
      verification: {
        tableName: field.table_name,
        recordId: field.record_id,
        fieldName: field.field_name,
        state: String(nextState || '').trim(),
        source: 'record_shell_field_review',
        actionLabel: 'record_shell_field_verification',
      },
      actionLabel: 'record_shell_field_verification',
    })
    fieldVerificationStates.value = Object.fromEntries(
      (Array.isArray(result?.verificationFields) ? result.verificationFields : []).map((entry) => [
        String(entry?.field_name || '').trim(),
        String(entry?.state || '').trim(),
      ]),
    )
    auditEvents.value = Array.isArray(result?.auditFeedItems) ? result.auditFeedItems : auditEvents.value
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  }
}

function hashString(value = '') {
  let hash = 0
  const normalized = String(value || '')
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index)
    hash |= 0
  }
  return hash
}

function onContactHeroPointerMove(event) {
  const heroElement = contactHeroRef.value
  if (!heroElement) return
  const rect = heroElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  contactHeroGradient.value = {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(90, y)),
    size: 60,
    opacity: 1,
  }
}

function startContactHeroPointerTracking() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onContactHeroPointerMove)
  window.addEventListener('pointermove', onContactHeroPointerMove)
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 1,
  }
}

function onContactHeroPointerLeave() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 0,
  }
}
</script>

<style scoped>
.record-shell { display: flex; flex-direction: column; gap: 20px; }
.record-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.88fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
}

.record-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--contact-hero-blob-x) var(--contact-hero-blob-y),
    var(--contact-hero-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--contact-hero-blob-soft, rgba(38, 71, 255, 0.14)) calc(var(--contact-hero-blob-size) * 0.46),
    var(--contact-hero-blob-fade, rgba(38, 71, 255, 0.06)) calc(var(--contact-hero-blob-size) * 0.7),
    transparent var(--contact-hero-blob-size)
  );
  opacity: var(--contact-hero-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.record-shell__hero-main,
.record-shell__feed {
  position: relative;
  z-index: 1;
}

.record-shell__hero-main {
  display: flex;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 420px;
}

.record-shell__portrait {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px 0 0 24px;
  box-shadow: none;
}

.record-shell__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(17, 17, 17, 0.18) 100%);
  pointer-events: none;
}

.record-shell__portrait--initials-only {
  background: transparent;
}

.record-shell__portrait--initials-only::after {
  display: none;
}

.record-shell__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.record-shell__portrait-placeholder-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(132px, 18vw, 188px);
  height: clamp(132px, 18vw, 188px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 40px rgba(17, 17, 17, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-title);
  font-size: clamp(2.6rem, 4vw, 4rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
}

.record-shell__hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--ds-space-12);
  min-width: 0;
  padding: 36px 36px 34px 16px;
}

.record-shell__hero-name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 8px;
}

.record-shell__hero-icon-button {
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
}

.record-shell__hero-icon-button--create {
  color: #2669ff;
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(38, 105, 255, 0.18);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.record-shell__hero-icon-button :deep(.q-icon) {
  font-size: 16px;
}

.record-shell__feed-label {
  color: var(--ds-color-text-muted-alt);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.record-shell__name {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.6rem, 3.2vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.95;
}

.record-shell__mini-dashboard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.record-shell__mini-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 9px;
}

.record-shell__mini-label {
  color: #6f6f6f;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.record-shell__mini-value {
  margin-top: 3px;
  color: #111;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
  word-break: break-word;
}

.record-shell__subtitle {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.record-shell__subtitle--secondary {
  color: #6b6b6b;
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.record-shell__hero-field-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.record-shell__hero-field-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record-shell__hero-field-stack--summary {
  align-self: start;
}

.record-shell__hero-field-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-shell__hero-field-top {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
}

.record-shell__hero-field-bottom {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
}

.record-shell__hero-field-label {
  display: inline-flex;
  width: fit-content;
  justify-self: start;
  padding: 7px 10px;
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  background: #111;
  border: 1px solid #111;
  border-radius: 4px;
}

.record-shell__hero-field-description {
  display: inline-flex;
  align-items: flex-end;
  align-self: end;
  padding: 0 10px 1px 0;
  color: #5c5c5c;
  font-family: var(--ds-font-family-body);
  font-size: 0.68rem;
  line-height: 1;
  text-align: left;
  justify-self: start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
}

.record-shell__hero-field-value {
  display: inline-flex;
  width: fit-content;
  margin-left: 10px;
  padding: 4px 8px;
  color: rgba(17, 17, 17, 0.66);
  font-family: var(--ds-font-family-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.42);
  border: 0;
  border-radius: 4px;
  backdrop-filter: blur(10px);
}

.record-shell__hero-field-card--summary .record-shell__hero-field-label,
.record-shell__hero-field-card--summary .record-shell__hero-field-value {
  border-radius: 4px;
}

.record-shell__hero-field-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #2669ff;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-shell__feed {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-lg);
  color: #fff;
}

.record-shell__feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.record-shell__feed-header--main {
  justify-content: flex-start;
  gap: 20px;
}

.record-shell__feed-state {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.record-shell__feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.record-shell__feed-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.record-shell__feed-tab {
  min-height: 24px;
  padding: 0 9px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.record-shell__feed-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.94);
}

.record-shell__feed-entry {
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.record-shell__feed-entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.record-shell__feed-entry-top-right {
  display: flex;
  align-items: center;
  gap: 0;
}

.record-shell__feed-entry-source {
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.record-shell__feed-entry-time {
  color: rgba(255, 255, 255, 0.54);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  line-height: 1.3;
}

.record-shell__feed-entry-title {
  margin-top: 4px;
  color: #ffffff;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.record-shell__feed-entry-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.record-shell__feed-entry-toggle:hover {
  color: rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.08);
}

.record-shell__feed-entry-content {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.74);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
}
.record-shell__hero-frame {
  position: relative;
}
.record-shell__hero-chevron {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(10px);
}
.record-shell__hero-chevron:hover {
  color: rgba(17, 17, 17, 0.92);
  background: rgba(255, 255, 255, 0.94);
}
.record-shell__hero-chevron-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.record-shell__hero-collapsed {
  display: grid;
  gap: 4px;
  min-height: 88px;
  padding: 22px 56px 20px 20px;
  background:
    radial-gradient(circle at 18% 22%, rgba(38, 71, 255, 0.18), transparent 30%),
    radial-gradient(circle at 80% 78%, rgba(17, 17, 17, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 240, 232, 0.94) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
}
.record-shell__hero-collapsed-title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}
.record-shell__hero-collapsed-summary {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}
.record-shell__panel { display:grid; gap:12px; padding:16px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(255,255,255,.96); }
.record-shell__panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.record-shell__panel-title { color:#111; font-family:var(--font-title); font-size:.94rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__panel-meta { color:rgba(17,17,17,.54); font-size:.72rem; }
.record-shell__system-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,360px); gap:16px; align-items:start; }
.record-shell__system-column { min-width:0; }
.record-shell__system-column--history { display:grid; align-content:start; }
.record-shell__history-summary-box { display:grid; gap:8px; margin-bottom:12px; padding:10px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(17,17,17,.02); }
.record-shell__history-summary-item { display:grid; gap:3px; }
.record-shell__history-summary-label { color:rgba(17,17,17,.54); font-size:.68rem; line-height:1.1; text-transform:uppercase; letter-spacing:.04em; }
.record-shell__history-summary-value { color:#111; font-size:.78rem; line-height:1.25; }
.record-shell__section-group-stack { display:grid; gap:14px; }
.record-shell__section-group { display:grid; gap:8px; }
.record-shell__section-group-toggle { display:inline-flex; align-items:center; justify-content:flex-start; gap:2px; width:max-content; padding:0; color:#111; background:transparent; border:0; text-align:left; cursor:pointer; }
.record-shell__section-group-toggle-icon { color:#111; }
.record-shell__section-group-title { color:#111; font-family:var(--font-title); font-size:.8rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__section-group-meta { margin-left:6px; color:rgba(17,17,17,.54); font-size:.7rem; }
.record-shell__field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
.record-shell__field-card { padding:10px 12px; border:1px solid rgba(17,17,17,.08); border-radius:6px; background:rgba(17,17,17,.02); }
.record-shell__field-card--selected { border-color:rgba(38,71,255,.3); background:rgba(38,71,255,.05); }
.record-shell__field-label-row { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.record-shell__field-label { color:#111; font-size:.8rem; font-weight:600; line-height:1.3; }
.record-shell__field-meta-button { color:rgba(17,17,17,.6); }
.record-shell__field-meta-button:hover { color:#111; }
.record-shell__token-meta-menu { display:grid; gap:8px; padding:10px; min-width:220px; }
.record-shell__token-meta-title { color:#111; font-size:.78rem; font-weight:600; }
.record-shell__token-meta-actions { display:flex; justify-content:space-between; gap:8px; }
.record-shell__field-value { margin-top:4px; color:rgba(17,17,17,.58); font-size:.72rem; line-height:1.4; }
.record-shell__field-value-row { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; margin-top:6px; }
.record-shell__field-input { min-width:0; }
.record-shell__field-static-box {
  min-width: 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 4px;
  background: transparent;
  color: rgba(17,17,17,.46);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: 400;
  line-height: 1.15;
}
.record-shell__field-input :deep(.q-field__control) { min-height:24px; border-radius:4px; background:rgba(255,255,255,.72); }
.record-shell__field-input :deep(.q-field__native),
.record-shell__field-input :deep(.q-field__input) { color:rgba(17,17,17,.62); font-size:.74rem; font-weight:400; line-height:1.15; }
.record-shell__field-action { color:#111; padding:0; min-height:20px; }
.record-shell__verification-menu { min-width:max-content; }
.record-shell__verification-menu-item { min-height:22px; padding:0 6px; }
.record-shell__verification-menu-label { font-size:.72rem; line-height:1.1; }
.record-shell__settings-panel { width:min(280px,calc(100vw - 24px)); padding:10px; background:rgba(248,248,246,.98); border:1px solid rgba(17,17,17,.08); box-shadow:0 16px 32px rgba(17,17,17,.12); }
.record-shell__settings-title { color:#111; font-family:var(--font-title); font-size:.84rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__settings-group + .record-shell__settings-group { margin-top:10px; }
.record-shell__settings-heading { display:flex; align-items:center; justify-content:space-between; width:100%; padding:0; background:transparent; border:0; text-align:left; }
.record-shell__settings-children { display:grid; gap:4px; margin-top:4px; }
.record-shell__settings-row { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:8px; min-height:28px; padding:2px 4px; }
@media (max-width: 1180px) {
  .record-shell__hero { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .record-shell__hero-main { flex-direction: column; }
  .record-shell__portrait {
    width: 100%;
    flex-basis: auto;
    min-height: 240px;
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 24px 24px 0 0;
  }
  .record-shell__hero-field-columns {
    grid-template-columns: 1fr;
  }
  .record-shell__toolbar { flex-direction:column; align-items:stretch; }
  .record-shell__toolbar-right { margin-left:0; justify-content:flex-start; }
}
</style>

