<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Databooks requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else>
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col">
          <div class="text-h6">{{ databookTitle }}</div>
          <div class="text-caption text-grey-7">
            Flattened view of Opportunity, Company, Contact, Round/Fund, Project/Tasks, and Artifacts.
          </div>
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-list v-if="fields.length" bordered separator>
        <q-item v-for="field in fields" :key="field.key">
          <q-item-section>
            <q-item-label caption class="text-weight-medium">{{ field.section }}</q-item-label>
            <q-item-label class="text-caption text-grey-7">{{ field.label }}</q-item-label>
            <q-item-label
              v-if="isHistoricalMode && modifiedByMap[field.key]"
              class="text-caption text-negative text-italic"
            >
              modified by {{ modifiedByMap[field.key] }}
            </q-item-label>
          </q-item-section>
          <q-item-section side class="databook-value-section">
            <template v-if="editMode">
              <q-input
                v-model="draftValues[field.key]"
                dense
                outlined
                :disable="saving || !field.editable"
                :placeholder="field.editable ? 'Enter value' : ''"
              />
            </template>
            <template v-else>
              <div class="text-body2 databook-value">{{ displayValue(field.value) }}</div>
            </template>
          </q-item-section>
        </q-item>
      </q-list>

      <q-banner v-else-if="!loading" class="bg-grey-2 text-black q-mb-md" rounded>
        No Databook fields available for this opportunity.
      </q-banner>

      <q-page-sticky position="top-right" :offset="[18, 18]">
        <div class="row q-gutter-sm">
          <q-btn-dropdown color="secondary" label="Versions" :disable="loading || saving || !hasVersionBridge">
            <q-list style="min-width: 260px">
              <q-item clickable v-close-popup @click="switchToLatestVersion">
                <q-item-section>
                  <q-item-label>Latest</q-item-label>
                  <q-item-label caption>Current editable databook</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-for="v in versions" :key="v.id" clickable v-close-popup @click="openVersion(v.id)">
                <q-item-section>
                  <q-item-label>{{ v.created_at }}</q-item-label>
                  <q-item-label caption>by {{ v.created_by_label || 'Unknown editor' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            round
            color="primary"
            :icon="editMode ? 'close' : 'edit'"
            :disable="loading || saving || !fields.length || isHistoricalMode"
            @click="editMode ? cancelEdit() : enterEditMode()"
          />
        </div>
      </q-page-sticky>

      <q-page-sticky v-if="editMode" position="bottom" :offset="[0, 16]">
        <q-banner class="bg-grey-10 text-white q-pa-sm rounded-borders">
          <div class="row items-center q-gutter-sm">
            <div class="col">Edit mode enabled. Save or cancel your changes.</div>
            <q-btn dense color="positive" label="Save" :loading="saving" @click="saveChanges" />
            <q-btn dense flat color="white" label="Cancel" :disable="saving" @click="cancelEdit" />
          </div>
        </q-banner>
      </q-page-sticky>

      <q-dialog v-model="showUserLabelDialog" persistent>
        <q-card style="min-width: 360px">
          <q-card-section>
            <div class="text-h6">Set Editor Name</div>
            <div class="text-caption text-grey-7">
              A display name is required before saving audited changes. You can also update it later in Settings.
            </div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="userLabelInput"
              autofocus
              outlined
              dense
              label="Display name"
              :disable="savingUserLabel"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" :disable="savingUserLabel" @click="showUserLabelDialog = false" />
            <q-btn color="primary" label="Save" :loading="savingUserLabel" @click="saveUserLabel" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'

const route = useRoute()
const $q = useQuasar()

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.databooks?.view &&
    !!bridge.value?.databooks?.update &&
    !!bridge.value?.audit?.me,
)
const hasVersionBridge = computed(
  () =>
    !!bridge.value?.databooks?.versions &&
    !!bridge.value?.databooks?.viewSnapshot &&
    !!bridge.value?.audit?.events,
)

const loading = ref(false)
const error = ref('')
const fields = ref([])
const opportunity = ref(null)
const actor = ref(null)
const editMode = ref(false)
const saving = ref(false)
const draftValues = ref({})
const showUserLabelDialog = ref(false)
const userLabelInput = ref('')
const savingUserLabel = ref(false)
const versions = ref([])
const selectedVersionId = ref(null)
const modifiedByMap = ref({})

const isHistoricalMode = computed(() => !!selectedVersionId.value)

const databookTitle = computed(() => {
  const name = String(opportunity.value?.opportunity_name || opportunity.value?.Venture_Oppty_Name || '').trim()
  if (name) return `${name} Databook`
  const id = String(route.params.opportunityId || '').trim()
  return id ? `${id} Databook` : 'Databook'
})

function displayValue(value) {
  const text = String(value || '').trim()
  return text.length ? text : '-'
}

function normalizeIpcErrorMessage(error) {
  const raw = String(error?.message || error || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

function enterEditMode() {
  const next = {}
  for (const field of fields.value) next[field.key] = field.value == null ? '' : String(field.value)
  draftValues.value = next
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  draftValues.value = {}
}

async function refreshActor() {
  if (!hasBridge.value) return
  actor.value = await bridge.value.audit.me()
  userLabelInput.value = String(actor.value?.user_label || '')
}

async function saveUserLabel() {
  const userLabel = String(userLabelInput.value || '').trim()
  if (!userLabel) return
  savingUserLabel.value = true
  try {
    actor.value = await bridge.value.audit.setUserLabel(userLabel)
    showUserLabelDialog.value = false
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    savingUserLabel.value = false
  }
}

async function saveChanges() {
  if (!hasBridge.value) return
  if (!actor.value?.user_label) {
    showUserLabelDialog.value = true
    return
  }
  const opportunityId = String(route.params.opportunityId || '').trim()
  if (!opportunityId) return

  const changes = fields.value
    .filter((field) => field.editable)
    .map((field) => {
      const previousValue = field.value == null ? '' : String(field.value)
      const nextValue = draftValues.value[field.key] == null ? '' : String(draftValues.value[field.key])
      if (previousValue === nextValue) return null
      return {
        table_name: field.table_name,
        record_id: field.record_id,
        field_name: field.field_name,
        id_column: field.id_column,
        new_value: nextValue,
      }
    })
    .filter(Boolean)

  saving.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.update({ opportunityId, changes })
    opportunity.value = result?.view?.opportunity || opportunity.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : []
    cancelEdit()
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
    if (/user label/i.test(message)) showUserLabelDialog.value = true
  } finally {
    saving.value = false
  }
}

async function loadDatabook() {
  if (!hasBridge.value) return
  const opportunityId = String(route.params.opportunityId || '').trim()
  if (!opportunityId) {
    fields.value = []
    opportunity.value = null
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.view(opportunityId)
    opportunity.value = result?.opportunity || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
    selectedVersionId.value = null
    modifiedByMap.value = {}
    await loadVersions()
    await refreshActor()
  } catch (e) {
    error.value = e?.message || String(e)
    fields.value = []
  } finally {
    loading.value = false
  }
}

async function loadVersions() {
  if (!hasVersionBridge.value) return
  const opportunityId = String(route.params.opportunityId || '').trim()
  if (!opportunityId) return
  try {
    const result = await bridge.value.databooks.versions(opportunityId)
    versions.value = Array.isArray(result?.versions) ? result.versions : []
  } catch {
    versions.value = []
  }
}

function fieldMapByKey(list = []) {
  return Object.fromEntries((Array.isArray(list) ? list : []).map((f) => [f.key, f]))
}

function eventKey(field = {}) {
  return `${field.table_name || ''}|${field.record_id || ''}|${field.field_name || ''}`
}

async function openVersion(snapshotId) {
  if (!hasVersionBridge.value) return
  const sid = String(snapshotId || '').trim()
  if (!sid) return
  try {
    const snapshot = await bridge.value.databooks.viewSnapshot(sid)
    const versionPayload = snapshot?.payload || {}
    const versionFields = Array.isArray(versionPayload?.fields) ? versionPayload.fields : []
    const versionOpportunity = versionPayload?.opportunity || null
    const versionIndex = versions.value.findIndex((v) => v.id === sid)
    const priorVersion = versionIndex >= 0 ? versions.value[versionIndex + 1] : null

    const changedKeys = []
    if (priorVersion?.id) {
      const priorSnapshot = await bridge.value.databooks.viewSnapshot(priorVersion.id)
      const prevMap = fieldMapByKey(priorSnapshot?.payload?.fields || [])
      const currMap = fieldMapByKey(versionFields)
      for (const [key, currField] of Object.entries(currMap)) {
        const prevField = prevMap[key]
        if (String(prevField?.value ?? '') !== String(currField?.value ?? '')) changedKeys.push(key)
      }
    }

    const mods = {}
    if (changedKeys.length) {
      const selectedVersion = versions.value.find((v) => v.id === sid)
      const eventsResult = await bridge.value.audit.events({
        since: priorVersion?.created_at || null,
        until: selectedVersion?.created_at || null,
        limit: 1000,
      })
      const events = Array.isArray(eventsResult?.events) ? eventsResult.events : []
      const latestEventByKey = {}
      for (const ev of events) {
        const key = `${ev.table_name || ''}|${ev.record_id || ''}|${ev.field_name || ''}`
        if (!latestEventByKey[key]) latestEventByKey[key] = ev
      }
      for (const key of changedKeys) {
        const field = versionFields.find((f) => f.key === key)
        if (!field) continue
        const ev = latestEventByKey[eventKey(field)]
        mods[key] = ev?.edited_by_label || snapshot?.created_by_label || 'Unknown editor'
      }
    }

    selectedVersionId.value = sid
    editMode.value = false
    draftValues.value = {}
    opportunity.value = versionOpportunity
    fields.value = versionFields
    modifiedByMap.value = mods
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  }
}

async function switchToLatestVersion() {
  selectedVersionId.value = null
  modifiedByMap.value = {}
  await loadDatabook()
}

watch(
  () => route.params.opportunityId,
  () => {
    loadDatabook()
  },
)

onMounted(() => {
  if (!hasBridge.value) return
  loadDatabook()
})
</script>

<style scoped>
.databook-value-section {
  min-width: 360px;
  max-width: 640px;
  width: 100%;
}

.databook-value {
  text-align: left;
  white-space: pre-wrap;
}
</style>
