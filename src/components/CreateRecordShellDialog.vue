<template>
  <q-dialog v-model="open">
    <q-card
      class="create-record-shell"
      :style="dialogStyle"
    >
      <q-card-section class="create-record-shell__header">
        <div class="create-record-shell__header-copy">
          <div class="create-record-shell__intake-lane">
            <div class="create-record-shell__intake-title">Ingestion Companion</div>
            <div class="create-record-shell__intake-body">
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
                    />
                    <div class="create-record-shell__artifact-drop-list-meta">
                      {{ selectedArtifactCount }} of {{ stagedArtifacts.length }} selected
                    </div>
                  </div>

                  <div class="create-record-shell__artifact-drop-items">
                    <label
                      v-for="artifact in stagedArtifacts"
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

              <div class="create-record-shell__intake-side">
                <q-input
                  v-model="artifactUrlInput"
                  dense
                  outlined
                  type="url"
                  class="create-record-shell__artifact-url-input"
                  placeholder="URL"
                />

                <div class="create-record-shell__processing-panel">
                  <div class="create-record-shell__processing-panel-head">
                    <div class="create-record-shell__processing-panel-title">Processing Files</div>
                    <div class="create-record-shell__processing-panel-meta">
                      {{ selectedArtifactCount }} of {{ stagedArtifacts.length }} selected
                    </div>
                  </div>

                  <div v-if="stagedArtifacts.length" class="create-record-shell__processing-ready">
                    Staged files are ready for selection and processing.
                  </div>

                  <div v-else class="create-record-shell__processing-empty">
                    Drop files on the left to stage them for this record.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="create-record-shell__header-actions"></div>
      </q-card-section>

      <q-card-section class="create-record-shell__body">
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
})

const emit = defineEmits(['update:modelValue', 'submit'])

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeSectionKey = ref('key-fields')
const formValues = ref({})
const artifactDragOver = ref(false)
const stagedArtifacts = ref([])
const selectedArtifactIds = ref([])
const autoProcessArtifacts = ref(false)
const artifactUrlInput = ref('')
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

const submitLabel = computed(() => 'Save')
const selectedArtifactCount = computed(() => selectedArtifactIds.value.length)
const allArtifactsSelected = computed(() =>
  stagedArtifacts.value.length > 0 && selectedArtifactIds.value.length === stagedArtifacts.value.length,
)
const activeFieldLabelWidth = computed(() => {
  const longestLabelLength = activeFields.value.reduce((max, token) => {
    const length = String(token?.label || '').trim().length
    return Math.max(max, length)
  }, 0)

  const widthInCh = Math.min(Math.max(longestLabelLength, 7), 11)
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
    activeSectionKey.value = String(props.initialSectionKey || '').trim() || 'key-fields'
    artifactDragOver.value = false
    stagedArtifacts.value = []
    selectedArtifactIds.value = []
    autoProcessArtifacts.value = false
    artifactUrlInput.value = ''
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
}

function submit() {
  emit('submit', {
    values: { ...formValues.value },
    artifacts: {
      stagedFiles: stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
      autoProcess: autoProcessArtifacts.value,
      url: String(artifactUrlInput.value || '').trim(),
    },
  })
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
  selectedArtifactIds.value = stagedArtifacts.value.map((artifact) => artifact.id)
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

function toggleArtifactSelection(artifactId, nextValue) {
  if (nextValue) {
    if (!selectedArtifactIds.value.includes(artifactId)) {
      selectedArtifactIds.value = [...selectedArtifactIds.value, artifactId]
    }
    return
  }

  selectedArtifactIds.value = selectedArtifactIds.value.filter((id) => id !== artifactId)
}

function toggleAllArtifacts(nextValue) {
  if (nextValue) {
    selectedArtifactIds.value = stagedArtifacts.value.map((artifact) => artifact.id)
    return
  }

  selectedArtifactIds.value = []
}

function formatArtifactSize(size) {
  const normalized = Number(size || 0)
  if (!Number.isFinite(normalized) || normalized <= 0) return '--'
  if (normalized < 1024) return `${normalized} B`
  if (normalized < 1024 * 1024) return `${(normalized / 1024).toFixed(1)} KB`
  return `${(normalized / (1024 * 1024)).toFixed(1)} MB`
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

.create-record-shell__intake-lane {
  display: grid;
  gap: 12px;
  width: 100%;
}

.create-record-shell__intake-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__intake-body {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: stretch;
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
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  min-height: 220px;
}

.create-record-shell__artifact-drop-copy {
  display: grid;
  gap: 4px;
}

.create-record-shell__artifact-drop-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__artifact-drop-caption {
  color: rgba(17, 17, 17, 0.62);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__artifact-drop-list {
  display: grid;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
}

.create-record-shell__artifact-drop-list-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-record-shell__artifact-drop-list-meta {
  color: rgba(17, 17, 17, 0.66);
  font-size: 0.74rem;
  line-height: 1.2;
}

.create-record-shell__artifact-drop-items {
  display: grid;
  gap: 6px;
  max-height: 136px;
  overflow: auto;
  padding-right: 2px;
}

.create-record-shell__artifact-drop-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
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

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__label) {
  color: rgba(17, 17, 17, 0.5);
  font-size: 0.64rem;
  font-weight: 500;
  line-height: 1.15;
}

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__inner) {
  font-size: 0.9rem;
}

.create-record-shell__artifact-url-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
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
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.create-record-shell__processing-panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
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
  gap: 4px;
  align-items: start;
}

.create-record-shell__field--wide {
  grid-column: 1 / -1;
}

.create-record-shell__field-copy {
  display: grid;
  gap: 0;
  padding-top: 6px;
  justify-self: start;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  text-align: left;
}

.create-record-shell__input {
  background: rgba(255, 255, 255, 0.92);
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input),
.create-record-shell__input :deep(.q-field__marginal),
.create-record-shell__input :deep(.q-chip) {
  font-size: 0.78rem;
  line-height: 1.2;
}

.create-record-shell__input--summary :deep(.q-field__control) {
  min-height: 132px;
  border-radius: 8px;
  align-items: flex-start;
}

.create-record-shell__input--summary :deep(textarea) {
  min-height: 108px !important;
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
