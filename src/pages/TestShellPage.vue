<template>
  <q-page class="q-pa-md test-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Test Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasSupportedBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but this section does not expose a supported list bridge yet.
      </q-banner>
    </div>

    <div v-else class="test-shell-body">
      <FilePageHeroDashboard
        eyebrow="Test Shell"
        :title="heroTitle"
        :text="heroText"
        :stats="heroStats"
        health-label="Contract health"
        :health-text="healthText"
        :health-segments="healthSegments"
      />

      <FilePageToolbar
        :all-visible-selected="allVisibleSelected"
        :some-visible-selected="someVisibleSelected"
        :disabled="false"
        :loading="loading"
        :search-query="searchQuery"
        :search-placeholder="searchPlaceholder"
        :view-mode="viewMode"
        :view-options="viewOptions"
        :show-view-toggle="true"
        @toggle-select-all="toggleSelectAllVisible"
        @add="notifyShellAction('Add Record')"
        @update:search-query="searchQuery = $event"
        @update:view-mode="viewMode = $event"
      >
        <template #filters>
          <q-btn flat round dense class="test-shell-filters-trigger" icon="filter_list" aria-label="File shell filters">
            <q-menu
              anchor="top left"
              self="top right"
              class="test-shell-filters-menu"
              content-class="test-shell-filters-menu__content"
            >
              <div class="test-shell-filters-panel">
                <div class="test-shell-filters-panel__title">File Filter</div>

                <div class="test-shell-filters-panel__rows">
                  <div
                    v-for="section in multiTokenFilterSections"
                    :key="section.key"
                    class="test-shell-filter-group"
                  >
                    <button
                      type="button"
                      class="test-shell-filter-heading"
                      @click="toggleExpandedFilterSection(section.key)"
                    >
                      <span class="test-shell-filter-heading__label">{{ section.label }}</span>
                      <span class="test-shell-filter-heading__meta">{{ getFilterSectionTokenCount(section.key) }}</span>
                      <q-icon
                        :name="expandedFilterSectionKey === section.key ? 'expand_less' : 'expand_more'"
                        size="14px"
                        class="test-shell-filter-heading__chevron"
                      />
                    </button>

                    <div
                      v-if="expandedFilterSectionKey === section.key"
                      class="test-shell-filter-group__children"
                    >
                      <button
                        v-for="token in getSectionTokens(section.key)"
                        :key="token.key"
                        type="button"
                        class="test-shell-filter-child-row"
                        :class="{ 'test-shell-filter-child-row--selected': token.key === activeFilterTokenKey }"
                        @click="applyFilterSelection(`token:${token.key}`)"
                      >
                        <q-checkbox
                          :model-value="token.key === activeFilterTokenKey"
                          dense
                          size="xs"
                          checked-icon="check_box"
                          unchecked-icon="check_box_outline_blank"
                          class="test-shell-filter-child-row__checkbox"
                          @update:model-value="toggleFilterToken(token.key, $event)"
                          @click.stop
                        />
                        <span class="test-shell-filter-child-row__label">{{ token.label }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </q-menu>
          </q-btn>
        </template>
      </FilePageToolbar>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-else-if="unmappedShellSlots.length" class="test-shell-gap-banner bg-orange-1 text-orange-10" rounded>
        Missing explicit shell mapping:
        {{ unmappedShellSlots.join(', ') }}.
        Real rows and canonical sections are still rendered below without guessing.
      </q-banner>

      <q-banner
        v-if="!loading && displayRows.length === 0"
        class="test-shell-empty-state bg-grey-1 text-black"
        rounded
      >
        No real rows loaded for {{ activeRegistryEntry?.label || 'this section' }}.
      </q-banner>

      <div v-else-if="viewMode === 'card'" class="row q-col-gutter-md test-shell-cards-grid">
        <div v-for="row in displayRows" :key="row.cardId" class="col-12 col-sm-6 col-lg-4">
          <q-card
            flat
            bordered
            class="test-shell-card full-height"
            :style="getTestShellCardStyle()"
            @pointerenter="onTestShellCardPointerEnter"
            @pointermove="onTestShellCardPointerMove"
            @pointerleave="onTestShellCardPointerLeave"
          >
            <q-card-section class="test-shell-card__control-row">
              <q-checkbox
                :model-value="isRowSelected(row)"
                color="dark"
                class="test-shell-card__select-box"
                @update:model-value="toggleRowSelection(row, $event)"
              />
              <div class="test-shell-card__control-actions">
                <q-btn
                  flat
                  round
                  icon="tune"
                  class="test-shell-card__control-settings"
                  aria-label="Card settings"
                >
                  <q-menu
                    anchor="bottom right"
                    self="top right"
                    class="test-shell-card-settings-menu"
                    content-class="test-shell-card-settings-menu__content"
                  >
                    <div class="test-shell-card-settings-panel">
                      <div class="test-shell-card-settings-panel__title">Card Settings</div>
                      <div class="test-shell-card-settings-panel__caption">
                        Name stays fixed. Choose and order the extra fields shown on the card.
                      </div>

                      <div class="test-shell-card-settings-panel__list">
                        <section
                          v-if="selectedCardItemTokens.length"
                          class="test-shell-card-settings-group test-shell-card-settings-group--selected"
                        >
                          <div class="test-shell-card-settings-group__title">Selected</div>

                          <div
                            v-for="token in selectedCardItemTokens"
                            :key="`selected:${token.key}`"
                            class="test-shell-card-settings-row"
                          >
                            <q-checkbox
                              :model-value="true"
                              dense
                              size="xs"
                              checked-icon="check_box"
                              unchecked-icon="check_box_outline_blank"
                              class="test-shell-card-settings-row__checkbox"
                              @update:model-value="setCardItemEnabled(token.key, $event)"
                            />

                            <div class="test-shell-card-settings-row__copy">
                              <div class="test-shell-card-settings-row__label">{{ token.label }}</div>
                            </div>

                            <div class="test-shell-card-settings-row__actions">
                              <q-btn
                                flat
                                dense
                                round
                                :disable="getCardItemOrderIndex(token.key) <= 0"
                                @click.stop="moveCardItem(token.key, -1)"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" class="test-shell-card-settings-row__chevron">
                                  <path d="M7 14L12 9L17 14" />
                                </svg>
                              </q-btn>
                              <q-btn
                                flat
                                dense
                                round
                                :disable="getCardItemOrderIndex(token.key) < 0 || getCardItemOrderIndex(token.key) >= enabledCardItemKeys.length - 1"
                                @click.stop="moveCardItem(token.key, 1)"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" class="test-shell-card-settings-row__chevron">
                                  <path d="M7 10L12 15L17 10" />
                                </svg>
                              </q-btn>
                            </div>
                          </div>
                        </section>

                        <section
                          v-for="group in cardItemTokenGroups"
                          :key="group.key"
                          class="test-shell-card-settings-group"
                        >
                          <button
                            type="button"
                            class="test-shell-card-settings-group__toggle"
                            @click="toggleCardSettingsGroup(group.key)"
                          >
                            <span class="test-shell-card-settings-group__title">{{ group.label }}</span>
                            <q-icon
                              :name="isCardSettingsGroupExpanded(group.key) ? 'expand_less' : 'expand_more'"
                              size="14px"
                              class="test-shell-card-settings-group__icon"
                            />
                          </button>

                          <div v-if="isCardSettingsGroupExpanded(group.key)" class="test-shell-card-settings-group__body">
                            <div
                              v-for="token in group.tokens"
                              :key="token.key"
                              class="test-shell-card-settings-row"
                            >
                              <q-checkbox
                                :model-value="isCardItemEnabled(token.key)"
                                dense
                                size="xs"
                                checked-icon="check_box"
                                unchecked-icon="check_box_outline_blank"
                                class="test-shell-card-settings-row__checkbox"
                                @update:model-value="setCardItemEnabled(token.key, $event)"
                              />

                              <div class="test-shell-card-settings-row__copy">
                                <div class="test-shell-card-settings-row__label">{{ token.label }}</div>
                              </div>

                              <div class="test-shell-card-settings-row__actions">
                                <q-btn
                                  flat
                                  dense
                                  round
                                  :disable="!isCardItemEnabled(token.key) || getCardItemOrderIndex(token.key) <= 0"
                                  @click.stop="moveCardItem(token.key, -1)"
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true" class="test-shell-card-settings-row__chevron">
                                    <path d="M7 14L12 9L17 14" />
                                  </svg>
                                </q-btn>
                                <q-btn
                                  flat
                                  dense
                                  round
                                  :disable="!isCardItemEnabled(token.key) || getCardItemOrderIndex(token.key) < 0 || getCardItemOrderIndex(token.key) >= enabledCardItemKeys.length - 1"
                                  @click.stop="moveCardItem(token.key, 1)"
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true" class="test-shell-card-settings-row__chevron">
                                    <path d="M7 10L12 15L17 10" />
                                  </svg>
                                </q-btn>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </q-menu>
                </q-btn>
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="test-shell-card__control-eye"
                  :disable="!row.recordId"
                  @click="openRecordView(row)"
                />
              </div>
            </q-card-section>

            <q-card-section class="test-shell-card__hero">
              <div class="test-shell-card__hero-main">
                <figure class="test-shell-card__portrait">
                  <div class="test-shell-card__portrait-shell" aria-hidden="true">
                    <div class="test-shell-card__portrait-badge" :style="{ backgroundColor: getTestShellAvatarColor(row) }">
                      {{ row.avatarText }}
                    </div>
                  </div>
                </figure>

                <div class="test-shell-card__hero-side">
                  <div class="test-shell-card__hero-copy">
                    <div class="test-shell-card__title" :class="{ 'test-shell-card__value--placeholder': !row.titleValue }">
                      {{ row.titleValue || 'Title mapping undefined' }}
                    </div>

                    <div class="test-shell-card__bottom-stack">
                      <div v-if="getTestShellMetadataRows(row).length" class="test-shell-card__detail-stack">
                        <div
                          v-for="detail in getTestShellMetadataRows(row)"
                          :key="detail.label"
                          class="test-shell-card__detail-row"
                        >
                          <button type="button" class="test-shell-card__inline-chip">
                            <span class="test-shell-card__inline-chip-value">{{ detail.value }}</span>
                            <q-tooltip anchor="top middle" self="bottom middle" class="test-shell-card__inline-chip-tooltip">
                              {{ detail.label }}
                            </q-tooltip>
                          </button>
                        </div>
                      </div>

                      <div v-else class="test-shell-card__detail-stack">
                        <div class="test-shell-card__detail-row">
                          <button type="button" class="test-shell-card__inline-chip test-shell-card__inline-chip--placeholder">
                            <q-icon name="info" size="14px" />
                            <span>Metadata mapping undefined</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section class="test-shell-card__summary">
              <div class="test-shell-card__summary-head">
                <q-btn-toggle
                  :model-value="getRowRelationshipPanel(row)"
                  dense
                  unelevated
                  toggle-color="dark"
                  color="white"
                  text-color="grey-8"
                  class="test-shell-card__summary-toggle"
                  :options="summarySectionShellOptions"
                  @update:model-value="setRowRelationshipPanel(row, $event)"
                />
                <q-btn flat no-caps class="test-shell-card__summary-add-relation" aria-label="Add Relation" @click="notifyShellAction('Add Relation')">
                  <span class="test-shell-card__summary-add-relation-plus">
                    <q-icon name="add" />
                  </span>
                  <span class="test-shell-card__summary-add-relation-label">Add Relation</span>
                </q-btn>
              </div>

              <div class="test-shell-card__summary-panel">
                <div class="test-shell-card__summary-body">
                  <div class="test-shell-card__summary-body-content">
                    <div v-if="getActiveRelationshipItems(row).length" class="test-shell-card__notes-list">
                      <div
                        v-for="item in getActiveRelationshipItems(row)"
                        :key="`${row.cardId}:${getRowRelationshipPanel(row)}:${item}`"
                        class="test-shell-card__note-pill"
                      >
                        <span class="test-shell-card__note-pill-name">
                          {{ getCardRelationshipLabel(getRowRelationshipPanel(row)) }}
                        </span>
                        <span class="test-shell-card__note-pill-value">{{ item }}</span>
                      </div>
                    </div>

                    <div v-else class="test-shell-card__summary-empty">
                      No {{ getCardRelationshipLabel(getRowRelationshipPanel(row)).toLowerCase() }} linked to this record.
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <div v-else class="test-shell-table-surface">
        <div class="test-shell-table-tabs">
          <div class="test-shell-table-tabs__left">
            <button
              v-for="section in tableLeftSections"
              :key="section.key"
              type="button"
              class="test-shell-table-tabs__tab"
              :class="{ 'test-shell-table-tabs__tab--active': section.key === activeSection?.key }"
              @click="activeSectionKeyForCards = section.key"
            >
              {{ section.label }}
            </button>
          </div>

          <div class="test-shell-table-tabs__right">
            <button
              v-for="section in tableRightSections"
              :key="section.key"
              type="button"
              class="test-shell-table-tabs__tab"
              :class="{ 'test-shell-table-tabs__tab--active': section.key === activeSection?.key }"
              @click="activeSectionKeyForCards = section.key"
            >
              {{ section.label }}
            </button>
          </div>
        </div>

        <div class="test-shell-table-scroll">
          <table class="test-shell-table">
            <thead>
              <tr>
                <th
                  class="test-shell-table__head test-shell-table__head--name"
                  :style="getTableColumnStyle('name', NAME_COLUMN_MIN_WIDTH)"
                >
                  <div class="test-shell-table__head-inner">
                    <span>Name</span>
                    <button
                      type="button"
                      class="test-shell-table__resize-handle"
                      aria-label="Resize Name column"
                      @mousedown.prevent="startColumnResize('name', NAME_COLUMN_MIN_WIDTH, $event)"
                    />
                  </div>
                </th>
                <th
                  v-for="token in tableSectionTokens"
                  :key="token.key"
                  class="test-shell-table__head"
                  :style="getTableColumnStyle(token.key, DEFAULT_COLUMN_MIN_WIDTH)"
                >
                  <div class="test-shell-table__head-inner">
                    <span>{{ token.label }}</span>
                    <button
                      type="button"
                      class="test-shell-table__resize-handle"
                      :aria-label="`Resize ${token.label} column`"
                      @mousedown.prevent="startColumnResize(token.key, DEFAULT_COLUMN_MIN_WIDTH, $event)"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in displayRows" :key="row.cardId">
                <td
                  class="test-shell-table__cell test-shell-table__cell--name"
                  :style="getTableColumnStyle('name', NAME_COLUMN_MIN_WIDTH)"
                >
                  <div class="test-shell-table__name-row">
                    <q-checkbox
                      :model-value="isRowSelected(row)"
                      color="dark"
                      dense
                      size="xs"
                      class="test-shell-table__select-box"
                      @update:model-value="toggleRowSelection(row, $event)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      size="8px"
                      icon="visibility"
                      class="test-shell-table__eye"
                      :disable="!row.recordId"
                      @click="openRecordView(row)"
                    />
                    <div
                      class="test-shell-table__name"
                      :class="{ 'test-shell-card__value--placeholder': !row.titleValue }"
                    >
                      {{ row.titleValue || 'Name mapping undefined' }}
                    </div>
                  </div>
                </td>
                <td
                  v-for="tokenRow in row.sectionTokenRows"
                  :key="tokenRow.key"
                  class="test-shell-table__cell"
                  :style="getTableColumnStyle(tokenRow.tokenName, DEFAULT_COLUMN_MIN_WIDTH)"
                >
                  <template v-if="isKdbSectionActive">
                    <div v-if="getKdbDisplayItems(tokenRow).length" class="test-shell-table__kdb-list">
                      <div
                        v-for="item in getKdbDisplayItems(tokenRow)"
                        :key="`${tokenRow.key}:${item}`"
                        class="test-shell-table__kdb-item"
                      >
                        <span class="test-shell-table__kdb-icon">
                          <q-icon name="share" size="10px" />
                        </span>
                        <span class="test-shell-table__kdb-text">{{ item }}</span>
                      </div>
                    </div>
                    <span v-else class="test-shell-card__value--placeholder">No explicit value</span>
                  </template>
                  <span v-else :class="{ 'test-shell-card__value--placeholder': !tokenRow.value }">
                    {{ tokenRow.value || 'No explicit value' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <template v-if="false">
          <div v-for="row in displayRows" :key="row.cardId" class="test-shell-table-row">
          <div class="test-shell-table-row__title">{{ row.titleValue || 'Title mapping undefined' }}</div>
          <div class="test-shell-table-row__meta">
            {{ row.recordId || 'Unavailable' }} · {{ row.matchedTokenCount }} explicit token values
          </div>
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import FilePageHeroDashboard from 'components/FilePageHeroDashboard.vue'
import FilePageToolbar from 'components/FilePageToolbar.vue'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  getCardRelationshipLabel,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'
import {
  getFilePageRegistryEntry,
  getCanonicalTokenValue,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { buildRecordViewLocation } from 'src/utils/recordViewNavigation'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const rawRows = ref([])
const viewMode = ref('card')
const cardRelationshipPanelById = ref({})
const selectedRowIds = ref([])
const tableColumnWidths = ref({})
const cardItemKeysBySource = ref({})

const DEFAULT_COLUMN_MIN_WIDTH = 120
const NAME_COLUMN_MIN_WIDTH = 188

const SECTION_LOADERS = {
  users: {
    listFn: (bridgeValue) => bridgeValue?.users?.list?.(),
    resultKey: 'users',
    recordIdField: 'id',
  },
  artifacts: {
    listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(),
    resultKey: 'artifacts',
    recordIdField: 'artifact_id',
  },
  contacts: {
    listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(),
    resultKey: 'contacts',
    recordIdField: 'id',
  },
  companies: {
    listFn: (bridgeValue) => bridgeValue?.companies?.list?.(),
    resultKey: 'companies',
    recordIdField: 'id',
  },
  opportunities: {
    listFn: (bridgeValue) => bridgeValue?.opportunities?.list?.(),
    resultKey: 'opportunities',
    recordIdField: 'id',
  },
  projects: {
    listFn: (bridgeValue) => bridgeValue?.projects?.list?.(),
    resultKey: 'projects',
    recordIdField: 'pipeline_id',
  },
  notes: {
    listFn: (bridgeValue) => bridgeValue?.notes?.list?.(),
    resultKey: 'notes',
    recordIdField: 'id',
  },
  tasks: {
    listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(),
    resultKey: 'tasks',
    recordIdField: 'id',
  },
}

const fallbackSectionKey =
  TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value ||
  TEST_SHELL_SECTION_OPTIONS[0]?.value ||
  'tasks'

const activeSourceKey = computed(() => {
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})

const activeRegistryEntry = computed(
  () => getFilePageRegistryEntry(activeSourceKey.value) || getFilePageRegistryEntry(fallbackSectionKey),
)

const activeLoader = computed(() => SECTION_LOADERS[activeSourceKey.value] || null)
const hasSupportedBridge = computed(() => {
  if (!activeLoader.value) return false
  return typeof activeLoader.value.listFn(bridge.value) !== 'undefined'
})

const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const activeSectionKeyForCards = ref('')
const activeFilterSectionKey = ref('')
const activeFilterTokenKey = ref('')
const expandedFilterSectionKey = ref('')
const expandedCardSettingsGroupsBySource = ref({})

const activeSection = computed(() => {
  return level2Sections.value.find((section) => section.key === activeSectionKeyForCards.value) || level2Sections.value[0] || null
})
const isKdbSectionActive = computed(() => String(activeSection.value?.label || '').trim().toLowerCase() === 'kdb')

const activeSectionTokens = computed(() => {
  if (!activeSection.value) return []
  return level3Tokens.value.filter((token) => token.parentKey === activeSection.value.key)
})

const canonicalTitleToken = computed(
  () =>
    level3Tokens.value.find(
      (token) => String(token.parentLevel_2) === '3' && String(token.level_3) === '1',
    ) || null,
)
const availableCardItemTokens = computed(() =>
  level3Tokens.value.filter((token) => {
    if (token.key === canonicalTitleToken.value?.key) return false
    return String(token.parentLabel || '').trim().toLowerCase() !== 'kdb'
  }),
)
const enabledCardItemKeys = computed(() => {
  const sourceKey = activeSourceKey.value
  const configured = Array.isArray(cardItemKeysBySource.value[sourceKey]) ? cardItemKeysBySource.value[sourceKey] : []
  const allowedKeys = new Set(availableCardItemTokens.value.map((token) => token.key))
  return configured.filter((key) => allowedKeys.has(key))
})
const selectedCardItemTokens = computed(() =>
  enabledCardItemKeys.value
    .map((tokenKey) => availableCardItemTokens.value.find((token) => token.key === tokenKey))
    .filter(Boolean),
)
const cardItemTokenGroups = computed(() =>
  level2Sections.value
    .map((section) => ({
      key: section.key,
      label: section.label,
      tokens: availableCardItemTokens.value.filter((token) => token.parentKey === section.key),
    }))
    .filter((group) => group.tokens.length),
)
const expandedCardSettingsGroups = computed(() => {
  const sourceKey = activeSourceKey.value
  const existing = expandedCardSettingsGroupsBySource.value[sourceKey]
  return Array.isArray(existing) ? existing : cardItemTokenGroups.value.map((group) => group.key)
})
const tableSectionTokens = computed(() =>
  activeSectionTokens.value.filter((token) => token.key !== canonicalTitleToken.value?.key),
)

const unmappedShellSlots = computed(() => [
  'card.subtitle',
  'card.chips',
])

const displayRows = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()

  return rawRows.value
    .map((row, index) => buildShellRow(row, index))
    .filter((row) => {
      if (activeFilterSectionKey.value && !row.sectionPresence[activeFilterSectionKey.value]) return false
      if (activeFilterTokenKey.value && !row.tokenPresence[activeFilterTokenKey.value]) return false
      if (!query) return true
      const haystack = [
        row.recordId,
        ...row.sectionTokenRows.map((tokenRow) => tokenRow.tokenName),
        ...row.sectionTokenRows.map((tokenRow) => tokenRow.value),
        ...Object.keys(row.raw || {}),
      ]
      return haystack.some((value) => String(value || '').toLowerCase().includes(query))
    })
})

const visibleSelectableRowIds = computed(() =>
  displayRows.value.map((row) => String(row.recordId || row.cardId || '').trim()).filter(Boolean),
)

const allVisibleSelected = computed(() => {
  if (!visibleSelectableRowIds.value.length) return false
  return visibleSelectableRowIds.value.every((id) => selectedRowIds.value.includes(id))
})

const someVisibleSelected = computed(() => {
  if (!visibleSelectableRowIds.value.length) return false
  return visibleSelectableRowIds.value.some((id) => selectedRowIds.value.includes(id))
})

const heroTitle = computed(() => 'Shared File / Page View Shell')
const heroText = computed(
  () => 'This is the actual fixed page shell under standardization. The selected L1 source changes the real payload and canonical L2/L3 structure underneath it.',
)

const heroStats = computed(() => [
  {
    label: 'Source',
    value: activeRegistryEntry.value?.label || '--',
    caption: 'Selected L1 entity',
    tone: 'neutral',
  },
  {
    label: 'Rows',
    value: rawRows.value.length,
    caption: 'Real rows loaded',
    tone: 'rich',
  },
  {
    label: 'L2',
    value: level2Sections.value.length,
    caption: 'Canonical sections',
    tone: 'neutral',
  },
  {
    label: 'L3',
    value: level3Tokens.value.length,
    caption: 'Canonical tokens',
    tone: 'sparse',
  },
])

const healthText = computed(() => {
  return `The shell is fixed. Real rows and explicit canonical token values are shown without guessing. Unmapped shell slots remain placeholders until canonical shell mapping exists.`
})

const healthSegments = computed(() => [
  { tone: 'medium', width: 35 },
  { tone: 'rich', width: 45 },
  { tone: 'sparse', width: 20 },
])

const searchPlaceholder = computed(() => `Search ${activeRegistryEntry.value?.label || 'Records'}`)
const viewOptions = Object.freeze([
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
])

const multiTokenFilterSections = computed(() =>
  level2Sections.value.filter((section) => getFilterSectionTokenCount(section.key) > 1),
)
const tableLeftSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.label || '').trim().toLowerCase()
    return label !== 'kdb' && label !== 'system'
  }),
)
const tableRightSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.label || '').trim().toLowerCase()
    return label === 'kdb' || label === 'system'
  }),
)
const summarySectionShellOptions = Object.freeze(buildCardRelationshipOptions())

watch(
  activeSourceKey,
  async () => {
    searchQuery.value = ''
    activeFilterSectionKey.value = ''
    activeFilterTokenKey.value = ''
    expandedFilterSectionKey.value = ''
    await loadRows()
    activeSectionKeyForCards.value = level2Sections.value[0]?.key || ''
  },
  { immediate: true },
)

watch(
  level2Sections,
  (sections) => {
    if (!sections.some((section) => section.key === activeSectionKeyForCards.value)) {
      activeSectionKeyForCards.value = sections[0]?.key || ''
    }
  },
  { immediate: true },
)

watch(
  displayRows,
  (rows) => {
    const nextMap = {}
    rows.forEach((row) => {
      const rowId = getRowSelectionId(row)
      if (!rowId) return
      nextMap[rowId] = resolveCardRelationshipPanel(cardRelationshipPanelById.value[rowId], row.relationshipItemsByType || {})
    })
    cardRelationshipPanelById.value = nextMap
  },
  { immediate: true },
)

watch(
  [activeSourceKey, availableCardItemTokens],
  () => {
    const sourceKey = activeSourceKey.value
    const allowedKeys = new Set(availableCardItemTokens.value.map((token) => token.key))
    const existing = Array.isArray(cardItemKeysBySource.value[sourceKey]) ? cardItemKeysBySource.value[sourceKey] : []
    const normalized = existing.filter((key) => allowedKeys.has(key))

    if (normalized.length) {
      if (normalized.length !== existing.length) {
        cardItemKeysBySource.value = {
          ...cardItemKeysBySource.value,
          [sourceKey]: normalized,
        }
      }
      return
    }

    cardItemKeysBySource.value = {
      ...cardItemKeysBySource.value,
      [sourceKey]: availableCardItemTokens.value.slice(0, 4).map((token) => token.key),
    }
  },
  { immediate: true },
)

watch(
  [activeSourceKey, cardItemTokenGroups],
  () => {
    const sourceKey = activeSourceKey.value
    const availableKeys = new Set(cardItemTokenGroups.value.map((group) => group.key))
    const existing = expandedCardSettingsGroupsBySource.value[sourceKey]
    const normalized = Array.isArray(existing)
      ? existing.filter((key) => availableKeys.has(key))
      : cardItemTokenGroups.value.map((group) => group.key)

    expandedCardSettingsGroupsBySource.value = {
      ...expandedCardSettingsGroupsBySource.value,
      [sourceKey]: normalized,
    }
  },
  { immediate: true },
)

let removeColumnResizeListeners = null

function getColumnWidth(columnKey, fallbackWidth) {
  const storedWidth = Number(tableColumnWidths.value[String(columnKey || '').trim()])
  return Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : fallbackWidth
}

function getTableColumnStyle(columnKey, fallbackWidth) {
  const width = getColumnWidth(columnKey, fallbackWidth)
  return {
    width: `${width}px`,
    minWidth: `${width}px`,
  }
}

function isCardItemEnabled(tokenKey) {
  return enabledCardItemKeys.value.includes(tokenKey)
}

function getCardItemOrderIndex(tokenKey) {
  return enabledCardItemKeys.value.indexOf(tokenKey)
}

function setCardItemEnabled(tokenKey, nextValue) {
  const sourceKey = activeSourceKey.value
  const current = enabledCardItemKeys.value
  if (!nextValue) {
    cardItemKeysBySource.value = {
      ...cardItemKeysBySource.value,
      [sourceKey]: current.filter((key) => key !== tokenKey),
    }
    return
  }
  if (current.includes(tokenKey)) return
  cardItemKeysBySource.value = {
    ...cardItemKeysBySource.value,
    [sourceKey]: [...current, tokenKey],
  }
}

function moveCardItem(tokenKey, direction) {
  const sourceKey = activeSourceKey.value
  const current = [...enabledCardItemKeys.value]
  const currentIndex = current.indexOf(tokenKey)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return
  const [item] = current.splice(currentIndex, 1)
  current.splice(nextIndex, 0, item)
  cardItemKeysBySource.value = {
    ...cardItemKeysBySource.value,
    [sourceKey]: current,
  }
}

function isCardSettingsGroupExpanded(groupKey) {
  return expandedCardSettingsGroups.value.includes(groupKey)
}

function toggleCardSettingsGroup(groupKey) {
  const sourceKey = activeSourceKey.value
  const current = [...expandedCardSettingsGroups.value]
  const next = current.includes(groupKey)
    ? current.filter((key) => key !== groupKey)
    : [...current, groupKey]

  expandedCardSettingsGroupsBySource.value = {
    ...expandedCardSettingsGroupsBySource.value,
    [sourceKey]: next,
  }
}

function stopColumnResize() {
  if (typeof removeColumnResizeListeners === 'function') {
    removeColumnResizeListeners()
    removeColumnResizeListeners = null
  }
}

function startColumnResize(columnKey, minWidth, event) {
  stopColumnResize()
  const normalizedKey = String(columnKey || '').trim()
  const startX = Number(event?.clientX || 0)
  const initialWidth = getColumnWidth(normalizedKey, minWidth)

  const handlePointerMove = (moveEvent) => {
    const nextWidth = Math.max(minWidth, initialWidth + Number(moveEvent?.clientX || 0) - startX)
    tableColumnWidths.value = {
      ...tableColumnWidths.value,
      [normalizedKey]: nextWidth,
    }
  }

  const handlePointerUp = () => {
    stopColumnResize()
  }

  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', handlePointerUp)
  removeColumnResizeListeners = () => {
    window.removeEventListener('mousemove', handlePointerMove)
    window.removeEventListener('mouseup', handlePointerUp)
  }
}

onBeforeUnmount(() => {
  stopColumnResize()
})

async function loadRows() {
  error.value = ''
  rawRows.value = []
  const loader = activeLoader.value
  if (!loader) {
    error.value = 'This section does not have a supported live loader yet.'
    return
  }

  const bridgeValue = bridge.value
  if (!bridgeValue) {
    error.value = 'The preload bridge is not available.'
    return
  }

  loading.value = true
  try {
    const result = await loader.listFn(bridgeValue)
    rawRows.value = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
  } catch (loadError) {
    error.value = loadError?.message || `Could not load ${activeRegistryEntry.value?.label || 'records'}.`
  } finally {
    loading.value = false
  }
}

function buildShellRow(row, index) {
  const recordIdField = activeLoader.value?.recordIdField || ''
  const recordId = String(row?.[recordIdField] || '').trim()
  const titleValue = stringifyValue(getCanonicalTokenValue(row, canonicalTitleToken.value))
  const sourcePrefixes = (
    activeRegistryEntry.value?.relationshipSourcePrefixes?.length
      ? activeRegistryEntry.value.relationshipSourcePrefixes
      : [activeRegistryEntry.value?.singularLabel]
  )
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  const tokenPresence = Object.fromEntries(
    level3Tokens.value.map((token) => [token.key, Boolean(stringifyValue(getCanonicalTokenValue(row, token)))]),
  )
  const sectionPresence = Object.fromEntries(
    level2Sections.value.map((section) => [
      section.key,
      level3Tokens.value
        .filter((token) => token.parentKey === section.key)
        .some((token) => tokenPresence[token.key]),
    ]),
  )
  const tokenRows = tableSectionTokens.value.map((token) => {
    const rawValue = getCanonicalTokenValue(row, token)
    const value = stringifyValue(rawValue)
    return {
      key: `${recordId || index}:${token.key}`,
      tokenName: token.tokenName,
      label: token.label,
      rawValue,
      value,
    }
  })

  const cardDetailRows = enabledCardItemKeys.value
    .map((tokenKey) => availableCardItemTokens.value.find((token) => token.key === tokenKey))
    .filter(Boolean)
    .map((token) => {
      const value = stringifyValue(getCanonicalTokenValue(row, token))
      return {
        key: `${recordId || index}:detail:${token.key}`,
        label: token.label,
        value,
      }
    })
    .filter((item) => item.value)

  const matchedTokenCount = tokenRows.filter((token) => token.value).length

  return {
    cardId: `${recordId || 'row'}:${index}`,
    recordId,
    raw: row,
    avatarText: buildInitialsFromName(titleValue) || activeRegistryEntry.value?.singularLabel?.slice(0, 2)?.toUpperCase() || 'TS',
    titleValue,
    subtitleValue: '',
    cardDetailRows,
    relationshipItemsByType: buildCardRelationshipItems(row, sourcePrefixes),
    sectionPresence,
    tokenPresence,
    sectionTokenRows: tokenRows,
    matchedTokenCount,
    visibleTokenCount: tokenRows.length,
  }
}

function getRowSelectionId(row) {
  return String(row?.recordId || row?.cardId || '').trim()
}

function isRowSelected(row) {
  const id = getRowSelectionId(row)
  return Boolean(id) && selectedRowIds.value.includes(id)
}

function toggleRowSelection(row, nextValue) {
  const id = getRowSelectionId(row)
  if (!id) return
  if (nextValue) {
    if (!selectedRowIds.value.includes(id)) {
      selectedRowIds.value = [...selectedRowIds.value, id]
    }
    return
  }
  selectedRowIds.value = selectedRowIds.value.filter((selectedId) => selectedId !== id)
}

function toggleSelectAllVisible(nextValue) {
  const visibleIds = visibleSelectableRowIds.value
  if (!visibleIds.length) return
  if (nextValue) {
    selectedRowIds.value = Array.from(new Set([...selectedRowIds.value, ...visibleIds]))
    return
  }
  selectedRowIds.value = selectedRowIds.value.filter((id) => !visibleIds.includes(id))
}

function stringifyValue(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value).trim()
}

function buildInitialsFromName(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return ''
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function getKdbDisplayItems(tokenRow) {
  const rawValue = tokenRow?.rawValue
  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => stringifyValue(item)).filter(Boolean)
  }
  const normalized = stringifyValue(rawValue || tokenRow?.value)
  if (!normalized) return []
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getActiveRelationshipItems(row) {
  return row?.relationshipItemsByType?.[getRowRelationshipPanel(row)] || []
}

function getRowRelationshipPanel(row) {
  const rowId = getRowSelectionId(row)
  return rowId ? cardRelationshipPanelById.value[rowId] || 'notes' : 'notes'
}

function setRowRelationshipPanel(row, nextValue) {
  const rowId = getRowSelectionId(row)
  if (!rowId) return
  cardRelationshipPanelById.value = {
    ...cardRelationshipPanelById.value,
    [rowId]: resolveCardRelationshipPanel(nextValue, row.relationshipItemsByType || {}),
  }
}

function getTestShellMetadataRows(row) {
  return Array.isArray(row?.cardDetailRows) ? row.cardDetailRows : []
}

function getTestShellAvatarColor() {
  return '#111111'
}

function getTestShellCardStyle() {
  return {
    '--test-shell-card-blob-x': '50%',
    '--test-shell-card-blob-y': '30%',
    '--test-shell-card-blob-size': '60%',
    '--test-shell-card-blob-opacity': '0',
    '--test-shell-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--test-shell-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--test-shell-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onTestShellCardPointerEnter(event) {
  updateTestShellCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--test-shell-card-blob-opacity', '1')
}

function onTestShellCardPointerMove(event) {
  updateTestShellCardGradientPosition(event)
}

function onTestShellCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--test-shell-card-blob-opacity', '0')
}

function updateTestShellCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element || typeof element.getBoundingClientRect !== 'function') return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  element.style.setProperty('--test-shell-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--test-shell-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function openRecordView(row) {
  if (!row?.recordId || !activeRegistryEntry.value?.entityName) return
  const cardFields = selectedCardItemTokens.value.map((token) => String(token?.tokenName || '').trim()).filter(Boolean)
  const location = buildRecordViewLocation({
      tableName: activeRegistryEntry.value.entityName,
      recordId: row.recordId,
      returnTo: route.fullPath,
      query: cardFields.length ? { cardFields: cardFields.join(',') } : {},
    })
  if (!location) return
  router.push(location)
}

function setActiveFilterSection(sectionKey) {
  activeFilterSectionKey.value = sectionKey
  if (activeFilterTokenKey.value) {
    const tokenStillVisible = level3Tokens.value.some(
      (token) => token.key === activeFilterTokenKey.value && token.parentKey === sectionKey,
    )
    if (!tokenStillVisible) activeFilterTokenKey.value = ''
  }
}

function clearSectionFilter() {
  activeFilterSectionKey.value = ''
}

function setActiveFilterToken(tokenKey) {
  activeFilterTokenKey.value = tokenKey
  const token = level3Tokens.value.find((entry) => entry.key === tokenKey)
  if (token?.parentKey) activeFilterSectionKey.value = token.parentKey
}

function clearTokenFilter() {
  activeFilterTokenKey.value = ''
}

function toggleFilterToken(tokenKey, nextValue) {
  if (nextValue === false) {
    clearTokenFilter()
    clearSectionFilter()
    return
  }
  setActiveFilterToken(tokenKey)
}

function getSectionTokens(sectionKey) {
  return level3Tokens.value.filter((token) => token.parentKey === sectionKey)
}

function getFilterSectionTokenCount(sectionKey) {
  return getSectionTokens(sectionKey).length
}

function toggleExpandedFilterSection(sectionKey) {
  expandedFilterSectionKey.value = expandedFilterSectionKey.value === sectionKey ? '' : sectionKey
}

function applyFilterSelection(value) {
  const normalized = String(value || '').trim()
  if (!normalized || normalized === 'all') {
    clearTokenFilter()
    clearSectionFilter()
    expandedFilterSectionKey.value = ''
    return
  }

  if (normalized.startsWith('section:')) {
    clearTokenFilter()
    const sectionKey = normalized.slice('section:'.length)
    setActiveFilterSection(sectionKey)
    expandedFilterSectionKey.value = sectionKey
    return
  }

  if (normalized.startsWith('token:')) {
    const tokenKey = normalized.slice('token:'.length)
    setActiveFilterToken(tokenKey)
    const token = level3Tokens.value.find((entry) => entry.key === tokenKey)
    expandedFilterSectionKey.value = token?.parentKey || ''
  }
}

function notifyShellAction(label) {
  $q.notify({
    type: 'info',
    message: `${label} is visible in the shared shell, but the explicit shell action contract is not defined yet.`,
  })
}

</script>

<style scoped>
.test-shell-page,
.test-shell-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-shell-gap-banner {
  border: 1px solid rgba(249, 115, 22, 0.18);
}

.test-shell-filters-trigger {
  color: var(--ds-color-text-muted);
}

.test-shell-filters-menu {
  border-radius: 18px;
  overflow: hidden;
}

.test-shell-filters-panel {
  width: fit-content;
  max-width: min(720px, calc(100vw - 16px));
  padding: 6px;
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(18px);
}

.test-shell-filters-panel__title {
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  padding: 2px 2px 6px;
}

.test-shell-filters-panel__rows {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}

.test-shell-filter-group {
  display: grid;
  gap: 4px;
  flex: 0 1 auto;
  width: max-content;
  min-width: 0;
  max-width: 220px;
}

.test-shell-filter-child-row {
  width: max-content;
  min-width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.test-shell-filter-child-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 2px 3px 2px;
}

.test-shell-filter-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: 100%;
  padding: 2px 2px 4px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.test-shell-filter-heading__label,
.test-shell-filter-child-row__label {
  min-width: 0;
  font-family: var(--ds-font-family-body);
  font-size: 0.62rem;
  font-weight: var(--ds-font-weight-light);
  letter-spacing: 0.01em;
  white-space: normal;
  overflow-wrap: anywhere;
}

.test-shell-filter-heading__label {
  color: #ffffff;
}

.test-shell-filter-heading__meta {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.56rem;
}

.test-shell-filter-heading__chevron {
  color: rgba(255, 255, 255, 0.48);
}

.test-shell-filter-group__children {
  display: grid;
  gap: 5px;
}


.test-shell-filter-child-row--selected {
  color: #ffffff;
}

.test-shell-filter-child-row__checkbox {
  min-height: 12px;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__inner) {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.14) !important;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__inner--truthy) {
  color: rgba(255, 255, 255, 0.28) !important;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__bg) {
  background: transparent !important;
}

.test-shell-cards-grid {
  align-items: stretch;
}

.test-shell-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border-radius: 28px;
  border-color: #e5e5e5;
  box-shadow: none;
}

.test-shell-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--test-shell-card-blob-x) var(--test-shell-card-blob-y),
    var(--test-shell-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--test-shell-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--test-shell-card-blob-size) * 0.46),
    var(--test-shell-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--test-shell-card-blob-size) * 0.7),
    transparent var(--test-shell-card-blob-size)
  );
  opacity: var(--test-shell-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.test-shell-card > * {
  position: relative;
  z-index: 1;
}

.test-shell-card:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

.test-shell-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.test-shell-card__control-row :deep(.q-checkbox) {
  min-height: 20px;
}

.test-shell-card__control-row :deep(.q-checkbox__inner),
.test-shell-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.test-shell-card__control-row :deep(.q-checkbox__inner) {
  font-size: 16px;
}

.test-shell-card__control-settings,
.test-shell-card__control-eye {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  color: rgba(17, 17, 17, 0.82);
}

.test-shell-card__control-settings :deep(.q-icon),
.test-shell-card__control-eye :deep(.q-icon) {
  font-size: 15px;
}

.test-shell-card__control-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.test-shell-card-settings-menu {
  border-radius: 14px;
  overflow: hidden;
}

.test-shell-card-settings-panel {
  width: min(280px, calc(100vw - 24px));
  padding: 10px;
  background: rgba(248, 248, 246, 0.98);
  border: 1px solid rgba(17, 17, 17, 0.08);
  box-shadow: 0 16px 32px rgba(17, 17, 17, 0.12);
}

.test-shell-card-settings-panel__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.test-shell-card-settings-panel__caption {
  margin-top: 4px;
  color: rgba(17, 17, 17, 0.62);
  font-family: var(--font-body);
  font-size: 0.69rem;
  font-weight: var(--font-weight-light);
  line-height: 1.35;
}

.test-shell-card-settings-panel__list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.test-shell-card-settings-group {
  display: grid;
  gap: 4px;
}

.test-shell-card-settings-group--selected {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.test-shell-card-settings-group__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
}

.test-shell-card-settings-group__title {
  color: rgba(17, 17, 17, 0.62);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.test-shell-card-settings-group__icon {
  color: rgba(17, 17, 17, 0.56);
}

.test-shell-card-settings-group__body {
  display: grid;
  gap: 4px;
}

.test-shell-card-settings-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 2px 4px;
  border-radius: 8px;
}

.test-shell-card-settings-row__checkbox {
  color: rgba(17, 17, 17, 0.72);
}

.test-shell-card-settings-row__copy {
  min-width: 0;
}

.test-shell-card-settings-row__label {
  color: #111111;
  font-family: var(--font-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-light);
  line-height: 1.2;
}

.test-shell-card-settings-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.test-shell-card-settings-row__actions :deep(.q-btn) {
  color: rgba(17, 17, 17, 0.68);
}

.test-shell-card-settings-row__chevron {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  fill: none;
}

.test-shell-card__hero {
  padding: 0 0 4px;
}

.test-shell-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.test-shell-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 0;
}

.test-shell-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.test-shell-card__portrait-badge {
  display: flex;
  position: relative;
  z-index: 1;
  width: clamp(124px, 48%, 152px);
  height: clamp(124px, 48%, 152px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 40px rgba(17, 17, 17, 0.16);
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.2vw, 3rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
  overflow: hidden;
}

.test-shell-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: transparent;
  overflow: hidden;
}

.test-shell-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.test-shell-card__slot-label,
.test-shell-card__summary-label,
.test-shell-card__summary-panel-title,
.test-shell-token-row__meta {
  color: var(--ds-color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.test-shell-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.test-shell-card__bottom-stack,
.test-shell-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__detail-stack {
  gap: 4px;
}

.test-shell-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.test-shell-card__inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 0;
  font-family: var(--font-body);
  font-size: 0.74rem;
  font-weight: var(--font-weight-light);
}

.test-shell-card__inline-chip-value {
  color: #111111;
  font-weight: var(--font-weight-medium);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.test-shell-card__inline-chip-tooltip {
  color: rgba(17, 17, 17, 0.76);
  background: rgba(239, 239, 239, 0.92);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  padding: 4px 7px;
}

.test-shell-card__inline-chip--placeholder {
  color: #6f6f6f;
}

.test-shell-card__subtitle,
.test-shell-card__summary-meta,
.test-shell-card__summary-status,
.test-shell-token-row__value,
.test-shell-card__empty {
  color: var(--ds-color-text-secondary);
}

.test-shell-card__value--placeholder {
  color: var(--ds-color-text-muted);
  font-style: italic;
}

.test-shell-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
}

.test-shell-card__summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.test-shell-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.test-shell-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.test-shell-card__summary-toggle {
  margin: 0 auto 0 14px;
}

.test-shell-card__summary-toggle :deep(.q-btn) {
  position: relative;
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.test-shell-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.test-shell-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  transform: none;
  padding: 4px 7px;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(239, 239, 239, 0.5);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}

.test-shell-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.test-shell-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.test-shell-card__summary-panel {
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.test-shell-card__summary-add-relation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  min-height: 24px;
  margin: 0 14px 0 auto;
  padding: 0 2px;
  color: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.test-shell-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.test-shell-card__summary-add-relation-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  min-width: 19px;
  min-height: 19px;
  border-radius: 6px;
  color: #ffffff;
  background: #2647ff;
}

.test-shell-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 11px;
}

.test-shell-card__summary-add-relation-label {
  color: rgba(17, 17, 17, 0.86);
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.test-shell-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.test-shell-card__summary-body-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__note-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 36px;
  padding: 8px 10px;
  color: #111;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1.4;
}

.test-shell-card__note-pill--placeholder {
  color: #6f6f6f;
}

.test-shell-card__note-pill-name {
  font-weight: var(--font-weight-medium);
}

.test-shell-card__note-pill-value {
  text-align: right;
}

@media (max-width: 900px) {
  .test-shell-card__summary-head,
  .test-shell-card__note-pill {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-shell-card__hero-main {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.test-shell-table-surface {
  display: grid;
  gap: 6px;
}

.test-shell-table-tabs {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.test-shell-table-tabs__left,
.test-shell-table-tabs__right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.test-shell-table-tabs__right {
  justify-content: flex-end;
  margin-left: auto;
}

.test-shell-table-tabs__tab {
  min-height: 30px;
  padding: 0 11px;
  color: #111111;
  background: #fdfdfb;
  border: 1px solid #111111;
  border-radius: 2px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  letter-spacing: 0.01em;
  cursor: pointer;
}

.test-shell-table-tabs__tab--active {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.test-shell-table-scroll {
  overflow: auto;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.96);
}

.test-shell-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.test-shell-table__head,
.test-shell-table__cell {
  min-width: 144px;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.test-shell-table__head {
  position: sticky;
  top: 0;
  z-index: 2;
  color: rgba(17, 17, 17, 0.68);
  padding-top: 8px;
  padding-bottom: 8px;
  background: #f3f4f6;
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
  line-height: 0.96;
}

.test-shell-table__head-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.test-shell-table__resize-handle {
  width: 8px;
  min-width: 8px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: 0;
  border-right: 2px solid rgba(17, 17, 17, 0.18);
  cursor: col-resize;
}

.test-shell-table__resize-handle:hover,
.test-shell-table__resize-handle:focus-visible {
  border-right-color: rgba(17, 17, 17, 0.46);
  outline: none;
}

.test-shell-table__head--name,
.test-shell-table__cell--name {
  position: sticky;
  left: 0;
  z-index: 3;
  min-width: 196px;
  background: rgba(255, 255, 255, 0.98);
}

.test-shell-table__head--name {
  z-index: 4;
  background: #eef0f2;
}

.test-shell-table__cell {
  color: var(--ds-color-text-secondary);
  font-size: 12px;
  line-height: 1.35;
  vertical-align: top;
}

.test-shell-table__name-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.test-shell-table__select-box,
.test-shell-table__eye {
  flex: 0 0 auto;
}

.test-shell-table__eye {
  justify-self: start;
}

.test-shell-table__kdb-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.test-shell-table__kdb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 7px;
  color: #111111;
  background: rgba(17, 17, 17, 0.04);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 3px;
}

.test-shell-table__kdb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  color: rgba(17, 17, 17, 0.7);
}

.test-shell-table__kdb-text {
  min-width: 0;
  color: #111111;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-light);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.test-shell-table__name {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-body);
  font-size: 12px;
  font-weight: var(--font-weight-black);
  line-height: 1.35;
  min-width: 0;
  text-align: left;
  justify-self: start;
}

.test-shell-table tbody tr:last-child .test-shell-table__cell {
  border-bottom: 0;
}

.test-shell-table-row {
  padding: 14px 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
}

.test-shell-table-row__title {
  color: var(--ds-color-text-primary);
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.test-shell-table-row__meta {
  margin-top: 6px;
  color: var(--ds-color-text-secondary);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .test-shell-table-tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .test-shell-table-tabs__right {
    margin-left: 0;
    justify-content: flex-start;
  }

  .test-shell-table__head--name,
  .test-shell-table__cell--name {
    min-width: 164px;
  }

  .test-shell-table__kdb-list {
    grid-template-columns: 1fr;
  }
}
</style>
