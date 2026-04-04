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
                    <div class="create-record-shell__processing-panel-title">Ingestion Companion</div>
                  </div>

                  <div class="create-record-shell__processing-sections">
                    <section class="create-record-shell__processing-box">
                      <div class="create-record-shell__processing-box-head">
                        <div class="create-record-shell__processing-box-title">Artifacts Processed</div>
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
                          @click="removeSelectedSupportResourceEntries('url')"
                        >
                          Delete
                        </button>
                      </div>
                      <q-input
                        v-model="pendingUrlEntry"
                        dense
                        outlined
                        class="create-record-shell__processing-entry-input"
                        @keyup.enter.prevent="addSupportResourceEntry('url')"
                      />
                      <div v-if="urlEntries.length" class="create-record-shell__processing-entry-list">
                        <label
                          v-for="entry in urlEntries"
                          :key="entry.id"
                          class="create-record-shell__processing-entry-row"
                        >
                          <q-checkbox
                            :model-value="selectedUrlEntryIds.includes(entry.id)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleSupportResourceSelection('url', entry.id, $event)"
                          />
                          <span class="create-record-shell__processing-entry-value">{{ entry.value }}</span>
                        </label>
                      </div>
                    </section>

                    <section class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <div class="create-record-shell__processing-box-head">
                        <div class="create-record-shell__processing-box-title">Text Blurb / Guides</div>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedGuidanceEntryIds.length"
                          @click="removeSelectedSupportResourceEntries('guidance')"
                        >
                          Delete
                        </button>
                      </div>
                      <q-input
                        v-model="pendingGuidanceEntry"
                        dense
                        outlined
                        class="create-record-shell__processing-entry-input"
                        @keyup.enter.prevent="addSupportResourceEntry('guidance')"
                      />
                      <div v-if="guidanceEntries.length" class="create-record-shell__processing-entry-list">
                        <label
                          v-for="entry in guidanceEntries"
                          :key="entry.id"
                          class="create-record-shell__processing-entry-row"
                        >
                          <q-checkbox
                            :model-value="selectedGuidanceEntryIds.includes(entry.id)"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleSupportResourceSelection('guidance', entry.id, $event)"
                          />
                          <span class="create-record-shell__processing-entry-value">{{ entry.value }}</span>
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
                <div class="create-record-shell__panel-title">{{ activeSection?.label || 'Key Fields' }}</div>
                <div class="create-record-shell__panel-meta">{{ activeFields.length }} fields</div>
              </div>

              <div
                v-if="activeFields.length"
                class="create-record-shell__fields"
                :style="{ '--create-record-shell-label-width': activeFieldLabelWidth }"
              >
                <div
                  v-for="token in activeFields"
                  :key="token.key"
                  class="create-record-shell__field"
                  :class="{ 'create-record-shell__field--wide': isWideField(token) }"
                >
                  <div class="create-record-shell__field-copy">
                    <div class="create-record-shell__field-label">
                      {{ token.label }}
                      <q-tooltip anchor="top middle" self="bottom middle">
                        {{ formatFieldType(token.tokenType) }}
                      </q-tooltip>
                    </div>
                  </div>

                  <q-select
                    v-if="token.tokenType === 'select_multi'"
                    :model-value="Array.isArray(formValues[token.key]) ? formValues[token.key] : []"
                    dense
                    outlined
                    use-chips
                    multiple
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading"
                    class="create-record-shell__input"
                    :class="{ 'create-record-shell__input--summary': isSummaryField(token) }"
                    @update:model-value="updateField(token.key, $event)"
                  />

                  <q-select
                    v-else-if="token.tokenType === 'select_single'"
                    :model-value="selectSingleValue(formValues[token.key])"
                    dense
                    outlined
                    use-chips
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading"
                    class="create-record-shell__input"
                    @update:model-value="updateField(token.key, $event)"
                  />

                  <q-input
                    v-else
                    :model-value="stringValue(formValues[token.key])"
                    dense
                    outlined
                    :disable="loading"
                    :type="isSummaryField(token) ? 'textarea' : inputTypeForToken(token.tokenType)"
                    :autogrow="isSummaryField(token)"
                    class="create-record-shell__input"
                    :class="{ 'create-record-shell__input--summary': isSummaryField(token) }"
                    @update:model-value="updateField(token.key, $event)"
                  />
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
        <q-btn flat no-caps label="Cancel" :disable="loading" @click="open = false" />
        <q-btn
          no-caps
          unelevated
          color="dark"
          :label="submitLabel"
          :loading="loading"
          :disable="submitDisabled"
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
  initialSectionKey: { type: String, default: 'key-fields' },
  initialArtifacts: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'submit', 'change', 'request-close'])

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
const pendingUrlEntry = ref('')
const pendingGuidanceEntry = ref('')
const urlEntries = ref([])
const guidanceEntries = ref([])
const selectedUrlEntryIds = ref([])
const selectedGuidanceEntryIds = ref([])
const supportResourcesCollapsed = ref(false)
const recordDataCollapsed = ref(false)
const dialogWidth = ref(760)
const dialogHeight = ref(780)
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

const submitLabel = computed(() => 'Save')
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
const activeFieldLabelWidth = computed(() => {
  const longestLabelLength = activeFields.value.reduce((max, token) => {
    const length = String(token?.label || '').trim().length
    return Math.max(max, length)
  }, 0)

  const widthInCh = Math.min(Math.max(longestLabelLength, 6), 8)
  return `${widthInCh}ch`
})

const activeSection = computed(
  () => allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null,
)

const activeFields = computed(() => activeSection.value?.tokens || [])
const dialogStyle = computed(() => ({
  width: `${dialogWidth.value}px`,
  height: `${dialogHeight.value}px`,
}))

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    hasUserChanges.value = false
    activeSectionKey.value = String(props.initialSectionKey || '').trim() || 'key-fields'
    artifactDragOver.value = false
    stagedArtifacts.value = normalizeInitialArtifacts(props.initialArtifacts)
    selectedArtifactIds.value = []
    autoProcessArtifacts.value = false
    pendingUrlEntry.value = ''
    pendingGuidanceEntry.value = ''
    urlEntries.value = []
    guidanceEntries.value = []
    selectedUrlEntryIds.value = []
    selectedGuidanceEntryIds.value = []
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
  },
)

function updateField(tokenKey, value) {
  formValues.value = {
    ...formValues.value,
    [tokenKey]: value,
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
  return {
    values: { ...formValues.value },
    artifacts: {
      stagedFiles: stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
      autoProcess: autoProcessArtifacts.value,
    },
    companion: {
      urls: urlEntries.value.map((entry) => entry.value),
      guidance: guidanceEntries.value.map((entry) => entry.value),
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

function isSummaryField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'summary'
}

function onArtifactDrop(event) {
  artifactDragOver.value = false
  const files = Array.from(event?.dataTransfer?.files || [])
  if (!files.length) return

  const nextArtifacts = files
    .map((file) => normalizeArtifactFile(file))
    .filter((file) => file.path || file.name)

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
        id: String(artifact?.id || path || `${name}:${index}`).trim(),
        name: name || path,
        path: path || null,
        size,
      }
    })
    .filter(Boolean)
}

function toggleArtifactSelection(artifactId, nextValue) {
  if (nextValue) {
    if (!selectedArtifactIds.value.includes(artifactId)) {
      selectedArtifactIds.value = [...selectedArtifactIds.value, artifactId]
    }
    markDialogChanged()
    return
  }

  selectedArtifactIds.value = selectedArtifactIds.value.filter((id) => id !== artifactId)
  markDialogChanged()
}

function toggleAllArtifacts(nextValue) {
  if (nextValue) {
    selectedArtifactIds.value = stagedArtifacts.value.map((artifact) => artifact.id)
    markDialogChanged()
    return
  }

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

function addSupportResourceEntry(kind) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const sourceRef = normalizedKind === 'guidance' ? pendingGuidanceEntry : pendingUrlEntry
  const nextValue = String(sourceRef.value || '').trim()
  if (!nextValue) return

  const nextEntry = {
    id: `${normalizedKind}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    value: nextValue,
  }

  if (normalizedKind === 'guidance') {
    guidanceEntries.value = [...guidanceEntries.value, nextEntry]
    pendingGuidanceEntry.value = ''
  } else {
    urlEntries.value = [...urlEntries.value, nextEntry]
    pendingUrlEntry.value = ''
  }

  markDialogChanged()
}

function toggleSupportResourceSelection(kind, entryId, nextValue) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const selectedRef = normalizedKind === 'guidance' ? selectedGuidanceEntryIds : selectedUrlEntryIds
  const normalizedId = String(entryId || '').trim()
  if (!normalizedId) return
  if (nextValue) {
    if (!selectedRef.value.includes(normalizedId)) {
      selectedRef.value = [...selectedRef.value, normalizedId]
    }
    return
  }
  selectedRef.value = selectedRef.value.filter((id) => id !== normalizedId)
}

function removeSelectedSupportResourceEntries(kind) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  if (normalizedKind === 'guidance') {
    const selected = new Set(selectedGuidanceEntryIds.value)
    guidanceEntries.value = guidanceEntries.value.filter((entry) => !selected.has(entry.id))
    selectedGuidanceEntryIds.value = []
  } else {
    const selected = new Set(selectedUrlEntryIds.value)
    urlEntries.value = urlEntries.value.filter((entry) => !selected.has(entry.id))
    selectedUrlEntryIds.value = []
  }
  markDialogChanged()
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
  font-size: 1.22rem;
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
  color: rgba(17, 17, 17, 0.58);
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
  color: rgba(17, 17, 17, 0.58);
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
  min-height: 260px;
  padding: 20px 22px 16px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 10px;
}

.create-record-shell__artifact-drop--active {
  background: rgba(238, 241, 255, 0.98);
  border-color: rgba(38, 71, 255, 0.6);
}

.create-record-shell__intake-side {
  display: grid;
  min-height: 220px;
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
  align-content: start;
  gap: 4px;
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
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
}

.create-record-shell__artifact-drop-item-name {
  min-width: 0;
  color: #111111;
  font-size: 0.77rem;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__artifact-drop-item-size {
  color: rgba(17, 17, 17, 0.55);
  font-size: 0.72rem;
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
  padding: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
}

.create-record-shell__processing-box--compact {
  align-content: start;
}

.create-record-shell__processing-box-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
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

.create-record-shell__processing-entry-input :deep(.q-field__control) {
  min-height: 34px;
  border-radius: 6px;
}

.create-record-shell__processing-entry-list {
  display: grid;
  align-content: start;
  gap: 4px;
  min-height: 0;
  max-height: 124px;
  overflow: auto;
}

.create-record-shell__processing-entry-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
}

.create-record-shell__processing-entry-value {
  min-width: 0;
  color: #111111;
  font-size: 0.74rem;
  line-height: 1.28;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border-radius: 8px;
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
  padding: 18px;
  background: rgba(249, 249, 247, 0.92);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
}

.create-record-shell__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
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
  gap: 10px 14px;
  align-content: start;
  grid-auto-flow: dense;
  overflow: auto;
}

.create-record-shell__field {
  display: grid;
  grid-template-columns: var(--create-record-shell-label-width, 12ch) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.create-record-shell__field--wide {
  grid-column: 1 / -1;
  align-items: start;
}

.create-record-shell__field-copy {
  display: grid;
  gap: 0;
  padding-top: 0;
  justify-self: end;
}

.create-record-shell__field--wide .create-record-shell__field-copy {
  padding-top: 13px;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  text-align: right;
}

.create-record-shell__input {
  width: min(100%, 240px);
  justify-self: start;
  background: rgba(255, 255, 255, 0.92);
}

.create-record-shell__input :deep(.q-field__control) {
  min-height: 34px;
  border-radius: 5px;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 34px;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input),
.create-record-shell__input :deep(.q-field__marginal),
.create-record-shell__input :deep(.q-chip) {
  font-size: 0.78rem;
  line-height: 1.2;
}

.create-record-shell__input--summary {
  width: 100%;
}

.create-record-shell__input--summary :deep(.q-field__control) {
  min-height: 132px;
  border-radius: 8px;
  align-items: flex-start;
}

.create-record-shell__input--summary :deep(textarea) {
  min-height: 108px !important;
  padding-top: 10px !important;
}

.create-record-shell__empty {
  color: rgba(17, 17, 17, 0.56);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: var(--font-weight-light);
}

.create-record-shell__footer {
  padding: 14px 28px 22px;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  background: rgba(255, 255, 255, 0.92);
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
