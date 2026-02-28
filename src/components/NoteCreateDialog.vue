<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Note</div>
        <div class="text-caption text-grey-7">Title is required. Content and links are optional.</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input v-model="form.title" outlined label="Title *" :disable="loading" />
        <q-input v-model="form.content" outlined type="textarea" autogrow label="Content" :disable="loading" />
        <q-select
          v-model="form.opportunity_id"
          outlined
          label="Opportunity"
          :options="opportunityOptions"
          emit-value
          map-options
          :disable="loading"
        />
        <q-select
          v-model="form.contact_id"
          outlined
          label="Contact"
          :options="contactOptions"
          emit-value
          map-options
          :disable="loading"
        />
        <q-select
          v-model="form.pipeline_id"
          outlined
          label="Pipeline"
          :options="pipelineOptions"
          emit-value
          map-options
          :disable="loading"
        />
        <q-select
          v-model="form.company_id"
          outlined
          label="Company"
          :options="companyOptions"
          emit-value
          map-options
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
const opportunities = ref([])
const contacts = ref([])
const pipelines = ref([])
const companies = ref([])
const form = ref({
  title: '',
  content: '',
  opportunity_id: '',
  contact_id: '',
  pipeline_id: '',
  company_id: '',
})

const opportunityOptions = computed(() =>
  (opportunities.value || []).map((o) => ({
    label: o.opportunity_name || o.Venture_Oppty_Name || o.id,
    value: o.id,
  })),
)
const contactOptions = computed(() =>
  (contacts.value || []).map((c) => ({
    label: c.Name || c.Email || c.id,
    value: c.id,
  })),
)
const pipelineOptions = computed(() =>
  (pipelines.value || []).map((p) => ({
    label: p.name || p.pipeline_id,
    value: p.pipeline_id,
  })),
)
const companyOptions = computed(() =>
  (companies.value || []).map((c) => ({
    label: c.Company_Name || c.id,
    value: c.id,
  })),
)

async function loadReferences() {
  const tasks = []

  if (bridge.value?.opportunities?.list) {
    tasks.push(
      bridge.value.opportunities.list().then((result) => {
        opportunities.value = result?.opportunities || []
      }),
    )
  }
  if (bridge.value?.contacts?.list) {
    tasks.push(
      bridge.value.contacts.list().then((result) => {
        contacts.value = result?.contacts || []
      }),
    )
  }
  if (bridge.value?.pipelines?.list) {
    tasks.push(
      bridge.value.pipelines.list().then((result) => {
        pipelines.value = result?.pipelines || []
      }),
    )
  }
  if (bridge.value?.companies?.list) {
    tasks.push(
      bridge.value.companies.list().then((result) => {
        companies.value = result?.companies || []
      }),
    )
  }

  await Promise.all(tasks)
}

async function submit() {
  if (!bridge.value?.notes?.create) return
  if (!String(form.value.title || '').trim()) {
    $q.notify({ type: 'negative', message: 'Title is required.' })
    return
  }

  loading.value = true
  try {
    const result = await bridge.value.notes.create({ ...form.value })
    emit('created', result)
    open.value = false
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    form.value = {
      title: '',
      content: '',
      opportunity_id: '',
      contact_id: '',
      pipeline_id: '',
      company_id: '',
    }
    await loadReferences()
  },
)
</script>
