<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm page-title-section">
      <div class="col">
        <div class="text-h6">Assistants</div>
        <div class="text-caption text-grey-7">Assistant configurations generated during populate.</div>
      </div>
      <div class="col-auto">
        <q-btn-toggle
          v-model="viewMode"
          dense
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          :options="viewOptions"
        />
      </div>
      <div class="col-auto">
        <q-btn dense flat icon="refresh" :loading="loading" @click="loadAssistants" />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <q-table
      v-if="viewMode === 'table'"
      flat
      bordered
      row-key="assistant_system_prompt_id"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="{ rowsPerPage: 15 }"
    />

    <div v-else class="row q-col-gutter-md assistants-grid">
      <div v-for="assistant in rows" :key="assistant.assistant_system_prompt_id" class="col-12 col-md-6">
        <q-card flat bordered class="assistant-card full-height">
          <q-card-section>
            <div class="assistant-card__title">
              {{ assistant.name || 'Unnamed assistant' }}
              <span class="text-caption text-grey-7">{{ assistant.version }}</span>
            </div>
            <div class="assistant-card__section-label">System Prompt</div>
            <div class="assistant-card__block">{{ assistant.system_prompt || 'No system prompt.' }}</div>
            <div class="assistant-card__section-label">Tools / Functions / Context</div>
            <div class="assistant-card__block">{{ assistant.input_contract || 'None' }}</div>
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
const viewMode = ref('grid')

const viewOptions = [
  { label: 'Grid', value: 'grid', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

const columns = [
  { name: 'name', label: 'Assistant', field: 'name', align: 'left', sortable: true },
  { name: 'version', label: 'Version', field: 'version', align: 'left', sortable: true },
  { name: 'system_prompt', label: 'System Prompt', field: 'system_prompt', align: 'left' },
  { name: 'input_contract', label: 'Tools / Functions / Context', field: 'input_contract', align: 'left' },
]

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

<style scoped>
.assistants-grid {
  align-items: stretch;
}

.assistant-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 18px;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.assistant-card__title {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.assistant-card__section-label {
  margin-top: 12px;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.assistant-card__block {
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
