<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Fund</div>
        <div class="text-caption text-grey-7">Only fund name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="form.id" outlined label="ID (optional)" :disable="loading" />
          <q-input
            v-model="form.Fund_Oppty_Name"
            autofocus
            outlined
            label="Fund Name *"
            :disable="loading"
          />
          <q-input v-model="form.created_at" outlined label="created_at" disable />
          <q-input v-model="form.updated_at" outlined label="updated_at" disable />

          <div class="row q-col-gutter-md">
            <div v-for="field in fields" :key="field.key" class="col-12 col-md-6">
              <q-input
                v-model="form[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading"
              />
            </div>
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

const fields = [
  { key: 'Fund_Type', label: 'Fund_Type', inputType: 'text' },
  { key: 'Fund_Size_Target', label: 'Fund_Size_Target', inputType: 'number' },
  { key: 'Investment_Ask', label: 'Investment_Ask', inputType: 'number' },
  { key: 'Hard_Commits', label: 'Hard_Commits', inputType: 'number' },
  { key: 'Soft_Commits', label: 'Soft_Commits', inputType: 'number' },
  { key: 'Initial_Ticket_Size', label: 'Initial_Ticket_Size', inputType: 'number' },
  { key: 'Target_Positions', label: 'Target_Positions', inputType: 'number' },
  { key: 'Follow_on_Reserve', label: 'Follow_on_Reserve', inputType: 'number' },
  { key: 'Investment_Stages', label: 'Investment_Stages', inputType: 'text' },
  { key: 'Company_Stages', label: 'Company_Stages', inputType: 'text' },
  { key: 'First_Close_Date', label: 'First_Close_Date', inputType: 'text' },
  { key: 'Next_Close_Date', label: 'Next_Close_Date', inputType: 'text' },
  { key: 'Final_Close_Date', label: 'Final_Close_Date', inputType: 'text' },
  { key: 'Pipeline_Stage', label: 'Pipeline_Stage', inputType: 'text' },
  { key: 'Pipeline_Status', label: 'Pipeline_Status', inputType: 'text' },
  { key: 'Raising_Status', label: 'Raising_Status', inputType: 'text' },
]

const form = ref({})

function resetForm() {
  form.value = {
    id: '',
    Fund_Oppty_Name: '',
    created_at: '',
    updated_at: '',
    Fund_Type: '',
    Fund_Size_Target: '',
    Investment_Ask: '',
    Hard_Commits: '',
    Soft_Commits: '',
    Initial_Ticket_Size: '',
    Target_Positions: '',
    Follow_on_Reserve: '',
    Investment_Stages: '',
    Company_Stages: '',
    First_Close_Date: '',
    Next_Close_Date: '',
    Final_Close_Date: '',
    Pipeline_Stage: '',
    Pipeline_Status: '',
    Raising_Status: '',
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) resetForm()
  },
)

function normalizeNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

async function submit() {
  if (!bridge.value?.funds?.create) return
  const name = String(form.value.Fund_Oppty_Name || '').trim()
  if (!name) return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      Fund_Oppty_Name: name,
      Fund_Size_Target: normalizeNumberOrNull(form.value.Fund_Size_Target),
      Investment_Ask: normalizeNumberOrNull(form.value.Investment_Ask),
      Hard_Commits: normalizeNumberOrNull(form.value.Hard_Commits),
      Soft_Commits: normalizeNumberOrNull(form.value.Soft_Commits),
      Initial_Ticket_Size: normalizeNumberOrNull(form.value.Initial_Ticket_Size),
      Target_Positions: normalizeNumberOrNull(form.value.Target_Positions),
      Follow_on_Reserve: normalizeNumberOrNull(form.value.Follow_on_Reserve),
    }
    const result = await bridge.value.funds.create(payload)
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
