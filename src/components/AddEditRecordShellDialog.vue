<template>
  <q-dialog v-model="open">
    <DialogShellFrame
      card-class="create-record-shell"
      header-class="create-record-shell__header"
      body-class="create-record-shell__body"
      footer-class="create-record-shell__footer"
      :card-style="dialogStyle"
    >
      <template #header>
        <div class="create-record-shell__header-copy">
          <DialogShellTitleRow :title="dialogTitle" class="create-record-shell__title-row">
            <template #actions>
            <q-btn
              v-if="canOpenIngestionShell"
              flat
              no-caps
              dense
              class="create-record-shell__header-link"
              label="Open Ingestion Shell"
              @click="openIngestionShell"
            />
            <ShellSelector
              v-if="showShellSelector && shellSelectorOptions.length"
              class="create-record-shell__shell-selector"
              :model-value="shellSelectorValue"
              :options="shellSelectorOptions"
              @update:model-value="emit('update:shellSelectorValue', $event)"
            />
            </template>
          </DialogShellTitleRow>
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
                <div class="create-record-shell__intake-column-title">Ingestion Companion</div>
                <div class="create-record-shell__intake-side">
                  <div class="create-record-shell__processing-panel">
                  <div class="create-record-shell__processing-panel-head">
                    <div class="create-record-shell__processing-panel-title">Resources</div>
                  </div>

                  <div class="create-record-shell__processing-sections">
                    <ProcessingBox
                      title="Ingestion"
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
        <div class="create-record-shell__record-data">
          <button
            type="button"
            class="create-record-shell__record-data-toggle"
            @click="recordDataCollapsed = !recordDataCollapsed"
          >
            <span class="create-record-shell__record-data-title">Record Data</span>
            <q-icon
              :name="recordDataCollapsed ? 'expand_more' : 'expand_less'"
              class="create-record-shell__record-data-toggle-icon"
            />
          </button>

          <template v-if="!recordDataCollapsed">
            <SectionTabs
              v-model="activeSectionKey"
              :left-tabs="leftPanelSections"
              :right-tabs="rightSections"
            />

            <div class="create-record-shell__panel ds-mini-scrollbar">
              <div class="create-record-shell__panel-head">
                <div class="create-record-shell__panel-meta">{{ activeFields.length }} fields</div>
              </div>

              <div
                v-if="activeSectionSubgroups.length"
                class="create-record-shell__subgroup-stack"
              >
                <section
                  v-for="subgroup in activeSectionSubgroups"
                  :key="subgroup.key"
                  class="create-record-shell__subgroup"
                >
                  <button
                    type="button"
                    class="create-record-shell__subgroup-toggle"
                    @click="toggleSubgroup(subgroup.key)"
                  >
                    <q-icon
                      :name="isSubgroupExpanded(subgroup.key) ? 'expand_more' : 'chevron_right'"
                      size="14px"
                      class="create-record-shell__subgroup-toggle-icon"
                    />
                    <span class="create-record-shell__subgroup-title">{{ subgroup.label }}</span>
                    <span class="create-record-shell__subgroup-meta">{{ subgroup.tokens.length }} fields</span>
                  </button>

                  <div
                    v-if="isSubgroupExpanded(subgroup.key)"
                    class="create-record-shell__fields"
                    :style="{ '--create-record-shell-label-width': activeFieldLabelWidth }"
                  >
                    <div class="create-record-shell__fields-grid create-record-shell__fields-grid--left">
                      <FieldMapRow
                        v-for="fieldEntry in subgroupLeftEntries(subgroup)"
                        :key="fieldEntry.token.key"
                        :label="fieldEntry.token.label"
                        :type-hint="formatFieldType(fieldEntry.token.tokenType)"
                        :wide="isWideField(fieldEntry.token)"
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
                        </template>
                        <template #input>
                          <q-select
                            v-if="fieldEntry.token.tokenType === 'select_multi'"
                            :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                            dense
                            outlined
                            use-chips
                            multiple
                            emit-value
                            map-options
                            :options="fieldEntry.token.inputOptions || []"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="[
                              { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                              fieldVerificationClass(fieldEntry.token),
                            ]"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />

                          <q-select
                            v-else-if="fieldEntry.token.tokenType === 'select_single'"
                            :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                            dense
                            outlined
                            use-chips
                            emit-value
                            map-options
                            :options="fieldEntry.token.inputOptions || []"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="fieldVerificationClass(fieldEntry.token)"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />

                          <q-input
                            v-else
                            :model-value="stringValue(formValues[fieldEntry.token.key])"
                            dense
                            outlined
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                            :autogrow="isSummaryField(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="[
                              { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                              fieldVerificationClass(fieldEntry.token),
                            ]"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />
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

                    <div class="create-record-shell__fields-grid create-record-shell__fields-grid--right">
                      <FieldMapRow
                        v-for="fieldEntry in subgroupRightEntries(subgroup)"
                        :key="fieldEntry.token.key"
                        :label="fieldEntry.token.label"
                        :type-hint="formatFieldType(fieldEntry.token.tokenType)"
                        :wide="isWideField(fieldEntry.token)"
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
                        </template>
                        <template #input>
                          <q-select
                            v-if="fieldEntry.token.tokenType === 'select_multi'"
                            :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                            dense
                            outlined
                            use-chips
                            multiple
                            emit-value
                            map-options
                            :options="fieldEntry.token.inputOptions || []"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="[
                              { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                              fieldVerificationClass(fieldEntry.token),
                            ]"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />

                          <q-select
                            v-else-if="fieldEntry.token.tokenType === 'select_single'"
                            :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                            dense
                            outlined
                            use-chips
                            emit-value
                            map-options
                            :options="fieldEntry.token.inputOptions || []"
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="fieldVerificationClass(fieldEntry.token)"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />

                          <q-input
                            v-else
                            :model-value="stringValue(formValues[fieldEntry.token.key])"
                            dense
                            outlined
                            :disable="loading || isFieldLocked(fieldEntry.token)"
                            :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                            :autogrow="isSummaryField(fieldEntry.token)"
                            class="create-record-shell__input"
                            :class="[
                              { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                              fieldVerificationClass(fieldEntry.token),
                            ]"
                            @update:model-value="updateField(fieldEntry.token.key, $event)"
                          />
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
                </section>
              </div>

              <div
                v-else-if="activeFields.length"
                class="create-record-shell__fields"
                :style="{ '--create-record-shell-label-width': activeFieldLabelWidth }"
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
                    </template>
                    <template #input>
                      <q-select
                        v-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        dense
                        outlined
                        use-chips
                        multiple
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        use-chips
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="stringValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                        :autogrow="isSummaryField(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />
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
                    </template>
                    <template #input>
                      <q-select
                        v-if="fieldEntry.token.tokenType === 'select_multi'"
                        :model-value="Array.isArray(formValues[fieldEntry.token.key]) ? formValues[fieldEntry.token.key] : []"
                        dense
                        outlined
                        use-chips
                        multiple
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-select
                        v-else-if="fieldEntry.token.tokenType === 'select_single'"
                        :model-value="selectSingleValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        use-chips
                        emit-value
                        map-options
                        :options="fieldEntry.token.inputOptions || []"
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="fieldVerificationClass(fieldEntry.token)"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />

                      <q-input
                        v-else
                        :model-value="stringValue(formValues[fieldEntry.token.key])"
                        dense
                        outlined
                        :disable="loading || isFieldLocked(fieldEntry.token)"
                        :type="isSummaryField(fieldEntry.token) ? 'textarea' : inputTypeForToken(fieldEntry.token.tokenType)"
                        :autogrow="isSummaryField(fieldEntry.token)"
                        class="create-record-shell__input"
                        :class="[
                          { 'create-record-shell__input--summary': isSummaryField(fieldEntry.token) },
                          fieldVerificationClass(fieldEntry.token),
                        ]"
                        @update:model-value="updateField(fieldEntry.token.key, $event)"
                      />
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
          </template>
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
import ProcessingBox from 'src/components/ProcessingBox.vue'
import SectionTabs from 'src/components/SectionTabs.vue'
import ShellSelector from 'src/components/ShellSelector.vue'
import FieldMapRow from 'src/components/FieldMapRow.vue'
import EntryInputListBox from 'src/components/EntryInputListBox.vue'
import { buildRecordViewLocation } from 'src/utils/recordViewNavigation'
import { setPendingIngestionShellRequest } from 'src/utils/ingestionShellState'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  sourceLabel: { type: String, default: 'Records' },
  singularLabel: { type: String, default: 'record' },
  keyFieldTokens: { type: Array, default: () => [] },
  leftSections: { type: Array, default: () => [] },
  rightSections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitDisabled: { type: Boolean, default: false },
  initialValues: { type: Object, default: () => ({}) },
  initialFieldMeta: { type: Object, default: () => ({}) },
  initialSectionKey: { type: String, default: 'key-fields' },
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

const emit = defineEmits(['update:modelValue', 'update:shellSelectorValue', 'submit', 'change', 'request-close'])
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const hasUserChanges = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) {
      emit('request-close', buildDialogSnapshot())
    }
    emit('update:modelValue', value)
  },
})

const activeSectionKey = ref('key-fields')
const formValues = ref({})
const artifactDragOver = ref(false)
const stagedArtifacts = ref([])
const selectedArtifactIds = ref([])
const startingArtifactIds = ref([])
const autoProcessArtifacts = ref(false)
const companionUrl = ref('')
const companionBlurb = ref('')
const urlEntries = ref([])
const blurbEntries = ref([])
const selectedUrlEntryIds = ref([])
const selectedBlurbEntryIds = ref([])
const expandedEntryIds = ref([])
const expandedSubgroupKeys = ref([])
const supportResourcesCollapsed = ref(false)
const recordDataCollapsed = ref(false)
const dialogWidth = ref(760)
const dialogHeight = ref(780)
const fieldVerificationStates = ref({})
let removeResizeListeners = null

const branchSelectionSettled = computed(() => {
  const tokenKey = String(props.branchSelectorTokenKey || '').trim()
  if (!tokenKey) return true
  return String(formValues.value?.[tokenKey] ?? '').trim().length > 0
})

const allSections = computed(() => [
  {
    key: 'key-fields',
    label: 'Key Fields',
    tokens: props.keyFieldTokens,
  },
  ...(branchSelectionSettled.value ? [...props.leftSections, ...props.rightSections] : []),
])

const leftPanelSections = computed(() => [
  {
    key: 'key-fields',
    label: 'Key Fields',
    tokens: props.keyFieldTokens,
  },
  ...(branchSelectionSettled.value ? props.leftSections : []),
])

const rightSections = computed(() => (branchSelectionSettled.value ? props.rightSections : []))

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
const canOpenIngestionShell = computed(() => stagedArtifacts.value.length > 0 || processingArtifacts.value.length > 0)
const activeFieldLabelWidth = computed(() => '10ch')

const activeSection = computed(
  () => allSections.value.find((section) => section.key === activeSectionKey.value) || allSections.value[0] || null,
)

const activeFields = computed(() => activeSection.value?.tokens || [])
const activeSectionSubgroups = computed(() => Array.isArray(activeSection.value?.subgroups) ? activeSection.value.subgroups : [])
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
      summaryEntries.push({ ...entry, column: 'right' })
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
function buildFieldEntries(tokens = []) {
  const nameEntries = []
  const summaryEntries = []
  const remainingEntries = []

  tokens.forEach((token, tokenIndex) => {
    const entry = { token, tokenIndex, column: 'left' }
    if (isNameField(token)) {
      nameEntries.push({ ...entry, column: 'left' })
      return
    }
    if (isSummaryField(token)) {
      summaryEntries.push({ ...entry, column: 'right' })
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
}
function subgroupLeftEntries(subgroup) {
  return buildFieldEntries(subgroup?.tokens || []).filter((entry) => entry.column === 'left')
}
function subgroupRightEntries(subgroup) {
  return buildFieldEntries(subgroup?.tokens || []).filter((entry) => entry.column === 'right')
}
const leftFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'left' && isNameField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'left' && !isNameField(entry.token))
  return [...pinned, ...remainder]
})
const rightFieldEntries = computed(() => {
  const pinned = activeFieldEntries.value.filter((entry) => entry.column === 'right' && isSummaryField(entry.token))
  const remainder = activeFieldEntries.value.filter((entry) => entry.column === 'right' && !isSummaryField(entry.token))
  return [...pinned, ...remainder]
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

function initializeDialogState() {
  hasUserChanges.value = false
  activeSectionKey.value = String(props.initialSectionKey || '').trim() || 'key-fields'
  artifactDragOver.value = false
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
  supportResourcesCollapsed.value = props.preferAddLayout ? false : Boolean(props.initialResourcesCollapsed)
  recordDataCollapsed.value = props.preferAddLayout ? true : Boolean(props.initialRecordDataCollapsed)
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
}

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!nextValue) return
    initializeDialogState()
  },
  { immediate: true },
)

watch(activeSectionSubgroups, (groups) => {
  const nextKeys = groups.map((group) => group.key)
  expandedSubgroupKeys.value = nextKeys.filter((key) => expandedSubgroupKeys.value.includes(key))
  if (!expandedSubgroupKeys.value.length && nextKeys.length) {
    expandedSubgroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

function updateField(tokenKey, value) {
  const token = allSections.value.flatMap((section) => section.tokens || []).find((entry) => entry.key === tokenKey) || null
  formValues.value = {
    ...formValues.value,
    [tokenKey]: value,
  }
  if (token && isReviewTrackedField(token)) {
    fieldVerificationStates.value = {
      ...fieldVerificationStates.value,
      [tokenKey]: 'verified',
    }
  }
  hasUserChanges.value = true
  emit('change', buildDialogSnapshot())
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
    values: { ...formValues.value },
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
function isSubgroupExpanded(groupKey) { return expandedSubgroupKeys.value.includes(groupKey) }
function toggleSubgroup(groupKey) {
  expandedSubgroupKeys.value = isSubgroupExpanded(groupKey)
    ? expandedSubgroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedSubgroupKeys.value, groupKey]
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
  fieldVerificationStates.value = {
    ...fieldVerificationStates.value,
    [token.key]: String(nextState || '').trim(),
  }
  hasUserChanges.value = true
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

function openIngestionShell() {
  setPendingIngestionShellRequest({
    initialArtifacts: stagedArtifacts.value,
    artifactContext: props.artifactContext,
  })
  router.push({
    name: 'ingestion-shell',
    query: {
      section: 'ingestion',
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
  if (!artifact || artifact.processedArtifactId || !bridge.value?.ingestion?.create) return

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
    const result = await bridge.value.ingestion.create({
      Processed_Artifact_Name: workingArtifact.name,
      Processed_Artifact_Summary: '',
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
    // Keep the shell usable even if the processed-artifact bridge is not ready.
  }
}

async function startArtifactProcessing(artifactId) {
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
      message: error?.message || `Could not start ingestion for ${artifact.name || 'this file'}.`,
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
    await bridge.value?.ingestion?.delete?.(processedArtifactId)
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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 246, 244, 0.98) 100%);
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
  gap: 10px;
  min-height: 0;
  padding: 18px 28px 28px;
}

.create-record-shell__record-data {
  display: grid;
  gap: 12px;
  min-height: 0;
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
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.create-record-shell__subgroup-stack {
  display: grid;
  gap: 14px;
}

.create-record-shell__subgroup {
  display: grid;
  gap: 8px;
}

.create-record-shell__subgroup-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  width: max-content;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.create-record-shell__subgroup-toggle-icon {
  color: #111111;
}

.create-record-shell__subgroup-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.create-record-shell__subgroup-meta {
  margin-left: 6px;
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.7rem;
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
  gap: 20px 14px;
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
  width: fit-content;
  min-width: 132px;
  max-width: 280px;
  background: transparent;
}

.create-record-shell__input :deep(.q-field__control) {
  min-height: calc(0.78rem + 0.5px);
  padding-top: 0;
  padding-bottom: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(17, 17, 17, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: calc(0.78rem + 0.5px);
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input),
.create-record-shell__input :deep(.q-field__marginal),
.create-record-shell__input :deep(.q-chip) {
  font-size: 0.78rem;
  line-height: 0.92;
}

.create-record-shell__input :deep(.q-field__native),
.create-record-shell__input :deep(.q-field__input) {
  padding-left: 2px;
  padding-right: 10px;
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
