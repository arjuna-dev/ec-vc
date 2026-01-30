<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Contact</div>
        <div class="text-caption text-grey-7">Only name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="form.id" outlined label="ID (optional)" :disable="loading" />
          <q-input v-model="form.Name" autofocus outlined label="Name *" :disable="loading" />
          <q-input v-model="form.created_at" outlined label="created_at" disable />
          <q-input v-model="form.updated_at" outlined label="updated_at" disable />

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

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const loading = ref(false)

const fields = [
  { key: 'Email', label: 'Email', inputType: 'text' },
  { key: 'Phone', label: 'Phone', inputType: 'text' },
  { key: 'LinkedIn', label: 'LinkedIn', inputType: 'text' },
  { key: 'Role', label: 'Role', inputType: 'text' },
  { key: 'Stakeholder_type', label: 'Stakeholder_type', inputType: 'text' },
  { key: 'Closeness_Level', label: 'Closeness_Level', inputType: 'text' },
  { key: 'Comment', label: 'Comment', inputType: 'text' },
  { key: 'Expertise', label: 'Expertise', inputType: 'text' },
  { key: 'Degrees_Program', label: 'Degrees_Program', inputType: 'text' },
  { key: 'University', label: 'University', inputType: 'text' },
  { key: 'Credentials', label: 'Credentials', inputType: 'text' },
  { key: 'Tenure_at_Firm_yrs', label: 'Tenure_at_Firm_yrs', inputType: 'number' },
  { key: 'Country_based', label: 'Country_based', inputType: 'text' },
]

const form = ref({})

function resetForm() {
  form.value = {
    id: '',
    Name: '',
    created_at: '',
    updated_at: '',
    Email: '',
    Phone: '',
    LinkedIn: '',
    Role: '',
    Stakeholder_type: '',
    Closeness_Level: '',
    Comment: '',
    Expertise: '',
    Degrees_Program: '',
    University: '',
    Credentials: '',
    Tenure_at_Firm_yrs: '',
    Country_based: '',
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) resetForm()
  },
)

async function submit() {
  if (!bridge.value?.contacts?.create) return
  const name = String(form.value.Name || '').trim()
  if (!name) return

  loading.value = true
  try {
    const result = await bridge.value.contacts.create({ ...form.value, Name: name })
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
