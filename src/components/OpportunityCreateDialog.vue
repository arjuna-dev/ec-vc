<template>
  <q-dialog v-model="open">
    <q-card style="width: 1080px; max-width: 96vw">
      <q-card-section class="q-px-xl q-pt-lg q-pb-md">
        <div class="text-h6">Create Opportunity</div>
        <div class="text-caption text-grey-7">
          Drop files to start processing automatically.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-px-xl q-py-lg" style="max-height: 72vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-lg">
          <div class="text-subtitle1">Add new artifact</div>
          <div class="text-caption text-grey-7">Drop your artifacts here</div>
          <div
            class="q-pa-xl bg-grey-2 rounded-borders"
            style="border: 2px dashed #9e9e9e"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div class="text-center text-grey-8">
              {{ dragOver ? 'Release to drop' : 'Drag files into this area' }}
            </div>
          </div>

          <q-table
            v-if="ingestStatusRows.length"
            dense
            flat
            bordered
            row-key="fileName"
            :rows="ingestStatusRows"
            :columns="ingestStatusColumns"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template #body-cell-uploadStatus="props">
              <q-td :props="props">
                <q-badge :color="statusColor(props.value)">{{ props.value }}</q-badge>
              </q-td>
            </template>
            <template #body-cell-markdownStatus="props">
              <q-td :props="props">
                <q-badge :color="statusColor(props.value)">{{ props.value }}</q-badge>
              </q-td>
            </template>
            <template #body-cell-extractionStatus="props">
              <q-td :props="props">
                <q-badge :color="statusColor(props.value)">{{ props.value }}</q-badge>
              </q-td>
            </template>
          </q-table>

          <q-banner
            v-if="processingDrop"
            class="bg-blue-1 text-blue-10 processing-floating-banner"
            rounded
          >
            <template #avatar>
              <q-spinner color="primary" size="20px" />
            </template>
            {{ processingMessage || 'Processing dropped files...' }}
          </q-banner>

          <q-separator />

          <div class="row q-col-gutter-xl">
            <div class="col-12 col-md-6 q-gutter-md">
              <div class="text-subtitle1">Company</div>

              <div class="q-gutter-md">
                <q-select
                  v-model="form.company_id"
                  outlined
                  label="Existing Company"
                  :options="companyOptions"
                  :disable="loadingCompanies || loading || processingDrop"
                  emit-value
                  map-options
                >
                  <template #before-options>
                    <q-item
                      clickable
                      class="bg-white"
                      style="position: sticky; top: 0; z-index: 2"
                      @click.stop.prevent="companyDialogOpen = true"
                    >
                      <q-item-section avatar>
                        <q-icon name="add" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Create new company</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-separator />
                  </template>
                </q-select>

                <div class="row items-center q-gutter-sm">
                  <q-badge v-if="isUsingExistingCompany" color="positive">Existing record</q-badge>
                  <q-btn
                    v-if="showCompanyToggleButton"
                    flat
                    color="secondary"
                    :label="companyToggleLabel"
                    @click="toggleCompanySource"
                  />
                </div>

                <q-input
                  v-for="field in companyFields"
                  :key="field.key"
                  v-model="companyForm[field.key]"
                  outlined
                  :label="field.label"
                  :type="field.inputType"
                  :disable="loading || processingDrop || isUsingExistingCompany"
                  :input-class="fieldInputClass('company', field.key)"
                />
              </div>
            </div>

            <div class="col-12 col-md-6 q-gutter-md">
              <div class="text-subtitle1">Opportunity</div>

              <div class="q-gutter-md">
                <q-input
                  :model-value="generatedOpportunityName"
                  outlined
                  label="Opportunity Name (auto)"
                  readonly
                  disable
                />

                <q-select
                  v-model="form.kind"
                  outlined
                  label="Opportunity Kind *"
                  :options="kindOptions"
                  :disable="loading || selectedCompanyIsAssetManager || processingDrop"
                  emit-value
                  map-options
                />
                <div v-if="selectedCompanyIsAssetManager" class="text-caption text-grey-7">
                  Selected company is <b>Asset Manager</b>, so kind is forced to <b>fund</b>.
                </div>

                <q-input
                  v-for="field in opportunityFields"
                  :key="field.key"
                  v-model="form[field.key]"
                  outlined
                  :label="field.label"
                  :type="field.inputType"
                  :disable="loading || processingDrop"
                  :input-class="fieldInputClass('opportunity', field.key)"
                />
              </div>
            </div>
          </div>

          <q-separator />

          <div class="q-gutter-md">
            <div class="text-subtitle1">Primary Contact</div>
            <q-input
              v-for="field in contactFields"
              :key="field.key"
              v-model="contactForm[field.key]"
              outlined
              :label="field.label"
              :type="field.inputType"
              :disable="loading || processingDrop"
              :input-class="fieldInputClass('contact', field.key)"
            />
          </div>

          <q-separator v-if="assistantProposal.system_prompt" />

          <q-card v-if="assistantProposal.system_prompt" flat bordered>
            <q-card-section>
              <div class="text-subtitle1">Assistant Proposal</div>
              <div class="text-body2"><b>Name:</b> {{ assistantProposal.name || 'Assistant' }}</div>
              <div class="text-body2 q-mt-xs"><b>System prompt:</b></div>
              <div class="text-caption" style="white-space: pre-wrap">{{ assistantProposal.system_prompt }}</div>
              <div class="text-body2 q-mt-sm"><b>Tools:</b> {{ (assistantProposal.tools || []).join(', ') || 'None' }}</div>
              <div class="text-body2"><b>Functions:</b> {{ (assistantProposal.functions || []).join(', ') || 'None' }}</div>
              <div class="text-body2"><b>Context:</b> {{ (assistantProposal.context_sources || []).join(', ') || 'None' }}</div>
            </q-card-section>
          </q-card>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-px-xl q-py-md">
        <q-btn flat label="Cancel" :disable="loading || processingDrop" @click="onCancel" />
        <q-btn
          color="primary"
          label="Create"
          :loading="loading"
          :disable="createDisabled"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import CompanyCreateDialog from './CompanyCreateDialog.vue'

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
const processingDrop = ref(false)
const processingMessage = ref('')
const loadingCompanies = ref(false)
const companies = ref([])
const companyDialogOpen = ref(false)
const dragOver = ref(false)
const ingestStatusByFile = ref({})

const extractedCompanyForm = ref(null)
const matchedCompanyMeta = ref(null)
const useExtractedCompany = ref(false)

const generatedNotes = ref([])
const generatedTasks = ref([])
const assistantProposal = ref({})

const draftOpportunityId = ref(null)
const draftArtifactIds = ref([])
const didSubmit = ref(false)

const autofilledFlags = ref({})

const ingestStatusColumns = [
  { name: 'fileName', label: 'File', field: 'fileName', align: 'left' },
  { name: 'uploadStatus', label: 'Copy File', field: 'uploadStatus', align: 'left' },
  { name: 'markdownStatus', label: 'Markdown Generated', field: 'markdownStatus', align: 'left' },
  { name: 'extractionStatus', label: 'Data Extracted', field: 'extractionStatus', align: 'left' },
]

const opportunityFields = [
  { key: 'Round_Stage', label: 'Funding Series', inputType: 'text' },
  { key: 'Type_of_Security', label: 'Type of Security', inputType: 'text' },
  { key: 'Investment_Ask', label: 'Investment Ask', inputType: 'number' },
  { key: 'Round_Amount', label: 'Round Amount', inputType: 'number' },
  { key: 'Hard_Commits', label: 'Hard Commits', inputType: 'number' },
  { key: 'Soft_Commits', label: 'Soft Commits', inputType: 'number' },
  { key: 'Pre_Valuation', label: 'Pre Valuation', inputType: 'number' },
  { key: 'Post_Valuation', label: 'Post Valuation', inputType: 'number' },
  { key: 'Previous_Post', label: 'Previous Post', inputType: 'number' },
  { key: 'First_Close_Date', label: 'First Close Date', inputType: 'text' },
  { key: 'Next_Close_Date', label: 'Next Close Date', inputType: 'text' },
  { key: 'Final_Close_Date', label: 'Final Close Date', inputType: 'text' },
  { key: 'Pipeline_Stage', label: 'Pipeline Stage', inputType: 'text' },
  { key: 'Pipeline_Status', label: 'Pipeline Status', inputType: 'text' },
  { key: 'Raising_Status', label: 'Raising Status', inputType: 'text' },
]

const companyFields = [
  { key: 'Company_Name', label: 'Company Name', inputType: 'text' },
  { key: 'Company_Type', label: 'Company Type', inputType: 'text' },
  { key: 'One_Liner', label: 'One Liner', inputType: 'text' },
  { key: 'Status', label: 'Company Status', inputType: 'text' },
  { key: 'Date_of_Incorporation', label: 'Date of Incorporation', inputType: 'text' },
  { key: 'Amount_Raised_AUMs', label: 'Amount Raised / AUMs', inputType: 'number' },
  { key: 'Pax', label: 'Pax', inputType: 'number' },
  { key: 'Updates', label: 'Updates', inputType: 'text' },
  { key: 'Website', label: 'Website', inputType: 'text' },
]

const contactFields = [
  { key: 'Name', label: 'Contact Name', inputType: 'text' },
  { key: 'Personal_Email', label: 'Personal Email', inputType: 'email' },
  { key: 'Professional_Email', label: 'Professional Email', inputType: 'email' },
  { key: 'Phone', label: 'Contact Phone', inputType: 'text' },
  { key: 'LinkedIn', label: 'LinkedIn', inputType: 'text' },
  { key: 'Country_based', label: 'Country Based', inputType: 'text' },
]

const form = ref({})
const companyForm = ref({})
const contactForm = ref({})

const companyOptions = computed(() =>
  [
    { label: '-', value: null },
    ...(companies.value || [])
      .filter((c) => c?.Company_Name)
      .map((c) => ({
        label: `${c.Company_Name}${c?.Company_Type ? ` (${c.Company_Type})` : ''}`,
        value: c.id,
      })),
  ],
)

const kindOptions = [
  { label: 'Round', value: 'round' },
  { label: 'Fund', value: 'fund' },
]

const selectedCompany = computed(
  () => (companies.value || []).find((c) => c?.id === form.value?.company_id) || null,
)
const selectedCompanyIsAssetManager = computed(
  () => String(selectedCompany.value?.Company_Type || '').toLowerCase() === 'asset manager',
)
const isUsingExistingCompany = computed(() => Boolean(form.value?.company_id) && !useExtractedCompany.value)
const showCompanyToggleButton = computed(() => Boolean(matchedCompanyMeta.value?.id))
const companyToggleLabel = computed(() =>
  useExtractedCompany.value ? 'Use existing company instead' : 'Use extracted data instead',
)

const ingestStatusRows = computed(() => Object.values(ingestStatusByFile.value || {}))

const createDisabled = computed(() => {
  if (loading.value || processingDrop.value) return true
  const hasCompany = String(companyForm.value.Company_Name || '').trim().length > 0 || !!form.value.company_id
  const hasContact = String(contactForm.value.Name || '').trim().length > 0
  return !hasCompany && !hasContact
})

const generatedOpportunityName = computed(() => {
  const base =
    String(companyForm.value.Company_Name || '').trim() ||
    String(contactForm.value.Name || '').trim() ||
    'Opportunity'
  const series = String(form.value.Round_Stage || '').trim() || 'Unknown_Series'
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = String(now.getFullYear())
  return `${dd}_${mm}_${yyyy}_${base.replace(/\s+/g, '_')}_${series.replace(/\s+/g, '_')}`
})

function resetForms() {
  form.value = {
    company_id: null,
    kind: 'round',
    Round_Stage: '',
    Type_of_Security: '',
    Investment_Ask: '',
    Round_Amount: '',
    Hard_Commits: '',
    Soft_Commits: '',
    Pre_Valuation: '',
    Post_Valuation: '',
    Previous_Post: '',
    First_Close_Date: '',
    Next_Close_Date: '',
    Final_Close_Date: '',
    Pipeline_Stage: '',
    Pipeline_Status: '',
    Raising_Status: '',
  }
  companyForm.value = {
    Company_Name: '',
    Company_Type: '',
    One_Liner: '',
    Status: '',
    Date_of_Incorporation: '',
    Amount_Raised_AUMs: '',
    Pax: '',
    Updates: '',
    Website: '',
  }
  contactForm.value = {
    Name: '',
    Personal_Email: '',
    Professional_Email: '',
    Phone: '',
    LinkedIn: '',
    Country_based: '',
  }
}

function resetTransientState() {
  dragOver.value = false
  matchedCompanyMeta.value = null
  extractedCompanyForm.value = null
  useExtractedCompany.value = false
  generatedNotes.value = []
  generatedTasks.value = []
  assistantProposal.value = {}
  ingestStatusByFile.value = {}
  processingMessage.value = ''
  draftOpportunityId.value = null
  draftArtifactIds.value = []
  autofilledFlags.value = {}
}

async function loadCompanies() {
  if (!bridge.value?.companies?.list) return
  loadingCompanies.value = true
  try {
    const result = await bridge.value.companies.list()
    companies.value = result?.companies || []
  } finally {
    loadingCompanies.value = false
  }
}

async function onCompanyCreated(company) {
  await loadCompanies()
  if (company?.id) form.value.company_id = company.id
}

function stripHumanVerify(value) {
  return String(value || '')
    .replaceAll('[[HUMAN_VERIFY]]', '')
    .replaceAll('[[/HUMAN_VERIFY]]', '')
    .replaceAll('[HUMAN_VERIFY]', '')
    .replaceAll('[/HUMAN_VERIFY]', '')
    .trim()
}

function markAutofilled(section, key) {
  autofilledFlags.value[`${section}.${key}`] = true
}

function fieldInputClass(section, key) {
  return autofilledFlags.value[`${section}.${key}`] ? 'ec-autofilled-field' : ''
}

function initStatusForFiles(files = []) {
  ingestStatusByFile.value = Object.fromEntries(
    files.map((f) => [
      f.name,
      {
        fileName: f.name,
        uploadStatus: 'pending',
        markdownStatus: 'pending',
        extractionStatus: 'pending',
      },
    ]),
  )
}

function updateStatusForAllFiles(partial = {}) {
  const next = { ...ingestStatusByFile.value }
  for (const [key, row] of Object.entries(next)) {
    next[key] = { ...row, ...partial }
  }
  ingestStatusByFile.value = next
}

function lowerBaseName(fileName) {
  const name = String(fileName || '').trim().toLowerCase()
  if (!name) return ''
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

async function findExistingDroppedFiles(files = []) {
  if (!bridge.value?.artifacts?.list) return { existingNames: [], bothExist: false }
  const result = await bridge.value.artifacts.list()
  const artifacts = Array.isArray(result?.artifacts) ? result.artifacts : []

  const rawNames = new Set(
    artifacts
      .filter((a) => String(a?.artifact_type || '').toLowerCase() === 'raw')
      .map((a) => String(a?.fs_path || '').split('/').pop()?.toLowerCase())
      .filter(Boolean),
  )
  const llmNames = new Set(
    artifacts
      .filter((a) => String(a?.artifact_type || '').toLowerCase() === 'llm-ready')
      .map((a) => String(a?.fs_path || '').split('/').pop()?.toLowerCase())
      .filter(Boolean),
  )

  const existingNames = []
  let bothExist = false
  for (const file of files) {
    const rawName = String(file?.name || '').trim().toLowerCase()
    if (!rawName) continue
    const expectedMd = `${lowerBaseName(rawName)}.md`
    const hasRaw = rawNames.has(rawName)
    const hasMd = llmNames.has(expectedMd)
    if (hasRaw || hasMd) existingNames.push(String(file?.name || '').trim())
    if (hasRaw && hasMd) bothExist = true
  }

  return { existingNames, bothExist }
}

function applySuggestedValues(suggested = {}) {
  for (const [key, value] of Object.entries(suggested?.opportunity || {})) {
    if (!Object.prototype.hasOwnProperty.call(form.value, key)) continue
    form.value[key] = value == null ? '' : stripHumanVerify(value)
    markAutofilled('opportunity', key)
  }
  for (const [key, value] of Object.entries(suggested?.company || {})) {
    if (!Object.prototype.hasOwnProperty.call(companyForm.value, key)) continue
    companyForm.value[key] = value == null ? '' : stripHumanVerify(value)
    markAutofilled('company', key)
  }
  for (const [key, value] of Object.entries(suggested?.contact || {})) {
    if (!Object.prototype.hasOwnProperty.call(contactForm.value, key)) continue
    contactForm.value[key] = value == null ? '' : stripHumanVerify(value)
    markAutofilled('contact', key)
  }
  generatedNotes.value = Array.isArray(suggested?.notes) ? suggested.notes : []
  generatedTasks.value = Array.isArray(suggested?.tasks) ? suggested.tasks : []
  assistantProposal.value = suggested?.assistant || {}
}

function applyMatchedExistingCompany(match = null) {
  if (!match?.company_id || !match?.company) return
  matchedCompanyMeta.value = match.company
  extractedCompanyForm.value = { ...companyForm.value }
  form.value.company_id = match.company_id
  useExtractedCompany.value = false
}

function collectDraftArtifactIds(result) {
  const ids = []
  for (const row of result?.results || []) {
    if (row?.raw?.artifact_id) ids.push(row.raw.artifact_id)
    if (row?.llm_ready?.artifact_id) ids.push(row.llm_ready.artifact_id)
  }
  draftArtifactIds.value = ids
}

async function resolveGeneratedMarkdownPaths(ingestResult) {
  const rows = Array.isArray(ingestResult?.results) ? ingestResult.results : []
  const relPaths = rows
    .map((row) => String(row?.llm_ready?.fs_path || '').trim())
    .filter(Boolean)
  if (!relPaths.length) return []
  if (!bridge.value?.fs?.workspaceRoot) return []

  const workspace = await bridge.value.fs.workspaceRoot()
  const rootPath = String(workspace?.rootPath || '').trim()
  if (!rootPath) return []

  if (bridge.value?.path?.join) {
    return relPaths.map((rel) => bridge.value.path.join(rootPath, rel))
  }

  return relPaths.map((rel) => `${rootPath}/${rel}`)
}

async function processDroppedFiles(files = []) {
  const filePaths = files.map((f) => f.path).filter(Boolean)
  if (!filePaths.length) return

  processingDrop.value = true
  try {
    processingMessage.value = 'Checking if files already exist...'
    const existingCheck = await findExistingDroppedFiles(files)
    if (existingCheck.existingNames.length) {
      const existingSet = new Set(existingCheck.existingNames.map((name) => String(name).toLowerCase()))
      const next = { ...ingestStatusByFile.value }
      for (const file of files) {
        const fileName = String(file?.name || '')
        const key = fileName.toLowerCase()
        const existing = existingSet.has(key)
        const previous = next[fileName] || {
          fileName,
          uploadStatus: 'pending',
          markdownStatus: 'pending',
          extractionStatus: 'pending',
        }
        next[fileName] = {
          ...previous,
          uploadStatus: existing ? 'existing' : 'skipped',
          markdownStatus: existing ? 'existing' : 'skipped',
          extractionStatus: 'skipped',
        }
      }
      ingestStatusByFile.value = next
      const listed = existingCheck.existingNames.join(', ')
      const reason = existingCheck.bothExist ? 'raw and markdown files already exist' : 'files already exist'
      throw new Error(`Skipped extraction: ${reason} for ${listed}.`)
    }

    processingMessage.value = 'Saving artifacts and generating markdown...'
    const ingestResult = await bridge.value.artifacts.ingest({
      filePaths,
    })
    collectDraftArtifactIds(ingestResult)

    processingMessage.value = 'Extracting structured data from generated markdown files...'
    updateStatusForAllFiles({ extractionStatus: 'pending' })
    const markdownPaths = await resolveGeneratedMarkdownPaths(ingestResult)
    if (!markdownPaths.length) {
      throw new Error('No generated markdown files found for extraction.')
    }
    const preview = await bridge.value.autofill.previewFromFiles({ filePaths: markdownPaths })
    applySuggestedValues(preview?.suggested || {})
    applyMatchedExistingCompany(preview?.companyMatch || null)
    updateStatusForAllFiles({ extractionStatus: 'completed' })

    processingMessage.value = 'Files processed successfully.'
    $q.notify({ type: 'positive', message: 'Artifacts ingested and fields populated.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    processingDrop.value = false
    processingMessage.value = ''
  }
}

async function onDrop(e) {
  dragOver.value = false
  const files = Array.from(e?.dataTransfer?.files || [])
  if (!files.length) return
  const summaries = files.map((f) => {
    const p = f?.path || bridge.value?.files?.getPathForFile?.(f) || f?.webkitRelativePath || null
    return { name: f.name, path: p, size: f.size }
  })
  initStatusForFiles(summaries)
  await processDroppedFiles(summaries)
}

function toggleCompanySource() {
  if (!matchedCompanyMeta.value?.id) return
  if (useExtractedCompany.value) {
    form.value.company_id = matchedCompanyMeta.value.id
    useExtractedCompany.value = false
    return
  }
  form.value.company_id = null
  if (extractedCompanyForm.value) companyForm.value = { ...extractedCompanyForm.value }
  useExtractedCompany.value = true
}

function trimPayloadValues(input = {}) {
  const out = {}
  for (const [k, v] of Object.entries(input)) {
    const text = String(v || '').trim()
    if (text.length) out[k] = text
  }
  return out
}

function toSerializable(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

async function ensureCompanySelectionForSubmit() {
  if (!bridge.value?.companies?.create) return form.value.company_id || null
  const existingCompanyId = String(form.value.company_id || '').trim()
  if (existingCompanyId) return existingCompanyId

  const companyPayload = trimPayloadValues(companyForm.value)
  const companyName =
    String(companyPayload.Company_Name || '').trim() || String(contactForm.value.Name || '').trim()
  if (!companyName) return null

  const created = await bridge.value.companies.create({
    ...companyPayload,
    Company_Name: companyName,
    Company_Type: String(companyPayload.Company_Type || '').trim() || 'Other',
  })
  const createdCompanyId = String(created?.id || '').trim() || null
  if (createdCompanyId) {
    form.value.company_id = createdCompanyId
    await loadCompanies()
  }
  return createdCompanyId
}

async function submit() {
  if (
    !bridge.value?.opportunities?.create ||
    !bridge.value?.opportunities?.update ||
    !bridge.value?.artifacts?.linkToOpportunity
  ) {
    return
  }
  if (createDisabled.value) return

  loading.value = true
  try {
    const selectedCompanyId = String(form.value.company_id || '').trim()
    const companyName = String(companyForm.value.Company_Name || '').trim()
    const contactName = String(contactForm.value.Name || '').trim()
    if (!selectedCompanyId && !companyName && !contactName) {
      throw new Error('Company name or Contact name is required.')
    }

    const ensuredCompanyId = await ensureCompanySelectionForSubmit()

    const payload = {
      ...form.value,
      company_id: ensuredCompanyId || undefined,
      id: draftOpportunityId.value || undefined,
      Venture_Oppty_Name: generatedOpportunityName.value,
      company: trimPayloadValues(companyForm.value),
      primary_contact: trimPayloadValues(contactForm.value),
      notes: generatedNotes.value,
      tasks: generatedTasks.value,
      assistant: assistantProposal.value,
    }
    const serializablePayload = toSerializable(payload)

    const result = draftOpportunityId.value
      ? await bridge.value.opportunities.update(serializablePayload)
      : await bridge.value.opportunities.create(serializablePayload)

    if (draftArtifactIds.value.length && result?.id) {
      await bridge.value.artifacts.linkToOpportunity({
        artifactIds: [...draftArtifactIds.value],
        opportunityId: result.id,
        pipelineId: 'pipeline_default',
      })
    }

    emit('created', result)
    didSubmit.value = true
    window.dispatchEvent(new Event('ecvc:opportunities-changed'))
    open.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    loading.value = false
  }
}

async function onCancel() {
  open.value = false
}

function statusColor(value) {
  const v = String(value || '').toLowerCase()
  if (v === 'completed' || v === 'uploaded') return 'green-7'
  if (v === 'existing') return 'blue-7'
  if (v === 'skipped') return 'grey-7'
  if (v === 'error' || v === 'failed') return 'negative'
  return 'orange-7'
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) {
      if (didSubmit.value) {
        resetForms()
        resetTransientState()
        didSubmit.value = false
      }
      return
    }
    await loadCompanies()
  },
)

watch(
  () => form.value.company_id,
  () => {
    if (form.value.company_id) useExtractedCompany.value = false
    if (selectedCompanyIsAssetManager.value) form.value.kind = 'fund'
    const selected = selectedCompany.value
    if (!selected || useExtractedCompany.value) return
    companyForm.value = {
      ...companyForm.value,
      Company_Name: selected.Company_Name || '',
      Company_Type: selected.Company_Type || '',
      One_Liner: selected.One_Liner || '',
      Website: selected.Website || '',
      Status: selected.Status || '',
      Amount_Raised_AUMs: selected.Amount_Raised_AUMs || '',
    }
  },
)

watch(
  () => generatedOpportunityName.value,
  (v) => {
    form.value.Venture_Oppty_Name = v
    markAutofilled('opportunity', 'Venture_Oppty_Name')
  },
  { immediate: true },
)

let offIngestStatus = null
onMounted(() => {
  resetForms()
  resetTransientState()
  didSubmit.value = false

  if (!bridge.value?.artifacts?.onIngestStatus) return
  offIngestStatus = bridge.value.artifacts.onIngestStatus((status) => {
    if (status?.type !== 'progress') {
      const t = status?.type
      const type = t === 'success' ? 'positive' : t === 'error' ? 'negative' : 'info'
      const message = String(status?.message || '').trim()
      if (message) {
        processingMessage.value = message
        $q.notify({ type, message })
      }
      return
    }

    const fileName = String(status?.fileName || '').trim()
    if (!fileName) return
    const previous = ingestStatusByFile.value[fileName] || {
      fileName,
      uploadStatus: 'pending',
      markdownStatus: 'pending',
      extractionStatus: 'pending',
    }
    ingestStatusByFile.value = {
      ...ingestStatusByFile.value,
      [fileName]: {
        ...previous,
        uploadStatus: status.uploadStatus || previous.uploadStatus,
        markdownStatus: status.markdownStatus || previous.markdownStatus,
        extractionStatus: status.extractionStatus || previous.extractionStatus,
      },
    }
    const message = String(status?.message || '').trim()
    if (message) processingMessage.value = message
  })
})

onBeforeUnmount(() => {
  offIngestStatus?.()
  offIngestStatus = null
})
</script>

<style scoped>
.processing-floating-banner {
  position: sticky;
  top: 8px;
  z-index: 20;
  margin-left: auto;
  width: fit-content;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.ec-autofilled-field {
  color: #c62828;
  font-style: italic;
}
</style>
