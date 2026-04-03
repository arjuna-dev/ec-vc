<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create User</div>
        <div class="text-caption text-grey-7">
          User name and primary email are required. ID is optional.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="text-caption text-grey-7">
          User records follow the same metadata-first pattern as the other Files: optional ID, then
          the core fields required to create the record cleanly.
        </div>
        <q-input v-model="form.id" outlined label="ID (optional)" :disable="loading" />
        <q-input v-model="form.User_Name" autofocus outlined label="User Name *" :disable="loading" />
        <q-input
          v-model="form.User_PEmail"
          outlined
          type="email"
          label="Primary Email *"
          :disable="loading"
        />
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
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const loading = ref(false)
const $q = useQuasar()

const form = ref({})

function resetForm() {
  form.value = {
    id: '',
    User_Name: '',
    User_PEmail: '',
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) resetForm()
  },
)

async function submit() {
  if (!bridge.value?.users?.create) return

  const userName = String(form.value.User_Name || '').trim()
  const userEmail = String(form.value.User_PEmail || '').trim()

  if (!userName) {
    $q.notify({ type: 'negative', message: 'User name is required.' })
    return
  }

  if (!userEmail) {
    $q.notify({ type: 'negative', message: 'Primary email is required.' })
    return
  }

  loading.value = true
  try {
    const result = await bridge.value.users.create({
      ...form.value,
      User_Name: userName,
      User_PEmail: userEmail,
    })
    emit('created', result)
    open.value = false
    $q.notify({ type: 'positive', message: 'User created.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    loading.value = false
  }
}
</script>
