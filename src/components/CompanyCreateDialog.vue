<template>
  <q-dialog v-model="open">
    <q-card style="width: 520px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6">Create Company</div>
        <div class="text-caption text-grey-7">Only company name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit">
          <q-input v-model="companyName" autofocus outlined label="Company Name *" :disable="loading" />
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

const companyName = ref('')
const loading = ref(false)

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))

watch(
  () => props.modelValue,
  (v) => {
    if (v) companyName.value = ''
  },
)

async function submit() {
  if (!bridge.value?.companies?.create) return
  const name = String(companyName.value || '').trim()
  if (!name) return

  loading.value = true
  try {
    const result = await bridge.value.companies.create({ Company_Name: name })
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>
