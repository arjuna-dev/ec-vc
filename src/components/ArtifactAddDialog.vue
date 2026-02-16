<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Add new artifacts</div>
        <div class="text-caption text-grey-7">
          Drop files first, then select the opportunity.
        </div>
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
            <template #no-option>
              <q-item clickable @click.stop.prevent="opportunityDialogOpen = true">
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Create new opportunity</q-item-label>
                </q-item-section>
              </q-item>
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
          :disable="!opportunityId || loading"
          :loading="loading"
          @click="finish"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <OpportunityCreateDialog v-model="opportunityDialogOpen" @created="onOpportunityCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
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
const $q = useQuasar()

const loading = ref(false)
const step = ref(1)
const dragOver = ref(false)
const droppedFiles = ref([])

const opportunities = ref([])

const opportunityId = ref(null)

const opportunityDialogOpen = ref(false)
const DEFAULT_PIPELINE_ID = 'pipeline_default'

const opportunityOptions = computed(() =>
  (opportunities.value || []).map((o) => ({
    label: `${o.Company_Name || 'Unknown'}${o.Round_Stage ? ` — ${o.Round_Stage}` : ''}`,
    value: o.id,
  })),
)

async function loadAll() {
  if (!bridge.value?.opportunities?.list) return
  loading.value = true
  try {
    const o = await bridge.value.opportunities.list()
    opportunities.value = o?.opportunities || []
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

  const summaries = files.map((f) => {
    const p =
      f?.path ||
      bridge.value?.files?.getPathForFile?.(f) ||
      // Fallback (usually empty for dropped files; kept for completeness)
      f?.webkitRelativePath ||
      null
    return { name: f.name, path: p, size: f.size }
  })
  droppedFiles.value = summaries

  $q.notify({
    type: 'info',
    message: 'Files staged. Select an opportunity, then click Finish to start processing.',
  })

  if (summaries.some((s) => !s.path)) {
    $q.notify({
      type: 'negative',
      message:
        'Could not read the local path for one or more dropped files. Please try again (or use a different file).',
    })
  }
}

async function finish() {
  if (!bridge.value?.artifacts?.ingest) return
  if (!opportunityId.value) return
  if (droppedFiles.value.length === 0) return

  loading.value = true
  try {
    await bridge.value.artifacts.ingest({
      filePaths: droppedFiles.value.map((f) => f.path),
      pipelineId: DEFAULT_PIPELINE_ID,
      opportunityId: opportunityId.value,
    })
    open.value = false
  } catch (_e) {
    // Error toasts are emitted by the main process; keep a fallback here.
    $q.notify({
      type: 'negative',
      message: `Could not create the artifact record. Please try again. ${_e?.message || ''}`,
    })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    step.value = 1
    opportunityId.value = null
    droppedFiles.value = []
    await loadAll()
  },
)

let offIngestStatus = null

onMounted(() => {
  if (!bridge.value?.artifacts?.onIngestStatus) return
  offIngestStatus = bridge.value.artifacts.onIngestStatus((status) => {
    const t = status?.type
    const type = t === 'success' ? 'positive' : t === 'error' ? 'negative' : 'info'
    const message = String(status?.message || '').trim()
    if (!message) return
    $q.notify({ type, message })
  })
})

onBeforeUnmount(() => {
  offIngestStatus?.()
  offIngestStatus = null
})
</script>
