<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        User Settings requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="page-title-section">
          <div class="text-h6 q-mb-xs">User Settings</div>
          <div class="text-caption text-grey-7">
            Configure the local app user profile. Saving creates a contact and links it as current
            user.
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
          {{ error }}
        </q-banner>

        <q-card bordered flat>
          <q-card-section class="q-gutter-md">
            <q-input
              :model-value="auditUserUuid"
              outlined
              dense
              readonly
              label="User UUID (read-only)"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  icon="content_copy"
                  :disable="!auditUserUuid || loading || saving"
                  @click="copyUserUuid"
                />
              </template>
            </q-input>

            <q-separator />

            <div class="text-subtitle2">Contact Profile</div>

            <q-input v-model="form.Name" outlined dense label="Name *" :disable="loading || saving" />
            <q-input v-model="form.created_at" outlined dense label="created_at" readonly />
            <q-input v-model="form.updated_at" outlined dense label="updated_at" readonly />

            <q-input v-model="form.Email" outlined dense label="Email" :disable="loading || saving" />
            <q-input v-model="form.Phone" outlined dense label="Phone" :disable="loading || saving" />
            <q-input
              v-model="form.LinkedIn"
              outlined
              dense
              label="LinkedIn"
              :disable="loading || saving"
            />
            <q-input v-model="form.Role" outlined dense label="Role" :disable="loading || saving" />
            <q-input
              v-model="form.Stakeholder_type"
              outlined
              dense
              label="Stakeholder_type"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Closeness_Level"
              outlined
              dense
              label="Closeness_Level"
              :disable="loading || saving"
            />
            <q-input v-model="form.Comment" outlined dense label="Comment" :disable="loading || saving" />
            <q-input
              v-model="form.Expertise"
              outlined
              dense
              label="Expertise"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Degrees_Program"
              outlined
              dense
              label="Degrees_Program"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.University"
              outlined
              dense
              label="University"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Credentials"
              outlined
              dense
              label="Credentials"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Tenure_at_Firm_yrs"
              outlined
              dense
              label="Tenure_at_Firm_yrs"
              type="number"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Country_based"
              outlined
              dense
              label="Country_based"
              :disable="loading || saving"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <B10Button
              variant="subtle"
              icon-start="refresh"
              label="Reload"
              :disable="saving"
              :loading="loading"
              @click="loadUserSettings"
            />
            <B10Button
              variant="primary"
              icon-start="save"
              label="Save User"
              :loading="saving"
              :disable="loading"
              @click="saveUserSettings"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import B10Button from 'src/components/buttons/B10Button.vue'

const $q = useQuasar()

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.userSettings?.get && !!bridge.value?.userSettings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const auditUserUuid = ref('')
const form = ref({
  Name: '',
  created_at: '',
  updated_at: '',
  Email: '',
  Phone: '',
  LinkedIn: '',
  Role: '',
  Stakeholder_type: '',
  Closeness_Level: '',
  Comment: '',
  Expertise: '',
  Degrees_Program: '',
  University: '',
  Credentials: '',
  Tenure_at_Firm_yrs: '',
  Country_based: '',
})

function normalizeIpcErrorMessage(err) {
  const raw = String(err?.message || err || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

function normalizeInput(value) {
  return String(value || '').trim()
}

function mapContactToForm(contact = null) {
  return {
    Name: contact?.Name || '',
    created_at: contact?.created_at || '',
    updated_at: contact?.updated_at || '',
    Email: contact?.Email || '',
    Phone: contact?.Phone || '',
    LinkedIn: contact?.LinkedIn || '',
    Role: contact?.Role || '',
    Stakeholder_type: contact?.Stakeholder_type || '',
    Closeness_Level: contact?.Closeness_Level || '',
    Comment: contact?.Comment || '',
    Expertise: contact?.Expertise || '',
    Degrees_Program: contact?.Degrees_Program || '',
    University: contact?.University || '',
    Credentials: contact?.Credentials || '',
    Tenure_at_Firm_yrs: contact?.Tenure_at_Firm_yrs == null ? '' : String(contact.Tenure_at_Firm_yrs),
    Country_based: contact?.Country_based || '',
  }
}

async function loadUserSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.userSettings.get()
    auditUserUuid.value = result?.auditUserUuid || ''
    form.value = mapContactToForm(result?.userContact || null)
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveUserSettings() {
  if (!hasBridge.value) return
  const name = normalizeInput(form.value.Name)
  if (!name) {
    const message = 'User name should not be empty'
    error.value = message
    $q.notify({ type: 'negative', message: `Error: ${message}` })
    return
  }

  saving.value = true
  error.value = ''
  try {
    const payload = {
      contact: {
        Name: name,
        Email: normalizeInput(form.value.Email),
        Phone: normalizeInput(form.value.Phone),
        LinkedIn: normalizeInput(form.value.LinkedIn),
        Role: normalizeInput(form.value.Role),
        Stakeholder_type: normalizeInput(form.value.Stakeholder_type),
        Closeness_Level: normalizeInput(form.value.Closeness_Level),
        Comment: normalizeInput(form.value.Comment),
        Expertise: normalizeInput(form.value.Expertise),
        Degrees_Program: normalizeInput(form.value.Degrees_Program),
        University: normalizeInput(form.value.University),
        Credentials: normalizeInput(form.value.Credentials),
        Tenure_at_Firm_yrs: normalizeInput(form.value.Tenure_at_Firm_yrs),
        Country_based: normalizeInput(form.value.Country_based),
      },
    }
    const result = await bridge.value.userSettings.set(payload)
    auditUserUuid.value = result?.auditUserUuid || ''
    form.value = mapContactToForm(result?.userContact || null)
    globalThis?.dispatchEvent?.(new Event('ecvc:user-label-changed'))
    $q.notify({ type: 'positive', message: 'User settings saved' })
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    saving.value = false
  }
}

async function copyUserUuid() {
  if (!auditUserUuid.value) return
  try {
    await navigator.clipboard.writeText(auditUserUuid.value)
    $q.notify({ type: 'positive', message: 'User UUID copied' })
  } catch (e) {
    $q.notify({ type: 'negative', message: normalizeIpcErrorMessage(e) })
  }
}

onMounted(() => {
  if (!hasBridge.value) return
  loadUserSettings()
})
</script>
