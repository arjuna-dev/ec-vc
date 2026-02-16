<template>
  <q-dialog v-model="open">
    <q-card style="width: 900px; max-width: 96vw">
      <q-card-section>
        <div class="text-h6">Create Opportunity</div>
        <div class="text-caption text-grey-7">Name is required. Kind is inferred from company type when needed.</div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow: auto">
        <q-form @submit.prevent="submit" class="q-gutter-md">
          <q-select
            v-model="form.company_id"
            outlined
            :label="form.kind === 'round' ? 'Company *' : 'Company (optional)'"
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
            <template #no-option>
              <q-item clickable @click.stop.prevent="companyDialogOpen = true">
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Create new company</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="form.kind"
            outlined
            label="Opportunity Kind *"
            :options="kindOptions"
            :disable="loading || selectedCompanyIsAssetManager"
            emit-value
            map-options
          />
          <div v-if="selectedCompanyIsAssetManager" class="text-caption text-grey-7">
            Selected company is <b>Asset Manager</b>, so kind is forced to <b>fund</b>.
          </div>

          <div v-for="field in fields" :key="field.key" class="col-12 col-md-6">
            <q-input
              v-model="form[field.key]"
              outlined
              :label="field.label"
              :type="field.inputType"
              :disable="loading"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="ec-button-group ec-button-group--end">
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
  { key: 'Venture_Oppty_Name', label: 'Opportunity Name *', inputType: 'text' },
  { key: 'Round_Stage', label: 'Round Stage', inputType: 'text' },
  { key: 'Type_of_Security', label: 'Type of Security', inputType: 'text' },
  { key: 'Investment_Ask', label: 'Investment Ask', inputType: 'number' },
  { key: 'Round_Amount', label: 'Round Amount (USD)', inputType: 'number' },
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

const form = ref({})

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

const selectedCompany = computed(() =>
  (companies.value || []).find((c) => c?.id === form.value?.company_id) || null,
)

const selectedCompanyIsAssetManager = computed(
  () => String(selectedCompany.value?.Company_Type || '').toLowerCase() === 'asset manager',
)

function resetForm() {
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
  if (form.value.kind === 'round' && !form.value.company_id) return

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

watch(
  () => form.value.company_id,
  () => {
    if (selectedCompanyIsAssetManager.value) form.value.kind = 'fund'
  },
)
</script>
