<template>
  <q-page class="record-event-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record event view requires Electron.
      </q-banner>
    </div>

    <div v-else class="record-event-page__shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <div class="record-event-page__header">
        <q-btn flat no-caps icon="arrow_back" label="Back to Record" @click="goBackToRecord" />
      </div>

      <q-card flat bordered class="record-event-page__card">
        <q-card-section class="record-event-page__card-head">
          <div class="record-event-page__eyebrow">Event Log</div>
          <div class="record-event-page__title">{{ eventTitle }}</div>
          <div class="record-event-page__meta">
            <span>{{ eventActor }}</span>
            <span>{{ eventTime }}</span>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="record-event-page__body">
          <div class="record-event-page__row">
            <div class="record-event-page__label">Action</div>
            <div class="record-event-page__value">{{ eventActionLabel }}</div>
          </div>
          <div class="record-event-page__row">
            <div class="record-event-page__label">Field</div>
            <div class="record-event-page__value">{{ eventFieldLabel }}</div>
          </div>
          <div class="record-event-page__row">
            <div class="record-event-page__label">Previous</div>
            <div class="record-event-page__value">{{ eventOldValue }}</div>
          </div>
          <div class="record-event-page__row">
            <div class="record-event-page__label">New</div>
            <div class="record-event-page__value">{{ eventNewValue }}</div>
          </div>
          <div class="record-event-page__row" v-if="rawEventJson">
            <div class="record-event-page__label">Raw Log</div>
            <pre class="record-event-page__pre">{{ rawEventJson }}</pre>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RECORD_VIEW_ROUTE_NAME } from 'src/utils/recordViewNavigation'

const route = useRoute()
const router = useRouter()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const error = ref('')
const eventRecord = ref(null)
const users = ref([])

const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const eventIdParam = computed(() => String(route.params.eventId || '').trim())

onMounted(async () => {
  await loadEvent()
})

async function loadEvent() {
  if (!bridge.value?.audit?.events) return
  error.value = ''
  try {
    const [eventResult, userResult] = await Promise.all([
      bridge.value.audit.events({
        table_name: tableNameParam.value,
        record_id: recordIdParam.value,
        limit: 200,
      }),
      bridge.value?.users?.list?.(),
    ])

    users.value = normalizeListResult(userResult)
    eventRecord.value = (Array.isArray(eventResult?.events) ? eventResult.events : []).find(
      (event) => String(event?.id || '').trim() === eventIdParam.value,
    ) || null

    if (!eventRecord.value) {
      error.value = 'Event log not found for this record.'
    }
  } catch (loadError) {
    error.value = String(loadError?.message || loadError || '').trim() || 'Could not load event log.'
  }
}

function goBackToRecord() {
  router.push({
    name: RECORD_VIEW_ROUTE_NAME,
    params: {
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
    },
  })
}

function normalizeListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

function stringifyAuditValue(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return 'None'
  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) return parsed.join(', ') || 'None'
    if (parsed && typeof parsed === 'object') return JSON.stringify(parsed, null, 2)
  } catch {
    // keep raw string
  }
  return normalized
}

function formatAuditFieldLabel(fieldName) {
  const specialWords = {
    id: 'ID',
    api: 'API',
    aum: 'AUM',
    aums: 'AUMs',
    llm: 'LLM',
    rofo: 'ROFO',
    ror: 'ROR',
  }
  return String(fieldName || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = String(word).toLowerCase()
      if (specialWords[lower]) return specialWords[lower]
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function formatActorLabel(editedBy) {
  const normalized = String(editedBy || '').trim()
  const matched = users.value.find((row) => String(row?.id || '').trim() === normalized)
  return String(matched?.User_Name || matched?.Name || '').trim() || normalized || 'User'
}

const eventFieldLabel = computed(() => formatAuditFieldLabel(String(eventRecord.value?.field_name || '').replace(/__verification$/, '')))
const eventActionLabel = computed(() => String(eventRecord.value?.action_label || '').trim() || 'record_event')
const eventActor = computed(() => formatActorLabel(eventRecord.value?.edited_by))
const eventTime = computed(() => String(eventRecord.value?.edited_at || '').trim() || 'Recent')
const eventOldValue = computed(() => stringifyAuditValue(eventRecord.value?.old_value))
const eventNewValue = computed(() => stringifyAuditValue(eventRecord.value?.new_value))
const eventTitle = computed(() => {
  const fieldName = String(eventRecord.value?.field_name || '').trim()
  if (fieldName.endsWith('__verification')) return `${eventActor.value} verified ${eventFieldLabel.value}`
  if (String(eventRecord.value?.action_label || '').toLowerCase().includes('create')) return `${eventActor.value} created record`
  return `${eventActor.value} updated ${eventFieldLabel.value || 'record'}`
})
const rawEventJson = computed(() => {
  if (!eventRecord.value) return ''
  return JSON.stringify(eventRecord.value, null, 2)
})
</script>

<style scoped>
.record-event-page__shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-event-page__card {
  border-radius: 18px;
}

.record-event-page__card-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-event-page__eyebrow {
  color: #6f6f6f;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-event-page__title {
  font-family: var(--ds-font-family-title);
  font-size: 1.4rem;
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}

.record-event-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #6f6f6f;
  font-size: 0.82rem;
}

.record-event-page__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record-event-page__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-event-page__label {
  color: #6f6f6f;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.record-event-page__value {
  color: #111;
  font-size: 0.96rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.record-event-page__pre {
  margin: 0;
  padding: 12px;
  overflow: auto;
  color: #111;
  background: #f5f4f0;
  border-radius: 12px;
  font-size: 0.82rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
