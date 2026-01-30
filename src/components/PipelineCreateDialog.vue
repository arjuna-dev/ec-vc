<template>
  <q-dialog v-model="open">
    <q-card style="width: 640px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6">Create Pipeline</div>
        <div class="text-caption text-grey-7">
          Creates a pipeline in the database with the standard 5 stages.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-input v-model="name" autofocus outlined label="Pipeline Name *" :disable="loading" />
          <q-input v-model="dirName" outlined label="Directory Name *" :disable="loading" />
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
const name = ref('')
const dirName = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    name.value = ''
    dirName.value = ''
  },
)

async function submit() {
  if (!bridge.value?.pipelines?.create) return
  const n = String(name.value || '').trim()
  const d = String(dirName.value || '').trim()
  if (!n || !d) return

  loading.value = true
  try {
    const result = await bridge.value.pipelines.create({ name: n, dir_name: d })
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>

