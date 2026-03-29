<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Settings requires Electron. Run <code>quasar dev -m electron</code> or
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
          <div class="text-h6 q-mb-xs">Settings</div>
          <div class="text-caption text-grey-7">
            Configure the Owner-side profile and local identity links for this node.
          </div>
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
          {{ error }}
        </q-banner>

        <q-card bordered flat>
          <q-card-section class="q-gutter-md">
            <div class="text-subtitle2">User Profile</div>

            <q-input v-model="form.Name" outlined dense label="Name *" :disable="loading || saving" />
            <q-input
              v-model="form.User_PEmail"
              outlined
              dense
              label="Email *"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Professional_Email"
              outlined
              dense
              label="Professional Email"
              :disable="loading || saving"
            />
            <q-input v-model="form.Phone" outlined dense label="Phone" :disable="loading || saving" />
            <q-input
              v-model="form.LinkedIn"
              outlined
              dense
              label="LinkedIn"
              :disable="loading || saving"
            />
            <q-input
              v-model="form.Country_based"
              outlined
              dense
              label="Country Based"
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
import isEmail from 'validator/lib/isEmail.js'
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
const form = ref({
  Name: '',
  User_PEmail: '',
  Professional_Email: '',
  Phone: '',
  LinkedIn: '',
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
    User_PEmail: '',
    Professional_Email: contact?.Professional_Email || '',
    Phone: contact?.Phone || '',
    LinkedIn: contact?.LinkedIn || '',
    Country_based: contact?.Country_based || '',
  }
}

function mapUserSettingsToForm(result = null) {
  const contact = result?.userContact || null
  const user = result?.user || null
  return {
    ...mapContactToForm(contact),
    User_PEmail: user?.User_PEmail || contact?.Professional_Email || contact?.Personal_Email || '',
  }
}

async function loadUserSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.userSettings.get()
    form.value = mapUserSettingsToForm(result)
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveUserSettings() {
  if (!hasBridge.value) return
  const name = normalizeInput(form.value.Name)
  const email = normalizeInput(form.value.User_PEmail)
  if (!name) {
    const message = 'User name should not be empty'
    error.value = message
    $q.notify({ type: 'negative', message: `Error: ${message}` })
    return
  }
  if (!email) {
    const message = 'User email should not be empty'
    error.value = message
    $q.notify({ type: 'negative', message: `Error: ${message}` })
    return
  }
  if (!isEmail(email)) {
    const message = 'Enter a valid email address'
    error.value = message
    $q.notify({ type: 'negative', message })
    return
  }

  saving.value = true
  error.value = ''
  try {
    const payload = {
      contact: {
        Name: name,
        User_PEmail: email,
        Personal_Email: email,
        Professional_Email: normalizeInput(form.value.Professional_Email),
        Phone: normalizeInput(form.value.Phone),
        LinkedIn: normalizeInput(form.value.LinkedIn),
        Country_based: normalizeInput(form.value.Country_based),
      },
    }
    const result = await bridge.value.userSettings.set(payload)
    form.value = mapUserSettingsToForm(result)
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

onMounted(() => {
  if (!hasBridge.value) return
  loadUserSettings()
})
</script>
