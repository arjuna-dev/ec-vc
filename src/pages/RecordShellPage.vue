<template>
  <q-page class="record-shell-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Record Shell source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else class="record-shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <RecordHero
        ref="contactHeroRef"
        :style="structuredRecordHeroStyle"
        :title="heroName"
        :initials="heroInitials"
        :settings-groups="heroSettingsGroups"
        :field-cards="selectedHeroFieldCards"
        :summary-value="heroSummaryValue"
        :summary-status-icon="heroSummaryStatusIcon"
        :interactive="isRecordRoute"
        :feed-tab="activeRecordFeedTab"
        :feed-tabs="recordFeedTabOptions"
        :feed-groups="recordFeedGroupOptions"
        :feed-items="feedItems"
        feed-empty-message="No feed items yet for this record."
        @pointerenter="startContactHeroPointerTracking"
        @pointermove="onContactHeroPointerMove"
        @pointerleave="onContactHeroPointerLeave"
        @update:feed-tab="activeRecordFeedTab = $event"
        @toggle-settings-group="toggleHeroGroup"
        @toggle-settings-item="setTokenSelected"
        @open-feed-log="openFeedItemLog"
        @request-feed-add="handleRecordFeedAdd"
      >
        <template #portrait>
          <figure class="record-shell__portrait record-shell__portrait--initials-only">
            <div class="record-shell__portrait-placeholder" aria-hidden="true">
              <div
                class="record-shell__portrait-placeholder-initials"
                :style="{ backgroundColor: heroAvatarColor }"
              >
                {{ heroInitials }}
              </div>
            </div>
          </figure>
        </template>
      </RecordHero>

      <MiniToolbar
        v-if="miniToolbarItems.length"
        v-model="miniToolbarActiveKey"
        aria-label="Shell mini toolbar"
        :items="miniToolbarItems"
        :view-mode="miniToolbarViewMode"
        :view-options="miniToolbarViewOptions"
        :show-view-toggle="false"
      />

      <section class="record-shell__panel">
        <div class="record-shell__panel-head">
        <div class="record-shell__panel-title">{{ activeGovernanceTitle || activeViewGroup?.title || activeView?.label || 'View' }}</div>
          <div class="record-shell__panel-meta">
            {{ activeGovernanceToolbarKey ? 'Structure governance' : `${activeViewTokens.length} fields` }}
          </div>
        </div>

        <div v-if="activeGovernanceToolbarKey" class="record-shell__governance-surface">
          <StructureGovernancePanel
            :mode="activeGovernanceToolbarKey === 'governance:views' ? 'views' : 'tokens'"
            :view-rows="governanceViewRows"
            :token-groups="tokenGroupsByView"
            :token-columns="tokenGovernanceColumns"
            empty-views-label="No views declared for this record."
            empty-tokens-label="No tokens declared in this view."
            @update-token-cell="updateTokenCell"
          />
        </div>

        <div v-else-if="isSystemViewActive" class="record-shell__system-grid">
          <div class="record-shell__system-column">
            <div class="record-shell__field-grid">
              <div
                v-for="token in systemViewTokens"
                :key="token.key"
                class="record-shell__field-card"
              >
                <div class="record-shell__field-label-row">
                  <div class="record-shell__field-label">{{ token.label }}</div>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="tune"
                    class="record-shell__field-meta-button"
                    aria-label="Edit token metadata"
                    @click.stop="openTokenMetaEditor(token)"
                  >
                    <q-menu
                      :model-value="activeTokenMetaKey === token.key"
                      anchor="bottom right"
                      self="top right"
                      @update:model-value="(value) => { if (!value) closeTokenMetaEditor() }"
                    >
                      <div class="record-shell__token-meta-menu">
                        <div class="record-shell__token-meta-title">Token Meta</div>
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Token Type"
                          :options="TOKEN_TYPE_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'tokenType')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'tokenType', $event)"
                        />
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Option Source"
                          :options="OPTION_SOURCE_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'optionSource')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionSource', $event)"
                        />
                        <q-input
                          v-if="tokenMetaUsesOptionList(token)"
                          dense
                          outlined
                          label="Option List"
                          :model-value="getTokenMetaDraftValue(token, 'optionList')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionList', $event)"
                        />
                        <q-input
                          v-else
                          dense
                          outlined
                          label="Option Entity"
                          :model-value="getTokenMetaDraftValue(token, 'optionEntity')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionEntity', $event)"
                        />
                        <q-input
                          dense
                          outlined
                          label="Write Field"
                          :model-value="getTokenMetaDraftValue(token, 'dbWriteField')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'dbWriteField', $event)"
                        />
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Field Class"
                          :options="FIELD_CLASS_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'fieldClass')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'fieldClass', $event)"
                        />
                        <div class="record-shell__token-meta-actions">
                          <q-btn flat dense no-caps label="Reset" @click="resetTokenMeta(token)" />
                          <q-btn flat dense no-caps label="Save" @click="commitTokenMeta(token)" />
                        </div>
                      </div>
                    </q-menu>
                  </q-btn>
                </div>
                <div v-if="isRecordRoute" class="record-shell__field-value-row">
                  <div
                    v-if="isSystemReadOnlyInline(token)"
                    class="record-shell__field-static-box"
                  >
                    {{ getTokenDisplayValue(token) }}
                  </div>
                  <q-select
                    v-else-if="token.tokenType === 'select_multi'"
                    :model-value="inlineMultiValue(token)"
                    dense
                    outlined
                    use-chips
                    multiple
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                  />
                  <q-select
                    v-else-if="token.tokenType === 'select_single'"
                    :model-value="inlineSingleValue(token)"
                    dense
                    outlined
                    use-chips
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="commitInlineFieldValue(token, $event)"
                  />
                  <q-input
                    v-else
                    :model-value="inlineStringValue(token)"
                    dense
                    outlined
                    :disable="loading || !isInlineFieldEditable(token)"
                    :type="inlineInputType(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                    @keydown.enter.stop.prevent="commitInlineFieldValue(token)"
                  />
                  <q-btn
                    v-if="showInlineFieldVerificationAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                  >
                    <q-icon
                      :name="inlineFieldVerificationIcon(token)"
                      :class="inlineFieldVerificationIconClass(token)"
                      :style="inlineFieldVerificationIconStyle(token)"
                      size="14px"
                    />
                    <q-menu anchor="bottom right" self="top left">
                      <q-list dense class="record-shell__verification-menu">
                        <q-item
                          v-for="option in fieldVerificationActionOptions"
                          :key="option.value"
                          clickable
                          v-close-popup
                          class="record-shell__verification-menu-item"
                          @click="updateInlineFieldVerificationState(token, option.value)"
                        >
                          <q-item-section avatar>
                            <q-icon :name="option.icon" :style="{ color: option.color }" size="14px" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label class="record-shell__verification-menu-label">{{ option.label }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                  <q-btn
                    v-if="showInlineFieldCopyAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                    aria-label="Copy field value"
                    @click="copyInlineFieldValue(token)"
                  >
                    <q-icon name="content_copy" size="14px" />
                  </q-btn>
                </div>
                <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
              </div>
            </div>
          </div>

          <div class="record-shell__system-column record-shell__system-column--history">
            <div v-if="historySummaryItems.length" class="record-shell__history-summary-box">
              <div
                v-for="item in historySummaryItems"
                :key="item.key"
                class="record-shell__history-summary-item"
              >
                <div class="record-shell__history-summary-label">{{ item.label }}</div>
                <div class="record-shell__history-summary-value">{{ item.value }}</div>
              </div>
            </div>
            <RecordHistoryBox
              title="History"
              :items="isRecordRoute ? feedItems : []"
              :loading="loading"
              empty-label="No history yet for this record."
              @open-item="openFeedItemLog($event?.id)"
            />
          </div>
        </div>

        <div v-else-if="hasGroupedViewSubgroups" class="record-shell__section-group-stack">
          <section
            v-for="group in activeViewTokenGroups"
            :key="group.key"
            class="record-shell__section-group"
          >
            <button
              type="button"
              class="record-shell__section-group-toggle"
              @click="toggleViewSubgroup(group.key)"
            >
              <q-icon
                :name="isViewSubgroupExpanded(group.key) ? 'expand_more' : 'chevron_right'"
                size="14px"
                class="record-shell__section-group-toggle-icon"
              />
              <span class="record-shell__section-group-title">{{ group.title }}</span>
              <span class="record-shell__section-group-meta">{{ group.tokens.length }} fields</span>
            </button>
            <div v-if="isViewSubgroupExpanded(group.key)" class="record-shell__field-grid">
              <div v-for="token in group.tokens" :key="token.key" class="record-shell__field-card">
                <div class="record-shell__field-label-row">
                  <div class="record-shell__field-label">{{ token.label }}</div>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="tune"
                    class="record-shell__field-meta-button"
                    aria-label="Edit token metadata"
                    @click.stop="openTokenMetaEditor(token)"
                  >
                    <q-menu
                      :model-value="activeTokenMetaKey === token.key"
                      anchor="bottom right"
                      self="top right"
                      @update:model-value="(value) => { if (!value) closeTokenMetaEditor() }"
                    >
                      <div class="record-shell__token-meta-menu">
                        <div class="record-shell__token-meta-title">Token Meta</div>
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Token Type"
                          :options="TOKEN_TYPE_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'tokenType')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'tokenType', $event)"
                        />
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Option Source"
                          :options="OPTION_SOURCE_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'optionSource')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionSource', $event)"
                        />
                        <q-input
                          v-if="tokenMetaUsesOptionList(token)"
                          dense
                          outlined
                          label="Option List"
                          :model-value="getTokenMetaDraftValue(token, 'optionList')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionList', $event)"
                        />
                        <q-input
                          v-else
                          dense
                          outlined
                          label="Option Entity"
                          :model-value="getTokenMetaDraftValue(token, 'optionEntity')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'optionEntity', $event)"
                        />
                        <q-input
                          dense
                          outlined
                          label="Write Field"
                          :model-value="getTokenMetaDraftValue(token, 'dbWriteField')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'dbWriteField', $event)"
                        />
                        <q-select
                          dense
                          outlined
                          emit-value
                          map-options
                          label="Field Class"
                          :options="FIELD_CLASS_OPTIONS"
                          :model-value="getTokenMetaDraftValue(token, 'fieldClass')"
                          @update:model-value="updateTokenMetaDraftValue(token, 'fieldClass', $event)"
                        />
                        <div class="record-shell__token-meta-actions">
                          <q-btn flat dense no-caps label="Reset" @click="resetTokenMeta(token)" />
                          <q-btn flat dense no-caps label="Save" @click="commitTokenMeta(token)" />
                        </div>
                      </div>
                    </q-menu>
                  </q-btn>
                </div>
                <div v-if="isRecordRoute" class="record-shell__field-value-row">
                  <div
                    v-if="isSystemReadOnlyInline(token)"
                    class="record-shell__field-static-box"
                  >
                    {{ getTokenDisplayValue(token) }}
                  </div>
                  <q-select
                    v-else-if="token.tokenType === 'select_multi'"
                    :model-value="inlineMultiValue(token)"
                    dense
                    outlined
                    use-chips
                    multiple
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                  />
                  <q-select
                    v-else-if="token.tokenType === 'select_single'"
                    :model-value="inlineSingleValue(token)"
                    dense
                    outlined
                    use-chips
                    emit-value
                    map-options
                    :options="token.inputOptions || []"
                    :disable="loading || !isInlineFieldEditable(token)"
                    class="record-shell__field-input"
                    @update:model-value="commitInlineFieldValue(token, $event)"
                  />
                  <q-input
                    v-else
                    :model-value="inlineStringValue(token)"
                    dense
                    outlined
                    :disable="loading || !isInlineFieldEditable(token)"
                    :type="inlineInputType(token)"
                    class="record-shell__field-input"
                    @update:model-value="updateInlineFieldValue(token, $event)"
                    @blur="commitInlineFieldValue(token)"
                    @keydown.enter.stop.prevent="commitInlineFieldValue(token)"
                  />
                  <q-btn
                    v-if="showInlineFieldVerificationAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                  >
                    <q-icon
                      :name="inlineFieldVerificationIcon(token)"
                      :class="inlineFieldVerificationIconClass(token)"
                      :style="inlineFieldVerificationIconStyle(token)"
                      size="14px"
                    />
                    <q-menu anchor="bottom right" self="top left">
                      <q-list dense class="record-shell__verification-menu">
                        <q-item
                          v-for="option in fieldVerificationActionOptions"
                          :key="option.value"
                          clickable
                          v-close-popup
                          class="record-shell__verification-menu-item"
                          @click="updateInlineFieldVerificationState(token, option.value)"
                        >
                          <q-item-section avatar>
                            <q-icon :name="option.icon" :style="{ color: option.color }" size="14px" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label class="record-shell__verification-menu-label">{{ option.label }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                  <q-btn
                    v-if="showInlineFieldCopyAction(token)"
                    flat
                    dense
                    size="sm"
                    :disable="loading"
                    class="record-shell__field-action"
                    aria-label="Copy field value"
                    @click="copyInlineFieldValue(token)"
                  >
                    <q-icon name="content_copy" size="14px" />
                  </q-btn>
                </div>
                <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="record-shell__field-grid">
          <div
            v-for="token in activeViewTokens"
            :key="token.key"
            class="record-shell__field-card"
          >
            <div class="record-shell__field-label-row">
              <div class="record-shell__field-label">{{ token.label }}</div>
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="tune"
                class="record-shell__field-meta-button"
                aria-label="Edit token metadata"
                @click.stop="openTokenMetaEditor(token)"
              >
                <q-menu
                  :model-value="activeTokenMetaKey === token.key"
                  anchor="bottom right"
                  self="top right"
                  @update:model-value="(value) => { if (!value) closeTokenMetaEditor() }"
                >
                  <div class="record-shell__token-meta-menu">
                    <div class="record-shell__token-meta-title">Token Meta</div>
                    <q-select
                      dense
                      outlined
                      emit-value
                      map-options
                      label="Token Type"
                      :options="TOKEN_TYPE_OPTIONS"
                      :model-value="getTokenMetaDraftValue(token, 'tokenType')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'tokenType', $event)"
                    />
                    <q-select
                      dense
                      outlined
                      emit-value
                      map-options
                      label="Option Source"
                      :options="OPTION_SOURCE_OPTIONS"
                      :model-value="getTokenMetaDraftValue(token, 'optionSource')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'optionSource', $event)"
                    />
                    <q-input
                      v-if="tokenMetaUsesOptionList(token)"
                      dense
                      outlined
                      label="Option List"
                      :model-value="getTokenMetaDraftValue(token, 'optionList')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'optionList', $event)"
                    />
                    <q-input
                      v-else
                      dense
                      outlined
                      label="Option Entity"
                      :model-value="getTokenMetaDraftValue(token, 'optionEntity')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'optionEntity', $event)"
                    />
                    <q-input
                      dense
                      outlined
                      label="Write Field"
                      :model-value="getTokenMetaDraftValue(token, 'dbWriteField')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'dbWriteField', $event)"
                    />
                    <q-select
                      dense
                      outlined
                      emit-value
                      map-options
                      label="Field Class"
                      :options="FIELD_CLASS_OPTIONS"
                      :model-value="getTokenMetaDraftValue(token, 'fieldClass')"
                      @update:model-value="updateTokenMetaDraftValue(token, 'fieldClass', $event)"
                    />
                    <div class="record-shell__token-meta-actions">
                      <q-btn flat dense no-caps label="Reset" @click="resetTokenMeta(token)" />
                      <q-btn flat dense no-caps label="Save" @click="commitTokenMeta(token)" />
                    </div>
                  </div>
                </q-menu>
              </q-btn>
            </div>
            <div v-if="isRecordRoute" class="record-shell__field-value-row">
              <div
                v-if="isSystemReadOnlyInline(token)"
                class="record-shell__field-static-box"
              >
                {{ getTokenDisplayValue(token) }}
              </div>
              <q-select
                v-else-if="token.tokenType === 'select_multi'"
                :model-value="inlineMultiValue(token)"
                dense
                outlined
                use-chips
                multiple
                emit-value
                map-options
                :options="token.inputOptions || []"
                :disable="loading || !isInlineFieldEditable(token)"
                class="record-shell__field-input"
                @update:model-value="updateInlineFieldValue(token, $event)"
                @blur="commitInlineFieldValue(token)"
              />
              <q-select
                v-else-if="token.tokenType === 'select_single'"
                :model-value="inlineSingleValue(token)"
                dense
                outlined
                use-chips
                emit-value
                map-options
                :options="token.inputOptions || []"
                :disable="loading || !isInlineFieldEditable(token)"
                class="record-shell__field-input"
                @update:model-value="commitInlineFieldValue(token, $event)"
              />
              <q-input
                v-else
                :model-value="inlineStringValue(token)"
                dense
                outlined
                :disable="loading || !isInlineFieldEditable(token)"
                :type="inlineInputType(token)"
                class="record-shell__field-input"
                @update:model-value="updateInlineFieldValue(token, $event)"
                @blur="commitInlineFieldValue(token)"
                @keydown.enter.stop.prevent="commitInlineFieldValue(token)"
              />
              <q-btn
                v-if="showInlineFieldVerificationAction(token)"
                flat
                dense
                size="sm"
                :disable="loading"
                class="record-shell__field-action"
              >
                <q-icon
                  :name="inlineFieldVerificationIcon(token)"
                  :class="inlineFieldVerificationIconClass(token)"
                  :style="inlineFieldVerificationIconStyle(token)"
                  size="14px"
                />
                <q-menu anchor="bottom right" self="top left">
                  <q-list dense class="record-shell__verification-menu">
                    <q-item
                      v-for="option in fieldVerificationActionOptions"
                      :key="option.value"
                      clickable
                      v-close-popup
                      class="record-shell__verification-menu-item"
                      @click="updateInlineFieldVerificationState(token, option.value)"
                    >
                      <q-item-section avatar>
                        <q-icon :name="option.icon" :style="{ color: option.color }" size="14px" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="record-shell__verification-menu-label">{{ option.label }}</q-item-label>
                      </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
              </q-btn>
              <q-btn
                v-if="showInlineFieldCopyAction(token)"
                flat
                dense
                size="sm"
                :disable="loading"
                class="record-shell__field-action"
                aria-label="Copy field value"
                @click="copyInlineFieldValue(token)"
              >
                <q-icon name="content_copy" size="14px" />
              </q-btn>
            </div>
            <div v-else class="record-shell__field-value">{{ getTokenDisplayValue(token) }}</div>
          </div>
        </div>
      </section>

      <AddEditRecordShellDialog
        :key="createDialogRenderKey"
        v-model="createDialogOpen"
        :mode="createDialogMode"
        :source-label="activeRegistryEntry?.label || 'Records'"
        :singular-label="activeRegistryEntry?.singularLabel || 'record'"
        :primary-tokens="createKeyFieldTokens"
        :left-sections="createDialogLeftViews"
        :right-sections="createDialogRightViews"
        :loading="createDialogLoading"
        :submit-disabled="createDialogLoading"
        :initial-values="dialogInitialValues"
        :initial-field-meta="dialogInitialFieldMeta"
        initial-section-key="general"
        :initial-artifacts="[]"
        :artifact-context="null"
        :initial-resources-collapsed="createDialogMode === 'edit'"
        :initial-record-data-collapsed="false"
        @change="handleDialogChange"
        @request-close="handleDialogClose"
        @submit="submitCreateRecord"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import AddEditRecordShellDialog from 'src/components/AddEditRecordShellDialog.vue'
import MiniToolbar from 'src/components/MiniToolbar.vue'
import RecordHistoryBox from 'src/components/RecordHistoryBox.vue'
import RecordHero from 'src/components/RecordHero.vue'
import StructureGovernancePanel from 'src/components/StructureGovernancePanel.vue'
import { setPendingAddEditShellRequest } from 'src/utils/addEditShellState'
import {
  CANONICAL_OPTION_LISTS,
  getCanonicalTokenFieldNames,
  getCanonicalTokenValue,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getRegistrySummaryTokenForSource,
  getRegistryTitleTokenForSource,
  getRuntimeStructureVersion,
  subscribeRuntimeFileStructures,
  getRuntimeTableNameForEntityName,
  buildFileShellPayload,
  FILE_SOURCE_REGISTRY,
  resolveApprovedFileSectionKey,
} from 'src/utils/structureRegistry'
import { buildDialogViews, groupDialogViews, splitDialogViews } from 'src/utils/dialogShellPayload'
import { filterRecordFeedTabs, RECORD_FEED_GROUP_OPTIONS } from 'src/utils/recordFeedContract'
import { setPendingIntakeShellRequest } from 'src/utils/intakeShellState'
import { loadShellFieldSelectionMap, persistShellFieldSelectionMap } from 'src/utils/shellFieldSelection'
import { buildStructureToolbarItems } from 'src/utils/structureToolbarContract'
import { buildTokenUpdateChanges, tokenSupportsRecordUpdate } from 'src/utils/tokenWriteChanges'
import { getTokenMetadataOverride, loadTokenMetadataOverrides, mergeTokenMetadata, persistTokenMetadataOverrides } from 'src/utils/tokenMetadataOverrides'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const CONTACT_LDB_VIEW_OPTIONS = [
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const liveOptionRowsBySource = ref({})
const expandedViewKeys = ref([])
const expandedHeroGroupKeys = ref([])
const expandedViewSubgroupKeys = ref([])
const activeViewGroupKey = ref('')
const contactHeroRef = ref(null)
const contactHeroGradient = ref({ x: 50, y: 30, size: 60, opacity: 0 })
const runtimeStructureVersion = ref(getRuntimeStructureVersion())
let runtimeStructureUnsub = null
const activeRecordFeedTab = ref('events')
const recordShellTopNavViewMode = ref('grid')
const miniToolbarItems = computed(() => recordShellNavItems.value)
const miniToolbarActiveKey = computed({
  get: () => activeViewGroupKey.value,
  set: (value) => {
    activeViewGroupKey.value = value
  },
})
const miniToolbarViewMode = computed({
  get: () => recordShellTopNavViewMode.value,
  set: (value) => {
    recordShellTopNavViewMode.value = value
  },
})
const miniToolbarViewOptions = computed(() => CONTACT_LDB_VIEW_OPTIONS)
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const hasBridge = computed(() => Boolean(bridge.value))
const loading = ref(false)
const inlineFieldSavingKeys = ref([])
const error = ref('')
const currentView = ref(null)
const fields = ref([])
const auditEvents = ref([])
const fieldVerificationStates = ref({})
const inlineFieldValues = ref({})
const heroFieldKeysBySource = ref(loadShellFieldSelectionMap())
const tokenMetaOverridesBySource = ref(loadTokenMetadataOverrides())
const activeTokenMetaKey = ref('')
const tokenMetaDrafts = ref({})
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const isRecordRoute = computed(() => Boolean(tableNameParam.value && recordIdParam.value))
const activeSourceKey = computed(() => {
  if (isRecordRoute.value) {
    return resolveSourceKeyFromTableName(currentView.value?.table_name || tableNameParam.value) || ''
  }
  return resolveApprovedFileSectionKey(route.query.section) || ''
})
const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))
const activeRegistryEntry = computed(() => getFilePageRegistryEntry(activeSourceKey.value) || null)
const fileShellPayload = computed(() => {
  runtimeStructureVersion.value
  return buildFileShellPayload(activeSourceKey.value)
})
const fileViews = computed(() => fileShellPayload.value.sections)
const rawFileTokens = computed(() => fileShellPayload.value.tokens)
const fileTokens = computed(() => rawFileTokens.value.map((token) => {
  const override = getTokenMetadataOverride(tokenMetaOverridesBySource.value, activeSourceKey.value, token?.key)
  return mergeTokenMetadata(token, override)
}))
const governanceViewRows = computed(() =>
  fileViews.value.map((view) => {
    const normalized = String(view.label || '').trim().toLowerCase()
    return {
      key: view.key,
      label: view.label,
      side: normalized === 'system' || isRelationshipViewLabel(normalized) ? 'Right' : 'Left',
      tokenCount: fileTokens.value.filter((token) => token.parentKey === view.key).length,
      subgroupCount: Array.isArray(view.subgroups) ? view.subgroups.length : 0,
    }
  }),
)
const tokenGroupsByView = computed(() =>
  governanceViewRows.value.map((view) => ({
    key: view.key,
    label: view.label,
    tokens: fileTokens.value
      .filter((token) => token.parentKey === view.key)
      .map((token) => ({
        key: token.key,
        label: token.label || '—',
        type: token.tokenType || '—',
        optionSource: token.optionSource || '—',
        optionEntity: token.optionEntity || '—',
        optionList: token.optionList || '—',
        dbWriteField: token.dbWriteField || token.dbFieldAliases?.[0] || '—',
        fieldClass: token.fieldClass || token.field_class || '—',
        required: token.required ? 'Yes' : '—',
        writeTarget: token.dbWriteField || token.dbFieldAliases?.join(', ') || '—',
        editable: token.editable === false ? 'No' : token.editable === true ? 'Yes' : '—',
      })),
  })),
)
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [String(field?.field_name || '').trim(), field])),
)
const runtimeTableName = computed(() =>
  String(getRuntimeTableNameForEntityName(activeRegistryEntry.value?.entityName || tableNameParam.value) || tableNameParam.value || '').trim(),
)

const canonicalNameToken = computed(() => getRegistryTitleTokenForSource(activeSourceKey.value) || null)
const canonicalSummaryToken = computed(() => getRegistrySummaryTokenForSource(activeSourceKey.value) || null)

const selectableTokens = computed(() =>
  fileTokens.value.filter((token) => {
    const label = String(token.label || '').trim().toLowerCase()
    return label !== 'name' && label !== 'summary'
  }),
)
const viewDisplayTokens = computed(() => fileTokens.value.map((token) => normalizeCreateDialogToken(token)))
const normalizedSelectableTokens = computed(() => selectableTokens.value.map((token) => normalizeCreateDialogToken(token)))

const selectedTokenKeys = computed({
  get() {
    const values = Array.isArray(heroFieldKeysBySource.value[activeSourceKey.value]) ? heroFieldKeysBySource.value[activeSourceKey.value] : []
    const allowed = new Set(normalizedSelectableTokens.value.map((token) => token.key))
    return values.map((value) => String(value || '').trim()).filter((value) => value && allowed.has(value))
  },
  set(value) {
    const normalized = Array.from(new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean)))
    heroFieldKeysBySource.value = {
      ...heroFieldKeysBySource.value,
      [activeSourceKey.value]: normalized,
    }
  },
})

const selectedTokenKeySet = computed(() => new Set(selectedTokenKeys.value))

const TOKEN_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Long Text', value: 'long_text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Select Single', value: 'select_single' },
  { label: 'Select Multi', value: 'select_multi' },
]
const OPTION_SOURCE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Canonical List', value: 'canonical_list' },
  { label: 'Live Entity', value: 'live_entity' },
  { label: 'Live Entity Set', value: 'live_entity_set' },
  { label: 'Shared File Universe', value: 'shared_file_universe' },
]
const FIELD_CLASS_OPTIONS = [
  { label: 'Owned Field', value: 'owned_field' },
  { label: 'Directional Link', value: 'directional_link' },
  { label: 'LDB Relationship', value: 'ldb_relationship' },
]
const OPTION_ENTITY_OPTIONS = Object.freeze(
  FILE_SOURCE_REGISTRY
    .map((entry) => {
      const label = String(entry?.label || '').trim()
      return label ? { label, value: label } : null
    })
    .filter(Boolean),
)
const tokenGovernanceColumns = computed(() => [
  { key: 'label', label: 'Label', width: 180, cellClass: 'record-shell__cell--label', editable: true, kind: 'text' },
  { key: 'type', label: 'Type', width: 112, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'select', options: TOKEN_TYPE_OPTIONS },
  { key: 'optionSource', label: 'Option Source', width: 150, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'select', options: OPTION_SOURCE_OPTIONS },
  { key: 'optionEntity', label: 'Option Entity', width: 160, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'select', options: OPTION_ENTITY_OPTIONS },
  { key: 'optionList', label: 'Option List', width: 140, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'text' },
  { key: 'dbWriteField', label: 'DB Write Field', width: 180, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'text' },
  { key: 'fieldClass', label: 'Field Class', width: 140, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'select', options: FIELD_CLASS_OPTIONS },
  { key: 'required', label: 'Required', width: 84, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', kind: 'checkbox' },
  { key: 'writeTarget', label: 'Write Target / Alias', width: 220, headerClass: 'record-shell__cell--meta', cellClass: 'record-shell__cell--meta', editable: true, kind: 'text' },
])

watch(
  tokenMetaOverridesBySource,
  (value) => {
    persistTokenMetadataOverrides(value)
  },
  { deep: true },
)

function buildTokenMetaDraft(token) {
  return {
    tokenType: String(token?.tokenType || '').trim(),
    optionSource: String(token?.optionSource || '').trim(),
    optionEntity: String(token?.optionEntity || '').trim(),
    optionList: String(token?.optionList || '').trim(),
    dbWriteField: String(token?.dbWriteField || '').trim(),
    fieldClass: String(token?.fieldClass || '').trim(),
  }
}

function openTokenMetaEditor(token) {
  const key = String(token?.key || '').trim()
  if (!key) return
  if (!tokenMetaDrafts.value[key]) {
    tokenMetaDrafts.value = {
      ...tokenMetaDrafts.value,
      [key]: buildTokenMetaDraft(token),
    }
  }
  activeTokenMetaKey.value = key
}

function closeTokenMetaEditor() {
  activeTokenMetaKey.value = ''
}

function getTokenMetaDraftValue(token, field) {
  const key = String(token?.key || '').trim()
  if (!key) return ''
  const draft = tokenMetaDrafts.value[key]
  if (!draft) return ''
  return draft?.[field] ?? ''
}

function updateTokenMetaDraftValue(token, field, value) {
  const key = String(token?.key || '').trim()
  if (!key) return
  const current = tokenMetaDrafts.value[key] || buildTokenMetaDraft(token)
  tokenMetaDrafts.value = {
    ...tokenMetaDrafts.value,
    [key]: {
      ...current,
      [field]: value,
    },
  }
}

function commitTokenMeta(token) {
  const key = String(token?.key || '').trim()
  const sourceKey = String(activeSourceKey.value || '').trim()
  if (!key || !sourceKey) return
  const draft = tokenMetaDrafts.value[key] || {}
  const nextOverride = {}
  ;['tokenType', 'optionSource', 'optionEntity', 'optionList', 'dbWriteField', 'fieldClass'].forEach((field) => {
    const value = String(draft?.[field] ?? '').trim()
    if (value) nextOverride[field] = value
  })
  const currentBySource = tokenMetaOverridesBySource.value[sourceKey] || {}
  const nextBySource = { ...currentBySource }
  if (Object.keys(nextOverride).length) {
    nextBySource[key] = nextOverride
  } else {
    delete nextBySource[key]
  }
  tokenMetaOverridesBySource.value = {
    ...tokenMetaOverridesBySource.value,
    [sourceKey]: nextBySource,
  }
  closeTokenMetaEditor()
}

function updateTokenCell(tokenKey, field, value) {
  const sourceKey = String(activeSourceKey.value || '').trim()
  const normalizedKey = String(tokenKey || '').trim()
  if (!sourceKey || !normalizedKey) return
  const mappedField = field === 'type' ? 'tokenType' : field === 'writeTarget' ? 'dbWriteField' : field
  if (!mappedField) return
  const currentBySource = tokenMetaOverridesBySource.value[sourceKey] || {}
  const currentToken = currentBySource[normalizedKey] || {}
  const nextValue = String(value ?? '').trim()
  const nextToken = { ...currentToken }
  if (nextValue) nextToken[mappedField] = nextValue
  else delete nextToken[mappedField]

  const nextBySource = { ...currentBySource }
  if (Object.keys(nextToken).length) nextBySource[normalizedKey] = nextToken
  else delete nextBySource[normalizedKey]

  tokenMetaOverridesBySource.value = {
    ...tokenMetaOverridesBySource.value,
    [sourceKey]: nextBySource,
  }
}

function resetTokenMeta(token) {
  const key = String(token?.key || '').trim()
  const sourceKey = String(activeSourceKey.value || '').trim()
  if (!key || !sourceKey) return
  const currentBySource = tokenMetaOverridesBySource.value[sourceKey] || {}
  if (!currentBySource[key]) return
  const nextBySource = { ...currentBySource }
  delete nextBySource[key]
  tokenMetaOverridesBySource.value = {
    ...tokenMetaOverridesBySource.value,
    [sourceKey]: nextBySource,
  }
  closeTokenMetaEditor()
}

function tokenMetaUsesOptionList(token) {
  const overrideSource = String(getTokenMetaDraftValue(token, 'optionSource') || '').trim()
  const source = overrideSource || String(token?.optionSource || '').trim()
  return source === 'canonical_list'
}
function isRelationshipViewLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
}
const heroSourceGroups = computed(() =>
  groupedViews.value.filter((group) =>
    Array.isArray(group.views) &&
    group.views.some((view) => {
      const label = String(view.label || '').trim().toLowerCase()
      return label !== 'general' && label !== 'system' && !isRelationshipViewLabel(label)
    }),
  ),
)
const heroSelectableTokens = computed(() => {
  const allowedSectionKeys = new Set(
    heroSourceGroups.value.flatMap((group) => (Array.isArray(group.views) ? group.views : []).map((view) => view.key)),
  )
  return normalizedSelectableTokens.value.filter((token) => allowedSectionKeys.has(token.parentKey))
})
const selectedHeroTokens = computed(() =>
  heroSelectableTokens.value.filter((token) => selectedTokenKeySet.value.has(token.key)),
)
const createKeyFieldTokens = computed(() => [canonicalNameToken.value, canonicalSummaryToken.value].filter(Boolean).map(normalizeCreateDialogToken))
const groupedViews = computed(() =>
  groupDialogViews(fileViews.value).map((group) => {
    if (Array.isArray(group.views) && group.views.length === 1) {
      const viewLabel = String(group.views[0]?.label || '').trim()
      const normalized = viewLabel.toLowerCase()
      if (normalized === 'system' || normalized === 'ldb') {
        return { ...group, title: viewLabel }
      }
    }
    return group
  }),
)
const sharedLdbLinksByTargetEntity = ref({})
const sharedLdbViewTokens = computed(() => {
  if (!activeRegistryEntry.value?.entityName) return []

  const systemFileTitleToken = getRegistryTitleTokenForSource('file-system')
  const seenSourceKeys = new Set()
  const rows = Array.isArray(liveOptionRowsBySource.value['file-system']) ? liveOptionRowsBySource.value['file-system'] : []

  return rows
    .map((row, index) => {
      const sourceKey = resolveApprovedFileSectionKey(
        row?.File_Source_Key || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
      )
      if (!sourceKey || sourceKey === 'bb-file' || seenSourceKeys.has(sourceKey)) return null

      const targetEntry = getFilePageRegistryEntry(sourceKey)
      if (!targetEntry?.entityName) return null

      seenSourceKeys.add(sourceKey)
      return normalizeCreateDialogToken({
        key: `__shared_ldb__:${sourceKey}`,
        tokenName: `__shared_ldb__:${sourceKey}`,
        label:
          String(systemFileTitleToken ? getCanonicalTokenValue(row, systemFileTitleToken) : '').trim()
          || targetEntry.label
          || `File ${index + 1}`,
        tokenType: 'select_multi',
        inputOptions: buildLiveEntityOptions(sourceKey),
        parentKey: activeViewEntries.value[0]?.key || '',
        parentLabel: activeViewEntries.value[0]?.label || 'LDB',
        isSharedLdbToken: true,
        targetSourceKey: sourceKey,
        targetEntity: String(targetEntry.entityName || '').trim(),
      })
    })
    .filter(Boolean)
})
const createViewGroups = computed(() =>
  buildDialogViews({
    groupedViews: groupedViews.value,
    tokenFilter: (view) => (
      isRelationshipViewLabel(view?.label)
        ? sharedLdbViewTokens.value
        : normalizedSelectableTokens.value.filter(
            (token) => token.parentKey === view.key && (isRecordRoute.value || selectedTokenKeySet.value.has(token.key)),
          )
    ),
    mapToken: normalizeCreateDialogToken,
    keepEmptySections: true,
  }),
)
const createDialogViewSplit = computed(() => splitDialogViews(createViewGroups.value))
const createDialogLeftViews = computed(() => createDialogViewSplit.value.leftSections)
const createDialogRightViews = computed(() => createDialogViewSplit.value.rightSections)
const activeGovernanceToolbarKey = computed(() => {
  const current = String(activeViewGroupKey.value || '').trim().toLowerCase()
  return current.startsWith('governance:') ? current : ''
})
const activeViewGroup = computed(() => {
  if (activeGovernanceToolbarKey.value) return null
  return groupedViews.value.find((group) => group.value === activeViewGroupKey.value) || groupedViews.value[0] || null
})
const activeView = computed(() => activeViewGroup.value?.views?.[0] || null)
const activeViewEntries = computed(() => activeViewGroup.value?.views || [])
const activeViewTokens = computed(() => {
  if (isLdbViewActive.value) return sharedLdbViewTokens.value
  return viewDisplayTokens.value.filter((token) => activeViewEntries.value.some((view) => view.key === token.parentKey))
})
const isLdbViewActive = computed(() =>
  activeViewEntries.value.some((view) => isRelationshipViewLabel(view.label)),
)
const isSystemViewActive = computed(() => activeViewEntries.value.some((view) => String(view.label || '').trim().toLowerCase() === 'system'))
const systemViewTokens = computed(() => activeViewTokens.value.filter((token) => !isHistoryDerivedSystemToken(token)))
const hasGroupedViewSubgroups = computed(() => !isLdbViewActive.value && activeViewEntries.value.length > 1)
const activeViewTokenGroups = computed(() =>
  activeViewEntries.value
    .map((view) => ({
      key: view.key,
      title: view.label,
      tokens: viewDisplayTokens.value.filter((token) => token.parentKey === view.key),
    }))
    .filter((group) => group.tokens.length),
)
const toolbarLeftViews = computed(() =>
  groupedViews.value.filter(
    (group) => !group.views.some((view) => isRelationshipViewLabel(view.label) || String(view.label || '').trim().toLowerCase() === 'system'),
  ),
)
const toolbarRightViews = computed(() =>
  groupedViews.value.filter(
    (group) => group.views.some((view) => isRelationshipViewLabel(view.label) || String(view.label || '').trim().toLowerCase() === 'system'),
  ),
)

const heroInitials = computed(() => {
  const label = String(activeRegistryEntry.value?.singularLabel || '').trim()
  return label ? label.slice(0, 2).toUpperCase() : '??'
})
const structuredRecordHeroStyle = computed(() => {
  return {
    '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
    '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
    '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
    '--contact-hero-blob-opacity': String(contactHeroGradient.value.opacity),
    '--contact-hero-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--contact-hero-blob-soft': 'rgba(38, 71, 255, 0.14)',
    '--contact-hero-blob-fade': 'rgba(38, 71, 255, 0.06)',
  }
})
const heroAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(heroName.value)) % palette.length]
})
const heroName = computed(() => {
  if (!canonicalNameToken.value) return 'Missing canonical Name token'
  const value = getTokenDisplayValue(canonicalNameToken.value)
  return value || 'Missing Name value'
})
const heroSummaryValue = computed(() => {
  if (!canonicalSummaryToken.value) return 'Missing canonical Summary token'
  const value = getTokenDisplayValue(canonicalSummaryToken.value)
  return value || 'Summary not set'
})
const heroSummaryStatusIcon = computed(() => (tokenHasStoredValue(canonicalSummaryToken.value) ? 'task_alt' : ''))
const recordFeedArtifactContext = computed(() => {
  if (!isRecordRoute.value) return null
  const entityName = String(activeRegistryEntry.value?.entityName || tableNameParam.value || '').trim()
  const entityLabel = String(activeRegistryEntry.value?.label || activeRegistryEntry.value?.singularLabel || '').trim() || 'Missing record type'
  const recordId = String(recordIdParam.value || '').trim()
  const recordLabel = String(heroName.value || '').trim() || recordId
  if (!entityName || !recordId) return null
  return {
    entityName,
    entityLabel,
    recordId,
    recordLabel,
  }
})
const selectedHeroFieldCards = computed(() =>
  selectedHeroTokens.value.map((token) => {
    const viewLabel = fileViews.value.find((view) => view.key === token.parentKey)?.label || 'Unmapped view'
    return {
      key: token.key,
      label: token.label,
      description: viewLabel,
      value: getTokenDisplayValue(token),
      statusIcon: tokenHasStoredValue(token) ? 'task_alt' : '',
    }
  }),
)
const recordFeedGroupOptions = computed(() => RECORD_FEED_GROUP_OPTIONS)
const feedItems = computed(() => {
  if (isRecordRoute.value) return auditEvents.value
  return [
    {
      id: 'feed-template-1',
      feedKey: 'events',
      groupKey: 'lifecycle',
      sourceLabel: 'Record Shell',
      meta: 'Now',
      title: 'Template feed lane',
      content: 'This right-side black box is the dedicated feed surface for the selected L1 record skeleton.',
      hasLogPage: false,
    },
    {
      id: 'feed-template-2',
      feedKey: 'events',
      groupKey: 'actions',
      sourceLabel: 'Payload',
      meta: 'Live',
      title: 'L1-driven structure',
      content: 'Changing the L1 at the top swaps the canonical record skeleton underneath this template.',
      hasLogPage: false,
    },
  ]
})
const recordFeedTabOptions = computed(() => filterRecordFeedTabs(feedItems.value))
const historySummaryItems = computed(() => {
  const lifecycleItems = auditEvents.value.filter((item) => String(item?.groupKey || '').trim() === 'lifecycle')
  const createdEvent = [...lifecycleItems]
    .reverse()
    .find((item) => String(item?.title || '').trim().toLowerCase().includes('created'))
  if (!createdEvent) return []

  return [
    {
      key: 'creator',
      label: 'Creator',
      value: String(createdEvent.sourceLabel || '').trim(),
    },
    {
      key: 'datetime',
      label: 'Datetime',
      value: String(createdEvent.meta || '').trim(),
    },
  ].filter((item) => item.value)
})
const activeGovernanceTitle = computed(() => {
  if (activeGovernanceToolbarKey.value === 'governance:tokens') return 'Tokens'
  if (activeGovernanceToolbarKey.value === 'governance:views') return 'Views'
  return ''
})
const recordShellNavItems = computed(() =>
  buildStructureToolbarItems({
    leftItems: toolbarLeftViews.value,
    rightItems: toolbarRightViews.value,
    governanceItems: [
      { value: 'governance:tokens', title: 'Tokens' },
      { value: 'governance:views', title: 'Views' },
    ],
    isRelationshipViewLabel,
  }),
)
const createDialogMode = computed(() => (isRecordRoute.value ? 'edit' : 'create'))
const fieldVerificationActionOptions = [
  { label: 'Verify field', value: 'verified', icon: 'check_circle', color: 'rgba(35, 92, 26, 0.96)' },
  { label: 'Pre-Selected', value: 'default_preselected_unverified', icon: 'auto_awesome', color: 'rgba(64, 121, 210, 0.92)' },
  { label: 'Suggested', value: 'suggested_unverified', icon: 'lightbulb', color: 'rgba(186, 129, 13, 0.92)' },
  { label: 'Reject field', value: 'rejected', icon: 'cancel', color: 'rgba(166, 43, 43, 0.92)' },
]
const dialogInitialValues = computed(() => {
  const tokens = [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    tokens.map((token) => [token.key, getTokenDialogValue(token)]),
  )
})
const dialogInitialFieldMeta = computed(() => ({}))
const heroSettingsGroups = computed(() => heroSourceGroups.value.map((group) => ({
  key: group.value,
  label: group.title,
  expanded: isHeroGroupExpanded(group.value),
  items: (Array.isArray(group.views) ? group.views : [])
    .flatMap((section) => getViewTokens(section.key))
    .map((token) => ({
      key: token.key,
      label: token.label,
      checked: isSelectedToken(token.key),
    })),
})).filter((group) => group.items.length))

watch(fileViews, (sections) => {
  if (!sections.length) {
    activeViewGroupKey.value = ''
    expandedViewKeys.value = []
    expandedViewSubgroupKeys.value = []
    return
  }
  const groups = groupedViews.value
  if (!groups.some((group) => group.value === activeViewGroupKey.value)) activeViewGroupKey.value = groups[0]?.value || ''
  expandedViewKeys.value = sections.map((section) => section.key)
}, { immediate: true })

watch(heroSourceGroups, (groups) => {
  const nextKeys = groups.map((group) => group.value)
  expandedHeroGroupKeys.value = nextKeys.filter((key) => expandedHeroGroupKeys.value.includes(key))
  if (!expandedHeroGroupKeys.value.length && nextKeys.length) {
    expandedHeroGroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

watch(activeViewTokenGroups, (groups) => {
  const nextKeys = groups.map((group) => group.key)
  expandedViewSubgroupKeys.value = nextKeys.filter((key) => expandedViewSubgroupKeys.value.includes(key))
  if (!expandedViewSubgroupKeys.value.length && nextKeys.length) {
    expandedViewSubgroupKeys.value = [...nextKeys]
  }
}, { immediate: true })

watch(activeSourceKey, async () => { await ensureLiveOptionsLoaded() }, { immediate: true })
watch(
  [activeSourceKey, heroSelectableTokens],
  () => {
    const sourceKey = activeSourceKey.value
    const allowedKeys = new Set(heroSelectableTokens.value.map((token) => token.key))
    const existing = Array.isArray(heroFieldKeysBySource.value[sourceKey]) ? heroFieldKeysBySource.value[sourceKey] : []
    const normalized = existing.filter((key) => allowedKeys.has(key))

    if (normalized.length) {
      if (normalized.length !== existing.length) {
        heroFieldKeysBySource.value = {
          ...heroFieldKeysBySource.value,
          [sourceKey]: normalized,
        }
      }
      return
    }

    if (existing.length || heroFieldKeysBySource.value[sourceKey]) {
      heroFieldKeysBySource.value = {
        ...heroFieldKeysBySource.value,
        [sourceKey]: normalized,
      }
    }
  },
  { immediate: true },
)
watch(
  heroFieldKeysBySource,
  (value) => {
    persistShellFieldSelectionMap(value)
  },
  { deep: true },
)
watch(
  () => `${tableNameParam.value}:${recordIdParam.value}`,
  () => {
    loadRecordView()
  },
  { immediate: true },
)

watch(
  [recordIdParam, activeRegistryEntry, sharedLdbViewTokens, bridge],
  async ([recordId]) => {
    const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
    const normalizedRecordId = String(recordId || '').trim()
    if (!entityName || !normalizedRecordId || !bridge.value?.db?.query) {
      sharedLdbLinksByTargetEntity.value = {}
      return
    }

    const targetEntities = (Array.isArray(sharedLdbViewTokens.value) ? sharedLdbViewTokens.value : [])
      .map((token) => String(token?.targetEntity || '').trim())
      .filter(Boolean)
    if (!targetEntities.length) {
      sharedLdbLinksByTargetEntity.value = {}
      return
    }

    const targetPlaceholders = targetEntities.map(() => '?').join(', ')
    const rows = await bridge.value.db.query(
      `
        SELECT target_entity, target_record_id AS target_id
        FROM LDB_Relationships
        WHERE source_entity = ?
          AND source_record_id = ?
          AND target_entity IN (${targetPlaceholders})
      `,
      [entityName, normalizedRecordId, ...targetEntities],
    )

    const nextMap = {}
    ;(Array.isArray(rows) ? rows : []).forEach((row) => {
      const targetEntity = String(row?.target_entity || '').trim()
      const targetId = String(row?.target_id || '').trim()
      if (!targetEntity || !targetId) return
      if (!nextMap[targetEntity]) nextMap[targetEntity] = []
      nextMap[targetEntity].push(targetId)
    })

    Object.keys(nextMap).forEach((key) => {
      nextMap[key] = Array.from(new Set(nextMap[key]))
    })

    sharedLdbLinksByTargetEntity.value = nextMap
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
  if (runtimeStructureUnsub) runtimeStructureUnsub()
  runtimeStructureUnsub = null
})

onMounted(() => {
  runtimeStructureUnsub = subscribeRuntimeFileStructures((version) => {
    runtimeStructureVersion.value = version
  })
})

function isHeroGroupExpanded(groupKey) { return expandedHeroGroupKeys.value.includes(groupKey) }
function isViewSubgroupExpanded(groupKey) { return expandedViewSubgroupKeys.value.includes(groupKey) }
function toggleHeroGroup(groupKey) {
  expandedHeroGroupKeys.value = isHeroGroupExpanded(groupKey)
    ? expandedHeroGroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedHeroGroupKeys.value, groupKey]
}
function toggleViewSubgroup(groupKey) {
  expandedViewSubgroupKeys.value = isViewSubgroupExpanded(groupKey)
    ? expandedViewSubgroupKeys.value.filter((key) => key !== groupKey)
    : [...expandedViewSubgroupKeys.value, groupKey]
}
function getViewTokens(viewKey) { return selectableTokens.value.filter((token) => token.parentKey === viewKey) }
function isSelectedToken(tokenKey) { return selectedTokenKeySet.value.has(tokenKey) }
function setTokenSelected(tokenKey, isSelected) {
  const next = new Set(selectedTokenKeys.value)
  if (isSelected) next.add(tokenKey)
  else next.delete(tokenKey)
  selectedTokenKeys.value = Array.from(next)
}

function handleDialogChange() {}
function handleDialogClose() { createDialogOpen.value = false }

function handleRecordFeedAdd(feedTab) {
  const normalizedFeedTab = String(feedTab || '').trim().toLowerCase()
  if (!['notes', 'artifacts', 'intake'].includes(normalizedFeedTab)) return

  if (normalizedFeedTab === 'intake') {
    setPendingIntakeShellRequest({
      initialArtifacts: [],
      artifactContext: recordFeedArtifactContext.value,
    })
    router.push({
      name: 'intake-shell',
      query: {
        section: 'intake',
        create: '1',
        open: String(Date.now()),
      },
    })
    return
  }

  setPendingAddEditShellRequest({
    sourceKey: normalizedFeedTab,
    initialValues: {},
  })
  router.push({
    name: 'dialog-shell',
    query: {
      section: normalizedFeedTab,
      create: '1',
      contextEntity: String(recordFeedArtifactContext.value?.entityName || '').trim(),
      contextRecordId: String(recordFeedArtifactContext.value?.recordId || '').trim(),
    },
  })
}

async function submitCreateRecord({ values } = {}) {
  if (isRecordRoute.value) {
    await submitRecordUpdate(values)
    return
  }
  const payload = buildCreatePayload(values)
  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.[activeSourceKey.value]?.create?.(payload)
    if (!result) {
      $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
      return
    }
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Missing record type'} created.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  } finally {
    createDialogLoading.value = false
  }
}

async function submitRecordUpdate(values = {}) {
  const changes = buildRecordUpdateChanges(values)
  if (!changes.length) {
    createDialogOpen.value = false
    $q.notify({ type: 'info', message: 'No record changes to save.' })
    return
  }
  createDialogLoading.value = true
  try {
    const result = await bridge.value?.records?.update?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes,
      actionLabel: 'record_shell_edit_session',
    })
    for (const change of changes.filter((entry) => entry.review_tracked)) {
      await bridge.value?.verification?.upsert?.({
        tableName: change.table_name,
        recordId: change.record_id,
        fieldName: change.field_name,
        state: 'verified',
        source: 'direct_user_input',
        actionLabel: 'record_shell_edit_session',
      })
    }
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
    createDialogOpen.value = false
    $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Missing record type'} updated.` })
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    createDialogLoading.value = false
  }
}

function buildRecordUpdateChanges(values = {}) {
  const seenChangeKeys = new Set()
  return [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
    .flatMap((token) => {
      const field = resolveExistingFieldForToken(token)
      if (field && !field.editable) return []
      const changes = buildTokenUpdateChanges(token, {
        nextValue: values?.[token.key],
        initialValue: field ? field.value : getTokenDialogValue(token),
        recordId: recordIdParam.value,
        entityName: activeRegistryEntry.value?.entityName || tableNameParam.value,
        idColumn: String(field?.id_column || 'id').trim() || 'id',
      }).map((change) => ({
        ...change,
        review_tracked: isInlineReviewTrackedField(token),
      }))
      return changes.filter((change) => {
        const changeKey = [
          String(change?.change_kind || 'field').trim(),
          String(change?.table_name || '').trim(),
          String(change?.field_name || '').trim(),
          String(change?.relationship_token || '').trim(),
        ].join(':')
        if (!change?.field_name || seenChangeKeys.has(changeKey)) return false
        seenChangeKeys.add(changeKey)
        return true
      })
    })
}

function buildCreatePayload(values = {}) {
  const allTokens = [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens
      .map((token) => {
        const value = values?.[token.key]
        if (Array.isArray(value) && !value.length) return null
        if (!Array.isArray(value) && String(value ?? '').trim() === '') return null
        return [resolveWriteField(token), value]
      })
      .filter(Boolean),
  )
}

function resolveWriteField(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return String(token?.dbWriteField || aliases[0] || token?.tokenName || token?.key || '').trim()
}

function normalizeCreateDialogToken(token) {
  if (!String(token?.tokenType || '').trim().startsWith('select_')) return token
  return { ...token, inputOptions: getInputOptionsForToken(token) }
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  const optionList = String(token?.optionList || '').trim()
  if (optionSource === 'canonical_list' && optionList) return CANONICAL_OPTION_LISTS[optionList] || []
  if (optionSource === 'live_entity') return getLiveEntityOptionsForToken(token)
  if (optionSource === 'live_entity_set') return getLiveEntitySetOptionsForToken(token)
  if (optionSource === 'shared_file_universe' || token?.isSharedLdbToken) {
    const sourceKey = String(token?.targetSourceKey || '').trim() || resolveSourceKeyFromEntityName(token?.optionEntity)
    return sourceKey ? buildLiveEntityOptions(sourceKey) : []
  }
  return Array.isArray(token?.inputOptions) ? token.inputOptions : []
}

function getLiveEntityOptionsForToken(token) {
  const sourceKey = resolveSourceKeyFromEntityName(token?.optionEntity)
  return sourceKey ? buildLiveEntityOptions(sourceKey) : []
}

function getLiveEntitySetOptionsForToken(token) {
  return (Array.isArray(token?.optionEntities) ? token.optionEntities : [])
    .map((entityName) => resolveSourceKeyFromEntityName(entityName))
    .filter(Boolean)
    .flatMap((sourceKey) => buildLiveEntityOptions(sourceKey))
}

function resolveSourceKeyFromEntityName(entityName) {
  return getFilePageRegistryEntryByEntityReference(entityName)?.key || ''
}

function buildLiveEntityOptions(sourceKey) {
  const rows = Array.isArray(liveOptionRowsBySource.value[sourceKey]) ? liveOptionRowsBySource.value[sourceKey] : []
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  return rows.map((row) => {
    const value = String(resolveLiveEntityRecordId(row, sourceKey) || '').trim()
    const label = String(getCanonicalTokenValue(row, titleToken || {}) || '').trim()
    return value && label ? { label, value } : null
  }).filter(Boolean)
}

function resolveLiveEntityRecordId(row, sourceKey) {
  if (!row || typeof row !== 'object') return ''
  return sourceKey === 'artifacts' ? row.artifact_id || row.id || '' : row.id || row.artifact_id || ''
}

async function ensureLiveOptionsLoaded() {
  const tokensToLoad = [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens), ...selectableTokens.value.map((token) => normalizeCreateDialogToken(token))]
  const sourceKeys = new Set()
  for (const token of tokensToLoad) {
    const optionSource = String(token?.optionSource || '').trim()
    if (optionSource === 'live_entity') {
      const sourceKey = resolveSourceKeyFromEntityName(token.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }
    if (optionSource === 'live_entity_set') {
      for (const entityName of Array.isArray(token?.optionEntities) ? token.optionEntities : []) {
        const sourceKey = resolveSourceKeyFromEntityName(entityName)
        if (sourceKey) sourceKeys.add(sourceKey)
      }
    }
    if (optionSource === 'shared_file_universe' || token?.isSharedLdbToken) {
      const sourceKey = String(token?.targetSourceKey || '').trim() || resolveSourceKeyFromEntityName(token?.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }
  }
  for (const sourceKey of sourceKeys) {
    if (liveOptionRowsBySource.value[sourceKey]) continue
    try {
      const result = await bridge.value?.[sourceKey]?.list?.()
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: normalizeListResult(result) }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
    }
  }

  if (!liveOptionRowsBySource.value['file-system']) {
    try {
      const result = await bridge.value?.['file-system']?.list?.()
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, ['file-system']: normalizeListResult(result) }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, ['file-system']: [] }
    }
  }

  const systemRows = Array.isArray(liveOptionRowsBySource.value['file-system']) ? liveOptionRowsBySource.value['file-system'] : []
  for (const row of systemRows) {
    const sourceKey = resolveApprovedFileSectionKey(
      row?.File_Source_Key || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
    )
    if (!sourceKey || sourceKey === 'bb-file' || liveOptionRowsBySource.value[sourceKey]) continue
    try {
      const result = await bridge.value?.[sourceKey]?.list?.()
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: normalizeListResult(result) }
    } catch {
      liveOptionRowsBySource.value = { ...liveOptionRowsBySource.value, [sourceKey]: [] }
    }
  }
}

function normalizeListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

function resolveSourceKeyFromTableName(tableName) {
  const normalized = String(tableName || '').trim().toLowerCase()
  if (!normalized) return ''
  const direct = FILE_SOURCE_REGISTRY.find((entry) =>
    [entry.key, entry.routeName, entry.entityName, entry.label].some((value) => String(value || '').trim().toLowerCase() === normalized),
  )
  if (direct?.key) return direct.key

  return getFilePageRegistryEntryByEntityReference(String(tableName || '').trim())?.key || ''
}

function resolveExistingFieldForToken(token) {
  const aliases = getCanonicalTokenFieldNames(token)
  return aliases.map((alias) => fieldByName.value[alias]).find(Boolean) || null
}

function getTokenRawValue(token) {
  if (!token) return ''
  if (token?.isSharedLdbToken) return getSharedLdbTokenRawValue(token)
  const aliases = getCanonicalTokenFieldNames(token)
  for (const alias of aliases) {
    const field = fieldByName.value[alias]
    if (field && field.value != null && String(field.value).trim() !== '') return field.value
    const recordValue = currentView.value?.record?.[alias]
    if (recordValue != null && String(recordValue).trim() !== '') return recordValue
  }
  return ''
}

function getSharedLdbTokenRawValue(token) {
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const targetEntity = String(token?.targetEntity || '').trim()
  if (!entityName || !targetEntity) return []
  return Array.isArray(sharedLdbLinksByTargetEntity.value[targetEntity]) ? sharedLdbLinksByTargetEntity.value[targetEntity] : []
}

function getTokenDisplayValue(token) {
  const rawValue = getTokenRawValue(token)
  if (token?.isSharedLdbToken) {
    const values = Array.isArray(rawValue) ? rawValue : []
    if (!values.length) return 'Missing value'
    const options = Array.isArray(token?.inputOptions) ? token.inputOptions : []
    return values
      .map((value) => options.find((option) => String(option?.value || '').trim() === String(value || '').trim())?.label || String(value || '').trim())
      .filter(Boolean)
      .join(', ') || 'Missing value'
  }
  if (Array.isArray(rawValue)) return rawValue.length ? rawValue.join(', ') : 'Missing value'
  const normalized = String(rawValue ?? '').trim()
  return normalized || 'Missing value'
}

function getTokenDialogValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return rawValue == null ? '' : String(rawValue)
}

function tokenHasStoredValue(token) {
  const rawValue = getTokenRawValue(token)
  if (Array.isArray(rawValue)) return rawValue.some((item) => String(item || '').trim())
  return String(rawValue ?? '').trim() !== ''
}

function normalizeIpcErrorMessage(ipcError) {
  const raw = String(ipcError?.message || ipcError || '').trim()
  const prefix = "Error invoking remote method '"
  if (!raw.startsWith(prefix)) return raw
  const separatorIndex = raw.indexOf("':")
  return separatorIndex > -1 ? raw.slice(separatorIndex + 2).trim() : raw
}

function stringifyAuditValue(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) return parsed.join(', ')
    if (parsed && typeof parsed === 'object') return JSON.stringify(parsed)
  } catch {
    // keep raw string
  }
  return normalized
}

function parseAuditValue(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null
  try {
    return JSON.parse(normalized)
  } catch {
    return normalized
  }
}

function formatAuditFieldLabel(fieldName) {
  const specialWords = {
    id: 'ID',
    api: 'API',
    aum: 'AUM',
    aums: 'AUMs',
    llm: 'LLM',
    rofo: 'ROFO',
    ror: 'ROR',
  }
  return String(fieldName || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = String(word).toLowerCase()
      if (specialWords[lower]) return specialWords[lower]
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function formatAuditActorLabel(editedBy) {
  const normalized = String(editedBy || '').trim()
  if (!normalized) return 'Missing actor'
  const userMatch = liveOptionRowsBySource.value.users?.find((row) => String(row?.id || '').trim() === normalized)
  const userTitleToken = getRegistryTitleTokenForSource('users')
  const resolved = String(userTitleToken ? getCanonicalTokenValue(userMatch || {}, userTitleToken) : '').trim()
  return resolved || `Unresolved actor: ${normalized}`
}

function getAuditTokenForFieldName(fieldName = '') {
  const normalizedFieldName = String(fieldName || '').replace(/__verification$/, '').trim()
  if (!normalizedFieldName) return null
  return fileTokens.value.find((token) => {
    const aliases = getCanonicalTokenFieldNames(token)
    return aliases.includes(normalizedFieldName)
  }) || null
}

function resolveAuditOptionLabel(token, value) {
  if (!token || value == null) return ''
  const normalizedToken = normalizeCreateDialogToken(token)
  const options = Array.isArray(normalizedToken?.inputOptions) ? normalizedToken.inputOptions : []
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return ''
  const matched = options.find((option) => String(option?.value || '').trim() === normalizedValue)
  return String(matched?.label || '').trim()
}

function resolveAuditDisplayValue(fieldName = '', value = null) {
  const token = getAuditTokenForFieldName(fieldName)
  const parsedValue = parseAuditValue(value)

  if (fieldName.endsWith('__verification')) {
    return tokenHasStoredValue(token) ? getTokenDisplayValue(token) : ''
  }

  if (Array.isArray(parsedValue)) {
    const labels = parsedValue
      .map((item) => resolveAuditOptionLabel(token, item) || String(item || '').trim())
      .filter(Boolean)
    return labels.join(', ')
  }

  if (parsedValue && typeof parsedValue === 'object') return stringifyAuditValue(value)

  return resolveAuditOptionLabel(token, parsedValue) || stringifyAuditValue(parsedValue)
}

function buildAuditRecordDescriptor() {
  const recordName = String(heroName.value || '').trim() || 'Missing record label'
  return recordName
}

function buildAuditEventTitle(event = {}, fieldName = '', actionLabel = '') {
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {}
  const actorLabel = String(payload?.actor_label || '').trim() || formatAuditActorLabel(event?.edited_by)
  const normalizedFieldName = String(fieldName || '').replace(/__verification$/, '').trim()
  const fieldLabel = String(payload?.field_label || '').trim() || formatAuditFieldLabel(normalizedFieldName)
  const recordDescriptor = String(payload?.record_label || '').trim() || buildAuditRecordDescriptor()
  const verificationValue = String(payload?.new_display_value || '').trim() || resolveAuditDisplayValue(`${normalizedFieldName}__verification`, event?.new_value)
  const nextValue = String(payload?.new_display_value || '').trim() || resolveAuditDisplayValue(normalizedFieldName, event?.new_value)
  const previousValue = String(payload?.old_display_value || '').trim() || resolveAuditDisplayValue(normalizedFieldName, event?.old_value)

  if (actionLabel.includes('create')) {
    return `${actorLabel}, created ${recordDescriptor}`
  }

  if (actionLabel.includes('delete')) {
    return `${actorLabel}, deleted ${recordDescriptor}`
  }

  if (fieldName.endsWith('__verification') || actionLabel.includes('verification')) {
    if (verificationValue) return `${actorLabel}, verified "${verificationValue}" as ${fieldLabel} for ${recordDescriptor}`
    return `${actorLabel}, verified ${fieldLabel} for ${recordDescriptor}`
  }

  if (!previousValue && nextValue) {
    return `${actorLabel}, added "${nextValue}" as ${fieldLabel} for ${recordDescriptor}`
  }

  if (previousValue && !nextValue) {
    return `${actorLabel}, cleared ${fieldLabel} for ${recordDescriptor}`
  }

  if (nextValue) {
    return `${actorLabel}, updated ${fieldLabel} to "${nextValue}" for ${recordDescriptor}`
  }

  if (fieldLabel) {
    return `${actorLabel}, updated ${fieldLabel} for ${recordDescriptor}`
  }

  return `${actorLabel}, updated ${recordDescriptor}`
}

function normalizeAuditFeedEvents(events = []) {
  return (Array.isArray(events) ? events : [])
    .map((event) => {
      const fieldName = String(event?.field_name || '').trim()
      const actionLabel = String(event?.action_label || '').trim().toLowerCase()
      const groupKey = resolveAuditFeedGroupKey(event, fieldName, actionLabel)
      const feedKey = resolveAuditFeedTabKey(event)
      return {
        id: String(event?.id || '').trim() || `audit:${Math.random()}`,
        feedKey,
        groupKey,
        sourceLabel: formatAuditActorLabel(event?.edited_by),
        meta: String(event?.edited_at || '').trim() || 'Missing datetime',
        title: buildAuditEventTitle(event, fieldName, actionLabel),
        content: '',
        hasLogPage: true,
      }
    })
    .filter((event) => event.title)
}

function resolveAuditFeedGroupKey(event = {}, fieldName = '', actionLabel = '') {
  const normalizedFieldName = String(fieldName || '').trim().toLowerCase()
  const normalizedActionLabel = String(actionLabel || '').trim().toLowerCase()
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {}
  const state = String(payload?.verification_state || payload?.state || '').trim().toLowerCase()

  const lifecycleActions = new Set(['created', 'modified', 'deleted'])
  const actionStates = new Set(['pre-selected', 'pre_selected', 'default_preselected_unverified', 'suggested', 'suggested_unverified', 'verified', 'rejected', 'approved'])

  if (normalizedFieldName.endsWith('__verification')) return 'actions'
  if (normalizedActionLabel.includes('verification')) return 'actions'
  if (actionStates.has(state)) return 'actions'
  if (lifecycleActions.has(normalizedActionLabel)) return 'lifecycle'
  return 'actions'
}

function resolveAuditFeedTabKey(event = {}) {
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {}
  const explicitTab = String(
    payload?.feed_tab ||
    payload?.feed_category ||
    payload?.history_tab ||
    '',
  )
    .trim()
    .toLowerCase()

  if (['events', 'notes', 'artifacts', 'intake'].includes(explicitTab)) {
    return explicitTab
  }

  return 'events'
}

function openFeedItemLog(eventId) {
  if (!isRecordRoute.value || !eventId) return
  router.push({
    name: 'record-event',
    params: {
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
      eventId,
    },
  })
}

async function loadRecordView() {
  if (!hasBridge.value || !isRecordRoute.value) {
    currentView.value = null
    fields.value = []
    auditEvents.value = []
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.records.view(tableNameParam.value, recordIdParam.value)
    currentView.value = result || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
    if (!Array.isArray(liveOptionRowsBySource.value.users)) {
      try {
        const usersResult = await bridge.value?.users?.list?.()
        liveOptionRowsBySource.value = {
          ...liveOptionRowsBySource.value,
          users: normalizeListResult(usersResult),
        }
      } catch {
        liveOptionRowsBySource.value = {
          ...liveOptionRowsBySource.value,
          users: [],
        }
      }
    }
    try {
      const verificationResult = await bridge.value?.verification?.list?.({
        tableName: tableNameParam.value,
        recordId: recordIdParam.value,
      })
      fieldVerificationStates.value = Object.fromEntries(
        (Array.isArray(verificationResult?.fields) ? verificationResult.fields : []).map((field) => [
          String(field?.field_name || '').trim(),
          String(field?.state || '').trim(),
        ]),
      )
    } catch {
      fieldVerificationStates.value = {}
    }
    try {
      const auditResult = await bridge.value?.audit?.events?.({
        table_name: runtimeTableName.value,
        record_id: recordIdParam.value,
        limit: 5,
      })
      auditEvents.value = normalizeAuditFeedEvents(auditResult?.events)
    } catch {
      auditEvents.value = []
    }
    inlineFieldValues.value = Object.fromEntries(
      [...createKeyFieldTokens.value, ...createViewGroups.value.flatMap((section) => section.tokens)]
        .map((token) => [token.key, getTokenDialogValue(token)]),
    )
  } catch (loadError) {
    error.value = normalizeIpcErrorMessage(loadError)
    currentView.value = null
    fields.value = []
    auditEvents.value = []
    fieldVerificationStates.value = {}
    inlineFieldValues.value = {}
  } finally {
    loading.value = false
  }
}

function inlineInputType(token) {
  const normalizedType = String(token?.tokenType || '').trim().toLowerCase()
  if (normalizedType === 'email') return 'email'
  if (normalizedType === 'phone') return 'tel'
  if (normalizedType === 'url') return 'url'
  if (normalizedType === 'date') return 'date'
  if (normalizedType === 'datetime') return 'datetime-local'
  return 'text'
}

function inlineRawValue(token) {
  const explicitValue = inlineFieldValues.value?.[token?.key]
  if (explicitValue != null && (Array.isArray(explicitValue) || String(explicitValue).trim() !== '')) return explicitValue
  return getTokenDialogValue(token)
}

function inlineStringValue(token) {
  const rawValue = inlineRawValue(token)
  return rawValue == null ? '' : String(rawValue)
}

function inlineSingleValue(token) {
  const rawValue = inlineRawValue(token)
  return rawValue == null ? '' : rawValue
}

function inlineMultiValue(token) {
  const rawValue = inlineRawValue(token)
  if (Array.isArray(rawValue)) return rawValue
  return String(rawValue || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function updateInlineFieldValue(token, nextValue) {
  inlineFieldValues.value = {
    ...inlineFieldValues.value,
    [token.key]: nextValue,
  }
}

function isSystemManagedReadOnlyToken(token) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()

  if (['id', 'creator'].includes(tokenType)) return true
  if (tokenName.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenName.includes('user_role') || tokenName.includes('role_link')) return true
  return false
}

function isHistoryDerivedSystemToken(token) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()
  const tokenLabel = String(token?.label || '').trim().toLowerCase()
  const inputSource = String(token?.inputSource || '').trim().toLowerCase()

  if (tokenType === 'creator') return true
  if (inputSource === 'system_actor') return true
  if (tokenName.includes('creator') || tokenLabel.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenType === 'datetime' && tokenLabel === 'datetime') return true
  return false
}

function isInlineFieldEditable(token) {
  if (isSystemManagedReadOnlyToken(token)) return false
  const field = resolveExistingFieldForToken(token)
  if (field) return Boolean(field.editable)
  return tokenSupportsRecordUpdate(token, activeRegistryEntry.value?.entityName || tableNameParam.value)
}

function isSystemReadOnlyInline(token) {
  return Boolean(
    isRecordRoute.value &&
    isSystemViewActive.value &&
    !isInlineFieldEditable(token),
  )
}

function inlineFieldHasValue(token) {
  const value = inlineRawValue(token)
  if (Array.isArray(value)) return value.length > 0
  return String(value ?? '').trim().length > 0
}

function isInlineReviewTrackedField(token) {
  const field = resolveExistingFieldForToken(token)
  const aliases = [
    String(field?.field_name || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ].filter(Boolean)
  return aliases.some((alias) => String(fieldVerificationStates.value?.[alias] || '').trim())
}

function resolvedInlineFieldVerificationState(token) {
  const field = resolveExistingFieldForToken(token)
  const aliases = [
    String(field?.field_name || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ].filter(Boolean)
  for (const alias of aliases) {
    const state = String(fieldVerificationStates.value?.[alias] || '').trim()
    if (state) return state
  }
  return ''
}

function showInlineFieldVerificationAction(token) {
  return isInlineReviewTrackedField(token) && inlineFieldHasValue(token)
}

function isInlineCopyableIdField(token) {
  const aliases = [
    String(token?.tokenName || '').trim(),
    ...getCanonicalTokenFieldNames(token),
  ]
    .map((alias) => String(alias || '').trim().toLowerCase())
    .filter(Boolean)

  return aliases.some((alias) => alias === 'id' || alias.endsWith('_id'))
}

function showInlineFieldCopyAction(token) {
  if (isSystemReadOnlyInline(token)) return inlineFieldHasValue(token)
  return isInlineCopyableIdField(token) && inlineFieldHasValue(token)
}

async function copyInlineFieldValue(token) {
  const rawValue = inlineRawValue(token)
  const value = Array.isArray(rawValue)
    ? rawValue.map((item) => String(item || '').trim()).filter(Boolean).join(', ')
    : String(rawValue ?? '').trim()
  if (!value) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      $q.notify({ type: 'positive', message: `${token?.label || 'Missing field label'} copied` })
      return
    }
    throw new Error('Clipboard unavailable')
  } catch {
    $q.notify({ type: 'negative', message: 'Could not copy field value.' })
  }
}

function inlineFieldVerificationIcon(token) {
  const state = resolvedInlineFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.icon || 'help'
}

function inlineFieldVerificationIconClass(token) {
  const state = resolvedInlineFieldVerificationState(token)
  return state ? `record-shell__verification-icon--${state}` : ''
}

function inlineFieldVerificationIconStyle(token) {
  const state = resolvedInlineFieldVerificationState(token)
  const option = fieldVerificationActionOptions.find((entry) => entry.value === state)
  return option?.color ? { color: option.color } : {}
}

async function commitInlineFieldValue(token, explicitValue) {
  if (!isRecordRoute.value) return
  const field = resolveExistingFieldForToken(token)
  if (field && !field.editable) return
  const reviewTracked = isInlineReviewTrackedField(token)

  const nextValue = explicitValue === undefined ? inlineRawValue(token) : explicitValue
  const changes = buildTokenUpdateChanges(token, {
    nextValue,
    initialValue: field ? field.value : getTokenDialogValue(token),
    recordId: recordIdParam.value,
    entityName: activeRegistryEntry.value?.entityName || tableNameParam.value,
    idColumn: String(field?.id_column || 'id').trim() || 'id',
  })
  if (!changes.length) return

  const verificationFieldName = String(field?.field_name || token?.tokenName || '').trim()
  const saveKey = `${token.key}:${verificationFieldName || 'write'}`
  if (inlineFieldSavingKeys.value.includes(saveKey)) return
  inlineFieldSavingKeys.value = [...inlineFieldSavingKeys.value, saveKey]

  try {
    const result = await bridge.value?.records?.update?.({
      tableName: runtimeTableName.value,
      recordId: recordIdParam.value,
      changes,
      actionLabel: 'record_shell_field_edit',
    })
    if (reviewTracked && verificationFieldName) {
      await bridge.value?.verification?.upsert?.({
        tableName: String(field?.table_name || runtimeTableName.value).trim(),
        recordId: String(field?.record_id || recordIdParam.value).trim(),
        fieldName: verificationFieldName,
        state: 'verified',
        source: 'direct_user_input',
        actionLabel: 'record_shell_field_edit',
      })
      fieldVerificationStates.value = {
        ...fieldVerificationStates.value,
        [verificationFieldName]: 'verified',
      }
    }
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : fields.value
    inlineFieldValues.value = {
      ...inlineFieldValues.value,
      [token.key]: nextValue,
    }
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    inlineFieldSavingKeys.value = inlineFieldSavingKeys.value.filter((key) => key !== saveKey)
  }
}

async function updateInlineFieldVerificationState(token, nextState) {
  if (!isRecordRoute.value || !inlineFieldHasValue(token)) return
  const field = resolveExistingFieldForToken(token)
  if (!field) return
  try {
    await bridge.value?.verification?.upsert?.({
      tableName: field.table_name,
      recordId: field.record_id,
      fieldName: field.field_name,
      state: String(nextState || '').trim(),
      source: 'record_shell_field_review',
      actionLabel: 'record_shell_field_verification',
    })
    fieldVerificationStates.value = {
      ...fieldVerificationStates.value,
      [String(field.field_name || '').trim()]: String(nextState || '').trim(),
    }
  } catch (submitError) {
    const message = normalizeIpcErrorMessage(submitError)
    error.value = message
    $q.notify({ type: 'negative', message })
  }
}

function hashString(value = '') {
  let hash = 0
  const normalized = String(value || '')
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index)
    hash |= 0
  }
  return hash
}

function onContactHeroPointerMove(event) {
  const heroElement = contactHeroRef.value
  if (!heroElement) return
  const rect = heroElement.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  contactHeroGradient.value = {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(90, y)),
    size: 60,
    opacity: 1,
  }
}

function startContactHeroPointerTracking() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onContactHeroPointerMove)
  window.addEventListener('pointermove', onContactHeroPointerMove)
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 1,
  }
}

function onContactHeroPointerLeave() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onContactHeroPointerMove)
  }
  contactHeroGradient.value = {
    ...contactHeroGradient.value,
    opacity: 0,
  }
}
</script>

<style scoped>
.record-shell { display: flex; flex-direction: column; gap: 20px; }
.record-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.88fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
}

.record-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--contact-hero-blob-x) var(--contact-hero-blob-y),
    var(--contact-hero-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--contact-hero-blob-soft, rgba(38, 71, 255, 0.14)) calc(var(--contact-hero-blob-size) * 0.46),
    var(--contact-hero-blob-fade, rgba(38, 71, 255, 0.06)) calc(var(--contact-hero-blob-size) * 0.7),
    transparent var(--contact-hero-blob-size)
  );
  opacity: var(--contact-hero-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.record-shell__hero-main,
.record-shell__feed {
  position: relative;
  z-index: 1;
}

.record-shell__hero-main {
  display: flex;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 420px;
}

.record-shell__portrait {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px 0 0 24px;
  box-shadow: none;
}

.record-shell__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(17, 17, 17, 0.18) 100%);
  pointer-events: none;
}

.record-shell__portrait--initials-only {
  background: transparent;
}

.record-shell__portrait--initials-only::after {
  display: none;
}

.record-shell__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.record-shell__portrait-placeholder-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(132px, 18vw, 188px);
  height: clamp(132px, 18vw, 188px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 40px rgba(17, 17, 17, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-title);
  font-size: clamp(2.6rem, 4vw, 4rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
}

.record-shell__hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--ds-space-12);
  min-width: 0;
  padding: 36px 36px 34px 16px;
}

.record-shell__hero-name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 8px;
}

.record-shell__hero-icon-button {
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
}

.record-shell__hero-icon-button--create {
  color: #2669ff;
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(38, 105, 255, 0.18);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.record-shell__hero-icon-button :deep(.q-icon) {
  font-size: 16px;
}

.record-shell__feed-label {
  color: var(--ds-color-text-muted-alt);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.record-shell__name {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.6rem, 3.2vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.95;
}

.record-shell__mini-dashboard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.record-shell__mini-item {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 9px;
}

.record-shell__mini-label {
  color: #6f6f6f;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.record-shell__mini-value {
  margin-top: 3px;
  color: #111;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
  word-break: break-word;
}

.record-shell__subtitle {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.record-shell__subtitle--secondary {
  color: #6b6b6b;
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.record-shell__hero-field-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.record-shell__hero-field-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record-shell__hero-field-stack--summary {
  align-self: start;
}

.record-shell__hero-field-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-shell__hero-field-top {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
}

.record-shell__hero-field-bottom {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 2px;
}

.record-shell__hero-field-label {
  display: inline-flex;
  width: fit-content;
  justify-self: start;
  padding: 7px 10px;
  color: #fff;
  font-family: var(--font-title);
  font-size: 0.74rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  background: #111;
  border: 1px solid #111;
  border-radius: 4px;
}

.record-shell__hero-field-description {
  display: inline-flex;
  align-items: flex-end;
  align-self: end;
  padding: 0 10px 1px 0;
  color: #5c5c5c;
  font-family: var(--ds-font-family-body);
  font-size: 0.68rem;
  line-height: 1;
  text-align: left;
  justify-self: start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
}

.record-shell__hero-field-value {
  display: inline-flex;
  width: fit-content;
  margin-left: 10px;
  padding: 4px 8px;
  color: rgba(17, 17, 17, 0.66);
  font-family: var(--ds-font-family-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  background: rgba(255, 255, 255, 0.42);
  border: 0;
  border-radius: 4px;
  backdrop-filter: blur(10px);
}

.record-shell__hero-field-card--summary .record-shell__hero-field-label,
.record-shell__hero-field-card--summary .record-shell__hero-field-value {
  border-radius: 4px;
}

.record-shell__hero-field-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #2669ff;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.record-shell__feed {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-lg);
  color: #fff;
}

.record-shell__feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.record-shell__feed-header--main {
  justify-content: flex-start;
  gap: 20px;
}

.record-shell__feed-state {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.record-shell__feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.record-shell__feed-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.record-shell__feed-tab {
  min-height: 24px;
  padding: 0 9px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.record-shell__feed-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(255, 255, 255, 0.94);
}

.record-shell__feed-entry {
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.record-shell__feed-entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.record-shell__feed-entry-top-right {
  display: flex;
  align-items: center;
  gap: 0;
}

.record-shell__feed-entry-source {
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.record-shell__feed-entry-time {
  color: rgba(255, 255, 255, 0.54);
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  line-height: 1.3;
}

.record-shell__feed-entry-title {
  margin-top: 4px;
  color: #ffffff;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.record-shell__feed-entry-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.record-shell__feed-entry-toggle:hover {
  color: rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.08);
}

.record-shell__feed-entry-content {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.74);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
}
.record-shell__panel { display:grid; gap:12px; padding:16px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(255,255,255,.96); }
.record-shell__panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.record-shell__panel-title { color:#111; font-family:var(--font-title); font-size:.94rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__panel-meta { color:rgba(17,17,17,.54); font-size:.72rem; }
.record-shell__system-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,360px); gap:16px; align-items:start; }
.record-shell__system-column { min-width:0; }
.record-shell__system-column--history { display:grid; align-content:start; }
.record-shell__history-summary-box { display:grid; gap:8px; margin-bottom:12px; padding:10px; border:1px solid rgba(17,17,17,.08); border-radius:8px; background:rgba(17,17,17,.02); }
.record-shell__history-summary-item { display:grid; gap:3px; }
.record-shell__history-summary-label { color:rgba(17,17,17,.54); font-size:.68rem; line-height:1.1; text-transform:uppercase; letter-spacing:.04em; }
.record-shell__history-summary-value { color:#111; font-size:.78rem; line-height:1.25; }
.record-shell__section-group-stack { display:grid; gap:14px; }
.record-shell__section-group { display:grid; gap:8px; }
.record-shell__section-group-toggle { display:inline-flex; align-items:center; justify-content:flex-start; gap:2px; width:max-content; padding:0; color:#111; background:transparent; border:0; text-align:left; cursor:pointer; }
.record-shell__section-group-toggle-icon { color:#111; }
.record-shell__section-group-title { color:#111; font-family:var(--font-title); font-size:.8rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__section-group-meta { margin-left:6px; color:rgba(17,17,17,.54); font-size:.7rem; }
.record-shell__field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
.record-shell__field-card { padding:10px 12px; border:1px solid rgba(17,17,17,.08); border-radius:6px; background:rgba(17,17,17,.02); }
.record-shell__field-card--selected { border-color:rgba(38,71,255,.3); background:rgba(38,71,255,.05); }
.record-shell__field-label-row { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.record-shell__field-label { color:#111; font-size:.8rem; font-weight:600; line-height:1.3; }
.record-shell__field-meta-button { color:rgba(17,17,17,.6); }
.record-shell__field-meta-button:hover { color:#111; }
.record-shell__token-meta-menu { display:grid; gap:8px; padding:10px; min-width:220px; }
.record-shell__token-meta-title { color:#111; font-size:.78rem; font-weight:600; }
.record-shell__token-meta-actions { display:flex; justify-content:space-between; gap:8px; }
.record-shell__field-value { margin-top:4px; color:rgba(17,17,17,.58); font-size:.72rem; line-height:1.4; }
.record-shell__field-value-row { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; margin-top:6px; }
.record-shell__field-input { min-width:0; }
.record-shell__field-static-box {
  min-width: 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 4px;
  background: transparent;
  color: rgba(17,17,17,.46);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: 400;
  line-height: 1.15;
}
.record-shell__field-input :deep(.q-field__control) { min-height:24px; border-radius:4px; background:rgba(255,255,255,.72); }
.record-shell__field-input :deep(.q-field__native),
.record-shell__field-input :deep(.q-field__input) { color:rgba(17,17,17,.62); font-size:.74rem; font-weight:400; line-height:1.15; }
.record-shell__field-action { color:#111; padding:0; min-height:20px; }
.record-shell__verification-menu { min-width:max-content; }
.record-shell__verification-menu-item { min-height:22px; padding:0 6px; }
.record-shell__verification-menu-label { font-size:.72rem; line-height:1.1; }
.record-shell__settings-panel { width:min(280px,calc(100vw - 24px)); padding:10px; background:rgba(248,248,246,.98); border:1px solid rgba(17,17,17,.08); box-shadow:0 16px 32px rgba(17,17,17,.12); }
.record-shell__settings-title { color:#111; font-family:var(--font-title); font-size:.84rem; font-weight:var(--font-weight-black); line-height:.96; }
.record-shell__settings-group + .record-shell__settings-group { margin-top:10px; }
.record-shell__settings-heading { display:flex; align-items:center; justify-content:space-between; width:100%; padding:0; background:transparent; border:0; text-align:left; }
.record-shell__settings-children { display:grid; gap:4px; margin-top:4px; }
.record-shell__settings-row { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:8px; min-height:28px; padding:2px 4px; }
@media (max-width: 1180px) {
  .record-shell__hero { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .record-shell__hero-main { flex-direction: column; }
  .record-shell__portrait {
    width: 100%;
    flex-basis: auto;
    min-height: 240px;
    border-right: 0;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 24px 24px 0 0;
  }
  .record-shell__hero-field-columns {
    grid-template-columns: 1fr;
  }
  .record-shell__toolbar { flex-direction:column; align-items:stretch; }
  .record-shell__toolbar-right { margin-left:0; justify-content:flex-start; }
}
</style>
