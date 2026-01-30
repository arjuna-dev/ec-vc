<template>
  <q-dialog v-model="open">
    <q-card style="width: 720px; max-width: 94vw">
      <q-card-section>
        <div class="text-h6">Create Fund</div>
        <div class="text-caption text-grey-7">Only fund name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="form.Fund_Oppty_Name" autofocus outlined label="Fund Name *" :disable="loading" />
          <q-input v-model="form.Fund_Type" outlined label="Fund Type" :disable="loading" />
          <q-input v-model="form.Fund_Size_Target" outlined type="number" label="Fund Size Target (USD)" :disable="loading" />
          <q-input v-model="form.Investment_Ask" outlined type="number" label="Investment Ask (USD)" :disable="loading" />
          <q-input v-model="form.Raising_Status" outlined label="Raising Status" :disable="loading" />
          <q-input v-model="form.Pipeline_Status" outlined label="Pipeline Status" :disable="loading" />
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
  Fund_Oppty_Name: '',
  Fund_Type: '',
  Fund_Size_Target: '',
  Investment_Ask: '',
  Raising_Status: '',
  Pipeline_Status: '',
})

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    form.value = {
      Fund_Oppty_Name: '',
      Fund_Type: '',
      Fund_Size_Target: '',
      Investment_Ask: '',
      Raising_Status: '',
      Pipeline_Status: '',
    }
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
    }
    const result = await bridge.value.funds.create(payload)
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>

