<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">{{ dialogTitle }}</div>
        <div class="text-caption text-grey-7">
          {{ dialogCaption }}
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
          <q-banner
            v-if="isResumeLinkMode"
            class="bg-blue-1 text-blue-10"
            rounded
          >
            This step is only for linking the existing artifact to an opportunity. You can close and return later if
            you are not ready to link it yet.
          </q-banner>
          <q-select
            v-model="opportunityId"
            outlined
            :label="isResumeLinkMode ? 'Link Opportunity' : 'Opportunity *'"
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
          :label="isResumeLinkMode ? 'Link Artifact' : 'Finish'"
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
import {
  createIntakeDraft,
  removeIntakeDraft,
  updateIntakeDraft,
  useIntakeDraftState,
} from 'src/utils/intakeDraftState'

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
const intakeDraftState = useIntakeDraftState()

const loading = ref(false)
const step = ref(1)
const dragOver = ref(false)

const opportunities = ref([])

const opportunityDialogOpen = ref(false)
const DEFAULT_PIPELINE_ID = 'pipeline_default'
const activeDraft = computed(() => {
  const draftId = String(intakeDraftState.activeDraftId || '').trim()
  return draftId ? intakeDraftState.drafts[draftId] || null : null
})
const droppedFiles = computed(() => activeDraft.value?.droppedFiles || [])
const opportunityId = computed({
  get: () => activeDraft.value?.opportunityId || null,
  set: (value) => {
    if (!activeDraft.value?.id) return
    updateIntakeDraft(activeDraft.value.id, {
      opportunityId: value || null,
      stage: value ? 'Quick Review Needed' : activeDraft.value.stage,
    })
  },
})

const opportunityOptions = computed(() =>
  (opportunities.value || []).map((o) => ({
    label: `${o.Company_Name || 'Unknown'}${o.Round_Stage ? ` — ${o.Round_Stage}` : ''}`,
    value: o.id,
  })),
)

const isResumeLinkMode = computed(() => String(activeDraft.value?.resumeMode || '').trim() === 'existing-artifact-link')
const dialogTitle = computed(() => (isResumeLinkMode.value ? 'Continue Artifact Intake' : 'Add new artifacts'))
const dialogCaption = computed(() =>
  isResumeLinkMode.value
    ? 'Resume this artifact at the opportunity-linking step.'
    : 'Drop files first, then select the opportunity.',
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
  if (result?.id && activeDraft.value?.id) {
    updateIntakeDraft(activeDraft.value.id, {
      opportunityId: result.id,
      stage: 'Quick Review Needed',
    })
  }
}

function onDrop(e) {
  dragOver.value = false
  stageDroppedFiles(Array.from(e?.dataTransfer?.files || []))
}

function summarizeDroppedFiles(files = []) {
  return files.map((f) => {
    const p =
      f?.path ||
      bridge.value?.files?.getPathForFile?.(f) ||
      // Fallback (usually empty for dropped files; kept for completeness)
      f?.webkitRelativePath ||
      null
    return { name: f.name, path: p, size: f.size }
  })
}

function stageDroppedFiles(files = []) {
  const normalized = Array.from(files || [])
  if (normalized.length === 0) return
  const summaries = summarizeDroppedFiles(normalized)
  step.value = 1
  createIntakeDraft({
    droppedFiles: summaries,
    opportunityId: null,
    stage: 'Dropped',
  })
}

function isDuplicateFilenameConflict(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('duplicate filename') || message.includes('already exists')
}

async function findExistingDroppedFiles(files = []) {
  if (!bridge.value?.artifacts?.list) return { existingNames: [] }
  const result = await bridge.value.artifacts.list()
  const artifacts = Array.isArray(result?.artifacts) ? result.artifacts : []
  const rawNames = new Set(
    artifacts
      .filter((artifact) => String(artifact?.artifact_type || '').toLowerCase() === 'raw')
      .map((artifact) => String(artifact?.fs_path || '').split('/').pop()?.toLowerCase())
      .filter(Boolean),
  )

  const existingNames = (Array.isArray(files) ? files : [])
    .map((file) => String(file?.name || '').trim())
    .filter((name) => rawNames.has(name.toLowerCase()))

  return { existingNames }
}

function askDuplicateRenameConfirmation() {
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Existing File Found',
      message:
        'A file with the same name already exists. Continue to duplicate the file and save this upload?',
      cancel: { flat: true, label: 'Cancel' },
      ok: { color: 'orange-8', textColor: 'white', label: 'Continue' },
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}

async function ingestArtifactsWithDuplicateHandling(payload, { hasExistingConflict = false } = {}) {
  if (hasExistingConflict) {
    const confirmed = await askDuplicateRenameConfirmation()
    if (!confirmed) throw new Error('Upload cancelled.')
    return bridge.value.artifacts.ingest({
      ...payload,
      duplicateStrategy: 'rename',
    })
  }
  try {
    return await bridge.value.artifacts.ingest(payload)
  } catch (error) {
    if (!isDuplicateFilenameConflict(error)) throw error
    const confirmed = await askDuplicateRenameConfirmation()
    if (!confirmed) throw error
    return bridge.value.artifacts.ingest({
      ...payload,
      duplicateStrategy: 'rename',
    })
  }
}

async function finish() {
  if (!opportunityId.value) return
  if (droppedFiles.value.length === 0) return

  loading.value = true
  try {
    const activeDraftId = activeDraft.value?.id || null
    const resumeArtifactIds = Array.isArray(activeDraft.value?.resumeArtifactIds)
      ? activeDraft.value.resumeArtifactIds.map((artifactId) => String(artifactId || '').trim()).filter(Boolean)
      : []

    if (resumeArtifactIds.length > 0 && bridge.value?.artifacts?.linkToOpportunity) {
      await bridge.value.artifacts.linkToOpportunity({
        artifactIds: resumeArtifactIds,
        opportunityId: opportunityId.value,
        pipelineId: DEFAULT_PIPELINE_ID,
      })
    } else {
      if (!bridge.value?.artifacts?.ingest) return
      const existingCheck = await findExistingDroppedFiles(droppedFiles.value)
      await ingestArtifactsWithDuplicateHandling({
        filePaths: droppedFiles.value.map((f) => f.path),
        pipelineId: DEFAULT_PIPELINE_ID,
        opportunityId: opportunityId.value,
      }, {
        hasExistingConflict: existingCheck.existingNames.length > 0,
      })
    }
    if (activeDraftId) {
      removeIntakeDraft(activeDraftId)
    }
    open.value = false
  } catch {
    // Keep the dialog open and let the downstream intake surface expose the error state.
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) {
      return
    }
    step.value = droppedFiles.value.length > 0 ? 2 : 1
    await loadAll()
  },
)

let offIngestStatus = null

onMounted(() => {
  if (!bridge.value?.artifacts?.onIngestStatus) return
  offIngestStatus = bridge.value.artifacts.onIngestStatus((status) => {
    const t = status?.type
    const message = String(status?.message || '').trim()
    if (t === 'error' && message) {
      console.error(message)
    }
  })
})

onBeforeUnmount(() => {
  offIngestStatus?.()
  offIngestStatus = null
})

defineExpose({
  stageDroppedFiles,
})
</script>
