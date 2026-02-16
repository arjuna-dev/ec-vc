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
        <div class="text-h6 q-mb-xs">Settings</div>
        <div class="text-caption text-grey-7 q-mb-md">
          Configure LLM providers and your editor profile. Values are saved locally in the app database.
        </div>

        <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
          {{ error }}
        </q-banner>

        <q-card bordered flat>
          <q-card-section class="q-gutter-md">
            <div class="text-subtitle2">Editor profile</div>

            <q-input
              v-model="auditUserLabel"
              outlined
              dense
              label="Display name"
              autocomplete="name"
              :disable="loading || saving"
            />

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

            <div class="text-caption text-grey-7">
              UUID is your stable audit identity. Display name can be updated and is captured on each event/snapshot at save time.
            </div>

            <q-separator />

            <div class="text-subtitle2">LLM providers</div>

            <q-input
              v-model="openaiApiKey"
              outlined
              :type="showOpenaiApiKey ? 'text' : 'password'"
              label="OpenAI API Key"
              autocomplete="off"
              spellcheck="false"
              :disable="loading || saving"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showOpenaiApiKey ? 'visibility_off' : 'visibility'"
                  :disable="loading || saving"
                  @click="showOpenaiApiKey = !showOpenaiApiKey"
                />
              </template>
            </q-input>

            <q-input
              v-model="geminiApiKey"
              outlined
              :type="showGeminiApiKey ? 'text' : 'password'"
              label="Gemini API Key"
              autocomplete="off"
              spellcheck="false"
              :disable="loading || saving"
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showGeminiApiKey ? 'visibility_off' : 'visibility'"
                  :disable="loading || saving"
                  @click="showGeminiApiKey = !showGeminiApiKey"
                />
              </template>
            </q-input>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat icon="refresh" label="Reload" :disable="saving" :loading="loading" @click="loadSettings" />
            <q-btn color="primary" icon="save" label="Save" :loading="saving" :disable="loading" @click="saveSettings" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.settings?.get && !!bridge.value?.settings?.set)

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const openaiApiKey = ref('')
const geminiApiKey = ref('')
const auditUserUuid = ref('')
const auditUserLabel = ref('')
const initialAuditUserLabel = ref('')
const showOpenaiApiKey = ref(false)
const showGeminiApiKey = ref(false)

function normalizeInput(value) {
  return String(value || '').trim()
}

async function loadSettings() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.settings.get()
    openaiApiKey.value = result?.openaiApiKey || ''
    geminiApiKey.value = result?.geminiApiKey || ''
    auditUserUuid.value = result?.auditUserUuid || ''
    auditUserLabel.value = result?.auditUserLabel || ''
    initialAuditUserLabel.value = result?.auditUserLabel || ''
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  if (!hasBridge.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      openaiApiKey: normalizeInput(openaiApiKey.value),
      geminiApiKey: normalizeInput(geminiApiKey.value),
    }
    const nextAuditUserLabel = normalizeInput(auditUserLabel.value)
    const previousAuditUserLabel = normalizeInput(initialAuditUserLabel.value)
    if (nextAuditUserLabel !== previousAuditUserLabel) {
      payload.auditUserLabel = nextAuditUserLabel
    }

    const result = await bridge.value.settings.set(payload)
    openaiApiKey.value = result?.openaiApiKey || ''
    geminiApiKey.value = result?.geminiApiKey || ''
    auditUserUuid.value = result?.auditUserUuid || ''
    auditUserLabel.value = result?.auditUserLabel || ''
    initialAuditUserLabel.value = result?.auditUserLabel || ''
    $q.notify({ type: 'positive', message: 'Settings saved' })
  } catch (e) {
    const message = e?.message || String(e)
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
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

onMounted(() => {
  if (!hasBridge.value) return
  loadSettings()
})
</script>
