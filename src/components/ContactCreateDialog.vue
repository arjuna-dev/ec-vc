<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Contact</div>
        <div class="text-caption text-grey-7">Given names are required.</div>
        <div v-if="props.initialData" class="text-caption text-primary q-mt-xs">
          Reviewing extracted contact details in the existing create flow.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="form.id" outlined label="ID (optional)" :disable="loading" />
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.Given_Names" autofocus outlined label="Given Names *" :disable="loading" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.Last_Names" outlined label="Last Names" :disable="loading" />
            </div>
          </div>

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
  initialData: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const loading = ref(false)

const fields = [
  { key: 'Personal_Email', label: 'Personal Email', inputType: 'email' },
  { key: 'Professional_Email', label: 'Professional Email', inputType: 'email' },
  { key: 'Phone', label: 'Phone', inputType: 'text' },
  { key: 'LinkedIn', label: 'LinkedIn', inputType: 'text' },
  { key: 'Country_based', label: 'Country Based', inputType: 'text' },
]

const form = ref({})

function resetForm() {
  form.value = {
    id: '',
    Given_Names: '',
    Last_Names: '',
    Personal_Email: '',
    Professional_Email: '',
    Phone: '',
    LinkedIn: '',
    Country_based: '',
  }

  const initial = props.initialData?.entity || props.initialData || {}
  form.value = {
    ...form.value,
    id: initial.id || form.value.id,
    Given_Names: splitNameParts(initial.Name).givenNames || form.value.Given_Names,
    Last_Names: splitNameParts(initial.Name).lastNames || form.value.Last_Names,
    Personal_Email: initial.Personal_Email || form.value.Personal_Email,
    Professional_Email: initial.Professional_Email || form.value.Professional_Email,
    Phone: initial.Phone || form.value.Phone,
    LinkedIn: initial.LinkedIn || form.value.LinkedIn,
    Country_based: initial.Country_based || form.value.Country_based,
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
  const name = [form.value.Given_Names, form.value.Last_Names].map((value) => String(value || '').trim()).filter(Boolean).join(' ').trim()
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

function splitNameParts(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  return {
    givenNames: parts.slice(0, -1).join(' ') || parts[0] || '',
    lastNames: parts.length > 1 ? parts.slice(-1).join(' ') : '',
  }
}
</script>
