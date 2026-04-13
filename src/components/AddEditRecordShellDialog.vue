<template>
  <q-dialog v-model="open">
    <DialogShellFrame
      card-class="create-record-shell"
      header-class="create-record-shell__header"
      body-class="create-record-shell__body"
      footer-class="create-record-shell__footer"
      :card-style="dialogStyle"
      body-scrollable
    >
      <template #header>
        <div class="create-record-shell__header-copy">
          <DialogShellTitleRow :title="dialogTitle" class="create-record-shell__title-row">
            <template #actions>
            <q-btn
              v-if="canOpenIntakeShell"
              flat
              no-caps
              dense
              class="create-record-shell__header-link"
              label="Open Intake Shell"
              @click="openIntakeShell"
            />
            <ShellSelector
              v-if="showShellSelector && shellSelectorOptions.length"
              class="create-record-shell__shell-selector"
              :model-value="shellSelectorValue"
              :options="shellSelectorOptions"
              @update:model-value="emit('update:shellSelectorValue', $event)"
            />
            <q-btn
              flat
              no-caps
              dense
              class="create-record-shell__header-link"
              label="Undo"
              icon="undo"
              :disable="!canUndo"
              @click="undoLastAction"
            />
            </template>
          </DialogShellTitleRow>
          <div v-if="false" class="create-record-shell__intake-lane">
            <CollapsibleSectionShell
              title="Resources"
              :collapsed="supportResourcesCollapsed"
              @toggle="supportResourcesCollapsed = !supportResourcesCollapsed"
            >
              <div class="create-record-shell__intake-body">
              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Artifacts</div>
                <DropZone
                  class="create-record-shell__artifact-drop"
                  :class="{ 'create-record-shell__artifact-drop--active': artifactDragOver }"
                  :active="artifactDragOver"
                  :caption="artifactDragOver ? 'Release to stage files' : 'Drag files or a folder here'"
                  @dragover="artifactDragOver = true"
                  @dragleave="artifactDragOver = false"
                  @drop="onArtifactDrop"
                >
                <div v-if="stagedArtifacts.length" class="create-record-shell__artifact-drop-list">
                  <div class="create-record-shell__artifact-drop-list-head">
                    <q-checkbox
                      :model-value="allArtifactsSelected"
                      dense
                      size="xs"
                      checked-icon="check_box"
                      unchecked-icon="check_box_outline_blank"
                      class="create-record-shell__artifact-checkbox"
                      @update:model-value="toggleAllArtifacts"
                      :label="`${selectedArtifactCount} of ${stagedArtifacts.length} selected · Select all / none`"
                    />
                  </div>

                  <div v-if="availableArtifacts.length" class="create-record-shell__artifact-drop-items">
                    <ArtifactRow
                      v-for="artifact in availableArtifacts"
                      :key="artifact.id"
                      :selected="selectedArtifactIds.includes(artifact.id)"
                      :icon="artifactPreviewIcon(artifact)"
                      :name="artifact.name"
                      :size="formatArtifactSize(artifact.size)"
                      @update:selected="toggleArtifactSelection(artifact.id, $event)"
                    />
                  </div>

                  <div v-else class="create-record-shell__artifact-drop-empty">
                    All staged artifacts are in the processing lane.
                  </div>
                </div>

                <div class="create-record-shell__artifact-drop-footer">
                  <q-checkbox
                    v-model="autoProcessArtifacts"
                    dense
                    size="sm"
                    checked-icon="check_box"
                    unchecked-icon="check_box_outline_blank"
                    class="create-record-shell__artifact-checkbox"
                    label="Autmatically process files as I drop"
                  />
                </div>
                </DropZone>
              </div>

              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Intake Companion</div>
                <div class="create-record-shell__intake-side">
                  <div class="create-record-shell__processing-panel">
                  <div class="create-record-shell__processing-panel-head">
                    <div class="create-record-shell__processing-panel-title">Resources</div>
                  </div>

                  <div class="create-record-shell__processing-sections">
                    <ProcessingBox
                      title="Intake"
                      :meta="`${processingArtifacts.length} queued`"
                      class="create-record-shell__processing-box"
                    >
                      <div v-if="processingArtifacts.length" class="create-record-shell__processing-list">
                        <div
                          v-for="artifact in processingArtifacts"
                          :key="`processing:${artifact.id}`"
                          class="create-record-shell__processing-item"
                        >
                          <q-checkbox
                            :model-value="true"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleArtifactSelection(artifact.id, $event)"
                          />
                          <span class="create-record-shell__processing-item-name">{{ artifact.name }}</span>
                          <q-btn
                            v-if="!artifact.artifactId && !startingArtifactIds.includes(artifact.id)"
                            flat
                            dense
                            no-caps
                            class="create-record-shell__processing-start-btn"
                            label="Start"
                            @click.stop.prevent="startArtifactProcessing(artifact.id)"
                          />
                          <span v-else-if="startingArtifactIds.includes(artifact.id)" class="create-record-shell__processing-item-status">
                            Starting...
                          </span>
                          <span v-else class="create-record-shell__processing-item-status">
                            Started
                          </span>
                        </div>
                      </div>

                      <div v-else-if="stagedArtifacts.length" class="create-record-shell__processing-ready">
                        Files added on the left will appear here ready to start.
                      </div>

                      <div v-else class="create-record-shell__processing-empty">
                        Drop files on the left to stage them for this record.
                      </div>
                    </ProcessingBox>

                    <ProcessingBox title="URLs" compact class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <template #actions>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedUrlEntryIds.length"
                          @click="removeCompanionEntries('url')"
                        >
                          Delete
                        </button>
                      </template>
                      <EntryInputListBox
                        :input-value="companionUrl"
                        :entries="urlEntries"
                        :selected-ids="selectedUrlEntryIds"
                        :expanded-ids="expandedEntryIds"
                        @update:input-value="companionUrl = $event; markDialogChanged()"
                        @submit="addCompanionEntry('url')"
                        @toggle-select="toggleCompanionEntrySelection('url', $event[0], $event[1])"
                        @toggle-expanded="toggleCompanionEntryExpanded"
                      />
                    </ProcessingBox>

                    <ProcessingBox title="Blurbs" compact class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <template #actions>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedBlurbEntryIds.length"
                          @click="removeCompanionEntries('blurb')"
                        >
                          Delete
                        </button>
                      </template>
                      <EntryInputListBox
                        :input-value="companionBlurb"
                        :entries="blurbEntries"
                        :selected-ids="selectedBlurbEntryIds"
                        :expanded-ids="expandedEntryIds"
                        @update:input-value="companionBlurb = $event; markDialogChanged()"
                        @submit="addCompanionEntry('blurb')"
                        @toggle-select="toggleCompanionEntrySelection('blurb', $event[0], $event[1])"
                        @toggle-expanded="toggleCompanionEntryExpanded"
                      />
                    </ProcessingBox>

                  </div>
                </div>
              </div>
              </div>
              </div>
            </CollapsibleSectionShell>
          </div>
        </div>

        <div class="create-record-shell__header-actions"></div>
      </template>

      <template #default>
        <div class="create-record-shell__content-stack">
          <div class="create-record-shell__intake-lane">
            <CollapsibleSectionShell
              title="Resources"
              :collapsed="supportResourcesCollapsed"
              @toggle="supportResourcesCollapsed = !supportResourcesCollapsed"
            >
              <div class="create-record-shell__intake-body">
              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Artifacts</div>
                <DropZone
                  class="create-record-shell__artifact-drop"
                  :class="{ 'create-record-shell__artifact-drop--active': artifactDragOver }"
                  :active="artifactDragOver"
                  :caption="artifactDragOver ? 'Release to stage files' : 'Drag files or a folder here'"
                  @dragover="artifactDragOver = true"
                  @dragleave="artifactDragOver = false"
                  @drop="onArtifactDrop"
                >
                <div v-if="stagedArtifacts.length" class="create-record-shell__artifact-drop-list">
                  <div class="create-record-shell__artifact-drop-list-head">
                    <q-checkbox
                      :model-value="allArtifactsSelected"
                      dense
                      size="xs"
                      checked-icon="check_box"
                      unchecked-icon="check_box_outline_blank"
                      class="create-record-shell__artifact-checkbox"
                      @update:model-value="toggleAllArtifacts"
                      :label="`${selectedArtifactCount} of ${stagedArtifacts.length} selected Â· Select all / none`"
                    />
                  </div>

                  <div v-if="availableArtifacts.length" class="create-record-shell__artifact-drop-items">
                    <ArtifactRow
                      v-for="artifact in availableArtifacts"
                      :key="artifact.id"
                      :selected="selectedArtifactIds.includes(artifact.id)"
                      :icon="artifactPreviewIcon(artifact)"
                      :name="artifact.name"
                      :size="formatArtifactSize(artifact.size)"
                      @update:selected="toggleArtifactSelection(artifact.id, $event)"
                    />
                  </div>

                  <div v-else class="create-record-shell__artifact-drop-empty">
                    All staged artifacts are in the processing lane.
                  </div>
                </div>

                <div class="create-record-shell__artifact-drop-footer">
                  <q-checkbox
                    v-model="autoProcessArtifacts"
                    dense
                    size="sm"
                    checked-icon="check_box"
                    unchecked-icon="check_box_outline_blank"
                    class="create-record-shell__artifact-checkbox"
                    label="Autmatically process files as I drop"
                  />
                </div>
                </DropZone>
              </div>

              <div class="create-record-shell__intake-column">
                <div class="create-record-shell__intake-column-title">Intake Companion</div>
                <div class="create-record-shell__intake-side">
                  <div class="create-record-shell__processing-panel">
                  <div class="create-record-shell__processing-panel-head">
                    <div class="create-record-shell__processing-panel-title">Resources</div>
                  </div>

                  <div class="create-record-shell__processing-sections">
                    <ProcessingBox
                      title="Intake"
                      :meta="`${processingArtifacts.length} queued`"
                      class="create-record-shell__processing-box"
                    >
                      <div v-if="processingArtifacts.length" class="create-record-shell__processing-list">
                        <div
                          v-for="artifact in processingArtifacts"
                          :key="`processing:${artifact.id}`"
                          class="create-record-shell__processing-item"
                        >
                          <q-checkbox
                            :model-value="true"
                            dense
                            size="xs"
                            checked-icon="check_box"
                            unchecked-icon="check_box_outline_blank"
                            class="create-record-shell__artifact-checkbox"
                            @update:model-value="toggleArtifactSelection(artifact.id, $event)"
                          />
                          <span class="create-record-shell__processing-item-name">{{ artifact.name }}</span>
                          <q-btn
                            v-if="!artifact.artifactId && !startingArtifactIds.includes(artifact.id)"
                            flat
                            dense
                            no-caps
                            class="create-record-shell__processing-start-btn"
                            label="Start"
                            @click.stop.prevent="startArtifactProcessing(artifact.id)"
                          />
                          <span v-else-if="startingArtifactIds.includes(artifact.id)" class="create-record-shell__processing-item-status">
                            Starting...
                          </span>
                          <span v-else class="create-record-shell__processing-item-status">
                            Started
                          </span>
                        </div>
                      </div>

                      <div v-else-if="stagedArtifacts.length" class="create-record-shell__processing-ready">
                        Files added on the left will appear here ready to start.
                      </div>

                      <div v-else class="create-record-shell__processing-empty">
                        Drop files on the left to stage them for this record.
                      </div>
                    </ProcessingBox>

                    <ProcessingBox title="URLs" compact class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <template #actions>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedUrlEntryIds.length"
                          @click="removeCompanionEntries('url')"
                        >
                          Delete
                        </button>
                      </template>
                      <EntryInputListBox
                        :input-value="companionUrl"
                        :entries="urlEntries"
                        :selected-ids="selectedUrlEntryIds"
                        :expanded-ids="expandedEntryIds"
                        @update:input-value="companionUrl = $event; markDialogChanged()"
                        @submit="addCompanionEntry('url')"
                        @toggle-select="toggleCompanionEntrySelection('url', $event[0], $event[1])"
                        @toggle-expanded="toggleCompanionEntryExpanded"
                      />
                    </ProcessingBox>

                    <ProcessingBox title="Blurbs" compact class="create-record-shell__processing-box create-record-shell__processing-box--compact">
                      <template #actions>
                        <button
                          type="button"
                          class="create-record-shell__processing-delete"
                          :disabled="!selectedBlurbEntryIds.length"
                          @click="removeCompanionEntries('blurb')"
                        >
                          Delete
                        </button>
                      </template>
                      <EntryInputListBox
                        :input-value="companionBlurb"
                        :entries="blurbEntries"
                        :selected-ids="selectedBlurbEntryIds"
                        :expanded-ids="expandedEntryIds"
                        @update:input-value="companionBlurb = $event; markDialogChanged()"
                        @submit="addCompanionEntry('blurb')"
                        @toggle-select="toggleCompanionEntrySelection('blurb', $event[0], $event[1])"
                        @toggle-expanded="toggleCompanionEntryExpanded"
                      />
                    </ProcessingBox>

                  </div>
                </div>
              </div>
              </div>
              </div>
            </CollapsibleSectionShell>
          </div>

          <div class="create-record-shell__record-data">
          <CollapsibleSectionShell
            title="Record Data"
            :collapsed="recordDataCollapsed"
            @toggle="recordDataCollapsed = !recordDataCollapsed"
          >
            <div class="create-record-shell__toolbar-slot-debug">
              <MiniToolbar
                v-model="miniToolbarActiveKey"
                aria-label="Shell mini toolbar"
                :items="miniToolbarItems"
                :view-mode="miniToolbarViewMode"
                :view-options="miniToolbarViewOptions"
                :show-view-toggle="false"
              />
            </div>

            <div class="create-record-shell__panel ds-mini-scrollbar">
              <div class="create-record-shell__panel-head">
                <div class="create-record-shell__panel-meta">{{ activeFields.length }} fields</div>
                <ViewSettingsMenu
                  v-if="isGeneralSectionActive && generalSettingsGroups.length"
                  title="General"
                  :groups="generalSettingsGroups"
                  @toggle-group="emit('toggle-general-settings-group', $event)"
                  @toggle-item="emit('toggle-general-settings-item', $event[0], $event[1])"
                />
              </div>

              <div
                v-if="isViewsSectionActive"
                class="create-record-shell__governance-surface"
              >
                <StructureGovernancePanel
                  mode="views"
                  :view-rows="governanceViewRows"
                  empty-views-label="No views declared for this record."
                />
              </div>

                <div
                  v-else-if="isTokensSectionActive"
                  class="create-record-shell__governance-groups"
                >
                  <StructureGovernancePanel
                    mode="tokens"
                    :token-groups="tokenGroupsByView"
                    :token-columns="tokenGovernanceColumns"
                    empty-tokens-label="No tokens declared in this view."
                    @update-token-cell="updateTokenCell"
                  />
                </div>

              <div
                v-else-if="isSystemSectionActive && activeFields.length"
                class="create-record-shell__fields create-record-shell__fields--system"
                :style="{ '--field-map-label-width': activeFieldLabelWidth }"
              >
                <div
                  class="create-record-shell__fields-grid create-record-shell__fields-grid--left"
                >
                  <FieldMapRow
                    v-for="fieldEntry in leftFieldEntries"
                    :key="fieldEntry.token.key"
                    :label="fieldEntry.token.label"
                    :type-hint="formatFieldType(fieldEntry.token.tokenType)"
                    :wide="isWideField(fieldEntry.token)"
                    :stacked-input="isSummaryField(fieldEntry.token)"
                    :verification-needed="shouldHighlightFieldVerification(fieldEntry.token)"
                  >
                    <template #parent-link>
                      <q-btn
                        v-if="fieldHasParentRecordLink(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="link"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Open source record for ${fieldEntry.token.label}`"
                        @click="openFieldParentRecord(fieldEntry.token)"
                      />
                      <q-btn
                        v-if="fieldHasCopyableLockedValue(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="content_copy"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Copy ${fieldEntry.token.label}`"
                        @click="copyLockedFieldValue(fieldEntry.token)"
                      />
                    </template>
                    <template #input>
                      <div
                        v-if="isFieldLocked(fieldEntry.token) && !isSummaryField(fieldEntry.token)"
                        class="create-record-shell__read-value"
                        :class="fieldVerificationClass(fieldEntry.token)"
                      >
                        {{ getLockedFieldDisplayValue(fieldEntry.token) || '—' }}
                      </div>
                    </template>
                  </FieldMapRow>
                </div>

                <div class="create-record-shell__fields-grid create-record-shell__fields-grid--right create-record-shell__history-column">
                  <div v-if="historySummaryItems.length" class="create-record-shell__history-summary-box">
                    <div
                      v-for="item in historySummaryItems"
                      :key="item.key"
                      class="create-record-shell__history-summary-item"
                    >
                      <div class="create-record-shell__history-summary-label">{{ item.label }}</div>
                      <div class="create-record-shell__history-summary-value">{{ item.value }}</div>
                    </div>
                  </div>

                  <RecordHistoryBox
                    title="History"
                    :items="historyItems"
                    :loading="historyLoading"
                    empty-label="No history yet for this record."
                    @open-item="openHistoryItem"
                  />
                </div>
              </div>


              <div
                v-else-if="activeFields.length"
                class="create-record-shell__fields"
                :style="{ '--field-map-label-width': activeFieldLabelWidth }"
              >
                <div
                  class="create-record-shell__fields-grid create-record-shell__fields-grid--left"
                >
                  <FieldMapRow
                    v-for="fieldEntry in leftFieldEntries"
                    :key="fieldEntry.token.key"
                    :label="fieldEntry.token.label"
                    :type-hint="formatFieldType(fieldEntry.token.tokenType)"
                    :wide="isWideField(fieldEntry.token)"
                    :stacked-input="isSummaryField(fieldEntry.token)"
                    :verification-needed="shouldHighlightFieldVerification(fieldEntry.token)"
                  >
                    <template #parent-link>
                      <q-btn
                        v-if="fieldHasParentRecordLink(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="link"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Open source record for ${fieldEntry.token.label}`"
                        @click="openFieldParentRecord(fieldEntry.token)"
                      />
                      <q-btn
                        v-if="fieldHasCopyableLockedValue(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="content_copy"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Copy ${fieldEntry.token.label}`"
                        @click="copyLockedFieldValue(fieldEntry.token)"
                      />
                    </template>
                    <template #input>
                      <div
                        v-if="isFieldLocked(fieldEntry.token) && !isSummaryField(fieldEntry.token)"
                        class="create-record-shell__read-value"
                        :class="fieldVerificationClass(fieldEntry.token)"
                      >
                        {{ getLockedFieldDisplayValue(fieldEntry.token) || '—' }}
                      </div>

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        :input-value="getSelectDraftValue(fieldEntry.token.key)"
                        dense
                        outlined
                        multiple
                        use-input
                        input-debounce="0"
                        new-value-mode="add-unique"
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :display-value="formatMultiSelectSummary(fieldEntry.token, formValues[fieldEntry.token.key])"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                        @input-value="setSelectDraftValue(fieldEntry.token.key, $event)"
                        @new-value="(value, done) => allowTypedSelectEntry(fieldEntry.token) ? commitSelectInputValue(fieldEntry.token, value, done) : done?.(null, 'cancel')"
                      >
                        <template #append>
                          <q-btn
                            v-if="hasPendingNewSelectValue(fieldEntry.token)"
                            flat
                            dense
                            round
                            size="sm"
                            :icon="isInlineCreatingSelect(fieldEntry.token.key) ? 'hourglass_top' : 'add'"
                            :disable="loading || isFieldLocked(fieldEntry.token) || isInlineCreatingSelect(fieldEntry.token.key)"
                            :aria-label="`Add ${getSelectDraftValue(fieldEntry.token.key)}`"
                            @click.stop.prevent="void commitSelectInputValue(fieldEntry.token, getSelectDraftValue(fieldEntry.token.key))"
                          />
                        </template>
                      </q-select>

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        :input-value="getSelectDraftValue(fieldEntry.token.key)"
                        dense
                        outlined
                        use-input
                        input-debounce="0"
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                        @input-value="setSelectDraftValue(fieldEntry.token.key, $event)"
                        @new-value="(value, done) => allowTypedSelectEntry(fieldEntry.token) ? commitSelectInputValue(fieldEntry.token, value, done) : done?.(null, 'cancel')"
                      >
                        <template #append>
                          <q-btn
                            v-if="hasPendingNewSelectValue(fieldEntry.token)"
                            flat
                            dense
                            round
                            size="sm"
                            :icon="isInlineCreatingSelect(fieldEntry.token.key) ? 'hourglass_top' : 'add'"
                            :disable="loading || isFieldLocked(fieldEntry.token) || isInlineCreatingSelect(fieldEntry.token.key)"
                            :aria-label="`Add ${getSelectDraftValue(fieldEntry.token.key)}`"
                            @click.stop.prevent="void commitSelectInputValue(fieldEntry.token, getSelectDraftValue(fieldEntry.token.key))"
                          />
                        </template>
                      </q-select>

                      <q-input
                        v-else-if="!isSummaryField(fieldEntry.token)"
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="inputTypeForToken(fieldEntry.token.tokenType)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="stageFieldValue(fieldEntry.token.key, $event)"
                        @blur="commitStagedField(fieldEntry.token.key)"
                        @keyup.enter="handleTextFieldEnter(fieldEntry.token, fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        type="hidden"
                        class="create-record-shell__input create-record-shell__input--hidden"
                      />
                    </template>
                    <template #below>
                      <div
                        v-if="isSummaryField(fieldEntry.token) && isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__read-value create-record-shell__read-value--summary"
                        :class="fieldVerificationClass(fieldEntry.token)"
                      >
                        {{ getLockedFieldDisplayValue(fieldEntry.token) || '—' }}
                      </div>
                      <q-input
                        v-else-if="isSummaryField(fieldEntry.token)"
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        type="textarea"
                        autogrow
                        class="create-record-shell__input"
                        :class="[
                          'create-record-shell__input--summary',
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="stageFieldValue(fieldEntry.token.key, $event)"
                        @blur="commitStagedField(fieldEntry.token.key)"
                        @keyup.enter="handleTextFieldEnter(fieldEntry.token, fieldEntry.token.key, $event)"
                      />
                      <div
                        v-else-if="fieldEntry.token.tokenType === 'select_multi'"
                        class="create-record-shell__selected-multi-box"
                      >
                        <q-chip
                          v-for="item in getMultiSelectOptionEntries(fieldEntry.token, formValues[fieldEntry.token.key])"
                          :key="item.key"
                          dense
                          :removable="!loading && !isFieldLocked(fieldEntry.token)"
                          :disable="loading"
                          class="create-record-shell__selected-multi-chip"
                          @remove="removeMultiSelectValue(fieldEntry.token, item.value)"
                        >
                          {{ item.label }}
                        </q-chip>
                        <div
                          v-if="!getMultiSelectOptionEntries(fieldEntry.token, formValues[fieldEntry.token.key]).length"
                          class="create-record-shell__selected-multi-empty"
                        >
                          No selected items
                        </div>
                      </div>
                    </template>
                    <template #action>
                      <q-btn
                        v-if="showFieldVerificationAction(fieldEntry.token)"
                        flat
                        dense
                        size="sm"
                        :disable="loading"
                        :class="[fieldActionClass(fieldEntry.token), fieldVerificationClass(fieldEntry.token)]"
                        :aria-label="`Change verification state for ${fieldEntry.token.label}`"
                      >
                        <q-icon
                          :name="fieldVerificationIcon(fieldEntry.token)"
                          :class="fieldVerificationIconClass(fieldEntry.token)"
                          :style="fieldVerificationIconStyle(fieldEntry.token)"
                          size="14px"
                        />
                        <q-menu
                          :anchor="verificationMenuAnchor(fieldEntry.column)"
                          :self="verificationMenuSelf(fieldEntry.column)"
                        >
                          <q-list dense class="create-record-shell__verification-menu">
                            <q-item
                              v-for="option in fieldVerificationActionOptions"
                              :key="option.value"
                              clickable
                              v-close-popup
                              class="create-record-shell__verification-menu-item"
                              @click="updateFieldVerificationState(fieldEntry.token, option.value)"
                            >
                              <q-item-section avatar>
                                <q-icon :name="option.icon" :class="option.iconClass" :style="{ color: option.color }" size="14px" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="create-record-shell__verification-menu-label">
                                  {{ option.label }}
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </template>
                  </FieldMapRow>
                </div>

                <div
                  class="create-record-shell__fields-grid create-record-shell__fields-grid--right"
                >
                  <FieldMapRow
                    v-for="fieldEntry in rightFieldEntries"
                    :key="fieldEntry.token.key"
                    :label="fieldEntry.token.label"
                    :type-hint="formatFieldType(fieldEntry.token.tokenType)"
                    :wide="isWideField(fieldEntry.token)"
                    :stacked-input="isSummaryField(fieldEntry.token)"
                    :verification-needed="shouldHighlightFieldVerification(fieldEntry.token)"
                  >
                    <template #parent-link>
                      <q-btn
                        v-if="fieldHasParentRecordLink(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="link"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Open source record for ${fieldEntry.token.label}`"
                        @click="openFieldParentRecord(fieldEntry.token)"
                      />
                      <q-btn
                        v-if="fieldHasCopyableLockedValue(fieldEntry.token)"
                        flat
                        dense
                        round
                        size="sm"
                        icon="content_copy"
                        class="create-record-shell__field-parent-link"
                        :aria-label="`Copy ${fieldEntry.token.label}`"
                        @click="copyLockedFieldValue(fieldEntry.token)"
                      />
                    </template>
                    <template #input>
                      <div
                        v-if="isFieldLocked(fieldEntry.token) && !isSummaryField(fieldEntry.token)"
                        class="create-record-shell__read-value"
                        :class="fieldVerificationClass(fieldEntry.token)"
                      >
                        {{ getLockedFieldDisplayValue(fieldEntry.token) || '—' }}
                      </div>

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        :input-value="getSelectDraftValue(fieldEntry.token.key)"
                        dense
                        outlined
                        multiple
                        use-input
                        input-debounce="0"
                        new-value-mode="add-unique"
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :display-value="formatMultiSelectSummary(fieldEntry.token, formValues[fieldEntry.token.key])"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                        @input-value="setSelectDraftValue(fieldEntry.token.key, $event)"
                        @new-value="(value, done) => allowTypedSelectEntry(fieldEntry.token) ? commitSelectInputValue(fieldEntry.token, value, done) : done?.(null, 'cancel')"
                      >
                        <template #append>
                          <q-btn
                            v-if="hasPendingNewSelectValue(fieldEntry.token)"
                            flat
                            dense
                            round
                            size="sm"
                            icon="add"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            :aria-label="`Add ${getSelectDraftValue(fieldEntry.token.key)}`"
                            @click.stop.prevent="commitSelectInputValue(fieldEntry.token, getSelectDraftValue(fieldEntry.token.key))"
                          />
                        </template>
                      </q-select>

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        :input-value="getSelectDraftValue(fieldEntry.token.key)"
                        dense
                        outlined
                        use-input
                        input-debounce="0"
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                        @input-value="setSelectDraftValue(fieldEntry.token.key, $event)"
                        @new-value="(value, done) => allowTypedSelectEntry(fieldEntry.token) ? commitSelectInputValue(fieldEntry.token, value, done) : done?.(null, 'cancel')"
                      >
                        <template #append>
                          <q-btn
                            v-if="hasPendingNewSelectValue(fieldEntry.token)"
                            flat
                            dense
                            round
                            size="sm"
                            icon="add"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            :aria-label="`Add ${getSelectDraftValue(fieldEntry.token.key)}`"
                            @click.stop.prevent="commitSelectInputValue(fieldEntry.token, getSelectDraftValue(fieldEntry.token.key))"
                          />
                        </template>
                      </q-select>

                      <q-input
                        v-else-if="!isSummaryField(fieldEntry.token)"
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="inputTypeForToken(fieldEntry.token.tokenType)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="stageFieldValue(fieldEntry.token.key, $event)"
                        @blur="commitStagedField(fieldEntry.token.key)"
                        @keyup.enter="handleTextFieldEnter(fieldEntry.token, fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        type="hidden"
                        class="create-record-shell__input create-record-shell__input--hidden"
                      />
                    </template>
                    <template #below>
                      <div
                        v-if="isSummaryField(fieldEntry.token) && isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__read-value create-record-shell__read-value--summary"
                        :class="fieldVerificationClass(fieldEntry.token)"
                      >
                        {{ getLockedFieldDisplayValue(fieldEntry.token) || '—' }}
                      </div>
                      <q-input
                        v-else-if="isSummaryField(fieldEntry.token)"
                        :model-value="getStagedFieldValue(fieldEntry.token.key)"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        type="textarea"
                        autogrow
                        class="create-record-shell__input"
                        :class="[
                          'create-record-shell__input--summary',
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="stageFieldValue(fieldEntry.token.key, $event)"
                        @blur="commitStagedField(fieldEntry.token.key)"
                        @keyup.enter="handleTextFieldEnter(fieldEntry.token, fieldEntry.token.key, $event)"
                      />
                      <div
                        v-else-if="fieldEntry.token.tokenType === 'select_multi'"
                        class="create-record-shell__selected-multi-box"
                      >
                        <q-chip
                          v-for="item in getMultiSelectOptionEntries(fieldEntry.token, formValues[fieldEntry.token.key])"
                          :key="item.key"
                          dense
                          :removable="!loading && !isFieldLocked(fieldEntry.token)"
                          :disable="loading"
                          class="create-record-shell__selected-multi-chip"
                          @remove="removeMultiSelectValue(fieldEntry.token, item.value)"
                        >
                          {{ item.label }}
                        </q-chip>
                        <div
                          v-if="!getMultiSelectOptionEntries(fieldEntry.token, formValues[fieldEntry.token.key]).length"
                          class="create-record-shell__selected-multi-empty"
                        >
                          No selected items
                        </div>
                      </div>
                    </template>
                    <template #action>
                      <q-btn
                        v-if="showFieldVerificationAction(fieldEntry.token)"
                        flat
                        dense
                        size="sm"
                        :disable="loading"
                        :class="[fieldActionClass(fieldEntry.token), fieldVerificationClass(fieldEntry.token)]"
                        :aria-label="`Change verification state for ${fieldEntry.token.label}`"
                      >
                        <q-icon
                          :name="fieldVerificationIcon(fieldEntry.token)"
                          :class="fieldVerificationIconClass(fieldEntry.token)"
                          :style="fieldVerificationIconStyle(fieldEntry.token)"
                          size="14px"
                        />
                        <q-menu
                          :anchor="verificationMenuAnchor(fieldEntry.column)"
                          :self="verificationMenuSelf(fieldEntry.column)"
                        >
                          <q-list dense class="create-record-shell__verification-menu">
                            <q-item
                              v-for="option in fieldVerificationActionOptions"
                              :key="option.value"
                              clickable
                              v-close-popup
                              class="create-record-shell__verification-menu-item"
                              @click="updateFieldVerificationState(fieldEntry.token, option.value)"
                            >
                              <q-item-section avatar>
                                <q-icon :name="option.icon" :class="option.iconClass" :style="{ color: option.color }" size="14px" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="create-record-shell__verification-menu-label">
                                  {{ option.label }}
                                </q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </template>
                  </FieldMapRow>
                </div>
              </div>

              <div v-else class="create-record-shell__empty">
                No canonical fields are mapped to this section yet.
              </div>
            </div>
          </CollapsibleSectionShell>
        </div>
        </div>
      </template>

      <template #footer>
        <DialogShellFooter
          :legend-items="dialogFooterLegendItems"
          :cancel-disabled="loading"
          :save-disabled="submitDisabled"
          :loading="loading"
          :save-label="submitLabel"
          @cancel="open = false"
          @save="submit"
        />
      </template>

      <template #overlay>
        <button
          type="button"
          class="create-record-shell__resize-handle"
          aria-label="Resize dialog"
          @mousedown.prevent="startResize"
        />
      </template>
    </DialogShellFrame>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import DialogShellFooter from 'src/components/DialogShellFooter.vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import CollapsibleSectionShell from 'src/components/CollapsibleSectionShell.vue'
import DropZone from 'src/components/DropZone.vue'
import ArtifactRow from 'src/components/ArtifactRow.vue'
import MiniToolbar from 'src/components/MiniToolbar.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import ProcessingBox from 'src/components/ProcessingBox.vue'
import ShellSelector from 'src/components/ShellSelector.vue'
import FieldMapRow from 'src/components/FieldMapRow.vue'
import EntryInputListBox from 'src/components/EntryInputListBox.vue'
import ViewSettingsMenu from 'src/components/ViewSettingsMenu.vue'
import RecordHistoryBox from 'src/components/RecordHistoryBox.vue'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { buildRecordViewLocation } from 'src/utils/recordViewNavigation'
import { setPendingIntakeShellRequest } from 'src/utils/intakeShellState'
  import {
    FILE_SOURCE_REGISTRY,
    getCreateBranchTokenName,
    getFilePageRegistryEntryByEntityReference,
    getRegistryTitleTokenForSource,
  } from 'src/utils/structureRegistry'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  sourceLabel: { type: String, default: 'Records' },
  singularLabel: { type: String, default: 'record' },
  primaryTokens: { type: Array, default: () => [] },
  promotedGeneralTokens: { type: Array, default: () => [] },
  generalSettingsGroups: { type: Array, default: () => [] },
  leftSections: { type: Array, default: () => [] },
  rightSections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
  initialValues: { type: Object, default: () => ({}) },
  initialFieldMeta: { type: Object, default: () => ({}) },
  initialSectionKey: { type: String, default: 'general' },
  historyItems: { type: Array, default: () => [] },
  historyLoading: { type: Boolean, default: false },
  historyTableName: { type: String, default: '' },
  historyRecordId: { type: String, default: '' },
  initialArtifacts: { type: Array, default: () => [] },
  artifactContext: { type: Object, default: null },
  branchSelectorTokenKey: { type: String, default: '' },
  showShellSelector: { type: Boolean, default: false },
  shellSelectorValue: { type: String, default: '' },
  shellSelectorOptions: { type: Array, default: () => [] },
  preferAddLayout: { type: Boolean, default: false },
  initialResourcesCollapsed: { type: Boolean, default: false },
  initialRecordDataCollapsed: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:shellSelectorValue',
  'submit',
  'change',
  'request-close',
  'toggle-general-settings-group',
  'toggle-general-settings-item',
])
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const hasUserChanges = ref(false)
const selectDraftValues = ref({})
const inlineCreatingSelectKeys = ref([])

const INLINE_NAME_ONLY_CREATE_SOURCES = new Set([
  'companies',
  'contacts',
  'notes',
  'tasks',
  'projects',
  'users',
  'roles',
  'companion-roles',
  'funds',
  'markets',
  'securities',
])

const open = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) {
      emit('request-close', buildDialogSnapshot())
    }
    emit('update:modelValue', value)
  },
})

const dialogPayloadResetSignature = computed(() => JSON.stringify({
  mode: String(props.mode || '').trim(),
  shellSelectorValue: String(props.shellSelectorValue || '').trim(),
  sourceLabel: String(props.sourceLabel || '').trim(),
  singularLabel: String(props.singularLabel || '').trim(),
  initialSectionKey: String(props.initialSectionKey || '').trim(),
  historyRecordId: String(props.historyRecordId || '').trim(),
  leftSectionKeys: (Array.isArray(props.leftSections) ? props.leftSections : []).map((section) => String(section?.key || '').trim()),
  rightSectionKeys: (Array.isArray(props.rightSections) ? props.rightSections : []).map((section) => String(section?.key || '').trim()),
  initialValueKeys: Object.keys(props.initialValues || {}).sort(),
  initialFieldMetaKeys: Object.keys(props.initialFieldMeta || {}).sort(),
}))

const activeSectionKey = ref('')
const miniToolbarActiveKey = computed({
  get: () => activeSectionKey.value,
  set: (value) => {
    activeSectionKey.value = value
  },
})
const formValues = ref({})
const stagedFieldValues = ref({})
const artifactDragOver = ref(false)
const stagedArtifacts = ref([])
const selectedArtifactIds = ref([])
const tokenFieldOverrides = ref({})
const startingArtifactIds = ref([])
const autoProcessArtifacts = ref(false)
const companionUrl = ref('')
const companionBlurb = ref('')
const urlEntries = ref([])
const blurbEntries = ref([])
const selectedUrlEntryIds = ref([])
const selectedBlurbEntryIds = ref([])
const expandedEntryIds = ref([])
const supportResourcesCollapsed = ref(false)
const recordDataCollapsed = ref(false)
const dialogWidth = ref(760)
const dialogHeight = ref(780)
const fieldVerificationStates = ref({})
const undoStack = ref([])
const currentUndoSignature = ref('')
const isApplyingUndo = ref(false)
let removeResizeListeners = null
let removeUndoKeyListener = null

const canUndo = computed(() => undoStack.value.length > 0)

const branchSelectionSettled = computed(() => {
  const tokenKey = String(props.branchSelectorTokenKey || '').trim()
  if (!tokenKey) return true
  return String(formValues.value?.[tokenKey] ?? '').trim().length > 0
})

function mergePrimaryTokensIntoSections(sections = [], primaryTokens = []) {
  const normalizedSections = Array.isArray(sections) ? sections : []
  const normalizedPrimaryTokens = Array.isArray(primaryTokens) ? primaryTokens.filter(Boolean) : []
  if (!normalizedSections.length) {
    return normalizedPrimaryTokens.length
      ? [{
          key: 'general',
          label: 'General',
          tokens: normalizedPrimaryTokens,
          subgroups: [],
        }]
      : []
  }

  const generalIndex = normalizedSections.findIndex(
    (section) => String(section?.label || '').trim().toLowerCase() === 'general',
  )

  if (generalIndex === -1) {
    return [
      {
        key: 'general',
        label: 'General',
        tokens: normalizedPrimaryTokens,
        subgroups: [],
      },
      ...normalizedSections,
    ]
  }

  return normalizedSections.map((section, index) => {
    if (index !== generalIndex) return section
    return {
      ...section,
      tokens: [...normalizedPrimaryTokens, ...(Array.isArray(section?.tokens) ? section.tokens : [])],
    }
  })
}

const allSections = computed(() => {
  const dialogSections = branchSelectionSettled.value ? [...props.leftSections, ...props.rightSections] : []
  return mergePrimaryTokensIntoSections(dialogSections, props.primaryTokens)
})

const leftPanelSections = computed(() => {
  const dialogSections = branchSelectionSettled.value ? props.leftSections : []
  return mergePrimaryTokensIntoSections(dialogSections, props.primaryTokens)
})

const rightSections = computed(() => (branchSelectionSettled.value ? props.rightSections : []))
const miniToolbarItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: leftPanelSections.value,
    rightItems: rightSections.value,
    governanceItems: [
      { value: 'tokens', title: 'Tokens' },
      { value: 'views', title: 'Views' },
    ],
    isRelationshipSectionLabel: (label) => {
      const normalized = String(label || '').trim().toLowerCase()
      return normalized === 'ldb'
    },
  }),
)

const dialogTitle = computed(() => {
  const normalizedLabel = String(props.singularLabel || 'record').trim()
  return `Add/Edit ${normalizedLabel}`
})

const artifactContextNote = computed(() => {
  const entityLabel = String(props.artifactContext?.entityLabel || '').trim()
  if (!entityLabel) return null

  const recordLabel = String(props.artifactContext?.recordLabel || '').trim()
  return {
    detail: recordLabel
      ? `Artifacts added here will carry ${entityLabel} -> ${recordLabel} as the first verification-ready context.`
      : `Artifacts added here will carry ${entityLabel} as the first verification-ready context.`,
  }
})

const submitLabel = computed(() => 'Save')
const dialogFooterLegendItems = [
  { label: 'Pre-Selected', tone: 'default' },
  { label: 'Suggested', tone: 'suggested' },
]
const fieldVerificationActionOptions = [
  { label: 'Verify field', value: 'verified', icon: 'check_circle', iconClass: 'create-record-shell__verification-icon--verified', color: 'rgba(35, 92, 26, 0.96)' },
  { label: 'Pre-Selected', value: 'default_preselected_unverified', icon: 'auto_awesome', iconClass: 'create-record-shell__verification-icon--default', color: 'rgba(64, 121, 210, 0.92)' },
  { label: 'Suggested', value: 'suggested_unverified', icon: 'lightbulb', iconClass: 'create-record-shell__verification-icon--suggested', color: 'rgba(186, 129, 13, 0.92)' },
  { label: 'Reject field', value: 'rejected', icon: 'cancel', iconClass: 'create-record-shell__verification-icon--rejected', color: 'rgba(166, 43, 43, 0.92)' },
]
const selectedArtifactCount = computed(() => selectedArtifactIds.value.length)
const allArtifactsSelected = computed(() =>
  stagedArtifacts.value.length > 0 && selectedArtifactIds.value.length === stagedArtifacts.value.length,
)
const availableArtifacts = computed(() =>
  stagedArtifacts.value.filter((artifact) => !selectedArtifactIds.value.includes(artifact.id)),
)
const processingArtifacts = computed(() =>
  stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
)
const canOpenIntakeShell = computed(() => stagedArtifacts.value.length > 0 || processingArtifacts.value.length > 0)
const activeFieldLabelWidth = computed(() => '10ch')
const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]
const miniToolbarViewMode = computed(() => 'card')
const miniToolbarViewOptions = computed(() => viewOptions)
const tokenTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'rich_text', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'select_single', label: 'Select Single' },
  { value: 'select_multi', label: 'Select Multi' },
  { value: 'creator', label: 'Creator' },
]
const optionSourceOptions = [
  { value: 'live_entity', label: 'Live Entity' },
  { value: 'option_list', label: 'Option List' },
  { value: 'shared_file_universe', label: 'Shared File Universe' },
  { value: 'manual', label: 'Manual' },
]
const fieldClassOptions = [
  { value: 'owned', label: 'Owned' },
  { value: 'directional', label: 'Directional' },
  { value: 'ldb_relationship', label: 'LDB Relationship' },
  { value: 'system', label: 'System' },
]
const optionEntityOptions = Object.freeze(
  FILE_SOURCE_REGISTRY
    .map((entry) => {
      const label = String(entry?.label || '').trim()
      return label ? { value: label, label } : null
    })
    .filter(Boolean),
)
const tokenGovernanceColumns = computed(() => [
  { key: 'label', label: 'Label', width: 180, cellClass: 'create-record-shell__cell--label', editable: true, kind: 'text' },
  { key: 'type', label: 'Type', width: 112, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'select', options: tokenTypeOptions },
  { key: 'optionSource', label: 'Option Source', width: 150, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'select', options: optionSourceOptions },
  { key: 'optionEntity', label: 'Option Entity', width: 160, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'select', options: optionEntityOptions },
  { key: 'optionList', label: 'Option List', width: 140, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'text' },
  { key: 'dbWriteField', label: 'DB Write Field', width: 180, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'text' },
  { key: 'fieldClass', label: 'Field Class', width: 140, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'select', options: fieldClassOptions },
  { key: 'required', label: 'Required', width: 84, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', kind: 'checkbox' },
  { key: 'writeTarget', label: 'Write Target / Alias', width: 220, headerClass: 'create-record-shell__cell--meta', cellClass: 'create-record-shell__cell--meta', editable: true, kind: 'text' },
])

const activeSection = computed(() => {
  if (activeSectionKey.value === 'tokens' || activeSectionKey.value === 'views') return null
  return allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null
})

const isTokensSectionActive = computed(() => activeSectionKey.value === 'tokens')
const isViewsSectionActive = computed(() => activeSectionKey.value === 'views')
const isGeneralSectionActive = computed(() => String(activeSection.value?.label || '').trim().toLowerCase() === 'general')
const isSystemSectionActive = computed(() => String(activeSection.value?.label || '').trim().toLowerCase() === 'system')
const activeFields = computed(() => activeSection.value?.tokens || [])
const governanceViewRows = computed(() =>
  [...leftPanelSections.value, ...rightSections.value].map((section) => ({
    key: section.key,
    label: section.label,
    side: rightSections.value.some((entry) => entry.key === section.key) ? 'Right' : 'Left',
    tokenCount: Array.isArray(section.tokens) ? section.tokens.length : 0,
  })),
)
const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => {
    const section = allSections.value.find((entry) => entry.key === view.key)
    const sectionTokens = Array.isArray(section?.tokens) ? section.tokens : []
    return {
      key: view.key,
      label: view.label,
      tokens: sectionTokens.map((token) => {
        const overrides = tokenFieldOverrides.value[token.key] || {}
        return {
          key: token.key,
          label: (overrides.label ?? token.label) || '—',
          type: (overrides.type ?? token.tokenType) || '—',
          optionSource: (overrides.optionSource ?? token.optionSource) || '—',
          optionEntity: (overrides.optionEntity ?? token.optionEntity) || '—',
          optionList: (overrides.optionList ?? token.optionList) || '—',
          dbWriteField: (overrides.dbWriteField ?? token.dbWriteField) || token.dbFieldAliases?.[0] || '—',
          fieldClass: (overrides.fieldClass ?? token.fieldClass ?? token.field_class) || '—',
          required: isNameField(token) ? 'Yes' : '—',
          writeTarget: overrides.writeTarget ?? (token.dbWriteField || token.dbFieldAliases?.join(', ') || '—'),
          editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
        }
      }),
    }
  }),
)

function updateTokenCell(tokenKey, field, value) {
  const normalizedKey = String(tokenKey || '').trim()
  if (!normalizedKey) return
  const current = tokenFieldOverrides.value[normalizedKey] || {}
  const nextValue = String(value ?? '').trim()
  const nextToken = { ...current }
  if (nextValue) nextToken[field] = nextValue
  else delete nextToken[field]
  tokenFieldOverrides.value = {
    ...tokenFieldOverrides.value,
    [normalizedKey]: nextToken,
  }
}
const activeFieldEntries = computed(() => {
  const nameEntries = []
  const summaryEntries = []
  const remainingEntries = []

  activeFields.value.forEach((token, tokenIndex) => {
    const entry = { token, tokenIndex, column: 'left' }
    if (isNameField(token)) {
      nameEntries.push({ ...entry, column: 'left' })
      return
    }
    if (isSummaryField(token)) {
      summaryEntries.push({ ...entry, column: 'left' })
      return
    }
    remainingEntries.push(entry)
  })

  let nextColumn = 'left'
  const alternatingEntries = remainingEntries.map((entry) => {
    const assigned = { ...entry, column: nextColumn }
    nextColumn = nextColumn === 'left' ? 'right' : 'left'
    return assigned
  })

  return [...nameEntries, ...summaryEntries, ...alternatingEntries]
})
const leftFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'left' && isNameField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'left' && !isNameField(entry.token))
  return [...pinned, ...remainder]
})
const mirroredGeneralEntries = computed(() => {
  if (!isGeneralSectionActive.value) return []
  return (Array.isArray(props.promotedGeneralTokens) ? props.promotedGeneralTokens : [])
    .filter((token) => token && !activeFieldEntries.value.some((entry) => entry.token?.key === token.key))
    .map((token, index) => ({
      token,
      tokenIndex: 1000 + index,
      column: 'right',
      mirroredInGeneral: true,
    }))
})
const rightFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'right' && isSummaryField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'right' && !isSummaryField(entry.token))
  return [...pinned, ...mirroredGeneralEntries.value, ...remainder]
})
const historySummaryItems = computed(() => {
  const items = Array.isArray(props.historyItems) ? props.historyItems : []
  const createdItem = items.find((item) => String(item?.title || '').trim().toLowerCase().includes('created'))
  if (!createdItem) return []
  return [
    { key: 'creator', label: 'Creator', value: String(createdItem.sourceLabel || '').trim() },
    { key: 'datetime', label: 'Datetime', value: String(createdItem.meta || '').trim() },
  ].filter((item) => item.value)
})
const resolvedDialogHeight = computed(() => {
  if (!recordDataCollapsed.value) return dialogHeight.value
  const collapsedHeight = supportResourcesCollapsed.value ? 240 : 500
  return Math.min(dialogHeight.value, collapsedHeight)
})
const dialogStyle = computed(() => ({
  width: `${dialogWidth.value}px`,
  height: `${resolvedDialogHeight.value}px`,
  minHeight: `${resolvedDialogHeight.value}px`,
}))

function resolveInitialDialogSectionKey(initialKey = '') {
  const normalizedInitialKey = String(initialKey || '').trim()
  if (normalizedInitialKey && allSections.value.some((section) => section.key === normalizedInitialKey)) {
    return normalizedInitialKey
  }

  const generalSection = allSections.value.find((section) => String(section?.label || '').trim().toLowerCase() === 'general')
  if (generalSection?.key) return generalSection.key

  return String(allSections.value[0]?.key || '').trim()
}

function openHistoryItem(item) {
  const eventId = String(item?.id || '').trim()
  const tableName = String(props.historyTableName || '').trim()
  const recordId = String(props.historyRecordId || '').trim()
  if (!eventId || !tableName || !recordId) return
  router.push({
    name: 'record-history-entry',
    params: { tableName, recordId, eventId },
  })
}

function createUndoSnapshot() {
  return {
    activeSectionKey: activeSectionKey.value,
    formValues: { ...formValues.value },
    stagedFieldValues: { ...stagedFieldValues.value },
    fieldVerificationStates: { ...fieldVerificationStates.value },
    stagedArtifacts: stagedArtifacts.value.map((artifact) => ({ ...artifact })),
    selectedArtifactIds: [...selectedArtifactIds.value],
    autoProcessArtifacts: autoProcessArtifacts.value,
    companionUrl: companionUrl.value,
    companionBlurb: companionBlurb.value,
    urlEntries: urlEntries.value.map((entry) => ({ ...entry })),
    blurbEntries: blurbEntries.value.map((entry) => ({ ...entry })),
    selectedUrlEntryIds: [...selectedUrlEntryIds.value],
    selectedBlurbEntryIds: [...selectedBlurbEntryIds.value],
    expandedEntryIds: [...expandedEntryIds.value],
    supportResourcesCollapsed: supportResourcesCollapsed.value,
    recordDataCollapsed: recordDataCollapsed.value,
  }
}

function syncUndoSignature() {
  currentUndoSignature.value = JSON.stringify(createUndoSnapshot())
}

function pushUndoSnapshot() {
  if (isApplyingUndo.value) return
  const snapshot = createUndoSnapshot()
  const signature = JSON.stringify(snapshot)
  if (signature !== currentUndoSignature.value) {
    currentUndoSignature.value = signature
  }
  if (undoStack.value.at(-1)?.signature === signature) return
  undoStack.value = [...undoStack.value.slice(-49), { signature, snapshot }]
}

function restoreUndoSnapshot(snapshot) {
  isApplyingUndo.value = true
  activeSectionKey.value = String(snapshot?.activeSectionKey || activeSectionKey.value || '')
  formValues.value = { ...(snapshot?.formValues || {}) }
  stagedFieldValues.value = { ...(snapshot?.stagedFieldValues || {}) }
  fieldVerificationStates.value = { ...(snapshot?.fieldVerificationStates || {}) }
  stagedArtifacts.value = Array.isArray(snapshot?.stagedArtifacts)
    ? snapshot.stagedArtifacts.map((artifact) => ({ ...artifact }))
    : []
  selectedArtifactIds.value = Array.isArray(snapshot?.selectedArtifactIds) ? [...snapshot.selectedArtifactIds] : []
  autoProcessArtifacts.value = Boolean(snapshot?.autoProcessArtifacts)
  companionUrl.value = String(snapshot?.companionUrl || '')
  companionBlurb.value = String(snapshot?.companionBlurb || '')
  urlEntries.value = Array.isArray(snapshot?.urlEntries) ? snapshot.urlEntries.map((entry) => ({ ...entry })) : []
  blurbEntries.value = Array.isArray(snapshot?.blurbEntries) ? snapshot.blurbEntries.map((entry) => ({ ...entry })) : []
  selectedUrlEntryIds.value = Array.isArray(snapshot?.selectedUrlEntryIds) ? [...snapshot.selectedUrlEntryIds] : []
  selectedBlurbEntryIds.value = Array.isArray(snapshot?.selectedBlurbEntryIds) ? [...snapshot.selectedBlurbEntryIds] : []
  expandedEntryIds.value = Array.isArray(snapshot?.expandedEntryIds) ? [...snapshot.expandedEntryIds] : []
  supportResourcesCollapsed.value = Boolean(snapshot?.supportResourcesCollapsed)
  recordDataCollapsed.value = Boolean(snapshot?.recordDataCollapsed)
  hasUserChanges.value = true
  syncUndoSignature()
  isApplyingUndo.value = false
  emit('change', buildDialogSnapshot())
}

function undoLastAction() {
  if (!undoStack.value.length) return
  const previous = undoStack.value.at(-1)?.snapshot || null
  undoStack.value = undoStack.value.slice(0, -1)
  if (!previous) return
  restoreUndoSnapshot(previous)
}

function startUndoKeyListener() {
  if (typeof window === 'undefined' || removeUndoKeyListener) return
  const handleKeydown = (event) => {
    if (!open.value) return
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
    if (String(event.key || '').trim().toLowerCase() !== 'z') return
    const target = event.target
    if (target instanceof HTMLElement) {
      const tagName = String(target.tagName || '').toLowerCase()
      if (target.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)) return
    }
    if (!canUndo.value) return
    event.preventDefault()
    event.stopPropagation()
    undoLastAction()
  }
  window.addEventListener('keydown', handleKeydown, true)
  removeUndoKeyListener = () => {
    window.removeEventListener('keydown', handleKeydown, true)
    removeUndoKeyListener = null
  }
}

function stopUndoKeyListener() {
  if (typeof removeUndoKeyListener === 'function') {
    removeUndoKeyListener()
  }
}

function initializeDialogState() {
  hasUserChanges.value = false
  undoStack.value = []
  activeSectionKey.value = resolveInitialDialogSectionKey(props.initialSectionKey)
  artifactDragOver.value = false
  stagedFieldValues.value = {}
  stagedArtifacts.value = normalizeInitialArtifacts(props.initialArtifacts)
  selectedArtifactIds.value = []
  autoProcessArtifacts.value = false
  companionUrl.value = ''
  companionBlurb.value = ''
  urlEntries.value = []
  blurbEntries.value = []
  selectedUrlEntryIds.value = []
  selectedBlurbEntryIds.value = []
  expandedEntryIds.value = []
  supportResourcesCollapsed.value = props.preferAddLayout ? true : Boolean(props.initialResourcesCollapsed)
  recordDataCollapsed.value = props.preferAddLayout ? false : Boolean(props.initialRecordDataCollapsed)
  dialogWidth.value = 760
  dialogHeight.value = 780
  formValues.value = Object.fromEntries(
    allSections.value
      .flatMap((section) => section.tokens || [])
      .map((token) => {
        const initialValue = props.initialValues?.[token.key]
        if (token.tokenType === 'select_multi') {
          return [token.key, normalizeMultiValue(initialValue)]
        }
        return [token.key, initialValue == null ? '' : initialValue]
      }),
  )
  fieldVerificationStates.value = Object.fromEntries(
    allSections.value
      .flatMap((section) => section.tokens || [])
      .map((token) => [
        token.key,
        String(props.initialFieldMeta?.[token.key]?.verificationState || '').trim(),
      ]),
  )
  syncUndoSignature()
}

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    initializeDialogState()
  },
  { immediate: true },
)

watch(
  [() => open.value, dialogPayloadResetSignature],
  ([isOpen], [, previousSignature]) => {
    if (!isOpen) return
    if (!previousSignature) return
    initializeDialogState()
  },
)

watch(
  () => open.value,
  (nextOpen) => {
    if (nextOpen) {
      startUndoKeyListener()
      return
    }
    stopUndoKeyListener()
  },
  { immediate: true },
)


function updateField(tokenKey, value) {
  pushUndoSnapshot()
  const token = allSections.value.flatMap((section) => section.tokens || []).find((entry) => entry.key === tokenKey) || null
  formValues.value = {
    ...formValues.value,
    [tokenKey]: value,
  }
  if (tokenKey in stagedFieldValues.value) {
    const nextStagedValues = { ...stagedFieldValues.value }
    delete nextStagedValues[tokenKey]
    stagedFieldValues.value = nextStagedValues
  }
  if (token && isReviewTrackedField(token)) {
    fieldVerificationStates.value = {
      ...fieldVerificationStates.value,
      [tokenKey]: 'verified',
    }
  }
  hasUserChanges.value = true
  syncUndoSignature()
  emit('change', buildDialogSnapshot())
}

function getSelectDraftValue(tokenKey) {
  return String(selectDraftValues.value?.[tokenKey] || '')
}

function setSelectDraftValue(tokenKey, value) {
  selectDraftValues.value = {
    ...selectDraftValues.value,
    [tokenKey]: String(value || ''),
  }
}

function clearSelectDraftValue(tokenKey) {
  if (!(tokenKey in selectDraftValues.value)) return
  const nextDraftValues = { ...selectDraftValues.value }
  delete nextDraftValues[tokenKey]
  selectDraftValues.value = nextDraftValues
}

function getStagedFieldValue(tokenKey) {
  if (tokenKey in stagedFieldValues.value) return stagedFieldValues.value[tokenKey]
  return stringValue(formValues.value?.[tokenKey])
}

function stageFieldValue(tokenKey, value) {
  stagedFieldValues.value = {
    ...stagedFieldValues.value,
    [tokenKey]: value == null ? '' : String(value),
  }
}

function commitStagedField(tokenKey) {
  if (!(tokenKey in stagedFieldValues.value)) return
  const nextValue = stagedFieldValues.value[tokenKey]
  updateField(tokenKey, nextValue)
}

function handleTextFieldEnter(token, tokenKey, event) {
  if (isLongTextField(token)) return
  event?.stopPropagation?.()
  event?.preventDefault?.()
  commitStagedField(tokenKey)
  if (props.loading || props.submitDisabled) return
  submit()
}

function buildCommittedFormValues() {
  if (!Object.keys(stagedFieldValues.value).length) return { ...formValues.value }
  return {
    ...formValues.value,
    ...stagedFieldValues.value,
  }
}

function submit() {
  emit('submit', {
    ...buildDialogSnapshot(),
  })
}

function buildDialogSnapshot() {
  const contextDefaults = artifactContextNote.value
    ? stagedArtifacts.value
      .filter((artifact) => selectedArtifactIds.value.includes(artifact.id))
      .map((artifact) => ({
        artifactId: artifact.artifactId || artifact.id,
        state: 'default_preselected_unverified',
        sourceEntity: String(props.artifactContext?.entityName || '').trim(),
        sourceRecordId: String(props.artifactContext?.recordId || '').trim(),
        sourceLabel: String(props.artifactContext?.entityLabel || '').trim(),
        sourceRecordLabel: String(props.artifactContext?.recordLabel || '').trim(),
      }))
    : []

  return {
    values: buildCommittedFormValues(),
    verification: {
      changes: buildVerificationChanges(),
    },
    artifacts: {
      stagedFiles: stagedArtifacts.value.filter((artifact) => selectedArtifactIds.value.includes(artifact.id)),
      processedFiles: stagedArtifacts.value
        .filter((artifact) => selectedArtifactIds.value.includes(artifact.id))
        .map((artifact) => ({
          artifactId: artifact.artifactId || artifact.id,
          processedArtifactId: artifact.processedArtifactId || '',
          name: artifact.name,
        })),
      autoProcess: autoProcessArtifacts.value,
      contextDefaults,
    },
    companion: {
      urls: urlEntries.value.map((entry) => entry.value),
      guidance: blurbEntries.value.map((entry) => entry.value),
    },
    hasUserChanges: hasUserChanges.value,
  }
}

function markDialogChanged() {
  hasUserChanges.value = true
  syncUndoSignature()
  emit('change', buildDialogSnapshot())
}

function stringValue(value) {
  return typeof value === 'string' ? value : String(value || '')
}

function selectSingleValue(value) {
  return value == null ? '' : value
}

function normalizeMultiValue(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function inputTypeForToken(tokenType) {
  if (tokenType === 'email') return 'email'
  if (tokenType === 'phone') return 'tel'
  if (tokenType === 'url') return 'url'
  if (tokenType === 'date') return 'date'
  if (tokenType === 'datetime') return 'datetime-local'
  return 'text'
}

function formatFieldType(tokenType) {
  const normalized = String(tokenType || 'text').trim()
  if (!normalized) return 'Field'
  return normalized.replace(/_/g, ' ')
}

function isWideField(token) {
  return isSummaryField(token)
}

function getMultiSelectOptionEntries(token, value) {
  const selectedValues = Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  if (!selectedValues.length) return []
  const optionMap = new Map(
    (Array.isArray(token?.inputOptions) ? token.inputOptions : []).map((option) => [
      String(option?.value ?? option?.label ?? '').trim(),
      String(option?.label ?? option?.value ?? '').trim(),
    ]),
  )
  return selectedValues.map((selectedValue) => ({
    key: `${String(token?.key || 'field').trim()}:${selectedValue}`,
    value: selectedValue,
    label: optionMap.get(selectedValue) || selectedValue,
  }))
}

function formatMultiSelectSummary(token, value) {
  const entries = getMultiSelectOptionEntries(token, value)
  if (!entries.length) return ''
  if (entries.length === 1) return entries[0].label
  return `${entries.length} selected`
}

function getSingleSelectOptionLabel(token, value) {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return ''
  const matchedOption = (Array.isArray(token?.inputOptions) ? token.inputOptions : []).find((option) =>
    String(option?.value ?? '').trim() === normalizedValue,
  )
  return String(matchedOption?.label ?? matchedOption?.value ?? normalizedValue).trim()
}

function getLockedFieldDisplayValue(token) {
  const tokenKey = String(token?.key || '').trim()
  if (!tokenKey) return ''
  const rawValue = formValues.value?.[tokenKey]
  const tokenType = String(token?.tokenType || '').trim()
  if (tokenType === 'select_multi') return formatMultiSelectSummary(token, rawValue)
  if (tokenType === 'select_single') return getSingleSelectOptionLabel(token, rawValue)
  return String(getStagedFieldValue(tokenKey) || rawValue || '').trim()
}

function fieldHasCopyableLockedValue(token) {
  return Boolean(isFieldLocked(token) && getLockedFieldDisplayValue(token))
}

async function copyLockedFieldValue(token) {
  const value = getLockedFieldDisplayValue(token)
  if (!value) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const helper = document.createElement('textarea')
      helper.value = value
      helper.setAttribute('readonly', '')
      helper.style.position = 'absolute'
      helper.style.left = '-9999px'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      document.body.removeChild(helper)
    }
    $q.notify({
      type: 'positive',
      message: `${String(token?.label || 'Value').trim()} copied.`,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not copy field value.',
    })
  }
}

function removeMultiSelectValue(token, rawValue) {
  if (!token || isFieldLocked(token)) return
  const tokenKey = String(token.key || '').trim()
  const selectedValue = String(rawValue || '').trim()
  if (!tokenKey || !selectedValue) return
  const existingValues = Array.isArray(formValues.value?.[tokenKey])
    ? formValues.value[tokenKey].map((item) => String(item || '').trim()).filter(Boolean)
    : []
  if (!existingValues.includes(selectedValue)) return
  updateField(
    tokenKey,
    existingValues.filter((item) => item !== selectedValue),
  )
}

function allowTypedSelectEntry(token) {
  const optionSource = String(token?.optionSource || '').trim()
  return ['live_entity', 'live_entity_set'].includes(optionSource)
}

function getInlineCreateConfig(token) {
  const optionSource = String(token?.optionSource || '').trim()
  if (optionSource !== 'live_entity') return null
  const entityName = String(token?.optionEntity || '').trim()
  if (!entityName) return null
  const registryEntry = getFilePageRegistryEntryByEntityReference(entityName)
  const sourceKey = String(registryEntry?.key || '').trim().toLowerCase()
  if (!sourceKey || !INLINE_NAME_ONLY_CREATE_SOURCES.has(sourceKey)) return null
  if (getCreateBranchTokenName(sourceKey)) return null
  if (!bridge.value?.[sourceKey]?.create) return null
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const titleField = String(titleToken?.dbWriteField || titleToken?.tokenName || '').trim()
  if (!titleField) return null
  return {
    sourceKey,
    singularLabel: String(registryEntry?.singularLabel || registryEntry?.label || entityName).trim() || entityName,
    titleField,
  }
}

const INLINE_CREATE_RESULT_ID_FIELDS = Object.freeze({
  users: Object.freeze({
    Contacts: 'contact_id',
    Users: 'id',
  }),
})

function resolveInlineCreatedValueId(token, inlineCreateConfig, result) {
  const sourceKey = String(inlineCreateConfig?.sourceKey || '').trim().toLowerCase()
  const expectedEntity = String(token?.optionEntity || '').trim()
  const explicitFieldName = INLINE_CREATE_RESULT_ID_FIELDS[sourceKey]?.[expectedEntity]
  if (explicitFieldName) {
    const explicitValue = String(result?.[explicitFieldName] || '').trim()
    if (explicitValue) return explicitValue
  }
  return String(result?.id || '').trim()
}

function hasMatchingSelectOption(token, rawValue) {
  const normalizedValue = String(rawValue || '').trim().toLowerCase()
  if (!normalizedValue) return false
  return (Array.isArray(token?.inputOptions) ? token.inputOptions : []).some((option) => {
    const optionValue = String(option?.value ?? '').trim().toLowerCase()
    const optionLabel = String(option?.label ?? '').trim().toLowerCase()
    return normalizedValue === optionValue || normalizedValue === optionLabel
  })
}

function hasPendingNewSelectValue(token) {
  if (!allowTypedSelectEntry(token) || !getInlineCreateConfig(token)) return false
  const tokenKey = String(token?.key || '').trim()
  const draftValue = getSelectDraftValue(tokenKey)
  return Boolean(draftValue && !hasMatchingSelectOption(token, draftValue))
}

function setInlineCreatingSelectKey(tokenKey, active) {
  const normalizedKey = String(tokenKey || '').trim()
  if (!normalizedKey) return
  inlineCreatingSelectKeys.value = active
    ? Array.from(new Set([...inlineCreatingSelectKeys.value, normalizedKey]))
    : inlineCreatingSelectKeys.value.filter((entry) => entry !== normalizedKey)
}

function isInlineCreatingSelect(tokenKey) {
  return inlineCreatingSelectKeys.value.includes(String(tokenKey || '').trim())
}

async function commitSelectInputValue(token, rawValue, done = null) {
  const normalizedValue = String(rawValue || '').trim()
  if (!normalizedValue) {
    done?.(null, 'cancel')
    return
  }

  const tokenKey = String(token?.key || '').trim()
  if (!tokenKey) {
    done?.(null, 'cancel')
    return
  }

  if (hasMatchingSelectOption(token, normalizedValue)) {
    const matchedOption = (Array.isArray(token?.inputOptions) ? token.inputOptions : []).find((option) => {
      const optionValue = String(option?.value ?? '').trim().toLowerCase()
      const optionLabel = String(option?.label ?? '').trim().toLowerCase()
      return normalizedValue.toLowerCase() === optionValue || normalizedValue.toLowerCase() === optionLabel
    })
    const resolvedValue = matchedOption?.value ?? normalizedValue
    if (String(token?.tokenType || '').trim() === 'select_multi') {
      const existingValues = Array.isArray(formValues.value?.[tokenKey])
        ? formValues.value[tokenKey].map((item) => String(item || '').trim()).filter(Boolean)
        : []
      updateField(tokenKey, Array.from(new Set([...existingValues, resolvedValue])))
    } else {
      updateField(tokenKey, resolvedValue)
    }
    clearSelectDraftValue(tokenKey)
    done?.(resolvedValue, 'add-unique')
    return
  }

  const inlineCreateConfig = getInlineCreateConfig(token)
  if (!inlineCreateConfig) {
    $q.notify({
      type: 'warning',
      message: `${String(token?.label || 'This field').trim()} can only link existing records right now.`,
    })
    done?.(null, 'cancel')
    return
  }

  setInlineCreatingSelectKey(tokenKey, true)
  try {
    const result = await bridge.value?.[inlineCreateConfig.sourceKey]?.create?.({
      [inlineCreateConfig.titleField]: normalizedValue,
    })
    const createdId = resolveInlineCreatedValueId(token, inlineCreateConfig, result)
    if (!createdId) throw new Error('Related record was not created.')

    const tokenType = String(token?.tokenType || '').trim()
    if (tokenType === 'select_multi') {
      const existingValues = Array.isArray(formValues.value?.[tokenKey])
        ? formValues.value[tokenKey].map((item) => String(item || '').trim()).filter(Boolean)
        : []
      updateField(tokenKey, Array.from(new Set([...existingValues, createdId])))
    } else {
      updateField(tokenKey, createdId)
    }
    clearSelectDraftValue(tokenKey)
    done?.(createdId, 'add-unique')
    $q.notify({
      type: 'positive',
      message: `${inlineCreateConfig.singularLabel} created and linked.`,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.message || String(error),
    })
    done?.(null, 'cancel')
  } finally {
    setInlineCreatingSelectKey(tokenKey, false)
  }
}

function isNameField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'name'
}

function isSummaryField(token) {
  return String(token?.label || '').trim().toLowerCase() === 'summary'
}

function isLongTextField(token) {
  const normalizedType = String(token?.tokenType || '').trim().toLowerCase()
  return (
    isSummaryField(token)
    || normalizedType === 'long_text'
    || normalizedType === 'textarea'
    || normalizedType === 'rich_text'
  )
}

function getFieldMeta(token) {
  return props.initialFieldMeta?.[token?.key] || null
}

function fieldVerificationState(token) {
  return String(fieldVerificationStates.value?.[token?.key] || '').trim()
}

function isReviewTrackedField(token) {
  const meta = getFieldMeta(token)
  return Boolean(
    String(meta?.verificationState || '').trim() ||
    String(meta?.verificationSource || '').trim(),
  )
}

function resolvedFieldVerificationState(token) {
  const explicitState = fieldVerificationState(token)
  if (explicitState) return explicitState
  const metaState = String(getFieldMeta(token)?.verificationState || '').trim()
  if (metaState) return metaState
  return ''
}

function fieldHasValue(token) {
  const value = formValues.value?.[token?.key]
  if (Array.isArray(value)) return value.length > 0
  return String(value ?? '').trim().length > 0
}

function shouldHighlightFieldVerification(token) {
  if (!isReviewTrackedField(token) || !fieldHasValue(token)) return false
  const state = resolvedFieldVerificationState(token)
  return state !== 'verified'
}

function fieldVerificationClass(token) {
  if (!shouldHighlightFieldVerification(token)) return ''
  const state = resolvedFieldVerificationState(token)
  if (state === 'default_preselected_unverified') {
    return 'create-record-shell__input--verification-default'
  }
  return 'create-record-shell__input--verification-suggested'
}

function showFieldVerificationAction(token) {
  return isReviewTrackedField(token) && fieldHasValue(token)
}

function usesCompactFieldAction(token) {
  return !isLongTextField(token)
}

function fieldVerificationIcon(token) {
  const state = resolvedFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.icon || 'help'
}

function fieldVerificationIconClass(token) {
  const state = resolvedFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.iconClass || ''
}

function fieldVerificationIconStyle(token) {
  const state = resolvedFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.color ? { color: option.color } : {}
}

function fieldActionClass(token) {
  return usesCompactFieldAction(token)
    ? 'create-record-shell__field-action create-record-shell__field-action--box'
    : 'create-record-shell__field-action'
}

function verificationMenuAnchor(column) {
  return column === 'right' ? 'bottom left' : 'bottom right'
}

function verificationMenuSelf(column) {
  return column === 'right' ? 'top right' : 'top left'
}

function updateFieldVerificationState(token, nextState) {
  pushUndoSnapshot()
  fieldVerificationStates.value = {
    ...fieldVerificationStates.value,
    [token.key]: String(nextState || '').trim(),
  }
  hasUserChanges.value = true
  syncUndoSignature()
  emit('change', buildDialogSnapshot())
}

function buildVerificationChanges() {
  return allSections.value
    .flatMap((section) => section.tokens || [])
    .map((token) => {
      const meta = getFieldMeta(token)
      const initialState = String(meta?.verificationState || '').trim()
      if (!initialState) return null
      const currentValue = formValues.value?.[token.key]
      const initialValue = props.initialValues?.[token.key]
      const valueChanged = JSON.stringify(currentValue ?? '') !== JSON.stringify(initialValue ?? '')
      const nextState = valueChanged ? 'verified' : resolvedFieldVerificationState(token)
      if (!nextState || nextState === initialState) return null
      return {
        tokenKey: token.key,
        fieldName: String(meta?.fieldName || '').trim(),
        tableName: String(meta?.tableName || '').trim(),
        recordId: String(meta?.recordId || '').trim(),
        source: valueChanged
          ? 'direct_user_input'
          : String(meta?.verificationSource || 'dialog_field_review').trim(),
        state: nextState,
      }
    })
    .filter(Boolean)
}

function isFieldLocked(token) {
  return Boolean(getFieldMeta(token)?.locked)
}

function fieldHasParentRecordLink(token) {
  const meta = getFieldMeta(token)
  return Boolean(meta?.locked && meta?.tableName && meta?.recordId)
}

function openFieldParentRecord(token) {
  const meta = getFieldMeta(token)
  if (!meta?.tableName || !meta?.recordId) return
  const location = buildRecordViewLocation({
    tableName: meta.tableName,
    recordId: meta.recordId,
    returnTo: route.fullPath,
  })
  if (!location) return
  router.push(location)
}

async function onArtifactDrop(event) {
  pushUndoSnapshot()
  artifactDragOver.value = false
  const files = Array.from(event?.dataTransfer?.files || [])
  if (!files.length) return

  const nextArtifacts = await Promise.all(
    files
      .map((file) => normalizeArtifactFile(file))
      .filter((file) => file.path || file.name),
  )

  if (!nextArtifacts.length) return

  const existingByPath = new Map(
    stagedArtifacts.value.map((artifact) => [artifact.path || artifact.name, artifact]),
  )

  nextArtifacts.forEach((artifact) => {
    const key = artifact.path || artifact.name
    existingByPath.set(key, artifact)
  })

  stagedArtifacts.value = Array.from(existingByPath.values())
  selectedArtifactIds.value = Array.from(
    new Set([
      ...selectedArtifactIds.value,
      ...nextArtifacts.map((artifact) => artifact.id),
    ]),
  )
  markDialogChanged()
}

function normalizeArtifactFile(file) {
  const name = String(file?.name || '').trim()
  const path = String(file?.path || file?.webkitRelativePath || '').trim()
  const size = Number(file?.size || 0)
  return {
    id: path || `${name}:${size}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    name,
    path: path || null,
    size,
    artifactId: '',
    processedArtifactId: '',
  }
}

function normalizeInitialArtifacts(artifacts = []) {
  return (Array.isArray(artifacts) ? artifacts : [])
    .map((artifact, index) => {
      const name = String(artifact?.name || artifact?.label || artifact?.title || artifact || '').trim()
      const path = String(artifact?.path || '').trim()
      const size = Number(artifact?.size || 0)
      if (!name && !path) return null
      return {
        id: String(artifact?.id || artifact?.artifactId || path || `${name}:${index}`).trim(),
        name: name || path,
        path: path || null,
        size,
        artifactId: String(artifact?.artifactId || artifact?.id || '').trim(),
        processedArtifactId: String(artifact?.processedArtifactId || '').trim(),
      }
    })
    .filter(Boolean)
}

async function toggleArtifactSelection(artifactId, nextValue) {
  pushUndoSnapshot()
  if (nextValue) {
    if (!selectedArtifactIds.value.includes(artifactId)) {
      selectedArtifactIds.value = [...selectedArtifactIds.value, artifactId]
    }
    await ensureProcessedArtifactForSelection(artifactId)
    markDialogChanged()
    return
  }

  selectedArtifactIds.value = selectedArtifactIds.value.filter((id) => id !== artifactId)
  await removeProcessedArtifactForSelection(artifactId)
  markDialogChanged()
}

async function toggleAllArtifacts(nextValue) {
  pushUndoSnapshot()
  if (nextValue) {
    selectedArtifactIds.value = stagedArtifacts.value.map((artifact) => artifact.id)
    await Promise.all(selectedArtifactIds.value.map((artifactId) => ensureProcessedArtifactForSelection(artifactId)))
    markDialogChanged()
    return
  }

  await Promise.all(selectedArtifactIds.value.map((artifactId) => removeProcessedArtifactForSelection(artifactId)))
  selectedArtifactIds.value = []
  markDialogChanged()
}

function formatArtifactSize(size) {
  const normalized = Number(size || 0)
  if (!Number.isFinite(normalized) || normalized <= 0) return '--'
  if (normalized < 1024) return `${normalized} B`
  if (normalized < 1024 * 1024) return `${(normalized / 1024).toFixed(1)} KB`
  return `${(normalized / (1024 * 1024)).toFixed(1)} MB`
}

function artifactPreviewIcon(artifact) {
  const name = String(artifact?.name || '').trim().toLowerCase()
  if (name.endsWith('.pdf')) return 'picture_as_pdf'
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'table_chart'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description'
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'slideshow'
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp')) return 'image'
  return 'insert_drive_file'
}

function openIntakeShell() {
  setPendingIntakeShellRequest({
    initialArtifacts: stagedArtifacts.value,
    artifactContext: props.artifactContext,
  })
  router.push({
    name: 'intake-shell',
    query: {
      section: 'intake',
      open: String(Date.now()),
      returnTo: route.fullPath,
    },
  })
}

async function persistDroppedArtifact(artifact) {
  if (!artifact?.path || !bridge.value?.artifacts?.ingest) return artifact
  try {
    const result = await bridge.value.artifacts.ingest({
      filePaths: [artifact.path],
      opportunityId: resolveArtifactContextOpportunityId() || undefined,
      duplicateStrategy: 'rename',
    })
    const persistedId = String(result?.results?.[0]?.raw?.artifact_id || '').trim()
    if (!persistedId) {
      throw new Error(`Ingest returned no artifact id for "${artifact.name || 'file'}".`)
    }
    return {
      ...artifact,
      artifactId: persistedId,
    }
  } catch (error) {
    throw new Error(error?.message || String(error || 'Could not ingest artifact.'))
  }
}

async function ensureProcessedArtifactForSelection(artifactId) {
  const artifact = stagedArtifacts.value.find((entry) => entry.id === artifactId)
  if (!artifact || artifact.processedArtifactId || !bridge.value?.intake?.create) return

  let workingArtifact = artifact
  if (!String(artifact.artifactId || artifact.id || '').trim().startsWith('artifact:')) {
    const persistedArtifact = await persistDroppedArtifact(artifact)
    workingArtifact = persistedArtifact || artifact
    stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
      entry.id === artifactId
        ? { ...entry, ...workingArtifact }
        : entry,
    )
  }

  try {
    const result = await bridge.value.intake.create({
      Intake_Name: workingArtifact.name,
      Intake_Summary: '',
      Original_Artifact_Id: workingArtifact.artifactId || workingArtifact.id,
      Working: 1,
    })
    const processedArtifactId = String(result?.id || '').trim()
    if (!processedArtifactId) return
    stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
      entry.id === artifactId
        ? { ...entry, processedArtifactId }
        : entry,
    )
  } catch {
    // Keep the shell usable even if the intake bridge is not ready.
  }
}

async function startArtifactProcessing(artifactId) {
  pushUndoSnapshot()
  const artifact = stagedArtifacts.value.find((entry) => entry.id === artifactId)
  if (!artifact || artifact.artifactId) return
  if (startingArtifactIds.value.includes(artifactId)) return
  startingArtifactIds.value = [...startingArtifactIds.value, artifactId]
  try {
    const persistedArtifact = await persistDroppedArtifact(artifact)
    stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
      entry.id === artifactId
        ? { ...entry, ...persistedArtifact }
        : entry,
    )
    markDialogChanged()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.message || `Could not start intake for ${artifact.name || 'this file'}.`,
    })
  } finally {
    startingArtifactIds.value = startingArtifactIds.value.filter((id) => id !== artifactId)
  }
}

function resolveArtifactContextOpportunityId() {
  const entityName = String(props.artifactContext?.entityName || '').trim().toLowerCase()
  const entityLabel = String(props.artifactContext?.entityLabel || '').trim().toLowerCase()
  const recordId = String(props.artifactContext?.recordId || '').trim()
  if (!recordId) return ''
  if (['opportunities', 'funds', 'rounds'].includes(entityName)) return recordId
  if (['opportunity', 'fund', 'round'].includes(entityLabel)) return recordId
  return ''
}

async function removeProcessedArtifactForSelection(artifactId) {
  const artifact = stagedArtifacts.value.find((entry) => entry.id === artifactId)
  const processedArtifactId = String(artifact?.processedArtifactId || '').trim()
  if (!processedArtifactId) return

  try {
    await bridge.value?.intake?.delete?.(processedArtifactId)
  } catch {
    // Leave the local shell state consistent even if delete fails.
  }

  stagedArtifacts.value = stagedArtifacts.value.map((entry) =>
    entry.id === artifactId
      ? { ...entry, processedArtifactId: '' }
      : entry,
  )
}

function addCompanionEntry(kind) {
  pushUndoSnapshot()
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const sourceRef = normalizedKind === 'url' ? companionUrl : companionBlurb
  const nextValue = String(sourceRef.value || '').trim()
  if (!nextValue) return

  const nextEntry = {
    id: `${normalizedKind}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    value: nextValue,
  }

  if (normalizedKind === 'url') {
    urlEntries.value = [...urlEntries.value, nextEntry]
    companionUrl.value = ''
  } else {
    blurbEntries.value = [...blurbEntries.value, nextEntry]
    companionBlurb.value = ''
  }

  markDialogChanged()
}

function toggleCompanionEntrySelection(kind, entryId, nextValue) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const targetRef = normalizedKind === 'url' ? selectedUrlEntryIds : selectedBlurbEntryIds
  const normalizedId = String(entryId || '').trim()
  if (!normalizedId) return

  if (nextValue) {
    if (!targetRef.value.includes(normalizedId)) {
      targetRef.value = [...targetRef.value, normalizedId]
    }
    return
  }

  targetRef.value = targetRef.value.filter((id) => id !== normalizedId)
}

function removeCompanionEntries(kind) {
  pushUndoSnapshot()
  const normalizedKind = String(kind || '').trim().toLowerCase()
  if (normalizedKind === 'url') {
    const selected = new Set(selectedUrlEntryIds.value)
    urlEntries.value = urlEntries.value.filter((entry) => !selected.has(entry.id))
    selectedUrlEntryIds.value = []
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => !selected.has(id))
  } else {
    const selected = new Set(selectedBlurbEntryIds.value)
    blurbEntries.value = blurbEntries.value.filter((entry) => !selected.has(entry.id))
    selectedBlurbEntryIds.value = []
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => !selected.has(id))
  }
  markDialogChanged()
}

function toggleCompanionEntryExpanded(entryId) {
  const normalizedId = String(entryId || '').trim()
  if (!normalizedId) return
  if (expandedEntryIds.value.includes(normalizedId)) {
    expandedEntryIds.value = expandedEntryIds.value.filter((id) => id !== normalizedId)
    return
  }
  expandedEntryIds.value = [...expandedEntryIds.value, normalizedId]
}

function startResize(event) {
  stopResize()
  const startX = Number(event?.clientX || 0)
  const startY = Number(event?.clientY || 0)
  const initialWidth = dialogWidth.value
  const initialHeight = dialogHeight.value

  const handlePointerMove = (moveEvent) => {
    const nextWidth = Math.max(560, Math.min(window.innerWidth - 48, initialWidth + Number(moveEvent?.clientX || 0) - startX))
    const nextHeight = Math.max(520, Math.min(window.innerHeight - 48, initialHeight + Number(moveEvent?.clientY || 0) - startY))
    dialogWidth.value = nextWidth
    dialogHeight.value = nextHeight
  }

  const handlePointerUp = () => {
    stopResize()
  }

  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', handlePointerUp)

  removeResizeListeners = () => {
    window.removeEventListener('mousemove', handlePointerMove)
    window.removeEventListener('mouseup', handlePointerUp)
  }
}

function stopResize() {
  if (typeof removeResizeListeners === 'function') {
    removeResizeListeners()
    removeResizeListeners = null
  }
}

onBeforeUnmount(() => {
  stopResize()
  stopUndoKeyListener()
})
</script>

<style scoped>
.create-record-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(52vw, 760px);
  height: min(78vh, 780px);
  min-width: min(52vw, 640px);
  min-height: min(78vh, 690px);
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  background: rgba(249, 249, 247, 0.98);
  border-radius: 18px;
  overflow: hidden;
}

.create-record-shell__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.create-record-shell__header-copy {
  flex: 1 1 auto;
  min-height: 1px;
  min-width: 0;
}

.create-record-shell__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 12px;
}

.create-record-shell__header-link {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--ds-font-family-body);
  font-size: 0.82rem;
  font-weight: 600;
}

.create-record-shell__header-link:hover,
.create-record-shell__header-link:focus-visible {
  color: #ffffff;
}

.create-record-shell__shell-selector {
  display: inline-flex;
  align-items: center;
  gap: 0;
  width: min(220px, 100%);
  max-width: 100%;
  overflow: visible;
}

.create-record-shell__shell-selector-control {
  width: min(220px, 100%);
  min-width: 0;
}

.create-record-shell__shell-selector-control :deep(.q-field__control) {
  min-height: 32px;
  padding: 0;
}

.create-record-shell__shell-selector-control :deep(.q-field__native) {
  color: #fff;
}

.create-record-shell__shell-selector-control :deep(.q-field__native),
.create-record-shell__shell-selector-control :deep(.q-field__marginal) {
  padding: 0;
}

.create-record-shell__shell-selector-value {
  color: #fff;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 10px;
  background: #000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
}

.create-record-shell__shell-selector-option-label {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 8px;
  color: #ffffff;
  background: #111111;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.82);
  font-family: var(--font-title);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.03em;
}

:global(.create-record-shell__shell-selector-menu) {
  background: #ffffff !important;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14) !important;
  border: 1px solid rgba(17, 17, 17, 0.08) !important;
}

:global(.create-record-shell__shell-selector-menu .q-virtual-scroll__content),
:global(.create-record-shell__shell-selector-menu .q-menu),
:global(.create-record-shell__shell-selector-menu .q-list) {
  background: #ffffff !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0;
}

:global(.create-record-shell__shell-selector-menu .q-item) {
  min-height: 34px;
  padding: 4px 6px;
  color: #ffffff;
  background: transparent;
}

:global(.create-record-shell__shell-selector-menu .q-item.q-manual-focusable--focused),
:global(.create-record-shell__shell-selector-menu .q-item--active) {
  background: transparent;
}

:global(.create-record-shell__shell-selector-menu .q-item.q-manual-focusable--focused .create-record-shell__shell-selector-option-label),
:global(.create-record-shell__shell-selector-menu .q-item--active .create-record-shell__shell-selector-option-label) {
  background: #000000;
  box-shadow: 0 0 0 1px #ffffff;
}

.create-record-shell__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1.46rem;
  font-weight: var(--font-weight-black);
  line-height: 0.94;
  margin-bottom: 0;
}

.create-record-shell__header-actions {
  display: none;
}

.create-record-shell__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 18px 28px 28px;
  overflow: hidden;
}

.create-record-shell__content-stack {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.create-record-shell__record-data {
  display: grid;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  padding: 0 20px;
}

.create-record-shell__record-data-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.create-record-shell__record-data-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__record-data-toggle-icon {
  color: #111111;
  font-size: 1rem;
  flex: 0 0 auto;
}

.create-record-shell__intake-lane {
  display: grid;
  gap: 12px;
  width: 100%;
  padding: 0 20px;
}

.create-record-shell__intake-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.create-record-shell__intake-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__intake-toggle-icon {
  color: #111111;
  font-size: 1rem;
  flex: 0 0 auto;
}

.create-record-shell__intake-body {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
  gap: 16px;
  align-items: stretch;
}

.create-record-shell__intake-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
}

.create-record-shell__intake-column-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__artifact-drop {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 130px;
  padding: 14px 16px 12px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 10px;
}

.create-record-shell__artifact-context-note {
  display: block;
  margin-bottom: 10px;
  color: rgba(62, 46, 4, 0.74);
  font-size: 0.73rem;
  line-height: 1.35;
}

.create-record-shell__artifact-drop--active {
  background: rgba(238, 241, 255, 0.98);
  border-color: rgba(38, 71, 255, 0.6);
}

.create-record-shell__intake-side {
  display: grid;
  min-height: 130px;
}

.create-record-shell__artifact-drop-copy {
  display: grid;
  gap: 4px;
}

.create-record-shell__artifact-drop-title {
  display: none;
}

.create-record-shell__artifact-drop-caption {
  color: rgba(17, 17, 17, 0.62);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__artifact-drop-list {
  display: grid;
  align-content: start;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
}

.create-record-shell__artifact-drop-list-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.create-record-shell__artifact-drop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  align-content: start;
  gap: 10px;
  max-height: 136px;
  overflow: auto;
  padding-right: 2px;
}

.create-record-shell__artifact-drop-empty {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.74rem;
  line-height: 1.3;
}

.create-record-shell__artifact-drop-item {
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 5px;
  padding: 8px 8px 6px;
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
}

.create-record-shell__artifact-drop-item .create-record-shell__artifact-checkbox {
  position: absolute;
  top: -7px;
  left: -7px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 999px;
}

.create-record-shell__artifact-drop-item-preview {
  display: grid;
  place-items: center;
  width: 58px;
  height: 68px;
  background: rgba(248, 248, 246, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 6px;
}

.create-record-shell__artifact-drop-item-icon {
  color: #111111;
  font-size: 2rem;
}

.create-record-shell__artifact-drop-item-name {
  width: 100%;
  color: #111111;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__artifact-drop-item-size {
  color: rgba(17, 17, 17, 0.55);
  font-size: 0.68rem;
  line-height: 1.2;
}

.create-record-shell__artifact-drop-footer {
  margin-top: auto;
  padding-top: 14px;
}

.create-record-shell__artifact-checkbox {
  margin: 0;
}

.create-record-shell__artifact-drop-list-head .create-record-shell__artifact-checkbox :deep(.q-checkbox__label) {
  color: rgba(17, 17, 17, 0.68);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__label) {
  color: rgba(17, 17, 17, 0.5);
  font-size: 0.64rem;
  font-weight: 500;
  line-height: 1.15;
}

.create-record-shell__artifact-drop-footer .create-record-shell__artifact-checkbox :deep(.q-checkbox__inner) {
  font-size: 0.9rem;
}

.create-record-shell__processing-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  padding: 14px 16px;
  background: rgba(249, 249, 247, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 10px;
}

.create-record-shell__processing-panel-head {
  display: none;
}

.create-record-shell__processing-panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
}

.create-record-shell__processing-sections {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: 10px;
  min-height: 0;
}

.create-record-shell__processing-box {
  display: grid;
  gap: 8px;
  min-height: 0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 4px;
}

.create-record-shell__processing-box--compact {
  align-content: start;
  gap: 4px;
  padding: 4px 5px;
  border-radius: 2px;
}

.create-record-shell__processing-box-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.create-record-shell__processing-box--compact .create-record-shell__processing-box-head {
  gap: 6px;
}

.create-record-shell__processing-box-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__processing-panel-meta {
  color: rgba(17, 17, 17, 0.52);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__processing-empty {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__processing-ready {
  color: rgba(17, 17, 17, 0.66);
  font-size: 0.76rem;
  line-height: 1.35;
}

.create-record-shell__processing-list {
  display: grid;
  align-content: start;
  gap: 4px;
  min-height: 0;
  overflow: auto;
}

.create-record-shell__processing-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
}

.create-record-shell__processing-item-name {
  min-width: 0;
  color: #111111;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__processing-item-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(17, 17, 17, 0.68);
  font-size: 0.72rem;
  line-height: 1.2;
}

.create-record-shell__processing-start-btn {
  color: var(--ds-color-brand-blue, #2647ff);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  min-height: 20px;
  padding: 0;
}

.create-record-shell__processing-start-btn :deep(.q-btn__content) {
  line-height: 1.2;
}

.create-record-shell__processing-spinner {
  flex: 0 0 auto;
}

.create-record-shell__processing-delete {
  padding: 0;
  color: rgba(17, 17, 17, 0.64);
  background: transparent;
  border: 0;
  font-family: var(--font-body);
  font-size: 0.68rem;
  line-height: 1;
  cursor: pointer;
}

.create-record-shell__processing-delete:disabled {
  opacity: 0.32;
  cursor: default;
}

.create-record-shell__processing-entry-add-row {
  position: relative;
  display: block;
  height: 11px;
  min-height: 11px;
  padding: 0;
  border: 0;
  background: transparent;
  box-sizing: border-box;
}

.create-record-shell__processing-entry-native-input {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0;
  height: 9px;
  min-height: 9px;
  color: #111111;
  caret-color: #111111;
  background: transparent;
  border: 0;
  outline: none;
  appearance: none;
  font-family: var(--font-body);
  font-size: 9px;
  line-height: 9px;
  vertical-align: top;
}

.create-record-shell__processing-entry-native-input--boxed {
  padding: 0 12px 0 3px;
  height: 11px;
  min-height: 11px;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 0;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-entry-hint {
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(17, 17, 17, 0.5);
  font-size: 9px;
  line-height: 1;
  pointer-events: none;
}

.create-record-shell__processing-entry-list {
  display: grid;
  align-content: start;
  gap: 3px;
  min-height: 0;
  max-height: 124px;
  overflow: auto;
  margin-top: 2px;
}

.create-record-shell__processing-entry-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  min-height: 12px;
  padding: 1px 3px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 0;
}

.create-record-shell__processing-entry-value {
  min-width: 0;
  color: #111111;
  font-size: 8px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-record-shell__processing-entry-toggle {
  min-width: 0;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  font-family: var(--font-body);
  font-size: 0.72rem;
  line-height: 1.2;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.create-record-shell__processing-entry-row--expanded .create-record-shell__processing-entry-toggle {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

.create-record-shell__processing-placeholder-box {
  height: 16px;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-placeholder-box--input,
.create-record-shell__processing-placeholder-box--textarea {
  width: 100%;
  padding: 0 4px;
  color: #111111;
  border: 1px solid rgba(17, 17, 17, 0.18);
  outline: none;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.96);
}

.create-record-shell__processing-placeholder-box--input {
  height: 16px;
  padding-top: 1px;
  padding-bottom: 1px;
  line-height: 12px;
}


.create-record-shell__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.create-record-shell__tabs-left,
.create-record-shell__tabs-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.create-record-shell__tabs-right {
  margin-left: auto;
}

.create-record-shell__tab {
  min-height: 30px;
  padding: 0 12px;
  color: #111111;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(17, 17, 17, 0.92);
  border-radius: 4px;
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.create-record-shell__tab--active {
  color: #ffffff;
  background: #111111;
}

.create-record-shell__panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 10px 18px 18px;
  overflow: auto;
  background: rgba(249, 249, 247, 0.92);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
}

.create-record-shell__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.create-record-shell__governance-surface {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0 4px;
}

.create-record-shell__governance-groups {
  display: grid;
  gap: 14px;
  padding: 10px 0 4px;
}

.create-record-shell__governance-group {
  display: grid;
  gap: 8px;
}

.create-record-shell__governance-group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.create-record-shell__governance-group-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__governance-group-meta {
  color: rgba(17, 17, 17, 0.54);
  font-family: var(--font-body);
  font-size: 0.7rem;
}

.create-record-shell__governance-table {
  width: 100%;
  border-collapse: collapse;
}

.create-record-shell__governance-table th,
.create-record-shell__governance-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.create-record-shell__governance-table th {
  color: rgba(17, 17, 17, 0.58);
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: var(--font-weight-medium);
}

.create-record-shell__governance-table td {
  color: #111111;
  font-family: var(--font-body);
  font-size: 0.74rem;
}

.create-record-shell__governance-empty {
  color: rgba(17, 17, 17, 0.56);
}

.create-record-shell__panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__panel-meta {
  color: rgba(17, 17, 17, 0.52);
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: var(--font-weight-light);
}

.create-record-shell__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
  align-content: start;
  overflow: visible;
  margin-right: 0;
  padding-right: 0;
}

.create-record-shell__fields-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-content: start;
}

.create-record-shell__field {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.create-record-shell__field--wide {
  grid-column: 1 / -1;
  align-items: start;
}

.create-record-shell__field-label-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.create-record-shell__field-label-wrap {
  display: grid;
  justify-items: start;
  gap: 4px;
}

.create-record-shell__field-label {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  text-align: left;
}

.create-record-shell__field-parent-link {
  color: #4f4f4f;
}

.create-record-shell__field-action {
  width: 20px;
  min-width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
  flex: 0 0 auto;
}

.create-record-shell__field-action--box {
  width: 22px;
  min-width: 22px;
  height: 18px;
  min-height: 18px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.create-record-shell__field-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  justify-self: start;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
}

.create-record-shell__input {
  flex: 0 1 auto;
  width: 15ch;
  min-width: 15ch;
  max-width: 15ch;
  align-self: center;
  background: transparent;
}

.create-record-shell__input :deep(.q-field__control) {
  min-height: 20px;
  height: 20px;
  padding-top: 0;
  padding-bottom: 0;
  align-items: center;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(17, 17, 17, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 20px;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input),
.create-record-shell__input :deep(.q-field__marginal),
.create-record-shell__input :deep(.q-chip),
.create-record-shell__selected-multi-chip {
  font-size: 0.78rem;
  line-height: 0.92;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-left: 2px;
  padding-right: 10px;
}

.create-record-shell__read-value {
  display: flex;
  align-items: center;
  width: 15ch;
  min-width: 15ch;
  max-width: 15ch;
  min-height: 20px;
  padding: 0;
  border: 0;
  box-shadow: none;
  outline: none;
  background: transparent !important;
  color: rgba(17, 17, 17, 0.48);
  font-family: var(--font-body);
  font-size: var(--ds-font-size-xs);
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.create-record-shell__read-value--summary {
  width: 100%;
  min-width: 0;
  max-width: none;
  align-items: flex-start;
  white-space: pre-wrap;
}

.create-record-shell__history-column {
  display: grid;
  align-content: start;
  gap: 12px;
}

.create-record-shell__history-summary-box {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 8px;
  background: rgba(17, 17, 17, 0.02);
}

.create-record-shell__history-summary-item {
  display: grid;
  gap: 2px;
}

.create-record-shell__history-summary-label {
  color: rgba(17, 17, 17, 0.48);
  font-family: var(--font-body);
  font-size: var(--ds-font-size-xs);
  line-height: 1.1;
}

.create-record-shell__history-summary-value {
  color: rgba(17, 17, 17, 0.78);
  font-family: var(--font-body);
  font-size: 0.78rem;
  line-height: 1.2;
}

.create-record-shell__selected-multi-box {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(17, 17, 17, 0.12);
  border-radius: 6px;
  background: rgba(249, 249, 247, 0.92);
}

.create-record-shell__selected-multi-chip {
  min-height: 20px;
  max-width: 100%;
  margin: 0;
  padding: 0 2px 0 6px;
  border: 1px solid rgba(17, 17, 17, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: rgba(17, 17, 17, 0.82);
}

.create-record-shell__selected-multi-chip :deep(.q-chip__content) {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.create-record-shell__selected-multi-chip :deep(.q-chip__icon--remove) {
  font-size: 12px;
}

.create-record-shell__selected-multi-empty {
  color: rgba(17, 17, 17, 0.48);
  font-family: var(--font-body);
  font-size: 0.74rem;
  line-height: 1.1;
}

.create-record-shell__input--verification-default :deep(.q-chip) {
  background: rgba(225, 239, 255, 0.96);
  color: rgba(24, 72, 144, 0.96);
  border: 1px solid rgba(64, 121, 210, 0.3);
}

.create-record-shell__input--verification-suggested :deep(.q-chip) {
  background: rgba(255, 246, 214, 0.98);
  color: rgba(106, 78, 5, 0.92);
  border: 1px solid rgba(186, 129, 13, 0.28);
}

.create-record-shell__input--verification-default :deep(.q-field__native),
.create-record-shell__input--verification-default :deep(.q-field__input) {
  color: rgba(24, 72, 144, 0.96);
  font-weight: 700;
  background-image: linear-gradient(
    transparent calc(100% - 0.2em),
    rgba(112, 171, 244, 0.36) calc(100% - 0.2em)
  );
}

.create-record-shell__input--verification-suggested :deep(.q-field__native),
.create-record-shell__input--verification-suggested :deep(.q-field__input) {
  color: rgba(106, 78, 5, 0.92);
  font-weight: 700;
  background-image: linear-gradient(
    transparent calc(100% - 0.2em),
    rgba(240, 205, 104, 0.42) calc(100% - 0.2em)
  );
}

.create-record-shell__field-action.create-record-shell__input--verification-default :deep(.q-field__control) {
  background: rgba(225, 239, 255, 0.96);
  border-color: rgba(64, 121, 210, 0.32);
}

.create-record-shell__field-action.create-record-shell__input--verification-suggested :deep(.q-field__control) {
  background: rgba(255, 246, 214, 0.98);
  border-color: rgba(186, 129, 13, 0.28);
}

.create-record-shell__verification-menu {
  min-width: 0;
  width: max-content;
}

.create-record-shell__verification-menu-item {
  min-height: 22px;
  padding: 0 6px;
}

.create-record-shell__verification-menu-item :deep(.q-item__section--avatar) {
  min-width: 16px;
  padding-right: 2px;
}

.create-record-shell__verification-menu-item :deep(.q-item__section--main) {
  padding-left: 0;
}

.create-record-shell__verification-menu-label {
  font-size: 8px;
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.create-record-shell__verification-icon--verified {
  color: rgba(35, 92, 26, 0.96) !important;
}

.create-record-shell__verification-icon--default {
  color: rgba(64, 121, 210, 0.92) !important;
}

.create-record-shell__verification-icon--suggested {
  color: rgba(186, 129, 13, 0.92) !important;
}

.create-record-shell__verification-icon--rejected {
  color: rgba(166, 43, 43, 0.92) !important;
}

.create-record-shell__input--summary {
  width: 100%;
  min-width: 0;
  max-width: none;
  flex: 1 1 auto;
}

.create-record-shell__input--hidden {
  display: none;
}

.create-record-shell__input--summary :deep(.q-field__control) {
  min-height: 132px;
  border-radius: 8px;
  align-items: flex-start;
}

.create-record-shell__input--summary :deep(textarea) {
  min-height: 108px !important;
  padding-top: 0 !important;
}

.create-record-shell__empty {
  color: rgba(17, 17, 17, 0.56);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: var(--font-weight-light);
}

.create-record-shell__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 28px 22px;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.create-record-shell__footer-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.create-record-shell__footer-status {
  display: inline-flex;
  align-items: center;
  padding: 1px 10px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.create-record-shell__footer-status--default {
  background: rgba(225, 239, 255, 0.96);
  color: rgba(24, 72, 144, 0.96);
  border: 1px solid rgba(64, 121, 210, 0.32);
}

.create-record-shell__footer-status--suggested {
  background: rgba(255, 246, 214, 0.98);
  color: rgba(106, 78, 5, 0.92);
  border: 1px solid rgba(186, 129, 13, 0.28);
}

.create-record-shell__footer-button {
  border-radius: 4px;
}

.create-record-shell__resize-handle {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 18px;
  height: 18px;
  padding: 0;
  background:
    linear-gradient(135deg, transparent 0 42%, rgba(17, 17, 17, 0.34) 42% 48%, transparent 48% 58%, rgba(17, 17, 17, 0.5) 58% 64%, transparent 64%);
  border: 0;
  cursor: nwse-resize;
  opacity: 0.8;
}

@media (max-width: 900px) {
  .create-record-shell {
    width: calc(100vw - 20px);
    height: calc(100vh - 20px);
    min-width: calc(100vw - 20px);
    min-height: calc(100vh - 20px);
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 18px;
  }

  .create-record-shell__header {
    flex-direction: column;
  }

  .create-record-shell__fields {
    grid-template-columns: 1fr;
  }

  .create-record-shell__fields-grid {
    gap: 20px;
  }

  .create-record-shell__intake-body {
    grid-template-columns: 1fr;
  }

  .create-record-shell__tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .create-record-shell__tabs-right {
    margin-left: 0;
  }

  .create-record-shell__field {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .create-record-shell__field-copy {
    padding-top: 0;
  }

  .create-record-shell__field--wide {
    grid-column: span 1;
  }
}
</style>
