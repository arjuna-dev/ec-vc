<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Company</div>
        <div class="text-caption text-grey-7">Only company name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input
            v-model="form.Company_Name"
            autofocus
            outlined
            label="Company Name *"
            :disable="loading"
          />

          <div v-for="field in fields" :key="field.key" class="col-12 col-md-6">
            <q-input
              v-model="form[field.key]"
              outlined
              :label="field.label"
              :type="field.inputType"
              :disable="loading"
            />
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

const loading = ref(false)

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))

const fields = [
  { key: 'Company_Type', label: 'Company_Type', inputType: 'text' },
  { key: 'One_Liner', label: 'One_Liner', inputType: 'text' },
  { key: 'Status', label: 'Status', inputType: 'text' },
  { key: 'Date_of_Incorporation', label: 'Date_of_Incorporation', inputType: 'text' },
  { key: 'Amount_Raised_AUMs', label: 'Amount_Raised_AUMs', inputType: 'number' },
  { key: 'Rounds_Funds_Count', label: 'Rounds_Funds_Count', inputType: 'number' },
  { key: 'Pax', label: 'Pax', inputType: 'number' },
  { key: 'Website', label: 'Website', inputType: 'text' },
]

const form = ref({})

function resetForm() {
  form.value = {
    id: '',
    Company_Name: '',
    created_at: '',
    updated_at: '',
    Company_Type: '',
    One_Liner: '',
    Status: '',
    Date_of_Incorporation: '',
    Amount_Raised_AUMs: '',
    Rounds_Funds_Count: '',
    Pax: '',
    Website: '',
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    resetForm()
  },
)

async function submit() {
  if (!bridge.value?.companies?.create) return
  const name = String(form.value.Company_Name || '').trim()
  if (!name) return

  loading.value = true
  try {
    const payload = { ...form.value, Company_Name: name }
    const result = await bridge.value.companies.create(payload)
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
