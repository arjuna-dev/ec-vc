<template>
  <q-dialog v-model="open">
    <q-card style="width: 1080px; max-width: 96vw">
      <q-card-section class="q-px-xl q-pt-lg q-pb-md">
        <div class="text-h6">Create {{ entityLabel }}</div>
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

          <div class="opportunity-dialog-sections">
            <section class="opportunity-dialog-section">
              <div class="text-subtitle1">Company</div>

              <div class="opportunity-dialog-section__grid">
                <q-input
                  v-if="companyLinkMode === 'new'"
                  v-model="companyForm.Company_Name"
                  outlined
                  label="Company Name"
                  class="opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.Company_Name }"
                  :disable="loading || processingDrop"
                  :input-class="fieldInputClass('company', 'Company_Name')"
                />

                <q-select
                  v-else
                  v-model="form.company_id"
                  outlined
                  label="Company Name"
                  :options="companyOptions"
                  :disable="loadingCompanies || loading || processingDrop"
                  emit-value
                  map-options
                  option-label="label"
                  option-value="value"
                  options-dense
                  use-input
                  input-debounce="0"
                  class="opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.Company_Name }"
                  @filter="onCompanyOptionFilter"
                />

                <q-option-group
                  v-model="companyLinkMode"
                  inline
                  :options="companyLinkOptions"
                  color="primary"
                  class="opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.companyLinkMode }"
                  :disable="loading || loadingCompanies || processingDrop"
                />

                <div
                  v-if="companyLinkMode === 'existing' && topSuggestedCompanies.length"
                  class="text-caption text-grey-7 opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.bestMatches }"
                >
                  Best matches:
                  {{ topSuggestedCompanies.map((option) => option.label).join(' • ') }}
                </div>

                <q-banner
                  v-if="showCompanyMismatchBanner"
                  class="bg-orange-1 text-orange-10 company-mismatch-banner opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.mismatchBanner }"
                  rounded
                >
                  Existing record and new input do not fully match. Choose which source to use.
                </q-banner>

                <div
                  v-if="showCompanySourceChoices"
                  class="column q-gutter-sm company-source-choice-list opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.sourceChoices }"
                >
                  <div class="text-caption text-grey-7">Resolve flagged company data</div>
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6">
                      <button
                        type="button"
                        class="company-source-choice"
                        :class="{ 'company-source-choice--selected': companySourceChoice === 'input' }"
                        @click="companySourceChoice = 'input'"
                      >
                        <div class="company-source-choice__top">
                          <q-radio
                            :model-value="companySourceChoice"
                            val="input"
                            label="New Input"
                            color="primary"
                          />
                          <q-btn
                            flat
                            round
                            dense
                            icon="open_in_new"
                            aria-label="Preview new input"
                            @click.stop="openCompanyPreview('input')"
                          />
                        </div>
                        <div class="company-source-choice__body">
                          {{ companyInputSummary }}
                        </div>
                      </button>
                    </div>

                    <div class="col-12 col-sm-6">
                      <button
                        type="button"
                        class="company-source-choice"
                        :class="{ 'company-source-choice--selected': companySourceChoice === 'legacy' }"
                        @click="companySourceChoice = 'legacy'"
                      >
                        <div class="company-source-choice__top">
                          <q-radio
                            :model-value="companySourceChoice"
                            val="legacy"
                            label="Legacy Record"
                            color="primary"
                          />
                          <q-btn
                            flat
                            round
                            dense
                            icon="open_in_new"
                            aria-label="Preview legacy record"
                            @click.stop="openCompanyPreview('legacy')"
                          />
                        </div>
                        <div class="company-source-choice__body">
                          {{ selectedCompanySummary }}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <template v-for="field in editableCompanyFields" :key="field.key">
                  <q-select
                    v-if="field.key === 'Company_Type'"
                    v-model="companyForm.Company_Type"
                    outlined
                    emit-value
                    map-options
                    :label="field.label"
                    :options="companyTypeOptions"
                    class="opportunity-dialog-section__field"
                    :class="{
                      'opportunity-dialog-section__field--full': companyFullWidthFieldKeys.has(field.key),
                    }"
                    :style="{ order: companyLayoutOrder[field.key] ?? 50 }"
                    :disable="loading || processingDrop"
                    :input-class="fieldInputClass('company', field.key)"
                  />
                  <q-select
                    v-else-if="field.key === 'Status'"
                    v-model="companyForm.Status"
                    outlined
                    emit-value
                    map-options
                    :label="field.label"
                    :options="companyStatusOptions"
                    class="opportunity-dialog-section__field"
                    :class="{
                      'opportunity-dialog-section__field--full': companyFullWidthFieldKeys.has(field.key),
                    }"
                    :style="{ order: companyLayoutOrder[field.key] ?? 50 }"
                    :disable="loading || processingDrop"
                    :input-class="fieldInputClass('company', field.key)"
                  />
                  <q-input
                    v-else
                    v-model="companyForm[field.key]"
                    outlined
                    :label="field.label"
                    :type="field.inputType"
                    class="opportunity-dialog-section__field"
                    :class="{
                      'opportunity-dialog-section__field--full': companyFullWidthFieldKeys.has(field.key),
                    }"
                    :style="{ order: companyLayoutOrder[field.key] ?? 50 }"
                    :disable="loading || processingDrop"
                    :input-class="fieldInputClass('company', field.key)"
                  />
                </template>
              </div>
            </section>

            <section class="opportunity-dialog-section">
              <div class="text-subtitle1">Opportunity</div>

              <div class="opportunity-dialog-section__grid">
                <q-input
                  v-model="form.Venture_Oppty_Name"
                  outlined
                  :label="`${entityLabel} Name`"
                  :error="Boolean(opportunityNameError)"
                  :error-message="opportunityNameError"
                  class="opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :disable="loading || processingDrop"
                  @update:model-value="markOpportunityNameEdited"
                />

                <q-select
                  v-model="form.kind"
                  outlined
                  label="Opportunity Kind *"
                  :options="kindOptions"
                  class="opportunity-dialog-section__field"
                  :disable="loading || selectedCompanyIsAssetManager || processingDrop || props.lockKind"
                  emit-value
                  map-options
                />
                <div
                  v-if="selectedCompanyIsAssetManager"
                  class="text-caption text-grey-7 opportunity-dialog-section__field"
                >
                  Selected company is <b>Asset Manager</b>, so kind is forced to <b>fund</b>.
                </div>

                <q-input
                  v-for="field in opportunityFields"
                  :key="field.key"
                  v-model="form[field.key]"
                  outlined
                  :label="field.label"
                  :type="field.inputType"
                  class="opportunity-dialog-section__field"
                  :disable="loading || processingDrop"
                  :input-class="fieldInputClass('opportunity', field.key)"
                />
              </div>
            </section>
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
  <q-dialog v-model="companyPreviewDialogOpen">
    <q-card style="width: 420px; max-width: 92vw">
      <q-card-section class="q-px-lg q-pt-lg q-pb-sm">
        <div class="text-h6">{{ companyPreviewTitle }}</div>
        <div class="text-caption text-grey-7">Review the selected company input.</div>
      </q-card-section>

      <q-card-section class="q-px-lg q-pb-md">
        <div class="column q-gutter-sm">
          <div
            v-for="item in companyPreviewRows"
            :key="item.label"
            class="company-preview-row"
          >
            <div class="company-preview-row__label">{{ item.label }}</div>
            <div class="company-preview-row__value">{{ item.value }}</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-px-lg q-py-md">
        <q-btn flat no-caps label="Close" @click="companyPreviewDialogOpen = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialKind: { type: String, default: '' },
  lockKind: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'created'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const $q = useQuasar()
const entityType = computed(() => {
  const normalized = String(props.initialKind || '').trim().toLowerCase()
  return normalized === 'fund' ? 'fund' : 'round'
})
const entityLabel = computed(() => (entityType.value === 'fund' ? 'Fund' : 'Round'))

const loading = ref(false)
const processingDrop = ref(false)
const processingMessage = ref('')
const loadingCompanies = ref(false)
const companies = ref([])
const existingOpportunityNames = ref([])
const companyLinkMode = ref('new')
const companySourceChoice = ref('input')
const companyPreviewDialogOpen = ref(false)
const companyPreviewSource = ref('input')
const companyOptionFilter = ref('')
const dragOver = ref(false)
const ingestStatusByFile = ref({})

const extractedCompanyForm = ref(null)

const generatedNotes = ref([])
const generatedTasks = ref([])
const assistantProposal = ref({})

const draftOpportunityId = ref(null)
const draftArtifactIds = ref([])
const didSubmit = ref(false)
const opportunityNameManuallyEdited = ref(false)

const autofilledFlags = ref({})

const ingestStatusColumns = [
  { name: 'fileName', label: 'File', field: 'fileName', align: 'left' },
  { name: 'uploadStatus', label: 'Copy File', field: 'uploadStatus', align: 'left' },
  { name: 'markdownStatus', label: 'Markdown Generated', field: 'markdownStatus', align: 'left' },
  { name: 'extractionStatus', label: 'Data Extracted', field: 'extractionStatus', align: 'left' },
]

const opportunityFields = computed(() =>
  entityType.value === 'fund'
    ? [
        { key: 'Investment_Ask', label: 'Fund Target Size', inputType: 'number' },
        { key: 'Hard_Commits', label: 'Committed Amounts', inputType: 'number' },
        { key: 'Final_Close_Date', label: 'Close Date', inputType: 'text' },
        { key: 'Raising_Status', label: 'Fund Raising Status', inputType: 'text' },
      ]
    : [
        { key: 'Round_Stage', label: 'Funding Series', inputType: 'text' },
        { key: 'Type_of_Security', label: 'Type of Security', inputType: 'text' },
        { key: 'Investment_Ask', label: 'Investment Ask', inputType: 'number' },
        { key: 'Round_Amount', label: 'Round Amount', inputType: 'number' },
        { key: 'Hard_Commits', label: 'Hard Commits', inputType: 'number' },
        { key: 'Pre_Valuation', label: 'Pre Valuation', inputType: 'number' },
        { key: 'Post_Valuation', label: 'Post Valuation', inputType: 'number' },
        { key: 'Previous_Post', label: 'Previous Post', inputType: 'number' },
        { key: 'Final_Close_Date', label: 'Final Close Date', inputType: 'text' },
        { key: 'Raising_Status', label: 'Round Raising Status', inputType: 'text' },
      ],
)

const companyFields = [
  { key: 'Company_Name', label: 'Company Name', inputType: 'text' },
  { key: 'Company_Type', label: 'Company Type', inputType: 'text' },
  { key: 'Status', label: 'Company Status', inputType: 'text' },
  { key: 'Headquarters_City', label: 'HQ Location', inputType: 'text' },
  { key: 'Date_of_Incorporation', label: 'Date of Incorporation', inputType: 'text' },
  { key: 'Website', label: 'Website', inputType: 'text' },
  { key: 'Pax', label: 'Estimated Pax Count', inputType: 'number' },
  { key: 'One_Liner', label: 'One Liner', inputType: 'text' },
  { key: 'Updates', label: 'Annotations', inputType: 'text' },
]

const contactFields = [
  { key: 'Name', label: 'Contact Name', inputType: 'text' },
  { key: 'Personal_Email', label: 'Personal Email', inputType: 'email' },
  { key: 'Professional_Email', label: 'Professional Email', inputType: 'email' },
  { key: 'Phone', label: 'Contact Phone', inputType: 'text' },
  { key: 'LinkedIn', label: 'LinkedIn', inputType: 'text' },
  { key: 'Country_based', label: 'Country Based', inputType: 'text' },
]

const companyLinkOptions = [
  { label: 'Create New', value: 'new' },
  { label: 'Link Existing', value: 'existing' },
]
const companyStatusOptions = [
  { label: 'On-Going', value: 'ongoing' },
  { label: 'Closed', value: 'closed' },
]
const companyTypeOptions = [
  { label: 'Asset Manager', value: 'Asset Manager' },
  { label: 'Venture', value: 'Venture' },
  { label: 'Corporation', value: 'Corporation' },
  { label: 'Academia', value: 'Academia' },
  { label: 'Government', value: 'Government' },
  { label: 'Other', value: 'Other' },
]
const companyFullWidthFieldKeys = new Set(['One_Liner', 'Updates'])
const companyLayoutOrder = Object.freeze({
  Company_Type: 1,
  Status: 2,
  Company_Name: 3,
  companyLinkMode: 4,
  linkExistingRecord: 5,
  bestMatches: 6,
  mismatchBanner: 7,
  sourceChoices: 8,
  Headquarters_City: 9,
  Date_of_Incorporation: 10,
  Website: 11,
  Pax: 12,
  One_Liner: 13,
  Updates: 14,
})

const form = ref({})
const companyForm = ref({})
const contactForm = ref({})

const editableCompanyFields = computed(() => companyFields.filter((field) => field.key !== 'Company_Name'))

const rankedCompanies = computed(() => {
  const searchBase = normalizeComparisonText(companyOptionFilter.value || companyForm.value.Company_Name)

  return (companies.value || [])
    .filter((company) => company?.Company_Name)
    .map((company) => ({
      company,
      score: scoreCompanyMatch(company, searchBase),
      label: `${company.Company_Name}${company?.Company_Type ? ` (${company.Company_Type})` : ''}`,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.label.localeCompare(right.label)
    })
})

const companyOptions = computed(() => [
  { label: '-', value: null },
  ...rankedCompanies.value.map(({ company, label }) => ({
    label,
    value: company.id,
  })),
])

const topSuggestedCompanies = computed(() => companyOptions.value.filter((option) => option.value).slice(0, 2))

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

const companyComparisonFields = computed(() =>
  companyFields.filter((field) => {
    if (field.key === 'Company_Name') return true
    const inputValue = normalizeComparisonText(companyForm.value?.[field.key])
    const legacyValue = normalizeComparisonText(getCompanyFieldValue(selectedCompany.value, field.key))
    return inputValue || legacyValue
  }),
)

const companyMismatches = computed(() => {
  if (companyLinkMode.value !== 'existing' || !selectedCompany.value) return []

  return companyComparisonFields.value.filter((field) => {
    const inputValue = normalizeComparisonText(companyForm.value?.[field.key])
    const legacyValue = normalizeComparisonText(getCompanyFieldValue(selectedCompany.value, field.key))
    return inputValue && legacyValue && inputValue !== legacyValue
  })
})

const showCompanyMismatchBanner = computed(() => companyMismatches.value.length > 0)
const showCompanySourceChoices = computed(
  () => companyLinkMode.value === 'existing' && Boolean(selectedCompany.value) && companyMismatches.value.length > 0,
)

const companyInputSummary = computed(() => summarizeCompanySource(companyForm.value))
const selectedCompanySummary = computed(() => summarizeCompanySource(selectedCompany.value))
const companyPreviewTitle = computed(() =>
  companyPreviewSource.value === 'legacy' ? 'Legacy Record Input' : 'New Input',
)
const companyPreviewRows = computed(() =>
  companyFields.map((field) => ({
    label: field.label,
    value:
      stripHumanVerify(
        companyPreviewSource.value === 'legacy'
          ? getCompanyFieldValue(selectedCompany.value, field.key)
          : companyForm.value?.[field.key],
      ) || 'No value',
  })),
)

const ingestStatusRows = computed(() => Object.values(ingestStatusByFile.value || {}))

const createDisabled = computed(() => {
  if (loading.value || processingDrop.value) return true
  const hasCompany = String(companyForm.value.Company_Name || '').trim().length > 0 || !!form.value.company_id
  const hasContact = String(contactForm.value.Name || '').trim().length > 0
  return !hasCompany && !hasContact
})

const suggestedOpportunityName = computed(() => {
  const base =
    String(companyForm.value.Company_Name || '').trim() ||
    String(contactForm.value.Name || '').trim() ||
    entityLabel.value
  if (entityType.value === 'fund') {
    return `${base.replace(/\s+/g, '_')}_Fund`
  }
  const series = String(form.value.Round_Stage || '').trim() || 'Unknown_Series'
  return `${base.replace(/\s+/g, '_')}_${series.replace(/\s+/g, '_')}`
})

const normalizedOpportunityName = computed(() => normalizeOpportunityName(form.value.Venture_Oppty_Name))
const opportunityNameError = computed(() => {
  const name = normalizedOpportunityName.value
  if (!name) return `${entityLabel.value} name is required.`
  return isOpportunityNameDuplicate(name) ? `${entityLabel.value} name must be unique.` : ''
})

function resetForms() {
  const normalizedKind = String(props.initialKind || '').trim().toLowerCase()
  const defaultKind = normalizedKind === 'fund' || normalizedKind === 'round' ? normalizedKind : 'round'
  form.value = {
    company_id: null,
    kind: defaultKind,
    Venture_Oppty_Name: '',
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
    Company_Type: entityType.value === 'fund' ? 'Asset Manager' : 'Corporation',
    One_Liner: '',
    Status: 'ongoing',
    Headquarters_City: '',
    Date_of_Incorporation: '',
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
  extractedCompanyForm.value = null
  existingOpportunityNames.value = []
  companyLinkMode.value = 'new'
  companySourceChoice.value = 'input'
  companyOptionFilter.value = ''
  companyPreviewDialogOpen.value = false
  companyPreviewSource.value = 'input'
  opportunityNameManuallyEdited.value = false
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

async function loadExistingOpportunityNames() {
  if (!bridge.value?.opportunities?.list) return
  const result = await bridge.value.opportunities.list()
  const opportunities = Array.isArray(result?.opportunities) ? result.opportunities : []
  existingOpportunityNames.value = opportunities
    .map((row) => normalizeOpportunityName(row?.opportunity_name || row?.Venture_Oppty_Name))
    .filter(Boolean)
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

function normalizeOpportunityName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
}

function isOpportunityNameDuplicate(value) {
  const candidate = normalizeOpportunityName(value).toLowerCase()
  if (!candidate) return false
  return existingOpportunityNames.value.some((existingName) => existingName.toLowerCase() === candidate)
}

function markOpportunityNameEdited() {
  opportunityNameManuallyEdited.value = true
}

function getCompanyFieldValue(source, key) {
  if (!source) return ''
  if (key === 'Headquarters_City') {
    return source.Headquarters_City ?? source.headquarters_city ?? ''
  }
  if (key === 'Pax') {
    return source.Pax ?? source.PAX_Count ?? ''
  }
  return source[key] ?? ''
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
    companyForm.value[key] =
      key === 'Status'
        ? normalizeCompanyStatusValue(value)
        : key === 'Company_Type'
          ? normalizeCompanyTypeValue(value)
        : value == null
          ? ''
          : stripHumanVerify(value)
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
  extractedCompanyForm.value = { ...companyForm.value }
  companyLinkMode.value = 'existing'
  companySourceChoice.value = 'legacy'
  form.value.company_id = match.company_id
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

function onCompanyOptionFilter(value, update) {
  update(() => {
    companyOptionFilter.value = value
  })
}

function openCompanyPreview(source) {
  companyPreviewSource.value = source === 'legacy' ? 'legacy' : 'input'
  companyPreviewDialogOpen.value = true
}

function trimPayloadValues(input = {}) {
  const out = {}
  for (const [k, v] of Object.entries(input)) {
    const text = String(v || '').trim()
    if (text.length) out[k] = text
  }
  return out
}

function normalizeCompanyStatusValue(value) {
  const candidate = stripHumanVerify(value).trim().toLowerCase()
  if (!candidate) return 'ongoing'
  if (['ongoing', 'on-going', 'active', 'open', 'operating', 'live', 'current'].includes(candidate)) {
    return 'ongoing'
  }
  if (['closed', 'inactive', 'shutdown', 'shut down', 'terminated', 'ended'].includes(candidate)) {
    return 'closed'
  }
  return 'ongoing'
}

function normalizeCompanyTypeValue(value) {
  const candidate = stripHumanVerify(value).trim().toLowerCase()
  if (!candidate) return entityType.value === 'fund' ? 'Asset Manager' : 'Corporation'

  const match = companyTypeOptions.find((option) => option.value.toLowerCase() === candidate)
  return match?.value || (entityType.value === 'fund' ? 'Asset Manager' : 'Corporation')
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
  if (
    companyLinkMode.value === 'existing' &&
    companySourceChoice.value === 'legacy' &&
    String(form.value.company_id || '').trim()
  ) {
    return String(form.value.company_id || '').trim()
  }

  const existingCompanyId = String(form.value.company_id || '').trim()
  if (existingCompanyId && companyLinkMode.value === 'existing' && companySourceChoice.value !== 'input') {
    return existingCompanyId
  }

  const companyPayload = trimPayloadValues(resolvedCompanyPayload.value)
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
    !(
      (entityType.value === 'fund' ? bridge.value?.funds?.create : bridge.value?.rounds?.create)
    ) ||
    !bridge.value?.artifacts?.linkToOpportunity
  ) {
    return
  }
  if (createDisabled.value) return
  if (opportunityNameError.value) {
    $q.notify({ type: 'negative', message: opportunityNameError.value })
    return
  }

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
      Venture_Oppty_Name: normalizedOpportunityName.value,
      Fund_Name: entityType.value === 'fund' ? normalizedOpportunityName.value : undefined,
      Round_Name: entityType.value === 'round' ? normalizedOpportunityName.value : undefined,
      company: trimPayloadValues(resolvedCompanyPayload.value),
      primary_contact: trimPayloadValues(contactForm.value),
      notes: generatedNotes.value,
      tasks: generatedTasks.value,
      assistant: assistantProposal.value,
    }
    const serializablePayload = toSerializable(payload)

    const createRecord =
      entityType.value === 'fund' ? bridge.value.funds.create : bridge.value.rounds.create
    const result = await createRecord(serializablePayload)

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
  const artifactIds = [...draftArtifactIds.value]
  if (bridge.value?.artifacts?.delete && artifactIds.length) {
    await Promise.allSettled(artifactIds.map((artifactId) => bridge.value.artifacts.delete(artifactId)))
  }
  resetForms()
  resetTransientState()
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

function normalizeComparisonText(value) {
  return stripHumanVerify(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

function tokenizeComparisonText(value) {
  return normalizeComparisonText(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
}

function scoreCompanyMatch(company, inputValue) {
  const companyName = normalizeComparisonText(company?.Company_Name)
  if (!companyName) return 0
  if (!inputValue) return 1
  if (companyName === inputValue) return 1000
  if (companyName.startsWith(inputValue) || inputValue.startsWith(companyName)) return 700
  if (companyName.includes(inputValue) || inputValue.includes(companyName)) return 550

  const companyTokens = new Set(tokenizeComparisonText(companyName))
  const inputTokens = tokenizeComparisonText(inputValue)
  const tokenMatches = inputTokens.reduce(
    (count, token) => count + (companyTokens.has(token) ? 1 : 0),
    0,
  )
  const overlapScore = inputTokens.length ? Math.round((tokenMatches / inputTokens.length) * 300) : 0
  const lengthDelta = Math.abs(companyName.length - inputValue.length)
  return overlapScore + Math.max(0, 120 - lengthDelta)
}

function summarizeCompanySource(source = {}) {
  const name = stripHumanVerify(source?.Company_Name) || 'Unnamed company'
  const type = stripHumanVerify(source?.Company_Type)
  const website = stripHumanVerify(source?.Website)
  const status = stripHumanVerify(source?.Status)
  return [name, type, website, status].filter(Boolean).join(' • ')
}

const resolvedCompanyPayload = computed(() => {
  if (companyLinkMode.value === 'existing' && companySourceChoice.value === 'legacy' && selectedCompany.value) {
    return {
      Company_Name: selectedCompany.value.Company_Name || '',
      Company_Type: selectedCompany.value.Company_Type || '',
      One_Liner: selectedCompany.value.One_Liner || '',
      Status: selectedCompany.value.Status || '',
      Headquarters_City: getCompanyFieldValue(selectedCompany.value, 'Headquarters_City'),
      Date_of_Incorporation: selectedCompany.value.Date_of_Incorporation || '',
      Pax: getCompanyFieldValue(selectedCompany.value, 'Pax'),
      Updates: selectedCompany.value.Updates || '',
      Website: selectedCompany.value.Website || '',
    }
  }

  return { ...companyForm.value }
})

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
    await loadExistingOpportunityNames()
  },
)

watch(
  () => form.value.company_id,
  () => {
    if (selectedCompanyIsAssetManager.value) form.value.kind = 'fund'
    else if (props.lockKind && props.initialKind) {
      form.value.kind = String(props.initialKind).trim().toLowerCase()
    }
    const selected = selectedCompany.value
    if (!selected) return
    if (!String(companyForm.value.Company_Name || '').trim()) {
      companyForm.value = {
        ...companyForm.value,
        Company_Name: selected.Company_Name || '',
      }
    }
  },
)

watch(companyLinkMode, (value) => {
  if (value === 'new') {
    form.value.company_id = null
    companySourceChoice.value = 'input'
    return
  }

  if (form.value.company_id) {
    companySourceChoice.value = 'legacy'
    return
  }

  const suggested = topSuggestedCompanies.value[0]
  if (suggested?.value) {
    form.value.company_id = suggested.value
    companySourceChoice.value = 'legacy'
  }
})

watch(
  () => suggestedOpportunityName.value,
  (v) => {
    if (opportunityNameManuallyEdited.value && normalizeOpportunityName(form.value.Venture_Oppty_Name)) return
    form.value.Venture_Oppty_Name = v
    markAutofilled('opportunity', 'Venture_Oppty_Name')
  },
  { immediate: true },
)

watch(
  () => props.initialKind,
  (value) => {
    if (!props.lockKind) return
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'fund' || normalized === 'round') {
      form.value.kind = normalized
    }
  },
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

.opportunity-dialog-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.opportunity-dialog-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.opportunity-dialog-section__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
  width: 100%;
}

.opportunity-dialog-section__field {
  min-width: 0;
}

.opportunity-dialog-section__field--full {
  grid-column: 1 / -1;
}

.company-mismatch-banner {
  border: 1px solid rgba(245, 124, 0, 0.2);
}

.company-source-choice {
  width: 100%;
  min-height: 116px;
  padding: 12px;
  text-align: left;
  background: #ffffff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.company-source-choice:hover,
.company-source-choice:focus-visible {
  border-color: rgba(38, 71, 255, 0.3);
  box-shadow: 0 8px 24px rgba(17, 17, 17, 0.08);
}

.company-source-choice--selected {
  background: #f5f7ff;
  border-color: rgba(38, 71, 255, 0.45);
  box-shadow: 0 10px 26px rgba(38, 71, 255, 0.12);
}

.company-source-choice__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.company-source-choice__body {
  margin-top: 10px;
  color: #525252;
  font-size: 13px;
  line-height: 1.5;
}

.company-preview-row {
  padding: 10px 12px;
  background: #f7f7f5;
  border: 1px solid rgba(17, 17, 17, 0.06);
  border-radius: 10px;
}

.company-preview-row__label {
  margin-bottom: 4px;
  color: #737373;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.company-preview-row__value {
  color: #171717;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .opportunity-dialog-section__grid {
    grid-template-columns: 1fr;
  }

  .opportunity-dialog-section__field--full {
    grid-column: auto;
  }
}
</style>
