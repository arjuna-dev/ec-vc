<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Note</div>
        <div class="text-caption text-grey-7">Note name is required. Content is optional.</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="text-caption text-grey-7">
          Note fields are first-order note metadata. In the current schema, notes persist their own metadata but
          do not yet have saved first-level relationship links.
        </div>
        <q-input v-model="form.Note_Name" outlined label="Note Name *" :disable="loading" />
        <q-input
          v-model="form.Note_Content"
          outlined
          type="textarea"
          autogrow
          label="Content"
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

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const $q = useQuasar()

const loading = ref(false)
const form = ref({
  Note_Name: '',
  Note_Content: '',
})

async function submit() {
  if (!bridge.value?.notes?.create) return
  if (!String(form.value.Note_Name || '').trim()) {
    $q.notify({ type: 'negative', message: 'Note name is required.' })
    return
  }

  loading.value = true
  try {
    const result = await bridge.value.notes.create({ ...form.value })
    emit('created', result)
    open.value = false
    $q.notify({ type: 'positive', message: 'Note created.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    form.value = {
      Note_Name: '',
      Note_Content: '',
    }
  },
)
</script>
