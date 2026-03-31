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

          <div
            v-if="showIntakeProgressBar"
            class="intake-progress-strip"
          >
            <div class="row items-center q-col-gutter-sm q-mb-xs">
              <div class="col row items-center q-col-gutter-xs text-caption text-grey-7">
                <q-spinner
                  v-if="processingDrop"
                  color="primary"
                  size="16px"
                />
                <span>{{ intakeProgressLabel }}</span>
              </div>
              <div v-if="showReviewNowButton" class="col-auto">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="rule"
                  label="Review now"
                  @click="openIntakeReviewNow"
                />
              </div>
            </div>
            <div class="intake-horizontal-progress intake-horizontal-progress--compact">
              <div class="intake-horizontal-progress__track">
                <div
                  class="intake-horizontal-progress__fill"
                  :style="{ width: `${intakeProgressPercent}%` }"
                />
                <div
                  v-for="flag in intakeProgressFlags"
                  :key="flag.key"
                  class="intake-horizontal-progress__flag"
                  :class="{ 'intake-horizontal-progress__flag--active': flag.active }"
                  :style="{ left: `${flag.percent}%` }"
                >
                  <span class="intake-horizontal-progress__flag-dot" />
                </div>
              </div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs text-right">
              {{ intakeProgressPercent }}%
            </div>
          </div>

          <div v-if="releasedMarkdownChunkRows.length" class="column q-gutter-md">
            <div>
              <div class="text-subtitle1">Document Preview</div>
              <div class="text-caption text-grey-7">
                Review the generated markdown before the intake continues.
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div
                v-for="chunk in releasedMarkdownChunkRows.slice(0, 3)"
                :key="chunk.chunk_id"
                class="col-12 col-md-4"
              >
                <q-card flat bordered class="full-height bg-grey-1">
                  <q-card-section class="q-pb-sm">
                    <div class="text-subtitle2">{{ chunk.title || 'Markdown chunk' }}</div>
                    <div class="text-caption text-grey-7">
                      {{ chunk.used_by.join(' • ') || 'Ready for extraction' }}
                    </div>
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <div class="text-body2" style="white-space: pre-wrap">
                      {{ truncateMarkdownPreview(chunk.markdown_text) || 'Preview loading...' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <div class="opportunity-dialog-sections">
            <section class="opportunity-dialog-section">
              <div class="text-subtitle1">Company</div>
              <div class="text-caption text-grey-7 q-mb-sm">
                These are first-order company fields. When a company is linked, edits here save back to that
                company record.
              </div>

              <div class="opportunity-dialog-section__grid">
                <div
                  class="opportunity-dialog-section__field opportunity-dialog-section__field--full"
                  :style="{ order: companyLayoutOrder.Company_Name }"
                >
                  <q-input
                    v-if="companyLinkMode === 'new'"
                    v-model="companyForm.Company_Name"
                    outlined
                    label="Company Name"
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
                    @filter="onCompanyOptionFilter"
                  />

                  <div
                    v-if="showFieldSourceToggle('company', 'Company_Name')"
                    class="field-source-toggle"
                  >
                    <q-btn-toggle
                      :model-value="getFieldSourceMode('company', 'Company_Name')"
                      dense
                      flat
                      rounded
                      no-caps
                      toggle-color="primary"
                      color="grey-2"
                      text-color="grey-7"
                      :options="fieldSourceOptions"
                      @update:model-value="setFieldSourceMode('company', 'Company_Name', $event)"
                    />
                  </div>
                </div>

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
                  <div
                    class="opportunity-dialog-section__field"
                    :class="{
                      'opportunity-dialog-section__field--full': companyFullWidthFieldKeys.has(field.key),
                    }"
                    :style="{ order: companyLayoutOrder[field.key] ?? 50 }"
                  >
                    <q-select
                      v-if="field.key === 'Company_Type'"
                      v-model="companyForm.Company_Type"
                      outlined
                      emit-value
                      map-options
                      :label="field.label"
                      :options="companyTypeOptions"
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
                      :disable="loading || processingDrop"
                      :input-class="fieldInputClass('company', field.key)"
                    />
                    <q-input
                      v-else
                      v-model="companyForm[field.key]"
                      outlined
                      :label="field.label"
                      :type="field.inputType"
                      :disable="loading || processingDrop"
                      :input-class="fieldInputClass('company', field.key)"
                    />

                    <div
                      v-if="showFieldSourceToggle('company', field.key)"
                      class="field-source-toggle"
                    >
                      <q-btn-toggle
                        :model-value="getFieldSourceMode('company', field.key)"
                        dense
                        flat
                        rounded
                        no-caps
                        toggle-color="primary"
                        color="grey-2"
                        text-color="grey-7"
                        :options="fieldSourceOptions"
                        @update:model-value="setFieldSourceMode('company', field.key, $event)"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <section class="opportunity-dialog-section">
              <div class="text-subtitle1">Opportunity</div>
              <div class="text-caption text-grey-7 q-mb-sm">
                These are first-order opportunity fields. Relationship fields below link this
                {{ entityLabel.toLowerCase() }} to other canonical records.
              </div>

              <div class="opportunity-dialog-section__grid">
                <div class="opportunity-dialog-section__field opportunity-dialog-section__field--full">
                  <q-input
                    v-model="form.Venture_Oppty_Name"
                    outlined
                    :label="`${entityLabel} Name`"
                    :error="Boolean(opportunityNameError)"
                    :error-message="opportunityNameError"
                    :disable="loading || processingDrop"
                    :input-class="fieldInputClass('opportunity', 'Venture_Oppty_Name')"
                    @update:model-value="markOpportunityNameEdited"
                  />

                  <div
                    v-if="showFieldSourceToggle('opportunity', 'Venture_Oppty_Name')"
                    class="field-source-toggle"
                  >
                    <q-btn-toggle
                      :model-value="getFieldSourceMode('opportunity', 'Venture_Oppty_Name')"
                      dense
                      flat
                      rounded
                      no-caps
                      toggle-color="primary"
                      color="grey-2"
                      text-color="grey-7"
                      :options="fieldSourceOptions"
                      @update:model-value="setFieldSourceMode('opportunity', 'Venture_Oppty_Name', $event)"
                    />
                  </div>
                </div>

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

                <div
                  v-for="field in opportunityFields"
                  :key="field.key"
                  class="opportunity-dialog-section__field"
                >
                  <q-input
                    v-model="form[field.key]"
                    outlined
                    :label="field.label"
                    :type="field.inputType"
                    :disable="loading || processingDrop"
                    :input-class="fieldInputClass('opportunity', field.key)"
                  />

                  <div
                    v-if="showFieldSourceToggle('opportunity', field.key)"
                    class="field-source-toggle"
                  >
                    <q-btn-toggle
                      :model-value="getFieldSourceMode('opportunity', field.key)"
                      dense
                      flat
                      rounded
                      no-caps
                      toggle-color="primary"
                      color="grey-2"
                      text-color="grey-7"
                      :options="fieldSourceOptions"
                      @update:model-value="setFieldSourceMode('opportunity', field.key, $event)"
                    />
                  </div>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="text-subtitle2">Relationships</div>
              <div class="opportunity-dialog-section__grid">
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
                  class="opportunity-dialog-section__field"
                  :disable="loading || processingDrop"
                  @filter="(value, update) => filterRelationshipOptions(value, update, 'project')"
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
                  class="opportunity-dialog-section__field"
                  :disable="loading || processingDrop"
                  @filter="(value, update) => filterRelationshipOptions(value, update, 'task')"
                />
              </div>
            </section>
          </div>

          <q-separator />

          <div class="q-gutter-md">
            <div class="text-subtitle1">Primary Contact</div>
            <div class="text-caption text-grey-7 q-mb-sm">
              These are first-order contact fields. When a contact is linked, edits here save back to that
              contact record.
            </div>
            <div v-if="contactLinkMode === 'existing'">
              <q-select
                v-model="contactForm.id"
                outlined
                label="Contact Name"
                :options="contactOptions"
                :disable="loadingContacts || loading || processingDrop"
                emit-value
                map-options
                option-label="label"
                option-value="value"
                options-dense
                use-input
                input-debounce="0"
                @filter="onContactOptionFilter"
              />
              <div
                v-if="showFieldSourceToggle('contact', 'id')"
                class="field-source-toggle"
              >
                <q-btn-toggle
                  :model-value="getFieldSourceMode('contact', 'id')"
                  dense
                  flat
                  rounded
                  no-caps
                  toggle-color="primary"
                  color="grey-2"
                  text-color="grey-7"
                  :options="fieldSourceOptions"
                  @update:model-value="setFieldSourceMode('contact', 'id', $event)"
                />
              </div>
            </div>
            <q-option-group
              v-model="contactLinkMode"
              inline
              :options="contactLinkOptions"
              color="primary"
              :disable="loading || loadingContacts || processingDrop"
            />
            <div v-for="field in contactFields" :key="field.key">
              <q-input
                v-model="contactForm[field.key]"
                outlined
                :label="field.label"
                :type="field.inputType"
                :disable="loading || processingDrop"
                :input-class="fieldInputClass('contact', field.key)"
              />
              <div
                v-if="showFieldSourceToggle('contact', field.key)"
                class="field-source-toggle"
              >
                <q-btn-toggle
                  :model-value="getFieldSourceMode('contact', field.key)"
                  dense
                  flat
                  rounded
                  no-caps
                  toggle-color="primary"
                  color="grey-2"
                  text-color="grey-7"
                  :options="fieldSourceOptions"
                  @update:model-value="setFieldSourceMode('contact', field.key, $event)"
                />
              </div>
            </div>
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
  <q-dialog v-model="intakeReviewDialogOpen" persistent>
    <q-card style="width: 560px; max-width: 94vw">
      <q-card-section class="q-px-lg q-pt-lg q-pb-sm">
        <div class="text-h6">Priority Review</div>
        <div class="text-caption text-grey-7">
          We found the earliest high-value matches. Please confirm these before intake keeps moving.
        </div>
      </q-card-section>

      <q-card-section class="q-px-lg q-pb-md">
        <div class="column q-gutter-md">
          <div
            v-if="intakeVisibleFieldKeys.includes('sponsorCompany')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.sponsorCompany"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Sponsor Company"
                :options="intakeSponsorCompanyOptions"
                :class="promptFieldClass('sponsorCompany')"
                :input-class="promptFieldInputClass('sponsorCompany')"
                @update:model-value="updateIntakeReviewField('sponsorCompany', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('sponsorCompany')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.sponsorCompany"
                label="Verify"
                @click="verifyIntakeReviewField('sponsorCompany')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('existingOpportunityMatch')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.existingOpportunityMatch"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Existing Opportunity Match"
                :options="intakeExistingOpportunityOptions"
                :class="promptFieldClass('existingOpportunityMatch')"
                :input-class="promptFieldInputClass('existingOpportunityMatch')"
                @update:model-value="updateIntakeReviewField('existingOpportunityMatch', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('existingOpportunityMatch')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.existingOpportunityMatch"
                label="Verify"
                @click="verifyIntakeReviewField('existingOpportunityMatch')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('matchingDocumentName')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.matchingDocumentName"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Matching Document Name"
                :options="intakeMatchingDocumentOptions"
                :class="promptFieldClass('matchingDocumentName')"
                :input-class="promptFieldInputClass('matchingDocumentName')"
                @update:model-value="updateIntakeReviewField('matchingDocumentName', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('matchingDocumentName')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.matchingDocumentName"
                label="Verify"
                @click="verifyIntakeReviewField('matchingDocumentName')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('relatedFund')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.relatedFund"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Related Fund"
                :options="intakeFundOptions"
                :class="promptFieldClass('relatedFund')"
                :input-class="promptFieldInputClass('relatedFund')"
                @update:model-value="updateIntakeReviewField('relatedFund', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('relatedFund')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.relatedFund"
                label="Verify"
                @click="verifyIntakeReviewField('relatedFund')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('relatedRound')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.relatedRound"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Related Round"
                :options="intakeRoundOptions"
                :class="promptFieldClass('relatedRound')"
                :input-class="promptFieldInputClass('relatedRound')"
                @update:model-value="updateIntakeReviewField('relatedRound', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('relatedRound')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.relatedRound"
                label="Verify"
                @click="verifyIntakeReviewField('relatedRound')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('relatedContact')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.relatedContact"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Related Contact"
                :options="intakeContactPromptOptions"
                :class="promptFieldClass('relatedContact')"
                :input-class="promptFieldInputClass('relatedContact')"
                @update:model-value="updateIntakeReviewField('relatedContact', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('relatedContact')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.relatedContact"
                label="Verify"
                @click="verifyIntakeReviewField('relatedContact')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('website')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-input
                :model-value="intakeReviewFields.website"
                outlined
                label="Website"
                :class="promptFieldClass('website')"
                :input-class="promptFieldInputClass('website')"
                @update:model-value="updateIntakeReviewField('website', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('website')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.website"
                label="Verify"
                @click="verifyIntakeReviewField('website')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('documentType')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-select
                :model-value="intakeReviewFields.documentType"
                outlined
                use-input
                fill-input
                hide-selected
                new-value-mode="add-unique"
                label="Document Type"
                :options="intakeDocumentTypeOptions"
                :class="promptFieldClass('documentType')"
                :input-class="promptFieldInputClass('documentType')"
                @update:model-value="updateIntakeReviewField('documentType', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('documentType')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.documentType"
                label="Verify"
                @click="verifyIntakeReviewField('documentType')"
              />
            </div>
          </div>

          <div
            v-if="intakeVisibleFieldKeys.includes('artifactTitle')"
            class="row q-col-gutter-sm items-start"
          >
            <div class="col">
              <q-input
                :model-value="intakeReviewFields.artifactTitle"
                outlined
                label="Artifact Title"
                :class="promptFieldClass('artifactTitle')"
                :input-class="promptFieldInputClass('artifactTitle')"
                @update:model-value="updateIntakeReviewField('artifactTitle', $event)"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Not this"
                @click="rejectIntakeReviewField('artifactTitle')"
              />
              <q-btn
                color="primary"
                no-caps
                :outline="!intakeReviewVerified.artifactTitle"
                label="Verify"
                @click="verifyIntakeReviewField('artifactTitle')"
              />
            </div>
          </div>

          <q-card
            v-if="intakeUsedInfoRows.length"
            flat
            bordered
            class="bg-grey-1"
          >
            <q-card-section class="q-py-sm row items-center justify-between no-wrap q-col-gutter-sm">
              <div class="col">
                <div class="text-subtitle2">Verified Information</div>
                <div class="text-caption text-grey-7">
                  Verified items guide extraction, but you can still change final values in the dialog before create.
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  :label="intakeUsedInfoExpanded ? 'Hide' : 'View'"
                  :icon="intakeUsedInfoExpanded ? 'expand_less' : 'expand_more'"
                  @click="intakeUsedInfoExpanded = !intakeUsedInfoExpanded"
                />
              </div>
            </q-card-section>
            <q-separator v-if="intakeUsedInfoExpanded" />
            <q-card-section v-if="intakeUsedInfoExpanded" class="q-py-sm">
              <div class="column q-gutter-sm">
                <div
                  v-for="row in intakeUsedInfoRows"
                  :key="row.key"
                  class="intake-used-row"
                >
                  <div class="text-body2"><b>{{ row.label }}:</b> {{ row.value }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-px-lg q-py-md">
        <q-btn
          flat
          no-caps
          color="grey-7"
          label="Skip for now"
          @click="skipIntakeReviewDialog"
        />
        <q-btn
          color="primary"
          no-caps
          label="Continue Processing"
          :disable="!intakeReviewReadyToContinue"
          @click="confirmIntakeReviewDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  createIntakeDraft,
  recordDraftMetadataClaim,
  removeIntakeDraft,
  updateIntakeDraft,
  upsertDraftMarkdownChunk,
  useIntakeDraftState,
} from 'src/utils/intakeDraftState'

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
const intakeDraftState = useIntakeDraftState()
const entityType = computed(() => {
  const normalized = String(props.initialKind || '').trim().toLowerCase()
  return normalized === 'fund' ? 'fund' : 'round'
})
const entityLabel = computed(() => (entityType.value === 'fund' ? 'Fund' : 'Round'))

const loading = ref(false)
const processingDrop = ref(false)
const processingMessage = ref('')
const loadingCompanies = ref(false)
const loadingContacts = ref(false)
const companies = ref([])
const contacts = ref([])
const opportunities = ref([])
const projects = ref([])
const tasks = ref([])
const filteredProjects = ref([])
const filteredTasks = ref([])
const existingOpportunityNames = ref([])
const companyLinkMode = ref('new')
const contactLinkMode = ref('new')
const companySourceChoice = ref('input')
const companyPreviewDialogOpen = ref(false)
const companyPreviewSource = ref('input')
const intakeReviewDialogOpen = ref(false)
const intakeUsedInfoExpanded = ref(false)
const intakeReviewDelayElapsed = ref(false)
const intakeReviewPromptShown = ref(false)
const intakeReviewPending = ref(false)
const intakeConfirmedFieldValues = ref(createDefaultIntakeReviewFields())
const intakeRejectedFieldValues = ref(createDefaultIntakeReviewFields())
const companyOptionFilter = ref('')
const contactOptionFilter = ref('')
const dragOver = ref(false)
const ingestStatusByFile = ref({})

const extractedCompanyForm = ref(null)
const extractedContactForm = ref(null)

const generatedNotes = ref([])
const generatedTasks = ref([])
const assistantProposal = ref({})

const draftOpportunityId = ref(null)
const draftArtifactIds = ref([])
const didSubmit = ref(false)
const opportunityNameManuallyEdited = ref(false)
const droppedFilesForPrompt = ref([])
const existingDocumentNameMatches = ref([])
const intakeReviewFields = ref(createDefaultIntakeReviewFields())
const intakeReviewVerified = ref(createDefaultIntakeReviewVerified())
const intakeLockedFields = ref(createDefaultIntakeReviewVerified())
const intakeFieldSources = ref(createDefaultIntakeReviewSources())
const deferredSuggestionPayload = ref(null)

const autofilledFlags = ref({})
const fieldSourceModes = ref({})

const fieldSourceOptions = [
  { icon: 'auto_awesome', value: 'ai' },
  { icon: 'edit', value: 'human' },
]

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
const contactLinkOptions = [
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
const activeDraft = computed(() => {
  const draftId = String(intakeDraftState.activeDraftId || '').trim()
  return draftId ? intakeDraftState.drafts[draftId] || null : null
})

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

const rankedContacts = computed(() => {
  const searchBase = normalizeComparisonText(
    contactOptionFilter.value ||
      contactForm.value.Name ||
      contactForm.value.Professional_Email ||
      contactForm.value.Personal_Email,
  )

  return (contacts.value || [])
    .filter((contact) => contact?.Name || contact?.Professional_Email || contact?.Personal_Email)
    .map((contact) => ({
      contact,
      score: scoreContactMatch(contact, searchBase),
      label: buildContactOptionLabel(contact),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.label.localeCompare(right.label)
    })
})

const contactOptions = computed(() => [
  { label: '-', value: null },
  ...rankedContacts.value.map(({ contact, label }) => ({
    label,
    value: contact.id,
  })),
])

const intakeVisibleFieldKeys = computed(() => {
  const pendingKeys = getPendingIntakeReviewFieldKeys(intakeReviewFields.value)
  return pendingKeys.length ? pendingKeys : buildVisibleIntakeFieldKeys(intakeReviewFields.value)
})

const intakeReviewVisiblePendingKeys = computed(() =>
  intakeVisibleFieldKeys.value.filter((key) => String(intakeReviewFields.value[key] || '').trim().length > 0),
)

const showReviewNowButton = computed(() => {
  if (intakeReviewDialogOpen.value) return false
  if (processingDrop.value) return true
  return getPendingIntakeReviewFieldKeys(buildIntakeReviewFieldsFromForms()).length > 0
})

const intakeReviewReadyToContinue = computed(() => {
  if (!intakeReviewVisiblePendingKeys.value.length) return true
  return intakeReviewVisiblePendingKeys.value.every((key) => Boolean(intakeReviewVerified.value[key]))
})

const intakeUsedInfoRows = computed(() =>
  Object.entries(intakeLockedFields.value)
    .filter(([, isLocked]) => Boolean(isLocked))
    .map(([key]) => ({
      key,
      label: intakeFieldLabel(key),
      owner: intakeFieldOwner(key),
      target: intakeFieldTarget(key),
      value: intakeReviewFields.value[key] || 'No value',
      source: intakeFieldSources.value[key] || 'User verified prompt suggestion',
    })),
)

const releasedMarkdownChunkRows = computed(() =>
  Object.values(activeDraft.value?.releasedMarkdownChunks || {})
    .sort((left, right) => String(left?.created_at || '').localeCompare(String(right?.created_at || '')))
    .map((chunk) => ({
      ...chunk,
      title:
        String(chunk?.section_hint || '').trim() ||
        String(chunk?.artifact_id || '').trim() ||
        String(chunk?.chunk_id || '').trim(),
      used_by: Array.isArray(chunk?.used_by) ? chunk.used_by : [],
      owned_fields: Array.isArray(chunk?.owned_fields) ? chunk.owned_fields : [],
    })),
)

const intakeProgressMetrics = computed(() => {
  const rows = ingestStatusRows.value
  const totalFiles = rows.length
  if (!totalFiles) {
    return {
      value: 0,
      percent: 0,
      label: 'Waiting for dropped files',
    }
  }

  const totalSteps = totalFiles * 3
  let completedSteps = 0
  for (const row of rows) {
    if (['completed', 'existing'].includes(String(row?.uploadStatus || ''))) completedSteps += 1
    if (['completed', 'existing'].includes(String(row?.markdownStatus || ''))) completedSteps += 1
    if (['completed', 'existing'].includes(String(row?.extractionStatus || ''))) completedSteps += 1
  }

  const rawValue = totalSteps ? completedSteps / totalSteps : 0
  const value = Math.min(1, rawValue)

  let label = 'Queued'
  if (processingDrop.value) label = processingMessage.value || 'Processing dropped files'
  else if (value >= 1) label = 'Ready for review'

  return {
    value,
    percent: Math.round(value * 100),
    label,
  }
})

const intakeProgressValue = computed(() => intakeProgressMetrics.value.value)
const intakeProgressPercent = computed(() => intakeProgressMetrics.value.percent)
const intakeProgressLabel = computed(() => intakeProgressMetrics.value.label)
const intakeProgressFlags = computed(() => [
  {
    key: 'drop',
    label: 'Dropped',
    percent: 12,
    active: ingestStatusRows.value.length > 0,
  },
  {
    key: 'markdown',
    label: 'Markdown',
    percent: 38,
    active: ingestStatusRows.value.some((row) => ['completed', 'existing'].includes(String(row?.markdownStatus || ''))),
  },
  {
    key: 'extract',
    label: 'Early Extract',
    percent: 64,
    active: ingestStatusRows.value.some((row) => ['completed', 'existing'].includes(String(row?.extractionStatus || ''))),
  },
  {
    key: 'review',
    label: 'Review',
    percent: 88,
    active: intakeProgressValue.value >= 1,
  },
])
const showIntakeProgressBar = computed(() => ingestStatusRows.value.length > 0)

const intakeDocumentTypeOptions = [
  'Pitch Deck',
  'Term Sheet',
  'Financial Model',
  'Investment Memo',
  'PDF Document',
  'Text Document',
]

const intakeSponsorCompanyOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.sponsorCompany,
    ...companies.value.map((company) => stripHumanVerify(company?.Company_Name)),
  ]),
)

const intakeExistingOpportunityOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.existingOpportunityMatch,
    ...opportunities.value.map((row) => buildFullOpportunityPromptLabel(row)),
  ]),
)

const intakeMatchingDocumentOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.matchingDocumentName,
    ...existingDocumentNameMatches.value,
  ]),
)

const intakeFundOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.relatedFund,
    ...opportunities.value
      .filter((row) => normalizeOpportunityKind(row) === 'fund')
      .map((row) => buildOpportunityPromptLabel(row)),
  ]),
)

const intakeRoundOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.relatedRound,
    ...opportunities.value
      .filter((row) => normalizeOpportunityKind(row) === 'round')
      .map((row) => buildOpportunityPromptLabel(row)),
  ]),
)

const intakeContactPromptOptions = computed(() =>
  buildPromptStringOptions([
    intakeReviewFields.value.relatedContact,
    ...contacts.value.map((contact) => buildContactOptionLabel(contact)),
  ]),
)

const kindOptions = [
  { label: 'Round', value: 'round' },
  { label: 'Fund', value: 'fund' },
]

const selectedCompany = computed(
  () => (companies.value || []).find((c) => c?.id === form.value?.company_id) || null,
)
const selectedContact = computed(
  () => (contacts.value || []).find((contact) => contact?.id === contactForm.value?.id) || null,
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
  const hasContact = String(contactForm.value.Name || '').trim().length > 0 || !!contactForm.value.id
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
    related_project_ids: [],
    related_task_ids: [],
  }
  companyForm.value = createDefaultCompanyForm()
  contactForm.value = createDefaultContactForm()
}

function resetTransientState() {
  dragOver.value = false
  extractedCompanyForm.value = null
  existingOpportunityNames.value = []
  opportunities.value = []
  companyLinkMode.value = 'new'
  contactLinkMode.value = 'new'
  companySourceChoice.value = 'input'
  companyOptionFilter.value = ''
  contactOptionFilter.value = ''
  companyPreviewDialogOpen.value = false
  companyPreviewSource.value = 'input'
  opportunityNameManuallyEdited.value = false
  extractedContactForm.value = null
  generatedNotes.value = []
  generatedTasks.value = []
  assistantProposal.value = {}
  ingestStatusByFile.value = {}
  processingMessage.value = ''
  draftOpportunityId.value = null
  draftArtifactIds.value = []
  droppedFilesForPrompt.value = []
  existingDocumentNameMatches.value = []
  autofilledFlags.value = {}
  fieldSourceModes.value = {}
  intakeReviewDialogOpen.value = false
  intakeReviewDelayElapsed.value = false
  intakeReviewPromptShown.value = false
  intakeReviewPending.value = false
  intakeReviewFields.value = createDefaultIntakeReviewFields()
  intakeReviewVerified.value = createDefaultIntakeReviewVerified()
  intakeConfirmedFieldValues.value = createDefaultIntakeReviewFields()
  intakeRejectedFieldValues.value = createDefaultIntakeReviewFields()
  intakeLockedFields.value = createDefaultIntakeReviewVerified()
  intakeFieldSources.value = createDefaultIntakeReviewSources()
  deferredSuggestionPayload.value = null
  clearIntakeReviewTimer()
}

function buildDraftSnapshot() {
  return {
    stage: processingDrop.value ? 'Extracting' : activeDraft.value?.stage || 'Quick Review Needed',
    droppedFiles: activeDraft.value?.droppedFiles || [],
    ingestStatusByFile: { ...ingestStatusByFile.value },
    generatedNotes: [...generatedNotes.value],
    generatedTasks: [...generatedTasks.value],
    assistantProposal: { ...assistantProposal.value },
    draftArtifactIds: [...draftArtifactIds.value],
    opportunityForm: JSON.parse(JSON.stringify(form.value || {})),
    companyForm: JSON.parse(JSON.stringify(companyForm.value || {})),
    contactForm: JSON.parse(JSON.stringify(contactForm.value || {})),
    companyLinkMode: companyLinkMode.value,
    contactLinkMode: contactLinkMode.value,
    companySourceChoice: companySourceChoice.value,
    fieldSourceModes: { ...fieldSourceModes.value },
    existingDocumentNameMatches: [...existingDocumentNameMatches.value],
    intakeReviewFields: { ...intakeReviewFields.value },
    intakeReviewVerified: { ...intakeReviewVerified.value },
    intakeConfirmedFieldValues: { ...intakeConfirmedFieldValues.value },
    intakeRejectedFieldValues: { ...intakeRejectedFieldValues.value },
    intakeLockedFields: { ...intakeLockedFields.value },
    intakeFieldSources: { ...intakeFieldSources.value },
  }
}

function syncActiveDraft(updates = {}) {
  if (!activeDraft.value?.id) return
  updateIntakeDraft(activeDraft.value.id, {
    ...buildDraftSnapshot(),
    ...updates,
  })
}

function ensureActiveDraftForFiles(files = []) {
  if (activeDraft.value?.id) return activeDraft.value.id
  const draft = createIntakeDraft({
    droppedFiles: files,
    stage: 'Dropped',
  })
  return draft?.id || null
}

function hydrateFromActiveDraft() {
  if (!activeDraft.value) return false
  const hasMeaningfulDraftState =
    Boolean(activeDraft.value.opportunityForm) ||
    Boolean(activeDraft.value.companyForm) ||
    Boolean(activeDraft.value.contactForm) ||
    Object.keys(activeDraft.value.ingestStatusByFile || {}).length > 0 ||
    (Array.isArray(activeDraft.value.draftArtifactIds) && activeDraft.value.draftArtifactIds.length > 0) ||
    (Array.isArray(activeDraft.value.generatedNotes) && activeDraft.value.generatedNotes.length > 0) ||
    (Array.isArray(activeDraft.value.generatedTasks) && activeDraft.value.generatedTasks.length > 0) ||
    Object.keys(activeDraft.value.assistantProposal || {}).length > 0

  if (activeDraft.value.opportunityForm) {
    form.value = {
      ...form.value,
      ...activeDraft.value.opportunityForm,
    }
  }
  if (activeDraft.value.companyForm) {
    companyForm.value = {
      ...companyForm.value,
      ...activeDraft.value.companyForm,
    }
  }
  if (activeDraft.value.contactForm) {
    contactForm.value = {
      ...contactForm.value,
      ...activeDraft.value.contactForm,
    }
  }
  existingDocumentNameMatches.value = Array.isArray(activeDraft.value.existingDocumentNameMatches)
    ? [...activeDraft.value.existingDocumentNameMatches]
    : []

  companyLinkMode.value = activeDraft.value.companyLinkMode || companyLinkMode.value
  contactLinkMode.value = activeDraft.value.contactLinkMode || contactLinkMode.value
  companySourceChoice.value = activeDraft.value.companySourceChoice || companySourceChoice.value
  fieldSourceModes.value = { ...(activeDraft.value.fieldSourceModes || {}) }
  intakeReviewFields.value = {
    ...createDefaultIntakeReviewFields(),
    ...(activeDraft.value.intakeReviewFields || {}),
  }
  intakeReviewVerified.value = {
    ...createDefaultIntakeReviewVerified(),
    ...(activeDraft.value.intakeReviewVerified || {}),
  }
  intakeConfirmedFieldValues.value = {
    ...createDefaultIntakeReviewFields(),
    ...(activeDraft.value.intakeConfirmedFieldValues || {}),
  }
  intakeRejectedFieldValues.value = {
    ...createDefaultIntakeReviewFields(),
    ...(activeDraft.value.intakeRejectedFieldValues || {}),
  }
  intakeLockedFields.value = {
    ...createDefaultIntakeReviewVerified(),
    ...(activeDraft.value.intakeLockedFields || {}),
  }
  intakeFieldSources.value = {
    ...createDefaultIntakeReviewSources(),
    ...(activeDraft.value.intakeFieldSources || {}),
  }
  ingestStatusByFile.value = { ...(activeDraft.value.ingestStatusByFile || {}) }
  generatedNotes.value = Array.isArray(activeDraft.value.generatedNotes) ? [...activeDraft.value.generatedNotes] : []
  generatedTasks.value = Array.isArray(activeDraft.value.generatedTasks) ? [...activeDraft.value.generatedTasks] : []
  assistantProposal.value = { ...(activeDraft.value.assistantProposal || {}) }
  draftArtifactIds.value = Array.isArray(activeDraft.value.draftArtifactIds) ? [...activeDraft.value.draftArtifactIds] : []
  return hasMeaningfulDraftState
}

function inferDocumentTypeFromDraft() {
  const sourceFiles = activeDraft.value?.droppedFiles?.length
    ? activeDraft.value.droppedFiles
    : droppedFilesForPrompt.value
  const fileNames = (sourceFiles || []).map((file) => String(file?.name || '').toLowerCase())
  if (!fileNames.length) return ''
  const joined = fileNames.join(' ')
  if (joined.includes('pitch') || joined.includes('deck') || joined.includes('presentation')) return 'Pitch Deck'
  if (joined.includes('term sheet') || joined.includes('termsheet')) return 'Term Sheet'
  if (joined.includes('model') || joined.includes('.xlsx') || joined.includes('.xls')) return 'Financial Model'
  if (joined.includes('memo')) return 'Investment Memo'
  if (joined.includes('.pdf')) return 'PDF Document'
  if (joined.includes('.doc') || joined.includes('.docx')) return 'Text Document'
  return ''
}

function inferCompanyNameFromDraft() {
  const sourceFiles = activeDraft.value?.droppedFiles?.length
    ? activeDraft.value.droppedFiles
    : droppedFilesForPrompt.value
  const rawName = String(sourceFiles?.[0]?.name || '').trim()
  if (!rawName) return ''
  const baseName = rawName.replace(/\.[^.]+$/, '')
  const hasDelimiter = /[_-]/.test(baseName)
  const firstSegment = baseName
    .split(/[_-]+/)
    .map((part) => String(part || '').trim())
    .find((part) => part.length > 2)
  if (!firstSegment) return ''
  const normalized = firstSegment
    .replace(/\b(deck|pitch|memo|model|term|sheet|presentation|fund|round|series|seed)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!normalized) return ''
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length
  const looksLikeTitle = /[:()]/.test(baseName) || tokenCount > 4 || normalized.length > 36
  if (!hasDelimiter && looksLikeTitle) return ''
  return normalized
}

function inferArtifactTitleFromDraft() {
  const sourceFiles = activeDraft.value?.droppedFiles?.length
    ? activeDraft.value.droppedFiles
    : droppedFilesForPrompt.value
  const rawName = String(sourceFiles?.[0]?.name || '').trim()
  if (!rawName) return ''
  return rawName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function createDefaultIntakeReviewFields(overrides = {}) {
  return {
    sponsorCompany: '',
    existingOpportunityMatch: '',
    matchingDocumentName: '',
    documentType: '',
    artifactTitle: '',
    relatedFund: '',
    relatedRound: '',
    relatedContact: '',
    website: '',
    ...overrides,
  }
}

const INTAKE_REVIEW_PRIORITY = Object.freeze([
  'sponsorCompany',
  'existingOpportunityMatch',
  'matchingDocumentName',
  'relatedContact',
  'website',
  'relatedFund',
  'relatedRound',
  'documentType',
  'artifactTitle',
])

function buildVisibleIntakeFieldKeys(fields = {}) {
  const prioritized = INTAKE_REVIEW_PRIORITY.filter((key) => {
    if (key === 'relatedFund') return entityType.value === 'fund' && String(fields[key] || '').trim()
    if (key === 'relatedRound') return entityType.value === 'round' && String(fields[key] || '').trim()
    return String(fields[key] || '').trim()
  })
  return prioritized.length ? prioritized : ['documentType']
}

function createDefaultIntakeReviewVerified(overrides = {}) {
  return {
    sponsorCompany: false,
    existingOpportunityMatch: false,
    matchingDocumentName: false,
    documentType: false,
    artifactTitle: false,
    relatedFund: false,
    relatedRound: false,
    relatedContact: false,
    website: false,
    ...overrides,
  }
}

function createDefaultIntakeReviewSources(overrides = {}) {
  return {
    sponsorCompany: '',
    existingOpportunityMatch: '',
    matchingDocumentName: '',
    documentType: '',
    artifactTitle: '',
    relatedFund: '',
    relatedRound: '',
    relatedContact: '',
    website: '',
    ...overrides,
  }
}

function intakeFieldLabel(fieldKey) {
  return {
    sponsorCompany: 'Sponsor Company',
    existingOpportunityMatch: 'Existing Opportunity Match',
    matchingDocumentName: 'Matching Document Name',
    documentType: 'Document Type',
    artifactTitle: 'Artifact Title',
    relatedFund: 'Related Fund',
    relatedRound: 'Related Round',
    relatedContact: 'Related Contact',
    website: 'Website',
  }[fieldKey] || fieldKey
}

function intakeFieldOwner(fieldKey) {
  return {
    sponsorCompany: 'Companies',
    existingOpportunityMatch: entityType.value === 'fund' ? 'Funds' : 'Rounds',
    matchingDocumentName: 'Artifacts',
    documentType: 'Artifacts',
    artifactTitle: 'Artifacts',
    relatedFund: 'Funds',
    relatedRound: 'Rounds',
    relatedContact: 'Contacts',
    website: 'Companies',
  }[fieldKey] || 'Draft Intake'
}

function intakeFieldTarget(fieldKey) {
  return {
    sponsorCompany: 'Company section',
    existingOpportunityMatch: 'Opportunity section',
    matchingDocumentName: 'Artifact file intake',
    documentType: 'Draft intake metadata',
    artifactTitle: 'Artifact title metadata',
    relatedFund: 'Opportunity section',
    relatedRound: 'Opportunity section',
    relatedContact: 'Primary Contact section',
    website: 'Company section',
  }[fieldKey] || 'Draft intake'
}

function buildIntakeReviewFieldsFromForms() {
  const relatedContact = [
    String(contactForm.value.Name || '').trim(),
    String(contactForm.value.Professional_Email || contactForm.value.Personal_Email || '').trim(),
  ]
    .filter(Boolean)
    .join(' - ')

  return createDefaultIntakeReviewFields({
    sponsorCompany: String(companyForm.value.Company_Name || '').trim() || inferCompanyNameFromDraft(),
    existingOpportunityMatch: findLikelyExistingOpportunityMatchLabel(),
    matchingDocumentName: existingDocumentNameMatches.value[0] || '',
    documentType: inferDocumentTypeFromDraft(),
    artifactTitle: inferArtifactTitleFromDraft(),
    relatedFund: entityType.value === 'fund' ? String(form.value.Venture_Oppty_Name || '').trim() : '',
    relatedRound:
      entityType.value === 'round'
        ? String(form.value.Round_Stage || form.value.Venture_Oppty_Name || '').trim()
        : String(form.value.Round_Stage || '').trim(),
    relatedContact,
    website: String(companyForm.value.Website || '').trim(),
  })
}

function getPendingIntakeReviewFieldKeys(fields = intakeReviewFields.value) {
  return INTAKE_REVIEW_PRIORITY.filter((key) => {
    if (key === 'relatedFund' && entityType.value !== 'fund') return false
    if (key === 'relatedRound' && entityType.value !== 'round') return false
    const value = String(fields[key] || '').trim()
    if (!value) return false
    const currentlyVerifiedValue = String(intakeReviewFields.value[key] || '').trim()
    if (Boolean(intakeReviewVerified.value[key]) && currentlyVerifiedValue === value) return false
    if (String(intakeRejectedFieldValues.value[key] || '').trim() === value) return false
    return String(intakeConfirmedFieldValues.value[key] || '').trim() !== value
  })
}

function queueAdditionalIntakeReviewIfNeeded() {
  if (!intakeReviewDelayElapsed.value || intakeReviewDialogOpen.value) return
  if (!getPendingIntakeReviewFieldKeys(buildIntakeReviewFieldsFromForms()).length) return
  intakeReviewPending.value = true
  intakeReviewPromptShown.value = false
  maybeOpenIntakeReviewDialog()
}

function buildPromptStringOptions(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function normalizeOpportunityKind(row = {}) {
  const explicitKind = String(row?.kind || row?.opportunity_kind || '').trim().toLowerCase()
  if (explicitKind === 'fund' || explicitKind === 'round') return explicitKind
  return String(row?.Round_Stage || row?.round_stage || '').trim() ? 'round' : 'fund'
}

function buildOpportunityPromptLabel(row = {}) {
  return (
    stripHumanVerify(row?.Venture_Oppty_Name || row?.opportunity_name || row?.name) ||
    stripHumanVerify(row?.Round_Stage || row?.round_stage) ||
    ''
  )
}

function buildFullOpportunityPromptLabel(row = {}) {
  const companyName = stripHumanVerify(row?.Company_Name || row?.company_name)
  const opportunityLabel = buildOpportunityPromptLabel(row)
  if (companyName && opportunityLabel) return `${companyName} - ${opportunityLabel}`
  return companyName || opportunityLabel || ''
}

function findOpportunityByPromptLabel(label) {
  const candidate = normalizeComparisonText(label)
  if (!candidate) return null
  return (
    opportunities.value.find((row) => normalizeComparisonText(buildFullOpportunityPromptLabel(row)) === candidate) ||
    opportunities.value.find((row) => normalizeComparisonText(buildOpportunityPromptLabel(row)) === candidate) ||
    null
  )
}

function scoreOpportunityPromptMatch(row = {}) {
  const companyCandidate = normalizeComparisonText(companyForm.value.Company_Name)
  const nameCandidate = normalizeComparisonText(
    entityType.value === 'fund'
      ? form.value.Venture_Oppty_Name
      : form.value.Venture_Oppty_Name || form.value.Round_Stage,
  )
  const rowCompany = normalizeComparisonText(row?.Company_Name || row?.company_name)
  const rowName = normalizeComparisonText(buildOpportunityPromptLabel(row))
  const rowKind = normalizeOpportunityKind(row)

  let score = 0
  if (rowKind === entityType.value) score += 2
  if (companyCandidate && rowCompany === companyCandidate) score += 4
  if (nameCandidate && rowName === nameCandidate) score += 5
  if (companyCandidate && nameCandidate && rowCompany === companyCandidate && rowName === nameCandidate) score += 3
  return score
}

function findLikelyExistingOpportunityMatchLabel() {
  const ranked = [...opportunities.value]
    .map((row) => ({ row, score: scoreOpportunityPromptMatch(row) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
  return ranked.length ? buildFullOpportunityPromptLabel(ranked[0].row) : ''
}

function findCompanyByName(name) {
  const candidate = normalizeComparisonText(name)
  if (!candidate) return null
  return companies.value.find((company) => normalizeComparisonText(company?.Company_Name) === candidate) || null
}

function findContactByPromptLabel(label) {
  const candidate = normalizeComparisonText(label)
  if (!candidate) return null
  return contacts.value.find((contact) => normalizeComparisonText(buildContactOptionLabel(contact)) === candidate) || null
}

let intakeReviewTimer = null
let intakeReviewResolver = null

function clearIntakeReviewTimer() {
  if (intakeReviewTimer) {
    clearTimeout(intakeReviewTimer)
    intakeReviewTimer = null
  }
}

function maybeOpenIntakeReviewDialog() {
  if (!intakeReviewPending.value || !intakeReviewDelayElapsed.value || intakeReviewPromptShown.value) return
  const nextFields = buildIntakeReviewFieldsFromForms()
  const pendingKeys = getPendingIntakeReviewFieldKeys(nextFields)
  if (!pendingKeys.length) {
    resolveIntakeReviewGate()
    return
  }
  intakeReviewFields.value = nextFields
  intakeReviewVerified.value = buildNextIntakeReviewVerified(nextFields)
  intakeReviewDialogOpen.value = true
  intakeReviewPromptShown.value = true
  processingMessage.value = 'Waiting for your confirmation on key metadata...'
}

function openIntakeReviewNow() {
  const nextFields = buildIntakeReviewFieldsFromForms()
  const pendingKeys = getPendingIntakeReviewFieldKeys(nextFields)
  if (!pendingKeys.length) {
    $q.notify({
      type: 'info',
      message: processingDrop.value
        ? 'Verification prompts will appear as soon as reviewable values are extracted.'
        : 'There are no reviewable values waiting right now.',
    })
    return
  }

  intakeReviewDelayElapsed.value = true
  intakeReviewPending.value = true
  intakeReviewPromptShown.value = false
  maybeOpenIntakeReviewDialog()
}

function buildNextIntakeReviewVerified(nextFields = {}) {
  const nextVerified = {
    ...createDefaultIntakeReviewVerified(),
    ...intakeReviewVerified.value,
  }

  for (const key of INTAKE_REVIEW_PRIORITY) {
    const nextValue = String(nextFields[key] || '').trim()
    const currentValue = String(intakeReviewFields.value[key] || '').trim()
    const confirmedValue = String(intakeConfirmedFieldValues.value[key] || '').trim()

    if (!nextValue) {
      nextVerified[key] = false
      continue
    }

    if (nextVerified[key] && currentValue === nextValue) continue
    if (confirmedValue && confirmedValue === nextValue) {
      nextVerified[key] = true
      continue
    }

    nextVerified[key] = false
  }

  return nextVerified
}

function resolveIntakeReviewGate() {
  intakeReviewPending.value = false
  const resolver = intakeReviewResolver
  intakeReviewResolver = null
  if (resolver) resolver()
}

function applyConfirmedIntakeReviewFields(fieldKeys = []) {
  for (const fieldKey of fieldKeys) {
    const normalized = String(intakeReviewFields.value[fieldKey] || '').trim()
    if (!normalized) continue
    verifyIntakeReviewField(fieldKey)
  }
}

function confirmIntakeReviewDialog() {
  if (!intakeReviewReadyToContinue.value) return
  const populatedEntries = Object.entries(intakeReviewFields.value).filter(([, value]) => String(value || '').trim().length > 0)
  const populatedKeys = populatedEntries.map(([key]) => key)
  applyConfirmedIntakeReviewFields(populatedKeys)
  intakeConfirmedFieldValues.value = {
    ...intakeConfirmedFieldValues.value,
    ...Object.fromEntries(populatedEntries.map(([key, value]) => [key, String(value || '').trim()])),
  }
  intakeReviewDialogOpen.value = false
  processingMessage.value = 'Continuing extraction...'
  resolveIntakeReviewGate()
  queueAdditionalIntakeReviewIfNeeded()
}

function skipIntakeReviewDialog() {
  intakeReviewDialogOpen.value = false
  intakeReviewPromptShown.value = false
  processingMessage.value = 'Continuing extraction without additional verification...'
  resolveIntakeReviewGate()
}

function updateIntakeReviewField(fieldKey, value) {
  intakeReviewFields.value = {
    ...intakeReviewFields.value,
    [fieldKey]: String(value || '').trim(),
  }
  intakeReviewVerified.value = {
    ...intakeReviewVerified.value,
    [fieldKey]: false,
  }
  intakeLockedFields.value = {
    ...intakeLockedFields.value,
    [fieldKey]: false,
  }
  intakeFieldSources.value = {
    ...intakeFieldSources.value,
    [fieldKey]: '',
  }
  intakeRejectedFieldValues.value = {
    ...intakeRejectedFieldValues.value,
    [fieldKey]: '',
  }
  syncActiveDraft()
}

function rejectIntakeReviewField(fieldKey) {
  const normalized = String(intakeReviewFields.value[fieldKey] || '').trim()
  intakeReviewFields.value = {
    ...intakeReviewFields.value,
    [fieldKey]: '',
  }
  intakeReviewVerified.value = {
    ...intakeReviewVerified.value,
    [fieldKey]: true,
  }
  intakeLockedFields.value = {
    ...intakeLockedFields.value,
    [fieldKey]: false,
  }
  intakeFieldSources.value = {
    ...intakeFieldSources.value,
    [fieldKey]: 'Rejected prompt suggestion',
  }
  intakeRejectedFieldValues.value = {
    ...intakeRejectedFieldValues.value,
    [fieldKey]: normalized,
  }
  syncActiveDraft()
}

function verifyIntakeReviewField(fieldKey) {
  const normalized = String(intakeReviewFields.value[fieldKey] || '').trim()
  if (!normalized) return
  let sourceLabel = 'User verified prompt suggestion'
  intakeLockedFields.value = {
    ...intakeLockedFields.value,
    [fieldKey]: true,
  }
  if (fieldKey === 'sponsorCompany') {
    companyForm.value.Company_Name = normalized
    const existingCompany = findCompanyByName(normalized)
    if (existingCompany?.id) {
      form.value.company_id = existingCompany.id
      companyLinkMode.value = 'existing'
      companySourceChoice.value = 'input'
      sourceLabel = 'Selected existing company match'
    }
    markAutofilled('company', 'Company_Name')
  } else if (fieldKey === 'existingOpportunityMatch') {
    const existingOpportunity = findOpportunityByPromptLabel(normalized)
    if (existingOpportunity) {
      form.value.Venture_Oppty_Name = stripHumanVerify(
        existingOpportunity?.Venture_Oppty_Name || existingOpportunity?.opportunity_name || existingOpportunity?.name,
      )
      form.value.Round_Stage = stripHumanVerify(existingOpportunity?.Round_Stage || existingOpportunity?.round_stage)
      form.value.kind = normalizeOpportunityKind(existingOpportunity)
      if (!String(companyForm.value.Company_Name || '').trim()) {
        companyForm.value.Company_Name = stripHumanVerify(existingOpportunity?.Company_Name || existingOpportunity?.company_name)
      }
      sourceLabel = 'Selected existing opportunity match'
      markAutofilled('opportunity', 'Venture_Oppty_Name')
      if (String(form.value.Round_Stage || '').trim()) markAutofilled('opportunity', 'Round_Stage')
    }
  } else if (fieldKey === 'matchingDocumentName') {
    sourceLabel = 'Acknowledged existing document name match'
    syncActiveDraft({
      acknowledgedExistingDocumentName: normalized,
    })
  } else if (fieldKey === 'relatedFund') {
    form.value.Venture_Oppty_Name = normalized
    form.value.kind = 'fund'
    markAutofilled('opportunity', 'Venture_Oppty_Name')
  } else if (fieldKey === 'relatedRound') {
    form.value.Round_Stage = normalized
    if (!String(form.value.Venture_Oppty_Name || '').trim()) {
      form.value.Venture_Oppty_Name = normalized
    }
    form.value.kind = 'round'
    markAutofilled('opportunity', 'Round_Stage')
  } else if (fieldKey === 'relatedContact') {
    const existingContact = findContactByPromptLabel(normalized)
    if (existingContact?.id) {
      contactForm.value = buildContactFormFromSource(existingContact)
      contactLinkMode.value = 'existing'
      sourceLabel = 'Selected existing contact match'
    } else {
      contactForm.value.Name = normalized
    }
    markAutofilled('contact', 'Name')
  } else if (fieldKey === 'documentType') {
    sourceLabel = 'Confirmed inferred document type'
    syncActiveDraft({
      inferredDocumentType: normalized,
    })
  } else if (fieldKey === 'artifactTitle') {
    sourceLabel = 'Confirmed inferred artifact title'
    syncActiveDraft({
      inferredArtifactTitle: normalized,
    })
  } else if (fieldKey === 'website') {
    companyForm.value.Website = normalized
    markAutofilled('company', 'Website')
  }
  intakeReviewVerified.value = {
    ...intakeReviewVerified.value,
    [fieldKey]: true,
  }
  intakeFieldSources.value = {
    ...intakeFieldSources.value,
    [fieldKey]: sourceLabel,
  }
  if (activeDraft.value?.id) {
    recordDraftMetadataClaim(activeDraft.value.id, {
      fieldKey,
      fieldValue: normalized,
      ownerTable: intakeFieldOwner(fieldKey),
      consumerLane:
        fieldKey === 'sponsorCompany'
          ? 'Company'
          : fieldKey === 'existingOpportunityMatch' || fieldKey === 'relatedFund' || fieldKey === 'relatedRound'
            ? 'Opportunity'
            : fieldKey === 'matchingDocumentName'
              ? 'Artifact Intake'
            : fieldKey === 'relatedContact'
              ? 'Contacts'
              : 'Artifact Intake',
      sourceChunkId: releasedMarkdownChunkRows.value[0]?.chunk_id || '',
      sourceType: 'user_verified_prompt',
      verificationState: 'verified',
      selectedSource: sourceLabel,
    })
  }
  syncActiveDraft()
}

async function waitForIntakeReviewConfirmation() {
  maybeOpenIntakeReviewDialog()
  if (!intakeReviewPending.value) return
  await new Promise((resolve) => {
    intakeReviewResolver = resolve
  })
}
function releaseIntakeExtractionLocks() {
  intakeLockedFields.value = createDefaultIntakeReviewVerified()
  syncActiveDraft()
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

async function loadContacts() {
  if (!bridge.value?.contacts?.list) return
  loadingContacts.value = true
  try {
    const result = await bridge.value.contacts.list()
    contacts.value = result?.contacts || []
  } finally {
    loadingContacts.value = false
  }
}

async function loadExistingOpportunityNames() {
  if (!bridge.value?.opportunities?.list) return
  const result = await bridge.value.opportunities.list()
  opportunities.value = Array.isArray(result?.opportunities) ? result.opportunities : []
  existingOpportunityNames.value = opportunities.value
    .map((row) => normalizeOpportunityName(row?.opportunity_name || row?.Venture_Oppty_Name))
    .filter(Boolean)
}

async function loadRelationshipOptions() {
  const [projectResult, taskResult] = await Promise.all([
    bridge.value?.projects?.list ? bridge.value.projects.list() : Promise.resolve({ projects: [] }),
    bridge.value?.tasks?.list ? bridge.value.tasks.list() : Promise.resolve({ tasks: [] }),
  ])

  projects.value = Array.isArray(projectResult?.projects) ? projectResult.projects : []
  tasks.value = taskResult?.tasks || []
  filteredProjects.value = [...projects.value]
  filteredTasks.value = [...tasks.value]
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
  if (!fieldSourceModes.value[`${section}.${key}`]) {
    fieldSourceModes.value[`${section}.${key}`] = 'ai'
  }
}

function fieldInputClass(section, key) {
  return getFieldSourceMode(section, key) === 'ai' && autofilledFlags.value[`${section}.${key}`]
    ? 'ec-autofilled-field'
    : ''
}

function getFieldSourceMode(section, key) {
  const fieldKey = `${section}.${key}`
  if (fieldSourceModes.value[fieldKey]) return fieldSourceModes.value[fieldKey]
  return autofilledFlags.value[fieldKey] ? 'ai' : 'human'
}

function showFieldSourceToggle(section, key) {
  return Boolean(autofilledFlags.value[`${section}.${key}`])
}

function setFieldSourceMode(section, key, value) {
  fieldSourceModes.value = {
    ...fieldSourceModes.value,
    [`${section}.${key}`]: value === 'human' ? 'human' : 'ai',
  }
  syncActiveDraft()
}

function promptFieldClass(fieldKey) {
  const hasValue = String(intakeReviewFields.value[fieldKey] || '').trim().length > 0
  return hasValue && !intakeReviewVerified.value[fieldKey] ? 'intake-proposed-field' : ''
}

function promptFieldInputClass(fieldKey) {
  const hasValue = String(intakeReviewFields.value[fieldKey] || '').trim().length > 0
  return hasValue && !intakeReviewVerified.value[fieldKey] ? 'intake-proposed-field__input' : ''
}

function normalizeOpportunityName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
}

function truncateMarkdownPreview(value, maxLength = 420) {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
    : normalized
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
  if (key === 'Company_Name') {
    return source.Company_Name ?? ''
  }
  if (key === 'Headquarters_City') {
    return source.Headquarters_City ?? source.headquarters_city ?? ''
  }
  if (key === 'Pax') {
    return source.Pax ?? source.PAX_Count ?? ''
  }
  return source[key] ?? ''
}

function createDefaultCompanyForm(overrides = {}) {
  return {
    Company_Name: '',
    Company_Type: entityType.value === 'fund' ? 'Asset Manager' : 'Corporation',
    One_Liner: '',
    Status: 'ongoing',
    Headquarters_City: '',
    Date_of_Incorporation: '',
    Pax: '',
    Updates: '',
    Website: '',
    ...overrides,
  }
}

function buildCompanyFormFromSource(source = {}, overrides = {}) {
  return createDefaultCompanyForm({
    Company_Name: stripHumanVerify(getCompanyFieldValue(source, 'Company_Name')),
    Company_Type: normalizeCompanyTypeValue(getCompanyFieldValue(source, 'Company_Type')),
    One_Liner: stripHumanVerify(getCompanyFieldValue(source, 'One_Liner')),
    Status: normalizeCompanyStatusValue(getCompanyFieldValue(source, 'Status')),
    Headquarters_City: stripHumanVerify(getCompanyFieldValue(source, 'Headquarters_City')),
    Date_of_Incorporation: stripHumanVerify(getCompanyFieldValue(source, 'Date_of_Incorporation')),
    Pax: stripHumanVerify(getCompanyFieldValue(source, 'Pax')),
    Updates: stripHumanVerify(getCompanyFieldValue(source, 'Updates')),
    Website: stripHumanVerify(getCompanyFieldValue(source, 'Website')),
    ...overrides,
  })
}

function createDefaultContactForm(overrides = {}) {
  return {
    id: '',
    Name: '',
    Personal_Email: '',
    Professional_Email: '',
    Phone: '',
    LinkedIn: '',
    Country_based: '',
    ...overrides,
  }
}

function buildContactFormFromSource(source = {}, overrides = {}) {
  return createDefaultContactForm({
    id: String(source?.id || '').trim(),
    Name: stripHumanVerify(source?.Name),
    Personal_Email: stripHumanVerify(source?.Personal_Email),
    Professional_Email: stripHumanVerify(source?.Professional_Email || source?.Email),
    Phone: stripHumanVerify(source?.Phone),
    LinkedIn: stripHumanVerify(source?.LinkedIn),
    Country_based: stripHumanVerify(source?.Country_based),
    ...overrides,
  })
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
  syncActiveDraft({ stage: 'Extracting' })
}

function updateStatusForAllFiles(partial = {}) {
  const next = { ...ingestStatusByFile.value }
  for (const [key, row] of Object.entries(next)) {
    next[key] = { ...row, ...partial }
  }
  ingestStatusByFile.value = next
  syncActiveDraft()
}

function isAutofillQuotaError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    message.includes('quota exceeded') ||
    message.includes('rate limit') ||
    message.includes('failed after 3 attempts') ||
    message.includes('generate_content_free_tier_requests')
  )
}

async function handleAutofillPreviewFallback(error) {
  releaseIntakeExtractionLocks()
  deferredSuggestionPayload.value = null
  updateStatusForAllFiles({ extractionStatus: 'manual review' })
  syncActiveDraft({
    stage: 'Ready for Review',
    extractionFallbackReason: String(error?.message || error || '').trim(),
  })
  processingMessage.value = 'AI extraction quota reached. Continue with manual review.'
  $q.notify({
    type: 'warning',
    message: 'AI quota reached. The files were staged and markdown is ready for manual review.',
    timeout: 5000,
  })
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

function applyPrimarySuggestedValues(suggested = {}) {
  for (const [key, value] of Object.entries(suggested?.opportunity || {})) {
    if (!Object.prototype.hasOwnProperty.call(form.value, key)) continue
    if (key === 'Venture_Oppty_Name' && intakeLockedFields.value.relatedFund) continue
    if (key === 'Round_Stage' && intakeLockedFields.value.relatedRound) continue
    form.value[key] = value == null ? '' : stripHumanVerify(value)
    markAutofilled('opportunity', key)
  }
  for (const [key, value] of Object.entries(suggested?.company || {})) {
    if (!Object.prototype.hasOwnProperty.call(companyForm.value, key)) continue
    if (key === 'Company_Name' && intakeLockedFields.value.sponsorCompany) continue
    if (key === 'Website' && intakeLockedFields.value.website) continue
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
    if (key === 'Name' && intakeLockedFields.value.relatedContact) continue
    contactForm.value[key] = value == null ? '' : stripHumanVerify(value)
    markAutofilled('contact', key)
  }
  syncActiveDraft({ stage: 'Matching' })
  queueAdditionalIntakeReviewIfNeeded()
}

function applySecondarySuggestedValues(suggested = {}) {
  generatedNotes.value = Array.isArray(suggested?.notes) ? suggested.notes : []
  generatedTasks.value = Array.isArray(suggested?.tasks) ? suggested.tasks : []
  assistantProposal.value = suggested?.assistant || {}
  syncActiveDraft({ stage: 'Ready for Review' })
}

function applyMatchedExistingCompany(match = null) {
  if (!match?.company_id || !match?.company) return
  extractedCompanyForm.value = { ...companyForm.value }
  companyLinkMode.value = 'existing'
  companySourceChoice.value = 'legacy'
  form.value.company_id = match.company_id
  syncActiveDraft()
}

function collectDraftArtifactIds(result) {
  const ids = []
  for (const row of result?.results || []) {
    if (row?.raw?.artifact_id) ids.push(row.raw.artifact_id)
    if (row?.llm_ready?.artifact_id) ids.push(row.llm_ready.artifact_id)
  }
  draftArtifactIds.value = ids
  syncActiveDraft()
}

async function resolveGeneratedMarkdownPaths(ingestResult) {
  const rows = Array.isArray(ingestResult?.results) ? ingestResult.results : []
  const relPaths = rows
    .map((row) => normalizeLegacyWorkspaceRelativePath(String(row?.llm_ready?.fs_path || '').trim()))
    .filter(Boolean)
  if (!relPaths.length) return []
  if (!bridge.value?.fs?.workspaceRoot) return []

  const workspace = await bridge.value.fs.workspaceRoot()
  const rootPath = String(workspace?.rootPath || '').trim()
  if (!rootPath) return []

  if (bridge.value?.path?.join) {
    const joinedPaths = relPaths.map((rel) => bridge.value.path.join(rootPath, rel))
    await releaseMarkdownChunks(rows, joinedPaths)
    return joinedPaths
  }

  const fallbackPaths = relPaths.map((rel) => `${rootPath}/${rel}`)
  await releaseMarkdownChunks(rows, fallbackPaths)
  return fallbackPaths
}

function normalizeLegacyWorkspaceRelativePath(relPath) {
  const normalized = String(relPath || '').trim()
  if (!normalized) return ''

  return normalized
    .replace(/User[\\/]+WORKSPACE FILES[\\/]+Artifacts(?=[\\/])/i, 'User/WORKSPACE FILES/2. Artifacts')
    .replace(/User[\\/]+WORKSPACE FILES[\\/]+Company(?=[\\/])/i, 'User/WORKSPACE FILES/4. Companies')
}

async function releaseMarkdownChunks(rows = [], absolutePaths = []) {
  if (!activeDraft.value?.id) return
  const previews = await Promise.all(
    rows.map(async (row) => {
      const artifactId = String(row?.llm_ready?.artifact_id || '').trim()
      if (!artifactId || !bridge.value?.artifacts?.preview) return ''
      try {
        const preview = await bridge.value.artifacts.preview({ artifactId })
        return String(preview?.content || '')
      } catch {
        return ''
      }
    }),
  )

  rows.forEach((row, index) => {
    const path = absolutePaths[index] || ''
    upsertDraftMarkdownChunk(activeDraft.value.id, {
      chunkId: row?.llm_ready?.artifact_id || `markdown:${index + 1}`,
      artifactId: row?.llm_ready?.artifact_id || null,
      sectionHint: path ? path.split(/[\\/]/).pop() : `Markdown Chunk ${index + 1}`,
      markdownText: previews[index] || '',
      stageStatus: 'ready_for_early_extraction',
      releasedAt: new Date().toISOString(),
      usedBy: ['Company', 'Opportunity', 'Contacts'],
      ownedFields: [],
      confidence: 0.6,
    })
  })
}

async function processDroppedFiles(files = []) {
  const filePaths = files.map((f) => f.path).filter(Boolean)
  if (!filePaths.length) return

  ensureActiveDraftForFiles(files)
  processingDrop.value = true
  droppedFilesForPrompt.value = [...files]
  existingDocumentNameMatches.value = []
  try {
    processingMessage.value = 'Checking if files already exist...'
    const existingCheck = await findExistingDroppedFiles(files)
    if (existingCheck.existingNames.length) {
      existingDocumentNameMatches.value = [...existingCheck.existingNames]
      syncActiveDraft({
        stage: 'Quick Review Needed',
        existingDocumentNameMatches: [...existingCheck.existingNames],
      })
    }

    processingMessage.value = 'Creating LLM-ready files...'
    const ingestResult = await bridge.value.artifacts.ingest({
      filePaths,
    })
    collectDraftArtifactIds(ingestResult)

    processingMessage.value = 'Extracting structured data from LLM-ready files...'
    updateStatusForAllFiles({ extractionStatus: 'pending' })
    const markdownPaths = await resolveGeneratedMarkdownPaths(ingestResult)
    if (!markdownPaths.length) {
      throw new Error('No LLM-ready files found for structured extraction.')
    }
    let preview = null
    try {
      preview = await bridge.value.autofill.previewFromFiles({ filePaths: markdownPaths })
    } catch (error) {
      if (isAutofillQuotaError(error)) {
        await handleAutofillPreviewFallback(error)
        return
      }
      throw error
    }
    deferredSuggestionPayload.value = preview?.suggested || {}
    applyPrimarySuggestedValues(deferredSuggestionPayload.value)
    applyMatchedExistingCompany(preview?.companyMatch || null)
    applySecondarySuggestedValues(deferredSuggestionPayload.value)
    releaseIntakeExtractionLocks()
    deferredSuggestionPayload.value = null
    updateStatusForAllFiles({ extractionStatus: 'completed' })

    processingMessage.value = 'Files processed successfully.'
  } catch (e) {
    updateStatusForAllFiles({ extractionStatus: 'failed' })
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

function onContactOptionFilter(value, update) {
  update(() => {
    contactOptionFilter.value = value
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

function buildProjectLabel(project = {}) {
  return String(project?.name || project?.Project_Name || project?.pipeline_id || project?.id || '').trim()
}

function buildTaskLabel(task = {}) {
  const name = String(task?.Task_Name || '').trim()
  const status = String(task?.Status || task?.Task_Status || '').trim()
  return [name || String(task?.id || '').trim(), status].filter(Boolean).join(' - ')
}

const projectOptions = computed(() =>
  (filteredProjects.value || []).map((project) => ({
    label: buildProjectLabel(project),
    value: String(project?.pipeline_id || project?.id || '').trim(),
  })),
)

const taskOptions = computed(() =>
  (filteredTasks.value || []).map((task) => ({
    label: buildTaskLabel(task),
    value: String(task?.id || '').trim(),
  })),
)

function filterRelationshipOptions(value, update, type) {
  update(() => {
    const search = String(value || '').trim().toLowerCase()
    const configs = {
      project: {
        source: projects.value,
        assign: (items) => {
          filteredProjects.value = items
        },
        fields: ['pipeline_id', 'name', 'Project_Name'],
      },
      task: {
        source: tasks.value,
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
  const companyPayload = trimPayloadValues(resolvedCompanyPayload.value)
  const companyName =
    String(companyPayload.Company_Name || '').trim() || String(contactForm.value.Name || '').trim()

  if (existingCompanyId && companyLinkMode.value === 'existing') {
    await bridge.value.companies.create({
      id: existingCompanyId,
      ...companyPayload,
      Company_Name: companyName || selectedCompany.value?.Company_Name || '',
      Company_Type: String(companyPayload.Company_Type || '').trim() || selectedCompany.value?.Company_Type || 'Other',
    })
    await loadCompanies()
    return existingCompanyId
  }

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

async function syncOpportunityRelationships(opportunityId) {
  if (!bridge.value?.db?.execute || !opportunityId) return

  const relatedProjectIds = [
    ...new Set((form.value.related_project_ids || []).map((id) => String(id || '').trim()).filter(Boolean)),
  ]
  const relatedTaskIds = [
    ...new Set((form.value.related_task_ids || []).map((id) => String(id || '').trim()).filter(Boolean)),
  ]
  const projectTable =
    entityType.value === 'fund' ? 'Projects_Funds_related_fund' : 'Projects_Rounds_related_round'
  const taskTable =
    entityType.value === 'fund' ? 'Tasks_Funds_related_fund' : 'Tasks_Rounds_related_round'

  await bridge.value.db.execute(`DELETE FROM ${projectTable} WHERE to_id = ?`, [opportunityId])
  for (const projectId of relatedProjectIds) {
    await bridge.value.db.execute(
      `INSERT OR IGNORE INTO ${projectTable} (from_id, to_id) VALUES (?, ?)`,
      [projectId, opportunityId],
    )
  }

  await bridge.value.db.execute(`DELETE FROM ${taskTable} WHERE to_id = ?`, [opportunityId])
  for (const taskId of relatedTaskIds) {
    await bridge.value.db.execute(
      `INSERT OR IGNORE INTO ${taskTable} (from_id, to_id) VALUES (?, ?)`,
      [taskId, opportunityId],
    )
  }
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

    if (result?.id) {
      await syncOpportunityRelationships(result.id)
    }

    if (draftArtifactIds.value.length && result?.id) {
      await bridge.value.artifacts.linkToOpportunity({
        artifactIds: [...draftArtifactIds.value],
        opportunityId: result.id,
        pipelineId: 'pipeline_default',
      })
    }

    if (activeDraft.value?.id) {
      removeIntakeDraft(activeDraft.value.id)
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
  if (v === 'manual review') return 'amber-8'
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

function buildContactOptionLabel(contact = {}) {
  const name = stripHumanVerify(contact?.Name)
  const email = stripHumanVerify(contact?.Professional_Email || contact?.Personal_Email)
  const phone = stripHumanVerify(contact?.Phone)
  return [name || String(contact?.id || '').trim(), email, phone].filter(Boolean).join(' • ')
}

function scoreContactMatch(contact, inputValue) {
  const label = normalizeComparisonText(
    [contact?.Name, contact?.Professional_Email, contact?.Personal_Email, contact?.Phone]
      .filter(Boolean)
      .join(' '),
  )
  if (!label) return 0
  if (!inputValue) return 1
  if (label === inputValue) return 1000
  if (label.includes(inputValue) || inputValue.includes(label)) return 700

  const labelTokens = new Set(tokenizeComparisonText(label))
  const inputTokens = tokenizeComparisonText(inputValue)
  const tokenMatches = inputTokens.reduce((count, token) => count + (labelTokens.has(token) ? 1 : 0), 0)
  const overlapScore = inputTokens.length ? Math.round((tokenMatches / inputTokens.length) * 300) : 0
  const lengthDelta = Math.abs(label.length - inputValue.length)
  return overlapScore + Math.max(0, 120 - lengthDelta)
}

function summarizeCompanySource(source = {}) {
  const name = stripHumanVerify(source?.Company_Name) || 'Unnamed company'
  const type = stripHumanVerify(source?.Company_Type)
  const website = stripHumanVerify(source?.Website)
  const status = stripHumanVerify(source?.Status)
  return [name, type, website, status].filter(Boolean).join(' • ')
}

const resolvedCompanyPayload = computed(() => ({ ...companyForm.value }))

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
    resetForms()
    resetTransientState()
    await loadCompanies()
    await loadContacts()
    await loadExistingOpportunityNames()
    await loadRelationshipOptions()

    const hydrated = hydrateFromActiveDraft()
    const droppedFiles = activeDraft.value?.droppedFiles || []
    const alreadyProcessed =
      Object.keys(activeDraft.value?.ingestStatusByFile || {}).length > 0 ||
      (Array.isArray(activeDraft.value?.draftArtifactIds) && activeDraft.value.draftArtifactIds.length > 0)
    if (!hydrated && droppedFiles.length > 0 && !alreadyProcessed) {
      initStatusForFiles(droppedFiles)
      await processDroppedFiles(droppedFiles)
    }
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
    if (companyLinkMode.value === 'existing' && companySourceChoice.value === 'legacy') {
      companyForm.value = buildCompanyFormFromSource(selected)
      return
    }
    if (!String(companyForm.value.Company_Name || '').trim()) {
      companyForm.value = buildCompanyFormFromSource(selected, {
        Company_Name: selected.Company_Name || '',
      })
    }
  },
)

watch(
  () => JSON.stringify(buildIntakeReviewFieldsFromForms()),
  () => {
    if (!processingDrop.value) return
    queueAdditionalIntakeReviewIfNeeded()
  },
)

watch(companyLinkMode, (value) => {
  if (value === 'new') {
    form.value.company_id = null
    companySourceChoice.value = 'input'
    if (extractedCompanyForm.value) {
      companyForm.value = buildCompanyFormFromSource(extractedCompanyForm.value)
    }
    return
  }

  if (form.value.company_id) {
    companySourceChoice.value = 'legacy'
    if (selectedCompany.value) {
      companyForm.value = buildCompanyFormFromSource(selectedCompany.value)
    }
    return
  }

  const suggested = topSuggestedCompanies.value[0]
  if (suggested?.value) {
    form.value.company_id = suggested.value
    companySourceChoice.value = 'legacy'
  }
})

watch(companySourceChoice, (value) => {
  if (value === 'legacy') {
    if (selectedCompany.value) {
      companyForm.value = buildCompanyFormFromSource(selectedCompany.value)
    }
    return
  }

  if (extractedCompanyForm.value) {
    companyForm.value = buildCompanyFormFromSource(extractedCompanyForm.value)
    return
  }

  if (selectedCompany.value) {
    companyForm.value = buildCompanyFormFromSource(selectedCompany.value)
  }
})

watch(
  () => contactForm.value.id,
  () => {
    if (contactLinkMode.value !== 'existing') return
    if (selectedContact.value) {
      contactForm.value = buildContactFormFromSource(selectedContact.value)
    }
  },
)

watch(contactLinkMode, (value) => {
  if (value === 'new') {
    if (extractedContactForm.value) {
      contactForm.value = buildContactFormFromSource(extractedContactForm.value, { id: '' })
    } else {
      contactForm.value = createDefaultContactForm()
    }
    return
  }

  extractedContactForm.value = { ...contactForm.value, id: '' }

  if (selectedContact.value) {
    contactForm.value = buildContactFormFromSource(selectedContact.value)
    return
  }

  const suggested = rankedContacts.value.find((entry) => entry?.contact?.id)
  if (suggested?.contact?.id) {
    contactForm.value = buildContactFormFromSource(suggested.contact)
    return
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
      const message = String(status?.message || '').trim()
      if (message) {
        processingMessage.value = message
        if (t === 'error') {
          $q.notify({ type: 'negative', message })
        }
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
    syncActiveDraft()
    const message = String(status?.message || '').trim()
    if (message) processingMessage.value = message
  })
})

onBeforeUnmount(() => {
  offIngestStatus?.()
  offIngestStatus = null
  clearIntakeReviewTimer()
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
  margin-top: 10px;
}

.intake-horizontal-progress {
  padding: 18px 8px 8px;
}

.intake-progress-strip {
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 8px 10px 4px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.intake-horizontal-progress--compact {
  padding: 4px 2px 0;
}

.intake-horizontal-progress__track {
  position: relative;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(219, 234, 254, 0.9), rgba(239, 246, 255, 0.95)),
    #eff6ff;
  border: 1px solid rgba(59, 130, 246, 0.16);
  overflow: visible;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
}

.intake-horizontal-progress__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #60a5fa 0%, #2563eb 100%);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
  transition: width 0.28s ease;
}

.intake-horizontal-progress__flag {
  position: absolute;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  transform: translate(-50%, -50%);
  color: #94a3b8;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.intake-horizontal-progress__flag--active {
  color: #1d4ed8;
  transform: translate(-50%, -50%) scale(1.02);
}

.intake-horizontal-progress__flag-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.18);
}

.intake-horizontal-progress__flag-label {
  display: none;
}

.ec-autofilled-field {
  color: #c62828;
  font-style: italic;
}

.intake-proposed-field :deep(.q-field__control) {
  background: #fff7e8;
  border-color: rgba(245, 124, 0, 0.45);
  box-shadow: 0 0 0 1px rgba(245, 124, 0, 0.16);
}

.intake-proposed-field :deep(.q-field__label),
.intake-proposed-field__input {
  color: #b45309;
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

.field-source-toggle {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.field-source-toggle :deep(.q-btn-toggle) {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.96);
}

.field-source-toggle :deep(.q-btn) {
  min-height: 28px;
  min-width: 28px;
  padding: 0 8px;
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
