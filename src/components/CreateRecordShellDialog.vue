<template>
  <q-dialog v-model="open">
    <q-card
      class="create-record-shell"
      :class="{ 'create-record-shell--maximized': isMaximized }"
    >
      <q-card-section class="create-record-shell__header">
        <div class="create-record-shell__header-copy">
          <div class="create-record-shell__eyebrow">Create Record</div>
          <div class="create-record-shell__title">Create {{ singularLabel }}</div>
          <div class="create-record-shell__caption">
            Key Fields come first. The remaining sections follow canonical order so you can move fast without losing structure.
          </div>
        </div>

        <div class="create-record-shell__header-actions">
          <q-btn
            flat
            round
            dense
            color="dark"
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
              v-for="section in leftSections"
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
              <div class="create-record-shell__field-label">{{ token.label }}</div>
              <div class="create-record-shell__field-type">{{ formatFieldType(token.tokenType) }}</div>

              <q-select
                v-if="token.tokenType === 'select_multi'"
                :model-value="Array.isArray(formValues[token.key]) ? formValues[token.key] : []"
                dense
                outlined
                use-input
                use-chips
                multiple
                hide-dropdown-icon
                new-value-mode="add-unique"
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
                :type="inputTypeForToken(token.tokenType)"
                class="create-record-shell__input"
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
          label="Create"
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
  sourceLabel: { type: String, default: 'Records' },
  singularLabel: { type: String, default: 'record' },
  keyFieldTokens: { type: Array, default: () => [] },
  leftSections: { type: Array, default: () => [] },
  rightSections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
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

const activeSection = computed(
  () => allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null,
)

const activeFields = computed(() => activeSection.value?.tokens || [])

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    isMaximized.value = false
    activeSectionKey.value = 'key-fields'
    formValues.value = Object.fromEntries(
      allSections.value
        .flatMap((section) => section.tokens || [])
        .map((token) => [token.key, token.tokenType === 'select_multi' ? [] : '']),
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
</script>

<style scoped>
.create-record-shell {
  display: flex;
  flex-direction: column;
  width: min(70vw, 1180px);
  height: min(70vh, 860px);
  min-width: min(70vw, 900px);
  min-height: min(70vh, 680px);
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

.create-record-shell__eyebrow {
  color: rgba(17, 17, 17, 0.56);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.create-record-shell__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__caption {
  max-width: 680px;
  color: rgba(17, 17, 17, 0.66);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: var(--font-weight-light);
  line-height: 1.5;
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
  align-items: center;
  gap: 16px;
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
  gap: 14px 16px;
  align-content: start;
  overflow: auto;
}

.create-record-shell__field {
  display: grid;
  gap: 6px;
}

.create-record-shell__field--wide {
  grid-column: span 2;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.create-record-shell__field-type {
  color: rgba(17, 17, 17, 0.48);
  font-family: var(--font-body);
  font-size: 0.66rem;
  font-weight: var(--font-weight-light);
  line-height: 1;
  text-transform: uppercase;
}

.create-record-shell__input {
  background: rgba(255, 255, 255, 0.92);
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

  .create-record-shell__tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .create-record-shell__tabs-right {
    margin-left: 0;
  }

  .create-record-shell__fields {
    grid-template-columns: 1fr;
  }

  .create-record-shell__field--wide {
    grid-column: span 1;
  }
}
</style>
