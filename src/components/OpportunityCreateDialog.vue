<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Opportunity</div>
        <div class="text-caption text-grey-7">Only company name is required.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-select
            v-model="form.company_id"
            outlined
            label="Company Name *"
            :options="companyOptions"
            :disable="loadingCompanies || loading"
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

          <div class="row q-col-gutter-md">
            <div v-for="field in fields" :key="field.key" class="col-12 col-md-6">
              <q-input
                v-model="form[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" :disable="loading" @click="open = false" />
        <q-btn color="primary" label="Create" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <CompanyCreateDialog v-model="companyDialogOpen" @created="onCompanyCreated" />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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

const loading = ref(false)
const loadingCompanies = ref(false)
const companies = ref([])
const companyDialogOpen = ref(false)

const fields = [
  { key: 'id', label: 'ID (optional)', inputType: 'text' },
  { key: 'Venture_Oppty_Name', label: 'Venture_Oppty_Name', inputType: 'text' },
  { key: 'Round_Stage', label: 'Round_Stage', inputType: 'text' },
  { key: 'Type_of_Security', label: 'Type_of_Security', inputType: 'text' },
  { key: 'Investment_Ask', label: 'Investment_Ask', inputType: 'number' },
  { key: 'Round_Amount', label: 'Round_Amount (USD)', inputType: 'number' },
  { key: 'Hard_Commits', label: 'Hard_Commits', inputType: 'number' },
  { key: 'Soft_Commits', label: 'Soft_Commits', inputType: 'number' },
  { key: 'Pre_Valuation', label: 'Pre_Valuation', inputType: 'number' },
  { key: 'Post_Valuation', label: 'Post_Valuation', inputType: 'number' },
  { key: 'Previous_Post', label: 'Previous_Post', inputType: 'number' },
  { key: 'First_Close_Date', label: 'First_Close_Date', inputType: 'text' },
  { key: 'Next_Close_Date', label: 'Next_Close_Date', inputType: 'text' },
  { key: 'Final_Close_Date', label: 'Final_Close_Date', inputType: 'text' },
  { key: 'Pipeline_Stage', label: 'Pipeline_Stage', inputType: 'text' },
  { key: 'Pipeline_Status', label: 'Pipeline_Status', inputType: 'text' },
  { key: 'Raising_Status', label: 'Raising_Status', inputType: 'text' },
  { key: 'Board_Seats', label: 'Board_Seats', inputType: 'text' },
  { key: 'Information_Rights', label: 'Information_Rights', inputType: 'text' },
  { key: 'Voting_Rights', label: 'Voting_Rights', inputType: 'text' },
  { key: 'Liquidation_Preference', label: 'Liquidation_Preference', inputType: 'text' },
  { key: 'Anti_Dilution_Provisions', label: 'Anti_Dilution_Provisions', inputType: 'text' },
  { key: 'Conversion_Features', label: 'Conversion_Features', inputType: 'text' },
  { key: 'Most_Favored_Nation', label: 'Most_Favored_Nation', inputType: 'text' },
  { key: 'ROFO_ROR', label: 'ROFO_ROR', inputType: 'text' },
  { key: 'Co_Sale_Right', label: 'Co_Sale_Right', inputType: 'text' },
  { key: 'Tag_Drag_Along', label: 'Tag_Drag_Along', inputType: 'text' },
  { key: 'Put_Option', label: 'Put_Option', inputType: 'text' },
  { key: 'Over_Allotment_Option', label: 'Over_Allotment_Option', inputType: 'text' },
  { key: 'Stacked_Series', label: 'Stacked_Series', inputType: 'text' },
]

const form = ref({})

const companyOptions = computed(() =>
  (companies.value || [])
    .filter((c) => c?.Company_Name)
    .map((c) => ({ label: c.Company_Name, value: c.id })),
)

function resetForm() {
  form.value = {
    company_id: null,
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

async function submit() {
  if (!bridge.value?.opportunities?.create) return
  if (!form.value.company_id) return

  loading.value = true
  try {
    const payload = { ...form.value }
    const result = await bridge.value.opportunities.create(payload)
    emit('created', result)
    window.dispatchEvent(new Event('ecvc:opportunities-changed'))
    open.value = false
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (v) => {
    if (!v) return
    resetForm()
    await loadCompanies()
  },
)
</script>
