<template>
  <q-dialog v-model="open">
    <q-card style="width: 620px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6">Create Contact</div>
        <div class="text-caption text-grey-7">Only name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="form.Name" autofocus outlined label="Name *" :disable="loading" />
          <q-input v-model="form.Email" outlined label="Email" :disable="loading" />
          <q-input v-model="form.Phone" outlined label="Phone" :disable="loading" />
          <q-input v-model="form.LinkedIn" outlined label="LinkedIn" :disable="loading" />
          <q-input v-model="form.Role" outlined label="Role" :disable="loading" />
          <q-input v-model="form.Stakeholder_type" outlined label="Stakeholder type" :disable="loading" />
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

const form = ref({
  Name: '',
  Email: '',
  Phone: '',
  LinkedIn: '',
  Role: '',
  Stakeholder_type: '',
})

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    form.value = {
      Name: '',
      Email: '',
      Phone: '',
      LinkedIn: '',
      Role: '',
      Stakeholder_type: '',
    }
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

