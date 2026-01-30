<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Pipeline</div>
        <div class="text-caption text-grey-7">Only pipeline name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            autofocus
            outlined
            label="Pipeline Name *"
            :disable="loading"
          />

          <q-separator />

          <div class="text-subtitle2">Stages</div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Type a stage name and the next stage field will appear automatically.
          </div>

          <div v-for="(stage, idx) in visibleStages" :key="idx" class="col-12 col-md-6">
            <q-input v-model="stages[idx]" outlined :label="`Stage ${idx + 1}`" :disable="loading">
              <template #append>
                <q-btn
                  flat
                  dense
                  icon="close"
                  :disable="loading || stages.length <= 1"
                  @click="removeStage(idx)"
                />
              </template>
            </q-input>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" :disable="loading" @click="open = false" />
        <q-btn color="primary" label="Create" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))

const loading = ref(false)

const form = ref({})
const stages = ref([''])

const visibleStages = computed(() => {
  // show at least 1, then show consecutive filled stages plus one extra empty (up to 50)
  const arr = stages.value || []
  let lastFilledIndex = -1
  for (let i = 0; i < arr.length; i += 1) {
    if (String(arr[i] || '').trim().length) lastFilledIndex = i
  }
  const count = Math.min(Math.max(1, lastFilledIndex + 2), 50)
  return new Array(count).fill(0)
})

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

function ensureDirName() {
  if (String(form.value.dir_name || '').trim().length) return
  const inferred = slugify(form.value.name)
  form.value.dir_name = inferred
}

function resetForm() {
  form.value = {
    pipeline_id: '',
    name: '',
    dir_name: '',
    is_default: false,
    install_status: 'not_installed',
    install_error: '',
    installed_at: '',
    uninstalled_at: '',
    created_at: '',
    updated_at: '',
  }
  stages.value = ['']
}

function removeStage(idx) {
  const arr = [...(stages.value || [])]
  if (arr.length <= 1) return
  arr.splice(idx, 1)
  stages.value = arr.length ? arr : ['']
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) resetForm()
  },
)

watch(
  () => form.value?.name,
  () => ensureDirName(),
)

watch(
  () => stages.value,
  (arr) => {
    if (!Array.isArray(arr)) return
    // keep internal array length at least visibleStages length
    const need = visibleStages.value.length
    if (arr.length >= need) return
    stages.value = [...arr, ...new Array(need - arr.length).fill('')]
  },
  { deep: true },
)

async function submit() {
  if (!bridge.value?.pipelines?.create) return
  const n = String(form.value.name || '').trim()
  if (!n) return
  ensureDirName()

  loading.value = true
  try {
    const stageNames = (stages.value || [])
      .map((s) => String(s || '').trim())
      .filter((s) => s.length)
      .slice(0, 50)

    const payload = {
      pipeline_id: String(form.value.pipeline_id || '').trim() || undefined,
      name: n,
      dir_name: String(form.value.dir_name || '').trim() || undefined,
      is_default: form.value.is_default ? 1 : 0,
      stages: stageNames,
    }

    const result = await bridge.value.pipelines.create(payload)
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
