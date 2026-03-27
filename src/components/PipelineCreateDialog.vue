<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Project</div>
        <div class="text-caption text-grey-7">Only project name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <div class="text-caption text-grey-7">
            Project fields are first-order project metadata. Relationship fields below link this project to
            other canonical records.
          </div>
          <q-input
            v-model="form.name"
            autofocus
            outlined
            label="Project Name *"
            :disable="loading"
          />

          <q-separator />

          <div class="text-subtitle2">Stages</div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Type a stage name and the next stage field will appear automatically.
          </div>

          <div v-for="(stage, idx) in visibleStages" :key="idx" class="col-12 col-md-6">
            <q-input v-model="stages[idx]" outlined :label="`Stage ${idx + 1}`" :disable="loading">
              <template #append>
                <q-btn
                  flat
                  dense
                  icon="close"
                  :disable="loading || stages.length <= 1"
                  @click="removeStage(idx)"
                />
              </template>
            </q-input>
          </div>

          <q-separator />

          <div class="text-subtitle2">Relationships</div>
          <q-select
            v-model="form.Project_Team_Owner"
            outlined
            label="Project Owner"
            :options="contactOptions"
            emit-value
            map-options
            use-input
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'contact')"
          />
          <q-select
            v-model="form.related_contact_ids"
            outlined
            label="Related Contacts"
            :options="contactOptions"
            multiple
            emit-value
            map-options
            use-input
            use-chips
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'contact')"
          />
          <q-select
            v-model="form.related_company_ids"
            outlined
            label="Related Companies"
            :options="companyOptions"
            multiple
            emit-value
            map-options
            use-input
            use-chips
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'company')"
          />
          <q-select
            v-model="form.related_opportunity_ids"
            outlined
            label="Related Opportunities"
            :options="opportunityOptions"
            multiple
            emit-value
            map-options
            use-input
            use-chips
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'opportunity')"
          />
          <q-select
            v-model="form.related_task_ids"
            outlined
            label="Related Tasks"
            :options="taskOptions"
            multiple
            emit-value
            map-options
            use-input
            use-chips
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'task')"
          />
          <q-select
            v-model="form.related_project_ids"
            outlined
            label="Related Projects"
            :options="projectOptions"
            multiple
            emit-value
            map-options
            use-input
            use-chips
            input-debounce="0"
            :disable="loading"
            @filter="(value, update) => filterOptions(value, update, 'project')"
          />
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
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const $q = useQuasar()

const loading = ref(false)
const contacts = ref([])
const companies = ref([])
const opportunities = ref([])
const tasks = ref([])
const projects = ref([])
const filteredContacts = ref([])
const filteredCompanies = ref([])
const filteredOpportunities = ref([])
const filteredTasks = ref([])
const filteredProjects = ref([])

const form = ref({})
const stages = ref([''])

const visibleStages = computed(() => {
  // show at least 1, then show consecutive filled stages plus one extra empty (up to 50)
  const arr = stages.value || []
  let lastFilledIndex = -1
  for (let i = 0; i < arr.length; i += 1) {
    if (String(arr[i] || '').trim().length) lastFilledIndex = i
  }
  const count = Math.min(Math.max(1, lastFilledIndex + 2), 50)
  return new Array(count).fill(0)
})

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

function ensureDirName() {
  if (String(form.value.dir_name || '').trim().length) return
  const inferred = slugify(form.value.name)
  form.value.dir_name = inferred
}

function resetForm() {
  form.value = {
    pipeline_id: '',
    name: '',
    dir_name: '',
    is_default: false,
    install_status: 'not_installed',
    install_error: '',
    installed_at: '',
    uninstalled_at: '',
    created_at: '',
    updated_at: '',
    Project_Team_Owner: '',
    related_contact_ids: [],
    related_company_ids: [],
    related_opportunity_ids: [],
    related_task_ids: [],
    related_project_ids: [],
  }
  stages.value = ['']
}

function buildContactLabel(contact = {}) {
  const name = String(contact?.Name || '').trim()
  const email = String(contact?.Professional_Email || contact?.Personal_Email || '').trim()
  return [name || String(contact?.id || '').trim(), email].filter(Boolean).join(' - ')
}

function buildCompanyLabel(company = {}) {
  const name = String(company?.Company_Name || '').trim()
  const type = String(company?.Company_Type || '').trim()
  return [name || String(company?.id || '').trim(), type].filter(Boolean).join(' - ')
}

function buildOpportunityLabel(opportunity = {}) {
  const name = String(opportunity?.opportunity_name || opportunity?.Venture_Oppty_Name || '').trim()
  const kind = String(opportunity?.kind || '').trim()
  const company = String(opportunity?.Company_Name || '').trim()
  return [name || String(opportunity?.id || '').trim(), kind, company].filter(Boolean).join(' - ')
}

function buildTaskLabel(task = {}) {
  const name = String(task?.Task_Name || '').trim()
  const status = String(task?.Status || '').trim()
  return [name || String(task?.id || '').trim(), status].filter(Boolean).join(' - ')
}

function buildProjectLabel(project = {}) {
  return String(project?.name || project?.Project_Name || project?.pipeline_id || project?.id || '').trim()
}

function filterOptions(value, update, type) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    const configs = {
      contact: {
        source: contacts.value,
        assign: (items) => {
          filteredContacts.value = items
        },
        fields: ['id', 'Name', 'Professional_Email', 'Personal_Email', 'Phone'],
      },
      company: {
        source: companies.value,
        assign: (items) => {
          filteredCompanies.value = items
        },
        fields: ['id', 'Company_Name', 'Company_Type', 'Website'],
      },
      opportunity: {
        source: opportunities.value,
        assign: (items) => {
          filteredOpportunities.value = items
        },
        fields: ['id', 'opportunity_name', 'Venture_Oppty_Name', 'Company_Name', 'kind'],
      },
      task: {
        source: tasks.value,
        assign: (items) => {
          filteredTasks.value = items
        },
        fields: ['id', 'Task_Name', 'Status'],
      },
      project: {
        source: projects.value.filter(
          (project) => String(project?.pipeline_id || project?.id || '').trim() !== String(form.value?.pipeline_id || '').trim(),
        ),
        assign: (items) => {
          filteredProjects.value = items
        },
        fields: ['pipeline_id', 'name', 'Project_Name'],
      },
    }

    const config = configs[type]
    if (!config) return
    if (!search) {
      config.assign([...config.source])
      return
    }

    config.assign(
      config.source.filter((item) =>
        config.fields
          .map((field) => String(item?.[field] || '').toLowerCase())
          .join(' ')
          .includes(search),
      ),
    )
  })
}

const contactOptions = computed(() =>
  (filteredContacts.value || []).map((contact) => ({
    label: buildContactLabel(contact),
    value: String(contact?.id || '').trim(),
  })),
)

const companyOptions = computed(() =>
  (filteredCompanies.value || []).map((company) => ({
    label: buildCompanyLabel(company),
    value: String(company?.id || '').trim(),
  })),
)

const opportunityOptions = computed(() =>
  (filteredOpportunities.value || []).map((opportunity) => ({
    label: buildOpportunityLabel(opportunity),
    value: String(opportunity?.id || '').trim(),
  })),
)

const taskOptions = computed(() =>
  (filteredTasks.value || []).map((task) => ({
    label: buildTaskLabel(task),
    value: String(task?.id || '').trim(),
  })),
)

const projectOptions = computed(() =>
  (filteredProjects.value || []).map((project) => ({
    label: buildProjectLabel(project),
    value: String(project?.pipeline_id || project?.id || '').trim(),
  })),
)

function removeStage(idx) {
  const arr = [...(stages.value || [])]
  if (arr.length <= 1) return
  arr.splice(idx, 1)
  stages.value = arr.length ? arr : ['']
}

async function loadReferences() {
  const [contactResult, companyResult, opportunityResult, taskResult, projectResult] = await Promise.all([
    bridge.value?.contacts?.list ? bridge.value.contacts.list() : Promise.resolve({ contacts: [] }),
    bridge.value?.companies?.list ? bridge.value.companies.list() : Promise.resolve({ companies: [] }),
    bridge.value?.opportunities?.list ? bridge.value.opportunities.list() : Promise.resolve({ opportunities: [] }),
    bridge.value?.tasks?.list ? bridge.value.tasks.list() : Promise.resolve({ tasks: [] }),
    bridge.value?.pipelines?.list ? bridge.value.pipelines.list() : Promise.resolve({ pipelines: [] }),
  ])

  contacts.value = contactResult?.contacts || []
  companies.value = companyResult?.companies || []
  opportunities.value = opportunityResult?.opportunities || []
  tasks.value = taskResult?.tasks || []
  projects.value = projectResult?.pipelines || []

  filteredContacts.value = [...contacts.value]
  filteredCompanies.value = [...companies.value]
  filteredOpportunities.value = [...opportunities.value]
  filteredTasks.value = [...tasks.value]
  filteredProjects.value = [...projects.value]
}

async function syncProjectRelationships(projectId) {
  if (!bridge.value?.db?.execute) return

  const ownerId = String(form.value.Project_Team_Owner || '').trim() || null
  const relatedContactIds = [...new Set((form.value.related_contact_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const relatedCompanyIds = [...new Set((form.value.related_company_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const relatedOpportunityIds = [...new Set((form.value.related_opportunity_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const relatedTaskIds = [...new Set((form.value.related_task_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const relatedProjectIds = [...new Set((form.value.related_project_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]

  await bridge.value.db.execute(
    `
    INSERT INTO Project_Team (project_id, Project_Team_Owner)
    VALUES (?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      Project_Team_Owner = excluded.Project_Team_Owner,
      updated_at = datetime('now')
  `,
    [projectId, ownerId],
  )

  await bridge.value.db.execute('DELETE FROM Contacts_Projects_project_roles WHERE to_id = ?', [projectId])
  for (const contactId of relatedContactIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Contacts_Projects_project_roles (from_id, to_id) VALUES (?, ?)',
      [contactId, projectId],
    )
  }

  await bridge.value.db.execute('DELETE FROM Projects_Companies_related_companies WHERE from_id = ?', [projectId])
  for (const companyId of relatedCompanyIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Projects_Companies_related_companies (from_id, to_id) VALUES (?, ?)',
      [projectId, companyId],
    )
  }

  await bridge.value.db.execute('DELETE FROM Projects_Rounds_related_round WHERE from_id = ?', [projectId])
  await bridge.value.db.execute('DELETE FROM Projects_Funds_related_fund WHERE from_id = ?', [projectId])
  for (const opportunityId of relatedOpportunityIds) {
    if (opportunityId.startsWith('fund:')) {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Projects_Funds_related_fund (from_id, to_id) VALUES (?, ?)',
        [projectId, opportunityId],
      )
    } else {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Projects_Rounds_related_round (from_id, to_id) VALUES (?, ?)',
        [projectId, opportunityId],
      )
    }
  }

  await bridge.value.db.execute('DELETE FROM Projects_Tasks_has_tasks WHERE from_id = ?', [projectId])
  for (const taskId of relatedTaskIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Projects_Tasks_has_tasks (from_id, to_id) VALUES (?, ?)',
      [projectId, taskId],
    )
  }

  await bridge.value.db.execute('DELETE FROM Projects_Projects_related_projects WHERE from_id = ?', [projectId])
  for (const relatedProjectId of relatedProjectIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Projects_Projects_related_projects (from_id, to_id) VALUES (?, ?)',
      [projectId, relatedProjectId],
    )
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    resetForm()
    await loadReferences()
  },
)

watch(
  () => form.value?.name,
  () => ensureDirName(),
)

watch(
  () => stages.value,
  (arr) => {
    if (!Array.isArray(arr)) return
    // keep internal array length at least visibleStages length
    const need = visibleStages.value.length
    if (arr.length >= need) return
    stages.value = [...arr, ...new Array(need - arr.length).fill('')]
  },
  { deep: true },
)

async function submit() {
  if (!bridge.value?.pipelines?.create) return
  const n = String(form.value.name || '').trim()
  if (!n) return
  ensureDirName()

  loading.value = true
  try {
    const stageNames = (stages.value || [])
      .map((s) => String(s || '').trim())
      .filter((s) => s.length)
      .slice(0, 50)

    const payload = {
      pipeline_id: String(form.value.pipeline_id || '').trim() || undefined,
      name: n,
      dir_name: String(form.value.dir_name || '').trim() || undefined,
      is_default: form.value.is_default ? 1 : 0,
      stages: stageNames,
    }

    const result = await bridge.value.pipelines.create(payload)
    if (result?.pipeline_id) {
      await syncProjectRelationships(result.pipeline_id)
    }
    emit('created', result)
    open.value = false
    $q.notify({ type: 'positive', message: 'Project created.' })
  } finally {
    loading.value = false
  }
}
</script>
