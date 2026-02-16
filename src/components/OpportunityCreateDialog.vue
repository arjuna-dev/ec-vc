<template>
  <q-dialog v-model="open">
    <q-card style="width: 980px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Opportunity</div>
        <div class="text-caption text-grey-7">
          Drop files, ingest and auto-populate fields, verify all, then create.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 72vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
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

          <q-banner v-if="stagedFiles.length" class="bg-white text-black" rounded>
            <div class="text-caption text-grey-7 q-mb-xs">Staged files:</div>
            <div style="max-height: 120px; overflow: auto">
              <div v-for="f in stagedFiles" :key="f.path || f.name" class="text-body2">
                {{ f.name }} ({{ f.size }} bytes)
              </div>
            </div>
          </q-banner>

          <div class="row items-center q-gutter-sm">
            <q-btn
              color="secondary"
              label="Ingest & Populate Opportunity"
              :loading="autofillLoading"
              :disable="loading || autofillLoading"
              @click="ingestAndPopulate"
            />
            <q-btn
              v-if="autofillApplied"
              color="positive"
              label="VERIFY ALL"
              :disable="verifyAllConfirmed || loading || autofillLoading"
              @click="verifyAll"
            />
            <div v-if="autofillApplied && !verifyAllConfirmed" class="text-negative text-caption">
              Verify all LLM-populated fields before creating.
            </div>
            <div v-if="verifyAllConfirmed" class="text-positive text-caption">All suggested fields verified.</div>
          </div>

          <q-separator />

          <div class="text-subtitle1">Opportunity</div>
          <q-select
            v-model="form.company_id"
            outlined
            :label="form.kind === 'round' ? 'Existing Company * (or provide company below)' : 'Existing Company (optional)'"
            :options="companyOptions"
            :disable="loadingCompanies || loading || autofillLoading"
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

          <q-select
            v-model="form.kind"
            outlined
            label="Opportunity Kind *"
            :options="kindOptions"
            :disable="loading || selectedCompanyIsAssetManager || autofillLoading"
            emit-value
            map-options
          />
          <div v-if="selectedCompanyIsAssetManager" class="text-caption text-grey-7">
            Selected company is <b>Asset Manager</b>, so kind is forced to <b>fund</b>.
          </div>

          <div class="row q-col-gutter-md">
            <div v-for="field in opportunityFields" :key="field.key" class="col-12 col-md-6">
              <q-input
                v-model="form[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading || autofillLoading"
                :input-class="fieldInputClass('opportunity', field.key)"
              />
            </div>
          </div>

          <q-separator />

          <div class="text-subtitle1">Company</div>
          <div class="row q-col-gutter-md">
            <div v-for="field in companyFields" :key="field.key" class="col-12 col-md-6">
              <q-input
                v-model="companyForm[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading || autofillLoading"
                :input-class="fieldInputClass('company', field.key)"
              />
            </div>
          </div>

          <q-separator />

          <div class="text-subtitle1">Primary Contact</div>
          <div class="row q-col-gutter-md">
            <div v-for="field in contactFields" :key="field.key" class="col-12 col-md-6">
              <q-input
                v-model="contactForm[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading || autofillLoading"
                :input-class="fieldInputClass('contact', field.key)"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" :disable="loading || autofillLoading" @click="open = false" />
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
import { computed, ref, watch } from 'vue'
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
const autofillLoading = ref(false)
const loadingCompanies = ref(false)
const companies = ref([])
const companyDialogOpen = ref(false)
const dragOver = ref(false)
const stagedFiles = ref([])
const autofillApplied = ref(false)
const verifyAllConfirmed = ref(false)
const llmFieldFlags = ref({})

const opportunityFields = [
  { key: 'Venture_Oppty_Name', label: 'Opportunity Name *', inputType: 'text' },
  { key: 'Round_Stage', label: 'Round Stage', inputType: 'text' },
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
  { key: 'Board_Seats', label: 'Board Seats', inputType: 'text' },
  { key: 'Information_Rights', label: 'Information Rights', inputType: 'text' },
  { key: 'Voting_Rights', label: 'Voting Rights', inputType: 'text' },
  { key: 'Liquidation_Preference', label: 'Liquidation Preference', inputType: 'text' },
  { key: 'Anti_Dilution_Provisions', label: 'Anti Dilution Provisions', inputType: 'text' },
  { key: 'Conversion_Features', label: 'Conversion Features', inputType: 'text' },
  { key: 'Most_Favored_Nation', label: 'Most Favored Nation', inputType: 'text' },
  { key: 'ROFO_ROR', label: 'ROFO ROR', inputType: 'text' },
  { key: 'Co_Sale_Right', label: 'Co Sale Right', inputType: 'text' },
  { key: 'Tag_Drag_Along', label: 'Tag Drag Along', inputType: 'text' },
  { key: 'Put_Option', label: 'Put Option', inputType: 'text' },
  { key: 'Over_Allotment_Option', label: 'Over Allotment Option', inputType: 'text' },
  { key: 'Stacked_Series', label: 'Stacked Series', inputType: 'text' },
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
  { key: 'Email', label: 'Contact Email', inputType: 'text' },
  { key: 'Phone', label: 'Contact Phone', inputType: 'text' },
  { key: 'LinkedIn', label: 'LinkedIn', inputType: 'text' },
  { key: 'Role', label: 'Role', inputType: 'text' },
  { key: 'Stakeholder_type', label: 'Stakeholder Type', inputType: 'text' },
  { key: 'Closeness_Level', label: 'Closeness Level', inputType: 'text' },
  { key: 'Comment', label: 'Comment', inputType: 'text' },
  { key: 'Expertise', label: 'Expertise', inputType: 'text' },
  { key: 'Degrees_Program', label: 'Degrees Program', inputType: 'text' },
  { key: 'University', label: 'University', inputType: 'text' },
  { key: 'Credentials', label: 'Credentials', inputType: 'text' },
  { key: 'Tenure_at_Firm_yrs', label: 'Tenure at Firm (yrs)', inputType: 'number' },
  { key: 'Country_based', label: 'Country Based', inputType: 'text' },
]

const form = ref({})
const companyForm = ref({})
const contactForm = ref({})

const companyOptions = computed(() =>
  (companies.value || [])
    .filter((c) => c?.Company_Name)
    .map((c) => ({
      label: `${c.Company_Name}${c?.Company_Type ? ` (${c.Company_Type})` : ''}`,
      value: c.id,
    })),
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

const createDisabled = computed(() => {
  if (loading.value || autofillLoading.value) return true
  if (autofillApplied.value && !verifyAllConfirmed.value) return true
  if (!String(form.value.Venture_Oppty_Name || '').trim()) return true
  const hasCompanyFromForm = String(companyForm.value.Company_Name || '').trim().length > 0
  if (form.value.kind === 'round' && !form.value.company_id && !hasCompanyFromForm) return true
  return false
})

function resetForms() {
  form.value = {
    company_id: null,
    kind: 'round',
    id: '',
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
    Board_Seats: '',
    Information_Rights: '',
    Voting_Rights: '',
    Liquidation_Preference: '',
    Anti_Dilution_Provisions: '',
    Conversion_Features: '',
    Most_Favored_Nation: '',
    ROFO_ROR: '',
    Co_Sale_Right: '',
    Tag_Drag_Along: '',
    Put_Option: '',
    Over_Allotment_Option: '',
    Stacked_Series: '',
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
    Email: '',
    Phone: '',
    LinkedIn: '',
    Role: '',
    Stakeholder_type: '',
    Closeness_Level: '',
    Comment: '',
    Expertise: '',
    Degrees_Program: '',
    University: '',
    Credentials: '',
    Tenure_at_Firm_yrs: '',
    Country_based: '',
  }
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

function onDrop(e) {
  dragOver.value = false
  const files = Array.from(e?.dataTransfer?.files || [])
  if (!files.length) return
  const summaries = files.map((f) => {
    const p = f?.path || bridge.value?.files?.getPathForFile?.(f) || f?.webkitRelativePath || null
    return { name: f.name, path: p, size: f.size }
  })
  stagedFiles.value = summaries
  $q.notify({ type: 'info', message: 'Files staged.' })
  if (summaries.some((s) => !s.path)) {
    $q.notify({
      type: 'negative',
      message:
        'Could not read the local path for one or more dropped files. Please try again (or use a different file).',
    })
  }
}

function clearVerificationState() {
  llmFieldFlags.value = {}
  verifyAllConfirmed.value = false
  autofillApplied.value = false
}

function markField(section, key) {
  llmFieldFlags.value[`${section}.${key}`] = true
}

function applySuggestedValues(suggested = {}) {
  for (const [key, value] of Object.entries(suggested?.opportunity || {})) {
    if (!Object.prototype.hasOwnProperty.call(form.value, key)) continue
    form.value[key] = value == null ? '' : String(value)
    markField('opportunity', key)
  }
  for (const [key, value] of Object.entries(suggested?.company || {})) {
    if (!Object.prototype.hasOwnProperty.call(companyForm.value, key)) continue
    companyForm.value[key] = value == null ? '' : String(value)
    markField('company', key)
  }
  for (const [key, value] of Object.entries(suggested?.contact || {})) {
    if (!Object.prototype.hasOwnProperty.call(contactForm.value, key)) continue
    contactForm.value[key] = value == null ? '' : String(value)
    markField('contact', key)
  }
}

function fieldInputClass(section, key) {
  if (verifyAllConfirmed.value) return ''
  return llmFieldFlags.value[`${section}.${key}`] ? 'text-negative text-weight-medium' : ''
}

async function ingestAndPopulate() {
  if (!bridge.value?.autofill?.previewFromFiles) return
  const filePaths = stagedFiles.value.map((f) => f.path).filter(Boolean)
  if (!filePaths.length) {
    $q.notify({ type: 'negative', message: 'Drop one or more files before ingesting.' })
    return
  }
  autofillLoading.value = true
  try {
    clearVerificationState()
    const result = await bridge.value.autofill.previewFromFiles({
      filePaths,
      context: { kind: form.value.kind, company_id: form.value.company_id },
    })
    applySuggestedValues(result?.suggested || {})
    autofillApplied.value = true
    verifyAllConfirmed.value = false
    $q.notify({ type: 'positive', message: 'Fields populated from file ingestion. Please verify all.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    autofillLoading.value = false
  }
}

function verifyAll() {
  verifyAllConfirmed.value = true
  $q.notify({ type: 'positive', message: 'All LLM-populated fields marked as verified.' })
}

function trimPayloadValues(input = {}) {
  const out = {}
  for (const [k, v] of Object.entries(input)) {
    const text = String(v || '').trim()
    if (text.length) out[k] = text
  }
  return out
}

async function submit() {
  if (!bridge.value?.opportunities?.create) return
  if (createDisabled.value) return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      company: trimPayloadValues(companyForm.value),
      primary_contact: trimPayloadValues(contactForm.value),
    }
    const result = await bridge.value.opportunities.create(payload)
    emit('created', result)
    window.dispatchEvent(new Event('ecvc:opportunities-changed'))
    open.value = false
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
    resetForms()
    stagedFiles.value = []
    dragOver.value = false
    clearVerificationState()
    await loadCompanies()
  },
)

watch(
  () => form.value.company_id,
  () => {
    if (selectedCompanyIsAssetManager.value) form.value.kind = 'fund'
  },
)
</script>
