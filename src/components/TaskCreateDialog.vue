<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Task</div>
        <div class="text-caption text-grey-7">Task name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input v-model="form.Task_Name" outlined label="Task Name *" :disable="loading" />
        <q-select
          v-model="form.Task_Team_Owner"
          outlined
          label="Task Owner"
          :options="contactOptions"
          emit-value
          map-options
          :disable="loading"
        />
        <q-select
          v-model="form.Task_Team_Assigned"
          outlined
          label="Assigned Team"
          :options="contactOptions"
          multiple
          emit-value
          map-options
          :disable="loading"
        />
        <q-select
          v-model="form.Task_Team_Support"
          outlined
          label="Support Team"
          :options="contactOptions"
          multiple
          emit-value
          map-options
          :disable="loading"
        />
        <q-input
          v-model="form.Task_Summary"
          outlined
          type="textarea"
          autogrow
          label="Summary"
          :disable="loading"
        />
        <q-select
          v-model="form.Task_Status"
          outlined
          label="Status"
          :options="statusOptions"
          :disable="loading"
        />
        <q-select
          v-model="form.Task_Priority_Rank"
          outlined
          label="Priority Rank"
          :options="priorityOptions"
          :disable="loading"
        />
        <q-input v-model="form.Task_Start_Date" outlined label="Start Date" :disable="loading" />
        <q-input v-model="form.Task_Due_Date" outlined label="Due Date" :disable="loading" />
        <q-input v-model="form.Task_End_Date" outlined label="End Date" :disable="loading" />
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
const contacts = ref([])
const form = ref({
  Task_Name: '',
  Task_Summary: '',
  Task_Status: 'Backlog',
  Task_Priority_Rank: 'Mid',
  Task_Start_Date: '',
  Task_Due_Date: '',
  Task_End_Date: '',
  Task_Team_Owner: '',
  Task_Team_Assigned: [],
  Task_Team_Support: [],
})

const contactOptions = computed(() =>
  (contacts.value || []).map((c) => ({
    label: c.Name || c.Professional_Email || c.Personal_Email || c.id,
    value: c.id,
  })),
)
const statusOptions = ['Backlog', 'In Progress', 'Completed', 'Closed']
const priorityOptions = ['Low', 'Mid-Low', 'Mid', 'Mid-High', 'High']

async function loadReferences() {
  if (!bridge.value?.contacts?.list) return
  const result = await bridge.value.contacts.list()
  contacts.value = result?.contacts || []
}

async function submit() {
  if (!bridge.value?.tasks?.create) return
  if (!String(form.value.Task_Name || '').trim()) {
    $q.notify({ type: 'negative', message: 'Task Name is required.' })
    return
  }

  loading.value = true
  try {
    const result = await bridge.value.tasks.create({ ...form.value })
    emit('created', result)
    open.value = false
    $q.notify({ type: 'positive', message: 'Task created.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    form.value = {
      Task_Name: '',
      Task_Summary: '',
      Task_Status: 'Backlog',
      Task_Priority_Rank: 'Mid',
      Task_Start_Date: '',
      Task_Due_Date: '',
      Task_End_Date: '',
      Task_Team_Owner: '',
      Task_Team_Assigned: [],
      Task_Team_Support: [],
    }
    await loadReferences()
  },
)
</script>
