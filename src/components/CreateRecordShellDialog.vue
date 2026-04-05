<template>
  <q-dialog v-model="open">
    <q-card
      class="create-record-shell"
      :style="dialogStyle"
    >
      <q-card-section class="create-record-shell__header">
        <div class="create-record-shell__header-copy">
          <div class="create-record-shell__title">{{ dialogTitle }}</div>
          <div class="create-record-shell__intake-lane">
            <button
              type="button"
              class="create-record-shell__intake-toggle"
              @click="supportResourcesCollapsed = !supportResourcesCollapsed"
            >
              <span class="create-record-shell__intake-title">Resources</span>
              <q-icon
                :name="supportResourcesCollapsed ? 'expand_more' : 'expand_less'"
                class="create-record-shell__intake-toggle-icon"
              />
            </button>
            <div v-if="!supportResourcesCollapsed" class="create-record-shell__intake-body">
              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Artifacts</div>
                <div
                  class="create-record-shell__artifact-drop"
                  :class="{ 'create-record-shell__artifact-drop--active': artifactDragOver }"
                  @dragover.prevent="artifactDragOver = true"
                  @dragleave.prevent="artifactDragOver = false"
                  @drop.prevent="onArtifactDrop"
                >
                  <div class="create-record-shell__artifact-drop-copy">
                    <div class="create-record-shell__artifact-drop-title">Artifacts</div>
                  <div class="create-record-shell__artifact-drop-caption">
                    {{ artifactDragOver ? 'Release to stage files' : 'Drag files or a folder here' }}
                  </div>
                </div>

                <div v-if="stagedArtifacts.length" class="create-record-shell__artifact-drop-list">
                  <div class="create-record-shell__artifact-drop-list-head">
                    <q-checkbox
                      :model-value="allArtifactsSelected"
                      dense
                      size="xs"
                      checked-icon="check_box"
                      unchecked-icon="check_box_outline_blank"
                      class="create-record-shell__artifact-checkbox"
                      @update:model-value="toggleAllArtifacts"
                      :label="`${selectedArtifactCount} of ${stagedArtifacts.length} selected · Select all / none`"
                    />
                  </div>

                  <div v-if="availableArtifacts.length" class="create-record-shell__artifact-drop-items">
                    <label
                      v-for="artifact in availableArtifacts"
                      :key="artifact.id"
                      class="create-record-shell__artifact-drop-item"
                    >
                      <q-checkbox
                        :model-value="selectedArtifactIds.includes(artifact.id)"
                        dense
                        size="xs"
                        checked-icon="check_box"
                        unchecked-icon="check_box_outline_blank"
                        class="create-record-shell__artifact-checkbox"
                        @update:model-value="toggleArtifactSelection(artifact.id, $event)"
                      />
                      <div class="create-record-shell__artifact-drop-item-preview">
                        <q-icon
                          :name="artifactPreviewIcon(artifact)"
                          class="create-record-shell__artifact-drop-item-icon"
                        />
                      </div>
                      <span class="create-record-shell__artifact-drop-item-name">{{ artifact.name }}</span>
                      <span class="create-record-shell__artifact-drop-item-size">{{ formatArtifactSize(artifact.size) }}</span>
                    </label>
                  </div>

                  <div v-else class="create-record-shell__artifact-drop-empty">
                    All staged artifacts are in the processing lane.
                  </div>
                </div>

                <div class="create-record-shell__artifact-drop-footer">
                  <q-checkbox
                    v-model="autoProcessArtifacts"
                    dense
                    size="sm"
                    checked-icon="check_box"
                    unchecked-icon="check_box_outline_blank"
                    class="create-record-shell__artifact-checkbox"
                    label="Autmatically process files as I drop"
                  />
                </div>
              </div>
              </div>

              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Ingestion Companion</div>
                <div class="create-record-shell__intake-side">
                  <div class="create-record-shell__processing-panel">
                  <div class="create-record-shell__processing-panel-head">
                    <div class="create-record-shell__processing-panel-title">Resources</div>
                  </div>

                  <div class="create-record-shell__processing-sections">
                    <section class="create-record-shell__processing-box">
                      <div class="create-record-shell__processing-box-head">
                        <div class="create-record-shell__processing-box-title">Ingestion</div>
                        <div class="create-record-shell__processing-panel-meta">
                          {{ processingArtifacts.length }} loading
                        </div>
                      </div>

                      <div v-if="processingArtifacts.length" class="create-record-shell__processing-list">
                        <label
                          v-for="artifact in processingArtifacts"
                          :key="`processing:${artifact.id}`"
                          class="create-record-shell__processing-item"
                        >
                          <q-checkbox
                            :model-value="true"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleArtifactSelection(artifact.id, $event)"
                          />
                          <span class="create-record-shell__processing-item-name">{{ artifact.name }}</span>
                          <span class="create-record-shell__processing-item-status">
                            <q-spinner size="12px" color="dark" class="create-record-shell__processing-spinner" />
                            Loading
                          </span>
                        </label>
                      </div>

                      <div v-else-if="stagedArtifacts.length" class="create-record-shell__processing-ready">
                        Select artifacts on the left to move them into processing.
                      </div>

                      <div v-else class="create-record-shell__processing-empty">
                        Drop files on the left to stage them for this record.
                      </div>
                    </section>

                    <section class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <div class="create-record-shell__processing-box-head">
                        <div class="create-record-shell__processing-box-title">URLs</div>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedUrlEntryIds.length"
                          @click="removeCompanionEntries('url')"
                        >
                          Delete
                        </button>
                      </div>
                      <input
                        v-model="companionUrl"
                        type="text"
                        class="create-record-shell__processing-placeholder-box create-record-shell__processing-placeholder-box--input"
                        @input="markDialogChanged"
                        @keydown.enter.stop.prevent="addCompanionEntry('url')"
                      />
                      <div v-if="urlEntries.length" class="create-record-shell__processing-entry-list">
                        <label
                          v-for="entry in urlEntries"
                          :key="entry.id"
                          class="create-record-shell__processing-entry-row"
                          :class="{ 'create-record-shell__processing-entry-row--expanded': expandedEntryIds.includes(entry.id) }"
                        >
                          <q-checkbox
                            :model-value="selectedUrlEntryIds.includes(entry.id)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleCompanionEntrySelection('url', entry.id, $event)"
                          />
                          <button
                            type="button"
                            class="create-record-shell__processing-entry-toggle"
                            @click="toggleCompanionEntryExpanded(entry.id)"
                          >
                            {{ entry.value }}
                          </button>
                        </label>
                      </div>
                    </section>

                    <section class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <div class="create-record-shell__processing-box-head">
                        <div class="create-record-shell__processing-box-title">Blurbs</div>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedBlurbEntryIds.length"
                          @click="removeCompanionEntries('blurb')"
                        >
                          Delete
                        </button>
                      </div>
                      <input
                        v-model="companionBlurb"
                        type="text"
                        class="create-record-shell__processing-placeholder-box create-record-shell__processing-placeholder-box--input"
                        @input="markDialogChanged"
                        @keydown.enter.stop.prevent="addCompanionEntry('blurb')"
                      />
                      <div v-if="blurbEntries.length" class="create-record-shell__processing-entry-list">
                        <label
                          v-for="entry in blurbEntries"
                          :key="entry.id"
                          class="create-record-shell__processing-entry-row"
                          :class="{ 'create-record-shell__processing-entry-row--expanded': expandedEntryIds.includes(entry.id) }"
                        >
                          <q-checkbox
                            :model-value="selectedBlurbEntryIds.includes(entry.id)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleCompanionEntrySelection('blurb', entry.id, $event)"
                          />
                          <button
                            type="button"
                            class="create-record-shell__processing-entry-toggle"
                            @click="toggleCompanionEntryExpanded(entry.id)"
                          >
                            {{ entry.value }}
                          </button>
                        </label>
                      </div>
                    </section>

                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div class="create-record-shell__header-actions"></div>
      </q-card-section>

      <q-card-section class="create-record-shell__body">
        <div class="create-record-shell__record-data">
          <button
            type="button"
            class="create-record-shell__record-data-toggle"
            @click="recordDataCollapsed = !recordDataCollapsed"
          >
            <span class="create-record-shell__record-data-title">Record Data</span>
            <q-icon
              :name="recordDataCollapsed ? 'expand_more' : 'expand_less'"
              class="create-record-shell__record-data-toggle-icon"
            />
          </button>

          <template v-if="!recordDataCollapsed">
            <div class="create-record-shell__tabs">
              <div class="create-record-shell__tabs-left">
                <button
                  v-for="section in leftPanelSections"
                  :key="section.key"
                  type="button"
                  class="create-record-shell__tab"
                  :class="{ 'create-record-shell__tab--active': section.key === activeSectionKey }"
                  @click="activeSectionKey = section.key"
                >
                  {{ section.label }}
                </button>
              </div>

              <div class="create-record-shell__tabs-right">
                <button
                  v-for="section in rightSections"
                  :key="section.key"
                  type="button"
                  class="create-record-shell__tab"
                  :class="{ 'create-record-shell__tab--active': section.key === activeSectionKey }"
                  @click="activeSectionKey = section.key"
                >
                  {{ section.label }}
                </button>
              </div>
            </div>

            <div class="create-record-shell__panel">
              <div class="create-record-shell__panel-head">
                <div class="create-record-shell__panel-meta">{{ activeFields.length }} fields</div>
              </div>

              <div
                v-if="activeFields.length"
                class="create-record-shell__fields"
                :style="{ '--create-record-shell-label-width': activeFieldLabelWidth }"
              >
                <div
                  class="create-record-shell__fields-grid create-record-shell__fields-grid--left"
                >
                  <div
                    v-for="fieldEntry in leftFieldEntries"
                    :key="fieldEntry.token.key"
                    class="create-record-shell__field"
                    :class="{
                      'create-record-shell__field--wide': isWideField(fieldEntry.token),
                      'create-record-shell__field--verification-needed': shouldHighlightFieldVerification(fieldEntry.token),
                    }"
                  >
                    <div class="create-record-shell__field-label-row">
                      <div class="create-record-shell__field-label-wrap">
                        <div class="create-record-shell__field-label">
                          {{ fieldEntry.token.label }}
                          <q-tooltip anchor="top middle" self="bottom middle">
                            {{ formatFieldType(fieldEntry.token.tokenType) }}
                          </q-tooltip>
                        </div>
                      </div>
                      <q-btn
                        v-if="fieldHasParentRecordLink(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="link"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Open source record for ${fieldEntry.token.label}`"
                        @click="openFieldParentRecord(fieldEntry.token)"
                      />
                    </div>

                    <div class="create-record-shell__field-value-row">
                      <q-select
                        v-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        dense
                        outlined
                        use-chips
                        multiple
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        use-chips
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="stringValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                        :autogrow="isSummaryField(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-btn
                        v-if="showFieldVerificationAction(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        :disable="loading"
                        class="create-record-shell__field-action"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        :icon="fieldVerificationIcon(fieldEntry.token)"
                        :icon-class="fieldVerificationIconClass(fieldEntry.token)"
                        :aria-label="`Change verification state for ${fieldEntry.token.label}`"
                      >
                        <q-menu
                          :anchor="verificationMenuAnchor(fieldEntry.column)"
                          :self="verificationMenuSelf(fieldEntry.column)"
                        >
                          <q-list dense class="create-record-shell__verification-menu">
                            <q-item
                              v-for="option in fieldVerificationActionOptions"
                              :key="option.value"
                              clickable
                              v-close-popup
                              class="create-record-shell__verification-menu-item"
                              @click="updateFieldVerificationState(fieldEntry.token, option.value)"
                            >
                              <q-item-section avatar>
                                <q-icon :name="option.icon" :class="option.iconClass" size="14px" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="create-record-shell__verification-menu-label">
                                  {{ option.label }}
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </div>
                  </div>
                </div>

                <div
                  class="create-record-shell__fields-grid create-record-shell__fields-grid--right"
                >
                  <div
                    v-for="fieldEntry in rightFieldEntries"
                    :key="fieldEntry.token.key"
                    class="create-record-shell__field"
                    :class="{
                      'create-record-shell__field--wide': isWideField(fieldEntry.token),
                      'create-record-shell__field--verification-needed': shouldHighlightFieldVerification(fieldEntry.token),
                    }"
                  >
                    <div class="create-record-shell__field-label-row">
                      <div class="create-record-shell__field-label-wrap">
                        <div class="create-record-shell__field-label">
                          {{ fieldEntry.token.label }}
                          <q-tooltip anchor="top middle" self="bottom middle">
                            {{ formatFieldType(fieldEntry.token.tokenType) }}
                          </q-tooltip>
                        </div>
                      </div>
                      <q-btn
                        v-if="fieldHasParentRecordLink(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="link"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Open source record for ${fieldEntry.token.label}`"
                        @click="openFieldParentRecord(fieldEntry.token)"
                      />
                    </div>

                    <div class="create-record-shell__field-value-row">
                      <q-select
                        v-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        dense
                        outlined
                        use-chips
                        multiple
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        use-chips
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="stringValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                        :autogrow="isSummaryField(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-btn
                        v-if="showFieldVerificationAction(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        :disable="loading"
                        class="create-record-shell__field-action"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        :icon="fieldVerificationIcon(fieldEntry.token)"
                        :icon-class="fieldVerificationIconClass(fieldEntry.token)"
                        :aria-label="`Change verification state for ${fieldEntry.token.label}`"
                      >
                        <q-menu
                          :anchor="verificationMenuAnchor(fieldEntry.column)"
                          :self="verificationMenuSelf(fieldEntry.column)"
                        >
                          <q-list dense class="create-record-shell__verification-menu">
                            <q-item
                              v-for="option in fieldVerificationActionOptions"
                              :key="option.value"
                              clickable
                              v-close-popup
                              class="create-record-shell__verification-menu-item"
                              @click="updateFieldVerificationState(fieldEntry.token, option.value)"
                            >
                              <q-item-section avatar>
                                <q-icon :name="option.icon" :class="option.iconClass" size="14px" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="create-record-shell__verification-menu-label">
                                  {{ option.label }}
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="create-record-shell__empty">
                No canonical fields are mapped to this section yet.
              </div>
            </div>
          </template>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="create-record-shell__footer">
        <div class="create-record-shell__footer-legend">
          <div class="create-record-shell__footer-status create-record-shell__footer-status--default">
            Pre-Selected
          </div>
          <div class="create-record-shell__footer-status create-record-shell__footer-status--suggested">
            Suggested
          </div>
        </div>
        <q-btn
          flat
          no-caps
          label="Cancel"
          :disable="loading"
          class="create-record-shell__footer-button"
          @click="open = false"
        />
        <q-btn
          no-caps
          unelevated
          color="dark"
          :label="submitLabel"
          :loading="loading"
          :disable="submitDisabled"
          class="create-record-shell__footer-button"
          @click="submit"
        />
      </q-card-actions>

      <button
        type="button"
        class="create-record-shell__resize-handle"
        aria-label="Resize dialog"
        @mousedown.prevent="startResize"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildRecordViewLocation } from 'src/utils/recordViewNavigation'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  sourceLabel: { type: String, default: 'Records' },
  singularLabel: { type: String, default: 'record' },
  keyFieldTokens: { type: Array, default: () => [] },
  leftSections: { type: Array, default: () => [] },
  rightSections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
  initialValues: { type: Object, default: () => ({}) },
  initialFieldMeta: { type: Object, default: () => ({}) },
  initialSectionKey: { type: String, default: 'key-fields' },
  initialArtifacts: { type: Array, default: () => [] },
  artifactContext: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'submit', 'change', 'request-close'])
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const router = useRouter()
const route = useRoute()

const hasUserChanges = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) {
      emit('request-close', buildDialogSnapshot())
    }
    emit('update:modelValue', value)
  },
})

const activeSectionKey = ref('key-fields')
const formValues = ref({})
const artifactDragOver = ref(false)
const stagedArtifacts = ref([])
const selectedArtifactIds = ref([])
const autoProcessArtifacts = ref(false)
const companionUrl = ref('')
const companionBlurb = ref('')
const urlEntries = ref([])
const blurbEntries = ref([])
const selectedUrlEntryIds = ref([])
const selectedBlurbEntryIds = ref([])
const expandedEntryIds = ref([])
const supportResourcesCollapsed = ref(false)
const recordDataCollapsed = ref(false)
const dialogWidth = ref(760)
const dialogHeight = ref(780)
const fieldVerificationStates = ref({})
let removeResizeListeners = null

const allSections = computed(() => [
  {
    key: 'key-fields',
    label: 'Key Fields',
    tokens: props.keyFieldTokens,
  },
  ...props.leftSections,
  ...props.rightSections,
])

const leftPanelSections = computed(() => [
  {
    key: 'key-fields',
    label: 'Key Fields',
    tokens: props.keyFieldTokens,
  },
  ...props.leftSections,
])

const dialogTitle = computed(() => {
  const normalizedLabel = String(props.singularLabel || 'record').trim()
  const modeLabel = props.mode === 'edit' ? 'Editing' : 'Creating'
  return `${modeLabel} ${normalizedLabel}`
})

const artifactContextNote = computed(() => {
  const entityLabel = String(props.artifactContext?.entityLabel || '').trim()
  if (!entityLabel) return null

  const recordLabel = String(props.artifactContext?.recordLabel || '').trim()
  return {
    detail: recordLabel
      ? `Artifacts added here will carry ${entityLabel} -> ${recordLabel} as the first verification-ready context.`
      : `Artifacts added here will carry ${entityLabel} as the first verification-ready context.`,
  }
})

const submitLabel = computed(() => 'Save')
const fieldVerificationActionOptions = [
  { label: 'Verify field', value: 'verified', icon: 'check_circle', iconClass: 'create-record-shell__verification-icon--verified' },
  { label: 'Pre-Selected', value: 'default_preselected_unverified', icon: 'auto_awesome', iconClass: 'create-record-shell__verification-icon--default' },
  { label: 'Suggested', value: 'suggested_unverified', icon: 'lightbulb', iconClass: 'create-record-shell__verification-icon--suggested' },
  { label: 'Reject field', value: 'rejected', icon: 'cancel', iconClass: 'create-record-shell__verification-icon--rejected' },
]
const selectedArtifactCount = computed(() => selectedArtifactIds.value.length)
const allArtifactsSelected = computed(() =>
  stagedArtifacts.value.length > 0 && selectedArtifactIds.value.length === stagedArtifacts.value.length,
)
const availableArtifacts = computed(() =>
  stagedArtifacts.value.filter((artifact) => !selectedArtifactIds.value.includes(artifact.id)),
)
const processingArtifacts = computed(() =>
  stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
)
const activeFieldLabelWidth = computed(() => '10ch')

const activeSection = computed(
  () => allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null,
)

const activeFields = computed(() => activeSection.value?.tokens || [])
const activeFieldEntries = computed(() => {
  const nameEntries = []
  const summaryEntries = []
  const remainingEntries = []

  activeFields.value.forEach((token, tokenIndex) => {
    const entry = { token, tokenIndex, column: 'left' }
    if (isNameField(token)) {
      nameEntries.push({ ...entry, column: 'left' })
      return
    }
    if (isSummaryField(token)) {
      summaryEntries.push({ ...entry, column: 'right' })
      return
    }
    remainingEntries.push(entry)
  })

  let nextColumn = 'left'
  const alternatingEntries = remainingEntries.map((entry) => {
    const assigned = { ...entry, column: nextColumn }
    nextColumn = nextColumn === 'left' ? 'right' : 'left'
    return assigned
  })

  return [...nameEntries, ...summaryEntries, ...alternatingEntries]
})
const leftFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'left' && isNameField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'left' && !isNameField(entry.token))
  return [...pinned, ...remainder]
})
const rightFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'right' && isSummaryField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'right' && !isSummaryField(entry.token))
  return [...pinned, ...remainder]
})
const dialogStyle = computed(() => ({
  width: `${dialogWidth.value}px`,
  height: `${dialogHeight.value}px`,
}))

function initializeDialogState() {
  hasUserChanges.value = false
  activeSectionKey.value = String(props.initialSectionKey || '').trim() || 'key-fields'
  artifactDragOver.value = false
  stagedArtifacts.value = normalizeInitialArtifacts(props.initialArtifacts)
  selectedArtifactIds.value = []
  autoProcessArtifacts.value = false
  companionUrl.value = ''
  companionBlurb.value = ''
  urlEntries.value = []
  blurbEntries.value = []
  selectedUrlEntryIds.value = []
  selectedBlurbEntryIds.value = []
  expandedEntryIds.value = []
  dialogWidth.value = 760
  dialogHeight.value = 780
  formValues.value = Object.fromEntries(
    allSections.value
      .flatMap((section) => section.tokens || [])
      .map((token) => {
        const initialValue = props.initialValues?.[token.key]
        if (token.tokenType === 'select_multi') {
          return [token.key, normalizeMultiValue(initialValue)]
        }
        return [token.key, initialValue == null ? '' : initialValue]
      }),
  )
  fieldVerificationStates.value = Object.fromEntries(
    allSections.value
      .flatMap((section) => section.tokens || [])
      .map((token) => [
        token.key,
        String(props.initialFieldMeta?.[token.key]?.verificationState || '').trim(),
      ]),
  )
}

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    initializeDialogState()
  },
  { immediate: true },
)

function updateField(tokenKey, value) {
  formValues.value = {
    ...formValues.value,
    [tokenKey]: value,
  }
  fieldVerificationStates.value = {
    ...fieldVerificationStates.value,
    [tokenKey]: 'verified',
  }
  hasUserChanges.value = true
  emit('change', buildDialogSnapshot())
}

function submit() {
  emit('submit', {
    ...buildDialogSnapshot(),
  })
}

function buildDialogSnapshot() {
  const contextDefaults = artifactContextNote.value
    ? stagedArtifacts.value
      .filter((artifact) => selectedArtifactIds.value.includes(artifact.id))
      .map((artifact) => ({
        artifactId: artifact.artifactId || artifact.id,
        state: 'default_preselected_unverified',
        sourceEntity: String(props.artifactContext?.entityName || '').trim(),
        sourceRecordId: String(props.artifactContext?.recordId || '').trim(),
        sourceLabel: String(props.artifactContext?.entityLabel || '').trim(),
        sourceRecordLabel: String(props.artifactContext?.recordLabel || '').trim(),
      }))
    : []

  return {
    values: { ...formValues.value },
    verification: {
      changes: buildVerificationChanges(),
    },
    artifacts: {
      stagedFiles: stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
      processedFiles: stagedArtifacts.value
        .filter((artifact) => selectedArtifactIds.value.includes(artifact.id))
        .map((artifact) => ({
          artifactId: artifact.artifactId || artifact.id,
          processedArtifactId: artifact.processedArtifactId || '',
          name: artifact.name,
        })),
      autoProcess: autoProcessArtifacts.value,
      contextDefaults,
    },
    companion: {
      urls: urlEntries.value.map((entry) => entry.value),
      guidance: blurbEntries.value.map((entry) => entry.value),
    },
    hasUserChanges: hasUserChanges.value,
  }
}

function markDialogChanged() {
  hasUserChanges.value = true
  emit('change', buildDialogSnapshot())
}

function stringValue(value) {
  return typeof value === 'string' ? value : String(value || '')
}

function selectSingleValue(value) {
  return value == null ? '' : value
}

function normalizeMultiValue(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function inputTypeForToken(tokenType) {
  if (tokenType === 'email') return 'email'
  if (tokenType === 'phone') return 'tel'
  if (tokenType === 'url') return 'url'
  if (tokenType === 'date') return 'date'
  if (tokenType === 'datetime') return 'datetime-local'
  return 'text'
}

function formatFieldType(tokenType) {
  const normalized = String(tokenType || 'text').trim()
  if (!normalized) return 'Field'
  return normalized.replace(/_/g, ' ')
}

function isWideField(token) {
  return isSummaryField(token)
}

function isNameField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'name'
}

function isSummaryField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'summary'
}

function getFieldMeta(token) {
  return props.initialFieldMeta?.[token?.key] || null
}

function fieldVerificationState(token) {
  return String(fieldVerificationStates.value?.[token?.key] || '').trim()
}

function resolvedFieldVerificationState(token) {
  const explicitState = fieldVerificationState(token)
  if (explicitState) return explicitState
  const metaState = String(getFieldMeta(token)?.verificationState || '').trim()
  if (metaState) return metaState
  if (!fieldHasValue(token)) return ''
  return 'suggested_unverified'
}

function fieldHasValue(token) {
  const value = formValues.value?.[token?.key]
  if (Array.isArray(value)) return value.length > 0
  return String(value ?? '').trim().length > 0
}

function shouldHighlightFieldVerification(token) {
  if (!fieldHasValue(token)) return false
  const state = resolvedFieldVerificationState(token)
  return state !== 'verified'
}

function fieldVerificationClass(token) {
  if (!shouldHighlightFieldVerification(token)) return ''
  const state = resolvedFieldVerificationState(token)
  if (state === 'default_preselected_unverified') {
    return 'create-record-shell__input--verification-default'
  }
  return 'create-record-shell__input--verification-suggested'
}

function showFieldVerificationAction(token) {
  return fieldHasValue(token)
}

function fieldVerificationIcon(token) {
  const state = resolvedFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.icon || 'help'
}

function fieldVerificationIconClass(token) {
  const state = resolvedFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.iconClass || ''
}

function verificationMenuAnchor(column) {
  return column === 'right' ? 'bottom left' : 'bottom right'
}

function verificationMenuSelf(column) {
  return column === 'right' ? 'top right' : 'top left'
}

function updateFieldVerificationState(token, nextState) {
  fieldVerificationStates.value = {
    ...fieldVerificationStates.value,
    [token.key]: String(nextState || '').trim(),
  }
  hasUserChanges.value = true
  emit('change', buildDialogSnapshot())
}

function buildVerificationChanges() {
  return allSections.value
    .flatMap((section) => section.tokens || [])
    .map((token) => {
      const meta = getFieldMeta(token)
      const currentValue = formValues.value?.[token.key]
      const initialValue = props.initialValues?.[token.key]
      const valueChanged = JSON.stringify(currentValue ?? '') !== JSON.stringify(initialValue ?? '')
      const nextState = valueChanged ? 'verified' : resolvedFieldVerificationState(token)
      const initialState = String(meta?.verificationState || '').trim()
      if (!nextState || nextState === initialState) return null
      return {
        tokenKey: token.key,
        fieldName: String(meta?.fieldName || '').trim(),
        tableName: String(meta?.tableName || '').trim(),
        recordId: String(meta?.recordId || '').trim(),
        source: valueChanged
          ? 'direct_user_input'
          : String(meta?.verificationSource || 'dialog_field_review').trim(),
        state: nextState,
      }
    })
    .filter(Boolean)
}

function isFieldLocked(token) {
  return Boolean(getFieldMeta(token)?.locked)
}

function fieldHasParentRecordLink(token) {
  const meta = getFieldMeta(token)
  return Boolean(meta?.locked && meta?.tableName && meta?.recordId)
}

function openFieldParentRecord(token) {
  const meta = getFieldMeta(token)
  if (!meta?.tableName || !meta?.recordId) return
  const location = buildRecordViewLocation({
    tableName: meta.tableName,
    recordId: meta.recordId,
    returnTo: route.fullPath,
  })
  if (!location) return
  router.push(location)
}

async function onArtifactDrop(event) {
  artifactDragOver.value = false
  const files = Array.from(event?.dataTransfer?.files || [])
  if (!files.length) return

  const nextArtifacts = await Promise.all(
    files
    .map((file) => normalizeArtifactFile(file))
    .filter((file) => file.path || file.name)
    .map((artifact) => persistDroppedArtifact(artifact)),
  )

  if (!nextArtifacts.length) return

  const existingByPath = new Map(
    stagedArtifacts.value.map((artifact) => [artifact.path || artifact.name, artifact]),
  )

  nextArtifacts.forEach((artifact) => {
    const key = artifact.path || artifact.name
    existingByPath.set(key, artifact)
  })

  stagedArtifacts.value = Array.from(existingByPath.values())
  markDialogChanged()
}

function normalizeArtifactFile(file) {
  const name = String(file?.name || '').trim()
  const path = String(file?.path || file?.webkitRelativePath || '').trim()
  const size = Number(file?.size || 0)
  return {
    id: path || `${name}:${size}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    name,
    path: path || null,
    size,
    artifactId: '',
    processedArtifactId: '',
  }
}

function normalizeInitialArtifacts(artifacts = []) {
  return (Array.isArray(artifacts) ? artifacts : [])
    .map((artifact, index) => {
      const name = String(artifact?.name || artifact?.label || artifact?.title || artifact || '').trim()
      const path = String(artifact?.path || '').trim()
      const size = Number(artifact?.size || 0)
      if (!name && !path) return null
      return {
        id: String(artifact?.id || artifact?.artifactId || path || `${name}:${index}`).trim(),
        name: name || path,
        path: path || null,
        size,
        artifactId: String(artifact?.artifactId || artifact?.id || '').trim(),
        processedArtifactId: String(artifact?.processedArtifactId || '').trim(),
      }
    })
    .filter(Boolean)
}

async function toggleArtifactSelection(artifactId, nextValue) {
  if (nextValue) {
    if (!selectedArtifactIds.value.includes(artifactId)) {
      selectedArtifactIds.value = [...selectedArtifactIds.value, artifactId]
    }
    await ensureProcessedArtifactForSelection(artifactId)
    markDialogChanged()
    return
  }

  selectedArtifactIds.value = selectedArtifactIds.value.filter((id) => id !== artifactId)
  await removeProcessedArtifactForSelection(artifactId)
  markDialogChanged()
}

async function toggleAllArtifacts(nextValue) {
  if (nextValue) {
    selectedArtifactIds.value = stagedArtifacts.value.map((artifact) => artifact.id)
    await Promise.all(selectedArtifactIds.value.map((artifactId) => ensureProcessedArtifactForSelection(artifactId)))
    markDialogChanged()
    return
  }

  await Promise.all(selectedArtifactIds.value.map((artifactId) => removeProcessedArtifactForSelection(artifactId)))
  selectedArtifactIds.value = []
  markDialogChanged()
}

function formatArtifactSize(size) {
  const normalized = Number(size || 0)
  if (!Number.isFinite(normalized) || normalized <= 0) return '--'
  if (normalized < 1024) return `${normalized} B`
  if (normalized < 1024 * 1024) return `${(normalized / 1024).toFixed(1)} KB`
  return `${(normalized / (1024 * 1024)).toFixed(1)} MB`
}

function artifactPreviewIcon(artifact) {
  const name = String(artifact?.name || '').trim().toLowerCase()
  if (name.endsWith('.pdf')) return 'picture_as_pdf'
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'table_chart'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description'
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'slideshow'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp')) return 'image'
  return 'insert_drive_file'
}

async function persistDroppedArtifact(artifact) {
  if (!artifact?.path || !bridge.value?.artifacts?.create) return artifact
  try {
    const result = await bridge.value.artifacts.create({
      path: artifact.path,
      name: artifact.name,
      size: artifact.size,
      title: artifact.name,
    })
    const persistedId = String(result?.artifact_id || result?.id || '').trim()
    if (!persistedId) return artifact
    return {
      ...artifact,
      id: persistedId,
      artifactId: persistedId,
    }
  } catch {
    return artifact
  }
}

async function ensureProcessedArtifactForSelection(artifactId) {
  const artifact = stagedArtifacts.value.find((entry) => entry.id === artifactId)
  if (!artifact || artifact.processedArtifactId || !bridge.value?.['artifacts-processed']?.create) return

  try {
    const result = await bridge.value['artifacts-processed'].create({
      Processed_Artifact_Name: artifact.name,
      Processed_Artifact_Summary: '',
      Original_Artifact_Id: artifact.artifactId || artifact.id,
      Working: 1,
    })
    const processedArtifactId = String(result?.id || '').trim()
    if (!processedArtifactId) return
    stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
      entry.id === artifactId
        ? { ...entry, processedArtifactId }
        : entry,
    )
  } catch {
    // Keep the shell usable even if the processed-artifact bridge is not ready.
  }
}

async function removeProcessedArtifactForSelection(artifactId) {
  const artifact = stagedArtifacts.value.find((entry) => entry.id === artifactId)
  const processedArtifactId = String(artifact?.processedArtifactId || '').trim()
  if (!processedArtifactId) return

  try {
    await bridge.value?.['artifacts-processed']?.delete?.(processedArtifactId)
  } catch {
    // Leave the local shell state consistent even if delete fails.
  }

  stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
    entry.id === artifactId
      ? { ...entry, processedArtifactId: '' }
      : entry,
  )
}

function addCompanionEntry(kind) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const sourceRef = normalizedKind === 'url' ? companionUrl : companionBlurb
  const nextValue = String(sourceRef.value || '').trim()
  if (!nextValue) return

  const nextEntry = {
    id: `${normalizedKind}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    value: nextValue,
  }

  if (normalizedKind === 'url') {
    urlEntries.value = [...urlEntries.value, nextEntry]
    companionUrl.value = ''
  } else {
    blurbEntries.value = [...blurbEntries.value, nextEntry]
    companionBlurb.value = ''
  }

  markDialogChanged()
}

function toggleCompanionEntrySelection(kind, entryId, nextValue) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const targetRef = normalizedKind === 'url' ? selectedUrlEntryIds : selectedBlurbEntryIds
  const normalizedId = String(entryId || '').trim()
  if (!normalizedId) return

  if (nextValue) {
    if (!targetRef.value.includes(normalizedId)) {
      targetRef.value = [...targetRef.value, normalizedId]
    }
    return
  }

  targetRef.value = targetRef.value.filter((id) => id !== normalizedId)
}

function removeCompanionEntries(kind) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  if (normalizedKind === 'url') {
    const selected = new Set(selectedUrlEntryIds.value)
    urlEntries.value = urlEntries.value.filter((entry) => !selected.has(entry.id))
    selectedUrlEntryIds.value = []
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => !selected.has(id))
  } else {
    const selected = new Set(selectedBlurbEntryIds.value)
    blurbEntries.value = blurbEntries.value.filter((entry) => !selected.has(entry.id))
    selectedBlurbEntryIds.value = []
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => !selected.has(id))
  }
  markDialogChanged()
}

function toggleCompanionEntryExpanded(entryId) {
  const normalizedId = String(entryId || '').trim()
  if (!normalizedId) return
  if (expandedEntryIds.value.includes(normalizedId)) {
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => id !== normalizedId)
    return
  }
  expandedEntryIds.value = [...expandedEntryIds.value, normalizedId]
}

function startResize(event) {
  stopResize()
  const startX = Number(event?.clientX || 0)
  const startY = Number(event?.clientY || 0)
  const initialWidth = dialogWidth.value
  const initialHeight = dialogHeight.value

  const handlePointerMove = (moveEvent) => {
    const nextWidth = Math.max(560, Math.min(window.innerWidth - 48, initialWidth + Number(moveEvent?.clientX || 0) - startX))
    const nextHeight = Math.max(520, Math.min(window.innerHeight - 48, initialHeight + Number(moveEvent?.clientY || 0) - startY))
    dialogWidth.value = nextWidth
    dialogHeight.value = nextHeight
  }

  const handlePointerUp = () => {
    stopResize()
  }

  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', handlePointerUp)

  removeResizeListeners = () => {
    window.removeEventListener('mousemove', handlePointerMove)
    window.removeEventListener('mouseup', handlePointerUp)
  }
}

function stopResize() {
  if (typeof removeResizeListeners === 'function') {
    removeResizeListeners()
    removeResizeListeners = null
  }
}

onBeforeUnmount(() => {
  stopResize()
})
</script>

<style scoped>
.create-record-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(52vw, 760px);
  height: min(78vh, 780px);
  min-width: min(52vw, 640px);
  min-height: min(78vh, 690px);
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 246, 244, 0.98) 100%);
  border-radius: 18px;
  overflow: hidden;
}

.create-record-shell__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.create-record-shell__header-copy {
  flex: 1 1 auto;
  min-height: 1px;
  min-width: 0;
}

.create-record-shell__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1.46rem;
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  margin-bottom: 12px;
}

.create-record-shell__header-actions {
  display: none;
}

.create-record-shell__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 18px 28px 28px;
}

.create-record-shell__record-data {
  display: grid;
  gap: 12px;
  min-height: 0;
}

.create-record-shell__record-data-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.create-record-shell__record-data-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__record-data-toggle-icon {
  color: #111111;
  font-size: 1rem;
  flex: 0 0 auto;
}

.create-record-shell__intake-lane {
  display: grid;
  gap: 12px;
  width: 100%;
}

.create-record-shell__intake-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.create-record-shell__intake-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__intake-toggle-icon {
  color: #111111;
  font-size: 1rem;
  flex: 0 0 auto;
}

.create-record-shell__intake-body {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: stretch;
}

.create-record-shell__intake-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
}

.create-record-shell__intake-column-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__artifact-drop {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 130px;
  padding: 14px 16px 12px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 10px;
}

.create-record-shell__artifact-context-note {
  display: block;
  margin-bottom: 10px;
  color: rgba(62, 46, 4, 0.74);
  font-size: 0.73rem;
  line-height: 1.35;
}

.create-record-shell__artifact-drop--active {
  background: rgba(238, 241, 255, 0.98);
  border-color: rgba(38, 71, 255, 0.6);
}

.create-record-shell__intake-side {
  display: grid;
  min-height: 130px;
}

.create-record-shell__artifact-drop-copy {
  display: grid;
  gap: 4px;
}

.create-record-shell__artifact-drop-title {
  display: none;
}

.create-record-shell__artifact-drop-caption {
  color: rgba(17, 17, 17, 0.62);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__artifact-drop-list {
  display: grid;
  align-content: start;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
}

.create-record-shell__artifact-drop-list-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.create-record-shell__artifact-drop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  align-content: start;
  gap: 10px;
  max-height: 136px;
  overflow: auto;
  padding-right: 2px;
}

.create-record-shell__artifact-drop-empty {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.74rem;
  line-height: 1.3;
}

.create-record-shell__artifact-drop-item {
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 5px;
  padding: 8px 8px 6px;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
}

.create-record-shell__artifact-drop-item .create-record-shell__artifact-checkbox {
  position: absolute;
  top: -7px;
  left: -7px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 999px;
}

.create-record-shell__artifact-drop-item-preview {
  display: grid;
  place-items: center;
  width: 58px;
  height: 68px;
  background: rgba(248, 248, 246, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 6px;
}

.create-record-shell__artifact-drop-item-icon {
  color: #111111;
  font-size: 2rem;
}

.create-record-shell__artifact-drop-item-name {
  width: 100%;
  color: #111111;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__artifact-drop-item-size {
  color: rgba(17, 17, 17, 0.55);
  font-size: 0.68rem;
  line-height: 1.2;
}

.create-record-shell__artifact-drop-footer {
  margin-top: auto;
  padding-top: 14px;
}

.create-record-shell__artifact-checkbox {
  margin: 0;
}

.create-record-shell__artifact-drop-list-head .create-record-shell__artifact-checkbox :deep(.q-checkbox__label) {
  color: rgba(17, 17, 17, 0.68);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__label) {
  color: rgba(17, 17, 17, 0.5);
  font-size: 0.64rem;
  font-weight: 500;
  line-height: 1.15;
}

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__inner) {
  font-size: 0.9rem;
}

.create-record-shell__processing-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  padding: 14px 16px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 10px;
}

.create-record-shell__processing-panel-head {
  display: none;
}

.create-record-shell__processing-panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__processing-sections {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: 10px;
  min-height: 0;
}

.create-record-shell__processing-box {
  display: grid;
  gap: 8px;
  min-height: 0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 4px;
}

.create-record-shell__processing-box--compact {
  align-content: start;
  gap: 4px;
  padding: 4px 5px;
  border-radius: 2px;
}

.create-record-shell__processing-box-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.create-record-shell__processing-box--compact .create-record-shell__processing-box-head {
  gap: 6px;
}

.create-record-shell__processing-box-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__processing-panel-meta {
  color: rgba(17, 17, 17, 0.52);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__processing-empty {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__processing-ready {
  color: rgba(17, 17, 17, 0.66);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__processing-list {
  display: grid;
  align-content: start;
  gap: 4px;
  min-height: 0;
  overflow: auto;
}

.create-record-shell__processing-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
}

.create-record-shell__processing-item-name {
  min-width: 0;
  color: #111111;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__processing-item-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(17, 17, 17, 0.68);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__processing-spinner {
  flex: 0 0 auto;
}

.create-record-shell__processing-delete {
  padding: 0;
  color: rgba(17, 17, 17, 0.64);
  background: transparent;
  border: 0;
  font-family: var(--font-body);
  font-size: 0.68rem;
  line-height: 1;
  cursor: pointer;
}

.create-record-shell__processing-delete:disabled {
  opacity: 0.32;
  cursor: default;
}

.create-record-shell__processing-entry-add-row {
  position: relative;
  display: block;
  height: 11px;
  min-height: 11px;
  padding: 0;
  border: 0;
  background: transparent;
  box-sizing: border-box;
}

.create-record-shell__processing-entry-native-input {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0;
  height: 9px;
  min-height: 9px;
  color: #111111;
  caret-color: #111111;
  background: transparent;
  border: 0;
  outline: none;
  appearance: none;
  font-family: var(--font-body);
  font-size: 9px;
  line-height: 9px;
  vertical-align: top;
}

.create-record-shell__processing-entry-native-input--boxed {
  padding: 0 12px 0 3px;
  height: 11px;
  min-height: 11px;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 0;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-entry-hint {
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(17, 17, 17, 0.5);
  font-size: 9px;
  line-height: 1;
  pointer-events: none;
}

.create-record-shell__processing-entry-list {
  display: grid;
  align-content: start;
  gap: 3px;
  min-height: 0;
  max-height: 124px;
  overflow: auto;
  margin-top: 2px;
}

.create-record-shell__processing-entry-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  min-height: 12px;
  padding: 1px 3px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 0;
}

.create-record-shell__processing-entry-value {
  min-width: 0;
  color: #111111;
  font-size: 8px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__processing-entry-toggle {
  min-width: 0;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  font-family: var(--font-body);
  font-size: 0.72rem;
  line-height: 1.2;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.create-record-shell__processing-entry-row--expanded .create-record-shell__processing-entry-toggle {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

.create-record-shell__processing-placeholder-box {
  height: 16px;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-placeholder-box--input,
.create-record-shell__processing-placeholder-box--textarea {
  width: 100%;
  padding: 0 4px;
  color: #111111;
  border: 1px solid rgba(17, 17, 17, 0.18);
  outline: none;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-placeholder-box--input {
  height: 16px;
  padding-top: 1px;
  padding-bottom: 1px;
  line-height: 12px;
}


.create-record-shell__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.create-record-shell__tabs-left,
.create-record-shell__tabs-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.create-record-shell__tabs-right {
  margin-left: auto;
}

.create-record-shell__tab {
  min-height: 30px;
  padding: 0 12px;
  color: #111111;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.92);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.create-record-shell__tab--active {
  color: #ffffff;
  background: #111111;
}

.create-record-shell__panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 10px 18px 18px;
  overflow: auto;
  background: rgba(249, 249, 247, 0.92);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
  scrollbar-width: thin;
  scrollbar-color: #111111 transparent;
}

.create-record-shell__panel::-webkit-scrollbar {
  width: 6px;
}

.create-record-shell__panel::-webkit-scrollbar-track {
  background: transparent;
}

.create-record-shell__panel::-webkit-scrollbar-thumb {
  background: #111111;
  border-radius: 999px;
}

.create-record-shell__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.create-record-shell__panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__panel-meta {
  color: rgba(17, 17, 17, 0.52);
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: var(--font-weight-light);
}

.create-record-shell__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 14px;
  align-content: start;
  overflow: visible;
  margin-right: 0;
  padding-right: 0;
}

.create-record-shell__fields-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-content: start;
}

.create-record-shell__field {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.create-record-shell__field--wide {
  grid-column: 1 / -1;
  align-items: start;
}

.create-record-shell__field-label-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.create-record-shell__field-label-wrap {
  display: grid;
  justify-items: start;
  gap: 4px;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  text-align: left;
}

.create-record-shell__field-parent-link {
  color: #4f4f4f;
}

.create-record-shell__field-action {
  width: 20px;
  min-width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
  flex: 0 0 auto;
}

.create-record-shell__field-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  justify-self: start;
  width: calc(100% - 4px);
  max-width: calc(100% - 4px);
  margin-left: 4px;
}

.create-record-shell__input {
  flex: 0 1 auto;
  width: fit-content;
  min-width: 132px;
  max-width: 280px;
  background: transparent;
}

.create-record-shell__input :deep(.q-field__control) {
  min-height: 14px;
  padding-top: 0;
  padding-bottom: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(17, 17, 17, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 14px;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input),
.create-record-shell__input :deep(.q-field__marginal),
.create-record-shell__input :deep(.q-chip) {
  font-size: 0.78rem;
  line-height: 1;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-left: 5px;
  padding-right: 10px;
}

.create-record-shell__input--verification-default :deep(.q-chip) {
  background: rgba(225, 239, 255, 0.96);
  color: rgba(24, 72, 144, 0.96);
  border: 1px solid rgba(64, 121, 210, 0.3);
}

.create-record-shell__input--verification-suggested :deep(.q-chip) {
  background: rgba(255, 246, 214, 0.98);
  color: rgba(106, 78, 5, 0.92);
  border: 1px solid rgba(186, 129, 13, 0.28);
}

.create-record-shell__input--verification-default :deep(.q-field__native),
.create-record-shell__input--verification-default :deep(.q-field__input) {
  color: rgba(24, 72, 144, 0.96);
  font-weight: 700;
  background-image: linear-gradient(
    transparent calc(100% - 0.2em),
    rgba(112, 171, 244, 0.36) calc(100% - 0.2em)
  );
}

.create-record-shell__input--verification-suggested :deep(.q-field__native),
.create-record-shell__input--verification-suggested :deep(.q-field__input) {
  color: rgba(106, 78, 5, 0.92);
  font-weight: 700;
  background-image: linear-gradient(
    transparent calc(100% - 0.2em),
    rgba(240, 205, 104, 0.42) calc(100% - 0.2em)
  );
}

.create-record-shell__field-action.create-record-shell__input--verification-default :deep(.q-field__control) {
  background: rgba(225, 239, 255, 0.96);
  border-color: rgba(64, 121, 210, 0.32);
}

.create-record-shell__field-action.create-record-shell__input--verification-suggested :deep(.q-field__control) {
  background: rgba(255, 246, 214, 0.98);
  border-color: rgba(186, 129, 13, 0.28);
}

.create-record-shell__verification-menu {
  min-width: 164px;
}

.create-record-shell__verification-menu-item {
  min-height: 26px;
}

.create-record-shell__verification-menu-label {
  font-size: 8px;
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.create-record-shell__verification-icon--verified {
  color: rgba(35, 92, 26, 0.96) !important;
}

.create-record-shell__verification-icon--default {
  color: rgba(64, 121, 210, 0.92) !important;
}

.create-record-shell__verification-icon--suggested {
  color: rgba(186, 129, 13, 0.92) !important;
}

.create-record-shell__verification-icon--rejected {
  color: rgba(166, 43, 43, 0.92) !important;
}

.create-record-shell__input--summary {
  width: 100%;
  min-width: 0;
  max-width: none;
  flex: 1 1 auto;
}

.create-record-shell__input--summary :deep(.q-field__control) {
  min-height: 132px;
  border-radius: 8px;
  align-items: flex-start;
}

.create-record-shell__input--summary :deep(textarea) {
  min-height: 108px !important;
  padding-top: 0 !important;
}

.create-record-shell__empty {
  color: rgba(17, 17, 17, 0.56);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: var(--font-weight-light);
}

.create-record-shell__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 28px 22px;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.create-record-shell__footer-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.create-record-shell__footer-status {
  display: inline-flex;
  align-items: center;
  padding: 1px 10px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.create-record-shell__footer-status--default {
  background: rgba(225, 239, 255, 0.96);
  color: rgba(24, 72, 144, 0.96);
  border: 1px solid rgba(64, 121, 210, 0.32);
}

.create-record-shell__footer-status--suggested {
  background: rgba(255, 246, 214, 0.98);
  color: rgba(106, 78, 5, 0.92);
  border: 1px solid rgba(186, 129, 13, 0.28);
}

.create-record-shell__footer-button {
  border-radius: 4px;
}

.create-record-shell__resize-handle {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 18px;
  height: 18px;
  padding: 0;
  background:
    linear-gradient(135deg, transparent 0 42%, rgba(17, 17, 17, 0.34) 42% 48%, transparent 48% 58%, rgba(17, 17, 17, 0.5) 58% 64%, transparent 64%);
  border: 0;
  cursor: nwse-resize;
  opacity: 0.8;
}

@media (max-width: 900px) {
  .create-record-shell {
    width: calc(100vw - 20px);
    height: calc(100vh - 20px);
    min-width: calc(100vw - 20px);
    min-height: calc(100vh - 20px);
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 18px;
  }

  .create-record-shell__header {
    flex-direction: column;
  }

  .create-record-shell__fields {
    grid-template-columns: 1fr;
  }

  .create-record-shell__fields-grid {
    gap: 20px;
  }

  .create-record-shell__intake-body {
    grid-template-columns: 1fr;
  }

  .create-record-shell__tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .create-record-shell__tabs-right {
    margin-left: 0;
  }

  .create-record-shell__field {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .create-record-shell__field-copy {
    padding-top: 0;
  }

  .create-record-shell__field--wide {
    grid-column: span 1;
  }
}
</style>
