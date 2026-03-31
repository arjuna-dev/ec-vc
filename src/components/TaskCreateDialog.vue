<template>
  <q-dialog v-model="open">
    <q-card style="width: 760px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Task</div>
        <div class="text-caption text-grey-7">Task name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="text-caption text-grey-7">
          Task fields are first-order task metadata. Relationship fields below link this task to other canonical
          records.
        </div>
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

        <q-separator />

        <div class="text-subtitle2">Relationships</div>
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
        <q-select
          v-model="form.parent_task_ids"
          outlined
          label="Parent Tasks"
          :options="parentTaskOptions"
          multiple
          emit-value
          map-options
          use-input
          use-chips
          input-debounce="0"
          :disable="loading"
          @filter="(value, update) => filterOptions(value, update, 'task')"
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
const contacts = ref([])
const companies = ref([])
const opportunities = ref([])
const projects = ref([])
const tasks = ref([])
const filteredCompanies = ref([])
const filteredOpportunities = ref([])
const filteredProjects = ref([])
const filteredTasks = ref([])
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
  related_company_ids: [],
  related_opportunity_ids: [],
  related_project_ids: [],
  parent_task_ids: [],
})

const contactOptions = computed(() =>
  (contacts.value || []).map((c) => ({
    label: c.Name || c.Professional_Email || c.Personal_Email || c.id,
    value: c.id,
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
const projectOptions = computed(() =>
  (filteredProjects.value || []).map((project) => ({
    label: String(project?.name || project?.Project_Name || project?.pipeline_id || '').trim(),
    value: String(project?.pipeline_id || project?.id || '').trim(),
  })),
)
const parentTaskOptions = computed(() =>
  (filteredTasks.value || []).map((task) => ({
    label: buildTaskLabel(task),
    value: String(task?.id || '').trim(),
  })),
)
const statusOptions = ['Backlog', 'In Progress', 'Completed', 'Closed']
const priorityOptions = ['Low', 'Mid-Low', 'Mid', 'Mid-High', 'High']

function toSerializable(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

function buildCompanyLabel(company = {}) {
  const name = String(company?.Company_Name || '').trim()
  const type = String(company?.Company_Type || '').trim()
  return type ? `${name} (${type})` : name || String(company?.id || '').trim()
}

function buildOpportunityLabel(opportunity = {}) {
  const name = String(opportunity?.opportunity_name || opportunity?.Venture_Oppty_Name || '').trim()
  const kind = String(opportunity?.kind || '').trim()
  const company = String(opportunity?.Company_Name || '').trim()
  return [name || String(opportunity?.id || '').trim(), kind, company].filter(Boolean).join(' - ')
}

function buildTaskLabel(task = {}) {
  const name = String(task?.Task_Name || '').trim()
  const status = String(task?.Status || task?.Task_Status || '').trim()
  return [name || String(task?.id || '').trim(), status].filter(Boolean).join(' - ')
}

function filterOptions(value, update, type) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    const configs = {
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
      project: {
        source: projects.value,
        assign: (items) => {
          filteredProjects.value = items
        },
        fields: ['pipeline_id', 'name', 'Project_Name'],
      },
      task: {
        source: tasks.value.filter((task) => String(task?.id || '').trim() !== String(form.value?.id || '').trim()),
        assign: (items) => {
          filteredTasks.value = items
        },
        fields: ['id', 'Task_Name', 'Status', 'Task_Status'],
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

async function loadReferences() {
  const [
    contactResult,
    companyResult,
    opportunityResult,
    projectResult,
    taskResult,
  ] = await Promise.all([
    bridge.value?.contacts?.list ? bridge.value.contacts.list() : Promise.resolve({ contacts: [] }),
    bridge.value?.companies?.list ? bridge.value.companies.list() : Promise.resolve({ companies: [] }),
    bridge.value?.opportunities?.list ? bridge.value.opportunities.list() : Promise.resolve({ opportunities: [] }),
    bridge.value?.projects?.list ? bridge.value.projects.list() : Promise.resolve([]),
    bridge.value?.tasks?.list ? bridge.value.tasks.list() : Promise.resolve({ tasks: [] }),
  ])

  contacts.value = contactResult?.contacts || []
  companies.value = companyResult?.companies || []
  opportunities.value = opportunityResult?.opportunities || []
  projects.value = Array.isArray(projectResult?.projects) ? projectResult.projects : []
  tasks.value = taskResult?.tasks || []

  filteredCompanies.value = [...companies.value]
  filteredOpportunities.value = [...opportunities.value]
  filteredProjects.value = [...projects.value]
  filteredTasks.value = tasks.value.filter(
    (task) => String(task?.id || '').trim() !== String(form.value?.id || '').trim(),
  )
}

async function syncTaskRelationships(taskId) {
  if (!bridge.value?.db?.execute) return

  const companyIds = [...new Set((form.value.related_company_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const opportunityIds = [...new Set((form.value.related_opportunity_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const projectIds = [...new Set((form.value.related_project_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]
  const parentTaskIds = [...new Set((form.value.parent_task_ids || []).map((id) => String(id || '').trim()).filter(Boolean))]

  await bridge.value.db.execute('DELETE FROM Tasks_Companies_related_companies WHERE from_id = ?', [taskId])
  for (const companyId of companyIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Tasks_Companies_related_companies (from_id, to_id) VALUES (?, ?)',
      [taskId, companyId],
    )
  }

  await bridge.value.db.execute('DELETE FROM Tasks_Rounds_related_round WHERE from_id = ?', [taskId])
  await bridge.value.db.execute('DELETE FROM Tasks_Funds_related_fund WHERE from_id = ?', [taskId])
  for (const opportunityId of opportunityIds) {
    if (opportunityId.startsWith('fund:')) {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Tasks_Funds_related_fund (from_id, to_id) VALUES (?, ?)',
        [taskId, opportunityId],
      )
    } else {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Tasks_Rounds_related_round (from_id, to_id) VALUES (?, ?)',
        [taskId, opportunityId],
      )
    }
  }

  await bridge.value.db.execute('DELETE FROM Tasks_Projects_projects WHERE from_id = ?', [taskId])
  for (const projectId of projectIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Tasks_Projects_projects (from_id, to_id) VALUES (?, ?)',
      [taskId, projectId],
    )
  }

  await bridge.value.db.execute('DELETE FROM Tasks_Tasks_parent_subtasks WHERE to_id = ?', [taskId])
  for (const parentTaskId of parentTaskIds) {
    await bridge.value.db.execute(
      'INSERT OR IGNORE INTO Tasks_Tasks_parent_subtasks (from_id, to_id) VALUES (?, ?)',
      [parentTaskId, taskId],
    )
  }
}

async function submit() {
  if (!bridge.value?.tasks?.create) return
  if (!String(form.value.Task_Name || '').trim()) {
    $q.notify({ type: 'negative', message: 'Task Name is required.' })
    return
  }

  loading.value = true
  try {
    const result = await bridge.value.tasks.create(toSerializable(form.value))
    if (result?.id) {
      await syncTaskRelationships(result.id)
    }
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
      id: '',
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
      related_company_ids: [],
      related_opportunity_ids: [],
      related_project_ids: [],
      parent_task_ids: [],
    }
    await loadReferences()
  },
)
</script>
