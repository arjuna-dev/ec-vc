<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Company</div>
        <div class="text-caption text-grey-7">Company name and type are required.</div>
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

          <q-select
            v-model="form.Company_Type"
            outlined
            label="Company Type *"
            :options="companyTypeOptions"
            emit-value
            map-options
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

      <q-card-actions align="right" class="ec-button-group ec-button-group--end">
        <q-btn flat label="Cancel" :disable="loading" @click="open = false" />
        <q-btn color="primary" label="Create" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const $q = useQuasar()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const companyTypeOptions = [
  { label: 'Venture', value: 'Venture' },
  { label: 'Corporation', value: 'Corporation' },
  { label: 'Asset Manager', value: 'Asset Manager' },
  { label: 'Academia', value: 'Academia' },
  { label: 'Government', value: 'Government' },
  { label: 'Other', value: 'Other' },
]

const fields = [
  { key: 'One_Liner', label: 'One_Liner', inputType: 'text' },
  { key: 'Status', label: 'Status', inputType: 'text' },
  { key: 'Date_of_Incorporation', label: 'Date_of_Incorporation', inputType: 'text' },
  { key: 'Amount_Raised_AUMs', label: 'Amount_Raised_AUMs', inputType: 'number' },
  { key: 'Rounds_Opportunities_Count', label: 'Rounds_Opportunities_Count', inputType: 'number' },
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
    Rounds_Opportunities_Count: '',
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
  const companyType = String(form.value.Company_Type || '').trim()
  if (!name) {
    $q.notify({ type: 'negative', message: 'Company Name is required.' })
    return
  }
  if (!companyType) {
    $q.notify({ type: 'negative', message: 'Company Type is required.' })
    return
  }

  loading.value = true
  try {
    const payload = { ...form.value, Company_Name: name, Company_Type: companyType }
    const result = await bridge.value.companies.create(payload)
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
