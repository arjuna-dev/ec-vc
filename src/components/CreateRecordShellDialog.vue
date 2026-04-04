<template>
  <q-dialog v-model="open">
    <q-card
      class="create-record-shell"
      :class="{ 'create-record-shell--maximized': isMaximized }"
    >
      <q-card-section class="create-record-shell__header">
        <div class="create-record-shell__header-copy">
          <q-input
            v-if="headerNameToken"
            :model-value="stringValue(formValues[headerNameToken.key])"
            dense
            borderless
            :disable="loading"
            class="create-record-shell__title-input"
            :placeholder="headerNamePlaceholder"
            @update:model-value="updateField(headerNameToken.key, $event)"
          />
          <div v-else class="create-record-shell__title">Create {{ singularLabel }}</div>
        </div>

        <div class="create-record-shell__header-actions">
          <q-btn
            flat
            round
            dense
            color="dark"
            size="0.57rem"
            :icon="isMaximized ? 'close_fullscreen' : 'open_in_full'"
            :aria-label="isMaximized ? 'Exit fullscreen' : 'Open fullscreen'"
            @click="isMaximized = !isMaximized"
          />
        </div>
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

          <div v-if="activeFields.length" class="create-record-shell__fields">
            <div
              v-for="token in activeFields"
              :key="token.key"
              class="create-record-shell__field"
              :class="{ 'create-record-shell__field--wide': isWideField(token) }"
            >
              <div class="create-record-shell__field-copy">
                <div class="create-record-shell__field-label">{{ token.label }}</div>
                <div class="create-record-shell__field-type">{{ formatFieldType(token.tokenType) }}</div>
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
                :model-value="stringValue(formValues[token.key])"
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
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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
const isMaximized = ref(false)

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

const headerNameToken = computed(() => props.keyFieldTokens[0] || null)

const headerNamePlaceholder = computed(() => `${String(props.singularLabel || 'record')} name`)
const submitLabel = computed(() => (String(props.mode || '').trim().toLowerCase() === 'edit' ? 'Save' : 'Create'))

const activeSection = computed(
  () => allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null,
)

const activeFields = computed(() =>
  (activeSection.value?.tokens || []).filter((token) => token.key !== headerNameToken.value?.key),
)

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    isMaximized.value = false
    activeSectionKey.value = String(props.initialSectionKey || '').trim() || 'key-fields'
    formValues.value = Object.fromEntries(
      allSections.value
        .flatMap((section) => section.tokens || [])
        .map((token) => {
          const initialValue = props.initialValues?.[token.key]
          if (token.tokenType === 'select_multi') {
            return [token.key, Array.isArray(initialValue) ? initialValue : []]
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
  emit('submit', { values: { ...formValues.value } })
}

function stringValue(value) {
  return typeof value === 'string' ? value : String(value || '')
}

function inputTypeForToken(tokenType) {
  if (tokenType === 'email') return 'email'
  if (tokenType === 'phone') return 'tel'
  if (tokenType === 'url') return 'url'
  if (tokenType === 'datetime') return 'datetime-local'
  return 'text'
}

function formatFieldType(tokenType) {
  const normalized = String(tokenType || 'text').trim()
  if (!normalized) return 'Field'
  return normalized.replace(/_/g, ' ')
}

function isWideField(token) {
  return ['text', 'url', 'select_multi'].includes(String(token?.tokenType || '').trim())
}

function isSummaryField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'summary'
}
</script>

<style scoped>
.create-record-shell {
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

.create-record-shell--maximized {
  width: calc(100vw - 24px);
  height: calc(100vh - 24px);
  min-width: calc(100vw - 24px);
  min-height: calc(100vh - 24px);
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  border-radius: 22px;
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
  display: grid;
  gap: 6px;
}

.create-record-shell__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__title-input {
  min-width: min(100%, 460px);
  padding: 0;
}

.create-record-shell__title-input :deep(.q-field__control) {
  min-height: auto;
}

.create-record-shell__title-input :deep(.q-field__native),
.create-record-shell__title-input :deep(.q-field__input) {
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  padding: 0;
}

.create-record-shell__title-input :deep(.q-field__native::placeholder),
.create-record-shell__title-input :deep(.q-field__input::placeholder) {
  color: rgba(17, 17, 17, 0.34);
}

.create-record-shell__header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.create-record-shell__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 18px 28px 28px;
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
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: start;
  overflow: auto;
}

.create-record-shell__field {
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.create-record-shell__field--wide {
  grid-column: span 1;
}

.create-record-shell__field-copy {
  display: grid;
  gap: 4px;
  padding-top: 6px;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  text-align: left;
}

.create-record-shell__field-type {
  color: rgba(17, 17, 17, 0.48);
  font-family: var(--font-body);
  font-size: 0.66rem;
  font-weight: var(--font-weight-light);
  line-height: 1;
  text-transform: uppercase;
  text-align: left;
}

.create-record-shell__input {
  background: rgba(255, 255, 255, 0.92);
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

@media (max-width: 900px) {
  .create-record-shell,
  .create-record-shell--maximized {
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
