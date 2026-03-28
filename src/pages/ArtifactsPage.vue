<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Artifacts requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else>
      <div class="row items-center q-col-gutter-sm page-title-section">
        <div class="col">
          <div class="text-h6">Artifacts</div>
          <div class="text-caption text-grey-7">Latest artifacts, review actions, and manual intake nudges.</div>
        </div>
        <div class="col-auto">
          <q-btn-toggle
            v-model="viewMode"
            unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="viewModeOptions"
          />
        </div>
        <div class="col-auto">
          <TableCsvActions
            filename-base="artifacts"
            :headers="csvHeaders"
            :rows="rows"
            :on-import-rows="importRows"
            :on-create="openCreateArtifact"
            create-label="Add artifact"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="loadArtifacts" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-banner v-if="!loading && rows.length === 0" class="bg-grey-2 text-black q-mb-md" rounded>
        <div class="row items-center justify-between">
          <div>No artifacts created yet.</div>
          <q-btn color="primary" outline label="Create artifact" @click="openCreateArtifact" />
        </div>
      </q-banner>

      <div v-else-if="viewMode === 'grid'" class="artifacts-grid">
        <q-card
          v-for="artifact in latestArtifacts"
          :key="artifact.artifact_id"
          flat
          bordered
          class="artifact-card"
        >
          <q-card-section class="artifact-card__header">
            <div class="row items-start justify-between q-col-gutter-sm">
              <div class="col">
                <div class="text-overline text-grey-6">{{ artifact.artifact_type || 'artifact' }}</div>
                <div class="text-subtitle1 artifact-card__title">
                  {{ artifact.title || artifactFileName(artifact) || 'Untitled artifact' }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ artifactFileName(artifact) || artifact.artifact_id }}
                </div>
              </div>
              <div class="col-auto">
                <q-chip
                  dense
                  square
                  :color="artifactNeedsAttention(artifact) ? 'amber-2' : 'green-1'"
                  :text-color="artifactNeedsAttention(artifact) ? 'amber-10' : 'green-10'"
                >
                  {{ artifactNeedsAttention(artifact) ? 'Needs intake review' : 'Ready' }}
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="artifact-card__body">
            <div class="artifact-card__meta">
              <div>
                <span class="artifact-card__meta-label">Opportunity</span>
                <div>{{ resolveOpportunityLabel(artifact) }}</div>
              </div>
              <div>
                <span class="artifact-card__meta-label">Created</span>
                <div>{{ formatArtifactDate(artifact.created_at) }}</div>
              </div>
              <div>
                <span class="artifact-card__meta-label">Format</span>
                <div>{{ artifact.artifact_format || 'Unknown' }}</div>
              </div>
              <div>
                <span class="artifact-card__meta-label">Category</span>
                <div>{{ artifact.type || 'Uncategorized' }}</div>
              </div>
            </div>

            <div v-if="artifact.description" class="text-caption text-grey-7 artifact-card__description">
              {{ artifact.description }}
            </div>
          </q-card-section>

          <q-card-actions align="between" class="artifact-card__actions">
            <div class="row items-center q-col-gutter-sm">
              <q-btn
                flat
                no-caps
                icon="visibility"
                label="Preview"
                :disable="loading"
                @click="void previewArtifact(artifact)"
              />
              <q-btn
                flat
                no-caps
                icon="download"
                label="Download"
                :disable="loading"
                @click="void downloadArtifact(artifact)"
              />
            </div>
            <div class="row items-center q-col-gutter-sm">
              <q-btn
                color="primary"
                unelevated
                no-caps
                :icon="artifactNeedsAttention(artifact) ? 'play_arrow' : 'tune'"
                :label="artifactNeedsAttention(artifact) ? 'Continue Intake' : 'Open Properties'"
                :disable="loading || savingProperties"
                @click="void openPropertiesDialog(artifact)"
              />
            </div>
          </q-card-actions>
        </q-card>
      </div>

      <q-table
        v-else
        flat
        bordered
        row-key="artifact_id"
        v-model:selected="selectedRows"
        selection="multiple"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template #body-cell-opportunity_id="props">
          <q-td :props="props">
            <div class="column">
              <div>{{ resolveOpportunityLabel(props.row) }}</div>
              <div class="text-caption text-grey-6">{{ props.row.opportunity_id || 'Unlinked' }}</div>
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              round
              icon="visibility"
              color="primary"
              :disable="loading"
              @click="void previewArtifact(props.row)"
            />
            <q-btn
              dense
              flat
              round
              icon="tune"
              color="primary"
              :disable="loading || savingProperties"
              @click="void openPropertiesDialog(props.row)"
            />
            <q-btn
              dense
              flat
              round
              icon="delete"
              color="negative"
              :disable="loading"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
      </q-table>

      <q-page-sticky v-if="selectedCount > 0" position="bottom-right" :offset="[18 * 2, 18]">
        <q-btn
          color="negative"
          unelevated
          :disable="loading"
          label="Delete All"
          @click="confirmDeleteSelected"
        />
      </q-page-sticky>

      <q-dialog v-model="propertiesDialogOpen" persistent>
        <q-card style="width: 720px; max-width: 96vw">
          <q-card-section class="row items-start justify-between q-col-gutter-md">
            <div class="col">
              <div class="text-h6">Artifact Properties</div>
              <div class="text-caption text-grey-7">
                Review this artifact and manually adjust its linked opportunity when needed.
              </div>
            </div>
            <div class="col-auto text-caption text-grey-6">
              {{ propertiesForm.artifact_id || 'Unsaved artifact' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner v-if="propertiesError" class="bg-red-2 text-black q-mb-md" rounded>
              {{ propertiesError }}
            </q-banner>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input
                  v-model="propertiesForm.title"
                  outlined
                  dense
                  label="Title"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  :model-value="String(propertiesForm.artifact_type || '')"
                  outlined
                  dense
                  label="Artifact Type"
                  readonly
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.opportunity_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                  :options="opportunityOptions"
                  label="Linked Opportunity"
                  option-label="label"
                  option-value="value"
                  use-input
                  input-debounce="0"
                  @filter="filterOpportunityOptions"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  v-model="propertiesForm.artifact_format"
                  outlined
                  dense
                  label="Format"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  :model-value="String(propertiesForm.type || '')"
                  outlined
                  dense
                  label="Category"
                  readonly
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="propertiesForm.description"
                  outlined
                  type="textarea"
                  autogrow
                  label="Description"
                />
              </div>
              <div class="col-12">
                <div class="text-subtitle2 q-mb-sm">Relationships</div>
              </div>
              <div class="col-12 col-md-8">
                <q-select
                  v-model="propertiesForm.related_company_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="companyOptions"
                  label="Related Companies"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'company')"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="propertiesForm.company_document_type"
                  outlined
                  dense
                  clearable
                  :disable="propertiesForm.related_company_ids.length === 0"
                  :options="companyDocumentTypeOptions"
                  label="Company Document Type"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.related_industry_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="industryOptions"
                  label="Related Industries"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'industry')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="propertiesForm.related_region_ids"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-input
                  use-chips
                  input-debounce="0"
                  :options="regionOptions"
                  label="Related Regions"
                  option-label="label"
                  option-value="value"
                  @filter="(value, update) => filterSelectableOptions(value, update, 'region')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  :model-value="String(propertiesForm.fs_path || '')"
                  outlined
                  dense
                  label="File Path"
                  readonly
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  :model-value="String(propertiesForm.original_artifact_id || '')"
                  outlined
                  dense
                  label="Original Artifact"
                  readonly
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  :model-value="String(propertiesForm.created_at || '')"
                  outlined
                  dense
                  label="Created"
                  readonly
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" :disable="savingProperties" @click="closePropertiesDialog" />
            <q-btn
              color="primary"
              unelevated
              label="Save Properties"
              :loading="savingProperties"
              @click="saveArtifactProperties"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="previewDialogOpen" maximized @hide="closePreviewDialog">
        <q-card class="artifact-preview-dialog">
          <q-card-section class="row items-center justify-between q-col-gutter-md">
            <div class="col">
              <div class="text-h6">{{ previewState.fileName || 'Artifact preview' }}</div>
              <div class="text-caption text-grey-7">
                {{ previewLoading ? 'Loading preview...' : previewKindLabel }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn flat round dense icon="close" @click="closePreviewDialog" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="artifact-preview-dialog__body">
            <div v-if="previewLoading" class="artifact-preview-dialog__state">
              <q-spinner color="primary" size="40px" />
              <div class="text-subtitle2 q-mt-md">Loading artifact preview</div>
            </div>

            <iframe
              v-else-if="previewState.kind === 'pdf' && previewPdfSrc"
              :src="previewPdfSrc"
              class="artifact-preview-dialog__frame"
              title="Artifact PDF preview"
            />

            <img
              v-else-if="previewState.kind === 'image' && previewState.fileUrl"
              :src="previewState.fileUrl"
              :alt="previewState.fileName || 'Artifact preview'"
              class="artifact-preview-dialog__image"
            />

            <pre
              v-else-if="previewState.kind === 'text'"
              class="artifact-preview-dialog__text"
            ><code>{{ previewState.content || '' }}</code></pre>

            <div v-else class="artifact-preview-dialog__state">
              <q-icon name="description" size="40px" color="grey-5" />
              <div class="text-subtitle2 q-mt-md">Preview not available</div>
              <div class="text-caption text-grey-7 q-mt-sm">
                Try Download if this artifact format does not support inline preview yet.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import TableCsvActions from 'components/TableCsvActions.vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.artifacts?.list &&
    !!bridge.value?.artifacts?.upsertMany &&
    !!bridge.value?.artifacts?.delete &&
    !!bridge.value?.db?.execute &&
    !!bridge.value?.db?.query,
)

const rows = ref([])
const opportunities = ref([])
const companies = ref([])
const industries = ref([])
const regions = ref([])
const filteredOpportunityOptions = ref([])
const filteredCompanyOptions = ref([])
const filteredIndustryOptions = ref([])
const filteredRegionOptions = ref([])
const selectedRows = ref([])
const loading = ref(false)
const error = ref('')
const viewMode = ref('grid')
const previewDialogOpen = ref(false)
const previewLoading = ref(false)
const propertiesDialogOpen = ref(false)
const savingProperties = ref(false)
const propertiesError = ref('')
const propertiesForm = ref(createEmptyPropertiesForm())
const selectedCount = computed(() => selectedRows.value.length)
const previewState = ref(createEmptyPreviewState())

const $q = useQuasar()

const viewModeOptions = [
  { label: 'Grid', value: 'grid', icon: 'grid_view' },
  { label: 'Table', value: 'table', icon: 'view_list' },
]

function openCreateArtifact() {
  globalThis?.dispatchEvent?.(new Event('ecvc:open-artifact-dialog'))
}

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'artifact_type', label: 'Type', field: 'artifact_type', align: 'left', sortable: true },
  { name: 'artifact_format', label: 'Format', field: 'artifact_format', align: 'left', sortable: true },
  { name: 'type', label: 'Category', field: 'type', align: 'left', sortable: true },
  { name: 'opportunity_id', label: 'Opportunity', field: 'opportunity_id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

const csvHeaders = [
  'artifact_id',
  'original_artifact_id',
  'title',
  'artifact_type',
  'artifact_format',
  'type',
  'fs_path',
  'opportunity_id',
  'created_by',
  'created_at',
]

const companyDocumentTypeOptions = [
  'incorporation_certificate',
  'incorporation_articles',
  'company_bylaws',
  'intellectual_property',
  'yearly_statements',
  'quarterly_statements',
  'monthly_statements',
  'descriptive_materials',
]

const opportunityOptions = computed(() =>
  filteredOpportunityOptions.value.map((opportunity) => ({
    label: buildOpportunityOptionLabel(opportunity),
    value: opportunity.id,
  })),
)

const companyOptions = computed(() =>
  filteredCompanyOptions.value.map((company) => ({
    label: buildCompanyOptionLabel(company),
    value: String(company?.id || '').trim(),
  })),
)

const industryOptions = computed(() =>
  filteredIndustryOptions.value.map((industry) => ({
    label: String(industry?.Industry_Name || industry?.id || '').trim(),
    value: String(industry?.id || '').trim(),
  })),
)

const regionOptions = computed(() =>
  filteredRegionOptions.value.map((region) => ({
    label: String(region?.Name || region?.id || '').trim(),
    value: String(region?.id || '').trim(),
  })),
)

const latestArtifacts = computed(() =>
  [...rows.value]
    .sort((left, right) => String(right?.created_at || '').localeCompare(String(left?.created_at || '')))
    .slice(0, 12),
)

const previewPdfSrc = computed(() => {
  if (previewState.value.kind !== 'pdf') return ''
  if (previewState.value.fileUrl) return previewState.value.fileUrl
  if (previewState.value.fileDataBase64) return `data:application/pdf;base64,${previewState.value.fileDataBase64}`
  return ''
})

const previewKindLabel = computed(() => {
  if (previewState.value.kind === 'pdf') return 'PDF preview'
  if (previewState.value.kind === 'image') return 'Image preview'
  if (previewState.value.kind === 'text') return 'Text preview'
  return 'Artifact preview'
})

async function loadArtifacts() {
  if (!hasBridge.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.artifacts.list()
    rows.value = result?.artifacts || []
    normalizeSelectedRows()
  } catch (e) {
    error.value = e?.message || String(e)
    rows.value = []
    normalizeSelectedRows()
  } finally {
    loading.value = false
  }
}

async function importRows(importedRows) {
  const result = await bridge.value.artifacts.upsertMany(importedRows)
  await loadArtifacts()
  return result
}

async function loadOpportunities() {
  if (!bridge.value?.opportunities?.list) {
    opportunities.value = []
    filteredOpportunityOptions.value = []
    return
  }

  try {
    const result = await bridge.value.opportunities.list()
    opportunities.value = Array.isArray(result?.opportunities) ? result.opportunities : []
    filteredOpportunityOptions.value = [...opportunities.value]
  } catch {
    opportunities.value = []
    filteredOpportunityOptions.value = []
  }
}

async function loadRelationshipOptions() {
  await Promise.all([loadCompanies(), loadIndustries(), loadRegions()])
}

async function loadCompanies() {
  if (!bridge.value?.companies?.list) {
    companies.value = []
    filteredCompanyOptions.value = []
    return
  }

  try {
    const result = await bridge.value.companies.list()
    companies.value = Array.isArray(result?.companies) ? result.companies : []
    filteredCompanyOptions.value = [...companies.value]
  } catch {
    companies.value = []
    filteredCompanyOptions.value = []
  }
}

async function loadIndustries() {
  if (!bridge.value?.db?.query) {
    industries.value = []
    filteredIndustryOptions.value = []
    return
  }

  try {
    const rows = await bridge.value.db.query(
      `
      SELECT id, Industry_Name
      FROM Industries
      ORDER BY COALESCE(Industry_Name, id), id
    `,
    )
    industries.value = Array.isArray(rows) ? rows : []
    filteredIndustryOptions.value = [...industries.value]
  } catch {
    industries.value = []
    filteredIndustryOptions.value = []
  }
}

async function loadRegions() {
  if (!bridge.value?.db?.query) {
    regions.value = []
    filteredRegionOptions.value = []
    return
  }

  try {
    const rows = await bridge.value.db.query(
      `
      SELECT id, Name
      FROM Regions
      ORDER BY COALESCE(Name, id), id
    `,
    )
    regions.value = Array.isArray(rows) ? rows : []
    filteredRegionOptions.value = [...regions.value]
  } catch {
    regions.value = []
    filteredRegionOptions.value = []
  }
}

function normalizeSelectedRows() {
  const activeIds = new Set(rows.value.map((row) => row.artifact_id))
  selectedRows.value = selectedRows.value.filter((row) => activeIds.has(row.artifact_id))
}

function createEmptyPropertiesForm() {
  return {
    artifact_id: '',
    title: '',
    artifact_type: '',
    artifact_format: '',
    type: '',
    opportunity_id: null,
    description: '',
    related_company_ids: [],
    company_document_type: null,
    related_industry_ids: [],
    related_region_ids: [],
    fs_path: '',
    original_artifact_id: '',
    created_at: '',
  }
}

function buildOpportunityOptionLabel(opportunity = {}) {
  const name = String(opportunity?.opportunity_name || opportunity?.Venture_Oppty_Name || 'Untitled opportunity').trim()
  const kind = String(opportunity?.kind || 'opportunity').trim()
  const company = String(opportunity?.Company_Name || '').trim()
  return company ? `${name} (${kind} • ${company})` : `${name} (${kind})`
}

function resolveOpportunityLabel(row = {}) {
  const opportunityId = String(row?.opportunity_id || '').trim()
  if (!opportunityId) return 'Unlinked'
  const match = opportunities.value.find((opportunity) => String(opportunity?.id || '').trim() === opportunityId)
  return match ? buildOpportunityOptionLabel(match) : opportunityId
}

function buildCompanyOptionLabel(company = {}) {
  const name = String(company?.Company_Name || '').trim()
  const type = String(company?.Company_Type || '').trim()
  return type ? `${name} (${type})` : name || String(company?.id || '').trim()
}

function artifactFileName(row = {}) {
  const fsPath = String(row?.fs_path || '').trim()
  if (!fsPath) return ''
  return fsPath.split(/[\\/]/).pop() || ''
}

function formatArtifactDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unknown'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString()
}

function artifactNeedsAttention(row = {}) {
  return !String(row?.opportunity_id || '').trim() || !String(row?.title || '').trim()
}

function filterOpportunityOptions(value, update) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    if (!search) {
      filteredOpportunityOptions.value = [...opportunities.value]
      return
    }

    filteredOpportunityOptions.value = opportunities.value.filter((opportunity) => {
      const haystack = [
        opportunity?.opportunity_name,
        opportunity?.Venture_Oppty_Name,
        opportunity?.Company_Name,
        opportunity?.kind,
        opportunity?.id,
      ]
        .map((part) => String(part || '').toLowerCase())
        .join(' ')
      return haystack.includes(search)
    })
  })
}

function filterSelectableOptions(value, update, type) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    const configByType = {
      company: {
        source: companies.value,
        assign: (items) => {
          filteredCompanyOptions.value = items
        },
        fields: ['id', 'Company_Name', 'Company_Type', 'Website'],
      },
      industry: {
        source: industries.value,
        assign: (items) => {
          filteredIndustryOptions.value = items
        },
        fields: ['id', 'Industry_Name'],
      },
      region: {
        source: regions.value,
        assign: (items) => {
          filteredRegionOptions.value = items
        },
        fields: ['id', 'Name'],
      },
    }

    const config = configByType[type]
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

async function openPropertiesDialog(row) {
  propertiesError.value = ''
  filteredOpportunityOptions.value = [...opportunities.value]
  filteredCompanyOptions.value = [...companies.value]
  filteredIndustryOptions.value = [...industries.value]
  filteredRegionOptions.value = [...regions.value]
  const nextForm = {
    artifact_id: String(row?.artifact_id || ''),
    title: String(row?.title || ''),
    artifact_type: String(row?.artifact_type || ''),
    artifact_format: String(row?.artifact_format || ''),
    type: String(row?.type || ''),
    opportunity_id: String(row?.opportunity_id || '').trim() || null,
    description: '',
    related_company_ids: [],
    company_document_type: null,
    related_industry_ids: [],
    related_region_ids: [],
    fs_path: String(row?.fs_path || ''),
    original_artifact_id: String(row?.original_artifact_id || ''),
    created_at: String(row?.created_at || ''),
  }

  if (bridge.value?.db?.query && nextForm.artifact_id) {
    try {
      const [detailRows, companyRows, industryRows, regionRows] = await Promise.all([
        bridge.value.db.query(
          `
          SELECT description
          FROM Artifact_Details
          WHERE artifact_id = ?
          LIMIT 1
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT cad.company_id, ca.document_type
          FROM Companies_Artifacts_documents cad
          LEFT JOIN Company_Artifacts ca ON ca.artifact_id = cad.artifact_id
          WHERE cad.artifact_id = ?
          ORDER BY cad.company_id
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT industry_id
          FROM Artifacts_Industries
          WHERE artifact_id = ?
          ORDER BY industry_id
        `,
          [nextForm.artifact_id],
        ),
        bridge.value.db.query(
          `
          SELECT region_id
          FROM Artifacts_Regions
          WHERE artifact_id = ?
          ORDER BY region_id
        `,
          [nextForm.artifact_id],
        ),
      ])
      const detail = Array.isArray(detailRows) ? detailRows[0] : null
      nextForm.description = String(detail?.description || '')
      const companyLinks = Array.isArray(companyRows) ? companyRows : []
      nextForm.related_company_ids = companyLinks
        .map((entry) => String(entry?.company_id || '').trim())
        .filter(Boolean)
      nextForm.company_document_type = String(companyLinks[0]?.document_type || '').trim() || null
      nextForm.related_industry_ids = (Array.isArray(industryRows) ? industryRows : [])
        .map((entry) => String(entry?.industry_id || '').trim())
        .filter(Boolean)
      nextForm.related_region_ids = (Array.isArray(regionRows) ? regionRows : [])
        .map((entry) => String(entry?.region_id || '').trim())
        .filter(Boolean)
    } catch {
      // Keep the dialog usable even if the detail lookup fails.
    }
  }

  propertiesForm.value = nextForm
  propertiesDialogOpen.value = true
}

function closePropertiesDialog() {
  if (savingProperties.value) return
  propertiesDialogOpen.value = false
  propertiesError.value = ''
  propertiesForm.value = createEmptyPropertiesForm()
}

async function saveArtifactProperties() {
  if (!bridge.value?.db?.execute) return

  const artifactId = String(propertiesForm.value.artifact_id || '').trim()
  if (!artifactId) {
    propertiesError.value = 'Artifact ID is missing.'
    return
  }

  const opportunityId = String(propertiesForm.value.opportunity_id || '').trim()
  const roundId = opportunityId && !opportunityId.startsWith('fund:') ? opportunityId : null
  const fundId = opportunityId && opportunityId.startsWith('fund:') ? opportunityId : null
  const relatedCompanyIds = [
    ...new Set(
      (propertiesForm.value.related_company_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const relatedIndustryIds = [
    ...new Set(
      (propertiesForm.value.related_industry_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const relatedRegionIds = [
    ...new Set(
      (propertiesForm.value.related_region_ids || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    ),
  ]
  const companyDocumentType = String(propertiesForm.value.company_document_type || '').trim() || null

  if (relatedCompanyIds.length > 0 && !companyDocumentType) {
    propertiesError.value = 'Company Document Type is required when Related Companies are selected.'
    return
  }

  savingProperties.value = true
  propertiesError.value = ''
  try {
    await bridge.value.db.execute(
      `
      UPDATE Artifacts
      SET
        round_id = ?,
        fund_id = ?,
        title = ?,
        description = ?,
        artifact_format = ?,
        updated_at = datetime('now')
      WHERE artifact_id = ?
    `,
      [
        roundId,
        fundId,
        String(propertiesForm.value.title || '').trim() || null,
        String(propertiesForm.value.description || '').trim() || null,
        String(propertiesForm.value.artifact_format || '').trim().toLowerCase() || null,
        artifactId,
      ],
    )

    await bridge.value.db.execute('DELETE FROM Companies_Artifacts_documents WHERE artifact_id = ?', [artifactId])
    if (relatedCompanyIds.length > 0) {
      await bridge.value.db.execute(
        `
        INSERT INTO Company_Artifacts (artifact_id, document_type)
        VALUES (?, ?)
        ON CONFLICT(artifact_id) DO UPDATE SET
          document_type = excluded.document_type
      `,
        [artifactId, companyDocumentType],
      )

      for (const companyId of relatedCompanyIds) {
        await bridge.value.db.execute(
          'INSERT OR IGNORE INTO Companies_Artifacts_documents (company_id, artifact_id) VALUES (?, ?)',
          [companyId, artifactId],
        )
      }
    } else {
      await bridge.value.db.execute('DELETE FROM Company_Artifacts WHERE artifact_id = ?', [artifactId])
    }

    await bridge.value.db.execute('DELETE FROM Artifacts_Industries WHERE artifact_id = ?', [artifactId])
    for (const industryId of relatedIndustryIds) {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Artifacts_Industries (artifact_id, industry_id) VALUES (?, ?)',
        [artifactId, industryId],
      )
    }

    await bridge.value.db.execute('DELETE FROM Artifacts_Regions WHERE artifact_id = ?', [artifactId])
    for (const regionId of relatedRegionIds) {
      await bridge.value.db.execute(
        'INSERT OR IGNORE INTO Artifacts_Regions (artifact_id, region_id) VALUES (?, ?)',
        [artifactId, regionId],
      )
    }

    await loadArtifacts()
    propertiesDialogOpen.value = false
    $q.notify({ type: 'positive', message: 'Artifact properties updated.' })
  } catch (e) {
    propertiesError.value = e?.message || String(e)
  } finally {
    savingProperties.value = false
  }
}

async function previewArtifact(row) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.preview) return
  try {
    previewDialogOpen.value = true
    previewLoading.value = true
    previewState.value = createEmptyPreviewState()
    const preview = await bridge.value.artifacts.preview({ artifactId })
    previewState.value = {
      artifactId,
      fileName: String(preview?.fileName || artifactFileName(row) || row?.title || '').trim(),
      kind: String(preview?.kind || '').trim(),
      fileUrl: String(preview?.fileUrl || '').trim(),
      fileDataBase64: String(preview?.fileDataBase64 || ''),
      content: String(preview?.content || ''),
    }
  } catch (e) {
    previewDialogOpen.value = false
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    previewLoading.value = false
  }
}

function createEmptyPreviewState() {
  return {
    artifactId: '',
    fileName: '',
    kind: '',
    fileUrl: '',
    fileDataBase64: '',
    content: '',
  }
}

async function downloadArtifact(row) {
  const artifactId = String(row?.artifact_id || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.download) return
  try {
    await bridge.value.artifacts.download({ artifactId })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  }
}

function closePreviewDialog() {
  previewDialogOpen.value = false
  previewLoading.value = false
  previewState.value = createEmptyPreviewState()
}

async function deleteArtifact(row) {
  await bridge.value.artifacts.delete(row.artifact_id)
}

async function confirmDelete(row) {
  if (!bridge.value?.artifacts?.delete) return
  const title = row?.title ? ` (${row.title})` : ''

  $q.dialog({
    title: 'Delete artifact?',
    message: `This will permanently delete this artifact${title}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      await deleteArtifact(row)
      await loadArtifacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

async function confirmDeleteSelected() {
  if (!bridge.value?.artifacts?.delete || selectedCount.value === 0) return
  $q.dialog({
    title: 'Delete selected artifacts?',
    message: `This will permanently delete ${selectedCount.value} selected artifact${selectedCount.value === 1 ? '' : 's'}.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    loading.value = true
    try {
      for (const row of selectedRows.value) {
        await deleteArtifact(row)
      }
      selectedRows.value = []
      await loadArtifacts()
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || String(e) })
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  if (!hasBridge.value) return
  loadArtifacts()
  loadOpportunities()
  loadRelationshipOptions()
})
</script>

<style scoped>
.artifacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.artifact-card {
  display: flex;
  flex-direction: column;
  min-height: 260px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
}

.artifact-card__header {
  padding-bottom: 12px;
}

.artifact-card__title {
  line-height: 1.25;
}

.artifact-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.artifact-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.artifact-card__meta-label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.artifact-card__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.artifact-card__actions {
  padding: 12px 16px 16px;
}

.artifact-preview-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.artifact-preview-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #f8fafc;
}

.artifact-preview-dialog__state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.artifact-preview-dialog__frame {
  width: 100%;
  height: 100%;
  min-height: 70vh;
  border: 0;
  background: white;
}

.artifact-preview-dialog__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.artifact-preview-dialog__text {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: white;
  border-radius: 12px;
}

@media (max-width: 720px) {
  .artifact-card__meta {
    grid-template-columns: 1fr;
  }
}
</style>
