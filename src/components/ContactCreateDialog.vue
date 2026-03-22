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
    Name: '',
    Personal_Email: '',
    Professional_Email: '',
    Phone: '',
    LinkedIn: '',
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
