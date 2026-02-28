<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Assistants</div>
        <div class="text-caption text-grey-7">Assistant configurations generated during populate.</div>
      </div>
      <div class="col-auto">
        <q-btn dense flat icon="refresh" :loading="loading" @click="loadAssistants" />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <div class="row q-col-gutter-md">
      <div v-for="assistant in rows" :key="assistant.assistant_system_prompt_id" class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">{{ assistant.name }} <span class="text-caption text-grey-7">{{ assistant.version }}</span></div>
            <div class="text-caption q-mt-xs" style="white-space: pre-wrap">{{ assistant.system_prompt }}</div>
            <div class="text-caption q-mt-sm"><b>Tools/Functions/Context:</b></div>
            <div class="text-caption" style="white-space: pre-wrap">{{ assistant.input_contract || 'None' }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const rows = ref([])
const loading = ref(false)
const error = ref('')

async function loadAssistants() {
  if (!bridge.value?.assistants?.list) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.assistants.list()
    rows.value = result?.assistants || []
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAssistants)
</script>
