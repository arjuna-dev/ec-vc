<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <section
        ref="contactHeroRef"
        class="contact-databook__hero"
        :style="structuredRecordHeroStyle"
        @pointerenter="startContactHeroPointerTracking"
        @pointermove="onContactHeroPointerMove"
        @pointerleave="onContactHeroPointerLeave"
      >
        <div class="contact-databook__hero-main">
          <figure class="contact-databook__portrait contact-databook__portrait--initials-only">
            <div class="contact-databook__portrait-placeholder" aria-hidden="true">
              <div
                class="contact-databook__portrait-placeholder-initials"
                :style="{ backgroundColor: heroAvatarColor }"
              >
                {{ heroInitials }}
              </div>
            </div>
          </figure>

          <div class="contact-databook__hero-copy">
            <div class="record-shell__hero-name-row">
              <h1 class="contact-databook__name">
                {{ heroName }}
              </h1>

              <q-btn
                flat
                round
                dense
                icon="tune"
                class="record-shell__hero-icon-button"
                aria-label="Hero field settings"
              >
                <q-tooltip>Hero Fields</q-tooltip>
                <q-menu anchor="bottom right" self="top right">
                  <div class="record-shell__settings-panel">
                    <div class="record-shell__settings-title">Hero Fields</div>
                    <div
                      v-for="section in selectableSections"
                      :key="section.key"
                      class="record-shell__settings-group"
                    >
                      <button
                        type="button"
                        class="record-shell__settings-heading"
                        @click="toggleExpandedSection(section.key)"
                      >
                        <span>{{ section.label }}</span>
                        <q-icon :name="isSectionExpanded(section.key) ? 'expand_less' : 'expand_more'" size="14px" />
                      </button>

                      <div v-if="isSectionExpanded(section.key)" class="record-shell__settings-children">
                        <label
                          v-for="token in getSectionTokens(section.key)"
                          :key="token.key"
                          class="record-shell__settings-row"
                        >
                          <q-checkbox
                            :model-value="isSelectedToken(token.key)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            @update:model-value="setTokenSelected(token.key, $event)"
                          />
                          <span>{{ token.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </q-menu>
              </q-btn>

              <q-btn
                flat
                round
                dense
                icon="edit"
                class="record-shell__hero-icon-button record-shell__hero-icon-button--create"
                aria-label="Add record"
                @click="openCreateRecordDialog"
              >
                <q-tooltip>Add Record</q-tooltip>
              </q-btn>
            </div>

            <div class="contact-databook__role">
              {{ heroSubtitle }}
            </div>
            <div class="contact-databook__role contact-databook__role--location">
              {{ heroSecondaryLine }}
            </div>

            <div class="record-shell__hero-field-columns">
              <div v-if="selectedHeroFieldCards.length" class="record-shell__hero-field-stack">
                <article
                  v-for="field in selectedHeroFieldCards"
                  :key="field.key"
                  class="record-shell__hero-field-card"
                  :class="{ 'record-shell__hero-field-card--interactive': isRecordRoute }"
                  @click="openRecordFieldDialog"
                >
                  <div class="record-shell__hero-field-top">
                    <div class="record-shell__hero-field-label">{{ field.label }}</div>
                    <div class="record-shell__hero-field-description">{{ field.description }}</div>
                  </div>
                  <div class="record-shell__hero-field-bottom">
                    <div class="record-shell__hero-field-value">{{ field.value }}</div>
                    <q-icon :name="field.statusIcon" size="15px" class="record-shell__hero-field-status" />
                  </div>
                </article>
              </div>

              <div class="record-shell__hero-field-stack record-shell__hero-field-stack--summary">
                <article
                  class="record-shell__hero-field-card record-shell__hero-field-card--summary"
                  :class="{ 'record-shell__hero-field-card--interactive': isRecordRoute }"
                  @click="openRecordFieldDialog"
                >
                  <div class="record-shell__hero-field-top">
                    <div class="record-shell__hero-field-label">Summary</div>
                    <div class="record-shell__hero-field-description">General</div>
                  </div>
                  <div class="record-shell__hero-field-bottom">
                    <div class="record-shell__hero-field-value">{{ heroSummaryValue }}</div>
                    <q-icon :name="heroSummaryStatusIcon" size="15px" class="record-shell__hero-field-status" />
                  </div>
                </article>
              </div>
            </div>

            <div class="contact-databook__hero-notes-panel">
              <div class="contact-databook__hero-tabs" role="tablist" :aria-label="`${activeRegistryEntry?.label || 'Record'} context`">
                <button
                  type="button"
                  class="contact-databook__hero-tab"
                  :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'notes' }"
                  @click="genericHeroPanelTab = 'notes'"
                >
                  Latest notes
                </button>
                <button
                  type="button"
                  class="contact-databook__hero-tab"
                  :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'documents' }"
                  @click="genericHeroPanelTab = 'documents'"
                >
                  Related artifacts
                </button>
              </div>

              <ul
                v-if="genericHeroPanelTab === 'notes' && genericHeroNotes.length"
                class="contact-databook__hero-notes"
              >
                <li
                  v-for="note in genericHeroNotes"
                  :key="note.id"
                  class="contact-databook__hero-note"
                >
                  <div class="contact-databook__notes-row">
                    <div class="contact-databook__notes-title">{{ note.title }}</div>
                    <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                  </div>
                  <div v-if="note.content" class="contact-databook__notes-content">
                    {{ note.content }}
                  </div>
                </li>
              </ul>
              <div
                v-else-if="genericHeroPanelTab === 'notes'"
                class="contact-databook__hero-panel-empty"
              >
                No notes yet for this {{ (activeRegistryEntry?.singularLabel || 'record').toLowerCase() }}.
              </div>

              <ul
                v-if="genericHeroPanelTab === 'documents' && genericHeroDocuments.length"
                class="contact-databook__hero-documents"
              >
                <li
                  v-for="document in genericHeroDocuments"
                  :key="document.id"
                  class="contact-databook__hero-document"
                >
                  <div class="contact-databook__notes-row">
                    <div class="contact-databook__notes-title">{{ document.title }}</div>
                    <div class="contact-databook__notes-meta">{{ document.meta }}</div>
                  </div>
                  <div v-if="document.content" class="contact-databook__notes-content">
                    {{ document.content }}
                  </div>
                </li>
              </ul>
              <div
                v-else-if="genericHeroPanelTab === 'documents'"
                class="contact-databook__hero-panel-empty"
              >
                No related artifacts yet for this {{ (activeRegistryEntry?.singularLabel || 'record').toLowerCase() }}.
              </div>
            </div>
          </div>
        </div>

        <div class="contact-databook__summary">
          <div class="contact-databook__summary-header contact-databook__summary-header--feed">
            <div class="contact-databook__summary-label">Record Feed</div>
          </div>

          <div v-if="recordFeedTabOptions.length" class="contact-databook__summary-feed-tabs">
            <button
              v-for="tab in recordFeedTabOptions"
              :key="tab.id"
              type="button"
              class="contact-databook__summary-feed-tab"
              :class="{ 'contact-databook__summary-feed-tab--active': activeRecordFeedTab === tab.id }"
              @click="activeRecordFeedTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="displayedRecordFeedItems.length" class="contact-databook__summary-feed-list">
            <div
              v-for="item in displayedRecordFeedItems"
              :key="item.id"
              class="contact-databook__summary-feed-entry"
            >
              <div class="contact-databook__summary-feed-entry-top">
                <div class="contact-databook__summary-feed-entry-source">{{ item.sourceLabel }}</div>
                <div class="contact-databook__summary-feed-entry-time">{{ item.meta }}</div>
              </div>
              <div class="contact-databook__summary-feed-entry-title">{{ item.title }}</div>
              <div v-if="item.content" class="contact-databook__summary-feed-entry-content">
                {{ item.content }}
              </div>
            </div>
          </div>
          <div v-else class="contact-databook__summary-feed-state">
            No feed items yet for this record.
          </div>
        </div>
      </section>

      <section v-if="recordShellNavItems.length" class="contact-databook__nav" aria-label="Record sections">
        <button
          v-for="section in recordShellNavItems"
          :key="section.value"
          type="button"
          class="contact-databook__nav-item"
          :class="{
            'contact-databook__nav-item--active': activeSectionKey === section.value,
            'contact-databook__nav-item--kdb': section.isKdb,
            'contact-databook__nav-item--system': section.isSystem,
            'contact-databook__nav-item--push-right': section.pushRight,
          }"
          @click="activeSectionKey = section.value"
        >
          <span class="contact-databook__nav-item-label">{{ section.title }}</span>
          <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
        </button>
        <q-btn-toggle
          v-model="recordShellTopNavViewMode"
          dense
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          class="contact-section-card__view-toggle contact-databook__nav-view-toggle"
          :options="CONTACT_KDB_VIEW_OPTIONS"
        />
      </section>

      <section class="record-shell__panel">
        <div class="record-shell__panel-head">
          <div class="record-shell__panel-title">{{ activeSectionGroup?.title || activeSection?.label || 'Section' }}</div>
          <div class="record-shell__panel-meta">{{ activeSectionTokens.length }} fields</div>
        </div>

        <div v-if="isKdbSectionActive" class="record-shell__kdb-grid">
          <div
            v-for="group in activeKdbTokenGroups"
            :key="group.key"
            class="record-shell__kdb-group"
          >
            <button
              type="button"
              class="record-shell__kdb-group-toggle"
              @click="toggleKdbGroup(group.key)"
            >
              <q-icon
                :name="isKdbGroupExpanded(group.key) ? 'expand_more' : 'chevron_right'"
                size="14px"
                class="record-shell__kdb-group-toggle-icon"
              />
              <span class="record-shell__kdb-group-title">{{ group.label }}</span>
            </button>
            <div v-if="isKdbGroupExpanded(group.key)" class="record-shell__kdb-group-grid">
              <div v-for="token in group.tokens" :key="token.key" class="record-shell__field-card">
                <div class="record-shell__field-label">{{ token.label }}</div>
                <div v-if="isRecordRoute" class="record-shell__field-value-row">
                  <q-select
                    v-if="token.tokenType === 'select_multi'"
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
                </div>
                <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="hasGroupedSectionSubsections" class="record-shell__section-group-stack">
          <section
            v-for="group in activeSectionTokenGroups"
            :key="group.key"
            class="record-shell__section-group"
          >
            <button
              type="button"
              class="record-shell__section-group-toggle"
              @click="toggleSectionSubgroup(group.key)"
            >
              <q-icon
                :name="isSectionSubgroupExpanded(group.key) ? 'expand_more' : 'chevron_right'"
                size="14px"
                class="record-shell__section-group-toggle-icon"
              />
              <span class="record-shell__section-group-title">{{ group.title }}</span>
              <span class="record-shell__section-group-meta">{{ group.tokens.length }} fields</span>
            </button>
            <div v-if="isSectionSubgroupExpanded(group.key)" class="record-shell__field-grid">
              <div v-for="token in group.tokens" :key="token.key" class="record-shell__field-card">
                <div class="record-shell__field-label">{{ token.label }}</div>
                <div v-if="isRecordRoute" class="record-shell__field-value-row">
                  <q-select
                    v-if="token.tokenType === 'select_multi'"
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
                </div>
                <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="record-shell__field-grid">
          <div
            v-for="token in activeSectionTokens"
            :key="token.key"
            class="record-shell__field-card"
          >
            <div class="record-shell__field-label">{{ token.label }}</div>
            <div v-if="isRecordRoute" class="record-shell__field-value-row">
              <q-select
                v-if="token.tokenType === 'select_multi'"
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
            </div>
            <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
          </div>
        </div>
      </section>

      <AddEditRecordShellDialog
        :key="createDialogRenderKey"
        v-model="createDialogOpen"
        :mode="createDialogMode"
        :source-label="activeRegistryEntry?.label || 'Records'"
        :singular-label="activeRegistryEntry?.singularLabel || 'record'"
        :key-field-tokens="createKeyFieldTokens"
        :left-sections="createDialogLeftSections"
        :right-sections="createDialogRightSections"
        :loading="createDialogLoading"
        :submit-disabled="createDialogLoading"
        :initial-values="dialogInitialValues"
        :initial-field-meta="dialogInitialFieldMeta"
        initial-section-key="key-fields"
        :initial-artifacts="[]"
        :artifact-context="null"
        @change="handleDialogChange"
        @request-close="handleDialogClose"
        @submit="submitCreateRecord"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AddEditRecordShellDialog from 'src/components/AddEditRecordShellDialog.vue'
import {
  CANONICAL_OPTION_LISTS,
  getCanonicalTokenFieldNames,
  getFilePageRegistryEntry,
  getRuntimeTableNameForEntityName,
  LEVEL_1_FILE_REGISTRY,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { buildDialogSectionGroups, groupDialogLevel2Sections, splitDialogSections } from 'src/utils/dialogShellPayload'
import { loadShellFieldSelectionMap, persistShellFieldSelectionMap } from 'src/utils/shellFieldSelection'
import { buildTokenUpdateChanges, tokenSupportsRecordUpdate } from 'src/utils/tokenWriteChanges'

const route = useRoute()
const $q = useQuasar()
const CONTACT_KDB_VIEW_OPTIONS = [
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedSectionKeys = ref([])
const expandedKdbGroupKeys = ref(['first_order', 'knowledge_db', 'other'])
const expandedSectionSubgroupKeys = ref([])
const activeSectionKey = ref('')
const contactHeroRef = ref(null)
const contactHeroGradient = ref({ x: 50, y: 30, size: 60, opacity: 0 })
const genericHeroPanelTab = ref('notes')
const activeRecordFeedTab = ref('all')
const recordShellTopNavViewMode = ref('grid')
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const hasBridge = computed(() => Boolean(bridge.value))
const loading = ref(false)
const inlineFieldSavingKeys = ref([])
const error = ref('')
const currentView = ref(null)
const fields = ref([])
const fieldVerificationStates = ref({})
const inlineFieldValues = ref({})
const heroFieldKeysBySource = ref(loadShellFieldSelectionMap())
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const isRecordRoute = computed(() => Boolean(tableNameParam.value && recordIdParam.value))
const fallbackSectionKey = TEST_SHELL_SECTION_OPTIONS[0]?.value || 'tasks'
const activeSourceKey = computed(() => {
  if (isRecordRoute.value) {
    return resolveSourceKeyFromTableName(currentView.value?.table_name || tableNameParam.value) || fallbackSectionKey
  }
  const current = String(route.query.section || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === current) ? current : fallbackSectionKey
})
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY[activeSourceKey.value] || [])
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [String(field?.field_name || '').trim(), field])),
)
const runtimeTableName = computed(() =>
  String(getRuntimeTableNameForEntityName(activeRegistryEntry.value?.entityName || tableNameParam.value) || tableNameParam.value || '').trim(),
)

const canonicalNameToken = computed(() => level3Tokens.value.find((token) => String(token.level_3) === '1') || null)
const canonicalSummaryToken = computed(() =>
  level3Tokens.value.find((token) => String(token.level_3) === '2' || String(token.label || '').trim().toLowerCase() === 'summary') || null,
)

const selectableTokens = computed(() =>
  level3Tokens.value.filter((token) => {
    const label = String(token.label || '').trim().toLowerCase()
    return label !== 'name' && label !== 'summary'
  }),
)
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
const selectableSections = computed(() => level2Sections.value.filter((section) => normalizedSelectableTokens.value.some((token) => token.parentKey === section.key)))
const selectedHeroTokens = computed(() => normalizedSelectableTokens.value.filter((token) => selectedTokenKeySet.value.has(token.key)))
const createKeyFieldTokens = computed(() => [canonicalNameToken.value, canonicalSummaryToken.value].filter(Boolean).map(normalizeCreateDialogToken))
const groupedLevel2Sections = computed(() => groupDialogLevel2Sections(level2Sections.value))
const createSectionGroups = computed(() =>
  buildDialogSectionGroups({
    groupedSections: groupedLevel2Sections.value,
    tokenFilter: (section) => normalizedSelectableTokens.value.filter(
      (token) => token.parentKey === section.key && (isRecordRoute.value || selectedTokenKeySet.value.has(token.key)),
    ),
    mapToken: normalizeCreateDialogToken,
  }),
)
const createDialogSectionSplit = computed(() => splitDialogSections(createSectionGroups.value))
const createDialogLeftSections = computed(() => createDialogSectionSplit.value.leftSections)
const createDialogRightSections = computed(() => createDialogSectionSplit.value.rightSections)
const activeSectionGroup = computed(() => groupedLevel2Sections.value.find((group) => group.value === activeSectionKey.value) || groupedLevel2Sections.value[0] || null)
const activeSection = computed(() => activeSectionGroup.value?.sections?.[0] || null)
const activeSectionEntries = computed(() => activeSectionGroup.value?.sections || [])
const activeSectionTokens = computed(() => normalizedSelectableTokens.value.filter((token) => activeSectionEntries.value.some((section) => section.key === token.parentKey)))
const isKdbSectionActive = computed(() => activeSectionEntries.value.some((section) => String(section.label || '').trim().toLowerCase() === 'kdb'))
const hasGroupedSectionSubsections = computed(() => !isKdbSectionActive.value && activeSectionEntries.value.length > 1)
const activeSectionTokenGroups = computed(() =>
  activeSectionEntries.value
    .map((section) => ({
      key: section.key,
      title: section.label,
      tokens: normalizedSelectableTokens.value.filter((token) => token.parentKey === section.key),
    }))
    .filter((group) => group.tokens.length),
)
const activeKdbTokenGroups = computed(() => {
  if (!isKdbSectionActive.value) return []
  const grouped = [
    { key: 'first_order', label: 'First-Order', tokens: [] },
    { key: 'knowledge_db', label: 'Knowledge DB', tokens: [] },
    { key: 'other', label: 'Other', tokens: [] },
  ]
  for (const token of activeSectionTokens.value) {
    const explicitGroup = String(token.relationshipGroup || '').trim().toLowerCase()
    const targetEntry = LEVEL_1_FILE_REGISTRY.find((entry) => entry.entityName === token.optionEntity)
    const fallbackGroup = String(targetEntry?.shellGroup || '').trim().toLowerCase()
    const groupKey = explicitGroup || fallbackGroup || 'other'
    const targetGroup = grouped.find((group) => group.key === groupKey) || grouped[2]
    targetGroup.tokens.push(token)
  }
  return grouped.filter((group) => group.tokens.length)
})
const toolbarLeftSections = computed(() => groupedLevel2Sections.value.filter((group) => !group.sections.some((section) => ['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase()))))
const toolbarRightSections = computed(() => groupedLevel2Sections.value.filter((group) => group.sections.some((section) => ['kdb', 'system'].includes(String(section.label || '').trim().toLowerCase()))))

const heroInitials = computed(() => String(activeRegistryEntry.value?.singularLabel || 'Record').slice(0, 2).toUpperCase())
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
const heroName = computed(() => getTokenDisplayValue(canonicalNameToken.value) || `${activeRegistryEntry.value?.singularLabel || 'Record'} Name`)
const heroSubtitle = computed(() => {
  if (isRecordRoute.value) return `${activeRegistryEntry.value?.label || currentView.value?.table_name || 'Record'} Record`
  return activeRegistryEntry.value?.label || 'Record Shell'
})
const heroSecondaryLine = computed(() => {
  if (isRecordRoute.value) return `Record ID ${recordIdParam.value || '-'}`
  return 'Expanded record-view skeleton for the selected L1 payload.'
})
const heroSummaryValue = computed(() => getTokenDisplayValue(canonicalSummaryToken.value) || 'No summary captured for this record yet.')
const heroSummaryStatusIcon = computed(() => (getTokenDisplayValue(canonicalSummaryToken.value) ? 'task_alt' : 'schedule'))
const selectedHeroFieldCards = computed(() =>
  selectedHeroTokens.value.map((token) => {
    const sectionLabel = level2Sections.value.find((section) => section.key === token.parentKey)?.label || 'Field'
    return {
      key: token.key,
      label: token.label,
      description: sectionLabel,
      value: getTokenDisplayValue(token),
      statusIcon: getTokenDisplayValue(token) ? 'task_alt' : 'schedule',
    }
  }),
)
const genericHeroNotes = computed(() =>
  selectedHeroTokens.value.slice(0, 4).map((token, index) => ({
    id: token.key,
    title: token.label,
    created_at: index === 0 ? 'Selected now' : 'Ready',
    content: getTokenDisplayValue(token),
  })),
)
const genericHeroDocuments = computed(() => [
  {
    id: 'record-shell-summary',
    title: 'Summary',
    meta: 'Pinned field',
    content: heroSummaryValue.value,
  },
])
const feedItems = computed(() => [
  {
    id: 'feed-1',
    feedKey: 'all',
    sourceLabel: isRecordRoute.value ? 'Record' : 'Record Shell',
    meta: isRecordRoute.value ? `ID ${recordIdParam.value || '-'}` : 'Now',
    title: isRecordRoute.value ? (currentView.value?.table_name || activeRegistryEntry.value?.label || 'Record') : 'Template feed lane',
    content: isRecordRoute.value
      ? `Viewing ${activeRegistryEntry.value?.singularLabel || 'record'} through the shared Record Shell.`
      : 'This right-side black box is the dedicated feed surface for the selected L1 record skeleton.',
  },
  {
    id: 'feed-2',
    feedKey: 'all',
    sourceLabel: 'Payload',
    meta: getFieldDisplayValue('updated_at') || getFieldDisplayValue('created_at') || 'Live',
    title: isRecordRoute.value ? 'Shared record payload' : 'L1-driven structure',
    content: isRecordRoute.value
      ? `${fields.value.length} fields loaded from databooks.view(${tableNameParam.value}, ${recordIdParam.value}).`
      : 'Changing the L1 at the top swaps the canonical record skeleton underneath this template.',
  },
])
const recordFeedTabOptions = computed(() => [{ id: 'all', label: 'All' }])
const displayedRecordFeedItems = computed(() => feedItems.value.filter((item) => item.feedKey === activeRecordFeedTab.value))
const recordShellNavItems = computed(() => [
  ...toolbarLeftSections.value.map((group) => ({
    value: group.value,
    title: group.title,
    isKdb: false,
    isSystem: false,
    pushRight: false,
  })),
  ...toolbarRightSections.value.map((group, index) => {
    const normalized = String(group.title || '').trim().toLowerCase()
    return {
      value: group.value,
      title: group.title,
      isKdb: normalized === 'kdb',
      isSystem: normalized === 'system',
      pushRight: index === 0,
    }
  }),
])
const createDialogMode = computed(() => (isRecordRoute.value ? 'edit' : 'create'))
const fieldVerificationActionOptions = [
  { label: 'Verify field', value: 'verified', icon: 'check_circle', color: 'rgba(35, 92, 26, 0.96)' },
  { label: 'Pre-Selected', value: 'default_preselected_unverified', icon: 'auto_awesome', color: 'rgba(64, 121, 210, 0.92)' },
  { label: 'Suggested', value: 'suggested_unverified', icon: 'lightbulb', color: 'rgba(186, 129, 13, 0.92)' },
  { label: 'Reject field', value: 'rejected', icon: 'cancel', color: 'rgba(166, 43, 43, 0.92)' },
]
const dialogInitialValues = computed(() => {
  const tokens = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    tokens.map((token) => [token.key, getTokenDialogValue(token)]),
  )
})
const dialogInitialFieldMeta = computed(() => ({}))

watch(level2Sections, (sections) => {
  if (!sections.length) {
    activeSectionKey.value = ''
    expandedSectionKeys.value = []
    expandedSectionSubgroupKeys.value = []
    return
  }
  const groups = groupedLevel2Sections.value
  if (!groups.some((group) => group.value === activeSectionKey.value)) activeSectionKey.value = groups[0]?.value || ''
  expandedSectionKeys.value = sections.map((section) => section.key)
}, { immediate: true })

watch(activeSectionTokenGroups, (groups) => {
  const nextKeys = groups.map((group) => group.key)
  expandedSectionSubgroupKeys.value = nextKeys.filter((key) => expandedSectionSubgroupKeys.value.includes(key))
  if (!expandedSectionSubgroupKeys.value.length && nextKeys.length) {
    expandedSectionSubgroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

watch(activeSourceKey, async () => { await ensureLiveOptionsLoaded() }, { immediate: true })
watch(
  [activeSourceKey, selectableTokens],
  () => {
    const sourceKey = activeSourceKey.value
    const allowedKeys = new Set(normalizedSelectableTokens.value.map((token) => token.key))
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

    heroFieldKeysBySource.value = {
      ...heroFieldKeysBySource.value,
      [sourceKey]: normalizedSelectableTokens.value.slice(0, 4).map((token) => token.key),
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

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
})

function isSectionExpanded(sectionKey) { return expandedSectionKeys.value.includes(sectionKey) }
function isKdbGroupExpanded(groupKey) { return expandedKdbGroupKeys.value.includes(groupKey) }
function isSectionSubgroupExpanded(groupKey) { return expandedSectionSubgroupKeys.value.includes(groupKey) }
function toggleExpandedSection(sectionKey) {
  expandedSectionKeys.value = isSectionExpanded(sectionKey)
    ? expandedSectionKeys.value.filter((key) => key !== sectionKey)
    : [...expandedSectionKeys.value, sectionKey]
}
function toggleKdbGroup(groupKey) {
  expandedKdbGroupKeys.value = isKdbGroupExpanded(groupKey)
    ? expandedKdbGroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedKdbGroupKeys.value, groupKey]
}
function toggleSectionSubgroup(groupKey) {
  expandedSectionSubgroupKeys.value = isSectionSubgroupExpanded(groupKey)
    ? expandedSectionSubgroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedSectionSubgroupKeys.value, groupKey]
}
function getSectionTokens(sectionKey) { return selectableTokens.value.filter((token) => token.parentKey === sectionKey) }
function isSelectedToken(tokenKey) { return selectedTokenKeySet.value.has(tokenKey) }
function setTokenSelected(tokenKey, isSelected) {
  const next = new Set(selectedTokenKeys.value)
  if (isSelected) next.add(tokenKey)
  else next.delete(tokenKey)
  selectedTokenKeys.value = Array.from(next)
}

function openCreateRecordDialog() {
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}
function handleDialogChange() {}
function handleDialogClose() { createDialogOpen.value = false }

async function submitCreateRecord({ values } = {}) {
  if (isRecordRoute.value) {
    await submitRecordUpdate(values)
    return
  }
  const payload = buildCreatePayload(values)
  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.[activeSourceKey.value]?.create?.(payload)
    if (!result) {
      $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
      return
    }
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    createDialogLoading.value = false
  }
}

async function submitRecordUpdate(values = {}) {
  const changes = buildRecordUpdateChanges(values)
  if (!changes.length) {
    createDialogOpen.value = false
    $q.notify({ type: 'info', message: 'No record changes to save.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.databooks?.update?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes,
      actionLabel: 'record_shell_edit_session',
    })
    for (const change of changes) {
      await bridge.value?.verification?.upsert?.({
        tableName: change.table_name,
        recordId: change.record_id,
        fieldName: change.field_name,
        state: 'verified',
        source: 'direct_user_input',
        actionLabel: 'record_shell_edit_session',
      })
    }
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} updated.` })
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    createDialogLoading.value = false
  }
}

function buildRecordUpdateChanges(values = {}) {
  const seenChangeKeys = new Set()
  return [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
    .flatMap((token) => {
      const field = resolveExistingFieldForToken(token)
      if (field && !field.editable) return []
      const changes = buildTokenUpdateChanges(token, {
        nextValue: values?.[token.key],
        initialValue: field ? field.value : getTokenDialogValue(token),
        recordId: recordIdParam.value,
        entityName: activeRegistryEntry.value?.entityName || tableNameParam.value,
        idColumn: String(field?.id_column || 'id').trim() || 'id',
      })
      return changes.filter((change) => {
        const changeKey = [
          String(change?.change_kind || 'field').trim(),
          String(change?.table_name || '').trim(),
          String(change?.field_name || '').trim(),
          String(change?.relationship_token || '').trim(),
        ].join(':')
        if (!change?.field_name || seenChangeKeys.has(changeKey)) return false
        seenChangeKeys.add(changeKey)
        return true
      })
    })
}

function buildCreatePayload(values = {}) {
  const allTokens = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens
      .map((token) => {
        const value = values?.[token.key]
        if (Array.isArray(value) && !value.length) return null
        if (!Array.isArray(value) && String(value ?? '').trim() === '') return null
        return [resolveWriteField(token), value]
      })
      .filter(Boolean),
  )
}

function resolveWriteField(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return String(token?.dbWriteField || aliases[0] || token?.tokenName || token?.key || '').trim()
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  const optionList = String(token?.optionList || '').trim()
  if (optionSource === 'canonical_list' && optionList) return CANONICAL_OPTION_LISTS[optionList] || []
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
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
  const normalized = String(entityName || '').trim()
  return LEVEL_1_FILE_REGISTRY.find((entry) => String(entry.entityName || '').trim() === normalized)?.key || ''
}

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const titleToken = (LEVEL_3_FILE_REGISTRY_BY_KEY[sourceKey] || []).find((token) => String(token.level_3) === '1') || null
  return rows.map((row) => {
    const value = String(resolveLiveEntityRecordId(row, sourceKey) || '').trim()
    const label = String(row?.[resolveWriteField(titleToken || {})] || '').trim() || value
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

function resolveLiveEntityRecordId(row, sourceKey) {
  if (!row || typeof row !== 'object') return ''
  return sourceKey === 'artifacts' ? row.artifact_id || row.id || '' : row.id || row.artifact_id || ''
}

async function ensureLiveOptionsLoaded() {
  const tokensToLoad = [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens), ...selectableTokens.value.map((token) => normalizeCreateDialogToken(token))]
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
  }
  for (const sourceKey of sourceKeys) {
    if (liveOptionRowsBySource.value[sourceKey]) continue
    try {
      const result = await bridge.value?.[sourceKey]?.list?.()
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: normalizeListResult(result) }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
    }
  }
}

function normalizeListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

function resolveSourceKeyFromTableName(tableName) {
  const normalized = String(tableName || '').trim().toLowerCase()
  if (!normalized) return ''
  const direct = LEVEL_1_FILE_REGISTRY.find((entry) =>
    [entry.key, entry.routeName, entry.entityName, entry.label].some((value) => String(value || '').trim().toLowerCase() === normalized),
  )
  return direct?.key || ''
}

function resolveExistingFieldForToken(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return aliases.map((alias) => fieldByName.value[alias]).find(Boolean) || null
}

function getTokenRawValue(token) {
  if (!token) return ''
  const aliases = getCanonicalTokenFieldNames(token)
  for (const alias of aliases) {
    const field = fieldByName.value[alias]
    if (field && field.value != null && String(field.value).trim() !== '') return field.value
    const recordValue = currentView.value?.record?.[alias]
    if (recordValue != null && String(recordValue).trim() !== '') return recordValue
  }
  return ''
}

function getTokenDisplayValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue.length ? rawValue.join(', ') : 'No value yet'
  const normalized = String(rawValue ?? '').trim()
  return normalized || 'No value yet'
}

function getTokenDialogValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return rawValue == null ? '' : String(rawValue)
}

function getFieldDisplayValue(fieldName) {
  const field = fieldByName.value[String(fieldName || '').trim()]
  if (field) return String(field.value ?? '').trim()
  const recordValue = currentView.value?.record?.[fieldName]
  return recordValue == null ? '' : String(recordValue).trim()
}

function normalizeIpcErrorMessage(ipcError) {
  const raw = String(ipcError?.message || ipcError || '').trim()
  const prefix = "Error invoking remote method '"
  if (!raw.startsWith(prefix)) return raw
  const separatorIndex = raw.indexOf("':")
  return separatorIndex > -1 ? raw.slice(separatorIndex + 2).trim() : raw
}

async function loadRecordView() {
  if (!hasBridge.value || !isRecordRoute.value) {
    currentView.value = null
    fields.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.view(tableNameParam.value, recordIdParam.value)
    currentView.value = result || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
    try {
      const verificationResult = await bridge.value?.verification?.list?.({
        tableName: tableNameParam.value,
        recordId: recordIdParam.value,
      })
      fieldVerificationStates.value = Object.fromEntries(
        (Array.isArray(verificationResult?.fields) ? verificationResult.fields : []).map((field) => [
          String(field?.field_name || '').trim(),
          String(field?.state || '').trim(),
        ]),
      )
    } catch {
      fieldVerificationStates.value = {}
    }
    inlineFieldValues.value = Object.fromEntries(
      [...createKeyFieldTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
        .map((token) => [token.key, getTokenDialogValue(token)]),
    )
  } catch (loadError) {
    error.value = normalizeIpcErrorMessage(loadError)
    currentView.value = null
    fields.value = []
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

function isInlineFieldEditable(token) {
  const field = resolveExistingFieldForToken(token)
  if (field) return Boolean(field.editable)
  return tokenSupportsRecordUpdate(token, activeRegistryEntry.value?.entityName || tableNameParam.value)
}

function inlineFieldHasValue(token) {
  const value = inlineRawValue(token)
  if (Array.isArray(value)) return value.length > 0
  return String(value ?? '').trim().length > 0
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
  return inlineFieldHasValue(token) ? 'verified' : ''
}

function showInlineFieldVerificationAction(token) {
  return inlineFieldHasValue(token)
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
    const result = await bridge.value?.databooks?.update?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes,
      actionLabel: 'record_shell_field_edit',
    })
    if (verificationFieldName) {
      await bridge.value?.verification?.upsert?.({
        tableName: String(field?.table_name || runtimeTableName.value).trim(),
        recordId: String(field?.record_id || recordIdParam.value).trim(),
        fieldName: verificationFieldName,
        state: 'verified',
        source: 'direct_user_input',
        actionLabel: 'record_shell_field_edit',
      })
      fieldVerificationStates.value = {
        ...fieldVerificationStates.value,
        [verificationFieldName]: 'verified',
      }
    }
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
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
    await bridge.value?.verification?.upsert?.({
      tableName: field.table_name,
      recordId: field.record_id,
      fieldName: field.field_name,
      state: String(nextState || '').trim(),
      source: 'record_shell_field_review',
      actionLabel: 'record_shell_field_verification',
    })
    fieldVerificationStates.value = {
      ...fieldVerificationStates.value,
      [String(field.field_name || '').trim()]: String(nextState || '').trim(),
    }
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
.contact-databook__hero {
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

.contact-databook__hero::before {
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

.contact-databook__hero-main,
.contact-databook__summary {
  position: relative;
  z-index: 1;
}

.contact-databook__hero-main {
  display: flex;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 420px;
}

.contact-databook__portrait {
  position: relative;
  flex: 0 0 clamp(280px, 26vw, 370px);
  width: clamp(280px, 26vw, 370px);
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: #d8d4ca;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px 0 0 24px;
  box-shadow: none;
}

.contact-databook__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(17, 17, 17, 0.18) 100%);
  pointer-events: none;
}

.contact-databook__portrait--initials-only {
  background: transparent;
}

.contact-databook__portrait--initials-only::after {
  display: none;
}

.contact-databook__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.contact-databook__portrait-placeholder-initials {
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

.contact-databook__hero-copy {
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

.contact-databook__summary-label {
  color: var(--ds-color-text-muted-alt);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-databook__name {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.6rem, 3.2vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.95;
}

.contact-databook__mini-dashboard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.contact-databook__mini-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 9px;
}

.contact-databook__mini-label {
  color: #6f6f6f;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.contact-databook__mini-value {
  margin-top: 3px;
  color: #111;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
  word-break: break-word;
}

.contact-databook__role {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-databook__role--location {
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

.contact-databook__hero-notes-panel {
  display: none;
}

.contact-databook__hero-tabs {
  display: inline-flex;
  gap: 6px;
  align-self: flex-start;
  padding: 4px;
  background: rgba(17, 17, 17, 0.05);
  border-radius: 999px;
}

.contact-databook__hero-tab {
  padding: 7px 12px;
  color: var(--ds-color-text-muted-alt);
  background: transparent;
  border: 0;
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
  cursor: pointer;
}

.contact-databook__hero-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(17, 17, 17, 0.08);
}

.contact-databook__hero-notes,
.contact-databook__hero-documents {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  margin-top: 10px;
  padding: 0;
  list-style: none;
}

.contact-databook__hero-note,
.contact-databook__hero-document {
  position: relative;
  padding-left: 18px;
}

.contact-databook__hero-note::before,
.contact-databook__hero-document::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 6px;
  height: 6px;
  content: '';
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.3);
}

.contact-databook__notes-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.contact-databook__notes-title {
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-content {
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-meta {
  flex: 0 0 auto;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
  white-space: nowrap;
}

.contact-databook__hero-panel-empty {
  margin-top: 10px;
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.contact-databook__summary {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-card);
  color: #fff;
}

.contact-databook__summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.contact-databook__summary-header--feed {
  justify-content: flex-start;
  gap: 20px;
}

.contact-databook__summary-feed-state {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__summary-feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.contact-databook__summary-feed-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.contact-databook__summary-feed-tab {
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

.contact-databook__summary-feed-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.94);
}

.contact-databook__summary-feed-entry {
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.contact-databook__summary-feed-entry-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.contact-databook__summary-feed-entry-source {
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.contact-databook__summary-feed-entry-time {
  color: rgba(255, 255, 255, 0.54);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  line-height: 1.3;
}

.contact-databook__summary-feed-entry-title {
  margin-top: 4px;
  color: #ffffff;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__summary-feed-entry-content {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.74);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
}
.contact-databook__nav {
  position: sticky;
  top: 76px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--ds-color-surface-base-88);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  backdrop-filter: blur(14px);
}

.contact-databook__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-databook__nav-item-icon {
  opacity: 0.8;
}

.contact-databook__nav-item:hover {
  color: #111;
  background: rgba(255, 85, 33, 0.08);
  border-color: rgba(255, 85, 33, 0.2);
  transform: translateY(-1px);
}

.contact-databook__nav-item--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.contact-databook__nav-item--kdb {
  border-color: rgba(17, 17, 17, 0.16);
}

.contact-databook__nav-item--system {
  border-color: rgba(17, 17, 17, 0.22);
}

.contact-databook__nav-item--kdb,
.contact-databook__nav-item--system {
  height: 26px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 8px;
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-label,
.contact-databook__nav-item--system .contact-databook__nav-item-label {
  font-size: calc(var(--text-sm---medium) * 0.72);
}

.contact-databook__nav-item--kdb .contact-databook__nav-item-icon {
  font-size: 12px !important;
}

.contact-databook__nav-item--push-right {
  margin-left: 0;
  align-self: center;
}

.contact-databook__nav-view-toggle {
  align-self: center;
  margin-left: 6px;
  order: 999;
}

.contact-databook__nav-view-toggle :deep(.q-btn-group) {
  gap: 0;
}

.contact-databook__nav-view-toggle :deep(.q-btn) {
  min-width: 20px;
  min-height: 20px;
  padding: 0 2px;
  border-radius: 5px;
}

.contact-databook__nav-view-toggle :deep(.q-icon) {
  font-size: 14px;
}

.contact-databook__nav-item:not(.contact-databook__nav-item--push-right) + .contact-databook__nav-item--push-right {
  margin-left: auto;
}
.record-shell__panel { display:grid; gap:12px; padding:16px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(255,255,255,.96); }
.record-shell__panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.record-shell__panel-title { color:#111; font-family:var(--font-title); font-size:.94rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__panel-meta { color:rgba(17,17,17,.54); font-size:.72rem; }
.record-shell__section-group-stack { display:grid; gap:14px; }
.record-shell__section-group { display:grid; gap:8px; }
.record-shell__section-group-toggle { display:inline-flex; align-items:center; justify-content:flex-start; gap:2px; width:max-content; padding:0; color:#111; background:transparent; border:0; text-align:left; cursor:pointer; }
.record-shell__section-group-toggle-icon { color:#111; }
.record-shell__section-group-title { color:#111; font-family:var(--font-title); font-size:.8rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__section-group-meta { margin-left:6px; color:rgba(17,17,17,.54); font-size:.7rem; }
.record-shell__field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
.record-shell__kdb-grid { display:grid; gap:14px; }
.record-shell__kdb-group { display:grid; gap:8px; }
.record-shell__kdb-group-toggle { display:inline-flex; align-items:center; justify-content:flex-start; gap:2px; width:max-content; padding:0; color:#111; background:transparent; border:0; text-align:left; cursor:pointer; }
.record-shell__kdb-group-toggle-icon { color:#111; }
.record-shell__kdb-group-title { color:rgba(17,17,17,.54); font-family:var(--font-title); font-size:.72rem; font-weight:var(--font-weight-black); line-height:.96; text-transform:uppercase; letter-spacing:.03em; }
.record-shell__kdb-group-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
.record-shell__field-card { padding:10px 12px; border:1px solid rgba(17,17,17,.08); border-radius:6px; background:rgba(17,17,17,.02); }
.record-shell__field-card--selected { border-color:rgba(38,71,255,.3); background:rgba(38,71,255,.05); }
.record-shell__field-label { color:#111; font-size:.8rem; font-weight:600; line-height:1.3; }
.record-shell__field-value { margin-top:4px; color:rgba(17,17,17,.58); font-size:.72rem; line-height:1.4; }
.record-shell__field-value-row { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; margin-top:6px; }
.record-shell__field-input { min-width:0; }
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
  .contact-databook__hero { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .contact-databook__hero-main { flex-direction: column; }
  .contact-databook__portrait {
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
