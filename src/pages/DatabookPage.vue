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
        <q-btn
          round
          color="primary"
          :icon="editMode ? 'close' : 'edit'"
          :disable="loading || saving || !fields.length"
          @click="editMode ? cancelEdit() : enterEditMode()"
        />
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
              A display name is required before saving audited changes.
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
import { useRoute } from 'vue-router'

const route = useRoute()

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
    error.value = e?.message || String(e)
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
    const message = e?.message || String(e)
    error.value = message
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
    await refreshActor()
  } catch (e) {
    error.value = e?.message || String(e)
    fields.value = []
  } finally {
    loading.value = false
  }
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
