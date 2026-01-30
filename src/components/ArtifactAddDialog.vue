<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Add new artifact</div>
        <div class="text-caption text-grey-7">Drop files first, then select pipeline and opportunity.</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="step === 1" class="q-gutter-md">
          <div class="text-subtitle1">Drop your artifacts here</div>
          <div
            class="q-pa-xl bg-grey-2 rounded-borders"
            style="border: 2px dashed #9e9e9e"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div class="text-center text-grey-8">
              {{ dragOver ? 'Release to drop' : 'Drag files into this area' }}
            </div>
          </div>
          <div class="text-caption text-grey-7">(For now this only logs a success message to the console.)</div>

          <q-banner v-if="droppedFiles.length" class="bg-white text-black" rounded>
            <div class="text-caption text-grey-7 q-mb-xs">Staged files:</div>
            <div style="max-height: 120px; overflow: auto">
              <div v-for="f in droppedFiles" :key="f.path" class="text-body2">
                {{ f.name }} ({{ f.size }} bytes)
              </div>
            </div>
          </q-banner>
        </div>

        <div v-else class="q-gutter-md">
          <q-select
            v-model="pipelineId"
            outlined
            label="Pipeline *"
            :options="pipelineOptions"
            emit-value
            map-options
            :disable="loading"
          >
            <template #before-options>
              <q-item
                clickable
                class="bg-white"
                style="position: sticky; top: 0; z-index: 2"
                @click.stop.prevent="createDefaultPipeline"
              >
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Create new pipeline</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
          </q-select>

          <q-select
            v-model="opportunityId"
            outlined
            label="Opportunity *"
            :options="opportunityOptions"
            emit-value
            map-options
            :disable="loading"
          >
            <template #before-options>
              <q-item
                clickable
                class="bg-white"
                style="position: sticky; top: 0; z-index: 2"
                @click.stop.prevent="opportunityDialogOpen = true"
              >
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Create new opportunity</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
          </q-select>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Close" :disable="loading" @click="open = false" />
        <q-btn v-if="step === 2" flat label="Back" :disable="loading" @click="step = 1" />
        <q-btn
          v-if="step === 1"
          color="primary"
          label="Next"
          :disable="droppedFiles.length === 0 || loading"
          :loading="loading"
          @click="step = 2"
        />
        <q-btn
          v-if="step === 2"
          color="primary"
          label="Finish"
          :disable="!pipelineId || !opportunityId || loading"
          :loading="loading"
          @click="finish"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <OpportunityCreateDialog v-model="opportunityDialogOpen" @created="onOpportunityCreated" />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import OpportunityCreateDialog from './OpportunityCreateDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))

const loading = ref(false)
const step = ref(1)
const dragOver = ref(false)
const droppedFiles = ref([])

const pipelines = ref([])
const opportunities = ref([])

const pipelineId = ref(null)
const opportunityId = ref(null)

const opportunityDialogOpen = ref(false)

const pipelineOptions = computed(() =>
  (pipelines.value || []).map((p) => ({
    label: `${p.name}${p.install_status === 'installed' ? '' : ` (${p.install_status})`}`,
    value: p.pipeline_id,
    disable: p.install_status !== 'installed',
  })),
)

const opportunityOptions = computed(() =>
  (opportunities.value || []).map((o) => ({
    label: `${o.Company_Name || 'Unknown'}${o.Round_Stage ? ` — ${o.Round_Stage}` : ''}`,
    value: o.id,
  })),
)

async function loadAll() {
  if (!bridge.value?.pipelines?.list || !bridge.value?.opportunities?.list) return
  loading.value = true
  try {
    const p = await bridge.value.pipelines.list()
    pipelines.value = p?.pipelines || []
    const o = await bridge.value.opportunities.list()
    opportunities.value = o?.opportunities || []
  } finally {
    loading.value = false
  }
}

async function createDefaultPipeline() {
  if (!bridge.value?.pipelines?.install) return
  loading.value = true
  try {
    await bridge.value.pipelines.install('pipeline_default')
    await loadAll()
    pipelineId.value = 'pipeline_default'
  } finally {
    loading.value = false
  }
}

async function onOpportunityCreated(result) {
  await loadAll()
  if (result?.id) opportunityId.value = result.id
}

function onDrop(e) {
  dragOver.value = false
  const files = Array.from(e?.dataTransfer?.files || [])
  if (files.length === 0) return

  const summaries = files.map((f) => ({ name: f.name, path: f.path, size: f.size }))
  droppedFiles.value = summaries

  console.log('[Artifacts] drop success (stage 1)', { files: summaries })
  mockCallLlm(summaries)
}

function mockCallLlm(files) {
  console.log('[Artifacts] mock LLM call triggered', { files })
}

function finish() {
  console.log('[Artifacts] finish (stage 2)', {
    pipelineId: pipelineId.value,
    opportunityId: opportunityId.value,
    files: droppedFiles.value,
  })
  open.value = false
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    step.value = 1
    pipelineId.value = null
    opportunityId.value = null
    droppedFiles.value = []
    await loadAll()
  },
)
</script>
