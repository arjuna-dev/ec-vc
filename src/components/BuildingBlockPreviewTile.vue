<template>
  <article
    ref="tileRef"
    class="building-block-preview-tile"
    :class="{
      'building-block-preview-tile--collapsed': isCollapsed,
      'building-block-preview-tile--intrinsic-full-row': isIntrinsicFullRow,
    }"
  >
    <BuildingBlockTileHeader
      :title="tileTitle"
      :graph-label="tileGraphLabel"
      :shells-label="tileShellsLabel"
      :status-label="tileStatusLabel"
      :status-class="statusClass"
      :collapsed="isCollapsed"
      @toggle-collapse="isCollapsed = !isCollapsed"
    >
      <template v-if="$slots.selection" #leading>
        <slot name="selection" />
      </template>

      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </BuildingBlockTileHeader>

    <div v-if="!isCollapsed" class="building-block-preview-tile__stage" :class="stageClass">
      <template v-if="blockKey === 'page-title'">
        <PageTitleText title="BB Shell" />
      </template>

      <template v-else-if="blockKey === 'record-title'">
        <RecordTitle title="Record Title" />
      </template>

      <template v-else-if="blockKey === 'bb-tile-header'">
        <div class="building-block-preview-tile__header-preview">
          <BuildingBlockTileHeader
            title="Page Title"
            graph-label="Built from 5 BBs"
            shells-label="Used in 3 shells"
            status-label="Canonical Shared"
            status-class="building-block-preview-tile__status--canonical"
            :collapsed="false"
          />
        </div>
      </template>

      <template v-else-if="blockKey === 'page-back-symbol'">
        <PageBackSymbol />
      </template>

      <template v-else-if="blockKey === 'page-back-label'">
        <PageBackLabel label="Back" />
      </template>

      <template v-else-if="blockKey === 'button-label'">
        <ButtonLabel label="Primary" />
      </template>

      <template v-else-if="blockKey === 'b10-logo'">
        <B10Logo size="card" />
      </template>

      <template v-else-if="blockKey === 'west-icon'">
        <WestIcon />
      </template>

      <template v-else-if="blockKey === 'b10-icon-button'">
        <B10IconButton icon="arrow_back" variant="neutral" aria-label="Back" />
      </template>

      <template v-else-if="blockKey === 'b10-button'">
        <div class="building-block-preview-tile__button-row">
          <B10Button label="Primary" variant="primary" />
          <B10Button label="Neutral" variant="neutral" />
        </div>
      </template>

      <template v-else-if="blockKey === 'view-mode-toggle'">
        <ViewModeToggle model-value="card" :options="viewModeToggleOptions" />
      </template>

      <template v-else-if="blockKey === 'eye-icon'">
        <EyeIconButton aria-label="View item" />
      </template>

      <template v-else-if="blockKey === 'edit-button'">
        <EditButton aria-label="Edit row" />
      </template>

      <template v-else-if="blockKey === 'main-menu-icon'">
        <MainMenuIconButton />
      </template>

      <template v-else-if="blockKey === 'main-menu-row-icon'">
        <MainMenuRowIcon icon="folder_open" />
      </template>

      <template v-else-if="blockKey === 'main-menu-row-label'">
        <MainMenuRowLabel label="System Files" />
      </template>

      <template v-else-if="blockKey === 'main-menu-row'">
        <div class="building-block-preview-tile__drawer-row-context">
          <MainMenuRow label="System Files" icon="folder_open" />
        </div>
      </template>

      <template v-else-if="blockKey === 'main-menu-subgroup-row'">
        <div class="building-block-preview-tile__drawer-row-context">
          <MainMenuSubgroupRow label="Shells" :expanded="true" />
        </div>
      </template>

      <template v-else-if="blockKey === 'value-chip'">
        <ValueChip label="Companies" tone="default" />
      </template>

      <template v-else-if="blockKey === 'value-chip-surface'">
        <div class="building-block-preview-tile__comparison-row">
          <div class="building-block-preview-tile__comparison-panel">
            <div class="building-block-preview-tile__comparison-label">Light</div>
            <div class="building-block-preview-tile__button-row">
              <ValueChipSurface tone="default">
                <span style="width: 44px; height: 1px;" />
              </ValueChipSurface>
              <ValueChipSurface tone="menu">
                <span style="width: 30px; height: 1px;" />
              </ValueChipSurface>
              <ValueChipSurface tone="button-neutral" size="small">
                <span style="width: 30px; height: 1px;" />
              </ValueChipSurface>
            </div>
          </div>
          <div class="building-block-preview-tile__comparison-panel building-block-preview-tile__comparison-panel--dark">
            <div class="building-block-preview-tile__comparison-label">Dark</div>
            <div class="building-block-preview-tile__button-row">
              <ValueChipSurface tone="inverse">
                <span style="width: 44px; height: 1px;" />
              </ValueChipSurface>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'value-chip-label'">
        <ValueChipLabel label="Companies" tone="default" />
      </template>

      <template v-else-if="blockKey === 'dropdown-chevron'">
        <div class="building-block-preview-tile__comparison-row">
          <div class="building-block-preview-tile__comparison-panel">
            <div class="building-block-preview-tile__comparison-label">Light</div>
            <div class="building-block-preview-tile__chevron-row">
              <div class="building-block-preview-tile__chevron-swatch">
                <DropdownChevron tone="dark" />
              </div>
            </div>
          </div>
          <div class="building-block-preview-tile__comparison-panel building-block-preview-tile__comparison-panel--dark">
            <div class="building-block-preview-tile__comparison-label">Dark</div>
            <div class="building-block-preview-tile__chevron-row">
              <div class="building-block-preview-tile__chevron-swatch building-block-preview-tile__chevron-swatch--dark">
                <DropdownChevron tone="light" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'l2-settings-menu'">
        <L2SettingsMenu
          title="Hero Fields"
          :groups="l2SettingsSampleGroups"
        />
      </template>

      <template v-else-if="blockKey === 'widget-settings-menu'">
        <WidgetSettingsMenu
          :sections="widgetSettingsSampleSections"
          :open-section-ids="widgetSettingsOpenSectionIds"
        />
      </template>

      <template v-else-if="blockKey === 'dialog-shell-title-row'">
        <DialogShellTitleRow
          title="Edit Building Block"
          :closable="true"
        />
      </template>

      <template v-else-if="blockKey === 'dialog-shell-footer'">
        <DialogShellFooter
          :legend-items="dialogFooterLegendItems"
          save-label="Save"
        />
      </template>

      <template v-else-if="blockKey === 'add-edit-bb-shell-header-frame'">
        <AddEditBbShellHeaderFrame
          title="Add/Edit BB"
          bb-code="bb:file-hero"
          search-value=""
        />
      </template>

      <template v-else-if="blockKey === 'add-edit-bb-shell-window'">
        <AddEditBbShellWindow />
      </template>

      <template v-else-if="blockKey === 'dialog-shell-frame'">
        <DialogShellFrame class="building-block-preview-tile__dialog-frame">
          <template #header>
            <DialogShellTitleRow title="Edit Building Block" :closable="true" />
          </template>
          <template #default>
            <div class="building-block-preview-tile__dialog-frame-body" />
          </template>
          <template #footer>
            <DialogShellFooter save-label="Save" />
          </template>
        </DialogShellFrame>
      </template>

      <template v-else-if="blockKey === 'shell-title-row'">
        <FileShellTitleRow
          v-model="activeLiveActionL1"
          title="BB Shell"
          :show-selector="true"
          :options="liveActionOptions"
        />
      </template>

      <template v-else-if="blockKey === 'toggle-row-icons'">
        <div class="building-block-preview-tile__toggle-row-icons">
          <ToggleRowIcons label="General" :expanded="true" />
          <ToggleRowIcons label="System" direction="right" />
          <ToggleRowIcons variant="row-chevron-pair" />
        </div>
      </template>

      <template v-else-if="blockKey === 'live-action-l1'">
        <div class="building-block-preview-tile__comparison-row">
          <div class="building-block-preview-tile__comparison-panel">
            <div class="building-block-preview-tile__comparison-label">Light</div>
            <LiveActionL1 v-model="activeLiveActionL1" :options="liveActionOptions" />
          </div>
          <div class="building-block-preview-tile__comparison-panel building-block-preview-tile__comparison-panel--dark">
            <div class="building-block-preview-tile__comparison-label">Dark</div>
            <LiveActionL1 v-model="activeLiveActionL1" :options="liveActionOptions" tone="inverse" />
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'fonts'">
        <div class="building-block-preview-tile__foundation-stack">
          <article
            v-for="sample in foundationFontSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-panel"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-font-sample" :style="{ fontFamily: sample.fontFamily }">
              {{ sample.sample }}
            </div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'type-scale'">
        <div class="building-block-preview-tile__foundation-stack">
          <div
            v-for="sample in foundationTypeScaleSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-type-row"
          >
            <div class="building-block-preview-tile__foundation-type-meta">
              <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
              <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
            </div>
            <div class="building-block-preview-tile__foundation-type-sample" :style="{ fontSize: sample.size }">
              Sample Text
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'font-weights'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationFontWeightSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-weight-sample" :style="{ fontWeight: sample.weight }">
              Weight Sample
            </div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'colors'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationColorSwatches"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-swatch" :style="{ background: sample.color }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'surfaces'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationSurfaceSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-surface" :style="{ background: sample.background }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'borders'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationBorderSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-border-sample" :style="{ border: sample.border }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'radius'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationRadiusSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-radius-sample" :style="{ borderRadius: sample.radius }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'shadows'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationShadowSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-shadow-sample" :style="{ boxShadow: sample.shadow }" />
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'spacing'">
        <div class="building-block-preview-tile__foundation-stack">
          <div
            v-for="sample in foundationSpacingSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-spacing-row"
          >
            <div class="building-block-preview-tile__foundation-type-meta">
              <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}px</div>
              <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
            </div>
            <div class="building-block-preview-tile__foundation-spacing-track">
              <div class="building-block-preview-tile__foundation-spacing-bar" :style="{ width: sample.width }" />
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'icon-sizing'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationIconSizeSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-icon-sample" :style="{ width: sample.size, height: sample.size }">
              <q-icon name="add" :size="sample.size" />
            </div>
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-token">{{ sample.token }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'formatting-rules'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationFormattingSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-format-value">{{ sample.value }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'motion-rules'">
        <div class="building-block-preview-tile__foundation-grid">
          <article
            v-for="sample in foundationMotionSamples"
            :key="sample.key"
            class="building-block-preview-tile__foundation-card"
          >
            <div class="building-block-preview-tile__foundation-meta">{{ sample.label }}</div>
            <div class="building-block-preview-tile__foundation-motion-sample" :style="{ transform: sample.transform }" />
            <div class="building-block-preview-tile__foundation-token">{{ sample.detail }}</div>
          </article>
        </div>
      </template>

      <template v-else-if="blockKey === 'plus-icon'">
        <div class="building-block-preview-tile__plus-icon-compare">
          <PlusIconChip size="compare" />
        </div>
      </template>

      <template v-else-if="blockKey === 'plus-with-label'">
        <PlusWithLabelButton :label="addLabel" />
      </template>

      <template v-else-if="blockKey === 'l3-box'">
        <L3Box label="L3" value="128" caption="Canonical tokens" />
      </template>

      <template v-else-if="blockKey === 'home-dashboard'">
        <HomeDashboardHero
          count="2.4k"
          text="records tracked across the workspace"
          :stats="homeDashboardStats"
          workspace-root-value="C:\\Workspace\\B10"
          :signals="homeDashboardSignals"
        />
      </template>

      <template v-else-if="blockKey === 'file-toolbar'">
        <FilePageToolbar
          :all-visible-selected="false"
          :some-visible-selected="true"
          add-label="Add Record"
          search-query=""
          search-placeholder="Search Companies"
          view-mode="card"
          :view-options="viewOptions"
          :show-view-toggle="true"
        />
      </template>
      <template v-else-if="blockKey === 'filter-list-icon'">
        <FilterListIcon />
      </template>
      <template v-else-if="blockKey === 'search-bar-input'">
        <SearchBarInput model-value="" placeholder="Search Companies" />
      </template>
      <template v-else-if="blockKey === 'bb-code-input'">
        <BbCodeInput model-value="" placeholder="Enter bb:code" />
      </template>
      <template v-else-if="blockKey === 'settings-checkbox'">
        <div class="building-block-preview-tile__comparison-row">
          <div class="building-block-preview-tile__comparison-panel">
            <div class="building-block-preview-tile__comparison-label">Light</div>
            <div class="building-block-preview-tile__button-row">
              <SettingsCheckbox :model-value="false" tone="light" />
              <SettingsCheckbox :model-value="true" tone="light" />
            </div>
          </div>
          <div class="building-block-preview-tile__comparison-panel building-block-preview-tile__comparison-panel--dark">
            <div class="building-block-preview-tile__comparison-label">Dark</div>
            <div class="building-block-preview-tile__button-row">
              <div class="building-block-preview-tile__chevron-swatch building-block-preview-tile__chevron-swatch--dark">
                <SettingsCheckbox :model-value="false" tone="dark" />
              </div>
              <div class="building-block-preview-tile__chevron-swatch building-block-preview-tile__chevron-swatch--dark">
                <SettingsCheckbox :model-value="true" tone="dark" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'mini-scrollbar'">
        <div class="building-block-preview-tile__scrollbar-sample">
          <div class="building-block-preview-tile__scrollbar-track ds-mini-scrollbar">
            <div class="building-block-preview-tile__scrollbar-content" />
          </div>
        </div>
      </template>

      <template v-else-if="blockKey === 'shell-open-dialog-button'">
        <ShellOpenDialogButton kind="record" />
      </template>

      <template v-else-if="blockKey === 'record-hero'">
        <RecordHero
          :feed-tab="activeRecordFeedTabPreview"
          :feed-tabs="recordFeedTabOptions"
          :feed-groups="recordFeedGroupOptions"
          :feed-items="recordFeedItems"
        />
      </template>

      <template v-else-if="blockKey === 'hero-surface'">
        <HeroSurface />
      </template>

      <template v-else-if="blockKey === 'hero-3col-overlay'">
        <HeroSurface>
          <Hero3ColOverlay />
        </HeroSurface>
      </template>

      <template v-else-if="blockKey === 'hero-2col-overlay'">
        <HeroSurface>
          <Hero2ColOverlay />
        </HeroSurface>
      </template>

      <template v-else-if="blockKey === 'file-hero'">
        <FileHero
          text="Track the live operating picture for this file and move through core workflows from one surface."
          :stats="fileHeroPreviewStats"
          health-text="Checked 18 rows against 18 executable registry entries. Errors: 0. Warnings: 14. Info: 0."
          :health-segments="fileHeroPreviewSegments"
          action-label="File Health"
          action-title="Reference Documents"
          :action-items="fileHeroPreviewActionItems"
        />
      </template>

      <template v-else-if="blockKey === 'l2-toolbar'">
        <ShellSectionToolbar
          model-value="general"
          :items="l2ToolbarItems"
          view-mode="card"
          :view-options="viewOptions"
          :show-view-toggle="true"
        />
      </template>

      <template v-else-if="blockKey === 'fork-selector-surface'">
        <ForkSelectorSurface
          v-model="activeLiveActionL1"
          :options="liveActionOptions"
        />
      </template>

      <template v-else-if="blockKey === 'fork-branch-card'">
        <div class="building-block-preview-tile__fork-branch-card">
          <ForkBranchCard label="Fund" />
        </div>
      </template>

      <template v-else-if="blockKey === 'record-field-label'">
        <RecordFieldLabel label="Industry" />
      </template>

      <template v-else-if="blockKey === 'record-field-description'">
        <RecordFieldDescription description="General" />
      </template>

      <template v-else-if="blockKey === 'record-field-value'">
        <RecordFieldValue value="Enterprise SaaS" />
      </template>

      <template v-else-if="blockKey === 'record-fields-box'">
        <RecordFieldsBox>
          <div class="building-block-preview-tile__record-fields-box-sample">
            <div class="building-block-preview-tile__record-fields-box-cell">
              <RecordHeroFieldCard
                label="Industry"
                description="General"
                value="Enterprise SaaS"
                status-icon="task_alt"
              />
            </div>
            <div class="building-block-preview-tile__record-fields-box-cell">
              <RecordHeroFieldCard
                label="Stage"
                description="Pipeline"
                value="Series A"
                status-icon="auto_awesome"
              />
            </div>
          </div>
        </RecordFieldsBox>
      </template>

      <template v-else-if="blockKey === 'record-summary-box'">
        <RecordSummaryBox>
          <RecordHeroFieldCard
            label="Summary"
            description="General"
            value="High-conviction company with strong operator references."
            status-icon="task_alt"
            :summary="true"
          />
        </RecordSummaryBox>
      </template>

      <template v-else-if="blockKey === 'record-hero-field-card'">
        <RecordHeroFieldCard
          label="Industry"
          description="General"
          value="Enterprise SaaS"
          status-icon="task_alt"
        />
      </template>

      <template v-else-if="blockKey === 'record-field-status-icon'">
        <div class="building-block-preview-tile__button-row">
          <RecordFieldStatusIcon state="verified" />
          <RecordFieldStatusIcon state="default_preselected_unverified" />
          <RecordFieldStatusIcon state="suggested_unverified" />
          <RecordFieldStatusIcon state="rejected" />
        </div>
      </template>

      <template v-else-if="blockKey === 'record-context-panel'">
        <RecordContextPanel
          v-model="activeRecordContextTab"
          :notes="recordContextNotes"
          :documents="recordContextDocuments"
          singular-label="record"
          aria-label="Record context"
        />
      </template>

      <template v-else-if="blockKey === 'record-feed-panel'">
        <RecordFeedPanel
          v-model="activeRecordFeedTabPreview"
          :tabs="recordFeedTabOptions"
          :groups="recordFeedGroupOptions"
          :items="recordFeedItems"
          empty-message="No feed items yet for this record."
        />
      </template>

      <template v-else-if="blockKey === 'record-feed-label'">
        <RecordFeedLabel label="Record Feed" />
      </template>

      <template v-else-if="blockKey === 'record-feed-time'">
        <RecordFeedTime label="Most Recent" />
      </template>

      <template v-else-if="blockKey === 'record-feed-entry-title'">
        <RecordFeedEntryTitle title="Updated founder note after diligence call" />
      </template>

      <template v-else-if="blockKey === 'record-feed-empty'">
        <RecordFeedEmpty message="No feed items yet for this record." />
      </template>

      <template v-else-if="blockKey === 'record-feed-entry-surface'">
        <RecordFeedEntrySurface>
          <div class="building-block-preview-tile__record-feed-surface-sample">
            <RecordFeedTime label="Most Recent" />
            <RecordFeedEntryTitle title="Updated founder note after diligence call" />
          </div>
        </RecordFeedEntrySurface>
      </template>

      <template v-else-if="blockKey === 'record-feed-tab-label'">
        <RecordFeedTabLabel label="Activity" />
      </template>

      <template v-else-if="blockKey === 'collapsible-section-shell'">
        <CollapsibleSectionShell title="Resources" :collapsed="false">
          <div class="building-block-preview-tile__placeholder">
            <div class="building-block-preview-tile__placeholder-title">Section Body</div>
          </div>
        </CollapsibleSectionShell>
      </template>

      <template v-else-if="blockKey === 'drop-zone'">
        <DropZone caption="Drag files or a folder here" />
      </template>

      <template v-else-if="blockKey === 'artifact-row'">
        <ArtifactRow selected icon="description" name="PitchDeck.pdf" size="240 KB" />
      </template>

      <template v-else-if="blockKey === 'processing-box'">
        <ProcessingBox title="Intake" meta="3 loading">
          <div class="building-block-preview-tile__record-feed-surface-sample building-block-preview-tile__processing-box-sample">
            <span>Artifact A.pdf</span>
            <span>Artifact B.docx</span>
          </div>
        </ProcessingBox>
      </template>

      <template v-else-if="blockKey === 'section-tabs'">
        <SectionTabs
          model-value="company-overview"
          :left-tabs="sectionTabsLeftSample"
          :right-tabs="sectionTabsRightSample"
        />
      </template>

      <template v-else-if="blockKey === 'shell-selector'">
        <ShellSelector model-value="record" :options="shellSelectorSampleOptions" />
      </template>

      <template v-else-if="blockKey === 'field-map-row'">
        <FieldMapRow label="Industry" type-hint="Text">
          <template #input>
            <div class="building-block-preview-tile__processing-box-sample">
              Enterprise SaaS
            </div>
          </template>
          <template #action>
            <RecordFieldStatusIcon state="verified" />
          </template>
        </FieldMapRow>
      </template>

      <template v-else-if="blockKey === 'entry-input-list-box'">
        <EntryInputListBox
          input-value="https://example.com"
          :entries="entryInputListSampleEntries"
          :selected-ids="entryInputListSampleSelected"
          :expanded-ids="entryInputListSampleExpanded"
        />
      </template>

      <template v-else-if="blockKey === 'editable-grid-table'">
        <EditableGridTable
          :columns="editableGridSampleColumns"
          :rows="editableGridSampleRows"
          :can-edit="true"
        />
      </template>

      <template v-else-if="blockKey === 'bb-selection-frame'">
        <BbSelectionFrame>
          <div class="building-block-preview-tile__bb-selection-frame-sample">
            <div class="building-block-preview-tile__bb-code">bb:file-hero</div>
            <div class="building-block-preview-tile__bb-code">bb:record-hero</div>
            <div class="building-block-preview-tile__bb-code">bb:record-feed-panel</div>
            <div class="building-block-preview-tile__bb-code">bb:section-tabs</div>
          </div>
        </BbSelectionFrame>
      </template>

      <template v-else-if="blockKey === 'bb-render-frame'">
        <BbRenderFrame>
          <div class="building-block-preview-tile__bb-render-frame-sample">
            <RecordTitle title="Record Title" />
          </div>
        </BbRenderFrame>
      </template>

      <template v-else-if="blockKey === 'file-filter-menu'">
        <FileFilterMenu
          title="File Filter"
          :sections="fileFilterMenuSampleSections"
          expanded-section-key="general"
        />
      </template>

      <template v-else>
        <div class="building-block-preview-tile__placeholder">
          <div class="building-block-preview-tile__placeholder-title">Preview<br>Pending</div>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AddEditBbShellHeaderFrame from 'src/components/AddEditBbShellHeaderFrame.vue'
import AddEditBbShellWindow from 'src/components/AddEditBbShellWindow.vue'
import FileHero from 'src/components/FileHero.vue'
import Hero2ColOverlay from 'src/components/Hero2ColOverlay.vue'
import HomeDashboardHero from 'src/components/HomeDashboardHero.vue'
import RecordHero from 'src/components/RecordHero.vue'
import Hero3ColOverlay from 'src/components/Hero3ColOverlay.vue'
import HeroSurface from 'src/components/HeroSurface.vue'
import FilePageToolbar from 'src/components/FilePageToolbar.vue'
import FilterListIcon from 'src/components/FilterListIcon.vue'
import L3Box from 'src/components/L3Box.vue'
import PlusIconChip from 'src/components/PlusIconChip.vue'
import PlusWithLabelButton from 'src/components/PlusWithLabelButton.vue'
import SearchBarInput from 'src/components/SearchBarInput.vue'
import BbCodeInput from 'src/components/BbCodeInput.vue'
import FileFilterMenu from 'src/components/FileFilterMenu.vue'
import SettingsCheckbox from 'src/components/SettingsCheckbox.vue'
import ShellOpenDialogButton from 'src/components/ShellOpenDialogButton.vue'
import ShellSectionToolbar from 'src/components/ShellSectionToolbar.vue'
import BuildingBlockTileHeader from 'src/components/BuildingBlockTileHeader.vue'
import ForkSelectorSurface from 'src/components/ForkSelectorSurface.vue'
import ForkBranchCard from 'src/components/ForkBranchCard.vue'
import FileShellTitleRow from 'src/components/FileShellTitleRow.vue'
import L2SettingsMenu from 'src/components/L2SettingsMenu.vue'
import DialogShellFrame from 'src/components/DialogShellFrame.vue'
import DialogShellTitleRow from 'src/components/DialogShellTitleRow.vue'
import PageTitleText from 'src/components/PageTitleText.vue'
import RecordTitle from 'src/components/RecordTitle.vue'
import PageBackLabel from 'src/components/PageBackLabel.vue'
import ButtonLabel from 'src/components/ButtonLabel.vue'
import B10Logo from 'src/components/B10Logo.vue'
import PageBackSymbol from 'src/components/PageBackSymbol.vue'
import RecordContextPanel from 'src/components/RecordContextPanel.vue'
import RecordFeedEmpty from 'src/components/RecordFeedEmpty.vue'
import RecordFeedEntrySurface from 'src/components/RecordFeedEntrySurface.vue'
import RecordFeedEntryTitle from 'src/components/RecordFeedEntryTitle.vue'
import RecordFeedLabel from 'src/components/RecordFeedLabel.vue'
import RecordFeedPanel from 'src/components/RecordFeedPanel.vue'
import RecordFeedTabLabel from 'src/components/RecordFeedTabLabel.vue'
import RecordFeedTime from 'src/components/RecordFeedTime.vue'
import CollapsibleSectionShell from 'src/components/CollapsibleSectionShell.vue'
import DropZone from 'src/components/DropZone.vue'
import ArtifactRow from 'src/components/ArtifactRow.vue'
import ProcessingBox from 'src/components/ProcessingBox.vue'
import SectionTabs from 'src/components/SectionTabs.vue'
import ShellSelector from 'src/components/ShellSelector.vue'
import FieldMapRow from 'src/components/FieldMapRow.vue'
import EntryInputListBox from 'src/components/EntryInputListBox.vue'
import EditableGridTable from 'src/components/EditableGridTable.vue'
import BbRenderFrame from 'src/components/BbRenderFrame.vue'
import BbSelectionFrame from 'src/components/BbSelectionFrame.vue'
import RecordHeroFieldCard from 'src/components/RecordHeroFieldCard.vue'
import RecordFieldDescription from 'src/components/RecordFieldDescription.vue'
import RecordFieldLabel from 'src/components/RecordFieldLabel.vue'
import RecordFieldStatusIcon from 'src/components/RecordFieldStatusIcon.vue'
import RecordFieldValue from 'src/components/RecordFieldValue.vue'
import RecordFieldsBox from 'src/components/RecordFieldsBox.vue'
import RecordSummaryBox from 'src/components/RecordSummaryBox.vue'
import WestIcon from 'src/components/WestIcon.vue'
import B10Button from 'src/components/buttons/B10Button.vue'
import B10IconButton from 'src/components/buttons/B10IconButton.vue'
import EyeIconButton from 'src/components/buttons/EyeIconButton.vue'
import EditButton from 'src/components/EditButton.vue'
import DropdownChevron from 'src/components/DropdownChevron.vue'
import { RECORD_FEED_GROUP_OPTIONS, RECORD_FEED_TAB_ORDER } from 'src/utils/recordFeedContract'
import LiveActionL1 from 'src/components/LiveActionL1.vue'
import MainMenuIconButton from 'src/components/buttons/MainMenuIconButton.vue'
import MainMenuRowIcon from 'src/components/MainMenuRowIcon.vue'
import MainMenuRowLabel from 'src/components/MainMenuRowLabel.vue'
import MainMenuRow from 'src/components/MainMenuRow.vue'
import MainMenuSubgroupRow from 'src/components/MainMenuSubgroupRow.vue'
import ViewModeToggle from 'src/components/ViewModeToggle.vue'
import ToggleRowIcons from 'src/components/ToggleRowIcons.vue'
import ValueChip from 'src/components/ValueChip.vue'
import ValueChipLabel from 'src/components/ValueChipLabel.vue'
import ValueChipSurface from 'src/components/ValueChipSurface.vue'
import WidgetSettingsMenu from 'src/components/WidgetSettingsMenu.vue'
import DialogShellFooter from 'src/components/DialogShellFooter.vue'
const l2SettingsSampleGroups = [
  {
    key: 'general',
    label: 'General',
    expanded: true,
    items: [
      { key: 'name', label: 'Name', checked: true },
      { key: 'summary', label: 'Summary', checked: true },
    ],
  },
  {
    key: 'system',
    label: 'System',
    expanded: true,
    items: [
      { key: 'record-id', label: 'Record ID', checked: false },
      { key: 'updated-at', label: 'Updated At', checked: true },
    ],
  },
]

const widgetSettingsSampleSections = [
  {
    id: 'files',
    label: 'Files',
    actions: [
      { id: 'companies', label: 'Companies', enabled: true, orderIndex: 0 },
      { id: 'users', label: 'Users', enabled: true, orderIndex: 1 },
    ],
  },
]

const widgetSettingsOpenSectionIds = ['files']

const fileHeroPreviewStats = [
  { label: 'Rows', value: '18', caption: 'Registry rows loaded', tone: 'neutral' },
  { label: 'Drift', value: '14', caption: 'Current validator issues', tone: 'rich' },
]

const fileHeroPreviewSegments = [
  { tone: 'sparse', width: 77.78 },
  { tone: 'rich', width: 22.22 },
]

const fileHeroPreviewActionItems = [
  { id: 'system-files-guide', label: 'System Files Guide', caption: 'docs/100/Active/100-System_Files.md' },
  { id: 'file-steward', label: 'File Steward', caption: 'docs/020/Active/020_File_Steward.md' },
  { id: 'open-issues', label: 'Open Issues', caption: 'docs/100/Active/100-System_Files_Open_Issues.md' },
]
const dialogFooterLegendItems = [
  { label: 'Pre-Selected', tone: 'default' },
  { label: 'Suggested', tone: 'suggested' },
]
import { BUILDING_BLOCK_DETAILS_BY_ID, getBuildingBlockGraphCounts } from 'src/utils/buildingBlocks'

import {
  GENERAL_SETTINGS_BORDER_SAMPLES,
  GENERAL_SETTINGS_COLOR_SWATCHES,
  GENERAL_SETTINGS_FONT_SAMPLES,
  GENERAL_SETTINGS_FONT_WEIGHT_SAMPLES,
  GENERAL_SETTINGS_FORMATTING_SAMPLES,
  GENERAL_SETTINGS_ICON_SIZE_SAMPLES,
  GENERAL_SETTINGS_MOTION_SAMPLES,
  GENERAL_SETTINGS_RADIUS_SAMPLES,
  GENERAL_SETTINGS_SHADOW_SAMPLES,
  GENERAL_SETTINGS_SPACING_SAMPLES,
  GENERAL_SETTINGS_SURFACE_SAMPLES,
  GENERAL_SETTINGS_TYPE_SCALE_SAMPLES,
} from 'src/utils/generalSettingsCatalog'

const props = defineProps({
  blockKey: { type: String, required: true },
  title: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  collapseState: { type: String, default: '' },
  collapseVersion: { type: Number, default: 0 },
})

const detail = computed(() => BUILDING_BLOCK_DETAILS_BY_ID[props.blockKey] || null)
const tileRef = ref(null)
const tileResizeObserver = ref(null)
const isCollapsed = ref(false)
const tileTitle = computed(() => props.title || detail.value?.title || 'Building Block')
const tileGraphCounts = computed(() => getBuildingBlockGraphCounts(props.blockKey))
const tileGraphLabel = computed(() => `[${tileGraphCounts.value.parentCount}/${tileGraphCounts.value.childCount}]`)
const tileShellsLabel = computed(() => `Shells: ${(detail.value?.usedInShells || []).length}`)
const tileStatusLabel = computed(() => props.statusLabel || detail.value?.statusLabel || 'Extract Next')
const isIntrinsicFullRow = computed(() =>
  ['home-dashboard', 'file-hero', 'hero-2col-overlay', 'hero-3col-overlay', 'hero-surface', 'record-hero'].includes(props.blockKey),
)
const statusClass = computed(() =>
  (detail.value?.status || '').trim() === 'canonical'
    ? 'building-block-preview-tile__status--canonical'
    : (detail.value?.status || '').trim() === 'deprecated'
      ? 'building-block-preview-tile__status--deprecated'
      : 'building-block-preview-tile__status--extract',
)
const stageClass = computed(() =>
  ['fonts', 'type-scale', 'colors', 'surfaces', 'spacing', 'formatting-rules', 'motion-rules', 'home-dashboard', 'file-toolbar', 'l2-toolbar'].includes(props.blockKey)
    ? 'building-block-preview-tile__stage--stretch'
    : props.blockKey === 'page-title'
      ? 'building-block-preview-tile__stage--left'
      : 'building-block-preview-tile__stage--row',
)

const viewOptions = [
  { label: '', value: 'card', icon: 'grid_view' },
  { label: '', value: 'table', icon: 'table_rows' },
]
const viewModeToggleOptions = viewOptions

const activeLiveActionL1 = ref('companies')
const activeRecordContextTab = ref('notes')
const activeRecordFeedTabPreview = ref('events')
const fileFilterMenuSampleSections = [
  {
    key: 'general',
    label: 'General',
    count: 3,
    items: [
      { key: 'name', label: 'Name', selected: true },
      { key: 'owner', label: 'Owner', selected: false },
      { key: 'type', label: 'Type', selected: false },
    ],
  },
  {
    key: 'system',
    label: 'System',
    count: 2,
    items: [
      { key: 'status', label: 'Status', selected: false },
      { key: 'updated-at', label: 'Updated At', selected: false },
    ],
  },
]

const sectionTabsLeftSample = [
  { key: 'company-overview', label: 'Company Overview' },
  { key: 'product', label: 'Product' },
]

const sectionTabsRightSample = [
  { key: 'operations', label: 'Operations' },
  { key: 'finance', label: 'Finance' },
]

const shellSelectorSampleOptions = [
  { label: 'Record', value: 'record' },
  { label: 'File', value: 'file' },
]

const entryInputListSampleEntries = [
  { id: 'url-1', value: 'https://alpha.example.com' },
  { id: 'url-2', value: 'Founder meeting notes aligned with current sourcing thread.' },
]

const entryInputListSampleSelected = ['url-1']
const entryInputListSampleExpanded = ['url-2']

const editableGridSampleColumns = [
  { id: 'owner', label: 'Owner', isEditing: false, deletable: true },
  { id: 'summary', label: 'Summary', isEditing: false, deletable: true },
]

const editableGridSampleRows = [
  { key: 'company-overview', label: 'Company Overview', isEditing: false, deletable: true },
  { key: 'funding', label: 'Funding', isEditing: false, deletable: true },
]
const liveActionOptions = [
  { label: 'Companies', value: 'companies' },
  { label: 'Projects', value: 'projects' },
  { label: 'Funds', value: 'funds' },
]

const homeDashboardStats = [
  { label: 'Open tasks', value: '27' },
  { label: 'Recent adds (7d)', value: '41' },
  { label: 'Projects active', value: '12/16' },
]

const homeDashboardSignals = [
  { label: 'Companies', value: '412' },
  { label: 'Tasks', value: '183' },
  { label: 'Opportunities', value: '74' },
]

const recordContextItems = [
  { title: 'Partner intro captured', meta: 'Today', content: 'Founder meeting notes aligned with the current sourcing thread.' },
  { title: 'Deck reviewed', meta: 'Yesterday', content: 'Artifacts linked and first-pass summary completed.' },
]

const recordContextNotes = recordContextItems.map((item, index) => ({
  id: `note:${index}`,
  title: item.title,
  created_at: item.meta,
  content: item.content,
}))

const recordContextDocuments = [
  {
    id: 'document:summary',
    title: 'Summary',
    meta: 'Pinned field',
    content: 'Artifacts linked and first-pass summary completed.',
  },
]

const recordFeedTabOptions = RECORD_FEED_TAB_ORDER

const recordFeedGroupOptions = RECORD_FEED_GROUP_OPTIONS

const recordFeedItems = [
  { id: 'feed-1', feedKey: 'events', groupKey: 'lifecycle', title: 'Record created', meta: '09:42', hasLogPage: true },
  { id: 'feed-2', feedKey: 'notes', groupKey: 'actions', title: 'Partner note attached', meta: '09:46', hasLogPage: true },
  { id: 'feed-3', feedKey: 'artifacts', groupKey: 'actions', title: 'Pitch deck linked', meta: '09:48', hasLogPage: true },
  { id: 'feed-4', feedKey: 'intake', groupKey: 'actions', title: 'Intake suggestion queued', meta: '09:50', hasLogPage: true },
  { id: 'feed-5', feedKey: 'events', groupKey: 'actions', title: 'Companion suggestion queued', meta: '09:52', hasLogPage: true },
  { id: 'feed-6', feedKey: 'events', groupKey: 'lifecycle', title: 'Summary updated', meta: 'Yesterday', hasLogPage: true },
]


const l2ToolbarItems = [
  { value: 'general', title: 'General', isKdb: false, isSystem: false, pushRight: false },
  { value: 'resources', title: 'Resources', isKdb: false, isSystem: false, pushRight: false },
  { value: 'record-data', title: 'Record Data', isKdb: false, isSystem: false, pushRight: false },
  { value: 'kdb', title: 'KDB', isKdb: true, isSystem: false, pushRight: true },
  { value: 'system', title: 'System', isKdb: false, isSystem: true, pushRight: false },
]

const foundationFontSamples = GENERAL_SETTINGS_FONT_SAMPLES
const foundationTypeScaleSamples = GENERAL_SETTINGS_TYPE_SCALE_SAMPLES
const foundationFontWeightSamples = GENERAL_SETTINGS_FONT_WEIGHT_SAMPLES
const foundationColorSwatches = GENERAL_SETTINGS_COLOR_SWATCHES
const foundationSurfaceSamples = GENERAL_SETTINGS_SURFACE_SAMPLES
const foundationBorderSamples = GENERAL_SETTINGS_BORDER_SAMPLES
const foundationRadiusSamples = GENERAL_SETTINGS_RADIUS_SAMPLES
const foundationShadowSamples = GENERAL_SETTINGS_SHADOW_SAMPLES
const foundationSpacingSamples = GENERAL_SETTINGS_SPACING_SAMPLES
const foundationIconSizeSamples = GENERAL_SETTINGS_ICON_SIZE_SAMPLES
const foundationFormattingSamples = GENERAL_SETTINGS_FORMATTING_SAMPLES
const foundationMotionSamples = GENERAL_SETTINGS_MOTION_SAMPLES

const addLabel = computed(() => (props.blockKey === 'plus-with-label' ? 'Add Record' : 'Add'))

function installTileResizeObserver() {
  if (typeof ResizeObserver === 'undefined' || !tileRef.value) return
  tileResizeObserver.value?.disconnect?.()
  tileResizeObserver.value = new ResizeObserver(() => {})
  tileResizeObserver.value.observe(tileRef.value)
}

watch(
  () => props.collapseVersion,
  () => {
    if (props.collapseState === 'collapsed') isCollapsed.value = true
    if (props.collapseState === 'expanded') isCollapsed.value = false
  },
)

onMounted(() => {
  nextTick(() => {
    installTileResizeObserver()
  })
})

onBeforeUnmount(() => {
  tileResizeObserver.value?.disconnect?.()
})
</script>

<style scoped>
.building-block-preview-tile {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  width: max-content;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: var(--ds-radius-mini);
  background: rgba(255, 255, 255, 0.94);
}

.building-block-preview-tile--intrinsic-full-row {
  display: flex;
  width: 100%;
}

.building-block-preview-tile--collapsed {
  gap: 8px;
}

.building-block-preview-tile__status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.building-block-preview-tile__status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.18);
}

.building-block-preview-tile__status--deprecated {
  color: #111111;
  background: color-mix(in srgb, var(--ds-color-brand-light-grey) 82%, white);
  border-color: rgba(15, 23, 42, 0.18);
}

.building-block-preview-tile__title {
  color: #0f172a;
  font-family: var(--ds-font-title);
  font-size: 1.38rem;
  font-weight: var(--ds-font-weight-bold);
  line-height: 0.94;
  letter-spacing: -0.04em;
  max-width: calc(100% - 56px);
}

.building-block-preview-tile__title--placeholder {
  color: rgba(15, 23, 42, 0.45);
}

.building-block-preview-tile__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

.building-block-preview-tile--intrinsic-full-row .building-block-preview-tile__stage {
  width: 100%;
}

.building-block-preview-tile__stage--left {
  justify-content: center;
  width: 100%;
}

.building-block-preview-tile__stage--row {
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.building-block-preview-tile__stage--stretch {
  align-items: stretch;
  justify-content: stretch;
}

.building-block-preview-tile__stage--stretch {
  width: 100%;
}

.building-block-preview-tile :deep(.home-dashboard-hero),
.building-block-preview-tile :deep(.file-page-hero-dashboard),
.building-block-preview-tile :deep(.file-page-toolbar),
.building-block-preview-tile :deep(.shell-section-toolbar) {
  width: 100%;
  max-width: none;
}

.building-block-preview-tile__plus-icon-compare {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.building-block-preview-tile__toggle-row-icons {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-12);
  flex-wrap: wrap;
  justify-content: center;
}

.building-block-preview-tile__button-row {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-8);
  flex-wrap: wrap;
  justify-content: center;
}


.building-block-preview-tile__header-preview {
  display: flex;
  width: 100%;
  padding: var(--ds-space-12);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-base);
}

.building-block-preview-tile__dialog-frame {
  width: min(100%, 420px);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-base);
}

.building-block-preview-tile__dialog-frame-body {
  min-height: 120px;
  border-radius: var(--ds-radius-mini);
  background: color-mix(in srgb, var(--ds-color-brand-light-grey) 58%, white);
}

.building-block-preview-tile__shell-title-row-context {
  width: 100%;
  padding: var(--ds-space-16);
  border-radius: var(--ds-radius-mini);
  background: var(--ds-color-brand-black);
}

.building-block-preview-tile__comparison-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
  width: 100%;
}

.building-block-preview-tile__comparison-panel {
  display: grid;
  gap: var(--ds-space-8);
  justify-items: center;
  padding: var(--ds-space-12);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-mini);
  background: var(--ds-color-surface-subtle);
}

.building-block-preview-tile__comparison-panel--dark {
  color: var(--ds-color-brand-white);
  border-color: transparent;
  border-radius: var(--ds-radius-mini);
  background: var(--ds-color-brand-black);
}

.building-block-preview-tile__comparison-label {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
}

.building-block-preview-tile__comparison-panel--dark .building-block-preview-tile__comparison-label {
  color: color-mix(in srgb, var(--ds-color-brand-white) 72%, transparent);
}

.building-block-preview-tile__chevron-row {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-12);
  flex-wrap: wrap;
  justify-content: center;
}

.building-block-preview-tile__chevron-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: var(--ds-space-12);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface-subtle);
}

.building-block-preview-tile__chevron-swatch--dark {
  color: var(--ds-color-brand-white);
  border-color: transparent;
  background: var(--ds-color-brand-black);
}

.building-block-preview-tile__drawer-row-context {
  display: flex;
  align-items: center;
  width: min(240px, 100%);
  min-height: 28px;
  padding: 0 8px;
  background: var(--ds-color-brand-black);
}

.building-block-preview-tile__scrollbar-sample {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(140px, 100%);
  height: 100%;
}

.building-block-preview-tile__scrollbar-track {
  width: 10px;
  height: 88px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.building-block-preview-tile__scrollbar-content {
  width: 1px;
  height: 240px;
}

.building-block-preview-tile__foundation-stack {
  display: grid;
  gap: 10px;
  width: 100%;
}

.building-block-preview-tile__foundation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
}

.building-block-preview-tile__foundation-panel,
.building-block-preview-tile__foundation-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  min-width: 0;
}

.building-block-preview-tile__foundation-meta {
  color: rgba(17, 17, 17, 0.58);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.building-block-preview-tile__foundation-token {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
  word-break: break-word;
}

.building-block-preview-tile__foundation-font-sample {
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base-regular);
  line-height: var(--ds-line-height-base);
}

.building-block-preview-tile__foundation-type-row,
.building-block-preview-tile__foundation-spacing-row {
  display: grid;
  grid-template-columns: minmax(132px, 160px) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
}

.building-block-preview-tile__foundation-type-meta {
  display: grid;
  gap: 4px;
}

.building-block-preview-tile__foundation-type-sample {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: -0.03em;
  line-height: 1;
}

.building-block-preview-tile__foundation-weight-sample {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.building-block-preview-tile__foundation-swatch,
.building-block-preview-tile__foundation-surface,
.building-block-preview-tile__foundation-border-sample,
.building-block-preview-tile__foundation-radius-sample,
.building-block-preview-tile__foundation-shadow-sample {
  width: 100%;
  min-height: 56px;
  border-radius: 12px;
}

.building-block-preview-tile__foundation-swatch {
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__foundation-surface {
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__foundation-border-sample,
.building-block-preview-tile__foundation-radius-sample,
.building-block-preview-tile__foundation-shadow-sample {
  background: rgba(248, 250, 252, 0.84);
}

.building-block-preview-tile__foundation-radius-sample {
  background: var(--ds-color-brand-dark-grey);
}

.building-block-preview-tile__foundation-spacing-track {
  display: flex;
  align-items: center;
  min-height: 14px;
  width: 100%;
}

.building-block-preview-tile__foundation-spacing-bar {
  height: 10px;
  border-radius: 999px;
  background: var(--ds-color-brand-blue);
}

.building-block-preview-tile__foundation-icon-sample {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: var(--ds-color-brand-blue);
  border-radius: 999px;
}

.building-block-preview-tile__foundation-format-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-title);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-bold);
  letter-spacing: -0.03em;
  line-height: 1;
}

.building-block-preview-tile__foundation-motion-sample {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(38, 71, 255, 0.18), rgba(17, 17, 17, 0.08)),
    var(--ds-color-surface-subtle);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.building-block-preview-tile__fork-branch-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  min-height: 86px;
  padding: 12px 16px;
  color: #111;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.building-block-preview-tile__fork-branch-title {
  font-family: var(--ds-font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
}

.building-block-preview-tile__record-field-card,
.building-block-preview-tile__record-panel,
.building-block-preview-tile__filter-menu {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
}

.building-block-preview-tile__record-field-card {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.building-block-preview-tile__record-field-top,
.building-block-preview-tile__record-field-bottom,
.building-block-preview-tile__record-panel-row,
.building-block-preview-tile__filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.building-block-preview-tile__record-field-label,
.building-block-preview-tile__record-feed-header,
.building-block-preview-tile__filter-menu-title {
  color: rgba(15, 23, 42, 0.72);
  font-family: var(--ds-font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.building-block-preview-tile__record-field-description,
.building-block-preview-tile__record-panel-meta,
.building-block-preview-tile__filter-count {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--ds-font-body);
  font-size: 0.76rem;
}

.building-block-preview-tile__record-field-value,
.building-block-preview-tile__record-panel-title {
  color: #0f172a;
  font-family: var(--ds-font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  letter-spacing: -0.02em;
}

.building-block-preview-tile__record-field-status,
.building-block-preview-tile__record-feed-icon {
  color: #2647ff;
}

.building-block-preview-tile__record-panel,
.building-block-preview-tile__filter-menu {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.building-block-preview-tile__record-panel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.building-block-preview-tile__record-panel-tab {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  color: rgba(15, 23, 42, 0.68);
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  font-family: var(--ds-font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
}

.building-block-preview-tile__record-panel-tab--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.building-block-preview-tile__record-panel-list,
.building-block-preview-tile__filter-rows {
  display: grid;
  gap: 8px;
}

.building-block-preview-tile__record-panel-item {
  display: grid;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.building-block-preview-tile__record-panel-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.building-block-preview-tile__record-panel-content {
  color: rgba(15, 23, 42, 0.72);
  font-family: var(--ds-font-body);
  font-size: 0.8rem;
  line-height: 1.45;
}

.building-block-preview-tile__filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-family: var(--ds-font-body);
  font-size: 0.82rem;
}

.building-block-preview-tile__placeholder {
  display: grid;
  align-content: center;
  justify-items: center;
  width: 100%;
  text-align: center;
}

.building-block-preview-tile__placeholder-title {
  color: #111111;
  font-family: var(--ds-font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.building-block-preview-tile__record-feed-surface-sample {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.building-block-preview-tile__processing-box-sample {
  font-size: var(--ds-font-size-xs);
}


.building-block-preview-tile__record-fields-box-sample {
  display: inline-grid;
  grid-template-columns: repeat(2, max-content);
  gap: 15px;
  width: auto;
  justify-content: start;
}

.building-block-preview-tile__record-fields-box-cell {
  display: flex;
  min-width: auto;
}

.building-block-preview-tile__bb-selection-frame-sample {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, max-content));
  gap: 10px 12px;
  align-items: start;
}

.building-block-preview-tile__bb-render-frame-sample {
  width: 100%;
}

</style>
